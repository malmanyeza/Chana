import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { 
  useFonts,
  CormorantGaramond_700Bold 
} from '@expo-google-fonts/cormorant-garamond';
import { 
  Nunito_400Regular, 
  Nunito_700Bold 
} from '@expo-google-fonts/nunito';
import { 
  Pacifico_400Regular 
} from '@expo-google-fonts/pacifico';

import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

import { useRouter, useSegments } from 'expo-router';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { session, profile, setSession, setUser, fetchProfile } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  
  const [loaded, error] = useFonts({
    CormorantGaramond_700Bold,
    Nunito_400Regular,
    Nunito_700Bold,
    Pacifico_400Regular,
  });

  useEffect(() => {
    // Initialize session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        useAuthStore.getState().setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  useEffect(() => {
    if (!loaded) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/welcome');
    } else if (session && (inAuthGroup || inOnboardingGroup)) {
      if (profile && !profile.is_onboarded && !inOnboardingGroup) {
        router.replace('/(onboarding)/about');
      } else if (profile?.is_onboarded && (inAuthGroup || inOnboardingGroup)) {
        router.replace('/(tabs)/discover');
      }
    }
  }, [session, profile, segments, loaded]);

  if (!loaded && !error) {
    return null;
  }

  const navigationTheme = colorScheme === 'dark' ? {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: '#FF4D6D',
      background: '#0F0F14',
      card: '#1A1A24',
      text: '#F0EEF8',
      border: '#2A2A34',
      notification: '#FF4D6D',
    },
  } : {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: '#FF4D6D',
      background: '#FAFAFA',
      card: '#FFFFFF',
      text: '#0F0F14',
      border: '#EEEEEE',
      notification: '#FF4D6D',
    },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={navigationTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
