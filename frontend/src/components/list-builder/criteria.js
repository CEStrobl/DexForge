import { GENERATIONS } from '../../utils/format';

// Python-identifier-safe stat keys (backend maps special_attack -> "special-attack" etc.)
export const STAT_CRITERIA = [
  { key: 'hp', label: 'HP' },
  { key: 'attack', label: 'Attack' },
  { key: 'defense', label: 'Defense' },
  { key: 'special_attack', label: 'Sp. Atk' },
  { key: 'special_defense', label: 'Sp. Def' },
  { key: 'speed', label: 'Speed' },
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

// Each criterion: key (criteria/column identifier), label, kind (drives which
// input control CriteriaPanel renders), and options where relevant.
export const CRITERIA_GROUPS = {
  primary: [
    { key: 'generation', label: 'Generation', kind: 'select', options: GENERATIONS },
    { key: 'types', label: 'Type', kind: 'multiselect-type' },
    { key: 'base_stat_total', label: 'Base Stat Total', kind: 'range' },
    { key: 'weak_to', label: 'Weakness', kind: 'multiselect-type' },
    { key: 'ability', label: 'Ability', kind: 'ability-select' },
  ],
  stats: STAT_CRITERIA.map((s) => ({ ...s, kind: 'range' })),
  more: [
    { key: 'egg_groups', label: 'Egg Group', kind: 'multiselect-pills', options: EGG_GROUPS },
    {
      key: 'ev_yield_stats',
      label: 'EV Yield',
      kind: 'multiselect-pills',
      options: STAT_CRITERIA.map((s) => s.key),
    },
    { key: 'growth_rate', label: 'Growth Rate', kind: 'select', options: GROWTH_RATES },
    { key: 'capture_rate', label: 'Catch Rate', kind: 'range' },
    { key: 'base_happiness', label: 'Base Friendship', kind: 'range' },
    { key: 'hatch_counter', label: 'Egg Cycles', kind: 'range' },
    { key: 'is_legendary', label: 'Legendary', kind: 'boolean' },
    { key: 'is_mythical', label: 'Mythical', kind: 'boolean' },
  ],
};

export const ALL_CRITERIA = [...CRITERIA_GROUPS.primary, ...CRITERIA_GROUPS.stats, ...CRITERIA_GROUPS.more];
