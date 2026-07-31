import { useInfiniteFusion } from '../context/InfiniteFusionContext';
import { FeaturedPokemonCard } from '../components/home/FeaturedPokemonCard';
import { StatsStrip } from '../components/home/StatsStrip';
import { LookupToolCard } from '../components/home/LookupToolCard';
import { CompareToolCard } from '../components/home/CompareToolCard';
import { TypingToolCard } from '../components/home/TypingToolCard';
import { NaturesToolCard } from '../components/home/NaturesToolCard';
import { EvolutionItemsToolCard } from '../components/home/EvolutionItemsToolCard';
import { ListBuilderToolCard } from '../components/home/ListBuilderToolCard';
import { FusionListToolCard } from '../components/home/FusionListToolCard';
import { TriviaStrip } from '../components/home/TriviaStrip';
import '../styles/home.css';

export default function LandingPage() {
  const { enabled: infiniteFusionEnabled } = useInfiniteFusion();

  return (
    <div className="home-page">
      <FeaturedPokemonCard />
      <StatsStrip />
      <div className="home-tool-grid">
        <LookupToolCard />
        <CompareToolCard />
        <TypingToolCard />
        <NaturesToolCard />
        <EvolutionItemsToolCard />
        <ListBuilderToolCard />
        {infiniteFusionEnabled && <FusionListToolCard />}
      </div>
      <TriviaStrip />
    </div>
  );
}
