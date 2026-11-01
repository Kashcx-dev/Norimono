# Norimono (乗り物) — Comprehensive Technical Handover & Update

> **Document Version:** 1.0.0  
> **Date:** October 31, 2026  
> **Product Name:** Norimono Technologies — Enterprise Dual-Engine Mobility Platform  
> **Repository:** [https://github.com/Kashcx-dev/Norimono](https://github.com/Kashcx-dev/Norimono) (`main` branch)  
> **Target Production Platforms:** Web, Responsive Mobile (PWA / Capacitor / React Native WebView)

---

## 1. Executive Summary & Product Vision

**Norimono** is a closed-loop corporate mobility platform engineered to solve the daily office commute crisis for enterprise tech workers, tech park campuses, and corporate HR/Facility teams. 

Traditional ridesharing (Ola/Uber) suffers from surge pricing, driver cancellations, and lack of safety vetting. Traditional carpooling fails because of manual fare negotiation awkwardness, driver unreliability, and commercial transport licensing restrictions.

### The Dual-Engine Platform Architecture
1. **Engine 1: Closed-Loop Colleague Carpooling (P2P Non-Profit Cost Sharing)**
   - Only employees with verified corporate work emails (`@tcs.com`, `@infosys.com`, `@wipro.com`, etc.) can enter.
   - Drivers cannot arbitrarily set fares: algorithmic pricing strictly locks cost-sharing to actual fuel and toll split, keeping the platform **100% compliant with white-plate private vehicle laws**.
2. **Engine 2: Guaranteed Commercial Backup (Safety Net)**
   - Solves the primary cause of carpool abandonment: *carpool anxiety* (what if my colleague cancels last-minute?).
   - If a coworker cancels or no ride matches, Engine 2 automatically dispatches on-demand commercial cabs or autos with company corporate subsidies.

---

## 2. Technical Stack & Architecture

| Tier | Technologies Used | Details / Responsibilities |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS, Lucide React, React Router v7 | Responsive Uber-style mobile-first SPA, obsidian glassmorphic theme, zero horizontal scroll, tactile micro-interactions |
| **Mapping & Geospatial** | Leaflet, React-Leaflet, OpenStreetMap, OSRM API, Uber H3 | Fullscreen edge-to-edge canvas, custom SVG vehicle markers, triple-layer Neon Route Line, H3 hexagonal corridor matching |
| **Backend API** | Node.js, Express.js | RESTful routing, modular endpoints, JWT auth, input validation, role enforcement |
| **Real-Time & Telemetry** | Socket.io, WebRTC | Live corridor location streaming, room-based ride chat, browser-to-browser voice calling, instant admin verification updates |
| **Database & Persistence** | PostgreSQL / Supabase, `pg` connection pool | Relational schema with JSONB coordinates, double-entry wallet ledger, transactional consistency |
| **Payments & Wallets** | In-App Wallet Engine, Razorpay SDK | Zero-cash policy, automatic trip auto-settlement, UPI/Card top-up |
| **Security & Safety** | DOMPurify, bcrypt, Corporate OTP Email Wall, Strict Gender Filters | XSS protection across chat/AI, verified corporate domain gating, female-only commute isolation |
| **DevOps & Windows Tooling** | Batch scripts (`run.bat`, `start.bat`, `stop.bat`) | One-click service orchestration, port auto-cleanup, dual-process window management |

---

## 3. Exhaustive Feature Inventory (What We Have Built)

### A. The Verification Wall & Authentication Flow
- **Corporate Work Email Gating**: Users must register with official work emails. Public domains (`@gmail.com`, `@yahoo.com`, `@hotmail.com`) are rejected at the verification wall.
- **Dynamic Corporate Domain Detection**: Typing an email auto-detects corporate affiliation (e.g. `@tcs.in` -> **Tata Consultancy Services**, `@infosys.com` -> **Infosys**, `@wipro.com` -> **Wipro**, etc.).
- **Frictionless 1-Step Onboarding**: Removed premature passenger vs. driver split during signup. All employees create their account with Name, Work Email, Mobile Phone, Company, Gender, and Password, then verify with a one-time OTP.
- **Two-Factor Authentication (OTP)**: Generates secure corporate verification codes with dev fallback hints for seamless testing.

### B. The Digital ID Card & Trust Badges
- **Corporate Logo Framing**: Every colleague profile avatar is dynamically ringed with their official SVG corporate badge (TCS navy blue, Infosys sky blue, Wipro multi-dot, Google quad-color, Microsoft 4-square, Accenture purple, Odoo fuchsia, etc.).
- **Digital ID Card Modal**: Inspectable badge displaying verified employee ID, designation, department, corporate domain, safety rating, and closed-loop enterprise verification stamp.

### C. Uber-Style Mobile-First UI Redesign
- **Fullscreen Edge-to-Edge Map Canvas**: The interactive Leaflet map covers 100% of the screen (`100vw`, `100vh`), replacing the legacy 2-column cluttered boxed layout.
- **Floating Glass Top Bar**:
  - Left: `Norimono` brand wordmark with live status pulse + Corporate affiliation pill (e.g., `TCS • Verified`).
  - Right: Dedicated **"Offer a Ride"** smart button, **In-App Wallet balance pill**, and **Profile Avatar / Digital ID**.
- **Uber-Style Docked Bottom Sheet (Drawer)**:
  - Mobile: Docked to bottom with a native-style pull indicator, smooth scrolling, and compact touch targets.
  - Desktop: Floats cleanly on bottom-left (`w-[440px]`), allowing the map to remain visible across the screen.
- **"Where to?" Search Flow**:
  - Connected origin (green dot with GPS auto-location) and destination (black square with autocomplete suggestions).
  - **1-Tap Tech Hub Shortcuts**: Quick pills for top tech parks (`Ecospace`, `Manyata`, `ETV`, `Electronic City`, `Cyber City`, `BKC`, `Hinjewadi`).
  - **Live OSRM Distance & Drive Duration Pill**: Calculates real road routes with turn-by-turn geometry.
  - High-contrast tactile action button: `Find Colleague Rides →`.

### D. Colleague Match Feed & Filtering
- **Match Cards**: Displays colleague photo, company badge, car model, departure time, ETA, distance, and locked cost-share price.
- **Strict Female-Only Safety Filter**: Toggle (`[ 🌸 Female-Only ]`) that filters the feed strictly for female drivers and female colleague passengers.
- **Direct 1-Tap Booking**: Instantly reserves seat, debits the wallet in escrow, generates a unique 4-digit pickup OTP, and switches to active trip tracking.

### E. White-Plate Non-Profit Algorithmic Pricing
- **Zero Surge / Anti-Commercial Exploitation**: Drivers cannot manually set fares.
- **Cost-Split Formula**:
  $$\text{Fare per seat} = \frac{\text{OSRM Distance (km)} \times \text{Standard Fuel/Toll Rate}}{\text{Total Available Seats}}$$
- Strictly complies with private vehicle non-commercial carpooling regulations.

### F. Triple-Layer Glowing Route Neon Line
- Leaflet map rendering with a glowing 3-tier polyline stroke:
  1. Outer halo: 12px width, `#00F5D4` cyan, 28% opacity.
  2. Vibrant core: 6px width, `#06B6D4` teal, 85% opacity.
  3. Inner spine: 2.5px width, `#FFFFFF` crisp white, 95% opacity.

### G. Smart Driver Onboarding & Commute Publisher
- Dedicated `[ 🚗 Offer Ride ]` button in the top navigation:
  - If **unregistered (`hasVehicle === "0"`)**: Opens the **Vehicle & Driver License Registration Modal** (DL number, vehicle plate, certified catalog of 2,000+ car models, seat capacity, fuel consumption ratio).
  - If **pending approval (`hasVehicle === "1"`)**: Alerts user that credentials are being vetted by the corporate administrator.
  - If **verified driver (`hasVehicle === "2"`)**: Opens the **Algorithmic Route Publisher Modal** (origin, destination tech park, departure time, seat count, and auto-calculated fuel split).

### H. Zero-Cash Policy & Wallet System
- **In-App Commute Wallet**: Eliminates awkward cash payments between colleagues at drop-off.
- **Automated Drop-Off Settlement**: When a ride completes, the rider's wallet is debited and the driver's wallet is credited automatically.
- **Razorpay SDK Integration**: Dynamic top-up modal with predefined amounts (`₹100`, `₹250`, `₹500`, `₹1,000`).
- **Double-Entry Ledger**: Tracks all transactions (`fare_deduction`, `driver_earnings`, `company_subsidy`, `wallet_topup`, `refund`).

### I. Real-Time Communications & Safety
- **WebRTC Voice Calling**: Free, direct browser-to-browser voice calling without exposing personal phone numbers.
- **Socket.io Live Ride Chat**: Encrypted room-isolated chat between booked passengers and the driver.
- **Driver Pickup OTP Handshake**: Driver cannot start the ride without entering the passenger's 4-digit OTP, preventing ghost pickups.
- **Emergency SOS Modal**: Instant broadcast to campus security and emergency contacts.

### J. B2B Corporate HR & ESG Impact Dashboard
- Dedicated campus portal for HR and corporate facility managers (`/admin`):
  - **Live Metrics**: Total carpool rides completed, Total CO₂ emissions saved (kg), and Campus parking spaces freed today.
  - **Campus Congestion Simulator**: Interactive slider (0 to 1,000 employees) dynamically calculating peak-hour traffic reduction.
  - **Driver Verification Queue**: Administrator interface to approve or reject pending driver licenses and car registrations in real-time via WebSockets.

### K. One-Click Windows Launch Scripts
- `run.bat`: Master Windows startup script that launches the Node backend on port 5000 and Vite frontend on port 5173 in separate, cleanly titled consoles, checks health, and auto-opens the browser at `http://localhost:5173`.
- `start.bat`: Convenience wrapper for `run.bat`.
- `stop.bat`: One-click process termination that frees ports 5000 and 5173 cleanly.

### L. BlaBlaCar Replica Features & Ride Customizations
- **The "BlaBla" Chattiness Scale**:
  - `Bla` (Quiet): Prefer a peaceful commute, work focus, or quiet journey.
  - `BlaBla` (Friendly): Open to casual conversations and light workplace chat.
  - `BlaBlaBla` (Chatty): Enjoys lively conversations, storytelling, and networking.
  - Displayed visually as badges on every ride card in the browse feed.
- **Commute Comfort & Amenity Toggles**:
  - `❄️ AC Enabled`: Guaranteed air conditioning for Bangalore/Hyderabad/Pune summers.
  - `🚭 Strictly No Smoking`: Tobacco and vape-free vehicle environment.
  - `🎵 Music / Podcasts Allowed`: Commute with music or podcasts enabled.
  - `👥 Max 2 in the Back`: BlaBlaCar's signature comfort guarantee leaving the middle rear seat empty.
  - `⚡ Instant Booking`: Guaranteed 1-tap immediate confirmation without waiting for driver manual approval.
- **En-Route Corridor Stopovers & Intermediate Waypoints**:
  - Drivers can declare intermediate tech-park waypoints (e.g. Silk Board, Marathahalli, Bellandur, Hebbal, HSR Layout, Tin Factory, Phoenix Marketcity).
  - Stored in JSONB and displayed as waypoint corridor badges on ride cards.
  - Passengers can select specific en-route stopovers as their pickup location during booking.
- **Luggage Capacity Tiers**:
  - Drivers define maximum allowed luggage size; passengers select their luggage size when booking:
    - `🎒 Small` (Backpack / Laptop bag)
    - `🧳 Medium` (Cabin roller / duffel bag)
    - `📦 Large` (Large suitcase / travel bag)
- **Passenger Pickup Notes**:
  - When requesting a seat, passengers can provide specific pickup instructions (e.g., "Waiting by Main Gate 2 next to the ATM").
- **Daily Office Commute (Mon-Fri) Recurring Flag**:
  - Toggle to indicate recurring corporate commute patterns for carpooling circles.

### M. Driver Verification Management & Profile Vehicles Modal
- **Subtle Glass Notification Toasts**:
  - Converted blocking modal verification alerts into auto-fading glass toasts (`AlertModal.jsx`) that disappear smoothly after 3.2 seconds.
- **Dynamic "Show Registered Vehicles" Action**:
  - Drivers who have completed registration (`hasVehicle >= 1`) now have a dedicated "Show Registered Vehicles" button in the Top Navigation and Profile Modal.
  - Modal (`RegisteredVehiclesModal.jsx`) displays license plate, car model, seating capacity, fuel ratio, and live approval status (`Pending Verification` vs. `Corporate Verified`).

---

## 4. Database Schema Overview

```
+---------------------------------------------------------------------------------+
|                                 DATABASE SCHEMA                                 |
+---------------------------------------------------------------------------------+

  +----------------------+          +----------------------+
  |        users         |          | rider_verifications  |
  +----------------------+          +----------------------+
  | emp_id (PK)          |<---------| emp_id (FK)          |
  | name                 |          | dl_no                |
  | email (UNIQUE)       |          | vehicle_no           |
  | org_name             |          | vehicle_model        |
  | phone                |          | seating_capacity     |
  | role (employee/admin)|          | fuel_consumption_ratio|
  | rider_type           |          | insurance_no         |
  | password_hash        |          | status (pending/appr)|
  | is_vehicle_registered|          +----------------------+
  | passenger_rating     |
  | driving_rating       |          +----------------------+
  | reset_otp            |          |       vehicles       |
  | reset_otp_expiry     |          +----------------------+
  +----------------------+          | veh_id (PK)          |
            |                       | veh_no (UNIQUE)      |
            +---------------------->| emp_id (FK)          |
            |                       | vehicle_model        |
            |                       | seating_capacity     |
            |                       +----------------------+
            |                                  |
            v                                  v
  +----------------------+          +----------------------+
  |       wallets        |          |        rides         |
  +----------------------+          +----------------------+
  | wallet_id (PK)       |          | ride_id (PK)         |
  | emp_id (FK, UNIQUE)  |          | driver_id (FK)       |
  | balance              |          | veh_no (FK)          |
  +----------------------+          | origin (JSONB)       |
            |                       | destination (JSONB)  |
            v                       | departure_time       |
  +----------------------+          | available_seats      |
  | wallet_transactions  |          | fare_per_seat        |
  +----------------------+          | status               |
  | transaction_id (PK)  |          | polyline (TEXT)      |
  | emp_id (FK)          |          | preferences (JSONB)  | <-- Chattiness, AC, Smoking, Music, Max2Back, Luggage
  | ride_id (FK)         |          | stopovers (JSONB)    | <-- En-route corridor waypoints
  | type                 |          | is_recurring (BOOL)  | <-- Daily Mon-Fri office commute
  | amount               |          | instant_booking(BOOL)| <-- Instant 1-tap seat confirmation
  | description          |          +----------------------+
  +----------------------+                     |
                                               v
                                    +----------------------+
                                    |       bookings       |
                                    +----------------------+
                                    | booking_id (PK)      |
                                    | ride_id (FK)         |
                                    | passenger_id (FK)    |
                                    | pickup_location      |
                                    | dropoff_location     |
                                    | booking_status       |
                                    | payment_status       |
                                    | otp                  |
                                    | fare_amount          |
                                    | luggage_size (TEXT)  | <-- Declared passenger luggage (small/medium/large)
                                    | passenger_notes(TEXT)| <-- En-route pickup notes for driver
                                    | selected_stopover    | <-- Chosen intermediate pickup point
                                    +----------------------+
```

---

## 5. API Routes Reference

### Authentication (`/auth`)
- `POST /auth/signup` — Registers employee, validates corporate domain, hashes password, triggers OTP.
- `POST /auth/verify-2fa` — Verifies corporate OTP and returns JWT token + user profile.
- `POST /auth/login` — Corporate email + password authentication.
- `GET /auth/me` — Fetches active profile, wallet balance, and driver verification state.
- `POST /auth/logout` — Destroys session token.

### Rides & Commute (`/rides`)
- `GET /rides` — Geospatial discovery within 10 km radius with gender, tech park, and seat filtering. Supports BlaBlaCar query filters: `ac=true`, `instant=true`, `max_two_back=true`.
- `POST /publish-ride` — Publishes commute with algorithmic price calculation, preferences (chattiness, AC, smoking, music, max 2 in back, luggage tier), stopovers JSONB, and recurring commute flag.
- `POST /book-ride` — Locks available seat atomically with row-level locks, records declared luggage size, stopover choice, and custom pickup note, places fare in escrow, generates pickup OTP.
- `GET /rides/driver/active` — Fetches driver's currently active ride, route, and booked passengers with luggage & note specs.
- `GET /rides/passenger/active` — Fetches passenger's booked ride status, driver details, and OTP.
- `POST /pickup-ride` — Driver enters passenger OTP to verify physical onboarding.
- `POST /finish-ride` — Completes trip, executes wallet settlement, opens star ratings.

### Vehicle Verification (`/register-vehicle`, `/admin`)
- `POST /register-vehicle` — Enters vehicle and DL into administrative approval queue.
- `GET /admin/verifications` — Lists pending driver applications for campus admins.
- `POST /admin/verify-rider` — Approves or rejects driver with real-time WebSocket alert.
- `GET /admin/impact-metrics` — Supplies ESG carbon savings and parking space analytics.

### Wallet & Payments (`/wallet`)
- `GET /wallet/balance` — Returns user's balance and ledger history.
- `POST /wallet/topup` — Simulates/processes Razorpay gateway wallet recharge.
- `POST /wallet/transfer` — Executes escrow release and fuel cost-split transfer.

---

## 6. Git Commit Highlights (Chronological Track)

- `[Current]` — **feat(ui):** Minimalist search results view: stripped bulky covers, search inputs, and disclaimers from `BrowseRidesPanel.jsx`; added ultra-compact header with `Edit Route`, `Female-Only` toggle, and small results count pill so colleague rides are immediately visible and scrollable.
- `ee64b24` — **fix(auth):** Streamline login flow, auto-align corporate organization, and support global top-level domains (`.in`, `.org`, `.co.in`).
- `6a94ec6` — **feat(blablacar):** Full BlaBlaCar replica features: Chattiness Meter (Bla/BlaBla/BlaBlaBla), Ride Amenities (AC, No Smoking, Music, Max 2 in back comfort guarantee), En-Route Corridor Stopovers, Luggage capacity tiers, Instant Booking, and Recurring Commutes.
- `addeabf` — **feat(ui):** Convert verification alerts to auto-fading glass toasts; add dynamic "Show Registered Vehicles" modal to Profile and Navigation with real-time status tracking.
- `622220e` — **fix(backend):** Fix Node 24 / Express 5 `path-to-regexp` crash by replacing unparameterized wildcard route with pathless SPA middleware.
- `c65e4d5` — **feat(driver):** Implement dedicated Driver Cockpit UI, individual passenger entity isolation, real-time Socket.io seat count synchronization, and PostgreSQL row-level transaction locks (`FOR UPDATE`) preventing double-booking and double-settlement race conditions.
- `390ea59` — **feat(ui):** Complete Uber-style mobile-first redesign with fullscreen map canvas and dedicated smart ride publisher.
- `5cc0c1e` — **fix(signup):** Restore mobile phone number input in registration form with phone icon and validation.
- `12e2368` — **feat:** Add one-click Windows launch and stop batch scripts (`run.bat`, `start.bat`, `stop.bat`).
- `ae31ef3` — **fix:** Implement Pitch Deck specifications: Digital ID card, Work Email Wall, Algorithmic Pricing, Glowing Route Neon Line, Female-only filter, Engine 2 backup, and B2B Impact Screen.
- `6ffecac` — **feat:** Full product rebrand to Norimono, corporate wallet subsidies, and H3 corridor en-route ridesharing.
- `94e5e5f` — **fix:** Seat booking race condition resolution, chat socket integration, and custom alert modals.
- `f23dd91` — **security:** Add DOMPurify sanitization across chat, AI responses, live sockets, and feedback endpoints.

---

## 7. Driver Cockpit & Concurrency Verification System (Completed)

1. **Entity Isolation Architecture**:
   - Every passenger in the driver cockpit is rendered as an isolated corporate entity with their corporate logo badge, department, designation, safety indicators, direct call capability, and individual 4-digit boarding OTP input.
   - Separate state management per passenger prevents any cross-contamination of boarding, drop-off, or payment settlement.

2. **Real-Time Concurrency & Race Condition Elimination**:
   - **Atomic Seat Decrement**: `UPDATE rides SET available_seats = available_seats - $1 WHERE ride_id = $2 AND available_seats >= $1` in PostgreSQL row-locked transaction (`FOR UPDATE`) guarantees zero overbooking even with simultaneous clicks.
   - **Real-Time Seat Broadcasting**: Instant `ride_seats_updated` WebSocket events update all user browse cards in real time without refreshing. Rides with 0 seats instantly switch to "Ride Full" status.
   - **Double-Settlement Prevention**: `finishRide.js` transaction acquires an immediate row-level lock on the ride before checking completion status, preventing duplicate wallet deductions or credits.

3. **Trip Completion & ESG Impact Summary Card**:
   - Comprehensive post-commute driver summary displaying net earnings credited, gross colleague cost-shares, enterprise green subsidies, coworkers transported, kg CO₂ emissions cut, and campus parking spots freed.

---

## 8. Next Phase Roadmap: Mobile Native Export

1. **Capacitor Mobile Packaging**:
   - Configure Capacitor 6.x to export Norimono into native Android APK and iOS ipa bundles.
2. **Push Notifications**:
   - Web Push and Firebase Cloud Messaging for instant lockscreen notifications when a coworker requests a seat along the driver's route.

---
*Created by Google DeepMind Advanced Agentic Coding for the Norimono Engineering Team.*

