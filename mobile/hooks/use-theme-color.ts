import { Colors } from '@/constants/theme';
import { useThemeStore } from '../stores/themeStore';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useThemeStore((state) => state.theme);
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}

export function useAppTheme() {
  const theme = useThemeStore((state) => state.theme);
  return Colors[theme];
}
