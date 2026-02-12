// Quick test of translation API
import axios from 'axios';

const testTranslation = async () => {
  console.log('🧪 Testing Translation API...\n');

  try {
    // Get a token first (using admin credentials)
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post('http://localhost:5003/api/auth/login', {
      username: 'admin',
      password: 'admin123',
      role: 'admin'
    });

    if (!loginResponse.data.success) {
      console.error('❌ Login failed');
      return;
    }

    const token = loginResponse.data.user.token;
    console.log('✅ Login successful\n');

    // Test translation
    console.log('2️⃣ Testing translation...');
    const testWords = ['MILK', 'RICE', 'SUGAR', 'TEA'];

    for (const word of testWords) {
      const translationResponse = await axios.post(
        'http://localhost:5003/api/translation/translate',
        {
          text: word,
          targetLanguage: 'ta'
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (translationResponse.data.success) {
        console.log(`   ${word} -> ${translationResponse.data.translatedText} ✅`);
      } else {
        console.log(`   ${word} -> Failed ❌`);
      }
    }

    console.log('\n✅ Translation test complete!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
};

testTranslation();
