# Contexts & Hooks

This document summarizes the primary React Context providers and key custom hooks.

Auth Context
- File: `src/context/AuthContext.jsx`
- Provides:
  - `user`, `isAuthenticated`, `loading`
  - Methods: `login`, `register`, `registerAdmin`, `logout`, `updateProfile`, `changePassword`, `getRegisteredUsers`, `updateUser`, `deleteUser`
  - Stores session in `sessionStorage` under key `userProfile`.
  - Subscribes to realtime `user_*` and `profile_updated` events via `realtimeManager`.

Vehicle Context
- File: `src/context/VehicleContext.jsx`
- Provides global vehicle data and booking management.
- Responsibilities:
  - Load vehicles from `/api/cars/` and normalize payloads
  - Manage `vehicles`, `savedCars` (localStorage), and `rentalHistory`
  - Actions: `addVehicle`, `updateVehicle`, `deleteVehicle`, `toggleSavedCar`, `addRentalRecord`, `approveBooking`, `rejectBooking`, `requestReturn`, `acceptReturn`
  - Subscribes to realtime events: `vehicle_*` and `booking_*`.

Damage Report Context
- File: `src/context/DamageReportContext.jsx`
- Provides damage report state and actions used by `DamageReportForm` and `DamageReportInbox`.
- Responsibilities:
  - Load reports from `/api/damage-reports/` (with fallback path `/api/damage_reports/`)
  - CRUD operations: `createDamageReport`, `updateDamageReport`, `deleteDamageReport`
  - Photo uploads: `uploadPhotoToReport`
  - Owner actions: `acknowledgeReport`, `resolveReport`
  - Query helpers: `getVehicleReports`, `getBookingReports`, `getUnreviewedReports`, `getReportsByStatus`, `getReportsBySeverity`
  - Persists a local fallback copy to `localStorage` (`car_rental_damage_reports_v2`) when API calls fail.
  - Subscribes to realtime events: `damage_reported`, `damage_updated`, `damage_deleted`.

Other hooks
- `useAuth` — convenience hook that consumes `AuthContext`.
- `useVehicles` — convenience hook that consumes `VehicleContext`.
- `useDamageReports` / `useDamageReport` — consumes `DamageReportContext`.
- `useDamageReportForm` — encapsulates the form state and photo handling for `DamageReportForm` (see `src/hooks/useDamageReportForm.js`).

Guidance
- Prefer using the provided hooks (`useAuth`, `useVehicles`, `useDamageReports`) in components to keep components declarative.
- Keep side-effects (API calls, realtime subscriptions) inside contexts and hooks to centralize logic and improve testability.
