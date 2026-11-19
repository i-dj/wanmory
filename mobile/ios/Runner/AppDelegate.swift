import BackgroundTasks
import Flutter
import UIKit

@main
@objc class AppDelegate: FlutterAppDelegate, FlutterImplicitEngineDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  func didInitializeImplicitFlutterEngine(_ engineBridge: FlutterImplicitEngineBridge) {
    GeneratedPluginRegistrant.register(with: engineBridge.pluginRegistry)
    if let registrar = engineBridge.pluginRegistry.registrar(forPlugin: "WanmoryFiles") {
      FilesChannel.register(messenger: registrar.messenger())
    }
    if let registrar = engineBridge.pluginRegistry.registrar(forPlugin: "WanmoryContinuedSync") {
      ContinuedSync.register(messenger: registrar.messenger())
    }
  }
}

/// "wanmory/files": file protection for album sync. The system uploads the queued copies while
/// the phone is locked, so they must stay readable then (iOS makes files with "complete"
/// protection unreadable about ten seconds after locking; copies exported from the photo
/// library can carry it).
enum FilesChannel {
  static func register(messenger: FlutterBinaryMessenger) {
    let channel = FlutterMethodChannel(name: "wanmory/files", binaryMessenger: messenger)
    channel.setMethodCallHandler { call, result in
      guard call.method == "readableWhileLocked", let path = call.arguments as? String else {
        result(FlutterMethodNotImplemented)
        return
      }
      let fm = FileManager.default
      let before = (try? fm.attributesOfItem(atPath: path)[.protectionKey] as? FileProtectionType)?.rawValue
      do {
        try fm.setAttributes(
          [.protectionKey: FileProtectionType.completeUntilFirstUserAuthentication], ofItemAtPath: path)
        result(before)
      } catch {
        result(FlutterError(code: "protection", message: error.localizedDescription, details: nil))
      }
    }
  }
}

/// "wanmory/continued": keeps album sync running after the user leaves the app or locks the
/// phone (iOS 26+ continued processing task). iOS shows the progress on the lock screen and in
/// the Dynamic Island, and lets the app keep working as long as progress is reported; the
/// system can still end it (low battery, the user stops it), and then says so with "expired".
///
/// Methods: start {title, subtitle, total, done} -> Bool (false when not supported or refused),
/// progress {total, done, subtitle}, finish. Events to Dart: started, expired.
enum ContinuedSync {
  private static var channel: FlutterMethodChannel?
  private static var task: AnyObject?  // BGContinuedProcessingTask, while running
  private static var submitted = false  // submitted, waiting for iOS to start it
  private static var total: Int64 = 1
  private static var done: Int64 = 0

  static func register(messenger: FlutterBinaryMessenger) {
    let ch = FlutterMethodChannel(name: "wanmory/continued", binaryMessenger: messenger)
    channel = ch
    ch.setMethodCallHandler { call, result in
      guard #available(iOS 26.0, *) else {
        result(false)
        return
      }
      let args = call.arguments as? [String: Any] ?? [:]
      switch call.method {
      case "start":
        result(
          start(
            title: args["title"] as? String ?? "", subtitle: args["subtitle"] as? String ?? "",
            total: args["total"] as? Int ?? 1, done: args["done"] as? Int ?? 0))
      case "progress":
        progress(total: args["total"] as? Int, done: args["done"] as? Int, subtitle: args["subtitle"] as? String)
        result(nil)
      case "finish":
        finish(success: true)
        result(nil)
      default:
        result(FlutterMethodNotImplemented)
      }
    }
  }

  @available(iOS 26.0, *)
  private static func start(title: String, subtitle: String, total: Int, done: Int) -> Bool {
    self.total = Int64(max(total, 1))
    self.done = Int64(min(done, total))
    if task != nil || submitted {
      progress(total: total, done: done, subtitle: subtitle)
      return true
    }
    let id = "\(Bundle.main.bundleIdentifier ?? "com.wanmory.wanmory").sync.\(UUID().uuidString)"
    let registered = BGTaskScheduler.shared.register(forTaskWithIdentifier: id, using: .main) { t in
      submitted = false
      guard let t = t as? BGContinuedProcessingTask else {
        t.setTaskCompleted(success: false)
        return
      }
      task = t
      t.progress.totalUnitCount = self.total
      t.progress.completedUnitCount = self.done
      t.expirationHandler = {
        task = nil
        t.setTaskCompleted(success: false)
        channel?.invokeMethod("expired", arguments: nil)
      }
      channel?.invokeMethod("started", arguments: nil)
    }
    guard registered else { return false }
    let request = BGContinuedProcessingTaskRequest(identifier: id, title: title, subtitle: subtitle)
    request.strategy = .fail
    do {
      try BGTaskScheduler.shared.submit(request)
      submitted = true
      return true
    } catch {
      NSLog("wanmory: continued sync not started: \(error)")
      return false
    }
  }

  @available(iOS 26.0, *)
  private static func progress(total: Int?, done: Int?, subtitle: String?) {
    if let total { self.total = Int64(max(total, 1)) }
    if let done { self.done = Int64(done) }
    guard let t = task as? BGContinuedProcessingTask else { return }
    t.progress.totalUnitCount = self.total
    t.progress.completedUnitCount = min(self.done, self.total)
    if let subtitle { t.updateTitle(t.title, subtitle: subtitle) }
  }

  private static func finish(success: Bool) {
    submitted = false
    guard #available(iOS 26.0, *), let t = task as? BGContinuedProcessingTask else { return }
    task = nil
    t.progress.completedUnitCount = t.progress.totalUnitCount
    t.setTaskCompleted(success: success)
  }
}
