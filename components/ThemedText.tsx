import { Text, type TextProps } from "react-native";

import { useTheme } from "@/hooks/useTheme";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: "h1" | "h2" | "h3" | "h4" | "body" | "small" | "caption" | "link";
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "body",
  ...rest
}: ThemedTextProps) {
  const { theme, isDark, typography } = useTheme();

  const getColor = () => {
    if (isDark && darkColor) {
      return darkColor;
    }

    if (!isDark && lightColor) {
      return lightColor;
    }

    if (type === "link") {
      return theme.link;
    }

    return theme.text;
  };

  const getTypeStyle = () => {
    switch (type) {
      case "h1":
        return typography.h1;
      case "h2":
        return typography.h2;
      case "h3":
        return typography.h3;
      case "h4":
        return typography.h4;
      case "body":
        return typography.body;
      case "small":
        return typography.small;
      case "caption":
        return typography.caption;
      case "link":
        return typography.link;
      default:
        return typography.body;
    }
  };

  return (
    <Text style={[{ color: getColor() }, getTypeStyle(), style]} {...rest} />
  );
}
