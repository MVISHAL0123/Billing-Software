import express from 'express';
import { 
  addProduct, 
  getProducts, 
  getProductById, 
  updateProduct, 
  deleteProduct,
  updateProductPrices
} from '../controllers/productController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Add new product
router.post('/add', addProduct);

// Get all products (list)
router.get('/list', getProducts);

// Get product by ID
router.get('/:id', getProductById);

// Update product
router.put('/:id', updateProduct);

// Delete product
router.delete('/:id', deleteProduct);

// Update product prices
router.put('/prices/update', updateProductPrices);

export default router;
