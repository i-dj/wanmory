import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';

import '../auth/auth.dart';
import '../i18n.dart';
import '../screens/settings_screen.dart';
import 'avatar.dart';

/// The avatar in the top right corner; opens the account sheet.
class AccountButton extends ConsumerWidget {
  const AccountButton({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(authProvider);
    if (s.user == null || s.api == null) return const SizedBox.shrink();
    return InkWell(
      customBorder: const CircleBorder(),
      onTap: () => showAccountSheet(context),
      child: UserAvatar(user: s.user!, api: s.api!),
    );
  }
}

/// Who is signed in where, the biometric unlock switch and sign out.
void showAccountSheet(BuildContext context) {
  showModalBottomSheet<void>(
    context: context,
    showDragHandle: true,
    builder: (context) => Consumer(
      builder: (context, ref, _) {
        final s = ref.watch(authProvider);
        final notifier = ref.read(authProvider.notifier);
        if (s.user == null) return const SizedBox.shrink();
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: UserAvatar(user: s.user!, api: s.api!),
                title: Text(s.user!.name),
                subtitle: Text(Uri.tryParse(s.server)?.authority ?? s.server),
              ),
              if (s.biometricLabel != null)
                SwitchListTile(
                  secondary: Icon(notifier.biometricIcon),
                  title: Text(t('用{name}解锁', {'name': s.biometricLabel!})),
                  value: s.biometrics == true,
                  onChanged: notifier.setBiometrics,
                ),
              ListTile(
                leading: const Icon(Icons.settings_outlined),
                title: Text(t('设置')),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {
                  final nav = Navigator.of(context);
                  nav.pop();
                  nav.push(MaterialPageRoute<void>(builder: (_) => const SettingsScreen()));
                },
              ),
              ListTile(
                leading: const Icon(Icons.logout),
                title: Text(t('退出登录')),
                onTap: () {
                  Navigator.pop(context);
                  notifier.signOut();
                },
              ),
            ],
          ),
        );
      },
    ),
  );
}

/// After the first sign-in on a device with Face ID / fingerprint, asks once whether to use it.
Future<void> offerBiometrics(BuildContext context, WidgetRef ref) async {
  final s = ref.read(authProvider);
  if (s.biometrics != null || s.biometricLabel == null) return;
  final notifier = ref.read(authProvider.notifier);
  final on = await showDialog<bool>(
    context: context,
    barrierDismissible: false,
    builder: (context) => AlertDialog(
      icon: Icon(notifier.biometricIcon, size: 32),
      title: Text(t('用{name}解锁？', {'name': s.biometricLabel!})),
      content: Text(t('登录会保存在这台设备上。开启后，每次打开万象都要先验证{name}。', {'name': s.biometricLabel!})),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context, false), child: Text(t('不用了'))),
        FilledButton(onPressed: () => Navigator.pop(context, true), child: Text(t('开启'))),
      ],
    ),
  );
  if (on != null) await notifier.setBiometrics(on);
}
