import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';

import '../backup/backup.dart';
import '../i18n.dart';
import '../widgets/glass.dart';
import 'albums_tab.dart';
import 'collections_tab.dart';
import 'library_tab.dart';
import 'search_screen.dart';
import 'settings_screen.dart';

/// The signed-in app: Library, Albums and Collections under a floating tab bar, with search
/// next to it.
class ShellScreen extends ConsumerStatefulWidget {
  const ShellScreen({super.key});

  @override
  ConsumerState<ShellScreen> createState() => _ShellScreenState();
}

class _ShellScreenState extends ConsumerState<ShellScreen> {
  int _tab = 0;
  final _visited = <int>{0};

  /// Bumped to rebuild a tab, so Albums and People reload whenever they are opened
  /// (they may have changed on the web in the meantime).
  final _generation = [0, 0, 0];
  late final AppLifecycleListener _lifecycle;

  /// The "syncing" chip above the tab bar: shows for a few seconds when the app comes to the
  /// front while album sync is running. iOS doesn't tell the app it was opened from the sync
  /// progress in the Dynamic Island, so this is the way into the sync page from there.
  bool _chip = false;
  Timer? _chipTimer;

  void _showChip() {
    final s = ref.read(backupProvider);
    final syncing =
        s.enabled && s.pending > 0 && (s.phase == BackupPhase.uploading || s.phase == BackupPhase.scanning);
    if (!syncing) return;
    setState(() => _chip = true);
    _chipTimer?.cancel();
    _chipTimer = Timer(const Duration(seconds: 6), () {
      if (mounted) setState(() => _chip = false);
    });
  }

  void _openSync() {
    setState(() => _chip = false);
    Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => const SettingsScreen()));
  }

  @override
  void initState() {
    super.initState();
    _lifecycle = AppLifecycleListener(
      onResume: () {
        setState(() => _refresh(_tab));
        ref.read(backupProvider.notifier).start();
        _showChip();
      },
    );
    // Opened fresh (also from the Dynamic Island): once sync has looked at the library
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) _showChip();
    });
  }

  @override
  void dispose() {
    _chipTimer?.cancel();
    _lifecycle.dispose();
    super.dispose();
  }

  void _refresh(int tab) {
    if (tab == 1 || tab == 2) _generation[tab]++;
  }

  @override
  Widget build(BuildContext context) {
    const tabs = [LibraryTab(), AlbumsTab(), CollectionsTab()];
    final sync = ref.watch(backupProvider);
    return Scaffold(
      extendBody: true,
      body: Stack(
        children: [
          IndexedStack(
            index: _tab,
            // Tabs are built the first time they are opened, then kept.
            children: [
              for (var i = 0; i < tabs.length; i++)
                _visited.contains(i)
                    ? KeyedSubtree(key: ValueKey('$i-${_generation[i]}'), child: tabs[i])
                    : const SizedBox(),
            ],
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: MediaQuery.paddingOf(context).bottom + 84,
            child: Center(
              child: IgnorePointer(
                ignoring: !_chip,
                child: AnimatedSlide(
                  offset: _chip ? Offset.zero : const Offset(0, 0.4),
                  duration: const Duration(milliseconds: 260),
                  curve: Curves.easeOutCubic,
                  child: AnimatedOpacity(
                    opacity: _chip ? 1 : 0,
                    duration: const Duration(milliseconds: 220),
                    child: _SyncChip(pending: sync.pending, onTap: _openSync),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: _TabBar(
        index: _tab,
        onTap: (i) => setState(() {
          // Tapping Library again (or double-tapping it) goes back to the top
          if (i == _tab && i == 0) libraryToTop.value++;
          if (i != _tab && _visited.contains(i)) _refresh(i);
          _tab = i;
          _visited.add(i);
        }),
        onSearch: () =>
            Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => const SearchScreen())),
      ),
    );
  }
}

/// The floating tab bar, in the style of current phone photo apps: a frosted capsule with the
/// three tabs (the selected one sits on a tinted pill that slides over when you switch), and a
/// round frosted search button on its own to the right.
class _TabBar extends StatelessWidget {
  const _TabBar({required this.index, required this.onTap, required this.onSearch});

  final int index;
  final ValueChanged<int> onTap;
  final VoidCallback onSearch;

  static const _height = 54.0;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final items = [
      (Icons.photo_library_outlined, Icons.photo_library, t('图库')),
      (Icons.photo_album_outlined, Icons.photo_album, t('相册')),
      (Icons.grid_view_outlined, Icons.grid_view_rounded, t('合集')),
    ];
    return SafeArea(
      minimum: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 30),
        child: Row(
          children: [
            Expanded(
              child: _Frosted(
                radius: _height / 2,
                child: SizedBox(
                  height: _height,
                  child: LayoutBuilder(
                    builder: (context, box) {
                      final w = (box.maxWidth - 8) / items.length;
                      return Stack(
                        children: [
                          // The pill under the selected tab, sliding between tabs
                          AnimatedPositioned(
                            duration: const Duration(milliseconds: 320),
                            curve: Curves.easeOutBack,
                            left: 4 + w * index,
                            top: 4,
                            bottom: 4,
                            width: w,
                            child: DecoratedBox(
                              decoration: BoxDecoration(
                                color: scheme.primary.withValues(alpha: 0.16),
                                borderRadius: BorderRadius.circular(_height / 2),
                              ),
                            ),
                          ),
                          Row(
                            children: [
                              const SizedBox(width: 4),
                              for (var i = 0; i < items.length; i++)
                                SizedBox(
                                  width: w,
                                  child: _TabItem(
                                    icon: i == index ? items[i].$2 : items[i].$1,
                                    label: items[i].$3,
                                    selected: i == index,
                                    onTap: () => onTap(i),
                                  ),
                                ),
                            ],
                          ),
                        ],
                      );
                    },
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            Tooltip(
              message: t('搜索照片'),
              child: GestureDetector(
                onTap: onSearch,
                child: _Frosted(
                  radius: _height / 2,
                  child: SizedBox.square(
                    dimension: _height,
                    child: Icon(Icons.search_rounded, size: 24, color: scheme.onSurface),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TabItem extends StatelessWidget {
  const _TabItem({required this.icon, required this.label, required this.selected, required this.onTap});

  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final color = selected ? scheme.primary : scheme.onSurface.withValues(alpha: 0.75);
    return Semantics(
      selected: selected,
      button: true,
      label: label,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: AnimatedScale(
          scale: selected ? 1.0 : 0.94,
          duration: const Duration(milliseconds: 200),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 21, color: color),
              const SizedBox(height: 2),
              Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 10.5,
                  fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                  color: color,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// The bar's glass: see-through "liquid glass" (see [LiquidGlass]).
class _Frosted extends StatelessWidget {
  const _Frosted({required this.child, required this.radius});

  final Widget child;
  final double radius;

  @override
  Widget build(BuildContext context) => LiquidGlass(radius: radius, clear: true, child: child);
}

/// "Syncing albums · 5 left ›": opens the sync page.
class _SyncChip extends StatelessWidget {
  const _SyncChip({required this.pending, required this.onTap});

  final int pending;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return GestureDetector(
      onTap: onTap,
      child: _Frosted(
        radius: 22,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(14, 10, 10, 10),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              SizedBox.square(
                dimension: 16,
                child: CircularProgressIndicator(strokeWidth: 2, color: scheme.primary),
              ),
              const SizedBox(width: 10),
              Text(
                t('正在同步相册 · 还有 {n} 项', {'n': pending}),
                style: TextStyle(fontWeight: FontWeight.w600, color: scheme.onSurface),
              ),
              const SizedBox(width: 2),
              Icon(Icons.chevron_right_rounded, color: scheme.onSurfaceVariant),
            ],
          ),
        ),
      ),
    );
  }
}
