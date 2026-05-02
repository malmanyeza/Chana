import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  Image, 
  ScrollView,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';

import { useAppTheme } from '../../hooks/use-theme-color';

const { width } = Dimensions.get('window');

import { useAuthStore } from '../../stores/authStore';

const ProfileScreen = () => {
  const theme = useAppTheme();
  const { profile, signOut } = useAuthStore();

  if (!profile) return null;

  const age = profile.birth_date 
    ? new Date().getFullYear() - new Date(profile.birth_date).getFullYear() 
    : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>My Profile</Text>
          <TouchableOpacity style={[styles.editButton, { backgroundColor: theme.card }]}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: profile.photos?.[0] || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=500' }} 
              style={styles.profileImage} 
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.6)']}
              style={styles.imageGradient}
            />
          </View>
          
          <View style={styles.infoContainer}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: theme.text }]}>{profile.full_name}, {age}</Text>
              <Ionicons name="checkmark-circle" size={20} color={theme.success} />
            </View>
            <Text style={[styles.location, { color: theme.textMuted }]}>📍 {profile.location_city || 'Earth'} · Designer</Text>
            
            <Text style={[styles.bio, { color: theme.text }]}>
              "{profile.bio || 'No bio yet'}"
            </Text>

            <View style={styles.interestsRow}>
              {profile.interests?.map((interest: string, idx: number) => (
                <View key={idx} style={[styles.interestTag, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Text style={[styles.interestText, { color: theme.text }]}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={[styles.completionContainer, { backgroundColor: theme.card }]}>
          <View style={styles.completionHeader}>
            <Text style={[styles.completionText, { color: theme.text }]}>Profile completion: 100%</Text>
            <Text style={styles.completionTip}>All set!</Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
            <View style={[styles.progressFill, { width: '100%' }]} />
          </View>
        </View>

        <View style={styles.menu}>
          <MenuItem icon="settings-outline" label="Settings" theme={theme} />
          <MenuItem icon="notifications-outline" label="Notifications" theme={theme} />
          <MenuItem icon="diamond-outline" label="Upgrade to Premium" isPremium theme={theme} />
          <MenuItem icon="shield-checkmark-outline" label="Privacy & Safety" theme={theme} />
          <MenuItem 
            icon="log-out-outline" 
            label="Log Out" 
            isDestructive 
            theme={theme} 
            onPress={signOut}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const MenuItem = ({ icon, label, isDestructive, isPremium, theme, onPress }: any) => (
  <TouchableOpacity 
    style={[styles.menuItem, { borderBottomColor: theme.border }]}
    onPress={onPress}
  >
    <View style={styles.menuItemLeft}>
      <View style={[styles.menuIconContainer, { backgroundColor: theme.card }, isPremium && styles.premiumIconContainer]}>
        <Ionicons name={icon} size={20} color={isPremium ? theme.secondary : (isDestructive ? '#FF4D4D' : theme.text)} />
      </View>
      <Text style={[styles.menuLabel, { color: theme.text }, isDestructive && styles.destructiveLabel]}>{label}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: 28,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.md,
  },
  editButtonText: {
    fontFamily: FONTS.bodyBold,
    color: COLORS.primary,
    fontSize: 14,
  },
  profileSection: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  imageContainer: {
    width: '100%',
    height: width - SPACING.lg * 2,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  infoContainer: {
    marginTop: SPACING.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontFamily: FONTS.display,
    fontSize: 28,
  },
  location: {
    fontFamily: FONTS.body,
    fontSize: 16,
    marginTop: 4,
  },
  bio: {
    fontFamily: FONTS.body,
    fontSize: 15,
    marginTop: SPACING.md,
    lineHeight: 22,
    opacity: 0.8,
  },
  interestsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: SPACING.md,
  },
  interestTag: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  interestText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
  },
  completionContainer: {
    margin: SPACING.lg,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  completionText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
  },
  completionTip: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.primary,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  menu: {
    paddingHorizontal: SPACING.lg,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumIconContainer: {
    backgroundColor: 'rgba(255, 154, 60, 0.1)',
  },
  menuLabel: {
    fontFamily: FONTS.body,
    fontSize: 16,
  },
  destructiveLabel: {
    color: '#FF4D4D',
  }
});

export default ProfileScreen;
