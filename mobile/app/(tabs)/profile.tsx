import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { useAppTheme } from '../../hooks/use-theme-color';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { AuthLoadingScreen } from '../../components/ui/AuthLoadingScreen';
import * as NotificationService from '../../services/notificationService';
import { PremiumModal } from '../../components/overlays/PremiumModal';

import { isPremiumActive } from '../../lib/premium';

const ProfileScreen = () => {
  const { user, profile, signOut, fetchProfile } = useAuthStore();
  const theme = useAppTheme();
  const router = useRouter();
  const [imgError, setImgError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [matchesCount, setMatchesCount] = useState(0);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const isPremium = isPremiumActive(profile);

  const fetchStats = async () => {
    if (!user) return;
    try {
      // Fetch Likes Count
      const { count: lCount } = await supabase
        .from('swipes')
        .select('*', { count: 'exact', head: true })
        .eq('swiped_id', user.id)
        .in('type', ['like', 'superlike']);
      
      setLikesCount(lCount || 0);

      // Fetch Matches Count
      const { count: mCount } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      setMatchesCount(mCount || 0);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const onRefresh = async () => {
    if (!user) return;
    setRefreshing(true);
    try {
      await Promise.all([
        fetchProfile(user.id),
        fetchStats()
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      onRefresh();
    }, [user])
  );

  useEffect(() => {
    setImgError(false);
  }, [profile?.avatar_url, profile?.photos]);

  if (!profile) return <AuthLoadingScreen />;

  const age = profile.birth_date
    ? new Date().getFullYear() - new Date(profile.birth_date).getFullYear()
    : null;

  const userInitial = profile.full_name?.charAt(0).toUpperCase() || '?';
  
  // Find valid photos
  const validPhotos = Array.isArray(profile.photos) 
    ? profile.photos.filter(p => p && typeof p === 'string' && p.trim().length > 0)
    : [];

  const photoUrl = (profile.avatar_url && profile.avatar_url.trim().length > 0) 
    ? profile.avatar_url 
    : (validPhotos[0] || null);
    
  const hasPhoto = photoUrl && !imgError;

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive', 
          onPress: () => {
            console.log('🚀 Sign out initiated');
            signOut();
          } 
        },
      ]
    );
  };

  const MENU_ITEMS = [
    { icon: 'settings-outline', label: 'Settings', onPress: () => router.push('/(tabs)/settings') },
    { 
      icon: 'diamond-outline', 
      label: isPremium ? 'Premium Member' : 'Upgrade to Premium', 
      isPremium: true, 
      onPress: () => !isPremium && setShowPremiumModal(true) 
    },
    { icon: 'log-out-outline', label: 'Log Out', isDestructive: true, onPress: handleSignOut },
  ] as const;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        
        {/* Profile Header Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatarRing, { borderColor: theme.border }]}>
              {hasPhoto ? (
                <Image 
                  key={photoUrl}
                  source={{ uri: photoUrl }} 
                  style={styles.avatar}
                  contentFit="cover"
                  transition={300}
                  onError={() => setImgError(true)}
                />
              ) : (
                <LinearGradient
                  colors={COLORS.gradients.warm as [string, string]}
                  style={[styles.avatar, styles.initialsContainer]}
                >
                  <Text style={styles.initialsText}>{userInitial}</Text>
                </LinearGradient>
              )}
            </View>
            <View style={[styles.verifiedBadge, { backgroundColor: theme.background }]}>
              <Ionicons name="checkmark-circle" size={24} color={theme.success} />
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={[styles.name, { color: theme.text }]}>
              {profile.full_name}{age ? `, ${age}` : ''} {profile.country || ''}
            </Text>
            {isPremium && (
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}
              >
                <Text style={{ color: '#FFF', fontSize: 10, fontFamily: FONTS.bodyBold }}>GOLD</Text>
              </LinearGradient>
            )}
          </View>
          
          {profile.location_city && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={theme.textMuted} />
              <Text style={[styles.location, { color: theme.textMuted }]}>{profile.location_city}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.editBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push('/(tabs)/edit-profile')}
          >
            <Ionicons name="pencil" size={16} color={theme.primary} />
            <Text style={[styles.editBtnText, { color: theme.text }]}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* My Photos Gallery */}
        {validPhotos.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>MY PHOTOS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryScroll}>
              {validPhotos.map((uri) => (
                <View key={uri} style={[styles.galleryItem, { borderColor: theme.border }]}>
                  <Image 
                    source={{ uri }} 
                    style={styles.galleryImage} 
                    contentFit="contain"
                    transition={200}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Bio Section */}
        {profile.bio && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>ABOUT ME</Text>
            <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.bioText, { color: theme.text }]}>{profile.bio}</Text>
            </View>
          </View>
        )}

        {/* Interests Section */}
        {profile.interests && profile.interests.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>INTERESTS</Text>
            <View style={styles.interestsRow}>
              {profile.interests.map((interest, idx) => (
                <View key={idx} style={[styles.interestBadge, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Text style={[styles.interestText, { color: theme.text }]}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Stats Section */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.statNumber, { color: theme.primary }]}>{likesCount}</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Likes</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.statNumber, { color: theme.accent }]}>{matchesCount}</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Matches</Text>
          </View>
        </View>

        {/* Menu Section */}
        <View style={styles.menuSection}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>ACCOUNT</Text>
          <View style={[styles.menuCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {MENU_ITEMS.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.menuItem,
                  { borderBottomColor: theme.border },
                  idx === MENU_ITEMS.length - 1 && styles.menuItemLast,
                ]}
                onPress={item.onPress}
                activeOpacity={0.6}
              >
                <View style={[
                  styles.menuIcon,
                  { backgroundColor: item.isPremium ? 'rgba(255,154,60,0.12)' : item.isDestructive ? 'rgba(255,77,77,0.1)' : theme.background }
                ]}>
                  <Ionicons
                    name={item.icon as any}
                    size={20}
                    color={item.isPremium ? COLORS.secondary : item.isDestructive ? COLORS.error : theme.text}
                  />
                </View>
                <Text style={[
                  styles.menuLabel,
                  { color: item.isDestructive ? COLORS.error : theme.text }
                ]}>
                  {item.label}
                </Text>
                {!item.isDestructive && (
                  <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
                )}
                {item.isPremium && (
                  <View style={styles.premiumBadge}>
                    <Text style={styles.premiumText}>PRO</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={[styles.version, { color: theme.border }]}>Chana v1.0.0</Text>
      </ScrollView>

      <PremiumModal
        visible={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        feature="filters"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.sm },
  headerTitle: { fontFamily: FONTS.display, fontSize: 32 },
  refreshBtn: { padding: 4 },
  scroll: { paddingBottom: 100 },
  profileCard: { alignItems: 'center', marginBottom: SPACING.xl },
  avatarContainer: { position: 'relative', marginBottom: SPACING.md },
  avatarRing: { padding: 4, borderRadius: 100, borderWidth: 2 },
  avatar: { width: 130, height: 130, borderRadius: 65, backgroundColor: '#1A1A24' },
  initialsContainer: { justifyContent: 'center', alignItems: 'center' },
  initialsText: { fontFamily: FONTS.display, fontSize: 52, color: '#FFFFFF' },
  verifiedBadge: { position: 'absolute', bottom: 4, right: 4, borderRadius: 12, padding: 2 },
  name: { fontFamily: FONTS.display, fontSize: 26, marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: SPACING.md },
  location: { fontFamily: FONTS.body, fontSize: 15 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: BORDER_RADIUS.full, borderWidth: 1 },
  editBtnText: { fontFamily: FONTS.bodyBold, fontSize: 14 },
  section: { marginBottom: SPACING.xl },
  sectionTitle: { fontFamily: FONTS.bodyBold, fontSize: 12, letterSpacing: 1.5, paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm },
  galleryScroll: { paddingHorizontal: SPACING.lg, gap: 12 },
  galleryItem: { width: 100, height: 130, borderRadius: BORDER_RADIUS.md, borderWidth: 1, overflow: 'hidden', backgroundColor: '#1A1A24' },
  galleryImage: { width: '100%', height: '100%' },
  infoCard: { marginHorizontal: SPACING.lg, padding: SPACING.md, borderRadius: BORDER_RADIUS.md, borderWidth: 1 },
  bioText: { fontFamily: FONTS.body, fontSize: 15, lineHeight: 22 },
  interestsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: SPACING.lg },
  interestBadge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: BORDER_RADIUS.full, borderWidth: 1 },
  interestText: { fontFamily: FONTS.body, fontSize: 14 },
  statsRow: { flexDirection: 'row', paddingHorizontal: SPACING.lg, gap: SPACING.md, marginBottom: SPACING.xl },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.lg, borderWidth: 1 },
  statNumber: { fontFamily: FONTS.display, fontSize: 24 },
  statLabel: { fontFamily: FONTS.bodyBold, fontSize: 12, textTransform: 'uppercase' },
  menuSection: { marginBottom: SPACING.xl },
  menuCard: { marginHorizontal: SPACING.lg, borderRadius: BORDER_RADIUS.lg, borderWidth: 1, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, borderBottomWidth: 1 },
  menuItemLast: { borderBottomWidth: 0 },
  menuIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  menuLabel: { fontFamily: FONTS.body, fontSize: 16, flex: 1 },
  premiumBadge: { backgroundColor: COLORS.secondary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  premiumText: { fontFamily: FONTS.bodyBold, fontSize: 10, color: '#FFF' },
  version: { fontFamily: FONTS.body, fontSize: 12, textAlign: 'center', marginTop: SPACING.xl },
});

export default ProfileScreen;
