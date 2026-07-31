import { useEffect, useState } from 'react';
import { GitMerge } from 'lucide-react';
import { ToolCard } from './ToolCard';
import { useFusionLists } from '../../context/FusionListsContext';
import { api } from '../../api/client';
import { toDisplayName } from '../../utils/format';

export function FusionListToolCard() {
  const { fusionLists } = useFusionLists();
  const [fusion, setFusion] = useState(null);

  const mostRecentList = [...fusionLists].sort(
    (a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0)
  )[0];
  // Entries are wholesale-replaced on every save (no per-entry timestamps), so the last
  // entry (by position) of the most-recently-touched list is the best available stand-in
  // for "most recently added fusion."
  const teaserEntry = mostRecentList?.entries[mostRecentList.entries.length - 1];
  const totalEntries = fusionLists.reduce((sum, l) => sum + l.entries.length, 0);

  useEffect(() => {
    if (!teaserEntry) {
      setFusion(null);
      return;
    }
    api
      .get(`/api/fusion/compare?head_a=${teaserEntry.head_slug}&body_a=${teaserEntry.body_slug}`)
      .then((data) => setFusion(data.a))
      .catch(() => setFusion(null));
  }, [teaserEntry?.head_slug, teaserEntry?.body_slug]);

  return (
    <ToolCard icon={GitMerge} title="Fusion List" to="/fusion-list">
      {totalEntries === 0 ? (
        <p className="text-muted">Track your assembled head+body fusions.</p>
      ) : (
        <div className="home-tool-snippet-fusion">
          {fusion && (
            <div className="fusion-sprite-pair-sm">
              <img src={fusion.head.sprite} alt="" width={28} height={28} />
              <img src={fusion.body.sprite} alt="" width={28} height={28} />
            </div>
          )}
          <p className="text-muted">
            {totalEntries} {totalEntries === 1 ? 'fusion' : 'fusions'} tracked
            {fusion && (
              <>
                {' '}
                · latest:{' '}
                <span className="home-tool-snippet-name">
                  {toDisplayName(fusion.head.name)} / {toDisplayName(fusion.body.name)}
                </span>
              </>
            )}
          </p>
        </div>
      )}
    </ToolCard>
  );
}
