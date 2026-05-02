import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  Text,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, SPACING, SHADOWS, COLORS } from '../../constants/theme';
import { useAppTheme } from '../../hooks/use-theme-color';
import { SwipeCard } from '../../components/cards/SwipeCard';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';

const { height } = Dimensions.get('window');

const DUMMY_PROFILES = [
  {
    id: '1',
    name: 'Sofia',
    age: 26,
    photos: ['https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000'],
    city: 'Paris',
    distance: '4km away',
    interests: ['🎨 Art', '✈️ Travel', '🎵 Music'],
    isVerified: true
  },
  {
    id: '2',
    name: 'Marcus',
    age: 28,
    photos: ['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1000'],
    city: 'London',
    distance: '12km away',
    interests: ['💪 Fitness', '🍳 Food', '🎮 Gaming'],
    isVerified: false
  },
  {
    id: '3',
    name: 'Elena',
    age: 24,
    photos: ['https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=1000'],
    city: 'Madrid',
    distance: '2km away',
    interests: ['📚 Books', '🌿 Nature', '🐶 Pets'],
    isVerified: true
  }
];

import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';

const DiscoverScreen = () => {
  const theme = useAppTheme();
  const { user, profile } = useAuthStore();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfiles = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // 1. Get already swiped profile IDs
      const { data: swipedData } = await supabase
        .from('swipes')
        .select('swiped_id')
        .eq('swiper_id', user.id);

      const swipedIds = swipedData?.map(s => s.swiped_id) || [];

      // 2. Fetch profiles not swiped and not the current user
      let query = supabase
        .from('profiles')
        .select('*')
        .eq('is_onboarded', true)
        .neq('id', user.id)
        .not('id', 'in', `(${[user.id, ...swipedIds].join(',')})`)
        .limit(10);

      // 3. Apply basic gender preference filtering
      if (profile?.preferences?.interestedIn && profile.preferences.interestedIn !== 'everyone') {
        const seekingGender = profile.preferences.interestedIn === 'men' ? 'man' : 'woman';
        query = query.eq('gender', seekingGender);
      }

      const { data, error } = await query;

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [user, profile]);

  const handleSwipe = async (profileId: string, action: 'like' | 'pass') => {
    if (!user) return;

    // Record swipe
    try {
      const { error } = await supabase
        .from('swipes')
        .insert([{ 
          swiper_id: user.id, 
          swiped_id: profileId, 
          type: action 
        }]);

      if (error) throw error;

      // Check for mutual match if action is 'like'
      if (action === 'like') {
        const { data: mutualLike } = await supabase
          .from('swipes')
          .select('*')
          .eq('swiper_id', profileId)
          .eq('swiped_id', user.id)
          .eq('type', 'like')
          .single();

        if (mutualLike) {
          // It's a match!
          console.log('IT IS A MATCH!');
          // TODO: Show match modal
          await supabase.from('matches').insert([{ 
            user1_id: user.id, 
            user2_id: profileId 
          }]);
        }
      }
    } catch (error) {
      console.error('Error recording swipe:', error);
    }

    setProfiles(prev => prev.filter(p => p.id !== profileId));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.logoText, { color: theme.primary }]}>Chana</Text>
        <TouchableOpacity style={[styles.iconButton, { backgroundColor: theme.card }]}>
          <Ionicons name="options" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.cardContainer}>
        {isLoading ? (
          <ActivityIndicator size="large" color={theme.primary} />
        ) : profiles.length > 0 ? (
          profiles.map((profile, index) => (
            <SwipeCard
              key={profile.id}
              profile={{
                id: profile.id,
                name: profile.full_name,
                age: profile.birth_date ? new Date().getFullYear() - new Date(profile.birth_date).getFullYear() : 0,
                photos: profile.photos || [],
                city: profile.location_city || '',
                distance: 'Nearby', // Mocking distance for now
                interests: profile.interests || [],
                isVerified: false
              }}
              isTop={index === profiles.length - 1}
              onSwipeLeft={() => handleSwipe(profile.id, 'pass')}
              onSwipeRight={() => handleSwipe(profile.id, 'like')}
            />
          )).reverse()
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="sparkles-outline" size={64} color={theme.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No more profiles</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>Try expanding your filters to see more people!</Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.actionButton, styles.passButton, { backgroundColor: theme.card }]}>
          <Ionicons name="close" size={32} color={theme.error} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.superLikeButton, { backgroundColor: theme.card }]}>
          <Ionicons name="star" size={24} color={theme.secondary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.likeButton, { backgroundColor: theme.card, borderColor: theme.primary }]}>
          <Ionicons name="heart" size={32} color={theme.primary} />
        </TouchableOpacity>
      </View>
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
    gap: 20,
    paddingBottom: height * 0.05,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  passButton: {
    width: 56,
    height: 56,
  },
  likeButton: {
    width: 64,
    height: 64,
    borderWidth: 1,
  },
  superLikeButton: {
    width: 48,
    height: 48,
  }
});

export default DiscoverScreen;
