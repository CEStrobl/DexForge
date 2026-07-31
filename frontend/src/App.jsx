import { Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { LastPokemonProvider, useLastPokemon } from './context/LastPokemonContext';
import { SavedListsProvider } from './context/SavedListsContext';
import { FusionListsProvider } from './context/FusionListsContext';
import { InfiniteFusionProvider } from './context/InfiniteFusionContext';
import { CompareProvider } from './context/CompareContext';
import { Sidebar } from './components/common/Sidebar';
import { TopBar } from './components/common/TopBar';
import LandingPage from './pages/LandingPage';
import LookupPage from './pages/LookupPage';
import ComparePage from './pages/ComparePage';
import TypingCalculatorPage from './pages/TypingCalculatorPage';
import NaturesPage from './pages/NaturesPage';
import EvolutionItemsPage from './pages/EvolutionItemsPage';
import ListBuilderPage from './pages/ListBuilderPage';
import FusionListPage from './pages/FusionListPage';
import ListsHomePage from './pages/ListsHomePage';
import SettingsPage from './pages/SettingsPage';

function LookupIndexRoute() {
  const { lastSlug } = useLastPokemon();
  if (lastSlug) return <Navigate to={`/lookup/${lastSlug}`} replace />;
  return <LookupPage />;
}

function App() {
  return (
    <ThemeProvider>
      <LastPokemonProvider>
        <SavedListsProvider>
          <FusionListsProvider>
            <InfiniteFusionProvider>
              <CompareProvider>
                <div className="app-shell">
                  <Sidebar />
                  <div className="app-main">
                    <TopBar />
                    <main className="app-content">
                      <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/lookup" element={<LookupIndexRoute />} />
                        <Route path="/lookup/:slug" element={<LookupPage />} />
                        <Route path="/compare" element={<ComparePage />} />
                        <Route path="/typing-calculator" element={<TypingCalculatorPage />} />
                        <Route path="/natures" element={<NaturesPage />} />
                        <Route path="/evolution-items" element={<EvolutionItemsPage />} />
                        <Route path="/list-builder" element={<ListBuilderPage />} />
                        <Route path="/list-builder/:listId" element={<ListBuilderPage />} />
                        <Route path="/fusion-list" element={<FusionListPage />} />
                        <Route path="/fusion-list/:listId" element={<FusionListPage />} />
                        <Route path="/lists" element={<ListsHomePage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                      </Routes>
                    </main>
                  </div>
                </div>
              </CompareProvider>
            </InfiniteFusionProvider>
          </FusionListsProvider>
        </SavedListsProvider>
      </LastPokemonProvider>
    </ThemeProvider>
  );
}

export default App;
