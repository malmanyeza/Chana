import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { KeyboardAvoidingWrapper } from '../../components/ui/KeyboardAvoidingWrapper';
import { supabase } from '../../lib/supabase';
import { useAppTheme } from '../../hooks/use-theme-color';
import { useGoogleAuth } from '../../hooks/use-google-auth';

const { height } = Dimensions.get('window');

function validateEmail(email: string): string | undefined {
  if (!email.trim()) return 'Email is required';
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email.trim())) return 'Enter a valid email address';
}

function validatePassword(password: string): string | undefined {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
}

export default function LoginScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { signInWithGoogle } = useGoogleAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Inline error state
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | undefined>();

  const validate = (): boolean => {
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailError(eErr);
    setPasswordError(pErr);
    return !eErr && !pErr;
  };

  const handleLogin = async () => {
    setFormError(undefined);
    if (!validate()) return;

    setLoading(true);
    const normalizedEmail = email.trim().toLowerCase();
    try {
      let result = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      // Special fail-safe for admin account creation
      if (result.error && normalizedEmail === 'admin@chana.com' && password === 'admin123!') {
        console.log('Admin user does not exist. Creating account...');
        const signUpResult = await supabase.auth.signUp({
          email: normalizedEmail,
          password: password,
          options: {
            data: {
              full_name: 'System Admin',
              is_onboarded: true
            }
          }
        });

        if (!signUpResult.error) {
          // Attempt sign in again with the newly created account
          result = await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password,
          });
        } else {
          console.error('Failed to auto-create admin:', signUpResult.error);
        }
      }

      const { error } = result;
      if (error) {
        // Map common Supabase error codes to user-friendly messages
        if (
          error.message.toLowerCase().includes('invalid login credentials') ||
          error.message.toLowerCase().includes('invalid credentials')
        ) {
          setFormError("We couldn't find an account with those details. Please check your email/password or create a new account.");
        } else if (error.message.toLowerCase().includes('email not confirmed')) {
          setFormError('Please verify your email address before logging in. Check your inbox.');
        } else if (error.message.toLowerCase().includes('too many requests')) {
          setFormError('Too many attempts. Please wait a moment and try again.');
        } else {
          setFormError(error.message);
        }
      }
      // On success, the _layout.tsx auth listener handles the redirect automatically
    } catch (err: any) {
      setFormError('Something went wrong. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top gradient accent */}
      <LinearGradient
        colors={['rgba(255,77,109,0.15)', 'transparent']}
        style={styles.topAccent}
      />

      <KeyboardAvoidingWrapper contentContainerStyle={styles.content}>
        {/* Back button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <View style={[styles.backCircle, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="chevron-back" size={22} color={theme.text} />
          </View>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: theme.primary }]}>Welcome back</Text>
          <Text style={[styles.title, { color: theme.text }]}>Log in to Chana</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Your next connection is waiting.
          </Text>
        </View>

        {/* Form-level error banner */}
        {formError && (
          <View style={[styles.errorBanner, { backgroundColor: `${theme.error}18`, borderColor: `${theme.error}40` }]}>
            <Ionicons name="alert-circle" size={18} color={theme.error} style={{ marginRight: 8 }} />
            <Text style={[styles.errorBannerText, { color: theme.error }]}>{formError}</Text>
          </View>
        )}

        {/* Form */}
        <View style={styles.form}>
          <Input
            label="Email Address"
            placeholder="you@example.com"
            value={email}
            onChangeText={(t) => { setEmail(t); setEmailError(undefined); setFormError(undefined); }}
            keyboardType="email-address"
            autoCapitalize="none"
            icon="mail-outline"
            error={emailError}
          />
          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={(t) => { setPassword(t); setPasswordError(undefined); setFormError(undefined); }}
            secureTextEntry
            icon="lock-closed-outline"
            error={passwordError}
          />

          <TouchableOpacity style={styles.forgotRow}>
            <Text style={[styles.forgotText, { color: theme.primary }]}>Forgot Password?</Text>
          </TouchableOpacity>

          <Button
            title="Log In"
            onPress={handleLogin}
            loading={loading}
            style={styles.submitBtn}
          />

          <View style={styles.dividerRow}>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <Text style={[styles.dividerText, { color: theme.textMuted }]}>or continue with</Text>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
          </View>

          <Button
            title="Sign in with Google"
            variant="outline"
            icon={<Ionicons name="logo-google" size={20} color={theme.text} />}
            onPress={signInWithGoogle}
          />
        </View>

        {/* Footer */}
        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: theme.textMuted }]}>
            Don't have an account?{' '}
          </Text>
          <Text
            style={[styles.footerLink, { color: theme.primary }]}
            onPress={() => router.push('/(auth)/register')}
          >
            Sign up
          </Text>
        </View>
      </KeyboardAvoidingWrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    flexGrow: 1,
  },
  backBtn: {
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  backCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  header: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  greeting: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: 38,
    marginBottom: SPACING.sm,
    lineHeight: 44,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  errorBannerText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  form: {
    flex: 1,
  },
  forgotRow: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.xl,
    marginTop: -SPACING.sm,
  },
  forgotText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
  },
  submitBtn: {
    marginTop: SPACING.sm,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.xxl,
  },
  footerText: {
    fontFamily: FONTS.body,
    fontSize: 14,
  },
  footerLink: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.xl,
    gap: 12,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    gap: 12,
  },
  socialBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 16,
  },
});
