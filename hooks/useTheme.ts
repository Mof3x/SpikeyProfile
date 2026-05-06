import { useThemeContext } from "@/core/ThemeContext";
import { Typography } from "@/constants/theme";
import { useMemo } from "react";

export function useTheme() {
  const { theme, isDark, fontScale } = useThemeContext();

  const scaledTypography = useMemo(() => {
    return {
      h1: {
        ...Typography.h1,
        fontSize: Math.round(Typography.h1.fontSize * fontScale),
      },
      h2: {
        ...Typography.h2,
        fontSize: Math.round(Typography.h2.fontSize * fontScale),
      },
      h3: {
        ...Typography.h3,
        fontSize: Math.round(Typography.h3.fontSize * fontScale),
      },
      h4: {
        ...Typography.h4,
        fontSize: Math.round(Typography.h4.fontSize * fontScale),
      },
      body: {
        ...Typography.body,
        fontSize: Math.round(Typography.body.fontSize * fontScale),
      },
      small: {
        ...Typography.small,
        fontSize: Math.round(Typography.small.fontSize * fontScale),
      },
      caption: {
        ...Typography.caption,
        fontSize: Math.round(Typography.caption.fontSize * fontScale),
      },
      link: {
        ...Typography.link,
        fontSize: Math.round(Typography.link.fontSize * fontScale),
      },
    };
  }, [fontScale]);

  return {
    theme,
    isDark,
    fontScale,
    typography: scaledTypography,
    spacing: theme.spacing,
  };
}
