import { useEffect, useState } from 'react';
import { api, resolveImagePath } from '../../api/client';
import { FusionArtModal } from './FusionArtModal';

// Wraps a fused sprite render (children = the existing head+body placeholder markup)
// with community fusion art when it exists. Fetches lazily per head+body pair — the
// backend scrapes-and-caches on first request, so this is a normal fast fetch on every
// later view. Zero variants falls back to the placeholder children silently.
export function FusionArtSprite({
  headSlug,
  bodySlug,
  size,
  fusionLabel,
  selectedVariant,
  onSelectVariant,
  onActiveVariantChange,
  children,
}) {
  const [variants, setVariants] = useState(null);
  const [localSelected, setLocalSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!headSlug || !bodySlug) return;
    let cancelled = false;
    setVariants(null);
    api
      .get(`/api/fusion/${headSlug}/${bodySlug}/art`)
      .then((res) => {
        if (!cancelled) setVariants(res.variants || []);
      })
      .catch(() => {
        if (!cancelled) setVariants([]);
      });
    return () => {
      cancelled = true;
    };
  }, [headSlug, bodySlug]);

  const hasArt = Boolean(variants && variants.length > 0);
  const activeId = selectedVariant ?? localSelected;
  const active = hasArt ? variants.find((v) => v.id === activeId) || variants[0] : null;

  // Lets callers (e.g. the fused Lookup page's art-attribution line) know which variant
  // is currently showing without duplicating the fetch/selection state themselves.
  useEffect(() => {
    onActiveVariantChange?.(active);
  }, [active, onActiveVariantChange]);

  if (!hasArt) {
    return children;
  }

  function handleSelect(variantId) {
    if (onSelectVariant) onSelectVariant(variantId);
    else setLocalSelected(variantId);
    setModalOpen(false);
  }

  return (
    <div className="fusion-art-sprite" style={{ width: size, height: size }}>
      <img
        src={resolveImagePath(active.image_path)}
        alt={fusionLabel || 'Fusion art'}
        width={size}
        height={size}
        className="fusion-art-image"
      />
      {variants.length > 1 && (
        <button
          type="button"
          className="fusion-art-badge"
          onClick={() => setModalOpen(true)}
          aria-label={`${variants.length} art variants — choose one`}
          title={`${variants.length} art variants`}
        >
          {variants.length}
        </button>
      )}
      {modalOpen && (
        <FusionArtModal
          variants={variants}
          activeId={active.id}
          fusionLabel={fusionLabel}
          onSelect={handleSelect}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
