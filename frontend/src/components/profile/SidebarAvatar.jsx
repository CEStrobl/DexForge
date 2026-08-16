import { User } from 'lucide-react';
import { FusionArtSprite } from '../fusion/FusionArtSprite';
import { useAvatarSprites } from './useAvatarSprites';

const SIZE = 22;

export function SidebarAvatar({ headSlug, bodySlug, variantId }) {
  const sprites = useAvatarSprites(headSlug, bodySlug);
  const isFusion = Boolean(headSlug && bodySlug);
  const headSprite = headSlug ? sprites[headSlug] : null;
  const bodySprite = bodySlug ? sprites[bodySlug] : null;

  if (isFusion) {
    return (
      <span className="sidebar-avatar">
        <FusionArtSprite headSlug={headSlug} bodySlug={bodySlug} size={SIZE} selectedVariant={variantId}>
          <span className="sidebar-avatar-fallback">
            {headSprite && <img src={headSprite} alt="" width={SIZE} height={SIZE} />}
          </span>
        </FusionArtSprite>
      </span>
    );
  }

  if (headSprite) {
    return (
      <span className="sidebar-avatar">
        <img src={headSprite} alt="" width={SIZE} height={SIZE} />
      </span>
    );
  }

  return (
    <span className="sidebar-avatar sidebar-avatar-placeholder">
      <User size={16} strokeWidth={2} />
    </span>
  );
}
