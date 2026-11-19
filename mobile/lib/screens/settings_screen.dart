import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:material_ui/material_ui.dart';

import '../backup/backup.dart';
import '../i18n.dart';

/// App settings. For now: album sync (upload the phone's photos and videos to the server).
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
    final muted = theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant);
    return Scaffold(
      appBar: AppBar(title: Text(t('设置'))),
      body: ListView(
        padding: EdgeInsets.only(bottom: MediaQuery.paddingOf(context).bottom + 24),
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
            child: Text(
              t('同步相册'),
              style: theme.textTheme.titleSmall?.copyWith(color: theme.colorScheme.primary),
            ),
          ),
          SwitchListTile(
            secondary: const Icon(Icons.cloud_upload_outlined),
            title: Text(t('自动上传手机相册')),
            subtitle: Text(t('把手机里的照片和视频上传到万象，已经上传过的不会重复上传')),
            value: s.enabled,
            onChanged: b.setEnabled,
          ),
          SwitchListTile(
            secondary: const Icon(Icons.videocam_outlined),
            title: Text(t('包括视频')),
            value: s.videos,
            onChanged: s.enabled ? b.setVideos : null,
          ),
          SwitchListTile(
            secondary: const Icon(Icons.wifi),
            title: Text(t('仅在 Wi-Fi 下上传')),
            value: s.wifiOnly,
            onChanged: s.enabled ? b.setWifiOnly : null,
          ),
          if (s.phase == BackupPhase.noPermission)
            _Card(
              icon: Icons.photo_library_outlined,
              title: t('没有访问手机相册的权限'),
              body: t('在系统设置里允许万象访问照片后才能同步'),
              action: TextButton(onPressed: b.openSettings, child: Text(t('去设置'))),
            )
          else if (s.enabled)
            _StatusCard(state: s, onSync: b.restart),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: Text(t('退到后台也会继续上传。在多任务界面把万象划掉会中断上传，下次打开万象时继续。'), style: muted),
          ),
        ],
      ),
    );
  }
}

class _StatusCard extends StatelessWidget {
  const _StatusCard({required this.state, required this.onSync});

  final BackupState state;
  final VoidCallback onSync;

  @override
  Widget build(BuildContext context) {
    final s = state;
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final f = NumberFormat.decimalPattern(currentLocale.replaceAll('-', '_'));
    final (IconData icon, String status) = switch (s.phase) {
      BackupPhase.scanning => (Icons.search, t('正在读取手机相册…')),
      BackupPhase.uploading => (Icons.cloud_upload_outlined, t('正在上传 {name}', {'name': s.current ?? ''})),
      BackupPhase.waitingWifi => (Icons.wifi_off, t('等待连接 Wi-Fi')),
      BackupPhase.done => (Icons.cloud_done_outlined, t('全部已同步')),
      BackupPhase.error => (Icons.error_outline, '${t('同步暂停：')}${t(s.message ?? '服务器内部错误')}'),
      _ => (Icons.cloud_outlined, ''),
    };
    final uploading = s.phase == BackupPhase.uploading;
    return _Card(
      icon: icon,
      title: status,
      bodyWidget: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 12),
          Row(
            children: [
              _Count(label: t('已同步'), value: f.format(s.synced)),
              _Count(label: t('未同步'), value: f.format(s.pending), highlight: s.pending > 0),
              _Count(
                label: t('预计还需'),
                value: s.pending == 0
                    ? '—'
                    : s.eta == null
                    ? t('正在估算…')
                    : SettingsScreen.duration(s.eta!),
              ),
            ],
          ),
          if (s.total > 0) ...[
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: s.synced / s.total,
                minHeight: 6,
                backgroundColor: scheme.surfaceContainerHighest,
              ),
            ),
          ],
          if (uploading) ...[
            const SizedBox(height: 8),
            LinearProgressIndicator(
              value: s.currentProgress,
              minHeight: 2,
              backgroundColor: Colors.transparent,
            ),
          ],
          if (s.queued > 0) ...[
            const SizedBox(height: 8),
            Text(
              t('{n} 项已交给系统在后台上传', {'n': s.queued}),
              style: theme.textTheme.bodySmall?.copyWith(color: scheme.onSurfaceVariant),
            ),
          ],
          if (s.failed > 0) ...[
            const SizedBox(height: 8),
            Text(
              t('{n} 项无法上传（格式不支持，或还在 iCloud 里没下载下来）', {'n': s.failed}),
              style: theme.textTheme.bodySmall?.copyWith(color: scheme.error),
            ),
          ],
        ],
      ),
      action: s.phase == BackupPhase.scanning || uploading
          ? null
          : TextButton(onPressed: onSync, child: Text(t('立即同步'))),
    );
  }
}

class _Count extends StatelessWidget {
  const _Count({required this.label, required this.value, this.highlight = false});

  final String label;
  final String value;
  final bool highlight;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
              color: highlight ? theme.colorScheme.primary : null,
            ),
          ),
          Text(label, style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
        ],
      ),
    );
  }
}

class _Card extends StatelessWidget {
  const _Card({required this.icon, required this.title, this.body, this.bodyWidget, this.action});

  final IconData icon;
  final String title;
  final String? body;
  final Widget? bodyWidget;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      padding: const EdgeInsets.fromLTRB(16, 14, 8, 14),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHigh,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 20, color: theme.colorScheme.primary),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.titleSmall,
                ),
              ),
              ?action,
            ],
          ),
          if (body != null) ...[
            const SizedBox(height: 6),
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: Text(body!, style: theme.textTheme.bodySmall),
            ),
          ],
          if (bodyWidget != null) Padding(padding: const EdgeInsets.only(right: 8), child: bodyWidget),
        ],
      ),
    );
  }
}
