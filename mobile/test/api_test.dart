import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:wanmory/api/client.dart';
import 'package:wanmory/api/models.dart';

const _user = {'id': 'u1', 'name': 'jay', 'is_admin': true, 'avatar': null, 'avatar_style': ''};

http.Response _json(Object body, [int status = 200]) =>
    http.Response.bytes(utf8.encode(jsonEncode(body)), status, headers: {'content-type': 'application/json'});

void main() {
  test('normalize adds a scheme and drops trailing slashes', () {
    expect(ApiClient.normalize(' 192.168.1.10:8080/ '), 'http://192.168.1.10:8080');
    expect(ApiClient.normalize('https://photos.example.com//'), 'https://photos.example.com');
  });

  test('login asks for a bearer token and returns it', () async {
    late Map<String, dynamic> sent;
    final api = ApiClient(
      'http://s',
      client: MockClient((req) async {
        sent = jsonDecode(req.body) as Map<String, dynamic>;
        return _json({'user': _user, 'token': 'tok'});
      }),
    );
    final r = await api.login('jay', 'pw');
    expect(sent['bearer'], true);
    expect(sent['remember'], true);
    expect(r.token, 'tok');
    expect(r.user!.name, 'jay');
  });

  test('two-step verification returns a ticket, then the code signs in', () async {
    final api = ApiClient(
      'http://s',
      client: MockClient((req) async {
        if (req.url.path == '/api/auth/login') return _json({'totp_required': true, 'ticket': 't1'});
        expect(jsonDecode(req.body), {'ticket': 't1', 'code': '123456'});
        return _json({'user': _user, 'token': 'tok'});
      }),
    );
    final first = await api.login('jay', 'pw');
    expect(first.ticket, 't1');
    final second = await api.loginWithCode('t1', '123456');
    expect(second.token, 'tok');
  });

  test('server errors carry the message, signed-in requests the token', () async {
    final api = ApiClient(
      'http://s',
      token: 'tok',
      client: MockClient((req) async {
        expect(req.headers['Authorization'], 'Bearer tok');
        return _json({'error': '登录已过期，请重新登录'}, 401);
      }),
    );
    await expectLater(
      api.assets(),
      throwsA(
        isA<ApiException>()
            .having((e) => e.unauthorized, 'unauthorized', true)
            .having((e) => e.message, 'message', '登录已过期，请重新登录'),
      ),
    );
  });

  test('an older server without bearer support is reported', () async {
    final api = ApiClient('http://s', client: MockClient((_) async => _json({'user': _user})));
    await expectLater(api.login('jay', 'pw'), throwsA(isA<ApiException>()));
  });

  test('an older server is signed in through its session cookie', () async {
    final api = ApiClient(
      'http://s',
      client: MockClient(
        (_) async => http.Response.bytes(
          utf8.encode(jsonEncode({'user': _user})),
          200,
          headers: {'set-cookie': 'wanmory_session=abc_123; Path=/; HttpOnly; Secure'},
        ),
      ),
    );
    final r = await api.login('jay', 'pw');
    expect(r.token, 'abc_123');
    expect(api.withToken('abc_123').authHeaders['Cookie'], 'wanmory_session=abc_123');
  });

  test('filters become query parameters', () async {
    late Uri url;
    final api = ApiClient(
      'http://s',
      token: 't',
      client: MockClient((req) async {
        url = req.url;
        return _json({'items': [], 'next_cursor': null});
      }),
    );
    await api.assets(filter: const AssetFilter(kind: 'video', favorite: true));
    expect(url.queryParameters, {'limit': '200', 'kind': 'video', 'favorite': 'true'});
  });

  test('a page that is not Wanmory fails the probe', () async {
    final api = ApiClient('http://s', client: MockClient((_) async => http.Response('<html>', 200)));
    await expectLater(api.probe(), throwsA(anything));
  });

  test('resumable uploads: create, ask where it stands, gone', () async {
    final seen = <String>[];
    final api = ApiClient(
      'http://s',
      token: 'tok',
      client: MockClient((req) async {
        seen.add('${req.method} ${req.url.path} ${req.headers['Upload-Length'] ?? ''}');
        expect(req.headers['Tus-Resumable'], '1.0.0');
        expect(req.headers['Authorization'], 'Bearer tok');
        if (req.method == 'POST') return http.Response('', 201, headers: {'location': '/api/uploads/abc'});
        if (req.url.path.endsWith('/gone')) return http.Response('', 404);
        return http.Response('', 200, headers: {'upload-offset': '268435456'});
      }),
    );
    final loc = await api.createUpload(length: 999, metadata: 'filename eA==');
    expect(loc, 'http://s/api/uploads/abc');
    final st = await api.uploadStatus(loc);
    expect((st!.offset, st.assetId), (268435456, null));
    expect(await api.uploadStatus('http://s/api/uploads/gone'), isNull);
    expect(seen.first, 'POST /api/uploads/ 999');
  });
}
