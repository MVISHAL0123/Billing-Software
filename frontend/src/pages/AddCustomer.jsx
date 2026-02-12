import { useState, useEffect } from 'react';

const AddCustomer = ({ user }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    place: '',
    phoneNumber: ''
  });
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [editingCustomerId, setEditingCustomerId] = useState(null);

  // Fetch customers on component mount
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchCustomers();
    }
  }, [user]);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('http://localhost:5003/api/customers/list', {
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
        setCustomers(data.customers);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleClear = () => {
    setFormData({
      customerName: '',
      place: '',
      phoneNumber: ''
    });
    setEditingCustomerId(null);
    setMessage({ type: '', text: '' });
  };

  const handleEdit = (customer) => {
    setFormData({
      customerName: customer.customerName,
      place: customer.place || '',
      phoneNumber: customer.phoneNumber || ''
    });
    setEditingCustomerId(customer._id);
    setMessage({ type: '', text: '' });
    // Scroll to top to show the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // Validation
    if (!formData.customerName.trim()) {
      setMessage({ type: 'error', text: 'Customer name is required!' });
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
      const url = editingCustomerId 
        ? `http://localhost:5003/api/customers/${editingCustomerId}`
        : 'http://localhost:5003/api/customers/add';
      
      const response = await fetch(url, {
        method: editingCustomerId ? 'PUT' : 'POST',
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
        throw new Error(data.message || (editingCustomerId ? 'Failed to update customer' : 'Failed to add customer'));
      }

      setMessage({ type: 'success', text: editingCustomerId ? 'Customer updated successfully!' : 'Customer added successfully!' });
      
      // Refresh customers list
      fetchCustomers();
      
      // Clear form
      handleClear();
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to add customer' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 py-8">
      <div className="container mx-auto px-4 max-w-7xl">

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Card - Customer Form */}
          <div>
            <div className="bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden">
              {/* Form Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-3 rounded-full">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{editingCustomerId ? 'Update Customer' : 'Add New Customer'}</h2>
                    <p className="text-blue-100 text-sm">{editingCustomerId ? 'Modify customer details below' : 'Fill in the details below'}</p>
                  </div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-4 space-y-4">
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
                      <p className="font-semibold">{message.text}</p>
                    </div>
                  </div>
                )}

                {/* Customer Name */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all outline-none"
                    placeholder="Enter customer name"
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
                    {loading ? (editingCustomerId ? 'Updating...' : 'Saving...') : (editingCustomerId ? 'Update' : 'Save')}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Card - Customers List (Admin Only) */}
          {user?.role === 'admin' && (
            <div>
              <div className="bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-3 rounded-full">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Saved Customers</h2>
                      <p className="text-blue-100 text-sm">{customers.length} customers in database</p>
                    </div>
                  </div>
                </div>

                {/* Customers Table */}
                <div className="overflow-x-auto">
                  {customers.length === 0 ? (
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="text-gray-500 font-semibold">No customers yet</p>
                      <p className="text-gray-400 text-sm mt-1">Add your first customer using the form</p>
                    </div>
                  ) : (
                    <div className="max-h-[600px] overflow-y-auto">
                      <table className="w-full border-collapse">
                        <thead className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
                          <tr>
                            <th className="border border-blue-400 px-4 py-3 text-left font-bold text-sm w-20">S.No</th>
                            <th className="border border-blue-400 px-4 py-3 text-left font-bold text-sm">Customer Name</th>
                            <th className="border border-blue-400 px-4 py-3 text-left font-bold text-sm">Phone Number</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white">
                          {customers.map((customer, index) => (
                            <tr key={index} className="hover:bg-blue-50 transition-colors">
                              <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700 font-medium">{index + 1}</td>
                              <td className="border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-800">
                                <button
                                  onClick={() => handleEdit(customer)}
                                  className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-semibold text-left w-full"
                                >
                                  {customer.customerName}
                                </button>
                              </td>
                              <td className="border border-gray-300 px-4 py-3 text-sm text-gray-700 font-medium">
                                {customer.phoneNumber}
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

export default AddCustomer;
