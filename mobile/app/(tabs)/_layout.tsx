import React from 'react';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../hooks/use-theme-color';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS } from '../../constants/theme';
import { useAuthStore } from '../../stores/authStore';
import { useBadgeStore } from '../../stores/badgeStore';

export default function TabLayout() {
  const theme = useAppTheme();
  const colorScheme = useColorScheme();
  const { user } = useAuthStore();
  const { likesCount, unmessagedMatchesCount, fetchCounts, setupSubscriptions } = useBadgeStore();

  React.useEffect(() => {
    if (user) {
      fetchCounts(user.id);
      const unsubscribe = setupSubscriptions(user.id);
      return unsubscribe;
    }
  }, [user]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontFamily: FONTS.bodyBold,
          fontSize: 11,
          marginBottom: Platform.OS === 'android' ? 2 : 0,
        },
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 0,
          elevation: 0,
          height: Platform.OS === 'ios' ? 84 : 68,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : theme.card,
          borderTopColor: theme.border,
        },
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView
              intensity={90}
              tint={colorScheme === 'dark' ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        tabBarBadgeStyle: {
          backgroundColor: theme.primary,
          color: '#FFF',
          fontFamily: FONTS.bodyBold,
          fontSize: 10,
          marginTop: -2,
          borderWidth: 1.5,
          borderColor: theme.background,
          minWidth: 18,
          height: 18,
          borderRadius: 9,
          lineHeight: 15,
        }
      }}
    >
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'flame' : 'flame-outline'} size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="likes"
        options={{
          title: 'Likes',
          tabBarBadge: likesCount > 0 ? likesCount : undefined,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'heart' : 'heart-outline'} size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: 'Matches',
          tabBarBadge: unmessagedMatchesCount > 0 ? unmessagedMatchesCount : undefined,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'} size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={26} color={color} />
          ),
        }}
      />
      {/* Hidden screens - no tab icon */}
      <Tabs.Screen 
        name="messages/[matchId]" 
        options={{ 
          href: null,
          tabBarStyle: { display: 'none' }
        }} 
      />
      <Tabs.Screen name="edit-profile" options={{ href: null }} />
      <Tabs.Screen 
        name="settings" 
        options={{ 
          href: null,
          tabBarStyle: { display: 'none' } 
        }} 
      />
      <Tabs.Screen 
        name="privacy-policy" 
        options={{ 
          href: null,
          tabBarStyle: { display: 'none' } 
        }} 
      />
      <Tabs.Screen 
        name="terms-of-use" 
        options={{ 
          href: null,
          tabBarStyle: { display: 'none' } 
        }} 
      />
      <Tabs.Screen 
        name="safety-guidelines" 
        options={{ 
          href: null,
          tabBarStyle: { display: 'none' } 
        }} 
      />
    </Tabs>
  );
}
