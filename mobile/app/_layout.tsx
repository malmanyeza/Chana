import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
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
import { useRouter, useSegments } from 'expo-router';
import { AuthLoadingScreen } from '@/components/ui/AuthLoadingScreen';
import * as NotificationService from '@/services/notificationService';
import * as Location from 'expo-location';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { session, profile, isLoading, setSession, setUser, setLoading, fetchProfile, isSeeding } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  const [loaded, error] = useFonts({
    CormorantGaramond_700Bold,
    Nunito_400Regular,
    Nunito_700Bold,
    Pacifico_400Regular,
  });

  useEffect(() => {
    let sessionTimeoutId: NodeJS.Timeout;
    let authTimeoutId: NodeJS.Timeout;

    // Initialize session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error || !session) {
        // If there's an error (like Invalid Refresh Token), clear everything
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }
      
      setSession(session);
      setUser(session.user);
      
      // Set a fallback safety timeout of 3.5s to prevent infinite loading spinners on cold-starts/offline
      sessionTimeoutId = setTimeout(() => {
        console.log('⏳ Session profile fetch timed out. Settle gracefully.');
        setLoading(false);
      }, 3500);

      fetchProfile(session.user.id).finally(() => {
        clearTimeout(sessionTimeoutId);
        setLoading(false);
      });
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setLoading(true); // Ensure we show loading while fetching new profile
        
        // Safety timeout for auth changes
        authTimeoutId = setTimeout(() => {
          console.log('⏳ Auth change profile fetch timed out. Settle gracefully.');
          setLoading(false);
        }, 3500);

        fetchProfile(session.user.id).finally(() => {
          clearTimeout(authTimeoutId);
          setLoading(false);
        });
      } else {
        useAuthStore.getState().setProfile(null);
        setLoading(false);
      }
    });

    // Initialize Push Notifications
    const cleanupNotifications = NotificationService.registerNotificationListeners(
      (notification) => {
        // Handle foreground notification
        console.log('Notification received in foreground:', notification);
      },
      (response) => {
        // Handle notification response (tap)
        const { actionIdentifier, notification: { request: { content: { data } } } } = response;
        console.log('Notification tapped:', data);
        
        // Deep link logic could go here based on data.type (e.g. 'message', 'match')
        if (data?.matchId) {
          router.push(`/(tabs)/messages/${data.matchId}`);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      cleanupNotifications();
      if (sessionTimeoutId) clearTimeout(sessionTimeoutId);
      if (authTimeoutId) clearTimeout(authTimeoutId);
    };
  }, []);

  useEffect(() => {
    // Always attempt to register/verify token when logged in
    if (session?.user && profile) {
      NotificationService.registerForPushNotificationsAsync().then(token => {
        if (token) {
          NotificationService.savePushToken(session.user.id, token);
        }
      });
    }
  }, [session?.user?.id, profile?.id, profile?.push_token]);

  useEffect(() => {
    // Request location permissions and update user's location in DB on startup
    if (session?.user && profile) {
      (async () => {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            const { latitude, longitude } = location.coords;
            
            // Update profile with new coords in Supabase
            const { error } = await supabase
              .from('profiles')
              .update({
                latitude,
                longitude,
                updated_at: new Date().toISOString()
              })
              .eq('id', session.user.id);
            
            if (error) throw error;
            console.log('📍 Location updated successfully on startup:', latitude, longitude);
            
            // Also update the locally cached profile in authStore
            const currentProfile = useAuthStore.getState().profile;
            if (currentProfile) {
              useAuthStore.getState().setProfile({
                ...currentProfile,
                latitude,
                longitude
              });
            }
          }
        } catch (e) {
          console.error('📍 Error updating location:', e);
        }
      })();
    }
  }, [session?.user?.id, profile?.id]);

  useEffect(() => {
    // Hide splash screen as soon as fonts are loaded so the user transitions
    // immediately to our interactive loading screen instead of a frozen splash.
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  useEffect(() => {
    // Wait for fonts AND auth/profile loading to finish before redirecting
    // CRITICAL: If we have a session, we MUST wait for the profile to load 
    // to avoid flickering to the onboarding screen (unless we are admin).
    const isAdmin = session?.user?.email === 'admin@chana.com';
    if (isSeeding || !loaded || isLoading || (session && !profile && !isAdmin)) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';
    const inAdminGroup = segments[0] === 'admin';

    if (!session) {
      // Not logged in: force to auth group if not already there
      if (!inAuthGroup) {
        router.replace('/(auth)/welcome');
      }
    } else if (isAdmin) {
      // Admin: force to admin index if not already in admin group
      if (!inAdminGroup) {
        router.replace('/admin');
      }
    } else {
      // Logged in normal user: check onboarding status
      if (profile?.is_onboarded) {
        // Onboarded: force to tabs if in auth or onboarding
        if (inAuthGroup || inOnboardingGroup || segments.length === 0) {
          router.replace('/(tabs)/discover');
        }
      } else {
        // Not onboarded: force to onboarding if not already there
        if (!inOnboardingGroup) {
          router.replace('/(onboarding)/about');
        }
      }
    }
  }, [session, profile?.is_onboarded, isLoading, segments, loaded]);

  if (!loaded || isLoading) {
    return <AuthLoadingScreen />;
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
        <Stack 
          screenOptions={{ 
            headerShown: false,
            animation: 'slide_from_right',
            animationDuration: 300,
            gestureEnabled: true,
          }}
        >
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
