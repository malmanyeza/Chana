import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Ionicons } from '@expo/vector-icons';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useAppTheme } from '../../hooks/use-theme-color';

const GENDERS = [
  { id: 'man', label: 'Man', emoji: '👨' },
  { id: 'woman', label: 'Woman', emoji: '👩' },
  { id: 'non-binary', label: 'Non-binary', emoji: '🌈' },
  { id: 'other', label: 'Other', emoji: '✨' },
];

export default function GenderOnboarding() {
  const router = useRouter();
  const theme = useAppTheme();
  const { data, updateData } = useOnboardingStore();

  const isComplete = !!data.gender;

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
          <ProgressBar progress={0.42} label="Step 3 of 7" />
        </View>
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>What's your gender?</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          Select the option that best describes you.
        </Text>

        <View style={styles.genderGrid}>
          {GENDERS.map((g) => {
            const selected = data.gender === g.id;
            return (
              <TouchableOpacity
                key={g.id}
                style={[
                  styles.genderOption,
                  { 
                    backgroundColor: selected ? theme.primary : theme.card, 
                    borderColor: selected ? theme.primary : theme.border 
                  },
                ]}
                onPress={() => updateData({ gender: g.id })}
                activeOpacity={0.7}
              >
                <Text style={styles.genderEmoji}>{g.emoji}</Text>
                <Text style={[styles.genderText, { color: selected ? '#FFF' : theme.text }]}>
                  {g.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
        <Button
          title="Continue"
          disabled={!isComplete}
          onPress={() => router.push('/(onboarding)/bio')}
        />
      </View>
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
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    flex: 1,
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
  genderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  genderOption: {
    width: '47%',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  genderEmoji: {
    fontSize: 22,
  },
  genderText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 16,
  },
  footer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
    borderTopWidth: 1,
  },
});
