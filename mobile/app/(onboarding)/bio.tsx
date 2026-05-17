import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FONTS, SPACING } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAvoidingWrapper } from '../../components/ui/KeyboardAvoidingWrapper';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useAppTheme } from '../../hooks/use-theme-color';

export default function BioOnboarding() {
  const router = useRouter();
  const theme = useAppTheme();
  const { data, updateData } = useOnboardingStore();

  const isComplete = data.locationCity && data.locationCity.trim().length > 1;

  const handleNext = () => {
    router.push('/(onboarding)/interests');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: SPACING.md }}>
          <ProgressBar progress={0.56} label="Step 4 of 7" />
        </View>
        <TouchableOpacity 
          onPress={handleNext}
          style={styles.skipButton}
        >
          <Text style={[styles.skipText, { color: theme.primary }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingWrapper contentContainerStyle={styles.content}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.text }]}>Tell us about yourself</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Write a short bio or add your city. The bio is optional!
          </Text>

          <Input
            label="Bio (Optional)"
            placeholder="I love hiking, coffee, and..."
            value={data.bio}
            onChangeText={(v) => updateData({ bio: v })}
            multiline
            maxLength={150}
            icon="chatbubble-outline"
          />
          <Text style={[styles.charCount, { color: theme.textMuted }]}>{data.bio.length}/150</Text>

          <Input
            label="City"
            placeholder="Where do you live?"
            value={data.locationCity || ''}
            onChangeText={(v) => updateData({ locationCity: v })}
            icon="location-outline"
            containerStyle={{ marginTop: SPACING.md }}
          />
        </View>

        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <Button
            title="Continue"
            disabled={!isComplete}
            onPress={handleNext}
          />
        </View>
      </KeyboardAvoidingWrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  skipButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  skipText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 16,
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
  charCount: {
    fontFamily: FONTS.body,
    fontSize: 12,
    textAlign: 'right',
    marginTop: -SPACING.sm,
  },
  footer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
    borderTopWidth: 1,
  },
});
