import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Plus, GitMerge, Settings, Bookmark } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useSavedLists } from '../context/SavedListsContext';
import { useFusionLists } from '../context/FusionListsContext';
import { useInfiniteFusion } from '../context/InfiniteFusionContext';
import { ProfileAvatar } from '../components/profile/ProfileAvatar';
import { PublicProfileAvatar } from '../components/profile/PublicProfileAvatar';
import { FriendsModal } from '../components/profile/FriendsModal';
import '../styles/lists-home.css';
import '../styles/profile.css';

export default function ProfilePage() {
  const { username: routeUsername } = useParams();
  const { session, username: myUsername } = useAuth();
  const { savedLists } = useSavedLists();
  const { fusionLists } = useFusionLists();
  const { enabled: infiniteFusionEnabled } = useInfiniteFusion();

  const isOtherUser = Boolean(routeUsername);
  const targetUsername = routeUsername || myUsername;

  const [stats, setStats] = useState(null);
  const [otherLists, setOtherLists] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [friendsOpen, setFriendsOpen] = useState(false);

  function loadStats() {
    if (!targetUsername) {
      setStats(null);
      return;
    }
    api
      .get(`/api/profiles/${targetUsername}`)
      .then(setStats)
      .catch(() => setStats(null));
  }

  useEffect(loadStats, [targetUsername]);

  useEffect(() => {
    if (!isOtherUser) {
      setOtherLists(null);
      return;
    }
    api
      .get(`/api/profiles/${routeUsername}/lists`)
      .then(setOtherLists)
      .catch(() => setOtherLists([]));
  }, [isOtherUser, routeUsername]);

  useEffect(() => {
    if (isOtherUser || !session) {
      setBookmarks([]);
      return;
    }
    api
      .get('/api/list-saves')
      .then(setBookmarks)
      .catch(() => setBookmarks([]));
  }, [isOtherUser, session]);

  const combined = isOtherUser
    ? (otherLists || []).map((l) => ({
        id: l.id,
        name: l.name,
        entryCount: l.entry_count,
        kind: l.kind,
        to: l.kind === 'fusion' ? `/fusion-list/${l.id}` : `/list-builder/${l.id}`,
        key: `${l.kind}-${l.id}`,
      }))
    : [
        ...savedLists.map((l) => ({
          id: l.id,
          name: l.name,
          entryCount: l.entries.length,
          kind: 'saved',
          to: `/list-builder/${l.id}`,
          key: `saved-${l.id}`,
          updated_at: l.updated_at,
        })),
        ...(infiniteFusionEnabled
          ? fusionLists.map((l) => ({
              id: l.id,
              name: l.name,
              entryCount: l.entries.length,
              kind: 'fusion',
              to: `/fusion-list/${l.id}`,
              key: `fusion-${l.id}`,
              updated_at: l.updated_at,
            }))
          : []),
        ...bookmarks.map((b) => ({
          id: b.list_id,
          name: b.name,
          entryCount: b.entry_count,
          kind: b.list_type,
          to: b.list_type === 'fusion' ? `/fusion-list/${b.list_id}` : `/list-builder/${b.list_id}`,
          key: `bookmark-${b.list_type}-${b.list_id}`,
          bookmarkOwner: b.owner.username,
          updated_at: b.created_at,
        })),
      ].sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));

  const avatar = isOtherUser ? (
    <PublicProfileAvatar
      headSlug={stats?.avatar_head_slug}
      bodySlug={stats?.avatar_body_slug}
      variantId={stats?.avatar_variant_id}
    />
  ) : (
    <ProfileAvatar />
  );

  const displayName = isOtherUser ? routeUsername : session ? myUsername || 'You' : 'Sign in to view your profile';

  return (
    <div className="lists-home-page profile-page">
      <div className="profile-header">
        {avatar}
        <div className="profile-header-info-col">
          <div className="profile-header-info">
            <h2 className="profile-username">{displayName}</h2>
            {!isOtherUser && session && (
              <Link to="/settings" className="profile-settings-gear" aria-label="Account settings" title="Account settings">
                <Settings size={16} />
              </Link>
            )}
          </div>
          {stats && (
            <button type="button" className="profile-stats-row" onClick={() => setFriendsOpen(true)}>
              <span>
                {stats.list_count} {stats.list_count === 1 ? 'list' : 'lists'}
              </span>
              <span>·</span>
              <span>
                {stats.friend_count} {stats.friend_count === 1 ? 'friend' : 'friends'}
              </span>
            </button>
          )}
        </div>
      </div>

      <div className="lists-home-header">
        <h1>Lists</h1>
        {!isOtherUser && (
          <div className="lists-home-header-actions">
            {session ? (
              <Link to="/list-builder" className="action-btn">
                <Plus size={14} />
                New List
              </Link>
            ) : (
              <button type="button" className="action-btn" disabled title="Sign in to create a list">
                <Plus size={14} />
                New List
              </button>
            )}
            {infiniteFusionEnabled &&
              (session ? (
                <Link to="/fusion-list" className="action-btn">
                  <Plus size={14} />
                  New Fusion List
                </Link>
              ) : (
                <button type="button" className="action-btn" disabled title="Sign in to create a fusion list">
                  <Plus size={14} />
                  New Fusion List
                </button>
              ))}
          </div>
        )}
      </div>

      {isOtherUser && otherLists === null ? (
        <div className="card lists-home-empty">
          <p className="text-muted">Loading...</p>
        </div>
      ) : !isOtherUser && !session ? (
        <div className="card lists-home-empty">
          <p className="text-muted">Sign in to save lists.</p>
        </div>
      ) : combined.length === 0 ? (
        <div className="card lists-home-empty">
          <p className="text-muted">
            {isOtherUser ? 'No public lists yet.' : 'No lists yet — create one to get started.'}
          </p>
        </div>
      ) : (
        <div className="lists-home-grid">
          {combined.map((l) => (
            <Link key={l.key} to={l.to} className="card lists-home-card">
              <div className="lists-home-card-header">
                <span className="lists-home-card-name">{l.name}</span>
                {l.kind === 'fusion' && (
                  <span className="lists-home-card-badge">
                    <GitMerge size={12} />
                    Fusion
                  </span>
                )}
              </div>
              <span className="text-muted">
                {l.entryCount} {l.entryCount === 1 ? 'entry' : 'entries'}
              </span>
              {l.bookmarkOwner && (
                <span className="lists-home-card-bookmark">
                  <Bookmark size={11} />
                  Saved from {l.bookmarkOwner}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}

      {friendsOpen && targetUsername && (
        <FriendsModal
          username={targetUsername}
          isSelf={!isOtherUser}
          onClose={() => setFriendsOpen(false)}
          onFriendsChanged={loadStats}
        />
      )}
    </div>
  );
}
