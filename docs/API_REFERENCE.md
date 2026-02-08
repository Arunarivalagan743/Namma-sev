# NamSev API Reference

**Version:** 1.0.0  
**Base URL:** `/api`  
**Last Updated:** February 8, 2026

---

## Authentication

All protected endpoints require a Firebase JWT token in the Authorization header:

```
Authorization: Bearer <firebase-jwt-token>
```

---

## 1. Authentication Endpoints

### POST /api/auth/register
Register a new user profile.

**Body:**
```json
{
  "name": "string",
  "phone": "string",
  "address": "string",
  "aadhaarLast4": "string (4 digits)"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Registration successful",
  "user": { ... }
}
```

### GET /api/auth/me
Get current user profile.

**Auth:** Required

**Response:** `200 OK`
```json
{
  "isRegistered": true,
  "isAdmin": false,
  "user": { ... }
}
```

### GET /api/auth/verify
Verify token validity.

**Auth:** Required

**Response:** `200 OK`
```json
{
  "valid": true,
  "user": { ... }
}
```

---

## 2. Complaint Endpoints

### POST /api/complaints
Submit a new complaint.

**Auth:** Required (Approved user)

**Body:**
```json
{
  "title": "string",
  "description": "string",
  "category": "string",
  "location": "string (optional)",
  "images": ["string (optional)"]
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "complaint": {
    "trackingId": "CMP-XXXXXX",
    ...
  }
}
```

### GET /api/complaints/my-complaints
Get current user's complaints.

**Auth:** Required

**Response:** `200 OK`
```json
{
  "complaints": [...]
}
```

### GET /api/complaints/:id
Get complaint details.

**Auth:** Required

**Response:** `200 OK`
```json
{
  "complaint": { ... }
}
```

### GET /api/complaints/:id/summary
Get AI-generated complaint summary.

**Auth:** Required

**Response:** `200 OK`
```json
{
  "summary": {
    "timeline": [...],
    "keyActions": [...],
    "statusSummary": "string"
  }
}
```

### POST /api/complaints/preview/enrich
Preview context enrichment suggestions.

**Auth:** Required

**Body:**
```json
{
  "title": "string",
  "description": "string",
  "category": "string"
}
```

**Response:** `200 OK`
```json
{
  "completenessScore": 75,
  "suggestions": [...],
  "missingContext": [...]
}
```

### POST /api/complaints/preview/duplicates
Check for potential duplicates.

**Auth:** Required

**Body:**
```json
{
  "title": "string",
  "description": "string",
  "category": "string"
}
```

**Response:** `200 OK`
```json
{
  "duplicates": [...],
  "highestSimilarity": 0.85
}
```

### POST /api/complaints/ai-feedback
Submit feedback on AI suggestions.

**Auth:** Required

**Body:**
```json
{
  "complaintId": "string",
  "service": "enrichment|duplicate|classification",
  "rating": "helpful|not_helpful",
  "reason": "string (optional)"
}
```

---

## 3. Announcement Endpoints

### GET /api/announcements
Get all active announcements.

**Auth:** Optional

**Response:** `200 OK`
```json
{
  "announcements": [...]
}
```

### GET /api/announcements/:id
Get announcement details.

**Response:** `200 OK`
```json
{
  "announcement": { ... }
}
```

---

## 4. Engagement Endpoints

### GET /api/engagement/home
Get homepage aggregate data.

**Response:** `200 OK`
```json
{
  "announcements": [...],
  "news": [...],
  "alerts": [...],
  "upcomingMeetings": [...],
  "upcomingEvents": [...]
}
```

### GET /api/engagement/meetings
Get gram sabha meetings.

### GET /api/engagement/schemes
Get government schemes.

### GET /api/engagement/polls
Get active polls.

### GET /api/engagement/events
Get community events.

### GET /api/engagement/works
Get panchayat works.

### GET /api/engagement/budget
Get budget information.

### GET /api/engagement/faqs
Get FAQs.

### GET /api/engagement/suggestions
Get public suggestions.

### POST /api/engagement/meetings/:id/rsvp
RSVP to a meeting.

**Auth:** Required (Approved user)

### POST /api/engagement/polls/:id/vote
Vote on a poll.

**Auth:** Required (Approved user)

### POST /api/engagement/suggestions
Create a suggestion.

**Auth:** Required (Approved user)

---

## 5. Translation Endpoints

### GET /api/translate/languages
Get supported languages.

**Response:** `200 OK`
```json
{
  "languages": [
    { "code": "en", "name": "English" },
    { "code": "ta", "name": "Tamil" },
    ...
  ]
}
```

### POST /api/translate/translate
Translate text.

**Body:**
```json
{
  "text": "string",
  "targetLanguage": "ta|hi|te|kn|ml"
}
```

### POST /api/translate/batch
Batch translate multiple texts.

---

## 6. Admin Endpoints

All admin endpoints require admin role.

### GET /api/admin/dashboard
Get dashboard statistics.

### GET /api/admin/users
Get all users.

### GET /api/admin/users/pending
Get pending approval users.

### PUT /api/admin/users/:id/approve
Approve a user.

### PUT /api/admin/users/:id/reject
Reject a user.

### GET /api/admin/complaints
Get all complaints.

### PUT /api/admin/complaints/:id/status
Update complaint status.

**Body:**
```json
{
  "status": "pending|in-progress|resolved|rejected",
  "remarks": "string"
}
```

---

## 7. Admin AI Endpoints

### GET /api/admin/ai/overview
Get AI system overview.

### GET /api/admin/ai/metrics
Get AI metrics.

### GET /api/admin/ai/quality/dashboard
Get AI quality dashboard.

### GET /api/admin/ai/quality/health
Get AI health status.

### GET /api/admin/ai/drift/status
Get drift detection status.

### GET /api/admin/ai/drift/alerts
Get active drift alerts.

### POST /api/admin/ai/demo/generate
Generate synthetic test data.

### POST /api/admin/ai/demo/stress
Run stress test.

---

## 8. System Endpoints

### GET /api/health
Health check endpoint.

**Response:** `200 OK`
```json
{
  "status": "OK",
  "message": "NamSev Backend is running"
}
```

### GET /api/admin/system/health
Detailed system health.

**Auth:** Admin required

### GET /api/admin/system/metrics
System metrics.

**Auth:** Admin required

### GET /api/admin/system/queues
Queue status.

**Auth:** Admin required

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation error",
  "details": [...]
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Not found",
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Rate Limits

- General: 100 requests/minute
- AI endpoints: 30 requests/minute
- Translation: 50 requests/minute

---

## Complaint Categories

1. Road & Infrastructure
2. Water Supply
3. Electricity
4. Sanitation
5. Street Lights
6. Drainage
7. Public Health
8. Encroachment
9. Noise Pollution
10. Other

---

## Complaint Statuses

| Status | Description |
|--------|-------------|
| pending | Newly submitted |
| in-progress | Being worked on |
| resolved | Issue fixed |
| rejected | Cannot be addressed |

