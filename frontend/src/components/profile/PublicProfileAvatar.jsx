import { User } from 'lucide-react';
import { FusionArtSprite } from '../fusion/FusionArtSprite';
import { useAvatarSprites } from './useAvatarSprites';

const AVATAR_SIZE = 144;

// Read-only counterpart to ProfileAvatar (which is always "my own, editable") — for
// viewing someone else's profile, driven by their fetched avatar fields instead of
// the signed-in user's own via AuthContext.
export function PublicProfileAvatar({ headSlug, bodySlug, variantId }) {
  const sprites = useAvatarSprites(headSlug, bodySlug);
  const isFusion = Boolean(headSlug && bodySlug);
  const headSprite = headSlug ? sprites[headSlug] : null;
  const bodySprite = bodySlug ? sprites[bodySlug] : null;

  return (
    <div className="profile-avatar-wrap">
      {isFusion ? (
        <FusionArtSprite headSlug={headSlug} bodySlug={bodySlug} size={AVATAR_SIZE} selectedVariant={variantId}>
          <div className="profile-avatar-fallback fusion-sprite-pair-sm">
            {headSprite && <img src={headSprite} alt="" width={AVATAR_SIZE} height={AVATAR_SIZE} />}
            {bodySprite && <img src={bodySprite} alt="" width={AVATAR_SIZE} height={AVATAR_SIZE} />}
          </div>
        </FusionArtSprite>
      ) : headSprite ? (
        <img className="profile-avatar-image" src={headSprite} alt="" width={AVATAR_SIZE} height={AVATAR_SIZE} />
      ) : (
        <div className="profile-avatar-placeholder">
          <User size={48} strokeWidth={1.5} />
        </div>
      )}
    </div>
  );
}
