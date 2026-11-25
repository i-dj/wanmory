import 'dart:async';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:logging/logging.dart';
import 'package:path_provider/path_provider.dart';

/// Keeps the log file under this size; the older half moves to `wanmory.log.1`.
const _maxLogBytes = 2 << 20;

IOSink? _sink;

/// Sets up `package:logging`. Log messages are always English. Besides the console they go
/// to `Library/Application Support/logs/wanmory.log`, so problems on a phone (album sync in
/// the background, say) can be read off the device afterwards.
void setupLogging() {
  Logger.root.level = kReleaseMode ? Level.INFO : Level.ALL;
  Logger.root.onRecord.listen((r) {
    final error = r.error == null ? '' : ': ${r.error}';
    final line = '${r.time.toIso8601String()} ${r.level.name} ${r.loggerName}: ${r.message}$error';
    debugPrint(line);
    try {
      _sink?.writeln(line);
    } on Object {
      _reopen();
    }
  });
  if (!kIsWeb) unawaited(_openFile());
}

bool _reopened = false;

void _reopen() {
  if (_sink == null) return;
  _sink = null;
  _reopened = true;
  Future<void>.delayed(const Duration(seconds: 2), _openFile);
}

Future<void> _openFile() async {
  try {
    final dir = Directory('${(await getApplicationSupportDirectory()).path}/logs');
    await dir.create(recursive: true);
    final file = File('${dir.path}/wanmory.log');
    if (await file.exists() && await file.length() > _maxLogBytes) {
      await file.rename('${file.path}.1');
    }
    final sink = file.openWrite(mode: FileMode.append);
    _sink = sink;
    // A write that fails (the phone locked at the wrong moment, say) would stop all later ones
    unawaited(sink.done.catchError((Object _) => _reopen()));
    if (!_reopened) Logger('app').info('started');
  } on Object catch (e) {
    debugPrint('cannot open the log file: $e');
  }
}
