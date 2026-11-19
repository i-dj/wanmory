import 'package:flutter_test/flutter_test.dart';
import 'package:wanmory/api/models.dart';
import 'package:wanmory/widgets/time_scrubber.dart';
import 'package:wanmory/widgets/timeline.dart';

Asset _asset(int i, DateTime t) => Asset(
  id: 'a$i',
  type: 'image',
  width: 1,
  height: 1,
  durationMs: null,
  sortTime: t,
  favorite: false,
  hasThumbnail: true,
);

void main() {
  // 7 photos in May, 2 in April; 3 per row, 302 px wide: cells of 99.33 px plus 2 px spacing.
  final assets = [
    for (var i = 0; i < 7; i++) _asset(i, DateTime(2024, 5, 20 - i)),
    for (var i = 7; i < 9; i++) _asset(i, DateTime(2024, 4, 10)),
  ];
  final layout = TimelineLayout(assets, zoom: Zoom.all, columns: 3, width: 302);
  const cell = (302 - 4) / 3;

  test('sections stack: header plus rows', () {
    // May: header + 3 rows; April: header + 1 row.
    expect(layout.offsetOf(0), 0);
    expect(layout.offsetOf(7), closeTo(sectionHeaderHeight + 3 * cell + 2 * 2, 0.01));
    expect(layout.extent, closeTo(2 * sectionHeaderHeight + 4 * cell + 2 * 2, 0.01));
  });

  test('a photo further down a section is found by its row', () {
    expect(layout.offsetOf(4), closeTo(sectionHeaderHeight + (cell + 2), 0.01));
    final (index, section) = layout.at(sectionHeaderHeight + (cell + 2) + 5);
    expect(index, 3);
    expect(section, DateTime(2024, 5));
  });

  test('positions inside the second section map back to it', () {
    final y = layout.offsetOf(7) + sectionHeaderHeight + 1;
    final (index, section) = layout.at(y);
    expect(index, 7);
    expect(section, DateTime(2024, 4));
  });

  test('month index finds the month of a photo and where months start', () {
    final m = MonthIndex([(DateTime(2024, 5), 7), (DateTime(2024, 4), 2), (DateTime(2023, 1), 10)]);
    expect(m.total, 19);
    expect(m.monthOf(0), 0);
    expect(m.monthOf(6), 0);
    expect(m.monthOf(7), 1);
    expect(m.monthOf(9), 2);
    expect(m.startOf(2), 9);
  });

  test('filters become query parameters', () {
    const f = AssetFilter(kind: 'gif', uploaders: ['u1', 'u2']);
    expect(Uri.splitQueryString(f.query), {'kind': 'gif', 'uploader': 'u1,u2'});
    expect(f.filtered, isTrue);
    expect(const AssetFilter().filtered, isFalse);
  });
}
