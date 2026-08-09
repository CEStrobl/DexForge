import { useEffect, useState } from 'react';
import { TypeBadge } from '../common/TypeBadge';
import { TYPE_ORDER } from '../common/typeIcons';
import { CollapsibleHeader } from '../common/CollapsibleHeader';
import { toDisplayName } from '../../utils/format';
import { CRITERIA_GROUPS, ALL_CRITERIA } from './criteria';
import { api } from '../../api/client';

function defaultValueFor(kind) {
  if (kind === 'boolean') return true;
  if (kind === 'range') return { min: '', max: '' };
  if (kind === 'multiselect-type' || kind === 'multiselect-pills') return [];
  return '';
}

function buildRequestBody(criteria) {
  const body = {};
  for (const [key, value] of Object.entries(criteria)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      if (value.length > 0) body[key] = value;
    } else if (typeof value === 'object') {
      if (value.min !== '' && value.min != null) body[`${key}_min`] = Number(value.min);
      if (value.max !== '' && value.max != null) body[`${key}_max`] = Number(value.max);
    } else if (value !== '') {
      body[key] = value;
    }
  }
  return body;
}

function CriterionInput({ criterion, value, onChange, abilityOptions }) {
  const { kind, options } = criterion;

  if (kind === 'range') {
    const v = value || { min: '', max: '' };
    return (
      <div className="criterion-range">
        <input
          type="number"
          placeholder="Min"
          value={v.min}
          onChange={(e) => onChange({ ...v, min: e.target.value })}
        />
        <span className="criterion-range-sep">–</span>
        <input
          type="number"
          placeholder="Max"
          value={v.max}
          onChange={(e) => onChange({ ...v, max: e.target.value })}
        />
      </div>
    );
  }

  if (kind === 'multiselect-type') {
    const selected = value || [];
    return (
      <div className="criteria-type-toggles">
        {TYPE_ORDER.map((type) => (
          <button
            key={type}
            type="button"
            className={`criteria-type-toggle${selected.includes(type) ? ' active' : ''}`}
            onClick={() =>
              onChange(
                selected.includes(type) ? selected.filter((t) => t !== type) : [...selected, type]
              )
            }
          >
            <TypeBadge type={type} />
          </button>
        ))}
      </div>
    );
  }

  if (kind === 'multiselect-pills') {
    const selected = value || [];
    return (
      <div className="criteria-pill-toggles">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            className={`criteria-pill-toggle${selected.includes(opt) ? ' active' : ''}`}
            onClick={() =>
              onChange(selected.includes(opt) ? selected.filter((o) => o !== opt) : [...selected, opt])
            }
          >
            {toDisplayName(opt)}
          </button>
        ))}
      </div>
    );
  }

  if (kind === 'select') {
    return (
      <select value={value || ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">Any</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  if (kind === 'ability-select') {
    return (
      <select value={value || ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">Any</option>
        {abilityOptions.map((a) => (
          <option key={a} value={a}>
            {toDisplayName(a)}
          </option>
        ))}
      </select>
    );
  }

  return null;
}

function CriterionRow({ criterion, checked, value, onToggle, onChange, abilityOptions }) {
  return (
    <div className="criterion-row">
      <label className="criterion-checkbox-label">
        <input type="checkbox" checked={checked} onChange={() => onToggle(criterion.key)} />
        {criterion.label}
      </label>
      {checked && criterion.kind !== 'boolean' && (
        <CriterionInput
          criterion={criterion}
          value={value}
          onChange={(v) => onChange(criterion.key, v)}
          abilityOptions={abilityOptions}
        />
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

  function toggleCriterion(key) {
    const next = { ...criteria };
    if (key in next) {
      delete next[key];
    } else {
      const def = ALL_CRITERIA.find((c) => c.key === key);
      next[key] = defaultValueFor(def.kind);
    }
    onCriteriaChange(next);
  }

  function updateValue(key, value) {
    onCriteriaChange({ ...criteria, [key]: value });
  }

  async function handlePreview() {
    setLoading(true);
    try {
      const results = await api.post('/api/lists/preview', buildRequestBody(criteria));
      onResults(results);
    } catch {
      onResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <CollapsibleHeader title="Search Filters" open={open} onToggle={() => setOpen((p) => !p)} />

      {open && (
        <div className="collapsible-fade-in">
          <div className="criteria-list criteria-list-grid">
            {CRITERIA_GROUPS.primary.map((criterion) => (
              <CriterionRow
                key={criterion.key}
                criterion={criterion}
                checked={criterion.key in criteria}
                value={criteria[criterion.key]}
                onToggle={toggleCriterion}
                onChange={updateValue}
                abilityOptions={abilityOptions}
              />
            ))}
          </div>

          <div className="criteria-more">
            <CollapsibleHeader title="Stats" open={showStats} onToggle={() => setShowStats((p) => !p)} />
            {showStats && (
              <div className="criteria-list criteria-list-grid collapsible-fade-in">
                {CRITERIA_GROUPS.stats.map((criterion) => (
                  <CriterionRow
                    key={criterion.key}
                    criterion={criterion}
                    checked={criterion.key in criteria}
                    value={criteria[criterion.key]}
                    onToggle={toggleCriterion}
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
              <div className="criteria-list criteria-list-grid collapsible-fade-in">
                {CRITERIA_GROUPS.more.map((criterion) => (
                  <CriterionRow
                    key={criterion.key}
                    criterion={criterion}
                    checked={criterion.key in criteria}
                    value={criteria[criterion.key]}
                    onToggle={toggleCriterion}
                    onChange={updateValue}
                    abilityOptions={abilityOptions}
                  />
                ))}
              </div>
            )}
          </div>

          <button type="button" className="action-btn" onClick={handlePreview} disabled={loading}>
            {loading ? 'Searching...' : 'Preview Matches'}
          </button>
        </div>
      )}
    </div>
  );
}
