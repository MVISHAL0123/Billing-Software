import { useState, useEffect, useRef } from 'react';

const PurchaseDisplay = ({ user, onNavigateToDashboard }) => {
  const [purchases, setPurchases] = useState([]);
  const [filteredPurchases, setFilteredPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    grnFrom: '',
    grnTo: '',
    supplierName: '',
    productName: ''
  });
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [allSuppliers, setAllSuppliers] = useState([]);
  const [selectedSupplierIndex, setSelectedSupplierIndex] = useState(-1);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [selectedProductIndex, setSelectedProductIndex] = useState(-1);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [displayClicked, setDisplayClicked] = useState(false);
  
  const supplierListRef = useRef(null);
  const supplierInputRef = useRef(null);
  const productListRef = useRef(null);
  const productInputRef = useRef(null);
  const refreshIntervalRef = useRef(null);

  useEffect(() => {
    fetchPurchases();
    fetchSuppliers();
    fetchProducts();
    
    // Set up auto-refresh interval
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        fetchPurchases();
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
  }, [purchases, filters]);

  useEffect(() => {
    if (selectedSupplierIndex >= 0 && supplierListRef.current) {
      const selectedRow = supplierListRef.current.querySelector(`[data-index="${selectedSupplierIndex}"]`);
      if (selectedRow) {
        selectedRow.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedSupplierIndex]);

  useEffect(() => {
    if (selectedProductIndex >= 0 && productListRef.current) {
      const selectedRow = productListRef.current.querySelector(`[data-index="${selectedProductIndex}"]`);
      if (selectedRow) {
        selectedRow.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedProductIndex]);

  const fetchPurchases = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    try {
      const response = await fetch('http://localhost:5003/api/purchases/list', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Sort purchases by GRN number in ascending order
          const sortedPurchases = (data.purchases || []).sort((a, b) => {
            const grnA = parseInt(a.grnNo.replace(/\D/g, '')) || 0;
            const grnB = parseInt(b.grnNo.replace(/\D/g, '')) || 0;
            return grnA - grnB;
          });
          setPurchases(sortedPurchases);
        } else {
          console.error('Failed to fetch purchases:', data.message);
          setPurchases([]);
        }
      } else {
        console.error('Failed to fetch purchases');
        setPurchases([]);
      }
    } catch (error) {
      console.error('Error fetching purchases:', error);
      setPurchases([]);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('http://localhost:5003/api/suppliers/list', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAllSuppliers(data.suppliers || []);
        } else {
          console.error('Failed to fetch suppliers:', data.message);
          setAllSuppliers([]);
        }
      } else {
        console.error('Failed to fetch suppliers');
        setAllSuppliers([]);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      setAllSuppliers([]);
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
    let result = [...purchases];

    // Filter by Date Range
    if (filters.dateFrom) {
      result = result.filter(purchase => new Date(purchase.date) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      result = result.filter(purchase => new Date(purchase.date) <= new Date(filters.dateTo));
    }

    // Filter by GRN Range
    if (filters.grnFrom) {
      result = result.filter(purchase => parseInt(purchase.grnNo) >= parseInt(filters.grnFrom));
    }
    if (filters.grnTo) {
      result = result.filter(purchase => parseInt(purchase.grnNo) <= parseInt(filters.grnTo));
    }

    // Filter by Supplier Name
    if (filters.supplierName) {
      result = result.filter(purchase =>
        (purchase.supplier?.supplierName || purchase.supplierName)?.toLowerCase().includes(filters.supplierName.toLowerCase())
      );
    }

    // Filter by Product Name
    if (filters.productName) {
      result = result.filter(purchase =>
        purchase.items && purchase.items.some(item =>
          item.productName?.toLowerCase().includes(filters.productName.toLowerCase())
        )
      );
    }

    // Ensure results are sorted by GRN number in ascending order
    result.sort((a, b) => {
      const grnA = parseInt(a.grnNo.replace(/\D/g, '')) || 0;
      const grnB = parseInt(b.grnNo.replace(/\D/g, '')) || 0;
      return grnA - grnB;
    });

    setFilteredPurchases(result);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));

    // Only show dropdowns if display hasn't been clicked yet
    if (!displayClicked) {
      if (name === 'supplierName') {
        if (value.trim()) {
          const filtered = allSuppliers.filter(supplier =>
            supplier.supplierName && supplier.supplierName.toLowerCase().includes(value.toLowerCase())
          );
          setFilteredSuppliers(filtered);
          setSelectedSupplierIndex(-1);
          setShowSupplierDropdown(true);
        } else {
          setFilteredSuppliers([]);
          setShowSupplierDropdown(false);
          setSelectedSupplierIndex(-1);
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

  const handleSupplierKeyDown = (e) => {
    if (filteredSuppliers.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSupplierIndex(prev => {
        const newIndex = prev < filteredSuppliers.length - 1 ? prev + 1 : 0;
        return newIndex;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSupplierIndex(prev => {
        const newIndex = prev > 0 ? prev - 1 : filteredSuppliers.length - 1;
        return newIndex;
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedSupplierIndex >= 0 && filteredSuppliers[selectedSupplierIndex]) {
        selectSupplier(filteredSuppliers[selectedSupplierIndex]);
      } else if (filteredSuppliers.length > 0) {
        selectSupplier(filteredSuppliers[0]);
      }
    } else if (e.key === 'Escape') {
      setSelectedSupplierIndex(-1);
      setFilters(prev => ({ ...prev, supplierName: '' }));
    }
  };

  const selectSupplier = (supplier) => {
    setFilters(prev => ({ ...prev, supplierName: supplier.supplierName }));
    setSelectedSupplierIndex(-1);
    // Focus back to the input after selection
    if (supplierInputRef.current) {
      supplierInputRef.current.blur();
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
    setShowSupplierDropdown(false);
    setShowProductDropdown(false);
    applyFilters();
  };

  const handleRefresh = () => {
    setDisplayClicked(false);
    setFilters({
      dateFrom: '',
      dateTo: '',
      grnFrom: '',
      grnTo: '',
      supplierName: '',
      productName: ''
    });
    setFilteredSuppliers([]);
    setFilteredProducts([]);
    setShowSupplierDropdown(false);
    setShowProductDropdown(false);
    setSelectedSupplierIndex(-1);
    setSelectedProductIndex(-1);
    setSelectedPurchase(null);
    fetchPurchases();
    setLastRefresh(new Date());
  };

  const handleExit = () => {
    onNavigateToDashboard?.();
  };

  const calculateTotalAmount = () => {
    return filteredPurchases.reduce((sum, purchase) => sum + (purchase.total || purchase.grandTotal || 0), 0);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold">PURCHASE DISPLAY</h1>
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
        {/* Top Panel - Filters and Supplier/Product Display */}
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

                {/* GRN Range - Side by Side */}
                <div className="grid grid-cols-2 gap-4">
                  {/* GRN From */}
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-semibold text-blue-700 w-20 flex-shrink-0">GRN From</label>
                    <input
                      type="number"
                      name="grnFrom"
                      value={filters.grnFrom}
                      onChange={handleFilterChange}
                      placeholder="GRN number"
                      className="flex-1 px-3 py-2 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    />
                  </div>

                  {/* GRN To */}
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-semibold text-blue-700 w-20 flex-shrink-0">GRN To</label>
                    <input
                      type="number"
                      name="grnTo"
                      value={filters.grnTo}
                      onChange={handleFilterChange}
                      placeholder="GRN number"
                      className="flex-1 px-3 py-2 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    />
                  </div>
                </div>

                {/* Supplier and Product Names - Side by Side */}
                <div className="flex gap-4">
                  {/* Supplier Name */}
                  <div className="flex-1 flex items-center gap-3">
                    <label className="text-xs font-semibold text-blue-700 w-20 flex-shrink-0">Supplier</label>
                    <input
                      ref={supplierInputRef}
                      type="text"
                      name="supplierName"
                      value={filters.supplierName}
                      onChange={handleFilterChange}
                      onKeyDown={handleSupplierKeyDown}
                      placeholder="Type supplier name"
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

          {/* Right Panel - Supplier/Product Info */}
          <div className="bg-white border border-blue-100 rounded-xl shadow-sm flex flex-col">
            <div className="bg-blue-50 px-3 py-2 rounded-t-xl border-b border-blue-100">
              <h2 className="text-blue-800 font-bold text-xs uppercase tracking-wide">
                {filters.supplierName ? 'SUPPLIER SELECTION' : filters.productName ? 'PRODUCT SELECTION' : 'SELECTION PANEL'}
              </h2>
            </div>
            <div className="p-2 flex-1 overflow-auto">
              {/* Supplier Selection */}
              {filters.supplierName && filteredSuppliers.length > 0 ? (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-blue-700 mb-2">Available Suppliers</h3>
                  <div ref={supplierListRef} className="bg-gray-50 rounded-lg max-h-40 overflow-y-auto">
                    {filteredSuppliers.map((supplier, index) => (
                      <div
                        key={supplier.id}
                        data-index={index}
                        className={`p-2 cursor-pointer border-b border-gray-200 last:border-b-0 hover:bg-blue-50 transition-colors ${
                          selectedSupplierIndex === index
                            ? 'bg-blue-200 border-blue-400 ring-1 ring-blue-300'
                            : filters.supplierName === supplier.supplierName
                            ? 'bg-blue-100 border-blue-300'
                            : ''
                        }`}
                        onClick={() => {
                          setFilters(prev => ({ ...prev, supplierName: supplier.supplierName }));
                          setSelectedSupplierIndex(-1);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 text-sm">{supplier.supplierName}</div>
                            <div className="text-xs text-gray-500">
                              <span className="mr-3">📞 {supplier.phoneNumber || 'N/A'}</span>
                              <span>📍 {supplier.place || 'N/A'}</span>
                            </div>
                          </div>
                          {selectedSupplierIndex === index && (
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
              ) : filters.supplierName && allSuppliers.length > 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">No suppliers found matching "{filters.supplierName}"</p>
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm italic">Type supplier or product name to see options</p>
                </div>
              )}

              {/* Selected Info */}
              {filters.productName && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  {filters.productName && (
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
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Purchases Table */}
        <div className="flex-1 bg-white border border-blue-100 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto">
            <table className="w-full min-w-full">
              <thead className="bg-blue-50 border-b border-blue-100 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-blue-800 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-blue-800 uppercase tracking-wider">GRN No</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-blue-800 uppercase tracking-wider">Supplier</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-blue-800 uppercase tracking-wider">Products</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-blue-800 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500">Loading purchases...</td>
                  </tr>
                ) : filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500">No purchases found</td>
                  </tr>
                ) : (
                  filteredPurchases.map((purchase, index) => (
                    <tr 
                      key={purchase._id || index} 
                      className="hover:bg-blue-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedPurchase(purchase)}
                    >
                      <td className="px-4 py-3 text-sm text-gray-900">{formatDate(purchase.date)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-blue-600">{purchase.grnNo}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{purchase.supplier?.supplierName || purchase.supplierName}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="max-w-xs">
                          {purchase.items && purchase.items.length > 0 ? (
                            <div className="truncate">
                              {purchase.items.slice(0, 2).map(p => p.productName).join(', ')}
                              {purchase.items.length > 2 && (
                                <span className="text-gray-500"> +{purchase.items.length - 2} more</span>
                              )}
                            </div>
                          ) : 'No products'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                        {formatCurrency(purchase.total || purchase.grandTotal || 0)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Footer */}
          {filteredPurchases.length > 0 && (
            <div className="bg-blue-50 border-t border-blue-100 px-4 py-3">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-blue-800">
                  Total Purchases: {filteredPurchases.length}
                </span>
                <span className="font-bold text-blue-900">
                  Total Amount: {formatCurrency(calculateTotalAmount())}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Purchase Detail Modal */}
      {selectedPurchase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="bg-blue-50 px-6 py-4 border-b border-blue-100 rounded-t-xl flex justify-between items-center">
              <h3 className="text-lg font-bold text-blue-800">Purchase Details - GRN #{selectedPurchase.grnNo}</h3>
              <button
                onClick={() => setSelectedPurchase(null)}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Purchase Information</h4>
                  <p><span className="font-medium">Date:</span> {formatDate(selectedPurchase.date)}</p>
                  <p><span className="font-medium">GRN No:</span> {selectedPurchase.grnNo}</p>
                  <p><span className="font-medium">Supplier:</span> {selectedPurchase.supplier?.supplierName || selectedPurchase.supplierName}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Amount Details</h4>
                  <p><span className="font-medium">Sub Total:</span> {formatCurrency(selectedPurchase.subtotal || selectedPurchase.subTotal || 0)}</p>
                  <p><span className="font-medium">Discount:</span> {formatCurrency(selectedPurchase.discount || 0)}</p>
                  <p><span className="font-medium text-green-600">Grand Total:</span> {formatCurrency(selectedPurchase.total || selectedPurchase.grandTotal || 0)}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Products</h4>
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Rate</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedPurchase.items?.map((product, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-gray-900">{product.productName}</td>
                          <td className="px-4 py-2 text-sm text-right text-gray-900">{product.qty}</td>
                          <td className="px-4 py-2 text-sm text-right text-gray-900">{formatCurrency(product.purchaseRate || 0)}</td>
                          <td className="px-4 py-2 text-sm text-right text-gray-900">{formatCurrency(product.amount || 0)}</td>
                        </tr>
                      )) || (
                        <tr>
                          <td colSpan="4" className="px-4 py-2 text-center text-gray-500">No products found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseDisplay;