# Components Reference

This file lists the primary reusable components in `src/components/` and their public props or usage notes.

- `Modal` ([src/components/ui/Modal.jsx])
  - Generic modal wrapper used across the app. Exported as default.

- `ConfirmModal` ([src/components/ui/ConfirmModal.jsx])
  - Simple yes/no confirmation modal.

- `ProfileMenu` ([src/components/navigation/ProfileMenu.jsx])
  - Small dropdown menu for user profile actions.

- `VehicleCard` ([src/components/vehicle/VehicleCard.jsx])
  - Displays vehicle details and action buttons (save, book, view).

- `DamageReportForm` ([src/components/DamageReportForm.jsx])
  - Props:
    - `booking` (object | optional): pre-fills rental info (ids, names, dates)
    - `onSubmitSuccess` (function | optional): called with created report on success
    - `onClose` (function | optional): called when the modal is closed
  - Behavior: Handles photo uploads (max 10), validation, and submits via `useDamageReportForm` hook.

- `DamageReportInbox` ([src/components/DamageReportInbox.jsx])
  - Props:
    - `embedded` (boolean | optional): render small/embedded variant (default `false`)
  - Behavior: Lists owner reports, filters by status, and provides acknowledge/resolve actions.

- `AcceptBookingModal`, `ReturnVehicleModal`
  - Modals around booking acceptance and return workflows.

Notes
- For usage examples, see `src/pages/Bookings.jsx`, `src/pages/Dashboard.jsx`, and `src/pages/RenterDashboard.jsx`.
- Component styles live in `src/styles/components/` and page-specific CSS in `src/styles/pages/`.
