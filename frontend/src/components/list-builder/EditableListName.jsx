import { useEffect, useRef, useState } from 'react';
import { Pencil } from 'lucide-react';

export function EditableListName({ name, onChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!editing) setDraft(name);
  }, [name, editing]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function confirm() {
    onChange(draft.trim());
    setEditing(false);
  }

  function cancel() {
    setDraft(name);
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        className="editable-list-name-input"
        value={draft}
        placeholder="Name this list..."
        onChange={(e) => setDraft(e.target.value)}
        onBlur={confirm}
        onKeyDown={(e) => {
          if (e.key === 'Enter') confirm();
          if (e.key === 'Escape') cancel();
        }}
      />
    );
  }

  return (
    <div className="editable-list-name">
      <h2>{name || 'Untitled List'}</h2>
      <button
        type="button"
        className="editable-list-name-pencil"
        onClick={() => setEditing(true)}
        aria-label="Rename list"
      >
        <Pencil size={15} />
      </button>
    </div>
  );
}
