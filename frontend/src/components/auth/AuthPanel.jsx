import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export function AuthPanel() {
  const { username, session, loading, signIn, signUp, signOut } = useAuth();
  const [mode, setMode] = useState('signIn');
  const [usernameInput, setUsernameInput] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;

  if (session) {
    return (
      <div className="auth-panel">
        <span className="auth-panel-username">Signed in as {username || 'you'}</span>
        <button type="button" className="action-btn" onClick={signOut}>
          Sign out
        </button>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'signIn') {
        await signIn(usernameInput, password);
      } else {
        await signUp(usernameInput, password);
      }
      setPassword('');
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="auth-panel" onSubmit={handleSubmit}>
      <div className="auth-panel-mode-toggle">
        <button
          type="button"
          className={`auth-panel-mode-btn${mode === 'signIn' ? ' active' : ''}`}
          onClick={() => setMode('signIn')}
        >
          Sign in
        </button>
        <button
          type="button"
          className={`auth-panel-mode-btn${mode === 'signUp' ? ' active' : ''}`}
          onClick={() => setMode('signUp')}
        >
          Create account
        </button>
      </div>
      <input
        type="text"
        className="auth-panel-input"
        placeholder="Username"
        autoComplete="username"
        value={usernameInput}
        onChange={(e) => setUsernameInput(e.target.value)}
        required
      />
      <input
        type="password"
        className="auth-panel-input"
        placeholder="Password"
        autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={6}
      />
      {error && <p className="auth-panel-error">{error}</p>}
      <button type="submit" className="action-btn" disabled={submitting}>
        {mode === 'signIn' ? 'Sign in' : 'Create account'}
      </button>
    </form>
  );
}
