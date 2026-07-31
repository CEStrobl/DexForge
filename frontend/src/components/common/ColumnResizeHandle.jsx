// preventDefault() on pointerdown suppresses the browser's synthesized mouse events for
// this interaction, so tracking has to stay in the pointer-event family (not mousemove/up).
export function ColumnResizeHandle({ columnKey, currentWidth, onResize }) {
  function handlePointerDown(e) {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = currentWidth || e.currentTarget.parentElement.getBoundingClientRect().width;

    function handlePointerMove(moveEvent) {
      const next = Math.max(48, Math.round(startWidth + (moveEvent.clientX - startX)));
      onResize(columnKey, next);
    }
    function handlePointerUp() {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    }
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }

  return <span className="list-table-resize-handle" onPointerDown={handlePointerDown} />;
}
