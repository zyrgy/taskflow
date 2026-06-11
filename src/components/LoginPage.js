import React from 'react';
import { signInWithGoogle } from '../lib/supabase';

export default function LoginPage() {
  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.brand}>
          <span style={styles.brandMark}>TF</span>
          <h1 style={styles.brandName}>TaskFlow</h1>
        </div>
        <p style={styles.subtitle}>Sign in to access your tasks</p>
        <button style={styles.googleBtn} onClick={signInWithGoogle}>
          <svg width="18" height="18" viewBox="0 0 18 18" style={{ flexShrink: 0 }}>
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
          </svg>
          Continue with Google
        </button>
        <p style={styles.note}>Access is invite-only. Only approved accounts can sign in.</p>
      </div>
    </div>
  );
}

const styles = {
  wrap: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '1rem' },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '2.5rem 2rem', width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', boxShadow: 'var(--shadow-sm)' },
  brand: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' },
  brandMark: { width: '36px', height: '36px', background: 'var(--text-primary)', color: 'var(--surface)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter Tight', sans-serif", fontSize: '14px', fontWeight: 600, letterSpacing: '-0.03em' },
  brandName: { fontFamily: "'Inter Tight', sans-serif", fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em' },
  subtitle: { fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '0.5rem' },
  googleBtn: { display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 16px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 500, cursor: 'pointer', justifyContent: 'center', transition: 'border-color 0.15s' },
  note: { fontSize: '12px', color: 'var(--text-tertiary)', textAlign: 'center', marginTop: '0.5rem' },
};
