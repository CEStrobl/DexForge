import { useEffect, useState } from 'react';
import { Calculator } from 'lucide-react';
import { ToolCard } from './ToolCard';
import { api } from '../../api/client';
import { toDisplayName } from '../../utils/format';

function factText(fact) {
  const [a, b] = fact.types.map(toDisplayName);
  const attacker = toDisplayName(fact.attacking_type);
  const multiplierText = fact.multiplier === 0 ? 'immune to' : `${fact.multiplier}x weak to`;
  return `Did you know: ${a}/${b} is ${multiplierText} ${attacker}.`;
}

export function TypingToolCard() {
  const [fact, setFact] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get('/api/home/typing-fact')
      .then(setFact)
      .catch(() => setError(true));
  }, []);

  return (
    <ToolCard icon={Calculator} title="Typing Calculator" to="/typing-calculator">
      {error && <p className="text-muted">Couldn't load today's fact.</p>}
      {!error && !fact && <p className="text-muted">Loading…</p>}
      {fact && <p className="text-muted">{factText(fact)}</p>}
    </ToolCard>
  );
}
