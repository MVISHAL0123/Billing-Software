import { useState, useEffect } from 'react';

const AddSupplier = ({ user }) => {
  const [formData, setFormData] = useState({
    supplierName: '',
    place: '',
    phoneNumber: ''
  });
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [editingSupplierId, setEditingSupplierId] = useState(null);

  // Fetch suppliers on component mount
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchSuppliers();
    }
  }, [user]);

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('http://localhost:5003/api/suppliers/list', {
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
        setSuppliers(data.suppliers || []);
      } else {
        console.error('Failed to fetch suppliers:', data.message);
        setSuppliers([]);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      setSuppliers([]);
    }
  };

  const handleClear = () => {
    setFormData({
      supplierName: '',
      place: '',
      phoneNumber: ''
    });
    setEditingSupplierId(null);
    setMessage({ type: '', text: '' });
  };

  const handleEdit = (supplier) => {
    setFormData({
      supplierName: supplier.supplierName,
      place: supplier.place || '',
      phoneNumber: supplier.phoneNumber || ''
    });
    setEditingSupplierId(supplier._id);
    setMessage({ type: '', text: '' });
    // Scroll to top to show the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // Validation
    if (!formData.supplierName.trim()) {
      setMessage({ type: 'error', text: 'Supplier name is required!' });
      return;
    }

    if (!formData.phoneNumber.trim()) {
      setMessage({ type: 'error', text: 'Phone number is required!' });
      return;
    }

    // Validate phone number (10 digits)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(formData.phoneNumber.trim())) {
      setMessage({ type: 'error', text: 'Phone number must be 10 digits!' });
      return;
    }

    setLoading(true);

    try {
      const url = editingSupplierId 
        ? `http://localhost:5003/api/suppliers/${editingSupplierId}`
        : 'http://localhost:5003/api/suppliers/add';
      
      const response = await fetch(url, {
        method: editingSupplierId ? 'PUT' : 'POST',
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
        throw new Error(data.message || (editingSupplierId ? 'Failed to update supplier' : 'Failed to add supplier'));
      }

      setMessage({ type: 'success', text: editingSupplierId ? 'Supplier updated successfully!' : 'Supplier added successfully!' });
      
      // Refresh suppliers list
      fetchSuppliers();
      
      // Clear form
      handleClear();
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to add supplier' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 py-8">
      <div className="container mx-auto px-4 max-w-7xl">

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Card - Supplier Form */}
          <div>
            <div className="bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden">
              {/* Form Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-3 rounded-full">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{editingSupplierId ? 'Update Supplier' : 'Add New Supplier'}</h2>
                    <p className="text-blue-100 text-sm">{editingSupplierId ? 'Modify supplier details below' : 'Fill in the details below'}</p>
                  </div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                {message.text && (
                  <div className={`p-4 rounded-xl border-2 ${
                    message.type === 'success' 
                      ? 'bg-blue-50 border-blue-200 text-blue-800' 
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
                      <p className="font-semibold">{message.text}</p>
                    </div>
                  </div>
                )}

                {/* Supplier Name */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Supplier Name *
                  </label>
                  <input
                    type="text"
                    value={formData.supplierName}
                    onChange={(e) => setFormData({ ...formData, supplierName: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all outline-none"
                    placeholder="Enter supplier name"
                    required
                  />
                </div>

                {/* Place */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Place *
                  </label>
                  <input
                    type="text"
                    value={formData.place}
                    onChange={(e) => setFormData({ ...formData, place: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all outline-none"
                    placeholder="Enter place"
                    required
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all outline-none"
                    placeholder="10 digit mobile number"
                    maxLength="10"
                    required
                  />
                </div>

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
                    {loading ? (editingSupplierId ? 'Updating...' : 'Saving...') : (editingSupplierId ? 'Update' : 'Save')}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Card - Suppliers List (Admin Only) */}
          {user?.role === 'admin' && (
            <div>
              <div className="bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-3 rounded-full">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Saved Suppliers</h2>
                      <p className="text-blue-100 text-sm">{suppliers.length} suppliers in database</p>
                    </div>
                  </div>
                </div>

                {/* Suppliers Table */}
                <div className="overflow-x-auto">
                  {suppliers.length === 0 ? (
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <p className="text-gray-500 font-semibold">No suppliers yet</p>
                      <p className="text-gray-400 text-sm mt-1">Add your first supplier using the form</p>
                    </div>
                  ) : (
                    <div className="max-h-[600px] overflow-y-auto">
                      <table className="w-full border-collapse">
                        <thead className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
                          <tr>
                            <th className="border border-blue-400 px-4 py-3 text-left font-bold text-sm w-20">S.No</th>
                            <th className="border border-blue-400 px-4 py-3 text-left font-bold text-sm">Supplier Name</th>
                            <th className="border border-blue-400 px-4 py-3 text-left font-bold text-sm">Phone Number</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white">
                          {suppliers.map((supplier, index) => (
                            <tr key={index} className="hover:bg-blue-50 transition-colors">
                              <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700 font-medium">{index + 1}</td>
                              <td className="border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-800">
                                <button
                                  onClick={() => handleEdit(supplier)}
                                  className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-semibold text-left w-full"
                                >
                                  {supplier.supplierName}
                                </button>
                              </td>
                              <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700 font-medium">
                                {supplier.phoneNumber}
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

export default AddSupplier;