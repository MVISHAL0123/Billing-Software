import { useState } from 'react';
import { firebaseMigrationService } from '../services/firebaseMigrationService';

const DataMigration = () => {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [migrationStats, setMigrationStats] = useState(null);

  const handleMigrateFromFirestore = async () => {
    setLoading(true);
    setStatus('Starting migration...');
    setMessage({ type: '', text: '' });

    try {
      console.log('Starting Firestore to IndexedDB migration...');
      const result = await firebaseMigrationService.migrateFromFirestoreToIndexedDB();

      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        setMigrationStats(result.stats);
        setStatus('Migration completed successfully!');
      } else {
        setMessage({ type: 'error', text: `Migration failed: ${result.error}` });
        setStatus('Migration failed');
      }
    } catch (error) {
      console.error('Migration error:', error);
      setMessage({ type: 'error', text: error.message });
      setStatus('Migration error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadFirestoreData = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const result = await firebaseMigrationService.downloadFirestoreDataAsJSON();
      if (result.success) {
        setMessage({ type: 'success', text: 'Data downloaded successfully!' });
      } else {
        setMessage({ type: 'error', text: `Download failed: ${result.error}` });
      }
    } catch (error) {
      console.error('Download error:', error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleImportJSON = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      const result = await firebaseMigrationService.importToIndexedDB(data);

      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        setStatus(`Imported ${result.totalImported} records successfully`);
      } else {
        setMessage({ type: 'error', text: `Import failed: ${result.error}` });
      }
    } catch (error) {
      console.error('Import error:', error);
      setMessage({ type: 'error', text: `Failed to parse file: ${error.message}` });
    } finally {
      setLoading(false);
      e.target.value = ''; // Reset file input
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
            📊 Data Migration
          </h1>
          <p className="text-gray-600">Transfer data between Firebase Firestore and IndexedDB</p>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-xl border-2 ${
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

        {/* Status */}
        {status && (
          <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
            <p className="text-blue-800 font-semibold">ℹ️ {status}</p>
          </div>
        )}

        {/* Migration Stats */}
        {migrationStats && (
          <div className="mb-8 bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">📈 Migration Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Products</p>
                <p className="text-2xl font-bold text-blue-600">{migrationStats.products?.length || 0}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Customers</p>
                <p className="text-2xl font-bold text-green-600">{migrationStats.customers?.length || 0}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Suppliers</p>
                <p className="text-2xl font-bold text-purple-600">{migrationStats.suppliers?.length || 0}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Bills</p>
                <p className="text-2xl font-bold text-yellow-600">{migrationStats.bills?.length || 0}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Purchases</p>
                <p className="text-2xl font-bold text-orange-600">{migrationStats.purchases?.length || 0}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Users</p>
                <p className="text-2xl font-bold text-red-600">{migrationStats.users?.length || 0}</p>
              </div>
            </div>
          </div>
        )}

        {/* Migration Options */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Option 1: Direct Migration */}
          <div className="bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-5">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                <h2 className="text-xl font-bold text-white">Firebase → Local Storage</h2>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-700">
                Automatically transfer all your data from Firebase Firestore to local IndexedDB storage.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>✅ Transfers Products, Customers, Suppliers</li>
                <li>✅ Transfers Bills and Purchases</li>
                <li>✅ Skips duplicate users</li>
                <li>✅ Works even if Firebase unavailable</li>
              </ul>
              <button
                onClick={handleMigrateFromFirestore}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? '🔄 Migrating...' : '📥 Migrate Now'}
              </button>
            </div>
          </div>

          {/* Option 2: Download & Import */}
          <div className="bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-green-800 px-6 py-5">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h2 className="text-xl font-bold text-white">Manual Backup & Restore</h2>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-700">
                Download your Firebase data as JSON and import manually later.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>📥 Download as JSON file</li>
                <li>💾 Save for backup</li>
                <li>📤 Upload JSON anytime</li>
                <li>🔐 Full data control</li>
              </ul>
              <div className="space-y-2">
                <button
                  onClick={handleDownloadFirestoreData}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-600 to-green-800 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? '⏳ Downloading...' : '⬇️ Download Firestore Data'}
                </button>
                <label className="w-full">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJSON}
                    disabled={loading}
                    className="hidden"
                  />
                  <span className="block w-full bg-gradient-to-r from-amber-600 to-amber-800 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-200 cursor-pointer text-center disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
                    {loading ? '⏳ Importing...' : '⬆️ Import JSON File'}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Information Box */}
        <div className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-blue-900 mb-4">ℹ️ Important Information</h3>
          <ul className="text-blue-800 space-y-2">
            <li>• Both methods preserve your existing IndexedDB data (no overwrite)</li>
            <li>• Duplicate products/customers by ID are skipped</li>
            <li>• Firebase must be initialized to use direct migration</li>
            <li>• JSON import works offline (no internet required)</li>
            <li>• Recommended: Backup your current data first</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DataMigration;
