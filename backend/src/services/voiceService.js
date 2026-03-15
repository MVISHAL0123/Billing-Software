import axios from 'axios';

// Ollama local AI service for processing voice commands
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

export const processVoiceCommand = async (transcript, products) => {
  try {
    // Create a simple product list for context
    const productList = products.map(p => ({
      name: p.productName,
      tamilName: p.tamilName || '',
      rate: p.salesRate
    }));

    const prompt = `You are a billing assistant for a grocery store. Parse the customer's voice command and extract product names and quantities.

Available products in the store:
${JSON.stringify(productList, null, 2)}

Customer said: "${transcript}"

Instructions:
1. Match spoken product names (in Tamil or English) to the available products
2. Extract quantities (default to 1 if not specified)
3. Handle common Tamil words: "arisi" = rice, "sakkarai" = sugar, "ennai" = oil, "paal" = milk, "atta" = wheat flour
4. Handle quantity words: "oru" = 1, "rendu/இரண்டு" = 2, "moonu" = 3, "naalu" = 4, "anju" = 5
5. Handle units: "kg", "kilogram", "litre", "packet", "piece"

Return ONLY a valid JSON array with this format (no other text):
[{"productName": "exact product name from list", "qty": number}]

If no products match, return: []`;

    const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: process.env.OLLAMA_MODEL || 'gemma3:4b',
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.1,
        num_predict: 500
      }
    });

    const aiResponse = response.data.response;

    // Extract JSON from response
    const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const items = JSON.parse(jsonMatch[0]);

      // Validate and enrich items with product data
      const validItems = items
        .map(item => {
          const product = products.find(p =>
            p.productName.toLowerCase() === item.productName.toLowerCase() ||
            (p.tamilName && p.tamilName.toLowerCase() === item.productName.toLowerCase())
          );

          if (product) {
            return {
              productName: product.productName,
              qty: parseInt(item.qty) || 1,
              rate: product.salesRate,
              purchaseRate: product.purchaseRate,
              profitPerItem: product.salesRate - product.purchaseRate,
              amount: (parseInt(item.qty) || 1) * product.salesRate,
              totalProfit: (parseInt(item.qty) || 1) * (product.salesRate - product.purchaseRate)
            };
          }
          return null;
        })
        .filter(item => item !== null);

      return {
        success: true,
        items: validItems,
        transcript: transcript,
        rawResponse: aiResponse
      };
    }

    return {
      success: false,
      error: 'Could not parse AI response',
      transcript: transcript,
      rawResponse: aiResponse
    };

  } catch (error) {
    console.error('Voice processing error:', error);

    // Fallback: Simple keyword matching without AI
    return fallbackProcessing(transcript, products);
  }
};

// Fallback processing without AI (simple keyword matching)
const fallbackProcessing = (transcript, products) => {
  const words = transcript.toLowerCase().split(/[\s,]+/);
  const items = [];

  // Tamil to English product name mapping
  const tamilMap = {
    'arisi': 'rice',
    'அரிசி': 'rice',
    'sakkarai': 'sugar',
    'சக்கரை': 'sugar',
    'ennai': 'oil',
    'எண்ணெய்': 'oil',
    'paal': 'milk',
    'பால்': 'milk',
    'atta': 'wheat',
    'ஆட்டா': 'wheat',
    'maavu': 'flour',
    'மாவு': 'flour',
    'uppu': 'salt',
    'உப்பு': 'salt',
    'milagai': 'chilli',
    'மிளகாய்': 'chilli',
    'vengayam': 'onion',
    'வெங்காயம்': 'onion',
    'thakkali': 'tomato',
    'தக்காளி': 'tomato'
  };

  // Number mapping
  const numberMap = {
    'oru': 1, 'one': 1, 'ஒரு': 1,
    'rendu': 2, 'two': 2, 'இரண்டு': 2,
    'moonu': 3, 'three': 3, 'மூன்று': 3,
    'naalu': 4, 'four': 4, 'நான்கு': 4,
    'anju': 5, 'five': 5, 'ஐந்து': 5,
    'aaru': 6, 'six': 6, 'ஆறு': 6,
    'ezhu': 7, 'seven': 7, 'ஏழு': 7,
    'ettu': 8, 'eight': 8, 'எட்டு': 8,
    'onbathu': 9, 'nine': 9, 'ஒன்பது': 9,
    'pathu': 10, 'ten': 10, 'பத்து': 10
  };

  let currentQty = 1;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    // Check if it's a number
    if (numberMap[word]) {
      currentQty = numberMap[word];
      continue;
    }

    // Check if it's a numeric value
    const numericQty = parseFloat(word);
    if (!isNaN(numericQty)) {
      currentQty = numericQty;
      continue;
    }

    // Translate Tamil word if needed
    const searchTerm = tamilMap[word] || word;

    // Find matching product
    const product = products.find(p =>
      p.productName.toLowerCase().includes(searchTerm) ||
      (p.tamilName && p.tamilName.toLowerCase().includes(word))
    );

    if (product) {
      // Check if product already added
      const existingIndex = items.findIndex(item => item.productName === product.productName);

      if (existingIndex !== -1) {
        items[existingIndex].qty += currentQty;
        items[existingIndex].amount = items[existingIndex].qty * product.salesRate;
        items[existingIndex].totalProfit = items[existingIndex].qty * (product.salesRate - product.purchaseRate);
      } else {
        items.push({
          productName: product.productName,
          qty: currentQty,
          rate: product.salesRate,
          purchaseRate: product.purchaseRate,
          profitPerItem: product.salesRate - product.purchaseRate,
          amount: currentQty * product.salesRate,
          totalProfit: currentQty * (product.salesRate - product.purchaseRate)
        });
      }

      currentQty = 1; // Reset for next product
    }
  }

  return {
    success: items.length > 0,
    items: items,
    transcript: transcript,
    fallback: true
  };
};

export const checkOllamaStatus = async () => {
  try {
    const response = await axios.get(`${OLLAMA_URL}/api/tags`);
    return {
      online: true,
      models: response.data.models || []
    };
  } catch (error) {
    return {
      online: false,
      error: 'Ollama is not running. Start Ollama and pull a model (e.g., ollama pull mistral)'
    };
  }
};
