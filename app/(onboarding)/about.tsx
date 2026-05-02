import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { KeyboardAvoidingWrapper } from '../../components/ui/KeyboardAvoidingWrapper';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useAppTheme } from '../../hooks/use-theme-color';

const GENDERS = [
  { id: 'man', label: 'Man' },
  { id: 'woman', label: 'Woman' },
  { id: 'non-binary', label: 'Non-binary' },
  { id: 'other', label: 'Other' },
];

export default function AboutOnboarding() {
  const router = useRouter();
  const theme = useAppTheme();
  const { data, updateData } = useOnboardingStore();

  const isComplete = data.fullName && data.birthDate && data.gender && data.bio;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <ProgressBar progress={0.25} label="Step 1 of 4" />
      </View>

      <KeyboardAvoidingWrapper contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>About you</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>Help people get to know the real you.</Text>

        <View style={styles.form}>
          <Input
            label="Full Name"
            placeholder="John Doe"
            value={data.fullName}
            onChangeText={(val) => updateData({ fullName: val })}
          />

          <Input
            label="Date of Birth"
            placeholder="YYYY-MM-DD"
            value={data.birthDate}
            onChangeText={(val) => updateData({ birthDate: val })}
          />

          <Text style={[styles.label, { color: theme.text }]}>Gender</Text>
          <View style={styles.genderGrid}>
            {GENDERS.map((g) => (
              <TouchableOpacity
                key={g.id}
                style={[
                  styles.genderOption,
                  { backgroundColor: theme.card, borderColor: theme.border },
                  data.gender === g.id && [styles.genderSelected, { borderColor: theme.primary, backgroundColor: theme.primary }]
                ]}
                onPress={() => updateData({ gender: g.id })}
              >
                <Text style={[
                  styles.genderText,
                  { color: theme.textMuted },
                  data.gender === g.id && styles.genderTextSelected
                ]}>
                  {g.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            label="Bio"
            placeholder="Tell us something interesting..."
            value={data.bio}
            onChangeText={(val) => updateData({ bio: val })}
            multiline
            maxLength={150}
            containerStyle={{ marginTop: SPACING.md }}
          />
          <Text style={[styles.charCount, { color: theme.textMuted }]}>{data.bio.length}/150</Text>
        </View>
      </KeyboardAvoidingWrapper>

      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <Button
          title="Continue"
          disabled={!isComplete}
          onPress={() => router.push('/(onboarding)/interests')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 16,
    marginBottom: SPACING.xl,
  },
  form: {
    flex: 1,
  },
  label: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    marginBottom: SPACING.sm,
    marginLeft: 4,
  },
  genderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  genderOption: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  genderSelected: {
    // Colors handled dynamically
  },
  genderText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
  },
  genderTextSelected: {
    color: '#FFFFFF',
  },
  charCount: {
    fontFamily: FONTS.body,
    fontSize: 12,
    textAlign: 'right',
    marginTop: -SPACING.sm,
    marginBottom: SPACING.md,
  },
  footer: {
    padding: SPACING.lg,
    borderTopWidth: 1,
  },
});
