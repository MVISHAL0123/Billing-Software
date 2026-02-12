import { useState, useEffect } from 'react';

const SalesReport = ({ user, onNavigateToDashboard }) => {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('date');
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    selectedCustomer: '',
    selectedProduct: ''
  });
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalCost: 0,
    totalProfit: 0,
    totalMarginPercent: 0,
    totalBills: 0
  });

  useEffect(() => {
    fetchSales();
    fetchCustomers();
    fetchProducts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [sales, filters, reportType, products]);

  useEffect(() => {
    calculateSummary();
  }, [filteredSales]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5003/api/bills/list', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();

      if (data.success) {
        setSales(data.bills || []);
      } else {
        console.error('Failed to fetch sales:', data.message);
        setSales([]);
      }
    } catch (error) {
      console.error('Error fetching sales:', error);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch('http://localhost:5003/api/customers/list', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setCustomers(data.customers || []);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:5003/api/products/list', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const applyFilters = () => {
    let result = [...sales];

    if (reportType === 'date') {
      if (filters.dateFrom) {
        result = result.filter(sale => new Date(sale.date) >= new Date(filters.dateFrom));
      }
      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        result = result.filter(sale => new Date(sale.date) <= toDate);
      }
    } else if (reportType === 'customer') {
      if (filters.selectedCustomer) {
        result = result.filter(sale =>
          sale.customer._id === filters.selectedCustomer
        );
      }
    } else if (reportType === 'product') {
      if (filters.selectedProduct) {
        result = result.filter(sale => {
          return sale.items && sale.items.some(item => item.productId._id === filters.selectedProduct);
        });
      }
    }

    setFilteredSales(result);
  };

  const calculateBillProfit = (sale) => {
    // Use the bill's actual total for sales
    const actualSales = parseFloat(sale.total) || 0;
    
    // First check if the bill already has profit data (new format)
    if (sale.totalProfit !== undefined && sale.marginPercentage !== undefined && sale.totalProfit > 0) {
      const profit = parseFloat(sale.totalProfit) || 0;
      const cost = actualSales - profit;
      const marginPercent = parseFloat(sale.marginPercentage) || 0;
      
      return {
        profit,
        cost,
        sales: actualSales,
        marginPercent
      };
    }
    
    // Calculate from items using actual product data
    if (!sale.items || sale.items.length === 0) {
      return { profit: 0, cost: 0, sales: actualSales, marginPercent: 0 };
    }
    
    let totalCost = 0;
    let totalSales = 0;
    let hasValidData = false;
    
    sale.items.forEach(item => {
      const sellingPrice = parseFloat(item.rate) || 0;
      const quantity = parseFloat(item.qty) || 0;
      const itemSales = sellingPrice * quantity;
      
      totalSales += itemSales;
      
      // Method 1: Check if item has profit data (new format)
      if (item.totalProfit !== undefined && item.purchaseRate !== undefined) {
        const purchaseRate = parseFloat(item.purchaseRate) || 0;
        totalCost += purchaseRate * quantity;
        hasValidData = true;
      }
      // Method 2: Try to find product by name to get purchase rate
      else if (item.productName && products && products.length > 0) {
        const product = products.find(p => 
          p.productName.toLowerCase().trim() === item.productName.toLowerCase().trim()
        );
        if (product && product.purchaseRate !== undefined && product.purchaseRate > 0) {
          const costPrice = parseFloat(product.purchaseRate) || 0;
          totalCost += costPrice * quantity;
          hasValidData = true;
        } else {
          // If no product found, use selling price as cost (0% margin)
          totalCost += itemSales;
        }
      } else {
        // If no data available, use selling price as cost (0% margin)
        totalCost += itemSales;
      }
    });
    
    // Use actual bill total for accuracy
    const finalSales = actualSales || totalSales;
    const profit = finalSales - totalCost;
    const marginPercent = totalCost > 0 ? (profit / totalCost) * 100 : 0;
    
    return {
      profit,
      cost: totalCost,
      sales: finalSales,
      marginPercent,
      estimated: !hasValidData
    };
  };

  const calculateSummary = () => {
    let totalSales = 0;
    let totalCost = 0;
    let totalBills = filteredSales.length;

    filteredSales.forEach(sale => {
      const billData = calculateBillProfit(sale);
      totalSales += billData.sales;
      totalCost += billData.cost;
    });

    const totalProfit = totalSales - totalCost;
    const totalMarginPercent = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

    setSummary({
      totalSales,
      totalCost,
      totalProfit,
      totalMarginPercent,
      totalBills
    });
  };

  const handleReportTypeChange = (type) => {
    setReportType(type);
    setFilters({
      dateFrom: '',
      dateTo: '',
      selectedCustomer: '',
      selectedProduct: ''
    });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRefresh = () => {
    fetchSales();
    setFilters({
      dateFrom: '',
      dateTo: '',
      selectedCustomer: '',
      selectedProduct: ''
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-xl">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">SALES REPORT ANALYTICS</h1>
              <p className="text-blue-100 text-sm">Detailed profit and margin analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleRefresh}
              className="group relative overflow-hidden bg-white/10 text-white font-semibold px-4 py-2 rounded-lg hover:bg-white/20 transition-all duration-300 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <button
              onClick={onNavigateToDashboard}
              className="group relative overflow-hidden bg-white text-blue-700 font-semibold px-5 py-2.5 rounded-lg hover:shadow-lg transition-all duration-300 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-4 gap-8">
          {/* Left Panel - Filters */}
          <div className="col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border border-blue-100 p-6 sticky top-20">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-blue-800">REPORT FILTERS</h2>
              </div>

              {/* Report Type Selection */}
              <div className="space-y-3 mb-8">
                <div className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-2">REPORT TYPE</div>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer group p-3 rounded-lg hover:bg-blue-50 transition-colors">
                    <input
                      type="radio"
                      name="reportType"
                      value="date"
                      checked={reportType === 'date'}
                      onChange={(e) => handleReportTypeChange(e.target.value)}
                      className="w-4 h-4 text-blue-600 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-800 group-hover:text-blue-700">Date Wise</div>
                      <div className="text-xs text-gray-500">Filter by date range</div>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${reportType === 'date' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group p-3 rounded-lg hover:bg-blue-50 transition-colors">
                    <input
                      type="radio"
                      name="reportType"
                      value="customer"
                      checked={reportType === 'customer'}
                      onChange={(e) => handleReportTypeChange(e.target.value)}
                      className="w-4 h-4 text-blue-600 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-800 group-hover:text-blue-700">Customer Wise</div>
                      <div className="text-xs text-gray-500">Filter by customer</div>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${reportType === 'customer' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group p-3 rounded-lg hover:bg-blue-50 transition-colors">
                    <input
                      type="radio"
                      name="reportType"
                      value="product"
                      checked={reportType === 'product'}
                      onChange={(e) => handleReportTypeChange(e.target.value)}
                      className="w-4 h-4 text-blue-600 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-800 group-hover:text-blue-700">Product Wise</div>
                      <div className="text-xs text-gray-500">Filter by product</div>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${reportType === 'product' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                  </label>
                </div>
              </div>

              {/* Filter Options */}
              <div className="mb-8">
                <div className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-3">FILTER OPTIONS</div>
                
                {reportType === 'date' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-blue-600 mb-2">FROM DATE</label>
                      <input
                        type="date"
                        name="dateFrom"
                        value={filters.dateFrom}
                        onChange={handleFilterChange}
                        className="w-full px-4 py-2.5 bg-white border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-blue-600 mb-2">TO DATE</label>
                      <input
                        type="date"
                        name="dateTo"
                        value={filters.dateTo}
                        onChange={handleFilterChange}
                        className="w-full px-4 py-2.5 bg-white border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                      />
                    </div>
                  </div>
                )}

                {reportType === 'customer' && (
                  <div>
                    <label className="block text-xs font-semibold text-blue-600 mb-2">SELECT CUSTOMER</label>
                    <select
                      name="selectedCustomer"
                      value={filters.selectedCustomer}
                      onChange={handleFilterChange}
                      className="w-full px-4 py-2.5 bg-white border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    >
                      <option value="">All Customers</option>
                      {customers.map(customer => (
                        <option key={customer._id} value={customer._id}>
                          {customer.customerName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {reportType === 'product' && (
                  <div>
                    <label className="block text-xs font-semibold text-blue-600 mb-2">SELECT PRODUCT</label>
                    <select
                      name="selectedProduct"
                      value={filters.selectedProduct}
                      onChange={handleFilterChange}
                      className="w-full px-4 py-2.5 bg-white border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    >
                      <option value="">All Products</option>
                      {products.map(product => (
                        <option key={product._id} value={product._id}>
                          {product.productName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Summary Card */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 rounded-xl p-4">
                <div className="text-center mb-3">
                  <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide">FILTERED RESULTS</div>
                  <div className="text-3xl font-bold text-blue-800 mt-1">{filteredSales.length}</div>
                  <div className="text-xs text-blue-600">Bills Found</div>
                </div>
                <div className="text-center">
                  <button
                    onClick={handleRefresh}
                    className="w-full bg-white text-blue-700 font-semibold px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors border border-blue-200"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Table and Summary */}
          <div className="col-span-3">
            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-blue-100 p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-blue-700 uppercase">Total Sales</div>
                    <div className="text-lg font-bold text-gray-800">₹{summary.totalSales.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-blue-100 p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-blue-700 uppercase">Total Profit</div>
                    <div className="text-lg font-bold text-green-600">₹{summary.totalProfit.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-blue-100 p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-blue-700 uppercase">Margin %</div>
                    <div className="text-lg font-bold text-yellow-600">{summary.totalMarginPercent.toFixed(1)}%</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-blue-100 p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-blue-700 uppercase">Total Bills</div>
                    <div className="text-lg font-bold text-purple-600">{summary.totalBills}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sales Table */}
            <div className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 px-6 py-4 border-b border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <h2 className="text-lg font-bold text-blue-800">SALES REPORT</h2>
                  </div>
                  <div className="text-sm text-blue-600 font-semibold">
                    Showing {filteredSales.length} of {sales.length} bills
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="p-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-gray-600 font-semibold">Loading sales analytics...</p>
                </div>
              ) : filteredSales.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-semibold mb-2">No sales records found</p>
                  <p className="text-sm text-gray-500">Try adjusting your filter criteria</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-blue-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider border-r border-blue-100">S.No</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider border-r border-blue-100">Bill No</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider border-r border-blue-100">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider border-r border-blue-100">Customer</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-blue-700 uppercase tracking-wider border-r border-blue-100">Sales Amount</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-blue-700 uppercase tracking-wider border-r border-blue-100">Profit (₹)</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-blue-700 uppercase tracking-wider">Margin %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-100">
                      {filteredSales.map((sale, index) => {
                        const { profit, sales: billSales, marginPercent, estimated } = calculateBillProfit(sale);
                        
                        return (
                          <tr
                            key={sale._id}
                            className="hover:bg-blue-50/50 transition-colors group"
                          >
                            <td className="px-6 py-4 text-center">
                              <div className="text-sm font-medium text-gray-700">{index + 1}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 group-hover:bg-blue-200 transition-colors">
                                #{sale.billNo}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">
                                {new Date(sale.date).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-semibold text-gray-900">{sale.customer?.customerName || 'N/A'}</div>
                              <div className="text-xs text-blue-600">{sale.customer?.phoneNumber || ''}</div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="text-sm font-bold text-gray-800">₹{billSales.toFixed(2)}</div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className={`text-sm font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ₹{profit.toFixed(2)}
                              </div>
                              {estimated && (
                                <div className="text-xs text-orange-500 mt-1">est.</div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className={`text-sm font-bold ${marginPercent >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {marginPercent.toFixed(1)}%
                              </div>
                              <div className={`w-full h-1 mt-1 rounded-full ${marginPercent >= 0 ? 'bg-emerald-200' : 'bg-red-200'}`}>
                                <div 
                                  className={`h-full rounded-full ${marginPercent >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                                  style={{ width: `${Math.min(Math.abs(marginPercent), 100)}%` }}
                                ></div>
                              </div>
                              {estimated && (
                                <div className="text-xs text-orange-500 mt-1">est.</div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesReport;