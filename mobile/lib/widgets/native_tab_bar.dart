import 'dart:io';

import 'package:flutter/services.dart';
import 'package:material_ui/material_ui.dart';

/// iOS: the system tab bar (UITabBarController, see NativeTabs in AppDelegate.swift) floating
/// over the Flutter view, with the system's own glass and animations, and search as its own
/// round button. Flutter keeps drawing the pages; this only says which tab is open.
class NativeTabBar {
  NativeTabBar._();

  static const _channel = MethodChannel('wanmory/tabs');

  static void Function(int index)? onSelect;
  static void Function(int index)? onReselect;
  static VoidCallback? onSearch;

  static bool _listening = false;

  /// Shows the bar with [items] (title, SF Symbol name); false when the system can't (Android,
  /// iOS before 18), and the app draws its own.
  static Future<bool> show({
    required List<(String, String)> items,
    required String search,
    required int selected,
    required Color tint,
  }) async {
    if (!Platform.isIOS) return false;
    if (!_listening) {
      _listening = true;
      _channel.setMethodCallHandler((call) async {
        switch (call.method) {
          case 'selected':
            onSelect?.call(call.arguments as int);
          case 'reselected':
            onReselect?.call(call.arguments as int);
          case 'search':
            onSearch?.call();
        }
      });
    }
    try {
      return await _channel.invokeMethod<bool>('show', {
            'items': [
              for (final (title, symbol) in items) {'title': title, 'symbol': symbol},
            ],
            'search': search,
            'selected': selected,
            'tint': tint.toARGB32(),
          }) ??
          false;
    } on PlatformException {
      return false;
    } on MissingPluginException {
      return false;
    }
  }

  static bool _visible = true;

  /// Hidden while another page covers the tabs (a photo, a person, settings).
  static void setVisible(bool on) {
    if (!Platform.isIOS || on == _visible) return;
    _visible = on;
    _channel.invokeMethod<void>('visible', on).catchError((_) {});
  }

  static void remove() {
    if (!Platform.isIOS) return;
    _visible = true;
    _channel.invokeMethod<void>('remove').catchError((_) {});
  }
}

/// Watches the app's pages: the native tab bar shows only while [shell] (the page with the tabs)
/// is the top page. Dialogs and menus over it don't count; bottom sheets do.
class TabBarObserver extends NavigatorObserver {
  final _stack = <Route<dynamic>>[];
  Route<dynamic>? _shell;

  set shell(Route<dynamic>? route) {
    _shell = route;
    _update();
  }

  void _update() {
    if (_shell == null) return;
    // Dialogs and menus float in the middle and leave it; sheets come up from the bottom over it
    final top = _stack.lastWhere(
      (r) => r is! PopupRoute || r is ModalBottomSheetRoute,
      orElse: () => _shell!,
    );
    NativeTabBar.setVisible(identical(top, _shell));
  }

  @override
  void didPush(Route<dynamic> route, Route<dynamic>? previousRoute) {
    _stack.add(route);
    _update();
  }

  @override
  void didPop(Route<dynamic> route, Route<dynamic>? previousRoute) {
    _stack.remove(route);
    _update();
  }

  @override
  void didRemove(Route<dynamic> route, Route<dynamic>? previousRoute) {
    _stack.remove(route);
    _update();
  }

  @override
  void didReplace({Route<dynamic>? newRoute, Route<dynamic>? oldRoute}) {
    final i = oldRoute == null ? -1 : _stack.indexOf(oldRoute);
    if (i >= 0 && newRoute != null) {
      _stack[i] = newRoute;
    } else if (newRoute != null) {
      _stack.add(newRoute);
    }
    _update();
  }
}

final tabBarObserver = TabBarObserver();
