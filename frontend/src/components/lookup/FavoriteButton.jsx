import { Star } from 'lucide-react';
import { useFavorite } from '../../hooks/useFavorite';

export function FavoriteButton({ pokemonSlug }) {
  const { isFavorite, toggle } = useFavorite(pokemonSlug);

  return (
    <button
      type="button"
      className={`action-btn${isFavorite ? ' active' : ''}`}
      onClick={toggle}
      aria-pressed={isFavorite}
    >
      <Star size={16} fill={isFavorite ? 'currentColor' : 'none'} />
      {isFavorite ? 'Favorited' : 'Favorite'}
    </button>
  );
}
