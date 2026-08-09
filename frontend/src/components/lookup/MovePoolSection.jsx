import { useEffect, useMemo, useState } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { api } from '../../api/client';
import { CollapsibleHeader } from '../common/CollapsibleHeader';
import { TypeBadge } from '../common/TypeBadge';
import { Tooltip } from '../common/Tooltip';
import { MoveCategoryIcon } from './MoveCategoryIcon';
import { toDisplayName } from '../../utils/format';

const GENERATION_LABELS = {
  'generation-i': 'I',
  'generation-ii': 'II',
  'generation-iii': 'III',
  'generation-iv': 'IV',
  'generation-v': 'V',
  'generation-vi': 'VI',
  'generation-vii': 'VII',
  'generation-viii': 'VIII',
  'generation-ix': 'IX',
};

const METHOD_LABELS = { 'level-up': 'Level', machine: 'TM', egg: 'Egg', tutor: 'Tutor' };

const STORAGE_KEY = 'dexforge:movepool-open';

function sortValue(row, key) {
  if (key === 'method') return METHOD_LABELS[row.method] || row.method;
  if (key === 'power') return row.power ?? -1;
  if (key === 'accuracy') return row.accuracy ?? -1;
  if (key === 'pp') return row.pp ?? -1;
  return row[key] ?? '';
}

function compareValues(a, b) {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b));
}

function MovePoolSkeleton() {
  return (
    <div className="movepool-skeleton">
      {Array.from({ length: 6 }).map((_, i) => (
        <span key={i} className="movepool-skeleton-row" />
      ))}
    </div>
  );
}

export function MovePoolSection({ slug }) {
  const [open, setOpen] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === null ? true : stored === 'true';
    } catch {
      return true;
    }
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generation, setGeneration] = useState(null);
  const [sort, setSort] = useState({ key: 'level', direction: 'asc' });

  function toggleOpen() {
    setOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .get(`/api/pokemon/${slug}/moves`)
      .then((res) => {
        if (cancelled) return;
        setData(res);
        setGeneration((prev) => (prev && res.generations.includes(prev) ? prev : res.generations[res.generations.length - 1] || null));
      })
      .catch(() => {
        if (!cancelled) setError('Could not load move pool.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const rows = useMemo(() => {
    if (!data || !generation) return [];
    const filtered = data.moves.filter((m) => m.generation === generation);
    const dir = sort.direction === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => dir * compareValues(sortValue(a, sort.key), sortValue(b, sort.key)));
  }, [data, generation, sort]);

  function handleHeaderClick(key) {
    setSort((prev) => (prev.key === key && prev.direction === 'asc' ? { key, direction: 'desc' } : { key, direction: 'asc' }));
  }

  function sortIcon(key) {
    if (sort.key !== key) return null;
    return sort.direction === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />;
  }

  function Th({ label, sortKey, alignRight }) {
    return (
      <th
        className={`movepool-sortable${alignRight ? ' movepool-cell-right' : ''}`}
        onClick={() => handleHeaderClick(sortKey)}
      >
        {label} {sortIcon(sortKey)}
      </th>
    );
  }

  return (
    <div className="card lookup-movepool">
      <CollapsibleHeader title="Move Pool" open={open} onToggle={toggleOpen} />
      {open && (
        <>
          {loading && <MovePoolSkeleton />}

          {!loading && error && <p className="text-muted">{error}</p>}

          {!loading && !error && data && data.generations.length === 0 && (
            <p className="text-muted">No move data available.</p>
          )}

          {!loading && !error && data && data.generations.length > 0 && (
            <>
              <div className="lookup-inline-tabs movepool-gen-tabs">
                {data.generations.map((g) => (
                  <button
                    key={g}
                    type="button"
                    className={`lookup-inline-tab${generation === g ? ' active' : ''}`}
                    onClick={() => setGeneration(g)}
                  >
                    {GENERATION_LABELS[g] || g}
                  </button>
                ))}
              </div>

              {rows.length === 0 ? (
                <p className="text-muted">Not available in this generation.</p>
              ) : (
                <div className="movepool-table-wrap">
                  <table className="movepool-table">
                    <thead>
                      <tr>
                        <Th label="Method" sortKey="method" />
                        <Th label="Lv" sortKey="level" alignRight />
                        <Th label="Move" sortKey="move" />
                        <Th label="Type" sortKey="type" />
                        <Th label="Cat" sortKey="category" />
                        <Th label="Power" sortKey="power" alignRight />
                        <Th label="Acc" sortKey="accuracy" alignRight />
                        <Th label="PP" sortKey="pp" alignRight />
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={`${row.move}-${row.method}-${row.level}`}>
                          <td>{METHOD_LABELS[row.method] || row.method}</td>
                          <td className="movepool-cell-right">{row.method === 'level-up' ? row.level : '—'}</td>
                          <td>
                            <Tooltip content={row.effect}>{toDisplayName(row.move)}</Tooltip>
                          </td>
                          <td>
                            <TypeBadge type={row.type} />
                          </td>
                          <td>
                            <MoveCategoryIcon category={row.category} />
                          </td>
                          <td className="movepool-cell-right">{row.power ?? '—'}</td>
                          <td className="movepool-cell-right">{row.accuracy ?? '—'}</td>
                          <td className="movepool-cell-right">{row.pp ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
