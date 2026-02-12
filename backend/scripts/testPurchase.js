import Purchase from '../src/models/Purchase.js';
import firebaseService from '../src/services/firebaseService.js';

async function testPurchase() {
  try {
    console.log('🧪 Testing Purchase Creation...\n');

    const testPurchaseData = {
      billNo: 'TEST-001',
      grnNo: '1',
      date: new Date(),
      supplier: {
        supplierId: 'test-supplier-id',
        supplierName: 'Test Supplier',
        phoneNumber: '1234567890',
        place: 'Test Place'
      },
      items: [{
        productName: 'Test Product',
        qty: 1,
        purchaseRate: 10,
        salesRate: 15,
        margin: 5,
        marginPercentage: 50,
        freeQty: 0,
        amount: 10
      }],
      subtotal: 10,
      total: 10,
      createdBy: 'test-user'
    };

    console.log('📝 Test Purchase Data:', JSON.stringify(testPurchaseData, null, 2));

    const purchase = new Purchase(testPurchaseData);
    console.log('\n✅ Purchase object created');

    const errors = purchase.validate();
    if (errors.length > 0) {
      console.error('\n❌ Validation errors:', errors);
      process.exit(1);
    }
    console.log('✅ Validation passed');

    console.log('\n💾 Attempting to save to Firebase...');
    const savedPurchase = await purchase.save();
    
    console.log('\n✅ Purchase saved successfully!');
    console.log('📋 Saved purchase ID:', savedPurchase.id);

    // Clean up - delete the test purchase
    console.log('\n🧹 Cleaning up test purchase...');
    await Purchase.deleteById(savedPurchase.id);
    console.log('✅ Test purchase deleted');

    console.log('\n🎉 All tests passed!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testPurchase();
