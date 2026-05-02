import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useAppTheme } from '../../hooks/use-theme-color';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';

const SEEKING_OPTIONS = [
  { id: 'men', label: 'Men' },
  { id: 'women', label: 'Women' },
  { id: 'everyone', label: 'Everyone' },
];

export default function PreferencesOnboarding() {
  const router = useRouter();
  const theme = useAppTheme();
  const { data, updateData } = useOnboardingStore();
  const { user, fetchProfile } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const toggleSeeking = (id: string) => {
    updateData({ preferences: { ...data.preferences, interestedIn: id } });
  };

  const handleFinish = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.fullName,
          birth_date: data.birthDate,
          gender: data.gender,
          bio: data.bio,
          interests: data.interests,
          photos: data.photos,
          preferences: data.preferences,
          is_onboarded: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      await fetchProfile(user.id);
      router.replace('/(tabs)/discover');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const isComplete = data.preferences.interestedIn !== '';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <ProgressBar progress={1.0} label="Step 4 of 4" />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>Your preferences</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>Who are you looking for?</Text>

        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.text }]}>Interested in</Text>
          <View style={styles.optionGrid}>
            {SEEKING_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.option,
                  { backgroundColor: theme.card, borderColor: theme.border },
                  data.preferences.interestedIn === opt.id && [styles.optionSelected, { borderColor: theme.primary, backgroundColor: theme.primary + '1A' }]
                ]}
                onPress={() => toggleSeeking(opt.id)}
              >
                <Text style={[
                  styles.optionText,
                  { color: theme.textMuted },
                  data.preferences.interestedIn === opt.id && { color: theme.primary }
                ]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.text }]}>Maximum distance</Text>
          <View style={styles.rangePreview}>
            <Text style={[styles.rangeValue, { color: theme.primary }]}>{data.preferences.distance} km</Text>
          </View>
          <View style={[styles.sliderPlaceholder, { backgroundColor: theme.border }]} />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.text }]}>Age range</Text>
          <View style={styles.rangePreview}>
            <Text style={[styles.rangeValue, { color: theme.primary }]}>{data.preferences.minAge} - {data.preferences.maxAge}</Text>
          </View>
          <View style={[styles.sliderPlaceholder, { backgroundColor: theme.border }]} />
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <Button
          title="Finish Setup"
          loading={loading}
          disabled={!isComplete}
          onPress={handleFinish}
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
  section: {
    marginBottom: SPACING.xl,
  },
  label: {
    fontFamily: FONTS.bodyBold,
    fontSize: 18,
    marginBottom: SPACING.md,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  option: {
    flex: 1,
    minWidth: 100,
    paddingVertical: 16,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  optionSelected: {
    // Colors handled dynamically
  },
  optionText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 16,
  },
  rangePreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  rangeValue: {
    fontFamily: FONTS.bodyBold,
    fontSize: 24,
  },
  sliderPlaceholder: {
    height: 4,
    borderRadius: 2,
    marginTop: SPACING.md,
  },
  footer: {
    padding: SPACING.lg,
    borderTopWidth: 1,
  },
});
