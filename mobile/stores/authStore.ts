import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { GoogleSignin } from '../lib/google-auth';
import { Profile } from '../types';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isSeeding: boolean;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  setIsSeeding: (seeding: boolean) => void;
  signOut: () => Promise<void>;
  fetchProfile: (userId: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  isSeeding: false,

  setSession: (session) => set({ session }),
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
  setIsSeeding: (isSeeding) => set({ isSeeding }),

  signOut: async () => {
    console.log('🧹 authStore: Starting signOut flow');
    
    const { user } = useAuthStore.getState();
    
    // 1. Optimistically clear state immediately
    set({ session: null, user: null, profile: null, isLoading: false });
    console.log('✅ authStore: Local state cleared');

    try {
      // 2. Clear push token in database if user exists
      if (user) {
        await supabase
          .from('profiles')
          .update({ push_token: null })
          .eq('id', user.id);
      }

      // 3. Perform background cleanup with a timeout to prevent hanging
      const cleanup = Promise.allSettled([
        GoogleSignin.signOut(),
        supabase.auth.signOut()
      ]);

      // We don't await this if we want it to be truly instant, 
      // but let's at least fire it off.
      cleanup.then(() => console.log('✨ authStore: Background cleanup finished'));
      
    } catch (error) {
      console.error('❌ authStore: Error during background cleanup:', error);
    }
  },

  fetchProfile: async (userId: string) => {
    try {
      // 1. Try to fetch existing profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // 2. Profile doesn't exist, create it. 
          // Using upsert handles race conditions where it might be created simultaneously.
          const { data: newProfile, error: upsertError } = await supabase
            .from('profiles')
            .upsert({ id: userId, is_onboarded: false }, { onConflict: 'id' })
            .select()
            .single();

          if (upsertError) {
            // If upsert still fails with unique violation, just try fetching one last time
            if (upsertError.code === '23505') {
              const { data: retryData } = await supabase.from('profiles').select('*').eq('id', userId).single();
              if (retryData) {
                set({ profile: retryData as Profile });
                return;
              }
            }
            // If the upsert fails because the user no longer exists in auth.users (foreign key constraint error 23503)
            if (upsertError.code === '23503') {
              console.log('⚠️ Ghost session detected (user deleted from backend). Performing self-healing signout...');
              // Clear state and sign out
              set({ session: null, user: null, profile: null, isLoading: false });
              await supabase.auth.signOut();
              return;
            }
            throw upsertError;
          }
          set({ profile: newProfile as Profile });
        } else {
          throw error;
        }
      } else {
        set({ profile: data as Profile });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  },
}));
