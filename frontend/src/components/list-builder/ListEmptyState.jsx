import { Link } from 'react-router-dom';
import { PackageOpen } from 'lucide-react';

export function ListEmptyState() {
  return (
    <div className="list-table-empty-state">
      <PackageOpen size={28} />
      <p>Your list is empty.</p>
      <p className="text-muted">
        Type a Pokémon name above, or use <Link to="/dex-filter">Dex Filter</Link> to add matches in bulk.
      </p>
    </div>
  );
}
