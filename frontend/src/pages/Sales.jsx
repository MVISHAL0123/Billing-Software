import { useState, useEffect, useRef } from 'react';

const Sales = ({ onNavigateToDashboard, selectedCustomer, onCustomerSelected }) => {
  const [billNo, setBillNo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [billItems, setBillItems] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerIndex, setSelectedCustomerIndex] = useState(-1);
  const [selectedCustomerState, setSelectedCustomerState] = useState(null);
  const [saveMessage, setSaveMessage] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmType, setConfirmType] = useState('warning');
  const [customerSearchFocused, setCustomerSearchFocused] = useState(false);
  const [activeProductRow, setActiveProductRow] = useState(null);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductIndex, setSelectedProductIndex] = useState(-1);
  const productContainerRef = useRef(null);
  const [allBills, setAllBills] = useState([]);
  const [currentBillIndex, setCurrentBillIndex] = useState(-1);

  // Auto-scroll selected customer into view
  useEffect(() => {
    if (selectedCustomerIndex >= 0) {
      const selectedRow = document.querySelector(`#customer-row-${selectedCustomerIndex}`);
      if (selectedRow) {
        selectedRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [selectedCustomerIndex]);

  // Auto-scroll selected product into view
  useEffect(() => {
    if (selectedProductIndex >= 0) {
      const selectedRow = document.querySelector(`#product-row-${selectedProductIndex}`);
      if (selectedRow) {
        selectedRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [selectedProductIndex]);

  useEffect(() => {
    generateBillNo();
    fetchCustomers();
    fetchProducts();
    fetchAllBills();
    // Initialize with 1 empty row
    const initialRows = [{
      id: Date.now(),
      productName: '',
      qty: 1,
      rate: 0,
      purchaseRate: 0,
      profitPerItem: 0,
      amount: 0,
      totalProfit: 0
    }];
    setBillItems(initialRows);
  }, []);

  useEffect(() => {
    // If a customer was selected from SalesDisplay, set it here
    if (selectedCustomer) {
      setSelectedCustomerState(selectedCustomer);
      setCustomerSearch(selectedCustomer.customerName);
      if (onCustomerSelected) {
        onCustomerSelected();
      }
    }
  }, [selectedCustomer, onCustomerSelected]);



  const generateBillNo = async () => {
    try {
      // Get the next bill number from the database
      const response = await fetch('http://localhost:5003/api/bills/next-bill-number', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      if (data.success && data.nextBillNo) {
        setBillNo(data.nextBillNo.toString());
      } else {
        console.error('Error getting bill number:', data.message);
        // Start from 1 if error
        setBillNo('1');
      }
      
    } catch (error) {
      console.error('Error generating bill number:', error);
      // Start from 1 if error
      setBillNo('1');
    }
  };

  const fetchCustomers = async () => {
    try {
      console.log('Fetching customers from API...');
      const response = await fetch('http://localhost:5003/api/customers/list', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('API Response:', data);
      if (data.success) {
        setCustomers(data.customers);
        console.log('Customers loaded:', data.customers.length, 'customers:', data.customers);
      } else {
        console.error('Failed to fetch customers:', data.message);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      console.log('Fetching products from API...');
      const response = await fetch('http://localhost:5003/api/products/list', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      console.log('Products response status:', response.status);
      const data = await response.json();
      console.log('Products API Response:', data);
      if (data.success) {
        setProducts(data.products);
        console.log('Products loaded:', data.products.length, 'products:', data.products);
      } else {
        console.error('Failed to fetch products:', data.message);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchAllBills = async () => {
    try {
      console.log('Fetching all bills from API...');
      const response = await fetch('http://localhost:5003/api/bills/list', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        const sortedBills = (data.bills || []).sort((a, b) => parseInt(a.billNo) - parseInt(b.billNo));
        setAllBills(sortedBills);
        console.log('All bills loaded:', sortedBills.length, 'bills');
      } else {
        console.error('Failed to fetch bills:', data.message);
      }
    } catch (error) {
      console.error('Error fetching bills:', error);
    }
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomerState(customer);
    setCustomerSearch(customer.customerName);
    setSelectedCustomerIndex(-1);
  };

  const handleCustomerKeyDown = (e) => {
    const filteredCustomers = customers.filter(c => 
      c.customerName?.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phoneNumber?.toLowerCase().includes(customerSearch.toLowerCase())
    );

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedCustomerIndex(prev => 
        prev < filteredCustomers.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedCustomerIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter' && selectedCustomerIndex >= 0) {
      e.preventDefault();
      handleCustomerSelect(filteredCustomers[selectedCustomerIndex]);
    }
  };

  const handleProductSelect = (itemId, product) => {
    // Check if product already exists in billItems
    const existingIndex = billItems.findIndex(item => item.productName === product.productName);
    let nextRowId = null;
    if (existingIndex !== -1) {
      // If exists, increase qty and update amount and profit
      setBillItems(billItems.map((item, idx) => {
        if (idx === existingIndex) {
          const newQty = parseInt(item.qty) + 1;
          const salesRate = product.salesRate || 0;
          const purchaseRate = product.purchaseRate || 0;
          const profitPerItem = salesRate - purchaseRate;
          return {
            ...item,
            qty: newQty,
            rate: salesRate,
            purchaseRate: purchaseRate,
            profitPerItem: profitPerItem,
            amount: parseFloat(newQty) * parseFloat(salesRate),
            totalProfit: parseFloat(newQty) * parseFloat(profitPerItem)
          };
        }
        return item;
      }));
      // Remove the row where selection was made if it's not the same as existing
      if (existingIndex !== billItems.findIndex(item => item.id === itemId)) {
        setBillItems(items => items.filter(item => item.id !== itemId));
      }
      // Always add a new empty row and focus it
      const nextRowId = Date.now();
      setBillItems(prevItems => {
        // Only add if last row is not empty
        const last = prevItems[prevItems.length - 1];
        if (last && last.productName === '') return prevItems;
        return [...prevItems, {
          id: nextRowId,
          productName: '',
          qty: 1,
          rate: 0,
          amount: 0
        }];
      });
      setTimeout(() => {
        const nextInput = document.getElementById(`product-input-${nextRowId}`);
        if (nextInput) nextInput.focus();
      }, 100);
    } else {
      // If not exists, update the row and add a new empty row
      setBillItems(billItems.map(item => {
        if (item.id === itemId) {
          const salesRate = product.salesRate || 0;
          const purchaseRate = product.purchaseRate || 0;
          const profitPerItem = salesRate - purchaseRate;
          const qty = parseFloat(item.qty || 0);
          const updated = { 
            ...item, 
            productName: product.productName,
            rate: salesRate,
            purchaseRate: purchaseRate,
            profitPerItem: profitPerItem,
            amount: qty * salesRate,
            totalProfit: qty * profitPerItem
          };
          return updated;
        }
        return item;
      }));
      // Add a new empty row and focus it after state update
      nextRowId = Date.now();
      setBillItems(prevItems => [...prevItems, {
        id: nextRowId,
        productName: '',
        qty: 1,
        rate: 0,
        purchaseRate: 0,
        profitPerItem: 0,
        amount: 0,
        totalProfit: 0
      }]);
    }
    setActiveProductRow(null);
    setProductSearch('');
    setSelectedProductIndex(-1);
    // Focus next empty row's product input after DOM update
    if (nextRowId) {
      setTimeout(() => {
        const nextInput = document.getElementById(`product-input-${nextRowId}`);
        if (nextInput) nextInput.focus();
      }, 100);
    }
  };

  const handleProductInputChange = (itemId, value) => {
    updateBillItem(itemId, 'productName', value);
    setProductSearch(value);
    setActiveProductRow(itemId);
    setSelectedProductIndex(-1);
  };

  const handleProductKeyDown = (e, itemId) => {
    const filteredProducts = products.filter(p => 
      p.productName?.toLowerCase().includes(productSearch.toLowerCase())
    );

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedProductIndex(prev => 
        prev < filteredProducts.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedProductIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter' && selectedProductIndex >= 0) {
      e.preventDefault();
      handleProductSelect(itemId, filteredProducts[selectedProductIndex]);
      setSelectedProductIndex(-1);
    }
  };

  const addBillItem = () => {
    setBillItems([...billItems, {
      id: Date.now(),
      productName: '',
      qty: 1,
      rate: 0,
      amount: 0
    }]);
  };

  const updateBillItem = (id, field, value) => {
    setBillItems(billItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'qty' || field === 'rate') {
          const qty = parseFloat(updated.qty || 0);
          const rate = parseFloat(updated.rate || 0);
          const purchaseRate = parseFloat(updated.purchaseRate || 0);
          updated.amount = qty * rate;
          updated.profitPerItem = rate - purchaseRate;
          updated.totalProfit = qty * (rate - purchaseRate);
        }
        return updated;
      }
      return item;
    }));
  };

  const removeBillItem = (id) => {
    setBillItems(billItems.filter(item => item.id !== id));
  };

  const calculateSubtotal = () => {
    return billItems.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal();
  };

  const calculateTotalProfit = () => {
    return billItems.reduce((sum, item) => {
      return sum + (parseFloat(item.totalProfit) || 0);
    }, 0);
  };

  const calculateMarginPercentage = () => {
    const totalSales = calculateTotal();
    const totalProfit = calculateTotalProfit();
    const totalCost = totalSales - totalProfit;
    return totalCost > 0 ? ((totalProfit / totalCost) * 100).toFixed(2) : '0.00';
  };

  const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    if (num === 0) return 'Zero';

    const convertTwoDigit = (n) => {
      if (n < 10) return ones[n];
      if (n >= 10 && n < 20) return teens[n - 10];
      return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    };

    const convertThreeDigit = (n) => {
      if (n >= 100) {
        return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertTwoDigit(n % 100) : '');
      }
      return convertTwoDigit(n);
    };

    let integerPart = Math.floor(num);
    const decimalPart = Math.round((num - integerPart) * 100);

    let result = '';

    if (integerPart >= 10000000) {
      result += convertThreeDigit(Math.floor(integerPart / 10000000)) + ' Crore ';
      integerPart %= 10000000;
    }
    if (integerPart >= 100000) {
      result += convertTwoDigit(Math.floor(integerPart / 100000)) + ' Lakh ';
      integerPart %= 100000;
    }
    if (integerPart >= 1000) {
      result += convertTwoDigit(Math.floor(integerPart / 1000)) + ' Thousand ';
      integerPart %= 1000;
    }
    if (integerPart > 0) {
      result += convertThreeDigit(integerPart);
    }

    result += ' Rupees';

    if (decimalPart > 0) {
      result += ' and ' + convertTwoDigit(decimalPart) + ' Paise';
    }

    return result.trim() + ' Only';
  };

  // Confirmation dialog helper
  const showConfirmation = (message, action, type = 'warning') => {
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setConfirmType(type);
    setShowConfirmDialog(true);
  };

  const handleConfirmYes = () => {
    if (confirmAction) {
      confirmAction();
    }
    setShowConfirmDialog(false);
    setConfirmAction(null);
  };

  const handleConfirmNo = () => {
    setShowConfirmDialog(false);
    setConfirmAction(null);
  };

  const handleClear = () => {
    showConfirmation(
      'Are you sure you want to clear all data? This action cannot be undone.',
      () => {
        setBillItems([{
          id: Date.now(),
          productName: '',
          qty: 1,
          rate: 0,
          purchaseRate: 0,
          profitPerItem: 0,
          amount: 0,
          totalProfit: 0
        }]);
        setSelectedCustomerState(null);
        setCustomerSearch('');
        setCustomerSearchFocused(false);
        setDate(new Date().toISOString().split('T')[0]);
        generateBillNo();
        setCurrentBillIndex(-1);
        setSaveMessage('✅ Data cleared successfully!');
        setTimeout(() => setSaveMessage(''), 2000);
      },
      'warning'
    );
  };

  const handleSave = async () => {
    // Quick validation check
    const hasValidItems = billItems.some(item => item.productName && item.productName.trim() !== '');
    if (!hasValidItems) {
      setSaveMessage('❌ Please add at least one item');
      setTimeout(() => setSaveMessage(''), 2000);
      return;
    }

    // Immediate UI feedback (no loading state)
    setSaveMessage('💾 Saved!');
    
    // Prepare data quickly
    const validItems = billItems
      .filter(item => item.productName && item.productName.trim() !== '')
      .map(item => ({
        ...item,
        profitPerItem: item.profitPerItem || 0,
        totalProfit: item.totalProfit || 0,
        purchaseRate: item.purchaseRate || 0
      }));

    const totalProfit = validItems.reduce((sum, item) => sum + (item.totalProfit || 0), 0);
    const totalSales = calculateTotal();

    // Clear form immediately for instant response
    const newBillNo = (parseInt(billNo) + 1).toString();
    setBillNo(newBillNo);
    setBillItems([{
      id: Date.now(),
      productName: '',
      qty: 1,
      rate: 0,
      purchaseRate: 0,
      profitPerItem: 0,
      amount: 0,
      totalProfit: 0
    }]);
    setSelectedCustomerState(null);
    setCustomerSearch('');
    setDate(new Date().toISOString().split('T')[0]);
    setCurrentBillIndex(-1);

    // Save in background without blocking UI
    const billData = {
      billNo,
      date,
      customer: selectedCustomerState || {
        customerName: '',
        phoneNumber: '',
        place: ''
      },
      items: validItems,
      subtotal: calculateSubtotal(),
      total: totalSales,
      totalProfit: totalProfit,
      marginPercentage: totalSales > 0 ? ((totalProfit / (totalSales - totalProfit)) * 100).toFixed(2) : 0
    };

    // Background save (non-blocking)
    fetch('http://localhost:5003/api/bills/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(billData)
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Update bill number from server if provided
        if (data.nextBillNo) {
          setBillNo(data.nextBillNo.toString());
        }
        // Update bills list in background
        fetchAllBills().catch(console.error);
      } else {
        // Show error but don't revert the form
        setSaveMessage('❌ Save failed - check connection');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    })
    .catch(error => {
      console.error('Save error:', error);
      setSaveMessage('❌ Save failed - check connection');
      setTimeout(() => setSaveMessage(''), 3000);
    });

    // Clear success message quickly
    setTimeout(() => setSaveMessage(''), 1000);
  };

  const loadBillData = (bill) => {
    setBillNo(bill.billNo.toString());
    setDate(bill.date);
    setSelectedCustomerState(bill.customer);
    setCustomerSearch(bill.customer.customerName);
    
    // Transform bill items to match billItems format
    const transformedItems = bill.items.map(item => ({
      id: item._id || Date.now(),
      productName: item.productId?.productName || item.productName || '',
      qty: item.qty,
      rate: item.rate,
      amount: item.amount
    }));
    
    setBillItems(transformedItems);
  };

  const handlePreviousBill = () => {
    if (currentBillIndex > 0) {
      const newIndex = currentBillIndex - 1;
      setCurrentBillIndex(newIndex);
      loadBillData(allBills[newIndex]);
    } else if (currentBillIndex === 0) {
      // At first bill, trying to go previous
      setSaveMessage('⚠️ No previous record found');
      setTimeout(() => setSaveMessage(''), 2000);
    } else if (currentBillIndex === -1 && allBills.length > 0) {
      // If not in view mode, go to last bill
      const newIndex = allBills.length - 1;
      setCurrentBillIndex(newIndex);
      loadBillData(allBills[newIndex]);
    } else {
      // No bills exist
      setSaveMessage('⚠️ No record found');
      setTimeout(() => setSaveMessage(''), 2000);
    }
  };

  const handleNextBill = () => {
    if (currentBillIndex >= 0 && currentBillIndex < allBills.length - 1) {
      const newIndex = currentBillIndex + 1;
      setCurrentBillIndex(newIndex);
      loadBillData(allBills[newIndex]);
    } else if (currentBillIndex === allBills.length - 1) {
      // At last bill, trying to go next
      setSaveMessage('⚠️ No next record found');
      setTimeout(() => setSaveMessage(''), 2000);
    } else if (currentBillIndex === -1) {
      // In new bill mode, try to load first bill
      if (allBills.length > 0) {
        setCurrentBillIndex(0);
        loadBillData(allBills[0]);
      } else {
        setSaveMessage('⚠️ No record found');
        setTimeout(() => setSaveMessage(''), 2000);
      }
    } else {
      setSaveMessage('⚠️ No record found');
      setTimeout(() => setSaveMessage(''), 2000);
    }
  };

  const filteredCustomers = customerSearch 
    ? customers.filter(c => 
        c.customerName?.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.phoneNumber?.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.place?.toLowerCase().includes(customerSearch.toLowerCase())
      )
    : customers;

  console.log('Total customers:', customers.length, 'Filtered:', filteredCustomers.length, 'Search:', customerSearch);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col">
      <div className="flex-1 flex flex-col relative">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-6 py-4 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-3">
            <div className="bg-white text-blue-600 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold drop-shadow-sm">SALES BILLING</h1>
              <p className="text-blue-100 text-sm">Professional Invoice Management</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
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

        {/* Product list will be rendered inline inside product container (see below) */}

        <div className="bg-white shadow-2xl flex-1 flex flex-col rounded-none border-0">
          {/* Top Section - Invoice Details and Customer */}
          <div className="pl-6 pb-6 pt-6 pr-6 border-b-2 border-blue-100 relative bg-gradient-to-r from-blue-50 to-white">
            <div className="flex">
              {/* Left Side - Invoice Details, Customer Search and Customer Details */}
              <div className="flex-1 pr-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 shadow-md border border-blue-200">
                    <label className="text-base font-bold text-blue-800 whitespace-nowrap">Invoice No:</label>
                    <input
                      type="text"
                      value={billNo}
                      readOnly
                      className="w-28 px-3 py-1 bg-blue-50 border border-blue-300 rounded-lg text-blue-700 font-bold text-center shadow-inner"
                    />
                  </div>
                  <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 shadow-md border border-blue-200">
                    <label className="text-base font-bold text-blue-800 whitespace-nowrap">Date:</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="px-3 py-1 border border-blue-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none shadow-inner bg-blue-50 text-blue-700 font-semibold"
                    />
                  </div>
                </div>

                {/* Customer Search */}
                {!selectedCustomerState && (
                  <div className="mb-4">
                    <div className="flex items-center gap-3 max-w-md mb-2">
                      <label className="text-sm font-bold text-blue-800 whitespace-nowrap">Customer:</label>
                      <input
                        type="text"
                        value={customerSearch}
                        onChange={(e) => {
                          setCustomerSearch(e.target.value);
                          setSelectedCustomerIndex(-1);
                        }}
                        onFocus={() => {
                          fetchCustomers(); // Refresh customers when focused
                          setCustomerSearchFocused(true);
                        }}
                        onBlur={() => {
                          // Delay blur to allow click on table
                          setTimeout(() => setCustomerSearchFocused(false), 200);
                        }}
                        onKeyDown={handleCustomerKeyDown}
                        placeholder="Search customer..."
                        className="flex-1 px-4 py-2 border-2 border-blue-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none shadow-inner bg-blue-50 placeholder-blue-400"
                      />
                    </div>
                  </div>
                )}

                {/* Customer Details Display */}
                {selectedCustomerState && (
                  <div className="bg-white rounded-xl p-3 shadow-lg border-2 border-blue-200 max-w-md">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-blue-700 font-bold text-base">{selectedCustomerState.customerName}</div>
                        <div className="text-blue-600 text-sm font-medium">{selectedCustomerState.place}</div>
                        <div className="text-blue-600 text-sm font-medium flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {selectedCustomerState.phoneNumber}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Side - Customer Selection Table */}
              {!selectedCustomerState && (customerSearch || customerSearchFocused) && (
                <div className="absolute top-0 right-0 w-1/2 pt-0 h-36">
                  <div className="bg-white border-2 border-blue-300 shadow-xl overflow-hidden h-full rounded-none">
                    {filteredCustomers.length > 0 ? (
                      <div className="overflow-y-auto h-full">
                        <table className="w-full border-collapse">
                          <thead className="bg-gradient-to-r from-blue-500 to-blue-600 border-b-2 border-blue-300 sticky top-0">
                            <tr>
                              <th className="px-4 py-1 text-left text-sm font-bold text-white border-r border-blue-400 w-1/2">Name</th>
                              <th className="px-4 py-1 text-left text-sm font-bold text-white w-1/2">Place</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredCustomers.map((customer, index) => (
                              <tr
                                id={`customer-row-${index}`}
                                key={customer._id}
                                onClick={() => {
                                  handleCustomerSelect(customer);
                                  setCustomerSearchFocused(false);
                                }}
                                className={`cursor-pointer hover:bg-blue-100 border-b border-blue-200 transition-all duration-200 ${
                                  index === selectedCustomerIndex ? 'bg-blue-200 shadow-inner' : 'bg-white hover:shadow-md'
                                }`}
                              >
                                <td className="px-4 py-1 text-sm font-semibold text-blue-800 border-r border-blue-200">{customer.customerName}</td>
                                <td className="px-4 py-1 text-sm text-blue-600 font-medium">{customer.place || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="px-4 py-8 text-blue-500 text-center font-medium h-full flex items-center justify-center">
                        {customers.length === 0 ? 'No customers available. Please add customers first.' : 'No customers found'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Product Selection Table */}
          <div className="px-1 pb-6 pt-0 relative bg-gradient-to-b from-blue-50 to-white flex-1" ref={productContainerRef}>
            <div className="flex items-center gap-3 mb-0">
            </div>

            <div className="border-2 border-blue-300 rounded-xl overflow-hidden shadow-xl bg-white">
              <table className="w-full border-collapse">
                <thead className="bg-gradient-to-r from-blue-500 to-blue-600">
                  <tr>
                    <th className="px-4 py-1.5 text-center text-sm font-bold text-white border-r border-blue-400">SNo</th>
                    <th className="px-4 py-1.5 text-left text-sm font-bold text-white border-r border-blue-400">Name</th>
                    <th className="px-4 py-1.5 text-center text-sm font-bold text-white border-r border-blue-400 w-24">Qty</th>
                    <th className="px-4 py-1.5 text-center text-sm font-bold text-white border-r border-blue-400 w-32">Rate</th>
                    <th className="px-4 py-1.5 text-center text-sm font-bold text-white w-32">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {billItems.map((item, index) => (
                    <tr key={item.id} className="bg-white hover:bg-blue-50 transition-all duration-200">
                      <td className="px-4 py-1 text-sm text-center text-blue-700 font-semibold border-r border-blue-200">{index + 1}</td>
                      <td className="px-4 py-1 border-r border-blue-200">
                        <input
                          type="text"
                          value={item.productName}
                          onChange={(e) => handleProductInputChange(item.id, e.target.value)}
                          onKeyDown={(e) => handleProductKeyDown(e, item.id)}
                          id={`product-input-${item.id}`}
                          onFocus={() => {
                            setActiveProductRow(item.id);
                            setProductSearch(item.productName);
                            setSelectedProductIndex(-1);
                            fetchProducts(); // Refresh products when focused
                          }}
                          className="w-full px-3 py-1 border-0 bg-transparent focus:outline-none focus:bg-blue-100 rounded-lg transition-all duration-200 text-blue-800 font-medium"
                          placeholder="Product name"
                        />
                      </td>
                      <td className="px-2 py-1 border-r border-blue-200">
                        <input
                          type="number"
                          value={item.qty}
                          onChange={(e) => updateBillItem(item.id, 'qty', e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                              e.preventDefault();
                            }
                          }}
                          min="1"
                          className="w-full px-2 py-1 text-center border-0 bg-transparent focus:outline-none focus:bg-blue-100 rounded-lg text-blue-700 font-semibold transition-all duration-200"
                        />
                      </td>
                      <td className="px-8 py-1 border-r border-blue-200">
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) => updateBillItem(item.id, 'rate', e.target.value)}
                          onWheel={(e) => e.target.blur()}
                          onKeyDown={(e) => {
                            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                              e.preventDefault();
                            }
                          }}
                          min="0"
                          step="0.01"
                          style={{
                            MozAppearance: 'textfield',
                            WebkitAppearance: 'none',
                            appearance: 'none'
                          }}
                          className="w-full px-2 py-1 text-right border-0 bg-transparent focus:outline-none focus:bg-blue-100 rounded-lg text-blue-700 font-semibold transition-all duration-200 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </td>
                      <td className="px-11 py-1 text-sm text-right text-blue-800 font-bold border-blue-200">
                        ₹{item.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Section - Totals and Actions */}
          <div className="p-6 border-t-2 border-blue-200 bg-gradient-to-r from-blue-50 to-white">

            {/* Action Buttons */}
            <div className="flex justify-between items-end">
              {/* Left: Total Amount in Words Card and Navigation buttons */}
              <div className="flex flex-col gap-4">
                {/* Amount in Words Card */}
                <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-blue-200 w-80">
                  <h3 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    Total Amount in Words:
                  </h3>
                  <p className="text-blue-700 font-semibold text-base">
                    {numberToWords(calculateTotal())}
                  </p>
                </div>
                
                {/* Previous and Next buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handlePreviousBill}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    title="Go to previous bill"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={handleNextBill}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    title="Go to next bill"
                  >
                    Next
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Center: Product List - positioned to touch footer */}
              <div className="flex flex-col items-center">
                {activeProductRow && (
                  <div className="bg-white border-2 border-blue-300 rounded-2xl mb-0 shadow-2xl" style={{ width: '770px', maxHeight: '340px' }}>
                    {products.filter(p =>
                      p.productName?.toLowerCase().includes(productSearch.toLowerCase())
                    ).length > 0 ? (
                      <div className="overflow-y-auto rounded-2xl" style={{ maxHeight: '210px' }}>
                        <table className="w-full border-collapse">
                          <thead className="bg-gradient-to-r from-blue-500 to-blue-600 border-b-2 border-blue-300 sticky top-0">
                            <tr>
                              <th className="px-4 py-1.5 text-left text-sm font-bold text-white border-r border-blue-400 w-2/3">Product Name</th>
                              <th className="px-4 py-1.5 text-left text-sm font-bold text-white border-r border-blue-400 w-1/3">Rate</th>
                              <th className="px-4 py-1.5 text-left text-sm font-bold text-white">Stock</th>
                            </tr>
                          </thead>
                          <tbody>
                            {products.filter(p =>
                              p.productName?.toLowerCase().includes(productSearch.toLowerCase())
                            ).map((product, index) => (
                              <tr
                                id={`product-row-${index}`}
                                key={product._id}
                                onClick={() => handleProductSelect(activeProductRow, product)}
                                className={`cursor-pointer hover:bg-blue-100 border-b border-blue-200 transition-all duration-200 ${
                                  index === selectedProductIndex ? 'bg-blue-200 shadow-inner' : 'bg-white hover:shadow-md'
                                }`}
                              >
                                <td className="px-4 py-1 text-sm font-semibold text-blue-800 border-r border-blue-200">{product.productName}</td>
                                <td className="px-4 py-1 text-sm text-blue-600 font-bold border-r border-blue-200">₹{product.salesRate}</td>
                                <td className="px-4 py-1 text-sm text-blue-600 font-medium">
                                  {product.currentStock !== undefined ? product.currentStock : 'N/A'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="px-4 py-1 text-blue-500 text-center font-medium">
                        {products.length === 0 ? 'No products available.' : 'No products found'}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right: Totals and Clear/Save buttons */}
              <div className="flex flex-col items-end">
                {/* Totals */}
                <div className="space-y-3 w-64 mb-1 bg-white rounded-xl p-2.5 shadow-lg border-2 border-blue-200">
                  <div className="flex items-center justify-between pb-1 border-b-2 border-blue-200">
                    <span className="font-bold text-blue-800">Subtotal:</span>
                    <span className="font-bold text-blue-900 text-lg">₹{calculateSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between pb-0  border-b-2 border-blue-200">
                    <span className="font-bold text-blue-800">Total:</span>
                    <span className="font-bold text-blue-900 text-lg">₹{calculateTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 bg-blue-50 rounded-lg p-1 border border-blue-300">
                    <span className="text-lg font-bold text-blue-800">Total Amount:</span>
                    <span className="text-xl font-bold text-blue-600">₹{calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
                
                {/* Save Message */}
                {saveMessage && (
                  <div className={`text-center py-2 px-4 rounded-lg font-semibold ${
                    saveMessage.includes('💾') || saveMessage.includes('✅')
                      ? 'bg-green-100 text-green-800 border border-green-300' 
                      : saveMessage.includes('❌')
                      ? 'bg-red-100 text-red-800 border border-red-300'
                      : 'bg-blue-100 text-blue-800 border border-blue-300'
                  }`}>
                    {saveMessage}
                  </div>
                )}
                
                {/* Action buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleClear}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold px-8 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center gap-2"
                  >
                    <svg className="w-4 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="bg-gradient-to-r from-green-500 to-green-600 text-white font-bold px-8 py-3 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center gap-2"
                  >
                    <svg className="w-4 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md mx-4 shadow-2xl border-2 border-blue-200">
            <div className="flex items-center mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                confirmType === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
              }`}>
                {confirmType === 'warning' ? (
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <h3 className="text-lg font-bold text-gray-800">Confirmation Required</h3>
            </div>
            <p className="text-gray-700 mb-6 leading-relaxed">{confirmMessage}</p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleConfirmNo}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                No
              </button>
              <button
                type="button"
                onClick={handleConfirmYes}
                className={`px-6 py-2 text-white rounded-lg transition-colors font-medium ${
                  confirmType === 'warning' 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                ✓ Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
