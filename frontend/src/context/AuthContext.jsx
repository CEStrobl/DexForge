import { createContext, useContext, useEffect, useState } from 'react';
import { setAuthToken } from '../api/client';
import { supabase } from '../api/supabaseClient';

const AuthContext = createContext(null);

// Supabase Auth requires an email; DexForge accounts are username-based, so sign-up/sign-in
// map a chosen username to a synthetic address under the hood. The real username lives in
// user_metadata.username (set at sign-up) for display — this address is never shown or emailed.
function usernameToEmail(username) {
  return `${username.trim().toLowerCase()}@dexforge.local`;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  // Set synchronously during render, not in an effect: SavedListsContext/etc. also have
  // an effect keyed on `session` that fires a request as soon as it goes non-null, and
  // React runs child effects before parent effects — an effect here would race those
  // requests, sending them out before the token was attached (-> spurious 401s).
  setAuthToken(session?.access_token ?? null);

  async function signUp(username, password) {
    const { error } = await supabase.auth.signUp({
      email: usernameToEmail(username),
      password,
      options: { data: { username: username.trim() } },
    });
    if (error) throw error;
  }

  async function signIn(username, password) {
    const { error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username),
      password,
    });
    if (error) throw error;
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }

  async function updateAvatar({ headSlug, bodySlug, variantId }) {
    const { error } = await supabase.auth.updateUser({
      data: {
        avatar_head_slug: headSlug ?? null,
        avatar_body_slug: bodySlug ?? null,
        avatar_variant_id: variantId ?? null,
      },
    });
    if (error) throw error;
  }

  const user = session?.user ?? null;
  const username = user?.user_metadata?.username ?? null;
  const avatarHeadSlug = user?.user_metadata?.avatar_head_slug ?? null;
  const avatarBodySlug = user?.user_metadata?.avatar_body_slug ?? null;
  const avatarVariantId = user?.user_metadata?.avatar_variant_id ?? null;

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        username,
        avatarHeadSlug,
        avatarBodySlug,
        avatarVariantId,
        loading,
        signUp,
        signIn,
        signOut,
        updatePassword,
        updateAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
