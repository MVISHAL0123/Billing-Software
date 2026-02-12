import { useState, useEffect, useRef } from 'react';

const SalesDisplay = ({ user, onNavigateToDashboard, onNavigateToSalesWithCustomer }) => {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    invoiceFrom: '',
    invoiceTo: '',
    customerName: '',
    productName: ''
  });
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);
  const [selectedCustomerIndex, setSelectedCustomerIndex] = useState(-1);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [selectedProductIndex, setSelectedProductIndex] = useState(-1);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [displayClicked, setDisplayClicked] = useState(false);
  
  const customerListRef = useRef(null);
  const customerInputRef = useRef(null);
  const productListRef = useRef(null);
  const productInputRef = useRef(null);
  const refreshIntervalRef = useRef(null);

  useEffect(() => {
    fetchSales();
    fetchCustomers();
    fetchProducts();
    
    // Set up auto-refresh interval
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        fetchSales();
        setLastRefresh(new Date());
      }, 5000); // Refresh every 5 seconds
    }
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh]);

  useEffect(() => {
    applyFilters();
  }, [sales, filters]);

  useEffect(() => {
    if (selectedCustomerIndex >= 0 && customerListRef.current) {
      const selectedRow = customerListRef.current.querySelector(`[data-index="${selectedCustomerIndex}"]`);
      if (selectedRow) {
        selectedRow.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedCustomerIndex]);

  useEffect(() => {
    if (selectedProductIndex >= 0 && productListRef.current) {
      const selectedRow = productListRef.current.querySelector(`[data-index="${selectedProductIndex}"]`);
      if (selectedRow) {
        selectedRow.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedProductIndex]);

  const fetchSales = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    try {
      const response = await fetch('http://localhost:5003/api/bills/list', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();

      if (data.success) {
        // Sort bills by invoice number in ascending order
        const sortedBills = (data.bills || []).sort((a, b) => {
          const invoiceA = parseInt(a.billNo) || 0;
          const invoiceB = parseInt(b.billNo) || 0;
          return invoiceA - invoiceB;
        });
        setSales(sortedBills);
      } else {
        console.error('Failed to fetch sales:', data.message);
        setSales([]);
      }
    } catch (error) {
      console.error('Error fetching sales:', error);
      setSales([]);
    } finally {
      if (!silent) {
        setLoading(false);
      }
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
        setAllCustomers(data.customers || []);
      } else {
        console.error('Failed to fetch customers:', data.message);
        setAllCustomers([]);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      setAllCustomers([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:5003/api/products/list', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAllProducts(data.products || []);
        } else {
          console.error('Failed to fetch products:', data.message);
          setAllProducts([]);
        }
      } else {
        console.error('Failed to fetch products');
        setAllProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setAllProducts([]);
    }
  };

  const applyFilters = () => {
    let result = [...sales];

    // Filter by Date Range
    if (filters.dateFrom) {
      result = result.filter(sale => new Date(sale.date) >= new Date(filters.dateFrom));
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      result = result.filter(sale => new Date(sale.date) <= toDate);
    }

    // Filter by Invoice No Range
    if (filters.invoiceFrom) {
      result = result.filter(sale => sale.billNo >= parseInt(filters.invoiceFrom));
    }

    if (filters.invoiceTo) {
      result = result.filter(sale => sale.billNo <= parseInt(filters.invoiceTo));
    }

    // Filter by Customer Name
    if (filters.customerName.trim()) {
      result = result.filter(sale =>
        sale.customer?.customerName?.toLowerCase().includes(filters.customerName.toLowerCase())
      );
    }

    // Filter by Product Name
    if (filters.productName.trim()) {
      result = result.filter(sale =>
        sale.items && sale.items.some(item =>
          item.productName?.toLowerCase().includes(filters.productName.toLowerCase())
        )
      );
    }

    // Ensure results are sorted by invoice number in ascending order
    result.sort((a, b) => {
      const invoiceA = parseInt(a.billNo) || 0;
      const invoiceB = parseInt(b.billNo) || 0;
      return invoiceA - invoiceB;
    });

    setFilteredSales(result);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));

    // Only show dropdowns if display hasn't been clicked yet
    if (!displayClicked) {
      if (name === 'customerName') {
        if (value.trim()) {
          const filtered = allCustomers.filter(customer =>
            customer.customerName?.toLowerCase().includes(value.toLowerCase())
          );
          setFilteredCustomers(filtered);
          setSelectedCustomerIndex(-1);
          setShowCustomerDropdown(true);
        } else {
          setFilteredCustomers([]);
          setShowCustomerDropdown(false);
          setSelectedCustomerIndex(-1);
        }
      } else if (name === 'productName') {
        if (value.trim()) {
          const filtered = allProducts.filter(product =>
            product.productName && product.productName.toLowerCase().includes(value.toLowerCase())
          );
          setFilteredProducts(filtered.map(p => p.productName));
          setSelectedProductIndex(-1);
          setShowProductDropdown(true);
        } else {
          setFilteredProducts([]);
          setShowProductDropdown(false);
          setSelectedProductIndex(-1);
        }
      }
    }

  };

  const handleCustomerKeyDown = (e) => {
    if (filteredCustomers.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedCustomerIndex(prev => {
        const newIndex = prev < filteredCustomers.length - 1 ? prev + 1 : 0;
        return newIndex;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedCustomerIndex(prev => {
        const newIndex = prev > 0 ? prev - 1 : filteredCustomers.length - 1;
        return newIndex;
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedCustomerIndex >= 0 && filteredCustomers[selectedCustomerIndex]) {
        selectCustomer(filteredCustomers[selectedCustomerIndex]);
      } else if (filteredCustomers.length > 0) {
        selectCustomer(filteredCustomers[0]);
      }
    } else if (e.key === 'Escape') {
      setSelectedCustomerIndex(-1);
      setFilters(prev => ({ ...prev, customerName: '' }));
    }
  };

  const selectCustomer = (customer) => {
    setFilters(prev => ({ ...prev, customerName: customer.customerName }));
    setSelectedCustomerIndex(-1);
    // Focus back to the input after selection
    if (customerInputRef.current) {
      customerInputRef.current.blur();
    }
  };

  const handleProductKeyDown = (e) => {
    if (filteredProducts.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedProductIndex(prev => {
        const newIndex = prev < filteredProducts.length - 1 ? prev + 1 : 0;
        return newIndex;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedProductIndex(prev => {
        const newIndex = prev > 0 ? prev - 1 : filteredProducts.length - 1;
        return newIndex;
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedProductIndex >= 0 && filteredProducts[selectedProductIndex]) {
        selectProduct(filteredProducts[selectedProductIndex]);
      } else if (filteredProducts.length > 0) {
        selectProduct(filteredProducts[0]);
      }
    } else if (e.key === 'Escape') {
      setSelectedProductIndex(-1);
      setFilters(prev => ({ ...prev, productName: '' }));
    }
  };

  const selectProduct = (productName) => {
    setFilters(prev => ({ ...prev, productName: productName }));
    setSelectedProductIndex(-1);
    // Focus back to the input after selection
    if (productInputRef.current) {
      productInputRef.current.blur();
    }
  };

  const handleDisplay = () => {
    setDisplayClicked(true);
    setShowCustomerDropdown(false);
    setShowProductDropdown(false);
    applyFilters();
  };

  const handleRefresh = () => {
    setDisplayClicked(false);
    setFilters({
      dateFrom: '',
      dateTo: '',
      invoiceFrom: '',
      invoiceTo: '',
      customerName: '',
      productName: ''
    });
    setFilteredCustomers([]);
    setFilteredProducts([]);
    setShowCustomerDropdown(false);
    setShowProductDropdown(false);
    setSelectedCustomerIndex(-1);
    setSelectedProductIndex(-1);
    setSelectedBill(null);
    fetchSales();
    setLastRefresh(new Date());
  };

  const handleExit = () => {
    onNavigateToDashboard?.();
  };

  const calculateTotalRevenue = () => {
    return filteredSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No Date';
    
    let date;
    
    try {
      // Handle Firestore Timestamp object with _seconds property (from Firebase SDK)
      if (dateString && typeof dateString === 'object' && dateString._seconds) {
        date = new Date(dateString._seconds * 1000);
      }
      // Handle Firestore Timestamp object with seconds property
      else if (dateString && typeof dateString === 'object' && dateString.seconds) {
        date = new Date(dateString.seconds * 1000);
      }
      // Handle Firestore Timestamp with toDate method
      else if (dateString && typeof dateString === 'object' && dateString.toDate) {
        date = dateString.toDate();
      }
      // Handle regular date string
      else {
        date = new Date(dateString);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.log('Invalid date detected:', dateString);
        return 'Invalid Date';
      }
      
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Date formatting error:', error, dateString);
      return 'Date Error';
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-6 py-3 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-white text-blue-600 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xl">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold">SALES DISPLAY</h1>
            <p className="text-blue-100 text-sm">View and filter sales records</p>
          </div>
        </div>
        <button
          onClick={onNavigateToDashboard}
          className="px-4 py-2 bg-white text-blue-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Dashboard
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 flex flex-col gap-2">
        {/* Top Panel - Filters and Customer/Product Display */}
        <div className="grid grid-cols-2 gap-4 h-64">
          {/* Left Panel - Filters */}
          <div className="bg-white border border-blue-100 rounded-xl shadow-sm flex flex-col">
            <div className="bg-blue-50 px-3 py-2 rounded-t-xl border-b border-blue-100">
              <h2 className="text-blue-800 font-bold text-xs uppercase tracking-wide">FILTERS</h2>
            </div>
            <div className="p-3 flex-1 overflow-auto">
              <div className="space-y-4 mb-4">
                {/* Date Range - Side by Side */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Date From */}
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-semibold text-blue-700 w-20 flex-shrink-0">Date From</label>
                    <input
                      type="date"
                      name="dateFrom"
                      value={filters.dateFrom}
                      onChange={handleFilterChange}
                      className="flex-1 px-3 py-2 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    />
                  </div>

                  {/* Date To */}
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-semibold text-blue-700 w-20 flex-shrink-0">Date To</label>
                    <input
                      type="date"
                      name="dateTo"
                      value={filters.dateTo}
                      onChange={handleFilterChange}
                      className="flex-1 px-3 py-2 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    />
                  </div>
                </div>

                {/* Invoice Range - Side by Side */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Invoice From */}
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-semibold text-blue-700 w-20 flex-shrink-0">Invoice From</label>
                    <input
                      type="number"
                      name="invoiceFrom"
                      value={filters.invoiceFrom}
                      onChange={handleFilterChange}
                      placeholder="Bill number"
                      className="flex-1 px-3 py-2 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    />
                  </div>

                  {/* Invoice To */}
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-semibold text-blue-700 w-20 flex-shrink-0">Invoice To</label>
                    <input
                      type="number"
                      name="invoiceTo"
                      value={filters.invoiceTo}
                      onChange={handleFilterChange}
                      placeholder="Bill number"
                      className="flex-1 px-3 py-2 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    />
                  </div>
                </div>

                {/* Customer and Product Names - Side by Side */}
                <div className="flex gap-4">
                  {/* Customer Name */}
                  <div className="flex-1 flex items-center gap-3">
                    <label className="text-xs font-semibold text-blue-700 w-20 flex-shrink-0">Customer</label>
                    <input
                      ref={customerInputRef}
                      type="text"
                      name="customerName"
                      value={filters.customerName}
                      onChange={handleFilterChange}
                      onKeyDown={handleCustomerKeyDown}
                      placeholder="Type customer name"
                      className="flex-1 px-3 py-2 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      autoComplete="off"
                    />
                  </div>

                  {/* Product Name */}
                  <div className="flex-1 flex items-center gap-3">
                    <label className="text-xs font-semibold text-blue-700 w-20 flex-shrink-0">Product</label>
                    <input
                      ref={productInputRef}
                      type="text"
                      name="productName"
                      value={filters.productName}
                      onChange={handleFilterChange}
                      onKeyDown={handleProductKeyDown}
                      placeholder="Type product name"
                      className="flex-1 px-3 py-2 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      autoComplete="off"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-1">
                <div className="flex gap-2">
                  <button
                    onClick={handleDisplay}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-1 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Display
                  </button>
                  <button
                    onClick={handleRefresh}
                    className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 font-semibold rounded-lg hover:bg-blue-200 transition-colors shadow-sm flex items-center justify-center gap-1 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                  <button
                    onClick={handleExit}
                    className="flex-1 px-3 py-2 bg-white text-red-600 font-semibold rounded-lg hover:bg-red-50 transition-colors border border-red-200 shadow-sm flex items-center justify-center gap-1 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Exit
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Customer/Product Info */}
          <div className="bg-white border border-blue-100 rounded-xl shadow-sm flex flex-col">
            <div className="bg-blue-50 px-3 py-2 rounded-t-xl border-b border-blue-100">
              <h2 className="text-blue-800 font-bold text-xs uppercase tracking-wide">
                {filters.customerName ? 'CUSTOMER SELECTION' : filters.productName ? 'PRODUCT SELECTION' : 'SELECTION PANEL'}
              </h2>
            </div>
            <div className="p-2 flex-1 overflow-auto">
              {/* Customer Selection */}
              {filters.customerName && filteredCustomers.length > 0 ? (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-blue-700 mb-2">Available Customers</h3>
                  <div ref={customerListRef} className="bg-gray-50 rounded-lg max-h-40 overflow-y-auto">
                    {filteredCustomers.map((customer, index) => (
                      <div
                        key={customer._id}
                        data-index={index}
                        className={`p-2 cursor-pointer border-b border-gray-200 last:border-b-0 hover:bg-blue-50 transition-colors ${
                          selectedCustomerIndex === index
                            ? 'bg-blue-200 border-blue-400 ring-1 ring-blue-300'
                            : filters.customerName === customer.customerName
                            ? 'bg-blue-100 border-blue-300'
                            : ''
                        }`}
                        onClick={() => {
                          setFilters(prev => ({ ...prev, customerName: customer.customerName }));
                          setSelectedCustomerIndex(-1);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 text-sm">{customer.customerName}</div>
                          </div>
                          {selectedCustomerIndex === index && (
                            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                              <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : filters.customerName && allCustomers.length > 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">No customers found matching "{filters.customerName}"</p>
                </div>
              ) : showProductDropdown && filteredProducts.length > 0 ? (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-green-700 mb-2">Available Products</h3>
                  <div ref={productListRef} className="bg-gray-50 rounded-lg max-h-40 overflow-y-auto">
                    {filteredProducts.map((product, index) => (
                      <div
                        key={product}
                        data-index={index}
                        className={`p-2 cursor-pointer border-b border-gray-200 last:border-b-0 hover:bg-green-50 transition-colors ${
                          selectedProductIndex === index
                            ? 'bg-green-200 border-green-400 ring-1 ring-green-300'
                            : filters.productName === product
                            ? 'bg-green-100 border-green-300'
                            : ''
                        }`}
                        onClick={() => {
                          setFilters(prev => ({ ...prev, productName: product }));
                          setSelectedProductIndex(-1);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                            <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 text-sm">{product}</div>
                          </div>
                          {selectedProductIndex === index && (
                            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                              <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : showProductDropdown && filters.productName ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">No products found matching "{filters.productName}"</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm italic">Type customer or product name to see options</p>
                </div>
              )}

              {/* Selected Info */}
              {filters.productName && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div>
                    <h3 className="text-sm font-semibold text-green-700 mb-2">Selected Product</h3>
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-bold text-green-800">{filters.productName}</div>
                          <div className="text-xs text-green-600 mt-1">Product Item</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sales Table */}
        <div className="flex-1 bg-white border border-blue-100 rounded-xl shadow-sm overflow-hidden flex flex-col">
          {/* <div className="bg-blue-50 px-4 py-3 border-b border-blue-100">
            <h2 className="text-blue-800 font-bold text-sm uppercase tracking-wide">SALES RECORDS</h2>
          </div> */}
          <div className="flex-1 overflow-auto">
            <table className="w-full min-w-full">
              <thead>
                <tr className="bg-blue-100">
                  <th className="px-4 py-3 text-left text-xs font-bold text-blue-800 uppercase tracking-wider border-b border-blue-200">S.No</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-blue-800 uppercase tracking-wider border-b border-blue-200">Invoice No</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-blue-800 uppercase tracking-wider border-b border-blue-200">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-blue-800 uppercase tracking-wider border-b border-blue-200">Customer</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-blue-800 uppercase tracking-wider border-b border-blue-200">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-50">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                      <p className="mt-2 text-sm text-blue-600">Loading sales records...</p>
                    </td>
                  </tr>
                ) : filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center">
                      <div className="text-gray-400">
                        <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p className="text-sm">No sales records found</p>
                        <p className="text-xs mt-1">Try adjusting your filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale, index) => (
                    <tr
                      key={sale._id}
                      onClick={() => setSelectedBill(sale)}
                      className={`cursor-pointer transition-colors ${
                        selectedBill?._id === sale._id
                          ? 'bg-blue-50'
                          : 'hover:bg-blue-50'
                      }`}
                    >
                      <td className="px-4 py-3 text-sm text-gray-700 font-medium">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {sale.billNo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {formatDate(sale.date)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{sale.customer?.customerName || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{sale.customer?.phoneNumber || ''}</div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="text-sm font-bold text-blue-700">₹{sale.total?.toFixed(2) || '0.00'}</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Summary */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-md">
          <div className="px-6 py-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="font-bold">Total Bills:</span>
              <span className="ml-2 text-lg font-black">{filteredSales.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-bold">Total Amount:</span>
              <span className="ml-2 text-lg font-black">₹{calculateTotalRevenue().toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesDisplay;