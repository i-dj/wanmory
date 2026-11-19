import 'package:flutter_test/flutter_test.dart';
import 'package:wanmory/i18n.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('matchLocale maps device languages', () {
    expect(matchLocale('zh-Hant-HK'), 'zh-TW');
    expect(matchLocale('zh_CN'), 'zh-CN');
    expect(matchLocale('pt-PT'), 'pt-BR');
    expect(matchLocale('en-GB'), 'en');
    expect(matchLocale('nl'), null);
  });

  test('t translates, fills placeholders and picks plurals', () async {
    await setLocale('en');
    expect(t('登录'), 'Sign in');
    expect(t('正在上传 {name}', {'name': 'IMG_0001.HEIC'}), 'Uploading IMG_0001.HEIC');
    await setLocale('zh-CN');
    expect(t('用{name}解锁', {'name': '面容 ID'}), '用面容 ID解锁');
  });
}
