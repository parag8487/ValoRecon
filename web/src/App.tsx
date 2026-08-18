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

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="app-container">
        {/* Left NavRail */}
        <NavRail />

        {/* Main Application Area */}
        <div className="main-viewport">
          <TitleBar />
          <main className="content-area">
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
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
};


export default App;
