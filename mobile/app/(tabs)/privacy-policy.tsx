import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, SPACING } from '../../constants/theme';
import { useAppTheme } from '../../hooks/use-theme-color';

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const theme = useAppTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Privacy Policy</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.lastUpdated, { color: theme.textMuted }]}>Last updated: May 17, 2026</Text>
        
        <Text style={[styles.heading, { color: theme.text }]}>1. Information We Collect</Text>
        <Text style={[styles.paragraph, { color: theme.text }]}>
          When you create an account, we collect your email address, name, date of birth, gender, and photos. We may also collect your location data to provide our core matching services.
        </Text>

        <Text style={[styles.heading, { color: theme.text }]}>2. How We Use Your Information</Text>
        <Text style={[styles.paragraph, { color: theme.text }]}>
          Your information is used to set up your profile, display it to potential matches based on your preferences, and facilitate communication within the app. We do not sell your personal data to third parties.
        </Text>

        <Text style={[styles.heading, { color: theme.text }]}>3. Data Security</Text>
        <Text style={[styles.paragraph, { color: theme.text }]}>
          We implement industry-standard security measures to protect your personal information. However, no method of transmission over the internet or electronic storage is 100% secure.
        </Text>

        <Text style={[styles.heading, { color: theme.text }]}>4. Your Rights</Text>
        <Text style={[styles.paragraph, { color: theme.text }]}>
          You have the right to access, update, or delete your personal information at any time through the app settings. You can also withdraw your consent for location tracking in your device settings.
        </Text>
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
    paddingVertical: SPACING.md,
    borderBottomWidth: 1
  },
  backButton: { padding: 4 },
  placeholder: { width: 32 },
  headerTitle: { fontFamily: FONTS.display, fontSize: 20 },
  content: { padding: SPACING.lg, paddingBottom: 60 },
  lastUpdated: { fontFamily: FONTS.body, fontSize: 14, marginBottom: SPACING.lg },
  heading: { fontFamily: FONTS.bodyBold, fontSize: 18, marginTop: SPACING.md, marginBottom: SPACING.sm },
  paragraph: { fontFamily: FONTS.body, fontSize: 15, lineHeight: 24, marginBottom: SPACING.md },
});
