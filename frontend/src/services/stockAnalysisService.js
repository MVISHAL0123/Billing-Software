// Stock Analysis Service - Analyzes stock data and generates alerts
class StockAnalysisService {
  constructor() {
    this.cache = {
      products: null,
      alerts: null,
      lastFetch: null,
      cacheDuration: 5 * 60 * 1000 // 5 minutes
    };
  }

  // Fetch products from API
  async fetchProducts() {
    try {
      const response = await fetch('http://localhost:5003/api/products/list', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        return data.products || [];
      } else {
        console.error('Failed to fetch products:', data.message);
        return [];
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  // Check if cache is valid
  isCacheValid() {
    return this.cache.lastFetch && 
           (Date.now() - this.cache.lastFetch) < this.cache.cacheDuration;
  }

  // Calculate stock urgency level - Using absolute stock thresholds
  calculateUrgency(currentStock, minStock, productName) {
    
    // Out of stock - Critical
    if (currentStock === 0) {
      return {
        level: 'Critical',
        message: `${productName} is OUT OF STOCK - Immediate action required!`,
        priority: 1,
        color: 'red',
        daysEstimate: 0
      };
    }
    
    // Critical threshold: 2 units or less
    if (currentStock <= 2) {
      return {
        level: 'Critical',
        message: `${productName} is critically low (${currentStock} units) - Order immediately!`,
        priority: 1,
        color: 'red',
        daysEstimate: Math.max(1, Math.ceil(currentStock / 2))
      };
    }
    
    // Low stock threshold: less than 5 units (but more than 2)
    if (currentStock < 5) {
      return {
        level: 'High',
        message: `${productName} is running low (${currentStock} units) - Restock soon to avoid stockout`,
        priority: 2,
        color: 'orange',
        daysEstimate: Math.ceil(currentStock / 2)
      };
    }
    
    // Medium stock: 5-10 units
    if (currentStock <= 10) {
      return {
        level: 'Medium',
        message: `${productName} should be restocked soon (${currentStock} units available)`,
        priority: 3,
        color: 'yellow',
        daysEstimate: Math.ceil(currentStock / 3)
      };
    }

    // Watch level: 10-20 units
    if (currentStock <= 20) {
      return {
        level: 'Watch',
        message: `${productName} should be monitored (${currentStock} units)`,
        priority: 4,
        color: 'blue',
        daysEstimate: Math.ceil(currentStock / 4)
      };
    }

    // Healthy stock levels (above 20 units)
    return {
      level: 'Good',
      message: `${productName} stock is healthy (${currentStock} units)`,
      priority: 5,
      color: 'green',
      daysEstimate: null
    };
  }

  // Generate smart reorder recommendations - Based on absolute stock levels
  generateReorderRecommendation(product, urgency) {
    const currentStock = parseFloat(product.currentStock || 0);
    const minStock = parseFloat(product.minStock || 1);
    const purchaseRate = parseFloat(product.purchaseRate || 0);
    
    // Calculate recommended order quantity based on absolute stock levels
    let orderQuantity;
    let optimalStock;
    
    switch(urgency.level) {
      case 'Critical':
        // For critical items (≤2 units), order to get to 25 units
        optimalStock = 25;
        orderQuantity = Math.max(optimalStock - currentStock, 20);
        break;
      
      case 'High':
        // For low stock items (<5 units), order to get to 20 units
        optimalStock = 20;
        orderQuantity = Math.max(optimalStock - currentStock, 15);
        break;
        
      case 'Medium':
        // For medium items (5-10 units), order to get to 15 units
        optimalStock = 15;
        orderQuantity = Math.max(optimalStock - currentStock, 10);
        break;
        
      default:
        // For watch items (10-20 units), order to maintain 15 units
        optimalStock = 15;
        orderQuantity = Math.max(optimalStock - currentStock, 5);
    }
    
    // Round up to nearest whole number
    orderQuantity = Math.ceil(orderQuantity);
    const orderValue = orderQuantity * purchaseRate;
    
    // Calculate order date based on urgency - More aggressive for low absolute stock
    const today = new Date();
    let orderByDate = new Date(today);
    
    switch(urgency.level) {
      case 'Critical':
        // Order immediately for critical items (≤2 units)
        orderByDate.setDate(today.getDate());
        break;
      case 'High':
        // Order within 1 day for low stock (<5 units)
        orderByDate.setDate(today.getDate() + 1);
        break;
      case 'Medium':
        // Order within 2-3 days for medium stock (5-10 units)
        orderByDate.setDate(today.getDate() + 2);
        break;
      case 'Watch':
        // Order within a week for watch items (10-20 units)
        orderByDate.setDate(today.getDate() + 5);
        break;
      default:
        orderByDate = null;
    }

    // Calculate expected stockout date based on estimated daily usage
    const dailyUsageEstimate = Math.max(1, Math.min(currentStock / 7, 3)); // 1-3 units per day estimate
    const expectedStockoutDays = Math.ceil(currentStock / dailyUsageEstimate);
    const stockoutDate = new Date(today);
    stockoutDate.setDate(today.getDate() + expectedStockoutDays);

    return {
      productId: product._id,
      productName: product.productName,
      currentStock,
      minStock,
      recommendedOrderQty: orderQuantity,
      estimatedOrderValue: orderValue,
      optimalStockLevel: optimalStock,
      orderByDate: orderByDate ? orderByDate.toLocaleDateString('en-IN') : null,
      expectedStockoutDate: stockoutDate.toLocaleDateString('en-IN'),
      expectedStockoutDays,
      priority: urgency.priority,
      urgencyLevel: urgency.level,
      reason: urgency.message,
      supplierRecommendation: this.getSupplierRecommendation(urgency.level)
    };
  }

  // Analyze all products and generate alerts
  async analyzeStock() {
    try {
      // Use cache if valid
      if (this.isCacheValid() && this.cache.alerts) {
        return this.cache.alerts;
      }

      const products = await this.fetchProducts();
      
      if (!products.length) {
        return {
          alerts: [],
          summary: {
            totalProducts: 0,
            criticalItems: 0,
            lowStockItems: 0,
            totalStockValue: 0,
            alertsGenerated: 0
          }
        };
      }

      const alerts = [];
      let criticalCount = 0;
      let lowStockCount = 0;
      let totalValue = 0;

      // Analyze each product
      products.forEach(product => {
        const currentStock = parseFloat(product.currentStock || 0);
        const minStock = parseFloat(product.minStock || 0);
        const purchaseRate = parseFloat(product.purchaseRate || 0);
        
        totalValue += currentStock * purchaseRate;

        // Calculate urgency
        const urgency = this.calculateUrgency(currentStock, minStock, product.productName);
        
        // Generate alerts for items that need attention (including Watch level for minimum stock)
        if (['Critical', 'High', 'Medium', 'Watch'].includes(urgency.level)) {
          const recommendation = this.generateReorderRecommendation(product, urgency);
          
          alerts.push({
            id: `alert-${product._id}`,
            ...recommendation,
            timestamp: new Date(),
            read: false
          });

          // Count different urgency levels
          if (urgency.level === 'Critical') {
            criticalCount++;
          }
          if (['High', 'Medium'].includes(urgency.level)) {
            lowStockCount++;
          }
        }
      });

      // Sort alerts by priority (most critical first)
      alerts.sort((a, b) => a.priority - b.priority);

      const result = {
        alerts,
        summary: {
          totalProducts: products.length,
          criticalItems: criticalCount,
          lowStockItems: lowStockCount,
          totalStockValue: totalValue,
          alertsGenerated: alerts.length,
          lastUpdated: new Date()
        }
      };

      // Update cache
      this.cache.alerts = result;
      this.cache.products = products;
      this.cache.lastFetch = Date.now();

      return result;
    } catch (error) {
      console.error('Error analyzing stock:', error);
      return {
        alerts: [],
        summary: {
          totalProducts: 0,
          criticalItems: 0,
          lowStockItems: 0,
          totalStockValue: 0,
          alertsGenerated: 0,
          error: error.message
        }
      };
    }
  }

  // Get only critical alerts
  async getCriticalAlerts() {
    const analysis = await this.analyzeStock();
    return analysis.alerts.filter(alert => alert.urgencyLevel === 'Critical');
  }

  // Get summary statistics
  async getStockSummary() {
    const analysis = await this.analyzeStock();
    return analysis.summary;
  }

  // Mark alert as read
  markAlertAsRead(alertId) {
    if (this.cache.alerts && this.cache.alerts.alerts) {
      const alert = this.cache.alerts.alerts.find(a => a.id === alertId);
      if (alert) {
        alert.read = true;
      }
    }
  }

  // Get supplier recommendation based on urgency
  getSupplierRecommendation(urgencyLevel) {
    switch(urgencyLevel) {
      case 'Critical':
        return 'Contact multiple suppliers for fastest delivery. Consider emergency procurement.';
      case 'High':
        return 'Contact preferred supplier immediately. Request expedited delivery.';
      case 'Medium':
        return 'Place order through regular supplier channel within 2-3 days.';
      case 'Watch':
        return 'Plan regular reorder. No rush needed but monitor closely.';
      default:
        return 'No immediate action required.';
    }
  }

  // Clear cache to force refresh
  clearCache() {
    this.cache = {
      products: null,
      alerts: null,
      lastFetch: null,
      cacheDuration: 5 * 60 * 1000
    };
  }
}

// Create singleton instance
const stockAnalysisService = new StockAnalysisService();

export default stockAnalysisService;