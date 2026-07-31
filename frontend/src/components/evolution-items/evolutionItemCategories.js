// "How it's used" grouping — the primary sort for the Evolution Items page. Order matters:
// Use is the most recognizable/common category so it leads; Hold + Linking Cord is the least
// common and needs the most explanation, so it trails. See Notes/EvoItems.md.
export const CATEGORY_ORDER = ['use', 'hold-level', 'hold-linking-cord'];

export const CATEGORY_META = {
  use: {
    label: 'Use',
    description: 'Use directly from your bag.',
  },
  'hold-level': {
    label: 'Hold + Level Up',
    description: 'Hold the item, then level up (often at a specific time of day).',
  },
  'hold-linking-cord': {
    label: 'Hold + Linking Cord',
    description:
      "Hold the item, then use a Linking Cord — Infinite Fusion's single-player stand-in for trade evolutions.",
  },
};
