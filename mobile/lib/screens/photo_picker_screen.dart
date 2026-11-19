import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';

import '../api/models.dart';
import '../auth/auth.dart';
import '../i18n.dart';
import '../widgets/timeline.dart';

/// Pick photos from the library, for example to add to an album. Pops with the chosen IDs.
class PhotoPickerScreen extends ConsumerStatefulWidget {
  const PhotoPickerScreen({super.key, this.filter = const AssetFilter()});

  /// Usually `AssetFilter(notAlbum: id)`, so photos already in the album are not offered.
  final AssetFilter filter;

  @override
  ConsumerState<PhotoPickerScreen> createState() => _PhotoPickerScreenState();
}

class _PhotoPickerScreenState extends ConsumerState<PhotoPickerScreen> {
  final _scroll = ScrollController();
  late final TimelineController _timeline;
  final Set<String> _selected = {};

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

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: Text(_selected.isEmpty ? t('添加照片') : t('已选 {n} 项', {'n': _selected.length})),
      actions: [
        Padding(
          padding: const EdgeInsets.only(right: 12),
          child: FilledButton(
            onPressed: _selected.isEmpty ? null : () => Navigator.pop(context, _selected.toList()),
            child: Text(t('添加')),
          ),
        ),
      ],
    ),
    body: CustomScrollView(
      controller: _scroll,
      slivers: [
        ...timelineSlivers(
          context: context,
          controller: _timeline,
          zoom: Zoom.day,
          selected: _selected,
          onOpen: (assets, i) => setState(() {
            final id = assets[i].id;
            if (!_selected.remove(id)) _selected.add(id);
          }),
        ),
        SliverToBoxAdapter(child: SizedBox(height: MediaQuery.paddingOf(context).bottom + 16)),
      ],
    ),
  );
}
