import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

/**
 * Configures how notifications are handled when the app is in the foreground.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Registers the device for push notifications and returns the Expo Push Token.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF4D6D',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      sound: 'default',
    });
  }

  // Check and request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('❌ Push notification permission not granted');
    return null;
  }
  
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    
    if (!projectId) {
      throw new Error('Project ID not found in expo config');
    }
    
    token = (await Notifications.getExpoPushTokenAsync({
      projectId,
      // Explicitly providing the experienceId helps routing on Android
      experienceId: `@malvern/Chana`, 
    })).data;
    console.log('✅ Generated Expo Push Token:', token);
  } catch (error) {
    console.error('❌ Error fetching Expo push token:', error);
  }

  return token;
}

/**
 * Updates the user's profile with their push token.
 */
export async function savePushToken(userId: string, token: string) {
  if (!userId || !token) return;
  
  try {
    console.log(`🔗 Requesting exclusive token link for ${userId}...`);
    
    // Call the secure RPC function to handle the exclusive assignment
    // Using t_ prefix to match the revised database function
    const { error } = await supabase.rpc('assign_push_token', {
      t_user_id: userId,
      t_token: token
    });

    if (error) throw error;
    console.log('✅ Push token exclusively assigned via RPC');
  } catch (error: any) {
    console.error('❌ Error saving push token via RPC:', error.message);
  }
}

/**
 * Sets up listeners for notification events.
 */
export function registerNotificationListeners(
  onReceived: (notification: Notifications.Notification) => void,
  onResponse: (response: Notifications.NotificationResponse) => void
) {
  const notificationListener = Notifications.addNotificationReceivedListener(onReceived);
  const responseListener = Notifications.addNotificationResponseReceivedListener(onResponse);

  return () => {
    notificationListener.remove();
    responseListener.remove();
  };
}
