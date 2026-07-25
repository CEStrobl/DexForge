export function toSlug(name) {
  return name.toLowerCase().trim().replace(/\s+/g, '-');
}

export function toDisplayName(slug) {
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export const STAT_LABELS = {
  hp: 'HP',
  attack: 'ATK',
  defense: 'DEF',
  'special-attack': 'SP.A',
  'special-defense': 'SP.D',
  speed: 'SPD',
};

export const STAT_FULL_LABELS = {
  hp: 'HP',
  attack: 'Att',
  defense: 'Def',
  'special-attack': 'SpA',
  'special-defense': 'SpD',
  speed: 'Speed',
};

export const STAT_ORDER = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'];

export const GENERATIONS = [
  { value: 'generation-i', label: 'Kanto (I)' },
  { value: 'generation-ii', label: 'Johto (II)' },
  { value: 'generation-iii', label: 'Hoenn (III)' },
  { value: 'generation-iv', label: 'Sinnoh (IV)' },
  { value: 'generation-v', label: 'Unova (V)' },
  { value: 'generation-vi', label: 'Kalos (VI)' },
  { value: 'generation-vii', label: 'Alola (VII)' },
  { value: 'generation-viii', label: 'Galar (VIII)' },
  { value: 'generation-ix', label: 'Paldea (IX)' },
];

const REGION_BY_GENERATION = Object.fromEntries(
  GENERATIONS.map(({ value, label }) => [value, label.split(' (')[0]])
);

export function formatRegion(gen) {
  return REGION_BY_GENERATION[gen] || '—';
}

export function formatGrowthRate(rate) {
  if (!rate) return '—';
  return toDisplayName(rate);
}

const EV_STAT_ABBR = {
  hp: 'HP',
  attack: 'Att',
  defense: 'Def',
  'special-attack': 'SpA',
  'special-defense': 'SpD',
  speed: 'Speed',
};

export function formatEvYield(evYield) {
  if (!evYield || evYield.length === 0) return '—';
  return evYield.map((e) => `${e.value} ${EV_STAT_ABBR[e.stat] || e.stat}`).join(', ');
}

export function formatCatchRate(rate) {
  if (rate == null) return '—';
  return `${rate} / 255`;
}

export function formatFriendship(value) {
  if (value == null) return '—';
  if (value < 50) return `${value} (low)`;
  if (value > 50) return `${value} (high)`;
  return `${value} (normal)`;
}

export function formatGenderRatio(rate) {
  if (rate == null) return '—';
  if (rate === -1) return 'Genderless';
  const femalePct = (rate / 8) * 100;
  const malePct = 100 - femalePct;
  return `${malePct}% ♂ / ${femalePct}% ♀`;
}

export function formatEggCycles(cycles) {
  if (cycles == null) return '—';
  return `${cycles} cycles`;
}

export function formatAvgSteps(cycles) {
  if (cycles == null) return '—';
  const low = cycles * 256;
  const high = (cycles + 1) * 256;
  return `${low.toLocaleString()} – ${high.toLocaleString()} steps`;
}
