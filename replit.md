# SpikeyProfile - Neurodivergent Symptom & Strength Tracker

## Overview

SpikeyProfile is a modular React Native Expo app designed for neurodivergent users (ADHD/Autism) to track symptoms, strengths, and patterns with minimal cognitive load. The app follows the neurodivergent paradigm, acknowledging that neurodivergence has strengths as well as challenges.

## Project Architecture

### Tech Stack
- **Framework**: React Native with Expo SDK 51+
- **Navigation**: React Navigation 7 (Bottom Tabs + Native Stack)
- **UI**: Custom theming system with dark mode default
- **State**: React Context (ModuleContext, DataContext)
- **Charts**: react-native-chart-kit
- **Haptics**: expo-haptics

### Key Architecture Decisions

1. **Modular Feature System**: Each feature (Symptom Tracker, Clipboard Tray, Spiky Chart, etc.) is an independent module that can be toggled on/off via Settings. Modules are defined in `core/ModuleContext.tsx`.

2. **Dark Mode Default**: The app uses dark mode by default for reduced sensory load. Theme colors are defined in `constants/theme.ts`.

3. **Local-First/Offline**: All data is stored locally (currently in-memory for prototype). No backend required.

4. **Neurodivergent UX**: Single-tap interactions, high contrast colors, large touch targets, minimal animations.

## Project Structure

```
├── App.tsx                    # Main entry with providers
├── core/
│   ├── ModuleContext.tsx      # Module toggle state
│   └── DataContext.tsx        # App data state
├── modules/                   # Feature modules
│   ├── SymptomTracker/
│   ├── ClipboardTray/
│   ├── SpikyChart/
│   ├── PatternInsights/
│   ├── NFCModule/
│   └── Gamification/
├── screens/
│   ├── HomeScreen.tsx         # Dashboard
│   ├── TrackScreen.tsx        # Symptom logging
│   ├── InsightsScreen.tsx     # Charts & patterns
│   └── SettingsScreen.tsx     # Module toggles
├── navigation/                # Tab and stack navigators
├── components/                # Shared UI components
├── constants/theme.ts         # Design tokens
└── hooks/                     # Custom hooks
```

## Recent Changes

- **Dec 2024**: Initial prototype with all 6 modules
- Core modules: Symptom Tracker, Clipboard Tray, Spiky Chart, Pattern Insights, NFC Quick Tap, Gamification
- Settings screen with module toggles
- Dark mode theme with neurodivergent-friendly colors

## User Preferences

- Dark mode by default (can be locked in settings)
- High contrast colors for accessibility
- Minimal animations to reduce sensory overload
- Large touch targets (48px minimum)

## Running the App

1. Click "Run" in Replit
2. Scan the QR code with Expo Go on your phone
3. Or test in the web preview (limited functionality)

## Module System

To add a new module:
1. Create folder in `modules/YourModule/`
2. Add module definition to `core/ModuleContext.tsx`
3. Import and conditionally render in relevant screens

To disable a module:
- User: Settings → toggle off
- Developer: Set `enabled: false` in ModuleContext

## Next Steps (Future Development)

- Implement persistent storage with expo-sqlite
- Real NFC integration
- Push notifications for reminders
- CSV/PDF export functionality
- Voice input support
