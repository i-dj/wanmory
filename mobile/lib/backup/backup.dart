import 'dart:async';
import 'dart:io';

import 'package:background_downloader/background_downloader.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart' show AppLifecycleState, WidgetsBinding;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:logging/logging.dart';
import 'package:path_provider/path_provider.dart';
import 'package:photo_manager/photo_manager.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../api/client.dart';
import '../auth/auth.dart';
import '../i18n.dart';
import 'upload_task.dart';

final _log = Logger('backup');

enum BackupPhase {
  /// Album sync is turned off.
  off,

  /// The user hasn't allowed access to the photo library.
  noPermission,

  /// Reading the phone's library.
  scanning,
  uploading,

  /// "Only on Wi-Fi" is on and the phone isn't on Wi-Fi; queued uploads wait for it.
  waitingWifi,

  /// Everything is on the server.
  done,

  /// Stopped by an error (see [BackupState.message]); tries again later.
  error,
}

class BackupState {
  const BackupState({
    this.enabled = false,
    this.videos = true,
    this.wifiOnly = true,
    this.phase = BackupPhase.off,
    this.total = 0,
    this.synced = 0,
    this.pending = 0,
    this.queued = 0,
    this.failed = 0,
    this.current,
    this.currentProgress = 0,
    this.eta,
    this.message,
  });

  final bool enabled;

  /// Also upload videos.
  final bool videos;
  final bool wifiOnly;
  final BackupPhase phase;

  /// Photos (and videos) on the phone that sync covers.
  final int total;
  final int synced;

  /// Not on the server yet.
  final int pending;

  /// Handed to the system's background upload queue (part of [pending]).
  final int queued;

  /// Skipped: unsupported type, or the file couldn't be read (e.g. still in iCloud).
  final int failed;

  /// File name being uploaded.
  final String? current;

  /// 0–1 for the current file.
  final double currentProgress;

  /// Estimated time left; null until the upload speed is known.
  final Duration? eta;

  /// Error message (a Chinese source string for `t()`).
  final String? message;

  BackupState copyWith({
    bool? enabled,
    bool? videos,
    bool? wifiOnly,
    BackupPhase? phase,
    int? total,
    int? synced,
    int? pending,
    int? queued,
    int? failed,
    String? current,
    bool clearCurrent = false,
    double? currentProgress,
    Duration? eta,
    bool clearEta = false,
    String? message,
  }) => BackupState(
    enabled: enabled ?? this.enabled,
    videos: videos ?? this.videos,
    wifiOnly: wifiOnly ?? this.wifiOnly,
    phase: phase ?? this.phase,
    total: total ?? this.total,
    synced: synced ?? this.synced,
    pending: pending ?? this.pending,
    queued: queued ?? this.queued,
    failed: failed ?? this.failed,
    current: clearCurrent ? null : (current ?? this.current),
    currentProgress: currentProgress ?? this.currentProgress,
    eta: clearEta ? null : (eta ?? this.eta),
    message: message,
  );
}

/// Estimates the time left: bytes still to send (queued files exactly, the rest from average
/// photo and video sizes) divided by the overall upload rate, smoothed so one slow moment
/// doesn't swing the estimate. Several files upload at once, so the rate is measured over
/// all of them together.
class EtaEstimator {
  double? _bytesPerSecond;
  int? _lastBytes;
  DateTime? _lastAt;
  int _photoBytes = 0, _photos = 0, _videoBytes = 0, _videos = 0;

  /// Sizes seen so far (when a file is queued), for estimating files not queued yet.
  void size({required int bytes, required bool video}) {
    if (video) {
      _videoBytes += bytes;
      _videos++;
    } else {
      _photoBytes += bytes;
      _photos++;
    }
  }

  /// Total bytes sent so far, at [now].
  void sample(int sentBytes, DateTime now) {
    final lastAt = _lastAt, lastBytes = _lastBytes;
    if (lastAt == null || lastBytes == null || sentBytes < lastBytes) {
      _lastAt = now;
      _lastBytes = sentBytes;
      return;
    }
    final ms = now.difference(lastAt).inMilliseconds;
    if (ms < 1000) return;
    final speed = (sentBytes - lastBytes) * 1000 / ms;
    _bytesPerSecond = _bytesPerSecond == null ? speed : _bytesPerSecond! * 0.7 + speed * 0.3;
    _lastAt = now;
    _lastBytes = sentBytes;
  }

  double get averagePhoto =>
      _photos > 0 ? _photoBytes / _photos : (_videos > 0 ? _videoBytes / _videos / 10 : 3e6);
  double get averageVideo => _videos > 0 ? _videoBytes / _videos : averagePhoto * 10;

  Duration? estimate({required int queuedBytesLeft, required int photosLeft, required int videosLeft}) {
    final speed = _bytesPerSecond;
    if (speed == null || speed <= 0) return null;
    final bytes = queuedBytesLeft + photosLeft * averagePhoto + videosLeft * averageVideo;
    return Duration(seconds: (bytes / speed).ceil());
  }
}

final backupProvider = NotifierProvider<BackupNotifier, BackupState>(BackupNotifier.new);

/// Album sync. Photos are copied out of the library into the app's own storage and handed to
/// the system as background uploads (see [backupTask]): iOS and Android keep sending them while
/// the app is in the background or suspended. Whenever the app gets time to run (opened,
/// brought back, or woken in the background when uploads finish) the queue is topped up, so
/// the uploads keep going until the library is on the server.
///
/// What has been uploaded is remembered per server and account (by the phone's photo ID); the
/// server also recognizes files it already has, so nothing is stored twice.
class BackupNotifier extends Notifier<BackupState> {
  /// Per server and account: signing in somewhere else never starts uploading by itself.
  static const _kEnabled = 'backup.enabled';
  static const _kVideos = 'backup.videos';
  static const _kWifiOnly = 'backup.wifi_only';

  /// Queue size: how many files (and bytes) wait in the system queue at once. Big enough to
  /// keep uploading for a long while in the background, small enough not to fill the phone.
  static const _maxQueued = 300;
  static const _maxQueuedBytes = 4 << 30;

  /// Time to spend copying files when woken in the background (iOS allows about 30 s).
  static const _backgroundBudget = Duration(seconds: 20);

  SharedPreferences? _prefs;
  final Map<String, QueuedAsset> _queued = {};
  final _eta = EtaEstimator();
  int _sentBytes = 0;
  int _photosLeft = 0, _videosLeft = 0;
  Set<String>? _doneCache;
  bool _ready = false;
  bool _refilling = false;
  bool _again = false;
  bool _watching = false;
  StreamSubscription<TaskUpdate>? _updates;
  StreamSubscription<List<ConnectivityResult>>? _connectivity;

  @override
  BackupState build() {
    ref.onDispose(() {
      _updates?.cancel();
      _connectivity?.cancel();
    });
    // Runs while signed in, also behind the Face ID lock; stops on sign-out.
    ref.listen(authProvider.select((s) => s.status), (_, status) {
      if (status == AuthStatus.signedIn || status == AuthStatus.locked) {
        unawaited(_switchAccount());
      } else if (status == AuthStatus.signedOut) {
        _cancelAll();
        _loadedAccount = null;
        state = BackupState(videos: state.videos, wifiOnly: state.wifiOnly);
      }
    });
    Future.microtask(_init);
    return const BackupState();
  }

  Future<SharedPreferences> get _p async => _prefs ??= await SharedPreferences.getInstance();

  ApiClient? get _api {
    final s = ref.read(authProvider);
    return s.status == AuthStatus.signedIn || s.status == AuthStatus.locked ? s.api : null;
  }

  String? get _account {
    final s = ref.read(authProvider);
    return s.user == null ? null : '${s.server}|${s.user!.id}';
  }

  String? _loadedAccount;

  /// Loads the sync setting of the account now signed in (off unless it was turned on for this
  /// very server and account). Uploads queued for another account are dropped.
  Future<void> _switchAccount() async {
    final account = _account;
    if (!_ready || account == _loadedAccount) {
      start();
      return;
    }
    if (_loadedAccount != null || _queued.values.isNotEmpty) await _cancelAll();
    _loadedAccount = account;
    _doneCache = null;
    final on = account != null && ((await _p).getBool('$_kEnabled:$account') ?? false);
    state = BackupState(
      enabled: on,
      videos: state.videos,
      wifiOnly: state.wifiOnly,
      phase: on ? BackupPhase.scanning : BackupPhase.off,
    );
    start();
  }

  Future<Set<String>> _done() async =>
      _doneCache ??= ((await _p).getStringList('backup.done:$_account') ?? []).toSet();

  Future<void> _saveDone() async {
    final done = _doneCache;
    if (done != null) await (await _p).setStringList('backup.done:$_account', done.toList());
  }

  Future<void> _init() async {
    final p = await _p;
    // Older builds kept one switch for the whole app; it must not carry over to other accounts.
    await p.remove(_kEnabled);
    state = state.copyWith(videos: p.getBool(_kVideos) ?? true, wifiOnly: p.getBool(_kWifiOnly) ?? true);
    final d = FileDownloader();
    await d.configure(globalConfig: [(Config.resourceTimeout, const Duration(days: 7))]);
    if (Platform.isAndroid) {
      d.configureNotificationForGroup(
        backupGroup,
        running: TaskNotification(t('同步相册'), t('正在上传 {name}', {'name': '{filename}'})),
        progressBar: true,
      );
    }
    _updates = d.updates.listen(_onUpdate);
    // Delivers what finished while the app was suspended or not running.
    await d.start(markDownloadedComplete: false, autoCleanDatabase: true);
    // Uploads still queued from before, for the server signed in now; anything else is dropped.
    final base = _api?.baseUrl;
    for (final task in await d.allTasks(group: backupGroup)) {
      final meta = task.metaData;
      if (base != null && task.url.startsWith('$base/') && meta.isNotEmpty) {
        _queued[task.taskId] = QueuedAsset.fromJson(meta);
      } else {
        await d.cancelTaskWithId(task.taskId);
      }
    }
    _ready = true;
    await _switchAccount();
  }

  Future<void> setEnabled(bool on) async {
    if (on) {
      final perm = await PhotoManager.requestPermissionExtend();
      if (!perm.hasAccess) {
        state = state.copyWith(phase: BackupPhase.noPermission);
        return;
      }
      // Android shows upload progress as a notification (and needs one to keep going).
      if (Platform.isAndroid) await FileDownloader().permissions.request(PermissionType.notifications);
    }
    final account = _account;
    if (account == null) return;
    await (await _p).setBool('$_kEnabled:$account', on);
    state = state.copyWith(
      enabled: on,
      phase: on ? state.phase : BackupPhase.off,
      clearCurrent: true,
      clearEta: true,
    );
    on ? start() : await _cancelAll();
  }

  Future<void> setVideos(bool on) async {
    await (await _p).setBool(_kVideos, on);
    state = state.copyWith(videos: on);
    await restart();
  }

  Future<void> setWifiOnly(bool on) async {
    await (await _p).setBool(_kWifiOnly, on);
    state = state.copyWith(wifiOnly: on);
    await restart();
  }

  /// Opens the system settings to allow photo access after it was denied.
  Future<void> openSettings() => PhotoManager.openSetting();

  /// Requeues everything (after the Wi-Fi or video setting changed, or "sync now").
  Future<void> restart() async {
    await _cancelAll();
    start();
  }

  Future<void> _cancelAll() async {
    await FileDownloader().cancelAll(group: backupGroup);
    _queued.clear();
    try {
      final dir = Directory('${(await getApplicationSupportDirectory()).path}/$backupDir');
      if (await dir.exists()) await dir.delete(recursive: true);
    } on FileSystemException catch (e) {
      _log.warning('cannot remove queued copies', e);
    }
    state = state.copyWith(queued: 0, clearCurrent: true, clearEta: true);
  }

  /// Tops up the upload queue if sync is on.
  void start() {
    if (!_ready || !state.enabled || _api == null) return;
    _watch();
    if (_refilling) {
      _again = true;
      return;
    }
    unawaited(_loop());
  }

  void _watch() {
    if (_watching) return;
    _watching = true;
    PhotoManager.addChangeCallback((_) => start());
    PhotoManager.startChangeNotify();
    _connectivity = Connectivity().onConnectivityChanged.listen((_) => start());
  }

  Future<void> _loop() async {
    _refilling = true;
    try {
      do {
        _again = false;
        await _refill();
      } while (_again && state.enabled);
    } finally {
      _refilling = false;
    }
  }

  bool get _inBackground => WidgetsBinding.instance.lifecycleState != AppLifecycleState.resumed;

  Future<bool> _onWifi() async {
    final c = await Connectivity().checkConnectivity();
    return c.contains(ConnectivityResult.wifi) || c.contains(ConnectivityResult.ethernet);
  }

  Future<void> _refill() async {
    final api = _api;
    if (api == null || !state.enabled) return;
    // Don't show the permission prompt from the background.
    final perm = _inBackground
        ? await PhotoManager.getPermissionState(requestOption: const PermissionRequestOption())
        : await PhotoManager.requestPermissionExtend();
    if (!perm.hasAccess) {
      state = state.copyWith(phase: BackupPhase.noPermission);
      return;
    }

    if (state.total == 0) state = state.copyWith(phase: BackupPhase.scanning);
    final List<AssetEntity> all;
    try {
      all = await _localAssets();
    } on PlatformException catch (e) {
      _log.warning('cannot read the photo library', e);
      state = state.copyWith(phase: BackupPhase.error, message: '读取手机相册失败');
      return;
    }
    final done = await _done();
    final queuedAssets = {for (final q in _queued.values) q.asset};
    final todo = all.where((a) => !done.contains(a.id) && !queuedAssets.contains(a.id)).toList();
    final synced = all.where((a) => done.contains(a.id)).length;
    _photosLeft = todo.where((a) => a.type != AssetType.video).length;
    _videosLeft = todo.length - _photosLeft;
    state = state.copyWith(
      total: all.length,
      synced: synced,
      pending: all.length - synced,
      queued: _queued.length,
    );

    final deadline = _inBackground ? DateTime.now().add(_backgroundBudget) : null;
    var queuedBytes = _queued.values.fold<int>(0, (s, q) => s + q.bytes);
    final batch = <UploadTask>[];
    var failed = state.failed;
    for (final asset in todo) {
      if (!state.enabled || _api == null) return;
      if (_queued.length + batch.length >= _maxQueued || queuedBytes >= _maxQueuedBytes) break;
      if (deadline != null && DateTime.now().isAfter(deadline)) break;
      // Finished or queued since the list was made.
      if (done.contains(asset.id) || _queued.containsKey('backup:${asset.id}')) continue;
      try {
        final task = await _prepare(api, asset);
        if (task == null) {
          failed++;
          continue;
        }
        final info = QueuedAsset.fromJson(task.metaData);
        queuedBytes += info.bytes;
        _eta.size(bytes: info.bytes, video: info.video);
        batch.add(task);
        _queued[task.taskId] = info;
        info.video ? _videosLeft-- : _photosLeft--;
        if (batch.length >= 10) await _enqueue(batch);
      } on FileSystemException catch (e) {
        // Usually the phone is out of space: stop adding and let the queue drain.
        _log.warning('cannot copy ${asset.id}', e);
        break;
      }
    }
    await _enqueue(batch);
    await PhotoManager.clearFileCache();
    state = state.copyWith(failed: failed, queued: _queued.length);
    await _updatePhase();
  }

  Future<void> _enqueue(List<UploadTask> batch) async {
    if (batch.isEmpty) return;
    await FileDownloader().enqueueAll(List.of(batch));
    batch.clear();
    state = state.copyWith(queued: _queued.length, phase: BackupPhase.uploading);
  }

  Future<void> _updatePhase() async {
    if (_queued.isEmpty && state.pending == 0) {
      state = state.copyWith(phase: BackupPhase.done, clearCurrent: true, clearEta: true);
    } else if (_queued.isNotEmpty && state.wifiOnly && !await _onWifi()) {
      state = state.copyWith(phase: BackupPhase.waitingWifi);
    } else if (_queued.isNotEmpty) {
      state = state.copyWith(phase: BackupPhase.uploading);
    }
  }

  /// The phone's photos (and videos when chosen), newest first.
  Future<List<AssetEntity>> _localAssets() async {
    final paths = await PhotoManager.getAssetPathList(
      onlyAll: true,
      type: state.videos ? RequestType.common : RequestType.image,
      filterOption: FilterOptionGroup(
        orders: [const OrderOption(type: OrderOptionType.createDate, asc: false)],
      ),
    );
    if (paths.isEmpty) return [];
    final path = paths.first;
    final count = await path.assetCountAsync;
    final out = <AssetEntity>[];
    for (var start = 0; start < count; start += 500) {
      out.addAll(await path.getAssetListRange(start: start, end: (start + 500).clamp(0, count)));
    }
    return out;
  }

  /// Copies the original into the upload directory and builds its task; null when the file
  /// can't be read (for example still in iCloud without a connection).
  Future<UploadTask?> _prepare(ApiClient api, AssetEntity asset) async {
    final video = asset.type == AssetType.video;
    final File? src = await asset.loadFile(isOrigin: true);
    if (src == null) return null;
    var name = await asset.titleAsync;
    if (name.isEmpty) name = '${asset.id.replaceAll('/', '_')}${video ? '.mov' : '.jpg'}';
    final dot = name.lastIndexOf('.');
    final ext = dot > 0 ? name.substring(dot) : (video ? '.mov' : '.jpg');
    final safe = asset.id.replaceAll(RegExp(r'[^A-Za-z0-9_-]'), '_');
    final fileName = '$safe$ext';
    final dir = Directory('${(await getApplicationSupportDirectory()).path}/$backupDir');
    await dir.create(recursive: true);
    final copy = File('${dir.path}/$fileName');
    // photo_manager's copy lives in the cache: move it when possible, otherwise copy.
    final inCache =
        src.path.contains('/Caches/') || src.path.contains('/tmp/') || src.path.contains('/cache/');
    if (inCache) {
      try {
        await src.rename(copy.path);
      } on FileSystemException {
        await src.copy(copy.path);
        await src.delete();
      }
    } else {
      await src.copy(copy.path);
    }
    final info = QueuedAsset(asset: asset.id, name: name, bytes: await copy.length(), video: video);
    return backupTask(
      api: api,
      info: info,
      fileName: fileName,
      taken: asset.createDateTime,
      wifiOnly: state.wifiOnly,
    );
  }

  int get _queuedBytesLeft => _queued.values.fold(0, (s, q) => s + (q.bytes * (1 - q.progress)).round());

  void _onUpdate(TaskUpdate update) {
    if (update.task.group != backupGroup) return;
    switch (update) {
      case TaskProgressUpdate(:final progress):
        final q = _queued[update.task.taskId];
        if (q == null || progress < 0) return;
        q.progress = progress.clamp(0, 1);
        final inFlight = _queued.values.fold<int>(0, (s, q) => s + (q.bytes * q.progress).round());
        _eta.sample(_sentBytes + inFlight, DateTime.now());
        state = state.copyWith(
          phase: BackupPhase.uploading,
          current: q.name,
          currentProgress: q.progress,
          eta: _eta.estimate(
            queuedBytesLeft: _queuedBytesLeft,
            photosLeft: _photosLeft,
            videosLeft: _videosLeft,
          ),
        );
      case TaskStatusUpdate(:final status):
        if (!status.isFinalState) return;
        unawaited(_finished(update));
    }
  }

  Future<void> _finished(TaskStatusUpdate u) async {
    final id = u.task.taskId;
    final q = _queued[id] ?? (u.task.metaData.isEmpty ? null : QueuedAsset.fromJson(u.task.metaData));
    // The task stays in _queued until it is marked done, so a refill running meanwhile
    // can't queue the same photo again.
    var signedOut = false;
    try {
      if (q != null && u.status != TaskStatus.canceled) signedOut = await _record(u, q);
    } finally {
      _queued.remove(id);
      state = state.copyWith(queued: _queued.length);
      await _deleteCopy(u.task);
      await FileDownloader().database.deleteRecordsWithIds([id]);
    }
    if (signedOut || q == null || u.status == TaskStatus.canceled) return;
    // Keep the queue topped up, also when woken in the background.
    start();
    if (_queued.isEmpty && !_refilling) await _updatePhase();
  }

  /// Records a finished upload; true when the server signed us out.
  Future<bool> _record(TaskStatusUpdate u, QueuedAsset q) async {
    switch (outcome(u)) {
      case Outcome.uploaded:
        _sentBytes += q.bytes;
        (await _done()).add(q.asset);
        await _saveDone();
        state = state.copyWith(synced: state.synced + 1, pending: state.pending - 1);
        _log.info(
          'uploaded ${u.responseHeaders?['wanmory-duplicate'] == 'true' ? '(already on the server) ' : ''}${q.name}',
        );
      case Outcome.refused:
        _log.info('server refused ${q.name} (${u.responseStatusCode ?? u.exception})');
        (await _done()).add(q.asset);
        await _saveDone();
        state = state.copyWith(failed: state.failed + 1, pending: state.pending - 1);
      case Outcome.unauthorized:
        await ref.read(authProvider.notifier).sessionExpired();
        return true;
      case Outcome.retry:
        // The system already retried; queue it again on the next pass.
        _log.info('upload of ${q.name} failed: ${u.exception?.description}');
        state = state.copyWith(message: u.exception?.description);
    }
    return false;
  }

  Future<void> _deleteCopy(Task task) async {
    try {
      final f = File(await task.filePath());
      if (await f.exists()) await f.delete();
    } on Object catch (e) {
      _log.info('cannot delete the copy of ${task.taskId}: $e');
    }
  }
}
