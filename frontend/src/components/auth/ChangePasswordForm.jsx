import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export function ChangePasswordForm() {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await updatePassword(password);
      setPassword('');
      setConfirm('');
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="auth-panel change-password-form" onSubmit={handleSubmit}>
      <span className="auth-panel-username">Change password</span>
      <input
        type="password"
        className="auth-panel-input"
        placeholder="New password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={6}
      />
      <input
        type="password"
        className="auth-panel-input"
        placeholder="Confirm new password"
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
        minLength={6}
      />
      {error && <p className="auth-panel-error">{error}</p>}
      {success && <p className="change-password-success">Password updated.</p>}
      <button type="submit" className="action-btn" disabled={submitting}>
        Update password
      </button>
    </form>
  );
}
