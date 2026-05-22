# Vehicle Damage Reporting System - Functional Specification

## Executive Summary

This document defines the functional requirements, workflow, and technical architecture for a vehicle damage reporting system within the Car Rental application. The system enables renters to submit detailed damage reports with photo documentation, and ensures vehicle owners receive immediate automated notifications with full report details.

---

## 1. System Overview

### 1.1 Purpose
The Vehicle Damage Reporting System allows renters to:
- Report vehicle damages discovered during rental periods
- Document damage with photos and detailed descriptions
- Maintain damage history for disputes and insurance claims

The system ensures vehicle owners:
- Receive immediate notifications of damage reports
- Access comprehensive damage documentation
- Track vehicle condition over time

### 1.2 Key Features
- **Damage Documentation**: Text descriptions, severity levels, and photo uploads
- **Real-Time Notifications**: WebSocket-based instant owner alerts
- **Photo Management**: Support for multiple damage photos with metadata
- **Timeline Tracking**: Complete damage history with timestamps
- **Status Management**: Draft, Submitted, Under Review, Acknowledged states
- **Context Awareness**: Links to specific rental bookings

### 1.3 System Actors
- **Renter**: Submits damage reports
- **Vehicle Owner**: Receives notifications and reviews reports
- **Admin**: Views all reports, manages disputes
- **Backend/API**: Processes reports and broadcasts notifications

---

## 2. Data Structure & Schema

### 2.1 Damage Report Entity

```typescript
interface DamageReport {
  // Identifiers
  id: string | number;                    // Unique report ID
  bookingId: number;                      // Link to rental booking
  vehicleId: number;                      // Vehicle involved
  renterId: number;                       // Renter who submitted
  ownerId: number;                        // Vehicle owner (denormalized)

  // Metadata
  type: 'pre_rental' | 'during_rental' | 'post_rental';  // When discovered
  status: 'draft' | 'submitted' | 'under_review' | 'acknowledged' | 'resolved';
  severity: 'minor' | 'moderate' | 'severe';
  
  // Content
  title: string;                          // Brief damage title (e.g., "Scratch on hood")
  description: string;                    // Detailed description
  location: string;                       // Vehicle part affected (e.g., "Front bumper")
  estimatedRepairCost?: number;           // Optional cost estimate
  
  // Photos
  photos: DamagePhoto[];                  // Array of damage photos
  
  // Timestamps
  discoveredDate: string;                 // ISO 8601 date when damage found
  reportedDate: string;                   // ISO 8601 date when submitted
  acknowledgedDate?: string;              // When owner acknowledged
  resolvedDate?: string;                  // When issue resolved
  
  // Additional metadata
  rentalStartDate: string;                // Start of rental period
  rentalEndDate: string;                  // End of rental period
  vehicleName: string;                    // Vehicle display name (denormalized)
  renterName: string;                     // Renter name (denormalized)
  ownerName: string;                      // Owner name (denormalized)
  
  // Tracking
  createdAt: string;                      // Report creation timestamp
  updatedAt: string;                      // Last update timestamp
  notes?: string;                         // Internal notes (admin/owner only)
}

interface DamagePhoto {
  id: string | number;                    // Photo ID
  reportId: string | number;              // Parent report
  url: string;                            // S3/CDN URL or base64
  thumbnailUrl?: string;                  // Thumbnail for preview
  caption: string;                        // Description of damage
  uploadedDate: string;                   // ISO 8601 timestamp
  metadata?: {
    fileSize: number;                     // Bytes
    mimeType: string;                     // e.g., "image/jpeg"
    dimensions?: {
      width: number;
      height: number;
    };
    takenDate?: string;                   // EXIF date if available
  };
}
```

### 2.2 Notification Entity

```typescript
interface DamageReportNotification {
  id: string | number;
  reportId: string | number;
  recipientId: number;                    // Owner's user ID
  type: 'damage_reported' | 'damage_acknowledged' | 'damage_resolved';
  status: 'pending' | 'sent' | 'read';
  payload: {
    reportId: number;
    vehicleId: number;
    vehicleName: string;
    severity: string;
    damageTitle: string;
    damageDescription: string;
    renterName: string;
    photoCount: number;
  };
  sentAt: string;                         // ISO 8601 timestamp
  readAt?: string;
  channel: 'push' | 'email' | 'in_app' | 'sms';  // Notification channel
}
```

### 2.3 Database Schema (Django Model Example)

```python
# models.py
from django.db import models
from django.contrib.auth.models import User

class DamageReport(models.Model):
    TYPE_CHOICES = [
        ('pre_rental', 'Pre-Rental'),
        ('during_rental', 'During Rental'),
        ('post_rental', 'Post-Rental'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('under_review', 'Under Review'),
        ('acknowledged', 'Acknowledged'),
        ('resolved', 'Resolved'),
    ]
    
    SEVERITY_CHOICES = [
        ('minor', 'Minor'),
        ('moderate', 'Moderate'),
        ('severe', 'Severe'),
    ]
    
    # Foreign Keys
    booking = models.ForeignKey(Booking, on_delete=models.PROTECT)
    vehicle = models.ForeignKey(Vehicle, on_delete=models.PROTECT)
    renter = models.ForeignKey(User, on_delete=models.PROTECT, related_name='damage_reports_submitted')
    owner = models.ForeignKey(User, on_delete=models.PROTECT, related_name='damage_reports_owned')
    
    # Fields
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES)
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    location = models.CharField(max_length=200)
    estimated_repair_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    discovered_date = models.DateField()
    reported_date = models.DateTimeField(auto_now_add=True)
    acknowledged_date = models.DateTimeField(null=True, blank=True)
    resolved_date = models.DateTimeField(null=True, blank=True)
    
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'damage_reports'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['booking', 'renter']),
            models.Index(fields=['vehicle', 'owner']),
            models.Index(fields=['status']),
        ]

class DamagePhoto(models.Model):
    report = models.ForeignKey(DamageReport, on_delete=models.CASCADE, related_name='photos')
    image = models.ImageField(upload_to='damage_reports/%Y/%m/%d/')
    caption = models.CharField(max_length=200)
    uploaded_date = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'damage_photos'
        ordering = ['uploaded_date']
```

---

## 3. User Interface Requirements

### 3.1 Renter UI - Damage Report Creation

#### 3.1.1 Report Submission Screen
**Location**: New page accessible from Bookings page

**Layout Structure**:
```
┌─────────────────────────────────────────────────┐
│  Vehicle Damage Report                      [X] │
├─────────────────────────────────────────────────┤
│                                                 │
│  Rental Information                             │
│  ┌──────────────────────────────────────────┐  │
│  │ Vehicle: Tesla Model 3 (Silver)          │  │
│  │ Rental Period: May 15 - May 18, 2026     │  │
│  │ Owner: John Smith                        │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  Damage Information                             │
│  ┌──────────────────────────────────────────┐  │
│  │ When Discovered:                         │  │
│  │ ○ Before rental    ○ During    ○ After  │  │
│  │                                          │  │
│  │ Damage Title *                           │  │
│  │ [Scratch on hood                         ]  │
│  │                                          │  │
│  │ Severity Level *                         │  │
│  │ [Minor ▼]                                │  │
│  │                                          │  │
│  │ Location on Vehicle *                    │  │
│  │ [Front bumper                            ]  │
│  │                                          │  │
│  │ Detailed Description *                   │  │
│  │ ┌──────────────────────────────────────┐ │  │
│  │ │ There's a visible scratch and minor  │ │  │
│  │ │ dent on the front hood, approx 2     │ │  │
│  │ │ inches long...                       │ │  │
│  │ │                                      │ │  │
│  │ └──────────────────────────────────────┘ │  │
│  │                                          │  │
│  │ Estimated Repair Cost (Optional)         │  │
│  │ [$250                                    ]  │
│  │                                          │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  Photos & Evidence                              │
│  ┌──────────────────────────────────────────┐  │
│  │ [+ Add Photo] (Max 10 photos, 5MB each) │  │
│  │                                          │  │
│  │ ┌────────┐ ┌────────┐                   │  │
│  │ │  Photo │ │  Photo │                   │  │
│  │ │   1    │ │   2    │                   │  │
│  │ │ [X]    │ │ [X]    │                   │  │
│  │ └────────┘ └────────┘                   │  │
│  │                                          │  │
│  │ Photo Caption:                           │  │
│  │ [Scratch on hood surface                 ]  │
│  │                                          │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│     [← Back]              [Save Draft]  [Submit]│
└─────────────────────────────────────────────────┘
```

**Key Components**:

1. **Rental Information Panel** (Read-only)
   - Vehicle name and image
   - Rental period dates
   - Owner name
   - Link to original booking

2. **Damage Type Selector**
   - Three radio buttons: Pre-Rental, During Rental, Post-Rental
   - Clear visual indication of selection
   - Affects visibility of certain fields (e.g., pre-rental has no owner liability)

3. **Damage Details Section**
   - Title field (max 200 chars, required)
   - Severity dropdown (Minor, Moderate, Severe)
   - Location field (e.g., "Front bumper", "Driver door", autocomplete suggestions)
   - Detailed description textarea (required, min 10 chars)
   - Estimated repair cost input (optional, numeric only)

4. **Photo Upload Manager**
   - Multi-file upload widget with preview
   - Max 10 photos per report
   - Max 5MB per photo
   - Supported formats: JPG, PNG, WebP
   - Each photo requires a caption
   - Photo cards show:
     - Thumbnail preview
     - Caption text
     - Upload timestamp
     - Delete button with confirmation
   - Drag & drop support for desktop
   - Camera access for mobile (if running as PWA)

5. **Form Validation**
   - All required fields marked with *
   - Real-time validation feedback
   - Submit button disabled until form valid
   - Save Draft button available anytime

6. **Action Buttons**
   - **Save Draft**: Saves to local state + backend, allows editing later
   - **Submit**: Final submission, status changes to "submitted", notification sent
   - **Back**: Discard unsaved changes with confirmation

#### 3.1.2 Report Status View
**Shows after submission**
```
┌─────────────────────────────────────────────────┐
│  Report Submitted Successfully                  │
├─────────────────────────────────────────────────┤
│                                                 │
│  ✓ Your damage report has been submitted       │
│    Report ID: #DR-2026-05-22-1547              │
│    Submitted to: John Smith (Vehicle Owner)    │
│                                                 │
│  Status: Submitted                              │
│  Next Steps: Owner will review within 24 hours │
│                                                 │
│  Report Summary:                                │
│  ├─ Damage: Scratch on hood                    │
│  ├─ Severity: Minor                            │
│  ├─ Photos: 3 attached                         │
│  └─ Estimated Cost: $250                       │
│                                                 │
│     [View Full Report]     [Back to Bookings]  │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### 3.1.3 Draft Reports Management
**In Bookings page, add "Damage Reports" tab**
```
┌─────────────────────────────────────────────────┐
│  My Bookings > Damage Reports                   │
├─────────────────────────────────────────────────┤
│  Drafts (2)              Submitted (5)           │
│                                                 │
│  ┌────────────────────────────────────────────┐ │
│  │ DRAFT - Scratch on hood                    │ │
│  │ Vehicle: Tesla Model 3                     │ │
│  │ Saved 2 hours ago       [Edit] [Delete]    │ │
│  └────────────────────────────────────────────┘ │
│                                                 │
│  ┌────────────────────────────────────────────┐ │
│  │ DRAFT - Tire damage                        │ │
│  │ Vehicle: Honda Civic                       │ │
│  │ Saved 1 day ago         [Edit] [Delete]    │ │
│  └────────────────────────────────────────────┘ │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 3.2 Owner/Vehicle Owner UI - Damage Report Review

#### 3.2.1 Notifications Dashboard

**Real-time Notification**:
```
┌─────────────────────────────────┐
│ 🔔 New Damage Report            │
│                                 │
│ Tesla Model 3 has reported      │
│ damage: Scratch on hood         │
│ Severity: Minor                 │
│                                 │
│ [View Report]        [Dismiss]  │
└─────────────────────────────────┘
```

**In-App Notification Badge**:
- Red badge with count on Dashboard/Navigation
- Shows "3 new damage reports"
- Clickable to navigate to reports inbox

#### 3.2.2 Damage Reports Inbox

**Layout**:
```
┌─────────────────────────────────────────────────┐
│  My Vehicles > Damage Reports                   │
├─────────────────────────────────────────────────┤
│  Filters: [All ▼] Severity: [All ▼]             │
│  Search: [________________]  [Search]           │
│                                                 │
│  New (3)    Under Review (1)    Resolved (8)   │
│                                                 │
│  ┌────────────────────────────────────────────┐ │
│  │ ⚠️  SEVERE - Windshield Crack              │ │
│  │ Vehicle: Tesla Model 3 (Silver)            │ │
│  │ Renter: Jane Doe                           │ │
│  │ Reported: May 22, 2026 @ 3:45 PM           │ │
│  │ Photos: 5                                  │ │
│  │ Status: NEW                                │ │
│  │ [View Details] [Acknowledge] [Schedule...] │ │
│  └────────────────────────────────────────────┘ │
│                                                 │
│  ┌────────────────────────────────────────────┐ │
│  │ ⚠️  MODERATE - Dent on door                │ │
│  │ Vehicle: Honda Civic                       │ │
│  │ Renter: John Smith                         │ │
│  │ Reported: May 21, 2026 @ 10:15 AM          │ │
│  │ Photos: 3                                  │ │
│  │ Status: Under Review                       │ │
│  │ [View Details] [Update Status]             │ │
│  └────────────────────────────────────────────┘ │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### 3.2.3 Damage Report Detail View

**Owner View**:
```
┌─────────────────────────────────────────────────┐
│  Damage Report #DR-2026-05-22-1547              │
│  Status: NEW  |  Severity: SEVERE               │
├─────────────────────────────────────────────────┤
│                                                 │
│  Rental Information                             │
│  ┌──────────────────────────────────────────┐  │
│  │ Vehicle: Tesla Model 3 (Silver)          │  │
│  │ Rental Period: May 15 - May 18, 2026     │  │
│  │ Renter: Jane Doe (Verified)              │  │
│  │ Rental Status: Completed                 │  │
│  │ Link: [View Booking #BK-2026-05-15-123]  │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  Damage Details                                 │
│  ┌──────────────────────────────────────────┐  │
│  │ Title: Windshield Crack                  │  │
│  │ Discovered: During Rental                │  │
│  │ Date Found: May 17, 2026                 │  │
│  │ Location: Front windshield               │  │
│  │ Severity: SEVERE                         │  │
│  │ Est. Repair Cost: $800                   │  │
│  │                                          │  │
│  │ Description:                             │  │
│  │ "Large diagonal crack across the front  │  │
│  │  windshield, likely from road debris.   │  │
│  │  Driver visibility affected."            │  │
│  │                                          │  │
│  │ Reported: May 22, 2026 @ 3:45 PM        │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  Evidence - 5 Photos                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │  Photo 1 │  │  Photo 2 │  │  Photo 3 │      │
│  │  [Thumb] │  │  [Thumb] │  │  [Thumb] │      │
│  │ Crack... │  │ Crack... │  │ Close-up │      │
│  └──────────┘  └──────────┘  └──────────┘      │
│                                                 │
│  (Click photo for full view)                    │
│                                                 │
│  Actions                                        │
│  ┌──────────────────────────────────────────┐  │
│  │ [Acknowledge Report]                     │  │
│  │ [Start Repair Request]                   │  │
│  │ [Dispute Report]                         │  │
│  │ [Add Internal Notes]                     │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Internal Notes Section** (Owner Only):
```
┌──────────────────────────────────────────┐
│ Internal Notes                            │
├──────────────────────────────────────────┤
│                                          │
│ ┌────────────────────────────────────┐  │
│ │ Already contacted glass repair     │  │
│ │ company - quote pending            │  │
│ │ - Added by You, 10 mins ago   [×]  │  │
│ └────────────────────────────────────┘  │
│                                          │
│ ┌────────────────────────────────────┐  │
│ │ Renter mentioned they didn't       │  │
│ │ cause the damage - blames road...  │  │
│ │ - Added by You, 1 hour ago    [×]  │  │
│ └────────────────────────────────────┘  │
│                                          │
│ Add Note:                                │
│ ┌────────────────────────────────────┐  │
│ │ [______________________________  ]  │  │
│ │                                    │  │
│ │              [Add Note]            │  │
│ └────────────────────────────────────┘  │
│                                          │
└──────────────────────────────────────────┘
```

### 3.3 Admin Dashboard UI

```
┌─────────────────────────────────────────────────┐
│  Admin Dashboard > Damage Reports                │
├─────────────────────────────────────────────────┤
│  Filters: Status [All ▼]  Severity [All ▼]      │
│           Vehicle Owner [_________]             │
│  Period: [From Date] [To Date] [Apply]          │
│                                                 │
│  Total Reports: 247  |  Unreviewed: 12          │
│  High Severity: 8    |  Disputed: 3             │
│                                                 │
│  ┌──────┬──────┬────────┬─────┬────┬──────────┐ │
│  │ Rep# │ Veh# │ Renter │Sev. │Sts │ Owner    │ │
│  ├──────┼──────┼────────┼─────┼────┼──────────┤ │
│  │ 1547 │ 234  │ J. Doe │ ⚠️ │NEW │ J. Smith │ │
│  │ 1546 │ 156  │ M. Lee │ ⚠ │ACK │ P. Jones │ │
│  │ 1545 │ 89   │ A. Patel│⚠│REV│ K. Williams│ │
│  │ ...  │ ...  │ ...    │...│...│ ...      │ │
│  └──────┴──────┴────────┴─────┴────┴──────────┘ │
│                                                 │
│  [Export CSV]  [Bulk Actions ▼]  [Settings]    │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 4. Notification Workflow

### 4.1 Notification Flow Diagram

```
┌─────────────────┐
│  Renter Submits │
│ Damage Report   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Backend receives POST request    │
│ /api/damage-reports/            │
│                                 │
│ 1. Validate data                │
│ 2. Save to database             │
│ 3. Create DamageReport record   │
│ 4. Extract photo data           │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Broadcast WebSocket event:      │
│ {                               │
│   "type": "damage_reported",    │
│   "action": "create",           │
│   "id": "DR-2026-05-22-1547",  │
│   "payload": { ...report... }   │
│ }                               │
└────────┬────────────────────────┘
         │
    ┌────┴─────┬──────────┬────────┐
    │           │          │        │
    ▼           ▼          ▼        ▼
  ┌──┐      ┌──────┐  ┌──────┐  ┌─────┐
  │WS│      │Email │  │Push  │  │SMS  │
  │  │      │      │  │Notif.│  │     │
  └──┘      └──────┘  └──────┘  └─────┘
    │           │          │        │
    └───┬───────┴──────────┴────────┘
        │
        ▼
┌─────────────────────────────────┐
│ Owner Receives Notification     │
│ - WebSocket in real-time        │
│ - Email with report summary     │
│ - Push notification (optional)  │
│ - SMS alert (critical damage)   │
└─────────────────────────────────┘
```

### 4.2 Notification Content by Channel

#### 4.2.1 WebSocket (Real-time, In-App)
**Message Structure**:
```json
{
  "type": "damage_reported",
  "action": "create",
  "id": "DR-2026-05-22-1547",
  "payload": {
    "id": "DR-2026-05-22-1547",
    "vehicleId": 234,
    "vehicleName": "Tesla Model 3 (Silver)",
    "renterId": 156,
    "renterName": "Jane Doe",
    "title": "Windshield Crack",
    "severity": "severe",
    "description": "Large diagonal crack...",
    "photoCount": 5,
    "estimatedRepairCost": 800,
    "discoveredType": "during_rental",
    "reportedDate": "2026-05-22T15:45:00Z"
  }
}
```

**Display in UI**:
- Toast notification (top-right, 5 second auto-dismiss)
- Badge update on inbox
- Sound alert (configurable)
- Navigation highlight to reports section

#### 4.2.2 Email Notification
**Subject**: `[Action Required] Damage Report Submitted - ${vehicleName}`

**Email Template**:
```
┌────────────────────────────────────────┐
│ CAR RENTAL APP - DAMAGE REPORT ALERT   │
├────────────────────────────────────────┤
│                                        │
│ Hi [Owner Name],                       │
│                                        │
│ A renter has submitted a damage        │
│ report for your vehicle.               │
│                                        │
│ REPORT SUMMARY                         │
│ ─────────────────────────────────────  │
│ Vehicle: Tesla Model 3 (Silver)        │
│ Renter: Jane Doe (Rating: ⭐⭐⭐⭐⭐)  │
│                                        │
│ Damage: Windshield Crack               │
│ Severity: SEVERE ⚠️                    │
│ Location: Front windshield             │
│ Discovered: During Rental              │
│ Report Date: May 22, 2026              │
│                                        │
│ Description:                           │
│ Large diagonal crack across the        │
│ front windshield, likely from road     │
│ debris. Driver visibility affected.    │
│                                        │
│ Estimated Repair Cost: $800            │
│ Photos Attached: 5                     │
│                                        │
│ ACTION REQUIRED                        │
│ ─────────────────────────────────────  │
│ Please review the damage report        │
│ within 24 hours by clicking below:     │
│                                        │
│ [VIEW & RESPOND TO REPORT]             │
│                                        │
│ Report ID: #DR-2026-05-22-1547        │
│                                        │
│ If you have any questions, contact     │
│ our support team.                      │
│                                        │
│ Best regards,                          │
│ Car Rental App Team                    │
│                                        │
└────────────────────────────────────────┘
```

#### 4.2.3 Push Notification (Mobile/Web)
**Title**: `Damage Report - ${vehicleName}`
**Body**: `${renterName} reported: ${damageTitle} (${severity})`
**Click Action**: Opens damage report detail page

**Conditions for Push**:
- Owner's browser has push permission
- App is running (foreground or background)
- Notification setting enabled for damage reports

#### 4.2.4 SMS Alert (Critical Damage Only)
**Severity Threshold**: SEVERE only

**Message Template**:
```
Car Rental App: URGENT - Damage report on your ${vehicleName}. 
Severity: SEVERE. View: [link]. Reply STOP to opt-out.
```

### 4.3 Notification Triggers & Timing

| Event | Trigger | Delay | Channels |
|-------|---------|-------|----------|
| Report Submitted | Renter submits | Immediate | WS, Email, Push |
| Report Acknowledged | Owner clicks acknowledge | Immediate | WS (renter) |
| Report Resolved | Owner marks resolved | Immediate | WS, Email (both) |
| Delayed Review Alert | 24h no owner action | 24h delay | Email, Push |
| High Severity Alert | Damage severity = SEVERE | Immediate | WS, Email, Push, SMS |

---

## 5. Backend API Endpoints

### 5.1 Damage Report Endpoints

```
# Create damage report
POST /api/damage-reports/
Content-Type: multipart/form-data

{
  "bookingId": 123,
  "vehicleId": 234,
  "type": "during_rental",
  "title": "Windshield Crack",
  "severity": "severe",
  "location": "Front windshield",
  "description": "Large diagonal crack...",
  "discoveredDate": "2026-05-17",
  "estimatedRepairCost": 800,
  "photos": [File, File, File]
}

Response 201:
{
  "id": "DR-2026-05-22-1547",
  "status": "submitted",
  "createdAt": "2026-05-22T15:45:00Z",
  "photos": [{ "id": 1, "url": "...", "caption": "..." }]
}

─────────────────────────────────────

# Get damage report details
GET /api/damage-reports/{id}/

Response 200:
{
  "id": "DR-2026-05-22-1547",
  "bookingId": 123,
  ... [full report object]
}

─────────────────────────────────────

# Update damage report (draft)
PATCH /api/damage-reports/{id}/
Content-Type: application/json

{
  "title": "Updated title",
  "description": "Updated description",
  "severity": "moderate"
}

Response 200: [updated report]

─────────────────────────────────────

# List damage reports
GET /api/damage-reports/?vehicle={id}&status={status}&severity={severity}

Response 200:
{
  "count": 45,
  "results": [
    { ...report... },
    { ...report... }
  ]
}

─────────────────────────────────────

# Owner acknowledges report
POST /api/damage-reports/{id}/acknowledge/

Response 200:
{
  "status": "acknowledged",
  "acknowledgedDate": "2026-05-22T16:00:00Z"
}

─────────────────────────────────────

# Mark report resolved
POST /api/damage-reports/{id}/resolve/

Body:
{
  "resolutionNotes": "Repair completed by ABC Glass Co."
}

Response 200:
{
  "status": "resolved",
  "resolvedDate": "2026-05-25T10:30:00Z"
}

─────────────────────────────────────

# Add photo to report
POST /api/damage-reports/{id}/photos/
Content-Type: multipart/form-data

{
  "image": File,
  "caption": "Windshield crack close-up"
}

Response 201:
{
  "id": 1,
  "url": "...",
  "caption": "...",
  "uploadedDate": "2026-05-22T15:45:00Z"
}

─────────────────────────────────────

# Delete report
DELETE /api/damage-reports/{id}/

Response 204: No Content
```

### 5.2 WebSocket Events

**Damage Report Events**:
```javascript
// Event: damage_reported
{
  "type": "damage_reported",
  "action": "create",
  "id": "DR-2026-05-22-1547",
  "payload": { ...full report object... }
}

// Event: damage_acknowledged
{
  "type": "damage_acknowledged",
  "action": "update",
  "id": "DR-2026-05-22-1547",
  "payload": {
    "id": "DR-2026-05-22-1547",
    "status": "acknowledged",
    "acknowledgedDate": "2026-05-22T16:00:00Z"
  }
}

// Event: damage_resolved
{
  "type": "damage_resolved",
  "action": "update",
  "id": "DR-2026-05-22-1547",
  "payload": {
    "id": "DR-2026-05-22-1547",
    "status": "resolved",
    "resolvedDate": "2026-05-25T10:30:00Z"
  }
}
```

---

## 6. Implementation Roadmap

### Phase 1: Core Infrastructure
- [ ] Create `DamageReport` and `DamagePhoto` models
- [ ] Build API serializers and endpoints
- [ ] Implement form validation
- [ ] Setup WebSocket events

### Phase 2: Frontend - Renter Features
- [ ] Create damage report form component
- [ ] Implement photo upload with preview
- [ ] Build draft/submission workflow
- [ ] Add to Bookings page

### Phase 3: Frontend - Owner Features
- [ ] Create notification system
- [ ] Build damage report inbox
- [ ] Implement detail view
- [ ] Add acknowledgement/resolution actions

### Phase 4: Notifications
- [ ] Setup email templates
- [ ] Implement real-time WebSocket delivery
- [ ] Add push notification support
- [ ] Configure SMS alerts for severe damage

### Phase 5: Admin & Analytics
- [ ] Build admin dashboard
- [ ] Add reporting/analytics
- [ ] Implement dispute resolution UI
- [ ] Create audit logs

---

## 7. Security & Privacy Considerations

### 7.1 Access Control
- Renters can only create/view reports for their bookings
- Owners can only view reports for their vehicles
- Admins have full access
- Photos are private, not publicly accessible

### 7.2 Photo Storage
- Store in secure S3/cloud storage, not in database
- Generate secure, time-limited URLs
- Implement virus scanning for uploads
- Auto-delete photos after dispute resolution period

### 7.3 Data Retention
- Keep reports for 2+ years (insurance/legal requirements)
- Archive old photos after 6 months
- Implement GDPR deletion requests

### 7.4 Rate Limiting
- Max 1 report per booking
- Max 10 photos per report
- Max 5MB per photo
- Prevent spam: 1 report per vehicle per day

---

## 8. Error Handling & Edge Cases

### 8.1 Common Errors

| Scenario | Error Code | Message |
|----------|-----------|---------|
| Invalid booking ID | 400 | Booking not found or access denied |
| Photo upload failed | 413 | File too large (max 5MB) |
| Network disconnected | - | Saved to draft, retry when online |
| Owner offline | - | Report submitted, WS queued |
| Duplicate report | 409 | Report already exists for this booking |

### 8.2 Edge Cases
- **No internet during submission**: Save to IndexedDB, sync when online
- **Browser refresh during upload**: Resume upload with chunk tracking
- **Owner account deleted**: Archive report, notify admin
- **Vehicle removed**: Maintain report reference, show archived state

---

## 9. Success Metrics

- **Owner notification delivery**: 95%+ within 30 seconds
- **Photo upload success rate**: 99%+
- **Average review time**: <24 hours
- **User satisfaction**: 4.5+ stars for clarity/ease of use
- **System uptime**: 99.9%

---

## 10. Appendix: Component Structure

### React Component Tree

```
App
├── Bookings (page)
│   ├── BookingsList
│   ├── DamageReportsTab (new)
│   │   ├── DraftReports
│   │   ├── SubmittedReports
│   │   └── ReportCard
│   └── DamageReportForm (modal)
│       ├── RentalInfoPanel
│       ├── DamageDetailsForm
│       ├── PhotoUploader
│       │   ├── PhotoPreview
│       │   └── PhotoCaption
│       └── FormActions
│
├── OwnerDashboard
│   ├── DamageReportInbox (new)
│   │   ├── NotificationCenter
│   │   ├── ReportList
│   │   └── ReportFilters
│   └── DamageReportDetail (new)
│       ├── ReportSummary
│       ├── PhotoGallery
│       ├── OwnerActions
│       └── InternalNotes
│
├── AdminDashboard
│   └── DamageReportsTable (new)
│       ├── TableFilters
│       ├── BulkActions
│       └── ReportStats
```

---

**Document Version**: 1.0  
**Last Updated**: May 22, 2026  
**Status**: Ready for Implementation
