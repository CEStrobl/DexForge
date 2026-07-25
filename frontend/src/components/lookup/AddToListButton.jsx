import { useState } from 'react';
import { ListPlus, Check } from 'lucide-react';
import { api } from '../../api/client';

export function AddToListButton({ pokemonSlug }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [status, setStatus] = useState('idle'); // idle | saving | done | error

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setStatus('saving');
    try {
      await api.post('/api/lists', { name: name.trim(), pokemon_slugs: [pokemonSlug] });
      setStatus('done');
      setTimeout(() => {
        setOpen(false);
        setStatus('idle');
        setName('');
      }, 1200);
    } catch {
      setStatus('error');
    }
  }

  if (!open) {
    return (
      <button type="button" className="action-btn" onClick={() => setOpen(true)}>
        <ListPlus size={16} />
        Add to List
      </button>
    );
  }

  return (
    <form className="add-to-list-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="New list name..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
        disabled={status === 'saving' || status === 'done'}
      />
      <button type="submit" className="action-btn" disabled={status === 'saving' || status === 'done'}>
        {status === 'done' ? <Check size={16} /> : 'Save'}
      </button>
      {status === 'error' && <span className="add-to-list-error">Failed — try again</span>}
    </form>
  );
}
