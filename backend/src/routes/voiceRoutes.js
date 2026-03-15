import express from 'express';
import { processVoice, checkAIStatus, getVoiceHelp } from '../controllers/voiceController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Process voice command
router.post('/process', processVoice);

// Check AI status
router.get('/ai-status', checkAIStatus);

// Get voice help
router.get('/help', getVoiceHelp);

export default router;
