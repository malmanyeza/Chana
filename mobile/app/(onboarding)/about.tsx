import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FONTS, SPACING } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { KeyboardAvoidingWrapper } from '../../components/ui/KeyboardAvoidingWrapper';
import { Ionicons } from '@expo/vector-icons';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useAppTheme } from '../../hooks/use-theme-color';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';

export default function NameOnboarding() {
  const router = useRouter();
  const theme = useAppTheme();
  const activeTheme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const { data, updateData } = useOnboardingStore();
  const { signOut } = useAuthStore();

  const isComplete = data.fullName && data.fullName.trim().length > 2;

  const handleBack = () => {
    Alert.alert(
      'Exit Onboarding?',
      'Are you sure you want to exit? You will be signed out.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Exit', style: 'destructive', onPress: () => signOut() }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={handleBack} 
          style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: SPACING.md, marginRight: SPACING.md }}>
          <ProgressBar progress={0.12} label="Step 1 of 8" />
        </View>
        <TouchableOpacity 
          onPress={toggleTheme} 
          style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          <Ionicons 
            name={activeTheme === 'light' ? 'moon-outline' : 'sunny-outline'} 
            size={20} 
            color={theme.text} 
          />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingWrapper contentContainerStyle={styles.content}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.text }]}>What's your name?</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            This is how you'll appear on Chana.
          </Text>

          <Input
            label="Full Name"
            placeholder="Your full name"
            value={data.fullName}
            onChangeText={(v) => updateData({ fullName: v })}
            icon="person-outline"
            autoFocus
          />
        </View>
        
        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <Button
            title="Continue"
            disabled={!isComplete}
            onPress={() => router.push('/(onboarding)/country')}
          />
        </View>
      </KeyboardAvoidingWrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  progressArea: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },

  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: 34,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 16,
    marginBottom: SPACING.xl,
  },
  footer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
    borderTopWidth: 1,
  },
});
