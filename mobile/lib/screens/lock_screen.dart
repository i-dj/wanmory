import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';

import '../auth/auth.dart';
import '../i18n.dart';
import '../widgets/avatar.dart';
import '../widgets/brand.dart';

/// Shown when biometric unlock is on: asks for Face ID / fingerprint right away.
class LockScreen extends ConsumerStatefulWidget {
  const LockScreen({super.key});

  @override
  ConsumerState<LockScreen> createState() => _LockScreenState();
}

class _LockScreenState extends ConsumerState<LockScreen> {
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _unlock());
  }

  Future<void> _unlock() async {
    if (_busy) return;
    setState(() => _busy = true);
    await ref.read(authProvider.notifier).unlock();
    if (mounted) setState(() => _busy = false);
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(authProvider);
    final theme = Theme.of(context);
    return FormPage(
      children: [
        const BrandHeader(),
        const SizedBox(height: 40),
        if (s.user != null && s.api != null) ...[
          Center(
            child: UserAvatar(user: s.user!, api: s.api!, radius: 36),
          ),
          const SizedBox(height: 12),
          Text(s.user!.name, textAlign: TextAlign.center, style: theme.textTheme.titleMedium),
          Text(
            Uri.tryParse(s.server)?.authority ?? s.server,
            textAlign: TextAlign.center,
            style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
          ),
        ],
        const SizedBox(height: 32),
        FilledButton.icon(
          onPressed: _busy ? null : _unlock,
          style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
          icon: Icon(ref.read(authProvider.notifier).biometricIcon),
          label: Text(t('用{name}解锁', {'name': s.biometricLabel ?? ''})),
        ),
        const SizedBox(height: 8),
        TextButton(onPressed: () => ref.read(authProvider.notifier).signOut(), child: Text(t('退出登录'))),
      ],
    );
  }
}
