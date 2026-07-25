import {
  CircleDot,
  Flame,
  Droplet,
  Zap,
  Leaf,
  Snowflake,
  Swords,
  Skull,
  Mountain,
  Feather,
  Brain,
  Bug,
  Gem,
  Ghost,
  Sparkles,
  Moon,
  Shield,
  Sparkle,
} from 'lucide-react';

export const TYPE_ICONS = {
  normal: CircleDot,
  fire: Flame,
  water: Droplet,
  electric: Zap,
  grass: Leaf,
  ice: Snowflake,
  fighting: Swords,
  poison: Skull,
  ground: Mountain,
  flying: Feather,
  psychic: Brain,
  bug: Bug,
  rock: Gem,
  ghost: Ghost,
  dragon: Sparkles,
  dark: Moon,
  steel: Shield,
  fairy: Sparkle,
};

// Text color per type background, chosen so every pairing clears WCAG AA
// (4.5:1) — most of the classic type colors are too light/mid-tone for
// white text to pass, so only a handful of the darker types get white.
const WHITE_TEXT_TYPES = new Set(['fighting', 'poison', 'ghost', 'dragon', 'dark']);

export function getTypeTextColor(type) {
  return WHITE_TEXT_TYPES.has(type) ? '#ffffff' : '#1a1a1a';
}

export const TYPE_ORDER = [
  'bug', 'dark', 'dragon', 'electric', 'fairy', 'fighting', 'fire', 'flying',
  'ghost', 'grass', 'ground', 'ice', 'normal', 'poison', 'psychic', 'rock',
  'steel', 'water',
];

export const TYPE_ABBR = {
  normal: 'NOR',
  fire: 'FIR',
  water: 'WAT',
  electric: 'ELE',
  grass: 'GRA',
  ice: 'ICE',
  fighting: 'FIG',
  poison: 'POI',
  ground: 'GRO',
  flying: 'FLY',
  psychic: 'PSY',
  bug: 'BUG',
  rock: 'ROC',
  ghost: 'GHO',
  dragon: 'DRA',
  dark: 'DAR',
  steel: 'STE',
  fairy: 'FAI',
};
