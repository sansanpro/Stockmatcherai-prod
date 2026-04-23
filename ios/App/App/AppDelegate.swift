import UIKit
import WebKit
import Capacitor
import AppTrackingTransparency

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?
    private var hasRequestedTracking = false

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        requestTrackingPermission()
    }

    func applicationWillTerminate(_ application: UIApplication) {
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

    // MARK: - App Tracking Transparency

    private func requestTrackingPermission() {
        guard !hasRequestedTracking else { return }
        hasRequestedTracking = true

        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
            ATTrackingManager.requestTrackingAuthorization { [weak self] status in
                let statusString: String
                switch status {
                case .authorized:
                    statusString = "authorized"
                case .denied:
                    statusString = "denied"
                case .restricted:
                    statusString = "restricted"
                case .notDetermined:
                    statusString = "not-determined"
                @unknown default:
                    statusString = "denied"
                }

                DispatchQueue.main.async {
                    self?.bridgeATTStatus(statusString)
                }
            }
        }
    }

    private func bridgeATTStatus(_ status: String) {
        guard let rootVC = window?.rootViewController else { return }
        // Walk the view hierarchy to find the Capacitor WKWebView
        if let webView = findWebView(in: rootVC.view) {
            let js = "localStorage.setItem('att_status', '\(status)');"
            webView.evaluateJavaScript(js, completionHandler: nil)
        }
    }

    private func findWebView(in view: UIView) -> WKWebView? {
        if let webView = view as? WKWebView {
            return webView
        }
        for subview in view.subviews {
            if let found = findWebView(in: subview) {
                return found
            }
        }
        return nil
    }

}
