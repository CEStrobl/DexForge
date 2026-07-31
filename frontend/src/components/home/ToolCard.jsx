import { Link } from 'react-router-dom';

export function ToolCard({ icon: Icon, title, to, children }) {
  return (
    <Link to={to} className="card home-tool-card">
      <div className="home-tool-card-header">
        <Icon size={18} />
        <h3>{title}</h3>
      </div>
      <div className="home-tool-card-body">{children}</div>
    </Link>
  );
}
