import { Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { Sidebar } from './components/common/Sidebar';
import { TopBar } from './components/common/TopBar';
import LookupPage from './pages/LookupPage';
import ComparePage from './pages/ComparePage';
import TypingCalculatorPage from './pages/TypingCalculatorPage';
import NaturesPage from './pages/NaturesPage';
import EvolutionItemsPage from './pages/EvolutionItemsPage';
import ListBuilderPage from './pages/ListBuilderPage';

function App() {
  return (
    <ThemeProvider>
      <div className="app-shell">
        <Sidebar />
        <div className="app-main">
          <TopBar />
          <main className="app-content">
            <Routes>
              <Route path="/" element={<Navigate to="/lookup" replace />} />
              <Route path="/lookup" element={<LookupPage />} />
              <Route path="/lookup/:slug" element={<LookupPage />} />
              <Route path="/compare" element={<ComparePage />} />
              <Route path="/typing-calculator" element={<TypingCalculatorPage />} />
              <Route path="/natures" element={<NaturesPage />} />
              <Route path="/evolution-items" element={<EvolutionItemsPage />} />
              <Route path="/list-builder" element={<ListBuilderPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
