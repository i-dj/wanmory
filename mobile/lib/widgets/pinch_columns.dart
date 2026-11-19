import 'package:material_ui/material_ui.dart';

/// Column counts the photo grid steps through, from large to small thumbnails.
const columnSteps = [1, 3, 5, 7, 10];

/// Two-finger pinch to show fewer or more photos per row, like the iPhone Photos grid.
///
/// While pinching, the grid scales under the fingers; on release it settles to the next
/// column count (spread: bigger photos, pinch: more photos per row) and keeps roughly the
/// same scroll position. Scrolling is paused while two fingers are down.
class PinchColumns extends StatefulWidget {
  const PinchColumns({super.key, required this.controller, required this.builder, this.initial = 3});

  final ScrollController controller;
  final int initial;

  /// Builds the scroll view for a column count; [physics] stops scrolling during a pinch.
  final Widget Function(BuildContext context, int columns, ScrollPhysics physics) builder;

  @override
  State<PinchColumns> createState() => _PinchColumnsState();
}

class _PinchColumnsState extends State<PinchColumns> {
  late int _columns = widget.initial;
  final Map<int, Offset> _pointers = {};
  double? _startDistance;
  double _scale = 1;
  Offset _focal = Offset.zero;

  bool get _pinching => _startDistance != null;

  double _distance() {
    final p = _pointers.values.take(2).toList();
    return (p[0] - p[1]).distance;
  }

  void _down(PointerDownEvent e) {
    _pointers[e.pointer] = e.localPosition;
    if (_pointers.length == 2) {
      final p = _pointers.values.toList();
      setState(() {
        _startDistance = _distance();
        _focal = (p[0] + p[1]) / 2;
        _scale = 1;
      });
    }
  }

  void _move(PointerMoveEvent e) {
    if (!_pointers.containsKey(e.pointer)) return;
    _pointers[e.pointer] = e.localPosition;
    final start = _startDistance;
    if (start == null || start < 1 || _pointers.length < 2) return;
    setState(() => _scale = (_distance() / start).clamp(0.5, 2.0));
  }

  void _up(PointerEvent e) {
    _pointers.remove(e.pointer);
    if (!_pinching || _pointers.length >= 2) return;
    final i = columnSteps.indexOf(_columns);
    var next = i;
    if (_scale > 1.15 && i > 0) next = i - 1;
    if (_scale < 0.87 && i < columnSteps.length - 1) next = i + 1;
    setState(() {
      _startDistance = null;
      _scale = 1;
    });
    if (next != i) _setColumns(columnSteps[next]);
  }

  /// Switches the column count, keeping the same share of the timeline scrolled past.
  void _setColumns(int columns) {
    final c = widget.controller;
    final ratio = c.hasClients && c.position.maxScrollExtent > 0
        ? c.offset / c.position.maxScrollExtent
        : 0.0;
    setState(() => _columns = columns);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (c.hasClients && ratio > 0) {
        c.jumpTo((ratio * c.position.maxScrollExtent).clamp(0, c.position.maxScrollExtent));
      }
    });
  }

  @override
  Widget build(BuildContext context) => LayoutBuilder(
    builder: (context, box) {
      final w = box.maxWidth == 0 ? 1 : box.maxWidth;
      final h = box.maxHeight == 0 ? 1 : box.maxHeight;
      return Listener(
        onPointerDown: _down,
        onPointerMove: _move,
        onPointerUp: _up,
        onPointerCancel: _up,
        child: ClipRect(
          child: Transform.scale(
            scale: _scale,
            alignment: Alignment(_focal.dx / w * 2 - 1, _focal.dy / h * 2 - 1),
            child: widget.builder(
              context,
              _columns,
              _pinching ? const NeverScrollableScrollPhysics() : const AlwaysScrollableScrollPhysics(),
            ),
          ),
        ),
      );
    },
  );
}
