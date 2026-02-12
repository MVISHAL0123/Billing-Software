import express from 'express';
import * as billController from '../controllers/billController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Create a new bill
router.post('/create', billController.createBill);

// Get all bills
router.get('/list', billController.getAllBills);

// Get next bill number
router.get('/next-bill-number', billController.getNextBillNumber);

// Get bill by ID
router.get('/:id', billController.getBillById);

// Get bill by bill number
router.get('/number/:billNo', billController.getBillByNumber);

// Delete bill
router.delete('/:id', billController.deleteBill);

// Delete all bills (admin only)
router.delete('/admin/delete-all', billController.deleteAllBills);

export default router;

