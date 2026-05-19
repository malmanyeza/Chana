import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { Alert, Platform } from 'react-native';

export const useAppleAuth = () => {
  const { setLoading } = useAuthStore();

  const signInWithApple = async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert('Not Supported', 'Sign in with Apple is only available on iOS devices.');
      return;
    }

    try {
      setLoading(true);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential.identityToken) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        });

        if (error) throw error;
        return data;
      } else {
        throw new Error('No identity token found from Apple');
      }
    } catch (error: any) {
      setLoading(false);
      if (error.code !== 'ERR_CANCELED') {
        console.error('Apple Sign-In Error:', error);
        Alert.alert('Sign In Error', error.message || 'Failed to sign in with Apple');
      }
    }
  };

  return { signInWithApple };
};
