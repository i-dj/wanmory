import 'package:cached_network_image/cached_network_image.dart';
import 'package:material_ui/material_ui.dart';

import '../api/client.dart';
import '../api/models.dart';

/// A square timeline cell: the thumbnail, a RAW badge, the video length and a heart for favorites.
class AssetThumb extends StatelessWidget {
  const AssetThumb({
    super.key,
    required this.asset,
    required this.api,
    required this.onTap,
    this.compact = false,
    this.selected,
  });

  final Asset asset;
  final ApiClient api;
  final VoidCallback onTap;

  /// Small cells (year and month views) leave out the badges.
  final bool compact;

  /// In a picker: whether this photo is ticked; null outside pickers.
  final bool? selected;

  static String duration(int ms) {
    final s = ms ~/ 1000;
    final m = s ~/ 60;
    return '$m:${(s % 60).toString().padLeft(2, '0')}';
  }

  static const _shadow = [Shadow(blurRadius: 4, color: Colors.black54)];

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final placeholder = ColoredBox(color: scheme.surfaceContainerHighest);
    final px = (MediaQuery.devicePixelRatioOf(context) * (compact ? 80 : 140)).round();
    return GestureDetector(
      onTap: onTap,
      child: Stack(
        fit: StackFit.expand,
        children: [
          if (asset.hasThumbnail)
            CachedNetworkImage(
              imageUrl: api.thumbnailUrl(asset.id),
              cacheKey: '${api.baseUrl}/thumb/${asset.id}',
              httpHeaders: api.authHeaders,
              memCacheWidth: px,
              fit: BoxFit.cover,
              fadeInDuration: const Duration(milliseconds: 120),
              placeholder: (_, _) => placeholder,
              errorWidget: (_, _, _) => Container(
                color: scheme.surfaceContainerHighest,
                child: Icon(Icons.broken_image_outlined, color: scheme.onSurfaceVariant),
              ),
            )
          else
            Container(
              color: scheme.surfaceContainerHighest,
              child: Icon(
                asset.isVideo ? Icons.movie_outlined : Icons.image_outlined,
                color: scheme.onSurfaceVariant,
              ),
            ),
          if (selected == true) ColoredBox(color: scheme.primary.withValues(alpha: 0.25)),
          if (selected != null)
            Positioned(
              right: 6,
              top: 6,
              child: Icon(
                selected! ? Icons.check_circle : Icons.radio_button_unchecked,
                color: selected! ? scheme.primary : Colors.white,
                shadows: _shadow,
              ),
            ),
          if (!compact && asset.isRaw)
            Positioned(
              left: 6,
              top: 6,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(color: Colors.black45, borderRadius: BorderRadius.circular(8)),
                child: const Text(
                  'RAW',
                  style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
                ),
              ),
            ),
          if (asset.isVideo)
            Positioned(
              right: 4,
              bottom: 4,
              child: compact
                  ? const Icon(Icons.play_arrow_rounded, size: 14, color: Colors.white, shadows: _shadow)
                  : Container(
                      padding: const EdgeInsets.fromLTRB(4, 2, 8, 2),
                      decoration: BoxDecoration(
                        color: Colors.black45,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.play_arrow_rounded, size: 15, color: Colors.white),
                          if (asset.durationMs != null)
                            Text(
                              duration(asset.durationMs!),
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                        ],
                      ),
                    ),
            )
          else if (asset.favorite)
            const Positioned(
              right: 6,
              bottom: 6,
              child: Icon(Icons.favorite, size: 16, color: Colors.white, shadows: _shadow),
            ),
        ],
      ),
    );
  }
}
