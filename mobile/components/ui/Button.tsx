import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
  View,
} from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { useAppTheme } from '../../hooks/use-theme-color';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  loading = false,
  style,
  textStyle,
  disabled,
  icon,
  ...props
}) => {
  const theme = useAppTheme();
  const isDisabled = disabled || loading;

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator color={variant === 'primary' ? '#FFF' : theme.primary} />;
    }

    return (
      <View style={styles.content}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <Text
          style={[
            styles.textBase,
            variant === 'primary' ? styles.textPrimary : { color: theme.text },
            variant === 'ghost' ? { color: theme.primary } : {},
            textStyle,
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumScaleFactor={0.7}
        >
          {title}
        </Text>
      </View>
    );
  };

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        style={[styles.base, styles.primary, isDisabled && styles.disabled, style]}
        disabled={isDisabled}
        activeOpacity={0.85}
        {...props}
      >
        {renderContent()}
      </TouchableOpacity>
    );
  }

  if (variant === 'outline') {
    return (
      <TouchableOpacity
        style={[
          styles.base,
          styles.outlineWrapper,
          { borderColor: theme.border, backgroundColor: theme.card },
          isDisabled && styles.disabled,
          style
        ]}
        disabled={isDisabled}
        activeOpacity={0.7}
        {...props}
      >
        {renderContent()}
      </TouchableOpacity>
    );
  }

  if (variant === 'ghost') {
    return (
      <TouchableOpacity
        style={[styles.base, isDisabled && styles.disabled, style]}
        disabled={isDisabled}
        activeOpacity={0.6}
        {...props}
      >
        {renderContent()}
      </TouchableOpacity>
    );
  }

  // Secondary
  return (
    <TouchableOpacity
      style={[styles.base, { backgroundColor: theme.card }, isDisabled && styles.disabled, style]}
      disabled={isDisabled}
      activeOpacity={0.7}
      {...props}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    height: 58,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    ...SHADOWS.soft,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 10,
  },
  primary: {
    backgroundColor: COLORS.primary,
  },
  outlineWrapper: {
    borderWidth: 1.5,
  },
  disabled: {
    opacity: 0.45,
  },
  textBase: {
    fontFamily: FONTS.bodyBold,
    fontSize: 16,
    letterSpacing: 0.5,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  textPrimary: {
    color: '#FFFFFF',
  },
});
