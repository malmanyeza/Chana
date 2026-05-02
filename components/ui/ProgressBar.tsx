import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';

interface ProgressBarProps {
  progress: number; // 0 to 1
  label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, label }) => {
  return (
    <View style={styles.container}>
      <View style={styles.barContainer}>
        <View style={[styles.bar, { width: `${progress * 100}%` }]} />
      </View>
      {label && <Text style={styles.label}>{label}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: SPACING.md,
  },
  barContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  label: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.textMutedDark,
    marginTop: SPACING.xs,
    textAlign: 'right',
  },
});
