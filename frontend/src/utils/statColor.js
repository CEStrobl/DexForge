const STOPS = [
  { value: 20, rgb: [239, 68, 68] },   // red
  { value: 60, rgb: [249, 115, 22] },  // orange
  { value: 90, rgb: [234, 179, 8] },   // yellow
  { value: 120, rgb: [34, 197, 94] },  // green
  { value: 160, rgb: [59, 130, 246] }, // blue
];

export function getStatColor(value) {
  if (value <= STOPS[0].value) return rgbToCss(STOPS[0].rgb);
  if (value >= STOPS[STOPS.length - 1].value) return rgbToCss(STOPS[STOPS.length - 1].rgb);

  for (let i = 0; i < STOPS.length - 1; i++) {
    const a = STOPS[i];
    const b = STOPS[i + 1];
    if (value >= a.value && value <= b.value) {
      const t = (value - a.value) / (b.value - a.value);
      const rgb = a.rgb.map((channel, idx) => Math.round(channel + (b.rgb[idx] - channel) * t));
      return rgbToCss(rgb);
    }
  }
  return rgbToCss(STOPS[STOPS.length - 1].rgb);
}

function rgbToCss([r, g, b]) {
  return `rgb(${r}, ${g}, ${b})`;
}
