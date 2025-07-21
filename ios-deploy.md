
# iOS App Store Deployment Guide

## Prerequisites
- Apple Developer Account (✅ You have this)
- Xcode installed on Mac
- Valid signing certificates

## Step-by-Step Deployment Process

### 1. Build for Production
```bash
npm run build
```

### 2. Add iOS Platform (if not already added)
```bash
npx cap add ios
```

### 3. Sync Project
```bash
npx cap sync ios
```

### 4. Open in Xcode
```bash
npx cap open ios
```

### 5. Configure in Xcode
1. **Set Development Team**: 
   - Select your project in the navigator
   - Go to "Signing & Capabilities"
   - Select your Apple Developer Team

2. **Bundle Identifier**: 
   - Already set to `com.hassanomar.stockmatcherai`
   - Make sure this matches your App Store Connect app

3. **App Icons**: 
   - Add your app icons in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
   - Use 1024x1024 for App Store icon

4. **Launch Screen**: 
   - Customize in `ios/App/App/Base.lproj/LaunchScreen.storyboard`

5. **Deployment Target**: 
   - Set to iOS 13.0 or higher for better compatibility

### 6. Archive and Submit
1. In Xcode: Product → Archive
2. Distribute App → App Store Connect
3. Upload to App Store Connect
4. Fill out app metadata in App Store Connect
5. Submit for review

## Production Checklist
- [ ] Remove development server configuration ✅
- [ ] Test app functionality thoroughly
- [ ] Add app icons (1024x1024, 60x60, etc.)
- [ ] Configure launch screen
- [ ] Set proper deployment target
- [ ] Test on physical device
- [ ] Submit for App Store review

## Troubleshooting
- If build fails, run `npx cap sync ios` again
- For signing issues, check your Apple Developer certificates
- For capability errors, add required permissions in Xcode

Your app is now ready for iOS App Store deployment! 🚀
