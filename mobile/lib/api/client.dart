import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart' show kIsWeb, defaultTargetPlatform;
import 'package:http/http.dart' as http;
import 'package:logging/logging.dart';

import '../albums/smart_rules.dart';
import 'models.dart';

final _log = Logger('api');

/// An error from the server or the network.
///
/// [message] is the server's error text. Like the web client, the server answers with
/// Chinese source strings, which the app translates with `t()`.
class ApiException implements Exception {
  ApiException(this.status, this.message);

  /// HTTP status, or 0 when the server could not be reached.
  final int status;
  final String message;

  bool get unauthorized => status == 401;

  @override
  String toString() => 'ApiException($status, $message)';
}

/// Talks to one Wanmory server. Signed-in requests carry the session token as
/// `Authorization: Bearer <token>` (the web client uses a cookie instead).
class ApiClient {
  ApiClient(this.baseUrl, {this.token, http.Client? client}) : _http = client ?? http.Client();

  /// For example "http://192.168.1.10:8080", without a trailing slash.
  final String baseUrl;
  final String? token;
  final http.Client _http;

  static const _timeout = Duration(seconds: 15);
  static const userAgent = 'Wanmory-Mobile/0.1';

  /// The token goes both as a bearer token and as the session cookie, so servers from before
  /// bearer support (v0.5.1 and older) accept it too.
  Map<String, String> get authHeaders => {
    if (token != null) 'Authorization': 'Bearer $token',
    if (token != null && !kIsWeb) 'Cookie': 'wanmory_session=$token',
    if (!kIsWeb) 'User-Agent': '$userAgent (${defaultTargetPlatform.name})',
  };

  Uri url(String path) => Uri.parse('$baseUrl$path');

  ApiClient withToken(String? token) => ApiClient(baseUrl, token: token, client: _http);

  /// Turns what the user typed into a base URL: adds "http://" when there is no scheme
  /// and drops trailing slashes.
  static String normalize(String input) {
    var s = input.trim();
    if (s.isEmpty) return s;
    if (!s.contains('://')) s = 'http://$s';
    while (s.endsWith('/')) {
      s = s.substring(0, s.length - 1);
    }
    return s;
  }

  Future<dynamic> _send(String method, String path, [Object? body]) async {
    final res = await _request(method, path, body);
    if (res.statusCode == 204 || res.bodyBytes.isEmpty) return null;
    return jsonDecode(utf8.decode(res.bodyBytes));
  }

  Future<http.Response> _request(String method, String path, [Object? body]) async {
    final req = http.Request(method, url(path))..headers.addAll(authHeaders);
    if (body != null) {
      req.headers['Content-Type'] = 'application/json';
      req.body = jsonEncode(body);
    }
    http.Response res;
    try {
      res = await http.Response.fromStream(await _http.send(req).timeout(_timeout));
    } on TimeoutException {
      _log.warning('$method $path timed out');
      throw ApiException(0, '连不上服务器，请检查地址和网络');
    } on Exception catch (e) {
      _log.warning('$method $path failed', e);
      throw ApiException(0, '连不上服务器，请检查地址和网络');
    }
    if (res.statusCode >= 400) {
      var msg = '服务器内部错误';
      try {
        msg = (jsonDecode(utf8.decode(res.bodyBytes)) as Map)['error'] as String? ?? msg;
      } on Object {
        // not JSON (a proxy error page, or not a Wanmory server)
      }
      _log.info('$method $path -> ${res.statusCode}');
      throw ApiException(res.statusCode, msg);
    }
    return res;
  }

  /// Checks that [baseUrl] is a Wanmory server. Returns whether an admin still has to be
  /// created (the app leaves that to the web page).
  Future<bool> probe() async {
    final state = await _send('GET', '/api/auth/state');
    if (state is! Map || !state.containsKey('setup_needed')) {
      throw ApiException(0, '这个地址不是万象服务器');
    }
    return state['setup_needed'] as bool;
  }

  /// The signed-in user, or null when the token is no longer valid.
  Future<User?> currentUser() async {
    final state = await _send('GET', '/api/auth/state') as Map<String, dynamic>;
    final u = state['user'];
    return u == null ? null : User.fromJson(u as Map<String, dynamic>);
  }

  Future<LoginResult> login(String name, String password) async {
    final res = await _request('POST', '/api/auth/login', {
      'name': name,
      'password': password,
      'remember': true,
      'bearer': true,
    });
    final r = jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
    if (r['totp_required'] == true) return LoginResult.needsCode(r['ticket'] as String);
    return _signedIn(r, res.headers['set-cookie']);
  }

  /// Second sign-in step: a 6-digit code from the authenticator app, or a recovery code.
  Future<LoginResult> loginWithCode(String ticket, String code) async {
    final res = await _request('POST', '/api/auth/login/totp', {'ticket': ticket, 'code': code});
    final r = jsonDecode(utf8.decode(res.bodyBytes)) as Map<String, dynamic>;
    return _signedIn(r, res.headers['set-cookie']);
  }

  static final _sessionCookie = RegExp(r'wanmory_session=([^;,\s]+)');

  /// Servers before bearer support (v0.5.1 and older) only set the session cookie; the token is
  /// taken from there.
  LoginResult _signedIn(Map<String, dynamic> r, String? setCookie) {
    final token = r['token'] as String? ?? _sessionCookie.firstMatch(setCookie ?? '')?.group(1);
    if (token == null) {
      throw ApiException(0, '服务器版本太旧，请先升级万象服务器');
    }
    return LoginResult.signedIn(User.fromJson(r['user'] as Map<String, dynamic>), token);
  }

  Future<void> logout() => _send('POST', '/api/auth/logout');

  /// One page of the timeline, newest first (search results: best match first).
  Future<AssetPage> assets({
    String? cursor,
    int limit = 200,
    AssetFilter filter = const AssetFilter(),
  }) async {
    final f = filter.query;
    final q =
        'limit=$limit${f.isEmpty ? '' : '&$f'}'
        '${cursor == null ? '' : '&cursor=${Uri.encodeQueryComponent(cursor)}'}';
    return AssetPage.fromJson(await _send('GET', '/api/assets?$q') as Map<String, dynamic>);
  }

  Future<Summary> summary({AssetFilter filter = const AssetFilter()}) async {
    final q = filter.query;
    return Summary.fromJson(
      await _send('GET', '/api/assets/summary${q.isEmpty ? '' : '?$q'}') as Map<String, dynamic>,
    );
  }

  /// Photo counts per month, newest first, in time zone [tz] (for the time scrubber).
  Future<List<(DateTime, int)>> monthCounts({
    required String tz,
    AssetFilter filter = const AssetFilter(),
  }) async {
    final q = filter.query;
    final r = await _send(
      'GET',
      '/api/assets/dates?unit=month&tz=${Uri.encodeQueryComponent(tz)}${q.isEmpty ? '' : '&$q'}',
    );
    return [for (final m in r as List) (DateTime.parse('${(m as Map)['date']}-01'), m['count'] as int)];
  }

  /// The best-looking landscape photos, one per day. [slideshow] asks for up to 100 for playback.
  Future<List<Asset>> highlights({int limit = 8, bool slideshow = false}) async {
    final r = await _send('GET', '/api/assets/highlights?limit=$limit${slideshow ? '&for=slideshow' : ''}');
    return [for (final a in r as List) Asset.fromJson(a as Map<String, dynamic>)];
  }

  Future<List<Person>> people() async {
    final r = await _send('GET', '/api/people');
    return [for (final p in r as List) Person.fromJson(p as Map<String, dynamic>)];
  }

  Future<List<Album>> albums() async {
    final r = await _send('GET', '/api/albums');
    return [for (final a in r as List) Album.fromJson(a as Map<String, dynamic>)];
  }

  /// Family members (for choosing who can see an album).
  Future<List<User>> users() async {
    final r = await _send('GET', '/api/users');
    return [for (final u in r as List) User.fromJson(u as Map<String, dynamic>)];
  }

  /// Creates an album. With [rules] it is a smart album; [members] empty and not [private] means
  /// the whole family can see it.
  Future<Album> createAlbum({
    required String name,
    List<String> assetIds = const [],
    SmartRules? rules,
    bool autoSync = true,
    bool private = false,
    List<String> members = const [],
    bool hideMine = false,
  }) async {
    final r = await _send('POST', '/api/albums', {
      'name': name,
      'asset_ids': assetIds,
      if (rules != null) ...{'rules': rules.toJson(), 'auto_sync': autoSync},
      'private': private,
      'members': members,
      'hide_mine': private && hideMine,
    });
    return Album.fromJson(r as Map<String, dynamic>);
  }

  /// How many photos match smart album rules.
  Future<int> previewSmart(SmartRules rules) async {
    final r = await _send('POST', '/api/albums/preview', rules.toJson());
    return (r as Map)['count'] as int;
  }

  /// Camera models, makes or lenses seen in the photos ([field] is camera, make or lens).
  Future<List<String>> fieldValues(String field) async {
    final r = await _send('GET', '/api/albums/values?field=$field');
    return (r as List? ?? []).cast<String>();
  }

  Future<void> addToAlbum(String albumId, List<String> assetIds) =>
      _send('POST', '/api/albums/$albumId/assets', {'ids': assetIds});

  String thumbnailUrl(String assetId) => '$baseUrl/api/assets/$assetId/thumbnail';
  String previewUrl(String assetId) => '$baseUrl/api/assets/$assetId/preview';
  String facePortraitUrl(String faceId) => '$baseUrl/api/faces/$faceId/thumbnail?shape=portrait';

  String avatarUrl(User u) =>
      u.avatarStyle.isNotEmpty ? '$baseUrl/api/users/${u.id}/avatar' : thumbnailUrl(u.avatar!);
}
