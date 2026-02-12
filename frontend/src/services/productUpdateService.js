// Product update service for refreshing data across pages
class ProductUpdateService {
  constructor() {
    this.listeners = [];
  }

  // Subscribe to product updates
  subscribe(callback) {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Notify all listeners of product updates
  notifyUpdate(updatedProduct) {
    this.listeners.forEach(callback => {
      try {
        callback(updatedProduct);
      } catch (error) {
        console.error('Error in product update listener:', error);
      }
    });
  }

  // Update product prices
  async updateProductPrices(productId, priceData) {
    try {
      const response = await fetch('http://localhost:5003/api/products/prices/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          productId,
          ...priceData
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Notify all listeners about the price update
          this.notifyUpdate(data.product);
          return { success: true, product: data.product };
        }
      }
      
      throw new Error('Failed to update product prices');
    } catch (error) {
      console.error('Error updating product prices:', error);
      return { success: false, error: error.message };
    }
  }

  // Refresh product data across all pages
  async refreshAllProducts() {
    try {
      const response = await fetch('http://localhost:5003/api/products/list', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Notify all listeners to refresh their product data
          this.notifyUpdate({ type: 'REFRESH_ALL', products: data.products });
          return { success: true, products: data.products };
        }
      }
      
      throw new Error('Failed to refresh products');
    } catch (error) {
      console.error('Error refreshing products:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create a singleton instance
const productUpdateService = new ProductUpdateService();

export default productUpdateService;