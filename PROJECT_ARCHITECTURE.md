# Car Rental App - Project Architecture & Documentation

## 1. System Overview
This application is a real-time, context-driven React frontend for a Car Rental service. It features multi-role dashboards (Admin, Owner, Renter), real-time data synchronization via WebSockets, and a comprehensive Vehicle Damage Reporting System.

---

## 2. State Management (Context API)
The application relies heavily on React Context for global state management and real-time data hydration.

### `VehicleContext`
- **Location:** `src/context/VehicleContext.jsx`
- **Purpose:** Manages the global state for vehicles, saved cars (favorites), and rental/booking history.
- **Key Features:**
  - **API Integration:** Fetches vehicles and bookings from `/api/cars/` and `/api/bookings/`.
  - **Real-Time Updates:** Listens to WebSocket events (`vehicle_created`, `vehicle_updated`, `booking_created`, etc.) to instantly update the UI without page refreshes.
  - **Local Fallback:** Uses `localStorage` for "Saved Cars" functionality (`SAVED_CARS_KEY`).
  - **Booking Management:** Handles approving, rejecting, and returning vehicle bookings.

### `LogReportContext`
- **Location:** `src/context/LogReportContext.jsx`
- **Purpose:** Manages check-in, check-out, and general log reports for rentals.
- **Key Features:**
  - **Multi-Path Routing:** Attempts to fetch from `/api/logreports/` or `/api/reports/`.
  - **Real-Time Sync:** Listens to `logreport_created`, `logreport_updated`, and `logreport_deleted`.
  - **Offline/Fallback Support:** If the API returns a 404, it gracefully falls back to local storage utilities using `useLogReport` hooks.

---

## 3. Real-Time Synchronization
The app uses Django Channels/WebSockets on the backend and a custom `RealtimeManager` on the frontend.

- **Configuration:** Driven by `.env` variables `VITE_API_URL` and `VITE_WS_URL`.
- **Connection:** Authenticates via token in the WebSocket URL (`ws://.../ws/sync/?token=...`).
- **Supported Events:**
  - `vehicle_*` (created, updated, deleted)
  - `user_*` & `profile_*` (created, updated, deleted)
  - `logreport_*` (created, updated, deleted)
  - `booking_*` (created, updated, deleted)
  - `damage_*` (reported, acknowledged, resolved)
- **Auto-reconnection:** Implements exponential backoff to recover dropped connections automatically.

---

## 4. Vehicle Damage Reporting System
A robust system allowing renters to report damage and owners to review it.

### Renter Workflow
1. Renter opens the `DamageReportForm` modal from their bookings page.
2. Renter inputs severity, description, location, and uploads up to 10 photos (max 5MB each).
3. Submitting fires a REST POST request and triggers a `damage_reported` WebSocket event.

### Owner Workflow
1. Owner receives a real-time WebSocket notification (and optional email/push).
2. Owner reviews the report in the `DamageReportInbox`.
3. Owner can mark the report as "Acknowledged" or "Resolved", which instantly syncs back to the renter.

### Components
- **`DamageReportForm`**: Modal UI for creating reports.
- **`DamageReportInbox`**: Dashboard view for owners to manage reports.
- **Context:** `DamageReportContext` handles the global state and WebSocket subscriptions for these specific entities.

---

## 5. Styling Architecture
The application uses standard CSS with a modular, page-based approach located in `src/styles/pages/`.

### Design System Variables
Most CSS files implement a shared design token system using CSS root variables:
- **Primary Colors:** `--primary: #3F9B84;` (Teal), `--navy: #1a2c5e;`
- **Grays:** `--g50` to `--g900`
- **Semantic Colors:** `--danger`, `--warning`, `--success`, `--indigo`
- **Layout:** `--radius: 12px;`, `--shadow: ...`

### Page Styles Overview
- **Dashboards:** `AdminDashboard.css`, `Dashboard.css` (Owner), `RenterDashboard.css`. (Note: These share highly similar sidebar and layout structures).
- **Authentication:** `Auth.css`, `Login.css`, `Register.css`, `ForgotPassword.css`, `ChangePassword.css`.
- **Features:** `LogReport.css`, `Bookings.css`, `EmailLog.css`.
- **Landing:** `LandingPage.css`, `SplashPage.css`.

---

## 6. Application Flow & User Journeys

The application enforces strict role-based flows to provide tailored experiences depending on the user type.

### 6.1 Authentication & Routing Flow
1. **Entry:** The user visits the app and navigates to the Login or Register page.
2. **Authentication:** `AuthContext` authenticates the credentials against the backend API and stores the secure session/token.
3. **Role-Based Redirection:** Upon successful login, the app evaluates the user's role (`renter`, `owner`, or `admin`) and automatically routes them to the appropriate dashboard layout (`/renter-dashboard`, `/dashboard`, or `/admin-dashboard`).

### 6.2 The Renter Journey
1. **Browsing:** Renters view a catalog of available vehicles populated by the `VehicleContext`.
2. **Booking:** The renter selects a vehicle and requests a booking for specific dates.
3. **Active Rental:** Once the owner approves the booking, the renter gains access to rental features (e.g., check-in logs).
4. **Incident Reporting:** If an issue occurs, the renter uses the Bookings interface to open the `DamageReportForm`, attaching photos and descriptions of the incident.
5. **Return:** The renter initiates a return request, effectively ending their responsibility once the owner acknowledges it.

### 6.3 The Vehicle Owner Journey
1. **Fleet Management:** Owners add, update, or remove their vehicles through their dashboard. New vehicles are immediately synced to the public pool.
2. **Booking Approvals:** Owners receive real-time alerts for booking requests, which they can either **Approve** or **Reject**.
3. **Incident Review:** When a renter submits a damage report, a WebSocket event alerts the owner instantly. They open the `DamageReportInbox` to review the severity and evidence.
4. **Resolution:** The owner acknowledges the report and eventually marks it as "Resolved" (e.g., after repairs are quoted/completed).

### 6.4 Real-Time Data Flow Lifecycle
The system heavily utilizes a reactive data pattern rather than standard polling:
1. **Action Triggered:** A user performs an action (e.g., submits a form).
2. **REST API Call:** The frontend sends a standard POST/PATCH request to the backend.
3. **Backend Processing:** The server validates the data, saves it to the database, and immediately fires a WebSocket Broadcast (e.g., `booking_updated`).
4. **Frontend Reception:** The `RealtimeManager` picks up the WebSocket message and dispatches an event.
5. **Context Hydration:** The relevant React Context (`VehicleContext`, `LogReportContext`, or `DamageReportContext`) intercepts the event and updates its internal state array.
6. **UI Re-render:** The connected React components instantly re-render with the fresh data, requiring zero page refreshes from the user.

---

## 7. Development & Deployment (How to Run)

### 7.1 Prerequisites
- **Node.js** (v18+ recommended)
- **Python 3.8+** (for the Django backend)
- **Redis** (typically required for Django Channels/WebSockets)

### 7.2 Environment Setup
Create a `.env` file in the root of the React frontend project:
```env
VITE_API_URL=http://127.0.0.1:8000/api
VITE_WS_URL=ws://127.0.0.1:8000/ws
# Optional: For proxying requests in Vite
VITE_PROXY_TARGET=http://127.0.0.1:8000
```

### 7.3 Running the Frontend (React)
Open your terminal in the frontend directory and run:
```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev
```
The application will be available at `http://localhost:3000` or the port specified by Vite in your terminal.

### 7.4 Running the Backend (Django)
In a separate terminal, navigate to your Django backend directory:
```bash
# 1. Activate your virtual environment
# source venv/bin/activate     (Linux/Mac)
# .\venv\Scripts\activate      (Windows)

# 2. Install requirements
pip install -r requirements.txt

# 3. Run database migrations
python manage.py migrate

# 4. Start the ASGI/Development server (Required for WebSockets)
python manage.py runserver
```

### 7.5 Production Deployment Requirements
- **Frontend:** Built using `npm run build` and served via Nginx, Vercel, or Netlify. Ensure `.env.production` is configured with secure `wss://` and `https://` URLs.
- **Backend:** Must be deployed using an ASGI server (like Daphne or Uvicorn) to support WebSocket (`/ws/sync/`) connections, typically behind a reverse proxy like Nginx.
- **Assets:** Placeholders are currently stored in the `/assets/` directory (e.g., `icon.png`, `splash-icon.png`).

---
*Document generated automatically based on current repository state.*