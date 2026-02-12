// Frontend Translation Service
const API_URL = 'http://localhost:5003/api/translation';

export const translateToTamil = async (text) => {
  if (!text || !text.trim()) return '';

  try {
    const response = await fetch(`${API_URL}/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        text: text,
        targetLanguage: 'ta' // Tamil language code
      })
    });

    const data = await response.json();

    if (data.success) {
      return data.translatedText;
    } else {
      console.error('Translation error:', data.message);
      return '';
    }
  } catch (error) {
    console.error('Translation API error:', error);
    return '';
  }
};

export const translateMultipleToTamil = async (texts) => {
  if (!texts || texts.length === 0) return [];

  try {
    const response = await fetch(`${API_URL}/translate-multiple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        texts: texts,
        targetLanguage: 'ta'
      })
    });

    const data = await response.json();

    if (data.success) {
      return data.translatedTexts;
    } else {
      console.error('Bulk translation error:', data.message);
      return texts; // Return original if translation fails
    }
  } catch (error) {
    console.error('Bulk translation API error:', error);
    return texts;
  }
};
