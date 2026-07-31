import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { PRIMARY_COLUMNS, getMoreColumnGroups } from './columns';
import { useInfiniteFusion } from '../../context/InfiniteFusionContext';

export function ColumnPicker({ columns, onChange }) {
  const [showMore, setShowMore] = useState(false);
  const [openGroups, setOpenGroups] = useState(() => new Set());
  const { enabled: infiniteFusionEnabled } = useInfiniteFusion();
  const moreGroups = getMoreColumnGroups(infiniteFusionEnabled);

  function toggle(key) {
    onChange(columns.includes(key) ? columns.filter((c) => c !== key) : [...columns, key]);
  }

  function toggleGroup(label) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  return (
    <div className="column-picker">
      <div className="column-picker-row">
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
        <button
          type="button"
          className="column-picker-more-btn"
          onClick={() => setShowMore((prev) => !prev)}
        >
          <Plus size={12} />
          {showMore ? 'Less' : 'More'}
        </button>
      </div>

      {showMore && (
        <div className="column-picker-more-panel">
          {moreGroups.map((group) => {
            const open = openGroups.has(group.label);
            const activeCount = group.columns.filter((c) => columns.includes(c.key)).length;
            return (
              <div key={group.label} className="column-picker-group">
                <button
                  type="button"
                  className="column-picker-group-header"
                  onClick={() => toggleGroup(group.label)}
                  aria-expanded={open}
                >
                  {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <span>{group.label}</span>
                  {activeCount > 0 && <span className="column-picker-group-count">{activeCount}</span>}
                </button>
                {open && (
                  <div className="column-picker-group-body">
                    {group.columns.map(({ key, label }) => (
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
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
