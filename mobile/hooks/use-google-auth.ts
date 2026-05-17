import { supabase } from '../lib/supabase';
import { GoogleSignin, statusCodes } from '../lib/google-auth';
import { useAuthStore } from '../stores/authStore';
import { Alert } from 'react-native';

export const useGoogleAuth = () => {
  const { setLoading } = useAuthStore();

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      console.log('Google SignIn Response:', JSON.stringify(userInfo, null, 2));
      
      const idToken = userInfo.data?.idToken;

      if (!idToken) {
        // Log the full object to see if it's a cancellation disguised as a success
        console.log('Missing ID Token. Full response:', JSON.stringify(userInfo, null, 2));
        return; // Just stop here instead of throwing an error
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) throw error;
      
      return data;
    } catch (error: any) {
      // If the user cancelled, we just stop without showing an error alert
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled Google Sign-In');
        return;
      }

      console.error('Google Sign-In Error:', error);
      if (error.code !== 'ASYNC_OP_IN_PROGRESS') {
        Alert.alert('Sign In Error', error.message || 'Failed to sign in with Google');
      }
    } finally {
      setLoading(false);
    }
  };

  return { signInWithGoogle };
};
