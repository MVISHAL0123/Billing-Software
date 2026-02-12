import { useState, useRef, useEffect } from 'react';

const Header = ({ user, onLogout, onNavigateToSettings, onNavigateToDashboard, onNavigateToAddProduct, onNavigateToAddCustomer, onNavigateToAddSupplier, onNavigateToSales, onNavigateToSalesDisplay, onNavigateToSalesReport, onNavigateToPurchase, onNavigateToPurchaseDisplay }) => {
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
    <header className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-2xl">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white text-blue-600 w-12 h-12 rounded-xl flex items-center justify-center font-black text-2xl shadow-lg transform hover:rotate-12 transition-transform duration-300">
              <span>M</span>
            </div>
            <div>
              <h1 className="text-3xl font-black text-white drop-shadow-lg">MMK</h1>
              <p className="text-white/80 text-xs font-semibold uppercase tracking-wider">{user?.role || 'User'} Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <nav className="flex gap-6 items-center">
              {/* Dashboard Button */}
              <button 
                onClick={onNavigateToDashboard}
                onMouseEnter={() => setHoveredNav('dashboard')}
                onMouseLeave={() => setHoveredNav(null)}
                className="relative group"
              >
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 group-hover:bg-white/10">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span className="text-white font-semibold">Dashboard</span>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0 transition-all duration-300"></div>
              </button>
              
              {/* Sales Dropdown */}
              <div className="relative" ref={salesRef}>
                <button 
                  onClick={() => setIsSalesOpen(!isSalesOpen)}
                  onMouseEnter={() => setHoveredNav('sales')}
                  onMouseLeave={() => setHoveredNav(null)}
                  className="relative group"
                >
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 group-hover:bg-white/10">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span className="text-white font-semibold">Sales</span>
                    <svg 
                      className={`w-4 h-4 text-white transition-transform duration-300 ${isSalesOpen ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <div className={`absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 ${hoveredNav === 'sales' || isSalesOpen ? 'opacity-100 transform translate-y-0' : 'translate-y-1'} transition-all duration-300`}></div>
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
                  {/* Purchase Dropdown */}
                  <div className="relative" ref={purchaseRef}>
                    <button 
                      onClick={() => setIsPurchaseOpen(!isPurchaseOpen)}
                      onMouseEnter={() => setHoveredNav('purchase')}
                      onMouseLeave={() => setHoveredNav(null)}
                      className="relative group"
                    >
                      <div className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 group-hover:bg-white/10">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="text-white font-semibold">Purchase</span>
                        <svg 
                          className={`w-4 h-4 text-white transition-transform duration-300 ${isPurchaseOpen ? 'rotate-180' : ''}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      <div className={`absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 ${hoveredNav === 'purchase' || isPurchaseOpen ? 'opacity-100 transform translate-y-0' : 'translate-y-1'} transition-all duration-300`}></div>
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
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Inventory Dropdown */}
                  <div className="relative" ref={inventoryRef}>
                    <button 
                      onClick={() => setIsInventoryOpen(!isInventoryOpen)}
                      onMouseEnter={() => setHoveredNav('inventory')}
                      onMouseLeave={() => setHoveredNav(null)}
                      className="relative group"
                    >
                      <div className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 group-hover:bg-white/10">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <span className="text-white font-semibold">Inventory</span>
                        <svg 
                          className={`w-4 h-4 text-white transition-transform duration-300 ${isInventoryOpen ? 'rotate-180' : ''}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      <div className={`absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 ${hoveredNav === 'inventory' || isInventoryOpen ? 'opacity-100 transform translate-y-0' : 'translate-y-1'} transition-all duration-300`}></div>
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
            
            {/* User Profile Dropdown */}
            {user && (
              <div className="relative ml-4 pl-4 border-l border-white/30" ref={dropdownRef}>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  onMouseEnter={() => setHoveredNav('user')}
                  onMouseLeave={() => setHoveredNav(null)}
                  className="relative group"
                >
                  <div className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 group-hover:bg-white/10">
                    <div className="relative">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <div className="absolute inset-0 bg-white rounded-full opacity-0 group-hover:opacity-10 transition-opacity"></div>
                    </div>
                    <div className="text-right">
                      <p className="text-white/80 text-xs uppercase font-semibold">{user.role}</p>
                    </div>
                    <svg 
                      className={`w-5 h-5 text-white transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <div className={`absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 ${hoveredNav === 'user' || isDropdownOpen ? 'opacity-100 transform translate-y-0' : 'translate-y-1'} transition-all duration-300`}></div>
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-2xl overflow-hidden border border-blue-100 z-50 animate-fadeIn backdrop-blur-sm bg-white/95">
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
                        className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 transition-all duration-200 font-medium group/item"
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
  );
};

export default Header;