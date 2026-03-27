import { useState, useEffect } from 'react';
import stockAnalysisService from '../services/stockAnalysisService';
import { firestoreService } from '../services/firestoreService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { API_BASE_URL } from '../utils/constants';

const Home = () => {
  const [monthlySales, setMonthlySales] = useState([]);
  const [monthlySalesLoading, setMonthlySalesLoading] = useState(true);

  useEffect(() => {
    const fetchMonthlySales = async () => {
      try {
        setMonthlySalesLoading(true);
        console.log('Home: Fetching bills from Firestore...');
        const billsData = await firestoreService.getBills();
        console.log('Home: Bills fetched:', billsData.length);
        const salesByMonth = {};
        billsData.forEach(bill => {
          let dateObj = null;
          if (bill.date) {
            if (!isNaN(Date.parse(bill.date))) {
              dateObj = new Date(bill.date);
            } else if (typeof bill.date === 'string' && bill.date.match(/^\d{4}-\d{2}-\d{2}/)) {
              const [y, m, d] = bill.date.split('-');
              dateObj = new Date(Number(y), Number(m) - 1, Number(d));
            }
          }
          if (!dateObj || isNaN(dateObj.getTime())) return;
          const month = dateObj.toLocaleString('default', { month: 'short' });
          const year = dateObj.getFullYear().toString().slice(-2);
          const key = `${month} '${year}`;
          if (!salesByMonth[key]) salesByMonth[key] = 0;
          salesByMonth[key] += bill.total || 0;
        });
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const monthlyArr = Object.entries(salesByMonth)
          .map(([month, total]) => ({ month, total: Math.round(total) }))
          .sort((a, b) => {
            const [ma, ya] = a.month.split(" '");
            const [mb, yb] = b.month.split(" '");
            const da = new Date(Number('20' + ya), months.indexOf(ma));
            const db = new Date(Number('20' + yb), months.indexOf(mb));
            return da - db;
          });
        setMonthlySales(monthlyArr);
      } catch (err) {
        console.error('Home: Error fetching monthly sales:', err);
        setMonthlySales([]);
      } finally {
        setMonthlySalesLoading(false);
      }
    };
    fetchMonthlySales();
  }, []);

  const [stockAlerts, setStockAlerts] = useState([]);
  const [stockSummary, setStockSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);

  useEffect(() => {
    loadStockAnalysis();
    loadTopSellingProducts();
    const interval = setInterval(loadStockAnalysis, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadStockAnalysis = async () => {
    try {
      setLoading(true);
      const analysis = await stockAnalysisService.analyzeStock();
      setStockAlerts(analysis.alerts);
      setStockSummary(analysis.summary);
      const alertNotifications = analysis.alerts
        .filter(alert => ['Critical', 'High', 'Medium', 'Watch'].includes(alert.urgencyLevel))
        .slice(0, 15)
        .map(alert => ({
          id: alert.id,
          product: alert.productName,
          urgency: alert.urgencyLevel,
          daysUntilStockout: alert.expectedStockoutDays || alert.daysEstimate || 0,
          read: alert.read,
          timestamp: alert.timestamp,
          message: alert.reason,
          orderDate: alert.orderByDate,
          orderQty: alert.recommendedOrderQty,
          orderValue: alert.estimatedOrderValue,
          currentStock: alert.currentStock,
          minStock: alert.minStock,
          stockoutDate: alert.expectedStockoutDate,
          supplierNote: alert.supplierRecommendation
        }));
      setNotifications(alertNotifications);
      setError(null);
    } catch (err) {
      setError('Failed to load stock analysis');
    } finally {
      setLoading(false);
    }
  };

  const loadTopSellingProducts = async () => {
    try {
      setChartLoading(true);
      console.log('Home: Fetching bills for top products...');
      const billsData = await firestoreService.getBills();
      console.log('Home: Bills fetched for chart:', billsData.length);
      const productSales = {};
      billsData.forEach(bill => {
        (bill.items || []).forEach(item => {
          const name = item.productName;
          if (!name) return;
          if (!productSales[name]) productSales[name] = { name, qtySold: 0, revenue: 0 };
          productSales[name].qtySold += (item.qty || 0);
          productSales[name].revenue += (item.amount || 0);
        });
      });
      const sorted = Object.values(productSales)
        .sort((a, b) => b.qtySold - a.qtySold)
        .slice(0, 5);
      setTopProducts(sorted);
    } catch (err) {
      console.error('Home: Error loading top products:', err);
    } finally {
      setChartLoading(false);
    }
  };

  const refreshStockAnalysis = async () => {
    stockAnalysisService.clearCache();
    await loadStockAnalysis();
  };

  const clearNotifications = () => {
    notifications.forEach(notif => stockAnalysisService.markAlertAsRead(notif.id));
    setNotifications([]);
  };

  const markNotificationRead = (notificationId) => {
    stockAnalysisService.markAlertAsRead(notificationId);
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  // ── VIBRANT COLOR CONFIGS ──────────────────────────────────────────────────
  const urgencyConfig = {
    Critical: {
      rowBg: 'linear-gradient(90deg, rgba(255,59,48,0.22), rgba(255,59,48,0.07))',
      rowBorder: '1px solid rgba(255,59,48,0.45)',
      dotColor: '#ff3b30',
      dotShadow: '0 0 8px rgba(255,59,48,0.9)',
      pillBg: 'rgba(255,59,48,0.25)',
      pillColor: '#ff9f9a',
      pulse: true,
    },
    High: {
      rowBg: 'linear-gradient(90deg, rgba(255,149,0,0.22), rgba(255,149,0,0.07))',
      rowBorder: '1px solid rgba(255,149,0,0.45)',
      dotColor: '#ff9500',
      dotShadow: '0 0 8px rgba(255,149,0,0.9)',
      pillBg: 'rgba(255,149,0,0.25)',
      pillColor: '#ffcc80',
      pulse: false,
    },
    Medium: {
      rowBg: 'linear-gradient(90deg, rgba(255,214,10,0.18), rgba(255,214,10,0.05))',
      rowBorder: '1px solid rgba(255,214,10,0.38)',
      dotColor: '#ffd60a',
      dotShadow: '0 0 8px rgba(255,214,10,0.9)',
      pillBg: 'rgba(255,214,10,0.2)',
      pillColor: '#ffe566',
      pulse: false,
    },
    Watch: {
      rowBg: 'linear-gradient(90deg, rgba(10,132,255,0.18), rgba(10,132,255,0.05))',
      rowBorder: '1px solid rgba(10,132,255,0.38)',
      dotColor: '#0a84ff',
      dotShadow: '0 0 8px rgba(10,132,255,0.9)',
      pillBg: 'rgba(10,132,255,0.2)',
      pillColor: '#80c6ff',
      pulse: false,
    },
  };

  // Colorful gradient fills for each bar
  const barGradients = [
    { id: 'g0', from: '#f72585', to: '#7209b7' },
    { id: 'g1', from: '#4361ee', to: '#4cc9f0' },
    { id: 'g2', from: '#f77f00', to: '#fcbf49' },
    { id: 'g3', from: '#06d6a0', to: '#118ab2' },
    { id: 'g4', from: '#ef476f', to: '#ffd166' },
  ];

  // ── STYLES (JS objects) ────────────────────────────────────────────────────
  const cardBase = {
    borderRadius: '22px',
    overflow: 'hidden',
    position: 'relative',
    minHeight: '300px',
    border: '1px solid rgba(255,255,255,0.08)',
  };

  const stockCardStyle = {
    ...cardBase,
    background: 'linear-gradient(145deg, #12002e, #1a0050, #0d001a)',
    boxShadow: '0 12px 40px rgba(120,0,200,0.35), 0 2px 8px rgba(0,0,0,0.5)',
  };

  const productsCardStyle = {
    ...cardBase,
    background: 'linear-gradient(145deg, #001a3a, #002a5e, #001220)',
    boxShadow: '0 12px 40px rgba(0,100,255,0.3), 0 2px 8px rgba(0,0,0,0.5)',
  };

  const topBarStock = {
    height: '4px',
    background: 'linear-gradient(90deg, #f72585, #7209b7, #4cc9f0)',
    width: '100%',
  };

  const topBarProducts = {
    height: '4px',
    background: 'linear-gradient(90deg, #4361ee, #4cc9f0, #06d6a0)',
    width: '100%',
  };

  const iconBadgeStock = {
    width: '44px', height: '44px', borderRadius: '14px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #f72585, #7209b7)',
    boxShadow: '0 6px 20px rgba(247,37,133,0.5)',
    flexShrink: 0,
  };

  const iconBadgeProducts = {
    width: '44px', height: '44px', borderRadius: '14px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #4361ee, #4cc9f0)',
    boxShadow: '0 6px 20px rgba(67,97,238,0.5)',
    flexShrink: 0,
  };

  const glowOverlayStock = {
    position: 'absolute', top: '-70px', right: '-50px',
    width: '220px', height: '220px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(247,37,133,0.25) 0%, transparent 70%)',
    pointerEvents: 'none',
  };

  const glowOverlayStock2 = {
    position: 'absolute', bottom: '-50px', left: '-40px',
    width: '180px', height: '180px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(114,9,183,0.2) 0%, transparent 70%)',
    pointerEvents: 'none',
  };

  const glowOverlayProducts = {
    position: 'absolute', top: '-70px', right: '-50px',
    width: '220px', height: '220px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(76,201,240,0.22) 0%, transparent 70%)',
    pointerEvents: 'none',
  };

  const glowOverlayProducts2 = {
    position: 'absolute', bottom: '-50px', left: '-40px',
    width: '180px', height: '180px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(6,214,160,0.18) 0%, transparent 70%)',
    pointerEvents: 'none',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '28px 20px' }}>

        {/* ── TWO-COLUMN GRID ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>

          {/* ══════════════════════════════════════════
              CARD 1 — STOCK ALERTS  (pink/purple theme)
          ══════════════════════════════════════════ */}
          <div style={stockCardStyle}>
            <div style={topBarStock} />
            <div style={glowOverlayStock} />
            <div style={glowOverlayStock2} />

            <div style={{ padding: '18px 20px', position: 'relative', zIndex: 1 }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={iconBadgeStock}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                    </div>
                    {notifications.filter(n => !n.read).length > 0 && (
                      <span style={{
                        position: 'absolute', top: '-4px', right: '-4px',
                        background: 'linear-gradient(135deg, #f72585, #b5179e)',
                        color: '#fff', fontSize: '9px', fontWeight: 800,
                        borderRadius: '50%', width: '18px', height: '18px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(247,37,133,0.7)',
                        animation: 'mmkPulse 1.5s infinite',
                      }}>
                        {notifications.filter(n => !n.read).length}
                      </span>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>Stock Alerts</div>
                    <div style={{ fontSize: '11px', color: 'rgba(220,180,255,0.6)', marginTop: '1px' }}>Reorder Predictions</div>
                  </div>
                </div>
                <button
                  onClick={refreshStockAnalysis}
                  style={{
                    width: '34px', height: '34px', borderRadius: '10px',
                    background: 'rgba(247,37,133,0.12)', border: '1px solid rgba(247,37,133,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                  title="Refresh"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(247,150,220,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
                  </svg>
                </button>
              </div>

              {/* Body */}
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    border: '2px solid rgba(247,37,133,0.2)',
                    borderTopColor: '#f72585', animation: 'mmkSpin 0.8s linear infinite', marginRight: '10px'
                  }} />
                  <span style={{ color: 'rgba(220,180,255,0.6)', fontSize: '13px' }}>Analyzing stock…</span>
                </div>
              ) : error ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <p style={{ color: '#ff6b9d', fontSize: '13px' }}>{error}</p>
                  <button onClick={refreshStockAnalysis} style={{ marginTop: '8px', color: '#f72585', fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer' }}>Try Again</button>
                </div>
              ) : notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 0' }}>
                  <div style={{
                    width: '48px', height: '48px', margin: '0 auto 10px',
                    borderRadius: '50%', background: 'rgba(6,214,160,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#06d6a0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <p style={{ color: '#06d6a0', fontSize: '13px', fontWeight: 600 }}>All stock levels healthy!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', maxHeight: '210px', overflowY: 'auto', paddingRight: '4px' }}>
                  {notifications.slice(0, 10).map(notif => {
                    const cfg = urgencyConfig[notif.urgency] || urgencyConfig['Watch'];
                    return (
                      <div
                        key={notif.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '9px 12px', borderRadius: '12px',
                          background: cfg.rowBg, border: cfg.rowBorder,
                          transition: 'transform 0.15s', cursor: 'default',
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateX(4px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
                      >
                        <div style={{
                          width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                          background: cfg.dotColor,
                          boxShadow: cfg.dotShadow,
                          animation: cfg.pulse ? 'mmkPulse 1.5s infinite' : 'none',
                        }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {notif.product}
                          </div>
                          <div style={{ fontSize: '10px', color: 'rgba(220,180,255,0.5)', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {notif.message}
                          </div>
                        </div>
                        <span style={{
                          fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '20px', flexShrink: 0,
                          background: cfg.pillBg, color: cfg.pillColor, letterSpacing: '0.3px',
                        }}>
                          {notif.urgency.toUpperCase()}
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                          {notif.currentStock}/{notif.minStock}
                        </span>
                      </div>
                    );
                  })}
                  {notifications.length > 10 && (
                    <div style={{ textAlign: 'center', padding: '4px 0' }}>
                      <span style={{ fontSize: '11px', color: 'rgba(247,37,133,0.5)' }}>+ {notifications.length - 10} more alerts</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ══════════════════════════════════════════
              CARD 2 — TOP 5 PRODUCTS  (blue/cyan/green theme)
          ══════════════════════════════════════════ */}
          <div style={productsCardStyle}>
            <div style={topBarProducts} />
            <div style={glowOverlayProducts} />
            <div style={glowOverlayProducts2} />

            <div style={{ padding: '18px 20px', position: 'relative', zIndex: 1 }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={iconBadgeProducts}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="#fff">
                      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>Top 5 Products</div>
                    <div style={{ fontSize: '11px', color: 'rgba(150,220,255,0.6)', marginTop: '1px' }}>Best sellers by quantity</div>
                  </div>
                </div>
              </div>

              {/* Body */}
              {chartLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    border: '2px solid rgba(76,201,240,0.2)',
                    borderTopColor: '#4cc9f0', animation: 'mmkSpin 0.8s linear infinite', marginRight: '10px'
                  }} />
                  <span style={{ color: 'rgba(150,220,255,0.6)', fontSize: '13px' }}>Loading sales data…</span>
                </div>
              ) : topProducts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <p style={{ color: 'rgba(150,220,255,0.45)', fontSize: '13px' }}>No sales data available yet.</p>
                </div>
              ) : (
                <>
                  {/* Colorful horizontal bar chart */}
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(150,220,255,0.4)', letterSpacing: '0.9px', textTransform: 'uppercase', marginBottom: '10px' }}>
                    Units Sold
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                    {(() => {
                      const maxQty = Math.max(...topProducts.map(p => p.qtySold), 1);
                      return topProducts.map((product, index) => {
                        const pct = Math.round((product.qtySold / maxQty) * 100);
                        const grad = barGradients[index % barGradients.length];
                        const glowColor = grad.from;
                        return (
                          <div key={product.name} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {/* Rank badge */}
                            <div style={{
                              width: '22px', height: '22px', borderRadius: '8px', flexShrink: 0,
                              background: `linear-gradient(135deg, ${grad.from}, ${grad.to})`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '10px', fontWeight: 800, color: '#fff',
                              boxShadow: `0 3px 10px ${glowColor}60`,
                            }}>
                              {index + 1}
                            </div>
                            {/* Label */}
                            <div style={{
                              width: '82px', flexShrink: 0,
                              fontSize: '11px', fontWeight: 600, color: 'rgba(200,235,255,0.8)',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {product.name}
                            </div>
                            {/* Bar track */}
                            <div style={{
                              flex: 1, height: '22px',
                              background: 'rgba(255,255,255,0.06)',
                              borderRadius: '8px', overflow: 'hidden', position: 'relative',
                            }}>
                              <div style={{
                                width: `${pct}%`, height: '100%',
                                background: `linear-gradient(90deg, ${grad.from}, ${grad.to})`,
                                borderRadius: '8px',
                                boxShadow: `0 0 10px ${glowColor}50`,
                                display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                                paddingRight: '8px',
                                transition: 'width 1s cubic-bezier(0.34,1.56,0.64,1)',
                              }}>
                                <span style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.95)' }}>
                                  {product.qtySold}
                                </span>
                              </div>
                            </div>
                            {/* Revenue */}
                            <div style={{
                              flexShrink: 0, fontSize: '10px', fontWeight: 700,
                              color: 'rgba(255,255,255,0.35)', fontVariantNumeric: 'tabular-nums',
                            }}>
                              ₹{product.revenue >= 1000 ? `${(product.revenue / 1000).toFixed(1)}k` : product.revenue}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {/* Legend dots */}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
                    {topProducts.map((p, i) => (
                      <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <div style={{
                          width: '8px', height: '8px', borderRadius: '3px',
                          background: `linear-gradient(135deg, ${barGradients[i % barGradients.length].from}, ${barGradients[i % barGradients.length].to})`,
                        }} />
                        <span style={{ fontSize: '10px', color: 'rgba(150,220,255,0.5)' }}>{p.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

        </div>{/* end grid */}
      </div>

      {/* Global keyframe animations */}
      <style>{`
        @keyframes mmkPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.18); opacity: 0.75; }
        }
        @keyframes mmkSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Home;