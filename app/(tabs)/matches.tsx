import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  FlatList, 
  Image,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { useAppTheme } from '../../hooks/use-theme-color';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';

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
      // 1. Fetch matches
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
        return {
          id: m.id,
          otherUser,
          createdAt: m.created_at
        };
      });

      setMatches(formattedMatches);

      // 2. Fetch conversations (latest message for each match)
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
          lastMessage: lastMsg?.content || 'No messages yet',
          time: lastMsg ? new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          unread: false // Placeholder
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
  }, [user]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Matches</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {matches.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>NEW MATCHES</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.matchesScroll}>
                {matches.map((match) => (
                  <TouchableOpacity key={match.id} style={styles.matchItem}>
                    <Image source={{ uri: match.otherUser.photos?.[0] }} style={styles.matchAvatar} />
                    <Text style={[styles.matchName, { color: theme.text }]}>{match.otherUser.full_name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MESSAGES</Text>
            {conversations.length > 0 ? conversations.map((conv) => (
              <TouchableOpacity 
                key={conv.id} 
                style={styles.conversationRow}
                onPress={() => router.push(`/(tabs)/messages/${conv.id}`)}
              >
                <Image source={{ uri: conv.otherUser.photos?.[0] }} style={styles.convAvatar} />
                <View style={[styles.convInfo, { borderBottomColor: theme.border }]}>
                  <View style={styles.convHeader}>
                    <Text style={[styles.convName, { color: theme.text }]}>{conv.otherUser.full_name}</Text>
                    <Text style={[styles.convTime, { color: theme.textMuted }]}>{conv.time}</Text>
                  </View>
                  <View style={styles.convFooter}>
                    <Text 
                      style={[
                        styles.convMessage, 
                        { color: theme.textMuted },
                        conv.unread && [styles.unreadMessage, { color: theme.text }]
                      ]} 
                      numberOfLines={1}
                    >
                      {conv.lastMessage}
                    </Text>
                    {conv.unread && <View style={styles.unreadDot} />}
                  </View>
                </View>
              </TouchableOpacity>
            )) : (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: theme.textMuted }]}>No conversations yet</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: 28,
  },
  section: {
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12,
    color: COLORS.primary,
    letterSpacing: 1,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  matchesScroll: {
    paddingLeft: SPACING.lg,
  },
  matchItem: {
    alignItems: 'center',
    marginRight: 20,
  },
  matchAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  matchName: {
    fontFamily: FONTS.bodyBold,
    marginTop: 8,
    fontSize: 14,
  },
  conversationRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  convAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  convInfo: {
    flex: 1,
    marginLeft: SPACING.md,
    borderBottomWidth: 1,
    paddingBottom: SPACING.md,
  },
  convHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  convName: {
    fontFamily: FONTS.bodyBold,
    fontSize: 18,
  },
  convTime: {
    fontFamily: FONTS.body,
    fontSize: 12,
  },
  convFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  convMessage: {
    fontFamily: FONTS.body,
    fontSize: 14,
    flex: 1,
  },
  unreadMessage: {
    fontFamily: FONTS.bodyBold,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: 16,
  }
});

export default MatchesScreen;
