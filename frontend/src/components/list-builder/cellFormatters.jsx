import { TypeBadge } from '../common/TypeBadge';
import { STAT_DATA_KEY } from './columns';
import {
  toDisplayName,
  formatRegion,
  formatGrowthRate,
  formatCatchRate,
  formatFriendship,
  formatEggCycles,
  formatEvYield,
} from '../../utils/format';

export function cellValue(pokemon, key) {
  if (key === 'types') {
    return (
      <div className="list-table-types">
        {pokemon.types.map((t) => (
          <TypeBadge key={t} type={t} />
        ))}
      </div>
    );
  }
  if (key === 'weaknesses') {
    const weak = Object.entries(pokemon.type_effectiveness || {}).filter(([, m]) => m > 1);
    if (weak.length === 0) return '—';
    return (
      <div className="list-table-types">
        {weak.map(([t]) => (
          <TypeBadge key={t} type={t} />
        ))}
      </div>
    );
  }
  if (key === 'ability') return (pokemon.abilities || []).map((a) => toDisplayName(a.name)).join(', ');
  if (key === 'egg_groups') return (pokemon.egg_groups || []).map(toDisplayName).join(', ') || '—';
  if (key === 'ev_yield_stats') return formatEvYield(pokemon.ev_yield);
  if (key === 'growth_rate') return formatGrowthRate(pokemon.growth_rate);
  if (key === 'capture_rate') return formatCatchRate(pokemon.capture_rate);
  if (key === 'base_happiness') return formatFriendship(pokemon.base_happiness);
  if (key === 'hatch_counter') return formatEggCycles(pokemon.hatch_counter);
  if (key === 'is_legendary') return pokemon.is_legendary ? 'Yes' : '—';
  if (key === 'is_mythical') return pokemon.is_mythical ? 'Yes' : '—';
  if (key === 'base_stat_total') return pokemon.base_stat_total;
  if (key === 'generation') return formatRegion(pokemon.generation);
  if (STAT_DATA_KEY[key]) return pokemon.stats?.[STAT_DATA_KEY[key]] ?? '—';
  return pokemon[key] ?? '—';
}
