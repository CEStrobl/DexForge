import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PRIMARY_COLUMNS, MORE_COLUMNS } from './columns';

export function ColumnPicker({ columns, onChange }) {
  const [showMore, setShowMore] = useState(false);

  function toggle(key) {
    onChange(columns.includes(key) ? columns.filter((c) => c !== key) : [...columns, key]);
  }

  return (
    <div className="column-picker">
      {PRIMARY_COLUMNS.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          className={`column-picker-toggle${columns.includes(key) ? ' active' : ''}`}
          onClick={() => toggle(key)}
        >
          {label}
        </button>
      ))}
      {showMore &&
        MORE_COLUMNS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={`column-picker-toggle${columns.includes(key) ? ' active' : ''}`}
            onClick={() => toggle(key)}
          >
            {label}
          </button>
        ))}
      <button
        type="button"
        className="column-picker-more-btn"
        onClick={() => setShowMore((prev) => !prev)}
      >
        <Plus size={12} />
        {showMore ? 'Less' : 'More'}
      </button>
    </div>
  );
}
