# SpikeyProfile

A modular React Native Expo app designed for neurodivergent users (ADHD/Autism) to track symptoms, strengths, and patterns with minimal cognitive load.

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Getting Started (Complete Beginner Guide)](#getting-started-complete-beginner-guide)
4. [Project Structure](#project-structure)
5. [Modular Architecture](#modular-architecture)
6. [Adding/Removing Modules](#addingremoving-modules)
7. [Building for Production](#building-for-production)
8. [GDPR Compliance](#gdpr-compliance)
9. [Contributing](#contributing)
10. [Supervisor Demo Guide](#supervisor-demo-guide)

---

## Overview

SpikeyProfile is built on the **neurodivergent paradigm** - acknowledging that neurodivergence has strengths as well as challenges. The app provides:

- **Symptom tracking** with single-tap logging
- **Visual insights** showing cognitive peaks and valleys ("spiky profile")
- **Pattern detection** for personalized suggestions
- **Executive function support** (clipboard tray, reminders)
- **Dark mode by default** for reduced sensory load

### What is a "Spiky Profile"?

A spiky profile refers to the uneven distribution of cognitive abilities common in neurodivergent individuals - significant peaks in some areas (e.g., exceptional mathematical abilities) paired with valleys in others (e.g., organization difficulties). This app visualizes and helps manage these patterns.

---

## Features

### Core Modules (All Toggleable)

| Module | Description | Status |
|--------|-------------|--------|
| **Symptom Tracker** | Log mood, energy, brain fog, sensory overload, executive dysfunction | Enabled by default |
| **Clipboard Tray** | 5 persistent slots for tasks/notes to reduce cognitive load | Enabled by default |
| **Spiky Chart** | Visualize daily/weekly cognitive patterns | Enabled by default |
| **Pattern Insights** | Rule-based correlation detection with suggestion cards | Enabled by default |
| **Quick Tap (NFC)** | Simulated NFC tap for quick logging (future hardware integration) | Disabled by default |
| **Gamification** | XP/streaks for consistent tracking | Enabled by default |

### Neurodivergent-Friendly UX

- Dark mode by default (reduces eye strain)
- High-contrast, WCAG-compliant colors
- Single-tap interactions (minimal cognitive load)
- Large touch targets (48px minimum)
- No aggressive animations
- Calming color palette (soft blues, sage greens)

---

## Getting Started (Complete Beginner Guide)

### Prerequisites

You'll need to install some software first. Don't worry - this guide assumes you've never done this before!

#### Step 1: Install Node.js

Node.js is the runtime that powers the app's development tools.

1. Go to [nodejs.org](https://nodejs.org/)
2. Download the **LTS (Long Term Support)** version
3. Run the installer and follow the prompts
4. Verify installation: Open Terminal (Mac) or Command Prompt (Windows) and type:
   ```bash
   node --version
   ```
   You should see something like `v20.x.x`

#### Step 2: Install Visual Studio Code

VS Code is the editor we recommend for working with the code.

1. Go to [code.visualstudio.com](https://code.visualstudio.com/)
2. Download and install for your operating system
3. Open VS Code

#### Step 3: Install Expo CLI

Expo is the framework that lets us build mobile apps with JavaScript.

1. Open Terminal/Command Prompt
2. Run:
   ```bash
   npm install -g expo-cli
   ```

#### Step 4: Install Expo Go on Your Phone

1. Open the App Store (iPhone) or Google Play Store (Android)
2. Search for "Expo Go"
3. Install the app

### Running the App

#### Option A: Using Replit (Easiest)

1. Open this project in Replit
2. Click the **Run** button
3. Scan the QR code with your phone's camera (iPhone) or Expo Go app (Android)

#### Option B: Local Development

1. Clone or download this repository
2. Open Terminal and navigate to the project folder:
   ```bash
   cd path/to/spikeyprofile
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
   or
   ```bash
   npx expo start
   ```
5. Scan the QR code with your phone

### Testing on Simulators (Optional)

#### iOS Simulator (Mac only)

1. Install [Xcode](https://apps.apple.com/app/xcode/id497799835) from the App Store
2. Open Xcode → Preferences → Components → Download a simulator
3. In your terminal after running `npx expo start`, press `i` to open iOS simulator

#### Android Emulator

1. Install [Android Studio](https://developer.android.com/studio)
2. Open Android Studio → Tools → Device Manager → Create Virtual Device
3. Select a device and download a system image
4. In your terminal after running `npx expo start`, press `a` to open Android emulator

---

## Project Structure

```
spikeyprofile/
├── App.tsx                    # Main app entry point
├── app.json                   # Expo configuration
├── package.json               # Dependencies
│
├── assets/
│   └── images/                # App icons and splash screens
│
├── components/                # Shared UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── ErrorBoundary.tsx
│   ├── ErrorFallback.tsx
│   ├── HeaderTitle.tsx
│   ├── ScreenScrollView.tsx
│   ├── ThemedText.tsx
│   └── ThemedView.tsx
│
├── constants/
│   └── theme.ts               # Colors, spacing, typography
│
├── core/                      # Core app functionality
│   ├── DataContext.tsx        # App state management
│   └── ModuleContext.tsx      # Module toggle system
│
├── hooks/                     # Custom React hooks
│   ├── useColorScheme.ts
│   ├── useScreenInsets.ts
│   └── useTheme.ts
│
├── modules/                   # Feature modules (toggleable)
│   ├── SymptomTracker/
│   │   ├── SymptomSlider.tsx
│   │   └── TodaySummaryCard.tsx
│   ├── ClipboardTray/
│   │   └── ClipboardPreview.tsx
│   ├── SpikyChart/
│   │   └── SpikyChart.tsx
│   ├── PatternInsights/
│   │   ├── InsightCard.tsx
│   │   └── QuickInsightCard.tsx
│   ├── NFCModule/
│   │   └── NFCQuickTap.tsx
│   └── Gamification/
│       └── GamificationCard.tsx
│
├── navigation/                # Screen navigation
│   ├── MainTabNavigator.tsx
│   ├── HomeStackNavigator.tsx
│   ├── TrackStackNavigator.tsx
│   ├── InsightsStackNavigator.tsx
│   ├── SettingsStackNavigator.tsx
│   └── screenOptions.ts
│
└── screens/                   # App screens
    ├── HomeScreen.tsx
    ├── TrackScreen.tsx
    ├── InsightsScreen.tsx
    └── SettingsScreen.tsx
```

---

## Modular Architecture

SpikeyProfile uses a **modular architecture** where each feature is an independent, toggleable module. This design allows:

- Users to enable/disable features based on their needs
- Easy addition/removal of modules for open-source contributions
- Zero code execution for disabled modules (memory efficient)

### Module System Overview

```
core/ModuleContext.tsx        # Module state management
└── modules/                   # Each folder = one module
    ├── SymptomTracker/       # Symptom logging
    ├── ClipboardTray/        # Task/note storage
    ├── SpikyChart/           # Data visualization
    ├── PatternInsights/      # Pattern detection
    ├── NFCModule/            # Quick tap logging
    └── Gamification/         # XP and streaks
```

### How Modules Work

1. **Definition**: Each module is defined in `core/ModuleContext.tsx`:
   ```typescript
   {
     id: "symptomTracker",
     name: "Symptom Tracker",
     description: "Log mood, energy, and cognitive symptoms",
     icon: "activity",
     enabled: true,
   }
   ```

2. **Toggle State**: Users can enable/disable modules in Settings

3. **Conditional Rendering**: Screens check module status before rendering:
   ```typescript
   {isModuleEnabled("symptomTracker") && <TodaySummaryCard />}
   ```

---

## Adding/Removing Modules

### Adding a New Module

1. **Create the module folder**:
   ```
   modules/YourModule/
   ├── YourModuleComponent.tsx
   └── index.ts (optional)
   ```

2. **Define the module** in `core/ModuleContext.tsx`:
   ```typescript
   {
     id: "yourModule",
     name: "Your Module",
     description: "What it does",
     icon: "icon-name",  // Feather icon name
     enabled: false,     // Start disabled
   }
   ```

3. **Add to type definition**:
   ```typescript
   export type ModuleId =
     | "symptomTracker"
     | "yourModule"  // Add here
     // ...
   ```

4. **Import and use** in relevant screens:
   ```typescript
   import { YourModuleComponent } from "@/modules/YourModule/YourModuleComponent";
   
   // In the component:
   {isModuleEnabled("yourModule") && <YourModuleComponent />}
   ```

### Removing a Module

1. Delete the module folder from `modules/`
2. Remove the module definition from `core/ModuleContext.tsx`
3. Remove the type from `ModuleId`
4. Remove all imports and usages from screens

---

## Building for Production

### Using Expo EAS Build

EAS (Expo Application Services) handles building native apps for iOS and Android.

#### Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

#### Step 2: Create an Expo Account

1. Go to [expo.dev](https://expo.dev/)
2. Create a free account
3. In terminal, log in:
   ```bash
   eas login
   ```

#### Step 3: Configure EAS

```bash
eas build:configure
```

This creates an `eas.json` file with build configurations.

#### Step 4: Build for Android

```bash
eas build --platform android
```

This creates an APK or AAB file you can upload to Google Play Store.

#### Step 5: Build for iOS

```bash
eas build --platform ios
```

You'll need an Apple Developer account ($99/year) to build for iOS.

### Submitting to App Stores

#### Google Play Store

1. Create a [Google Play Developer account](https://play.google.com/console/) ($25 one-time)
2. Create a new app in the console
3. Upload the AAB file from EAS Build
4. Fill out the store listing, content rating, and pricing
5. Submit for review

#### Apple App Store

1. Create an [Apple Developer account](https://developer.apple.com/) ($99/year)
2. Use EAS Submit:
   ```bash
   eas submit --platform ios
   ```
3. Complete the app listing in App Store Connect
4. Submit for review

---

## GDPR Compliance

SpikeyProfile is designed with privacy as a core principle:

### Local-First Data Storage

- **All data stays on device** - no data is sent to external servers
- Uses in-memory storage (prototype) / SQLite (production)
- No account creation required
- No analytics or tracking

### Data Export

Users can export their data via Settings:
- CSV format for spreadsheet analysis
- PDF format for sharing with healthcare providers

### Data Deletion

- App uninstallation removes all data
- "Reset to MVP" option clears settings
- No data retention on any server

### For Production Release

When implementing persistent storage:
1. Use `expo-sqlite` for local database
2. Implement data encryption at rest
3. Add explicit consent dialogs
4. Provide clear privacy policy
5. Implement data deletion API

---

## Contributing

We welcome contributions! SpikeyProfile is designed to be modular and easy to extend.

### How to Contribute

1. **Fork the repository** on GitHub
2. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** following the code style
4. **Test thoroughly** on iOS and Android
5. **Submit a Pull Request** with a clear description

### Code Style Guidelines

- Use TypeScript for all new files
- Follow the existing component patterns
- Use the theme system for colors/spacing
- Add comments for complex logic
- Test on both iOS and Android

### Module Contribution Guidelines

When adding a new module:
1. Follow the existing module structure
2. Make it fully toggleable
3. Use only existing dependencies
4. Document any new permissions needed
5. Keep cognitive load in mind (simple UI)

---

## Supervisor Demo Guide

### For University Project Review

#### Running the Demo

1. **Replit**: Click Run button, scan QR code with phone
2. **Local**: Run `npm install && npx expo start`, scan QR code

#### Key Features to Demonstrate

1. **Home Screen**
   - Personalized greeting
   - Gamification (XP, streaks, level)
   - Today's symptom summary
   - Clipboard tray preview
   - Quick insight card
   - NFC quick tap (if enabled)

2. **Track Screen**
   - Five symptom sliders with haptic feedback
   - Single-tap saving
   - Auto-timestamp

3. **Insights Screen**
   - Spiky profile chart (mood, energy, clarity)
   - Time range toggle (week/month)
   - Pattern insight cards

4. **Settings Screen**
   - Profile section (avatar, name)
   - Module toggles (demonstrate enable/disable)
   - Data export option
   - Reset to MVP

#### Technical Points to Highlight

- **Modular architecture**: Each feature is independent and toggleable
- **Neurodivergent-first design**: Dark mode, high contrast, single-tap
- **GDPR compliant**: All data stored locally
- **Cross-platform**: iOS and Android from one codebase
- **Accessibility**: WCAG compliant, screen reader support

#### Screenshots/Recording Guide

1. Open the app on your phone
2. For iOS: Settings → Control Center → Add Screen Recording
3. For Android: Pull down notification shade → Screen Record
4. Record a walkthrough of all four tabs
5. Show enabling/disabling modules in Settings

---

## License

MIT License - see LICENSE file for details.

---

## Acknowledgments

- Designed following the neurodivergent paradigm
- Built with Expo and React Native
- Icons from Feather Icons
- Charts from react-native-chart-kit

---

**SpikeyProfile** - Understanding your unique cognitive landscape.
