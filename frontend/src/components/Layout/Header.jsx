import { useState, useRef, useEffect } from 'react';

const Header = ({ user, onLogout, onNavigateToSettings, onNavigateToDashboard, onNavigateToAddProduct, onNavigateToAddCustomer, onNavigateToAddSupplier, onNavigateToSales, onNavigateToSalesDisplay, onNavigateToSalesReport, onNavigateToPurchase, onNavigateToPurchaseDisplay, onNavigateToStock }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isSalesOpen, setIsSalesOpen] = useState(false);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [hoveredNav, setHoveredNav] = useState(null);
  const dropdownRef = useRef(null);
  const inventoryRef = useRef(null);
  const salesRef = useRef(null);
  const purchaseRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (inventoryRef.current && !inventoryRef.current.contains(event.target)) {
        setIsInventoryOpen(false);
      }
      if (salesRef.current && !salesRef.current.contains(event.target)) {
        setIsSalesOpen(false);
      }
      if (purchaseRef.current && !purchaseRef.current.contains(event.target)) {
        setIsPurchaseOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Nav items configuration
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', onClick: onNavigateToDashboard, icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' }
  ];

  return (
    <>
    <header className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-2xl">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white text-blue-600 w-12 h-12 rounded-xl flex items-center justify-center font-black text-2xl shadow-lg logo-smooth transition-all duration-300">
              <span>M</span>
            </div>
            <div>
              <h1 className="text-3xl font-black text-white drop-shadow-lg gradient-text">MMK</h1>
              <p className="text-white/80 text-xs font-semibold uppercase tracking-wider">{user?.role || 'User'} Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <nav className="flex gap-6 items-center">
              {/* Dashboard Button with Smooth Animation */}
              <button 
                onClick={onNavigateToDashboard}
                className="nav-item-smooth px-4 py-2 rounded-lg font-semibold text-white"
              >
                <div className="flex items-center gap-2">
                  <svg className="nav-icon-smooth w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span className="nav-text-smooth">Dashboard</span>
                </div>
              </button>
              
              {/* Sales Dropdown with Smooth Animation */}
              <div className="relative" ref={salesRef}>
                <button 
                  onClick={() => setIsSalesOpen(!isSalesOpen)}
                  className="nav-item-smooth px-4 py-2 rounded-lg font-semibold text-white"
                >
                  <div className="flex items-center gap-2">
                    <svg className="nav-icon-smooth w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span className="nav-text-smooth">Sales</span>
                    <svg 
                      className={`w-4 h-4 transition-transform duration-300 ${isSalesOpen ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                
                {/* Sales Dropdown Menu */}
                {isSalesOpen && (
                  <div className="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-2xl overflow-hidden border border-blue-100 z-50 backdrop-blur-sm bg-white/95">
                    <div className="py-2">
                      <button 
                        onClick={() => {
                          setIsSalesOpen(false);
                          onNavigateToSales();
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 hover:bg-blue-50 transition-all duration-200 font-medium group/item"
                      >
                        <div className="relative">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <div className="absolute inset-0 bg-blue-600 rounded-full opacity-0 group-hover/item:opacity-10 transition-opacity"></div>
                        </div>
                        <span>Sales Page</span>
                      </button>
                      <button 
                        onClick={() => {
                          setIsSalesOpen(false);
                          onNavigateToSalesDisplay();
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 hover:bg-blue-50 transition-all duration-200 font-medium group/item"
                      >
                        <div className="relative">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <div className="absolute inset-0 bg-blue-600 rounded-full opacity-0 group-hover/item:opacity-10 transition-opacity"></div>
                        </div>
                        <span>Sales Display</span>
                      </button>
                      {user?.role === 'admin' && (
                        <button 
                          onClick={() => {
                            setIsSalesOpen(false);
                            onNavigateToSalesReport();
                          }}
                          className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 hover:bg-blue-50 transition-all duration-200 font-medium group/item"
                        >
                          <div className="relative">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <div className="absolute inset-0 bg-blue-600 rounded-full opacity-0 group-hover/item:opacity-10 transition-opacity"></div>
                          </div>
                          <span>Sales Report</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {user?.role === 'admin' && (
                <>
                  {/* Purchase Dropdown with Smooth Animation */}
                  <div className="relative" ref={purchaseRef}>
                    <button 
                      onClick={() => setIsPurchaseOpen(!isPurchaseOpen)}
                      className="nav-item-smooth px-4 py-2 rounded-lg font-semibold text-white"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="nav-icon-smooth w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="nav-text-smooth">Purchase</span>
                        <svg 
                          className={`w-4 h-4 transition-transform duration-300 ${isPurchaseOpen ? 'rotate-180' : ''}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>
                    
                    {/* Purchase Dropdown Menu */}
                    {isPurchaseOpen && (
                      <div className="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-2xl overflow-hidden border border-blue-100 z-50 backdrop-blur-sm bg-white/95">
                        <div className="py-2">
                          <button 
                            onClick={() => {
                              setIsPurchaseOpen(false);
                              onNavigateToPurchase();
                            }}
                            className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 hover:bg-blue-50 transition-all duration-200 font-medium group/item"
                          >
                            <div className="relative">
                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              <div className="absolute inset-0 bg-blue-600 rounded-full opacity-0 group-hover/item:opacity-10 transition-opacity"></div>
                            </div>
                            <span>Purchase Page</span>
                          </button>
                          <button 
                            onClick={() => {
                              setIsPurchaseOpen(false);
                              onNavigateToPurchaseDisplay();
                            }}
                            className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 hover:bg-blue-50 transition-all duration-200 font-medium group/item"
                          >
                            <div className="relative">
                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                              </svg>
                              <div className="absolute inset-0 bg-blue-600 rounded-full opacity-0 group-hover/item:opacity-10 transition-opacity"></div>
                            </div>
                            <span>Purchase Display</span>
                          </button>
                          <button 
                            onClick={() => {
                              setIsPurchaseOpen(false);
                              onNavigateToStock();
                            }}
                            className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 hover:bg-blue-50 transition-all duration-200 font-medium group/item"
                          >
                            <div className="relative">
                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                              <div className="absolute inset-0 bg-blue-600 rounded-full opacity-0 group-hover/item:opacity-10 transition-opacity"></div>
                            </div>
                            <span>Stock Management</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Inventory Dropdown with Smooth Animation */}
                  <div className="relative" ref={inventoryRef}>
                    <button 
                      onClick={() => setIsInventoryOpen(!isInventoryOpen)}
                      className="nav-item-smooth px-4 py-2 rounded-lg font-semibold text-white"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="nav-icon-smooth w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <span className="nav-text-smooth">Inventory</span>
                        <svg 
                          className={`w-4 h-4 transition-transform duration-300 ${isInventoryOpen ? 'rotate-180' : ''}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>
                    
                    {/* Inventory Dropdown */}
                    {isInventoryOpen && (
                      <div className="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-2xl overflow-hidden border border-blue-100 z-50 backdrop-blur-sm bg-white/95">
                        <div className="py-2">
                          <button 
                            onClick={() => {
                              setIsInventoryOpen(false);
                              onNavigateToAddProduct();
                            }}
                            className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 hover:bg-blue-50 transition-all duration-200 font-medium group/item"
                          >
                            <div className="relative">
                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                              </svg>
                              <div className="absolute inset-0 bg-blue-600 rounded-full opacity-0 group-hover/item:opacity-10 transition-opacity"></div>
                            </div>
                            <span>Add Product</span>
                          </button>
                          <button 
                            onClick={() => {
                              setIsInventoryOpen(false);
                              onNavigateToAddCustomer();
                            }}
                            className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 hover:bg-blue-50 transition-all duration-200 font-medium group/item"
                          >
                            <div className="relative">
                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                              </svg>
                              <div className="absolute inset-0 bg-blue-600 rounded-full opacity-0 group-hover/item:opacity-10 transition-opacity"></div>
                            </div>
                            <span>Add Customer</span>
                          </button>
                          <button 
                            onClick={() => {
                              setIsInventoryOpen(false);
                              onNavigateToAddSupplier();
                            }}
                            className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 hover:bg-blue-50 transition-all duration-200 font-medium group/item"
                          >
                            <div className="relative">
                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              <div className="absolute inset-0 bg-blue-600 rounded-full opacity-0 group-hover/item:opacity-10 transition-opacity"></div>
                            </div>
                            <span>Add Supplier</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </nav>
            
            {/* User Profile Dropdown with Smooth Animation */}
            {user && (
              <div className="relative ml-4 pl-4 border-l border-white/30" ref={dropdownRef}>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="user-profile-smooth px-3 py-2 rounded-lg font-semibold text-white"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-white/90 backdrop-blur-sm p-1 rounded-full">
                      <svg className="user-avatar-smooth w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-white/90 text-xs uppercase font-bold tracking-widest">
                        {user.role}
                      </p>
                    </div>
                    
                    <svg 
                      className={`w-5 h-5 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Enhanced Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-2xl overflow-hidden border border-blue-100 z-50 backdrop-blur-sm bg-white/95 animate-slideDown">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-3 border-b border-blue-200">
                      <p className="text-sm font-bold text-blue-800">{user.name || user.email}</p>
                      <p className="text-xs text-blue-600 uppercase font-semibold">{user.role}</p>
                    </div>
                    <div className="py-2">
                      {user?.role === 'admin' && (
                        <>
                          <button 
                            onClick={() => {
                              setIsDropdownOpen(false);
                              onNavigateToSettings();
                            }}
                            className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 hover:bg-blue-50 transition-all duration-200 font-medium group/item"
                          >
                            <div className="relative">
                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <div className="absolute inset-0 bg-blue-600 rounded-full opacity-0 group-hover/item:opacity-10 transition-opacity"></div>
                            </div>
                            <span>Settings</span>
                          </button>
                          <hr className="my-2 border-blue-100" />
                        </>
                      )}
                      <button 
                        onClick={() => {
                          setIsDropdownOpen(false);
                          onLogout();
                        }}
                        className="logout-smooth flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 transition-all font-medium"
                      >
                        <div className="relative">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <div className="absolute inset-0 bg-red-600 rounded-full opacity-0 group-hover/item:opacity-10 transition-opacity"></div>
                        </div>
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
    <style>{`
      @keyframes smooth-lift {
        from { 
          transform: translateY(0) scale(1); 
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        to { 
          transform: translateY(-3px) scale(1.02); 
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.25);
        }
      }
      
      @keyframes slide-in-underline {
        from { 
          width: 0; 
          left: 50%;
        }
        to { 
          width: 100%; 
          left: 0;
        }
      }
      
      @keyframes glow-pulse {
        0%, 100% { 
          box-shadow: 0 0 5px rgba(59, 130, 246, 0.3);
        }
        50% { 
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.6), 0 0 30px rgba(59, 130, 246, 0.3);
        }
      }
      
      @keyframes gradient-shift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      
      @keyframes icon-float {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-2px) rotate(2deg); }
      }
      
      @keyframes text-glow {
        0%, 100% { 
          text-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
        }
        50% { 
          text-shadow: 0 0 15px rgba(255, 255, 255, 0.8), 0 0 25px rgba(59, 130, 246, 0.5);
        }
      }
      
      /* Smooth Navigation Button Styles */
      .nav-item-smooth {
        position: relative;
        transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        overflow: hidden;
      }
      
      .nav-item-smooth::before {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        width: 0;
        height: 2px;
        background: linear-gradient(90deg, #60a5fa, #3b82f6, #2563eb);
        transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
        transform: translateX(-50%);
        border-radius: 1px;
      }
      
      .nav-item-smooth:hover::before {
        width: 90%;
        animation: gradient-shift 2s ease-in-out infinite;
      }
      
      .nav-item-smooth:hover {
        transform: translateY(-2px);
        background: linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
      }
      
      .nav-icon-smooth {
        transition: all 0.3s ease;
      }
      
      .nav-item-smooth:hover .nav-icon-smooth {
        animation: icon-float 1.5s ease-in-out infinite;
        filter: drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3));
      }
      
      .nav-text-smooth {
        transition: all 0.3s ease;
      }
      
      .nav-item-smooth:hover .nav-text-smooth {
        animation: text-glow 2s ease-in-out infinite;
      }
      
      /* Logo Animation */
      .logo-smooth:hover {
        animation: glow-pulse 2s ease-in-out infinite;
      }
      
      /* User Profile Smooth */
      .user-profile-smooth {
        transition: all 0.3s ease;
      }
      
      .user-profile-smooth:hover {
        transform: scale(1.05);
        filter: drop-shadow(0 4px 15px rgba(59, 130, 246, 0.3));
      }
      
      .user-avatar-smooth {
        transition: all 0.3s ease;
      }
      
      .user-profile-smooth:hover .user-avatar-smooth {
        animation: icon-float 1.8s ease-in-out infinite;
      }
      
      /* Logout Button Smooth */
      .logout-smooth {
        transition: all 0.3s ease;
      }
      
      .logout-smooth:hover {
        transform: translateY(-1px) scale(1.02);
        box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
      }
    `}</style>
    </>
  );
};

export default Header;