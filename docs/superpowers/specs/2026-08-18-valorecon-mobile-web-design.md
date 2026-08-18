# ValoRecon Mobile Web Experience — Architecture & Design Spec

**Date:** 2026-08-18  
**Working Directory:** `C:\IMP\ValoRecon-backup`  
**Scope:** Mobile Web Application & Companion UX (Mobile Viewports 320px – 430px)  
**Strict Invariant:** Zero changes, regressions, or redesigns to Desktop/PC view (>= 769px).  

---

## 1. Executive Summary & Goals
This specification defines the complete, production-grade mobile web experience for ValoRecon. The goal is to transform the web application on mobile screens into a native-feeling tactical companion that provides full access to all 14 screens, AI coach dialogues, real-time match telemetry, agent advice, and locker archives without sacrificing desktop layout, styling, or functionality.

---

## 2. Desktop Preservation Invariant
- **Desktop (>= 769px):**
  - Permanent 232px sidebar (`.app-nav`) remains intact.
  - Multi-column master-detail grids, side-by-side coach history, wide scoreboard tables, and 4/6-column store/loadout grids remain 100% untouched.
  - No desktop styling, spacing, or typography is altered.
- **Mobile (< 769px):**
  - Desktop sidebar is hidden (`display: none`).
  - Mobile Bottom Navigation bar (`MobileBottomNav.tsx`) is rendered with safe-area insets.
  - Mobile Drawer sheet (`MobileDrawer.tsx`) provides 1-tap access to all 14 routes.
  - Compact Mobile Header (`TitleBar.tsx`) provides brand monogram, screen title, Riot connection badge, and drawer trigger.
  - Content viewport is padded to prevent occlusion by bottom navigation: `padding-bottom: calc(68px + env(safe-area-inset-bottom, 0px))`.

---

## 3. Mobile Navigation Architecture

### 3.1 Mobile Bottom Navigation (`MobileBottomNav.tsx`)
Rendered fixed at `bottom: 0` with 5 primary thumb-accessible destinations:
1. **Dashboard** (`/`) — Icon: `LayoutDashboard`
2. **AI Coach** (`/coach`) — Icon: `Sparkles` (Badge: 'AI')
3. **Live Match** (`/live-match`) — Icon: `Radio` (Pulse dot indicator)
4. **Agent Select** (`/agent-select`) — Icon: `UserCheck`
5. **More** (Drawer sheet toggle) — Icon: `Menu`

### 3.2 Mobile Drawer ("More" Sheet — `MobileDrawer.tsx`)
A slide-up bottom sheet / modal covering secondary destinations:
- **Combat & Analysis:** `Match Analysis` (`/analysis`), `Match Detail` (`/match-detail`), `Lineups` (`/lineups`), `Trends & Plan` (`/trends`), `Statistics` (`/statistics`)
- **Inventory & Progression:** `Featured Store` (`/store`), `Loadout` (`/loadout`), `Battlepass` (`/battlepass`)
- **System & Second Screen:** `Mobile Companion` (`/companion`), `Settings` (`/settings`)
- **Footer Status:** Live Riot connection indicator, Region/Shard, and VP/Radianite wallet balance.

---

## 4. Screen-by-Screen Mobile Responsive Specifications

### 1. Dashboard (`/`) — `HomeScreen.tsx`
- **Hero Banner:** Stacks avatar + username on top and rank tier badge on bottom.
- **Quick Action Grid:** Converts from `repeat(4, 1fr)` to `repeat(2, 1fr)` with 48px minimum touch targets.
- **Recent Matches & Tactical Insights:** Stack vertically; match list cards render with compact map thumbnails and win/loss badges.

### 2. AI Coach (`/coach`) — `CoachScreen.tsx`
- **History Sidebar:** Collapses into a toggleable drawer/modal on mobile; chat viewport expands to 100% width.
- **Suggestion Chips:** Horizontal scroll container (`overflow-x: auto`, `white-space: nowrap`) with smooth touch swiping.
- **Chat Feed & Input:** Messages scale to 100% width; input bar stays fixed above the bottom nav with safe-area padding.

### 3. Match Analysis (`/analysis`) — `MatchAnalysisScreen.tsx`
- **Master-Detail Layout:** Converts 2-column grid (`360px 1fr`) into a mobile-friendly view: top horizontal match selector card + full-width AI tactical report card.

### 4. Match Detail (`/match-detail`) — `MatchDetailScreen.tsx`
- **Header & Map Banner:** Stacks map name, result badge, and match dropdown.
- **Scoreboard Tables:** Wrapped in a responsive horizontal scroller (`overflow-x: auto`) with sticky player name column; stat summary cards reflow to 2-column grid.

### 5. Live Match (`/live-match`) — `LiveMatchScreen.tsx` & `LobbyRoster.tsx`
- **Lobby Roster:** Segmented control toggling between `Allies (5)` and `Opponents (5)` on mobile.
- **Match State & Economy Radar:** Stacks vertically with clear connection status indicators.

### 6. Agent Select Helper (`/agent-select`) — `AgentSelectScreen.tsx`
- **Agent Grid:** Responsive grid using `repeat(auto-fill, minmax(85px, 1fr))` with 48px touch targets for agent avatars.
- **Action Panel:** Lock and Hover action buttons expand to full-width thumb-friendly buttons.

### 7. Lineups Explorer (`/lineups`) — `LineupsScreen.tsx`
- **Filter Controls:** 2-column dropdown filter grid with full-width search input.
- **Lineup Cards:** Reflow to full-width cards with 1-tap copy button.

### 8. Trends & Plan (`/trends`) — `TrendsScreen.tsx`
- **Window Comparison Table:** Wrapped in horizontal scroller; weekly plan goals and drills stack vertically into touch cards.

### 9. Statistics (`/statistics`) — `StatisticsScreen.tsx`
- **Charts:** K/D Trend line chart and Hit PieChart stack vertically (`gridTemplateColumns: '1fr'`) with explicit 220px container height.
- **Stat Summary Cards:** Reflow to 2-column grid.

### 10. Store & Night Market (`/store`) — `StoreScreen.tsx`
- **Daily Offers:** Reflow from 4 columns to 2 columns on mobile.
- **Night Market:** 2-column flip cards with 1-tap reveal.
- **Inspect Modal:** Full-screen mobile overlay with top-right dismiss button.

### 11. Loadout & Arsenal (`/loadout`) — `LoadoutScreen.tsx`
- **Category Tabs:** Horizontal touch-scroll tab bar (`Sidearms`, `SMGs`, `Shotguns`, `Rifles`, `Snipers`, `Heavies`, `Melee`).
- **Weapon Cards:** Reflow from 4 columns to 2 columns.

### 12. Battlepass (`/battlepass`) — `BattlepassScreen.tsx`
- **Tier Track:** Horizontal scroll with smooth touch swiping and tier cards.
- **Quests:** Daily and Weekly quest cards stack vertically with progress bars.

### 13. Mobile Companion (`/companion`) — `CompanionScreen.tsx`
- **Pairing & Radar:** Pairing code card and live match mirror stack into full-width cards.

### 14. Settings (`/settings`) — `SettingsScreen.tsx`
- **Settings Sections:** Single-column layout with touch-friendly segmented pills and sliders.

---

## 5. Viewport Test Matrix
- **320px:** iPhone SE / small Android devices (minimum bounding box)
- **360px:** Standard Android (Galaxy A series)
- **375px:** iPhone 12/13 Mini, iPhone 8/SE 2nd gen
- **390px:** iPhone 13/14/15/16 standard
- **412px:** Google Pixel 7/8, Samsung Galaxy S23/S24
- **430px:** iPhone 14/15/16 Pro Max
- **1280px, 1440px, 1920px:** Desktop verification (ensuring 0 desktop regressions)

---

## 6. Implementation Steps
1. Create `web/src/shell/MobileBottomNav.tsx` and `web/src/shell/MobileDrawer.tsx`.
2. Update `web/src/shell/TitleBar.tsx` with mobile menu trigger and compact header mode.
3. Update `web/src/App.tsx` and `web/src/index.css` with responsive mobile layout rules, safe-area variables, and breakpoints.
4. Update screen layouts across all 14 screens for responsive mobile reflow while keeping desktop styles intact.
5. Run automated test suites and production web builds.
6. Verify viewports and document results in `docs/implementation/mobile-audit-report.md`.
