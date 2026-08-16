import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function AuthForm() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('signIn');
  const [usernameInput, setUsernameInput] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function switchMode(next) {
    setMode(next);
    setPassword('');
    setConfirmPassword('');
    setError(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (mode === 'signUp' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      if (mode === 'signIn') {
        await signIn(usernameInput, password);
      } else {
        await signUp(usernameInput, password);
      }
      navigate('/profile');
    } catch (err) {
      setError(err.message || 'Something went wrong.');
      setSubmitting(false);
    }
  }

  return (
    <form className="auth-panel" onSubmit={handleSubmit}>
      <div className="auth-panel-mode-toggle">
        <button
          type="button"
          className={`auth-panel-mode-btn${mode === 'signIn' ? ' active' : ''}`}
          onClick={() => switchMode('signIn')}
        >
          Sign in
        </button>
        <button
          type="button"
          className={`auth-panel-mode-btn${mode === 'signUp' ? ' active' : ''}`}
          onClick={() => switchMode('signUp')}
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
      {mode === 'signUp' && (
        <input
          type="password"
          className="auth-panel-input"
          placeholder="Confirm password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
        />
      )}
      {error && <p className="auth-panel-error">{error}</p>}
      <button type="submit" className="action-btn" disabled={submitting}>
        {mode === 'signIn' ? 'Sign in' : 'Create account'}
      </button>
    </form>
  );
}
