import 'dart:convert';

import 'package:background_downloader/background_downloader.dart';

import '../api/client.dart';

/// Task group of album sync uploads.
const backupGroup = 'wanmory-backup';

/// Directory (under Application Support) holding the copies of photos waiting to upload.
const backupDir = 'backup';

/// Encodes tus Upload-Metadata: `key base64(value),...`.
String tusMetadata(Map<String, String> m) =>
    m.entries.map((e) => '${e.key} ${base64.encode(utf8.encode(e.value))}').join(',');

/// What album sync needs to remember about a queued upload; stored in the task's metaData.
class QueuedAsset {
  QueuedAsset({required this.asset, required this.name, required this.bytes, required this.video});

  factory QueuedAsset.fromJson(String s) {
    final j = jsonDecode(s) as Map<String, dynamic>;
    return QueuedAsset(
      asset: j['asset'] as String,
      name: j['name'] as String,
      bytes: j['bytes'] as int,
      video: j['video'] as bool,
    );
  }

  /// The phone's photo ID.
  final String asset;

  /// Original file name, shown while uploading.
  final String name;
  final int bytes;
  final bool video;

  /// 0–1, from progress updates.
  double progress = 0;

  String toJson() => jsonEncode({'asset': asset, 'name': name, 'bytes': bytes, 'video': video});
}

/// One photo as a system background upload: a single tus "creation with upload" POST that
/// carries the whole file, so iOS (background URLSession) and Android (WorkManager) can send
/// it while the app is suspended. The server answers 201 with Wanmory-Asset-Id once stored.
UploadTask backupTask({
  required ApiClient api,
  required QueuedAsset info,
  required String fileName,
  required DateTime taken,
  required bool wifiOnly,
}) => UploadTask(
  taskId: 'backup:${info.asset}',
  url: '${api.baseUrl}/api/uploads/',
  baseDirectory: BaseDirectory.applicationSupport,
  directory: backupDir,
  filename: fileName,
  httpRequestMethod: 'POST',
  post: 'binary',
  // tus wants the body as application/offset+octet-stream; the file type goes in the metadata.
  mimeType: 'application/offset+octet-stream',
  headers: {
    ...api.authHeaders,
    'Tus-Resumable': '1.0.0',
    'Upload-Length': '${info.bytes}',
    'Upload-Metadata': tusMetadata({
      'filename': info.name,
      'lastModified': '${taken.millisecondsSinceEpoch}',
    }),
    'Content-Disposition': '',
  },
  group: backupGroup,
  updates: Updates.statusAndProgress,
  requiresWiFi: wifiOnly,
  retries: 3,
  // Android 14+: a user-initiated transfer, without the 9-minute background limit.
  priority: 0,
  metaData: info.toJson(),
);

enum Outcome {
  /// Stored on the server (or the server already had it).
  uploaded,

  /// The server refuses this file (unsupported type, too big): don't try again.
  refused,

  /// Signed out on the server.
  unauthorized,

  /// Network or server trouble: try again later.
  retry,
}

/// The result of an upload the app sent itself ([ApiClient.uploadStream]); status 0 is a
/// network error.
Outcome outcomeOf(int status, Map<String, String> headers) {
  if (status == 401) return Outcome.unauthorized;
  final stored = (headers['wanmory-asset-id'] ?? '').isNotEmpty;
  if (status >= 200 && status < 300 && stored) return Outcome.uploaded;
  if (status == 400 || status == 413 || status == 415) return Outcome.refused;
  return Outcome.retry;
}

/// Reads a finished upload's result.
Outcome outcome(TaskStatusUpdate u) {
  if (u.status == TaskStatus.complete) {
    final code = u.responseStatusCode ?? 201;
    if (code == 401) return Outcome.unauthorized;
    if (code >= 200 && code < 300 && (u.responseHeaders?['wanmory-asset-id'] ?? '').isNotEmpty) {
      return Outcome.uploaded;
    }
    return code >= 400 && code < 500 ? Outcome.refused : Outcome.retry;
  }
  final e = u.exception;
  final code = e is TaskHttpException ? e.httpResponseCode : (u.responseStatusCode ?? 0);
  if (code == 401) return Outcome.unauthorized;
  if (code == 400 || code == 413 || code == 415) return Outcome.refused;
  return Outcome.retry;
}

/// Files bigger than this upload in pieces of this size (see [ChunkedUpload]). A single request
/// for a 17 GB drone video starts over from zero whenever the connection drops, and never gets
/// through; with pieces, a dropped connection costs at most one piece.
const chunkBytes = 256 << 20;

/// A big file sent with resumable tus: the app creates the upload (a POST without a body), then
/// sends it piece by piece as background PATCH uploads, each starting where the server's copy
/// ends. Kept in the settings between pieces, so it survives the app being closed.
class ChunkedUpload {
  ChunkedUpload({
    required this.asset,
    required this.name,
    required this.file,
    required this.bytes,
    required this.video,
    required this.takenMs,
    this.location,
  });

  factory ChunkedUpload.fromJson(Map<String, dynamic> j) => ChunkedUpload(
    asset: j['asset'] as String,
    name: j['name'] as String,
    file: j['file'] as String,
    bytes: j['bytes'] as int,
    video: j['video'] as bool,
    takenMs: j['taken'] as int,
    location: j['location'] as String?,
  );

  /// The phone's photo ID.
  final String asset;
  final String name;

  /// The copy in [backupDir].
  final String file;
  final int bytes;
  final bool video;
  final int takenMs;

  /// The upload's address on the server; null until created (or after it expired).
  String? location;

  /// Bytes the server has; null when unknown (ask with HEAD before the next piece).
  int? offset;

  /// The piece being sent, as 0–1.
  double progress = 0;
  int pieceBytes = 0;

  /// Pieces that failed in a row, and when the last one did (to back off).
  int failures = 0;
  DateTime? failedAt;

  int get sent => (offset ?? 0) + (pieceBytes * progress).round();

  QueuedAsset get info => QueuedAsset(asset: asset, name: name, bytes: bytes, video: video);

  Map<String, dynamic> toJson() => {
    'asset': asset,
    'name': name,
    'file': file,
    'bytes': bytes,
    'video': video,
    'taken': takenMs,
    'location': ?location,
  };
}

/// Task ID prefix of the pieces of chunked uploads.
const chunkTaskPrefix = 'backup-chunk:';

/// The file holding the piece being sent of [c].
String chunkFileName(ChunkedUpload c) => '${c.file}.part';

/// One piece of [c], starting at [offset], as a background PATCH upload.
UploadTask chunkTask({
  required ApiClient api,
  required ChunkedUpload c,
  required int offset,
  required int length,
  required bool wifiOnly,
}) => UploadTask(
  taskId: '$chunkTaskPrefix${c.asset}:$offset',
  url: c.location!,
  baseDirectory: BaseDirectory.applicationSupport,
  directory: backupDir,
  filename: chunkFileName(c),
  httpRequestMethod: 'PATCH',
  post: 'binary',
  mimeType: 'application/offset+octet-stream',
  headers: {
    ...api.authHeaders,
    'Tus-Resumable': '1.0.0',
    'Upload-Offset': '$offset',
    'Content-Disposition': '',
  },
  group: backupGroup,
  updates: Updates.statusAndProgress,
  requiresWiFi: wifiOnly,
  // A retry would resend from the same offset, which the server refuses once part of the piece
  // arrived; album sync asks the server where to go on instead.
  retries: 0,
  priority: 0,
  metaData: jsonEncode({'asset': c.asset, 'offset': offset, 'length': length}),
);

enum ChunkOutcome {
  /// The last piece: the file is stored on the server ([ChunkResult.offset] is its size).
  finished,

  /// The server has the piece; send the next one from [ChunkResult.offset].
  next,

  /// The server refuses the file: don't try again.
  refused,
  unauthorized,

  /// The upload is gone on the server (expired or cleaned up): start a new one.
  gone,

  /// Network trouble, or the offsets didn't match: ask the server where it is and resend.
  retry,
}

typedef ChunkResult = ({ChunkOutcome outcome, int? offset});

/// The result of a piece the app sent itself ([ApiClient.uploadPiece]); status 0 is a network error.
ChunkResult chunkResultOf(int status, Map<String, String> headers) {
  final offset = int.tryParse(headers['upload-offset'] ?? '');
  if (status >= 200 && status < 300 && offset != null) {
    final done = (headers['wanmory-asset-id'] ?? '').isNotEmpty;
    return (outcome: done ? ChunkOutcome.finished : ChunkOutcome.next, offset: offset);
  }
  return (outcome: _chunkFailure(status), offset: null);
}

/// Reads a finished piece's result.
ChunkResult chunkOutcome(TaskStatusUpdate u) {
  final h = u.responseHeaders ?? const {};
  final offset = int.tryParse(h['upload-offset'] ?? '');
  if (u.status == TaskStatus.complete) {
    final code = u.responseStatusCode ?? 204;
    if (code >= 200 && code < 300 && offset != null) {
      final done = (h['wanmory-asset-id'] ?? '').isNotEmpty;
      return (outcome: done ? ChunkOutcome.finished : ChunkOutcome.next, offset: offset);
    }
    return (outcome: _chunkFailure(code), offset: null);
  }
  final e = u.exception;
  final code = e is TaskHttpException ? e.httpResponseCode : (u.responseStatusCode ?? 0);
  return (outcome: _chunkFailure(code), offset: null);
}

ChunkOutcome _chunkFailure(int code) => switch (code) {
  401 => ChunkOutcome.unauthorized,
  404 || 410 => ChunkOutcome.gone,
  400 || 413 || 415 => ChunkOutcome.refused,
  _ => ChunkOutcome.retry,
};
