import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { useAppTheme } from '../../hooks/use-theme-color';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';

const { width } = Dimensions.get('window');
const AVATAR_SIZE = 68;

const MatchesScreen = () => {
  const router = useRouter();
  const theme = useAppTheme();
  const { user } = useAuthStore();
  const [matches, setMatches] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select(`
          id,
          created_at,
          user1:profiles!user1_id(*),
          user2:profiles!user2_id(*)
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (matchesError) throw matchesError;

      const formattedMatches = matchesData.map(m => {
        const otherUser = m.user1.id === user.id ? m.user2 : m.user1;
        return { id: m.id, otherUser, createdAt: m.created_at };
      });

      setMatches(formattedMatches);

      const convs = await Promise.all(formattedMatches.map(async (m) => {
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('*')
          .eq('match_id', m.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        return {
          ...m,
          lastMessage: lastMsg?.content ?? null,
          time: lastMsg ? new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          unread: false,
        };
      }));

      setConversations(convs);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (!user) return;

    const channel = supabase
      .channel(`matches-list-${user.id}-${Date.now()}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'matches' 
      }, (payload: any) => {
        // Refresh if the current user is part of the match (either as user1 or user2)
        const isMyMatch = payload.new?.user1_id === user.id || payload.new?.user2_id === user.id;
        if (isMyMatch) {
          fetchData();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Matches</Text>
        <View style={[styles.headerBadge, { backgroundColor: theme.card }]}>
          <Text style={[styles.headerBadgeText, { color: theme.primary }]}>
            {matches.length} new
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* New Matches Row */}
          {matches.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>NEW MATCHES</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.matchesScroll}>
                {matches.map((match) => (
                  <TouchableOpacity
                    key={match.id}
                    style={styles.matchItem}
                    onPress={() => router.push(`/profile/${match.otherUser.id}`)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.matchAvatarWrapper}>
                      <LinearGradient
                        colors={COLORS.gradients.warm}
                        style={styles.matchAvatarRing}
                      >
                        <Image
                          source={{ uri: match.otherUser.photos?.[0] }}
                          style={styles.matchAvatar}
                        />
                      </LinearGradient>
                      <View style={[styles.onlineDot, { backgroundColor: theme.success, borderColor: theme.background }]} />
                    </View>
                    <Text style={[styles.matchName, { color: theme.text }]} numberOfLines={1}>
                      {match.otherUser.full_name?.split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Conversations */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>MESSAGES</Text>
            {conversations.length > 0 ? (
              conversations.map((conv) => (
                <TouchableOpacity
                  key={conv.id}
                  style={[styles.convRow, { borderBottomColor: theme.border }]}
                  onPress={() => router.push({
                    pathname: `/(tabs)/messages/${conv.id}`,
                    params: {
                      name: conv.otherUser.full_name,
                      avatar: conv.otherUser.photos?.[0] || ''
                    }
                  })}
                  activeOpacity={0.7}
                >
                  <TouchableOpacity 
                    style={styles.convAvatarWrapper}
                    onPress={(e) => {
                      e.stopPropagation();
                      router.push(`/profile/${conv.otherUser.id}`);
                    }}
                  >
                    <Image
                      source={{ uri: conv.otherUser.photos?.[0] }}
                      style={styles.convAvatar}
                    />
                    {conv.unread && (
                      <View style={[styles.unreadDot, { backgroundColor: theme.primary, borderColor: theme.background }]} />
                    )}
                  </TouchableOpacity>
                  <View style={styles.convInfo}>
                    <View style={styles.convTopRow}>
                      <Text style={[styles.convName, { color: theme.text }]}>
                        {conv.otherUser.full_name}
                      </Text>
                      <Text style={[styles.convTime, { color: theme.textMuted }]}>{conv.time}</Text>
                    </View>
                    <Text
                      style={[
                        styles.convMsg,
                        { color: conv.unread ? theme.text : theme.textMuted },
                        conv.unread && styles.convMsgBold,
                      ]}
                      numberOfLines={1}
                    >
                      {conv.lastMessage ?? 'Say hello! 👋'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={theme.border} />
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>💬</Text>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>No conversations yet</Text>
                <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
                  Start swiping to find your matches!
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: 32,
  },
  headerBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
  },
  headerBadgeText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
    letterSpacing: 1.5,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  matchesScroll: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  matchItem: {
    alignItems: 'center',
    width: 76,
  },
  matchAvatarWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  matchAvatarRing: {
    width: AVATAR_SIZE + 4,
    height: AVATAR_SIZE + 4,
    borderRadius: (AVATAR_SIZE + 4) / 2,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchAvatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  onlineDot: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    bottom: 2,
    right: 2,
  },
  matchName: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  convRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    gap: SPACING.md,
  },
  convAvatarWrapper: {
    position: 'relative',
  },
  convAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  unreadDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    bottom: 0,
    right: 0,
  },
  convInfo: {
    flex: 1,
  },
  convTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  convName: {
    fontFamily: FONTS.bodyBold,
    fontSize: 17,
  },
  convTime: {
    fontFamily: FONTS.body,
    fontSize: 12,
  },
  convMsg: {
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 20,
  },
  convMsgBold: {
    fontFamily: FONTS.bodyBold,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: SPACING.xxl,
    paddingHorizontal: SPACING.xl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontFamily: FONTS.display,
    fontSize: 22,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontFamily: FONTS.body,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default MatchesScreen;
