# 🏏 Cricket Auction 2026

A real-time, mobile-first cricket player auction management and broadcast platform built for high-energy category-by-category player bidding.

🔗 **Live Spectator View**: [dyotak.me/auction](https://dyotak.me/auction)  
🔐 **Auctioneer Admin Panel**: [dyotak.me/auction/admin](https://dyotak.me/auction/admin) *(Default Passcode: `auction2026`)*  

---

## 🚀 Key Features

- **Real-Time Live Wheel**: Smooth Canvas wheel animation with ease-out physics and silent confetti celebration upon player selection.
- **Instant Synchronization**: Powered by Firebase Realtime Database — when the auctioneer spins or moves a player, all audience screens update synchronously with zero delay.
- **Category Auction Workflow**:
  - Direct multiline copy-paste from Excel spreadsheets.
  - Three real-time buckets: **Currently in Auction**, **Sold**, and **Unsold**.
  - 3-action spin landing prompt: *Move to Sold*, *Move to Unsold*, or *Do Nothing*.
  - Rapid unsold player re-spins and category resets.
- **Google Sheets Purse Integration**:
  - Live purse tracking for both **Purse Men** and **Purse Women** tournaments.
  - Starting purse ₹1,00,000 per team with dynamic spend and remaining balance calculations.
  - Automatic 15-second background polling with zero server overhead.
  - Integrated mock data fallback matching reference teams: *RGC Sunrisers, RGC Indians, RGC Super Kings, RGC Supergiants, RGC Capitals, RGC Challengers, RGC Titans, RGC Royals, RGC Warriorz, RGC Giants*.
- **Mobile-First Experience**: Sticky top navigation toggling effortlessly between the live spectator wheel, Men's Purse board, and Women's Purse board.
- **Settings & Integration Modal**: Enter Firebase JSON and Google Sheet ID directly from the UI or via `.env` variables.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide React, Canvas Confetti.
- **State Sync**: Firebase Realtime Database (with automatic cross-tab Local Broadcast fallback).
- **Sheet Feed**: Public Google Sheets CSV/JSON (`gviz/tq`) feed.
- **Deployment**: GitHub Pages via GitHub Actions.

See architecture details in [docs/adr/0001-hybrid-architecture-firebase-and-google-sheets.md](./docs/adr/0001-hybrid-architecture-firebase-and-google-sheets.md) and domain vocabulary in [GLOSSARY.md](./GLOSSARY.md).

---

## ⚙️ Environment Variables & Secrets

Create a `.env.local` file (or set repository secrets in GitHub Actions):

```env
# Firebase Realtime Database
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Google Sheets ID (with tabs 'Purse Men' and 'Purse Women')
VITE_GOOGLE_SHEET_ID=

# Admin Access Passcode
VITE_ADMIN_PASSCODE=auction2026
```

---

## 💻 Local Development

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev

# Build for production
npm run build
```
