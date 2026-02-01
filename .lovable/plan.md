
# Fix App Store Connect Rejection - Missing Privacy Keys

## Problem
Apple rejected your app because the Stripe Capacitor plugin includes references to camera APIs (used for credit card scanning), but your `Info.plist` is missing the required `NSCameraUsageDescription` privacy usage string.

## Solution
Add the required privacy usage description to `ios/App/App/Info.plist`. This is a simple one-line fix.

## What I'll Do

### Update `ios/App/App/Info.plist`
Add the `NSCameraUsageDescription` key with an appropriate user-facing message:

```xml
<key>NSCameraUsageDescription</key>
<string>StockMatcherAI may use the camera to scan payment cards for secure checkout.</string>
```

## After I Make This Change

You'll need to:
1. **Pull the changes** to your local project (`git pull`)
2. **Sync Capacitor** by running `npx cap sync ios`
3. **Rebuild in Xcode**: Open the project with `npx cap open ios`, then Product → Archive
4. **Upload a new build** to App Store Connect with an incremented build number (e.g., Build 2)

## About the SDK Warning
The second message about iOS 18.5 SDK is just a heads-up for the future (April 2026). Your current build will still be accepted - Apple is just letting you know that eventually you'll need to update Xcode. No action needed right now.

---

**Technical Note**: The Stripe plugin (`@capacitor-community/stripe`) includes card scanning functionality that references the camera API, which triggers Apple's privacy check even if your app doesn't actively use that feature.
