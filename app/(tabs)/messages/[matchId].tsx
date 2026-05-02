import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  FlatList, 
  Image, 
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../../constants/theme';
import { useAppTheme } from '../../../hooks/use-theme-color';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../stores/authStore';

export default function ChatScreen() {
  const { matchId } = useLocalSearchParams();
  const router = useRouter();
  const theme = useAppTheme();
  const { user } = useAuthStore();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [match, setMatch] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!matchId || !user) return;

    const fetchMatchAndMessages = async () => {
      setIsLoading(true);
      try {
        // Fetch match details to get the other user's info
        const { data: matchData } = await supabase
          .from('matches')
          .select(`
            id,
            user1:profiles!user1_id(*),
            user2:profiles!user2_id(*)
          `)
          .eq('id', matchId)
          .single();
        
        if (matchData) {
          const otherUser = matchData.user1.id === user.id ? matchData.user2 : matchData.user1;
          setMatch({ ...matchData, otherUser });
        }

        // Fetch messages
        const { data: msgs } = await supabase
          .from('messages')
          .select('*')
          .eq('match_id', matchId)
          .order('created_at', { ascending: true });
        
        setMessages(msgs || []);
      } catch (error) {
        console.error('Error fetching chat data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatchAndMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`match:${matchId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `match_id=eq.${matchId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
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
          content: content
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (isLoading || !match) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Image 
            source={{ uri: match.otherUser.photos?.[0] || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200' }} 
            style={styles.avatar} 
          />
          <View>
            <Text style={[styles.name, { color: theme.text }]}>{match.otherUser.full_name}</Text>
            <View style={styles.onlineStatus}>
              <View style={styles.onlineDot} />
              <Text style={[styles.onlineText, { color: theme.textMuted }]}>online</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.optionButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        renderItem={({ item }) => (
          <View style={[
            styles.messageBubble,
            item.sender_id === user.id ? styles.myBubble : styles.theirBubble
          ]}>
            {item.sender_id === user.id ? (
              <LinearGradient
                colors={COLORS.gradients.warm}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.bubbleGradient}
              >
                <Text style={styles.messageText}>{item.content}</Text>
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

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={[styles.inputContainer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
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
          />

          <TouchableOpacity 
            style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
          >
            <LinearGradient
              colors={COLORS.gradients.warm}
              style={styles.sendGradient}
            >
              <Ionicons name="send" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surfaceDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
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
    color: '#FFFFFF',
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
    backgroundColor: COLORS.success,
    marginRight: 6,
  },
  onlineText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.textMutedDark,
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
    backgroundColor: COLORS.cardDark,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  timeText: {
    fontFamily: FONTS.body,
    fontSize: 10,
    color: COLORS.textMutedDark,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: '#1A1A24',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  attachButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 8,
    color: '#FFFFFF',
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
    opacity: 0.5,
  },
  sendGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
