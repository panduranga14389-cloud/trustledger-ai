
import { useState, type FormEvent } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '../firebase';
import './LoginPage.css';

type LoginPageProps = {
  onLogin: () => void;
};

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignup) {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
      onLogin();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong';
      setError(message.replace(/^Firebase:\s*/, ''));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-brand">
        <div className="login-logo">
          TrustLedger <span>AI</span>
        </div>
        <p className="login-tagline">
          Intelligent financial management. Transparent records.
          Smarter decisions for your business.
        </p>
        <div className="login-highlight">
          Secure your financial records, track transactions, and manage
          your evidence in one workspace.
        </div>
      </section>

      <section className="login-form-side">
        <form onSubmit={handleSubmit} className="login-card">
          <h2>{isSignup ? 'Create your account' : 'Welcome back'}</h2>
          <p className="login-subtitle">
            {isSignup
              ? 'Start managing your finances securely.'
              : 'Sign in to access your financial workspace.'}
          </p>

          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            placeholder="Enter your password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p className="login-error" role="alert">{error}</p>
          )}

          <button className="login-submit" type="submit" disabled={loading}>
            {loading
              ? 'Please wait...'
              : isSignup
                ? 'Create Account'
                : 'Sign In'}
          </button>

          <p className="login-switch">
            {isSignup
              ? 'Already have an account?'
              : 'New to TrustLedger AI?'}{' '}
            <button
              type="button"
              onClick={() => {
                setIsSignup(!isSignup);
                setError('');
              }}
            >
              {isSignup ? 'Sign In' : 'Create New Account'}
            </button>
          </p>

          <div className="login-footer">
            Secure access to your financial workspace
          </div>
        </form>
      </section>
    </main>
  );
}
