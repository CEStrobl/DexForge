import { useEffect, useState } from 'react';
import { api } from '../../api/client';

// Batch-computes every row's fused sprite/types/stats/abilities in one call, mirroring how
// ListBuilderPage bulk-hydrates single-Pokémon entries via /api/pokemon/bulk. Shared by the
// table and gallery views so both views stay in sync off a single fetch per entries change.
export function useFusionRows(entries) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (entries.length === 0) {
      setRows([]);
      return;
    }
    api
      .post('/api/fusion/bulk', { pairs: entries.map((e) => ({ head_slug: e.head_slug, body_slug: e.body_slug })) })
      .then((computed) => setRows(entries.map((e, i) => ({ ...e, fusion: computed[i] || null }))))
      .catch(() => setRows(entries.map((e) => ({ ...e, fusion: null }))));
  }, [entries]);

  return rows;
}
