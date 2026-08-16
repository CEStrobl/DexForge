import { useState } from 'react';
import { Pencil, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { FusionArtSprite } from '../fusion/FusionArtSprite';
import { AvatarPickerModal } from './AvatarPickerModal';
import { useAvatarSprites } from './useAvatarSprites';

const AVATAR_SIZE = 144;

export function ProfileAvatar() {
  const { session, avatarHeadSlug, avatarBodySlug, avatarVariantId } = useAuth();
  const sprites = useAvatarSprites(avatarHeadSlug, avatarBodySlug);
  const [modalOpen, setModalOpen] = useState(false);

  const isFusion = Boolean(avatarHeadSlug && avatarBodySlug);
  const headSprite = avatarHeadSlug ? sprites[avatarHeadSlug] : null;
  const bodySprite = avatarBodySlug ? sprites[avatarBodySlug] : null;

  return (
    <div className="profile-avatar-wrap">
      {isFusion ? (
        <FusionArtSprite
          headSlug={avatarHeadSlug}
          bodySlug={avatarBodySlug}
          size={AVATAR_SIZE}
          selectedVariant={avatarVariantId}
        >
          <div className="profile-avatar-fallback fusion-sprite-pair-sm">
            {headSprite && <img src={headSprite} alt="" width={AVATAR_SIZE} height={AVATAR_SIZE} />}
            {bodySprite && <img src={bodySprite} alt="" width={AVATAR_SIZE} height={AVATAR_SIZE} />}
          </div>
        </FusionArtSprite>
      ) : headSprite ? (
        <img
          className="profile-avatar-image"
          src={headSprite}
          alt=""
          width={AVATAR_SIZE}
          height={AVATAR_SIZE}
        />
      ) : (
        <div className="profile-avatar-placeholder">
          <User size={48} strokeWidth={1.5} />
        </div>
      )}

      {session && (
        <button
          type="button"
          className="profile-avatar-edit-overlay"
          onClick={() => setModalOpen(true)}
          aria-label="Change profile picture"
        >
          <Pencil size={22} />
        </button>
      )}

      {modalOpen && <AvatarPickerModal onClose={() => setModalOpen(false)} />}
    </div>
  );
}
