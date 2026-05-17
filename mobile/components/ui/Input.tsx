import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TouchableOpacity,
  Pressable,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { useAppTheme } from '../../hooks/use-theme-color';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  icon?: keyof typeof Ionicons.glyphMap;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  icon,
  secureTextEntry,
  ...props
}) => {
  const theme = useAppTheme();
  const inputRef = React.useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secureTextEntry ?? false);

  const handlePress = () => {
    inputRef.current?.focus();
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: theme.textMuted }]}>{label}</Text>
      )}
      <Pressable 
        onPress={handlePress}
        style={[
          styles.inputWrapper,
          {
            backgroundColor: theme.card,
            borderColor: focused
              ? theme.primary
              : error
                ? theme.error
                : theme.border,
          }
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={18}
            color={focused ? theme.primary : theme.textMuted}
            style={styles.icon}
          />
        )}
        <TextInput
          ref={(r) => { (inputRef.current as any) = r; }}
          style={[styles.input, { color: theme.text, backgroundColor: 'transparent' }]}
          placeholderTextColor={theme.textMuted}
          secureTextEntry={hidden}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoCapitalize="none"
          autoCorrect={false}
          {...props}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setHidden(h => !h)} style={styles.eyeBtn}>
            <Ionicons
              name={hidden ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={theme.textMuted}
            />
          </TouchableOpacity>
        )}
      </Pressable>
      {error && (
        <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
    width: '100%',
  },
  label: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    marginBottom: SPACING.xs,
    marginLeft: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    paddingHorizontal: SPACING.md,
  },
  icon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 16,
    height: '100%',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  eyeBtn: {
    padding: 4,
    marginLeft: SPACING.sm,
  },
  errorText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    marginTop: 6,
    marginLeft: 2,
  },
});
