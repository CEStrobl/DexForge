import { PackageOpen } from 'lucide-react';

export function FusionListEmptyState() {
  return (
    <div className="list-table-empty-state">
      <PackageOpen size={28} />
      <p>Your fusion list is empty.</p>
      <p className="text-muted">Pick a head and body Pokémon above, then Add Fusion.</p>
    </div>
  );
}
