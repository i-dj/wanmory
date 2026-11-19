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
