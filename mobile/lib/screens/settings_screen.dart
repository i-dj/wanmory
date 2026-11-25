import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:material_ui/material_ui.dart';

import '../backup/backup.dart';
import '../i18n.dart';

/// App settings. For now: album sync (upload the phone's photos and videos to the server):
/// a group of switches, a status card with the file in progress and a pause button, and a note.
class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  /// "about 5 min", "about 1 h 20 min".
  static String duration(Duration d) {
    if (d.inMinutes < 1) return t('不到 1 分钟');
    if (d.inHours < 1) return t('{n} 分钟', {'n': d.inMinutes});
    return t('{h} 小时 {m} 分钟', {'h': d.inHours, 'm': d.inMinutes % 60});
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(backupProvider);
    final b = ref.read(backupProvider.notifier);
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    return Scaffold(
      appBar: AppBar(title: Text(t('设置'))),
      body: ListView(
        padding: EdgeInsets.fromLTRB(16, 8, 16, MediaQuery.paddingOf(context).bottom + 24),
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(4, 0, 4, 10),
            child: Text(
              t('同步相册'),
              style: theme.textTheme.titleSmall?.copyWith(color: scheme.primary, fontWeight: FontWeight.w600),
            ),
          ),
          _Group(
            children: [
              _SwitchRow(
                icon: Icons.cloud_upload_outlined,
                title: t('自动上传手机相册'),
                subtitle: t('把手机里的照片和视频上传到万象，已经上传过的不会重复上传'),
                value: s.enabled,
                onChanged: b.setEnabled,
              ),
              _SwitchRow(
                icon: Icons.videocam_outlined,
                title: t('包括视频'),
                value: s.videos,
                onChanged: s.enabled ? b.setVideos : null,
              ),
              _SwitchRow(
                icon: Icons.wifi_rounded,
                title: t('仅在 Wi-Fi 下上传'),
                value: s.wifiOnly,
                onChanged: s.enabled ? b.setWifiOnly : null,
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (s.phase == BackupPhase.noPermission)
            _Group(
              children: [
                _Status(
                  icon: Icons.photo_library_outlined,
                  title: t('没有访问手机相册的权限'),
                  subtitle: t('在系统设置里允许万象访问照片后才能同步'),
                  action: _PillButton(
                    icon: Icons.settings_outlined,
                    label: t('去设置'),
                    onPressed: b.openSettings,
                  ),
                ),
              ],
            )
          else if (s.enabled)
            _StatusCard(state: s, onPause: b.pause, onResume: b.resume, onSync: b.restart),
          Padding(
            padding: const EdgeInsets.fromLTRB(4, 14, 4, 0),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.only(top: 1),
                  child: Icon(Icons.info_outline_rounded, size: 18, color: scheme.onSurfaceVariant),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    t('退到后台也会继续上传。在多任务界面把万象划掉会中断上传，下次打开万象时继续。'),
                    style: theme.textTheme.bodySmall?.copyWith(color: scheme.onSurfaceVariant, height: 1.5),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// A white rounded card holding rows, with thin dividers between them.
class _Group extends StatelessWidget {
  const _Group({required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final dark = Theme.of(context).brightness == Brightness.dark;
    return DecoratedBox(
      decoration: BoxDecoration(
        color: dark ? scheme.surfaceContainerHigh : scheme.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: scheme.outlineVariant.withValues(alpha: 0.5)),
        boxShadow: dark
            ? null
            : [
                BoxShadow(
                  color: scheme.shadow.withValues(alpha: 0.05),
                  blurRadius: 16,
                  offset: const Offset(0, 4),
                ),
              ],
      ),
      child: Column(
        children: [
          for (var i = 0; i < children.length; i++) ...[
            if (i > 0)
              Divider(
                height: 1,
                thickness: 1,
                indent: 76,
                color: scheme.outlineVariant.withValues(alpha: 0.5),
              ),
            children[i],
          ],
        ],
      ),
    );
  }
}

/// The rounded tinted square behind a row's icon.
class _IconTile extends StatelessWidget {
  const _IconTile(this.icon);

  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      width: 46,
      height: 46,
      decoration: BoxDecoration(
        color: scheme.primary.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Icon(icon, size: 23, color: scheme.primary),
    );
  }
}

class _SwitchRow extends StatelessWidget {
  const _SwitchRow({
    required this.icon,
    required this.title,
    this.subtitle,
    required this.value,
    this.onChanged,
  });

  final IconData icon;
  final String title;
  final String? subtitle;
  final bool value;
  final ValueChanged<bool>? onChanged;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final enabled = onChanged != null;
    return InkWell(
      borderRadius: BorderRadius.circular(24),
      onTap: enabled ? () => onChanged!(!value) : null,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 14, 14, 14),
        child: Opacity(
          opacity: enabled ? 1 : 0.5,
          child: Row(
            children: [
              _IconTile(icon),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w500)),
                    if (subtitle != null) ...[
                      const SizedBox(height: 3),
                      Text(
                        subtitle!,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: scheme.onSurfaceVariant,
                          height: 1.45,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: 10),
              Switch(
                value: value,
                onChanged: onChanged,
                // (Greyed out with the row while sync is off, not with the switch's own disabled look)
                thumbColor: WidgetStateProperty.resolveWith(
                  (states) => states.contains(WidgetState.selected) ? Colors.white : scheme.outline,
                ),
                trackColor: WidgetStateProperty.resolveWith(
                  (states) =>
                      states.contains(WidgetState.selected) ? scheme.primary : scheme.surfaceContainerHighest,
                ),
                trackOutlineColor: const WidgetStatePropertyAll(Colors.transparent),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Icon, title and one line under it, with an optional button on the right.
class _Status extends StatelessWidget {
  const _Status({required this.icon, required this.title, required this.subtitle, this.action, this.bottom});

  final IconData icon;
  final String title;
  final String subtitle;
  final Widget? action;
  final Widget? bottom;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
      child: Column(
        children: [
          Row(
            children: [
              _IconTile(icon),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // One line each: the text changes as files go, and the card must not jump
                    Text(
                      title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                    ),
                  ],
                ),
              ),
              if (action != null) ...[const SizedBox(width: 10), action!],
            ],
          ),
          ?bottom,
        ],
      ),
    );
  }
}

class _PillButton extends StatelessWidget {
  const _PillButton({required this.icon, required this.label, required this.onPressed});

  final IconData icon;
  final String label;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return OutlinedButton.icon(
      onPressed: onPressed,
      icon: Icon(icon, size: 20),
      label: Text(label),
      style: OutlinedButton.styleFrom(
        foregroundColor: scheme.onSurface,
        side: BorderSide(color: scheme.outlineVariant),
        shape: const StadiumBorder(),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
      ),
    );
  }
}

class _StatusCard extends StatelessWidget {
  const _StatusCard({
    required this.state,
    required this.onPause,
    required this.onResume,
    required this.onSync,
  });

  final BackupState state;
  final VoidCallback onPause;
  final VoidCallback onResume;
  final VoidCallback onSync;

  @override
  Widget build(BuildContext context) {
    final s = state;
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final f = NumberFormat.decimalPattern(currentLocale.replaceAll('-', '_'));
    final left = t('剩余 {n} 项', {'n': f.format(s.pending)});
    final working = !s.paused && (s.phase == BackupPhase.uploading || s.phase == BackupPhase.scanning);
    final pct = '${(s.currentProgress * 100).round()}%';

    final (IconData icon, String title, String subtitle) = s.paused
        ? (Icons.pause_circle_outline_rounded, t('已暂停'), left)
        : switch (s.phase) {
            BackupPhase.scanning => (Icons.manage_search_rounded, t('正在读取手机相册…'), left),
            BackupPhase.uploading when s.downloading => (
              Icons.cloud_download_outlined,
              t('正在下载原片'),
              '$pct · $left',
            ),
            BackupPhase.uploading => (Icons.cloud_upload_outlined, t('正在上传'), '$pct · $left'),
            BackupPhase.waitingWifi => (Icons.wifi_off_rounded, t('等待连接 Wi-Fi'), left),
            BackupPhase.done => (
              Icons.cloud_done_outlined,
              t('全部已同步'),
              t('{n} 项已在万象', {'n': f.format(s.synced)}),
            ),
            BackupPhase.error => (Icons.error_outline_rounded, t('同步暂停'), t(s.message ?? '服务器内部错误')),
            _ => (Icons.cloud_outlined, t('同步相册'), left),
          };

    final Widget? action = s.paused
        ? _PillButton(icon: Icons.play_arrow_rounded, label: t('继续'), onPressed: onResume)
        : working
        ? _PillButton(icon: Icons.pause_rounded, label: t('暂停'), onPressed: onPause)
        : s.phase == BackupPhase.done
        ? null
        : _PillButton(icon: Icons.refresh_rounded, label: t('立即同步'), onPressed: onSync);

    final notes = <(String, bool)>[
      if (s.total > 0 && s.phase != BackupPhase.done)
        (
          t('已同步 {done} / {total}', {'done': f.format(s.synced), 'total': f.format(s.total)}) +
              (s.pending > 0 && s.eta != null ? ' · ${t('预计还需')} ${SettingsScreen.duration(s.eta!)}' : ''),
          false,
        ),
      if (s.lowPower && s.pending > 0) (t('低电量模式已开启：iOS 会暂停后台同步，连上充电器和 Wi‑Fi 后会继续'), false),
      if (s.noRoomFor != null) (t('服务器磁盘空间不够，{name} 先不传，空出空间后会自动继续', {'name': s.noRoomFor!}), true),
      if (s.failed > 0) (t('{n} 项无法上传（格式不支持，或还在 iCloud 里没下载下来）', {'n': s.failed}), true),
    ];

    return _Group(
      children: [
        _Status(
          icon: icon,
          title: title,
          subtitle: subtitle,
          action: action,
          bottom: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (s.phase != BackupPhase.done) ...[
                const SizedBox(height: 16),
                _Bar(
                  // The file in progress; the overall count is in the notes below
                  value: working && s.phase == BackupPhase.uploading
                      ? s.currentProgress
                      : (s.total == 0 ? 0 : s.synced / s.total),
                  active: working,
                ),
              ],
              for (final (text, warn) in notes) ...[
                const SizedBox(height: 10),
                Text(
                  text,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: warn ? scheme.error : scheme.onSurfaceVariant,
                    height: 1.45,
                  ),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

/// A thick rounded progress bar; a soft light sweeps along it while work is going on.
class _Bar extends StatefulWidget {
  const _Bar({required this.value, required this.active});

  final double value;
  final bool active;

  @override
  State<_Bar> createState() => _BarState();
}

class _BarState extends State<_Bar> with SingleTickerProviderStateMixin {
  late final _sweep = AnimationController(vsync: this, duration: const Duration(milliseconds: 1600));

  @override
  void initState() {
    super.initState();
    if (widget.active) _sweep.repeat();
  }

  @override
  void didUpdateWidget(_Bar old) {
    super.didUpdateWidget(old);
    if (widget.active && !_sweep.isAnimating) _sweep.repeat();
    if (!widget.active && _sweep.isAnimating) _sweep.stop();
  }

  @override
  void dispose() {
    _sweep.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final fill = Color.lerp(scheme.onSurfaceVariant, scheme.onSurface, 0.3)!;
    return ClipRRect(
      borderRadius: BorderRadius.circular(6),
      child: SizedBox(
        height: 10,
        child: ColoredBox(
          color: scheme.primary.withValues(alpha: 0.08),
          child: TweenAnimationBuilder<double>(
            tween: Tween(end: widget.value.clamp(0.0, 1.0)),
            duration: const Duration(milliseconds: 350),
            curve: Curves.easeOut,
            builder: (context, v, _) => FractionallySizedBox(
              alignment: Alignment.centerLeft,
              widthFactor: v,
              child: AnimatedBuilder(
                animation: _sweep,
                builder: (context, _) {
                  final x = -1.5 + _sweep.value * 3;
                  return DecoratedBox(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(6),
                      gradient: widget.active
                          ? LinearGradient(
                              begin: Alignment(x - 0.6, 0),
                              end: Alignment(x + 0.6, 0),
                              colors: [fill, Color.lerp(fill, Colors.white, 0.45)!, fill],
                            )
                          : null,
                      color: widget.active ? null : fill,
                    ),
                  );
                },
              ),
            ),
          ),
        ),
      ),
    );
  }
}
