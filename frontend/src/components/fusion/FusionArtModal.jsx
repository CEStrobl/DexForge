import { X, Pencil } from 'lucide-react';
import { resolveImagePath } from '../../api/client';

export function FusionArtModal({ variants, activeId, fusionLabel, onSelect, onClose }) {
  return (
    <div className="fusion-art-modal-backdrop" onClick={onClose}>
      <div className="card fusion-art-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fusion-art-modal-header">
          <h3 className="card-heading">Alternative Art</h3>
          <button type="button" className="fusion-art-modal-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="fusion-art-modal-grid">
          {variants.map((v) => (
            <button
              type="button"
              key={v.id}
              className={`fusion-art-modal-thumb${v.id === activeId ? ' active' : ''}`}
              onClick={() => onSelect(v.id)}
            >
              <img src={resolveImagePath(v.image_path)} alt={`${fusionLabel} — variant ${v.id}`} width={72} height={72} />
              <span className="fusion-art-modal-thumb-id">#{v.id}</span>
              <span className="fusion-art-modal-thumb-artist">
                <Pencil size={10} />
                {v.artist || 'Unknown'}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
