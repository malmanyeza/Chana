import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { Image } from 'expo-image';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { useAppTheme } from '../../hooks/use-theme-color';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { uploadPhoto, deletePhoto } from '../../services/storageService';
import { INTERESTS } from '../../constants/interests';
import * as ImagePicker from 'expo-image-picker';

const SEEKING_OPTIONS = [
  { id: 'men', label: 'Men', emoji: '👨' },
  { id: 'women', label: 'Women', emoji: '👩' },
  { id: 'everyone', label: 'Everyone', emoji: '💫' },
];

export default function EditProfileScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { user, profile, fetchProfile } = useAuthStore();

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [locationCity, setLocationCity] = useState(profile?.location_city ?? '');
  const [interests, setInterests] = useState<string[]>(profile?.interests ?? []);
  const [photos, setPhotos] = useState<string[]>(profile?.photos ?? []);
  
  // Preferences State
  const [preferences, setPreferences] = useState(profile?.preferences || {
    interestedIn: 'both',
    minAge: 18,
    maxAge: 50,
    distance: 50
  });

  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const toggleInterest = (id: string) => {
    setInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : prev.length < 10 ? [...prev, id] : prev
    );
  };

  const handlePickPhoto = async () => {
    if (!user) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: false,
    });

    if (result.canceled) return;
    const localUri = result.assets[0].uri;

    setUploadingPhoto(true);
    setPhotos(prev => [...prev, localUri]);
    
    try {
      const publicUrl = await uploadPhoto(user.id, localUri);
      setPhotos(prev => prev.map(p => p === localUri ? publicUrl : p));
    } catch (err: any) {
      setPhotos(prev => prev.filter(p => p !== localUri));
      Alert.alert('Upload Failed', err.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async (url: string) => {
    setPhotos(prev => prev.filter(p => p !== url));
    try {
      await deletePhoto(url);
    } catch {
      // Silent fail
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          bio,
          location_city: locationCity,
          interests,
          photos,
          avatar_url: photos[0] || null,
          preferences, // Save the updated preferences too
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      await fetchProfile(user.id);
      Alert.alert('Saved!', 'Your profile has been updated.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} style={styles.headerBtn} disabled={saving}>
          {saving
            ? <ActivityIndicator color={theme.primary} />
            : <Text style={[styles.saveText, { color: theme.primary }]}>Save</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Photos Section */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Photos</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosRow}>
          {photos.map((uri, idx) => (
            <View key={idx} style={styles.photoItem}>
              <View style={styles.imageClip}>
                <Image 
                  source={{ uri }} 
                  style={styles.photo} 
                  contentFit="contain"
                  transition={200}
                />
              </View>
              <TouchableOpacity
                style={styles.removePhotoBtn}
                onPress={() => handleRemovePhoto(uri)}
              >
                <Ionicons name="close-circle" size={22} color="#FF4D4D" />
              </TouchableOpacity>
              {idx === 0 && (
                <View style={styles.mainBadge}>
                  <Text style={styles.mainBadgeText}>Main</Text>
                </View>
              )}
            </View>
          ))}

          {photos.length < 6 && (
            <TouchableOpacity
              style={[styles.addPhotoBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={handlePickPhoto}
              disabled={uploadingPhoto}
            >
              {uploadingPhoto
                ? <ActivityIndicator color={theme.primary} />
                : <Ionicons name="add" size={32} color={theme.primary} />
              }
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Basic Info */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>About You</Text>

        <View style={[styles.inputWrapper, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Full Name</Text>
          <TextInput
            style={[styles.textInput, { color: theme.text }]}
            value={fullName}
            onChangeText={setFullName}
            placeholderTextColor={theme.textMuted}
            placeholder="Your name"
          />
        </View>

        <View style={[styles.inputWrapper, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Bio</Text>
          <TextInput
            style={[styles.textInput, styles.bioInput, { color: theme.text }]}
            value={bio}
            onChangeText={setBio}
            placeholderTextColor={theme.textMuted}
            placeholder="Tell people about yourself..."
            multiline
            maxLength={150}
          />
          <Text style={[styles.charCount, { color: theme.textMuted }]}>{bio.length}/150</Text>
        </View>

        <View style={[styles.inputWrapper, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.inputLabel, { color: theme.textMuted }]}>City</Text>
          <TextInput
            style={[styles.textInput, { color: theme.text }]}
            value={locationCity}
            onChangeText={setLocationCity}
            placeholderTextColor={theme.textMuted}
            placeholder="Your city"
          />
        </View>

        {/* Discovery Settings */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Discovery Settings</Text>

        <View style={[styles.inputWrapper, { backgroundColor: theme.card, borderColor: theme.border, paddingVertical: SPACING.md }]}>
          <Text style={[styles.inputLabel, { color: theme.textMuted, marginBottom: 12 }]}>Interested in</Text>
          <View style={styles.seekingRow}>
            {SEEKING_OPTIONS.map((opt) => {
              const selected = preferences.interestedIn === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.seekingOption,
                    { 
                      backgroundColor: selected ? theme.primary : 'transparent',
                      borderColor: selected ? theme.primary : theme.border
                    }
                  ]}
                  onPress={() => setPreferences(prev => ({ ...prev, interestedIn: opt.id }))}
                >
                  <Text style={styles.seekingEmoji}>{opt.emoji}</Text>
                  <Text style={[styles.seekingText, { color: selected ? '#FFF' : theme.text }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        
        <View style={[styles.sliderCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.sliderHeader}>
            <Text style={[styles.sliderLabel, { color: theme.text }]}>Max Distance</Text>
            <Text style={[styles.sliderValue, { color: theme.primary }]}>{preferences.distance} km</Text>
          </View>
          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={1}
            maximumValue={100}
            step={1}
            value={preferences.distance}
            minimumTrackTintColor={theme.primary}
            maximumTrackTintColor={theme.border}
            thumbTintColor={theme.primary}
            onValueChange={(v) => setPreferences(prev => ({ ...prev, distance: v }))}
          />
        </View>

        <View style={[styles.sliderCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.sliderHeader}>
            <Text style={[styles.sliderLabel, { color: theme.text }]}>Age Range</Text>
            <Text style={[styles.sliderValue, { color: theme.primary }]}>{preferences.minAge} - {preferences.maxAge}</Text>
          </View>
          
          <Text style={[styles.sliderHint, { color: theme.textMuted }]}>Min Age: {preferences.minAge}</Text>
          <Slider
            style={{ width: '100%', height: 40, marginBottom: 12 }}
            minimumValue={18}
            maximumValue={Math.max(18, preferences.maxAge)}
            step={1}
            value={preferences.minAge}
            minimumTrackTintColor={theme.primary}
            maximumTrackTintColor={theme.border}
            thumbTintColor={theme.primary}
            onValueChange={(v) => setPreferences(prev => ({ ...prev, minAge: v }))}
          />

          <Text style={[styles.sliderHint, { color: theme.textMuted }]}>Max Age: {preferences.maxAge}</Text>
          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={Math.max(18, preferences.minAge)}
            maximumValue={100}
            step={1}
            value={preferences.maxAge}
            minimumTrackTintColor={theme.primary}
            maximumTrackTintColor={theme.border}
            thumbTintColor={theme.primary}
            onValueChange={(v) => setPreferences(prev => ({ ...prev, maxAge: v }))}
          />
        </View>

        {/* Interests */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Interests</Text>
        <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>{interests.length}/10 selected</Text>
        <View style={styles.interestsGrid}>
          {INTERESTS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.interestTag,
                { backgroundColor: theme.card, borderColor: theme.border },
                interests.includes(item.id) && { backgroundColor: theme.primary, borderColor: theme.primary }
              ]}
              onPress={() => toggleInterest(item.id)}
            >
              <Text style={[
                styles.interestText,
                { color: theme.textMuted },
                interests.includes(item.id) && { color: '#FFFFFF' }
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  headerBtn: {
    width: 60,
    height: 44,
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 18,
  },
  saveText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 16,
    textAlign: 'right',
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  sectionTitle: {
    fontFamily: FONTS.display,
    fontSize: 22,
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  sectionSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 13,
    marginTop: -SPACING.sm,
    marginBottom: SPACING.md,
  },
  photosRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  photoItem: {
    width: 110,
    height: 145,
    marginRight: SPACING.md,
    position: 'relative',
    backgroundColor: '#1A1A24',
    borderRadius: BORDER_RADIUS.md,
  },
  imageClip: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  photo: {
    ...StyleSheet.absoluteFillObject,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 11,
    zIndex: 10,
  },
  mainBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  mainBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    color: '#FFFFFF',
  },
  addPhotoBtn: {
    width: 110,
    height: 145,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    fontFamily: FONTS.body,
    fontSize: 16,
    paddingVertical: 4,
  },
  bioInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontFamily: FONTS.body,
    fontSize: 11,
    textAlign: 'right',
    marginTop: 4,
  },
  sliderCard: {
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 16,
  },
  sliderValue: {
    fontFamily: FONTS.display,
    fontSize: 18,
  },
  sliderHint: {
    fontFamily: FONTS.body,
    fontSize: 12,
    marginBottom: 2,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: SPACING.xl,
  },
  interestTag: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  interestText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
  },
  seekingRow: {
    flexDirection: 'row',
    gap: 8,
  },
  seekingOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    gap: 6,
  },
  seekingEmoji: {
    fontSize: 16,
  },
  seekingText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
  },
});
