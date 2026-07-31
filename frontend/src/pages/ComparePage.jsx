import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Tabs } from '../components/common/Tabs';
import { CompareSlot } from '../components/compare/CompareSlot';
import { FusionSlot } from '../components/compare/FusionSlot';
import { useInfiniteFusion } from '../context/InfiniteFusionContext';
import { useCompare } from '../context/CompareContext';
import '../styles/compare.css';

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

  // Both pairs live in CompareContext (not local state) so the previously compared
  // Pokémon/fusions are still there when you navigate away from Compare and back.
  const { pokemonPair, setPokemonPair, fusionPair, setFusionPair } = useCompare();
  const left = usePokemon(pokemonPair.left);
  const right = usePokemon(pokemonPair.right);

  function setLeftSlug(slug) {
    setPokemonPair((prev) => ({ ...prev, left: slug }));
  }
  function setRightSlug(slug) {
    setPokemonPair((prev) => ({ ...prev, right: slug }));
  }

  const { headA, bodyA, headB, bodyB } = fusionPair;
  const { a: fusionA, b: fusionB, loading: fusionLoading } = useFusionCompare(headA, bodyA, headB, bodyB);

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
