import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { TypeBadge } from '../common/TypeBadge';
import { TYPE_ORDER } from '../common/typeIcons';
import { TypeDropdown } from '../common/TypeDropdown';
import { ALL_CRITERIA, ADVANCED_ONLY_CRITERIA } from './criteria';
import { SearchCombobox } from './SearchCombobox';
import { api } from '../../api/client';

// Same field list Search uses (criteria.js), plus a few fields ONLY Advanced Search exposes
// (e.g. Move — too many values for a chip grid and doesn't read as a quick visual filter).
// One shared source of truth for field labels/options either way: Search uses `kind` to pick
// its widget, Advanced Search uses `fieldType` to pick its operator set.
const FIELDS = [...ALL_CRITERIA, ...ADVANCED_ONLY_CRITERIA];

const OPERATORS_BY_TYPE = {
  'categorical-single': [
    { value: 'is', label: 'is' },
    { value: 'is_not', label: 'is not' },
  ],
  'categorical-multi': [
    { value: 'is', label: 'is' },
    { value: 'is_not', label: 'is not' },
    { value: 'has_any_of', label: 'has any of' },
    { value: 'has_none_of', label: 'has none of' },
  ],
  boolean: [{ value: 'is', label: 'is' }],
  numeric: [
    { value: 'is', label: 'is' },
    { value: 'is_not', label: 'is not' },
    { value: 'greater_than', label: 'greater than' },
    { value: 'less_than', label: 'less than' },
    { value: 'between', label: 'between' },
  ],
};

const MOVE_METHODS = [
  { value: '', label: 'Any method' },
  { value: 'level-up', label: 'Level Up' },
  { value: 'machine', label: 'TM/Machine' },
  { value: 'egg', label: 'Egg Move' },
  { value: 'tutor', label: 'Move Tutor' },
];

function defaultValueForField(field, operator) {
  if (field.fieldType === 'boolean') return true;
  // Move carries an optional learn-method clause alongside the move list, so it needs its
  // own shape rather than the plain array every other categorical-multi field uses.
  if (field.key === 'moves') return { moves: [], method: '' };
  if (field.fieldType === 'categorical-multi') return [];
  if (field.fieldType === 'categorical-single') return '';
  if (operator === 'between') return { min: '', max: '' };
  return '';
}

// A Pokémon can have at most 2 types, so "Type is [...]" (exact set equality) can only ever
// match with 1 or 2 selected — anything more is a guaranteed-empty query. "is not"/"has any
// of"/"has none of" don't have that constraint, so they stay unlimited.
function maxSelections(field, operator) {
  if (field.key === 'types' && operator === 'is') return 2;
  return null;
}

// Move pools run 50-150+ entries deep — "is"/"is not" (exact-set equality) would need every
// single learnable move selected to ever match, a guaranteed-empty trap rather than a useful
// query. Only the intersection-style operators make sense for a field this large.
function operatorsForField(field) {
  const base = OPERATORS_BY_TYPE[field.fieldType];
  if (field.key === 'moves') {
    return base.filter((op) => op.value === 'has_any_of' || op.value === 'has_none_of');
  }
  return base;
}

let ruleIdCounter = 0;
function makeRule(field) {
  const operator = operatorsForField(field)[0].value;
  return {
    id: ++ruleIdCounter,
    field: field.key,
    operator,
    value: defaultValueForField(field, operator),
    join: 'and',
  };
}

function isRuleComplete(rule, field) {
  if (!field) return false;
  if (field.fieldType === 'boolean') return true;
  if (field.key === 'moves') return (rule.value?.moves || []).length > 0;
  if (field.fieldType === 'categorical-multi') return (rule.value || []).length > 0;
  if (field.fieldType === 'categorical-single') return !!rule.value;
  if (rule.operator === 'between') {
    const v = rule.value || {};
    return v.min !== '' || v.max !== '';
  }
  return rule.value !== '' && rule.value != null;
}

function ValueInput({ field, rule, onChange, abilityOptions, moveOptions }) {
  if (field.fieldType === 'boolean') {
    return (
      <div className="advanced-bool-toggle">
        <button type="button" className={rule.value === true ? 'active' : ''} onClick={() => onChange(true)}>
          Yes
        </button>
        <button type="button" className={rule.value === false ? 'active' : ''} onClick={() => onChange(false)}>
          No
        </button>
      </div>
    );
  }

  if (field.isAbility) {
    return <SearchCombobox options={abilityOptions} selected={rule.value || []} onChange={onChange} placeholder="Search abilities..." />;
  }

  if (field.isMove) {
    const v = rule.value || { moves: [], method: '' };
    return (
      <div className="advanced-move-value">
        <SearchCombobox
          options={moveOptions}
          selected={v.moves || []}
          onChange={(moves) => onChange({ ...v, moves })}
          placeholder="Search moves..."
        />
        <label className="advanced-move-method">
          <span>via</span>
          <select value={v.method || ''} onChange={(e) => onChange({ ...v, method: e.target.value })}>
            {MOVE_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    );
  }

  // Type specifically (not Weakness, which shares the same isType chip-grid flag) picks
  // type(s) via a colored, iconed dropdown (TypeDropdown) — same trigger/panel shape as a
  // plain select, just able to render TypeBadge where a native <select> couldn't, and
  // multi-select since every operator but "is" supports more than one type.
  if (field.key === 'types') {
    return <TypeDropdown value={rule.value || []} onChange={onChange} max={maxSelections(field, rule.operator)} />;
  }

  if (field.fieldType === 'categorical-multi') {
    const options = field.isType ? TYPE_ORDER.map((t) => ({ value: t, label: t })) : field.options;
    const selected = rule.value || [];
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
            {field.isType ? <TypeBadge type={opt.value} /> : opt.label}
          </button>
        ))}
      </div>
    );
  }

  if (field.fieldType === 'categorical-single') {
    return (
      <select value={rule.value || ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">Choose...</option>
        {field.options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  // numeric
  if (rule.operator === 'between') {
    const v = rule.value || { min: '', max: '' };
    return (
      <div className="advanced-numeric-between">
        <input type="number" placeholder="Min" value={v.min} onChange={(e) => onChange({ ...v, min: e.target.value })} />
        <span>–</span>
        <input type="number" placeholder="Max" value={v.max} onChange={(e) => onChange({ ...v, max: e.target.value })} />
      </div>
    );
  }
  return (
    <input
      type="number"
      value={rule.value === '' || rule.value == null ? '' : rule.value}
      onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
    />
  );
}

function RuleRow({ rule, onChange, onRemove, abilityOptions, moveOptions, canRemove }) {
  const field = FIELDS.find((f) => f.key === rule.field) || FIELDS[0];
  const operators = operatorsForField(field);

  function handleFieldChange(key) {
    const nextField = FIELDS.find((f) => f.key === key);
    const operator = operatorsForField(nextField)[0].value;
    onChange({ ...rule, field: key, operator, value: defaultValueForField(nextField, operator) });
  }

  function handleOperatorChange(operator) {
    // Only reset the value when its SHAPE actually changes with the operator (numeric's
    // "between" is {min,max}, every other numeric operator is a single number) — every
    // operator on a categorical-multi/single/boolean field shares one value shape, so e.g.
    // switching Moves from "is" to "has any of" shouldn't wipe an already-picked move.
    const shapeChanges = field.fieldType === 'numeric' && (rule.operator === 'between') !== (operator === 'between');
    let value = shapeChanges ? defaultValueForField(field, operator) : rule.value;
    // Switching Type to "is" while more than 2 are already picked (from an unlimited
    // operator) would silently guarantee zero matches — trim to the new cap instead.
    const max = maxSelections(field, operator);
    if (max != null && Array.isArray(value) && value.length > max) {
      value = value.slice(0, max);
    }
    onChange({ ...rule, operator, value });
  }

  return (
    <div className="advanced-rule-row">
      <select className="advanced-rule-field" value={rule.field} onChange={(e) => handleFieldChange(e.target.value)}>
        {FIELDS.map((f) => (
          <option key={f.key} value={f.key}>
            {f.label}
          </option>
        ))}
      </select>
      <select className="advanced-rule-operator" value={rule.operator} onChange={(e) => handleOperatorChange(e.target.value)}>
        {operators.map((op) => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>
      <div className="advanced-rule-value">
        <ValueInput
          field={field}
          rule={rule}
          onChange={(value) => onChange({ ...rule, value })}
          abilityOptions={abilityOptions}
          moveOptions={moveOptions}
        />
      </div>
      {canRemove && (
        <button type="button" className="advanced-rule-remove" onClick={onRemove} aria-label="Remove rule">
          <X size={14} />
        </button>
      )}
    </div>
  );
}

function JoinToggle({ value, onChange }) {
  return (
    <div className="advanced-join-toggle">
      {['and', 'or'].map((j) => (
        <button key={j} type="button" className={value === j ? 'active' : ''} onClick={() => onChange(j)}>
          {j.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export function AdvancedSearchPanel({ onResults }) {
  const [rules, setRules] = useState(() => [makeRule(FIELDS[0])]);
  const [loading, setLoading] = useState(false);
  const [abilityOptions, setAbilityOptions] = useState([]);
  const [moveOptions, setMoveOptions] = useState([]);

  useEffect(() => {
    api
      .get('/api/pokemon/abilities')
      .then(setAbilityOptions)
      .catch(() => setAbilityOptions([]));
    api
      .get('/api/pokemon/moves')
      .then(setMoveOptions)
      .catch(() => setMoveOptions([]));
  }, []);

  function updateRule(id, next) {
    setRules((prev) => prev.map((r) => (r.id === id ? next : r)));
  }

  function removeRule(id) {
    setRules((prev) => prev.filter((r) => r.id !== id));
  }

  function addRule() {
    setRules((prev) => [...prev, makeRule(FIELDS[0])]);
  }

  // Live evaluation: only complete rules (a real value entered) are sent — an in-progress
  // rule the user hasn't finished filling out just doesn't affect the result yet, rather
  // than blocking the whole chain from evaluating.
  useEffect(() => {
    const complete = rules.filter((r) => isRuleComplete(r, FIELDS.find((f) => f.key === r.field)));
    if (complete.length === 0) {
      onResults(null);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      const body = { rules: complete.map(({ field, operator, value, join }) => ({ field, operator, value, join })) };
      api
        .post('/api/lists/preview/advanced', body)
        .then(onResults)
        .catch(() => onResults([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rules]);

  return (
    <div className="card advanced-search-panel">
      <h3 className="card-heading">Advanced Search</h3>
      <p className="text-muted advanced-search-hint">Build a chain of rules, joined left to right by AND / OR.</p>

      <div className="advanced-rule-list">
        {rules.map((rule, i) => (
          <div key={rule.id} className="advanced-rule-block">
            <RuleRow
              rule={rule}
              onChange={(next) => updateRule(rule.id, next)}
              onRemove={() => removeRule(rule.id)}
              abilityOptions={abilityOptions}
              moveOptions={moveOptions}
              canRemove={rules.length > 1}
            />
            {i < rules.length - 1 && (
              <JoinToggle value={rule.join} onChange={(join) => updateRule(rule.id, { ...rule, join })} />
            )}
          </div>
        ))}
      </div>

      <button type="button" className="action-btn action-btn-ghost advanced-add-rule" onClick={addRule}>
        <Plus size={14} /> Add Rule
      </button>

      {loading && <p className="text-muted criteria-loading">Updating results…</p>}
    </div>
  );
}
