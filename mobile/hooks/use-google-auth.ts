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
        setLoading(false);
        return; // Just stop here instead of throwing an error
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) throw error;
      
      return data;
    } catch (error: any) {
      setLoading(false);
      // If the user cancelled, we just stop without showing an error alert
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled Google Sign-In');
        return;
      }

      console.error('Google Sign-In Error:', error);
      
      // Check for Google Sign-In Developer Error (Code 10)
      if (error.code === '10' || error.code === 10 || String(error.code) === '10') {
        Alert.alert(
          'Google Configuration Required 🔑',
          'This is a "DEVELOPER_ERROR" (Code 10).\n\nThis happens because the SHA-1 certificate fingerprint of this specific Android build is not registered in your Google Cloud / Firebase Console.\n\nHow to solve:\n1. Go to your Expo Dashboard -> Chana -> Credentials.\n2. Copy the Android SHA-1 Fingerprint.\n3. Go to Firebase Console -> Project Settings -> Your Android App.\n4. Click "Add Fingerprint", paste the SHA-1 key, and save.\n5. Wait 5 minutes for Google to sync and try signing in again!',
          [{ text: 'Got it, let me do that!' }]
        );
        return;
      }

      if (error.code !== 'ASYNC_OP_IN_PROGRESS') {
        Alert.alert('Sign In Error', error.message || 'Failed to sign in with Google');
      }
    }
  };

  return { signInWithGoogle };
};
