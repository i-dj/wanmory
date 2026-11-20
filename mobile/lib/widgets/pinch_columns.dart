import 'dart:math' as math;

import 'package:material_ui/material_ui.dart';

/// Column counts the photo grid settles on, from large to small thumbnails.
const columnSteps = [1, 3, 5, 7, 10];

/// Two-finger pinch to show fewer or more photos per row, like the Photos app: while the
/// fingers move, the grid lays itself out again (spread: bigger photos, pinch: more per row),
/// keeping the photo under the fingers where it is; only the grid changes, the title, the
/// featured card and the month labels keep their size. One step of [columnSteps] per doubling
/// of the distance between the fingers, with the counts in between on the way; on release it
/// settles on a step. Scrolling pauses while two fingers are down.
class PinchColumns extends StatefulWidget {
  const PinchColumns({
    super.key,
    required this.controller,
    required this.builder,
    this.initial = 3,
    this.remap,
  });

  final ScrollController controller;
  final int initial;

  /// Builds the scroll view for a column count; [physics] stops scrolling during a pinch.
  final Widget Function(BuildContext context, int columns, ScrollPhysics physics) builder;

  /// Maps the scroll offset of a point under [from] columns to the same photo under [to]
  /// columns. Without it the same share of the page stays scrolled past.
  final double Function(double offset, int from, int to)? remap;

  @override
  State<PinchColumns> createState() => _PinchColumnsState();
}

class _PinchColumnsState extends State<PinchColumns> {
  late int _columns = widget.initial;
  final Map<int, Offset> _pointers = {};
  double? _startDistance;
  double _startStep = 1; // position in [columnSteps] when the pinch began
  double _step = 1; // where the fingers are now, between steps
  double _focalY = 0;

  bool get _pinching => _startDistance != null;

  double _distance() {
    final p = _pointers.values.take(2).toList();
    return (p[0] - p[1]).distance;
  }

  /// Where [columns] is among [columnSteps], as a fractional index.
  static double _stepOf(int columns) {
    for (var i = 0; i < columnSteps.length - 1; i++) {
      final a = columnSteps[i], b = columnSteps[i + 1];
      if (columns <= b) return i + (columns - a) / (b - a);
    }
    return columnSteps.length - 1.0;
  }

  void _down(PointerDownEvent e) {
    _pointers[e.pointer] = e.localPosition;
    if (_pointers.length == 2) {
      final p = _pointers.values.toList();
      setState(() {
        _startDistance = _distance();
        _startStep = _stepOf(_columns);
        _step = _startStep;
        _focalY = (p[0].dy + p[1].dy) / 2;
      });
    }
  }

  void _move(PointerMoveEvent e) {
    if (!_pointers.containsKey(e.pointer)) return;
    _pointers[e.pointer] = e.localPosition;
    final start = _startDistance;
    if (start == null || start < 1 || _pointers.length < 2) return;
    final p = _pointers.values.take(2).toList();
    _focalY = (p[0].dy + p[1].dy) / 2;
    final d = _distance();
    if (d < 1) return;
    _step = (_startStep + math.log(start / d) / math.ln2).clamp(0.0, columnSteps.length - 1.0);
    final lo = _step.floor(), hi = _step.ceil();
    final wanted = (columnSteps[lo] + (columnSteps[hi] - columnSteps[lo]) * (_step - lo)).round();
    if (wanted != _columns) _switch(wanted);
  }

  void _up(PointerEvent e) {
    _pointers.remove(e.pointer);
    if (!_pinching || _pointers.length >= 2) return;
    setState(() => _startDistance = null);
    // Settle on a step: a small pinch goes back, a bigger one goes on in its direction
    final delta = _step - _startStep;
    final int i;
    if (delta.abs() < 0.2) {
      i = _startStep.round();
    } else if (delta > 0) {
      i = (_step - 0.3).ceil().clamp(0, columnSteps.length - 1);
    } else {
      i = (_step + 0.3).floor().clamp(0, columnSteps.length - 1);
    }
    if (columnSteps[i] != _columns) _switch(columnSteps[i]);
  }

  /// Shows [columns] photos per row, keeping the photo under the fingers in place.
  void _switch(int columns) {
    final c = widget.controller;
    final remap = widget.remap;
    if (c.hasClients) {
      if (remap != null) {
        final target = remap(c.offset + _focalY, _columns, columns) - _focalY;
        c.jumpTo(target < 0 ? 0 : target);
      } else if (c.position.maxScrollExtent > 0) {
        final ratio = c.offset / c.position.maxScrollExtent;
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (c.hasClients) {
            c.jumpTo((ratio * c.position.maxScrollExtent).clamp(0, c.position.maxScrollExtent));
          }
        });
      }
    }
    setState(() => _columns = columns);
  }

  @override
  Widget build(BuildContext context) => Listener(
    onPointerDown: _down,
    onPointerMove: _move,
    onPointerUp: _up,
    onPointerCancel: _up,
    child: widget.builder(
      context,
      _columns,
      _pinching ? const NeverScrollableScrollPhysics() : const AlwaysScrollableScrollPhysics(),
    ),
  );
}
