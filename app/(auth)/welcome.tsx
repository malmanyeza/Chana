import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ImageBackground, 
  Dimensions,
  SafeAreaView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { Button } from '../../components/ui/Button';

import { useAppTheme } from '../../hooks/use-theme-color';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const theme = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Background Decor (blurred profile previews placeholder) */}
      <View style={[styles.backgroundDecor, { backgroundColor: theme.card }]}>
        <LinearGradient
          colors={['transparent', theme.background]}
          style={styles.gradient}
        />
      </View>

      <SafeAreaView style={styles.content}>
        <View style={styles.header}>
          <Image 
            source={require('../../assets/images/logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.title, { color: theme.text }]}>Chana</Text>
          <Text style={[styles.tagline, { color: theme.textMuted }]}>"Every connection starts with one."</Text>
        </View>

        <View style={styles.footer}>
          <Button 
            title="Continue with Google" 
            variant="outline"
            style={[styles.socialButton, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push('/(auth)/login')}
          />
          <Button 
            title="Continue with Apple" 
            variant="outline"
            style={[styles.socialButton, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push('/(auth)/login')}
          />
          <Button 
            title="Sign up with Email" 
            variant="primary"
            style={styles.socialButton}
            onPress={() => router.push('/(auth)/register')}
          />

          <View style={styles.loginRow}>
            <Text style={[styles.loginText, { color: theme.textMuted }]}>Already have an account? </Text>
            <Text 
              style={styles.loginLink} 
              onPress={() => router.push('/(auth)/login')}
            >
              Log in
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundDecor: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginTop: height * 0.15,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: SPACING.md,
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: 48,
    marginBottom: SPACING.xs,
  },
  tagline: {
    fontFamily: FONTS.body,
    fontSize: 18,
    textAlign: 'center',
  },
  footer: {
    marginBottom: SPACING.xl,
  },
  socialButton: {
    marginBottom: SPACING.md,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.md,
  },
  loginText: {
    fontFamily: FONTS.body,
    fontSize: 14,
  },
  loginLink: {
    fontFamily: FONTS.bodyBold,
    color: COLORS.primary,
    fontSize: 14,
  },
});
