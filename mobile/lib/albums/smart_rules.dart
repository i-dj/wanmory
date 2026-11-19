// Smart album rules: the fields, how each can be compared and what value it takes.
// Mirrors web/src/lib/smartRules.ts and the server's internal/assets/smart.go.

enum FieldKind { date, text, number, rating, photo, flash, album }

class FieldDef {
  const FieldDef(this.key, this.label, this.kind, {this.placeholder, this.prefix, this.suffix, this.suggest});

  final String key;

  /// Chinese source string for `t()`.
  final String label;
  final FieldKind kind;
  final String? placeholder;
  final String? prefix;
  final String? suffix;

  /// Text fields that can suggest values seen in the photos: camera, make, lens.
  final String? suggest;
}

/// Two groups, like the web: common fields first, then shooting parameters.
const fieldGroups = [
  [
    FieldDef('album', '相册', FieldKind.album),
    FieldDef('taken', '拍摄日期', FieldKind.date),
    FieldDef('added', '添加日期', FieldKind.date),
    FieldDef('filename', '文件名', FieldKind.text),
    FieldDef('photo', '照片', FieldKind.photo),
    FieldDef('rating', '星级', FieldKind.rating),
  ],
  [
    FieldDef('aperture', '光圈', FieldKind.number, placeholder: '2.8', prefix: 'f/'),
    FieldDef('camera', '相机型号', FieldKind.text, suggest: 'camera'),
    FieldDef('make', '相机品牌', FieldKind.text, suggest: 'make'),
    FieldDef('flash', '闪光灯', FieldKind.flash),
    FieldDef('focal', '焦距', FieldKind.number, placeholder: '35', suffix: 'mm'),
    FieldDef('iso', 'ISO', FieldKind.number, placeholder: '400'),
    FieldDef('lens', '镜头', FieldKind.text, suggest: 'lens'),
    FieldDef('shutter', '快门速度', FieldKind.number, placeholder: '1/125', suffix: '秒'),
  ],
];

final fields = {for (final f in fieldGroups.expand((g) => g)) f.key: f};

/// Comparisons per field kind: (op, Chinese label).
const ops = <FieldKind, List<(String, String)>>{
  FieldKind.date: [
    ('is', '是'),
    ('is_not', '不是'),
    ('after', '晚于'),
    ('before', '早于'),
    ('in_last', '在最近'),
    ('not_in_last', '不在最近'),
    ('in_range', '在范围内'),
  ],
  FieldKind.text: [
    ('includes', '包含'),
    ('excludes', '不包含'),
    ('is', '是'),
    ('is_not', '不是'),
    ('starts', '开头是'),
    ('ends', '结尾是'),
    ('empty', '为空'),
    ('not_empty', '不为空'),
  ],
  FieldKind.number: [('is', '是'), ('is_not', '不是'), ('gt', '大于'), ('lt', '小于')],
  FieldKind.rating: [('is', '是'), ('is_not', '不是'), ('gt', '高于'), ('lt', '低于')],
  FieldKind.photo: [('is', '是'), ('is_not', '不是')],
  FieldKind.flash: [('is', '是'), ('is_not', '不是')],
  FieldKind.album: [('is', '是'), ('is_not', '不是')],
};

const photoTypes = [
  ('favorite', '收藏'),
  ('video', '视频'),
  ('raw', 'RAW'),
  ('screenshot', '截图'),
  ('gps', '带位置信息'),
  ('panorama', '全景'),
];

const ratings = [('0', '无星级'), ('1', '1 星'), ('2', '2 星'), ('3', '3 星'), ('4', '4 星'), ('5', '5 星')];

const units = [('day', '天'), ('week', '周'), ('month', '个月'), ('year', '年')];

class SmartRule {
  SmartRule({required this.field, required this.op, this.value = '', this.values, this.value2, this.unit});

  factory SmartRule.fromJson(Map<String, dynamic> j) => SmartRule(
    field: j['field'] as String,
    op: j['op'] as String,
    value: j['value'] as String? ?? '',
    values: (j['values'] as List?)?.cast<String>(),
    value2: j['value2'] as String?,
    unit: j['unit'] as String?,
  );

  final String field;
  final String op;
  final String value;

  /// Text fields can hold several values: includes / is match any, excludes / is not match none.
  final List<String>? values;

  /// End date of "in range".
  final String? value2;

  /// Unit of "in the last": day, week, month, year.
  final String? unit;

  FieldDef get def => fields[field]!;

  SmartRule copyWith({String? op, String? value, List<String>? values, String? value2, String? unit}) =>
      SmartRule(
        field: field,
        op: op ?? this.op,
        value: value ?? this.value,
        values: values ?? this.values,
        value2: value2 ?? this.value2,
        unit: unit ?? this.unit,
      );

  Map<String, dynamic> toJson() => {
    'field': field,
    'op': op,
    'value': value,
    'values': ?values,
    'value2': ?value2,
    'unit': ?unit,
  };

  /// Text values; old rules only have [value].
  List<String> get textValues => values ?? (value.isEmpty ? [] : [value]);

  bool get needsValue => op != 'empty' && op != 'not_empty';

  /// Filled in enough to count matches on the server.
  bool get complete {
    if (!needsValue) return true;
    if (def.kind == FieldKind.text) return textValues.any((v) => v.trim().isNotEmpty);
    if (value.trim().isEmpty) return false;
    return op != 'in_range' || (value2 ?? '').isNotEmpty;
  }
}

String today() {
  final d = DateTime.now();
  String two(int n) => n.toString().padLeft(2, '0');
  return '${d.year}-${two(d.month)}-${two(d.day)}';
}

/// The rule after picking a field (or comparison): the first comparison and a sensible value.
SmartRule defaultRule(String field, {String? op, List<String> albumIds = const []}) {
  final def = fields[field]!;
  final o = op ?? ops[def.kind]!.first.$1;
  return switch (def.kind) {
    FieldKind.date when o == 'in_last' || o == 'not_in_last' => SmartRule(
      field: field,
      op: o,
      value: '30',
      unit: 'day',
    ),
    FieldKind.date when o == 'in_range' => SmartRule(field: field, op: o, value: today(), value2: today()),
    FieldKind.date => SmartRule(field: field, op: o, value: today()),
    FieldKind.photo => SmartRule(field: field, op: o, value: 'favorite'),
    FieldKind.flash => SmartRule(field: field, op: o, value: 'fired'),
    FieldKind.rating => SmartRule(field: field, op: o, value: '5'),
    FieldKind.album => SmartRule(field: field, op: o, value: albumIds.firstOrNull ?? ''),
    FieldKind.text => SmartRule(field: field, op: o, values: []),
    FieldKind.number => SmartRule(field: field, op: o),
  };
}

/// Changing the comparison keeps the value when it still fits; dates switching between
/// "a day", "in the last" and "in range" get a fresh default.
SmartRule withOp(SmartRule rule, String op, List<String> albumIds) {
  if (rule.def.kind != FieldKind.date) return rule.copyWith(op: op);
  String group(String o) =>
      o == 'in_last' || o == 'not_in_last' ? 'last' : (o == 'in_range' ? 'range' : 'day');
  return group(op) == group(rule.op)
      ? rule.copyWith(op: op)
      : defaultRule(rule.field, op: op, albumIds: albumIds);
}

class SmartRules {
  SmartRules({this.match = 'all', required this.rules, this.tz = 'UTC'});

  /// "all" or "any".
  final String match;
  final List<SmartRule> rules;

  /// IANA time zone the server uses to decide which day a photo was taken on.
  final String tz;

  SmartRules copyWith({String? match, List<SmartRule>? rules, String? tz}) =>
      SmartRules(match: match ?? this.match, rules: rules ?? this.rules, tz: tz ?? this.tz);

  Map<String, dynamic> toJson() => {
    'match': match,
    'rules': [for (final r in rules) r.toJson()],
    'tz': tz,
  };

  bool get complete => rules.every((r) => r.complete);
}
