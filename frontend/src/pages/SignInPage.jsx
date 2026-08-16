import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthForm } from '../components/auth/AuthForm';
import '../styles/settings.css';
import '../styles/sign-in.css';

export default function SignInPage() {
  const { session, loading } = useAuth();

  if (loading) return null;
  if (session) return <Navigate to="/profile" replace />;

  return (
    <div className="sign-in-page">
      <div className="card sign-in-card">
        <h1>Welcome to DexForge</h1>
        <p className="text-muted">Sign in to save Pokémon lists, fusion lists, and quick links.</p>
        <AuthForm />
      </div>
    </div>
  );
}
