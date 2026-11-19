import 'dart:async';
import 'dart:convert';
import 'dart:math';
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
    this.noRoomFor,
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

  /// A big file the server has no room for (its disk is too full); it is tried again later.
  final String? noRoomFor;

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
    String? noRoomFor,
    bool clearNoRoom = false,
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
    noRoomFor: clearNoRoom ? null : (noRoomFor ?? this.noRoomFor),
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

  /// Per server and account: the big files being sent in pieces.
  static const _kChunked = 'backup.chunked';

  /// Queue size: how many files (and bytes) wait in the system queue at once. Big enough to
  /// keep uploading for a long while in the background, small enough not to fill the phone.
  static const _maxQueued = 300;
  static const _maxQueuedBytes = 4 << 30;

  /// Big files sent in pieces at the same time. Their copies share the [_maxQueuedBytes]
  /// budget, except that one file bigger than all of it may go alone.
  static const _maxChunked = 2;

  /// Time to spend copying files when woken in the background (iOS allows about 30 s).
  static const _backgroundBudget = Duration(seconds: 20);

  SharedPreferences? _prefs;
  final Map<String, QueuedAsset> _queued = {};

  /// Big files sent in pieces, by photo ID, and the piece tasks in the system queue
  /// (task ID → photo ID).
  final Map<String, ChunkedUpload> _chunked = {};
  final Map<String, String> _chunkTasks = {};

  /// Big files from older builds, queued as one request, to continue in pieces.
  final List<ChunkedUpload> _converted = [];

  /// Big files skipped while both piece slots are busy (copied again once one frees up).
  final Set<String> _deferred = {};
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
    // Runs while signed in; stops on sign-out.
    ref.listen(authProvider.select((s) => s.status), (_, status) {
      if (status == AuthStatus.signedIn) {
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
    return s.status == AuthStatus.signedIn ? s.api : null;
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
    // On first load the tasks restored by _init belong to this account (same server and
    // token); they keep going instead of being copied and sent again from the start.
    if (_loadedAccount != null) await _cancelAll();
    _loadedAccount = account;
    _doneCache = null;
    await _loadChunked();
    _log.info('account loaded, ${_chunked.length} big files in pieces');
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

  Future<void> _loadChunked() async {
    _chunked.clear();
    final raw = _loadedAccount == null ? null : (await _p).getString('$_kChunked:$_loadedAccount');
    final dir = await _dir();
    for (final j in raw == null ? const [] : jsonDecode(raw) as List) {
      final c = ChunkedUpload.fromJson(j as Map<String, dynamic>);
      if (File('$dir/${c.file}').existsSync()) _chunked[c.asset] = c;
    }
    for (final c in _converted) {
      _chunked[c.asset] = c;
    }
    _converted.clear();
    await _saveChunked();
  }

  Future<void> _saveChunked() async {
    if (_loadedAccount == null) return;
    await (await _p).setString(
      '$_kChunked:$_loadedAccount',
      jsonEncode([for (final c in _chunked.values) c.toJson()]),
    );
  }

  Future<String> _dir() async => '${(await getApplicationSupportDirectory()).path}/$backupDir';

  int get _queuedCount => _queued.length + _chunked.length;

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
    // The saved sign-in is read at the same time; until then it isn't known whose the queued
    // uploads are (they used to be dropped here when this ran first).
    await _signInRead();
    final api = _api;
    for (final task in await d.allTasks(group: backupGroup)) {
      final meta = task.metaData;
      final ours =
          api != null &&
          task.url.startsWith('${api.baseUrl}/') &&
          task.headers['Authorization'] == 'Bearer ${api.token}' &&
          meta.isNotEmpty;
      if (!ours) {
        await d.cancelTaskWithId(task.taskId);
      } else if (task.taskId.startsWith(chunkTaskPrefix)) {
        _chunkTasks[task.taskId] = (jsonDecode(meta) as Map)['asset'] as String;
      } else {
        final info = QueuedAsset.fromJson(meta);
        if (info.bytes > chunkBytes && task is UploadTask) {
          await _convert(d, task, info);
        } else {
          _queued[task.taskId] = info;
        }
      }
    }
    await _fixQueuedProtection();
    _ready = true;
    _log.info(
      'ready: ${_queued.length} uploads and ${_chunkTasks.length} pieces in the queue, '
      '${_converted.length} big files to continue in pieces, signed in: ${api != null}',
    );
    await _switchAccount();
  }

  Future<void> _signInRead() async {
    if (ref.read(authProvider).status != AuthStatus.loading) return;
    final done = Completer<void>();
    final sub = ref.listen(authProvider.select((s) => s.status), (_, status) {
      if (status != AuthStatus.loading && !done.isCompleted) done.complete();
    });
    await done.future.timeout(const Duration(seconds: 20), onTimeout: () {});
    sub.close();
  }

  /// Moves a big file queued by an older build as one request over to piece-by-piece upload,
  /// keeping its copy (exporting a big video again takes long).
  Future<void> _convert(FileDownloader d, UploadTask task, QueuedAsset info) async {
    final dir = await _dir();
    final kept = '${task.filename}.big';
    try {
      await File('$dir/${task.filename}').rename('$dir/$kept');
      final taken = int.tryParse(
        utf8.decode(
          base64.decode(_tusField(task.headers['Upload-Metadata'] ?? '', 'lastModified') ?? 'MA=='),
        ),
      );
      _converted.add(
        ChunkedUpload(
          asset: info.asset,
          name: info.name,
          file: kept,
          bytes: info.bytes,
          video: info.video,
          takenMs: taken ?? 0,
        ),
      );
      _log.info('continuing ${info.name} in pieces');
    } on FileSystemException catch (e) {
      _log.info('cannot keep the copy of ${info.name}: $e');
    }
    await d.cancelTaskWithId(task.taskId);
  }

  static String? _tusField(String metadata, String key) {
    for (final kv in metadata.split(',')) {
      final p = kv.trim().split(' ');
      if (p.length == 2 && p[0] == key) return p[1];
    }
    return null;
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
  /// Big files already partly sent continue from where they are (without videos when those
  /// were turned off).
  Future<void> restart() async {
    await _cancelAll(keepChunked: true);
    if (!state.videos) {
      for (final c in _chunked.values.where((c) => c.video).toList()) {
        await _dropChunked(c);
      }
    }
    start();
  }

  Future<void> _cancelAll({bool keepChunked = false}) async {
    await FileDownloader().cancelAll(group: backupGroup);
    _queued.clear();
    _chunkTasks.clear();
    _deferred.clear();
    if (!keepChunked) {
      final api = _api;
      for (final c in _chunked.values) {
        if (api != null && c.location != null) unawaited(api.deleteUpload(c.location!));
      }
      _chunked.clear();
      await _saveChunked();
    }
    final keep = {for (final c in _chunked.values) c.file};
    try {
      final dir = Directory(await _dir());
      if (await dir.exists()) {
        await for (final f in dir.list()) {
          if (!keep.contains(f.uri.pathSegments.last)) await f.delete(recursive: true);
        }
      }
    } on FileSystemException catch (e) {
      _log.warning('cannot remove queued copies', e);
    }
    for (final c in _chunked.values) {
      c.offset = null;
      c.progress = 0;
    }
    state = state.copyWith(queued: _queuedCount, clearCurrent: true, clearEta: true);
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
    final queuedAssets = {for (final q in _queued.values) q.asset, ..._chunked.keys, ..._deferred};
    final todo = all.where((a) => !done.contains(a.id) && !queuedAssets.contains(a.id)).toList();
    final synced = all.where((a) => done.contains(a.id)).length;
    _photosLeft = todo.where((a) => a.type != AssetType.video).length;
    _videosLeft = todo.length - _photosLeft;
    state = state.copyWith(
      total: all.length,
      synced: synced,
      pending: all.length - synced,
      queued: _queuedCount,
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
        final p = await _prepare(asset);
        if (p == null) {
          failed++;
          continue;
        }
        final info = p.info;
        if (info.bytes > chunkBytes) {
          if (await _addChunked(p)) {
            _eta.size(bytes: info.bytes, video: info.video);
            info.video ? _videosLeft-- : _photosLeft--;
          } else {
            _deferred.add(asset.id);
            await _deleteFile(p.copy);
          }
          continue;
        }
        final task = backupTask(
          api: api,
          info: info,
          fileName: p.fileName,
          taken: asset.createDateTime,
          wifiOnly: state.wifiOnly,
        );
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
    state = state.copyWith(failed: failed, queued: _queuedCount);
    await _driveChunked();
    await _updatePhase();
  }

  Future<void> _enqueue(List<UploadTask> batch) async {
    if (batch.isEmpty) return;
    await FileDownloader().enqueueAll(List.of(batch));
    batch.clear();
    state = state.copyWith(queued: _queuedCount, phase: BackupPhase.uploading);
  }

  Future<void> _updatePhase() async {
    if (_queuedCount == 0 && state.pending == 0) {
      state = state.copyWith(phase: BackupPhase.done, clearCurrent: true, clearEta: true);
    } else if (_queuedCount > 0 && state.wifiOnly && !await _onWifi()) {
      state = state.copyWith(phase: BackupPhase.waitingWifi);
    } else if (_queuedCount > 0) {
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

  /// Copies the original into the upload directory; null when the file can't be read (for
  /// example still in iCloud without a connection).
  Future<({File copy, String fileName, QueuedAsset info})?> _prepare(AssetEntity asset) async {
    final video = asset.type == AssetType.video;
    final File? src = await asset.loadFile(isOrigin: true);
    if (src == null) return null;
    var name = await asset.titleAsync;
    if (name.isEmpty) name = '${asset.id.replaceAll('/', '_')}${video ? '.mov' : '.jpg'}';
    final dot = name.lastIndexOf('.');
    final ext = dot > 0 ? name.substring(dot) : (video ? '.mov' : '.jpg');
    final safe = asset.id.replaceAll(RegExp(r'[^A-Za-z0-9_-]'), '_');
    final fileName = '$safe$ext';
    final dir = Directory(await _dir());
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
    await _readableWhileLocked(dir.path);
    await _readableWhileLocked(copy.path);
    final info = QueuedAsset(asset: asset.id, name: name, bytes: await copy.length(), video: video);
    _taken[asset.id] = asset.createDateTime.millisecondsSinceEpoch;
    return (copy: copy, fileName: fileName, info: info);
  }

  final Map<String, int> _taken = {};

  /// Takes a big file into a piece slot; false when none is free (or it doesn't fit).
  Future<bool> _addChunked(({File copy, String fileName, QueuedAsset info}) p) async {
    final busy = _chunked.values.fold<int>(0, (s, c) => s + c.bytes);
    if (_chunked.length >= _maxChunked || (_chunked.isNotEmpty && busy + p.info.bytes > _maxQueuedBytes)) {
      return false;
    }
    final i = p.info;
    _chunked[i.asset] = ChunkedUpload(
      asset: i.asset,
      name: i.name,
      file: p.fileName,
      bytes: i.bytes,
      video: i.video,
      takenMs: _taken.remove(i.asset) ?? 0,
    );
    await _saveChunked();
    state = state.copyWith(queued: _queuedCount, phase: BackupPhase.uploading);
    return true;
  }

  /// Sends the next piece of each big file that has none in the queue (after a pause when
  /// pieces kept failing).
  Future<void> _driveChunked() async {
    final api = _api;
    if (api == null) return;
    final busy = _chunkTasks.values.toSet();
    final now = DateTime.now();
    for (final c in _chunked.values.toList()) {
      if (busy.contains(c.asset)) continue;
      final wait = Duration(minutes: min(30, 1 << min(c.failures, 5)));
      if (c.failures > 0 && c.failedAt != null && now.difference(c.failedAt!) < wait) continue;
      await _nextPiece(api, c);
    }
  }

  /// Asks the server where [c] stands if unknown, cuts the next piece out of the copy and
  /// queues it.
  Future<void> _nextPiece(ApiClient api, ChunkedUpload c) async {
    if (!state.enabled || !_chunked.containsKey(c.asset)) return;
    try {
      if (c.location == null) {
        c.location = await api.createUpload(
          length: c.bytes,
          metadata: tusMetadata({'filename': c.name, 'lastModified': '${c.takenMs}'}),
        );
        c.offset = 0;
        await _saveChunked();
      }
      if (c.offset == null) {
        final st = await api.uploadStatus(c.location!);
        if (st == null) {
          // Expired on the server: start a new upload.
          c.location = null;
          await _saveChunked();
          return await _nextPiece(api, c);
        }
        if (st.assetId != null) return await _chunkedDone(c, uploaded: true);
        c.offset = st.offset;
      }
      final offset = c.offset!;
      final length = min(chunkBytes, c.bytes - offset);
      if (length <= 0) {
        // All data arrived but the server couldn't store it: send it again later.
        c.location = null;
        _pieceFailed(c, 'stored nothing after the last piece');
        return;
      }
      await _cutPiece(c, offset, length);
      await _readableWhileLocked('${await _dir()}/${chunkFileName(c)}');
      final task = chunkTask(api: api, c: c, offset: offset, length: length, wifiOnly: state.wifiOnly);
      c
        ..pieceBytes = length
        ..progress = 0;
      _chunkTasks[task.taskId] = c.asset;
      await FileDownloader().enqueue(task);
      state = state.copyWith(
        queued: _queuedCount,
        phase: BackupPhase.uploading,
        clearNoRoom: state.noRoomFor == c.name,
      );
    } on ApiException catch (e) {
      if (e.status == 507) state = state.copyWith(noRoomFor: c.name);
      if (e.unauthorized) {
        await ref.read(authProvider.notifier).sessionExpired();
      } else if (e.status == 400 || e.status == 413 || e.status == 415) {
        _log.info('server refused ${c.name} (${e.status})');
        await _chunkedDone(c, uploaded: false);
      } else {
        _pieceFailed(c, e.message);
      }
    } on FileSystemException catch (e) {
      _pieceFailed(c, '$e');
    }
  }

  Future<void> _cutPiece(ChunkedUpload c, int offset, int length) async {
    final dir = await _dir();
    final src = await File('$dir/${c.file}').open();
    final out = await File('$dir/${chunkFileName(c)}').open(mode: FileMode.write);
    try {
      await src.setPosition(offset);
      for (var left = length; left > 0;) {
        final block = await src.read(min(left, 4 << 20));
        if (block.isEmpty) throw FileSystemException('copy is shorter than expected', c.file);
        await out.writeFrom(block);
        left -= block.length;
      }
    } finally {
      await src.close();
      await out.close();
    }
  }

  void _pieceFailed(ChunkedUpload c, String why) {
    c
      ..failures += 1
      ..failedAt = DateTime.now()
      ..offset = null
      ..progress = 0;
    _log.info('piece of ${c.name} failed (${c.failures} in a row): $why');
  }

  /// [c] is finished: stored ([uploaded]) or refused by the server.
  Future<void> _chunkedDone(ChunkedUpload c, {required bool uploaded}) async {
    (await _done()).add(c.asset);
    await _saveDone();
    state = uploaded
        ? state.copyWith(synced: state.synced + 1, pending: state.pending - 1)
        : state.copyWith(failed: state.failed + 1, pending: state.pending - 1);
    if (uploaded) {
      _sentBytes += c.pieceBytes;
      _log.info('uploaded ${c.name} (in pieces)');
    }
    await _dropChunked(c, deleteOnServer: !uploaded);
    if (state.noRoomFor == c.name) state = state.copyWith(clearNoRoom: true);
    start();
  }

  Future<void> _dropChunked(ChunkedUpload c, {bool deleteOnServer = true}) async {
    _chunked.remove(c.asset);
    _deferred.clear();
    await _saveChunked();
    final api = _api;
    if (deleteOnServer && api != null && c.location != null) unawaited(api.deleteUpload(c.location!));
    final dir = await _dir();
    await _deleteFile(File('$dir/${c.file}'));
    await _deleteFile(File('$dir/${chunkFileName(c)}'));
    state = state.copyWith(queued: _queuedCount);
  }

  static const _files = MethodChannel('wanmory/files');

  /// iOS: keeps [path] readable while the phone is locked, when the system sends it. Copies
  /// exported from the photo library can carry "complete" protection, which makes them
  /// unreadable shortly after locking, and the uploads stall until the phone is unlocked.
  /// Returns the protection the file had when it was a different one.
  Future<String?> _readableWhileLocked(String path, {bool log = true}) async {
    if (!Platform.isIOS) return null;
    try {
      final before = await _files.invokeMethod<String>('readableWhileLocked', path);
      if (before == null || before == 'NSFileProtectionCompleteUntilFirstUserAuthentication') return null;
      if (log) _log.info('${path.split('/').last} had file protection $before');
      return before;
    } on PlatformException catch (e) {
      _log.info('cannot change the file protection of $path: ${e.message}');
    } on MissingPluginException {
      // tests
    }
    return null;
  }

  /// Copies queued by earlier builds.
  Future<void> _fixQueuedProtection() async {
    final dir = Directory(await _dir());
    if (!Platform.isIOS || !await dir.exists()) return;
    await _readableWhileLocked(dir.path);
    final changed = <String, int>{};
    await for (final f in dir.list()) {
      final before = await _readableWhileLocked(f.path, log: false);
      if (before != null) changed[before] = (changed[before] ?? 0) + 1;
    }
    if (changed.isNotEmpty) _log.info('made queued copies readable while locked: $changed');
  }

  Future<void> _deleteFile(File f) async {
    try {
      if (await f.exists()) await f.delete();
    } on FileSystemException catch (e) {
      _log.info('cannot delete ${f.path}: $e');
    }
  }

  int get _queuedBytesLeft =>
      _queued.values.fold<int>(0, (s, q) => s + (q.bytes * (1 - q.progress)).round()) +
      _chunked.values.fold<int>(0, (s, c) => s + c.bytes - c.sent);

  int get _inFlight =>
      _queued.values.fold<int>(0, (s, q) => s + (q.bytes * q.progress).round()) +
      _chunked.values.fold<int>(0, (s, c) => s + (c.pieceBytes * c.progress).round());

  void _onUpdate(TaskUpdate update) {
    if (update.task.group != backupGroup) return;
    switch (update) {
      case TaskProgressUpdate(:final progress):
        if (progress < 0) return;
        final String name;
        final double fraction;
        final c = _chunked[_chunkTasks[update.task.taskId]];
        final q = _queued[update.task.taskId];
        if (c != null) {
          c.progress = progress.clamp(0, 1);
          (name, fraction) = (c.name, c.sent / c.bytes);
        } else if (q != null) {
          q.progress = progress.clamp(0, 1);
          (name, fraction) = (q.name, q.progress);
        } else {
          return;
        }
        _eta.sample(_sentBytes + _inFlight, DateTime.now());
        state = state.copyWith(
          phase: BackupPhase.uploading,
          current: name,
          currentProgress: fraction,
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

  /// A piece of a big file finished: queue the next one right away (also when woken in the
  /// background), or find out from the server where to go on.
  Future<void> _finishedPiece(TaskStatusUpdate u) async {
    final id = u.task.taskId;
    final asset = _chunkTasks.remove(id) ?? (jsonDecode(u.task.metaData) as Map)['asset'] as String?;
    await _deleteCopy(u.task);
    await FileDownloader().database.deleteRecordsWithIds([id]);
    final c = _chunked[asset];
    final api = _api;
    if (c == null || api == null || u.status == TaskStatus.canceled) return;
    final r = chunkOutcome(u);
    switch (r.outcome) {
      case ChunkOutcome.finished:
        await _chunkedDone(c, uploaded: true);
      case ChunkOutcome.next:
        _sentBytes += c.pieceBytes;
        c
          ..offset = r.offset
          ..progress = 0
          ..failures = 0;
        await _nextPiece(api, c);
      case ChunkOutcome.refused:
        _log.info('server refused ${c.name}');
        await _chunkedDone(c, uploaded: false);
      case ChunkOutcome.unauthorized:
        await ref.read(authProvider.notifier).sessionExpired();
      case ChunkOutcome.gone:
        c.location = null;
        _pieceFailed(c, 'upload gone on the server');
        await _saveChunked();
        if (c.failures <= 2) await _nextPiece(api, c);
      case ChunkOutcome.retry:
        _pieceFailed(c, '${u.responseStatusCode ?? u.exception?.description}');
        // Resume at once while the app is awake; after repeated failures wait (see _driveChunked).
        if (c.failures <= 2) await _nextPiece(api, c);
    }
    state = state.copyWith(queued: _queuedCount);
  }

  Future<void> _finished(TaskStatusUpdate u) async {
    final id = u.task.taskId;
    if (id.startsWith(chunkTaskPrefix)) return _finishedPiece(u);
    final q = _queued[id] ?? (u.task.metaData.isEmpty ? null : QueuedAsset.fromJson(u.task.metaData));
    // The task stays in _queued until it is marked done, so a refill running meanwhile
    // can't queue the same photo again.
    var signedOut = false;
    try {
      if (q != null && u.status != TaskStatus.canceled) signedOut = await _record(u, q);
    } finally {
      _queued.remove(id);
      state = state.copyWith(queued: _queuedCount);
      await _deleteCopy(u.task);
      await FileDownloader().database.deleteRecordsWithIds([id]);
    }
    if (signedOut || q == null || u.status == TaskStatus.canceled) return;
    // Keep the queue topped up, also when woken in the background.
    start();
    if (_queuedCount == 0 && !_refilling) await _updatePhase();
  }

  /// Records a finished upload; true when the server signed us out.
  Future<bool> _record(TaskStatusUpdate u, QueuedAsset q) async {
    switch (outcome(u)) {
      case Outcome.uploaded:
        _sentBytes += q.bytes;
        if (state.noRoomFor != null && !_chunked.values.any((c) => c.name == state.noRoomFor)) {
          state = state.copyWith(clearNoRoom: true);
        }
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
        final e = u.exception;
        final code = e is TaskHttpException ? e.httpResponseCode : u.responseStatusCode;
        _log.info('upload of ${q.name} failed: ${code ?? e?.description}');
        state = state.copyWith(message: e?.description, noRoomFor: code == 507 ? q.name : null);
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
