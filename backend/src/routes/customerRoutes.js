import express from 'express';
import { 
  addCustomer, 
  getCustomers, 
  getCustomerById, 
  updateCustomer, 
  deleteCustomer 
} from '../controllers/customerController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Add new customer
router.post('/add', addCustomer);

// Get all customers (list)
router.get('/list', getCustomers);

// Get customer by ID
router.get('/:id', getCustomerById);

// Update customer
router.put('/:id', updateCustomer);

// Delete customer
router.delete('/:id', deleteCustomer);

export default router;
