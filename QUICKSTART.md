# Vehicle Damage Reporting System - Quick Start

## 1-Minute Setup

### Step 1: Wrap Provider in App.jsx

```jsx
import { DamageReportProvider } from './context/DamageReportContext';

function App() {
  return (
    <AuthProvider>
      <VehicleProvider>
        <DamageReportProvider>  {/* ← Add this */}
          <Routes>
            {/* Your routes */}
          </Routes>
        </DamageReportProvider>
      </VehicleProvider>
    </AuthProvider>
  );
}
```

### Step 2: Add to Bookings Page (for renters)

```jsx
import { useState } from 'react';
import { DamageReportForm } from '../components';

// Inside your booking card or action buttons:
const [showReportForm, setShowReportForm] = useState(false);
const [selectedBooking, setSelectedBooking] = useState(null);

// Add button to booking:
<button onClick={() => {
  setSelectedBooking(booking);
  setShowReportForm(true);
}}>
  📸 Report Damage
</button>

// Add modal:
{showReportForm && (
  <DamageReportForm
    booking={selectedBooking}
    onSubmitSuccess={() => setShowReportForm(false)}
    onClose={() => setShowReportForm(false)}
  />
)}
```

### Step 3: Add to Owner Dashboard (for owners)

```jsx
import { DamageReportInbox } from '../components';

// In your dashboard:
<DamageReportInbox />
```

---

## What You Get

✅ **For Renters**
- Form to report damage
- Photo upload (up to 10 photos)
- Severity levels (Minor, Moderate, Severe)
- Auto-save draft functionality

✅ **For Owners**
- Real-time notifications of damage reports
- Inbox with filtering by status
- View full report details with photos
- Acknowledge or resolve reports

✅ **Backend Ready**
- WebSocket real-time syncing
- State management via Context API
- Local fallback (localStorage)
- Fully typed data structures

---

## File Structure

```
src/
├── context/
│   └── DamageReportContext.jsx       ← Core context provider
├── hooks/
│   ├── useDamageReports.js           ← Local storage utils
│   └── useDamageReportForm.js        ← Form hooks
├── components/
│   ├── DamageReportForm.jsx          ← Renter form modal
│   └── DamageReportInbox.jsx         ← Owner inbox
└── styles/components/
    ├── DamageReportForm.css
    └── DamageReportInbox.css
```

---

## API Endpoints Needed

Your backend should expose:

```
POST   /api/damage-reports/           - Create report
GET    /api/damage-reports/           - List reports
GET    /api/damage-reports/{id}/      - Get report details
PATCH  /api/damage-reports/{id}/      - Update report (draft)
DELETE /api/damage-reports/{id}/      - Delete report
POST   /api/damage-reports/{id}/acknowledge/  - Acknowledge
POST   /api/damage-reports/{id}/resolve/      - Resolve
POST   /api/damage-reports/{id}/photos/       - Upload photo
```

---

## WebSocket Events

Backend should broadcast:

```javascript
{
  "type": "damage_reported",
  "action": "create",
  "id": "report_id",
  "payload": { /* full report object */ }
}
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Reports not showing | Wrap component with `DamageReportProvider` |
| Photos won't upload | Check file size (max 5MB), format (JPG/PNG/WebP) |
| WebSocket fails | Ensure backend is running on `ws://localhost:8000/ws` |
| Real-time not working | Check browser console, verify WebSocket connection |
| Form not validating | Ensure all required fields are filled |

---

## Data Model

### DamageReport
```javascript
{
  id: number,
  bookingId: number,
  vehicleId: number,
  renterId: number,
  ownerId: number,
  type: 'pre_rental' | 'during_rental' | 'post_rental',
  status: 'draft' | 'submitted' | 'under_review' | 'acknowledged' | 'resolved',
  severity: 'minor' | 'moderate' | 'severe',
  title: string,
  description: string,
  location: string,
  estimatedRepairCost?: number,
  photos: DamagePhoto[],
  discoveredDate: string (ISO 8601),
  reportedDate: string (ISO 8601),
  acknowledgedDate?: string,
  resolvedDate?: string,
  vehicleName: string,
  renterName: string,
  ownerName: string,
}
```

---

## Next Steps

1. ✅ Files are ready to use
2. ⬜ Wrap `DamageReportProvider` in App
3. ⬜ Add form to Bookings page
4. ⬜ Add inbox to Owner Dashboard
5. ⬜ Create backend API endpoints
6. ⬜ Test form submission
7. ⬜ Test real-time notifications
8. ⬜ Customize styling as needed

---

## Support

### Documentation
- **Full Spec**: See `DAMAGE_REPORT_SPEC.md`
- **Implementation Details**: See `IMPLEMENTATION_GUIDE.md`

### Code Examples
See inline JSDoc comments in:
- `src/context/DamageReportContext.jsx`
- `src/hooks/useDamageReportForm.js`
- `src/components/DamageReportForm.jsx`

### Troubleshooting
Check the Troubleshooting section in `IMPLEMENTATION_GUIDE.md`

---

**Ready to implement?** Start with Step 1 above!
