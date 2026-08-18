import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { LastPokemonProvider, useLastPokemon } from './context/LastPokemonContext';
import { AuthProvider } from './context/AuthContext';
import { SavedListsProvider } from './context/SavedListsContext';
import { FusionListsProvider } from './context/FusionListsContext';
import { InfiniteFusionProvider } from './context/InfiniteFusionContext';
import { CompareProvider } from './context/CompareContext';
import { QuickLinksProvider } from './context/QuickLinksContext';
import { PinTargetProvider } from './context/PinTargetContext';
import { Sidebar } from './components/common/Sidebar';
import { TopBar } from './components/common/TopBar';
import LandingPage from './pages/LandingPage';
import LookupPage from './pages/LookupPage';
import ComparePage from './pages/ComparePage';
import TypingCalculatorPage from './pages/TypingCalculatorPage';
import NaturesPage from './pages/NaturesPage';
import EvolutionItemsPage from './pages/EvolutionItemsPage';
import DexFilterPage from './pages/DexFilterPage';
import ListBuilderPage from './pages/ListBuilderPage';
import FusionListPage from './pages/FusionListPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import SignInPage from './pages/SignInPage';

function LookupIndexRoute() {
  const { lastSlug } = useLastPokemon();
  if (lastSlug) return <Navigate to={`/lookup/${lastSlug}`} replace />;
  return <LookupPage />;
}

// Below the tablet breakpoint the sidebar renders as an off-canvas drawer (base.css) instead
// of sharing horizontal space with the content — this state is lifted here since the
// hamburger toggle lives in TopBar but the drawer itself is the Sidebar. Navigating anywhere
// closes it, same as tapping the backdrop would.
function AppShell() {
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="app-main">
        <TopBar onMenuClick={() => setMobileNavOpen((prev) => !prev)} />
        <main className="app-content">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/lookup" element={<LookupIndexRoute />} />
            <Route path="/lookup/:slug" element={<LookupPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/typing-calculator" element={<TypingCalculatorPage />} />
            <Route path="/natures" element={<NaturesPage />} />
            <Route path="/evolution-items" element={<EvolutionItemsPage />} />
            <Route path="/dex-filter" element={<DexFilterPage />} />
            <Route path="/list-builder" element={<ListBuilderPage />} />
            <Route path="/list-builder/:listId" element={<ListBuilderPage />} />
            <Route path="/fusion-list" element={<FusionListPage />} />
            <Route path="/fusion-list/:listId" element={<FusionListPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/:username" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/sign-in" element={<SignInPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <LastPokemonProvider>
        <AuthProvider>
          <SavedListsProvider>
            <FusionListsProvider>
              <InfiniteFusionProvider>
                <CompareProvider>
                  <QuickLinksProvider>
                    <PinTargetProvider>
                      <AppShell />
                    </PinTargetProvider>
                  </QuickLinksProvider>
                </CompareProvider>
              </InfiniteFusionProvider>
            </FusionListsProvider>
          </SavedListsProvider>
        </AuthProvider>
      </LastPokemonProvider>
    </ThemeProvider>
  );
}

export default App;
