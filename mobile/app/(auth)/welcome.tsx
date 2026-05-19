import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { useAppTheme } from '../../hooks/use-theme-color';
import { useGoogleAuth } from '../../hooks/use-google-auth';
import { useAppleAuth } from '../../hooks/use-apple-auth';

import { useThemeStore } from '../../stores/themeStore';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const activeTheme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const { signInWithGoogle } = useGoogleAuth();
  const { signInWithApple } = useAppleAuth();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Full background gradient */}
      <LinearGradient
        colors={activeTheme === 'light' 
          ? ['#FAFAFA', '#FFEBF0', '#FAFAFA'] 
          : ['#0F0F14', '#1A0A10', '#0F0F14']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Floating Theme Toggle in Top Right */}
      <TouchableOpacity 
        onPress={toggleTheme}
        style={{
          position: 'absolute',
          top: 60,
          right: 24,
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: theme.card,
          borderWidth: 1,
          borderColor: theme.border,
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10,
        }}
      >
        <Ionicons 
          name={activeTheme === 'light' ? 'moon-outline' : 'sunny-outline'} 
          size={22} 
          color={theme.text} 
        />
      </TouchableOpacity>

      {/* Glowing orbs */}
      <View style={[styles.orb, styles.orbTop, { backgroundColor: theme.primary }]} />
      <View style={[styles.orb, styles.orbBottom, { backgroundColor: theme.accent }]} />

      <SafeAreaView style={styles.safe}>
        {/* Logo area */}
        <View style={styles.hero}>
          <View style={[styles.logoRing, { shadowColor: theme.primary }]}>
            <LinearGradient
              colors={COLORS.gradients.warm}
              style={styles.logoGradient}
            >
              <Image
                source={require('../../assets/images/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </LinearGradient>
          </View>

          <Text style={[styles.appName, { color: theme.text }]}>Chana</Text>
          <Text style={[styles.tagline, { color: theme.textMuted }]}>Every connection starts with one.</Text>
        </View>

        {/* Action area */}
        <View style={styles.footer}>
          <View style={[styles.card, { 
            backgroundColor: activeTheme === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(26,26,36,0.9)',
            borderColor: theme.border
          }]}>
            <Button
              title="Continue with Google"
              variant="outline"
              style={styles.socialBtn}
              icon={<Ionicons name="logo-google" size={20} color={theme.text} />}
              onPress={signInWithGoogle}
            />
            <Button
              title="Continue with Apple"
              variant="outline"
              style={styles.socialBtn}
              icon={<Ionicons name="logo-apple" size={22} color={theme.text} />}
              onPress={signInWithApple}
            />

            <View style={styles.dividerRow}>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <Text style={[styles.dividerText, { color: theme.textMuted }]}>or</Text>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
            </View>

            <Button
              title="Sign up with Email"
              variant="primary"
              style={styles.emailBtn}
              icon={<Ionicons name="mail" size={20} color="#FFFFFF" />}
              onPress={() => router.push('/(auth)/register')}
            />

            <View style={styles.loginRow}>
              <Text style={[styles.loginText, { color: theme.textMuted }]}>Already have an account? </Text>
              <Text
                style={[styles.loginLink, { color: theme.primary }]}
                onPress={() => router.push('/(auth)/login')}
              >
                Log in
              </Text>
            </View>
          </View>

          <Text style={[styles.terms, { color: theme.textMuted }]}>
            By continuing you agree to our Terms & Privacy Policy
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1, justifyContent: 'space-between' },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.25,
  },
  orbTop: {
    width: 300,
    height: 300,
    backgroundColor: COLORS.primary,
    top: -80,
    right: -60,
  },
  orbBottom: {
    width: 250,
    height: 250,
    backgroundColor: COLORS.accent,
    bottom: 100,
    left: -80,
  },
  hero: {
    alignItems: 'center',
    paddingTop: height * 0.1,
  },
  logoRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    padding: 3,
    marginBottom: SPACING.lg,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  logoGradient: {
    flex: 1,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 60,
    height: 60,
  },
  appName: {
    fontFamily: FONTS.display,
    fontSize: 56,
    color: '#FFFFFF',
    marginBottom: SPACING.sm,
  },
  tagline: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
    fontStyle: 'italic',
    marginBottom: SPACING.xl,
  },
  decorRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: SPACING.sm,
  },
  decorEmoji: {
    fontSize: 22,
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  card: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: SPACING.md,
  },
  socialBtn: {
    marginBottom: SPACING.md,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontFamily: FONTS.body,
    color: 'rgba(255,255,255,0.3)',
    fontSize: 13,
  },
  emailBtn: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.xs,
  },
  loginText: {
    fontFamily: FONTS.body,
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
  },
  loginLink: {
    fontFamily: FONTS.bodyBold,
    color: COLORS.primary,
    fontSize: 14,
  },
  terms: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: 'rgba(255,255,255,0.25)',
    textAlign: 'center',
  },
});
