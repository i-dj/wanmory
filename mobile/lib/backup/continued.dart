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
      if (ok != true) {
        _requested = false; // may be asked again later
        _log.info('continued sync not available');
      } else {
        _log.info('continued sync requested');
      }
    } on PlatformException catch (e) {
      _requested = false;
      _log.info('continued sync refused: ${e.message}');
    } on MissingPluginException {
      // tests
    }
  }

  /// Low Power Mode is on (iOS pauses background work then).
  Future<bool> lowPower() async {
    if (!Platform.isIOS) return false;
    try {
      return await _channel.invokeMethod<bool>('lowPower') ?? false;
    } on PlatformException {
      return false;
    } on MissingPluginException {
      return false;
    }
  }

  DateTime _sentAt = DateTime(0);

  void progress({required int total, required int done, String? subtitle}) {
    if (!active) return;
    // A few times a second is plenty
    final now = DateTime.now();
    if (now.difference(_sentAt) < const Duration(milliseconds: 300)) return;
    _sentAt = now;
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

/// iOS: a long background job for the first sync of a big library (see AppDelegate.swift). iOS
/// runs it when the phone is online and idle (most often charging at night), for as long as it allows,
/// and again later while something is left. While it runs album sync uploads by itself, like
/// with [ContinuedSync].
class OvernightSync {
  OvernightSync({required this.onStarted, required this.onExpired}) {
    if (!Platform.isIOS) return;
    _channel.setMethodCallHandler(_onCall);
    // iOS may have started the job before the app was listening
    _channel.invokeMethod<bool>('running').then((running) {
      if (running == true && !active) _start();
    }, onError: (_) {});
  }

  static const _channel = MethodChannel('wanmory/overnight');

  final void Function() onStarted;
  final void Function() onExpired;

  /// iOS is running the job: the app may keep working in the background.
  bool active = false;
  bool _scheduled = false;

  void _start() {
    active = true;
    _log.info('overnight sync started');
    onStarted();
  }

  Future<dynamic> _onCall(MethodCall call) async {
    switch (call.method) {
      case 'started':
        _scheduled = false;
        _start();
      case 'expired':
        active = false;
        _log.info('overnight sync ended by the system');
        onExpired();
    }
  }

  /// Asks iOS to run the job next time the phone charges and is online (once per run of the app).
  Future<void> schedule() async {
    if (!Platform.isIOS || _scheduled || active) return;
    _scheduled = true;
    try {
      final ok = await _channel.invokeMethod<bool>('schedule');
      _log.info(ok == true ? 'overnight sync scheduled' : 'overnight sync not available');
    } on PlatformException catch (e) {
      _log.info('overnight sync refused: ${e.message}');
    } on MissingPluginException {
      // tests
    }
  }

  /// Done for now; [more] left asks for another run.
  void finish({required bool more}) {
    if (!Platform.isIOS || !active) return;
    active = false;
    if (more) _scheduled = true;
    _log.info('overnight sync finished${more ? ', more next time' : ''}');
    unawaited(_channel.invokeMethod<void>('finish', more).catchError((_) {}));
  }
}

/// iOS: background app refresh, a short wake now and then (see AppDelegate.swift). While it
/// runs, album sync checks the server, uploads what it can and may post a notification.
class RefreshSync {
  RefreshSync({required this.onStarted, required this.onExpired}) {
    if (!Platform.isIOS) return;
    _channel.setMethodCallHandler(_onCall);
    _channel.invokeMethod<bool>('running').then((running) {
      if (running == true && !active) _start();
    }, onError: (_) {});
  }

  static const _channel = MethodChannel('wanmory/refresh');

  final void Function() onStarted;
  final void Function() onExpired;

  /// iOS woke the app and is waiting for [finish].
  bool active = false;
  DateTime _startedAt = DateTime(0);
  bool _scheduled = false;

  /// Still time to work: iOS allows about 30 s, some is kept for wrapping up.
  bool get going => active && DateTime.now().difference(_startedAt) < const Duration(seconds: 22);

  void _start() {
    active = true;
    _startedAt = DateTime.now();
    _log.info('background refresh started');
    onStarted();
  }

  Future<dynamic> _onCall(MethodCall call) async {
    switch (call.method) {
      case 'started':
        _scheduled = false;
        _start();
      case 'expired':
        active = false;
        _log.info('background wake ended by the system');
        onExpired();
    }
  }

  Future<void> schedule() async {
    if (!Platform.isIOS || _scheduled) return;
    _scheduled = true;
    try {
      await _channel.invokeMethod<bool>('schedule');
    } on PlatformException {
      // logged natively
    } on MissingPluginException {
      // tests
    }
  }

  void finish() {
    if (!active) return;
    active = false;
    unawaited(_channel.invokeMethod<void>('finish').catchError((_) {}));
  }

  bool _askedNotifications = false;

  /// Asks once per run whether the app may post notifications (iOS shows its prompt only once).
  Future<void> allowNotifications() async {
    if (!Platform.isIOS || _askedNotifications) return;
    _askedNotifications = true;
    try {
      await _channel.invokeMethod<bool>('allowNotifications');
    } on PlatformException {
      // ignore
    } on MissingPluginException {
      // tests
    }
  }

  Future<void> notify(String title, String body) async {
    if (!Platform.isIOS) return;
    try {
      await _channel.invokeMethod<bool>('notify', {'title': title, 'body': body});
    } on PlatformException {
      // ignore
    } on MissingPluginException {
      // tests
    }
  }
}
