import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useAuthStore } from '../../stores/authStore';
import { useAppTheme } from '../../hooks/use-theme-color';
import { supabase } from '../../lib/supabase';
import { uploadPhoto } from '../../services/storageService';
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const SEEKING_OPTIONS = [
  { id: 'men', label: 'Men', emoji: '👨' },
  { id: 'women', label: 'Women', emoji: '👩' },
  { id: 'everyone', label: 'Everyone', emoji: '💫' },
];

export default function PreferencesOnboarding() {
  const router = useRouter();
  const theme = useAppTheme();
  const { data, updateData } = useOnboardingStore();
  const { user, fetchProfile } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    if (!user) return;
    setLoading(true);
    useAuthStore.getState().setLoading(true); // Instantly show full-screen auth loading screen
    try {
      // 1. Upload all local photos first and get their public URLs
      const uploadedUrls = await Promise.all(
        data.photos.map(async (uri) => {
          if (!uri) return '';
          if (uri.startsWith('http')) return uri;
          try {
            return await uploadPhoto(user.id, uri);
          } catch (e) {
            console.error('[Onboarding Upload] Failed for uri:', uri, e);
            return '';
          }
        })
      );

      const finalUrls = uploadedUrls.filter(p => p !== '');

      // 2. Perform database update with all text data, photos, and set is_onboarded to true
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.fullName,
          country: data.country || null,
          birth_date: data.birthDate || null,
          gender: data.gender,
          bio: data.bio || null,
          location_city: data.locationCity || null,
          interests: data.interests,
          photos: finalUrls,
          avatar_url: finalUrls[0] || null,
          preferences: data.preferences,
          is_onboarded: true, // Mark as finished so they can enter the app
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      // 3. Navigate immediately
      await fetchProfile(user.id);
      useAuthStore.getState().setLoading(false); // Close loading screen to render Discover
      router.replace('/(tabs)/discover');
    } catch (error: any) {
      useAuthStore.getState().setLoading(false); // Reset loading on error
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const isComplete = data.preferences.interestedIn !== '';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: SPACING.md }}>
          <ProgressBar progress={1.0} label="Step 7 of 7" />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.text }]}>Your preferences</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          Who are you looking for?
        </Text>

        {/* Interested In */}
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Interested in</Text>
        <View style={styles.optionRow}>
          {SEEKING_OPTIONS.map((opt) => {
            const selected = data.preferences.interestedIn === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.option,
                  { 
                    backgroundColor: selected ? theme.primary : theme.card, 
                    borderColor: selected ? theme.primary : theme.border 
                  },
                ]}
                onPress={() => updateData({ preferences: { ...data.preferences, interestedIn: opt.id } })}
                activeOpacity={0.7}
              >
                <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                <Text style={[styles.optionText, { color: selected ? '#FFF' : theme.text }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Distance */}
        <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.statRow}>
            <View style={styles.statLeft}>
              <Ionicons name="location-outline" size={20} color={theme.primary} />
              <Text style={[styles.statLabel, { color: theme.text }]}>Max Distance</Text>
            </View>
            <Text style={[styles.statValue, { color: theme.primary }]}>
              {data.preferences.distance} km
            </Text>
          </View>
          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={1}
            maximumValue={100}
            step={1}
            value={data.preferences.distance}
            minimumTrackTintColor={theme.primary}
            maximumTrackTintColor={theme.border}
            thumbTintColor={theme.primary}
            onSlidingComplete={(val) => updateData({ preferences: { ...data.preferences, distance: val } })}
          />
        </View>

        {/* Age Range */}
        <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.statRow}>
            <View style={styles.statLeft}>
              <Ionicons name="people-outline" size={20} color={theme.primary} />
              <Text style={[styles.statLabel, { color: theme.text }]}>Age Range</Text>
            </View>
            <Text style={[styles.statValue, { color: theme.primary }]}>
              {data.preferences.minAge}–{data.preferences.maxAge}
            </Text>
          </View>
          
          <View style={{ alignItems: 'center', marginTop: 10 }}>
            <MultiSlider
              values={[data.preferences.minAge, data.preferences.maxAge]}
              sliderLength={width - (SPACING.lg * 2) - (SPACING.md * 2) - 20}
              onValuesChange={(values) => updateData({ 
                preferences: { 
                  ...data.preferences, 
                  minAge: values[0], 
                  maxAge: values[1] 
                } 
              })}
              min={18}
              max={80}
              step={1}
              allowOverlap={false}
              snapped
              selectedStyle={{ backgroundColor: theme.primary }}
              unselectedStyle={{ backgroundColor: theme.border }}
              trackStyle={{ height: 4 }}
              markerStyle={{
                backgroundColor: '#FFF',
                height: 24,
                width: 24,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: theme.primary,
                ...SHADOWS.soft,
              }}
            />
          </View>
        </View>

        <View style={[styles.finishNote, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Ionicons name="checkmark-circle" size={20} color={theme.success} />
          <Text style={[styles.finishNoteText, { color: theme.textMuted }]}>
            You can always update these in your profile settings.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
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
  container: { flex: 1 },
  headerRow: {
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
  sectionLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: SPACING.md,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: SPACING.xl,
  },
  option: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  optionEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  optionText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
  },
  statCard: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  statLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 16,
  },
  statValue: {
    fontFamily: FONTS.display,
    fontSize: 22,
  },
  sliderHint: {
    fontFamily: FONTS.body,
    fontSize: 13,
  },
  finishNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    marginTop: SPACING.sm,
  },
  finishNoteText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  footer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
    borderTopWidth: 1,
  },
});
