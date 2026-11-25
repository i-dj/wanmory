import 'dart:async';
import 'dart:math' as math;
import 'dart:ui' show FragmentProgram, FragmentShader, ImageFilter;

import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_timezone/flutter_timezone.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:material_ui/material_ui.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../api/client.dart';
import '../api/models.dart';
import '../auth/auth.dart';
import '../i18n.dart';
import '../widgets/account_sheet.dart';
import '../widgets/avatar.dart';
import '../widgets/glass.dart';
import 'people_tab.dart';
import '../widgets/hero_carousel.dart';
import '../widgets/pinch_columns.dart';
import '../widgets/time_scrubber.dart';
import '../widgets/timeline.dart';
import 'viewer_screen.dart';

/// Bumped when the Library tab is tapped while already open: back to the top, like in the
/// Photos apps.
final libraryToTop = ValueNotifier(0);

/// What floats over the grid while scrolling: the month at the top and where that is in the
/// whole library.
class _Overlay {
  const _Overlay({
    this.label,
    this.subtitle,
    this.position = 0,
    this.visible = false,
    this.pastHeader = false,
  });

  final String? label;

  /// Under the floating title: the date and place of the photos at the top of the screen.
  final String? subtitle;
  final double position;
  final bool visible;

  /// The page header (with its "…" button) has scrolled away, so the floating one shows.
  final bool pastHeader;
}

/// The library: counts, the featured card and the timeline. Pinch the grid to show more or
/// fewer photos per row; while scrolling, the month floats at the top and a scrubber on the
/// right moves through the whole library; "…" filters by type and by who uploaded.
class LibraryTab extends ConsumerStatefulWidget {
  const LibraryTab({super.key});

  @override
  ConsumerState<LibraryTab> createState() => _LibraryTabState();
}

class _LibraryTabState extends ConsumerState<LibraryTab> {
  static const _kHero = 'library.hero';

  final _scroll = ScrollController();
  final _startKey = GlobalKey();
  final _overlay = ValueNotifier(const _Overlay());

  /// Scrolled away from the top: the blur under the status bar shows.
  final _scrolled = ValueNotifier(false);
  late final TimelineController _timeline;
  AssetFilter _filter = const AssetFilter();
  Summary? _summary;
  MonthIndex? _months;
  List<User> _members = [];
  bool _showHero = true;
  Key _heroKey = UniqueKey();

  // Layout of the loaded timeline, for the floating label and the scrubber.
  int _columns = 3;
  double _width = 0;
  TimelineLayout? _layout;
  (int, int, double)? _layoutKey;

  Timer? _hideTimer;
  bool _dragging = false;
  int? _pendingJump;
  bool _jumping = false;

  ApiClient get _api => ref.read(authProvider).api!;

  @override
  void initState() {
    super.initState();
    _timeline = TimelineController(
      _api,
      _filter,
      onUnauthorized: () => ref.read(authProvider.notifier).sessionExpired(),
    )..addListener(() => setState(() {}));
    _scroll.addListener(_onScroll);
    libraryToTop.addListener(_toTop);
    _timeline.loadMore();
    _loadSummary();
    _loadMonths();
    _loadMembers();
    SharedPreferences.getInstance().then((p) {
      if (mounted) setState(() => _showHero = p.getBool(_kHero) ?? true);
    });
  }

  void _toTop() {
    if (!_scroll.hasClients || _scroll.offset == 0) return;
    // Far down, jump most of the way first so the animation stays short
    if (_scroll.offset > 6000) _scroll.jumpTo(3000);
    _scroll.animateTo(0, duration: const Duration(milliseconds: 450), curve: Curves.easeOutCubic);
  }

  @override
  void dispose() {
    libraryToTop.removeListener(_toTop);
    _hideTimer?.cancel();
    _scroll.dispose();
    _overlay.dispose();
    _scrolled.dispose();
    _timeline.dispose();
    super.dispose();
  }

  Future<void> _loadSummary() async {
    try {
      final s = await _api.summary(filter: _filter);
      if (mounted) setState(() => _summary = s);
    } on ApiException {
      // The counts are optional.
    }
  }

  Future<void> _loadMonths() async {
    try {
      final tz = (await FlutterTimezone.getLocalTimezone()).identifier;
      final m = await _api.monthCounts(tz: tz, filter: _filter);
      if (mounted) setState(() => _months = MonthIndex(m));
    } on Object {
      // Without counts there is no scrubber; scrolling still works.
      if (mounted) setState(() => _months = null);
    }
  }

  Future<void> _loadMembers() async {
    try {
      final users = await _api.users();
      if (mounted) setState(() => _members = users);
    } on ApiException {
      // Without the list the menu only offers "everyone".
    }
  }

  Future<void> _refresh() async {
    setState(() => _heroKey = UniqueKey());
    await Future.wait([
      _timeline.reload(),
      _loadSummary(),
      _loadMonths(),
      ref.read(authProvider.notifier).refreshUser(),
    ]);
  }

  void _setFilter(AssetFilter f) {
    setState(() {
      _filter = f;
      _summary = null;
      _months = null;
    });
    if (_scroll.hasClients) _scroll.jumpTo(0);
    _timeline.reload(f);
    _loadSummary();
    _loadMonths();
  }

  Future<void> _setShowHero(bool on) async {
    setState(() => _showHero = on);
    await (await SharedPreferences.getInstance()).setBool(_kHero, on);
  }

  void _open(List<Asset> assets, int index) => context.push('/photo', extra: ViewerArgs(assets, index));

  // ---- layout, floating label, scrubber ----

  TimelineLayout _currentLayout() {
    final key = (_timeline.assets.length, _columns, _width);
    if (_layout == null || _layoutKey != key) {
      final (zoom, perRow) = resolveGrid(Zoom.all, _columns, _width);
      _layout = TimelineLayout(_timeline.assets, zoom: zoom, columns: perRow, width: _width);
      _layoutKey = key;
    }
    return _layout!;
  }

  TimelineLayout _layoutFor(int columns) {
    if (columns == _columns) return _currentLayout();
    final (zoom, perRow) = resolveGrid(Zoom.all, columns, _width);
    return TimelineLayout(_timeline.assets, zoom: zoom, columns: perRow, width: _width);
  }

  /// For pinching: where the photo at scroll offset [y] is with [to] columns instead of [from].
  double _remap(double y, int from, int to) {
    final start = _timelineStart();
    if (start == null || y < start || _timeline.assets.isEmpty) return y;
    final anchor = _layoutFor(from).anchorAt(y - start);
    return start + _layoutFor(to).yOf(anchor);
  }

  /// Scroll offset where the timeline begins (below the header and the featured card).
  double? _timelineStart() {
    final ro = _startKey.currentContext?.findRenderObject();
    return ro is RenderSliver ? ro.constraints.precedingScrollExtent : null;
  }

  void _onScroll() {
    if (_scroll.position.extentAfter < 2000) _timeline.loadMore();
    final start = _timelineStart();
    final layout = _currentLayout();
    final offset = _scroll.offset;
    _scrolled.value = offset > 6;
    final pastHeader = offset > 70;
    if (start == null || layout.isEmpty || offset < start - 40) {
      _overlay.value = _Overlay(pastHeader: pastHeader, position: 0);
      return;
    }
    final (index, section) = layout.at(offset - start + 8);
    final months = _months;
    final yearOnly = resolveGrid(Zoom.all, _columns, _width).$1 == Zoom.year;
    final top = _timeline.assets[index];
    final day = DateFormat.yMMMd(currentLocale.replaceAll('-', '_')).format(top.sortTime);
    _overlay.value = _Overlay(
      label: monthLabel(section, yearOnly: yearOnly),
      subtitle: [day, ?top.geo?.localCity].join(' · '),
      position: months == null || months.total < 2 ? 0 : index / (months.total - 1),
      visible: true,
      pastHeader: pastHeader,
    );
    _hideTimer?.cancel();
    _hideTimer = Timer(const Duration(seconds: 3), () {
      if (_dragging || !mounted) return;
      final o = _overlay.value;
      _overlay.value = _Overlay(
        label: o.label,
        subtitle: o.subtitle,
        position: o.position,
        pastHeader: o.pastHeader,
      );
    });
  }

  /// Jumps to photo [index] from the scrubber; loads more pages first when it isn't loaded.
  void _scrubTo(int index) {
    _pendingJump = index;
    if (!_jumping) unawaited(_runJumps());
  }

  Future<void> _runJumps() async {
    _jumping = true;
    try {
      while (_pendingJump != null && mounted) {
        final index = _pendingJump!;
        _pendingJump = null;
        await _timeline.loadUntil(index + 1);
        await WidgetsBinding.instance.endOfFrame;
        if (!mounted || !_scroll.hasClients) return;
        final start = _timelineStart();
        if (start == null) continue;
        final i = math.min(index, _timeline.assets.length - 1);
        if (i < 0) continue;
        final target = start + _currentLayout().offsetOf(i);
        _scroll.jumpTo(target.clamp(0, _scroll.position.maxScrollExtent));
      }
    } finally {
      _jumping = false;
    }
  }

  // ---- menu ----

  Future<void> _showMenu() => showGlassMenu(
    context,
    sections: () {
      final f = _filter;
      final me = ref.read(authProvider).user;
      return [
        GlassMenuSection(
          title: t('显示'),
          items: [
            GlassMenuItem(
              label: t('精选照片'),
              icon: Icons.view_carousel_outlined,
              checked: _showHero,
              onTap: () => _setShowHero(!_showHero),
            ),
          ],
        ),
        GlassMenuSection(
          title: t('照片类型'),
          items: [
            for (final (kind, label, icon) in [
              (null, t('全部'), Icons.apps),
              ('photo', t('照片'), Icons.image_outlined),
              ('video', t('视频'), Icons.videocam_outlined),
              ('gif', t('动图'), Icons.gif_box_outlined),
            ])
              GlassMenuItem(
                label: label,
                icon: icon,
                checked: f.kind == kind,
                onTap: () => _setFilter(kind == null ? f.copyWith(clearKind: true) : f.copyWith(kind: kind)),
              ),
          ],
        ),
        if (_members.length > 1)
          GlassMenuSection(
            title: t('上传者'),
            items: [
              GlassMenuItem(
                label: t('所有人'),
                icon: Icons.groups_outlined,
                checked: f.uploaders.isEmpty,
                onTap: () => _setFilter(f.copyWith(uploaders: const [])),
              ),
              for (final u in _members)
                GlassMenuItem(
                  label: u.id == me?.id ? '${u.name}（${t('我')}）' : u.name,
                  leading: UserAvatar(user: u, api: _api, radius: 14),
                  checked: f.uploaders.contains(u.id),
                  onTap: () {
                    final next = {...f.uploaders};
                    if (!next.remove(u.id)) next.add(u.id);
                    // Everyone ticked is the same as "everyone".
                    _setFilter(
                      f.copyWith(uploaders: next.length == _members.length ? const [] : next.toList()),
                    );
                  },
                ),
            ],
          ),
      ];
    },
  );

  String _counts() {
    final s = _summary;
    if (s == null) return '';
    final f = NumberFormat.decimalPattern(currentLocale.replaceAll('-', '_'));
    return [
      if (s.photos > 0 || s.videos == 0) t('{n} 张照片', {'n': f.format(s.photos)}),
      if (s.videos > 0) t('{n} 个视频', {'n': f.format(s.videos)}),
    ].join(' · ');
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final filtered = _filter.filtered;
    final months = _months;
    // The photos scroll on under the status bar, behind a blur that fades out (see _TopFade)
    final top = MediaQuery.paddingOf(context).top;
    return Stack(
      children: [
        RefreshIndicator(
          edgeOffset: top,
          onRefresh: _refresh,
          child: PinchColumns(
            controller: _scroll,
            remap: _remap,
            builder: (context, columns, physics) {
              _columns = columns;
              _width = MediaQuery.sizeOf(context).width;
              return CustomScrollView(
                controller: _scroll,
                physics: physics,
                slivers: [
                  SliverToBoxAdapter(child: SizedBox(height: top)),
                  SliverToBoxAdapter(
                    child: TabHeader(
                      title: t('图库'),
                      actions: [
                        GlassButton(
                          icon: Icons.more_horiz,
                          active: filtered,
                          tooltip: t('筛选'),
                          onPressed: _showMenu,
                        ),
                        const AccountButton(),
                      ],
                    ),
                  ),
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(20, 0, 12, 4),
                      child: Row(
                        children: [
                          Text(
                            filtered ? t('筛选结果') : t('全部照片'),
                            style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              _counts(),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: theme.colorScheme.onSurfaceVariant,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  if (_showHero && !filtered)
                    SliverToBoxAdapter(
                      child: HeroCarousel(key: _heroKey, api: _api, onOpen: _open),
                    ),
                  SliverToBoxAdapter(key: _startKey, child: const SizedBox.shrink()),
                  ...timelineSlivers(
                    context: context,
                    controller: _timeline,
                    zoom: Zoom.all,
                    columns: columns,
                    onOpen: _open,
                  ),
                  const SliverToBoxAdapter(child: SizedBox(height: 110)),
                ],
              );
            },
          ),
        ),
        // Built once, not on every scroll tick like the overlay below (blurs are costly)
        Positioned(
          top: 0,
          left: 0,
          right: 0,
          height: _TopFade.height(top),
          child: RepaintBoundary(
            child: ValueListenableBuilder(
              valueListenable: _scrolled,
              builder: (context, scrolled, child) => AnnotatedRegion<SystemUiOverlayStyle>(
                // White clock and icons over the dark scrim
                value: scrolled || theme.brightness == Brightness.dark
                    ? SystemUiOverlayStyle.light
                    : SystemUiOverlayStyle.dark,
                child: AnimatedOpacity(
                  opacity: scrolled ? 1 : 0,
                  duration: const Duration(milliseconds: 200),
                  child: child,
                ),
              ),
              child: _TopFade(inset: top),
            ),
          ),
        ),
        ValueListenableBuilder(
          valueListenable: _overlay,
          builder: (context, o, _) => Stack(
            children: [
              // Once the page header has scrolled away: the title at the top left, like Photos, with
              // the date and place of what is on screen under it
              Positioned(
                top: top + 2,
                left: 20,
                right: 80,
                child: IgnorePointer(
                  child: AnimatedOpacity(
                    opacity: o.pastHeader ? 1 : 0,
                    duration: const Duration(milliseconds: 200),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          filtered ? t('筛选结果') : t('图库'),
                          style: theme.textTheme.headlineMedium?.copyWith(
                            fontSize: 30,
                            height: 1.15,
                            fontWeight: FontWeight.w500,
                            color: Colors.white,
                          ),
                        ),
                        if (o.subtitle != null)
                          Text(
                            o.subtitle!,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: theme.textTheme.titleSmall?.copyWith(
                              fontSize: 15,
                              fontWeight: FontWeight.w500,
                              color: Colors.white,
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              ),
              Positioned(
                top: top + 8,
                right: 12,
                child: IgnorePointer(
                  ignoring: !o.pastHeader,
                  child: AnimatedOpacity(
                    opacity: o.pastHeader ? 1 : 0,
                    duration: const Duration(milliseconds: 200),
                    child: GlassButton(
                      icon: Icons.more_horiz,
                      active: filtered,
                      tooltip: t('筛选'),
                      onPressed: _showMenu,
                    ),
                  ),
                ),
              ),
              if (months != null && months.total > 60)
                Positioned(
                  top: top + 64,
                  bottom: 110,
                  right: 0,
                  width: 220,
                  child: TimeScrubber(
                    index: months,
                    position: o.position,
                    visible: o.visible,
                    onScrub: _scrubTo,
                    onDragging: (d) {
                      _dragging = d;
                      if (!d) _onScroll();
                    },
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }
}

/// The top of the library while photos scroll under the status bar, like Photos: a blur that is
/// full behind the status bar and the title and then fades out smoothly (one shader,
/// shaders/progressive_blur.frag, so there are no bands and it stays cheap while scrolling),
/// under a dark scrim so the white title and the clock read over any photo.
class _TopFade extends StatefulWidget {
  const _TopFade({required this.inset});

  /// Height of the status bar.
  final double inset;

  /// The full blur reaches below the title; then it fades out over [_fade].
  static const _full = 22.0;
  static const _fade = 62.0;
  static double height(double inset) => inset + _full + _fade;

  @override
  State<_TopFade> createState() => _TopFadeState();
}

class _TopFadeState extends State<_TopFade> {
  static Future<FragmentProgram>? _program;
  FragmentShader? _shader;

  @override
  void initState() {
    super.initState();
    (_program ??= FragmentProgram.fromAsset('shaders/progressive_blur.frag')).then((p) {
      if (mounted) setState(() => _shader = p.fragmentShader());
    }, onError: (_) {});
  }

  @override
  void dispose() {
    _shader?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final dpr = MediaQuery.devicePixelRatioOf(context);
    final full = (widget.inset + _TopFade._full) * dpr;
    final shader = _shader;
    final ImageFilter filter;
    if (shader != null && ImageFilter.isShaderFilterSupported) {
      shader
        ..setFloat(2, full)
        ..setFloat(3, full + _TopFade._fade * dpr)
        ..setFloat(4, 8 * dpr);
      filter = ImageFilter.shader(shader);
    } else {
      filter = ImageFilter.blur(sigmaX: 12, sigmaY: 12);
    }
    return IgnorePointer(
      child: Stack(
        fit: StackFit.expand,
        children: [
          ClipRect(
            child: BackdropFilter(filter: filter, child: const SizedBox.expand()),
          ),
          const DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                // A dark scrim like Photos, so the white title and clock read over any photo
                // Eased so it thins out gradually instead of ending on a line
                colors: [
                  Color(0x99000000),
                  Color(0x7A000000),
                  Color(0x4D000000),
                  Color(0x24000000),
                  Color(0x0A000000),
                  Color(0x00000000),
                ],
                stops: [0, 0.3, 0.55, 0.75, 0.9, 1],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
