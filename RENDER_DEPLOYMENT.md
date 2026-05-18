# Render Deployment Guide for Billing Software Backend

## Step 1: Get Your Firebase Credentials

1. Go to: https://console.firebase.google.com/project/billing--software/settings/serviceaccounts/adminsdk
2. Click "Generate New Private Key"
3. Download the JSON file
4. Open it and keep the values ready (you'll need them below)

## Step 2: Push Backend to GitHub

```bash
# From project root
cd backend
git init
git add .
git commit -m "Initial backend commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/billing-backend.git
git push -u origin main
```

## Step 3: Create Render Account & Deploy

1. Go to: https://render.com
2. Click "Get Started" or "Sign In"
3. Sign up with GitHub (recommended) or Google
4. Create new Web Service:
   - **Name:** billing-software-api
   - **Root Directory:** backend
   - **Build Command:** npm install
   - **Start Command:** npm start
   - **Instance Type:** Free

5. Add Environment Variables:
   - `FIREBASE_PROJECT_ID`: billing--software
   - `FIREBASE_PRIVATE_KEY`: (paste your private key with \n for newlines)
   - `FIREBASE_CLIENT_EMAIL`: (from your JSON file)
   - `FIREBASE_DATABASE_URL`: https://billing--software-default-rtdb.firebaseio.com/
   - `JWT_SECRET`: your-secret-key-here

6. Click Deploy

## Step 4: Get Your Backend URL

After deployment completes, you'll get a URL like:
`https://billing-software-api.onrender.com`

## Step 5: Update Frontend

Update your frontend to use this URL:

```bash
# Create .env.production in frontend directory
VITE_API_URL=https://YOUR-BACKEND-URL/api
```

## Step 6: Rebuild & Redeploy Frontend

```bash
cd frontend
npm run build
firebase deploy --only hosting
```

---

## ⚠️ Important Notes

- Free tier on Render will spin down after 15 minutes of inactivity (slow first request)
- Firebase credentials must be kept secret - never commit to GitHub
- Use Render's environment variables for sensitive data
- Your app will be at: https://mmkbills.web.app

---

## Quick Setup (If You Have GitHub)

If your code is already on GitHub, just:

1. Go to https://render.com/dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select the repo
5. Configure as above
6. Deploy
