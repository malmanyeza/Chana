import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import { useAppTheme } from '../../hooks/use-theme-color';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { PremiumModal } from '../../components/overlays/PremiumModal';

import { isPremiumActive } from '../../lib/premium';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const ITEM_WIDTH = (width - SPACING.lg * 3) / COLUMN_COUNT;

export default function LikesScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { user, profile } = useAuthStore();
  const [likes, setLikes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const fetchLikes = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // 1. Get IDs of people I've already swiped on (so we don't show them here again)
      const { data: mySwipes } = await supabase
        .from('swipes')
        .select('swiped_id')
        .eq('swiper_id', user.id);

      const swipedIds = mySwipes?.map(s => s.swiped_id) || [];

      // 2. Get people who liked me but I haven't swiped on yet
      const { data: likesData, error } = await supabase
        .from('swipes')
        .select(`
          id,
          created_at,
          type,
          profiles!swiper_id(*)
        `)
        .eq('swiped_id', user.id)
        .in('type', ['like', 'superlike'])
        .not('swiper_id', 'in', `(${[user.id, ...swipedIds].join(',')})`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLikes(likesData || []);
    } catch (error) {
      console.error('Error fetching likes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLikes();

    // Listen for new likes in real-time
    const channel = supabase
      .channel('likes-updates')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'swipes',
        filter: `swiped_id=eq.${user?.id}`
      }, fetchLikes)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Likes</Text>
        <View style={[styles.badge, { backgroundColor: theme.primary }]}>
          <Text style={styles.badgeText}>{likes.length}</Text>
        </View>
      </View>

      <Text style={[styles.subtitle, { color: theme.textMuted }]}>
        See who already liked you!
      </Text>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : likes.length > 0 ? (
        <FlatList
          data={likes}
          keyExtractor={(item) => item.id.toString()}
          numColumns={COLUMN_COUNT}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const isPremium = isPremiumActive(profile);

            return (
              <TouchableOpacity 
                style={[styles.card, { backgroundColor: theme.card }]}
                onPress={() => {
                  if (isPremium) {
                    router.push(`/profile/${item.profiles.id}`);
                  } else {
                    setShowPremiumModal(true);
                  }
                }}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: item.profiles.photos?.[0] || 'https://via.placeholder.com/300x400' }}
                  style={styles.image}
                  contentFit="cover"
                />
                
                {!isPremium && (
                  <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill}>
                    <View style={styles.premiumLock}>
                      <Ionicons name="lock-closed" size={24} color="#FFF" />
                      <Text style={styles.premiumLockText}>Unlock Gold</Text>
                    </View>
                  </BlurView>
                )}
                
                <View style={styles.cardOverlay}>
                  <BlurView intensity={20} tint="dark" style={styles.blurInfo}>
                    <Text style={styles.name} numberOfLines={1}>
                      {isPremium ? item.profiles.full_name?.split(' ')[0] : 'Someone'}
                    </Text>
                    {item.type === 'superlike' && (
                      <Ionicons name="star" size={14} color={COLORS.secondary} />
                    )}
                  </BlurView>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      ) : (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIconCircle, { backgroundColor: theme.card }]}>
            <Ionicons name="heart-outline" size={48} color={theme.textMuted} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No likes yet</Text>
          <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
            Keep swiping! Once someone likes you back, they'll appear here.
          </Text>
        </View>
      )}

      <PremiumModal
        visible={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        feature="likes"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    gap: 10,
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: 32,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  badgeText: {
    color: '#FFF',
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 16,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  list: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 100, // Safe space for tab bar
    gap: SPACING.md,
  },
  card: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH * 1.4,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    marginRight: SPACING.md,
    ...SHADOWS.soft,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  blurInfo: {
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: '#FFF',
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingBottom: 100,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontFamily: FONTS.display,
    fontSize: 24,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontFamily: FONTS.body,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  premiumLock: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  premiumLockText: {
    color: '#FFF',
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
