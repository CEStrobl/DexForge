import { useEffect, useState } from 'react';
import { api } from '../../api/client';

// Module-level cache (not component state) so the sidebar's small avatar and the profile
// page's large one don't each re-fetch the same sprite pair on every mount/navigation.
const cache = new Map();

export function useAvatarSprites(headSlug, bodySlug) {
  const key = `${headSlug || ''}|${bodySlug || ''}`;
  const [sprites, setSprites] = useState(() => cache.get(key) || {});

  useEffect(() => {
    const slugs = [headSlug, bodySlug].filter(Boolean);
    if (slugs.length === 0) {
      setSprites({});
      return;
    }
    if (cache.has(key)) {
      setSprites(cache.get(key));
      return;
    }
    api
      .post('/api/pokemon/bulk', { slugs })
      .then((results) => {
        const map = {};
        results.forEach((mon) => {
          if (mon) map[mon.name] = mon.sprite;
        });
        cache.set(key, map);
        setSprites(map);
      })
      .catch(() => setSprites({}));
  }, [key, headSlug, bodySlug]);

  return sprites;
}
