import { useLayoutEffect, useRef, useState } from 'react';

const STEP = 0.05;

// Shrinks font-size just enough for the content to fit on a single line within
// its container, instead of wrapping to a second line or overflowing. Used for
// fusion names, which run much longer than a single Pokémon name.
export function FitText({ as: Tag = 'span', className, maxFontSize = 1.3, minFontSize = 0.75, children }) {
  const ref = useRef(null);
  const [fontSize, setFontSize] = useState(maxFontSize);

  useLayoutEffect(() => {
    const el = ref.current;
    const container = el?.parentElement;
    if (!el || !container) return;

    function fit() {
      let size = maxFontSize;
      el.style.fontSize = `${size}rem`;
      while (el.scrollWidth > container.clientWidth && size > minFontSize) {
        size = Math.round((size - STEP) * 100) / 100;
        el.style.fontSize = `${size}rem`;
      }
      setFontSize(size);
    }

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(container);
    return () => observer.disconnect();
  }, [children, maxFontSize, minFontSize]);

  return (
    <Tag ref={ref} className={className} style={{ fontSize: `${fontSize}rem` }}>
      {children}
    </Tag>
  );
}
