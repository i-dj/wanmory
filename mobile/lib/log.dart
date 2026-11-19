import 'package:flutter/foundation.dart';
import 'package:logging/logging.dart';

/// Sets up `package:logging`. Log messages are always English.
void setupLogging() {
  Logger.root.level = kReleaseMode ? Level.INFO : Level.ALL;
  Logger.root.onRecord.listen((r) {
    final error = r.error == null ? '' : ': ${r.error}';
    debugPrint('${r.time.toIso8601String()} ${r.level.name} ${r.loggerName}: ${r.message}$error');
  });
}
