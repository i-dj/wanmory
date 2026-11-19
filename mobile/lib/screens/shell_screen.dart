import 'dart:ui';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';

import '../backup/backup.dart';
import '../i18n.dart';
import 'albums_tab.dart';
import 'library_tab.dart';
import 'people_tab.dart';
import 'places_tab.dart';

/// The signed-in app: four tabs under a floating tab bar.
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
  final _generation = [0, 0, 0, 0];
  late final AppLifecycleListener _lifecycle;

  @override
  void initState() {
    super.initState();
    _lifecycle = AppLifecycleListener(
      onResume: () {
        setState(() => _refresh(_tab));
        ref.read(backupProvider.notifier).start();
      },
    );
  }

  @override
  void dispose() {
    _lifecycle.dispose();
    super.dispose();
  }

  void _refresh(int tab) {
    if (tab == 1 || tab == 2) _generation[tab]++;
  }

  @override
  Widget build(BuildContext context) {
    const tabs = [LibraryTab(), AlbumsTab(), PeopleTab(), PlacesTab()];
    return Scaffold(
      extendBody: true,
      body: IndexedStack(
        index: _tab,
        // Tabs are built the first time they are opened, then kept.
        children: [
          for (var i = 0; i < tabs.length; i++)
            _visited.contains(i)
                ? KeyedSubtree(key: ValueKey('$i-${_generation[i]}'), child: tabs[i])
                : const SizedBox(),
        ],
      ),
      bottomNavigationBar: _TabBar(
        index: _tab,
        onTap: (i) => setState(() {
          if (i != _tab && _visited.contains(i)) _refresh(i);
          _tab = i;
          _visited.add(i);
        }),
      ),
    );
  }
}

class _TabBar extends StatelessWidget {
  const _TabBar({required this.index, required this.onTap});

  final int index;
  final ValueChanged<int> onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final items = [
      (Icons.photo_library_outlined, Icons.photo_library, t('图库')),
      (Icons.photo_album_outlined, Icons.photo_album, t('相册')),
      (Icons.people_outline, Icons.people, t('人物')),
      (Icons.place_outlined, Icons.place, t('足迹')),
    ];
    return SafeArea(
      minimum: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(32),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
            child: Container(
              height: 64,
              decoration: BoxDecoration(
                color: scheme.surfaceContainer.withValues(alpha: 0.85),
                borderRadius: BorderRadius.circular(32),
                border: Border.all(color: scheme.outlineVariant.withValues(alpha: 0.4)),
              ),
              child: Row(
                children: [
                  for (var i = 0; i < items.length; i++)
                    Expanded(
                      child: InkWell(
                        borderRadius: BorderRadius.circular(32),
                        onTap: () => onTap(i),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              i == index ? items[i].$2 : items[i].$1,
                              color: i == index ? scheme.primary : scheme.onSurfaceVariant,
                            ),
                            const SizedBox(height: 2),
                            Text(
                              items[i].$3,
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: i == index ? FontWeight.w600 : FontWeight.w500,
                                color: i == index ? scheme.primary : scheme.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
