import express from 'express';
import * as purchaseController from '../controllers/purchaseController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Create a new purchase
router.post('/create', purchaseController.createPurchase);

// Get all purchases
router.get('/list', purchaseController.getAllPurchases);

// Get next GRN number
router.get('/next-grn-number', purchaseController.getNextGrnNumber);

// Get purchase by ID
router.get('/:id', purchaseController.getPurchaseById);

// Get purchase by bill number
router.get('/number/:billNo', purchaseController.getPurchaseByBillNumber);

// Delete purchase
router.delete('/:id', purchaseController.deletePurchase);

// Delete all purchases (admin only)
router.delete('/admin/delete-all', purchaseController.deleteAllPurchases);

export default router;