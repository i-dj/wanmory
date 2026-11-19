import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:material_ui/material_ui.dart';

import '../api/models.dart';
import '../auth/auth.dart';
import '../i18n.dart';
import '../widgets/timeline.dart';
import 'viewer_screen.dart';

/// Search photos by what is in them ("beach sunset"), using the server's CLIP search.
class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final _text = TextEditingController();
  TimelineController? _results;

  @override
  void dispose() {
    _text.dispose();
    _results?.dispose();
    super.dispose();
  }

  void _search(String q) {
    q = q.trim();
    if (q.isEmpty) return;
    final filter = AssetFilter(q: q);
    if (_results == null) {
      _results = TimelineController(
        ref.read(authProvider).api!,
        filter,
        onUnauthorized: () => ref.read(authProvider.notifier).sessionExpired(),
      )..addListener(() => setState(() {}));
      _results!.loadMore();
    } else {
      _results!.reload(filter);
    }
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final results = _results;
    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: TextField(
          controller: _text,
          autofocus: true,
          textInputAction: TextInputAction.search,
          onSubmitted: _search,
          decoration: InputDecoration(hintText: t('搜索照片'), border: InputBorder.none),
        ),
      ),
      body: results == null
          ? const SizedBox.shrink()
          : CustomScrollView(
              slivers: [
                ...timelineSlivers(
                  context: context,
                  controller: results,
                  zoom: Zoom.flat,
                  onOpen: (assets, i) => context.push('/photo', extra: ViewerArgs(assets, i)),
                ),
              ],
            ),
    );
  }
}
