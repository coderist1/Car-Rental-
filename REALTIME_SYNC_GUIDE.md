# Real-Time Data Sync Configuration Guide

This document explains how to set up and use the real-time WebSocket-based data synchronization system for the Car Rental App.

## Overview

The app now automatically syncs all data updates (vehicles, users, profiles, log reports) from the backend/mobile clients in real-time using WebSocket connections.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    WEB CLIENT                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Context Providers (Vehicle, Auth, LogReport)        │   │
│  │  • Subscribe to WebSocket events                     │   │
│  │  • Auto-update state when data changes               │   │
│  └──────────────────────────────────────────────────────┘   │
│                         ↑                                    │
│                    WebSocket                                 │
│                         ↓                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  RealtimeManager (src/lib/api.js)                    │   │
│  │  • Manages WebSocket connection                      │   │
│  │  • Auto-reconnect with exponential backoff           │   │
│  │  • Emits event listeners per data type              │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
          ↑                                    ↓
       Browser WebSocket              Backend WebSocket Server
                                      ┌──────────────────────┐
                                      │  Mobile App / Other  │
                                      │     Web Clients      │
                                      └──────────────────────┘
```

## Environment Configuration

### Required Environment Variables

Create a `.env` file in the project root with:

```env
# API Configuration
VITE_API_URL=http://127.0.0.1:8000/api
VITE_WS_URL=ws://127.0.0.1:8000/ws

# For production:
# VITE_API_URL=https://api.example.com/api
# VITE_WS_URL=wss://api.example.com/ws
```

### Environment Variable Details

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | REST API base URL (includes /api suffix) | `http://127.0.0.1:8000/api` |
| `VITE_WS_URL` | WebSocket server URL | `ws://127.0.0.1:8000/ws` |

**Note:** If `VITE_WS_URL` is not set, the system automatically converts `VITE_API_URL` to a WebSocket URL (replaces `http` with `ws`, `https` with `wss`).

## Backend Requirements

Your Django backend must provide a WebSocket endpoint at `/ws/sync/` that:

1. **Accepts token authentication:**
   ```
   WebSocket URL: ws://api.example.com/ws/sync/?token=<auth_token>
   ```

2. **Broadcasts these event types when data changes:**

   | Event Type | When Triggered | Payload |
   |-----------|-----------------|---------|
   | `vehicle_created` | New vehicle added | Vehicle object |
   | `vehicle_updated` | Vehicle edited | Vehicle object |
   | `vehicle_deleted` | Vehicle removed | Vehicle ID |
   | `user_created` | New user registered | User object |
   | `user_updated` | User profile changed | User object |
   | `user_deleted` | User account deleted | User ID |
   | `profile_updated` | User profile updated | User object |
   | `logreport_created` | New log report created | LogReport object |
   | `logreport_updated` | Log report edited | LogReport object |
   | `logreport_deleted` | Log report deleted | LogReport ID |
   | `booking_created` | New booking made | Booking object |
   | `booking_updated` | Booking status changed | Booking object |
   | `booking_deleted` | Booking cancelled | Booking ID |

3. **Message Format:**
   ```json
   {
     "type": "vehicle_updated",
     "action": "update",
     "id": "123",
     "payload": {
       "id": 123,
       "model": "Tesla Model 3",
       "available": true,
       "daily_rate": 100,
       ...
     }
   }
   ```

### Django/Channels Example Implementation

```python
# consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer


class SyncConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        token = self.scope['query_string'].decode('utf-8').split('=')[1]
        user = await self.authenticate_token(token)
        
        if not user:
            await self.close()
            return
        
        self.user = user
        self.group_name = f"sync_group"
        
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def sync_event(self, event):
        """Forward sync events to client"""
        await self.send(text_data=json.dumps(event['data']))
```

## How It Works

### 1. Connection Flow
```
App Start
  ↓
AuthContext initializes
  ↓
User logs in, token stored
  ↓
VehicleContext subscribes to WebSocket
  ↓
RealtimeManager.connect(token)
  ↓
WebSocket connection established to /ws/sync/?token=...
  ↓
Client subscribes to all event types
  ↓
Ready to receive real-time updates
```

### 2. Real-Time Update Flow
```
Mobile App (or other client) edits vehicle
  ↓
Backend validates and saves to database
  ↓
Backend broadcasts "vehicle_updated" event via WebSocket
  ↓
Web client receives event
  ↓
VehicleContext listener triggered
  ↓
Vehicles state updated automatically
  ↓
React re-renders with new data
```

### 3. Auto-Reconnection
If the WebSocket connection drops:
- Attempts to reconnect immediately
- Retries up to 5 times with 3-second delays
- Success: Resumes receiving updates
- Failure: User can refresh page to retry

## Usage in Components

### Vehicle Updates
```jsx
import { useVehicles } from '@/context/VehicleContext';

function VehicleList() {
  const { vehicles } = useVehicles();
  
  // vehicles automatically update in real-time
  return (
    <div>
      {vehicles.map(v => (
        <div key={v.id}>{v.model} - ${v.pricePerDay}</div>
      ))}
    </div>
  );
}
```

### User Updates
```jsx
import { useAuth } from '@/context/AuthContext';

function Profile() {
  const { user } = useAuth();
  
  // user profile updates in real-time if another client edits it
  return <div>{user.fullName} ({user.email})</div>;
}
```

### Log Report Updates
```jsx
import { useLogReport } from '@/context/LogReportContext';

function LogReports() {
  const { reports } = useLogReport();
  
  // reports update in real-time when other clients create/update them
  return (
    <div>
      {reports.map(r => (
        <div key={r.id}>{r.type}: {r.vehicleName}</div>
      ))}
    </div>
  );
}
```

## Development Setup

### 1. Create `.env.local` (dev environment)
```bash
VITE_API_URL=http://127.0.0.1:8000/api
VITE_WS_URL=ws://127.0.0.1:8000/ws
```

### 2. Start the backend server
```bash
# Django development server with channels
python manage.py runserver

# OR with Daphne for production-like setup
daphne -b 0.0.0.0 -p 8000 myproject.asgi:application
```

### 3. Start the web frontend
```bash
npm run dev
```

### 4. Testing real-time sync
- Open the app in multiple browser tabs
- Edit a vehicle in one tab
- See it update instantly in other tabs
- Edit from mobile app → see instant update in web

## Production Deployment

### HTTPS/WSS Setup
For production with HTTPS:

```env
VITE_API_URL=https://api.example.com/api
VITE_WS_URL=wss://api.example.com/ws
```

### CORS Configuration (Backend)
Ensure your backend allows WebSocket connections:

```python
# settings.py (Django)
CORS_ALLOWED_ORIGINS = [
    "https://app.example.com",
]

CSRF_TRUSTED_ORIGINS = [
    "https://app.example.com",
]
```

### Connection Issues

**Issue:** WebSocket connection fails with 401
- **Solution:** Check token is valid in URL parameters
- **Debug:** Check browser DevTools → Network → WS tab

**Issue:** "Unable to connect to API" errors
- **Solution:** Verify `VITE_API_URL` and `VITE_WS_URL` are correct
- **Debug:** Check `.env` file is loaded: `console.log(import.meta.env)`

**Issue:** Updates not syncing
- **Solution:** Verify backend broadcasts events correctly
- **Debug:** Monitor WebSocket messages in browser DevTools

## Monitoring & Debugging

### Check Connection Status
```javascript
// In browser console
import { realtimeManager } from '@/lib/api';
console.log('WS Status:', realtimeManager.ws?.readyState);
// 0 = CONNECTING, 1 = OPEN, 2 = CLOSING, 3 = CLOSED
```

### View All Events
```javascript
// Monitor all WebSocket events
realtimeManager.on('vehicle_updated', (event) => {
  console.log('Vehicle updated:', event);
});
```

### Test WebSocket Connection
```bash
# Using wscat (npm install -g wscat)
wscat -c "ws://127.0.0.1:8000/ws/sync/?token=your_token_here"

# Type messages to test
> {"type": "vehicle_updated", "id": 1, "payload": {...}}
```

## Troubleshooting Checklist

- [ ] Backend WebSocket server is running and accessible
- [ ] Environment variables are set in `.env`
- [ ] User is authenticated (token is valid)
- [ ] WebSocket URL is correct (check browser Network tab)
- [ ] No CORS/CSP blocking WebSocket connections
- [ ] Backend broadcasts events in correct format
- [ ] Both web and mobile clients connect to same WebSocket server
- [ ] Firewall allows WebSocket connections (port forwarding)

## Performance Considerations

1. **Connection per user:** Each client connects with its own token
2. **Event broadcasting:** Backend should broadcast to all connected clients
3. **Large datasets:** Implement pagination/filtering to limit data sent
4. **Network bandwidth:** Monitor for excessive event publishing
5. **Memory usage:** Cleanup listeners in useEffect() return functions (already done)

## Security

- WebSocket connections require valid authentication token
- Tokens are sent in URL query parameter (over secure WSS in production)
- Server validates tokens before accepting connections
- Consider implementing token refresh for long-lived connections
- Use WSS (WebSocket Secure) in production

## Future Enhancements

1. **Selective subscription:** Subscribe to only relevant data types
2. **Compression:** Compress large payloads
3. **Offline support:** Queue updates when offline, sync when reconnected
4. **Conflict resolution:** Handle concurrent edits from multiple clients
5. **Message encryption:** End-to-end encryption of updates
