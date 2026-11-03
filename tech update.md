# Norimono (乗り物) — Master Technical Documentation & System Specification

> **Document Version:** 2.1.0  
> **Date:** November 3, 2026  
> **Product Name:** Norimono Technologies — Enterprise Dual-Engine Mobility Platform  
> **Repository:** [https://github.com/Kashcx-dev/Norimono](https://github.com/Kashcx-dev/Norimono) (`main` branch)  
> **Target Production Platforms:** Modern Web, Responsive Mobile (PWA / Capacitor / React Native WebView)

---

## 1. Executive Summary & Product Architecture

**Norimono (乗り物)** is an enterprise-exclusive mobility platform engineered to solve the daily office commute crisis for tech workers, technology campuses, and corporate HR/Facility teams across major metropolitan centers (Bangalore, Hyderabad, Pune, Gurgaon, Mumbai, Chennai).

### The Dual-Engine Mobility Paradigm

1. **Engine 1: Closed-Loop Colleague Carpooling (P2P White-Plate Cost-Sharing)**
   - Restricted strictly to employees with verified corporate work emails (`@tcs.com`, `@infosys.com`, `@wipro.com`, `@google.com`, etc.).
   - White-plate private vehicle non-commercial compliance (Motor Vehicles Act Sec 66 & 192A).
   - **Algorithmic Legal Pricing**: Drivers cannot manually set, inflate, or bargain fares. Pricing is algorithmically locked to actual OSRM road distance, certified vehicle fuel consumption, and seat count.
   - **Zero Cash Policy**: Peer-to-peer double-entry wallet escrow with corporate green commute ESG subsidies.

2. **Engine 2: Guaranteed Commercial Backup (Safety Net)**
   - Eliminates *carpool anxiety* (fear of colleague cancellation).
   - If a coworker cancels last-minute or no route matches, Engine 2 automatically dispatches on-demand commercial cabs or autos backed by corporate commute subsidies.

---

## 2. Technical Stack & Architecture

| Tier | Technologies Used | Details / Responsibilities |
| :--- | :--- | :--- |
| **Frontend SPA** | React 19, Vite, Tailwind CSS, Lucide React, React Router v7 | Mobile-first responsive interface, obsidian glassmorphic theme, zero horizontal scroll, tactile micro-interactions |
| **Geospatial & Telemetry** | Leaflet, React-Leaflet, OpenStreetMap, OSRM API, Uber H3 | Fullscreen edge-to-edge canvas, custom SVG vehicle markers, triple-layer Neon Route Line, H3 hexagonal corridor matching |
| **Backend REST API** | Node.js, Express.js | RESTful routing, modular endpoints, JWT auth, input validation, role enforcement |
| **Real-Time Communications** | Socket.io, WebRTC | Live corridor location streaming, room-based ride chat, browser-to-browser voice calling, instant admin verification alerts |
| **Database & Persistence** | PostgreSQL / Supabase, `pg` connection pool | Relational schema with JSONB coordinates, double-entry wallet ledger, transactional consistency |
| **Payments & Wallets** | In-App Closed-Loop Commute Wallet, Razorpay SDK | Zero-cash policy, automatic trip escrow auto-settlement, non-withdrawable closed-loop ledger |
| **Security & Safety** | DOMPurify, bcrypt, Corporate OTP Email Wall, Strict Gender Filters | Recursive payload XSS scrubbing, bcrypt password hashing, female-only commute isolation |
| **DevOps & Windows Tooling** | Batch scripts (`run.bat`, `start.bat`, `stop.bat`) | One-click service orchestration, port auto-cleanup, dual-process window management |

---

## 3. White-Plate Non-Commercial Algorithmic Pricing Engine

### A. Statutory Legal Basis (Motor Vehicles Act, 1988)

Under transport regulations across India (notably **Section 66** [Necessity for permits] and **Section 192A** [Using vehicle without permit] of the *Motor Vehicles Act, 1988*), private vehicles bearing **white registration plates** are strictly prohibited from engaging in commercial hire or reward operations. Operating as a commercial taxi without a transport permit is a severe statutory violation.

To remain **100% compliant with white-plate private vehicle laws**:
1. **No Commercial Profit / Driver Gain**: The vehicle owner is travelling on their own personal commute anyway; they are merely sharing empty seats with verified colleagues.
2. **Variable Operational Cost Sharing Only**: Financial split is strictly confined to sharing variable trip expenditures (fuel and tolls).
3. **Strict Algorithmic Lock**: Drivers **cannot** set arbitrary, surge, or negotiated prices. The fare per seat is mathematically determined and locked on the backend.

---

### B. Mathematical Formulation & Algorithmic Equations

The pricing engine executes on both the estimation endpoint (`POST /rides/fare-estimate`) and the publishing endpoint (`POST /publish-ride`):

#### 1. Real Road Distance Determination ($D_{\text{OSRM}}$)
Rather than inaccurate straight-line Haversine estimates, the engine queries the Open Source Routing Machine (OSRM) driving API:
$$D_{\text{OSRM}} = \frac{\text{Distance}_{\text{meters}}}{1000.0} \quad (\text{in kilometers})$$
*(If OSRM is temporarily offline, the system safely falls back to: $D_{\text{fallback}} = \text{HaversineDistance} \times 1.35$ urban detour factor).*

#### 2. Certified Vehicle Fuel Consumption Ratio ($\phi_{\text{burn}}$)
Every vehicle registered in Norimono is mapped to a certified RTO catalog of 2,000+ car models with a standardized fuel consumption ratio $\phi_{\text{burn}}$:
$$0.74 \le \phi_{\text{burn}} \le 1.35$$
*(e.g., Highly efficient diesels / hybrids $\approx 0.74 - 0.85$, benchmark 15 km/l hatchbacks $\approx 1.00$, larger sedans/SUVs $\approx 1.10 - 1.25$).*

#### 3. Base Fuel Expense per Kilometer ($C_{\text{fuel}}$)
Configured per enterprise organization in the `org_settings` table (defaulting to ₹5.50/km, reflecting current average fuel tariffs).

#### 4. Total Trip Fuel Expenditure ($\text{Cost}_{\text{trip}}$)
$$\text{Cost}_{\text{trip}} = D_{\text{OSRM}} \times C_{\text{fuel}} \times \phi_{\text{burn}}$$

#### 5. Pro-Rata Cost Share per Offered Seat ($\text{Fare}_{\text{gross}}$)
The vehicle driver is commuting themselves, so the operational expense is shared equally across the offered seats $S_{\text{offered}}$:
$$\text{Fare}_{\text{gross}} = \max\left(15, \text{round}\left(\frac{\text{Cost}_{\text{trip}}}{S_{\text{offered}}}\right)\right)$$

#### 6. Corporate Green Commute Subsidy ($\text{Subsidy}_{\text{seat}}$)
To encourage coworker carpooling, reduce campus parking congestion, and cut Scope 3 carbon emissions, enterprise employers sponsor a green commute subsidy $C_{\text{subsidy}}$ (typically ₹2.00/km), capped at 40% of the gross fare:
$$\text{Subsidy}_{\text{seat}} = \min\left(\text{round}\left(\text{Fare}_{\text{gross}} \times 0.40\right), \text{round}\left(\frac{D_{\text{OSRM}} \times C_{\text{subsidy}}}{S_{\text{offered}}}\right)\right)$$

#### 7. Net Colleague Out-of-Pocket Fare ($\text{Fare}_{\text{colleague}}$)
The actual amount deducted from the colleague's commute wallet:
$$\text{Fare}_{\text{colleague}} = \max\left(10, \text{Fare}_{\text{gross}} - \text{Subsidy}_{\text{seat}}\right)$$

#### 8. Driver Fuel Reimbursement Settlement
Upon successful OTP-verified trip completion, the driver receives:
$$\text{Reimbursement}_{\text{driver}} = \text{Fare}_{\text{colleague}} + \text{Subsidy}_{\text{seat}} \equiv \text{Fare}_{\text{gross}}$$
$$\text{Driver Net Commercial Profit} = ₹0.00$$

---

### C. Concrete Step-by-Step Numerical Example

Consider a commute from **Electronic City Phase 1** to **Manyata Tech Park** in Bangalore:

| Parameter | Symbol | Value | Source |
| :--- | :--- | :--- | :--- |
| **OSRM Road Distance** | $D_{\text{OSRM}}$ | **14.55 km** | OSRM Driving Polyline Engine |
| **Estimated Road Duration** | $T_{\text{drive}}$ | **20 mins** | OSRM Speed Matrix |
| **Vehicle Model** | — | Maruti Suzuki Swift Dzire Diesel | PostgreSQL `vehicles` table |
| **Certified Fuel Ratio** | $\phi_{\text{burn}}$ | **0.95x** | Certified Vehicle Catalog |
| **Org Fuel Cost Baseline** | $C_{\text{fuel}}$ | **₹5.50 / km** | PostgreSQL `org_settings` table |
| **Org Travel Subsidy Baseline** | $C_{\text{subsidy}}$ | **₹2.00 / km** | PostgreSQL `org_settings` table |
| **Seats Offered** | $S_{\text{offered}}$ | **3 passenger seats** | Driver Ride Publisher |

#### Calculation Execution:
1. **Total Trip Fuel Expenditure**:
   $$\text{Cost}_{\text{trip}} = 14.55 \text{ km} \times 5.50 \text{ ₹/km} \times 0.95 = ₹76.02$$

2. **Gross Legal Cost Share per Seat**:
   $$\text{Fare}_{\text{gross}} = \text{round}\left(\frac{76.02}{3}\right) = \mathbf{₹25.00 \text{ / seat}}$$

3. **Corporate Green Commute Subsidy**:
   $$\text{Subsidy}_{\text{seat}} = \min\left(\text{round}(25 \times 0.40), \text{round}\left(\frac{14.55 \times 2.00}{3}\right)\right) = \min(10, 10) = \mathbf{₹10.00 \text{ / seat}}$$

4. **Net Colleague Out-of-Pocket Fare**:
   $$\text{Fare}_{\text{colleague}} = 25.00 - 10.00 = \mathbf{₹15.00 \text{ / seat}}$$

5. **Driver Payout & Zero Profit Audit**:
   - 3 colleagues pay $3 \times ₹15.00 = ₹45.00$.
   - Enterprise employer pays $3 \times ₹10.00 = ₹30.00$ travel subsidy.
   - Total driver fuel reimbursement = $₹45.00 + ₹30.00 = \mathbf{₹75.00}$.
   - Actual trip fuel expenditure = $\mathbf{₹76.02}$.
   - **Net Driver Profit = -₹1.02 (0% commercial markup — 100% white-plate compliant)**.

---

### D. Server-Side Tamper Proofing
Even if a user attempts to tamper with the HTTP payload by sending a custom `fare_per_seat` to `POST /publish-ride`:
- The backend ignores any client-supplied fare.
- It queries the driver's registered vehicle record from PostgreSQL.
- It recalculates the strict legal algorithmic price using OSRM coordinates.
- It stores strictly `Fare_colleague` and `Subsidy_seat` in the database.

---

## 4. In-App Terms & Conditions Charter (`TermsModal.jsx` & `/terms`)

Accessible via the floating Top Bar, the Profile Hub, the Login/Signup screen, and directly via URL `/terms`, the in-app charter provides a comprehensive, interactive legal agreement across six key pillars:

1. **White-Plate Statutory Compliance**: Cites Section 66 & 192A of the Motor Vehicles Act; explicitly bans commercial taxi-metering or cash fare bargaining.
2. **Algorithmic Fuel Cost Split**: Details the OSRM telemetry, fuel ratio formula, and employer ESG subsidy.
3. **Closed-Loop Commute Wallet (RBI PPI Directives)**: Enforces that wallet balances cannot be withdrawn to personal bank accounts; funds are strictly closed-loop and non-withdrawable.
4. **Corporate Work Email Gating**: Restricts access to verified enterprise employees; zero public access.
5. **Cabin Safety, Boarding OTP & Dual Ratings**: Two-way evaluation system (Passenger Etiquette vs Driver Safety), mandatory 4-digit pickup OTP, and female-only commute isolation.
6. **Cabin Amenities & BlaBlaCar Code**: Chattiness meter, AC, no smoking, music, and max 2 in the back comfort guarantee.

---

## 5. Security & Identity Infrastructure

### A. Global Recursive DOMPurify XSS Sanitizer (`/backend/utils/sanitize.js`)
- Globally mounted Express middleware (`xssSanitizerMiddleware`) scrubs all incoming `req.body`, `req.query`, and `req.params`.
- Recursively strips malicious `<script>`, `<iframe>`, and event handler injections from deeply nested objects and arrays.
- **Password Exemption**: Automatically preserves raw password fields so complex special characters (`<`, `>`, `&`) reach bcrypt hashing without corruption.

### B. Bcrypt Cryptographic Hashing (`/backend/routes/auth.js`)
- **Signup**: Hashes user passwords using `bcrypt.genSalt(10)` before writing to PostgreSQL.
- **Login**: Verifies credentials using `bcrypt.compare`.
- **Change Password (`POST /auth/change-password`)**: In-profile drawer validates current password with `bcrypt.compare`, enforces a 6+ character policy, and hashes the new password with bcrypt.

### C. Dual Ratings & Trust System
- **Passenger Etiquette Rating (⭐ 1.0 - 5.0)**: Reflects punctuality, cabin etiquette, and coworker courtesy.
- **Driver Safety Score (⭐ 1.0 - 5.0)**: Reflects vehicle cleanliness, smooth driving, and route reliability.

### D. Leadership Feedback Pipeline (`/backend/routes/feedback.js`)
- Employee feedback and star ratings are permanently archived in the PostgreSQL `feedbacks` table and automatically dispatched as formatted HTML emails to platform leadership (`master.trainer049@gmail.com`).

---

## 6. Full BlaBlaCar Commute Customizations

1. **The "BlaBla" Chattiness Scale**:
   - `Bla` (Quiet): Prefer a peaceful commute, work focus, or quiet journey.
   - `BlaBla` (Friendly): Open to casual conversations and light workplace chat.
   - `BlaBlaBla` (Chatty): Enjoys lively conversations, storytelling, and networking.
2. **Cabin Comfort Guarantees**:
   - `❄️ AC Guaranteed`, `🚭 Strictly No Smoking`, `🎵 Music Allowed`.
   - `👥 Max 2 in the Back`: Middle rear seat left empty for personal comfort.
   - `⚡ Instant Booking`: Guaranteed 1-tap seat confirmation.
3. **Corridor Stopovers & Waypoints**:
   - En-route tech park corridor drop-offs (Silk Board, Marathahalli, Bellandur, Hebbal, HSR Layout, Cyber City).
4. **Luggage Tiers**:
   - `🎒 Small` (Laptop bag), `🧳 Medium` (Cabin roller), `📦 Large` (Suitcase).

---

## 7. Database Relational Schema

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
  +----------------------+          |       vehicles       |
            |                       +----------------------+
            |                       | veh_id (PK)          |
            |                       | veh_no (UNIQUE)      |
            +---------------------->| emp_id (FK)          |
            |                       | vehicle_model        |
            |                       | seating_capacity     |
            |                       | fuel_consumption_ratio|
            v                       +----------------------+
  +----------------------+                     |
  |       wallets        |                     v
  +----------------------+          +----------------------+
  | wallet_id (PK)       |          |        rides         |
  | emp_id (FK, UNIQUE)  |          +----------------------+
  | balance              |          | ride_id (PK)         |
  +----------------------+          | driver_id (FK)       |
            |                       | veh_no (FK)          |
            v                       | origin (JSONB)       |
  +----------------------+          | destination (JSONB)  |
  | wallet_transactions  |          | departure_time       |
  +----------------------+          | available_seats      |
  | transaction_id (PK)  |          | fare_per_seat        |
  | emp_id (FK)          |          | subsidy_per_seat     |
  | ride_id (FK)         |          | status               |
  | type                 |          | polyline (TEXT)      |
  | amount               |          | preferences (JSONB)  | <-- Chattiness, AC, Smoking, Music, Max2Back
  | description          |          | stopovers (JSONB)    | <-- Corridor stopover waypoints
  +----------------------+          | is_recurring (BOOL)  | <-- Mon-Fri daily office commute
                                    | instant_booking(BOOL)| <-- Instant 1-tap confirmation
                                    +----------------------+
                                               |
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
                                    | luggage_size (TEXT)  |
                                    | passenger_notes(TEXT)|
                                    | selected_stopover    |
                                    +----------------------+
```

---

## 8. Complete API Endpoint Catalog

### Authentication & Identity (`/auth`)
- `POST /auth/signup` — Registers employee with verified corporate domain, generates salt with `bcrypt.genSalt(10)` and hashes password.
- `POST /auth/login` — Authenticates user via `bcrypt.compare` against hashed passwords and issues JWT token.
- `GET /auth/me` — Fetches active profile, corporate badge, vehicle status, commute wallet balance, and dual ratings.
- `POST /auth/change-password` — Validates current password via `bcrypt.compare` and hashes new password with bcrypt.
- `POST /auth/update-profile` — Updates user profile fields safely.
- `POST /auth/logout` — Destroys session token.

### Rides & Legal Commute (`/rides`, `/publish-ride`)
- `POST /rides/fare-estimate` — Queries OSRM road distance, fetches driver's vehicle fuel consumption ratio, and computes white-plate pro-rata fuel split and green subsidy.
- `POST /publish-ride` — Publishes commute with strictly enforced server-side algorithmic pricing, OSRM polyline, preferences, stopovers, and recurring commute flag.
- `GET /rides` — Spatial discovery within 10 km corridor with gender filter, tech park filter, and BlaBlaCar comfort toggles (`ac`, `instant`, `max_two_back`).
- `POST /book-ride` — Locks available seat atomically with row-level locks (`FOR UPDATE`), places fare in escrow, generates 4-digit boarding OTP.
- `GET /rides/driver/active` — Fetches driver's active ride, route, and booked passengers with luggage and pickup notes.
- `GET /rides/passenger/active` — Fetches passenger's booked ride status, driver details, and pickup OTP.
- `POST /pickup-ride` — Driver enters passenger's 4-digit OTP to verify physical onboarding.
- `POST /finish-ride` — Completes trip, executes escrow wallet settlement, and opens two-way star ratings.

### Vehicle Verification (`/register-vehicle`, `/admin`)
- `GET /register-vehicle` — Fetches current driver's registered vehicle specs and approval status.
- `POST /register-vehicle` — Validates RTO license plate regex, DL format, seat capacity, fuel consumption ratio, and submits to admin queue.
- `GET /admin/verifications` — Lists pending driver applications for campus facility managers.
- `POST /admin/verify-rider` — Approves or rejects driver with real-time WebSocket toast alerts.
- `GET /admin/impact-metrics` — Supplies ESG carbon savings and campus parking space analytics.

### Personal Commute Wallet (`/wallet`)
- `GET /wallet` — Returns user's balance and double-entry transaction history.
- `POST /wallet/add` — Adds funds to personal commute wallet (non-withdrawable closed-loop ledger).
- `GET /wallet/transactions` — Returns real-time transaction history from `wallet_transactions`.
- `POST /wallet/transfer` — Executes escrow release and fuel cost-split transfer upon ride completion.

### Feedback & Diagnostics (`/feedback`, `/api`)
- `POST /feedback/send_feedback` — Saves star rating (1-5) and description in PostgreSQL and dispatches an HTML email to leadership (`master.trainer049@gmail.com`).
- `GET /api/errors/catalog` — Returns machine-readable dictionary of all custom error codes with HTTP statuses and resolution hints.
- `GET /api/health` — Returns real-time platform health, PostgreSQL connection status, query latency (ms), and server uptime.

---

## 9. Chronological Git Commit Highlights

- `[Current]` — **feat(signup-location):** Add mobile-first India-exclusive commute location input during signup with 1-tap GPS auto-detect, reverse geocoding via Nominatim scoped to `countrycodes=in`, popular Indian tech hub quick-pills, and backend `users.address` storage.
- `11e9ad4` — **feat(deploy-ready):** Render deployment orchestration via root `package.json` with unified build/start scripts; 1-tap demo credentials on login screen (`ananya.s@tcs.com`, `rohan.k@infosys.com`, `admin@norimono.com`); fallback devOtp verification when SMTP is offline; and complete SPA routing exclusions.
- `3d8922d` — **feat(terms-docs):** Add comprehensive in-app Terms & Conditions modal (`TermsModal.jsx`) and `/terms` route; rewrite master technical documentation with full statutory framework (MVA Sec 66/192A), mathematical algorithmic pricing formula, and worked numerical demonstration.
- `c8f9931` — **feat(legal-pricing):** Strictly enforce white-plate non-commercial pricing based on OSRM driving distance, certified fuel consumption ratio, and seat count; lock driver fare input, return compliance breakdown, and display transparent fuel-split telemetry card.
- `ee8992b` — **feat(security-profile):** Implement global recursive DOMPurify XSS sanitization middleware across all routes, bcrypt password hashing & change-password endpoint, Corporate Profile & Trust Hub with Dual Ratings (Passenger Etiquette & Driver Safety), and embedded Personal Commute Wallet with dynamic QR code.
- `b63ca27` — **feat(wallet-feedback):** Enforce feedback email dispatch to leadership via Nodemailer (`master.trainer049@gmail.com`), integrate personal Closed-Loop Commute Wallet with dynamic personal QR Code, non-withdrawable policy banner, and direct wallet top-up.
- `1b5efdd` — **feat(security):** Remove all demo fallbacks, enforce strict field-level typing and validation (10-digit phone, RTO vehicle plate regex, alphabetical name restrictions), and add custom error endpoints (`/api/errors/catalog`, `/api/health`).
- `28e86d4` — **feat(ui):** Minimalist search results view: stripped bulky covers, search inputs, and disclaimers from `BrowseRidesPanel.jsx`; added ultra-compact header with `Edit Route`, `Female-Only` toggle, and small results count pill so colleague rides are immediately visible and scrollable.
- `ee64b24` — **fix(auth):** Streamline login flow, auto-align corporate organization, and support global top-level domains (`.in`, `.org`, `.co.in`).
- `6a94ec6` — **feat(blablacar):** Full BlaBlaCar replica features: Chattiness Meter (Bla/BlaBla/BlaBlaBla), Ride Amenities (AC, No Smoking, Music, Max 2 in back comfort guarantee), En-Route Corridor Stopovers, Luggage capacity tiers, Instant Booking, and Recurring Commutes.
- `addeabf` — **feat(ui):** Convert verification alerts to auto-fading glass toasts; add dynamic "Show Registered Vehicles" modal to Profile and Navigation with real-time status tracking.
- `622220e` — **fix(backend):** Fix Node 24 / Express 5 `path-to-regexp` crash by replacing unparameterized wildcard route with pathless SPA middleware.
- `c65e4d5` — **feat(driver):** Implement dedicated Driver Cockpit UI, individual passenger entity isolation, real-time Socket.io seat count synchronization, and PostgreSQL row-level transaction locks (`FOR UPDATE`) preventing double-booking and double-settlement race conditions.
- `390ea59` — **feat(ui):** Complete Uber-style mobile-first redesign with fullscreen map canvas and dedicated smart ride publisher.

---

*Authored by Google DeepMind Advanced Agentic Coding for the Norimono Engineering Team.*
