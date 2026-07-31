import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { api } from '../../api/client';
import { toDisplayName } from '../../utils/format';

// Lowest-priority section (Notes/Landingpage.md) — fails/loads silently rather than
// showing its own skeleton or error card, so it never competes for attention with the
// sections above it.
export function TriviaStrip() {
  const [fact, setFact] = useState(null);

  useEffect(() => {
    api
      .get('/api/home/trivia')
      .then(setFact)
      .catch(() => setFact(null));
  }, []);

  if (!fact) return null;

  return (
    <div className="card home-trivia-strip">
      <Sparkles size={16} />
      <p className="text-muted">
        {fact.label}: <span className="home-tool-snippet-name">{toDisplayName(fact.name)}</span> ({fact.value})
      </p>
    </div>
  );
}
