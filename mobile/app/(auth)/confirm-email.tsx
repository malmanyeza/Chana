import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { useAppTheme } from '../../hooks/use-theme-color';
import { supabase } from '../../lib/supabase';

export default function ConfirmEmailScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [resendError, setResendError] = useState<string | undefined>();

  const handleResend = async () => {
    setResendError(undefined);
    setResending(true);
    try {
      // Get the current unconfirmed user's email from the session
      const { data: { session } } = await supabase.auth.getSession();
      const email = session?.user?.email;
      if (!email) {
        setResendError('Could not find your email. Please go back and sign up again.');
        return;
      }
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) {
        setResendError(error.message);
      } else {
        setResent(true);
        setTimeout(() => setResent(false), 5000);
      }
    } catch {
      setResendError('Something went wrong. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={['rgba(108,99,255,0.12)', 'transparent']}
        style={styles.topAccent}
      />

      <View style={styles.inner}>
        {/* Illustration */}
        <View style={[styles.iconCircle, { backgroundColor: `${COLORS.accent}18`, borderColor: `${COLORS.accent}30` }]}>
          <LinearGradient
            colors={['#6C63FF', '#FF4D6D']}
            style={styles.iconGradient}
          >
            <Ionicons name="mail" size={40} color="#FFF" />
          </LinearGradient>
        </View>

        <Text style={[styles.title, { color: theme.text }]}>Check Your Inbox</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          We've sent a verification link to your email address. Open it to activate your account and start connecting.
        </Text>

        {/* Steps */}
        <View style={[styles.stepsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {[
            { icon: 'mail-open-outline', label: 'Open your email app' },
            { icon: 'link-outline', label: 'Click the verification link' },
            { icon: 'heart-outline', label: 'Come back and log in' },
          ].map((step, i) => (
            <View key={i} style={[styles.stepRow, i < 2 && { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
              <View style={[styles.stepIconWrap, { backgroundColor: `${theme.primary}15` }]}>
                <Ionicons name={step.icon as any} size={18} color={theme.primary} />
              </View>
              <Text style={[styles.stepLabel, { color: theme.text }]}>{step.label}</Text>
              <View style={[styles.stepNum, { backgroundColor: theme.border }]}>
                <Text style={[styles.stepNumText, { color: theme.textMuted }]}>{i + 1}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Resend section */}
        {resent ? (
          <View style={[styles.successBanner, { backgroundColor: `${theme.success}15`, borderColor: `${theme.success}35` }]}>
            <Ionicons name="checkmark-circle" size={18} color={theme.success} style={{ marginRight: 8 }} />
            <Text style={[styles.successText, { color: theme.success }]}>
              Verification email resent! Check your inbox.
            </Text>
          </View>
        ) : resendError ? (
          <View style={[styles.errorBanner, { backgroundColor: `${theme.error}15`, borderColor: `${theme.error}35` }]}>
            <Ionicons name="alert-circle" size={18} color={theme.error} style={{ marginRight: 8 }} />
            <Text style={[styles.errorText, { color: theme.error }]}>{resendError}</Text>
          </View>
        ) : null}

        <Text style={[styles.resendHint, { color: theme.textMuted }]}>
          Didn't receive it? Check your spam folder or{' '}
        </Text>
        <TouchableOpacity onPress={handleResend} disabled={resending} style={styles.resendBtn}>
          {resending
            ? <Text style={[styles.resendLink, { color: theme.primary, opacity: 0.5 }]}>Sending…</Text>
            : <Text style={[styles.resendLink, { color: theme.primary }]}>resend the email</Text>
          }
        </TouchableOpacity>

        {/* Go to login */}
        <Button
          title="Go to Login"
          variant="outline"
          onPress={() => router.replace('/(auth)/login')}
          style={styles.loginBtn}
        />
      </View>
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
  inner: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl * 1.5,
    alignItems: 'center',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    marginBottom: SPACING.xl,
    overflow: 'hidden',
  },
  iconGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: 36,
    textAlign: 'center',
    marginBottom: SPACING.md,
    lineHeight: 42,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.sm,
  },
  stepsCard: {
    width: '100%',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.xl,
    overflow: 'hidden',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    gap: SPACING.md,
  },
  stepIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepLabel: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 14,
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 11,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    width: '100%',
  },
  successText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    flex: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    width: '100%',
  },
  errorText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    flex: 1,
  },
  resendHint: {
    fontFamily: FONTS.body,
    fontSize: 13,
    textAlign: 'center',
  },
  resendBtn: {
    marginBottom: SPACING.xl,
  },
  resendLink: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
  },
  loginBtn: {
    width: '100%',
  },
});
