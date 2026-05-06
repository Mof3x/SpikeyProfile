import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { Spacing } from "@/constants/theme";

export type ThemeId = "calmBlue" | "forestGreen" | "sunset" | "minimal" | "lavender";
export type FontSize = "small" | "medium" | "large" | "extraLarge";

interface ThemeColors {
  text: string;
  textSecondary: string;
  buttonText: string;
  tabIconDefault: string;
  tabIconSelected: string;
  link: string;
  backgroundRoot: string;
  backgroundDefault: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  primary: string;
  secondary: string;
  accent: string;
  error: string;
  success: string;
  divider: string;
  surface: string;
  surfaceVariant: string;
}

export type ThemeTokens = ThemeColors & {
  spacing: typeof Spacing;
};

interface ThemePreset {
  id: ThemeId;
  name: string;
  icon: string;
  light: ThemeColors;
  dark: ThemeColors;
}

const THEME_PRESETS: ThemePreset[] = [
  {
    id: "calmBlue",
    name: "Calm Blue",
    icon: "droplet",
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
  },
  {
    id: "forestGreen",
    name: "Forest Green",
    icon: "feather",
    light: {
      text: "#1A2E1A",
      textSecondary: "#4A6350",
      buttonText: "#FFFFFF",
      tabIconDefault: "#607060",
      tabIconSelected: "#4A7C59",
      link: "#4A7C59",
      backgroundRoot: "#F5FAF5",
      backgroundDefault: "#FFFFFF",
      backgroundSecondary: "#EDF5ED",
      backgroundTertiary: "#E2EDE2",
      primary: "#6B9B7A",
      secondary: "#8FB996",
      accent: "#C4A35A",
      error: "#C4756B",
      success: "#6B9B7A",
      divider: "#D0E0D0",
      surface: "#FFFFFF",
      surfaceVariant: "#F0F8F0",
    },
    dark: {
      text: "#E5F0E8",
      textSecondary: "#9BB5A0",
      buttonText: "#FFFFFF",
      tabIconDefault: "#6B7E6E",
      tabIconSelected: "#6B9B7A",
      link: "#6B9B7A",
      backgroundRoot: "#0A140C",
      backgroundDefault: "#1A2E1E",
      backgroundSecondary: "#253A2A",
      backgroundTertiary: "#2F4635",
      primary: "#6B9B7A",
      secondary: "#8FB996",
      accent: "#D4B36A",
      error: "#D4857B",
      success: "#6B9B7A",
      divider: "#2A422E",
      surface: "#1A2E1E",
      surfaceVariant: "#253A2A",
    },
  },
  {
    id: "sunset",
    name: "Sunset Warm",
    icon: "sun",
    light: {
      text: "#2E1A1A",
      textSecondary: "#6B5050",
      buttonText: "#FFFFFF",
      tabIconDefault: "#806060",
      tabIconSelected: "#C4785A",
      link: "#C4785A",
      backgroundRoot: "#FDF8F5",
      backgroundDefault: "#FFFFFF",
      backgroundSecondary: "#F8F0ED",
      backgroundTertiary: "#F0E6E2",
      primary: "#D4916B",
      secondary: "#E8B89B",
      accent: "#7A9BC4",
      error: "#C46B6B",
      success: "#7BC47A",
      divider: "#E8D8D0",
      surface: "#FFFFFF",
      surfaceVariant: "#FAF4F0",
    },
    dark: {
      text: "#F5EBE8",
      textSecondary: "#C0A8A0",
      buttonText: "#FFFFFF",
      tabIconDefault: "#8B7570",
      tabIconSelected: "#D4916B",
      link: "#D4916B",
      backgroundRoot: "#140C0A",
      backgroundDefault: "#2E1E1A",
      backgroundSecondary: "#3A2A25",
      backgroundTertiary: "#46352F",
      primary: "#D4916B",
      secondary: "#E8B89B",
      accent: "#8AABD4",
      error: "#D47B7B",
      success: "#8BD48B",
      divider: "#42302A",
      surface: "#2E1E1A",
      surfaceVariant: "#3A2A25",
    },
  },
  {
    id: "minimal",
    name: "Minimal Gray",
    icon: "square",
    light: {
      text: "#1A1A1A",
      textSecondary: "#666666",
      buttonText: "#FFFFFF",
      tabIconDefault: "#888888",
      tabIconSelected: "#333333",
      link: "#444444",
      backgroundRoot: "#FAFAFA",
      backgroundDefault: "#FFFFFF",
      backgroundSecondary: "#F5F5F5",
      backgroundTertiary: "#EEEEEE",
      primary: "#555555",
      secondary: "#888888",
      accent: "#444444",
      error: "#AA5555",
      success: "#55AA55",
      divider: "#E0E0E0",
      surface: "#FFFFFF",
      surfaceVariant: "#F8F8F8",
    },
    dark: {
      text: "#EEEEEE",
      textSecondary: "#AAAAAA",
      buttonText: "#FFFFFF",
      tabIconDefault: "#777777",
      tabIconSelected: "#CCCCCC",
      link: "#BBBBBB",
      backgroundRoot: "#0A0A0A",
      backgroundDefault: "#1A1A1A",
      backgroundSecondary: "#252525",
      backgroundTertiary: "#303030",
      primary: "#888888",
      secondary: "#AAAAAA",
      accent: "#777777",
      error: "#CC7777",
      success: "#77CC77",
      divider: "#333333",
      surface: "#1A1A1A",
      surfaceVariant: "#252525",
    },
  },
  {
    id: "lavender",
    name: "Lavender Dream",
    icon: "heart",
    light: {
      text: "#2A1F3D",
      textSecondary: "#5E5073",
      buttonText: "#FFFFFF",
      tabIconDefault: "#7A6B90",
      tabIconSelected: "#8B6BAF",
      link: "#8B6BAF",
      backgroundRoot: "#F8F5FC",
      backgroundDefault: "#FFFFFF",
      backgroundSecondary: "#F0EBF7",
      backgroundTertiary: "#E8E0F2",
      primary: "#9B7BC4",
      secondary: "#B89BD4",
      accent: "#D4A87B",
      error: "#C47B8B",
      success: "#7BC49B",
      divider: "#DCD0E8",
      surface: "#FFFFFF",
      surfaceVariant: "#F5F0FA",
    },
    dark: {
      text: "#EDE8F5",
      textSecondary: "#AEA0C0",
      buttonText: "#FFFFFF",
      tabIconDefault: "#7B6B8B",
      tabIconSelected: "#9B7BC4",
      link: "#9B7BC4",
      backgroundRoot: "#0E0A14",
      backgroundDefault: "#1E1A2E",
      backgroundSecondary: "#2A253A",
      backgroundTertiary: "#352F46",
      primary: "#9B7BC4",
      secondary: "#B89BD4",
      accent: "#D4B88B",
      error: "#D48B9B",
      success: "#8BC4AB",
      divider: "#322A42",
      surface: "#1E1A2E",
      surfaceVariant: "#2A253A",
    },
  },
];

const FONT_SIZE_SCALES: Record<FontSize, number> = {
  small: 0.85,
  medium: 1,
  large: 1.15,
  extraLarge: 1.3,
};

interface ThemeContextType {
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  theme: ThemeTokens;
  fontScale: number;
  themePresets: ThemePreset[];
  currentPreset: ThemePreset;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEYS = {
  themeId: "@spikeyprofile/themeId",
  isDark: "@spikeyprofile/isDark",
  fontSize: "@spikeyprofile/fontSize",
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState<ThemeId>("calmBlue");
  const [isDark, setIsDarkState] = useState(true);
  const [fontSize, setFontSizeState] = useState<FontSize>("medium");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredPreferences();
  }, []);

  const loadStoredPreferences = async () => {
    try {
      const [storedThemeId, storedIsDark, storedFontSize] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.themeId),
        AsyncStorage.getItem(STORAGE_KEYS.isDark),
        AsyncStorage.getItem(STORAGE_KEYS.fontSize),
      ]);

      if (storedThemeId) {
        setThemeIdState(storedThemeId as ThemeId);
      }
      if (storedIsDark !== null) {
        setIsDarkState(storedIsDark === "true");
      }
      if (storedFontSize) {
        setFontSizeState(storedFontSize as FontSize);
      }
    } catch (error) {
      console.error("Failed to load theme preferences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setThemeId = async (id: ThemeId) => {
    setThemeIdState(id);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.themeId, id);
    } catch (error) {
      console.error("Failed to save theme:", error);
    }
  };

  const setIsDark = async (dark: boolean) => {
    setIsDarkState(dark);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.isDark, dark.toString());
    } catch (error) {
      console.error("Failed to save dark mode:", error);
    }
  };

  const setFontSize = async (size: FontSize) => {
    setFontSizeState(size);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.fontSize, size);
    } catch (error) {
      console.error("Failed to save font size:", error);
    }
  };

  const currentPreset = useMemo(() => {
    return THEME_PRESETS.find((p) => p.id === themeId) || THEME_PRESETS[0];
  }, [themeId]);

  const theme = useMemo<ThemeTokens>(() => {
    const baseTheme = isDark ? currentPreset.dark : currentPreset.light;
    return { ...baseTheme, spacing: Spacing };
  }, [currentPreset, isDark]);

  const fontScale = FONT_SIZE_SCALES[fontSize];

  const value = {
    themeId,
    setThemeId,
    isDark,
    setIsDark,
    fontSize,
    setFontSize,
    theme,
    fontScale,
    themePresets: THEME_PRESETS,
    currentPreset,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeContext must be used within a ThemeProvider");
  }
  return context;
}

export { THEME_PRESETS, FONT_SIZE_SCALES };
export type { ThemeColors, ThemePreset, ThemeTokens };
