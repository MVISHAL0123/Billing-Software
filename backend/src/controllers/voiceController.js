import { processVoiceCommand, checkOllamaStatus } from '../services/voiceService.js';
import firebaseService from '../services/firebaseService.js';

// Process voice command and return matched products
export const processVoice = async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript || transcript.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'No transcript provided'
      });
    }

    // Get all products for matching
    const products = await firebaseService.findAll('products');

    // Process the voice command
    const result = await processVoiceCommand(transcript, products);

    res.json(result);
  } catch (error) {
    console.error('Voice processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing voice command',
      error: error.message
    });
  }
};

// Check Ollama AI status
export const checkAIStatus = async (req, res) => {
  try {
    const status = await checkOllamaStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({
      online: false,
      error: error.message
    });
  }
};

// Get voice billing help/instructions
export const getVoiceHelp = (req, res) => {
  res.json({
    instructions: {
      tamil: [
        'Tamil la products solla mudiyum',
        'Example: "Arisi rendu kg, sakkarai oru kg"',
        'Quantity first, then product name'
      ],
      english: [
        'You can speak in English',
        'Example: "Rice 2 kg, Sugar 1 kg"',
        'Quantity first, then product name'
      ],
      tips: [
        'Speak clearly and slowly',
        'Pause briefly between items',
        'You can say quantities in words (one, two) or numbers (1, 2)'
      ]
    },
    supportedLanguages: ['Tamil', 'English', 'Mixed'],
    tamilKeywords: {
      numbers: {
        'oru': 1, 'rendu': 2, 'moonu': 3, 'naalu': 4, 'anju': 5
      },
      commonProducts: {
        'arisi': 'Rice',
        'sakkarai': 'Sugar',
        'ennai': 'Oil',
        'paal': 'Milk',
        'atta': 'Wheat Flour'
      }
    }
  });
};
