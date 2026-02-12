# Firebase Setup Instructions for Backend

## Step 1: Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `billing--software`
3. Click on the gear icon (Settings) → **Project Settings**
4. Go to the **Service Accounts** tab
5. Click **Generate new private key**
6. Download the JSON file
7. Open the downloaded JSON file and copy the values

## Step 2: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and update with your Firebase service account details:
   ```env
   FIREBASE_PROJECT_ID=billing--software
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nPASTE_YOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@billing--software.iam.gserviceaccount.com
   FIREBASE_DATABASE_URL=https://billing--software-default-rtdb.firebaseio.com/
   JWT_SECRET=your-secret-key-here
   ```

## Step 3: Enable Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (for development)
4. Select your preferred location
5. Click **Done**

## Step 4: Set Firestore Security Rules (Development)

Go to Firestore → **Rules** and use these rules for development:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // Allow all reads and writes for development
    }
  }
}
```

## Step 5: Run the Backend

```bash
npm start
```

## Step 6: Test the Connection

The backend will automatically:
- Connect to Firebase
- Create default admin and staff users
- Log "Firebase connected successfully" if everything is working

## Collections Created

The backend will create these Firestore collections:
- `users` - User accounts (admin/staff)
- `customers` - Customer information
- `suppliers` - Supplier information  
- `products` - Product inventory
- `bills` - Sales bills
- `purchases` - Purchase records
- `counters` - Auto-incrementing counters (for bill numbers)

## Migration from MongoDB

If you have existing MongoDB data, run the migration script:
```bash
node src/utils/migrateFromMongo.js
```

## Troubleshooting

1. **Firebase connection error**: Check your private key format - ensure newlines are properly escaped as `\\n`
2. **Permission denied**: Make sure your service account has the correct permissions
3. **Project not found**: Verify the project ID matches exactly: `billing--software`