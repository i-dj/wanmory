import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:material_ui/material_ui.dart';

import '../api/client.dart';
import '../api/models.dart';
import '../auth/auth.dart';
import '../i18n.dart';
import '../widgets/pinch_columns.dart';
import '../widgets/timeline.dart';
import 'photo_picker_screen.dart';
import 'viewer_screen.dart';

/// A timeline with a filter: one person, one album.
class TimelineScreen extends ConsumerStatefulWidget {
  const TimelineScreen({super.key, required this.title, required this.filter, this.album});

  final String title;
  final AssetFilter filter;

  /// Set for an album page: offers "add photos" unless the album syncs by its rules.
  final Album? album;

  @override
  ConsumerState<TimelineScreen> createState() => _TimelineScreenState();
}

class _TimelineScreenState extends ConsumerState<TimelineScreen> {
  final _scroll = ScrollController();
  late final TimelineController _timeline;

  @override
  void initState() {
    super.initState();
    _timeline = TimelineController(
      ref.read(authProvider).api!,
      widget.filter,
      onUnauthorized: () => ref.read(authProvider.notifier).sessionExpired(),
    )..addListener(() => setState(() {}));
    _scroll.addListener(() {
      if (_scroll.position.extentAfter < 2000) _timeline.loadMore();
    });
    _timeline.loadMore();
  }

  @override
  void dispose() {
    _scroll.dispose();
    _timeline.dispose();
    super.dispose();
  }

  Future<void> _addPhotos() async {
    final album = widget.album!;
    final ids = await Navigator.of(context).push<List<String>>(
      MaterialPageRoute(
        builder: (_) => PhotoPickerScreen(filter: AssetFilter(notAlbum: album.id)),
      ),
    );
    if (ids == null || ids.isEmpty || !mounted) return;
    final messenger = ScaffoldMessenger.of(context);
    try {
      await ref.read(authProvider).api!.addToAlbum(album.id, ids);
      messenger.showSnackBar(SnackBar(content: Text(t('已添加 {n} 项', {'n': ids.length}))));
      await _timeline.reload();
    } on ApiException catch (e) {
      messenger.showSnackBar(SnackBar(content: Text(t(e.message))));
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    body: RefreshIndicator(
      onRefresh: _timeline.reload,
      child: PinchColumns(
        controller: _scroll,
        builder: (context, columns, physics) => CustomScrollView(
          controller: _scroll,
          physics: physics,
          slivers: [
            SliverAppBar.medium(
              title: Text(widget.title),
              actions: [
                if (widget.album != null && !widget.album!.synced)
                  IconButton(
                    tooltip: t('添加照片'),
                    onPressed: _addPhotos,
                    icon: const Icon(Icons.add_photo_alternate_outlined),
                  ),
              ],
            ),
            ...timelineSlivers(
              context: context,
              controller: _timeline,
              zoom: Zoom.all,
              columns: columns,
              onOpen: (assets, i) => context.push('/photo', extra: ViewerArgs(assets, i)),
            ),
            SliverToBoxAdapter(child: SizedBox(height: MediaQuery.paddingOf(context).bottom + 16)),
          ],
        ),
      ),
    ),
  );
}
