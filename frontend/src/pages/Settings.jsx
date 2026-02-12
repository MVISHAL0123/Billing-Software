import { useState, useEffect } from 'react';

const Settings = ({ user, onUpdateUser }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newUsername: user?.username || '',
    newPassword: '',
    confirmPassword: ''
  });
  const [staffUsers, setStaffUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [staffLoading, setStaffLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [staffMessage, setStaffMessage] = useState({ type: '', text: '' });

  // Fetch staff users if admin
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchStaffUsers();
    }
  }, [user]);

  const fetchStaffUsers = async () => {
    try {
      const response = await fetch('http://localhost:5003/api/auth/staff-users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setStaffUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching staff users:', error);
    }
  };

  const handleStaffUpdate = async (staffId) => {
    const staff = staffUsers.find(s => s._id === staffId);
    if (!staff) return;

    setStaffMessage({ type: '', text: '' });
    setStaffLoading(true);

    try {
      const updateData = {};
      
      // Check if username changed
      if (staff.tempUsername && staff.tempUsername !== staff.username) {
        updateData.username = staff.tempUsername;
      }
      
      // Check if password provided
      if (staff.tempPassword) {
        if (staff.tempPassword.length < 6) {
          setStaffMessage({ type: 'error', text: 'Password must be at least 6 characters!' });
          setStaffLoading(false);
          return;
        }
        updateData.password = staff.tempPassword;
      }

      // Only update if there are changes
      if (Object.keys(updateData).length === 0) {
        setStaffMessage({ type: 'error', text: 'No changes to update!' });
        setStaffLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5003/api/auth/update-staff', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          staffId: staffId,
          ...updateData
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update staff');
      }

      setStaffMessage({ type: 'success', text: 'Staff updated successfully!' });
      fetchStaffUsers();
    } catch (error) {
      setStaffMessage({ type: 'error', text: error.message || 'Failed to update staff' });
    } finally {
      setStaffLoading(false);
    }
  };

  const updateStaffField = (staffId, field, value) => {
    setStaffUsers(prevUsers => 
      prevUsers.map(staff => 
        staff._id === staffId 
          ? { ...staff, [`temp${field.charAt(0).toUpperCase() + field.slice(1)}`]: value }
          : staff
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // Validation
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match!' });
      return;
    }

    if (formData.newPassword && formData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters!' });
      return;
    }

    if (!formData.currentPassword) {
      setMessage({ type: 'error', text: 'Current password is required!' });
      return;
    }

    setLoading(true);

    try {
      const updateData = {
        currentPassword: formData.currentPassword,
        username: formData.newUsername
      };

      if (formData.newPassword) {
        updateData.newPassword = formData.newPassword;
      }

      const response = await fetch('http://localhost:5003/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      
      // Update user in parent component
      if (onUpdateUser) {
        onUpdateUser({ ...user, username: formData.newUsername });
      }

      // Clear password fields
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
            Account Settings
          </h1>
          <p className="text-gray-600">Update your account information</p>
        </div>

        {/* Two Column Layout for Admin */}
        <div className={`grid ${user?.role === 'admin' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 max-w-2xl mx-auto'} gap-8`}>
          {/* Left Card - Admin Profile Settings */}
          <div>
            {/* Settings Form */}
        <div className="bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden">
          {/* User Info Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-4 rounded-full">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{user?.name || user?.username}</h2>
                <p className="text-blue-100 text-sm uppercase font-semibold">{user?.role} Account</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Alert Messages */}
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

            {/* Current Password */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Current Password *
              </label>
              <input
                type="password"
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all outline-none"
                placeholder="Enter your current password"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Required to verify your identity</p>
            </div>

            <hr className="border-blue-100" />

            {/* New Username */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={formData.newUsername}
                onChange={(e) => setFormData({ ...formData, newUsername: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all outline-none"
                placeholder="Enter new username"
                required
              />
            </div>

            <hr className="border-blue-100" />

            {/* New Password Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Change Password (Optional)
              </h3>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all outline-none"
                  placeholder="Enter new password (optional)"
                />
                <p className="text-xs text-gray-500 mt-1">Leave blank to keep current password</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all outline-none"
                  placeholder="Confirm new password"
                  disabled={!formData.newPassword}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-800 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? 'Saving Changes...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border-l-4 border-blue-600 p-4 rounded-lg">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-blue-800">Security Tips</p>
              <ul className="text-sm text-blue-700 mt-1 space-y-1">
                <li>• Use a strong password with at least 6 characters</li>
                <li>• Don't share your password with anyone</li>
                <li>• Change your password regularly</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Admin Only - Staff Management */}
      {user?.role === 'admin' && (
        <div className="space-y-6">
          {/* Alert Messages */}
          {staffMessage.text && (
            <div className={`p-4 rounded-xl border-2 ${
              staffMessage.type === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center gap-2">
                {staffMessage.type === 'success' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span className="font-semibold">{staffMessage.text}</span>
              </div>
            </div>
          )}

          {/* Staff Cards - Vertical Layout */}
          {staffUsers.map((staff) => (
            <div key={staff._id} className="bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-5">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-4 rounded-full">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{staff.name}</h2>
                    <p className="text-blue-100 text-sm">STAFF Account</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Username */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    defaultValue={staff.username}
                    onChange={(e) => updateStaffField(staff._id, 'username', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all outline-none"
                    placeholder="Enter new username"
                  />
                </div>

                <hr className="border-blue-100" />

                {/* Password Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Change Password (Optional)
                  </h3>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      onChange={(e) => updateStaffField(staff._id, 'password', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all outline-none"
                      placeholder="Enter new password (optional)"
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave blank to keep current password</p>
                  </div>
                </div>

                {/* Update Button */}
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => handleStaffUpdate(staff._id)}
                    disabled={staffLoading}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-800 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {staffLoading ? 'Updating...' : 'Update Staff'}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {staffUsers.length === 0 && (
            <div className="bg-white rounded-2xl shadow-2xl border border-blue-100 p-8">
              <div className="text-center text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-lg font-semibold">No staff members found</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
      </div>
    </div>
  );
};

export default Settings;
