/// Growth: a person's photos split by age, the same way as the web (web/src/lib/age.ts). With
/// a birthday: every month until two, every half year until six, then every year. Without:
/// by how long ago (the last year, a year ago, two years ago...).
library;

import '../api/models.dart';
import '../i18n.dart';

class AgeGroup {
  AgeGroup({
    required this.key,
    required this.label,
    required this.from,
    required this.to,
    required this.moments,
  });

  final String key;

  /// "3个月", "1岁2个月", "2岁半", "5岁", or "最近一年", "两年前".
  final String label;

  /// The period, start included and end excluded (opens the photos taken in it).
  final DateTime from;
  final DateTime to;
  final List<Moment> moments;

  /// The clearest face represents the group.
  Moment get best => moments.reduce((a, b) => b.quality > a.quality ? b : a);
}

DateTime parseDay(String s) {
  final p = s.split('-').map(int.parse).toList();
  return DateTime(p[0], p[1], p[2]);
}

/// [n] months later; past the end of a month it takes the last day (Jan 31 + 1 month = Feb 28).
DateTime addMonths(DateTime d, int n) {
  final first = DateTime(d.year, d.month + n);
  final last = DateTime(first.year, first.month + 1, 0).day;
  return DateTime(first.year, first.month, d.day < last ? d.day : last);
}

/// Whole months from [a] to [b] (negative when [b] is earlier).
int monthsBetween(DateTime a, DateTime b) {
  var n = (b.year - a.year) * 12 + b.month - a.month;
  if (addMonths(a, n).isAfter(b)) n--;
  return n;
}

int _span(int months) => months < 24 ? 1 : (months < 72 ? 6 : 12);

String _ageLabel(int start, int span) {
  if (start == 0 && span == 1) return t('刚出生');
  if (start < 12) return t('{start}个月', {'start': start});
  final years = start ~/ 12, months = start % 12;
  if (span == 6 && months == 6) return t('{years}岁半', {'years': years});
  return months > 0
      ? t('{years}岁{months}个月', {'years': years, 'months': months})
      : t('{years}岁', {'years': years});
}

const _chinese = ['', '一', '两', '三', '四', '五', '六', '七', '八', '九', '十'];

String _yearsAgo(int n) {
  if (n == 0) return t('最近一年');
  final num = currentLocale.startsWith('zh') && n < _chinese.length ? _chinese[n] : '$n';
  return t('{n}年前', {'n': num});
}

/// [moments] sorted by time. Photos without a recorded date don't count.
List<AgeGroup> groupByAge(List<Moment> moments, String? birthday, {DateTime? now}) {
  final today = now ?? DateTime.now();
  final birth = birthday == null ? null : parseDay(birthday);
  final groups = <String, AgeGroup>{};
  for (final m in moments) {
    if (!m.dated) continue;
    final tk = m.taken;
    String key, label;
    DateTime from, to;
    if (birth == null) {
      final n = monthsBetween(tk, today) ~/ 12;
      final ago = n < 0 ? 0 : n;
      key = 'ago$ago';
      label = _yearsAgo(ago);
      from = addMonths(today, -12 * (ago + 1));
      to = ago == 0 ? DateTime(today.year + 100) : addMonths(today, -12 * ago);
    } else if (tk.isBefore(birth)) {
      key = 'before';
      label = t('出生前');
      from = DateTime(1900);
      to = birth;
    } else {
      final months = monthsBetween(birth, tk);
      final span = _span(months);
      final start = months ~/ span * span;
      key = 'm$start';
      label = _ageLabel(start, span);
      from = addMonths(birth, start);
      to = addMonths(birth, start + span);
    }
    groups
        .putIfAbsent(key, () => AgeGroup(key: key, label: label, from: from, to: to, moments: []))
        .moments
        .add(m);
  }
  final list = groups.values.toList();
  return birth != null ? list : list.reversed.toList();
}

/// The age shown next to the name: "65岁1个月", "3个月"; empty before birth.
String ageNow(String birthday, {DateTime? now}) {
  final months = monthsBetween(parseDay(birthday), now ?? DateTime.now());
  if (months < 0) return '';
  if (months < 1) return t('刚出生');
  return _ageLabel(months, 1);
}
