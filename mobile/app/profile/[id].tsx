import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { useAppTheme } from '../../hooks/use-theme-color';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { useBadgeStore } from '../../stores/badgeStore';
import { Profile } from '../../types';
import { MatchModal } from '../../components/overlays/MatchModal';

const { width } = Dimensions.get('window');
const IMAGE_HEIGHT = width * 1.25;

export default function ProfileDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useAppTheme();
  const { user, profile: myProfile } = useAuthStore();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  
  // Match states
  const [hasLikedMe, setHasLikedMe] = useState(false);
  const [isMatched, setIsMatched] = useState(false);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [newMatch, setNewMatch] = useState<any>(null);

  useEffect(() => {
    if (!id || !user) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch profile
        const { data: pData } = await supabase.from('profiles').select('*').eq('id', id).single();
        if (pData) setProfile(pData as Profile);

        // 2. Check if they liked me
        const { data: likeData } = await supabase
          .from('swipes')
          .select('*')
          .eq('swiper_id', id)
          .eq('swiped_id', user.id)
          .in('type', ['like', 'superlike'])
          .single();
        setHasLikedMe(!!likeData);

        // 3. Check if already matched
        const { data: matchData } = await supabase
          .from('matches')
          .select('*')
          .or(`and(user1_id.eq.${user.id},user2_id.eq.${id}),and(user1_id.eq.${id},user2_id.eq.${user.id})`)
          .single();
        
        if (matchData) {
          setIsMatched(true);
          setMatchId(matchData.id);
        }
      } catch (error) {
        console.error('Error fetching profile detail:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, user]);

  const handleAction = async (action: 'like' | 'pass') => {
    if (!user || !id) return;

    try {
      // 1. Record swipe
      const { error: swipeError } = await supabase
        .from('swipes')
        .upsert([{
          swiper_id: user.id,
          swiped_id: id,
          type: action
        }], { onConflict: 'swiper_id, swiped_id' });

      if (swipeError) throw swipeError;

      // 2. If it's a like and they liked me -> Match!
      if (action === 'like' && hasLikedMe) {
        const [u1, u2] = [user.id, id].sort();
        const { data: matchData, error: matchError } = await supabase
          .from('matches')
          .upsert([{
            user1_id: u1,
            user2_id: u2
          }], { onConflict: 'user1_id, user2_id' })
          .select()
          .single();

        if (!matchError && matchData && profile) {
          // Optimistically refresh the badge count locally
          useBadgeStore.getState().fetchCounts(user.id);

          setNewMatch({
            matchId: matchData.id,
            matchedProfile: profile
          });
          setIsMatched(true);
          setMatchId(matchData.id);
        }
      } else {
        // If it's a pass or just a normal like, go back
        router.back();
      }
    } catch (error) {
      console.error('Error in profile action:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>Profile not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: theme.primary }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const age = profile.birth_date
    ? new Date().getFullYear() - new Date(profile.birth_date).getFullYear()
    : null;

  const validPhotos = Array.isArray(profile.photos) 
    ? profile.photos.filter(p => !!p)
    : (profile.avatar_url ? [profile.avatar_url] : []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Photo Gallery */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: validPhotos[activePhotoIndex] || 'https://via.placeholder.com/600x800' }}
            style={styles.image}
            contentFit="contain"
          />
          
          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.6)']}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Photo Pagination Dots */}
          {validPhotos.length > 1 && (
            <View style={styles.pagination}>
              {validPhotos.map((_, idx) => (
                <View 
                  key={idx} 
                  style={[
                    styles.paginationDot, 
                    { backgroundColor: idx === activePhotoIndex ? '#FFF' : 'rgba(255,255,255,0.4)' }
                  ]} 
                />
              ))}
            </View>
          )}

          {/* Photo Tap Areas */}
          <View style={styles.tapAreaContainer}>
            <TouchableOpacity 
              style={styles.tapArea} 
              onPress={() => setActivePhotoIndex(prev => Math.max(0, prev - 1))}
            />
            <TouchableOpacity 
              style={styles.tapArea} 
              onPress={() => setActivePhotoIndex(prev => Math.min(validPhotos.length - 1, prev + 1))}
            />
          </View>

          {/* Back Button */}
          <SafeAreaView style={styles.headerActions}>
            <TouchableOpacity 
              style={[styles.iconButton, { backgroundColor: 'rgba(0,0,0,0.3)' }]}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={28} color="#FFF" />
            </TouchableOpacity>
          </SafeAreaView>
        </View>

        {/* Content */}
        <View style={[styles.content, { backgroundColor: theme.background }]}>
          <View style={styles.profileHeader}>
            <View>
              <View style={styles.nameRow}>
                <Text style={[styles.name, { color: theme.text }]}>
                  {profile.full_name}{age ? `, ${age}` : ''} {profile.country || ''}
                </Text>
                {hasLikedMe && !isMatched && (
                  <View style={[styles.likedBadge, { backgroundColor: theme.primary }]}>
                    <Text style={styles.likedBadgeText}>LIKED YOU</Text>
                  </View>
                )}
              </View>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={16} color={theme.primary} />
                <Text style={[styles.locationText, { color: theme.textMuted }]}>
                  {profile.location_city || 'Nearby'}
                </Text>
              </View>
            </View>
            <View style={[styles.verifiedBadge, { backgroundColor: theme.card }]}>
              <Ionicons name="checkmark-circle" size={24} color={theme.success} />
            </View>
          </View>

          {/* About */}
          {profile.bio && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>About</Text>
              <Text style={[styles.bioText, { color: theme.textMuted }]}>{profile.bio}</Text>
            </View>
          )}

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Interests</Text>
              <View style={styles.interestsContainer}>
                {profile.interests.map((interest, idx) => (
                  <View key={idx} style={[styles.interestBadge, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.interestText, { color: theme.text }]}>{interest}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}


          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* Footer Actions */}
      <View style={[styles.footer, { backgroundColor: theme.background }]}>
        {isMatched ? (
          <TouchableOpacity 
            style={styles.chatFab}
            onPress={() => router.push({
              pathname: `/(tabs)/messages/${matchId}`,
              params: {
                name: profile.full_name,
                avatar: profile.photos?.[0] || ''
              }
            })}
          >
            <LinearGradient
              colors={COLORS.gradients.warm as [string, string]}
              style={styles.fabGradient}
            >
              <Ionicons name="chatbubble" size={24} color="#FFF" />
              <Text style={styles.fabText}>Message</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: theme.card, borderColor: theme.error }]}
              onPress={() => handleAction('pass')}
            >
              <Ionicons name="close" size={32} color={theme.error} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionBtn, styles.likeBtn, { backgroundColor: theme.primary }]}
              onPress={() => handleAction('like')}
            >
              <Ionicons name="heart" size={36} color="#FFF" />
              {hasLikedMe && <Text style={styles.likeBtnText}>LIKE BACK</Text>}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Match Modal */}
      {newMatch && myProfile && (
        <MatchModal
          visible={!!newMatch}
          myProfile={myProfile}
          matchedProfile={newMatch.matchedProfile}
          matchId={newMatch.matchId}
          onClose={() => setNewMatch(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: width,
    height: IMAGE_HEIGHT,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  headerActions: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'ios' ? 0 : SPACING.lg, // Adjust for Android/iOS
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10, // Added margin for better tap area
    marginLeft: 4,  // Added margin for better tap area
    ...SHADOWS.soft,
  },
  pagination: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: SPACING.xl,
    zIndex: 10,
  },
  paginationDot: {
    height: 4,
    flex: 1,
    maxWidth: 40,
    borderRadius: 2,
  },
  tapAreaContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  tapArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    marginTop: -30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xl,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  name: {
    fontFamily: FONTS.display,
    fontSize: 32,
    marginBottom: 4,
  },
  likedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  likedBadgeText: {
    color: '#FFF',
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontFamily: FONTS.body,
    fontSize: 16,
  },
  verifiedBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontFamily: FONTS.display,
    fontSize: 20,
    marginBottom: SPACING.md,
  },
  bioText: {
    fontFamily: FONTS.body,
    fontSize: 16,
    lineHeight: 24,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  interestBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  interestText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: 30,
  },
  chatFab: {
    borderRadius: 30,
    overflow: 'hidden',
    ...SHADOWS.soft,
  },
  fabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  fabText: {
    color: '#FFF',
    fontFamily: FONTS.bodyBold,
    fontSize: 18,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  actionBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    ...SHADOWS.soft,
  },
  likeBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    borderWidth: 0,
  },
  likeBtnText: {
    color: '#FFF',
    fontFamily: FONTS.bodyBold,
    fontSize: 18,
  },
  devSection: {
    marginTop: SPACING.xl,
    paddingTop: SPACING.xl,
    borderTopWidth: 1,
    borderStyle: 'dashed',
  },
  testMatchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: 10,
    ...SHADOWS.soft,
  },
  testMatchText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
  }
});

