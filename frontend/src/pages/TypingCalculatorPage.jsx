import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Tabs } from '../components/common/Tabs';
import { TypeSelect } from '../components/typing/TypeSelect';
import { TypeMatchupBlock } from '../components/typing/TypeMatchupBlock';
import { TypePokemonSection } from '../components/typing/TypePokemonSection';
import { TypeDefenses } from '../components/lookup/TypeDefenses';
import { TYPE_ORDER } from '../components/common/typeIcons';
import '../styles/typing-calculator.css';

const SUB_TABS = [
  { key: 'calculator', label: 'Calculator' },
  { key: 'chart', label: 'Type Chart' },
];

export default function TypingCalculatorPage() {
  const [subTab, setSubTab] = useState('calculator');
  const [type1, setType1] = useState('bug');
  const [type2, setType2] = useState('dark');
  const [effectiveness, setEffectiveness] = useState({});
  const [profiles, setProfiles] = useState(null);

  useEffect(() => {
    api
      .get('/api/typing/profiles')
      .then(setProfiles)
      .catch(() => setProfiles({}));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    params.append('type', type1);
    if (type2) params.append('type', type2);
    api
      .get(`/api/typing?${params.toString()}`)
      .then(setEffectiveness)
      .catch(() => setEffectiveness({}));
  }, [type1, type2]);

  return (
    <div className="typing-calculator-page">
      <h1 className="page-title">Typing Calculator</h1>
      <Tabs tabs={SUB_TABS} active={subTab} onChange={setSubTab} />

      {subTab === 'calculator' && (
        <div className="typing-calculator-tab">
          <div className="card">
            <h3 className="card-heading">Choose a Type</h3>
            <div className="type-select-row">
              <TypeSelect label="Type 1" value={type1} onChange={(v) => setType1(v || 'normal')} />
              <TypeSelect label="Type 2" value={type2} onChange={setType2} allowNone />
            </div>
            <TypeDefenses effectiveness={effectiveness} showHeader={false} bare />
          </div>

          <TypePokemonSection types={[type1, type2].filter(Boolean)} />

          <div className="type-block-pair">
            {profiles?.[type1] && <TypeMatchupBlock type={type1} profile={profiles[type1]} />}
            {type2 && profiles?.[type2] && <TypeMatchupBlock type={type2} profile={profiles[type2]} />}
          </div>
        </div>
      )}

      {subTab === 'chart' && (
        <div className="type-chart-grid">
          {profiles
            ? TYPE_ORDER.map((t) => <TypeMatchupBlock key={t} type={t} profile={profiles[t]} />)
            : <p className="text-muted">Loading...</p>}
        </div>
      )}
    </div>
  );
}
