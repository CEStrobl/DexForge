import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Plus, X } from 'lucide-react';
import { api } from '../../api/client';
import { Tabs } from '../common/Tabs';
import { SidebarAvatar } from './SidebarAvatar';
import { AddFriendModal } from './AddFriendModal';

const TABS = [
  { key: 'friends', label: 'Friends' },
  { key: 'requests', label: 'Requests' },
];

function FriendRow({ profile, onClick }) {
  return (
    <Link to={`/profile/${profile.username}`} className="friends-modal-row" onClick={onClick}>
      <SidebarAvatar headSlug={profile.avatar_head_slug} bodySlug={profile.avatar_body_slug} variantId={profile.avatar_variant_id} />
      <span>{profile.username}</span>
    </Link>
  );
}

export function FriendsModal({ username, isSelf, onClose, onFriendsChanged }) {
  const [tab, setTab] = useState('friends');
  const [friends, setFriends] = useState(null);
  const [incoming, setIncoming] = useState(null);
  const [outgoing, setOutgoing] = useState(null);
  const [addOpen, setAddOpen] = useState(false);

  function loadFriends() {
    const path = isSelf ? '/api/friends' : `/api/profiles/${username}/friends`;
    api.get(path).then(setFriends).catch(() => setFriends([]));
  }

  function loadIncoming() {
    if (!isSelf) return;
    api.get('/api/friends/requests').then(setIncoming).catch(() => setIncoming([]));
  }

  function loadOutgoing() {
    if (!isSelf) return;
    api.get('/api/friends/requests/outgoing').then(setOutgoing).catch(() => setOutgoing([]));
  }

  useEffect(loadFriends, [username, isSelf]);
  useEffect(loadIncoming, [isSelf]);
  useEffect(loadOutgoing, [isSelf]);

  async function accept(id) {
    await api.post(`/api/friends/requests/${id}/accept`);
    loadIncoming();
    loadFriends();
    onFriendsChanged?.();
  }

  async function decline(id) {
    await api.post(`/api/friends/requests/${id}/decline`);
    loadIncoming();
  }

  async function cancel(id) {
    await api.delete(`/api/friends/requests/${id}`);
    loadOutgoing();
  }

  const noRequests = incoming?.length === 0 && outgoing?.length === 0;

  return (
    <div className="fusion-art-modal-backdrop" onClick={onClose}>
      <div className="card fusion-art-modal friends-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fusion-art-modal-header">
          <h3 className="card-heading">Friends</h3>
          <button type="button" className="fusion-art-modal-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="friends-modal-toolbar">
          {isSelf ? <Tabs tabs={TABS} active={tab} onChange={setTab} /> : <span />}
          {isSelf && (
            <button type="button" className="action-btn action-btn-ghost" onClick={() => setAddOpen(true)}>
              <Plus size={14} />
              Add Friend
            </button>
          )}
        </div>

        {(tab === 'friends' || !isSelf) && (
          <div className="friends-modal-list">
            {friends === null ? (
              <p className="text-muted">Loading...</p>
            ) : friends.length === 0 ? (
              <p className="text-muted">No friends yet.</p>
            ) : (
              friends.map((f) => <FriendRow key={f.username} profile={f} onClick={onClose} />)
            )}
          </div>
        )}

        {tab === 'requests' && isSelf && (
          <div className="friends-modal-list">
            {incoming === null || outgoing === null ? (
              <p className="text-muted">Loading...</p>
            ) : noRequests ? (
              <p className="text-muted">No pending requests.</p>
            ) : (
              <>
                {incoming.length > 0 && (
                  <>
                    <span className="friends-modal-section-label">Incoming</span>
                    {incoming.map((r) => (
                      <div key={r.id} className="friends-modal-request-row">
                        <span className="friends-modal-row">
                          <SidebarAvatar
                            headSlug={r.requester.avatar_head_slug}
                            bodySlug={r.requester.avatar_body_slug}
                            variantId={r.requester.avatar_variant_id}
                          />
                          {r.requester.username}
                        </span>
                        <div className="friends-modal-request-actions">
                          <button type="button" className="friends-modal-accept" onClick={() => accept(r.id)} aria-label="Accept">
                            <Check size={14} />
                          </button>
                          <button type="button" className="friends-modal-decline" onClick={() => decline(r.id)} aria-label="Decline">
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {outgoing.length > 0 && (
                  <>
                    <span className="friends-modal-section-label">Outgoing</span>
                    {outgoing.map((r) => (
                      <div key={r.id} className="friends-modal-request-row">
                        <span className="friends-modal-row">
                          <SidebarAvatar
                            headSlug={r.recipient.avatar_head_slug}
                            bodySlug={r.recipient.avatar_body_slug}
                            variantId={r.recipient.avatar_variant_id}
                          />
                          {r.recipient.username}
                        </span>
                        <div className="friends-modal-request-actions">
                          <button type="button" className="friends-modal-cancel" onClick={() => cancel(r.id)}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {addOpen && <AddFriendModal onClose={() => setAddOpen(false)} onSent={loadOutgoing} />}
      </div>
    </div>
  );
}
