import { STAT_FULL_LABELS } from '../../utils/format';

// Safe column key -> actual key in a computed fusion's `stats` (PokeAPI's hyphenated names).
export const STAT_DATA_KEY = {
  hp: 'hp',
  attack: 'attack',
  defense: 'defense',
  special_attack: 'special-attack',
  special_defense: 'special-defense',
  speed: 'speed',
};

// A fusion has no criteria-filterable fields (generation, egg groups, growth rate, etc.) —
// only what compute_fusion() actually produces — so this is its own short, flat column set
// rather than reusing list-builder/columns.js's single-Pokémon options.
export const FUSION_LIST_COLUMN_OPTIONS = [
  { key: 'types', label: 'Type' },
  { key: 'hp', label: STAT_FULL_LABELS.hp },
  { key: 'attack', label: STAT_FULL_LABELS.attack },
  { key: 'defense', label: STAT_FULL_LABELS.defense },
  { key: 'special_attack', label: STAT_FULL_LABELS['special-attack'] },
  { key: 'special_defense', label: STAT_FULL_LABELS['special-defense'] },
  { key: 'speed', label: STAT_FULL_LABELS.speed },
  { key: 'base_stat_total', label: 'Total' },
  { key: 'ability', label: 'Ability' },
  { key: 'weaknesses', label: 'Weaknesses' },
];

export const DEFAULT_FUSION_LIST_COLUMNS = [
  'types',
  'hp',
  'attack',
  'defense',
  'special_attack',
  'special_defense',
  'speed',
  'base_stat_total',
];

export const ALIGN_RIGHT_KEYS = new Set([
  'hp',
  'attack',
  'defense',
  'special_attack',
  'special_defense',
  'speed',
  'base_stat_total',
]);

// `columns` is the user's chosen display order, so active columns must follow ITS order.
export function getOrderedActiveFusionColumns(columns) {
  const byKey = new Map(FUSION_LIST_COLUMN_OPTIONS.map((c) => [c.key, c]));
  return columns.map((key) => byKey.get(key)).filter(Boolean);
}
