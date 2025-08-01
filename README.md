# Weekly Calorie Tracker

A mobile app that manages calorie intake from a weekly perspective, automatically redistributing daily calorie allowances based on actual consumption and activity levels.

## 🎯 Key Features

- **Weekly Calorie Banking**: Maintain weekly deficit/surplus goals with daily flexibility
- **Smart Redistribution**: Automatically recalculate remaining daily allowances after each meal
- **Smartwatch Integration**: Real-time activity tracking and calorie burn sync
- **Athletic Training Support**: Adjust targets based on training intensity for optimal performance

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
├── screens/            # Screen components for navigation
├── services/           # API integrations and external services
├── stores/             # Zustand state management
├── types/              # TypeScript type definitions
└── utils/              # Helper functions and algorithms
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 16
- React Native CLI
- iOS: Xcode 14+
- Android: Android Studio with SDK 31+

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd weekly-calorie-tracker
```

2. Install dependencies
```bash
npm install
```

3. iOS Setup
```bash
cd ios && pod install && cd ..
```

4. Run the app
```bash
# iOS
npm run ios

# Android
npm run android
```

## 🛠️ Development

### Available Scripts

- `npm start` - Start Metro bundler
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm test` - Run Jest tests

### Core Algorithm

The heart of the app is the `WeeklyCalorieRedistributor` class that:

1. Calculates remaining calories for the week
2. Redistributes across remaining days
3. Adjusts for planned training sessions
4. Ensures minimum safe calorie thresholds
5. Provides real-time updates after each meal

## 📱 Current Status

**MVP Setup Complete** ✅
- Project structure created
- Core types defined
- Weekly redistribution algorithm implemented
- Zustand store configured
- Basic UI scaffolding

**Next Development Steps:**
1. Build meal logging interface
2. Implement smartwatch integration
3. Create weekly dashboard with charts
4. Add notifications system
5. Implement data persistence

## 🔧 Tech Stack

- **Framework**: React Native 0.72
- **Language**: TypeScript
- **State Management**: Zustand
- **Database**: SQLite with Watermelon DB (planned)
- **Health Integration**: react-native-health
- **Charts**: react-native-chart-kit
- **Navigation**: React Navigation v6

## 📖 Documentation

- [Functional Requirements](../weekly-calorie-tracker-requirements.md)
- User Stories & Acceptance Criteria
- Technical Architecture
- API Documentation (coming soon)

## 🤝 GitHub Copilot Ready

This project is structured to work optimally with GitHub Copilot:
- Clear naming conventions
- Comprehensive type definitions
- Well-documented algorithms
- Modular architecture

Start coding with Copilot by focusing on:
1. UI components in `/src/components/`
2. Screen implementations in `/src/screens/`
3. Service integrations in `/src/services/`

---

**Ready to build the future of flexible calorie tracking!** 🎯