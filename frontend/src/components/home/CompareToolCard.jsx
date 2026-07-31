import { GitCompare } from 'lucide-react';
import { ToolCard } from './ToolCard';

// No natural "recent" data to surface without view history (see Notes/Landingpage.md) —
// a static description stands in for a snippet here.
export function CompareToolCard() {
  return (
    <ToolCard icon={GitCompare} title="Compare" to="/compare">
      <p className="text-muted">Put two Pokémon — or two fusions — side by side.</p>
    </ToolCard>
  );
}
