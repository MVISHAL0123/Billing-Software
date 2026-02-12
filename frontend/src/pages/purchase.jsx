import { useState, useEffect, useRef } from 'react';

const Purchase = ({ onNavigateToDashboard }) => {
  const [billNo, setBillNo] = useState('');
  const [grnNo, setGrnNo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [billItems, setBillItems] = useState([]);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [selectedSupplierIndex, setSelectedSupplierIndex] = useState(-1);
  const [selectedSupplierState, setSelectedSupplierState] = useState(null);
  const [activeProductRow, setActiveProductRow] = useState(null);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductIndex, setSelectedProductIndex] = useState(-1);
  const productContainerRef = useRef(null);
  const [allPurchases, setAllPurchases] = useState([]);
  const [currentPurchaseIndex, setCurrentPurchaseIndex] = useState(-1);

  useEffect(() => {
    generateGrnNo();
    fetchSuppliers();
    fetchProducts();
    fetchAllPurchases();
    // Initialize with 1 empty row
    const initialRows = [{
      id: Date.now(),
      productName: '',
      qty: 1,
      purchaseRate: 0,
      salesRate: 0,
      margin: 0,
      marginPercentage: 0,
      freeQty: 0,
      amount: 0
    }];
    setBillItems(initialRows);
  }, []);

  const generateGrnNo = async () => {
    try {
      // Get the next GRN number from the database
      const response = await fetch('http://localhost:5003/api/purchases/next-grn-number', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      if (data.success && data.nextGrnNo) {
        setGrnNo(data.nextGrnNo.toString());
      } else {
        console.error('Error getting GRN number:', data.message);
        // Start from 1 if error
        setGrnNo('1');
      }
      
    } catch (error) {
      console.error('Error generating GRN number:', error);
      // Start from 1 if error
      setGrnNo('1');
    }
  };

  const fetchSuppliers = async () => {
    try {
      console.log('Fetching suppliers from API...');
      const response = await fetch('http://localhost:5003/api/suppliers/list', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('API Response:', data);
      if (data.success) {
        setSuppliers(data.suppliers || []);
        console.log('Suppliers loaded:', data.suppliers?.length || 0, 'suppliers:', data.suppliers);
      } else {
        console.error('Failed to fetch suppliers:', data.message);
        setSuppliers([]);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      setSuppliers([]);
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

  const fetchAllPurchases = async () => {
    try {
      console.log('Fetching all purchases from API...');
      const response = await fetch('http://localhost:5003/api/purchases/list', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        const sortedPurchases = (data.purchases || []).sort((a, b) => parseInt(a.billNo) - parseInt(b.billNo));
        setAllPurchases(sortedPurchases);
        console.log('All purchases loaded:', sortedPurchases.length, 'purchases');
      } else {
        console.error('Failed to fetch purchases:', data.message);
        setAllPurchases([]);
      }
    } catch (error) {
      console.error('Error fetching purchases:', error);
      setAllPurchases([]);
    }
  };

  const handleSupplierSelect = (supplier) => {
    setSelectedSupplierState(supplier);
    setSupplierSearch(supplier.supplierName);
    setSelectedSupplierIndex(-1);
  };

  const handleSupplierKeyDown = (e) => {
    const filteredSuppliers = suppliers.filter(s => 
      s.supplierName?.toLowerCase().includes(supplierSearch.toLowerCase()) ||
      s.phoneNumber?.toLowerCase().includes(supplierSearch.toLowerCase())
    );

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSupplierIndex(prev => 
        prev < filteredSuppliers.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSupplierIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter' && selectedSupplierIndex >= 0) {
      e.preventDefault();
      handleSupplierSelect(filteredSuppliers[selectedSupplierIndex]);
    }
  };

  const handleProductSelect = (itemId, product) => {
    // Check if product already exists in billItems
    const existingIndex = billItems.findIndex(item => item.productName === product.productName);
    let nextRowId = null;
    if (existingIndex !== -1) {
      // If exists, increase qty and update amount
      setBillItems(billItems.map((item, idx) => {
        if (idx === existingIndex) {
          const newQty = parseInt(item.qty) + 1;
          const purchaseRate = product.purchaseRate || 0;
          const salesRate = product.salesRate || 0;
          const margin = salesRate - purchaseRate;
          const marginPercentage = purchaseRate > 0 ? ((margin / purchaseRate) * 100) : 0;
          
          return {
            ...item,
            qty: newQty,
            purchaseRate: purchaseRate,
            salesRate: salesRate,
            margin: margin,
            marginPercentage: marginPercentage.toFixed(2),
            amount: parseFloat(newQty) * parseFloat(purchaseRate)
          };
        }
        return item;
      }));
      // Remove the row where selection was made if it's not the same as existing
      if (existingIndex !== billItems.findIndex(item => item.id === itemId)) {
        setBillItems(items => items.filter(item => item.id !== itemId));
      }
      // Focus on qty of existing item
      const existingItemId = billItems[existingIndex].id;
      setTimeout(() => {
        const qtyInput = document.getElementById(`qty-input-${existingItemId}`);
        if (qtyInput) {
          qtyInput.focus();
          qtyInput.select();
        }
      }, 100);
    } else {
      // If not exists, update the row and add a new empty row
      const purchaseRate = product.purchaseRate || 0;
      const salesRate = product.salesRate || 0;
      const margin = salesRate - purchaseRate;
      const marginPercentage = purchaseRate > 0 ? ((margin / purchaseRate) * 100) : 0;

      setBillItems(billItems.map(item => {
        if (item.id === itemId) {
          const updated = { 
            ...item, 
            productName: product.productName,
            purchaseRate: purchaseRate,
            salesRate: salesRate,
            margin: margin,
            marginPercentage: marginPercentage.toFixed(2),
            amount: parseFloat(item.qty || 0) * parseFloat(purchaseRate)
          };
          return updated;
        }
        return item;
      }));
      // Focus on qty of current item
      setTimeout(() => {
        const qtyInput = document.getElementById(`qty-input-${itemId}`);
        if (qtyInput) {
          qtyInput.focus();
          qtyInput.select();
        }
      }, 100);
    }
    setActiveProductRow(null);
    setProductSearch('');
    setSelectedProductIndex(-1);
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
      purchaseRate: 0,
      salesRate: 0,
      margin: 0,
      marginPercentage: 0,
      freeQty: 0,
      amount: 0
    }]);
  };

  const updateBillItem = (id, field, value) => {
    setBillItems(billItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        
        // Auto-calculate margin and amount when rates change
        if (field === 'purchaseRate' || field === 'salesRate') {
          const purchaseRate = field === 'purchaseRate' ? parseFloat(value) : parseFloat(updated.purchaseRate);
          const salesRate = field === 'salesRate' ? parseFloat(value) : parseFloat(updated.salesRate);
          const margin = salesRate - purchaseRate;
          const marginPercentage = purchaseRate > 0 ? ((margin / purchaseRate) * 100) : 0;
          
          updated.margin = margin;
          updated.marginPercentage = marginPercentage.toFixed(2);
          updated.amount = parseFloat(updated.qty || 0) * purchaseRate;
        } else if (field === 'qty') {
          updated.amount = parseFloat(updated.qty || 0) * parseFloat(updated.purchaseRate || 0);
        }
        return updated;
      }
      return item;
    }));
  };

  const removeBillItem = (id) => {
    setBillItems(billItems.filter(item => item.id !== id));
  };

  const handleQtyKeyDown = (e, itemId) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // Find current item index
      const currentIndex = billItems.findIndex(item => item.id === itemId);
      
      // Check if there's a next row
      if (currentIndex < billItems.length - 1) {
        // Focus on next row's product input
        const nextItem = billItems[currentIndex + 1];
        setTimeout(() => {
          const nextInput = document.getElementById(`product-input-${nextItem.id}`);
          if (nextInput) nextInput.focus();
        }, 50);
      } else {
        // This is the last row, add a new empty row
        const newRowId = Date.now();
        setBillItems(prevItems => [...prevItems, {
          id: newRowId,
          productName: '',
          qty: 1,
          purchaseRate: 0,
          salesRate: 0,
          margin: 0,
          marginPercentage: 0,
          freeQty: 0,
          amount: 0
        }]);
        // Focus on the new row's product input
        setTimeout(() => {
          const newInput = document.getElementById(`product-input-${newRowId}`);
          if (newInput) newInput.focus();
        }, 100);
      }
    }
  };

  const calculateSubtotal = () => {
    return billItems.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal();
  };

  const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    const convertHundreds = (n) => {
      let result = '';
      if (n >= 100) {
        result += ones[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      if (n >= 20) {
        result += tens[Math.floor(n / 10)];
        if (n % 10 > 0) result += '-' + ones[n % 10];
        result += ' ';
      } else if (n >= 10) {
        result += teens[n - 10] + ' ';
      } else if (n > 0) {
        result += ones[n] + ' ';
      }
      return result;
    };

    const convertTwoDigit = (n) => {
      if (n >= 20) {
        return tens[Math.floor(n / 10)] + (n % 10 > 0 ? '-' + ones[n % 10] : '');
      } else if (n >= 10) {
        return teens[n - 10];
      } else if (n > 0) {
        return ones[n];
      }
      return '';
    };

    const convertThreeDigit = (n) => {
      let result = '';
      if (n >= 100) {
        result += ones[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      if (n > 0) {
        result += convertTwoDigit(n) + ' ';
      }
      return result;
    };

    if (num === 0) return 'Zero Rupees Only';

    let integerPart = Math.floor(num);
    let decimalPart = Math.round((num - integerPart) * 100);
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

  const handleClear = () => {
    setBillItems([{
      id: Date.now(),
      productName: '',
      qty: 1,
      purchaseRate: 0,
      salesRate: 0,
      margin: 0,
      marginPercentage: 0,
      freeQty: 0,
      amount: 0
    }]);
    setSelectedSupplierState(null);
    setSupplierSearch('');
    setDate(new Date().toISOString().split('T')[0]);
    setBillNo('');
    generateGrnNo(); // Generate next GRN number
    setCurrentPurchaseIndex(-1);
  };

  const handleSave = async () => {
    // Use grnNo if billNo is empty
    const finalBillNo = billNo.trim() || grnNo;
    
    if (!selectedSupplierState) {
      alert('Please select a supplier');
      return;
    }
    if (billItems.length === 0 || (billItems.length === 1 && !billItems[0].productName)) {
      alert('Please add at least one item');
      return;
    }

    // Filter out empty rows and map to backend expected format
    const validItems = billItems
      .filter(item => item.productName && item.productName.trim() !== '')
      .map(item => ({
        productName: item.productName,
        qty: item.qty,
        purchaseRate: item.purchaseRate,
        salesRate: item.salesRate || 0,
        margin: item.margin || 0,
        marginPercentage: item.marginPercentage || 0,
        freeQty: item.freeQty || 0,
        amount: item.amount
      }));

    const purchaseData = {
      billNo: finalBillNo,
      grnNo,
      date,
      supplier: selectedSupplierState,
      items: validItems,
      subtotal: calculateSubtotal(),
      total: calculateTotal()
    };

    console.log('📦 Purchase data being sent:');
    console.log('  - billNo:', purchaseData.billNo);
    console.log('  - grnNo:', purchaseData.grnNo);
    console.log('  - date:', purchaseData.date);
    console.log('  - supplier:', purchaseData.supplier);
    console.log('  - items count:', purchaseData.items?.length);
    console.log('  - subtotal:', purchaseData.subtotal);
    console.log('  - total:', purchaseData.total);
    console.log('  - Full data:', JSON.stringify(purchaseData, null, 2));

    try {
      console.log('Saving purchase:', purchaseData);
      const response = await fetch('http://localhost:5003/api/purchases/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(purchaseData)
      });

      const data = await response.json();
      console.log('Purchase save response:', data);
      
      if (data.success) {
        alert('Purchase saved successfully!');
        localStorage.setItem('lastPurchaseGrnNo', grnNo);
        await fetchAllPurchases();
        
        // Generate next GRN number from backend and clear form
        await generateGrnNo();
        
        // Clear form but keep new GRN number
        setBillItems([{
          id: Date.now(),
          productName: '',
          qty: 1,
          purchaseRate: 0,
          salesRate: 0,
          margin: 0,
          marginPercentage: 0,
          freeQty: 0,
          amount: 0
        }]);
        setSelectedSupplierState(null);
        setSupplierSearch('');
        setDate(new Date().toISOString().split('T')[0]);
        setBillNo('');
        setCurrentPurchaseIndex(-1);
      } else {
        console.error('Backend error:', data);
        alert('Error saving purchase: ' + (data.message || data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving purchase:', error);
      alert('Error saving purchase. Please check console for details.');
    }
  };

  const loadPurchaseData = (purchase) => {
    setBillNo(purchase.billNo.toString());
    setGrnNo(purchase.grnNo || '');
    setDate(purchase.date);
    setSelectedSupplierState(purchase.supplier);
    setSupplierSearch(purchase.supplier.supplierName);
    
    // Transform purchase items to match billItems format
    const transformedItems = purchase.items.map(item => ({
      id: item._id || Date.now(),
      productName: item.productId?.productName || item.productName || '',
      qty: item.qty,
      purchaseRate: item.purchaseRate || 0,
      salesRate: item.salesRate || 0,
      margin: item.margin || 0,
      marginPercentage: item.marginPercentage || 0,
      freeQty: item.freeQty || 0,
      amount: item.amount
    }));
    
    setBillItems(transformedItems);
  };

  const handlePreviousPurchase = () => {
    if (currentPurchaseIndex > 0) {
      const newIndex = currentPurchaseIndex - 1;
      setCurrentPurchaseIndex(newIndex);
      loadPurchaseData(allPurchases[newIndex]);
    } else if (currentPurchaseIndex === 0) {
      // At first purchase, trying to go previous
      alert('No record found');
    } else if (currentPurchaseIndex === -1 && allPurchases.length > 0) {
      // If not in view mode, go to last purchase
      const newIndex = allPurchases.length - 1;
      setCurrentPurchaseIndex(newIndex);
      loadPurchaseData(allPurchases[newIndex]);
    } else {
      // No purchases exist
      alert('No record found');
    }
  };

  const handleNextPurchase = () => {
    if (currentPurchaseIndex < allPurchases.length - 1 && currentPurchaseIndex !== -1) {
      const newIndex = currentPurchaseIndex + 1;
      setCurrentPurchaseIndex(newIndex);
      loadPurchaseData(allPurchases[newIndex]);
    } else if (currentPurchaseIndex === allPurchases.length - 1) {
      // At last purchase, trying to go next
      alert('No record found');
    } else if (currentPurchaseIndex === -1 && allPurchases.length > 0) {
      // If not in view mode, go to first purchase
      const newIndex = 0;
      setCurrentPurchaseIndex(newIndex);
      loadPurchaseData(allPurchases[newIndex]);
    } else {
      // No purchases exist
      alert('No record found');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col">
      <div className="flex-1 flex flex-col relative">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-6 py-4 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-3">
            <div className="bg-white text-blue-600 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold drop-shadow-sm">PURCHASE BILLING</h1>
              <p className="text-blue-100 text-sm">Professional Purchase Management</p>
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

        <div className="bg-white shadow-2xl flex-1 flex flex-col rounded-none border-0">
          {/* Top Section - Invoice Details and Supplier */}
          <div className="pl-6 pb-6 pt-6 pr-6 border-b-2 border-blue-100 relative bg-gradient-to-r from-blue-50 to-white">
            <div className="flex">
              {/* Left Side - Invoice Details, Supplier Search and Supplier Details */}
              <div className="flex-1 pr-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 shadow-md border border-blue-200">
                    <label className="text-base font-bold text-blue-800 whitespace-nowrap">Invoice No:</label>
                    <input
                      type="text"
                      value={billNo}
                      onChange={(e) => setBillNo(e.target.value)}
                      placeholder="Optional"
                      className="w-28 px-3 py-1 bg-blue-50 border border-blue-300 rounded-lg text-blue-700 font-bold text-center shadow-inner placeholder-blue-300"
                    />
                  </div>
                  <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 shadow-md border border-blue-200">
                    <label className="text-base font-bold text-blue-800 whitespace-nowrap">GRN No:</label>
                    <input
                      type="text"
                      value={grnNo}
                      readOnly
                      className="w-24 px-3 py-1 bg-gray-100 border border-gray-300 rounded-lg text-gray-600 font-bold text-center cursor-not-allowed shadow-inner"
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

                {/* Supplier Search */}
                {!selectedSupplierState && (
                  <div className>
                    <div className="flex items-center gap-3 max-w-md mb-2">
                      <label className="text-sm font-bold text-blue-800 whitespace-nowrap">Supplier:</label>
                      <input
                        type="text"
                        value={supplierSearch}
                        onChange={(e) => setSupplierSearch(e.target.value)}
                        onKeyDown={handleSupplierKeyDown}
                        placeholder="Search supplier..."
                        className="flex-1 px-4 py-2 border-2 border-blue-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none shadow-inner bg-blue-50 placeholder-blue-400"
                      />
                    </div>
                  </div>
                )}

                {/* Supplier Details Display */}
                {selectedSupplierState && (
                  <div className="bg-white rounded-xl p-3 shadow-lg border-2 border-blue-200 max-w-md">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-blue-700 font-bold text-base">{selectedSupplierState.supplierName}</div>
                        <div className="text-blue-600 text-sm font-medium">{selectedSupplierState.place}</div>
                        <div className="text-blue-600 text-sm font-medium flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {selectedSupplierState.phoneNumber}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
            </div>

              {/* Right Side - Supplier Selection Table */}
              {!selectedSupplierState && supplierSearch && (
                <div className="absolute top-0 right-0 w-1/2 pt-0 h-36">
                  <div className="bg-white border-2 border-blue-300 shadow-xl overflow-hidden h-full rounded-none">
                    {suppliers.filter(s =>
                      s.supplierName?.toLowerCase().includes(supplierSearch.toLowerCase()) ||
                      s.phoneNumber?.toLowerCase().includes(supplierSearch.toLowerCase())
                    ).length > 0 ? (
                      <div className="overflow-y-auto h-full">
                        <table className="w-full border-collapse">
                          <thead className="bg-gradient-to-r from-blue-600 to-blue-600 border-b-0 border-blue-300 sticky top-0">
                            <tr>
                              <th className="px-4 py-1 text-left text-sm font-bold text-white border-r border-blue-400 w-1/2">Name</th>
                              <th className="px-4 py-1 text-left text-sm font-bold text-white w-1/3">Phone</th>
                              <th className="px-4 py-1 text-left text-sm font-bold text-white">Place</th>
                            </tr>
                          </thead>
                          <tbody>
                            {suppliers.filter(s =>
                              s.supplierName?.toLowerCase().includes(supplierSearch.toLowerCase()) ||
                              s.phoneNumber?.toLowerCase().includes(supplierSearch.toLowerCase())
                            ).map((supplier, index) => (
                              <tr
                                key={supplier._id}
                                onClick={() => handleSupplierSelect(supplier)}
                                className={`cursor-pointer hover:bg-blue-100 border-b border-blue-200 transition-all duration-200 ${
                                  index === selectedSupplierIndex ? 'bg-blue-200' : 'bg-white'
                                }`}
                              >
                                <td className="px-4 py-1 text-sm font-semibold text-blue-800 border-r border-blue-200">{supplier.supplierName}</td>
                                <td className="px-4 py-1 text-sm text-blue-700 border-r border-blue-200">{supplier.phoneNumber}</td>
                                <td className="px-4 py-1 text-sm text-blue-700">{supplier.place}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="px-4 py-1 text-blue-500 text-center font-medium">
                        {suppliers.length === 0 ? 'No suppliers available.' : 'No suppliers found'}
                      </div>
                    )}
                  </div>
                </div>
              )}
          </div>
        </div>

          {/* Middle Section - Product Selection Table */}
          <div className="p-1 flex-2 flex flex-col">
            <div className="mb-0">
            </div>

            <div className="border-2 border-blue-300 rounded-xl shadow-lg overflow-hidden">
              <table className="w-full border-collapse">
                <thead className="bg-gradient-to-r from-blue-500 to-blue-600">
                  <tr>
                    <th className="px-4 py-1 text-center text-sm font-bold text-white border-r border-blue-400">S.No</th>
                    <th className="px-4 py-1 text-left text-sm font-bold text-white border-r border-blue-400">Product Name</th>
                    <th className="px-4 py-1 text-center text-sm font-bold text-white border-r border-blue-400 w-20">Qty</th>
                    <th className="px-4 py-1 text-center text-sm font-bold text-white border-r border-blue-400 w-20">Free</th>
                    <th className="px-4 py-1 text-center text-sm font-bold text-white border-r border-blue-400 w-28">Purchase Rate</th>
                    <th className="px-4 py-1 text-center text-sm font-bold text-white border-r border-blue-400 w-24">Sales Rate</th>
                    <th className="px-4 py-1 text-center text-sm font-bold text-white border-r border-blue-400 w-24">Margin</th>
                    <th className="px-4 py-1 text-center text-sm font-bold text-white border-r border-blue-400 w-20">Margin %</th>
                    <th className="px-4 py-1 text-center text-sm font-bold text-white w-32">Amount</th>
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
                      <td className="px-1 py-1 border-r border-blue-200">
                        <input
                          type="number"
                          value={item.qty}
                          onChange={(e) => updateBillItem(item.id, 'qty', e.target.value)}
                          onKeyDown={(e) => handleQtyKeyDown(e, item.id)}
                          min="1"
                          id={`qty-input-${item.id}`}
                          className="w-full px-2 py-1 text-center border-0 bg-transparent focus:outline-none focus:bg-blue-100 rounded-lg text-blue-700 font-semibold transition-all duration-200"
                        />
                      </td>
                      <td className="px-2 py-1 border-r border-blue-200">
                        <input
                          type="number"
                          value={item.freeQty}
                          onChange={(e) => updateBillItem(item.id, 'freeQty', e.target.value)}
                          min="0"
                          className="w-full px-2 py-1 text-center border-0 bg-transparent focus:outline-none focus:bg-blue-100 rounded-lg text-blue-700 font-semibold transition-all duration-200"
                        />
                      </td>
                      <td className="px-2 py-1 border-r border-blue-200">
                        <input
                          type="number"
                          value={item.purchaseRate}
                          onChange={(e) => updateBillItem(item.id, 'purchaseRate', e.target.value)}
                          min="0"
                          step="0.01"
                          className="w-full px-2 py-1 text-right border-0 bg-transparent focus:outline-none focus:bg-blue-100 rounded-lg text-blue-700 font-semibold transition-all duration-200"
                        />
                      </td>
                      <td className="px-2 py-1 border-r border-blue-200">
                        <input
                          type="number"
                          value={item.salesRate}
                          onChange={(e) => updateBillItem(item.id, 'salesRate', e.target.value)}
                          min="0"
                          step="0.01"
                          className="w-full px-2 py-1 text-right border-0 bg-transparent focus:outline-none focus:bg-blue-100 rounded-lg text-blue-700 font-semibold transition-all duration-200"
                        />
                      </td>
                      <td className="px-2 py-1 text-sm text-right text-blue-800 font-bold border-r border-blue-200">
                        ₹{item.margin.toFixed(2)}
                      </td>
                      <td className="px-2 py-1 text-sm text-right text-blue-800 font-bold border-r border-blue-200">
                        {item.marginPercentage}%
                      </td>
                      <td className="px-2 py-1 text-sm text-right text-blue-800 font-bold border-blue-200">
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
                    onClick={handlePreviousPurchase}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    title="Go to previous purchase"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                  </button>
                  <button
                    onClick={handleNextPurchase}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    title="Go to next purchase"
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
                  <div className="bg-white border-2 border-blue-300 rounded-2xl mb-0 shadow-2xl" style={{ width: '780px', maxHeight: '310px' }}>
                    {products.filter(p =>
                      p.productName?.toLowerCase().includes(productSearch.toLowerCase())
                    ).length > 0 ? (
                      <div className="overflow-y-auto rounded-2xl" style={{ maxHeight: '190px' }}>
                        <table className="w-full border-collapse">
                          <thead className="bg-gradient-to-r from-blue-500 to-blue-600 border-b-2 border-blue-300 sticky top-0">
                            <tr>
                            <th className="px-4 py-1 text-left text-sm font-bold text-white border-r border-blue-400 w-1/3">Product Name</th>
                            <th className="px-4 py-1 text-left text-sm font-bold text-white border-r border-blue-400 w-1/6">Purchase Rate</th>
                            <th className="px-4 py-1 text-left text-sm font-bold text-white border-r border-blue-400 w-1/6">Sales Rate</th>
                            <th className="px-4 py-1 text-left text-sm font-bold text-white w-1/6">Stock</th>
                            </tr>
                          </thead>
                          <tbody>
                            {products.filter(p =>
                              p.productName?.toLowerCase().includes(productSearch.toLowerCase())
                            ).map((product, index) => (
                              <tr
                                key={product._id}
                                onClick={() => handleProductSelect(activeProductRow, product)}
                                className={`cursor-pointer hover:bg-blue-100 border-b border-blue-200 transition-all duration-200 ${
                                  index === selectedProductIndex ? 'bg-blue-200' : 'bg-white'
                                }`}
                              >
                              <td className="px-4 py-1 text-sm font-semibold text-blue-800 border-r border-blue-200">{product.productName}</td>
                              <td className="px-4 py-1 text-sm text-blue-700 border-r border-blue-200">₹{product.purchaseRate || 0}</td>
                              <td className="px-4 py-1 text-sm text-blue-700 border-r border-blue-200">₹{product.salesRate || 0}</td>
                              <td className="px-4 py-1 text-sm text-blue-700">
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
                {/* Totals Card */}
                <div className="bg-white rounded-xl p-1.5 shadow-lg border-2 border-blue-200 w-64 mb-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-1 border-b border-blue-200">
                      <span className="font-semibold text-blue-700">Subtotal:</span>
                      <span className="font-bold text-blue-900 flex-1 text-right">₹{calculateSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2 pb-1 border-b border-blue-200">
                      <span className="font-semibold text-blue-700">Total:</span>
                      <span className="font-bold text-blue-900 flex-1 text-right">₹{calculateTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-0 pt-0">
                      <span className="text-lg font-bold text-blue-800">Total Amount:</span>
                      <span className="text-xl font-bold text-blue-600 flex-1 text-right">₹{calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-5">
                  <button
                    onClick={handleClear}
                    className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Purchase;
