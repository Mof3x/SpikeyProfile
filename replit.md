# SpikeyProfile - Neurodivergent Symptom & Strength Tracker

## Overview

SpikeyProfile is a modular React Native Expo app designed for neurodivergent users (ADHD/Autism) to track symptoms, habits, and patterns with minimal cognitive load. The app follows the neurodivergent paradigm, acknowledging that neurodivergence has strengths as well as challenges.

## Project Architecture

### Tech Stack
- **Framework**: React Native with Expo SDK 54+
- **Navigation**: React Navigation 7 (Bottom Tabs + Native Stack)
- **UI**: Custom theming system with 4 preset themes and dark/light modes
- **State**: React Context (ThemeContext, ModuleContext, DataContext)
- **Storage**: AsyncStorage for local persistence (GDPR compliant, privacy-first)
- **Charts**: react-native-chart-kit
- **Haptics**: expo-haptics
- **Location**: expo-location (for Emergency Button)
- **Battery**: expo-battery (for Emergency Button)
- **SMS**: expo-sms (for Emergency Button)
- **Date/Time Picker**: @react-native-community/datetimepicker

### Key Architecture Decisions

1. **Modular Feature System**: Each feature is an independent module that can be toggled on/off via Settings. Modules are defined in `core/ModuleContext.tsx`.

2. **Theme System**: 4 preset themes (Calm Blue, Forest Green, Sunset Warm, Minimal Gray) each with dark/light mode variants. Configurable font sizes (Small, Medium, Large, Extra Large).

3. **Local-First/Privacy-First**: All data stored locally with AsyncStorage. No backend/database required. GDPR compliant.

4. **Neurodivergent UX**: Single-tap interactions, high contrast colors, large touch targets, minimal animations, friendly suggestions instead of imperative instructions.

## Project Structure

```
├── App.tsx                    # Main entry with providers
├── core/
│   ├── ThemeContext.tsx       # Theme, dark mode, font size state
│   ├── ModuleContext.tsx      # Module toggle state
│   └── DataContext.tsx        # App data state with AsyncStorage
├── modules/
│   ├── SymptomTracker/        # Log mood, energy, brain fog, etc.
│   ├── ClipboardTray/         # Multi-item clipboard for tasks/notes
│   ├── SpikyChart/            # Visualize cognitive peaks and valleys
│   ├── PatternInsights/       # Detect correlations, get suggestions
│   ├── NFCModule/             # Quick log for meds/habits
│   ├── Gamification/          # XP, streaks, levels
│   ├── TodoList/              # Task management widget
│   ├── Calendar/              # Upcoming events widget + full calendar
│   ├── Pomodoro/              # Focus timer with customizable backgrounds
│   ├── Emergency/             # Emergency button with GPS/battery/SMS
│   ├── Alarms/                # Automated repeating alarms
│   └── Timers/                # Countdown and CountUp timer modules
├── screens/
│   ├── HomeScreen.tsx         # Dashboard with widgets
│   ├── TrackScreen.tsx        # Symptom logging
│   ├── InsightsScreen.tsx     # Charts & patterns
│   ├── CalendarScreen.tsx     # Full calendar view
│   └── SettingsScreen.tsx     # Theme, font size, module toggles
├── navigation/                # Tab and stack navigators
├── components/                # Shared UI components
├── constants/theme.ts         # Design tokens and theme presets
└── hooks/useTheme.tsx         # Theme hook with typography scaling
```

## Available Modules (14 Total)

1. **Symptom Tracker** - Log mood, energy, brain fog, sensory overload, executive dysfunction
2. **Clipboard Tray** - Multi-item holder for tasks and notes
3. **Spiky Profile Chart** - Visualize cognitive peaks and valleys over time
4. **Pattern Insights** - Detect correlations and get personalized suggestions
5. **Quick Log (NFC)** - Tap to log meds and habits instantly
6. **Rewards (Gamification)** - XP, streaks, and levels for consistent tracking
7. **To-Do List** - Simple task management with completion tracking
8. **Calendar** - Monthly view with event types, filters, and upcoming events widget
9. **Pomodoro Timer** - Focus timer with work/break cycles, unlockable backgrounds (via XP)
10. **Emergency Button** - Alert contacts with location and battery info via SMS, medical info cards, crisis scripts
11. **Custom Trackers** - Create custom trackable items (slider, toggle, counter, text, color)
12. **Automated Alarms** - Set repeating reminders at custom intervals with staggered notifications
13. **Countdown Timer** - Count down to important events (appointments, deadlines, etc.) with categories
14. **Time Since...** - Track elapsed time since last medication, meal, or custom activity with optional warnings

## Theme System

### Preset Themes
- **Calm Blue** - Default, soothing blue tones
- **Forest Green** - Earthy, nature-inspired greens
- **Sunset Warm** - Warm orange and coral tones
- **Minimal Gray** - Clean, neutral grayscale

### Font Sizes
- Small (0.9x), Medium (1.0x), Large (1.15x), Extra Large (1.3x)
- Applied app-wide via ScaledTypography utility

## Recent Changes

### December 2024
- Added Countdown Timer module - count down to appointments, deadlines, events with categories
- Added Time Since... (CountUp Timer) module - track elapsed time since medications, meals, activities with optional warning thresholds
- Added Automated Alarms module with staggered reminders (3+ per task)
- Enhanced Emergency Button with Medical Info Cards and Crisis Scripts
- Added Low Sensory Mode with granular controls (each feature optional) and master toggle
- Calendar tab with persistent filters for time-bound items
- Home screen widget order fully customizable via drag-and-drop
- Emergency modals with keyboard-aware scrolling
- Added 5 new modules: To-Do List, Calendar, Pomodoro Timer, Emergency Button, Custom Trackers
- Implemented 4-theme system with dark/light mode variants
- Added font size scaling (S/M/L/XL)
- Added AsyncStorage persistence for all user data
- Created Upcoming Events and To-Do widgets for Home screen
- Emergency button integrates GPS location, battery info, and SMS
- Pomodoro timer has XP-locked background themes when gamification is enabled

## User Preferences

- Dark mode by default (toggleable)
- High contrast colors for accessibility
- Minimal animations to reduce sensory overload
- Large touch targets (48px minimum)
- Friendly suggestions instead of imperative instructions

## Running the App

1. Click "Run" in Replit
2. Scan the QR code with Expo Go on your phone
3. Or test in the web preview (limited functionality on web)

## Module System

To toggle a module:
- Settings → MODULES section → toggle on/off

To add a new module:
1. Create folder in `modules/YourModule/`
2. Add module definition to `core/ModuleContext.tsx`
3. Import and conditionally render in HomeScreen or other screens

## Data Storage

All data persisted locally using AsyncStorage with keys prefixed `@spikeyprofile/`:
- symptomEntries, todos, calendarEvents, customTrackers
- quickLogActions, quickLogEntries, emergencyContacts
- userStats, userName, modules, widgetOrder
- alarmSchedules, countdownTimers, countUpTimers
- medicalInfo, crisisScripts, lowSensorySettings

## Next Steps (Future Development)

- Real NFC integration for tap-to-log
- Push notifications for reminders
- CSV/PDF export functionality
- Voice input support
- Widget support for iOS/Android home screens
- Apple Watch/Wear OS companion app
