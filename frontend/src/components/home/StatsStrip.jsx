import { useEffect, useState } from 'react';
import { api } from '../../api/client';

const LABELS = [
  { key: 'total_pokemon', label: 'Pokémon Indexed' },
  { key: 'saved_lists_count', label: 'Saved Lists' },
  { key: 'fusion_list_entries_count', label: 'Fusion Entries' },
  { key: 'total_entries_combined', label: 'Total List Entries' },
];

export function StatsStrip() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get('/api/home/stats')
      .then(setStats)
      .catch(() => setError(true));
  }, []);

  if (error) {
    return <p className="text-muted home-stats-error">Couldn't load stats.</p>;
  }

  if (!stats) {
    return (
      <div className="home-stats-strip">
        {LABELS.map((l) => (
          <span key={l.key} className="home-skeleton-block home-stat-skeleton" />
        ))}
      </div>
    );
  }

  return (
    <div className="home-stats-strip">
      {LABELS.map((l) => (
        <div key={l.key} className="home-stat">
          <span className="home-stat-value">{stats[l.key]}</span>
          <span className="home-stat-label">{l.label}</span>
        </div>
      ))}
    </div>
  );
}
