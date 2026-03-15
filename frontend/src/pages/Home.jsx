import { useState, useEffect } from 'react';
import stockAnalysisService from '../services/stockAnalysisService';
import { API_BASE_URL } from '../utils/constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CHART_COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e'];

const Home = () => {
  // Stock analysis state
  const [stockAlerts, setStockAlerts] = useState([]);
  const [stockSummary, setStockSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // AI stock predictions and notifications
  const [notifications, setNotifications] = useState([]);

  // Top selling products
  const [topProducts, setTopProducts] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);

  // Load stock analysis on component mount
  useEffect(() => {
    loadStockAnalysis();
    loadTopSellingProducts();

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

  // Load top selling products from bills
  const loadTopSellingProducts = async () => {
    try {
      setChartLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/bills/list`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success && data.bills) {
        // Aggregate qty sold per product across all bills
        const productSales = {};
        data.bills.forEach(bill => {
          (bill.items || []).forEach(item => {
            const name = item.productName;
            if (!name) return;
            if (!productSales[name]) {
              productSales[name] = { name, qtySold: 0, revenue: 0 };
            }
            productSales[name].qtySold += (item.qty || 0);
            productSales[name].revenue += (item.amount || 0);
          });
        });

        // Sort by qty sold descending, take top 5
        const sorted = Object.values(productSales)
          .sort((a, b) => b.qtySold - a.qtySold)
          .slice(0, 5);

        setTopProducts(sorted);
      }
    } catch (err) {
      console.error('Error loading top products:', err);
    } finally {
      setChartLoading(false);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100">
      <div className="container mx-auto px-4 py-6">
        {/* Two-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Stock Alerts Card */}
        <div className="relative overflow-hidden rounded-2xl max-h-[280px]" style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
          {/* Top gradient accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500"></div>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg shadow-red-500/30">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse shadow-lg">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </div>
                <div className="ml-3">
                  <h3 className="text-base font-bold text-gray-800 tracking-tight">Stock Alerts</h3>
                  <p className="text-xs text-gray-500">Reorder Predictions</p>
                </div>
              </div>
              <button onClick={refreshStockAnalysis} className="p-2 rounded-lg hover:bg-gray-100 transition-colors group" title="Refresh">
                <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin mr-3"></div>
                <span className="text-gray-500 text-sm">Analyzing stock...</span>
              </div>
            ) : error ? (
              <div className="text-center py-6">
                <p className="text-red-500 font-medium text-sm">{error}</p>
                <button onClick={refreshStockAnalysis} className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium">Try Again</button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-2">
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-green-600">All stock levels healthy!</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,0,0,0.15) transparent' }}>
                {notifications.slice(0, 10).map(notification => {
                  const formattedMsg = formatNotificationMessage(notification);
                  const getUrgencyGradient = (urgency) => {
                    switch(urgency) {
                      case 'Critical': return 'from-red-50 to-red-100/50 border-red-200';
                      case 'High': return 'from-orange-50 to-orange-100/50 border-orange-200';
                      case 'Medium': return 'from-yellow-50 to-yellow-100/50 border-yellow-200';
                      case 'Watch': return 'from-blue-50 to-blue-100/50 border-blue-200';
                      default: return 'from-gray-50 to-gray-100/50 border-gray-200';
                    }
                  };
                  const getDotColor = (urgency) => {
                    switch(urgency) {
                      case 'Critical': return 'bg-red-500 shadow-red-500/50';
                      case 'High': return 'bg-orange-500 shadow-orange-500/50';
                      case 'Medium': return 'bg-yellow-500 shadow-yellow-500/50';
                      default: return 'bg-blue-500 shadow-blue-500/50';
                    }
                  };

                  return (
                    <div
                      key={notification.id}
                      className={`px-3 py-2 rounded-xl bg-gradient-to-r ${getUrgencyGradient(notification.urgency)} border transition-all duration-300 hover:scale-[1.02] hover:shadow-md cursor-default`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getDotColor(notification.urgency)} shadow-lg flex-shrink-0 ${notification.urgency === 'Critical' ? 'animate-pulse' : ''}`}></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-gray-800 truncate">{notification.product}</h4>
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                              notification.urgency === 'Critical' ? 'bg-red-100 text-red-700'
                              : notification.urgency === 'High' ? 'bg-orange-100 text-orange-700'
                              : notification.urgency === 'Medium' ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-blue-100 text-blue-700'
                            }`}>
                              {notification.urgency}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 truncate">{formattedMsg.message}</p>
                        </div>
                        <span className="text-xs font-mono text-gray-400 flex-shrink-0">{notification.currentStock}/{notification.minStock}</span>
                      </div>
                    </div>
                  );
                })}

                {notifications.length > 10 && (
                  <div className="text-center py-1">
                    <span className="text-xs text-gray-400">+ {notifications.length - 10} more alerts</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Top 5 Selling Products Card */}
        <div className="relative overflow-hidden rounded-2xl max-h-[280px]" style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
          {/* Top gradient accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-base font-bold text-gray-800 tracking-tight">Top 5 Products</h3>
                  <p className="text-xs text-gray-500">Best sellers by quantity</p>
                </div>
              </div>
            </div>

            {chartLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin mr-3"></div>
                <span className="text-gray-500 text-sm">Loading sales data...</span>
              </div>
            ) : topProducts.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-400 text-sm">No sales data available yet.</p>
              </div>
            ) : (
              <div className="w-full" style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts} margin={{ top: 5, right: 10, left: -10, bottom: 50 }}>
                    <defs>
                      <linearGradient id="barGrad1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.5} />
                      </linearGradient>
                      <linearGradient id="barGrad2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0.5} />
                      </linearGradient>
                      <linearGradient id="barGrad3" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.5} />
                      </linearGradient>
                      <linearGradient id="barGrad4" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity={1} />
                        <stop offset="100%" stopColor="#a855f7" stopOpacity={0.5} />
                      </linearGradient>
                      <linearGradient id="barGrad5" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ec4899" stopOpacity={1} />
                        <stop offset="100%" stopColor="#ec4899" stopOpacity={0.5} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis
                      dataKey="name"
                      angle={-35}
                      textAnchor="end"
                      interval={0}
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      height={60}
                      axisLine={{ stroke: '#e5e7eb' }}
                      tickLine={{ stroke: '#e5e7eb' }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      axisLine={{ stroke: '#e5e7eb' }}
                      tickLine={{ stroke: '#e5e7eb' }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                        background: 'rgba(255,255,255,0.95)',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                        color: '#1f2937'
                      }}
                      formatter={(value, name) => {
                        if (name === 'qtySold') return [<span style={{color:'#3b82f6',fontWeight:'bold'}}>{value}</span>, 'Qty Sold'];
                        if (name === 'revenue') return [<span style={{color:'#10b981',fontWeight:'bold'}}>&#8377;{value.toFixed(2)}</span>, 'Revenue'];
                        return [value, name];
                      }}
                      labelStyle={{ color: '#374151', fontWeight: 'bold', marginBottom: '4px' }}
                    />
                    <Bar dataKey="qtySold" radius={[8, 8, 0, 0]} barSize={36}>
                      {topProducts.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`url(#barGrad${(index % 5) + 1})`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        </div>{/* End grid */}
      </div>
    </div>
  );
};

export default Home;
