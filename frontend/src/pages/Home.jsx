import { useState, useEffect } from 'react';
import stockAnalysisService from '../services/stockAnalysisService';

const Home = () => {
  // Stock analysis state
  const [stockAlerts, setStockAlerts] = useState([]);
  const [stockSummary, setStockSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // AI stock predictions and notifications
  const [notifications, setNotifications] = useState([]);

  // Load stock analysis on component mount
  useEffect(() => {
    loadStockAnalysis();
    
    // Refresh every 5 minutes
    const interval = setInterval(loadStockAnalysis, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Load stock analysis from actual inventory
  const loadStockAnalysis = async () => {
    try {
      setLoading(true);
      const analysis = await stockAnalysisService.analyzeStock();
      
      setStockAlerts(analysis.alerts);
      setStockSummary(analysis.summary);
      
      // Convert alerts to notifications format - Include all relevant stock alerts
      const alertNotifications = analysis.alerts
        .filter(alert => ['Critical', 'High', 'Medium', 'Watch'].includes(alert.urgencyLevel))
        .slice(0, 15) // Show more alerts for absolute stock tracking
        .map(alert => ({
          id: alert.id,
          product: alert.productName,
          urgency: alert.urgencyLevel,
          daysUntilStockout: alert.expectedStockoutDays || alert.daysEstimate || 0,
          read: alert.read,
          timestamp: alert.timestamp,
          message: alert.reason,
          orderDate: alert.orderByDate,
          orderQty: alert.recommendedOrderQty,
          orderValue: alert.estimatedOrderValue,
          currentStock: alert.currentStock,
          minStock: alert.minStock,
          stockoutDate: alert.expectedStockoutDate,
          supplierNote: alert.supplierRecommendation
        }));
      
      setNotifications(alertNotifications);
      setError(null);
    } catch (err) {
      setError('Failed to load stock analysis');
      console.error('Stock analysis error:', err);
    } finally {
      setLoading(false);
    }
  };



  // Calculate smart order dates based on stock urgency
  const calculateOrderDate = (urgency, currentStock, dailyUsage) => {
    const today = new Date();
    let daysToOrder;
    
    switch(urgency) {
      case 'Critical':
        daysToOrder = 0; // Order today
        break;
      case 'Low':
        daysToOrder = Math.max(1, Math.floor(currentStock / (dailyUsage * 2))); // Order when half depleted
        break;
      case 'Medium':
        daysToOrder = Math.floor(currentStock / dailyUsage) - 7; // Order 7 days before stockout
        break;
      default:
        daysToOrder = Math.floor(currentStock / dailyUsage) - 14; // Order 14 days before stockout
    }
    
    const orderDate = new Date(today);
    orderDate.setDate(today.getDate() + Math.max(0, daysToOrder));
    
    return orderDate.toLocaleDateString('en-IN');
  };

  // Enhanced notification formatting
  const formatNotificationMessage = (notification) => {
    const isUrgent = notification.urgency === 'Critical';
    const isHigh = notification.urgency === 'High';
    
    // Special handling for absolute stock levels
    const isCriticalStock = notification.currentStock <= 2;
    const isLowStock = notification.currentStock < 5 && notification.currentStock > 2;
    
    let title, icon;
    if (isUrgent || isCriticalStock) {
      title = isCriticalStock ? '🔴 CRITICAL: 2 OR LESS UNITS!' : '🚨 Critical Stock Alert';
    } else if (isHigh || isLowStock) {
      title = isLowStock ? '⚠️ LOW STOCK: LESS THAN 5 UNITS' : '⚠️ Low Stock Alert';
    } else {
      title = '📊 Stock Watch Alert';
    }
    
    return {
      title,
      icon,
      message: notification.message || `${notification.product} ${isUrgent ? 'needs immediate restocking' : 'stock is running low'}`,
      actionText: isUrgent ? 'Order Now' : isHigh ? 'Order Soon' : 'Monitor',
      orderInfo: notification.orderQty ? `Order ${notification.orderQty} units` : '',
      valueInfo: notification.orderValue ? `Est. ₹${notification.orderValue.toLocaleString()}` : '',
      stockInfo: `${notification.currentStock}/${notification.minStock} units`,
      stockoutInfo: notification.stockoutDate ? `Stockout: ${notification.stockoutDate}` : '',
      supplierInfo: notification.supplierNote || ''
    };
  };

  // Refresh stock analysis manually
  const refreshStockAnalysis = async () => {
    stockAnalysisService.clearCache();
    await loadStockAnalysis();
  };



  const clearNotifications = () => {
    // Mark all alerts as read in the service
    notifications.forEach(notif => {
      stockAnalysisService.markAlertAsRead(notif.id);
    });
    setNotifications([]);
  };

  const markNotificationRead = (notificationId) => {
    stockAnalysisService.markAlertAsRead(notificationId);
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const getUrgencyColor = (urgency) => {
    switch(urgency) {
      case 'Critical': return 'text-red-600 bg-red-50';
      case 'Low': return 'text-orange-600 bg-orange-50';
      case 'Medium': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-green-600 bg-green-50';
    }
  };

  const getActionText = (urgency) => {
    switch(urgency) {
      case 'Critical': return '🔴 Order Now!';
      case 'High': return '⚠️ Order Soon';
      case 'Medium': return '📊 Plan Order';
      case 'Watch': return '👀 Monitor';
      default: return '✅ Stock OK';
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="container mx-auto px-4 py-8">
        {/* Notifications Panel */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border-l-4 border-red-500">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="bg-red-100 p-2 rounded-lg mr-3">
                <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-red-800">
                  Stock Alerts & Reorder Predictions
                </h3>
                <p className="text-sm text-red-600">
                </p>
              </div>
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="ml-2 bg-red-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </div>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-gray-600">Analyzing stock levels...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 font-medium">{error}</p>
              <button 
                onClick={refreshStockAnalysis}
                className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
              >
                Try Again
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-green-600 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-700">All stock levels are healthy! 🎉</p>
              <p className="text-sm text-gray-500 mt-1">No immediate restocking needed</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {notifications.slice(0, 10).map(notification => {
                const formattedMsg = formatNotificationMessage(notification);
                const getUrgencyStyle = (urgency) => {
                  switch(urgency) {
                    case 'Critical': return 'border-l-red-600 bg-red-50';
                    case 'High': return 'border-l-orange-500 bg-orange-50';
                    case 'Medium': return 'border-l-yellow-500 bg-yellow-50';
                    case 'Watch': return 'border-l-blue-500 bg-blue-50';
                    default: return 'border-l-gray-300 bg-gray-50';
                  }
                };
                
                return (
                  <div 
                    key={notification.id} 
                    className={`p-4 rounded-lg border-l-4 ${getUrgencyStyle(notification.urgency)} transition-all duration-300 hover:shadow-md`}
                  >
                    <div className="flex items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="text-lg mr-2">{formattedMsg.icon}</span>
                          <h4 className="font-semibold text-gray-800">{formattedMsg.title}</h4>
                          <span className={`ml-2 px-2 py-1 text-xs font-bold rounded-full border ${
                            notification.urgency === 'Critical' 
                              ? 'bg-red-100 text-red-800 border-red-300 animate-pulse' 
                              : notification.urgency === 'High'
                              ? 'bg-orange-100 text-orange-800 border-orange-300'
                              : notification.urgency === 'Medium'
                              ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                              : 'bg-blue-100 text-blue-800 border-blue-300'
                          }`}>
                            {notification.urgency}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-2 font-medium">{formattedMsg.message}</p>
                        
                        {/* Only show main alert message, no extra details for dashboard */}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {notifications.length > 10 && (
                <div className="text-center py-2">
                  <p className="text-sm text-gray-500">
                    + {notifications.length - 10} more alerts
                  </p>
                  <button 
                    onClick={() => {/* Could implement show more functionality */}}
                    className="text-blue-600 hover:text-blue-800 text-xs font-medium mt-1"
                  >
                    View All Alerts
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
