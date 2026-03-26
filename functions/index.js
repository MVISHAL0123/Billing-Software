import functions from 'firebase-functions';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import admin from 'firebase-admin';

dotenv.config();

// Initialize Firebase Admin
admin.initializeApp();

const app = express();

// Middleware
app.use(cors({
  origin: ['https://mmkbills.web.app', 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Import routes from backend
import authRoutes from '../backend/src/routes/authRoutes.js';
import productRoutes from '../backend/src/routes/productRoutes.js';
import customerRoutes from '../backend/src/routes/customerRoutes.js';
import supplierRoutes from '../backend/src/routes/supplierRoutes.js';
import billRoutes from '../backend/src/routes/billRoutes.js';
import purchaseRoutes from '../backend/src/routes/purchaseRoutes.js';
import translationRoutes from '../backend/src/routes/translationRoutes.js';
import voiceRoutes from '../backend/src/routes/voiceRoutes.js';

// Health check
app.get('/api', (req, res) => {
  res.json({ message: 'Billing System API', status: 'running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/translation', translationRoutes);
app.use('/api/voice', voiceRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: false
  });
});

// Export as Cloud Function
export const api = functions.https.onRequest(app);
