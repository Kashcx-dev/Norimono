# Norimono (乗り物)

**Norimono** is an enterprise-grade carpooling and ridesharing platform built for corporate ecosystems (a reverse-Uber / BlaBlaCar model for verified employees).

## ✨ Key Features

- **Two-Step Registration & Driver Verification Queue**:
  - Separate flows for Passengers and Riders.
  - Driver credential verification (Driver's License, Vehicle details with catalog auto-fill, plate number, and insurance).
  - Admin review dashboard with real-time approval/rejection.
- **Uber H3 Spatial Grid & A\* Routing**:
  - Resolution 8 hexagonal spatial indexing for commuter corridors.
  - O(1) set-based corridor matching with Haversine cross-track detour calculation.
  - Hexagonal polygon boundaries on interactive Leaflet maps.
- **Active En-Route Passenger Hop-In**:
  - Passengers can discover and book seats on active drivers currently driving along their route (`in_progress`).
  - Real-time waypoint notifications with 4-digit boarding OTP verification.
- **Corporate Commute Wallet & Subsidized Fare Split**:
  - Automated fair-share pricing based on organization reimbursement settings and vehicle fuel efficiency.
  - Enterprise green commute subsidies automatically credited to drivers upon ride completion.
  - In-app commute wallet with live transaction ledger.
- **Enterprise Safety & Real-Time Communication**:
  - WebRTC voice calling between co-commuters.
  - Real-time ride tracking and Socket.io signaling.
  - Verified corporate domain authentication and HTTP-only JWT sessions.

## 🚀 Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Leaflet, Lucide Icons, Socket.io Client
- **Backend**: Node.js, Express, PostgreSQL, Socket.io, Uber H3 (`h3-js`), OSRM Routing
- **Database**: PostgreSQL (Compatible with local Postgres and Supabase Cloud)

## 🛠️ Quick Start

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure your DB_URI in .env
npm start
```

### 2. Frontend Setup
```bash
cd react-frontend
npm install
npm run dev
```
