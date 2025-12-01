import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/useColorScheme";

export function useTheme() {
  const colorScheme = useColorScheme();
  const isDark = true;
  const theme = Colors.dark;

  return {
    theme,
    isDark,
  };
}
