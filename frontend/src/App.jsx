import { useState, useEffect } from 'react';
import { Header, Footer } from './components';
import Home from './pages/Home';
import StaffDashboard from './pages/StaffDashboard';
import Settings from './pages/Settings';
import DataMigration from './pages/DataMigration';
import AddProduct from './pages/AddProduct';
import AddCustomer from './pages/AddCustomer';
import Sales from './pages/Sales';
import SalesDisplay from './pages/SalesDisplay';
import SalesReport from './pages/SalesReport';
import Purchase from './pages/purchase';
import PurchaseDisplay from './pages/PurchaseDisplay';
import Stock from './pages/Stock';
import AddSupplier from './pages/AddSupplier';
import Login from './pages/Login';

import { offlineAuthService } from './services/offlineAuthService';
import { firebaseBackupService } from './services/firebaseBackupService';
import { seedFirestoreData } from './services/seedData';
import { indexedDBService } from './services/indexedDBService';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedCustomerForSales, setSelectedCustomerForSales] = useState(null);
  const [currentBusinessDate, setCurrentBusinessDate] = useState(null);

  // Initialize business date from localStorage
  useEffect(() => {
    const storedDate = localStorage.getItem('businessDate');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (storedDate) {
      const stored = new Date(storedDate);
      stored.setHours(0, 0, 0, 0);
      setCurrentBusinessDate(stored);
    } else {
      setCurrentBusinessDate(today);
      localStorage.setItem('businessDate', today.toISOString());
    }
  }, []);

  // Initialize offline services on app startup
  useEffect(() => {
    const initializeApp = async () => {
      console.log('🚀 Initializing offline billing app...');
      
      // Initialize IndexedDB and default users
      await offlineAuthService.initializeDefaultUsers();
      
      // Seed sample data if database is empty
      const products = await indexedDBService.getAllProducts();
      if (products.length === 0) {
        console.log('📦 Database empty - seeding sample data...');
        const seedResult = await seedFirestoreData();
        if (seedResult.success) {
          console.log('✅ Sample data seeded successfully');
        } else {
          console.warn('⚠️ Failed to seed sample data:', seedResult.error);
        }
      } else {
        console.log(`📦 Database already has ${products.length} products - skipping seed`);
      }
      
      // Start auto-backup to Firebase
      firebaseBackupService.startAutoBackup();
      
      console.log('✅ App initialized successfully');
    };
    
    initializeApp();
  }, []);

  useEffect(() => {
    // Check if user is already logged in
    if (offlineAuthService.isAuthenticated()) {
      const currentUser = offlineAuthService.getCurrentUser();
      setUser(currentUser);
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    offlineAuthService.logout();
    setUser(null);
    setIsLoggedIn(false);
    setCurrentPage('dashboard');
  };

  const handleUpdateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const navigateToSettings = () => {
    setCurrentPage('settings');
  };

  const navigateToDataMigration = () => {
    setCurrentPage('dataMigration');
  };

  const navigateToDashboard = () => {
    setCurrentPage('dashboard');
  };

  const navigateToAddProduct = () => {
    setCurrentPage('addProduct');
  };

  const navigateToAddCustomer = () => {
    setCurrentPage('addCustomer');
  };

  const navigateToAddSupplier = () => {
    setCurrentPage('addSupplier');
  };

  const navigateToSales = () => {
    setCurrentPage('sales');
  };

  const navigateToSalesDisplay = () => {
    setCurrentPage('salesDisplay');
  };

  const navigateToSalesWithCustomer = (customer) => {
    setSelectedCustomerForSales(customer);
    setCurrentPage('sales');
  };

  const navigateToSalesReport = () => {
    setCurrentPage('salesReport');
  };

  const navigateToPurchase = () => {
    setCurrentPage('purchase');
  };

  const navigateToPurchaseDisplay = () => {
    setCurrentPage('purchaseDisplay');
  };

  const navigateToStock = () => {
    setCurrentPage('stock');
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      {currentPage !== 'sales' && currentPage !== 'salesDisplay' && currentPage !== 'salesReport' && currentPage !== 'purchase' && currentPage !== 'purchaseDisplay' && currentPage !== 'stock' && (
        <Header 
          user={user} 
          onLogout={handleLogout} 
          onNavigateToSettings={navigateToSettings}
          onNavigateToDataMigration={navigateToDataMigration}
          onNavigateToDashboard={navigateToDashboard}
          onNavigateToAddProduct={navigateToAddProduct}
          onNavigateToAddCustomer={navigateToAddCustomer}
          onNavigateToAddSupplier={navigateToAddSupplier}
          onNavigateToSales={navigateToSales}
          onNavigateToSalesDisplay={navigateToSalesDisplay}
          onNavigateToSalesReport={navigateToSalesReport}
          onNavigateToPurchase={navigateToPurchase}
          onNavigateToPurchaseDisplay={navigateToPurchaseDisplay}
          onNavigateToStock={navigateToStock}
        />
    
      )}
      <main className="flex-grow">
        {currentPage === 'settings' ? (
          <Settings user={user} onUpdateUser={handleUpdateUser} />
        ) : currentPage === 'dataMigration' ? (
          <DataMigration />
        ) : currentPage === 'addProduct' ? (
          <AddProduct user={user} />
        ) : currentPage === 'addCustomer' ? (
          <AddCustomer user={user} />
        ) : currentPage === 'addSupplier' ? (
          <AddSupplier user={user} />
        ) : currentPage === 'sales' ? (
          <Sales user={user} onNavigateToDashboard={navigateToDashboard} selectedCustomer={selectedCustomerForSales} onCustomerSelected={() => setSelectedCustomerForSales(null)} />
        ) : currentPage === 'salesDisplay' ? (
          <SalesDisplay user={user} onNavigateToDashboard={navigateToDashboard} onNavigateToSalesWithCustomer={navigateToSalesWithCustomer} />
        ) : currentPage === 'salesReport' ? (
          <SalesReport user={user} onNavigateToDashboard={navigateToDashboard} />
        ) : currentPage === 'purchase' ? (
          <Purchase user={user} onNavigateToDashboard={navigateToDashboard} />
        ) : currentPage === 'purchaseDisplay' ? (
          <PurchaseDisplay user={user} onNavigateToDashboard={navigateToDashboard} />
        ) : currentPage === 'stock' ? (
          <Stock user={user} onNavigateToDashboard={navigateToDashboard} />
        ) : (
          user?.role === 'admin' ? <Home /> : <StaffDashboard />
        )}
      </main>
      <Footer />
    </div>
  );
}

export default App;
