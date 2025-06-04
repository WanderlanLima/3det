
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import CharacterGalleryPage from './pages/CharacterGalleryPage';
import CharacterEditorPage from './pages/CharacterEditorPage';
import CampaignGalleryPage from './pages/CampaignGalleryPage';
import CampaignEditorPage from './pages/CampaignEditorPage'; // Importado
import CampaignDetailPage from './pages/CampaignDetailPage';
import CompendiumPage from './pages/CompendiumPage';
import CombatSimulatorPage from './pages/CombatSimulatorPage';
import UserProfilePage from './pages/UserProfilePage';
import CharacterViewPage from './pages/CharacterViewPage'; 

const App: React.FC = () => {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8"> 
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/characters" element={<CharacterGalleryPage />} />
            <Route path="/character/new" element={<CharacterEditorPage />} />
            <Route path="/character/edit/:id" element={<CharacterEditorPage />} />
            <Route path="/character/view/:id" element={<CharacterViewPage />} /> 
            <Route path="/campaigns" element={<CampaignGalleryPage />} />
            <Route path="/campaign/new" element={<CampaignEditorPage />} /> {/* Rota para novo */}
            <Route path="/campaign/edit/:id" element={<CampaignEditorPage />} /> {/* Rota para editar */}
            <Route path="/campaign/:id" element={<CampaignDetailPage />} />
            <Route path="/compendium" element={<CompendiumPage />} />
            <Route path="/combat-simulator" element={<CombatSimulatorPage />} />
            <Route path="/profile" element={<UserProfilePage />} />
          </Routes>
        </main>
        <footer className="py-6 text-center text-slate-500 text-sm border-t border-slate-700">
          <p>&copy; {new Date().getFullYear()} 3DeT Victory. Todos os direitos reservados.</p>
          <p>Forjando lendas, uma rolagem por vez.</p>
        </footer>
      </div>
    </Router>
  );
};

export default App;
