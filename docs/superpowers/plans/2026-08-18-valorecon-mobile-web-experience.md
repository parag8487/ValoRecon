# ValoRecon Mobile Web Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete, production-quality mobile web application experience for ValoRecon without altering or regressing the desktop/PC view.

**Architecture:** Component-level responsive architecture using clean media queries (`@media (max-width: 768px)`), safe-area insets, mobile bottom navigation with quick thumb tabs, a full mobile drawer sheet for secondary routes, and stacked touch-optimized layouts across all 14 screens.

**Tech Stack:** React, TypeScript, Vite, Vanilla CSS tokens, Lucide Icons, Recharts, React Router.

## Global Constraints
- Desktop view (`>= 769px`) must remain 100% visually and functionally identical to baseline.
- Mobile view (`< 769px`) must support 320px, 360px, 375px, 390px, 412px, 430px viewports without horizontal clipping or overflow.
- All 14 screens and all 45 API endpoints must remain fully functional.
- Zero input injection or game automation (compliance invariant).

---

### Task 1: Mobile Shell & Navigation
**Files:**
- Create: `web/src/shell/MobileBottomNav.tsx`
- Create: `web/src/shell/MobileDrawer.tsx`
- Modify: `web/src/shell/TitleBar.tsx`
- Modify: `web/src/App.tsx`
- Modify: `web/src/index.css`

- [ ] **Step 1: Create MobileBottomNav component with 5 primary tabs**
- [ ] **Step 2: Create MobileDrawer modal sheet with all 14 routes & live stats**
- [ ] **Step 3: Update TitleBar to support compact mobile mode and drawer toggle**
- [ ] **Step 4: Update App.tsx and index.css with responsive mobile container rules**
- [ ] **Step 5: Verify web build passes**

---

### Task 2: Core Combat & Live Screens
**Files:**
- Modify: `web/src/screens/HomeScreen.tsx`
- Modify: `web/src/screens/CoachScreen.tsx`
- Modify: `web/src/screens/LiveMatchScreen.tsx`
- Modify: `web/src/components/LobbyRoster.tsx`
- Modify: `web/src/screens/AgentSelectScreen.tsx`

- [ ] **Step 1: Make HomeScreen hero player banner and 4-column grid mobile-responsive**
- [ ] **Step 2: Adapt CoachScreen history sidebar into mobile modal, full-width chat, and scrolling prompt chips**
- [ ] **Step 3: Adapt LiveMatchScreen and LobbyRoster with segmented Allies/Opponents toggle**
- [ ] **Step 4: Adapt AgentSelectScreen grid to touch-friendly tiles and full-width action buttons**
- [ ] **Step 5: Verify web build passes**

---

### Task 3: Analysis & Progress Screens
**Files:**
- Modify: `web/src/screens/MatchAnalysisScreen.tsx`
- Modify: `web/src/screens/MatchDetailScreen.tsx`
- Modify: `web/src/screens/LineupsScreen.tsx`
- Modify: `web/src/screens/TrendsScreen.tsx`
- Modify: `web/src/screens/StatisticsScreen.tsx`

- [ ] **Step 1: Adapt MatchAnalysisScreen master-detail grid into mobile match selector + AI report card**
- [ ] **Step 2: Wrap MatchDetailScreen scoreboards and economy in responsive horizontal scrollers**
- [ ] **Step 3: Adapt LineupsScreen filter bar into 2-column grid and full-width cards**
- [ ] **Step 4: Adapt TrendsScreen window table with horizontal touch scroller**
- [ ] **Step 5: Adapt StatisticsScreen charts with responsive height and 1-column stack**
- [ ] **Step 6: Verify web build passes**

---

### Task 4: Economy, Locker & System Screens
**Files:**
- Modify: `web/src/screens/StoreScreen.tsx`
- Modify: `web/src/screens/LoadoutScreen.tsx`
- Modify: `web/src/screens/BattlepassScreen.tsx`
- Modify: `web/src/screens/CompanionScreen.tsx`
- Modify: `web/src/screens/SettingsScreen.tsx`

- [ ] **Step 1: Reflow StoreScreen daily offers and night market to 2 columns on mobile**
- [ ] **Step 2: Adapt LoadoutScreen category tabs to horizontal touch scroll and 2-column grid**
- [ ] **Step 3: Adapt BattlepassScreen tier scroller and quest cards**
- [ ] **Step 4: Stack CompanionScreen pairing code and live radar preview**
- [ ] **Step 5: Reflow SettingsScreen controls into single-column mobile layout**
- [ ] **Step 6: Verify web build passes**

---

### Task 5: End-to-End Verification & Audit Report
**Files:**
- Create: `docs/implementation/mobile-audit-report.md`

- [ ] **Step 1: Run all test suites (`npm run test:all`)**
- [ ] **Step 2: Run full workspace build (`npm run build:all`)**
- [ ] **Step 3: Document mobile audit and write `docs/implementation/mobile-audit-report.md`**
- [ ] **Step 4: Commit and push all changes to GitHub main**
