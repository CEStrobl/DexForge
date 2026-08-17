import { ALL_CRITERIA, CRITERIA_GROUPS } from './criteria';
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
const COLUMN_LABEL_OVERRIDES = {
  base_stat_total: 'Total',
};

function columnLabel(key, label) {
  if (STAT_DATA_KEY[key]) return STAT_FULL_LABELS[STAT_DATA_KEY[key]];
  return COLUMN_LABEL_OVERRIDES[key] || label;
}

// Column-picker grouping is intentionally decoupled from the criteria panel's
// primary/more split (CRITERIA_GROUPS) — Generation stays a "primary" filter on
// the Dex Filter page, but is tucked under +More in the table's column picker.
// The criterion is multi-select ("generations", OR-matched) but the column itself still
// shows a single per-Pokémon value, so the column's own key stays the singular
// "generation" that cellFormatters/ListTable already key off of — decoupled on purpose.
const GENERATION_CRITERION = CRITERIA_GROUPS.primary.find((c) => c.key === 'generations');
const GENERATION_COLUMN = { key: 'generation', label: GENERATION_CRITERION.label };

export const PRIMARY_COLUMNS = [...CRITERIA_GROUPS.primary, ...CRITERIA_GROUPS.stats]
  .filter((c) => c.key !== 'weak_to' && c.key !== 'generations')
  .map(({ key, label }) => ({ key, label: columnLabel(key, label) }));

export const WEAKNESS_COLUMN = { key: 'weaknesses', label: 'Weaknesses' };

// Column-picker grouping (General/Training/Breeding below) is its own arrangement, not
// tied to which Search accordion (primary/stats/more) the same field lives in — so this
// looks the field up across ALL_CRITERIA rather than just CRITERIA_GROUPS.more.
function moreColumn(key) {
  const match = ALL_CRITERIA.find((c) => c.key === key);
  return { key: match.key, label: columnLabel(match.key, match.label) };
}

export const FUSION_COLUMNS = [
  { key: 'head_total', label: 'Head Total' },
  { key: 'body_total', label: 'Body Total' },
  { key: 'head_type', label: 'Head Type' },
  { key: 'body_type', label: 'Body Type' },
];

// The +More column picker groups a lot of rarely-toggled attributes into
// collapsible sections instead of one long flat list.
export const MORE_COLUMN_GROUPS = [
  {
    label: 'General',
    columns: [
      { key: GENERATION_COLUMN.key, label: GENERATION_COLUMN.label },
      moreColumn('is_legendary'),
      moreColumn('is_mythical'),
      WEAKNESS_COLUMN,
    ],
  },
  {
    label: 'Training',
    columns: [moreColumn('ev_yield_stats'), moreColumn('capture_rate'), moreColumn('base_happiness')],
  },
  {
    label: 'Breeding',
    columns: [moreColumn('egg_groups'), moreColumn('growth_rate'), moreColumn('hatch_counter')],
  },
];

// Fusion columns get their own group, and only appear when Infinite Fusion Mode is on.
export function getMoreColumnGroups(infiniteFusionEnabled) {
  if (!infiniteFusionEnabled) return MORE_COLUMN_GROUPS;
  return [...MORE_COLUMN_GROUPS, { label: 'Infinite Fusion', columns: FUSION_COLUMNS }];
}

export function getMoreColumns(infiniteFusionEnabled) {
  return getMoreColumnGroups(infiniteFusionEnabled).flatMap((g) => g.columns);
}

export function getColumnOptions(infiniteFusionEnabled) {
  return [...PRIMARY_COLUMNS, ...getMoreColumns(infiniteFusionEnabled)];
}

// `columns` is the user's chosen display order (drag-to-reorder mutates it directly),
// so active columns must follow ITS order — not the fixed picker order above.
export function getOrderedActiveColumns(infiniteFusionEnabled, columns) {
  const byKey = new Map(getColumnOptions(infiniteFusionEnabled).map((c) => [c.key, c]));
  return columns.map((key) => byKey.get(key)).filter(Boolean);
}

// Purely numeric columns follow tabular convention: right-aligned, header included.
export const ALIGN_RIGHT_KEYS = new Set([
  'hp',
  'attack',
  'defense',
  'special_attack',
  'special_defense',
  'speed',
  'base_stat_total',
  'capture_rate',
  'base_happiness',
  'hatch_counter',
  'head_total',
  'body_total',
]);

export const DEFAULT_COLUMNS = [
  'types',
  'hp',
  'attack',
  'defense',
  'special_attack',
  'special_defense',
  'speed',
];
