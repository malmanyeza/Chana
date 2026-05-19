import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, SPACING, SHADOWS, COLORS, BORDER_RADIUS } from '../../constants/theme';
import { useAppTheme } from '../../hooks/use-theme-color';
import { SwipeCard } from '../../components/cards/SwipeCard';
import { MatchModal } from '../../components/overlays/MatchModal';
import { FilterModal } from '../../components/overlays/FilterModal';
import { PremiumModal } from '../../components/overlays/PremiumModal';
import { SwipeLimitModal } from '../../components/overlays/SwipeLimitModal';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { useBadgeStore } from '../../stores/badgeStore';
import { Profile } from '../../types';
import Animated, { FadeIn } from 'react-native-reanimated';

import { isPremiumActive } from '../../lib/premium';

const { height } = Dimensions.get('window');

interface NewMatch {
  matchId: string;
  matchedProfile: Profile;
}

const DiscoverScreen = () => {
  const theme = useAppTheme();
  const { user, profile, setProfile, fetchProfile } = useAuthStore();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showSwipeLimitModal, setShowSwipeLimitModal] = useState(false);
  const [newMatch, setNewMatch] = useState<NewMatch | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    distance: profile?.preferences?.distance || 50,
    ageRange: [profile?.preferences?.minAge || 18, profile?.preferences?.maxAge || 40] as [number, number],
    interestedIn: (profile?.preferences?.interestedIn || 'everyone') as 'men' | 'women' | 'everyone',
  });

  // Sync filters with profile when it loads or updates
  useEffect(() => {
    if (profile?.preferences) {
      setFilters({
        distance: profile.preferences.distance || 50,
        ageRange: [profile.preferences.minAge || 18, profile.preferences.maxAge || 40],
        interestedIn: profile.preferences.interestedIn || 'everyone',
      });
    }
  }, [profile?.preferences?.interestedIn, profile?.preferences?.distance, profile?.preferences?.minAge, profile?.preferences?.maxAge]);

  const checkDailySwipeReset = async () => {
    if (!user || !profile) return;

    try {
      const lastReset = profile.last_swipe_reset ? new Date(profile.last_swipe_reset) : null;
      const now = new Date();
      const isPremium = isPremiumActive(profile);

      if (isPremium) return;

      // 1. Fetch current dynamic limit from system_settings
      let limit = 20;
      const { data: settingData, error: settingError } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'free_swipes_limit')
        .single();

      if (!settingError && settingData?.value) {
        limit = parseInt(settingData.value) || 20;
      }

      const twentyFourHours = 24 * 60 * 60 * 1000;
      const needsFullReset = !lastReset || (now.getTime() - lastReset.getTime() >= twentyFourHours);
      
      // If 24 hours have passed, or they have more swipes remaining than the current admin limit, enforce the cap!
      if (needsFullReset || (profile.swipes_remaining > limit)) {
        console.log(`🎯 Enforcing dynamic daily swipe limit: ${limit} swipes (Current remaining: ${profile.swipes_remaining}, Needs reset: ${needsFullReset})`);

        const newRemaining = limit;
        const newResetTime = needsFullReset ? now.toISOString() : (profile.last_swipe_reset || now.toISOString());

        const updatedProfile = {
          ...profile,
          swipes_remaining: newRemaining,
          last_swipe_reset: newResetTime,
        };

        setProfile(updatedProfile);

        // Update DB in background
        supabase
          .from('profiles')
          .update({
            swipes_remaining: newRemaining,
            last_swipe_reset: newResetTime
          })
          .eq('id', user.id)
          .then(({ error }) => {
            if (error) console.error('Error updating profiles daily reset DB:', error);
          });
      }
    } catch (err) {
      console.error('Error in daily swipes reset check:', err);
    }
  };

  const fetchProfiles = async () => {
    if (!user || !profile) return;
    setIsLoading(true);
    try {
      // 1. Get already swiped profile IDs
      const { data: swipedData } = await supabase
        .from('swipes')
        .select('swiped_id')
        .eq('swiper_id', user.id);

      const swipedIds = swipedData?.map(s => s.swiped_id) || [];
      const excludeIds = [user.id, ...swipedIds];

      let data: any[] | null = null;
      let error: any = null;

      // 2. Query profiles
      if (profile.latitude !== null && profile.longitude !== null) {
        console.log('📍 Fetching profiles sorted by proximity to user coordinates:', profile.latitude, profile.longitude);
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_discovery_profiles', {
          swiper_id: user.id,
          swiper_lat: profile.latitude,
          swiper_lng: profile.longitude,
          gender_filter: filters.interestedIn,
          min_age: filters.ageRange[0],
          max_age: filters.ageRange[1],
          max_dist_km: filters.distance
        });
        data = rpcData;
        error = rpcError;
      } else {
        console.log('⚠️ Fallback discovery: User location not available, sorting by random.');
        let query = supabase
          .from('profiles')
          .select('*')
          .eq('is_onboarded', true)
          .not('id', 'in', `(${excludeIds.join(',')})`)
          .limit(20);

        if (filters.interestedIn === 'men') {
          query = query.eq('gender', 'man');
        } else if (filters.interestedIn === 'women') {
          query = query.eq('gender', 'woman');
        }

        const today = new Date();
        const minBirthDate = new Date(today.getFullYear() - filters.ageRange[1] - 1, today.getMonth(), today.getDate());
        const maxBirthDate = new Date(today.getFullYear() - filters.ageRange[0], today.getMonth(), today.getDate());

        query = query
          .gte('birth_date', minBirthDate.toISOString().split('T')[0])
          .lte('birth_date', maxBirthDate.toISOString().split('T')[0]);

        const { data: selectData, error: selectError } = await query;
        data = selectData;
        error = selectError;
      }

      if (error) throw error;
      
      const profilesList = data as Profile[] || [];
      
      // If we used the proximity RPC, reverse the list so that the closest profile (first elements)
      // appears on TOP of the stack (last elements of the array rendered last).
      const finalizedProfiles = (profile.latitude !== null && profile.longitude !== null)
        ? [...profilesList].reverse()
        : [...profilesList].sort(() => Math.random() - 0.5);

      setProfiles(finalizedProfiles);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initDiscover = async () => {
      if (user?.id) {
        await fetchProfile(user.id);
      }
      await checkDailySwipeReset();
      fetchProfiles();
    };
    initDiscover();

    if (!user) return;

    // REALTIME: Listen for new users joining
    // Use a unique channel name to avoid collisions during re-renders
    const channelId = `discovery-${user.id}-${Math.random().toString(36).substring(7)}`;
    const channel = supabase.channel(channelId);
    
    channel
      .on('postgres_changes', {
        event: '*', 
        schema: 'public',
        table: 'profiles'
      }, (payload) => {
        const newProfile = payload.new as Profile;
        if (!newProfile || !newProfile.is_onboarded || newProfile.id === user.id) return;

        // Gender Filter Check
        let matchesGender = true;
        if (filters.interestedIn === 'men') {
          matchesGender = newProfile.gender === 'man';
        } else if (filters.interestedIn === 'women') {
          matchesGender = newProfile.gender === 'woman';
        }

        // Age Filter Check
        let matchesAge = true;
        if (newProfile.birth_date) {
          const bday = new Date(newProfile.birth_date);
          const age = new Date().getFullYear() - bday.getFullYear();
          matchesAge = age >= filters.ageRange[0] && age <= filters.ageRange[1];
        }

        if (matchesGender && matchesAge) {
          setProfiles(prev => {
            if (prev.some(p => p.id === newProfile.id)) return prev;
            return [newProfile, ...prev];
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, filters.interestedIn, filters.ageRange[0], filters.ageRange[1]]);

  const currentProfile = profiles[profiles.length - 1] ?? null;

  const handleSwipe = async (profileId: string, action: 'like' | 'pass' | 'superlike') => {
    if (!user || !profile) return;

    // 1. Check Swipe Limit for Free Users
    const isPremium = isPremiumActive(profile);
    if (!isPremium && profile.swipes_remaining <= 0 && (action === 'like' || action === 'superlike')) {
      setShowSwipeLimitModal(true);
      return;
    }

    // Optimistically remove from stack
    setProfiles(prev => prev.filter(p => p.id !== profileId));

    try {
      // 2. Decrement swipes for free users
      if (!isPremium && (action === 'like' || action === 'superlike')) {
        const newRemaining = Math.max(0, profile.swipes_remaining - 1);
        setProfile({ ...profile, swipes_remaining: newRemaining });
        
        // Update DB in background
        supabase
          .from('profiles')
          .update({ swipes_remaining: newRemaining })
          .eq('id', user.id)
          .then(({ error }) => {
            if (error) console.error('Error updating swipe count:', error);
          });
      }

      const { error } = await supabase
        .from('swipes')
        .insert([{
          swiper_id: user.id,
          swiped_id: profileId,
          type: action
        }]);

      if (error) throw error;

      // Check for mutual match
      if (action === 'like' || action === 'superlike') {
        const { data: mutualLike } = await supabase
          .from('swipes')
          .select('*')
          .eq('swiper_id', profileId)
          .eq('swiped_id', user.id)
          .in('type', ['like', 'superlike'])
          .single();

        // Trigger Like Notification (App-side fallback)
        // REMOVED: Handled by database trigger on_like_trigger
        
        // Match notification is now handled by database trigger on_match_trigger
        if (mutualLike) {
          const [u1, u2] = [user.id, profileId].sort();
          
          const { data: matchData, error: matchError } = await supabase
            .from('matches')
            .insert([{
              user1_id: u1,
              user2_id: u2
            }])
            .select()
            .single();

          let finalMatchData = matchData;

          if (matchError && matchError.code === '23505') {
            const { data: existingMatch } = await supabase
              .from('matches')
              .select()
              .eq('user1_id', u1)
              .eq('user2_id', u2)
              .single();
            finalMatchData = existingMatch;
          }
          
          if (finalMatchData) {
            // Match notification is now handled by database trigger on_match_trigger
            // Optimistically refresh the badge count locally
            useBadgeStore.getState().fetchCounts(user.id);

            const { data: matchedProfileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', profileId)
              .single();

            if (matchedProfileData) {
              setNewMatch({
                matchId: finalMatchData.id,
                matchedProfile: matchedProfileData as Profile
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error recording swipe:', error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.logoText, { color: theme.primary }]}>Chana</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[styles.iconButton, { backgroundColor: theme.card }]}
            onPress={() => setShowFilters(true)}
          >
            <Ionicons name="options" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.cardContainer}>
        {isLoading ? (
          <ActivityIndicator size="large" color={theme.primary} />
        ) : profiles.length > 0 ? (
          <Animated.View entering={FadeIn.duration(400)} style={{ flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' }}>
            {profiles.map((p, index) => (
              <SwipeCard
                key={p.id}
                profile={{
                  id: p.id,
                  name: p.full_name || 'Someone',
                  age: p.birth_date && !isNaN(new Date(p.birth_date).getTime())
                    ? new Date().getFullYear() - new Date(p.birth_date).getFullYear()
                    : 0,
                  photos: Array.isArray(p.photos) ? p.photos.filter(url => !!url) : (p.avatar_url ? [p.avatar_url] : []),
                  city: p.location_city || 'Nearby',
                  country: p.country || '',
                  distance: p.distance_km !== undefined && p.distance_km !== null ? `${Math.round(p.distance_km)} km away` : '',
                  interests: Array.isArray(p.interests) ? p.interests : [],
                  isVerified: false,
                  bio: p.bio || '',
                }}
                isTop={index === profiles.length - 1}
                hasSwipes={isPremiumActive(profile) || profile.swipes_remaining > 0}
                onSwipeLeft={() => handleSwipe(p.id, 'pass')}
                onSwipeRight={() => handleSwipe(p.id, 'like')}
              />
            ))}
          </Animated.View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="sparkles-outline" size={64} color={theme.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No more profiles</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
              Try expanding your filters or refreshing to see new people!
            </Text>
            <TouchableOpacity 
              style={[styles.refreshButton, { backgroundColor: theme.primary }]}
              onPress={fetchProfiles}
            >
              <Ionicons name="refresh" size={20} color="#FFF" />
              <Text style={styles.refreshButtonText}>Refresh Discover</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Action Buttons — wired to handleSwipe on current top card */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.passButton, { backgroundColor: theme.card }]}
          onPress={() => currentProfile && handleSwipe(currentProfile.id, 'pass')}
          disabled={!currentProfile}
        >
          <Ionicons name="close" size={32} color={theme.error} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.likeButton, { backgroundColor: theme.card, borderColor: theme.primary }]}
          onPress={() => currentProfile && handleSwipe(currentProfile.id, 'like')}
          disabled={!currentProfile}
        >
          <Ionicons name="heart" size={32} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Match Modal */}
      {newMatch && profile && (
        <MatchModal
          visible={!!newMatch}
          myProfile={profile}
          matchedProfile={newMatch.matchedProfile}
          matchId={newMatch.matchId}
          onClose={() => setNewMatch(null)}
        />
      )}

      {/* Filter Modal */}
      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        currentFilters={filters}
        onApply={(newFilters) => setFilters(newFilters)}
      />

      {/* Premium Paywall */}
      <PremiumModal
        visible={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        feature="swipes"
      />

      {/* Swipe Limit Interstitial Alert */}
      <SwipeLimitModal
        visible={showSwipeLimitModal}
        onClose={() => setShowSwipeLimitModal(false)}
        onUnlockPremium={() => {
          setShowSwipeLimitModal(false);
          setShowPremiumModal(true);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontFamily: FONTS.display,
    fontSize: 28,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    marginTop: SPACING.xl,
    gap: 8,
    ...SHADOWS.medium,
  },
  refreshButtonText: {
    color: '#FFF',
    fontFamily: FONTS.bodyBold,
    fontSize: 16,
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    fontFamily: FONTS.display,
    fontSize: 24,
    marginTop: SPACING.md,
  },
  emptySubtitle: {
    fontFamily: FONTS.body,
    fontSize: 16,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingBottom: 90,
    marginTop: SPACING.sm,
  },
  actionButton: {
    width: 62,
    height: 62,
    borderRadius: 31,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  passButton: {
    width: 54,
    height: 54,
  },
  likeButton: {
    width: 62,
    height: 62,
    borderWidth: 1.5,
  }
});

export default DiscoverScreen;
