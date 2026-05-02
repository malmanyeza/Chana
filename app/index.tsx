import { Redirect } from 'expo-router';

const Index = () => {
  // BYPASS: Setting to true to skip login for now
  const hasSession = true;

  if (hasSession) {
    // Redirect to onboarding to test the flow
    return <Redirect href="/(onboarding)/photos" />;
  }

  return <Redirect href="/(auth)/welcome" />;
};

export default Index;
