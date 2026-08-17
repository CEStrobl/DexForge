import { GENERATIONS, toDisplayName } from '../../utils/format';

// Python-identifier-safe stat keys (backend maps special_attack -> "special-attack" etc.)
// min/max/step are slider bounds only (generous, rounded) — the criterion itself is still
// whatever the user drags to, not clamped to any "real" in-game maximum.
export const STAT_CRITERIA = [
  { key: 'hp', label: 'HP', min: 0, max: 255 },
  { key: 'attack', label: 'Attack', min: 0, max: 190 },
  { key: 'defense', label: 'Defense', min: 0, max: 230 },
  { key: 'special_attack', label: 'Sp. Atk', min: 0, max: 194 },
  { key: 'special_defense', label: 'Sp. Def', min: 0, max: 230 },
  { key: 'speed', label: 'Speed', min: 0, max: 200 },
];

export const EGG_GROUPS = [
  'monster', 'water1', 'water2', 'water3', 'bug', 'flying', 'ground', 'fairy',
  'plant', 'humanshape', 'mineral', 'indeterminate', 'ditto', 'dragon', 'no-eggs',
];

export const GROWTH_RATES = [
  { value: 'slow', label: 'Slow' },
  { value: 'medium', label: 'Medium' },
  { value: 'fast', label: 'Fast' },
  { value: 'medium-slow', label: 'Medium Slow' },
  { value: 'slow-then-very-fast', label: 'Slow then Very Fast' },
  { value: 'fast-then-very-slow', label: 'Fast then Very Slow' },
];

const EGG_GROUP_OPTIONS = EGG_GROUPS.map((g) => ({ value: g, label: toDisplayName(g) }));
const EV_YIELD_OPTIONS = STAT_CRITERIA.map((s) => ({ value: s.key, label: s.label }));

// Single source of truth for every filterable field, shared by both Search (chip-driven,
// `kind` picks the widget) and Advanced Search (`fieldType` picks the operator set — see
// AdvancedSearchPanel.jsx). `isType`/`isAbility` flag the two fields whose Advanced Search
// value input isn't a generic option-chip row (Type reuses the TypeBadge grid, Ability
// reuses the searchable combobox).
export const CRITERIA_GROUPS = {
  primary: [
    { key: 'types', label: 'Type', kind: 'multiselect-type', fieldType: 'categorical-multi', isType: true },
    { key: 'weak_to', label: 'Weakness', kind: 'multiselect-type', fieldType: 'categorical-multi', isType: true },
    { key: 'generations', label: 'Generation', kind: 'chip-multi', fieldType: 'categorical-multi', options: GENERATIONS },
    { key: 'growth_rate', label: 'Growth Rate', kind: 'chip-single', fieldType: 'categorical-single', options: GROWTH_RATES },
    { key: 'abilities', label: 'Ability', kind: 'ability-combobox', fieldType: 'categorical-multi', isAbility: true },
    { key: 'base_stat_total', label: 'Base Stat Total', kind: 'range', fieldType: 'numeric', min: 0, max: 780, step: 5 },
  ],
  stats: STAT_CRITERIA.map((s) => ({ ...s, kind: 'range', fieldType: 'numeric' })),
  more: [
    { key: 'egg_groups', label: 'Egg Group', kind: 'chip-multi', fieldType: 'categorical-multi', options: EGG_GROUP_OPTIONS },
    { key: 'ev_yield_stats', label: 'EV Yield', kind: 'chip-multi', fieldType: 'categorical-multi', options: EV_YIELD_OPTIONS },
    { key: 'capture_rate', label: 'Catch Rate', kind: 'range', fieldType: 'numeric', min: 0, max: 255 },
    { key: 'base_happiness', label: 'Base Friendship', kind: 'range', fieldType: 'numeric', min: 0, max: 255 },
    { key: 'hatch_counter', label: 'Egg Cycles', kind: 'range', fieldType: 'numeric', min: 0, max: 120 },
    { key: 'is_legendary', label: 'Legendary', kind: 'boolean-chip', fieldType: 'boolean' },
    { key: 'is_mythical', label: 'Mythical', kind: 'boolean-chip', fieldType: 'boolean' },
  ],
};

export const ALL_CRITERIA = [...CRITERIA_GROUPS.primary, ...CRITERIA_GROUPS.stats, ...CRITERIA_GROUPS.more];

// Fields that only make sense in Advanced Search, not Search's chip-driven panel — there are
// 800+ moves, too many for a chip grid (same reasoning as Ability), and "can learn move X"
// reads naturally as a query-builder rule but not as a quick visual filter chip. Kept out of
// CRITERIA_GROUPS/ALL_CRITERIA so Search never renders it; AdvancedSearchPanel adds it on top.
export const ADVANCED_ONLY_CRITERIA = [
  { key: 'moves', label: 'Can Learn Move', fieldType: 'categorical-multi', isMove: true },
];

export function defaultCriteriaValue(criterion) {
  if (criterion.fieldType === 'boolean') return false;
  if (criterion.fieldType === 'numeric') return { min: '', max: '' };
  if (criterion.fieldType === 'categorical-multi') return [];
  return ''; // categorical-single
}

// Search's criteria state always holds every field (at its inactive default) rather than
// only checked-on ones — there's no separate enable/disable step anymore, a field is
// "active" purely by virtue of its value differing from this default.
export const DEFAULT_CRITERIA = Object.fromEntries(ALL_CRITERIA.map((c) => [c.key, defaultCriteriaValue(c)]));
