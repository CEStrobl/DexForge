import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { TypeBadge } from '../common/TypeBadge';
import { TYPE_ORDER } from '../common/typeIcons';
import { CollapsibleHeader } from '../common/CollapsibleHeader';
import { toDisplayName } from '../../utils/format';
import { CRITERIA_GROUPS, ALL_CRITERIA, defaultCriteriaValue } from './criteria';
import { RangeSlider } from './RangeSlider';
import { SearchCombobox } from './SearchCombobox';
import { api } from '../../api/client';

// Search is chip-driven end to end: the toggle control and the filter control are the same
// thing (no checkbox that reveals a picker). Every field in `criteria` is always present at
// its inactive default (see DEFAULT_CRITERIA) — a field is "active" purely because its value
// differs from that default, not because of a separate enabled flag.
function buildRequestBody(criteria) {
  const body = {};
  for (const [key, value] of Object.entries(criteria)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      if (value.length > 0) body[key] = value;
    } else if (typeof value === 'boolean') {
      if (value) body[key] = value;
    } else if (typeof value === 'object') {
      const def = ALL_CRITERIA.find((c) => c.key === key);
      if (value.min !== '' && value.min != null && (!def || Number(value.min) > def.min)) {
        body[`${key}_min`] = Number(value.min);
      }
      if (value.max !== '' && value.max != null && (!def || Number(value.max) < def.max)) {
        body[`${key}_max`] = Number(value.max);
      }
    } else if (value !== '') {
      body[key] = value;
    }
  }
  return body;
}

function isCriterionActive(criterion, value) {
  if (criterion.fieldType === 'boolean') return !!value;
  if (criterion.fieldType === 'categorical-multi') return (value || []).length > 0;
  if (criterion.fieldType === 'categorical-single') return !!value;
  if (criterion.fieldType === 'numeric') {
    const v = value || {};
    return (v.min !== '' && v.min != null && v.min > criterion.min) || (v.max !== '' && v.max != null && v.max < criterion.max);
  }
  return false;
}

function summarizeValue(criterion, value) {
  const { kind, options } = criterion;
  if (kind === 'range') {
    const v = value || {};
    const min = v.min !== '' && v.min != null && v.min > criterion.min ? v.min : null;
    const max = v.max !== '' && v.max != null && v.max < criterion.max ? v.max : null;
    if (min == null && max == null) return null;
    return `${min ?? criterion.min}–${max ?? criterion.max}`;
  }
  if (kind === 'multiselect-type') {
    const selected = value || [];
    return selected.length > 0 ? selected.map(toDisplayName).join(', ') : null;
  }
  if (kind === 'chip-multi' || kind === 'ability-combobox') {
    const selected = value || [];
    if (selected.length === 0) return null;
    if (!options) return selected.map(toDisplayName).join(', ');
    return selected.map((v) => options.find((o) => o.value === v)?.label || toDisplayName(v)).join(', ');
  }
  if (kind === 'chip-single') {
    if (!value) return null;
    return options.find((o) => o.value === value)?.label || toDisplayName(value);
  }
  return null;
}

function AppliedFiltersStrip({ criteria, onRemove }) {
  const active = ALL_CRITERIA.filter((c) => isCriterionActive(c, criteria[c.key]));
  if (active.length === 0) return null;

  return (
    <div className="applied-filters-strip">
      {active.map((criterion) => {
        const summary = summarizeValue(criterion, criteria[criterion.key]);
        return (
          <button
            type="button"
            key={criterion.key}
            className="applied-filter-chip"
            onClick={() => onRemove(criterion.key)}
            title={`Remove ${criterion.label} filter`}
          >
            <span>{summary ? `${criterion.label}: ${summary}` : criterion.label}</span>
            <X size={12} />
          </button>
        );
      })}
    </div>
  );
}

function TypeChipGrid({ selected, onChange }) {
  return (
    <div className="criteria-type-toggles">
      {TYPE_ORDER.map((type) => (
        <button
          key={type}
          type="button"
          className={`criteria-type-toggle${selected.includes(type) ? ' active' : ''}`}
          onClick={() =>
            onChange(selected.includes(type) ? selected.filter((t) => t !== type) : [...selected, type])
          }
        >
          <TypeBadge type={type} />
        </button>
      ))}
    </div>
  );
}

function ChipMultiField({ options, selected, onChange }) {
  return (
    <div className="criteria-pill-toggles">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`criteria-pill-toggle${selected.includes(opt.value) ? ' active' : ''}`}
          onClick={() =>
            onChange(selected.includes(opt.value) ? selected.filter((v) => v !== opt.value) : [...selected, opt.value])
          }
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function ChipSingleField({ options, value, onChange }) {
  return (
    <div className="criteria-pill-toggles">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`criteria-pill-toggle${value === opt.value ? ' active' : ''}`}
          onClick={() => onChange(value === opt.value ? '' : opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function BooleanChip({ label, checked, onChange }) {
  return (
    <button
      type="button"
      className={`criteria-pill-toggle criteria-boolean-chip${checked ? ' active' : ''}`}
      onClick={() => onChange(!checked)}
    >
      {label}
    </button>
  );
}

function FilterField({ criterion, value, onChange, abilityOptions }) {
  const { kind } = criterion;
  const handleChange = (v) => onChange(criterion.key, v);

  if (kind === 'boolean-chip') {
    return (
      <div className="filter-field filter-field-boolean">
        <BooleanChip label={criterion.label} checked={!!value} onChange={handleChange} />
      </div>
    );
  }

  return (
    <div className="filter-field">
      <div className="filter-field-label">{criterion.label}</div>
      {kind === 'multiselect-type' && <TypeChipGrid selected={value || []} onChange={handleChange} />}
      {kind === 'chip-multi' && <ChipMultiField options={criterion.options} selected={value || []} onChange={handleChange} />}
      {kind === 'chip-single' && <ChipSingleField options={criterion.options} value={value || ''} onChange={handleChange} />}
      {kind === 'range' && (
        <RangeSlider min={criterion.min} max={criterion.max} step={criterion.step} value={value} onChange={handleChange} />
      )}
      {kind === 'ability-combobox' && (
        <SearchCombobox options={abilityOptions} selected={value || []} onChange={handleChange} placeholder="Search abilities..." />
      )}
    </div>
  );
}

export function CriteriaPanel({ criteria, onCriteriaChange, onResults }) {
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [abilityOptions, setAbilityOptions] = useState([]);

  useEffect(() => {
    api
      .get('/api/pokemon/abilities')
      .then(setAbilityOptions)
      .catch(() => setAbilityOptions([]));
  }, []);

  function updateValue(key, value) {
    onCriteriaChange({ ...criteria, [key]: value });
  }

  function resetField(key) {
    const def = ALL_CRITERIA.find((c) => c.key === key);
    updateValue(key, defaultCriteriaValue(def));
  }

  // Live preview: results refetch automatically as criteria change, debounced so dragging
  // a range slider doesn't fire a request per pixel. No active filters resets results to
  // null (rather than fetching the full ~1000-entry unfiltered dex).
  useEffect(() => {
    const body = buildRequestBody(criteria);
    if (Object.keys(body).length === 0) {
      onResults(null);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      api
        .post('/api/lists/preview', body)
        .then(onResults)
        .catch(() => onResults([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [criteria]);

  return (
    <div className="card">
      <AppliedFiltersStrip criteria={criteria} onRemove={resetField} />

      <CollapsibleHeader title="Search Filters" open={open} onToggle={() => setOpen((p) => !p)} />

      {open && (
        <div>
          <div className="criteria-list">
            {CRITERIA_GROUPS.primary.map((criterion) => (
              <FilterField
                key={criterion.key}
                criterion={criterion}
                value={criteria[criterion.key]}
                onChange={updateValue}
                abilityOptions={abilityOptions}
              />
            ))}
          </div>

          <div className="criteria-more">
            <CollapsibleHeader title="Stats" open={showStats} onToggle={() => setShowStats((p) => !p)} />
            {showStats && (
              <div className="criteria-list">
                {CRITERIA_GROUPS.stats.map((criterion) => (
                  <FilterField
                    key={criterion.key}
                    criterion={criterion}
                    value={criteria[criterion.key]}
                    onChange={updateValue}
                    abilityOptions={abilityOptions}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="criteria-more">
            <CollapsibleHeader title="More Filters" open={showMore} onToggle={() => setShowMore((p) => !p)} />
            {showMore && (
              <div className="criteria-list">
                {CRITERIA_GROUPS.more.map((criterion) => (
                  <FilterField
                    key={criterion.key}
                    criterion={criterion}
                    value={criteria[criterion.key]}
                    onChange={updateValue}
                    abilityOptions={abilityOptions}
                  />
                ))}
              </div>
            )}
          </div>

          {loading && <p className="text-muted criteria-loading">Updating results…</p>}
        </div>
      )}
    </div>
  );
}
