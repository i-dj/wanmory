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

/// Who is signed in where, settings and sign out.
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
