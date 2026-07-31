import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { TypeBadge } from '../common/TypeBadge';
import { toDisplayName } from '../../utils/format';

export function FeaturedPokemonCard() {
  const [mon, setMon] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get('/api/home/featured-pokemon')
      .then(setMon)
      .catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <div className="card home-featured-card">
        <p className="text-muted">Couldn't load today's featured Pokémon.</p>
      </div>
    );
  }

  if (!mon) {
    return (
      <div className="card home-featured-card">
        <span className="home-featured-label">Featured Pokémon</span>
        <div className="home-featured-content">
          <span className="home-skeleton-block home-skeleton-sprite" />
          <div className="home-skeleton-lines">
            <span className="home-skeleton-block home-skeleton-line" style={{ width: '50%' }} />
            <span className="home-skeleton-block home-skeleton-line" style={{ width: '30%' }} />
          </div>
        </div>
      </div>
    );
  }

  const highlight = mon.four_x_weakness
    ? `4x weak to ${toDisplayName(mon.four_x_weakness)}`
    : `Base Stat Total ${mon.base_stat_total}`;

  return (
    <Link to={`/lookup/${mon.name}`} className="card home-featured-card">
      <span className="home-featured-label">Featured Pokémon</span>
      <div className="home-featured-content">
        <img src={mon.sprite} alt="" width={96} height={96} />
        <div className="home-featured-info">
          <h2>{toDisplayName(mon.name)}</h2>
          <div className="pokedex-type-badges">
            {mon.types.map((t) => (
              <TypeBadge key={t} type={t} />
            ))}
          </div>
          <span className="home-featured-highlight">{highlight}</span>
        </div>
      </div>
    </Link>
  );
}
