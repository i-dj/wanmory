import 'dart:async';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import 'package:material_ui/material_ui.dart';

import '../api/client.dart';
import '../api/models.dart';
import '../i18n.dart';

/// The featured card at the top of the library: the server's highlights (best-looking landscape
/// photos, one per day), changing every few seconds. Shows nothing when there are none.
class HeroCarousel extends StatefulWidget {
  const HeroCarousel({super.key, required this.api, required this.onOpen});

  final ApiClient api;
  final void Function(List<Asset> assets, int index) onOpen;

  @override
  State<HeroCarousel> createState() => _HeroCarouselState();
}

class _HeroCarouselState extends State<HeroCarousel> {
  static const _interval = Duration(seconds: 6);

  final _pages = PageController();
  List<Asset> _items = [];
  int _index = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final items = await widget.api.highlights();
      if (!mounted) return;
      setState(() => _items = items);
      _restartTimer();
    } on ApiException {
      // Highlights are optional; the timeline below shows any real error.
    }
  }

  void _restartTimer() {
    _timer?.cancel();
    if (_items.length < 2) return;
    _timer = Timer.periodic(_interval, (_) {
      if (!_pages.hasClients) return;
      final next = (_index + 1) % _items.length;
      _pages.animateToPage(next, duration: const Duration(milliseconds: 600), curve: Curves.easeInOut);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pages.dispose();
    super.dispose();
  }

  /// "On this day" when the photo was taken on today's date in an earlier year.
  static String _when(Asset a) {
    final d = a.sortTime;
    final now = DateTime.now();
    if (d.month == now.month && d.day == now.day && d.year < now.year) return t('那年今日');
    return DateFormat.yMMMd(currentLocale.replaceAll('-', '_')).format(d);
  }

  static String _title(Asset a) {
    final geo = a.geo;
    if (geo == null) return t('精选照片');
    final country = currentLocale.startsWith('zh') ? geo.country : null;
    return country == null || country == geo.city ? geo.localCity : '$country · ${geo.localCity}';
  }

  @override
  Widget build(BuildContext context) {
    if (_items.isEmpty) return const SizedBox.shrink();
    final api = widget.api;
    final a = _items[_index];
    final scheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(14),
        child: AspectRatio(
          aspectRatio: 16 / 9,
          child: Stack(
            fit: StackFit.expand,
            children: [
              PageView.builder(
                controller: _pages,
                itemCount: _items.length,
                onPageChanged: (i) {
                  setState(() => _index = i);
                  _restartTimer();
                },
                itemBuilder: (context, i) => GestureDetector(
                  onTap: () => widget.onOpen(_items, i),
                  child: CachedNetworkImage(
                    imageUrl: api.previewUrl(_items[i].id),
                    cacheKey: '${api.baseUrl}/preview/${_items[i].id}',
                    httpHeaders: api.authHeaders,
                    fit: BoxFit.cover,
                    placeholder: (_, _) => ColoredBox(color: scheme.surfaceContainerHighest),
                  ),
                ),
              ),
              const IgnorePointer(
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      stops: [0.3, 0.65, 1],
                      colors: [Colors.transparent, Color(0x66000000), Color(0xDD000000)],
                    ),
                  ),
                ),
              ),
              Positioned(
                left: 14,
                right: 14,
                bottom: 12,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: scheme.primary,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            '${t('精选')} · ${(_index + 1).toString().padLeft(2, '0')}',
                            style: TextStyle(
                              color: scheme.onPrimary,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Flexible(
                          child: Text(
                            [
                              _when(a),
                              if (a.geo != null && _title(a) == t('精选照片')) a.geo!.localCity,
                            ].join(' · '),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(color: Colors.white70, fontSize: 12),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            _title(a),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 20,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        _Dots(count: _items.length, index: _index),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Dots extends StatelessWidget {
  const _Dots({required this.count, required this.index});

  final int count;
  final int index;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(6),
    decoration: BoxDecoration(color: Colors.black38, borderRadius: BorderRadius.circular(10)),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        for (var i = 0; i < count; i++)
          AnimatedContainer(
            duration: const Duration(milliseconds: 250),
            margin: const EdgeInsets.symmetric(horizontal: 2),
            width: i == index ? 12 : 5,
            height: 5,
            decoration: BoxDecoration(
              color: i == index ? Colors.white : Colors.white54,
              borderRadius: BorderRadius.circular(3),
            ),
          ),
      ],
    ),
  );
}
