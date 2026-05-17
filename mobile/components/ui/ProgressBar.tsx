import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { useAppTheme } from '../../hooks/use-theme-color';

interface ProgressBarProps {
  progress: number; // 0 to 1
  label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, label }) => {
  const theme = useAppTheme();
  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: theme.textMuted }]}>{label}</Text>
      )}
      <View style={[styles.track, { backgroundColor: theme.border }]}>
        <LinearGradient
          colors={COLORS.gradients.warm}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fill, { width: `${progress * 100}%` }]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: SPACING.md,
  },
  label: {
    fontFamily: FONTS.body,
    fontSize: 12,
    textAlign: 'right',
    marginBottom: SPACING.xs,
  },
  track: {
    height: 5,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
});
