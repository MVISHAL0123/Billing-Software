import { useState, useEffect, useRef, useCallback } from 'react';
import { translateToTamil } from '../services/translationService';

const AddProduct = ({ user }) => {
  const [formData, setFormData] = useState({
    productName: '',
    tamilName: '',
    purchaseRate: '',
    salesRate: '',
    marginPercentage: 0
  });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [editingProductId, setEditingProductId] = useState(null);
  const translationTimeoutRef = useRef(null);

  // Tamil translation mapping (fallback)
  
  // Fetch products on component mount
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchProducts();
    }
  }, [user]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:5003/api/products/list', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      // Handle authentication errors
      if (!response.ok && (response.status === 401 || data.message?.includes('Token'))) {
        localStorage.clear();
        alert('Session expired. Please login again.');
        window.location.reload();
        return;
      }
      
      if (data.success) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  // Calculate margin percentage when purchase or sales rate changes
  useEffect(() => {
    if (formData.purchaseRate && formData.salesRate) {
      const purchase = parseFloat(formData.purchaseRate);
      const sales = parseFloat(formData.salesRate);
      const margin = sales - purchase;
      const marginPercentage = purchase > 0 ? ((margin / purchase) * 100) : 0;
      setFormData(prev => ({ 
        ...prev, 
        marginPercentage: marginPercentage.toFixed(2)
      }));
    } else {
      setFormData(prev => ({ ...prev, marginPercentage: 0 }));
    }
  }, [formData.purchaseRate, formData.salesRate]);

  // Cleanup translation timeout on unmount
  useEffect(() => {
    return () => {
      if (translationTimeoutRef.current) {
        clearTimeout(translationTimeoutRef.current);
      }
    };
  }, []);

  const handleProductNameChange = (e) => {
    const name = e.target.value.toUpperCase();
    setFormData(prev => ({ ...prev, productName: name }));
    
    // Clear previous timeout
    if (translationTimeoutRef.current) {
      clearTimeout(translationTimeoutRef.current);
    }
    
    // Only translate if name has at least 2 characters
    if (name.trim().length >= 2) {
      setTranslating(true);
      
      // Debounce translation - wait 800ms after user stops typing
      translationTimeoutRef.current = setTimeout(async () => {
        try {
          const tamilName = await translateToTamil(name.trim());
          if (tamilName) {
            setFormData(prev => ({ ...prev, tamilName }));
          }
        } catch (error) {
          console.error('Translation error:', error);
        } finally {
          setTranslating(false);
        }
      }, 800);
    } else {
      setFormData(prev => ({ ...prev, tamilName: '' }));
      setTranslating(false);
    }
  };

  const handleClear = () => {
    setFormData({
      productName: '',
      tamilName: '',
      purchaseRate: '',
      salesRate: '',
      marginPercentage: 0
    });
    setEditingProductId(null);
    setMessage({ type: '', text: '' });
  };

  const handleEdit = (product) => {
    setFormData({
      productName: product.productName,
      tamilName: product.tamilName || '',
      purchaseRate: product.purchaseRate,
      salesRate: product.salesRate,
      marginPercentage: product.marginPercentage
    });
    setEditingProductId(product._id);
    setMessage({ type: '', text: '' });
    // Scroll to top to show the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // Validation
    if (!formData.productName.trim()) {
      setMessage({ type: 'error', text: 'Product name is required!' });
      return;
    }

    if (parseFloat(formData.purchaseRate) <= 0) {
      setMessage({ type: 'error', text: 'Purchase rate must be greater than 0!' });
      return;
    }

    if (parseFloat(formData.salesRate) <= 0) {
      setMessage({ type: 'error', text: 'Sales rate must be greater than 0!' });
      return;
    }

    if (parseFloat(formData.salesRate) <= parseFloat(formData.purchaseRate)) {
      setMessage({ type: 'error', text: 'Sales rate must be greater than purchase rate!' });
      return;
    }

    setLoading(true);

    try {
      const url = editingProductId 
        ? `http://localhost:5003/api/products/${editingProductId}`
        : 'http://localhost:5003/api/products/add';
      
      const response = await fetch(url, {
        method: editingProductId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        // If token is invalid, clear localStorage and reload
        if (response.status === 401 || data.message?.includes('Token')) {
          localStorage.clear();
          alert('Session expired. Please login again.');
          window.location.reload();
          return;
        }
        throw new Error(data.message || (editingProductId ? 'Failed to update product' : 'Failed to add product'));
      }

      setMessage({ type: 'success', text: editingProductId ? 'Product updated successfully!' : 'Product added successfully!' });
      
      // Refresh products list
      fetchProducts();
      
      // Clear form
      handleClear();
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to add product' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 py-8">
      <div className="container mx-auto px-4 max-w-7xl">

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Card - Product Form */}
          <div>
            <div className="bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden">
              {/* Form Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-3 rounded-full">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{editingProductId ? 'Update Product' : 'Add New Products'}</h2>
                    <p className="text-blue-100 text-sm">{editingProductId ? 'Modify product details below' : 'Fill in the details below'}</p>
                  </div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-5 space-y-3">
                {message.text && (
                  <div className={`p-4 rounded-xl border-2 ${
                    message.type === 'success' 
                      ? 'bg-green-50 border-green-200 text-green-800' 
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    <div className="flex items-center gap-2">
                      {message.type === 'success' ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      <span className="font-semibold">{message.text}</span>
                    </div>
                  </div>
                )}

                {/* Product Name */}
                <div className="flex items-center gap-4 mb-2">
                  <label className="text-sm font-bold text-gray-700 w-48">Product Name *</label>
                  <input
                    type="text"
                    value={formData.productName}
                    onChange={handleProductNameChange}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all outline-none"
                    placeholder="e.g., Rice, Sugar, Oil"
                    required
                  />
                </div>
       

                {/* Tamil Product Name */}
                <div className="flex items-center gap-4 mb-2">
                  <label className="text-sm font-bold text-gray-700 w-48">
                    Tamil Product Name
                    {translating && <span className="ml-2 text-xs text-blue-600">Translating...</span>}
                  </label>
                  <input
                    type="text"
                    value={formData.tamilName}
                    onChange={(e) => setFormData({ ...formData, tamilName: e.target.value })}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all outline-none bg-blue-50"
                    placeholder="Auto-translated (or type manually)"
                    style={{ fontFamily: 'Arial, sans-serif' }}
                  />
                </div>

                <hr className="border-blue-100" />

                {/* Purchase Rate */}
                <div className="flex items-center gap-4 mb-2">
                  <label className="text-sm font-bold text-gray-700 w-48">Purchase Rate (₹) *</label>
                  <input
                    type="number"
                    value={formData.purchaseRate}
                    onChange={(e) => setFormData({ ...formData, purchaseRate: e.target.value })}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all outline-none"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                {/* Sales Rate */}
                <div className="flex items-center gap-4 mb-2">
                  <label className="text-sm font-bold text-gray-700 w-48">Sales Rate (₹) *</label>
                  <input
                    type="number"
                    value={formData.salesRate}
                    onChange={(e) => setFormData({ ...formData, salesRate: e.target.value })}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all outline-none"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                {/* Margin (Auto-calculated) */}
                <div className="flex items-center gap-4 mb-2">
                  <label className="text-sm font-bold text-gray-700 w-48">Margin %</label>
                  <div className={`flex-1 px-4 py-3 border-2 rounded-xl font-bold text-2xl text-center ${
                    parseFloat(formData.marginPercentage) > 0 ? 'bg-green-50 border-green-300 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-500'
                  }`}>
                    {formData.marginPercentage || '0.00'}%
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-2 ml-48">Auto-calculated percentage</p>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={handleClear}
                    className="flex-1 px-6 py-3 border-2 border-blue-500 text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-all"
                  >
                    Clear
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-800 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? (editingProductId ? 'Updating...' : 'Saving...') : (editingProductId ? 'Update' : 'Save')}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Card - Products List (Admin Only) */}
          {user?.role === 'admin' && (
            <div>
              <div className="bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-3 rounded-full">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Saved Products</h2>
                      <p className="text-blue-100 text-sm">{products.length} products in inventory</p>
                    </div>
                  </div>
                </div>

                {/* Products Table */}
                <div className="overflow-x-auto">
                  {products.length === 0 ? (
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p className="text-gray-500 font-semibold">No products yet</p>
                      <p className="text-gray-400 text-sm mt-1">Add your first product using the form</p>
                    </div>
                  ) : (
                    <div className="max-h-[600px] overflow-y-auto">
                      <table className="w-full border-collapse">
                        <thead className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
                          <tr>
                            <th className="border border-blue-400 px-4 py-3 text-left font-bold text-sm w-20">S.No</th>
                            <th className="border border-blue-400 px-4 py-3 text-left font-bold text-sm">Product Name</th>
                            <th className="border border-blue-400 px-4 py-3 text-left font-bold text-sm">Tamil Name</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white">
                          {products.map((product, index) => (
                            <tr key={index} className="hover:bg-blue-50 transition-colors">
                              <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700 font-medium">{index + 1}</td>
                              <td className="border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-800">
                                <button
                                  onClick={() => handleEdit(product)}
                                  className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-semibold text-left w-full"
                                >
                                  {product.productName}
                                </button>
                              </td>
                              <td className="border border-gray-300 px-4 py-3 text-sm text-blue-600 font-semibold" style={{ fontFamily: 'Arial, sans-serif' }}>
                                {product.tamilName || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddProduct;
