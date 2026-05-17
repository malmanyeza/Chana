import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { useAppTheme } from '../hooks/use-theme-color';

import { useAuthStore } from '../stores/authStore';

const { width } = Dimensions.get('window');

const DUMMY_MALE_DATA = [
  {
    name: 'Marcus Thorne',
    email: 'marcus.thorne@example.com',
    password: 'Password123!',
    gender: 'man',
    birthDate: '1993-07-12',
    city: 'Bulawayo',
    country: '🇬🇧',
    latitude: -17.7989,
    longitude: 31.0678,
    bio: "Architect by day, amateur chef by night. Looking for someone who can appreciate a good building and an even better steak.",
    interests: ['architecture', 'cooking', 'wine'],
    photos: ['https://randomuser.me/api/portraits/men/32.jpg', 'https://images.unsplash.com/photo-1488161628813-04466f872be2', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce']
  },
  {
    name: 'Kenji Sato',
    email: 'kenji.sato@example.com',
    password: 'Password123!',
    gender: 'man',
    birthDate: '1996-12-01',
    city: 'Mutare',
    country: '🇯🇵',
    latitude: -17.7890,
    longitude: 31.0789,
    bio: "Tech enthusiast and urban explorer. I spend too much time thinking about the future and not enough about what's for dinner.",
    interests: ['tech', 'gaming', 'photography'],
    photos: ['https://randomuser.me/api/portraits/men/44.jpg', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e']
  },
  {
    name: 'Julian Rossi',
    email: 'julian.rossi@example.com',
    password: 'Password123!',
    gender: 'man',
    birthDate: '1991-05-20',
    city: 'Gweru',
    country: '🇮🇹',
    latitude: -17.7781,
    longitude: 31.0890,
    bio: "Fashion is temporary, style is forever. Let's talk about art, history, and why pizza is the perfect food.",
    interests: ['fashion', 'art', 'history'],
    photos: ['https://randomuser.me/api/portraits/men/52.jpg', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e']
  },
  {
    name: 'Samir Gupta',
    email: 'samir.gupta@example.com',
    password: 'Password123!',
    gender: 'man',
    birthDate: '1994-09-15',
    city: 'Gweru',
    country: '🇮🇳',
    latitude: -17.7672,
    longitude: 31.0901,
    bio: "Data scientist who loves solving complex problems. I'm looking for someone who can challenge my logic and make me smile.",
    interests: ['data', 'chess', 'fitness'],
    photos: ['https://randomuser.me/api/portraits/men/22.jpg', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6', 'https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4']
  },
  {
    name: 'Oliver Bennett',
    email: 'oliver.bennett@example.com',
    password: 'Password123!',
    gender: 'man',
    birthDate: '1997-04-04',
    city: 'Harare',
    country: '🇿🇦',
    latitude: -17.7563,
    longitude: 31.1012,
    bio: "Ocean lover and surf enthusiast. Life is better in boardshorts. Looking for my partner in adventure.",
    interests: ['surfing', 'travel', 'nature'],
    photos: ['https://randomuser.me/api/portraits/men/15.jpg', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d', 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79']
  }
];

const DUMMY_FEMALE_DATA = [
  {
    name: 'Elena Rodriguez',
    email: 'elena.rodriguez@example.com',
    password: 'Password123!',
    gender: 'woman',
    birthDate: '1995-11-22',
    city: 'Harare',
    country: '🇪🇸',
    latitude: -17.8012,
    longitude: 31.0250,
    bio: "Graphic designer and yoga teacher. I believe in balance, creativity, and good coffee.",
    interests: ['design', 'yoga', 'coffee'],
    photos: ['https://randomuser.me/api/portraits/women/45.jpg', 'https://images.unsplash.com/photo-1531746020798-e795a5399cc8', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1']
  },
  {
    name: 'Sophie Müller',
    email: 'sophie.muller@example.com',
    password: 'Password123!',
    gender: 'woman',
    birthDate: '1992-08-30',
    city: 'Harare',
    country: '🇩🇪',
    latitude: -17.8123,
    longitude: 31.0456,
    bio: "Passionate about sustainability and vegan cooking. Looking for someone who cares about the planet as much as I do.",
    interests: ['sustainability', 'cooking', 'music'],
    photos: ['https://randomuser.me/api/portraits/women/33.jpg', 'https://images.unsplash.com/photo-1517841905240-472988babdf9', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330']
  },
  {
    name: 'Li Wei',
    email: 'li.wei@example.com',
    password: 'Password123!',
    gender: 'woman',
    birthDate: '1996-03-14',
    city: 'Harare',
    country: '🇨🇳',
    latitude: -17.8345,
    longitude: 31.0567,
    bio: "Piano teacher with a love for classical music and modern art. I find beauty in small things.",
    interests: ['piano', 'art', 'reading'],
    photos: ['https://randomuser.me/api/portraits/women/12.jpg', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80']
  },
  {
    name: 'Zahra Mansour',
    email: 'zahra.mansour@example.com',
    password: 'Password123!',
    gender: 'woman',
    birthDate: '1994-01-05',
    city: 'Chitungwiza',
    country: '🇦🇪',
    latitude: -17.8456,
    longitude: 31.0123,
    bio: "Entrepreneur and world traveler. I value ambition, honesty, and a good sense of humor.",
    interests: ['business', 'travel', 'dancing'],
    photos: ['https://randomuser.me/api/portraits/women/82.jpg', 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb']
  },
  {
    name: 'Clara Dubois',
    email: 'clara.dubois@example.com',
    password: 'Password123!',
    gender: 'woman',
    birthDate: '1998-09-09',
    city: 'Bulawayo',
    country: '🇫🇷',
    latitude: -17.8567,
    longitude: 31.0345,
    bio: "Journalist with a passion for storytelling. I'm always looking for the next great story.",
    interests: ['writing', 'film', 'photography'],
    photos: ['https://randomuser.me/api/portraits/women/90.jpg', 'https://images.unsplash.com/photo-1516756587022-7891ad56a8cd', 'https://images.unsplash.com/photo-1507152832244-10d45a7e3d93']
  }
];

const ALL_DUMMY_DATA = [...DUMMY_MALE_DATA, ...DUMMY_FEMALE_DATA];

export default function SeederScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const { setIsSeeding } = useAuthStore();

  const seedData = async () => {
    setLoading(true);
    setIsSeeding(true);
    setProgress('Starting seeder...');
    
    try {
      for (const userData of ALL_DUMMY_DATA) {
        setProgress(`Creating ${userData.name}...`);
        
        // 1. Create Auth User or Sign In if already exists
        let authData;
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: userData.email,
          password: userData.password,
          options: {
            data: { full_name: userData.name }
          }
        });

        if (signUpError) {
          if (signUpError.message.includes('already registered')) {
            // If already exists, just sign in to update the profile
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email: userData.email,
              password: userData.password,
            });
            if (signInError) {
              console.error(`SignIn Error for ${userData.name}:`, signInError.message);
              continue;
            }
            authData = signInData;
          } else {
            console.error(`Auth Error for ${userData.name}:`, signUpError.message);
            continue;
          }
        } else {
          authData = signUpData;
        }

        const userId = authData.user?.id;
        if (!userId) continue;

        // 2. Update/Upsert Profile with ALL location details!
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            full_name: userData.name,
            birth_date: userData.birthDate,
            gender: userData.gender,
            bio: userData.bio,
            location_city: userData.city,
            country: userData.country,
            latitude: userData.latitude,
            longitude: userData.longitude,
            interests: userData.interests,
            photos: userData.photos,
            avatar_url: userData.photos[0],
            is_onboarded: true,
            preferences: {
              interestedIn: userData.gender === 'man' ? 'women' : 'men',
              minAge: 18,
              maxAge: 45,
              distance: 50
            },
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });

        if (profileError) {
          console.error(`Profile Error for ${userData.name}:`, profileError.message);
          setProgress(`Error updating ${userData.name}: ${profileError.message}`);
          await new Promise(r => setTimeout(r, 1000));
        } else {
          console.log(`Successfully created and updated profile for ${userData.name}`);
        }
      }

      setProgress('Seeding complete! Cleaning up session...');
      await supabase.auth.signOut();
      
      setProgress('Done! Please log in as your main account or one of the test accounts.');
      Alert.alert('Success', '10 fully detailed dummy accounts created. You have been signed out so you can log into any account.');
    } catch (err: any) {
      console.error('Seeder failed:', err);
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
      setIsSeeding(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(auth)/welcome')}>
          <Ionicons name="close" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Data Seeder</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.infoBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Ionicons name="information-circle" size={24} color={theme.primary} />
          <Text style={[styles.infoText, { color: theme.text }]}>
            This tool will create 10 fake accounts with complete city names, coordinates, and flag emojis around Harare/Zimbabwe.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.seedButton, loading && styles.disabledButton]}
          onPress={seedData}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="flash" size={20} color="#FFF" />
              <Text style={styles.seedButtonText}>Run Seeder</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={[styles.progressText, { color: theme.textMuted }]}>{progress}</Text>

        <View style={styles.table}>
          <Text style={[styles.tableHeader, { color: theme.text }]}>Accounts Preview & Login Info</Text>
          <Text style={[styles.loginTip, { color: theme.textMuted }]}>
            All accounts use password: <Text style={{ color: theme.primary, fontFamily: FONTS.bodyBold }}>Password123!</Text>
          </Text>
          
          {ALL_DUMMY_DATA.map((u, i) => (
            <View key={i} style={[styles.accountCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.accountHeader}>
                <View>
                  <Text style={[styles.rowName, { color: theme.text }]}>{u.name} {u.country}</Text>
                  <Text style={[styles.rowEmail, { color: theme.primary }]}>{u.email}</Text>
                </View>
                <View style={[styles.genderBadge, { backgroundColor: u.gender === 'man' ? '#E3F2FD' : '#FCE4EC' }]}>
                  <Text style={[styles.genderText, { color: u.gender === 'man' ? '#1976D2' : '#C2185B' }]}>
                    {u.gender.toUpperCase()}
                  </Text>
                </View>
              </View>
              
              <Text style={[styles.rowCity, { color: theme.textMuted }]}>📍 {u.city} ({u.latitude}, {u.longitude})</Text>
              <Text style={[styles.rowBio, { color: theme.text }]}>"{u.bio}"</Text>
              
              <View style={styles.interestsRow}>
                {u.interests.map((interest, idx) => (
                  <View key={idx} style={[styles.interestBadge, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <Text style={[styles.interestText, { color: theme.textMuted }]}>#{interest}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: SPACING.lg },
  title: { fontFamily: FONTS.display, fontSize: 24 },
  content: { padding: SPACING.lg },
  infoBox: { padding: SPACING.md, borderRadius: BORDER_RADIUS.md, borderWidth: 1, flexDirection: 'row', gap: 12, marginBottom: SPACING.xl },
  infoText: { flex: 1, fontFamily: FONTS.body, fontSize: 14, lineHeight: 20 },
  seedButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: BORDER_RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...SHADOWS.medium,
  },
  disabledButton: { opacity: 0.6 },
  seedButtonText: { color: '#FFF', fontFamily: FONTS.bodyBold, fontSize: 16 },
  progressText: { textAlign: 'center', marginTop: SPACING.md, fontFamily: FONTS.body, fontSize: 14 },
  table: { marginTop: SPACING.xl },
  tableHeader: { fontFamily: FONTS.display, fontSize: 20, marginBottom: 8 },
  loginTip: { fontFamily: FONTS.body, fontSize: 14, marginBottom: SPACING.lg },
  accountCard: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
    ...SHADOWS.soft,
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  rowName: { fontFamily: FONTS.bodyBold, fontSize: 16 },
  rowEmail: { fontFamily: FONTS.body, fontSize: 13, marginTop: 2 },
  genderBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  genderText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
  },
  rowCity: {
    fontFamily: FONTS.body,
    fontSize: 12,
    marginTop: 4,
  },
  rowBio: {
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
    marginVertical: 8,
  },
  interestsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  interestBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
  },
  interestText: {
    fontFamily: FONTS.body,
    fontSize: 11,
  },
});
