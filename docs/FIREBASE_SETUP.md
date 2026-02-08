# Firebase Setup Guide for NamSev

## 🔥 Quick Fix

Your `.env` file has been created at `/backend/.env`. You need to add your Firebase credentials.

---

## 📋 Step-by-Step Setup

### Step 1: Get Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (or create a new one)
3. Click the **gear icon** ⚙️ next to "Project Overview"
4. Select **"Project settings"**
5. Go to **"Service accounts"** tab
6. Click **"Generate new private key"** button
7. Click **"Generate key"** in the dialog
8. A JSON file will download

### Step 2: Configure Firebase

You have **3 options** to configure Firebase:

#### ✅ Option 1: Individual Environment Variables (RECOMMENDED)

Open the downloaded JSON file and copy these values to your `.env`:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
```

**Important:** 
- Keep the quotes around FIREBASE_PRIVATE_KEY
- Keep the `\n` characters in the private key
- Don't remove line breaks

#### Option 2: JSON File (Easy for Local Development)

1. Rename the downloaded file to `firebase-service-account.json`
2. Move it to `/backend/src/config/`
3. No `.env` changes needed!

#### Option 3: Full JSON String (For Deployment)

Copy the entire content of the downloaded JSON file into one line:

```env
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}
```

---

## 🎯 Example .env Configuration

Here's what your `.env` should look like with real values:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/namsev_db

# Firebase - Option 1 (Individual fields)
FIREBASE_PROJECT_ID=namsev-tirupur
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-abc123@namsev-tirupur.iam.gserviceaccount.com

# Admin
ADMIN_EMAIL=panchayat.office@gmail.com

# Translation (Optional)
GOOGLE_TRANSLATE_API_KEY=AIzaSyAbc123...
```

---

## 🔧 Troubleshooting

### Error: "Firebase credentials not found"

**Problem:** Environment variables are not being read.

**Solutions:**

1. **Check .env file location:** Must be in `/backend/.env` (not `/backend/src/.env`)

2. **Restart the server:** Changes to `.env` require restart
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

3. **Check for typos:** Variable names are case-sensitive
   - ✅ `FIREBASE_PROJECT_ID`
   - ❌ `firebase_project_id`

4. **Verify quotes:** Private key must have quotes
   ```env
   # ✅ Correct
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   
   # ❌ Wrong
   FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...
   ```

### Error: "Invalid token"

**Problem:** Private key formatting issue.

**Solution:** Make sure `\n` characters are present in the private key:

```env
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQI...\n-----END PRIVATE KEY-----\n"
```

### Error: "Token verification will fail"

This warning appears when Firebase starts without credentials but **won't crash the server**. Some features requiring authentication will not work.

---

## 🚀 Quick Start (After Configuration)

1. Save your `.env` file with Firebase credentials
2. Restart the backend:
   ```bash
   cd backend
   npm run dev
   ```
3. Look for this message:
   ```
   ✅ Firebase Admin SDK initialized from individual env vars
   ```
   or
   ```
   ✅ Firebase Admin SDK initialized from local file
   ```

---

## 🔐 Security Notes

- ⚠️ **Never commit** `.env` or `firebase-service-account.json` to Git
- ✅ `.env` is already in `.gitignore`
- 🔒 Treat these credentials like passwords
- 🌐 For production, use platform-specific secret management (Vercel secrets, Render environment variables, etc.)

---

## 📞 Still Having Issues?

If you still see the error after configuration:

1. Verify MongoDB is running: `mongod --version`
2. Check all environment variables are set: `echo $FIREBASE_PROJECT_ID`
3. Check the `.env` file has no extra spaces or quotes
4. Try Option 2 (JSON file) instead - it's simpler for local development

---

## ✅ Verification

After setup, you should see:

```
✅ MongoDB connected
✅ Firebase Admin SDK initialized from individual env vars
✅ Phase 4: Enrichment service loaded
✅ Phase 4: Semantic duplicate service loaded
✅ Phase 4: Summarization service loaded
✅ Phase 5: Evaluation service loaded
✅ Phase 5: Feedback service loaded
✅ Phase 5: Dashboard service loaded
✅ Phase 5: Demo service loaded
✅ Phase 5: Drift service loaded
✅ Server running on port 5000
```

No more `❌ Firebase credentials not found!` error!

