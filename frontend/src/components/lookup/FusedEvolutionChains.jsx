import { EvolutionChain } from './EvolutionChain';

// A chain's rendered width is driven almost entirely by its depth (each stage adds one
// card + connector horizontally); branching siblings stack vertically instead (see
// .evo-children in lookup.css), so depth is a reliable stand-in for "how wide is this."
function chainDepth(node) {
  if (!node || !node.children || node.children.length === 0) return 1;
  return 1 + Math.max(...node.children.map(chainDepth));
}

// Renders both the head's and body's full evolution lines. Ordering the narrower one first
// in the DOM (ascending depth) means that when the browser's own flex-wrap decides there
// isn't room for both on one row — real measured width, not a guess — the smaller line is
// what ends up stacked on top, and the taller one keeps its own row below rather than being
// squeezed to fit.
export function FusedEvolutionChains({ headTree, bodyTree, headSlug, bodySlug }) {
  const chains = [
    { role: 'Head', tree: headTree, currentSlug: headSlug, depth: chainDepth(headTree) },
    { role: 'Body', tree: bodyTree, currentSlug: bodySlug, depth: chainDepth(bodyTree) },
  ].sort((a, b) => a.depth - b.depth);

  return (
    <div className="fused-evolution-chains">
      {chains.map((c) => (
        <div className="fused-evolution-chain-item" key={c.role}>
          <span className="fused-evolution-chain-label">{c.role}</span>
          <EvolutionChain tree={c.tree} currentSlug={c.currentSlug} />
        </div>
      ))}
    </div>
  );
}
