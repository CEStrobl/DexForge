import { TypeBadge } from '../common/TypeBadge';
import { STAT_DATA_KEY } from './fusionColumns';
import { toDisplayName } from '../../utils/format';

export function fusionCellValue(fusion, key) {
  if (!fusion) return '—';
  if (key === 'types') {
    return (
      <div className="list-table-types">
        {fusion.types.map((t) => (
          <TypeBadge key={t} type={t} />
        ))}
      </div>
    );
  }
  if (key === 'weaknesses') {
    const weak = Object.entries(fusion.type_effectiveness || {}).filter(([, m]) => m > 1);
    if (weak.length === 0) return '—';
    return (
      <div className="list-table-types">
        {weak.map(([t]) => (
          <TypeBadge key={t} type={t} />
        ))}
      </div>
    );
  }
  if (key === 'base_stat_total') return fusion.base_stat_total;
  if (key === 'ability') {
    const headNames = fusion.abilities.head.regular.map(toDisplayName).join(', ') || '—';
    const bodyNames = fusion.abilities.body.regular.map(toDisplayName).join(', ') || '—';
    return `${headNames} / ${bodyNames}`;
  }
  if (STAT_DATA_KEY[key]) return fusion.stats?.[STAT_DATA_KEY[key]] ?? '—';
  return '—';
}
