# ValoRecon — Your AI VALORANT coach

**ValoRecon** is an AI-powered VALORANT companion and tactical coaching web application built with **React 18 + Vite + TypeScript** and **Express + TypeScript**, powered by **Google Gemini AI** (`gemini-3.5-flash`).

> *"Your AI VALORANT coach."*

---

## ⚡ Quick Start

### 1. Prerequisites
- Node.js 18+ / 24+
- `GEMINI_API_KEY` configured in `server/.env`

### 2. Run Both Frontend & Backend (Development)
From the root directory:
```bash
npm run dev
```
- **Web Application**: `http://localhost:5173`
- **Backend API**: `http://localhost:8799`

---

## 🎮 Features & Screens

1. **Command Dashboard** — Hero player card, KPI combat cards (Rank, Win Rate, KD, Headshot %, Recent Form), Quick Launchers, Top Agents, and Recent Matches.
2. **Radiant AI Coach (Chat)** — Real-time token-by-token SSE streaming tactical assistant powered by Gemini. Supports lineups, buy strategy, and positioning.
3. **Match Analysis** — Master-Detail match inspector with **"Analyze with AI"** calling Gemini for in-depth tactical coaching breakdowns, swing round reviews, and ratings.
4. **Match Detail** — Comprehensive scoreboards (Allies vs Enemies), ACS, ADR, HS%, First Bloods, round-by-round timeline with win types, and economy breakdown.
5. **Live Match Tracker** — In-progress match radar (Ascent 7-5), agent loadouts, credits, ultimate readiness status, and live coach alerts.
6. **Agent Select Advisor** — 100% manual decision aid with **Recommend Mode** (map & comp synergy analysis) and **Fast-Pick Mode** (one-click lock & copy pick).
7. **Performance Statistics** — Interactive Recharts trends, hit accuracy breakdown (Head/Body/Leg), map win rate matrix, and agent performance table.
8. **Featured Store & Night Market** — Daily 4-skin rotation cards, featured Kuronami bundle, and interactive flip-to-reveal Night Market discounts.
9. **Weapon Arsenal & Loadout** — Full weapon inventory viewer categorized by Sidearms, SMGs, Shotguns, Rifles, Snipers, Heavies, Melee, plus Player Identity cosmetics.
10. **Battlepass Progression** — Episode 9: Act 2 reward track with Free & Premium progression, XP leaderboard, and active Daily/Weekly quests.
11. **Settings & Diagnostics** — Visual theme accent switcher, AI coaching tone configuration, account info, and live API health monitors.

---

## 🛠️ Tech Stack & Architecture

- **Frontend:** React 18, Vite, TypeScript, React Router 6, Recharts, Lucide React, React Markdown
- **Backend:** Node.js, Express, TypeScript, `@google/genai` (`gemini-3.5-flash`)
- **Public Game Assets:** Valorant API (`https://valorant-api.com/v1/`) with in-memory caching
- **Fair Play Guarantee:** 100% compliant manual decision helper — NO game automation, NO input injection, NO memory reading.
