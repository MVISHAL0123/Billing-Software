import { firestoreService } from './firestoreService';

// Sample data to seed the database
const SAMPLE_DATA = {
  products: [
    {
      productName: 'Laptop',
      sku: 'PROD001',
      purchaseRate: 35000,
      salesRate: 45000,
      currentStock: 10,
      minStock: 5,
      maxStock: 50,
      category: 'Electronics',
      description: 'High-performance laptop computer'
    },
    {
      productName: 'Mouse',
      sku: 'PROD002',
      purchaseRate: 300,
      salesRate: 500,
      currentStock: 150,
      minStock: 20,
      maxStock: 500,
      category: 'Accessories',
      description: 'Wireless mouse'
    },
    {
      productName: 'Keyboard',
      sku: 'PROD003',
      purchaseRate: 800,
      salesRate: 1200,
      currentStock: 75,
      minStock: 10,
      maxStock: 200,
      category: 'Accessories',
      description: 'Mechanical keyboard'
    },
    {
      productName: 'Monitor',
      sku: 'PROD004',
      purchaseRate: 8000,
      salesRate: 12000,
      currentStock: 5,
      minStock: 2,
      maxStock: 20,
      category: 'Electronics',
      description: '24-inch LED monitor'
    },
    {
      productName: 'USB Cable',
      sku: 'PROD005',
      purchaseRate: 100,
      salesRate: 200,
      currentStock: 500,
      minStock: 50,
      maxStock: 1000,
      category: 'Cables',
      description: 'USB Type-C cable, 2 meters'
    }
  ],
  customers: [
    {
      customerName: 'Acme Corp',
      phoneNumber: '9876543210',
      email: 'contact@acmecorp.com',
      place: 'Chennai',
      gstNumber: '33AABCT1234H1Z0'
    },
    {
      customerName: 'Tech Solutions',
      phoneNumber: '9765432109',
      email: 'info@techsolutions.com',
      place: 'Bangalore',
      gstNumber: '29AABCT1234H1Z0'
    },
    {
      customerName: 'Metro Industries',
      phoneNumber: '9654321098',
      email: 'sales@metroindustries.com',
      place: 'Mumbai',
      gstNumber: '27AABCT1234H1Z0'
    }
  ],
  suppliers: [
    {
      supplierName: 'Global Supplies',
      phoneNumber: '9123456789',
      email: 'sales@globalsupplies.com',
      place: 'Delhi',
      gstNumber: '07AABCT1234H1Z0'
    },
    {
      supplierName: 'Premium Parts Ltd',
      phoneNumber: '9234567890',
      email: 'contact@premiumparts.com',
      place: 'Hyderabad',
      gstNumber: '36AABCT1234H1Z0'
    }
  ]
};

// Function to seed data into Firestore
export const seedFirestoreData = async () => {
  try {
    console.log('🌱 Starting Firestore data seeding...');

    // Seed products
    console.log('Adding products...');
    for (const product of SAMPLE_DATA.products) {
      await firestoreService.addProduct(product);
    }
    console.log(`✅ ${SAMPLE_DATA.products.length} products added`);

    // Seed customers
    console.log('Adding customers...');
    for (const customer of SAMPLE_DATA.customers) {
      await firestoreService.addCustomer(customer);
    }
    console.log(`✅ ${SAMPLE_DATA.customers.length} customers added`);

    // Seed suppliers
    console.log('Adding suppliers...');
    for (const supplier of SAMPLE_DATA.suppliers) {
      await firestoreService.addSupplier(supplier);
    }
    console.log(`✅ ${SAMPLE_DATA.suppliers.length} suppliers added`);

    console.log('🎉 Firestore seeding completed successfully!');
    return { success: true, message: 'Data seeded successfully' };
  } catch (error) {
    console.error('❌ Error seeding Firestore:', error);
    return { success: false, error: error.message };
  }
};

// Export sample data for reference
export { SAMPLE_DATA };
