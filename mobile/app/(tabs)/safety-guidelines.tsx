import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, SPACING, COLORS, BORDER_RADIUS } from '../../constants/theme';
import { useAppTheme } from '../../hooks/use-theme-color';

export default function SafetyGuidelinesScreen() {
  const router = useRouter();
  const theme = useAppTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Safety Guidelines</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.alertBox, { backgroundColor: 'rgba(255, 77, 77, 0.08)', borderColor: 'rgba(255, 77, 77, 0.2)' }]}>
          <Ionicons name="shield-outline" size={24} color={COLORS.error} />
          <Text style={[styles.alertText, { color: theme.text }]}>
            Your safety is our top priority. Please review these essential guidelines to keep your experience secure.
          </Text>
        </View>

        <Text style={[styles.heading, { color: theme.text }]}>1. Keep Your Personal Information Safe</Text>
        <Text style={[styles.paragraph, { color: theme.text }]}>
          Never share sensitive information early in your chats. This includes your home address, work address, email address, phone number, or social media handles. Keep conversations on Chana until you are completely sure of the person.
        </Text>

        <Text style={[styles.heading, { color: theme.text }]}>2. Financial Safety: Never Send Money</Text>
        <Text style={[styles.paragraph, { color: theme.text }]}>
          Never send money or share financial details (like bank details, online logins, or credit cards) with anyone you meet on the app, regardless of the emergency or story they tell. Report anyone who asks you for money immediately.
        </Text>

        <Text style={[styles.heading, { color: theme.text }]}>3. Guidelines for Meeting In Person</Text>
        <Text style={[styles.paragraph, { color: theme.text }]}>
          When you decide to meet your match in person:
        </Text>
        <View style={styles.bulletList}>
          <View style={styles.bulletRow}>
            <Ionicons name="checkmark-circle-outline" size={18} color={theme.primary} />
            <Text style={[styles.bulletText, { color: theme.text }]}>Always meet in a crowded, public place (e.g. coffee shop, restaurant).</Text>
          </View>
          <View style={styles.bulletRow}>
            <Ionicons name="checkmark-circle-outline" size={18} color={theme.primary} />
            <Text style={[styles.bulletText, { color: theme.text }]}>Tell a trusted friend or family member where you are going and who you are meeting.</Text>
          </View>
          <View style={styles.bulletRow}>
            <Ionicons name="checkmark-circle-outline" size={18} color={theme.primary} />
            <Text style={[styles.bulletText, { color: theme.text }]}>Arrange your own transportation to and from the venue. Do not let them pick you up.</Text>
          </View>
          <View style={styles.bulletRow}>
            <Ionicons name="checkmark-circle-outline" size={18} color={theme.primary} />
            <Text style={[styles.bulletText, { color: theme.text }]}>Keep your drink, phone, and personal items in sight at all times.</Text>
          </View>
        </View>

        <Text style={[styles.heading, { color: theme.text }]}>4. Block and Report Suspicious Profiles</Text>
        <Text style={[styles.paragraph, { color: theme.text }]}>
          If a user behaves rudely, uses inappropriate language, makes you feel uncomfortable, or appears to be a fake/bot account, please block and report them immediately using the report option inside their profile.
        </Text>

        <Text style={[styles.heading, { color: theme.text }]}>5. Trust Your Instincts</Text>
        <Text style={[styles.paragraph, { color: theme.text }]}>
          If something feels off or too good to be true, trust your gut. You are in complete control of your social journey. Stay safe and enjoy swiping!
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
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  alertText: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 20,
  },
  heading: { fontFamily: FONTS.bodyBold, fontSize: 18, marginTop: SPACING.md, marginBottom: SPACING.sm },
  paragraph: { fontFamily: FONTS.body, fontSize: 15, lineHeight: 24, marginBottom: SPACING.md },
  bulletList: {
    gap: 10,
    marginBottom: SPACING.lg,
    paddingLeft: SPACING.xs,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletText: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 15,
    lineHeight: 22,
  },
});
