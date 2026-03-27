// API Base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5003/api';

// Helper function to get authorization header
const getAuthHeader = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = user.token || localStorage.getItem('token');
  
  console.log('Auth Debug:', {
    hasUser: !!user && Object.keys(user).length > 0,
    hasToken: !!token,
    token: token ? token.substring(0, 20) + '...' : 'MISSING',
    userKeys: Object.keys(user)
  });
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export const firestoreService = {
  // Products
  getProducts: async () => {
    try {
      console.log('🔍 Fetching products from:', API_URL + '/products/list');
      const response = await fetch(`${API_URL}/products/list`, {
        method: 'GET',
        headers: getAuthHeader()
      });

      console.log('📡 Response Status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', response.status, errorText);
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Products fetched successfully:', data.products?.length || 0, 'items');
      return data.products || [];
    } catch (error) {
      console.error('❌ Error fetching products:', error.message);
      return [];
    }
  },

  addProduct: async (product) => {
    try {
      console.log('Adding product via backend API:', product);
      const response = await fetch(`${API_URL}/products/add`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(product)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to add product');
      }

      console.log('Product added successfully:', data.product?.id);
      return { success: true, id: data.product?.id, ...data.product };
    } catch (error) {
      console.error('Error adding product:', error.message);
      return { success: false, message: error.message };
    }
  },

  updateProduct: async (productId, updates) => {
    try {
      const response = await fetch(`${API_URL}/products/${productId}`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify(updates)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update product');
      }

      return { success: true, ...data.product };
    } catch (error) {
      console.error('Error updating product:', error.message);
      return { success: false, message: error.message };
    }
  },

  deleteProduct: async (productId) => {
    try {
      const response = await fetch(`${API_URL}/products/${productId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting product:', error.message);
      return { success: false, message: error.message };
    }
  },

  // Customers
  getCustomers: async () => {
    try {
      console.log('🔍 Fetching customers from:', API_URL + '/customers/list');
      const response = await fetch(`${API_URL}/customers/list`, {
        method: 'GET',
        headers: getAuthHeader()
      });

      console.log('📡 Response Status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', response.status, errorText);
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Customers fetched successfully:', data.customers?.length || 0, 'items');
      return data.customers || [];
    } catch (error) {
      console.error('❌ Error fetching customers:', error.message);
      return [];
    }
  },

  addCustomer: async (customer) => {
    try {
      console.log('Adding customer via backend API:', customer);
      const response = await fetch(`${API_URL}/customers/add`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(customer)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to add customer');
      }

      console.log('Customer added successfully:', data.customer?.id);
      return { success: true, id: data.customer?.id, ...data.customer };
    } catch (error) {
      console.error('Error adding customer:', error.message);
      return { success: false, message: error.message };
    }
  },

  updateCustomer: async (customerId, updates) => {
    try {
      const response = await fetch(`${API_URL}/customers/${customerId}`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify(updates)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update customer');
      }

      return { success: true, ...data.customer };
    } catch (error) {
      console.error('Error updating customer:', error.message);
      return { success: false, message: error.message };
    }
  },

  deleteCustomer: async (customerId) => {
    try {
      const response = await fetch(`${API_URL}/customers/${customerId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });

      if (!response.ok) {
        throw new Error('Failed to delete customer');
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting customer:', error.message);
      return { success: false, message: error.message };
    }
  },

  // Suppliers
  getSuppliers: async () => {
    try {
      console.log('🔍 Fetching suppliers from:', API_URL + '/suppliers/list');
      const response = await fetch(`${API_URL}/suppliers/list`, {
        method: 'GET',
        headers: getAuthHeader()
      });

      console.log('📡 Response Status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', response.status, errorText);
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Suppliers fetched successfully:', data.suppliers?.length || 0, 'items');
      return data.suppliers || [];
    } catch (error) {
      console.error('❌ Error fetching suppliers:', error.message);
      return [];
    }
  },

  addSupplier: async (supplier) => {
    try {
      console.log('Adding supplier via backend API:', supplier);
      const response = await fetch(`${API_URL}/suppliers/add`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(supplier)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to add supplier');
      }

      console.log('Supplier added successfully:', data.supplier?.id);
      return { success: true, id: data.supplier?.id, ...data.supplier };
    } catch (error) {
      console.error('Error adding supplier:', error.message);
      return { success: false, message: error.message };
    }
  },

  updateSupplier: async (supplierId, updates) => {
    try {
      const response = await fetch(`${API_URL}/suppliers/${supplierId}`, {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify(updates)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update supplier');
      }

      return { success: true, ...data.supplier };
    } catch (error) {
      console.error('Error updating supplier:', error.message);
      return { success: false, message: error.message };
    }
  },

  deleteSupplier: async (supplierId) => {
    try {
      const response = await fetch(`${API_URL}/suppliers/${supplierId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });

      if (!response.ok) {
        throw new Error('Failed to delete supplier');
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting supplier:', error.message);
      return { success: false, message: error.message };
    }
  },

  // Bills/Sales
  getBills: async () => {
    try {
      console.log('🔍 Fetching bills from:', API_URL + '/bills/list');
      const response = await fetch(`${API_URL}/bills/list`, {
        method: 'GET',
        headers: getAuthHeader()
      });

      console.log('📡 Response Status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', response.status, errorText);
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Bills fetched successfully:', data.bills?.length || 0, 'items');
      return data.bills || [];
    } catch (error) {
      console.error('❌ Error fetching bills:', error.message);
      return [];
    }
  },

  addBill: async (bill) => {
    try {
      console.log('Adding bill via backend API:', bill);
      const response = await fetch(`${API_URL}/bills/create`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(bill)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to add bill');
      }

      console.log('Bill added successfully:', data.bill?.id);
      return { success: true, id: data.bill?.id, ...data.bill };
    } catch (error) {
      console.error('Error adding bill:', error.message);
      return { success: false, message: error.message };
    }
  },

  // Purchases
  getPurchases: async () => {
    try {
      console.log('🔍 Fetching purchases from:', API_URL + '/purchases/list');
      const response = await fetch(`${API_URL}/purchases/list`, {
        method: 'GET',
        headers: getAuthHeader()
      });

      console.log('📡 Response Status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', response.status, errorText);
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Purchases fetched successfully:', data.purchases?.length || 0, 'items');
      return data.purchases || [];
    } catch (error) {
      console.error('❌ Error fetching purchases:', error.message);
      return [];
    }
  },

  addPurchase: async (purchase) => {
    try {
      console.log('Adding purchase via backend API:', purchase);
      const response = await fetch(`${API_URL}/purchases/create`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(purchase)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to add purchase');
      }

      console.log('Purchase added successfully:', data.purchase?.id);
      return { success: true, id: data.purchase?.id, ...data.purchase };
    } catch (error) {
      console.error('Error adding purchase:', error.message);
      return { success: false, message: error.message };
    }
  },

  // Generic operations
  addDocument: async (collectionName, data) => {
    try {
      console.log(`Adding document to ${collectionName} via API:`, data);
      // Map collection names to API endpoints
      const endpoints = {
        products: 'products/add',
        customers: 'customers/add',
        suppliers: 'suppliers/add',
        bills: 'bills/create',
        purchases: 'purchases/create'
      };

      const endpoint = endpoints[collectionName] || `${collectionName}/add`;
      const response = await fetch(`${API_URL}/${endpoint}`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(data)
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to add document');
      }

      return { success: true, ...result };
    } catch (error) {
      console.error(`Error adding document to ${collectionName}:`, error.message);
      return { success: false, message: error.message };
    }
  },

  getCollection: async (collectionName) => {
    try {
      console.log(`Fetching ${collectionName} from backend API...`);
      // Map collection names to API endpoints
      const endpoints = {
        products: 'products/list',
        customers: 'customers/list',
        suppliers: 'suppliers/list',
        bills: 'bills/list',
        purchases: 'purchases/list'
      };

      const endpoint = endpoints[collectionName] || `${collectionName}/list`;
      const response = await fetch(`${API_URL}/${endpoint}`, {
        method: 'GET',
        headers: getAuthHeader()
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      // Handle different response formats from backend
      const items = data[collectionName] || data.data || [];
      console.log(`${collectionName} fetched:`, items.length, 'items');
      return items;
    } catch (error) {
      console.error(`Error fetching ${collectionName}:`, error.message);
      return [];
    }
  }
};
