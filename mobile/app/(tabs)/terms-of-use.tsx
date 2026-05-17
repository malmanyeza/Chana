import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, SPACING } from '../../constants/theme';
import { useAppTheme } from '../../hooks/use-theme-color';

export default function TermsOfUseScreen() {
  const router = useRouter();
  const theme = useAppTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Terms of Use</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.lastUpdated, { color: theme.textMuted }]}>Last updated: May 17, 2026</Text>
        
        <Text style={[styles.heading, { color: theme.text }]}>1. Acceptance of Terms</Text>
        <Text style={[styles.paragraph, { color: theme.text }]}>
          By accessing or using Chana, you agree to be bound by these Terms of Use and all applicable laws and regulations. If you do not agree with any part of these terms, you may not use our service.
        </Text>

        <Text style={[styles.heading, { color: theme.text }]}>2. Eligibility</Text>
        <Text style={[styles.paragraph, { color: theme.text }]}>
          You must be at least 18 years of age to create an account on Chana and use the Service. By creating an account, you represent and warrant that you can form a binding contract.
        </Text>

        <Text style={[styles.heading, { color: theme.text }]}>3. User Conduct</Text>
        <Text style={[styles.paragraph, { color: theme.text }]}>
          You agree to treat other users with respect and comply with our Safety Guidelines. You will not post any content that is abusive, threatening, sexually explicit, or otherwise violates our policies.
        </Text>

        <Text style={[styles.heading, { color: theme.text }]}>4. Termination</Text>
        <Text style={[styles.paragraph, { color: theme.text }]}>
          We reserve the right to suspend or terminate your account at any time for violations of these Terms of Use, without notice or liability.
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
