import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_timezone/flutter_timezone.dart';
import 'package:material_ui/material_ui.dart';

import '../albums/smart_rules.dart';
import '../api/client.dart';
import '../api/models.dart';
import '../auth/auth.dart';
import '../i18n.dart';
import '../widgets/rule_editor.dart';

/// New album, like the web's album dialog: a normal album (photos added by hand) or a smart
/// album (rules, with a live count of matching photos), who can see it, and for smart albums
/// whether it keeps syncing. Pops with the created album.
class CreateAlbumScreen extends ConsumerStatefulWidget {
  const CreateAlbumScreen({super.key, required this.albums});

  /// Existing albums, for the "album is …" rule (synced smart albums can't be chosen).
  final List<Album> albums;

  @override
  ConsumerState<CreateAlbumScreen> createState() => _CreateAlbumScreenState();
}

enum _Sharing { all, some, me }

class _CreateAlbumScreenState extends ConsumerState<CreateAlbumScreen> {
  final _name = TextEditingController(text: t('新相册'));
  bool _smart = false;
  late SmartRules _rules = SmartRules(rules: [defaultRule('photo')]);
  bool _autoSync = true;
  _Sharing _sharing = _Sharing.all;
  final Set<String> _members = {};
  bool _hideMine = false;
  List<User> _others = [];
  bool _saving = false;
  String? _error;

  /// null while counting; -1 when the rules aren't complete.
  int? _matched = -1;
  Timer? _debounce;
  int _countGen = 0;

  ApiClient get _api => ref.read(authProvider).api!;
  List<Album> get _choosable => widget.albums.where((a) => !a.synced).toList();

  @override
  void initState() {
    super.initState();
    _name.addListener(() => setState(() {}));
    _loadMembers();
    FlutterTimezone.getLocalTimezone().then((tz) {
      if (mounted) _rules = _rules.copyWith(tz: tz.identifier);
    });
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _name.dispose();
    super.dispose();
  }

  Future<void> _loadMembers() async {
    try {
      final me = ref.read(authProvider).user?.id;
      final all = await _api.users();
      if (mounted) setState(() => _others = all.where((u) => u.id != me).toList());
    } on ApiException {
      // Without the list only "everyone" and "only me" are offered.
    }
  }

  void _setKind(bool smart) {
    setState(() {
      // The default name follows the type until the user types their own.
      if (_name.text == t('新相册') || _name.text == t('新智能相册')) {
        _name.text = smart ? t('新智能相册') : t('新相册');
      }
      _smart = smart;
    });
    if (smart) _count();
  }

  void _setRules(SmartRules rules) {
    setState(() => _rules = rules);
    _count();
  }

  /// Counts matching photos 300 ms after the rules stop changing.
  void _count() {
    _debounce?.cancel();
    if (!_rules.complete) {
      setState(() => _matched = -1);
      return;
    }
    setState(() => _matched = null);
    final gen = ++_countGen;
    _debounce = Timer(const Duration(milliseconds: 300), () async {
      try {
        final n = await _api.previewSmart(_rules);
        if (mounted && gen == _countGen) setState(() => _matched = n);
      } on ApiException {
        if (mounted && gen == _countGen) setState(() => _matched = -1);
      }
    });
  }

  bool get _ready => _name.text.trim().isNotEmpty && (!_smart || _rules.complete) && !_saving;

  Future<void> _create() async {
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      final album = await _api.createAlbum(
        name: _name.text.trim(),
        rules: _smart ? _rules : null,
        autoSync: _autoSync,
        private: _sharing == _Sharing.me,
        members: _sharing == _Sharing.some ? _members.toList() : const [],
        hideMine: _hideMine,
      );
      if (mounted) Navigator.pop(context, album);
    } on ApiException catch (e) {
      if (mounted) {
        setState(() {
          _error = t(e.message);
          _saving = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final muted = theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant);
    return Scaffold(
      appBar: AppBar(
        title: Text(t('新建相册')),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: FilledButton(
              onPressed: _ready ? _create : null,
              child: Text(_saving ? t('保存中…') : t('创建')),
            ),
          ),
        ],
      ),
      body: ListView(
        padding: EdgeInsets.fromLTRB(16, 8, 16, MediaQuery.paddingOf(context).bottom + 24),
        children: [
          SegmentedButton<bool>(
            segments: [
              ButtonSegment(value: false, icon: const Icon(Icons.folder_outlined), label: Text(t('普通相册'))),
              ButtonSegment(
                value: true,
                icon: const Icon(Icons.auto_awesome_outlined),
                label: Text(t('智能相册')),
              ),
            ],
            selected: {_smart},
            onSelectionChanged: (v) => _setKind(v.first),
          ),
          const SizedBox(height: 8),
          Text(_smart ? t('按条件自动收集照片') : t('建好后可以从图库添加照片'), style: muted, textAlign: TextAlign.center),
          const SizedBox(height: 20),
          TextField(
            controller: _name,
            maxLength: 100,
            decoration: InputDecoration(labelText: t('相册名'), border: const OutlineInputBorder()),
          ),
          if (_smart) ...[
            const SizedBox(height: 8),
            RuleEditor(value: _rules, albums: _choosable, api: _api, onChanged: _setRules),
            const SizedBox(height: 8),
            Text(switch (_matched) {
              -1 => t('条件还没填完整'),
              null => t('正在统计…'),
              final n => t('{matched} 项符合', {'matched': n}),
            }, style: theme.textTheme.titleSmall?.copyWith(color: theme.colorScheme.primary)),
          ],
          const SizedBox(height: 24),
          Text(t('权限设置'), style: theme.textTheme.titleSmall),
          const SizedBox(height: 8),
          SegmentedButton<_Sharing>(
            segments: [
              ButtonSegment(
                value: _Sharing.all,
                icon: const Icon(Icons.groups_outlined),
                label: Text(t('所有人')),
              ),
              ButtonSegment(
                value: _Sharing.some,
                enabled: _others.isNotEmpty,
                icon: const Icon(Icons.how_to_reg_outlined),
                label: Text(t('指定成员')),
              ),
              ButtonSegment(value: _Sharing.me, icon: const Icon(Icons.lock_outline), label: Text(t('仅自己'))),
            ],
            selected: {_sharing},
            onSelectionChanged: (v) => setState(() {
              _sharing = v.first;
              // Choosing members starts with everyone ticked; untick the ones who shouldn't see it.
              if (_sharing == _Sharing.some && _members.isEmpty) _members.addAll(_others.map((u) => u.id));
            }),
          ),
          const SizedBox(height: 8),
          switch (_sharing) {
            _Sharing.all => Text(t('所有成员都能查看和添加照片，包括以后新加的。'), style: muted),
            _Sharing.some => Column(
              children: [
                for (final u in _others)
                  CheckboxListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(u.name),
                    value: _members.contains(u.id),
                    // At least one member; nobody at all is "only me".
                    onChanged: (v) => setState(() {
                      if (v == true) {
                        _members.add(u.id);
                      } else if (_members.length > 1) {
                        _members.remove(u.id);
                      }
                    }),
                  ),
              ],
            ),
            _Sharing.me => CheckboxListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(t('同时设置照片/视频的自动隐藏')),
              subtitle: Text(t('仅自己可见，后续新增的照片和视频也将自动隐藏。')),
              value: _hideMine,
              onChanged: (v) => setState(() => _hideMine = v ?? false),
            ),
          },
          if (_smart) ...[
            const SizedBox(height: 12),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(t('自动同步')),
              subtitle: Text(_autoSync ? t('以后新增的照片，只要符合条件就自动加入') : t('只放入现在符合条件的照片，之后可以手动增减')),
              value: _autoSync,
              onChanged: (v) => setState(() => _autoSync = v),
            ),
          ],
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(_error!, style: TextStyle(color: theme.colorScheme.error)),
          ],
        ],
      ),
    );
  }
}
