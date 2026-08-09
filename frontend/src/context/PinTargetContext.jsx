import { createContext, useContext, useEffect, useState } from 'react';

const PinTargetContext = createContext(null);

// Holds "what would pinning the current page mean" — set by whichever page is
// currently mounted (Lookup, Compare, a saved list, ...) via usePinTarget below.
// Pages with no per-instance identity (Natures, Settings, ...) never call the
// hook, so the pin control in TopBar simply doesn't render there.
export function PinTargetProvider({ children }) {
  const [target, setTarget] = useState(null);
  return (
    <PinTargetContext.Provider value={{ target, setTarget }}>{children}</PinTargetContext.Provider>
  );
}

export function usePinTargetContext() {
  const ctx = useContext(PinTargetContext);
  if (!ctx) throw new Error('usePinTargetContext must be used within a PinTargetProvider');
  return ctx;
}

// Called by a page to declare its current pinnable identity: `path` is the
// canonical route+params (core identity only, no transient UI state — see
// Notes/QuickLinks.md), `label` is the default label offered when pinning.
// Pass a falsy `path` to declare "not pinnable right now" (e.g. nothing selected yet).
export function usePinTarget(path, label) {
  const { setTarget } = usePinTargetContext();

  useEffect(() => {
    setTarget(path ? { path, label } : null);
    return () => setTarget(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, label]);
}
