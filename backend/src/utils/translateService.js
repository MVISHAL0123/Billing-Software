// Translation Service using Google Translate API
// Install: npm install google-translate-api-x
// Get API Key from: https://console.cloud.google.com/

import axios from 'axios';

// Get Google Translate API key from environment variable
const GOOGLE_TRANSLATE_API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;

// Check if API key is set and not a placeholder
const isValidGoogleAPIKey = GOOGLE_TRANSLATE_API_KEY && 
  GOOGLE_TRANSLATE_API_KEY !== 'YOUR_API_KEY_HERE' && 
  GOOGLE_TRANSLATE_API_KEY.length > 20;

if (!isValidGoogleAPIKey) {
  console.warn('⚠️  Google Translate API key not configured - using free MyMemory API');
}

// Translate using Google Translate API (Recommended - More accurate)
const translateViaGoogleAPI = async (text, targetLanguage = 'ta') => {
  try {
    if (!GOOGLE_TRANSLATE_API_KEY) {
      console.warn('Google Translate API key not configured');
      return '';
    }

    const response = await axios.post(
      'https://translation.googleapis.com/language/translate/v2',
      {
        q: text,
        target: targetLanguage,
        source: 'en'
      },
      {
        params: {
          key: GOOGLE_TRANSLATE_API_KEY
        }
      }
    );

    if (response.data && response.data.data && response.data.data.translations) {
      return response.data.data.translations[0].translatedText;
    }
    return '';
  } catch (error) {
    console.error('Google Translate API error:', error.message);
    return '';
  }
};

// Fallback: Free translation using MyMemory API (No Auth Required)
const translateViaMyMemory = async (text, sourceLang = 'en', targetLang = 'ta') => {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;
    const response = await axios.get(url);
    
    if (response.data && response.data.responseData && response.data.responseData.translatedText) {
      return response.data.responseData.translatedText;
    }
    return '';
  } catch (error) {
    console.error('MyMemory API error:', error.message);
    return '';
  }
};

// Translate text - Uses Google API if available, falls back to MyMemory
export const translateText = async (text, targetLanguage = 'ta') => {
  if (!text || !text.trim()) {
    return '';
  }

  try {
    // Try Google Translate API first (more accurate) - only if valid key is set
    if (isValidGoogleAPIKey) {
      const translation = await translateViaGoogleAPI(text, targetLanguage);
      if (translation) {
        return translation;
      }
    }

    // Fallback to MyMemory API (free, no auth required)
    if (targetLanguage === 'ta') {
      const translation = await translateViaMyMemory(text, 'en', 'ta');
      if (translation) {
        return translation;
      }
    }

    // If all else fails, return original text
    return text;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
};

// Translate multiple texts at once
export const translateMultiple = async (texts, targetLanguage = 'ta') => {
  if (!texts || texts.length === 0) {
    return [];
  }

  const translations = await Promise.all(
    texts.map(text => translateText(text, targetLanguage))
  );

  return translations;
};
