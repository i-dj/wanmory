import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:logging/logging.dart';

import '../api/client.dart';
import '../api/models.dart';
import '../i18n.dart';
import 'session_store.dart';

final _log = Logger('auth');

enum AuthStatus {
  /// Reading the saved sign-in.
  loading,

  /// Show the sign-in form.
  signedOut,

  /// Password accepted; waiting for the two-step verification code.
  needsCode,

  signedIn,
}

class AuthState {
  const AuthState({
    required this.status,
    this.server = '',
    this.lastName = '',
    this.user,
    this.api,
    this.message,
  });

  final AuthStatus status;

  /// Server address of the saved or pending sign-in.
  final String server;

  /// Name used for the last sign-in, prefilled in the form.
  final String lastName;
  final User? user;

  /// Client carrying the session token.
  final ApiClient? api;

  /// Why the user was signed out (a Chinese source string for `t()`), shown once on the form.
  final String? message;

  AuthState copyWith({
    AuthStatus? status,
    String? server,
    String? lastName,
    User? user,
    ApiClient? api,
    String? message,
  }) => AuthState(
    status: status ?? this.status,
    server: server ?? this.server,
    lastName: lastName ?? this.lastName,
    user: user ?? this.user,
    api: api ?? this.api,
    message: message,
  );
}

final sessionStoreProvider = Provider((ref) => SessionStore());

final authProvider = NotifierProvider<AuthNotifier, AuthState>(AuthNotifier.new);

class AuthNotifier extends Notifier<AuthState> {
  String? _ticket;
  String? _pendingServer;

  SessionStore get _store => ref.read(sessionStoreProvider);

  @override
  AuthState build() {
    Future.microtask(_restore);
    return const AuthState(status: AuthStatus.loading);
  }

  Future<void> _restore() async {
    final saved = await _store.load();
    final base = AuthState(
      status: AuthStatus.signedOut,
      server: saved.server ?? '',
      lastName: saved.lastName ?? '',
    );
    if (saved.token == null || saved.server == null || saved.user == null) {
      state = base;
      return;
    }
    await setLocale(saved.user!.locale);
    // Signing in once is enough: the saved sign-in opens the app directly.
    final api = ApiClient(saved.server!, token: saved.token);
    state = base.copyWith(status: AuthStatus.signedIn, user: saved.user, api: api);
    await refreshUser();
  }

  /// Re-reads the signed-in user; signs out when the session has expired. Being offline
  /// keeps the saved sign-in.
  Future<void> refreshUser() async {
    final api = state.api;
    if (api == null) return;
    try {
      final u = await api.currentUser();
      if (u == null) {
        await sessionExpired();
        return;
      }
      await _store.saveUser(u);
      if (u.locale != state.user?.locale) await setLocale(u.locale);
      state = state.copyWith(user: u);
    } on ApiException catch (e) {
      _log.info('cannot refresh the user: ${e.message}');
    }
  }

  /// First step: server address, name and password. Throws [ApiException] with a message
  /// for the form.
  Future<void> signIn(String serverInput, String name, String password) async {
    final server = ApiClient.normalize(serverInput);
    final api = ApiClient(server);
    if (await api.probe()) {
      throw ApiException(0, '这个服务器还没有管理员，请先在网页上创建');
    }
    final r = await api.login(name.trim(), password);
    if (r.ticket != null) {
      _ticket = r.ticket;
      _pendingServer = server;
      state = state.copyWith(status: AuthStatus.needsCode, server: server, lastName: name.trim());
      return;
    }
    await _finish(server, r.user!, r.token!);
  }

  /// Second step: authenticator code or recovery code.
  Future<void> submitCode(String code) async {
    final api = ApiClient(_pendingServer!);
    try {
      final r = await api.loginWithCode(_ticket!, code.replaceAll(' ', ''));
      await _finish(_pendingServer!, r.user!, r.token!);
    } on ApiException catch (e) {
      if (e.unauthorized && e.message != '验证码不对，或者已经过期了') {
        cancelCode(message: e.message); // the ticket expired or ran out of tries
      }
      rethrow;
    }
  }

  void cancelCode({String? message}) {
    _ticket = null;
    state = state.copyWith(status: AuthStatus.signedOut, message: message);
  }

  Future<void> _finish(String server, User user, String token) async {
    _ticket = null;
    await _store.saveSignIn(server, token, user);
    await setLocale(user.locale);
    _log.info('signed in to $server');
    state = state.copyWith(
      status: AuthStatus.signedIn,
      server: server,
      lastName: user.name,
      user: user,
      api: ApiClient(server, token: token),
    );
  }

  Future<void> signOut() async {
    try {
      await state.api?.logout();
    } on ApiException catch (e) {
      _log.info('server sign-out failed: ${e.message}');
    }
    await _signedOut(null);
  }

  /// The server rejected the token (expired, or signed out from another device).
  Future<void> sessionExpired() async {
    _log.info('session expired');
    await _signedOut('登录已过期，请重新登录');
  }

  Future<void> _signedOut(String? message) async {
    await _store.clearToken();
    state = AuthState(
      status: AuthStatus.signedOut,
      server: state.server,
      lastName: state.lastName,
      message: message,
    );
  }
}
