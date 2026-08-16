import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../../api/client';
import { SidebarAvatar } from './SidebarAvatar';

export function AddFriendModal({ onClose, onSent }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [sentTo, setSentTo] = useState(() => new Set());
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      api
        .get(`/api/profiles/search?q=${encodeURIComponent(query.trim())}`)
        .then(setResults)
        .catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  async function sendRequest(username) {
    setError(null);
    try {
      await api.post('/api/friends/requests', { username });
      setSentTo((prev) => new Set(prev).add(username));
      onSent?.();
    } catch (err) {
      setError(err.message || 'Could not send request');
    }
  }

  return (
    <div className="fusion-art-modal-backdrop" onClick={onClose}>
      <div className="card fusion-art-modal add-friend-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fusion-art-modal-header">
          <h3 className="card-heading">Add Friend</h3>
          <button type="button" className="fusion-art-modal-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <input
          type="text"
          className="add-friend-search-input"
          placeholder="Search username..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />

        {error && <p className="add-friend-error">{error}</p>}

        <div className="add-friend-results">
          {results.map((r) => (
            <div key={r.username} className="add-friend-row">
              <span className="add-friend-row-identity">
                <SidebarAvatar headSlug={r.avatar_head_slug} bodySlug={r.avatar_body_slug} variantId={r.avatar_variant_id} />
                {r.username}
              </span>
              <button
                type="button"
                className="action-btn action-btn-ghost"
                disabled={sentTo.has(r.username)}
                onClick={() => sendRequest(r.username)}
              >
                {sentTo.has(r.username) ? 'Requested' : 'Send Request'}
              </button>
            </div>
          ))}
          {query.trim() && results.length === 0 && <p className="text-muted">No users found.</p>}
        </div>
      </div>
    </div>
  );
}
