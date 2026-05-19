import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
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

function validateEmail(email: string): string | undefined {
  if (!email.trim()) return 'Email is required';
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email.trim())) return 'Enter a valid email address';
}

function validatePassword(password: string): string | undefined {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
}

export default function RegisterScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Inline field errors
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [confirmError, setConfirmError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | undefined>();

  const validate = (): boolean => {
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    const cErr = !confirmPassword
      ? 'Please confirm your password'
      : password !== confirmPassword
        ? 'Passwords do not match'
        : undefined;
    setEmailError(eErr);
    setPasswordError(pErr);
    setConfirmError(cErr);
    return !eErr && !pErr && !cErr;
  };

  const handleRegister = async () => {
    setFormError(undefined);
    if (!validate()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        if (error.message.toLowerCase().includes('already registered') ||
            error.message.toLowerCase().includes('user already exists')) {
          setEmailError('An account with this email already exists. Try logging in instead.');
        } else if (error.message.toLowerCase().includes('invalid email')) {
          setEmailError('This email address is not valid.');
        } else if (error.message.toLowerCase().includes('password')) {
          setPasswordError(error.message);
        } else {
          setFormError(error.message);
        }
        return;
      }

      if (data.user) {
        // Create a stub profile row so the layout guard can read is_onboarded
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{ id: data.user.id, is_onboarded: false }]);

        // Ignore duplicate profile errors (user re-registers or profile already exists)
        if (profileError && profileError.code !== '23505') {
          console.warn('Profile insert warning:', profileError.message);
        }
      }

      // Navigate to email confirmation screen
      router.replace('/(auth)/confirm-email');
    } catch (err: any) {
      setFormError('Something went wrong. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={['rgba(108,99,255,0.15)', 'transparent']}
        style={styles.topAccent}
      />

      <KeyboardAvoidingWrapper contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <View style={[styles.backCircle, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="chevron-back" size={22} color={theme.text} />
          </View>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={[styles.greeting, { color: theme.accent }]}>Start your journey</Text>
          <Text style={[styles.title, { color: theme.text }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Join thousands finding real connections.
          </Text>
        </View>

        {/* Form-level error banner */}
        {formError && (
          <View style={[styles.errorBanner, { backgroundColor: `${theme.error}18`, borderColor: `${theme.error}40` }]}>
            <Ionicons name="alert-circle" size={18} color={theme.error} style={{ marginRight: 8 }} />
            <Text style={[styles.errorBannerText, { color: theme.error }]}>{formError}</Text>
          </View>
        )}

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
            placeholder="Min. 6 characters"
            value={password}
            onChangeText={(t) => { setPassword(t); setPasswordError(undefined); setFormError(undefined); }}
            secureTextEntry
            icon="lock-closed-outline"
            error={passwordError}
          />
          <Input
            label="Confirm Password"
            placeholder="Repeat your password"
            value={confirmPassword}
            onChangeText={(t) => { setConfirmPassword(t); setConfirmError(undefined); setFormError(undefined); }}
            secureTextEntry
            icon="shield-checkmark-outline"
            error={confirmError}
          />

          {/* Password strength hint */}
          {password.length > 0 && (
            <View style={styles.strengthRow}>
              {[...Array(4)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.strengthBar,
                    {
                      backgroundColor: password.length > i * 3
                        ? password.length >= 12 ? theme.success
                          : password.length >= 8 ? theme.secondary
                          : theme.error
                        : theme.border,
                    },
                  ]}
                />
              ))}
              <Text style={[styles.strengthLabel, { color: theme.textMuted }]}>
                {password.length < 6 ? 'Too short' : password.length < 8 ? 'Weak' : password.length < 12 ? 'Good' : 'Strong'}
              </Text>
            </View>
          )}

          <Button
            title="Create Account"
            onPress={handleRegister}
            loading={loading}
            style={styles.submitBtn}
            icon={<Ionicons name="arrow-forward" size={20} color="#FFFFFF" />}
          />
        </View>

        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: theme.textMuted }]}>
            Already have an account?{' '}
          </Text>
          <Text
            style={[styles.footerLink, { color: theme.primary }]}
            onPress={() => router.push('/(auth)/login')}
          >
            Log in
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
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.md,
    marginTop: -SPACING.sm,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontFamily: FONTS.body,
    fontSize: 11,
    minWidth: 48,
    textAlign: 'right',
  },
  submitBtn: {
    marginTop: SPACING.md,
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
});
