import React from 'react';
import { 
  View,
  KeyboardAvoidingView, 
  ScrollView, 
  TouchableWithoutFeedback, 
  Keyboard, 
  Platform, 
  StyleSheet,
  ViewStyle
} from 'react-native';

interface Props {
  children: React.ReactNode;
  contentContainerStyle?: ViewStyle;
}

export const KeyboardAvoidingWrapper: React.FC<Props> = ({ children, contentContainerStyle }) => {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {Platform.OS === 'web' ? (
          <View style={[styles.container, contentContainerStyle]}>
            {children}
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            {children}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
