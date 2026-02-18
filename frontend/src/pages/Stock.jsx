import { useState, useEffect } from 'react';
import stockAnalysisService from '../services/stockAnalysisService';

const Stock = ({ onNavigateToDashboard }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('productName');
  const [sortOrder, setSortOrder] = useState('asc');
  const [stockAlerts, setStockAlerts] = useState([]);
  const [showAlertsOnly, setShowAlertsOnly] = useState(false);

  useEffect(() => {
    fetchProducts();
    loadStockAnalysis();
  }, []);

  const loadStockAnalysis = async () => {
    try {
      // Only load stock analysis if we have products
      if (products.length === 0 && !error) {
        return;
      }
      
      const analysis = await stockAnalysisService.analyzeStock();
      setStockAlerts(analysis.alerts);
    } catch (error) {
      console.error('Error loading stock analysis:', error);
      // Don't set error state here as it might override product fetch error
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('http://localhost:5003/api/products/list', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.products || []);
      } else {
        console.error('Failed to fetch products:', data.message);
        
        // Handle specific Firebase error
        if (data.error === 'FIREBASE_NOT_CONFIGURED') {
          setError({
            type: 'FIREBASE_ERROR',
            message: 'Database not configured. Please set up Firebase to view stock data.'
          });
        } else {
          setError({
            type: 'API_ERROR', 
            message: data.message || 'Failed to load products'
          });
        }
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError({
        type: 'NETWORK_ERROR',
        message: 'Unable to connect to server. Please check if the backend is running.'
      });
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const filteredAndSortedProducts = products
    .filter(product => 
      product.productName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aVal = a[sortBy] || '';
      const bVal = b[sortBy] || '';
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

  const getTotalStockValue = () => {
    return products.reduce((total, product) => {
      const qty = parseFloat(product.currentStock || 0);
      const rate = parseFloat(product.purchaseRate || 0);
      return total + (qty * rate);
    }, 0);
  };

  const getCriticalStockCount = () => {
    return products.filter(product => {
      const currentStock = parseFloat(product.currentStock || 0);
      return currentStock <= 2; // Critical threshold: 2 units or less
    }).length;
  };

  const getLowStockCount = () => {
    return products.filter(product => {
      const currentStock = parseFloat(product.currentStock || 0);
      return currentStock < 5 && currentStock > 2; // Low stock: less than 5 but more than 2
    }).length;
  };

  const getStockStatus = (currentStock, minStock) => {
    
    if (currentStock === 0) {
      return {
        level: 'Critical',
        text: 'OUT OF STOCK',
        color: 'bg-red-100 text-red-800 border-red-300',
        bgColor: 'bg-red-50',
        icon: '🚨'
      };
    }
    
    // Critical: 2 units or less
    if (currentStock <= 2) {
      return {
        level: 'Critical',
        text: 'CRITICAL LOW',
        color: 'bg-red-100 text-red-800 border-red-300 animate-pulse',
        bgColor: 'bg-red-50',
        icon: '🔴'
      };
    }
    
    // Low Stock: less than 5 units
    if (currentStock < 5) {
      return {
        level: 'High',
        text: 'LOW STOCK',
        color: 'bg-orange-100 text-orange-800 border-orange-300',
        bgColor: 'bg-orange-50',
        icon: '⚠️'
      };
    }
    
    // Medium: 5-10 units
    if (currentStock <= 10) {
      return {
        level: 'Medium',
        text: 'MODERATE',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        bgColor: 'bg-yellow-50',
        icon: '📊'
      };
    }
    
    // Watch: 10-20 units
    if (currentStock <= 20) {
      return {
        level: 'Watch',
        text: 'MONITOR',
        color: 'bg-blue-100 text-blue-800 border-blue-300',
        bgColor: 'bg-blue-50',
        icon: '👀'
      };
    }
    
    // Healthy: above 20 units
    return {
      level: 'Good',
      text: 'HEALTHY',
      color: 'bg-green-100 text-green-800 border-green-300',
      bgColor: '',
      icon: '✅'
    };
  };

  const getActionRecommendation = (currentStock, minStock) => {
    if (currentStock === 0) return 'ORDER NOW!';
    if (currentStock <= 2) return '🔴 ORDER NOW!';
    if (currentStock < 5) return '⚠️ Order Soon';
    if (currentStock <= 10) return '📊 Plan Order';
    if (currentStock <= 20) return '👀 Monitor';
    return '✅ Stock OK';
  };

  const getStockAlert = (productId) => {
    return stockAlerts.find(alert => alert.productId === productId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-6 py-4 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <div className="bg-white text-blue-600 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732L14.146 12.8l-1.179 4.456a1 1 0 01-1.934 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732L9.854 7.2l1.179-4.456A1 1 0 0112 2z" clipRule="evenodd"/>
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold drop-shadow-sm">STOCK</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onNavigateToDashboard}
            className="px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Dashboard
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Products</p>
                <p className="text-2xl font-bold">{products.length}</p>
              </div>
              <div className="bg-white/20 p-2 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Stock Value</p>
                <p className="text-2xl font-bold">₹{getTotalStockValue().toLocaleString()}</p>
              </div>
              <div className="bg-white/20 p-2 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Critical Items</p>
                <p className="text-2xl font-bold">{getCriticalStockCount()}</p>
                <p className="text-red-200 text-xs mt-1">2 units or less</p>
              </div>
              <div className="bg-white/20 p-2 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Low Stock Items</p>
                <p className="text-2xl font-bold">{getLowStockCount()}</p>
                <p className="text-orange-200 text-xs mt-1">Less than 5 units</p>
              </div>
              <div className="bg-white/20 p-2 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <button
                onClick={() => setShowAlertsOnly(!showAlertsOnly)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  showAlertsOnly 
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {showAlertsOnly ? '🚨 Alerts Only' : '👀 Show Alerts Only'}
              </button>
              
              <button
                onClick={() => {
                  setError(null);
                  fetchProducts();
                  loadStockAnalysis();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stock Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700">
            <h2 className="text-xl font-bold text-white">Product Stock Levels</h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading stock data...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-center justify-center mb-4">
                  {error.type === 'FIREBASE_ERROR' && (
                    <div className="text-6xl mb-4">🔥</div>
                  )}
                  {error.type === 'NETWORK_ERROR' && (
                    <div className="text-6xl mb-4">🌐</div>
                  )}
                  {error.type === 'API_ERROR' && (
                    <div className="text-6xl mb-4">⚠️</div>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                  {error.type === 'FIREBASE_ERROR' && 'Firebase Database Not Configured'}
                  {error.type === 'NETWORK_ERROR' && 'Server Connection Error'}
                  {error.type === 'API_ERROR' && 'Database Error'}
                </h3>
                <p className="text-red-600 mb-4">{error.message}</p>
                {error.type === 'FIREBASE_ERROR' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Setup Required:</strong> Please configure Firebase credentials in the backend .env file to enable data storage.
                    </p>
                  </div>
                )}
                <button
                  onClick={() => {
                    fetchProducts();
                    loadStockAnalysis();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      onClick={() => handleSort('productName')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      Product Name
                      {sortBy === 'productName' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th 
                      onClick={() => handleSort('currentStock')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      Current Stock
                      {sortBy === 'currentStock' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action Required
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedProducts
                    .filter(product => {
                      if (!showAlertsOnly) return true;
                      const currentStock = parseFloat(product.currentStock || 0);
                      return currentStock < 5; // Show items with less than 5 units
                    })
                    .map((product) => {
                    const currentStock = parseFloat(product.currentStock || 0);
                    const minStock = parseFloat(product.minStock || 0);
                    const stockStatus = getStockStatus(currentStock, minStock);
                    const stockValue = currentStock * parseFloat(product.purchaseRate || 0);
                    const stockAlert = getStockAlert(product._id);
                    const stockRatio = currentStock / Math.max(minStock, 1);

                    return (
                      <tr key={product._id} className={`hover:bg-gray-50 transition-colors ${stockStatus.bgColor}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-lg mr-2">{stockStatus.icon}</span>
                            <div className="text-sm font-medium text-gray-900">{product.productName}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className={`text-sm font-bold ${
                              stockStatus.level === 'Critical' ? 'text-red-600' : 
                              stockStatus.level === 'High' ? 'text-orange-600' :
                              stockStatus.level === 'Medium' ? 'text-yellow-600' : 'text-gray-900'
                            }`}>
                              {currentStock} units
                            </div>
                            {/* Stock Level Progress Bar */}
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                              <div 
                                className={`h-1.5 rounded-full ${
                                  stockStatus.level === 'Critical' ? 'bg-red-500' :
                                  stockStatus.level === 'High' ? 'bg-orange-500' :
                                  stockStatus.level === 'Medium' ? 'bg-yellow-500' :
                                  stockStatus.level === 'Watch' ? 'bg-blue-500' : 'bg-green-500'
                                }`}
                                style={{width: `${Math.min(100, (currentStock / 25) * 100)}%`}}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">₹{stockValue.toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className={`text-sm font-bold ${
                              stockStatus.level === 'Critical' ? 'text-red-600' :
                              stockStatus.level === 'High' ? 'text-orange-600' :
                              stockStatus.level === 'Medium' ? 'text-yellow-600' :
                              stockStatus.level === 'Watch' ? 'text-blue-600' : 'text-green-600'
                            }`}>
                              {getActionRecommendation(currentStock, minStock)}
                            </span>
                            
                            {stockAlert && stockAlert.recommendedOrderQty && (
                              <div className="text-xs text-gray-600">
                                📦 Order {stockAlert.recommendedOrderQty} units
                                {stockAlert.estimatedOrderValue && (
                                  <div>💰 ~₹{stockAlert.estimatedOrderValue.toLocaleString()}</div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {filteredAndSortedProducts.filter(product => {
                if (!showAlertsOnly) return true;
                const currentStock = parseFloat(product.currentStock || 0);
                return currentStock < 5; // Show items with less than 5 units
              }).length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  {showAlertsOnly 
                    ? '🎉 No stock alerts! All items have 5+ units.' 
                    : searchTerm 
                      ? `No products found matching "${searchTerm}"` 
                      : 'No products found'
                  }
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Stock;