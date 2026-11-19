import 'package:flutter_test/flutter_test.dart';
import 'package:material_ui/material_ui.dart';
import 'package:wanmory/widgets/pinch_columns.dart';

var _pointer = 10;

void main() {
  Future<int Function()> pump(WidgetTester tester) async {
    var columns = 0;
    final scroll = ScrollController();
    await tester.pumpWidget(
      MaterialApp(
        home: PinchColumns(
          controller: scroll,
          builder: (context, c, physics) {
            columns = c;
            return ListView(controller: scroll, physics: physics, children: const [SizedBox(height: 2000)]);
          },
        ),
      ),
    );
    return () => columns;
  }

  Future<void> pinch(WidgetTester tester, double from, double to) async {
    final center = tester.getCenter(find.byType(ListView));
    final a = await tester.startGesture(center - Offset(from / 2, 0), pointer: _pointer++);
    final b = await tester.startGesture(center + Offset(from / 2, 0), pointer: _pointer++);
    await tester.pump();
    for (var i = 1; i <= 5; i++) {
      final d = from + (to - from) * i / 5;
      await a.moveTo(center - Offset(d / 2, 0));
      await b.moveTo(center + Offset(d / 2, 0));
      await tester.pump();
    }
    await a.up();
    await b.up();
    await tester.pumpAndSettle();
  }

  testWidgets('pinching in shows more photos per row, spreading fewer', (tester) async {
    final columns = await pump(tester);
    expect(columns(), 3);
    await pinch(tester, 200, 100);
    expect(columns(), 5);
    await pinch(tester, 200, 100);
    expect(columns(), 7);
    await pinch(tester, 100, 220);
    expect(columns(), 5);
  });

  testWidgets('a small pinch keeps the column count', (tester) async {
    final columns = await pump(tester);
    await pinch(tester, 200, 190);
    expect(columns(), 3);
  });

  testWidgets('the steps stop at both ends', (tester) async {
    final columns = await pump(tester);
    for (var i = 0; i < 6; i++) {
      await pinch(tester, 100, 240);
    }
    expect(columns(), columnSteps.first);
    for (var i = 0; i < 8; i++) {
      await pinch(tester, 240, 100);
    }
    expect(columns(), columnSteps.last);
  });
}
