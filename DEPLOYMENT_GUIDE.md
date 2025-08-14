# App Deployment & Testing Distribution Guide

## Option 1: Expo Application Services (EAS) - Recommended ⭐

EAS is Expo's cloud-based build and distribution service. It's the most professional and reliable option.

### Setup EAS Build

1. **Install EAS CLI:**
```bash
npm install -g @expo/eas-cli
```

2. **Login to Expo:**
```bash
eas login
```

3. **Configure EAS:**
```bash
eas build:configure
```

This creates `eas.json`:
```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "distribution": "store"
    }
  }
}
```

### Build for Testing

**For Internal Testing (Recommended):**
```bash
# Android APK
eas build --platform android --profile preview

# iOS Simulator build
eas build --platform ios --profile preview

# Both platforms
eas build --platform all --profile preview
```

### Distribution Options

**A. EAS Update (Easiest)**
```bash
# Install EAS Update
expo install expo-updates

# Publish update
eas update --branch preview --message "Latest features"
```

**B. Direct APK Distribution**
- Android users can install APK directly
- Share download link from EAS dashboard

**C. TestFlight (iOS) / Play Store Internal Testing**
```bash
# Production builds for store testing
eas build --platform all --profile production
```

---

## Option 2: Expo Development Build

For more control and faster iteration:

### Setup Development Build

1. **Create development build:**
```bash
eas build --profile development --platform android
eas build --profile development --platform ios
```

2. **Install Expo Dev Client on tester devices:**
- Download from app stores: "Expo Go" (for managed workflow)
- Or install your custom development build

3. **Start development server:**
```bash
expo start --dev-client
```

4. **Share QR code** - testers scan to load your app

---

## Option 3: Standalone Builds (Self-hosted)

### Build APK/IPA files

```bash
# Android APK
expo build:android -t apk

# iOS IPA (requires Apple Developer account)
expo build:ios -t archive
```

### Distribution
- **Android**: Share APK file directly (users enable "Unknown sources")
- **iOS**: Use services like Diawi, InstallOnAir, or TestFlight

---

## Option 4: Web Version

Deploy as a web app for easy testing:

```bash
# Build for web
expo build:web

# Deploy to Netlify/Vercel
# Or use Expo's hosting
expo export:web
```

---

## Recommended Workflow for Your App

### Phase 1: Quick Testing (Use EAS Preview)
```bash
# One-time setup
npm install -g @expo/eas-cli
eas login
eas build:configure

# Build for testers
eas build --platform all --profile preview
```

### Phase 2: Continuous Testing (Use EAS Update)
```bash
# Install updates
expo install expo-updates

# Add to app.json/app.config.js
{
  "expo": {
    "updates": {
      "url": "https://u.expo.dev/[your-project-id]"
    }
  }
}

# Deploy updates instantly
eas update --branch preview --message "Bug fixes"
```

### Phase 3: Store Preparation
```bash
# Production builds
eas build --platform all --profile production
```

---

## Cost Considerations

### EAS Free Tier
- ✅ Unlimited EAS Updates
- ✅ Limited build minutes (varies by plan)
- ✅ Internal distribution

### EAS Paid Plans
- More build minutes
- Priority build queue
- Advanced features

### Alternative Free Options
- GitHub Actions + Expo (free CI/CD)
- Self-hosted builds (more complex)

---

## Quick Start for Testing Distribution

1. **Immediate testing (5 minutes):**
```bash
eas build:configure
eas build --platform android --profile preview
```

2. **Share with testers:**
   - Send them the download link from EAS dashboard
   - Android users can install APK directly
   - iOS users need TestFlight or ad-hoc provisioning

3. **Update instantly:**
```bash
expo install expo-updates
eas update --branch preview
```

---

## Security & Privacy Notes

- EAS builds are secure and isolated
- Your code is built in Expo's cloud (consider for sensitive apps)
- Internal distribution keeps your app private
- No need to publish to public app stores for testing

---

## Troubleshooting

### Common Issues
1. **iOS Builds**: Need Apple Developer account ($99/year)
2. **Android Signing**: EAS handles automatically
3. **Large APK Size**: Use `expo-doctor` to optimize

### Debug Commands
```bash
# Check build status
eas build:list

# View build logs
eas build:view [build-id]

# Check project configuration
expo doctor
```

This approach gives you professional app distribution without maintaining local servers!