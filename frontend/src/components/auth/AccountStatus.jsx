import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Settings' Account card just reflects sign-in state — the actual sign in/create
// account form lives on its own page (SignInPage) now, not embedded here.
export function AccountStatus() {
  const { session, username, signOut } = useAuth();

  if (!session) {
    return (
      <div className="auth-panel">
        <p className="text-muted">You're not signed in.</p>
        <Link to="/sign-in" className="action-btn">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="auth-panel">
      <span className="auth-panel-username">Signed in as {username || 'you'}</span>
      <button type="button" className="action-btn" onClick={signOut}>
        Sign out
      </button>
    </div>
  );
}
