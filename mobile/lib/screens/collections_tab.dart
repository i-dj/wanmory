import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:material_ui/material_ui.dart';

import '../api/client.dart';
import '../api/models.dart';
import '../auth/auth.dart';
import '../i18n.dart';
import 'people_tab.dart';
import 'places_tab.dart';
import 'timeline_screen.dart';

/// Collections: everything that isn't the timeline or an album, as cards with a cover photo,
/// like the Collections of the Photos apps. People and Places first, then Favorites, Videos and
/// Recently added, then the categories the AI sorted photos into (empty ones are left out).
class CollectionsTab extends ConsumerStatefulWidget {
  const CollectionsTab({super.key});

  @override
  ConsumerState<CollectionsTab> createState() => _CollectionsTabState();
}

/// One card: what it opens and the filter its cover and count come from.
class _Collection {
  const _Collection(this.key, this.title, this.icon, {this.filter, this.open});

  final String key;
  final String title;
  final IconData icon;
  final AssetFilter? filter;

  /// Opens something other than a timeline (People, Places).
  final Widget Function()? open;
}

/// The cover photo and the count shown on a card.
class _Cover {
  const _Cover({this.asset, this.face, this.count = 0});

  final String? asset;
  final String? face;
  final int count;
}

class _CollectionsTabState extends ConsumerState<CollectionsTab> {
  Map<String, _Cover>? _covers;
  Object? _error;

  // Same categories (and keys) as the web's menu, see web/src/lib/views.ts.
  static final _categories = [
    _Collection('scenery', t('风景'), Icons.landscape_outlined, filter: const AssetFilter(tag: 'scenery')),
    _Collection('food', t('美食'), Icons.restaurant_outlined, filter: const AssetFilter(tag: 'food')),
    _Collection('pet', t('动物'), Icons.pets_outlined, filter: const AssetFilter(tag: 'pet')),
    _Collection('plant', t('植物'), Icons.local_florist_outlined, filter: const AssetFilter(tag: 'plant')),
    _Collection(
      'screenshot',
      t('截图'),
      Icons.screenshot_outlined,
      filter: const AssetFilter(tag: 'screenshot'),
    ),
    _Collection('document', t('文档'), Icons.description_outlined, filter: const AssetFilter(tag: 'document')),
    _Collection('id', t('证件'), Icons.badge_outlined, filter: const AssetFilter(tag: 'id')),
  ];

  static final _pinned = [
    _Collection('people', t('人物'), Icons.people_outline, open: () => const PeopleTab()),
    _Collection('places', t('足迹'), Icons.map_outlined, open: () => const PlacesTab()),
    _Collection('favorites', t('收藏'), Icons.favorite_outline, filter: const AssetFilter(favorite: true)),
    _Collection('videos', t('视频'), Icons.videocam_outlined, filter: const AssetFilter(kind: 'video')),
    _Collection('recent', t('最近添加'), Icons.schedule_outlined, filter: const AssetFilter(recent: true)),
  ];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final api = ref.read(authProvider).api!;
    try {
      final covers = <String, _Cover>{};
      Future<void> fill(_Collection c) async {
        final f = c.filter;
        if (f == null) return;
        final results = await Future.wait([api.summary(filter: f), api.assets(limit: 1, filter: f)]);
        final sum = results[0] as Summary;
        final page = results[1] as AssetPage;
        covers[c.key] = _Cover(
          asset: page.items.isEmpty ? null : page.items.first.id,
          count: sum.photos + sum.videos,
        );
      }

      Future<void> people() async {
        final list = await api.people();
        covers['people'] = _Cover(face: list.isEmpty ? null : list.first.cover, count: list.length);
      }

      await Future.wait([
        for (final c in [..._pinned, ..._categories]) fill(c),
        people(),
      ]);
      if (mounted) {
        setState(() {
          _covers = covers;
          _error = null;
        });
      }
    } on ApiException catch (e) {
      if (e.unauthorized) await ref.read(authProvider.notifier).sessionExpired();
      if (mounted) setState(() => _error = e);
    }
  }

  void _open(_Collection c) {
    final open = c.open;
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) =>
            open != null ? Scaffold(body: open()) : TimelineScreen(title: c.title, filter: c.filter!),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final covers = _covers;
    final categories = _categories.where((c) => (covers?[c.key]?.count ?? 0) > 0).toList();
    return TabPage(
      title: t('合集'),
      onRefresh: _load,
      child: _error != null
          ? SliverToBoxAdapter(child: LoadError(error: _error!))
          : covers == null
          ? const SliverToBoxAdapter(child: Loading())
          : SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              sliver: SliverList.list(
                children: [
                  // People and Places side by side, a bit taller
                  Row(
                    children: [
                      for (final c in _pinned.take(2)) ...[
                        if (c != _pinned.first) const SizedBox(width: 12),
                        Expanded(
                          child: _Card(
                            collection: c,
                            cover: covers[c.key],
                            aspect: 0.9,
                            onTap: () => _open(c),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 12),
                  GridView.count(
                    crossAxisCount: 3,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    padding: EdgeInsets.zero,
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                    childAspectRatio: 0.82,
                    children: [
                      for (final c in _pinned.skip(2))
                        _Card(collection: c, cover: covers[c.key], small: true, onTap: () => _open(c)),
                    ],
                  ),
                  if (categories.isNotEmpty) ...[
                    Padding(
                      padding: const EdgeInsets.fromLTRB(4, 28, 4, 12),
                      child: Text(
                        t('分类'),
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
                      ),
                    ),
                    GridView.count(
                      crossAxisCount: 2,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      padding: EdgeInsets.zero,
                      mainAxisSpacing: 12,
                      crossAxisSpacing: 12,
                      childAspectRatio: 1.25,
                      children: [
                        for (final c in categories)
                          _Card(collection: c, cover: covers[c.key], onTap: () => _open(c)),
                      ],
                    ),
                  ],
                ],
              ),
            ),
    );
  }
}

/// A rounded card: the cover photo (or a tinted icon while there is none) with a soft dark
/// gradient at the bottom, the name and the count in white.
class _Card extends ConsumerWidget {
  const _Card({
    required this.collection,
    required this.cover,
    required this.onTap,
    this.aspect,
    this.small = false,
  });

  final _Collection collection;
  final _Cover? cover;
  final VoidCallback onTap;
  final double? aspect;
  final bool small;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final api = ref.watch(authProvider).api!;
    final scheme = Theme.of(context).colorScheme;
    final count = cover?.count ?? 0;
    final image = _image(api, scheme);
    final card = ClipRRect(
      borderRadius: BorderRadius.circular(small ? 16 : 20),
      child: Material(
        color: scheme.surfaceContainerHighest,
        child: InkWell(
          onTap: onTap,
          child: Stack(
            fit: StackFit.expand,
            children: [
              ?image,
              if (image == null)
                Center(
                  child: Icon(collection.icon, size: small ? 30 : 40, color: scheme.primary),
                ),
              if (image != null)
                const DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      stops: [0.45, 1],
                      colors: [Colors.transparent, Color(0xB3000000)],
                    ),
                  ),
                ),
              Positioned(
                left: small ? 10 : 14,
                right: small ? 10 : 14,
                bottom: small ? 9 : 12,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      children: [
                        // Small cards need the room for the name
                        if (!small) ...[
                          Icon(
                            collection.icon,
                            size: 16,
                            color: image != null ? Colors.white : scheme.onSurface,
                          ),
                          const SizedBox(width: 5),
                        ],
                        Expanded(
                          child: Text(
                            collection.title,
                            maxLines: small ? 2 : 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              color: image != null ? Colors.white : scheme.onSurface,
                              fontWeight: FontWeight.w700,
                              fontSize: small ? 14 : 17,
                            ),
                          ),
                        ),
                      ],
                    ),
                    if (count > 0)
                      Text(
                        NumberFormat.decimalPattern(currentLocale.replaceAll('-', '_')).format(count),
                        style: TextStyle(
                          color: image != null ? Colors.white70 : scheme.onSurfaceVariant,
                          fontSize: small ? 12 : 13,
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
    return aspect == null ? card : AspectRatio(aspectRatio: aspect!, child: card);
  }

  Widget? _image(ApiClient api, ColorScheme scheme) {
    final c = cover;
    if (c?.face != null) {
      return CachedNetworkImage(
        imageUrl: api.facePortraitUrl(c!.face!),
        cacheKey: '${api.baseUrl}/face/${c.face}',
        httpHeaders: api.authHeaders,
        fit: BoxFit.cover,
        errorWidget: (_, _, _) => const SizedBox(),
      );
    }
    if (c?.asset != null) {
      return CachedNetworkImage(
        imageUrl: api.previewUrl(c!.asset!),
        cacheKey: '${api.baseUrl}/preview/${c.asset}',
        httpHeaders: api.authHeaders,
        fit: BoxFit.cover,
        placeholder: (_, _) => CachedNetworkImage(
          imageUrl: api.thumbnailUrl(c.asset!),
          cacheKey: '${api.baseUrl}/thumb/${c.asset}',
          httpHeaders: api.authHeaders,
          fit: BoxFit.cover,
        ),
        errorWidget: (_, _, _) => const SizedBox(),
      );
    }
    return null;
  }
}
