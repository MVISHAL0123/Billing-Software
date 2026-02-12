import express from 'express';
import { login, register, updateProfile, getStaffUsers, updateStaff } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.put('/update-profile', updateProfile);
router.get('/staff-users', getStaffUsers);
router.put('/update-staff', updateStaff);

export default router;
