import express from 'express';
import { 
  addSupplier, 
  getSuppliers, 
  getSupplierById, 
  updateSupplier, 
  deleteSupplier 
} from '../controllers/supplierController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Add new supplier
router.post('/add', addSupplier);

// Get all suppliers (list)
router.get('/list', getSuppliers);

// Get supplier by ID
router.get('/:id', getSupplierById);

// Update supplier
router.put('/:id', updateSupplier);

// Delete supplier
router.delete('/:id', deleteSupplier);

export default router;