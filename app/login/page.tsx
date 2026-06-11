'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import PatchLogo from '@/components/PatchLogo';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const signedUp = searchParams.get('signed_up') === '1';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed.');
      } else {
        router.push('/');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      data-testid="login-page"
      style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}
    >
      {/* Left Panel */}
      <div
        data-testid="login-left-panel"
        style={{
          flex: 1,
          background: 'linear-gradient(135deg, #FAFAF8 0%, #FDF2F2 60%, #FCE7E7 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 48,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Radial glow */}
        <div
          style={{
            position: 'absolute',
            width: 600,
            height: 600,
            background: 'radial-gradient(circle, rgba(220,38,38,0.08) 0%, transparent 70%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
        {/* Tire track texture (subtle grid) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(0,0,0,0.02) 39px, rgba(0,0,0,0.02) 40px),
              repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(0,0,0,0.02) 39px, rgba(0,0,0,0.02) 40px)`,
            opacity: 0.5,
          }}
        />
        <div style={{ position: 'relative', maxWidth: 400, width: '100%' }}>
          <div style={{ marginBottom: 32 }}>
            <PatchLogo size={52} showText={true} />
          </div>
          <p
            data-testid="left-eyebrow"
            style={{ fontSize: 11, fontWeight: 600, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}
          >
            Discount Tire Information Center
          </p>
          <h1
            data-testid="left-heading"
            style={{ fontSize: 30, fontWeight: 700, color: '#111827', lineHeight: 1.25, marginBottom: 16 }}
          >
            IT support, resolved faster.
          </h1>
          <p
            data-testid="left-description"
            style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.65 }}
          >
            Patch guides Discount Tire associates through self-service troubleshooting — step by step, backed by your IT knowledge base.
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div
        data-testid="login-right-panel"
        style={{
          width: 480,
          background: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 48,
        }}
      >
        <div style={{ width: '100%', maxWidth: 360 }}>
          <h2
            data-testid="login-heading"
            style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 8 }}
          >
            Sign in
          </h2>
          <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 32 }}>
            Use your Discount Tire account to continue.
          </p>

          {signedUp && (
            <div
              data-testid="signup-success-message"
              style={{
                background: '#D1FAE5',
                color: '#065F46',
                borderRadius: 8,
                padding: '10px 14px',
                fontSize: 13,
                marginBottom: 20,
              }}
            >
              Account created! Sign in to get started.
            </div>
          )}

          <form data-testid="login-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label htmlFor="login-email" style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>
                Email
              </label>
              <input
                id="login-email"
                data-testid="login-email-input"
                type="email"
                className="input-base"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@discounttire.com"
                required
                autoComplete="email"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label htmlFor="login-password" style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>
                Password
              </label>
              <input
                id="login-password"
                data-testid="login-password-input"
                type="password"
                className="input-base"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div data-testid="login-error" style={{ fontSize: 13, color: '#DC2626' }}>
                {error}
              </div>
            )}

            <button
              data-testid="login-submit-btn"
              type="submit"
              className="btn-primary"
              style={{ width: '100%', marginTop: 4 }}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p style={{ fontSize: 13, color: '#6B7280', marginTop: 24, textAlign: 'center' }}>
            Don&apos;t have an account?{' '}
            <Link
              data-testid="signup-link"
              href="/signup"
              style={{ color: '#DC2626', fontWeight: 500, textDecoration: 'none' }}
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
