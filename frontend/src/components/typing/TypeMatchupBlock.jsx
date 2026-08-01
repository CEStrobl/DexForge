import { TypeBadge } from '../common/TypeBadge';
import { getTypeTextColor } from '../common/typeIcons';
import { toDisplayName } from '../../utils/format';

function Quadrant({ title, types }) {
  return (
    <div className="type-block-quadrant">
      <span className="type-block-quadrant-title">{title}</span>
      {types.length === 0 ? (
        <span className="type-block-quadrant-empty">None</span>
      ) : (
        <div className="type-block-quadrant-types">
          {types.map((t) => (
            <TypeBadge key={t} type={t} />
          ))}
        </div>
      )}
    </div>
  );
}

export function TypeMatchupBlock({ type, profile }) {
  return (
    <div className="type-block">
      <div
        className="type-block-header"
        style={{ background: `var(--type-${type})`, color: getTypeTextColor(type) }}
      >
        {toDisplayName(type)}
      </div>
      <div className="type-block-grid">
        <Quadrant title="2× Damage To" types={profile.double_damage_to} />
        <Quadrant title="½ Damage From" types={profile.half_damage_from} />
        <Quadrant title="½ Damage To" types={profile.half_damage_to} />
        <Quadrant title="2× Damage From" types={profile.double_damage_from} />
      </div>
      {(profile.no_damage_to.length > 0 || profile.no_damage_from.length > 0) && (
        <div className="type-block-immune-list">
          {profile.no_damage_to.length > 0 && (
            <div className="type-block-immune">
              Can't damage: {profile.no_damage_to.map(toDisplayName).join(', ')}
            </div>
          )}
          {profile.no_damage_from.length > 0 && (
            <div className="type-block-immune">
              Immune to: {profile.no_damage_from.map(toDisplayName).join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
