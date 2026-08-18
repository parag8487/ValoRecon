import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { NavRail } from './shell/NavRail';
import { TitleBar } from './shell/TitleBar';

import { HomeScreen } from './screens/HomeScreen';
import { CoachScreen } from './screens/CoachScreen';
import { MatchAnalysisScreen } from './screens/MatchAnalysisScreen';
import { MatchDetailScreen } from './screens/MatchDetailScreen';
import { LiveMatchScreen } from './screens/LiveMatchScreen';
import { AgentSelectScreen } from './screens/AgentSelectScreen';
import { LineupsScreen } from './screens/LineupsScreen';
import { TrendsScreen } from './screens/TrendsScreen';
import { StatisticsScreen } from './screens/StatisticsScreen';
import { StoreScreen } from './screens/StoreScreen';
import { LoadoutScreen } from './screens/LoadoutScreen';
import { BattlepassScreen } from './screens/BattlepassScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { CompanionScreen } from './screens/CompanionScreen';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastContainer } from './components/ToastContainer';
import { DataProvenanceBanner } from './components/DataProvenanceBanner';

import { useState, useEffect } from 'react';
import { MobileBottomNav } from './shell/MobileBottomNav';
import { MobileDrawer } from './shell/MobileDrawer';

export const App: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      const fullSearch = window.location.search;
      const hashPart = window.location.hash;
      const hashSearch = hashPart.includes('?') ? hashPart.substring(hashPart.indexOf('?')) : '';
      const params = new URLSearchParams(fullSearch || hashSearch);

      const code = params.get('code') || params.get('pair');
      const player = params.get('player') || params.get('name') || params.get('ign');
      const tag = params.get('tag');
      const region = params.get('region');
      const token = params.get('token');

      if (code || player) {
        const session = {
          pairingCode: code || 'VALO99',
          connected: true,
          gameName: player || 'UrMomRpdMe',
          gameTag: tag || 'help',
          region: region || 'ap',
          token,
          pairedAt: Date.now()
        };
        localStorage.setItem('valorecon_companion_session', JSON.stringify(session));
        window.dispatchEvent(new Event('valorecon_sync'));
      }
    } catch {}
  }, []);

  return (
    <BrowserRouter>
      <ErrorBoundary fallbackTitle="APPLICATION SHELL ERROR">
        <div className="app-container">
          {/* Left NavRail (Desktop) */}
          <NavRail />

          {/* Main Application Area */}
          <div className="main-viewport">
            <TitleBar onOpenDrawer={() => setDrawerOpen(true)} />
            <DataProvenanceBanner />
            <main className="content-area">
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<HomeScreen />} />
                  <Route path="/coach" element={<CoachScreen />} />
                  <Route path="/analysis" element={<MatchAnalysisScreen />} />
                  <Route path="/match-detail" element={<MatchDetailScreen />} />
                  <Route path="/live-match" element={<LiveMatchScreen />} />
                  <Route path="/agent-select" element={<AgentSelectScreen />} />
                  <Route path="/lineups" element={<LineupsScreen />} />
                  <Route path="/trends" element={<TrendsScreen />} />
                  <Route path="/statistics" element={<StatisticsScreen />} />
                  <Route path="/store" element={<StoreScreen />} />
                  <Route path="/loadout" element={<LoadoutScreen />} />
                  <Route path="/battlepass" element={<BattlepassScreen />} />
                  <Route path="/companion" element={<CompanionScreen />} />
                  <Route path="/settings" element={<SettingsScreen />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </ErrorBoundary>
            </main>
          </div>
        </div>

        {/* Mobile Navigation Shell (Visible only on < 769px) */}
        <MobileBottomNav
          onOpenDrawer={() => setDrawerOpen(true)}
          drawerOpen={drawerOpen}
        />
        <MobileDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        />

        <ToastContainer />
      </ErrorBoundary>
    </BrowserRouter>
  );
};


export default App;

