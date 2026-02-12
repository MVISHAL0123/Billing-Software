import { useState } from 'react';

const Home = () => {
  const [invoices, setInvoices] = useState([
  ]);

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      setInvoices(invoices.filter(invoice => invoice.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-3 drop-shadow-lg">
            Billing Dashboard
          </h1>
          <p className="text-lg text-gray-700 font-medium">Manage your invoices and customers efficiently</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
