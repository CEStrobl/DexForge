// Pokémon Infinite Fusion's head/body split: the head contributes HP/Sp.Atk/Sp.Def
// and its first type; the body contributes Attack/Defense/Speed and its second type.
export const HEAD_STAT_KEYS = ['hp', 'special-attack', 'special-defense'];
export const BODY_STAT_KEYS = ['attack', 'defense', 'speed'];

export function sumStats(stats, keys) {
  return keys.reduce((sum, k) => sum + (stats?.[k] ?? 0), 0);
}

// A fused stat bar is colored by whichever side contributes it: HP/Sp.Atk/Sp.Def take the
// head's type, Attack/Defense/Speed take the body's — matching the same head/body split the
// stat formula itself uses. A fusion that resolves to a single type (duplicate secondary)
// colors every stat the same, since there's no second contributing type to distinguish.
export function statTypeColor(statKey, types) {
  if (!types || types.length === 0) return null;
  if (types.length === 1) return `var(--type-${types[0]})`;
  const type = HEAD_STAT_KEYS.includes(statKey) ? types[0] : types[1];
  return `var(--type-${type})`;
}
