import 'package:intl/intl.dart';
import 'package:material_ui/material_ui.dart';

import '../api/client.dart';
import '../api/models.dart';
import '../i18n.dart';
import 'thumb.dart';

/// How the timeline groups photos: the 年 / 月 / 日 / 所有照片 switch on the library page.
/// [flat] is for search results, which come ranked rather than by date.
enum Zoom { year, month, day, all, flat }

/// Loads a timeline page by page.
class TimelineController extends ChangeNotifier {
  TimelineController(this.api, this.filter, {this.onUnauthorized});

  ApiClient api;
  AssetFilter filter;
  final VoidCallback? onUnauthorized;

  final List<Asset> assets = [];
  String? _cursor;
  bool done = false;
  bool loading = false;
  String? error;
  int _generation = 0;

  Future<void> loadMore() async {
    if (loading || done) return;
    loading = true;
    error = null;
    notifyListeners();
    final gen = _generation;
    try {
      final page = await api.assets(cursor: _cursor, filter: filter);
      if (gen != _generation) return;
      assets.addAll(page.items);
      _cursor = page.nextCursor;
      done = page.nextCursor == null;
    } on ApiException catch (e) {
      if (gen != _generation) return;
      if (e.unauthorized) {
        onUnauthorized?.call();
      } else {
        error = e.message;
      }
    } finally {
      if (gen == _generation) {
        loading = false;
        notifyListeners();
      }
    }
  }

  /// Loads pages until at least [count] photos are loaded (or there are no more), for jumping
  /// far down the timeline.
  Future<void> loadUntil(int count) async {
    while (assets.length < count && !done && error == null) {
      if (loading) {
        await Future<void>.delayed(const Duration(milliseconds: 50));
        continue;
      }
      await loadMore();
    }
  }

  /// Starts over, for pull to refresh or a changed filter.
  Future<void> reload([AssetFilter? newFilter]) {
    _generation++;
    if (newFilter != null) filter = newFilter;
    assets.clear();
    _cursor = null;
    done = false;
    loading = false;
    error = null;
    return loadMore();
  }
}

class _Group {
  _Group(this.start);

  final DateTime start;
  final List<int> indexes = [];
  final Map<String, int> cities = {};
  final Map<String, int> countries = {};

  static List<String> _top(Map<String, int> m, int n) =>
      (m.entries.toList()..sort((a, b) => b.value.compareTo(a.value))).take(n).map((e) => e.key).toList();
}

int columnsFor(Zoom zoom, double width) {
  final base = switch (zoom) {
    Zoom.year => 7,
    Zoom.month => 5,
    Zoom.day => 4,
    Zoom.all || Zoom.flat => 3,
  };
  return width > 900
      ? base * 2
      : width > 600
      ? (base * 1.5).round()
      : base;
}

List<_Group> _groupsOf(List<Asset> assets, Zoom zoom) {
  final out = <_Group>[];
  for (var i = 0; i < assets.length; i++) {
    final a = assets[i];
    final d = a.sortTime;
    final start = switch (zoom) {
      Zoom.year => DateTime(d.year),
      Zoom.day => DateTime(d.year, d.month, d.day),
      _ => DateTime(d.year, d.month),
    };
    if (out.isEmpty || out.last.start != start) out.add(_Group(start));
    final g = out.last..indexes.add(i);
    final geo = a.geo;
    if (geo != null) {
      g.cities.update(geo.localCity, (n) => n + 1, ifAbsent: () => 1);
      final c = geo.localCountry;
      if (c != null) g.countries.update(c, (n) => n + 1, ifAbsent: () => 1);
    }
  }
  return out;
}

String _dateLabel(DateTime d, Zoom zoom) {
  final l = currentLocale.replaceAll('-', '_');
  return switch (zoom) {
    Zoom.year => DateFormat.y(l).format(d),
    Zoom.day => DateFormat.yMMMEd(l).format(d),
    _ => DateFormat.yMMMM(l).format(d),
  };
}

/// Height of a section header ("2024年5月 · 威尼斯"); fixed so positions can be calculated.
const sectionHeaderHeight = 54.0;
const _spacing = 2.0;

/// The grouping and photos per row for a pinch column count (wider screens get more per row).
(Zoom, int) resolveGrid(Zoom zoom, int? columns, double width) {
  if (columns == null) return (zoom, columnsFor(zoom, width));
  // Tiny thumbnails group by year, the rest by month.
  final z = zoom == Zoom.flat ? zoom : (columns >= 7 ? Zoom.year : Zoom.all);
  return (z, width > 600 ? (columns * 1.6).round() : columns);
}

/// Where each photo of a grouped timeline sits, measured from the top of the timeline.
/// Used for the floating month label and for jumping from the time scrubber.
class TimelineLayout {
  TimelineLayout(List<Asset> assets, {required Zoom zoom, required int columns, required double width})
    : _columns = columns,
      _cell = (width - (columns - 1) * _spacing) / columns,
      _groups = zoom == Zoom.flat ? [] : _groupsOf(assets, zoom) {
    var y = 0.0;
    for (final g in _groups) {
      _starts.add(y);
      final rows = (g.indexes.length / _columns).ceil();
      y += sectionHeaderHeight + rows * _cell + (rows > 0 ? (rows - 1) * _spacing : 0);
    }
    extent = y;
  }

  final int _columns;
  final double _cell;
  final List<_Group> _groups;
  final List<double> _starts = [];

  /// Total height of the loaded part.
  late final double extent;

  bool get isEmpty => _groups.isEmpty;

  int _groupAt(double y) {
    var lo = 0, hi = _starts.length - 1;
    while (lo < hi) {
      final mid = (lo + hi + 1) ~/ 2;
      if (_starts[mid] <= y) {
        lo = mid;
      } else {
        hi = mid - 1;
      }
    }
    return lo;
  }

  /// Index of the first photo in the row at [y], and the date of its section.
  (int index, DateTime section) at(double y) {
    final gi = _groupAt(y.clamp(0, double.infinity));
    final g = _groups[gi];
    final into = y - _starts[gi] - sectionHeaderHeight;
    final row = into <= 0 ? 0 : (into / (_cell + _spacing)).floor();
    final i = (row * _columns).clamp(0, g.indexes.length - 1);
    return (g.indexes[i], g.start);
  }

  /// A point of the timeline that survives a change of layout (another column count): the
  /// first photo of the row it is in, and how far into that row (negative: in the header above).
  ({int index, double frac}) anchorAt(double y) {
    final gi = _groupAt(y.clamp(0, double.infinity));
    final g = _groups[gi];
    final into = y - _starts[gi];
    if (into < sectionHeaderHeight) {
      return (index: g.indexes.first, frac: (into - sectionHeaderHeight) / sectionHeaderHeight);
    }
    final stride = _cell + _spacing;
    final row = ((into - sectionHeaderHeight) / stride).floor();
    final i = (row * _columns).clamp(0, g.indexes.length - 1);
    return (index: g.indexes[i], frac: ((into - sectionHeaderHeight) - row * stride) / stride);
  }

  /// Where an [anchorAt] point is in this layout.
  double yOf(({int index, double frac}) a) {
    for (var gi = 0; gi < _groups.length; gi++) {
      final g = _groups[gi];
      if (a.index > g.indexes.last) continue;
      final top = _starts[gi] + sectionHeaderHeight;
      final within = (a.index - g.indexes.first).clamp(0, g.indexes.length - 1);
      if (a.frac < 0) return top + a.frac * sectionHeaderHeight;
      return top + (within ~/ _columns) * (_cell + _spacing) + a.frac * (_cell + _spacing);
    }
    return extent;
  }

  /// Top of the section header above photo [index] if it starts its section, else of its row.
  double offsetOf(int index) {
    for (var gi = 0; gi < _groups.length; gi++) {
      final g = _groups[gi];
      if (index > g.indexes.last) continue;
      final within = (index - g.indexes.first).clamp(0, g.indexes.length - 1);
      final row = within ~/ _columns;
      return row == 0 ? _starts[gi] : _starts[gi] + sectionHeaderHeight + row * (_cell + _spacing);
    }
    return extent;
  }
}

/// The timeline as slivers, to put inside a CustomScrollView.
List<Widget> timelineSlivers({
  required BuildContext context,
  required TimelineController controller,
  required Zoom zoom,
  required void Function(List<Asset> assets, int index) onOpen,
  Set<String>? selected,
  int? columns,
}) {
  final theme = Theme.of(context);
  final (resolvedZoom, perRow) = resolveGrid(zoom, columns, MediaQuery.sizeOf(context).width);
  zoom = resolvedZoom;
  final assets = controller.assets;
  final api = controller.api;
  Widget grid(List<int> indexes) => SliverGrid.builder(
    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
      crossAxisCount: perRow,
      mainAxisSpacing: 2,
      crossAxisSpacing: 2,
    ),
    itemCount: indexes.length,
    itemBuilder: (context, i) => AssetThumb(
      asset: assets[indexes[i]],
      api: api,
      compact: perRow > 4,
      selected: selected?.contains(assets[indexes[i]].id),
      onTap: () => onOpen(List.of(assets), indexes[i]),
    ),
  );

  final slivers = <Widget>[];
  if (zoom == Zoom.flat) {
    slivers.add(grid([for (var i = 0; i < assets.length; i++) i]));
  } else {
    for (final g in _groupsOf(assets, zoom)) {
      final cities = _Group._top(g.cities, 2);
      final place = switch (cities.length) {
        0 => null,
        1 => cities.first,
        _ => t('{a}与{b}', {'a': cities[0], 'b': cities[1]}),
      };
      final title = zoom == Zoom.year || place == null
          ? _dateLabel(g.start, zoom)
          : '${_dateLabel(g.start, zoom)} · $place';
      // Not a photo count: only the loaded pages are known.
      final trailing = _Group._top(g.countries, 1).firstOrNull ?? '';
      slivers.add(
        SliverToBoxAdapter(
          child: Container(
            height: sectionHeaderHeight,
            alignment: Alignment.bottomLeft,
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Expanded(
                  child: Text(
                    title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                  ),
                ),
                if (trailing.isNotEmpty) ...[
                  const SizedBox(width: 12),
                  Text(
                    trailing,
                    style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                  ),
                ],
              ],
            ),
          ),
        ),
      );
      slivers.add(grid(g.indexes));
    }
  }
  slivers.add(SliverToBoxAdapter(child: TimelineFooter(controller: controller)));
  return slivers;
}

/// Loading spinner, error with retry, or the empty state below the timeline.
class TimelineFooter extends StatelessWidget {
  const TimelineFooter({super.key, required this.controller, this.empty});

  final TimelineController controller;
  final String? empty;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final c = controller;
    if (c.error != null) {
      return Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          children: [
            Text(
              t(c.error!),
              textAlign: TextAlign.center,
              style: TextStyle(color: theme.colorScheme.error),
            ),
            const SizedBox(height: 12),
            OutlinedButton(onPressed: c.loadMore, child: Text(t('重试'))),
          ],
        ),
      );
    }
    if (c.loading) {
      return const Padding(
        padding: EdgeInsets.all(32),
        child: Center(child: CircularProgressIndicator()),
      );
    }
    if (c.done && c.assets.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 80),
        child: Column(
          children: [
            Icon(Icons.photo_library_outlined, size: 56, color: theme.colorScheme.onSurfaceVariant),
            const SizedBox(height: 12),
            Text(empty ?? t('还没有照片'), style: theme.textTheme.titleMedium),
          ],
        ),
      );
    }
    return const SizedBox(height: 24);
  }
}
