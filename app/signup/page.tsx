'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PatchLogo from '@/components/PatchLogo';

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Signup failed.');
      } else {
        router.push('/login?signed_up=1');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      data-testid="signup-page"
      style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}
    >
      {/* Left Panel */}
      <div
        data-testid="signup-left-panel"
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
          <p style={{ fontSize: 11, fontWeight: 600, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
            Discount Tire Information Center
          </p>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: '#111827', lineHeight: 1.25, marginBottom: 16 }}>
            IT support, resolved faster.
          </h1>
          <p style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.65 }}>
            Create your account to get started with self-service IT support backed by Discount Tire&apos;s knowledge base.
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div
        data-testid="signup-right-panel"
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
            data-testid="signup-heading"
            style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 8 }}
          >
            Create an account
          </h2>
          <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 32 }}>
            Join Discount Tire&apos;s IT support platform.
          </p>

          <form data-testid="signup-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label htmlFor="signup-username" style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>
                Username
              </label>
              <input
                id="signup-username"
                data-testid="signup-username-input"
                type="text"
                className="input-base"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Your name"
                required
                autoComplete="username"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label htmlFor="signup-email" style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>
                Email
              </label>
              <input
                id="signup-email"
                data-testid="signup-email-input"
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
              <label htmlFor="signup-password" style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>
                Password
              </label>
              <input
                id="signup-password"
                data-testid="signup-password-input"
                type="password"
                className="input-base"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
            </div>

            {error && (
              <div data-testid="signup-error" style={{ fontSize: 13, color: '#DC2626' }}>
                {error}
              </div>
            )}

            <button
              data-testid="signup-submit-btn"
              type="submit"
              className="btn-primary"
              style={{ width: '100%', marginTop: 4 }}
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p style={{ fontSize: 13, color: '#6B7280', marginTop: 24, textAlign: 'center' }}>
            Already have an account?{' '}
            <Link
              data-testid="login-link"
              href="/login"
              style={{ color: '#DC2626', fontWeight: 500, textDecoration: 'none' }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
