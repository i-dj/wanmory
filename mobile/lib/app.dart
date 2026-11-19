import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:material_ui/material_ui.dart';

import 'auth/auth.dart';
import 'backup/backup.dart';
import 'i18n.dart';
import 'screens/code_screen.dart';
import 'screens/shell_screen.dart';
import 'screens/lock_screen.dart';
import 'screens/login_screen.dart';
import 'screens/viewer_screen.dart';

/// The brand color of the web client (--color-accent).
const accent = Color(0xFFCC632E);

/// Lock again after the app has been in the background this long.
const _lockAfter = Duration(minutes: 1);

final _routerProvider = Provider<GoRouter>((ref) {
  final refresh = ValueNotifier(0);
  ref.listen(authProvider.select((s) => s.status), (_, _) => refresh.value++);
  ref.onDispose(refresh.dispose);
  return GoRouter(
    initialLocation: '/',
    refreshListenable: refresh,
    redirect: (context, state) {
      final target = switch (ref.read(authProvider).status) {
        AuthStatus.loading => '/loading',
        AuthStatus.signedOut => '/login',
        AuthStatus.needsCode => '/code',
        AuthStatus.locked => '/lock',
        AuthStatus.signedIn => null,
      };
      if (target != null) return state.matchedLocation == target ? null : target;
      const authPages = {'/loading', '/login', '/code', '/lock'};
      return authPages.contains(state.matchedLocation) ? '/' : null;
    },
    routes: [
      GoRoute(path: '/loading', builder: (_, _) => const _Splash()),
      GoRoute(path: '/login', builder: (_, _) => const LoginScreen()),
      GoRoute(path: '/code', builder: (_, _) => const CodeScreen()),
      GoRoute(path: '/lock', builder: (_, _) => const LockScreen()),
      GoRoute(path: '/', builder: (_, _) => const ShellScreen()),
      GoRoute(
        path: '/photo',
        builder: (_, state) {
          final args = state.extra! as ViewerArgs;
          return ViewerScreen(assets: args.assets, initialIndex: args.index);
        },
      ),
    ],
  );
});

class WanmoryApp extends ConsumerStatefulWidget {
  const WanmoryApp({super.key});

  @override
  ConsumerState<WanmoryApp> createState() => _WanmoryAppState();
}

class _WanmoryAppState extends ConsumerState<WanmoryApp> {
  late final AppLifecycleListener _lifecycle;
  DateTime? _hiddenAt;

  @override
  void initState() {
    super.initState();
    // Album sync starts with the app, also when iOS launches it in the background to deliver
    // finished uploads, so the queue is topped up even while nobody has the app open.
    ref.read(backupProvider);
    _lifecycle = AppLifecycleListener(
      onHide: () => _hiddenAt = DateTime.now(),
      onShow: () {
        final at = _hiddenAt;
        _hiddenAt = null;
        if (at != null && DateTime.now().difference(at) > _lockAfter) {
          ref.read(authProvider.notifier).lock();
        }
      },
    );
  }

  @override
  void dispose() {
    _lifecycle.dispose();
    super.dispose();
  }

  ThemeData _theme(Brightness b) => ThemeData(
    colorScheme: ColorScheme.fromSeed(seedColor: accent, brightness: b),
    useMaterial3: true,
  );

  @override
  Widget build(BuildContext context) {
    // Rebuild when the account language changes after sign-in.
    ref.watch(authProvider.select((s) => s.user?.locale));
    final parts = currentLocale.split('-');
    return MaterialApp.router(
      title: 'Wanmory',
      debugShowCheckedModeBanner: false,
      theme: _theme(Brightness.light),
      darkTheme: _theme(Brightness.dark),
      locale: Locale.fromSubtags(
        languageCode: parts.first,
        scriptCode: currentLocale == 'zh-TW' ? 'Hant' : null,
        countryCode: parts.length > 1 ? parts.last : null,
      ),
      supportedLocales: [
        for (final l in locales)
          Locale.fromSubtags(
            languageCode: l.split('-').first,
            scriptCode: l == 'zh-TW' ? 'Hant' : null,
            countryCode: l.contains('-') ? l.split('-').last : null,
          ),
      ],
      localizationsDelegates: GlobalMaterialLocalizations.delegates,
      routerConfig: ref.watch(_routerProvider),
    );
  }
}

class _Splash extends StatelessWidget {
  const _Splash();

  @override
  Widget build(BuildContext context) => const Scaffold(body: Center(child: CircularProgressIndicator()));
}
