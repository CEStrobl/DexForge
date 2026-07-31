import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { ToolCard } from './ToolCard';
import { useLastPokemon } from '../../context/LastPokemonContext';
import { api } from '../../api/client';
import { toDisplayName } from '../../utils/format';

export function LookupToolCard() {
  const { lastSlug } = useLastPokemon();
  const [mon, setMon] = useState(null);

  useEffect(() => {
    if (!lastSlug) {
      setMon(null);
      return;
    }
    api
      .get(`/api/pokemon/${lastSlug}`)
      .then(setMon)
      .catch(() => setMon(null));
  }, [lastSlug]);

  return (
    <ToolCard icon={Search} title="Lookup" to="/lookup">
      {mon ? (
        <div className="home-tool-snippet-pokemon">
          <img src={mon.sprite} alt="" width={40} height={40} />
          <div>
            <span className="text-muted home-tool-snippet-label">Last viewed</span>
            <span className="home-tool-snippet-name">{toDisplayName(mon.name)}</span>
          </div>
        </div>
      ) : (
        <p className="text-muted">Search any Pokémon's stats, typing, and evolutions.</p>
      )}
    </ToolCard>
  );
}
