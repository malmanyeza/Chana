import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAppTheme } from '@/hooks/use-theme-color';

const Index = () => {
  const { session, profile, isLoading } = useAuthStore();
  const theme = useAppTheme();

  // While auth state is being resolved, show nothing (splash screen handles it)
  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (session) {
    if (session.user?.email === 'admin@chana.com') {
      return <Redirect href="/admin" />;
    }
    if (profile?.is_onboarded) {
      return <Redirect href="/(tabs)/discover" />;
    } else {
      return <Redirect href="/(onboarding)/about" />;
    }
  }

  return <Redirect href="/(auth)/welcome" />;
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Index;
