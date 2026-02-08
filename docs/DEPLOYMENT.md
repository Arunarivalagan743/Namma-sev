# NamSev Deployment Guide

**Version:** 1.0.0  
**Last Updated:** February 8, 2026

---

## Overview

This guide covers deploying NamSev to production environments. The system is designed for Vercel deployment but can be adapted for other platforms.

---

## Prerequisites

- Node.js 18+
- MongoDB Atlas account
- Firebase project
- Vercel account (for production)

---

## 1. Environment Setup

### 1.1 Backend Environment Variables

Create `/backend/.env`:

```env
# Server
PORT=5000
NODE_ENV=production

# MongoDB Atlas
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/namsev?retryWrites=true&w=majority

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# Admin Configuration
ADMIN_EMAIL=admin@yourpanchayat.gov.in

# Google Translate (Optional)
GOOGLE_TRANSLATE_API_KEY=your-api-key

# Logging
LOG_LEVEL=INFO
```

### 1.2 Frontend Environment Variables

Create `/frontend/.env`:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef

VITE_API_URL=https://your-backend.vercel.app/api
VITE_ADMIN_EMAIL=admin@yourpanchayat.gov.in
VITE_PANCHAYAT_NAME=Your Panchayat Name
VITE_PANCHAYAT_CODE=PNCH001
```

---

## 2. MongoDB Atlas Setup

### 2.1 Create Cluster

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a new cluster (M0 free tier is sufficient for testing)
3. Create database user with read/write permissions
4. Whitelist IP addresses (0.0.0.0/0 for Vercel)

### 2.2 Get Connection String

1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your database user password

---

## 3. Firebase Setup

### 3.1 Create Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create new project
3. Enable Email/Password authentication

### 3.2 Get Frontend Config

1. Project Settings → General → Your apps
2. Add web app
3. Copy the firebaseConfig values

### 3.3 Get Backend Service Account

1. Project Settings → Service accounts
2. Generate new private key
3. Use values for environment variables

---

## 4. Local Development

### 4.1 Backend

```bash
cd backend
npm install
npm run dev
```

Expected output:
```
✅ Firebase Admin SDK initialized
✅ MongoDB Database connected
✅ Server running on port 5000
```

### 4.2 Frontend

```bash
cd frontend
npm install
npm run dev
```

Access at: http://localhost:5173

---

## 5. Vercel Deployment

### 5.1 Backend Deployment

1. Push code to GitHub
2. Import repository in Vercel
3. Set root directory: `backend`
4. Add environment variables
5. Deploy

**vercel.json** (already configured):
```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/server.js"
    }
  ]
}
```

### 5.2 Frontend Deployment

1. Import repository in Vercel
2. Set root directory: `frontend`
3. Add environment variables
4. Deploy

---

## 6. Post-Deployment Checklist

### 6.1 Verify Health

```bash
curl https://your-backend.vercel.app/api/health
```

Expected:
```json
{
  "status": "OK",
  "message": "NamSev Backend is running"
}
```

### 6.2 Verify Database Connection

Check Vercel logs for:
```
✅ MongoDB Database connected successfully
📦 Database: namsev
```

### 6.3 Verify Firebase

Register a test user and verify:
- Firebase Authentication shows new user
- MongoDB has user record

### 6.4 Create Admin Account

1. Register with the ADMIN_EMAIL address
2. User automatically gets admin role

---

## 7. Monitoring

### 7.1 Vercel Dashboard

- Monitor function invocations
- Check error rates
- View logs

### 7.2 MongoDB Atlas

- Monitor connections
- Check database size
- Review slow queries

### 7.3 Application Health

```bash
# System health
curl https://your-backend.vercel.app/api/admin/system/health

# AI health (requires admin token)
curl -H "Authorization: Bearer <token>" \
  https://your-backend.vercel.app/api/admin/ai/quality/health
```

---

## 8. Scaling Considerations

### 8.1 Database

- Upgrade MongoDB Atlas tier as needed
- Add indexes for frequently queried fields
- Enable profiling for slow queries

### 8.2 Vercel

- Monitor function cold starts
- Consider Pro plan for longer execution times
- Enable Edge functions if needed

### 8.3 Caching

- L1 cache is per-instance (resets on cold start)
- L2 cache persists in MongoDB
- Consider Redis for high-traffic scenarios

---

## 9. Backup & Recovery

### 9.1 MongoDB Backup

- Enable automatic backups in Atlas
- Test restoration periodically
- Keep connection string secure

### 9.2 Environment Variables

- Keep secure copy of all environment variables
- Document all configuration changes

---

## 10. Security Checklist

- [ ] Environment variables not in code
- [ ] Firebase rules configured
- [ ] MongoDB IP whitelist set
- [ ] HTTPS enforced
- [ ] CORS configured correctly
- [ ] Admin email configured
- [ ] Rate limiting enabled

---

## 11. Troubleshooting

### Database Connection Failed

1. Check MONGODB_URI format
2. Verify IP whitelist in Atlas
3. Check database user credentials

### Firebase Auth Failed

1. Verify Firebase project ID
2. Check private key format (escape \n)
3. Verify client email

### CORS Errors

1. Check frontend URL in backend CORS config
2. Verify VITE_API_URL in frontend

### Cold Start Issues

1. Check warmup module initialization
2. Verify database connection caching
3. Review Vercel function logs

---

## References

- [Operations Guide](./OPERATIONS.md)
- [Architecture](./ARCHITECTURE.md)
- [Troubleshooting](./troubleshooting/)

