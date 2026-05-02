import React from 'react';
import { 
  View, 
  TextInput, 
  Text, 
  StyleSheet, 
  TextInputProps, 
  ViewStyle 
} from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  containerStyle, 
  ...props 
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input, 
          error ? styles.inputError : null,
          props.multiline ? styles.multiline : null
        ]}
        placeholderTextColor={COLORS.textMutedLight}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
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
    fontSize: 14,
    color: COLORS.textPrimaryLight,
    marginBottom: SPACING.xs,
    marginLeft: 4,
  },
  input: {
    height: 56,
    backgroundColor: '#F3F4F6',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.textPrimaryLight,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: COLORS.decline,
    backgroundColor: '#FFF5F5',
  },
  multiline: {
    height: 120,
    paddingTop: SPACING.md,
    textAlignVertical: 'top',
  },
  errorText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.decline,
    marginTop: SPACING.xs,
    marginLeft: 4,
  },
});
