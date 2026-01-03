
# NamSev - Tirupur Panchayat Civic Engagement Platform

A comprehensive civic engagement platform designed exclusively for verified residents of Tirupur Panchayat. This platform enables citizens to submit complaints, track their resolution status, and stay updated with local announcements.

## Features

### For Citizens
- **User Registration** - Register with Aadhaar verification (last 4 digits)
- **Complaint Submission** - Submit complaints across 10 categories
- **Real-time Tracking** - Track complaint status with unique tracking ID
- **Announcements** - View priority-based local announcements
- **Profile Management** - View and update personal information

### For Admin (Panchayat Office)
- **User Management** - Approve or reject citizen registrations
- **Complaint Management** - Update complaint status with remarks
- **Announcements** - Create, edit, and delete public announcements
- **Analytics Dashboard** - View complaint trends and resolution rates

## Tech Stack

### Frontend
- React 18 with Vite
- Tailwind CSS for styling
- React Router DOM for navigation
- Firebase Authentication (Email/Password)
- React Icons for iconography
- React Hot Toast for notifications
- Axios for API requests

### Backend
- Node.js with Express.js
- MySQL database
- Firebase Admin SDK for token verification
- CORS enabled for cross-origin requests

## Project Structure

```
NammaTirupur/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── auth/
│   │   │       ├── ProtectedRoute.jsx
│   │   │       └── AdminRoute.jsx
│   │   ├── config/
│   │   │   └── firebase.js
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── layouts/
│   │   │   ├── PublicLayout.jsx
│   │   │   ├── DashboardLayout.jsx
│   │   │   └── AdminLayout.jsx
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.jsx
│   │   │   │   └── RegisterPage.jsx
│   │   │   ├── status/
│   │   │   │   └── PendingApproval.jsx
│   │   │   ├── citizen/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── MyComplaints.jsx
│   │   │   │   ├── NewComplaint.jsx
│   │   │   │   ├── Announcements.jsx
│   │   │   │   └── Profile.jsx
│   │   │   └── admin/
│   │   │       ├── Dashboard.jsx
│   │   │       ├── ManageUsers.jsx
│   │   │       ├── ManageComplaints.jsx
│   │   │       ├── ManageAnnouncements.jsx
│   │   │       └── Analytics.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── complaint.service.js
│   │   │   ├── announcement.service.js
│   │   │   └── admin.service.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   └── firebase.js
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── user.controller.js
│   │   │   ├── complaint.controller.js
│   │   │   ├── announcement.controller.js
│   │   │   └── admin.controller.js
│   │   ├── middleware/
│   │   │   └── auth.middleware.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── user.routes.js
│   │   │   ├── complaint.routes.js
│   │   │   ├── announcement.routes.js
│   │   │   └── admin.routes.js
│   │   └── server.js
│   ├── database/
│   │   └── schema.sql
│   ├── .env.example
│   └── package.json
└── README.md
```

## Prerequisites

- Node.js 18 or higher
- MySQL 8.0 or higher
- Firebase project with Authentication enabled

## Setup Instructions

### 1. Clone the Repository

```bash
cd NammaTirupur
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project (or use existing)
3. Enable **Email/Password** authentication
4. Generate a service account key (Project Settings > Service Accounts)
5. Download and save as `firebase-service-account.json` in `backend/`

### 3. Database Setup

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE namsev_db;

# Run the schema
USE namsev_db;
SOURCE backend/database/schema.sql;
```

### 4. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Edit .env with your values:
# - DB_HOST=localhost
# - DB_USER=root
# - DB_PASSWORD=your_password
# - DB_NAME=namsev_db
# - FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json

# Start the server
npm run dev
```

### 5. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Edit .env with your Firebase config:
# - VITE_FIREBASE_API_KEY=
# - VITE_FIREBASE_AUTH_DOMAIN=
# - VITE_FIREBASE_PROJECT_ID=
# - VITE_FIREBASE_STORAGE_BUCKET=
# - VITE_FIREBASE_MESSAGING_SENDER_ID=
# - VITE_FIREBASE_APP_ID=
# - VITE_API_URL=http://localhost:5000/api

# Start the development server
npm run dev
```

## Environment Variables

### Backend (.env)

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 5000) |
| `DB_HOST` | MySQL host |
| `DB_USER` | MySQL username |
| `DB_PASSWORD` | MySQL password |
| `DB_NAME` | Database name |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Path to Firebase service account JSON |
| `NODE_ENV` | Environment (development/production) |

### Frontend (.env)

| Variable | Description |
|----------|-------------|
| `VITE_FIREBASE_API_KEY` | Firebase API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase App ID |
| `VITE_API_URL` | Backend API URL |

## Default Admin Account

The admin account is hardcoded for security:
- **Email:** panchayat.office@gmail.com
- **Panchayat Code:** TIRU001

To set up the admin account:
1. Register using the admin email above
2. The system will automatically assign admin role
3. Login to access the admin dashboard

## Complaint Categories

1. Road & Infrastructure
2. Water Supply
3. Drainage & Sewage
4. Street Lighting
5. Waste Management
6. Public Health
7. Public Property
8. Encroachment
9. Noise Pollution
10. Others

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify token

### User
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update profile

### Complaints
- `POST /api/complaints` - Submit new complaint
- `GET /api/complaints` - Get user's complaints
- `GET /api/complaints/:id` - Get complaint details

### Announcements
- `GET /api/announcements` - Get all announcements

### Admin
- `GET /api/admin/dashboard/stats` - Dashboard statistics
- `GET /api/admin/users/pending` - Get pending users
- `POST /api/admin/users/:id/approve` - Approve user
- `POST /api/admin/users/:id/reject` - Reject user
- `GET /api/admin/complaints` - Get all complaints
- `PUT /api/admin/complaints/:id/status` - Update status
- `GET /api/admin/analytics` - Get analytics data
- `POST /api/admin/announcements` - Create announcement
- `PUT /api/admin/announcements/:id` - Update announcement
- `DELETE /api/admin/announcements/:id` - Delete announcement

## Security Features

- Firebase ID token verification
- Role-based access control (RBAC)
- User approval workflow
- Aadhaar last 4 digits verification
- Protected API routes
- CORS configuration

## UI Design

- Light theme only
- Government-style professional interface
- Color scheme:
  - Primary: Navy Blue (#1a365d)
  - Accent: Gold (#c5a572)
  - Background: Cream (#faf9f7)
- Font: Poppins
- No gradients or flashy animations
- Clean and minimal design

## Running in Production

### Backend
```bash
cd backend
npm start
```

### Frontend
```bash
cd frontend
npm run build
npm run preview
```

## License

This project is developed for Tirupur Panchayat civic engagement purposes.

---

**NamSev** - Empowering Citizens, Serving Communities

Frontend Requirements:

Use React with Vite for the frontend.

Use Tailwind CSS for styling.

Integrate Firebase Authentication (Email & Password only).

Use React Icons for all icons.

Use Poppins (sans-serif) as the primary font across the app.

UI must be:

Light themed only

Clean, minimal, and aesthetic

Government-style professional interface

No gradients

No emojis

No flashy animations

Focus on clarity, accessibility, and professionalism.

Frontend Features:

User registration and login using Firebase Authentication.

Role-based routing:

Citizen user dashboard

Admin dashboard (admin access only for a fixed email).

Citizen features:

Report local issues (category, description, location, optional image).

View complaint status (Pending, In Progress, Completed).

View Panchayat-only announcements and alerts.

Admin features:

View and manage all complaints.

Update complaint status.

Upload resolution proof.

View analytics (counts, status breakdown).

Post Panchayat announcements.

Backend Requirements:

Use Node.js with Express.js.

Use MySQL as the database.

Backend should verify Firebase ID tokens sent from the frontend.

Implement role-based authorization (Citizen vs Admin).

RESTful API design.

Backend Features:

Store users (linked with Firebase UID).

Store complaints with status tracking.

Store admin announcements.

Admin-only routes for complaint updates and analytics.

Secure APIs using Firebase token verification middleware.

Database Design:

Users table (firebase_uid, name, email, role, panchayat_id).

Complaints table (user_id, category, description, status, location, created_at).

Announcements table (title, message, created_at).

Architecture Expectations:

Frontend and backend developed in parallel.

Clear folder structure for scalability.

Clean, readable, production-style code.

Suitable for placements, real-world deployment, and future scaling to multiple Panchayats.

Deliver:

Frontend folder structure with key components.

Backend folder structure with routes, controllers, middleware.

MySQL schema.

Authentication and authorization flow.

Minimal, professional UI implementation.






1️⃣ Panchayat Announcements & Notices

Not complaints.

Admin can post:

Water supply schedule

Power cut notices

Gram Sabha meeting dates

Festival / holiday notices

Government scheme updates

User sees:

Announcement feed

Notification badge (new notice)

✔ Very realistic Panchayat feature

2️⃣ Gram Sabha / Public Meeting Module

Instead of only problems, focus on participation.

Features:

Upcoming meeting schedule

Agenda points

Previous meeting minutes (PDF)

Decisions taken

Optional:

“Will you attend?” (Yes / No)

✔ Shows democratic participation

3️⃣ Local Government Schemes Section

Many citizens don’t know schemes.

Admin can add:

Scheme name

Eligibility

Required documents

Last date

User can:

View schemes

Save/bookmark

✔ Extremely useful in villages

4️⃣ Emergency & Safety Alerts

Not complaints.

Examples:

Heavy rain warning

Flood alert

Water contamination

Road blockage

Admin triggers:

High-priority alert

Push + in-app alert

✔ Critical real-world feature

👥 COMMUNITY & ENGAGEMENT FEATURES
5️⃣ Local Polls & Surveys

Opinion collection, not complaints.

Examples:

“Best time for water supply?”

“Do we need speed breakers here?”

User:

Votes once

Sees result chart

✔ Simple but powerful governance tool

6️⃣ Public Suggestions (Non-Complaint)

Different from complaints.

User can:

Suggest improvements

“Plant trees near school”

“Need bus stop shelter”

Admin can:

Mark as “Under Review”

Approve / Reject

✔ Positive engagement, not negativity

7️⃣ Community Events & Programs

Not related to issues.

Admin posts:

Health camp

Free eye checkup

Awareness programs

Vaccination drives

User sees:

Event list

Date & location

✔ Makes app feel alive

🧾 TRANSPARENCY & INFORMATION FEATURES
8️⃣ Panchayat Works Tracker

Not complaints.

Admin adds:

Road work

Drainage work

Building construction

Shows:

Start date

Expected completion

% progress

Photos

✔ Builds trust

9️⃣ Budget & Spending Overview (Simple)

Optional, very impressive.

Show:

Total funds received

Spending categories (roads, water, sanitation)

No sensitive data needed.

✔ Transparency feature interviewers love

🧠 SMART & FUTURE-READY FEATURES
🔟 FAQ / Help Section

Reduces confusion.

Examples:

How to raise a complaint?

Who can see my details?

How long resolution takes?

✔ Improves usability