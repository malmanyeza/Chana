import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, Shield, ArrowRight, Loader2, Sparkles } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('admin@chana.com');
  const [password, setPassword] = useState('admin123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Try to sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (signInError) {
        // 2. If user doesn't exist or wrong credentials, check if it is the admin@chana.com account.
        // We will optimistically attempt a sign up to self-initialize the admin!
        if (
          email.trim().toLowerCase() === 'admin@chana.com' &&
          (signInError.message.includes('Invalid login credentials') || signInError.message.includes('Email not confirmed'))
        ) {
          console.log('[Auth] Admin account missing or unconfirmed. Bootstrapping admin account...');
          const { error: signUpError } = await supabase.auth.signUp({
            email: email.trim(),
            password: password.trim(),
            options: {
              data: {
                full_name: 'Chana Administrator',
                is_admin: true,
              }
            }
          });

          if (signUpError) {
            throw new Error(`Failed to bootstrap admin: ${signUpError.message}`);
          }

          // Automatically log them in after sign up
          const { error: secondSignInError } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password.trim(),
          });

          if (secondSignInError) {
            throw new Error(`Sign up succeeded but sign in failed: ${secondSignInError.message}`);
          }

          setSuccess(true);
          return;
        }

        throw signInError;
      }

      if (signInData.user && signInData.user.email !== 'admin@chana.com') {
        // Log out immediately if not the official admin email
        await supabase.auth.signOut();
        throw new Error('Access denied. This dashboard is restricted to Chana Administrators.');
      }

      setSuccess(true);
    } catch (err: any) {
      console.error('[Auth Error]', err);
      setError(err.message || 'An unexpected error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Abstract Glowing Background Orbs */}
      <div style={styles.glowOrb1} />
      <div style={styles.glowOrb2} />

      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.iconContainer}>
            <Shield size={32} color="#FF5722" />
          </div>
          <h2 style={styles.title}>Chana Admin</h2>
          <p style={styles.subtitle}>Secure Administrator Portal</p>
        </div>

        {error && (
          <div style={styles.errorAlert}>
            <span style={{ fontSize: 13, lineHeight: 1.4 }}>{error}</span>
          </div>
        )}

        {success && (
          <div style={styles.successAlert}>
            <Sparkles size={16} style={{ marginRight: 8 }} />
            <span>Authenticated successfully! Redirecting...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Admin Email</label>
            <div style={styles.inputWrapper}>
              <Mail size={18} color="var(--text-muted)" style={styles.inputIcon} />
              <input
                type="email"
                placeholder="admin@chana.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                disabled={loading || success}
                required
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Security Password</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} color="var(--text-muted)" style={styles.inputIcon} />
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                disabled={loading || success}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            style={{
              ...styles.submitBtn,
              opacity: loading || success ? 0.8 : 1,
              cursor: loading || success ? 'not-allowed' : 'pointer',
            }}
            disabled={loading || success}
          >
            {loading ? (
              <>
                <Loader2 size={18} style={styles.spinner} />
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight size={18} style={{ marginLeft: 8 }} />
              </>
            )}
          </button>
        </form>

        <div style={styles.footer}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Authorized Access Only. IP address is logged for security audits.
          </span>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    width: '100vw',
    backgroundColor: '#07070A',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "var(--font-body)",
  },
  glowOrb1: {
    position: 'absolute',
    top: '20%',
    left: '25%',
    width: '350px',
    height: '350px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(255, 87, 34, 0.12) 0%, transparent 70%)',
    filter: 'blur(40px)',
    zIndex: 1,
    pointerEvents: 'none',
  },
  glowOrb2: {
    position: 'absolute',
    bottom: '20%',
    right: '25%',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(233, 30, 99, 0.08) 0%, transparent 70%)',
    filter: 'blur(50px)',
    zIndex: 1,
    pointerEvents: 'none',
  },
  card: {
    position: 'relative',
    zIndex: 10,
    width: '100%',
    maxWidth: '440px',
    padding: '40px',
    borderRadius: '24px',
    backgroundColor: 'rgba(20, 20, 28, 0.75)',
    border: '1px solid rgba(255, 255, 255, 0.07)',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    boxSizing: 'border-box',
  },
  header: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  iconContainer: {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    backgroundColor: 'rgba(255, 87, 34, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '8px',
    border: '1px solid rgba(255, 87, 34, 0.15)',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: '28px',
    fontWeight: 700,
    color: '#FFFFFF',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--text-muted)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#D1D1E0',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '16px',
  },
  input: {
    width: '100%',
    height: '48px',
    paddingLeft: '48px',
    paddingRight: '16px',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    color: '#FFFFFF',
    fontSize: '15px',
    outline: 'none',
    transition: 'all 0.2s ease',
  },
  submitBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '50px',
    backgroundColor: '#FF5722',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 600,
    transition: 'all 0.2s ease',
    marginTop: '8px',
    boxShadow: '0 4px 15px rgba(255, 87, 34, 0.3)',
  },
  spinner: {
    animation: 'spin 1s linear infinite',
    marginRight: '8px',
  },
  errorAlert: {
    backgroundColor: 'rgba(255, 77, 77, 0.1)',
    border: '1px solid rgba(255, 77, 77, 0.2)',
    borderRadius: '12px',
    color: '#FF4D4D',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
  },
  successAlert: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    border: '1px solid rgba(76, 175, 80, 0.2)',
    borderRadius: '12px',
    color: '#4CAF50',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
  },
  footer: {
    textAlign: 'center',
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    paddingTop: '16px',
  },
};
