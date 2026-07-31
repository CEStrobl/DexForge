import { ClipboardList } from 'lucide-react';
import { ToolCard } from './ToolCard';
import { useSavedLists } from '../../context/SavedListsContext';

export function ListBuilderToolCard() {
  const { savedLists } = useSavedLists();
  const recent = [...savedLists]
    .sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))
    .slice(0, 2);

  return (
    <ToolCard icon={ClipboardList} title="List Builder" to="/list-builder">
      {recent.length === 0 ? (
        <p className="text-muted">Build and save filtered lists of Pokémon.</p>
      ) : (
        <ul className="home-tool-snippet-list">
          {recent.map((l) => (
            <li key={l.id}>
              <span className="home-tool-snippet-name">{l.name}</span>
              <span className="text-muted">
                {' '}
                · {l.entries.length} {l.entries.length === 1 ? 'entry' : 'entries'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </ToolCard>
  );
}
