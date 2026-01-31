# 🏥 Booking & Chamber Management System - API Documentation

## Overview

Complete API documentation for the Advancia PayLedger Booking and Chamber Management System. This system provides comprehensive appointment scheduling, chamber/room management, and facility operations.

---

## 📊 Database Models

### Chamber
```typescript
{
  id: string;
  name: string;              // "Room 101"
  floor: number;             // 1, 2, 3
  type: string;              // "Consultation", "Procedure", "Emergency"
  status: string;            // "available", "occupied", "maintenance", etc.
  capacity: number;          // Max people
  equipment: string[];       // ["ECG", "BP Monitor"]
  facilityId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Booking
```typescript
{
  id: string;
  patientId: string;
  doctorId: string;
  chamberId: string;
  facilityId: string;
  bookingDate: Date;
  startTime: Date;
  endTime: Date;
  duration: number;          // minutes
  serviceType: string;       // "Consultation", "Procedure", etc.
  status: string;            // "pending", "confirmed", "cancelled", "completed"
  notes: string;
  invoiceId: string;
  paymentStatus: string;     // "pending", "paid", "partial", "refunded"
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  cancelledAt: Date;
}
```

---

## 🔐 Authentication

All endpoints require authentication via JWT Bearer token:

```http
Authorization: Bearer <your_jwt_token>
```

---

## 📍 API Endpoints

### Chamber Management

#### 1. List All Chambers
```http
GET /api/chambers
```

**Query Parameters:**
- `facilityId` (optional): Filter by facility
- `status` (optional): Filter by status
- `floor` (optional): Filter by floor number
- `type` (optional): Filter by chamber type

**Response:**
```json
{
  "success": true,
  "count": 6,
  "chambers": [
    {
      "id": "uuid",
      "name": "Room 101",
      "floor": 1,
      "type": "Consultation",
      "status": "available",
      "capacity": 2,
      "equipment": ["ECG", "BP Monitor"],
      "facilityId": "uuid",
      "facility": {
        "id": "uuid",
        "name": "Main Hospital",
        "address": "123 Medical St"
      },
      "_count": {
        "bookings": 5
      }
    }
  ]
}
```

---

#### 2. Get Chamber Details
```http
GET /api/chambers/:id
```

**Response:**
```json
{
  "success": true,
  "chamber": {
    "id": "uuid",
    "name": "Room 101",
    "floor": 1,
    "type": "Consultation",
    "status": "available",
    "capacity": 2,
    "equipment": ["ECG", "BP Monitor"],
    "facility": { /* full facility details */ },
    "bookings": [ /* upcoming bookings */ ],
    "schedules": [ /* chamber schedule */ ],
    "maintenanceRecords": [ /* maintenance history */ ]
  }
}
```

---

#### 3. Update Chamber Status
```http
PUT /api/chambers/:id/status
```

**Request Body:**
```json
{
  "status": "maintenance"
}
```

**Valid Status Values:**
- `available` - Ready for use
- `occupied` - Currently in use
- `maintenance` - Under repair
- `cleaning` - Being cleaned
- `reserved` - Booked ahead
- `disabled` - Not in use

**Response:**
```json
{
  "success": true,
  "message": "Chamber status updated",
  "chamber": { /* updated chamber */ }
}
```

---

#### 4. Check Chamber Availability
```http
GET /api/chambers/check/availability
```

**Query Parameters:**
- `facilityId` (required): Facility UUID
- `startTime` (required): ISO 8601 datetime
- `endTime` (required): ISO 8601 datetime
- `type` (optional): Chamber type filter
- `floor` (optional): Floor number filter
- `equipment` (optional): Comma-separated equipment list

**Example:**
```http
GET /api/chambers/check/availability?facilityId=uuid&startTime=2026-01-30T14:00:00Z&endTime=2026-01-30T15:00:00Z&type=Consultation&equipment=ECG,BP Monitor
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "chambers": [
    {
      "id": "uuid",
      "name": "Room 101",
      "floor": 1,
      "type": "Consultation",
      "equipment": ["ECG", "BP Monitor", "X-Ray Viewer"]
    }
  ]
}
```

---

#### 5. Get Chamber Utilization
```http
GET /api/chambers/:id/utilization?date=2026-01-30
```

**Response:**
```json
{
  "success": true,
  "utilization": {
    "date": "2026-01-30",
    "totalBookings": 6,
    "totalMinutesOccupied": 360,
    "totalMinutesAvailable": 480,
    "occupancyRate": 75.0,
    "averageBookingDuration": 60
  }
}
```

---

#### 6. Schedule Maintenance
```http
POST /api/chambers/maintenance
```

**Request Body:**
```json
{
  "chamberId": "uuid",
  "type": "cleaning",
  "scheduledAt": "2026-01-31T08:00:00Z",
  "notes": "Deep cleaning required",
  "assignedTo": "user-uuid"
}
```

**Valid Maintenance Types:**
- `cleaning`
- `repair`
- `inspection`

**Response:**
```json
{
  "success": true,
  "message": "Maintenance scheduled",
  "maintenance": {
    "id": "uuid",
    "chamberId": "uuid",
    "type": "cleaning",
    "status": "scheduled",
    "scheduledAt": "2026-01-31T08:00:00Z"
  }
}
```

---

#### 7. Complete Maintenance
```http
PUT /api/chambers/maintenance/:id/complete
```

**Response:**
```json
{
  "success": true,
  "message": "Maintenance completed",
  "maintenance": {
    "id": "uuid",
    "status": "completed",
    "completedAt": "2026-01-31T10:00:00Z"
  }
}
```

---

### Booking Management

#### 1. List All Bookings
```http
GET /api/bookings
```

**Query Parameters:**
- `facilityId` (optional): Filter by facility
- `patientId` (optional): Filter by patient
- `doctorId` (optional): Filter by doctor
- `chamberId` (optional): Filter by chamber
- `status` (optional): Filter by status
- `startDate` (optional): Filter from date
- `endDate` (optional): Filter to date

**Response:**
```json
{
  "success": true,
  "count": 10,
  "bookings": [
    {
      "id": "uuid",
      "bookingDate": "2026-01-30",
      "startTime": "2026-01-30T14:00:00Z",
      "endTime": "2026-01-30T15:00:00Z",
      "duration": 60,
      "serviceType": "Consultation",
      "status": "confirmed",
      "paymentStatus": "paid",
      "patient": {
        "firstName": "John",
        "lastName": "Smith",
        "email": "john@example.com",
        "phone": "+1234567890"
      },
      "doctor": {
        "firstName": "Dr. Sarah",
        "lastName": "Chen",
        "specialty": "Cardiology"
      },
      "chamber": {
        "name": "Room 101",
        "floor": 1,
        "type": "Consultation"
      },
      "facility": {
        "name": "Main Hospital"
      }
    }
  ]
}
```

---

#### 2. Create New Booking
```http
POST /api/bookings
```

**Request Body:**
```json
{
  "patientId": "uuid",
  "doctorId": "uuid",
  "facilityId": "uuid",
  "bookingDate": "2026-01-30T00:00:00Z",
  "startTime": "2026-01-30T14:00:00Z",
  "duration": 60,
  "serviceType": "Consultation",
  "notes": "Patient requires wheelchair access",
  "chamberId": "uuid",
  "equipmentNeeded": ["ECG", "BP Monitor"],
  "patientMobility": "low"
}
```

**Notes:**
- `chamberId` is optional - if not provided, the system will use **smart chamber assignment**
- `duration` is in minutes (min: 15, max: 480)
- `patientMobility` options: `high`, `medium`, `low`

**Response:**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "booking": {
    "id": "uuid",
    "startTime": "2026-01-30T14:00:00Z",
    "endTime": "2026-01-30T15:00:00Z",
    "status": "pending",
    "chamber": {
      "name": "Room 101",
      "floor": 1
    }
  }
}
```

---

#### 3. Get Booking Details
```http
GET /api/bookings/:id
```

**Response:**
```json
{
  "success": true,
  "booking": {
    "id": "uuid",
    "patient": { /* full patient details */ },
    "doctor": { /* full doctor details */ },
    "chamber": { /* full chamber details */ },
    "facility": { /* full facility details */ },
    "creator": {
      "firstName": "Admin",
      "lastName": "User",
      "email": "admin@hospital.com"
    }
  }
}
```

---

#### 4. Update Booking
```http
PUT /api/bookings/:id
```

**Request Body:**
```json
{
  "startTime": "2026-01-30T15:00:00Z",
  "duration": 90,
  "chamberId": "uuid",
  "status": "confirmed",
  "notes": "Updated notes",
  "paymentStatus": "paid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking updated successfully",
  "booking": { /* updated booking */ }
}
```

---

#### 5. Cancel Booking
```http
DELETE /api/bookings/:id
```

**Request Body:**
```json
{
  "reason": "Patient requested cancellation"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "booking": {
    "id": "uuid",
    "status": "cancelled",
    "cancelledAt": "2026-01-30T12:00:00Z"
  }
}
```

---

#### 6. Confirm Booking
```http
POST /api/bookings/:id/confirm
```

**Response:**
```json
{
  "success": true,
  "message": "Booking confirmed successfully",
  "booking": {
    "id": "uuid",
    "status": "confirmed"
  }
}
```

---

#### 7. Complete Booking
```http
POST /api/bookings/:id/complete
```

**Response:**
```json
{
  "success": true,
  "message": "Booking completed successfully",
  "booking": {
    "id": "uuid",
    "status": "completed"
  }
}
```

---

#### 8. Check for Conflicts
```http
GET /api/bookings/check/conflicts
```

**Query Parameters:**
- `doctorId` (required): Doctor UUID
- `startTime` (required): ISO 8601 datetime
- `endTime` (required): ISO 8601 datetime
- `excludeBookingId` (optional): Exclude a specific booking

**Response:**
```json
{
  "success": true,
  "hasConflicts": true,
  "count": 1,
  "conflicts": [
    {
      "id": "uuid",
      "startTime": "2026-01-30T14:30:00Z",
      "endTime": "2026-01-30T15:30:00Z",
      "patient": {
        "firstName": "Jane",
        "lastName": "Doe"
      },
      "chamber": {
        "name": "Room 102"
      }
    }
  ]
}
```

---

### Schedule Management

#### 1. Get Daily Schedule
```http
GET /api/schedule/daily?facilityId=uuid&date=2026-01-30
```

**Response:**
```json
{
  "success": true,
  "date": "2026-01-30",
  "count": 8,
  "bookings": [ /* array of bookings */ ]
}
```

---

#### 2. Get Weekly Schedule
```http
GET /api/schedule/weekly?facilityId=uuid&startDate=2026-01-27
```

**Response:**
```json
{
  "success": true,
  "startDate": "2026-01-27",
  "count": 45,
  "bookings": [ /* array of bookings */ ]
}
```

---

#### 3. Get Doctor's Schedule
```http
GET /api/schedule/doctor/:id?startDate=2026-01-30&endDate=2026-02-06
```

**Response:**
```json
{
  "success": true,
  "doctorId": "uuid",
  "startDate": "2026-01-30",
  "endDate": "2026-02-06",
  "count": 12,
  "bookings": [ /* array of bookings */ ]
}
```

---

#### 4. Get Chamber Schedule
```http
GET /api/schedule/chamber/:id?startDate=2026-01-30&endDate=2026-02-06
```

**Response:**
```json
{
  "success": true,
  "chamberId": "uuid",
  "startDate": "2026-01-30",
  "endDate": "2026-02-06",
  "count": 15,
  "bookings": [ /* array of bookings */ ]
}
```

---

## 🎯 Smart Chamber Assignment Algorithm

When creating a booking without specifying a `chamberId`, the system automatically assigns the optimal chamber based on:

### Scoring Factors:

1. **Service Type Match** (+30 points)
   - Chamber type matches booking service type

2. **Equipment Match** (+25 points per item)
   - Chamber has all required equipment

3. **Doctor Preference** (+20 points)
   - Doctor's preferred chambers

4. **Patient Mobility** (-10 points per floor for low mobility)
   - Prioritizes ground floor for patients with mobility issues

5. **Usage Distribution** (-5 points per booking today)
   - Balances chamber usage across facility

### Example:
```javascript
// Request
POST /api/bookings
{
  "serviceType": "Consultation",
  "equipmentNeeded": ["ECG", "BP Monitor"],
  "patientMobility": "low",
  "duration": 60
}

// System automatically selects:
// Room 101 (Floor 1, Score: 145)
// - Service type match: +30
// - Has ECG: +25
// - Has BP Monitor: +25
// - Ground floor (low mobility): +0
// - Used 3 times today: -15
// Total: 145 points
```

---

## 📊 Status Values

### Chamber Status
- `available` - Ready for bookings
- `occupied` - Currently in use
- `reserved` - Booked for future appointment
- `maintenance` - Under repair/inspection
- `cleaning` - Being sanitized
- `disabled` - Temporarily out of service

### Booking Status
- `pending` - Awaiting confirmation
- `confirmed` - Confirmed appointment
- `cancelled` - Cancelled by patient/staff
- `completed` - Appointment finished

### Payment Status
- `pending` - Payment not received
- `paid` - Fully paid
- `partial` - Partially paid
- `refunded` - Payment refunded

---

## 🔧 Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": [ /* validation errors if applicable */ ]
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `404` - Not Found
- `500` - Internal Server Error

---

## 🚀 Usage Examples

### Example 1: Create Booking with Smart Assignment
```bash
curl -X POST http://localhost:3001/api/bookings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "patient-uuid",
    "doctorId": "doctor-uuid",
    "facilityId": "facility-uuid",
    "bookingDate": "2026-01-30T00:00:00Z",
    "startTime": "2026-01-30T14:00:00Z",
    "duration": 60,
    "serviceType": "Consultation",
    "equipmentNeeded": ["ECG"],
    "patientMobility": "low"
  }'
```

### Example 2: Check Chamber Availability
```bash
curl -X GET "http://localhost:3001/api/chambers/check/availability?facilityId=uuid&startTime=2026-01-30T14:00:00Z&endTime=2026-01-30T15:00:00Z&type=Consultation" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Example 3: Get Daily Schedule
```bash
curl -X GET "http://localhost:3001/api/schedule/daily?facilityId=uuid&date=2026-01-30" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Example 4: Update Chamber Status
```bash
curl -X PUT http://localhost:3001/api/chambers/chamber-uuid/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "maintenance"}'
```

---

## 📝 Integration Notes

### Frontend Integration
1. **Calendar View**: Use `/api/schedule/daily` and `/api/schedule/weekly`
2. **Chamber Map**: Use `/api/chambers` with floor filtering
3. **Booking Form**: Use `/api/chambers/check/availability` before submission
4. **Real-time Updates**: Poll `/api/chambers/:id` for status changes

### Mobile App Integration
1. **Patient Bookings**: Filter `/api/bookings` by `patientId`
2. **Check-in**: Use `/api/bookings/:id/confirm`
3. **Reschedule**: Update via `/api/bookings/:id`

### Notification Triggers
- Booking created → Send confirmation email/SMS
- Booking confirmed → Send reminder 24h before
- Chamber status changed → Notify facility staff
- Maintenance scheduled → Alert maintenance team

---

## 🎯 Best Practices

1. **Always check availability** before creating bookings
2. **Use smart assignment** when chamber preference doesn't matter
3. **Check for conflicts** when updating doctor schedules
4. **Monitor utilization** to optimize chamber usage
5. **Schedule maintenance** during low-traffic periods
6. **Confirm bookings** as soon as payment is received

---

## 📞 Support

For API issues or questions:
- Email: dev@advanciapayledger.com
- Documentation: https://docs.advanciapayledger.com
- Status: https://status.advanciapayledger.com

---

**Version**: 1.0.0  
**Last Updated**: January 30, 2026  
**API Base URL**: `http://localhost:3001/api` (development)
