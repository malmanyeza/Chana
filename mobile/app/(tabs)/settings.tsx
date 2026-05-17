import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { useAppTheme } from '../../hooks/use-theme-color';
import { useAuthStore } from '../../stores/authStore';

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { profile, user } = useAuthStore();
  
  // Example toggle states (in a real app, these would be saved to DB/Storage)
  const [pushEnabled, setPushEnabled] = React.useState(true);
  const [emailEnabled, setEmailEnabled] = React.useState(false);
  const [incognito, setIncognito] = React.useState(false);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/profile')} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>ACCOUNT</Text>
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: theme.text }]}>Email</Text>
              <Text style={[styles.rowValue, { color: theme.textMuted }]}>{user?.email || 'Not provided'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>NOTIFICATIONS</Text>
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.row, { borderBottomColor: theme.border, borderBottomWidth: 1 }]}>
              <Text style={[styles.rowLabel, { color: theme.text }]}>Push Notifications</Text>
              <Switch 
                value={pushEnabled} 
                onValueChange={setPushEnabled}
                trackColor={{ false: theme.border, true: theme.primary }}
              />
            </View>
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: theme.text }]}>Email Updates</Text>
              <Switch 
                value={emailEnabled} 
                onValueChange={setEmailEnabled}
                trackColor={{ false: theme.border, true: theme.primary }}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>PRIVACY & DISCOVERY</Text>
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.row}>
              <View style={styles.rowTextGroup}>
                <Text style={[styles.rowLabel, { color: theme.text }]}>Incognito Mode</Text>
                <Text style={[styles.rowSubLabel, { color: theme.textMuted }]}>Only show me to people I like</Text>
              </View>
              <Switch 
                value={incognito} 
                onValueChange={setIncognito}
                trackColor={{ false: theme.border, true: '#FFD700' }}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>SUPPORT & LEGAL</Text>
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <TouchableOpacity style={[styles.row, { borderBottomColor: theme.border, borderBottomWidth: 1 }]}>
              <Text style={[styles.rowLabel, { color: theme.text }]}>Help Center</Text>
              <Ionicons name="open-outline" size={18} color={theme.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.row, { borderBottomColor: theme.border, borderBottomWidth: 1 }]}
              onPress={() => router.push('/(tabs)/safety-guidelines')}
            >
              <Text style={[styles.rowLabel, { color: theme.text }]}>Safety Guidelines</Text>
              <Ionicons name="shield-checkmark-outline" size={18} color={theme.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.row, { borderBottomColor: theme.border, borderBottomWidth: 1 }]}
              onPress={() => router.push('/(tabs)/privacy-policy')}
            >
              <Text style={[styles.rowLabel, { color: theme.text }]}>Privacy Policy</Text>
              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.row}
              onPress={() => router.push('/(tabs)/terms-of-use')}
            >
              <Text style={[styles.rowLabel, { color: theme.text }]}>Terms of Use</Text>
              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.deleteButton}>
          <Text style={styles.deleteText}>Delete Account</Text>
        </TouchableOpacity>

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
  section: { marginBottom: SPACING.xl },
  sectionTitle: { 
    fontFamily: FONTS.bodyBold, 
    fontSize: 12, 
    letterSpacing: 1, 
    marginBottom: SPACING.sm, 
    paddingHorizontal: SPACING.sm 
  },
  card: { 
    borderRadius: BORDER_RADIUS.lg, 
    borderWidth: 1, 
    overflow: 'hidden' 
  },
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: SPACING.md, 
    paddingVertical: SPACING.md 
  },
  rowTextGroup: { flex: 1, paddingRight: SPACING.md },
  rowLabel: { fontFamily: FONTS.body, fontSize: 16 },
  rowValue: { fontFamily: FONTS.body, fontSize: 16 },
  rowSubLabel: { fontFamily: FONTS.body, fontSize: 12, marginTop: 4 },
  deleteButton: { 
    marginTop: SPACING.xl, 
    paddingVertical: SPACING.md, 
    alignItems: 'center' 
  },
  deleteText: { 
    fontFamily: FONTS.bodyBold, 
    fontSize: 16, 
    color: COLORS.error 
  }
});
