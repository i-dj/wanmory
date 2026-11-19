import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';

import '../api/models.dart';
import '../auth/auth.dart';

/// What the /photo route opens.
class ViewerArgs {
  const ViewerArgs(this.assets, this.index);

  final List<Asset> assets;
  final int index;
}

/// Full-screen preview; swipe between photos, pinch to zoom.
class ViewerScreen extends ConsumerStatefulWidget {
  const ViewerScreen({super.key, required this.assets, required this.initialIndex});

  final List<Asset> assets;
  final int initialIndex;

  @override
  ConsumerState<ViewerScreen> createState() => _ViewerScreenState();
}

class _ViewerScreenState extends ConsumerState<ViewerScreen> {
  late final PageController _pages = PageController(initialPage: widget.initialIndex);

  @override
  void dispose() {
    _pages.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final api = ref.watch(authProvider).api!;
    return Scaffold(
      backgroundColor: Colors.black,
      extendBodyBehindAppBar: true,
      appBar: AppBar(backgroundColor: Colors.transparent, foregroundColor: Colors.white),
      body: PageView.builder(
        controller: _pages,
        itemCount: widget.assets.length,
        itemBuilder: (context, i) {
          final a = widget.assets[i];
          return InteractiveViewer(
            maxScale: 5,
            child: Center(
              child: Stack(
                alignment: Alignment.center,
                children: [
                  CachedNetworkImage(
                    imageUrl: api.previewUrl(a.id),
                    cacheKey: '${api.baseUrl}/preview/${a.id}',
                    httpHeaders: api.authHeaders,
                    fit: BoxFit.contain,
                    // Show the cached thumbnail while the preview loads.
                    placeholder: (_, _) => CachedNetworkImage(
                      imageUrl: api.thumbnailUrl(a.id),
                      cacheKey: '${api.baseUrl}/thumb/${a.id}',
                      httpHeaders: api.authHeaders,
                      fit: BoxFit.contain,
                    ),
                    errorWidget: (_, _, _) =>
                        const Icon(Icons.broken_image_outlined, color: Colors.white54, size: 48),
                  ),
                  if (a.isVideo) const Icon(Icons.play_circle_outline, color: Colors.white70, size: 64),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
