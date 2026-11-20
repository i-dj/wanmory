import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:material_ui/material_ui.dart';

import '../api/client.dart';
import '../api/models.dart';
import '../auth/auth.dart';
import '../i18n.dart';
import '../people/age.dart';
import '../widgets/thumb.dart';
import '../widgets/timeline.dart';
import 'people_tab.dart';
import 'timeline_screen.dart';
import 'viewer_screen.dart';

/// A person's page, like the web's: the face, name, age and birthday at the top, then four tabs —
/// Photos (their timeline), Growth (by age, or by year without a birthday), Places (the cities
/// they were photographed in) and Together (the people often in the same photos).
class PersonScreen extends ConsumerStatefulWidget {
  const PersonScreen({super.key, required this.person});

  final Person person;

  @override
  ConsumerState<PersonScreen> createState() => _PersonScreenState();
}

enum _Tab { photos, growth, places, together }

class _PersonScreenState extends ConsumerState<PersonScreen> {
  late Person _person = widget.person;
  _Tab _tab = _Tab.photos;
  final _scroll = ScrollController();
  late final TimelineController _timeline;

  List<Moment>? _moments;
  List<Companion>? _companions;
  List<Asset>? _assets; // all of their photos, for Places
  Object? _error;

  ApiClient get _api => ref.read(authProvider).api!;

  String get _name => _person.name.isEmpty ? t('（没填名字）') : _person.name;

  @override
  void initState() {
    super.initState();
    _timeline = TimelineController(
      _api,
      AssetFilter(person: _person.id),
      onUnauthorized: () => ref.read(authProvider.notifier).sessionExpired(),
    )..addListener(() => setState(() {}));
    _scroll.addListener(() {
      if (_tab == _Tab.photos && _scroll.position.extentAfter < 2000) _timeline.loadMore();
    });
    _timeline.loadMore();
    _loadProfile();
  }

  @override
  void dispose() {
    _scroll.dispose();
    _timeline.dispose();
    super.dispose();
  }

  Future<void> _loadProfile() async {
    try {
      final p = await _api.profile(_person.id);
      if (!mounted) return;
      setState(() {
        _moments = p.moments;
        _companions = p.companions;
      });
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e);
    }
  }

  /// Every photo of the person (for grouping by city), a page at a time.
  Future<void> _loadAssets() async {
    if (_assets != null) return;
    final all = <Asset>[];
    String? cursor;
    try {
      do {
        final page = await _api.assets(
          cursor: cursor,
          limit: 500,
          filter: AssetFilter(person: _person.id),
        );
        all.addAll(page.items);
        cursor = page.nextCursor;
      } while (cursor != null && all.length < 10000);
      if (mounted) setState(() => _assets = all);
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e);
    }
  }

  void _select(_Tab tab) {
    setState(() => _tab = tab);
    if (tab == _Tab.places) _loadAssets();
  }

  Future<void> _editBirthday() async {
    final current = _person.birthday;
    if (current != null) {
      final action = await showModalBottomSheet<String>(
        context: context,
        showDragHandle: true,
        builder: (context) => SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.cake_outlined),
                title: Text(t('修改生日')),
                onTap: () => Navigator.pop(context, 'edit'),
              ),
              ListTile(
                leading: const Icon(Icons.delete_outline),
                title: Text(t('去掉生日')),
                onTap: () => Navigator.pop(context, 'remove'),
              ),
            ],
          ),
        ),
      );
      if (action == null) return;
      if (action == 'remove') return _saveBirthday(null);
    }
    if (!mounted) return;
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: current == null ? DateTime(now.year - 30) : parseDay(current),
      firstDate: DateTime(1900),
      lastDate: now,
      helpText: t('设置生日'),
    );
    if (picked == null) return;
    String two(int n) => n.toString().padLeft(2, '0');
    await _saveBirthday('${picked.year}-${two(picked.month)}-${two(picked.day)}');
  }

  Future<void> _saveBirthday(String? b) async {
    try {
      await _api.setBirthday(_person.id, b);
      setState(() => _person = _person.withBirthday(b));
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(t(e.message))));
    }
  }

  void _openPhotos(String title, AssetFilter filter) => Navigator.of(context).push(
    MaterialPageRoute<void>(
      builder: (_) => TimelineScreen(title: title, filter: filter),
    ),
  );

  void _openViewer(List<Asset> assets, int i) => context.push('/photo', extra: ViewerArgs(assets, i));

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () async {
          setState(() {
            _moments = null;
            _companions = null;
            _assets = null;
          });
          await Future.wait([_timeline.reload(), _loadProfile()]);
          if (_tab == _Tab.places) await _loadAssets();
        },
        child: CustomScrollView(
          controller: _scroll,
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            SliverToBoxAdapter(child: SafeArea(bottom: false, child: _header(context))),
            SliverToBoxAdapter(child: _tabs(context)),
            ..._content(context),
            SliverToBoxAdapter(child: SizedBox(height: MediaQuery.paddingOf(context).bottom + 24)),
          ],
        ),
      ),
    );
  }

  Widget _header(BuildContext context) {
    final theme = Theme.of(context);
    final muted = theme.colorScheme.onSurfaceVariant;
    final dated = _moments?.where((m) => m.dated).toList() ?? [];
    final years = dated.isEmpty
        ? null
        : (dated.first.taken.year == dated.last.taken.year
              ? '${dated.first.taken.year}'
              : '${dated.first.taken.year}–${dated.last.taken.year}');
    final age = _person.birthday == null ? '' : ageNow(_person.birthday!);
    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 4, 16, 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          const BackButton(),
          CircleAvatar(
            radius: 32,
            backgroundColor: theme.colorScheme.surfaceContainerHighest,
            backgroundImage: _person.cover == null
                ? null
                : CachedNetworkImageProvider(
                    _api.facePortraitUrl(_person.cover!),
                    cacheKey: '${_api.baseUrl}/face/${_person.cover}',
                    headers: _api.authHeaders,
                  ),
            child: _person.cover == null ? Icon(Icons.person, color: muted) : null,
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text.rich(
                  TextSpan(
                    children: [
                      TextSpan(
                        text: _name,
                        style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800),
                      ),
                      if (age.isNotEmpty)
                        TextSpan(
                          text: '  $age',
                          style: theme.textTheme.titleMedium?.copyWith(color: muted),
                        ),
                    ],
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Wrap(
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: [
                    Text(
                      [
                        ?years,
                        t('{n} 张照片', {'n': _person.assets}),
                      ].join(' · '),
                      style: theme.textTheme.bodyMedium?.copyWith(color: muted),
                    ),
                    Text(' · ', style: theme.textTheme.bodyMedium?.copyWith(color: muted)),
                    GestureDetector(
                      onTap: _editBirthday,
                      child: Text(
                        _person.birthday == null ? t('设置生日') : t('修改生日'),
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.colorScheme.primary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// Photos | Growth | Places | Together, as a segmented pill like the web.
  Widget _tabs(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final labels = {_Tab.photos: t('照片'), _Tab.growth: t('成长'), _Tab.places: t('足迹'), _Tab.together: t('合影')};
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 14),
      child: Container(
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: scheme.surfaceContainerHighest.withValues(alpha: 0.6),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Row(
          children: [
            for (final tab in _Tab.values)
              Expanded(
                child: GestureDetector(
                  behavior: HitTestBehavior.opaque,
                  onTap: () => _select(tab),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    decoration: BoxDecoration(
                      color: tab == _tab ? scheme.surface : Colors.transparent,
                      borderRadius: BorderRadius.circular(10),
                      boxShadow: tab == _tab
                          ? [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.08),
                                blurRadius: 6,
                                offset: const Offset(0, 2),
                              ),
                            ]
                          : null,
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      labels[tab]!,
                      style: TextStyle(
                        fontWeight: tab == _tab ? FontWeight.w700 : FontWeight.w500,
                        color: tab == _tab ? scheme.onSurface : scheme.onSurfaceVariant,
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  List<Widget> _content(BuildContext context) {
    if (_error != null && _tab != _Tab.photos) return [SliverToBoxAdapter(child: LoadError(error: _error!))];
    switch (_tab) {
      case _Tab.photos:
        return timelineSlivers(
          context: context,
          controller: _timeline,
          zoom: Zoom.all,
          columns: 3,
          onOpen: _openViewer,
        );
      case _Tab.growth:
        return _growth(context);
      case _Tab.places:
        return _places(context);
      case _Tab.together:
        return _together(context);
    }
  }

  List<Widget> _growth(BuildContext context) {
    final moments = _moments;
    if (moments == null) return const [SliverToBoxAdapter(child: Loading())];
    final groups = groupByAge(moments, _person.birthday);
    final theme = Theme.of(context);
    return [
      if (_person.birthday == null)
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
            child: Material(
              color: theme.colorScheme.primaryContainer.withValues(alpha: 0.5),
              borderRadius: BorderRadius.circular(14),
              child: ListTile(
                leading: const Icon(Icons.cake_outlined),
                title: Text(t('设置生日')),
                subtitle: Text(t('设置后，「成长」按年龄分段：两岁前每个月，之后每半年、每年')),
                onTap: _editBirthday,
              ),
            ),
          ),
        ),
      if (groups.isEmpty)
        SliverToBoxAdapter(
          child: Empty(icon: Icons.child_care_outlined, text: t('这些照片里没有拍摄时间')),
        ),
      SliverPadding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        sliver: SliverGrid.builder(
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            mainAxisSpacing: 14,
            crossAxisSpacing: 10,
            childAspectRatio: 0.62,
          ),
          itemCount: groups.length,
          itemBuilder: (context, i) {
            final g = groups[i];
            return _FaceCard(
              api: _api,
              face: g.best.face,
              title: g.label,
              subtitle: t('{n} 项', {'n': g.moments.length}),
              onTap: () =>
                  _openPhotos('$_name · ${g.label}', AssetFilter(person: _person.id, from: g.from, to: g.to)),
            );
          },
        ),
      ),
    ];
  }

  List<Widget> _places(BuildContext context) {
    final assets = _assets;
    if (assets == null) return const [SliverToBoxAdapter(child: Loading())];
    // Group by city, the cities with most photos first
    final byCity = <String, List<Asset>>{};
    for (final a in assets) {
      final g = a.geo;
      if (g == null) continue;
      byCity.putIfAbsent('${g.city}|${g.country}', () => []).add(a);
    }
    final cities = byCity.values.toList()..sort((a, b) => b.length.compareTo(a.length));
    if (cities.isEmpty) {
      return [
        SliverToBoxAdapter(
          child: Empty(icon: Icons.map_outlined, text: t('这些照片里没有位置信息')),
        ),
      ];
    }
    final theme = Theme.of(context);
    return [
      SliverPadding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        sliver: SliverGrid.builder(
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 0.95,
          ),
          itemCount: cities.length,
          itemBuilder: (context, i) {
            final list = cities[i];
            final g = list.first.geo!;
            final first = list.map((a) => a.sortTime.year).reduce((a, b) => a < b ? a : b);
            final last = list.map((a) => a.sortTime.year).reduce((a, b) => a > b ? a : b);
            return ClipRRect(
              borderRadius: BorderRadius.circular(18),
              child: Stack(
                fit: StackFit.expand,
                children: [
                  AssetThumb(asset: list.first, api: _api, compact: true, onTap: () => _openViewer(list, 0)),
                  const IgnorePointer(
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          stops: [0.4, 1],
                          colors: [Colors.transparent, Color(0xB3000000)],
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    left: 12,
                    right: 12,
                    bottom: 10,
                    child: IgnorePointer(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            // The flag (outside Chinese) right after the city
                            [g.localCity, ?g.localCountry].join(' '),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: theme.textTheme.titleMedium?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          Text(
                            [
                              t('{n} 项', {'n': list.length}),
                              first == last ? '$first' : '$first–$last',
                            ].join(' · '),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: theme.textTheme.bodySmall?.copyWith(color: Colors.white70),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    ];
  }

  List<Widget> _together(BuildContext context) {
    final people = _companions;
    if (people == null) return const [SliverToBoxAdapter(child: Loading())];
    if (people.isEmpty) {
      return [
        SliverToBoxAdapter(
          child: Empty(icon: Icons.group_outlined, text: t('还没有和别人的合影')),
        ),
      ];
    }
    return [
      SliverToBoxAdapter(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
          child: Text(
            t('常和{name}一起出现在照片里的人，点一下看合影。', {'name': _name}),
            style: Theme.of(context).textTheme.bodyMedium
                ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
          ),
        ),
      ),
      SliverPadding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        sliver: SliverGrid.builder(
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            mainAxisSpacing: 14,
            crossAxisSpacing: 10,
            childAspectRatio: 0.62,
          ),
          itemCount: people.length,
          itemBuilder: (context, i) {
            final c = people[i];
            final other = c.name.isEmpty ? t('（没填名字）') : c.name;
            return _FaceCard(
              api: _api,
              face: c.cover,
              title: other,
              subtitle: t('{n} 张合影', {'n': c.shared}),
              onTap: () => _openPhotos(
                t('{a} 和 {b}', {'a': _name, 'b': other}),
                AssetFilter(person: _person.id, withPerson: c.id),
              ),
            );
          },
        ),
      ),
    ];
  }
}

/// A portrait of a face with a title and a line under it (Growth and Together).
class _FaceCard extends StatelessWidget {
  const _FaceCard({
    required this.api,
    required this.face,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final ApiClient api;
  final String? face;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return GestureDetector(
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Container(
                width: double.infinity,
                color: theme.colorScheme.surfaceContainerHighest,
                child: face == null
                    ? Icon(Icons.person, size: 36, color: theme.colorScheme.onSurfaceVariant)
                    : CachedNetworkImage(
                        imageUrl: api.facePortraitUrl(face!),
                        cacheKey: '${api.baseUrl}/face/$face',
                        httpHeaders: api.authHeaders,
                        fit: BoxFit.cover,
                      ),
              ),
            ),
          ),
          const SizedBox(height: 6),
          Text(title, maxLines: 1, overflow: TextOverflow.ellipsis, style: theme.textTheme.titleSmall),
          Text(
            subtitle,
            maxLines: 1,
            style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
          ),
        ],
      ),
    );
  }
}
