import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { Tabs } from '../components/common/Tabs';
import { CompareSlot } from '../components/compare/CompareSlot';
import { FusionSlot } from '../components/compare/FusionSlot';
import { useInfiniteFusion } from '../context/InfiniteFusionContext';
import { useCompare } from '../context/CompareContext';
import { usePinTarget } from '../context/PinTargetContext';
import { toDisplayName } from '../utils/format';
import '../styles/compare.css';
import '../styles/fusion-art.css';

function usePokemon(slug) {
  const [pokemon, setPokemon] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!slug) {
      setPokemon(null);
      return;
    }
    setLoading(true);
    api
      .get(`/api/pokemon/${slug}`)
      .then(setPokemon)
      .catch(() => setPokemon(null))
      .finally(() => setLoading(false));
  }, [slug]);

  return { pokemon, loading };
}

function useFusionCompare(headA, bodyA, headB, bodyB) {
  const [data, setData] = useState({ a: null, b: null });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!(headA && bodyA) && !(headB && bodyB)) {
      setData({ a: null, b: null });
      return;
    }
    setLoading(true);
    const params = new URLSearchParams();
    if (headA) params.set('head_a', headA);
    if (bodyA) params.set('body_a', bodyA);
    if (headB) params.set('head_b', headB);
    if (bodyB) params.set('body_b', bodyB);
    api
      .get(`/api/fusion/compare?${params.toString()}`)
      .then(setData)
      .catch(() => setData({ a: null, b: null }))
      .finally(() => setLoading(false));
  }, [headA, bodyA, headB, bodyB]);

  return { ...data, loading };
}

const SUB_TABS = [
  { key: 'pokemon', label: 'Pokémon' },
  { key: 'fusion', label: 'Fusion' },
];

export default function ComparePage() {
  const { enabled: infiniteFusionEnabled } = useInfiniteFusion();
  const [subTab, setSubTab] = useState('pokemon');
  const activeSubTab = infiniteFusionEnabled ? subTab : 'pokemon';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Both pairs live in CompareContext (not local state) so the previously compared
  // Pokémon/fusions are still there when you navigate away from Compare and back.
  const { pokemonPair, setPokemonPair, fusionPair, setFusionPair } = useCompare();
  const left = usePokemon(pokemonPair.left);
  const right = usePokemon(pokemonPair.right);

  // A Quick Link to Compare arrives as query params (Compare itself never writes
  // its pair into the URL day-to-day — see CompareContext) — restore them into
  // context on arrival, then clear the URL so it doesn't go stale the moment the
  // user picks a different Pokémon via the search boxes.
  useEffect(() => {
    const qLeft = searchParams.get('left');
    const qRight = searchParams.get('right');
    if (qLeft && qRight) {
      setPokemonPair({ left: qLeft, right: qRight });
      setSubTab('pokemon');
      navigate('/compare', { replace: true });
      return;
    }
    const qHeadA = searchParams.get('headA');
    const qBodyA = searchParams.get('bodyA');
    const qHeadB = searchParams.get('headB');
    const qBodyB = searchParams.get('bodyB');
    if (qHeadA && qBodyA && qHeadB && qBodyB) {
      setFusionPair({ headA: qHeadA, bodyA: qBodyA, headB: qHeadB, bodyB: qBodyB });
      setSubTab('fusion');
      navigate('/compare', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  function setLeftSlug(slug) {
    setPokemonPair((prev) => ({ ...prev, left: slug }));
  }
  function setRightSlug(slug) {
    setPokemonPair((prev) => ({ ...prev, right: slug }));
  }

  const { headA, bodyA, headB, bodyB } = fusionPair;
  const { a: fusionA, b: fusionB, loading: fusionLoading } = useFusionCompare(headA, bodyA, headB, bodyB);

  usePinTarget(
    activeSubTab === 'fusion'
      ? headA && bodyA && headB && bodyB
        ? `/compare?headA=${headA}&bodyA=${bodyA}&headB=${headB}&bodyB=${bodyB}`
        : null
      : pokemonPair.left && pokemonPair.right
        ? `/compare?left=${pokemonPair.left}&right=${pokemonPair.right}`
        : null,
    activeSubTab === 'fusion'
      ? headA && bodyA && headB && bodyB
        ? `Fusion: ${toDisplayName(headA)}+${toDisplayName(bodyA)} vs ${toDisplayName(headB)}+${toDisplayName(bodyB)}`
        : null
      : pokemonPair.left && pokemonPair.right
        ? `Compare: ${toDisplayName(pokemonPair.left)} / ${toDisplayName(pokemonPair.right)}`
        : null
  );

  function setHeadA(v) {
    setFusionPair((prev) => ({ ...prev, headA: v }));
  }
  function setBodyA(v) {
    setFusionPair((prev) => ({ ...prev, bodyA: v }));
  }
  function setHeadB(v) {
    setFusionPair((prev) => ({ ...prev, headB: v }));
  }
  function setBodyB(v) {
    setFusionPair((prev) => ({ ...prev, bodyB: v }));
  }
  function swapA() {
    setFusionPair((prev) => ({ ...prev, headA: prev.bodyA, bodyA: prev.headA }));
  }
  function swapB() {
    setFusionPair((prev) => ({ ...prev, headB: prev.bodyB, bodyB: prev.headB }));
  }

  return (
    <div className="compare-page">
      <h1 className="page-title">Compare</h1>
      {infiniteFusionEnabled && <Tabs tabs={SUB_TABS} active={activeSubTab} onChange={setSubTab} />}

      {activeSubTab === 'pokemon' && (
        <div className="compare-columns">
          <CompareSlot
            label="A"
            pokemon={left.pokemon}
            otherPokemon={right.pokemon}
            loading={left.loading}
            onSelectSlug={setLeftSlug}
            mirrored={false}
          />
          <CompareSlot
            label="B"
            pokemon={right.pokemon}
            otherPokemon={left.pokemon}
            loading={right.loading}
            onSelectSlug={setRightSlug}
            mirrored
          />
        </div>
      )}

      {activeSubTab === 'fusion' && (
        <div className="compare-columns">
          <FusionSlot
            label="A"
            head={headA}
            body={bodyA}
            onSetHead={setHeadA}
            onSetBody={setBodyA}
            onSwap={swapA}
            fusion={fusionA}
            otherFusion={fusionB}
            loading={fusionLoading}
            mirrored={false}
          />
          <FusionSlot
            label="B"
            head={headB}
            body={bodyB}
            onSetHead={setHeadB}
            onSetBody={setBodyB}
            onSwap={swapB}
            fusion={fusionB}
            otherFusion={fusionA}
            loading={fusionLoading}
            mirrored
          />
        </div>
      )}
    </div>
  );
}
