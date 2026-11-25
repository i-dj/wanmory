import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';

import '../api/models.dart';
import '../auth/auth.dart';
import '../i18n.dart';
import 'create_album_screen.dart';
import '../widgets/glass.dart';
import 'people_tab.dart';
import 'timeline_screen.dart';

/// The albums the signed-in member can see.
class AlbumsTab extends ConsumerStatefulWidget {
  const AlbumsTab({super.key});

  @override
  ConsumerState<AlbumsTab> createState() => _AlbumsTabState();
}

class _AlbumsTabState extends ConsumerState<AlbumsTab> {
  late Future<List<Album>> _albums = ref.read(authProvider).api!.albums();

  void _open(Album a) => Navigator.of(context).push(
    MaterialPageRoute<void>(
      builder: (_) => TimelineScreen(
        title: a.name,
        filter: AssetFilter(album: a.id),
        album: a,
      ),
    ),
  );

  Future<void> _create() async {
    final existing = await _albums.catchError((_) => <Album>[]);
    if (!mounted) return;
    final album = await Navigator.of(context).push<Album>(
      MaterialPageRoute(fullscreenDialog: true, builder: (_) => CreateAlbumScreen(albums: existing)),
    );
    if (album == null || !mounted) return;
    setState(() {
      _albums = ref.read(authProvider).api!.albums();
    });
    _open(album);
  }

  @override
  Widget build(BuildContext context) {
    final api = ref.watch(authProvider).api!;
    final theme = Theme.of(context);
    return TabPage(
      title: t('相册'),
      action: GlassButton(icon: Icons.add, tooltip: t('新建相册'), onPressed: _create),
      onRefresh: () async {
        setState(() {
          _albums = api.albums();
        });
        await _albums;
      },
      child: FutureBuilder<List<Album>>(
        future: _albums,
        builder: (context, snap) {
          if (snap.hasError) return SliverToBoxAdapter(child: LoadError(error: snap.error!));
          if (!snap.hasData) return const SliverToBoxAdapter(child: Loading());
          final albums = snap.data!;
          if (albums.isEmpty) {
            return SliverToBoxAdapter(
              child: Empty(icon: Icons.photo_album_outlined, text: t('还没有相册')),
            );
          }
          return SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            sliver: SliverGrid.builder(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: 16,
                crossAxisSpacing: 12,
                childAspectRatio: 0.8,
              ),
              itemCount: albums.length,
              itemBuilder: (context, i) {
                final a = albums[i];
                return GestureDetector(
                  onTap: () => _open(a),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(16),
                          child: Container(
                            width: double.infinity,
                            color: theme.colorScheme.surfaceContainerHighest,
                            child: a.cover == null
                                ? Icon(
                                    Icons.photo_album_outlined,
                                    size: 40,
                                    color: theme.colorScheme.onSurfaceVariant,
                                  )
                                : CachedNetworkImage(
                                    imageUrl: api.thumbnailUrl(a.cover!),
                                    cacheKey: '${api.baseUrl}/thumb/${a.cover}',
                                    httpHeaders: api.authHeaders,
                                    fit: BoxFit.cover,
                                  ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        a.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: theme.textTheme.titleSmall,
                      ),
                      Text(
                        t('{n} 项', {'n': a.count}),
                        style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                      ),
                    ],
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
