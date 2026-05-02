import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, SPACING } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { PhotoPicker } from '../../components/profile/PhotoPicker';
import { ProgressBar } from '../../components/ui/ProgressBar';

import { useOnboardingStore } from '../../stores/onboardingStore';
import { useAppTheme } from '../../hooks/use-theme-color';

export default function PhotosOnboarding() {
  const router = useRouter();
  const theme = useAppTheme();
  const { data, updateData } = useOnboardingStore();

  // Ensure data.photos has 6 slots
  const displayPhotos = [...data.photos];
  while (displayPhotos.length < 6) {
    displayPhotos.push('');
  }

  const updatePhoto = (index: number, uri: string) => {
    const newPhotos = [...data.photos];
    newPhotos[index] = uri;
    updateData({ photos: newPhotos.filter(p => p !== '') });
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...data.photos];
    newPhotos.splice(index, 1);
    updateData({ photos: newPhotos });
  };

  const isComplete = data.photos.length >= 2;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <ProgressBar progress={0.75} label="Step 3 of 4" />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>Add your best photos</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>Show off the real you. Add at least 2 photos to continue.</Text>

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
          onPress={() => router.push('/(onboarding)/preferences')}
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
});
