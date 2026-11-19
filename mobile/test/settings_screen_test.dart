import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:material_ui/material_ui.dart';
import 'package:wanmory/backup/backup.dart';
import 'package:wanmory/i18n.dart';
import 'package:wanmory/screens/settings_screen.dart';

class _Fixed extends BackupNotifier {
  _Fixed(this.fixed);

  final BackupState fixed;

  @override
  BackupState build() => fixed;
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  Future<void> show(WidgetTester tester, BackupState s) async {
    await tester.pumpWidget(
      ProviderScope(
        key: UniqueKey(),
        overrides: [backupProvider.overrideWith(() => _Fixed(s))],
        child: const MaterialApp(home: SettingsScreen()),
      ),
    );
    await tester.pump();
  }

  testWidgets('shows progress, counts and time left while uploading', (tester) async {
    await setLocale('en');
    await show(
      tester,
      const BackupState(
        enabled: true,
        phase: BackupPhase.uploading,
        total: 1200,
        synced: 300,
        pending: 900,
        failed: 2,
        current: 'IMG_4821.HEIC',
        currentProgress: 0.4,
        eta: Duration(hours: 1, minutes: 25),
      ),
    );
    expect(find.text('Uploading IMG_4821.HEIC'), findsOneWidget);
    expect(find.text('300'), findsOneWidget);
    expect(find.text('900'), findsOneWidget);
    expect(find.text('1 h 25 min'), findsOneWidget);
    expect(find.textContaining("2 items couldn't be uploaded"), findsOneWidget);
    expect(find.text('Sync now'), findsNothing); // no button while uploading
  });

  testWidgets('estimating, waiting for Wi-Fi and done', (tester) async {
    await setLocale('zh-CN');
    await show(
      tester,
      const BackupState(enabled: true, phase: BackupPhase.uploading, total: 10, pending: 10),
    );
    expect(find.text('正在估算…'), findsOneWidget);
    await show(
      tester,
      const BackupState(enabled: true, phase: BackupPhase.waitingWifi, total: 10, pending: 4),
    );
    expect(find.text('等待连接 Wi-Fi'), findsOneWidget);
    expect(find.text('立即同步'), findsOneWidget);
    await show(tester, const BackupState(enabled: true, phase: BackupPhase.done, total: 10, synced: 10));
    expect(find.text('全部已同步'), findsOneWidget);
  });

  test('durations read naturally', () async {
    await setLocale('zh-CN');
    expect(SettingsScreen.duration(const Duration(seconds: 40)), '不到 1 分钟');
    expect(SettingsScreen.duration(const Duration(minutes: 12)), '12 分钟');
    expect(SettingsScreen.duration(const Duration(minutes: 135)), '2 小时 15 分钟');
  });
}
