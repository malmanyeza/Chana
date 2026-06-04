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
        (async () => {
          try {
            // Safe check for native GoogleSignin module existence
            if (GoogleSignin && typeof GoogleSignin.signOut === 'function') {
              // Sign out from Google only if signed in
              const isSignedIn = await GoogleSignin.isSignedIn();
              if (isSignedIn) {
                await GoogleSignin.signOut();
              }
            }
          } catch (e) {
            console.log('GoogleSignin signOut skipped or failed:', e);
          }
        })(),
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
          // Get the current user email to detect reviewer/admin accounts
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          const email = currentUser?.email?.toLowerCase();
          const isReviewer = email === 'appreview@chana.com' || email === 'apple@chana.com' || email === 'admin@chana.com';

          const profileData = isReviewer ? {
            id: userId,
            full_name: email.includes('admin') ? 'System Admin' : 'App Reviewer',
            avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
            birth_date: '1995-01-01',
            gender: 'man',
            bio: 'Testing and exploring Chana.',
            interests: ['Travel', 'Music', 'Movies', 'Sports', 'Cooking'],
            photos: ['https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=500&q=80'],
            preferences: { ageRange: [18, 50], genderPreference: 'everyone', distancePreference: 50 },
            location_city: 'Harare',
            country: 'Zimbabwe',
            latitude: -17.8252,
            longitude: 31.0335,
            is_premium: true,
            premium_until: '2035-12-31T23:59:59Z',
            is_onboarded: true
          } : {
            id: userId,
            is_onboarded: false
          };

          // 2. Profile doesn't exist, create it. 
          // Using upsert handles race conditions where it might be created simultaneously.
          const { data: newProfile, error: upsertError } = await supabase
            .from('profiles')
            .upsert(profileData, { onConflict: 'id' })
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
