import 'dart:ui';

import 'package:intl/intl.dart';
import 'package:material_ui/material_ui.dart';

import '../i18n.dart';
import 'glass.dart';

/// Photo counts per month for the whole (filtered) library, newest first, as an index:
/// which month the n-th photo is in, and where each month starts.
class MonthIndex {
  MonthIndex(this.months) {
    var n = 0;
    for (final (_, count) in months) {
      _starts.add(n);
      n += count;
    }
    total = n;
  }

  final List<(DateTime, int)> months;
  final List<int> _starts = [];
  late final int total;

  bool get isEmpty => total == 0;

  /// Month of photo number [index] (0 is the newest).
  int monthOf(int index) {
    var lo = 0, hi = _starts.length - 1;
    while (lo < hi) {
      final mid = (lo + hi + 1) ~/ 2;
      if (_starts[mid] <= index) {
        lo = mid;
      } else {
        hi = mid - 1;
      }
    }
    return lo;
  }

  /// Index of the newest photo of month [m].
  int startOf(int m) => _starts[m];

  DateTime dateOf(int m) => months[m].$1;
}

/// "五月" for this year, "2024年5月" otherwise; years alone for the year view.
String monthLabel(DateTime d, {bool yearOnly = false}) {
  final l = currentLocale.replaceAll('-', '_');
  if (yearOnly) return DateFormat.y(l).format(d);
  return d.year == DateTime.now().year ? DateFormat.MMMM(l).format(d) : DateFormat.yMMMM(l).format(d);
}

/// The scrubber on the right edge, like Google Photos: a tab flush against the edge of the
/// screen showing where you are in the whole library. It glides along as you scroll; dragging
/// it moves through time, with the month in a bubble and the years along the track.
class TimeScrubber extends StatefulWidget {
  const TimeScrubber({
    super.key,
    required this.index,
    required this.position,
    required this.visible,
    required this.onScrub,
    required this.onDragging,
  });

  final MonthIndex index;

  /// 0 (newest) – 1 (oldest): where the top of the screen is.
  final double position;
  final bool visible;

  /// Called while dragging with the photo index to jump to.
  final ValueChanged<int> onScrub;
  final ValueChanged<bool> onDragging;

  @override
  State<TimeScrubber> createState() => _TimeScrubberState();
}

class _TimeScrubberState extends State<TimeScrubber> {
  static const _handle = 52.0;
  double? _drag;

  int _indexAt(double f) => (f * (widget.index.total - 1)).round().clamp(0, widget.index.total - 1);

  void _update(double dy, double track) {
    final f = (dy / track).clamp(0.0, 1.0);
    setState(() => _drag = f);
    widget.onScrub(_indexAt(f));
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final dragging = _drag != null;
    final shown = widget.visible || dragging;
    return LayoutBuilder(
      builder: (context, box) {
        final track = (box.maxHeight - _handle).clamp(1.0, double.infinity);
        final f = (_drag ?? widget.position).clamp(0.0, 1.0);
        final y = f * track;
        final m = widget.index.monthOf(_indexAt(f));
        // Years along the track while dragging, skipping ones too close together.
        final years = <(double, int)>[];
        if (dragging) {
          int? last;
          for (var i = 0; i < widget.index.months.length; i++) {
            final year = widget.index.dateOf(i).year;
            if (year == last) continue;
            last = year;
            final at = widget.index.startOf(i) / widget.index.total * track + _handle / 2;
            if (years.isEmpty || at - years.last.$1 > 22) years.add((at, year));
          }
        }
        return IgnorePointer(
          ignoring: !shown,
          child: AnimatedOpacity(
            opacity: shown ? 1 : 0,
            duration: Duration(milliseconds: shown ? 120 : 400),
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                for (final (at, year) in years)
                  Positioned(
                    key: ValueKey(year),
                    right: 44,
                    top: at - 8,
                    child: Text(
                      '$year',
                      style: theme.textTheme.labelSmall?.copyWith(color: scheme.onSurfaceVariant),
                    ),
                  ),
                AnimatedPositioned(
                  // Keyed: the year labels inserted above it while dragging must not take over its
                  // element, or the drag gesture is lost halfway.
                  key: const ValueKey('handle'),
                  // Follows the finger at once while dragging; glides while scrolling
                  duration: Duration(milliseconds: dragging ? 0 : 180),
                  curve: Curves.easeOutCubic,
                  right: 0,
                  top: y,
                  child: GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onVerticalDragStart: (d) {
                      widget.onDragging(true);
                      _update(y + d.localPosition.dy - _handle / 2, track);
                    },
                    onVerticalDragUpdate: (d) => _update((_drag ?? f) * track + d.delta.dy, track),
                    onVerticalDragEnd: (_) {
                      setState(() => _drag = null);
                      widget.onDragging(false);
                    },
                    onVerticalDragCancel: () {
                      setState(() => _drag = null);
                      widget.onDragging(false);
                    },
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (dragging)
                          Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: Glass(
                              radius: 16,
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                              child: Text(
                                monthLabel(widget.index.dateOf(m)),
                                style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
                              ),
                            ),
                          ),
                        _EdgeTab(height: _handle, active: dragging),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

/// The handle: a frosted tab against the right edge of the screen, rounded on the left only.
class _EdgeTab extends StatelessWidget {
  const _EdgeTab({required this.height, required this.active});

  final double height;
  final bool active;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    const shape = BorderRadius.horizontal(left: Radius.circular(26));
    return AnimatedContainer(
      duration: const Duration(milliseconds: 150),
      width: active ? 40 : 34,
      height: height,
      decoration: BoxDecoration(
        borderRadius: shape,
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.18), blurRadius: 10, offset: const Offset(-2, 2)),
        ],
      ),
      child: ClipRRect(
        borderRadius: shape,
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
          child: ColoredBox(
            color: active ? scheme.primary : scheme.surfaceContainerHigh.withValues(alpha: 0.82),
            child: Icon(
              Icons.unfold_more_rounded,
              size: 22,
              color: active ? scheme.onPrimary : scheme.onSurface,
            ),
          ),
        ),
      ),
    );
  }
}
