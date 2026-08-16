import { useEffect, useRef, useState } from 'react';
import { Layers, X } from 'lucide-react';
import { api, resolveImagePath } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { toDisplayName } from '../../utils/format';
import { PokemonSearchSelect } from '../compare/PokemonSearchSelect';

const SEARCH_LIMIT = 10;

function useMonPreview(slug) {
  const [mon, setMon] = useState(null);

  useEffect(() => {
    if (!slug) {
      setMon(null);
      return;
    }
    api
      .post('/api/pokemon/bulk', { slugs: [slug] })
      .then((r) => setMon(r[0] || null))
      .catch(() => setMon(null));
  }, [slug]);

  return mon;
}

// A selected Pokémon's other forms (e.g. Rotom's Heat/Wash/Frost/... variants) — already
// returned alongside the bulk lookup (`app/api/pokemon.py:bulk_pokemon`), same data the
// Lookup page's variant `<select>` uses.
function VariantSwitcher({ mon, onSelect }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  if (!mon.variants || mon.variants.length <= 1) return null;

  return (
    <div className="avatar-picker-variant-switcher" ref={containerRef}>
      <button
        type="button"
        className="avatar-picker-variant-btn"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Switch form"
        title="This Pokémon has other forms"
      >
        <Layers size={13} />
      </button>
      {open && (
        <select
          className="avatar-picker-variant-select"
          value={mon.selected_variant}
          onChange={(e) => {
            onSelect(e.target.value);
            setOpen(false);
          }}
        >
          {mon.variants.map((v) => (
            <option key={v.slug} value={v.slug}>
              {toDisplayName(v.slug)}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

function AvatarSlot({ roleLabel, slug, onSelect, onClear }) {
  const mon = useMonPreview(slug);

  if (!slug || !mon) {
    return (
      <div className="avatar-picker-slot">
        {roleLabel && <span className="fusion-mini-slot-label">{roleLabel}</span>}
        <PokemonSearchSelect
          placeholder={`Search ${roleLabel || 'Pokémon'}...`}
          onSelect={onSelect}
          limit={SEARCH_LIMIT}
        />
      </div>
    );
  }

  return (
    <div className="avatar-picker-slot">
      {roleLabel && <span className="fusion-mini-slot-label">{roleLabel}</span>}
      <div className="avatar-picker-slot-chosen">
        <button type="button" className="fusion-mini-slot-chip" onClick={onClear}>
          <img src={mon.sprite} alt="" width={26} height={26} />
          <span>{toDisplayName(mon.name)}</span>
        </button>
        <VariantSwitcher mon={mon} onSelect={onSelect} />
      </div>
    </div>
  );
}

function useFusionArtVariants(head, body) {
  const [variants, setVariants] = useState([]);

  useEffect(() => {
    if (!head || !body) {
      setVariants([]);
      return;
    }
    let cancelled = false;
    api
      .get(`/api/fusion/${head}/${body}/art`)
      .then((res) => {
        if (!cancelled) setVariants(res.variants || []);
      })
      .catch(() => {
        if (!cancelled) setVariants([]);
      });
    return () => {
      cancelled = true;
    };
  }, [head, body]);

  return variants;
}

export function AvatarPickerModal({ onClose }) {
  const { updateAvatar } = useAuth();
  const [fusionMode, setFusionMode] = useState(false);
  const [head, setHead] = useState(null);
  const [body, setBody] = useState(null);
  const [variantId, setVariantId] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const artVariants = useFusionArtVariants(fusionMode ? head : null, fusionMode ? body : null);

  // A fresh pair defaults to the first available art (matches FusionArtSprite's own
  // default-to-first behavior elsewhere) rather than leaving the choice blank.
  useEffect(() => {
    setVariantId(artVariants[0]?.id ?? null);
  }, [artVariants]);

  function toggleFusionMode() {
    setFusionMode((prev) => !prev);
    setHead(null);
    setBody(null);
    setVariantId(null);
    setError(null);
  }

  const canSave = fusionMode ? Boolean(head && body) : Boolean(head);

  async function handleSave() {
    if (!canSave) return;
    setSubmitting(true);
    setError(null);
    try {
      await updateAvatar(
        fusionMode ? { headSlug: head, bodySlug: body, variantId } : { headSlug: head, bodySlug: null }
      );
      onClose();
    } catch (err) {
      setError(err.message || 'Something went wrong.');
      setSubmitting(false);
    }
  }

  return (
    <div className="fusion-art-modal-backdrop" onClick={onClose}>
      <div className="card fusion-art-modal avatar-picker-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fusion-art-modal-header">
          <h3 className="card-heading">Profile Picture</h3>
          <button type="button" className="fusion-art-modal-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {fusionMode ? (
          <div className="avatar-picker-fusion-slots">
            <AvatarSlot roleLabel="Head" slug={head} onSelect={setHead} onClear={() => setHead(null)} />
            <AvatarSlot roleLabel="Body" slug={body} onSelect={setBody} onClear={() => setBody(null)} />
          </div>
        ) : (
          <AvatarSlot slug={head} onSelect={setHead} onClear={() => setHead(null)} />
        )}

        <div className="avatar-picker-toggle-row">
          <span>Fusion</span>
          <button
            type="button"
            role="switch"
            aria-checked={fusionMode}
            aria-label="Toggle fusion avatar"
            className={`avatar-picker-toggle-switch${fusionMode ? ' checked' : ''}`}
            onClick={toggleFusionMode}
          >
            <span className="avatar-picker-toggle-thumb" />
          </button>
        </div>

        {fusionMode && head && body && (
          <div className="avatar-picker-art-preview">
            {artVariants.length === 0 ? (
              <p className="text-muted avatar-picker-art-empty">
                No custom art submitted for this pair yet — a default sprite will be used.
              </p>
            ) : (
              <div className="fusion-art-modal-grid">
                {artVariants.map((v) => (
                  <button
                    type="button"
                    key={v.id}
                    className={`fusion-art-modal-thumb${v.id === variantId ? ' active' : ''}`}
                    onClick={() => setVariantId(v.id)}
                  >
                    <img
                      src={resolveImagePath(v.image_path)}
                      alt={`Variant ${v.id}`}
                      width={72}
                      height={72}
                    />
                    <span className="fusion-art-modal-thumb-artist">{v.artist || 'Unknown'}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {error && <p className="auth-panel-error">{error}</p>}

        <button type="button" className="action-btn avatar-picker-save-btn" disabled={!canSave || submitting} onClick={handleSave}>
          Save
        </button>
      </div>
    </div>
  );
}
