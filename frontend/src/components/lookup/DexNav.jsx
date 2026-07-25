import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toDisplayName } from '../../utils/format';

export function DexNavLink({ neighbor, direction }) {
  if (!neighbor) {
    return (
      <span className={`dex-nav-link disabled dex-nav-${direction}`}>
        {direction === 'prev' && <ChevronLeft size={18} />}
        {direction === 'next' && <ChevronRight size={18} />}
      </span>
    );
  }

  return (
    <Link to={`/lookup/${neighbor.name}`} className={`dex-nav-link dex-nav-${direction}`}>
      {direction === 'prev' && (
        <>
          <ChevronLeft size={18} />#{String(neighbor.id).padStart(3, '0')} {toDisplayName(neighbor.name)}
        </>
      )}
      {direction === 'next' && (
        <>
          {toDisplayName(neighbor.name)} #{String(neighbor.id).padStart(3, '0')}
          <ChevronRight size={18} />
        </>
      )}
    </Link>
  );
}
