import axios from 'axios';

async function testBillNumber() {
  console.log('🧪 Testing Bill Number Generation...\n');

  try {
    // Login first
    const loginResponse = await axios.post('http://localhost:5003/api/auth/login', {
      username: 'admin',
      password: 'admin123',
      role: 'admin'
    });

    if (!loginResponse.data.success) {
      // Try with different credentials
      const loginResponse2 = await axios.post('http://localhost:5003/api/auth/login', {
        username: 'Admin User',
        password: 'admin123',
        role: 'admin'
      });
      
      if (!loginResponse2.data.success) {
        console.log('❌ Could not login. Trying without auth...');
        // Try without auth
        const billResponse = await axios.get('http://localhost:5003/api/bills/next-bill-number');
        console.log('Response:', billResponse.data);
        return;
      }
    }

    const token = loginResponse.data.user.token;
    console.log('✅ Login successful\n');

    // Get next bill number
    console.log('📝 Getting next bill number...');
    const billResponse = await axios.get('http://localhost:5003/api/bills/next-bill-number', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (billResponse.data.success) {
      console.log(`\n✅ Next Bill Number: ${billResponse.data.nextBillNo}`);
      console.log(`\n📊 Current Bills: 5`);
      console.log(`✅ Next Bill Should Be: 6`);
      console.log(`${billResponse.data.nextBillNo === 6 ? '✅ CORRECT!' : '❌ INCORRECT! Got: ' + billResponse.data.nextBillNo}`);
    } else {
      console.log('❌ Error:', billResponse.data.message);
    }

  } catch (error) {
    if (error.response) {
      console.error('❌ Error:', error.response.data);
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

testBillNumber();
