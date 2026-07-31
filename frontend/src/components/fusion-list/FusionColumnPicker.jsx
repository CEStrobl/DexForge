import { FUSION_LIST_COLUMN_OPTIONS } from './fusionColumns';

// Short, flat option set (unlike list-builder's ColumnPicker) — a fusion has no
// generation/breeding/training fields to tuck under a +More panel.
export function FusionColumnPicker({ columns, onChange }) {
  function toggle(key) {
    onChange(columns.includes(key) ? columns.filter((c) => c !== key) : [...columns, key]);
  }

  return (
    <div className="column-picker">
      <div className="column-picker-row">
        {FUSION_LIST_COLUMN_OPTIONS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={`column-picker-toggle${columns.includes(key) ? ' active' : ''}`}
            onClick={() => toggle(key)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
