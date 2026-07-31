import { useState } from 'react';
import { Plus, Pencil, X } from 'lucide-react';
import { LABEL_COLORS } from './labelColors';

function ColorSwatchPicker({ value, onChange }) {
  return (
    <div className="label-color-picker">
      {LABEL_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          className={`label-color-swatch${value === color ? ' active' : ''}`}
          style={{ background: color }}
          onClick={() => onChange(color)}
          aria-label={color}
        />
      ))}
    </div>
  );
}

function LabelEditForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '');
  const [color, setColor] = useState(initial?.color || LABEL_COLORS[0]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), color });
  }

  return (
    <form className="label-edit-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Label name..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
      />
      <ColorSwatchPicker value={color} onChange={setColor} />
      <div className="label-edit-form-actions">
        <button type="submit" className="action-btn">
          Save
        </button>
        <button type="button" className="action-btn action-btn-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export function LabelManager({ labels, onAdd, onUpdate, onDelete }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);

  function handleAdd(data) {
    onAdd({ id: crypto.randomUUID(), ...data });
    setAdding(false);
  }

  function handleUpdate(id, data) {
    onUpdate(id, data);
    setEditingId(null);
  }

  return (
    <div className="label-manager">
      <span className="label-manager-title">Labels</span>
      {labels.map((label) =>
        editingId === label.id ? (
          <LabelEditForm
            key={label.id}
            initial={label}
            onSave={(data) => handleUpdate(label.id, data)}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <div key={label.id} className="label-manager-pill" style={{ background: label.color }}>
            <span>{label.name}</span>
            <button type="button" onClick={() => setEditingId(label.id)} aria-label={`Edit ${label.name}`}>
              <Pencil size={11} />
            </button>
            <button type="button" onClick={() => onDelete(label.id)} aria-label={`Delete ${label.name}`}>
              <X size={12} />
            </button>
          </div>
        )
      )}
      {adding ? (
        <LabelEditForm onSave={handleAdd} onCancel={() => setAdding(false)} />
      ) : (
        <button type="button" className="label-manager-add-btn" onClick={() => setAdding(true)}>
          <Plus size={12} />
          Add Label
        </button>
      )}
    </div>
  );
}
