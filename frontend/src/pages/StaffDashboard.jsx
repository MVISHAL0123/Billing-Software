import { useState } from 'react';

const StaffDashboard = () => {
  const [invoices] = useState([
    { id: 1, customer: 'Rajesh Kumar', amount: 15000, status: 'Paid', date: '2026-01-15' },
    { id: 2, customer: 'Priya Sharma', amount: 8500, status: 'Pending', date: '2026-01-18' },
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-3 drop-shadow-lg">
            Staff Dashboard
          </h1>
          <p className="text-lg text-gray-700 font-medium">Manage invoices and customer records</p>
        </div>

        {/* Stats Cards - Limited for Staff */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl shadow-2xl p-6 transform hover:scale-105 transition-all duration-300 hover:shadow-blue-500/50 cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white/90 text-sm font-semibold uppercase tracking-wide">My Invoices</h3>
                <p className="text-4xl font-extrabold text-white mt-3">2</p>
                <p className="text-blue-100 text-sm mt-3 font-semibold">Total assigned</p>
              </div>
              <div className="bg-white/20 p-4 rounded-full">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white border-2 border-blue-200 rounded-2xl shadow-2xl p-6 transform hover:scale-105 transition-all duration-300 hover:shadow-blue-500/30 cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-blue-700 text-sm font-semibold uppercase tracking-wide">Pending Tasks</h3>
                <p className="text-4xl font-extrabold text-blue-800 mt-3">1</p>
                <p className="text-blue-600 text-sm mt-3 font-semibold">Needs attention</p>
              </div>
              <div className="bg-blue-100 p-4 rounded-full">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Management */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-blue-100">
          <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-blue-800">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              My Invoices
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 transition-all duration-200 hover:shadow-lg">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{invoice.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{invoice.customer}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">₹{invoice.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-4 py-2 rounded-full text-xs font-bold shadow-lg ${
                        invoice.status === 'Paid' 
                          ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-green-500/50' 
                          : 'bg-gradient-to-r from-orange-400 to-pink-500 text-white shadow-orange-500/50 animate-pulse'
                      }`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{invoice.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-4 py-2 rounded-lg font-semibold mr-2 hover:from-blue-600 hover:to-blue-800 transform hover:scale-105 transition-all shadow-md hover:shadow-blue-500/50">View</button>
                      <button className="bg-white border-2 border-blue-500 text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transform hover:scale-105 transition-all shadow-md">Update</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Note for Staff */}
        <div className="mt-8 bg-blue-100 border-l-4 border-blue-600 p-4 rounded-lg">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-blue-800 font-semibold">
              Staff Access: You can view and update invoices. Contact admin for advanced features.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
