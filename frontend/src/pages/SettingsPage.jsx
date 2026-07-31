import { useInfiniteFusion } from '../context/InfiniteFusionContext';
import '../styles/settings.css';

export default function SettingsPage() {
  const { enabled, setEnabled } = useInfiniteFusion();

  return (
    <div className="settings-page">
      <h1>Settings</h1>

      <div className="card settings-section">
        <h3 className="card-heading">Infinite Fusion</h3>
        <div className="settings-toggle-row">
          <div className="settings-toggle-copy">
            <span className="settings-toggle-label">Infinite Fusion Mode</span>
            <p className="text-muted settings-toggle-description">
              Adds fusion tools throughout the app: fusing Pokémon on Lookup, head/body columns
              in List Builder, the Fusion List tool, and fusion comparisons on Compare.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label="Toggle Infinite Fusion Mode"
            className={`settings-switch${enabled ? ' checked' : ''}`}
            onClick={() => setEnabled(!enabled)}
          >
            <span className="settings-switch-thumb" />
          </button>
        </div>
      </div>
    </div>
  );
}
