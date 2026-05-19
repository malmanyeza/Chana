import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Image,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../../constants/theme';
import { useAppTheme } from '../../../hooks/use-theme-color';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../stores/authStore';
import { Message, Match } from '../../../types';

export default function ChatScreen() {
  const { matchId, name, avatar } = useLocalSearchParams<{ 
    matchId: string;
    name?: string;
    avatar?: string;
  }>();
  const router = useRouter();
  const theme = useAppTheme();
  const { user } = useAuthStore();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [match, setMatch] = useState<Match | null>(() => {
    if (name) {
      return {
        id: matchId,
        otherUser: {
          full_name: name,
          photos: avatar ? [avatar] : [],
        }
      } as any;
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // 1. Android manual height listeners
    let showSub, hideSub;
    if (Platform.OS === 'android') {
      showSub = Keyboard.addListener('keyboardDidShow', (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setTimeout(scrollToBottom, 100);
      });
      hideSub = Keyboard.addListener('keyboardDidHide', () => {
        setKeyboardHeight(0);
      });
    }

    // 2. Cross-platform visibility listeners (willShow/willHide are buttery smooth on iOS)
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const visShowSub = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
      if (Platform.OS === 'ios') setTimeout(scrollToBottom, 50);
    });
    const visHideSub = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSub?.remove();
      hideSub?.remove();
      visShowSub.remove();
      visHideSub.remove();
    };
  }, []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  useEffect(() => {
    if (!matchId || !user) return;

    const fetchMatchAndMessages = async () => {
      setIsLoading(true);
      try {
        // Fetch match + other user profile
        const { data: matchData } = await supabase
          .from('matches')
          .select(`
            id,
            created_at,
            user1_id,
            user2_id,
            user1:profiles!user1_id(*),
            user2:profiles!user2_id(*)
          `)
          .eq('id', matchId)
          .single();

        if (matchData) {
          const otherUser = (matchData as any).user1.id === user.id
            ? (matchData as any).user2
            : (matchData as any).user1;
          setMatch({ ...matchData, otherUser } as Match);
        }

        // Fetch existing messages
        const { data: msgs } = await supabase
          .from('messages')
          .select('*')
          .eq('match_id', matchId)
          .order('created_at', { ascending: true });

        setMessages((msgs as Message[]) || []);
      } catch (error) {
        console.error('Error fetching chat data:', error);
      } finally {
        setIsLoading(false);
        scrollToBottom();
      }
    };

    fetchMatchAndMessages();

    // Realtime subscription for new messages
    const channel = supabase
      .channel(`match:${matchId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `match_id=eq.${matchId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
        scrollToBottom();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, user]);

  const sendMessage = async () => {
    if (!message.trim() || !user || !matchId) return;

    const content = message.trim();
    setMessage('');

    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          match_id: matchId,
          sender_id: user.id,
          content,
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (isLoading && !match) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.card }]}>
          <TouchableOpacity 
            onPress={() => router.replace('/(tabs)/matches')} 
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <Image
              source={{ uri: (match.otherUser as any)?.photos?.[0] || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200' }}
              style={styles.avatar}
            />
            <View>
              <Text style={[styles.name, { color: theme.text }]}>{(match.otherUser as any)?.full_name}</Text>
              <View style={styles.onlineStatus}>
                <View style={[styles.onlineDot, { backgroundColor: theme.success }]} />
                <Text style={[styles.onlineText, { color: theme.textMuted }]}>online</Text>
              </View>
            </View>
          </View>

        </View>

        <Pressable 
          style={{ flex: 1 }} 
          onPress={Keyboard.dismiss}
          accessible={false}
        >
          <View style={{ flex: 1, paddingBottom: Platform.OS === 'android' ? keyboardHeight : 0 }}>
            {/* Messages */}
            {messages.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={64} color={theme.textMuted} />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>Start the conversation!</Text>
                <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
                  Send a message to break the ice with {match.otherUser.full_name?.split(' ')[0]}
                </Text>
              </View>
            ) : (
              <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                style={{ flex: 1 }}
                contentContainerStyle={styles.messageList}
                keyboardShouldPersistTaps="handled"
                onLayout={scrollToBottom}
                renderItem={({ item }) => (
                  <View style={[
                    styles.messageBubble,
                    item.sender_id === user?.id ? styles.myBubble : styles.theirBubble
                  ]}>
                    {item.sender_id === user?.id ? (
                      <LinearGradient
                        colors={COLORS.gradients.warm}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.bubbleGradient}
                      >
                        <Text style={styles.messageTextWhite}>{item.content}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={[styles.theirBubbleContent, { backgroundColor: theme.card }]}>
                        <Text style={[styles.messageText, { color: theme.text }]}>{item.content}</Text>
                      </View>
                    )}
                    <Text style={[styles.timeText, { color: theme.textMuted }]}>
                      {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                )}
              />
            )}

            {/* Input area */}
            <View style={[
              styles.inputContainer, 
              { 
                backgroundColor: theme.card, 
                borderTopColor: theme.border, 
                paddingBottom: isKeyboardVisible ? 8 : (insets.bottom + 8)
              }
            ]}>
              <TouchableOpacity style={styles.attachButton}>
                <Ionicons name="add" size={24} color={theme.textMuted} />
              </TouchableOpacity>

              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
                placeholder="Type a message..."
                placeholderTextColor={theme.textMuted}
                value={message}
                onChangeText={setMessage}
                multiline
                onSubmitEditing={sendMessage}
              />

              <TouchableOpacity
                style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
                onPress={sendMessage}
                disabled={!message.trim()}
              >
                <LinearGradient
                  colors={COLORS.gradients.warm}
                  style={styles.sendGradient}
                >
                  <Ionicons name="send" size={20} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  name: {
    fontFamily: FONTS.bodyBold,
    fontSize: 18,
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  onlineText: {
    fontFamily: FONTS.body,
    fontSize: 12,
  },
  optionButton: {
    padding: 8,
  },
  messageList: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  messageBubble: {
    marginBottom: SPACING.md,
    maxWidth: '80%',
  },
  myBubble: {
    alignSelf: 'flex-end',
  },
  theirBubble: {
    alignSelf: 'flex-start',
  },
  bubbleGradient: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderBottomRightRadius: 4,
  },
  theirBubbleContent: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
  },
  messageTextWhite: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  messageText: {
    fontFamily: FONTS.body,
    fontSize: 16,
    lineHeight: 22,
  },
  timeText: {
    fontFamily: FONTS.body,
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
  },
  attachButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 8,
    fontFamily: FONTS.body,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    fontFamily: FONTS.display,
    fontSize: 24,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: FONTS.body,
    fontSize: 16,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 22,
  },
});
