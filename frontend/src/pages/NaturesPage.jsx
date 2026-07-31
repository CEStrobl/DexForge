import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { STAT_FULL_LABELS } from '../utils/format';
import '../styles/natures.css';

const NATURE_STATS = ['attack', 'defense', 'special-attack', 'special-defense', 'speed'];

// PokeAPI's nature data marks the 5 no-op natures with increased_stat/decreased_stat
// both null, but doesn't say which stat's diagonal cell each belongs on — that
// pairing (Hardy = Attack/Attack, Docile = Defense/Defense, ...) is a fixed
// Pokémon fact, not something derived from the API response.
const NEUTRAL_NATURE_BY_STAT = {
  attack: 'hardy',
  defense: 'docile',
  'special-attack': 'bashful',
  'special-defense': 'quirky',
  speed: 'serious',
};

export default function NaturesPage() {
  const [natures, setNatures] = useState(null);

  useEffect(() => {
    api
      .get('/api/natures')
      .then((data) => setNatures(Object.values(data)))
      .catch(() => setNatures([]));
  }, []);

  if (!natures) {
    return (
      <div className="card">
        <p className="text-muted">Loading...</p>
      </div>
    );
  }

  function natureFor(increased, decreased) {
    if (increased === decreased) return NEUTRAL_NATURE_BY_STAT[increased];
    const match = natures.find((n) => n.increased_stat === increased && n.decreased_stat === decreased);
    return match?.name;
  }

  return (
    <div className="card natures-page">
      <h2 className="card-heading natures-heading">Natures</h2>
      <div className="natures-table-wrap">
        <table className="natures-table">
          <thead>
            <tr>
              <th className="natures-corner">
                <span className="natures-corner-decreased">↓ Decreased Stat</span>
                <span className="natures-corner-increased">↑ Increased Stat</span>
              </th>
              {NATURE_STATS.map((stat) => (
                <th key={stat} className={`natures-stat-header natures-stat-${stat}`}>
                  ↓ {STAT_FULL_LABELS[stat]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {NATURE_STATS.map((rowStat) => (
              <tr key={rowStat}>
                <th className={`natures-stat-header natures-stat-${rowStat}`}>↑ {STAT_FULL_LABELS[rowStat]}</th>
                {NATURE_STATS.map((colStat) => {
                  const name = natureFor(rowStat, colStat);
                  const neutral = rowStat === colStat;
                  return (
                    <td key={colStat} className={neutral ? 'natures-cell-neutral' : undefined}>
                      {name ? name.charAt(0).toUpperCase() + name.slice(1) : '—'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
