import 'package:material_ui/material_ui.dart';

import '../albums/smart_rules.dart';
import '../api/client.dart';
import '../api/models.dart';
import '../i18n.dart';

const _maxRules = 20;

/// Edits smart album rules: one card per rule (field, comparison, value), "and / or" when there
/// are several, and "add rule".
class RuleEditor extends StatelessWidget {
  const RuleEditor({
    super.key,
    required this.value,
    required this.albums,
    required this.api,
    required this.onChanged,
  });

  final SmartRules value;

  /// Albums the "album is …" rule can pick.
  final List<Album> albums;
  final ApiClient api;
  final ValueChanged<SmartRules> onChanged;

  @override
  Widget build(BuildContext context) {
    final rules = value.rules;
    final multiple = rules.length > 1;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Text(t('条件'), style: Theme.of(context).textTheme.titleSmall),
            const Spacer(),
            if (multiple)
              SegmentedButton<String>(
                showSelectedIcon: false,
                segments: [
                  ButtonSegment(value: 'all', label: Text(t('并且')), tooltip: t('每条都满足')),
                  ButtonSegment(value: 'any', label: Text(t('或者')), tooltip: t('满足任一条')),
                ],
                selected: {value.match},
                onSelectionChanged: (v) => onChanged(value.copyWith(match: v.first)),
              ),
          ],
        ),
        const SizedBox(height: 8),
        for (var i = 0; i < rules.length; i++)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: _RuleCard(
              rule: rules[i],
              albums: albums,
              api: api,
              onChanged: (r) => onChanged(value.copyWith(rules: [...rules]..[i] = r)),
              onRemove: multiple ? () => onChanged(value.copyWith(rules: [...rules]..removeAt(i))) : null,
            ),
          ),
        Align(
          alignment: Alignment.centerLeft,
          child: TextButton.icon(
            onPressed: rules.length >= _maxRules
                ? null
                : () => onChanged(value.copyWith(rules: [...rules, defaultRule('photo')])),
            icon: const Icon(Icons.add),
            label: Text(t('添加条件')),
          ),
        ),
      ],
    );
  }
}

class _RuleCard extends StatelessWidget {
  const _RuleCard({
    required this.rule,
    required this.albums,
    required this.api,
    required this.onChanged,
    this.onRemove,
  });

  final SmartRule rule;
  final List<Album> albums;
  final ApiClient api;
  final ValueChanged<SmartRule> onChanged;
  final VoidCallback? onRemove;

  List<String> get _albumIds => [for (final a in albums) a.id];

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.fromLTRB(12, 8, 4, 12),
      decoration: BoxDecoration(color: scheme.surfaceContainerHigh, borderRadius: BorderRadius.circular(16)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                flex: 5,
                child: _Dropdown(
                  label: t('字段'),
                  value: rule.field,
                  items: [
                    for (final f in fieldGroups.expand((g) => g))
                      (f.key, f.key == 'iso' ? 'ISO' : t(f.label)),
                  ],
                  onChanged: (f) => onChanged(defaultRule(f, albumIds: _albumIds)),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                flex: 4,
                child: _Dropdown(
                  label: t('比较方式'),
                  value: rule.op,
                  items: [for (final (op, l) in ops[rule.def.kind]!) (op, t(l))],
                  onChanged: (op) => onChanged(withOp(rule, op, _albumIds)),
                ),
              ),
              SizedBox(
                width: 40,
                child: onRemove == null
                    ? null
                    : IconButton(
                        tooltip: t('删除条件'),
                        onPressed: onRemove,
                        icon: const Icon(Icons.close, size: 20),
                      ),
              ),
            ],
          ),
          if (rule.needsValue) ...[
            const SizedBox(height: 8),
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: _ValueInput(rule: rule, albums: albums, api: api, onChanged: onChanged),
            ),
          ],
        ],
      ),
    );
  }
}

class _Dropdown extends StatelessWidget {
  const _Dropdown({required this.label, required this.value, required this.items, required this.onChanged});

  final String label;
  final String value;
  final List<(String, String)> items;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) => DropdownButtonFormField<String>(
    initialValue: items.any((i) => i.$1 == value) ? value : null,
    isExpanded: true,
    decoration: InputDecoration(labelText: label, isDense: true, border: InputBorder.none),
    items: [
      for (final (v, l) in items)
        DropdownMenuItem(
          value: v,
          child: Text(l, overflow: TextOverflow.ellipsis),
        ),
    ],
    onChanged: (v) => v == null ? null : onChanged(v),
  );
}

class _ValueInput extends StatelessWidget {
  const _ValueInput({required this.rule, required this.albums, required this.api, required this.onChanged});

  final SmartRule rule;
  final List<Album> albums;
  final ApiClient api;
  final ValueChanged<SmartRule> onChanged;

  @override
  Widget build(BuildContext context) {
    final def = rule.def;
    switch (def.kind) {
      case FieldKind.date:
        if (rule.op == 'in_last' || rule.op == 'not_in_last') {
          return Row(
            children: [
              Expanded(
                child: _TextValue(
                  key: ValueKey('${rule.field}-n'),
                  initial: rule.value,
                  label: t('数量'),
                  number: true,
                  onChanged: (v) => onChanged(rule.copyWith(value: v)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _Dropdown(
                  label: t('单位'),
                  value: rule.unit ?? 'day',
                  items: [for (final (u, l) in units) (u, t(l))],
                  onChanged: (u) => onChanged(rule.copyWith(unit: u)),
                ),
              ),
            ],
          );
        }
        if (rule.op == 'in_range') {
          return Row(
            children: [
              Expanded(
                child: _DateValue(
                  label: t('开始日期'),
                  value: rule.value,
                  onChanged: (v) => onChanged(rule.copyWith(value: v)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _DateValue(
                  label: t('结束日期'),
                  value: rule.value2 ?? '',
                  onChanged: (v) => onChanged(rule.copyWith(value2: v)),
                ),
              ),
            ],
          );
        }
        return _DateValue(
          label: t('日期'),
          value: rule.value,
          onChanged: (v) => onChanged(rule.copyWith(value: v)),
        );
      case FieldKind.photo:
        return _Dropdown(
          label: t('照片类型'),
          value: rule.value,
          items: [for (final (v, l) in photoTypes) (v, v == 'raw' ? 'RAW' : t(l))],
          onChanged: (v) => onChanged(rule.copyWith(value: v)),
        );
      case FieldKind.flash:
        return _Dropdown(
          label: t('闪光灯'),
          value: rule.value,
          items: [('fired', t('闪光'))],
          onChanged: (v) => onChanged(rule.copyWith(value: v)),
        );
      case FieldKind.rating:
        return _Dropdown(
          label: t('星级'),
          value: rule.value,
          items: [for (final (v, l) in ratings) (v, t(l))],
          onChanged: (v) => onChanged(rule.copyWith(value: v)),
        );
      case FieldKind.album:
        if (albums.isEmpty) return Text(t('还没有可以选的相册'));
        return _Dropdown(
          label: t('相册'),
          value: rule.value,
          items: [for (final a in albums) (a.id, a.name)],
          onChanged: (v) => onChanged(rule.copyWith(value: v)),
        );
      case FieldKind.number:
        return _TextValue(
          key: ValueKey(rule.field),
          initial: rule.value,
          label: def.key == 'iso' ? 'ISO' : t(def.label),
          hint: def.placeholder,
          prefix: def.prefix,
          suffix: def.suffix == null ? null : t(def.suffix!),
          number: true,
          onChanged: (v) => onChanged(rule.copyWith(value: v)),
        );
      case FieldKind.text:
        return _TagValue(
          key: ValueKey(rule.field),
          values: rule.textValues,
          label: t(def.label),
          suggest: def.suggest,
          api: api,
          onChanged: (vs) => onChanged(rule.copyWith(values: vs, value: '')),
        );
    }
  }
}

class _TextValue extends StatefulWidget {
  const _TextValue({
    super.key,
    required this.initial,
    required this.label,
    required this.onChanged,
    this.hint,
    this.prefix,
    this.suffix,
    this.number = false,
  });

  final String initial;
  final String label;
  final String? hint;
  final String? prefix;
  final String? suffix;
  final bool number;
  final ValueChanged<String> onChanged;

  @override
  State<_TextValue> createState() => _TextValueState();
}

class _TextValueState extends State<_TextValue> {
  late final _c = TextEditingController(text: widget.initial);

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => TextField(
    controller: _c,
    keyboardType: widget.number ? const TextInputType.numberWithOptions(decimal: true) : TextInputType.text,
    onChanged: widget.onChanged,
    decoration: InputDecoration(
      labelText: widget.label,
      hintText: widget.hint,
      prefixText: widget.prefix,
      suffixText: widget.suffix,
      isDense: true,
      border: const OutlineInputBorder(),
    ),
  );
}

class _DateValue extends StatelessWidget {
  const _DateValue({required this.label, required this.value, required this.onChanged});

  final String label;

  /// yyyy-mm-dd
  final String value;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    final current = DateTime.tryParse(value);
    return InkWell(
      onTap: () async {
        final d = await showDatePicker(
          context: context,
          initialDate: current ?? DateTime.now(),
          firstDate: DateTime(1800),
          lastDate: DateTime(2200),
        );
        if (d == null) return;
        String two(int n) => n.toString().padLeft(2, '0');
        onChanged('${d.year}-${two(d.month)}-${two(d.day)}');
      },
      child: InputDecorator(
        decoration: InputDecoration(
          labelText: label,
          isDense: true,
          border: const OutlineInputBorder(),
          suffixIcon: const Icon(Icons.calendar_today_outlined, size: 18),
        ),
        child: Text(current == null ? '' : MaterialLocalizations.of(context).formatMediumDate(current)),
      ),
    );
  }
}

/// Several text values as chips. Type and press return to add one; camera, make and lens also
/// suggest the values seen in the photos.
class _TagValue extends StatefulWidget {
  const _TagValue({
    super.key,
    required this.values,
    required this.label,
    required this.api,
    required this.onChanged,
    this.suggest,
  });

  final List<String> values;
  final String label;
  final String? suggest;
  final ApiClient api;
  final ValueChanged<List<String>> onChanged;

  @override
  State<_TagValue> createState() => _TagValueState();
}

class _TagValueState extends State<_TagValue> {
  final _c = TextEditingController();
  List<String> _options = [];

  @override
  void initState() {
    super.initState();
    _c.addListener(() => setState(() {}));
    final s = widget.suggest;
    if (s != null) {
      widget.api.fieldValues(s).then((l) {
        if (mounted) setState(() => _options = l);
      }, onError: (_) {});
    }
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  void _add(String v) {
    v = v.trim();
    if (v.isEmpty || widget.values.contains(v)) return;
    widget.onChanged([...widget.values, v]);
    _c.clear();
  }

  @override
  Widget build(BuildContext context) {
    final q = _c.text.trim().toLowerCase();
    final suggestions = _options
        .where((o) => !widget.values.contains(o) && (q.isEmpty || o.toLowerCase().contains(q)))
        .take(8)
        .toList();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (widget.values.isNotEmpty)
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              for (final v in widget.values)
                InputChip(label: Text(v), onDeleted: () => widget.onChanged([...widget.values]..remove(v))),
            ],
          ),
        if (widget.values.isNotEmpty) const SizedBox(height: 8),
        TextField(
          controller: _c,
          textInputAction: TextInputAction.done,
          onSubmitted: _add,
          decoration: InputDecoration(
            labelText: widget.label,
            hintText: widget.suggest == null ? t('输入后回车，可以填多个') : t('输入或从列表里选，可以选多个'),
            isDense: true,
            border: const OutlineInputBorder(),
          ),
        ),
        if (suggestions.isNotEmpty) ...[
          const SizedBox(height: 8),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [for (final o in suggestions) ActionChip(label: Text(o), onPressed: () => _add(o))],
          ),
        ],
      ],
    );
  }
}
