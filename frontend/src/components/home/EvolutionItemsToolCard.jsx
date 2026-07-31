import { useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import { ToolCard } from './ToolCard';
import { api } from '../../api/client';
import { toDisplayName } from '../../utils/format';

export function EvolutionItemsToolCard() {
  const [fact, setFact] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get('/api/home/evolution-item-fact')
      .then(setFact)
      .catch(() => setError(true));
  }, []);

  return (
    <ToolCard icon={Package} title="Evolution Items" to="/evolution-items">
      {error && <p className="text-muted">Couldn't load today's fact.</p>}
      {!error && !fact && <p className="text-muted">Loading…</p>}
      {fact && (
        <p className="text-muted">
          Did you know: <span className="home-tool-snippet-name">{toDisplayName(fact.item)}</span> evolves{' '}
          {toDisplayName(fact.from)} into {toDisplayName(fact.to)}.
        </p>
      )}
    </ToolCard>
  );
}
