import 'dart:async';
import 'dart:io';

import 'package:flutter/services.dart';
import 'package:logging/logging.dart';

final _log = Logger('backup');

/// iOS 26+: a continued processing task keeps the app running after the user leaves it or
/// locks the phone, with the sync progress shown on the lock screen (see AppDelegate.swift).
/// Uploads queued in the system's background session while the app is in the background count
/// as "discretionary" and iOS holds them back until the phone charges; while this task runs,
/// album sync uploads by itself instead, so it keeps going with the screen off.
class ContinuedSync {
  ContinuedSync({required this.onStarted, required this.onExpired}) {
    if (Platform.isIOS) _channel.setMethodCallHandler(_onCall);
  }

  static const _channel = MethodChannel('wanmory/continued');

  final void Function() onStarted;
  final void Function() onExpired;

  /// iOS has started the task and the app may keep working in the background.
  bool active = false;

  /// Submitted (or refused); not asked again until finished.
  bool _requested = false;

  Future<dynamic> _onCall(MethodCall call) async {
    switch (call.method) {
      case 'started':
        active = true;
        _log.info('continued sync started');
        onStarted();
      case 'expired':
        active = false;
        _requested = false;
        _log.info('continued sync ended by the system');
        onExpired();
    }
  }

  /// Asks iOS for the task (only while the app is in the foreground).
  Future<void> start({
    required String title,
    required String subtitle,
    required int total,
    required int done,
  }) async {
    if (!Platform.isIOS || _requested) return;
    _requested = true;
    try {
      final ok = await _channel.invokeMethod<bool>('start', {
        'title': title,
        'subtitle': subtitle,
        'total': total,
        'done': done,
      });
      if (ok != true) _log.info('continued sync not available');
    } on PlatformException catch (e) {
      _log.info('continued sync refused: ${e.message}');
    } on MissingPluginException {
      // tests
    }
  }

  void progress({required int total, required int done, String? subtitle}) {
    if (!active) return;
    unawaited(
      _channel
          .invokeMethod<void>('progress', {'total': total, 'done': done, 'subtitle': ?subtitle})
          .catchError((_) {}),
    );
  }

  /// Sync is done (or turned off): the progress goes away.
  void finish() {
    if (!_requested && !active) return;
    active = false;
    _requested = false;
    if (Platform.isIOS) unawaited(_channel.invokeMethod<void>('finish').catchError((_) {}));
  }
}
