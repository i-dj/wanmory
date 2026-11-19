import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:wanmory/albums/smart_rules.dart';
import 'package:wanmory/api/client.dart';

void main() {
  test('default rules match the web', () {
    expect(defaultRule('photo').toJson(), {'field': 'photo', 'op': 'is', 'value': 'favorite'});
    expect(defaultRule('rating').value, '5');
    expect(defaultRule('taken', op: 'in_last').toJson(), {
      'field': 'taken',
      'op': 'in_last',
      'value': '30',
      'unit': 'day',
    });
    expect(defaultRule('album', albumIds: ['a1']).value, 'a1');
    expect(defaultRule('lens').values, isEmpty);
  });

  test('a rule is complete once it has a value', () {
    expect(defaultRule('lens').complete, isFalse);
    expect(defaultRule('lens').copyWith(values: ['50mm']).complete, isTrue);
    expect(defaultRule('lens', op: 'empty').complete, isTrue);
    expect(defaultRule('iso').complete, isFalse);
    expect(defaultRule('iso').copyWith(value: '400').complete, isTrue);
    expect(defaultRule('album').complete, isFalse); // no album to pick
  });

  test('changing a date comparison resets the value only between kinds', () {
    final day = defaultRule('taken').copyWith(value: '2024-01-02');
    expect(withOp(day, 'after', []).value, '2024-01-02');
    expect(withOp(day, 'in_last', []).unit, 'day');
    final text = defaultRule('camera').copyWith(values: ['X100']);
    expect(withOp(text, 'starts', []).values, ['X100']);
  });

  test('createAlbum sends rules, auto sync and sharing', () async {
    late Map<String, dynamic> body;
    final api = ApiClient(
      'http://s',
      token: 't',
      client: MockClient((req) async {
        body = jsonDecode(req.body) as Map<String, dynamic>;
        return http.Response(
          jsonEncode({'id': 'a', 'name': 'n', 'count': 3, 'kind': 'smart', 'auto_sync': true}),
          200,
        );
      }),
    );
    final album = await api.createAlbum(
      name: 'n',
      rules: SmartRules(rules: [defaultRule('photo')], tz: 'Asia/Shanghai'),
      private: true,
      hideMine: true,
    );
    expect(album.synced, isTrue);
    expect(body['rules'], {
      'match': 'all',
      'rules': [
        {'field': 'photo', 'op': 'is', 'value': 'favorite'},
      ],
      'tz': 'Asia/Shanghai',
    });
    expect(body['auto_sync'], true);
    expect(body['private'], true);
    expect(body['hide_mine'], true);
    expect(body['members'], isEmpty);
  });
}
