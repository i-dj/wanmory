import 'dart:convert';

import 'package:background_downloader/background_downloader.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:wanmory/api/client.dart';
import 'package:wanmory/backup/backup.dart';
import 'package:wanmory/backup/upload_task.dart';

void main() {
  final api = ApiClient('http://s', token: 'tok');
  final info = QueuedAsset(asset: 'ABC/L0/001', name: 'IMG_0001.HEIC', bytes: 1234, video: false);

  test('a photo becomes one tus creation-with-upload POST', () {
    final task = backupTask(
      api: api,
      info: info,
      fileName: 'ABC_L0_001.HEIC',
      taken: DateTime.fromMillisecondsSinceEpoch(1700000000000),
      wifiOnly: true,
    );
    expect(task.url, 'http://s/api/uploads/');
    expect(task.httpRequestMethod, 'POST');
    expect(task.post, 'binary');
    expect(task.mimeType, 'application/offset+octet-stream');
    expect(task.group, backupGroup);
    expect(task.requiresWiFi, isTrue);
    expect(task.headers['Authorization'], 'Bearer tok');
    expect(task.headers['Tus-Resumable'], '1.0.0');
    expect(task.headers['Upload-Length'], '1234');
    expect(task.headers['Content-Disposition'], '');
    final meta = {
      for (final kv in task.headers['Upload-Metadata']!.split(','))
        kv.split(' ')[0]: utf8.decode(base64.decode(kv.split(' ')[1])),
    };
    expect(meta, {'filename': 'IMG_0001.HEIC', 'lastModified': '1700000000000'});
    final back = QueuedAsset.fromJson(task.metaData);
    expect((back.asset, back.name, back.bytes, back.video), ('ABC/L0/001', 'IMG_0001.HEIC', 1234, false));
  });

  group('outcome', () {
    final task = backupTask(api: api, info: info, fileName: 'x.HEIC', taken: DateTime(2024), wifiOnly: false);
    TaskStatusUpdate done(int code, [Map<String, String>? headers]) =>
        TaskStatusUpdate(task, TaskStatus.complete, null, null, headers, code);
    TaskStatusUpdate failed(int code) =>
        TaskStatusUpdate(task, TaskStatus.failed, TaskHttpException('error', code));

    test('stored, or already on the server', () {
      expect(outcome(done(201, {'wanmory-asset-id': 'a1', 'wanmory-duplicate': 'true'})), Outcome.uploaded);
    });
    test('a 2xx without a photo ID is retried', () {
      expect(outcome(done(201)), Outcome.retry);
    });
    test('unsupported file types are not retried', () {
      expect(outcome(failed(415)), Outcome.refused);
      expect(outcome(failed(400)), Outcome.refused);
    });
    test('signed out', () => expect(outcome(failed(401)), Outcome.unauthorized));
    test('server and network errors are retried', () {
      expect(outcome(failed(500)), Outcome.retry);
      expect(
        outcome(TaskStatusUpdate(task, TaskStatus.failed, TaskConnectionException('offline'))),
        Outcome.retry,
      );
    });
  });

  test('the time estimate uses the overall upload rate and average sizes', () {
    final eta = EtaEstimator();
    expect(eta.estimate(queuedBytesLeft: 1000, photosLeft: 1, videosLeft: 0), isNull);
    eta.size(bytes: 2000000, video: false);
    eta.size(bytes: 20000000, video: true);
    final t0 = DateTime(2024);
    eta.sample(0, t0);
    eta.sample(4000000, t0.add(const Duration(seconds: 2))); // 2 MB/s
    // 6 MB queued + 2 photos (4 MB) + 1 video (20 MB) = 30 MB at 2 MB/s.
    expect(eta.estimate(queuedBytesLeft: 6000000, photosLeft: 2, videosLeft: 1), const Duration(seconds: 15));
  });

  group('big files in pieces', () {
    final c = ChunkedUpload(
      asset: 'V/L0/001',
      name: 'DJI_0080.MP4',
      file: 'V_L0_001.mp4',
      bytes: 17189308928,
      video: true,
      takenMs: 1,
      location: 'http://s/api/uploads/abc',
    );
    final task = chunkTask(api: api, c: c, offset: chunkBytes, length: chunkBytes, wifiOnly: true);

    test('a piece is a PATCH from where the server is', () {
      expect(task.url, 'http://s/api/uploads/abc');
      expect(task.httpRequestMethod, 'PATCH');
      expect(task.post, 'binary');
      expect(task.filename, 'V_L0_001.mp4.part');
      expect(task.headers['Upload-Offset'], '$chunkBytes');
      expect(task.headers['Tus-Resumable'], '1.0.0');
      expect(task.headers['Authorization'], 'Bearer tok');
      expect(task.retries, 0);
      expect(task.taskId.startsWith(chunkTaskPrefix), isTrue);
      expect((jsonDecode(task.metaData) as Map)['asset'], 'V/L0/001');
    });

    test('the settings round trip keeps the upload address', () {
      final back = ChunkedUpload.fromJson(jsonDecode(jsonEncode(c.toJson())) as Map<String, dynamic>);
      expect((back.asset, back.file, back.bytes, back.location), (c.asset, c.file, c.bytes, c.location));
    });

    TaskStatusUpdate done(int code, Map<String, String> headers) =>
        TaskStatusUpdate(task, TaskStatus.complete, null, null, headers, code);
    TaskStatusUpdate failed(int code) =>
        TaskStatusUpdate(task, TaskStatus.failed, TaskHttpException('error', code));

    test('outcomes', () {
      expect(chunkOutcome(done(204, {'upload-offset': '536870912'})), (
        outcome: ChunkOutcome.next,
        offset: 536870912,
      ));
      expect(
        chunkOutcome(done(204, {'upload-offset': '17189308928', 'wanmory-asset-id': 'a1'})).outcome,
        ChunkOutcome.finished,
      );
      expect(chunkOutcome(failed(409)).outcome, ChunkOutcome.retry);
      expect(chunkOutcome(failed(404)).outcome, ChunkOutcome.gone);
      expect(chunkOutcome(failed(415)).outcome, ChunkOutcome.refused);
      expect(chunkOutcome(failed(401)).outcome, ChunkOutcome.unauthorized);
      expect(
        chunkOutcome(TaskStatusUpdate(task, TaskStatus.failed, TaskConnectionException('offline'))).outcome,
        ChunkOutcome.retry,
      );
    });
  });

  test('uploads the app sends itself', () {
    expect(outcomeOf(201, {'wanmory-asset-id': 'a1'}), Outcome.uploaded);
    expect(outcomeOf(201, {}), Outcome.retry);
    expect(outcomeOf(0, {}), Outcome.retry);
    expect(outcomeOf(507, {}), Outcome.retry);
    expect(outcomeOf(415, {}), Outcome.refused);
    expect(outcomeOf(401, {}), Outcome.unauthorized);
  });
}
