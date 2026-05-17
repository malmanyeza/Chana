import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, SPACING } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { PhotoPicker } from '../../components/profile/PhotoPicker';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Ionicons } from '@expo/vector-icons';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useAuthStore } from '../../stores/authStore';
import { useAppTheme } from '../../hooks/use-theme-color';
import { uploadPhoto } from '../../services/storageService';

export default function PhotosOnboarding() {
  const router = useRouter();
  const theme = useAppTheme();
  const { data, updateData } = useOnboardingStore();
  const { user } = useAuthStore();


  // Ensure data.photos has 6 slots (local URIs until uploaded)
  const displayPhotos = [...data.photos];
  while (displayPhotos.length < 6) {
    displayPhotos.push('');
  }

  const updatePhoto = (index: number, uri: string) => {
    const newPhotos = [...data.photos];
    // Ensure array has 6 slots
    while (newPhotos.length < 6) newPhotos.push('');
    newPhotos[index] = uri;
    updateData({ photos: newPhotos });
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...data.photos];
    newPhotos[index] = '';
    updateData({ photos: newPhotos });
  };

  const isComplete = data.photos.filter(p => p !== '').length >= 2;

  const handleContinue = () => {
    if (!user) return;
    // We navigate immediately. The actual upload will happen in the background
    // once the user finishes the entire onboarding flow in the next screen.
    router.push('/(onboarding)/preferences');
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
          <ProgressBar progress={0.85} label="Step 6 of 7" />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>Add your best photos</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          Show off the real you. Add at least 2 photos to continue.
        </Text>

        <View style={styles.grid}>
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <PhotoPicker
              key={index}
              uri={data.photos[index]}
              isMain={index === 0}
              onPick={(uri) => updatePhoto(index, uri)}
              onRemove={() => removePhoto(index)}
            />
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <Button
          title="Continue"
          disabled={!isComplete}
          onPress={handleContinue}
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  footer: {
    padding: SPACING.lg,
    borderTopWidth: 1,
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  uploadingText: {
    fontFamily: FONTS.body,
    fontSize: 16,
  },
});
