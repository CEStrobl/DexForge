import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { ToolCard } from './ToolCard';
import { api } from '../../api/client';
import { toDisplayName } from '../../utils/format';

export function NaturesToolCard() {
  const [nature, setNature] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get('/api/home/nature-of-day')
      .then(setNature)
      .catch(() => setError(true));
  }, []);

  return (
    <ToolCard icon={Heart} title="Natures" to="/natures">
      {error && <p className="text-muted">Couldn't load today's nature.</p>}
      {!error && !nature && <p className="text-muted">Loading…</p>}
      {nature && (
        <p className="text-muted">
          Featured: <span className="home-tool-snippet-name">{toDisplayName(nature.name)}</span> (+
          {toDisplayName(nature.increased_stat)} / -{toDisplayName(nature.decreased_stat)})
        </p>
      )}
    </ToolCard>
  );
}
