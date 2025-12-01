import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#1A1F2E",
    textSecondary: "#5A6378",
    buttonText: "#FFFFFF",
    tabIconDefault: "#687076",
    tabIconSelected: "#5B7FBF",
    link: "#5B7FBF",
    backgroundRoot: "#F5F7FA",
    backgroundDefault: "#FFFFFF",
    backgroundSecondary: "#EDF0F5",
    backgroundTertiary: "#E2E6ED",
    primary: "#7C9FCC",
    secondary: "#A8C5A1",
    accent: "#E8B86D",
    error: "#D88A8A",
    success: "#A8C5A1",
    divider: "#D8DDE6",
    surface: "#FFFFFF",
    surfaceVariant: "#F0F3F8",
  },
  dark: {
    text: "#E8EDF5",
    textSecondary: "#9AA5B8",
    buttonText: "#FFFFFF",
    tabIconDefault: "#6B7280",
    tabIconSelected: "#7C9FCC",
    link: "#7C9FCC",
    backgroundRoot: "#0A0E14",
    backgroundDefault: "#1A1F2E",
    backgroundSecondary: "#252B3A",
    backgroundTertiary: "#2F3647",
    primary: "#7C9FCC",
    secondary: "#A8C5A1",
    accent: "#E8B86D",
    error: "#D88A8A",
    success: "#A8C5A1",
    divider: "#2A3142",
    surface: "#1A1F2E",
    surfaceVariant: "#252B3A",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  "6xl": 64,
  inputHeight: 48,
  buttonHeight: 52,
  fabSize: 64,
  touchTarget: 48,
  sliderThumb: 28,
  cardPadding: 20,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 28,
    fontWeight: "600" as const,
  },
  h2: {
    fontSize: 22,
    fontWeight: "600" as const,
  },
  h3: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 18,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 14,
    fontWeight: "400" as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: "400" as const,
  },
  link: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const Shadows = {
  fab: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 4,
  },
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
};
