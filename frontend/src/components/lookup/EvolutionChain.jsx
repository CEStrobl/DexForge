import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { TypeBadge } from '../common/TypeBadge';
import { toDisplayName } from '../../utils/format';

function EvolutionNode({ node, currentSlug }) {
  return (
    <div className="evo-node">
      <Link
        to={`/lookup/${node.name}`}
        className={`evolution-card${node.name === currentSlug ? ' current' : ''}`}
      >
        {node.sprite && <img src={node.sprite} alt="" width={100} height={100} />}
        <div className="evolution-card-name">{toDisplayName(node.name)}</div>
        <div className="evolution-card-types">
          {node.types.map((t) => (
            <TypeBadge key={t} type={t} />
          ))}
        </div>
        {node.base_stat_total != null && (
          <div className="evolution-card-bst">BST {node.base_stat_total}</div>
        )}
      </Link>

      {node.children && node.children.length > 0 && (
        <div className="evo-children">
          {node.children.map((child) => (
            <div className="evo-branch" key={child.name}>
              <div className="evo-connector">
                <ArrowRight size={18} />
                {child.trigger && <span>{child.trigger}</span>}
              </div>
              <EvolutionNode node={child} currentSlug={currentSlug} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function EvolutionChain({ tree, currentSlug }) {
  if (!tree) {
    return <p className="text-muted">No evolution data available.</p>;
  }

  return (
    <div className="evolution-chain">
      <EvolutionNode node={tree} currentSlug={currentSlug} />
    </div>
  );
}
