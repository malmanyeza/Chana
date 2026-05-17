import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface BadgeState {
  likesCount: number;
  unmessagedMatchesCount: number;
  fetchCounts: (userId: string) => Promise<void>;
  setupSubscriptions: (userId: string) => () => void;
}

export const useBadgeStore = create<BadgeState>((set, get) => ({
  likesCount: 0,
  unmessagedMatchesCount: 0,

  fetchCounts: async (userId: string) => {
    try {
      // 1. Fetch Likes Count (People who liked me but I haven't swiped on yet)
      // First get my swipes to exclude
      const { data: mySwipes } = await supabase
        .from('swipes')
        .select('swiped_id')
        .eq('swiper_id', userId);
      
      const swipedIds = mySwipes?.map(s => s.swiped_id) || [];

      const { count: lCount } = await supabase
        .from('swipes')
        .select('*', { count: 'exact', head: true })
        .eq('swiped_id', userId)
        .in('type', ['like', 'superlike'])
        .not('swiper_id', 'in', `(${[userId, ...swipedIds].join(',')})`);

      // 2. Fetch Unmessaged Matches Count
      // Get all matches for this user
      const { data: matches } = await supabase
        .from('matches')
        .select('id')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

      let unmessagedCount = 0;
      if (matches && matches.length > 0) {
        const matchIds = matches.map(m => m.id);
        
        // Count matches that have ZERO messages
        for (const mId of matchIds) {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('match_id', mId);
          
          if (count === 0) unmessagedCount++;
        }
      }

      set({ 
        likesCount: lCount || 0, 
        unmessagedMatchesCount: unmessagedCount 
      });
    } catch (error) {
      console.error('Error fetching badge counts:', error);
    }
  },

  setupSubscriptions: (userId: string) => {
    const fetch = () => get().fetchCounts(userId);

    // Subscribe to swipes (for likes count)
    const swipesSub = supabase
      .channel('badge-swipes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'swipes' }, fetch)
      .subscribe();

    // Subscribe to matches
    const matchesSub = supabase
      .channel('badge-matches')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, fetch)
      .subscribe();

    // Subscribe to messages (to decrement matches count when first message sent)
    const messagesSub = supabase
      .channel('badge-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, fetch)
      .subscribe();

    return () => {
      supabase.removeChannel(swipesSub);
      supabase.removeChannel(matchesSub);
      supabase.removeChannel(messagesSub);
    };
  }
}));
