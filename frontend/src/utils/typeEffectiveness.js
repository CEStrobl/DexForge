export function formatMultiplier(multiplier) {
  if (multiplier === 0.25) return '¼×';
  if (multiplier === 0.5) return '½×';
  return `${multiplier}×`;
}

export function multiplierClass(multiplier) {
  if (multiplier === 0) return 'immune';
  if (multiplier < 1) return 'resist';
  if (multiplier > 1) return 'weak';
  return 'neutral';
}

// Finer-grained tier than multiplierClass — splits weak/resist into their two
// severities so the summary grid can size/color 4x heavier than 2x (and 1/4x
// heavier than 1/2x), not just lump them into one "weak" or "resist" color.
export function multiplierTier(multiplier) {
  if (multiplier === 0) return 'immune';
  if (multiplier === 4) return 'weak4';
  if (multiplier === 2) return 'weak2';
  if (multiplier === 0.25) return 'resist4';
  if (multiplier === 0.5) return 'resist2';
  return 'neutral';
}
