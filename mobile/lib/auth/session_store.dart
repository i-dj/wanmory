import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../api/models.dart';

/// The saved sign-in, kept in the iOS Keychain / Android Keystore-backed storage.
class SessionStore {
  SessionStore([FlutterSecureStorage? storage]) : _s = storage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _s;

  static const _server = 'server';
  static const _token = 'token';
  static const _user = 'user';
  static const _name = 'last_name';

  Future<SavedSession> load() async {
    final all = await _s.readAll();
    User? user;
    final raw = all[_user];
    if (raw != null) {
      try {
        user = User.fromJson(jsonDecode(raw) as Map<String, dynamic>);
      } on Object {
        user = null;
      }
    }
    return SavedSession(server: all[_server], token: all[_token], user: user, lastName: all[_name]);
  }

  Future<void> saveSignIn(String server, String token, User user) async {
    await _s.write(key: _server, value: server);
    await _s.write(key: _token, value: token);
    await _s.write(key: _name, value: user.name);
    await _s.write(key: _user, value: jsonEncode(_userJson(user)));
  }

  Future<void> saveUser(User user) => _s.write(key: _user, value: jsonEncode(_userJson(user)));

  /// Forgets the token but keeps the server address and name for the next sign-in.
  Future<void> clearToken() async {
    await _s.delete(key: _token);
    await _s.delete(key: _user);
  }

  static Map<String, dynamic> _userJson(User u) => {
    'id': u.id,
    'name': u.name,
    'is_admin': u.isAdmin,
    'avatar': u.avatar,
    'avatar_style': u.avatarStyle,
    'locale': u.locale,
  };
}

class SavedSession {
  SavedSession({this.server, this.token, this.user, this.lastName});

  final String? server;
  final String? token;
  final User? user;
  final String? lastName;
}
