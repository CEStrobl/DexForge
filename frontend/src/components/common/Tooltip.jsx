export function Tooltip({ content, children }) {
  if (!content) return children;
  return (
    <span className="tooltip-trigger" tabIndex={0}>
      {children}
      <span className="tooltip-bubble" role="tooltip">
        {content}
      </span>
    </span>
  );
}
