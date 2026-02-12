// Direct translation test using MyMemory API
import axios from 'axios';

const testTranslation = async () => {
  console.log('🧪 Testing Direct Translation (MyMemory API)...\n');

  const testWords = ['MILK', 'RICE', 'SUGAR', 'TEA', 'BREAD', 'WATER'];

  for (const word of testWords) {
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|ta`;
      const response = await axios.get(url);
      
      if (response.data && response.data.responseData && response.data.responseData.translatedText) {
        console.log(`✅ ${word.padEnd(10)} -> ${response.data.responseData.translatedText}`);
      } else {
        console.log(`❌ ${word.padEnd(10)} -> Translation failed`);
      }
    } catch (error) {
      console.log(`❌ ${word.padEnd(10)} -> Error: ${error.message}`);
    }
  }

  console.log('\n✅ Direct translation test complete!');
  console.log('\n📌 Note: MyMemory API is free but may have rate limits.');
  console.log('   For production use, consider getting a Google Cloud Translation API key.');
};

testTranslation();
