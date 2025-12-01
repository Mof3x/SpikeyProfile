# SpikeyProfile - Design Guidelines for Neurodivergent Users

## Architecture Decisions

### Authentication
**No Authentication Required (Local-First)**
- This is a privacy-focused, single-user utility app with local SQLite storage
- **Profile/Settings Screen** must include:
  - User-customizable avatar (generate 3-5 calming, abstract geometric avatars - circles, soft waves, gentle gradients)
  - Display name field (optional)
  - App preferences (theme customization, module toggles, notification settings)
  - Export data options (CSV/PDF)
- No login/signup flows needed
- All data stored locally for GDPR compliance

### Navigation
**Tab Navigation (4 Tabs + Floating Action Button)**
- **Tab Bar Structure**:
  - Tab 1: **Home** (Dashboard with enabled modules summary)
  - Tab 2: **Track** (Quick symptom logging)
  - Tab 3: **Insights** (Spiky Chart + Pattern cards)
  - Tab 4: **Settings** (Module toggles, preferences, export)
- **Floating Action Button (FAB)**: Positioned center-bottom above tab bar for **Quick Log** - single-tap symptom entry with emoji sliders
- **Modal Screens**: 
  - NFC Tap simulation (slides up from bottom)
  - Data export preview
  - Module info/help screens

### Screen Specifications

#### 1. Home (Dashboard)
- **Purpose**: Overview of enabled modules and daily summary
- **Layout**:
  - **Header**: Transparent, greeting text ("Good morning, [Name]"), right button for notifications
  - **Main Content**: Scrollable cards showing:
    - Daily streak/XP (if Gamification enabled)
    - Today's symptom summary
    - Clipboard tray preview (if enabled)
    - Quick pattern insight card
  - **Safe Area Insets**: 
    - Top: `headerHeight + Spacing.xl`
    - Bottom: `tabBarHeight + Spacing.xl`

#### 2. Track (Quick Symptom Logger)
- **Purpose**: Single-tap symptom logging with minimal cognitive load
- **Layout**:
  - **Header**: Transparent, title "Track Symptoms", right button "Save"
  - **Main Content**: Scrollable form with:
    - 5 emoji sliders (mood, energy, brain fog, sensory overload, executive dysfunction)
    - Each slider: Large emoji on left, 1-10 scale with haptic feedback
    - Auto-timestamp display (read-only, calming gray)
    - Optional: Weather/location toggle (off by default)
  - **Submit Button**: In header (right button) - "Save" with visual feedback
  - **Safe Area Insets**:
    - Top: `headerHeight + Spacing.xl`
    - Bottom: `tabBarHeight + Spacing.xl`

#### 3. Insights (Spiky Chart + Patterns)
- **Purpose**: Visualize cognitive peaks/valleys and pattern correlations
- **Layout**:
  - **Header**: Transparent, title "My Patterns", right button for date range picker (Week/Month)
  - **Main Content**: Scrollable list with:
    - Spiky Profile Chart (full-width, react-native-chart-kit line chart)
    - Pattern Insight Cards (if module enabled) - scrollable horizontal cards below chart
  - **Safe Area Insets**:
    - Top: `headerHeight + Spacing.xl`
    - Bottom: `tabBarHeight + Spacing.xl`

#### 4. Settings
- **Purpose**: Module toggles, UI customization, data export
- **Layout**:
  - **Header**: Default navigation header, title "Settings"
  - **Main Content**: Scrollable grouped list:
    - **Section 1**: Profile (avatar, name)
    - **Section 2**: Modules (toggles for each of 6 modules)
    - **Section 3**: Appearance (dark mode lock, high-contrast toggle, font size slider)
    - **Section 4**: Notifications (reminder toggles)
    - **Section 5**: Data (Export CSV/PDF, Reset App with double confirmation)
  - **Safe Area Insets**:
    - Top: `Spacing.xl` (has non-transparent header)
    - Bottom: `tabBarHeight + Spacing.xl`

#### 5. Clipboard Tray (Modal)
- **Purpose**: Multi-item holder for tasks/notes (3-5 drag-drop slots)
- **Layout**: 
  - Slides up from bottom as modal
  - 5 card slots with drag-to-reorder functionality
  - Each slot: Text input, delete icon, drag handle
  - Close button at top-right

## Design System

### Color Palette (Neurodivergent-Friendly)
**Dark Mode Default (Required)**
- **Background**: `#0A0E14` (deep navy-black, reduces eye strain)
- **Surface**: `#1A1F2E` (elevated elements)
- **Surface Variant**: `#252B3A` (cards, inputs)
- **Primary**: `#7C9FCC` (soft blue - calming, low stimulation)
- **Secondary**: `#A8C5A1` (muted sage green - grounding)
- **Accent**: `#E8B86D` (warm amber - for gamification XP/streaks)
- **Error**: `#D88A8A` (soft coral red - less aggressive)
- **Text Primary**: `#E8EDF5` (off-white, high contrast)
- **Text Secondary**: `#9AA5B8` (muted gray)
- **Divider**: `#2A3142`

**High-Contrast Mode Toggle**: Increase all contrast ratios by 30% for accessibility

### Typography
- **Heading 1**: 28px, Weight 600, Line height 1.3
- **Heading 2**: 22px, Weight 600, Line height 1.4
- **Body**: 16px, Weight 400, Line height 1.6 (generous spacing for readability)
- **Caption**: 14px, Weight 400, Line height 1.5
- **Font Family**: System default (SF Pro on iOS, Roboto on Android) for accessibility
- **Font Size Customization**: Settings slider with 3 presets (Small 14px, Default 16px, Large 18px body text)

### Component Specifications

#### Emoji Sliders (Symptom Tracker)
- **Size**: Full-width minus 32px horizontal padding
- **Emoji Display**: 48px × 48px on left side
- **Slider Track**: 8px height, rounded, `Surface Variant` color
- **Slider Thumb**: 28px diameter circle, `Primary` color with 4px white border
- **Labels**: 1-10 numeric labels below slider in `Text Secondary`, 12px font
- **Haptic Feedback**: Gentle tap on value change
- **Spacing**: 24px vertical spacing between sliders

#### Cards (General)
- **Background**: `Surface` color
- **Border Radius**: 16px (soft, calming)
- **Padding**: 20px
- **Shadow**: None (reduces visual noise for neurodivergent users)
- **Divider**: 1px solid `Divider` color when needed
- **Touch Feedback**: Opacity 0.7 on press (no shadow animations)

#### Floating Action Button (Quick Log)
- **Size**: 64px diameter
- **Background**: `Primary` gradient (subtle vertical gradient from `#7C9FCC` to `#6B8AB8`)
- **Icon**: Plus symbol, 28px, white
- **Position**: Center-bottom, 80px from screen bottom (above tab bar)
- **Shadow**: 
  - shadowOffset: { width: 0, height: 2 }
  - shadowOpacity: 0.10
  - shadowRadius: 2
- **Touch Feedback**: Scale to 0.95 on press with haptic feedback

#### Toggle Switches (Settings)
- **Track Width**: 52px
- **Track Height**: 32px
- **Thumb Size**: 28px diameter
- **Active Color**: `Primary`
- **Inactive Color**: `#3A4150`
- **No animations** (reduces sensory overload)

#### Pattern Insight Cards
- **Size**: 280px wide × 140px tall (horizontal scroll)
- **Background**: `Surface Variant` with left border (4px solid `Secondary`)
- **Icon**: Top-left, 32px, `Secondary` color (system icons only - lightbulb, droplet, etc.)
- **Title**: 18px, Weight 600, `Text Primary`
- **Description**: 14px, Weight 400, `Text Secondary`, 2-line max
- **Spacing**: 16px gap between cards in horizontal scroll

### Accessibility Requirements
- **Touch Targets**: Minimum 48px × 48px (WCAG AAA)
- **Color Contrast**: Minimum 7:1 for text on background (WCAG AAA)
- **Screen Reader**: All interactive elements must have accessibility labels
- **Focus Indicators**: 3px solid `Primary` outline on keyboard/screen reader focus
- **Motion**: Disable all animations in iOS accessibility settings (respect `UIAccessibility.isReduceMotionEnabled`)
- **Text Scaling**: Support iOS Dynamic Type and Android font scale up to 200%

### Interaction Patterns
- **Single-Tap Philosophy**: All primary actions require 1 tap maximum
- **Confirmation Dialogs**: Only for destructive actions (delete, reset) - use native iOS/Android alert dialogs
- **Loading States**: Simple text "Loading..." or skeleton screens (no spinners to reduce visual disturbance)
- **Error Handling**: Inline error text in `Error` color, never block user flow with modals
- **Haptic Feedback**: Gentle taps on successful actions, no vibration patterns

### Visual Assets
**Required Custom Assets** (minimalist, vector-based):
1. **3-5 Abstract Profile Avatars**: Geometric shapes with calming gradients (circles, soft waves) in `Primary`/`Secondary` palette
2. **Module Icons**: Use Expo Vector Icons (Feather set) - no custom illustrations
   - Symptom Tracker: `activity`
   - Clipboard Tray: `clipboard`
   - Spiky Chart: `trending-up`
   - Pattern Insights: `zap`
   - NFC Module: `radio`
   - Gamification: `award`

**No emojis in UI chrome** (only in symptom logging where contextually appropriate).