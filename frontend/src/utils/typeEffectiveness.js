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
