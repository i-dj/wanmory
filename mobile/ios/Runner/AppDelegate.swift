import BackgroundTasks
import CoreLocation
import Flutter
import UIKit
import UserNotifications

@main
@objc class AppDelegate: FlutterAppDelegate, FlutterImplicitEngineDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    // Background task handlers must be registered before launching finishes
    OvernightSync.registerTask()
    RefreshSync.registerTask()
    // Location wakes were tried in an earlier build: make sure iOS stops them
    CLLocationManager().stopMonitoringSignificantLocationChanges()
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
    if let registrar = engineBridge.pluginRegistry.registrar(forPlugin: "WanmoryOvernightSync") {
      OvernightSync.register(messenger: registrar.messenger())
    }
    if let registrar = engineBridge.pluginRegistry.registrar(forPlugin: "WanmoryRefreshSync") {
      RefreshSync.register(messenger: registrar.messenger())
    }
    if let registrar = engineBridge.pluginRegistry.registrar(forPlugin: "WanmoryTabs") {
      NativeTabs.shared.register(messenger: registrar.messenger())
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

  /// One fixed identifier: asking again replaces a request still waiting, so there is never more
  /// than one sync task (and one progress in the Dynamic Island).
  private static let id = "\(Bundle.main.bundleIdentifier ?? "com.wanmory.wanmory").sync.album"

  static func register(messenger: FlutterBinaryMessenger) {
    let ch = FlutterMethodChannel(name: "wanmory/continued", binaryMessenger: messenger)
    channel = ch
    if #available(iOS 26.0, *) {
      // A request left over from before the app was closed or updated
      BGTaskScheduler.shared.cancel(taskRequestWithIdentifier: id)
      BGTaskScheduler.shared.register(forTaskWithIdentifier: id, using: .main) { t in
        submitted = false
        guard let t = t as? BGContinuedProcessingTask else {
          t.setTaskCompleted(success: false)
          return
        }
        if task != nil {
          // Already one running: this one is extra
          t.setTaskCompleted(success: true)
          return
        }
        task = t
        t.progress.totalUnitCount = total
        t.progress.completedUnitCount = done
        t.expirationHandler = {
          task = nil
          // Not a failure for the user: what is left keeps uploading in the system queue and the
          // next time the app runs (iOS would show "task failed" otherwise)
          t.setTaskCompleted(success: true)
          channel?.invokeMethod("expired", arguments: nil)
        }
        channel?.invokeMethod("started", arguments: nil)
      }
    }
    ch.setMethodCallHandler { call, result in
      if call.method == "lowPower" {
        result(ProcessInfo.processInfo.isLowPowerModeEnabled)
        return
      }
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
    let request = BGContinuedProcessingTaskRequest(identifier: id, title: title, subtitle: subtitle)
    request.strategy = .fail
    do {
      try BGTaskScheduler.shared.submit(request)
      submitted = true
      // Normally started right away; one that isn't is taken back, so the app can ask again
      DispatchQueue.main.asyncAfter(deadline: .now() + 15) {
        guard submitted, task == nil else { return }
        BGTaskScheduler.shared.cancel(taskRequestWithIdentifier: id)
        submitted = false
        channel?.invokeMethod("expired", arguments: nil)
      }
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
    guard #available(iOS 26.0, *) else { return }
    if submitted && task == nil {
      // Asked for but not started yet: take the request back
      BGTaskScheduler.shared.cancel(taskRequestWithIdentifier: id)
    }
    submitted = false
    guard let t = task as? BGContinuedProcessingTask else { return }
    task = nil
    t.progress.completedUnitCount = t.progress.totalUnitCount
    t.setTaskCompleted(success: success)
  }
}

/// "wanmory/overnight": a long background job for the first sync of a big library. iOS runs it
/// while the phone is charging and online (usually at night), for as long as it lets the app,
/// and again on later nights while something is left. The app asks for it with "schedule"; it
/// hears "started" when iOS runs it and "expired" when iOS stops it, and says "finish" when it
/// has nothing more to send.
enum OvernightSync {
  private static var channel: FlutterMethodChannel?
  private static var task: BGTask?
  private static let id = "\(Bundle.main.bundleIdentifier ?? "com.wanmory.wanmory").sync.overnight"

  static func registerTask() {
    BGTaskScheduler.shared.register(forTaskWithIdentifier: id, using: .main) { t in
      task = t
      t.expirationHandler = {
        task = nil
        t.setTaskCompleted(success: false)
        channel?.invokeMethod("expired", arguments: nil)
        schedule()  // the rest on a later run
      }
      // The engine may not be listening yet when iOS starts the app for this
      channel?.invokeMethod("started", arguments: nil)
    }
  }

  static func register(messenger: FlutterBinaryMessenger) {
    let ch = FlutterMethodChannel(name: "wanmory/overnight", binaryMessenger: messenger)
    channel = ch
    ch.setMethodCallHandler { call, result in
      switch call.method {
      case "schedule":
        result(schedule())
      case "finish":
        let more = (call.arguments as? Bool) ?? false
        if let t = task {
          task = nil
          t.setTaskCompleted(success: true)
        }
        if more { schedule() }
        result(nil)
      case "running":
        // Asked once the app is ready, in case iOS started the job before it listened
        result(task != nil)
      default:
        result(FlutterMethodNotImplemented)
      }
    }
  }

  @discardableResult
  static func schedule() -> Bool {
    let request = BGProcessingTaskRequest(identifier: id)
    request.requiresNetworkConnectivity = true
    do {
      try BGTaskScheduler.shared.submit(request)
      return true
    } catch {
      NSLog("wanmory: overnight sync not scheduled: \(error)")
      return false
    }
  }
}

/// "wanmory/refresh": iOS wakes the app now and then for half a minute (background app refresh),
/// also when it was asleep all day. iOS doesn't wake apps when Wi-Fi comes back, so this is how
/// album sync notices that the server can be reached again (back home, say): it uploads what it
/// can in that time and asks with a notification to open the app, which then syncs at full
/// speed. Methods: schedule, finish, running, allowNotifications, notify {title, body}.
enum RefreshSync {
  private static var channel: FlutterMethodChannel?
  private static var task: BGTask?
  private static let id = "\(Bundle.main.bundleIdentifier ?? "com.wanmory.wanmory").sync.refresh"

  static func registerTask() {
    BGTaskScheduler.shared.register(forTaskWithIdentifier: id, using: .main) { t in
      task = t
      schedule()  // the next wake
      t.expirationHandler = {
        task = nil
        t.setTaskCompleted(success: false)
        channel?.invokeMethod("expired", arguments: nil)
      }
      channel?.invokeMethod("started", arguments: nil)
    }
  }

  static func register(messenger: FlutterBinaryMessenger) {
    let ch = FlutterMethodChannel(name: "wanmory/refresh", binaryMessenger: messenger)
    channel = ch
    ch.setMethodCallHandler { call, result in
      switch call.method {
      case "schedule":
        result(schedule())
      case "finish":
        if let t = task {
          task = nil
          t.setTaskCompleted(success: true)
        }
        result(nil)
      case "running":
        result(task != nil)
      case "allowNotifications":
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound]) { ok, _ in
          DispatchQueue.main.async { result(ok) }
        }
      case "notify":
        let args = call.arguments as? [String: Any] ?? [:]
        let content = UNMutableNotificationContent()
        content.title = args["title"] as? String ?? ""
        content.body = args["body"] as? String ?? ""
        // One at a time: a newer one replaces the last
        let request = UNNotificationRequest(identifier: "sync.resume", content: content, trigger: nil)
        UNUserNotificationCenter.current().add(request) { error in
          DispatchQueue.main.async { result(error == nil) }
        }
      default:
        result(FlutterMethodNotImplemented)
      }
    }
  }

  @discardableResult
  static func schedule() -> Bool {
    let request = BGAppRefreshTaskRequest(identifier: id)
    request.earliestBeginDate = Date(timeIntervalSinceNow: 5 * 60)
    do {
      try BGTaskScheduler.shared.submit(request)
      return true
    } catch {
      NSLog("wanmory: refresh not scheduled: \(error)")
      return false
    }
  }
}


/// "wanmory/tabs": the system tab bar over the Flutter view. A UITabBarController with empty,
/// see-through tabs lies on top of the app; only its bar takes touches, everything else goes
/// through to Flutter, which draws the pages. So the bar is the real one: Liquid Glass on iOS 26,
/// its animations, search as a separate round button, and it follows the system's look.
/// Methods: show {items: [{title, symbol}], search, selected, tint} -> Bool, visible(Bool),
/// remove. Calls back: selected(i), reselected(i), search.
final class NativeTabs: NSObject, UITabBarControllerDelegate {
  static let shared = NativeTabs()
  private var channel: FlutterMethodChannel?
  private var controller: UITabBarController?
  private var container: PassThroughView?
  private var current = 0
  private static let scale: CGFloat = 0.86

  func register(messenger: FlutterBinaryMessenger) {
    let ch = FlutterMethodChannel(name: "wanmory/tabs", binaryMessenger: messenger)
    channel = ch
    ch.setMethodCallHandler { [weak self] call, result in
      guard let self else { return }
      switch call.method {
      case "show":
        result(self.show(call.arguments as? [String: Any] ?? [:]))
      case "visible":
        if #available(iOS 18.0, *) {
          self.controller?.setTabBarHidden(!((call.arguments as? Bool) ?? true), animated: true)
        }
        result(nil)
      case "remove":
        self.remove()
        result(nil)
      default:
        result(FlutterMethodNotImplemented)
      }
    }
  }

  private var flutterController: UIViewController? {
    UIApplication.shared.connectedScenes
      .compactMap { ($0 as? UIWindowScene)?.windows.first { $0.isKeyWindow } ?? ($0 as? UIWindowScene)?.windows.first }
      .first?.rootViewController
  }

  private func show(_ args: [String: Any]) -> Bool {
    guard #available(iOS 18.0, *), let host = flutterController else { return false }
    remove()
    let items = args["items"] as? [[String: Any]] ?? []
    current = args["selected"] as? Int ?? 0
    var tabs: [UITab] = items.enumerated().map { i, item in
      UITab(
        title: item["title"] as? String ?? "",
        image: UIImage(systemName: item["symbol"] as? String ?? "circle"),
        identifier: "\(i)"
      ) { _ in ClearController() }
    }
    // (iOS shows it as its own round button at the end of the bar)
    let search = UISearchTab { _ in UINavigationController(rootViewController: ClearController()) }
    if #available(iOS 26.0, *) { search.automaticallyActivatesSearch = false }
    tabs.append(search)

    let tbc = UITabBarController()
    tbc.tabs = tabs
    tbc.selectedTab = tabs[min(current, tabs.count - 1)]
    tbc.delegate = self
    tbc.view.backgroundColor = .clear
    if let tint = args["tint"] as? Int {
      tbc.tabBar.tintColor = UIColor(
        red: CGFloat((tint >> 16) & 0xFF) / 255, green: CGFloat((tint >> 8) & 0xFF) / 255,
        blue: CGFloat(tint & 0xFF) / 255, alpha: 1)
    }

    let box = PassThroughView(frame: host.view.bounds)
    box.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    box.backgroundColor = .clear
    host.addChild(tbc)
    tbc.view.frame = box.bounds
    tbc.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    box.addSubview(tbc.view)
    host.view.addSubview(box)
    tbc.didMove(toParent: host)
    // The system bar is a bit large next to the app's own controls: draw it smaller, keeping
    // it centered and at the same distance from the bottom edge (touches follow the transform).
    let h = host.view.bounds.height
    box.transform = CGAffineTransform(translationX: 0, y: h * (1 - Self.scale) / 2)
      .scaledBy(x: Self.scale, y: Self.scale)
    box.bar = tbc.tabBar
    controller = tbc
    container = box
    return true
  }

  private func remove() {
    guard let tbc = controller else { return }
    tbc.willMove(toParent: nil)
    container?.removeFromSuperview()
    tbc.removeFromParent()
    controller = nil
    container = nil
  }

  @available(iOS 18.0, *)
  func tabBarController(_ tabBarController: UITabBarController, shouldSelectTab tab: UITab) -> Bool {
    if tab is UISearchTab {
      channel?.invokeMethod("search", arguments: nil)
      return false  // search opens as a page in the app; the tab stays where it was
    }
    let i = Int(tab.identifier) ?? 0
    if i == current { channel?.invokeMethod("reselected", arguments: i) }
    return true
  }

  @available(iOS 18.0, *)
  func tabBarController(_ tabBarController: UITabBarController, didSelectTab selectedTab: UITab, previousTab: UITab?) {
    guard let i = Int(selectedTab.identifier), i != current else { return }
    current = i
    channel?.invokeMethod("selected", arguments: i)
  }
}

/// A tab's page: empty and see-through (Flutter draws the content underneath).
private final class ClearController: UIViewController {
  override func loadView() {
    let v = UIView()
    v.backgroundColor = .clear
    v.isUserInteractionEnabled = false
    view = v
  }
}

/// Lets touches through to the Flutter view except on the tab bar.
private final class PassThroughView: UIView {
  weak var bar: UIView?

  override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
    guard let hit = super.hitTest(point, with: event), let bar, !bar.isHidden, bar.alpha > 0.01,
      hit.isDescendant(of: bar)
    else { return nil }
    return hit
  }
}
