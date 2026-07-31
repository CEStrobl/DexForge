import { useState } from 'react';
import { ArrowLeftRight, Plus } from 'lucide-react';
import { FusionMiniSlot } from '../compare/FusionMiniSlot';

// Reuses Fusion Comparison's head/body input pair directly rather than building a second
// version of the same search+evolve-menu combo (see Notes/Operation/fusionlist.md).
export function FusionPairAdd({ onAdd }) {
  const [head, setHead] = useState(null);
  const [body, setBody] = useState(null);

  function handleAdd() {
    if (!head || !body) return;
    onAdd(head, body);
    setHead(null);
    setBody(null);
  }

  function swap() {
    setHead(body);
    setBody(head);
  }

  return (
    <div className="fusion-pair-add">
      <FusionMiniSlot roleLabel="Head" slug={head} onSelect={setHead} />
      <button
        type="button"
        className="fusion-swap-btn"
        onClick={swap}
        disabled={!head || !body}
        aria-label="Swap head and body"
      >
        <ArrowLeftRight size={14} />
      </button>
      <FusionMiniSlot roleLabel="Body" slug={body} onSelect={setBody} />
      <button type="button" className="action-btn fusion-pair-add-btn" onClick={handleAdd} disabled={!head || !body}>
        <Plus size={14} />
        Add Fusion
      </button>
    </div>
  );
}
