# Vercel Deployment Guide

## Environment Variables to Add in Vercel Dashboard

Go to your project settings on Vercel and add these environment variables:

### Firebase Configuration (Frontend)
```
VITE_FIREBASE_API_KEY=AIzaSyBETfLYgp7k6K36naN3fOnt4jaGVtXapvY
VITE_FIREBASE_AUTH_DOMAIN=billing--software.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=billing--software
VITE_FIREBASE_STORAGE_BUCKET=billing--software.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=957234813759
VITE_FIREBASE_APP_ID=1:957234813759:web:b1efd773702e314edc518a
VITE_FIREBASE_MEASUREMENT_ID=G-RXZ57VKK55
```

### Backend Configuration
```
FIREBASE_PROJECT_ID=billing--software
NODE_ENV=production
```

## Steps to Deploy:

1. **Connect GitHub Repository**
   - Go to Vercel Dashboard
   - Click "Add New Project"
   - Import from GitHub repository
   - Select your "Billing-Software" repository

2. **Configure Build Settings**
   - Build Command: `cd frontend && npm install && npm run build`
   - Output Directory: `frontend/dist`
   - Install Command: `npm install`

3. **Add Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add all the Firebase variables listed above

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete

5. **Test Deployment**
   - Visit your Vercel deployment URL
   - Check that frontend loads
   - Test API calls (they will route to /api endpoints)

## Troubleshooting:

- **404 Error**: Make sure vercel.json is correctly configured
- **API Errors**: Check that Firebase credentials are correct
- **Build Fails**: Check that all dependencies are in package.json files
