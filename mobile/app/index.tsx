import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/theme';

const Index = () => {
  const { session, profile, isLoading } = useAuthStore();

  // While auth state is being resolved, show nothing (splash screen handles it)
  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (session) {
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
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Index;
