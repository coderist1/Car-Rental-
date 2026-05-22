# Vehicle Damage Reporting System - Implementation Guide

## Overview

This guide provides step-by-step instructions for integrating the vehicle damage reporting system into your Car Rental application. All the necessary components, contexts, hooks, and styles have been created and are ready to be integrated.

---

## Files Created

### Core Functionality
- **`src/context/DamageReportContext.jsx`** - Context provider for damage reports
- **`src/hooks/useDamageReports.js`** - Local storage utilities for damage reports
- **`src/hooks/useDamageReportForm.js`** - Form state management hooks

### UI Components
- **`src/components/DamageReportForm.jsx`** - Modal form for renter damage submission
- **`src/components/DamageReportInbox.jsx`** - Inbox for owners to review reports

### Styling
- **`src/styles/components/DamageReportForm.css`** - Form styling
- **`src/styles/components/DamageReportInbox.css`** - Inbox styling

### Documentation
- **`DAMAGE_REPORT_SPEC.md`** - Full functional specification
- **`IMPLEMENTATION_GUIDE.md`** - This file

---

## Integration Steps

### Step 1: Update Main App Context Provider

Update your `App.jsx` or root component to include the `DamageReportProvider`:

```jsx
import { DamageReportProvider } from './context/DamageReportContext';

function App() {
  return (
    <AuthProvider>
      <VehicleProvider>
        <LogReportProvider>
          <DamageReportProvider>  {/* Add this */}
            <Routes>
              {/* Your routes */}
            </Routes>
          </DamageReportProvider>
        </LogReportProvider>
      </VehicleProvider>
    </AuthProvider>
  );
}
```

**Important**: The `DamageReportProvider` must wrap the components that use it and should be placed after other context providers.

### Step 2: Import Components in Pages

#### For Renter Interface (Bookings page)

Update `src/pages/Bookings.jsx` to add damage report functionality:

```jsx
import { useState } from 'react';
import { DamageReportForm } from '../components';
import { useVehicles } from '../hooks';

function Bookings() {
  const { rentalHistory } = useVehicles();
  const [showDamageReportModal, setShowDamageReportModal] = useState(false);
  const [selectedBookingForReport, setSelectedBookingForReport] = useState(null);

  const handleReportDamage = (booking) => {
    setSelectedBookingForReport(booking);
    setShowDamageReportModal(true);
  };

  const handleReportSubmitSuccess = (report) => {
    setShowDamageReportModal(false);
    // Show success message
    alert(`Damage report ${report.id} submitted successfully!`);
  };

  return (
    <div className="bookings-container">
      {/* Existing bookings list */}
      
      {/* Add this button to each booking card */}
      <button 
        onClick={() => handleReportDamage(booking)}
        className="report-damage-button"
      >
        📸 Report Damage
      </button>

      {/* Modal */}
      {showDamageReportModal && (
        <DamageReportForm
          booking={selectedBookingForReport}
          onSubmitSuccess={handleReportSubmitSuccess}
          onClose={() => setShowDamageReportModal(false)}
        />
      )}
    </div>
  );
}
```

#### For Owner Interface (Dashboard page)

Add the damage report inbox to your owner/vehicle owner dashboard:

```jsx
import { DamageReportInbox } from '../components';

function OwnerDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="owner-dashboard">
      <nav className="tabs">
        <button onClick={() => setActiveTab('overview')}>Overview</button>
        <button onClick={() => setActiveTab('vehicles')}>My Vehicles</button>
        <button onClick={() => setActiveTab('damage-reports')}>Damage Reports</button>
      </nav>

      {activeTab === 'damage-reports' && <DamageReportInbox />}
    </div>
  );
}
```

### Step 3: Update API Endpoints

Add these endpoints to your backend (Django):

```python
# urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Damage Report endpoints
    path('api/damage-reports/', views.DamageReportListCreate.as_view(), name='damage-report-list'),
    path('api/damage-reports/<int:pk>/', views.DamageReportDetail.as_view(), name='damage-report-detail'),
    path('api/damage-reports/<int:pk>/acknowledge/', views.AcknowledgeDamageReport.as_view(), name='acknowledge-report'),
    path('api/damage-reports/<int:pk>/resolve/', views.ResolveDamageReport.as_view(), name='resolve-report'),
    path('api/damage-reports/<int:pk>/photos/', views.DamagePhotoCreate.as_view(), name='photo-upload'),
]
```

### Step 4: WebSocket Event Broadcasting

Update your Django websocket consumer to broadcast damage report events:

```python
# consumers.py
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
import json

class SyncConsumer(AsyncWebsocketConsumer):
    async def receive(self, text_data):
        # Handle damage report creation
        if event_type == 'damage_reported':
            await self.broadcast_to_group('damage_reports', {
                'type': 'damage_reported',
                'action': 'create',
                'id': damage_report.id,
                'payload': serialize_damage_report(damage_report)
            })

    async def damage_reported(self, event):
        """Handler for damage_reported events"""
        await self.send(text_data=json.dumps(event))

    async def damage_acknowledged(self, event):
        """Handler for damage_acknowledged events"""
        await self.send(text_data=json.dumps(event))

    async def damage_resolved(self, event):
        """Handler for damage_resolved events"""
        await self.send(text_data=json.dumps(event))
```

### Step 5: Configure Environment Variables

Ensure your `.env` file has the correct API configuration:

```env
VITE_API_URL=http://127.0.0.1:8000/api
VITE_WS_URL=ws://127.0.0.1:8000/ws
```

---

## Usage Examples

### Example 1: Renter Submitting a Damage Report

```jsx
// In Bookings.jsx
const handleReportDamage = (booking) => {
  setSelectedBookingForReport(booking);
  setShowDamageReportModal(true);
};

// DamageReportForm is opened
// User fills in:
// - Damage title: "Scratch on hood"
// - Severity: "Minor"
// - Location: "Front hood"
// - Description: "Visible scratch, approximately 2 inches"
// - Photos: 3 images uploaded
// - Clicks "Submit Report"

// On success:
// - Report is saved to backend
// - WebSocket broadcasts 'damage_reported' event
// - Owner receives real-time notification
// - Renter sees success message
```

### Example 2: Owner Reviewing and Acknowledging

```jsx
// In OwnerDashboard.jsx
// Owner navigates to "Damage Reports" tab
// DamageReportInbox displays:
// - New reports badge
// - List of all reports by status

// Owner clicks on a report to view details
// Owner reviews:
// - Damage photos
// - Renter's description
// - Estimated repair cost

// Owner clicks "Acknowledge Report"
// - Status changes to "acknowledged"
// - Renter is notified
// - Report moves to "Acknowledged" tab
```

### Example 3: Using the useDamageReportForm Hook

```jsx
function MyCustomDamageForm() {
  const {
    formData,
    photos,
    error,
    validation,
    updateField,
    addPhoto,
    removePhoto,
    submitReport
  } = useDamageReportForm();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await submitReport();
    if (result) {
      console.log('Report submitted:', result);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.title}
        onChange={(e) => updateField('title', e.target.value)}
      />
      {/* More form fields */}
      <button type="submit" disabled={!validation.isValid}>
        Submit
      </button>
    </form>
  );
}
```

---

## Data Flow Diagram

```
RENTER SUBMITTING REPORT:
┌─────────────────┐
│  Renter fills   │
│ damage form and │
│ uploads photos  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│ DamageReportForm validates  │
│ and submits via API         │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Backend creates            │
│  DamageReport record        │
│  and stores photos          │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  WebSocket broadcasts       │
│  'damage_reported' event    │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  DamageReportContext in     │
│  Owner's app updates state  │
│  (real-time sync)           │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  DamageReportInbox displays │
│  the new report with badge  │
└─────────────────────────────┘
```

---

## Customization Guide

### Changing Severity Levels

Edit `src/components/DamageReportForm.jsx`:

```jsx
const severityOptions = [
  { value: 'minor', label: 'Minor', icon: '⚪' },
  { value: 'moderate', label: 'Moderate', icon: '🟡' },
  { value: 'severe', label: 'Severe', icon: '🔴' },
  // Add custom level:
  { value: 'critical', label: 'Critical', icon: '💥' },
];
```

### Changing Report Status Values

Update in `src/context/DamageReportContext.jsx` and adjust the backend model accordingly:

```javascript
// Current status values:
status: 'draft' | 'submitted' | 'under_review' | 'acknowledged' | 'resolved'

// You can customize these in the context and API
```

### Customizing Form Validation

Edit `src/hooks/useDamageReportForm.js`:

```jsx
const validation = useMemo(() => {
  const errors = {};

  // Add custom validation rules
  if (formData.description.length < 20) {  // Changed from 10
    errors.description = 'Description must be at least 20 characters';
  }

  // Add minimum photos requirement
  if (photos.length < 2) {
    errors.photos = 'Please upload at least 2 photos';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}, [formData, photos.length]);
```

### Customizing Styling

All styles are in separate CSS files for easy modification:

- **Form styling**: `src/styles/components/DamageReportForm.css`
- **Inbox styling**: `src/styles/components/DamageReportInbox.css`

Example: Change primary button color

```css
.button.primary {
  background: #your-color; /* Change from #3b82f6 */
  color: white;
}
```

---

## Testing Checklist

- [ ] Damage report form opens correctly from Bookings page
- [ ] Form validates required fields
- [ ] Photos can be uploaded and removed
- [ ] Report can be submitted successfully
- [ ] Renter sees success message
- [ ] Owner receives real-time notification
- [ ] Inbox displays new report
- [ ] Owner can view full report details
- [ ] Owner can acknowledge report
- [ ] Owner can mark report as resolved
- [ ] Status filters work correctly
- [ ] Reports persist after page refresh (via context)

---

## Troubleshooting

### Reports Not Showing in Owner Inbox

**Problem**: Owner dashboard shows no damage reports

**Solutions**:
1. Verify `DamageReportProvider` is wrapping the component
2. Check that owner's `id` matches the report's `ownerId`
3. Ensure WebSocket connection is established (check browser console)
4. Verify API endpoint is returning data: `GET /api/damage-reports/`

### Photos Not Uploading

**Problem**: Photos fail to upload or form stays in loading state

**Solutions**:
1. Check file size (max 5MB per photo)
2. Verify image format is JPG, PNG, or WebP
3. Check API endpoint: `POST /api/damage-reports/{id}/photos/`
4. Check browser console for errors
5. Verify FormData is being sent correctly (multipart/form-data)

### WebSocket Connection Fails

**Problem**: `Firefox can't establish a connection to the server at ws://127.0.0.1:8000/ws/sync/`

**Solutions**:
1. Verify backend WebSocket server is running
2. Check `VITE_WS_URL` in `.env` file
3. Ensure backend cors/websocket settings allow connections
4. Check browser console for detailed error message

### Context Not Updating

**Problem**: New reports not appearing immediately

**Solutions**:
1. Ensure `realtimeManager.connect()` is called
2. Verify WebSocket message format matches spec
3. Check that event type is `'damage_reported'`
4. Verify `useContext(DamageReportContext)` is used correctly

---

## Performance Optimization

### Lazy Load Images

```jsx
// In DamageReportInbox.jsx
<img 
  src={photo.url} 
  alt={photo.caption}
  loading="lazy"  // Add this
/>
```

### Pagination for Large Report Lists

```jsx
// Add to DamageReportInbox
const REPORTS_PER_PAGE = 10;
const [page, setPage] = useState(1);

const paginatedReports = filteredReports.slice(
  (page - 1) * REPORTS_PER_PAGE,
  page * REPORTS_PER_PAGE
);
```

### Memoize Components

```jsx
import { memo } from 'react';

export const DamageReportCard = memo(({ report, onClick }) => {
  // Component body
});
```

---

## Security Considerations

1. **File Upload Validation**
   - Server-side validation of file type and size
   - Scan uploaded images for malware
   - Store in secure S3 bucket, not in webroot

2. **Data Access Control**
   - Verify renter can only access their own reports
   - Verify owner can only access their own vehicle reports
   - Implement proper permission checks in backend

3. **Input Sanitization**
   - Escape HTML in user descriptions
   - Validate all form inputs server-side
   - Limit report description length to prevent DoS

4. **Photo URLs**
   - Use signed/temporary URLs from S3
   - Set expiration on URLs (1-2 hours)
   - Implement rate limiting on photo downloads

---

## Deployment Notes

### Build Process

```bash
npm run build  # Standard build, includes damage report components
```

### Environment Variables

Create `.env.production`:

```env
VITE_API_URL=https://api.yourdomain.com/api
VITE_WS_URL=wss://api.yourdomain.com/ws
```

### Backend Deployment

Ensure these are set up on your backend server:

1. Django models migrated (`python manage.py migrate`)
2. WebSocket/Channels properly configured
3. Static files for photo uploads configured (S3 or similar)
4. CORS settings allow your frontend domain
5. Email notifications configured (for damage alerts)

---

## Future Enhancements

Potential features to add:

1. **Damage Estimation AI**
   - Auto-generate repair cost estimates from photos
   - Use ML to detect damage severity

2. **Insurance Integration**
   - Auto-submit claims to insurance
   - Track claim status

3. **Video Reports**
   - Allow video evidence in addition to photos
   - 360-degree vehicle inspection videos

4. **Comments & Discussion**
   - Owner and renter communication on report
   - Resolution notes and follow-ups

5. **Analytics Dashboard**
   - Damage statistics by vehicle/owner
   - Common damage types
   - Trending repair costs

6. **Mobile App Integration**
   - Native mobile app for damage reporting
   - Offline support (sync when online)
   - GPS location tagging

---

**Last Updated**: May 22, 2026  
**Version**: 1.0  
**Status**: Ready for Integration
