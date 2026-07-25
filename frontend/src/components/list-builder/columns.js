import { CRITERIA_GROUPS } from './criteria';
import { STAT_FULL_LABELS } from '../../utils/format';

// Safe criteria key -> actual key in pokemon.stats (which uses PokeAPI's hyphenated names).
export const STAT_DATA_KEY = {
  hp: 'hp',
  attack: 'attack',
  defense: 'defense',
  special_attack: 'special-attack',
  special_defense: 'special-defense',
  speed: 'speed',
};

// Table columns favor the short stat abbreviations used on the Lookup page
// (Att/Def/SpA/SpD) over the criteria panel's spelled-out labels.
function columnLabel(key, label) {
  return STAT_DATA_KEY[key] ? STAT_FULL_LABELS[STAT_DATA_KEY[key]] : label;
}

export const PRIMARY_COLUMNS = [...CRITERIA_GROUPS.primary, ...CRITERIA_GROUPS.stats]
  .filter((c) => c.key !== 'weak_to')
  .map(({ key, label }) => ({ key, label: columnLabel(key, label) }));

export const WEAKNESS_COLUMN = { key: 'weaknesses', label: 'Weaknesses' };

export const MORE_COLUMNS = [...CRITERIA_GROUPS.more.map(({ key, label }) => ({ key, label })), WEAKNESS_COLUMN];

export const COLUMN_OPTIONS = [...PRIMARY_COLUMNS, ...MORE_COLUMNS];

export const DEFAULT_COLUMNS = [
  'types',
  'hp',
  'attack',
  'defense',
  'special_attack',
  'special_defense',
  'speed',
];
