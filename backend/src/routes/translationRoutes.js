import express from 'express';
import { translateText, translateMultiple } from '../utils/translateService.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Translate single text
router.post('/translate', protect, async (req, res) => {
  try {
    const { text, targetLanguage = 'ta' } = req.body;

    if (!text) {
      return res.status(400).json({ 
        success: false, 
        message: 'Text is required' 
      });
    }

    const translation = await translateText(text, targetLanguage);

    res.json({
      success: true,
      originalText: text,
      translatedText: translation,
      targetLanguage: targetLanguage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Translation failed',
      error: error.message
    });
  }
});

// Translate multiple texts
router.post('/translate-multiple', protect, async (req, res) => {
  try {
    const { texts, targetLanguage = 'ta' } = req.body;

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Texts array is required' 
      });
    }

    const translations = await translateMultiple(texts, targetLanguage);

    res.json({
      success: true,
      originalTexts: texts,
      translatedTexts: translations,
      targetLanguage: targetLanguage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Bulk translation failed',
      error: error.message
    });
  }
});

export default router;
