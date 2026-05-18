import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';
import billRoutes from './routes/billRoutes.js';
import purchaseRoutes from './routes/purchaseRoutes.js';
import translationRoutes from './routes/translationRoutes.js';
import voiceRoutes from './routes/voiceRoutes.js';
import { initializeFirebase } from '../config/database.js';
import { seedUsers } from './utils/seedUsers.js';

dotenv.config();

// Connect to Firebase
const firebaseConnected = initializeFirebase();

// Seed default users after Firebase connection (only if connected)
if (firebaseConnected) {
  seedUsers();
} else {
  console.log('⚠️  Skipping user seeding - Firebase not connected');
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Configure CORS to allow requests from Firebase Hosting
const corsOptions = {
  origin: [
    'https://mmkbills.web.app',      // Production Firebase Hosting
    'http://localhost:5173',          // Local Vite dev server
    'http://localhost:3000',          // Alternative local
    'http://127.0.0.1:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/api', (req, res) => {
  res.json({ message: 'Billing System API' });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/translation', translationRoutes);
app.use('/api/voice', voiceRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
