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
