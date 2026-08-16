// Computes fixed-position coordinates for a portal-rendered dropdown anchored to a
// trigger element, flipping to open upward (anchored by `bottom` instead of `top`)
// when there isn't enough room below the viewport — e.g. a row-actions menu on the
// last row of a long scrollable list would otherwise render off the bottom edge.
export function computeMenuPosition(triggerRect, { menuWidth = 200, estimatedHeight = 320, gap = 4 } = {}) {
  const spaceBelow = window.innerHeight - triggerRect.bottom;
  const spaceAbove = triggerRect.top;
  const openUpward = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;

  // Both top and bottom are always set explicitly (never omitted) — .row-actions-panel's
  // own stylesheet rule sets a default `top`, and leaving the inline style's `top` as
  // `undefined` doesn't clear that rule, it just falls through to it.
  return {
    left: Math.max(8, triggerRect.right - menuWidth),
    top: openUpward ? 'auto' : triggerRect.bottom + gap,
    bottom: openUpward ? window.innerHeight - triggerRect.top + gap : 'auto',
  };
}
