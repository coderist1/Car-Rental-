# System Architecture & Workflows

## 📊 Component Architecture Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                        APPLICATION LAYER                       │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────┐         ┌──────────────────┐                │
│  │  Bookings    │         │  Owner Dashboard │                │
│  │  Page        │         │  / Dashboard     │                │
│  │              │         │                  │                │
│  │ [Report      │         │ [Tab: Damage     │                │
│  │  Damage Btn] │         │  Reports]        │                │
│  └──────┬───────┘         └────────┬─────────┘                │
│         │                          │                          │
│         └──────────────┬───────────┘                          │
│                        │                                      │
│         ┌──────────────▼───────────────┐                     │
│         │  DamageReportForm            │                     │
│         │  DamageReportInbox           │                     │
│         │  (UI Components)             │                     │
│         └──────────────┬───────────────┘                     │
│                        │                                      │
└────────────────────────┼──────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────────┐
│                    CONTEXT/STATE LAYER                         │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │         DamageReportProvider / Context                   │ │
│  │  ┌────────────────────────────────────────────────────┐  │ │
│  │  │ State:                                             │  │ │
│  │  │  - reports: DamageReport[]                         │  │ │
│  │  │  - loading: boolean                                │  │ │
│  │  │  - error: string | null                            │  │ │
│  │  │                                                    │  │ │
│  │  │ Methods:                                           │  │ │
│  │  │  - createDamageReport()                            │  │ │
│  │  │  - updateDamageReport()                            │  │ │
│  │  │  - deleteDamageReport()                            │  │ │
│  │  │  - uploadPhotoToReport()                           │  │ │
│  │  │  - acknowledgeReport()                             │  │ │
│  │  │  - resolveReport()                                 │  │ │
│  │  │  - getVehicleReports()                             │  │ │
│  │  │  - getUnreviewedReports()                          │  │ │
│  │  └────────────────────────────────────────────────────┘  │ │
│  └──────────────┬──────────────┬──────────────────────────────┘ │
│                 │              │                               │
│     ┌───────────▼──┐   ┌───────▼────────────────────┐         │
│     │ WebSocket    │   │ useLogReport Hook         │         │
│     │ Listeners    │   │ useDamageReportForm Hook  │         │
│     │              │   │ useDamageReports Hook     │         │
│     └───────┬──────┘   └───────────────────────────┘         │
└─────────────┼────────────────────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────────────────────────┐
│                        API/NETWORK LAYER                       │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────┐              ┌──────────────────────┐  │
│  │  REST API        │              │  WebSocket Manager   │  │
│  │  (apiRequest)    │              │  (realtimeManager)   │  │
│  │                  │              │                      │  │
│  │ POST /damage-    │              │ ws://localhost:8000/ │  │
│  │      reports/    │              │ ws/sync/             │  │
│  │ GET  /damage-    │              │                      │  │
│  │      reports/    │              │ Broadcasts:          │  │
│  │ PATCH /damage-   │              │  - damage_reported   │  │
│  │      reports/{id}│              │  - damage_updated    │  │
│  │ POST /damage-    │              │  - damage_deleted    │  │
│  │      reports/{id}│              │                      │  │
│  │      /acknowledge│              │ Connects on mount    │  │
│  │ POST /damage-    │              │ Auto-reconnect       │  │
│  │      reports/{id}│              │                      │  │
│  │      /resolve    │              └──────────────────────┘  │
│  └──────────────────┘                                        │
│                                                                │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────────┐
│                      BACKEND LAYER                             │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Django REST API / WebSocket Server                      │ │
│  │                                                          │ │
│  │  Models:                                                │ │
│  │  - DamageReport (with all fields from spec)             │ │
│  │  - DamagePhoto (linked to DamageReport)                 │ │
│  │                                                          │ │
│  │  API Views:                                             │ │
│  │  - ListCreateAPIView (reports)                          │ │
│  │  - RetrieveUpdateDestroyAPIView (report detail)         │ │
│  │  - AcknowledgeView, ResolveView (actions)               │ │
│  │  - PhotoUploadView (photo management)                   │ │
│  │                                                          │ │
│  │  Consumers:                                             │ │
│  │  - WebSocket consumer for sync events                   │ │
│  │  - Broadcast damage_reported, damage_updated, etc.      │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Database                                               │ │
│  │                                                          │ │
│  │  Tables:                                                │ │
│  │  - damage_reports (damage_reports table)               │ │
│  │  - damage_photos (damage_photos table)                 │ │
│  │  - damage_notifications (optional)                      │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  External Services (Optional)                           │ │
│  │                                                          │ │
│  │  - S3 / Cloud Storage (photos)                          │ │
│  │  - Email Service (notifications)                        │ │
│  │  - SMS Service (critical alerts)                        │ │
│  │  - Push Notification Service                           │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Renter Damage Submission Workflow

```
                           ┌──────────────────┐
                           │  Renter opens    │
                           │  booking details │
                           └────────┬─────────┘
                                    │
                                    ▼
                           ┌──────────────────┐
                           │ Clicks "Report   │
                           │ Damage" button   │
                           └────────┬─────────┘
                                    │
                                    ▼
                 ┌──────────────────────────────────────┐
                 │  DamageReportForm Modal Opens        │
                 │  with booking info pre-filled        │
                 └──────────────┬───────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
                    ▼                       ▼
          ┌──────────────────┐   ┌──────────────────┐
          │ Fill Form:       │   │ Renter can:      │
          │ - Title          │   │ - Save draft     │
          │ - Severity       │   │ - Continue edit  │
          │ - Location       │   │ - Upload photos  │
          │ - Description    │   │ - Preview form   │
          │ - Repair Cost    │   └──────────────────┘
          └────────┬─────────┘
                   │
                   ▼
          ┌──────────────────┐
          │ Upload Photos    │
          │ (up to 10)       │
          │ Max 5MB each     │
          │ JPG/PNG/WebP     │
          └────────┬─────────┘
                   │
                   ▼
          ┌──────────────────┐
          │ Form validates   │
          │ - All required   │
          │   fields filled  │
          │ - At least 1 pic │
          │ - Description    │
          │   ≥ 10 chars     │
          └────────┬─────────┘
                   │
        ┌──────────┴──────────┐
        │ Valid?              │
    No  │                     │  Yes
        ▼                     ▼
   [Error msg]     ┌──────────────────────┐
   [Disable btn]   │ User clicks "Submit" │
                   │ (Submit button active)│
                   └──────────┬───────────┘
                              │
                              ▼
                   ┌──────────────────────┐
                   │ FormData prepared    │
                   │ with all fields &    │
                   │ photo files          │
                   └──────────┬───────────┘
                              │
                              ▼
                   ┌──────────────────────┐
                   │ useDamageReportForm  │
                   │ submitReport() called│
                   └──────────┬───────────┘
                              │
                              ▼
                   ┌──────────────────────┐
                   │ apiRequest POST      │
                   │ /api/damage-reports/ │
                   │ (multipart/form-data)│
                   └──────────┬───────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │ Backend receives POST request        │
        │ 1. Validates data                   │
        │ 2. Saves DamageReport to DB         │
        │ 3. Stores photos on S3/Storage      │
        │ 4. Returns created report with ID   │
        └─────────┬───────────────────────────┘
                  │
                  ▼
        ┌─────────────────────────────────────┐
        │ Backend broadcasts WebSocket event: │
        │ {                                   │
        │   "type": "damage_reported",        │
        │   "action": "create",               │
        │   "id": "123",                      │
        │   "payload": {...report...}         │
        │ }                                   │
        └─────────┬───────────────────────────┘
                  │
                  ▼
        ┌─────────────────────────────────────┐
        │ realtimeManager receives event      │
        │ Triggers 'damage_reported' listener │
        └─────────┬───────────────────────────┘
                  │
                  ▼
        ┌─────────────────────────────────────┐
        │ DamageReportContext updates state   │
        │ calls upsertReport()                │
        │ setReports([...new, report])        │
        └─────────┬───────────────────────────┘
                  │
        ┌─────────┴──────────────────┐
        │                            │
        ▼                            ▼
   [Local state]          [Owner app listening]
   [Renter app]           [Owner sees new report
   [Shows success]         badge appear]
                          [Notification pops up]
                          [Inbox updates]
```

---

## 👤 Owner Report Review Workflow

```
┌──────────────────────────────────────────┐
│  Vehicle Owner opens Owner Dashboard     │
│  "Damage Reports" tab                    │
└──────────────────┬───────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ DamageReportInbox    │
        │ component mounts     │
        │                      │
        │ Effects trigger:     │
        │ 1. Load reports via  │
        │    getDamageReports()│
        │ 2. Subscribe to WS   │
        │    events            │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ API: GET             │
        │ /api/damage-reports/ │
        │ Returns all owner's  │
        │ damage reports       │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ Reports loaded into  │
        │ Context state        │
        │ Inbox re-renders     │
        │                      │
        │ Shows:               │
        │ - "New" tab (count)  │
        │ - Reports list       │
        │ - Status badges      │
        └──────────┬───────────┘
                   │
        ┌──────────┴─────────────┐
        │                        │
        ▼                        ▼
   [Real-time]          [Owner clicks]
   [WebSocket]          [report card]
   [broadcasts new      [to view
   damage_reported]     details]
        │
        ▼
   ┌──────────────────┐
   │ Context listener │
   │ updates state    │
   │ New report added │
   │ to state.reports │
   │ Inbox re-renders │
   │ New badge appears│
   └────────┬─────────┘
            │
            ▼
    ┌────────────────┐
    │ Inbox shows    │
    │ report with:   │
    │ - Title        │
    │ - Severity     │
    │ - Status badge │
    │ - Vehicle      │
    │ - Renter       │
    │ - Photos count │
    └────────┬───────┘
             │
             ▼
    ┌──────────────────────┐
    │ Owner clicks report  │
    │ to view full details │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │ Detail view shows:   │
    │ - Rental info        │
    │ - Damage details     │
    │ - Photo gallery      │
    │ - Est. repair cost   │
    │ - Buttons:           │
    │   * Acknowledge      │
    │   * Resolve          │
    └──────────┬───────────┘
               │
    ┌──────────┴─────────────┐
    │                        │
    ▼                        ▼
 [Click               [Click
  Acknowledge]        Resolve]
    │                 │
    ▼                 ▼
 ┌──────────────┐  ┌──────────────┐
 │ POST to      │  │ POST to      │
 │ /acknowledge │  │ /resolve     │
 │ endpoint     │  │ endpoint     │
 └──────┬───────┘  └──────┬───────┘
        │                 │
        ▼                 ▼
 ┌──────────────┐  ┌──────────────┐
 │ Backend:     │  │ Backend:     │
 │ - Update     │  │ - Update     │
 │   status to  │  │   status to  │
 │   "ack"      │  │   "resolved" │
 │ - Send WebSocket event
 └──────┬───────┘  └──────┬───────┘
        │                 │
        ▼                 ▼
 ┌──────────────────────────────┐
 │ Broadcast WebSocket:         │
 │ {                            │
 │   "type": "damage_updated",  │
 │   "id": report_id,           │
 │   "payload": {...updated...} │
 │ }                            │
 └──────────┬───────────────────┘
            │
            ▼
 ┌──────────────────────┐
 │ DamageReportContext  │
 │ listener updates     │
 │ report status        │
 │ Inbox re-renders     │
 │ Report moves tab     │
 └──────────┬───────────┘
            │
            ▼
 ┌──────────────────────┐
 │ Owner sees:          │
 │ - Report status ✓    │
 │ - Moved to new tab   │
 │ - Buttons disabled   │
 └──────────────────────┘
```

---

## 🌐 Real-Time Synchronization Flow

```
┌─────────────────────────────────┐
│  Multiple Clients Connected     │
│  (2+ web browsers/tabs)         │
└──────────────┬──────────────────┘
               │
    ┌──────────┴──────────┬────────────┐
    │                     │            │
    ▼                     ▼            ▼
┌─────────┐         ┌─────────┐  ┌─────────┐
│ Renter  │         │ Owner 1 │  │ Owner 2 │
│ Browser │         │ Browser │  │ Browser │
└────┬────┘         └────┬────┘  └────┬────┘
     │                   │            │
     └───────────────────┼────────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │  WebSocket Manager     │
            │  (realtimeManager)     │
            │                        │
            │ Maintains 3 WS         │
            │ connections            │
            └────────────┬───────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │ Backend receives       │
            │ damage report from     │
            │ renter's API request   │
            │                        │
            │ Creates DamageReport   │
            │ in database            │
            └────────────┬───────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │ WebSocket Consumer     │
            │ broadcasts event to    │
            │ all connected clients  │
            │                        │
            │ Message:               │
            │ {                      │
            │   "type":              │
            │    "damage_reported",  │
            │   "payload": {...}     │
            │ }                      │
            └────────────┬───────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   Renter gets      Owner 1 gets      Owner 2 gets
   success msg      real-time update  real-time update
   Modal closes     Inbox updates     Inbox updates
   No refresh       No refresh        No refresh needed
   needed           needed
```

---

## 📋 Data Flow: Report Status Lifecycle

```
┌─────────┐
│  Draft  │  (Saved but not submitted)
└────┬────┘
     │
     │ (User clicks Submit)
     ▼
┌─────────────┐
│  Submitted  │  (Sent to owner, awaiting review)
└────┬────────┘
     │
     │ (WebSocket broadcast: damage_reported)
     │
     ├─ Renter app: Shows "Submitted" status
     └─ Owner app: Shows badge, new report appears
     
     │
     │ (Owner clicks "Acknowledge")
     ▼
┌──────────────────┐
│  Acknowledged    │  (Owner has seen the report)
└────┬─────────────┘
     │
     │ (WebSocket broadcast: damage_updated)
     │
     ├─ Renter app: Status updated
     └─ Owner app: Report moved to "Acknowledged" tab
     
     │
     │ (Owner clicks "Mark Resolved")
     ▼
┌──────────────┐
│  Resolved    │  (Issue is closed)
└──────────────┘
     
     (WebSocket broadcast: damage_updated)
     
     ├─ Renter app: Can no longer edit
     └─ Owner app: Report moved to "Resolved" tab
                   Actions disabled
```

---

## 🔐 Authentication & Authorization Flow

```
┌──────────────────┐
│ User logs in     │
│ Session created  │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────┐
│ User's role & ID stored      │
│ in:                          │
│ - sessionStorage             │
│ - AuthContext.user           │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ When accessing DamageReport: │
│                              │
│ RENTER:                      │
│ - Can create new reports     │
│ - Can only see own reports   │
│ - getBookingReports(         │
│   user.id)                   │
│                              │
│ OWNER:                       │
│ - Can view damage reports    │
│ - Only for their vehicles    │
│ - getVehicleReports(         │
│   vehicle.id)                │
│                              │
│ ADMIN:                       │
│ - Can view all reports       │
│ - Can manage disputes        │
│ - Can view analytics         │
└──────────────────────────────┘
```

---

## 📱 Component Rendering Tree

```
<App>
  └─ <AuthProvider>
      └─ <VehicleProvider>
          └─ <LogReportProvider>
              └─ <DamageReportProvider>
                  └─ <Routes>
                      ├─ <Bookings>
                      │   ├─ <BookingsList>
                      │   │   └─ <BookingCard>
                      │   │       └─ [Report Damage Button]
                      │   └─ {showModal && <DamageReportForm />}
                      │
                      └─ <OwnerDashboard>
                          ├─ <TabNav>
                          └─ {activeTab === 'damage' && (
                              <DamageReportInbox />
                            )}
```

---

This architecture ensures:
✅ Real-time synchronization across all clients
✅ Proper separation of concerns
✅ Scalable state management
✅ Responsive user experience
✅ Secure authorization
✅ Offline fallback capability
