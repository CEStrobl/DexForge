import { Pin } from 'lucide-react';
import { api } from '../../api/client';
import { usePinTargetContext } from '../../context/PinTargetContext';
import { useQuickLinks } from '../../context/QuickLinksContext';

// Lives in the top bar next to search (see Notes/QuickLinks.md) — a single
// pin/unpin toggle for "the page I'm on right now" rather than a one-way add
// action, so there's one control and one code path regardless of whether you're
// pinning for the first time or removing an existing pin.
export function PinButton() {
  const { target } = usePinTargetContext();
  const { quickLinks, refresh } = useQuickLinks();

  if (!target) return null;

  const existing = quickLinks.find((q) => q.path === target.path);

  async function toggle() {
    if (existing) {
      await api.delete(`/api/quick-links/${existing.id}`);
    } else {
      await api.post('/api/quick-links', { label: target.label, path: target.path });
    }
    refresh();
  }

  return (
    <button
      type="button"
      className={`topbar-pin-btn${existing ? ' pinned' : ''}`}
      onClick={toggle}
      aria-label={existing ? 'Unpin this page' : 'Pin this page'}
      title={existing ? 'Unpin this page' : 'Pin this page'}
    >
      <Pin size={17} strokeWidth={2} fill={existing ? 'currentColor' : 'none'} />
    </button>
  );
}
