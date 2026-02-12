# Google Translate API Setup Guide

## How to Get Google Translate API Key

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "NEW PROJECT"
4. Enter project name: "Billing System Translation"
5. Click CREATE

### Step 2: Enable Translation API
1. In Google Cloud Console, search for "Cloud Translation API"
2. Click on it and select "ENABLE"
3. Wait for it to enable (1-2 minutes)

### Step 3: Create API Key
1. Go to "Credentials" in the left sidebar
2. Click "CREATE CREDENTIALS" → "API Key"
3. Copy the generated API key
4. Click "Restrict Key" (optional but recommended)
5. Select "Cloud Translation API" as the API

### Step 4: Add to Environment Variables
1. Open `backend/.env` file (create if doesn't exist)
2. Add this line:
   ```
   GOOGLE_TRANSLATE_API_KEY=your_api_key_here
   ```
3. Replace `your_api_key_here` with your actual API key
4. Save the file

### Step 5: Install Dependencies (if needed)
```bash
cd backend
npm install axios
```

## How Translation Works

- User adds product: "APPALAM 100G"
- System automatically translates to Tamil: "அப்பளம் 100 கிராம்"
- Translations are saved to database

## Translation Flow
1. Try Google Translate API (most accurate)
2. Fallback to MyMemory API (free, no auth needed)
3. If both fail, keep original product name

## Pricing
- Google Translate API: $20 per 1 million characters (very cheap)
- First 500,000 characters/month are FREE

## Troubleshooting

**Error: "Google Translate API key not configured"**
- Make sure `GOOGLE_TRANSLATE_API_KEY` is set in `.env` file
- Restart the backend server after adding the key

**Error: "Error fetching translations"**
- Check if your API key is correct
- Check if Cloud Translation API is enabled in Google Cloud
- Check internet connection

**No Tamil translation appearing**
- MyMemory fallback will be used (slower but works)
- Try restarting the server
