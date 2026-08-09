import { useEffect, useMemo, useState } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { api } from '../../api/client';
import { CollapsibleHeader } from '../common/CollapsibleHeader';
import { TypeBadge } from '../common/TypeBadge';
import { Tooltip } from '../common/Tooltip';
import { MoveCategoryIcon } from './MoveCategoryIcon';
import { toDisplayName } from '../../utils/format';

const GENERATION_ORDER = [
  'generation-i', 'generation-ii', 'generation-iii', 'generation-iv', 'generation-v',
  'generation-vi', 'generation-vii', 'generation-viii', 'generation-ix',
];

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
const SOURCE_LABELS = { head: 'Head', body: 'Body', both: 'Both' };

const STORAGE_KEY = 'dexforge:fused-movepool-open';

// A fusion inherits both parents' full learnsets in Infinite Fusion — this merges the two
// per-Pokémon move pools into one list rather than showing two separate tables. Rows that
// match exactly (same move, method, and level) collapse into a single "Both" row; anything
// learned differently by each parent (e.g. one gets it by level-up, the other by TM) stays
// as two rows so that distinction isn't lost.
function mergeMovePools(headMoves, bodyMoves) {
  const byKey = new Map();
  for (const [source, moves] of [['head', headMoves], ['body', bodyMoves]]) {
    for (const row of moves) {
      const key = `${row.move}|${row.method}|${row.level}`;
      const existing = byKey.get(key);
      if (existing) {
        existing.source = existing.source === source ? existing.source : 'both';
      } else {
        byKey.set(key, { ...row, source });
      }
    }
  }
  return [...byKey.values()];
}

function sortValue(row, key) {
  if (key === 'method') return METHOD_LABELS[row.method] || row.method;
  if (key === 'source') return SOURCE_LABELS[row.source] || row.source;
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

export function FusedMovePoolSection({ headSlug, bodySlug }) {
  const [open, setOpen] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === null ? true : stored === 'true';
    } catch {
      return true;
    }
  });
  const [headData, setHeadData] = useState(null);
  const [bodyData, setBodyData] = useState(null);
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
    if (!headSlug || !bodySlug) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([api.get(`/api/pokemon/${headSlug}/moves`), api.get(`/api/pokemon/${bodySlug}/moves`)])
      .then(([headRes, bodyRes]) => {
        if (cancelled) return;
        setHeadData(headRes);
        setBodyData(bodyRes);
        const generations = [...new Set([...headRes.generations, ...bodyRes.generations])].sort(
          (a, b) => GENERATION_ORDER.indexOf(a) - GENERATION_ORDER.indexOf(b)
        );
        setGeneration((prev) => (prev && generations.includes(prev) ? prev : generations[generations.length - 1] || null));
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
  }, [headSlug, bodySlug]);

  const generations = useMemo(() => {
    if (!headData || !bodyData) return [];
    return [...new Set([...headData.generations, ...bodyData.generations])].sort(
      (a, b) => GENERATION_ORDER.indexOf(a) - GENERATION_ORDER.indexOf(b)
    );
  }, [headData, bodyData]);

  const rows = useMemo(() => {
    if (!headData || !bodyData || !generation) return [];
    const headMoves = headData.moves.filter((m) => m.generation === generation);
    const bodyMoves = bodyData.moves.filter((m) => m.generation === generation);
    const merged = mergeMovePools(headMoves, bodyMoves);
    const dir = sort.direction === 'asc' ? 1 : -1;
    return merged.sort((a, b) => dir * compareValues(sortValue(a, sort.key), sortValue(b, sort.key)));
  }, [headData, bodyData, generation, sort]);

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
      <CollapsibleHeader title="Combined Move Pool" open={open} onToggle={toggleOpen} />
      {open && (
        <>
          {loading && <MovePoolSkeleton />}

          {!loading && error && <p className="text-muted">{error}</p>}

          {!loading && !error && generations.length === 0 && <p className="text-muted">No move data available.</p>}

          {!loading && !error && generations.length > 0 && (
            <>
              <div className="lookup-inline-tabs movepool-gen-tabs">
                {generations.map((g) => (
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
                        <Th label="Source" sortKey="source" />
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
                          <td>
                            <span className={`movepool-source movepool-source-${row.source}`}>
                              {SOURCE_LABELS[row.source]}
                            </span>
                          </td>
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
