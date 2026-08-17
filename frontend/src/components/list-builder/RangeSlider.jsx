// Compact dual-thumb range slider shared by every numeric-range criterion (Base Stat
// Total, the 6 individual stats, Catch Rate, Base Friendship, Egg Cycles) — replaces the
// old bespoke min/max number-input pair per filter. `value` is the same {min,max} shape
// CriteriaPanel already stores ('' means unbounded on that side).
export function RangeSlider({ min, max, step = 1, value, onChange }) {
  const lo = value?.min === '' || value?.min == null ? min : Number(value.min);
  const hi = value?.max === '' || value?.max == null ? max : Number(value.max);

  function handleMinChange(e) {
    onChange({ ...value, min: Math.min(Number(e.target.value), hi) });
  }

  function handleMaxChange(e) {
    onChange({ ...value, max: Math.max(Number(e.target.value), lo) });
  }

  const loPct = ((lo - min) / (max - min)) * 100;
  const hiPct = ((hi - min) / (max - min)) * 100;

  return (
    <div className="range-slider">
      <div className="range-slider-track">
        <div className="range-slider-fill" style={{ left: `${loPct}%`, right: `${100 - hiPct}%` }} />
      </div>
      <input
        type="range"
        className="range-slider-input"
        min={min}
        max={max}
        step={step}
        value={lo}
        onChange={handleMinChange}
        aria-label="Minimum"
      />
      <input
        type="range"
        className="range-slider-input"
        min={min}
        max={max}
        step={step}
        value={hi}
        onChange={handleMaxChange}
        aria-label="Maximum"
      />
      <div className="range-slider-values">
        <span>{lo}</span>
        <span>{hi}</span>
      </div>
    </div>
  );
}
