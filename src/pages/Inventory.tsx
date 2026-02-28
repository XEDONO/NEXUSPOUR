import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  IonContent,
  IonPage,
  IonIcon,
  IonAvatar,
  IonBadge,
  IonRippleEffect,
  IonProgressBar
} from '@ionic/react';
import {
  chevronBackOutline,
  settingsOutline,
  cafeOutline,
  albumsOutline,
  home,
  thermometerOutline,
  clipboardOutline,
  addOutline,
  trashOutline,
  removeOutline,
  closeOutline,
  calendarOutline,
  timeOutline,
  saveOutline,
  warningOutline,
  checkmarkCircleOutline,
  layersOutline,
  cubeOutline,
  statsChartOutline,
  sparklesOutline,
  searchOutline,
  downloadOutline,
  cloudUploadOutline,
  filterOutline,
  optionsOutline,
  caretDownOutline,
  caretForwardOutline,
  alertCircleOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { exportCSV } from '../utils/csv';

type StockItem = {
  id: string;
  name: string;
  qty: number;
  unit: string;
  location: string;
  par: number; // Minimum stock level
  category: string;
  lastUpdated: string;
};

const STORAGE_KEY = 'cafeops_stock_master_v3';

const Inventory: React.FC = () => {
  const history = useHistory();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'low' | 'out'>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [showAdminSidebar, setShowAdminSidebar] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<string[]>([]);

  // New Item State
  const [addName, setAddName] = useState('');
  const [addQty, setAddQty] = useState('');
  const [addUnit, setAddUnit] = useState('Units');
  const [addLocation, setAddLocation] = useState('Main Store');
  const [addCategory, setAddCategory] = useState('General');
  const [addPar, setAddPar] = useState('0');

  const [items, setItems] = useState<StockItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 150);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter(i => {
      const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           i.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           i.category.toLowerCase().includes(searchQuery.toLowerCase());

      if (filterStatus === 'low') return matchesSearch && i.qty <= i.par && i.qty > 0;
      if (filterStatus === 'out') return matchesSearch && i.qty <= 0;
      return matchesSearch;
    });
  }, [items, searchQuery, filterStatus]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, StockItem[]> = {};
    filteredItems.forEach(item => {
      const loc = item.location || 'Unassigned';
      if (!groups[loc]) groups[loc] = [];
      groups[loc].push(item);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredItems]);

  const stats = useMemo(() => {
    const total = items.length;
    const low = items.filter(i => i.qty <= i.par && i.qty > 0).length;
    const out = items.filter(i => i.qty <= 0).length;
    const healthy = total - low - out;
    const healthScore = total > 0 ? (healthy / total) * 100 : 100;
    return { total, low, out, healthScore };
  }, [items]);

  const handleAddItem = () => {
    if (!addName.trim()) return;
    const newItem: StockItem = {
      id: Date.now().toString(),
      name: addName.trim(),
      qty: parseFloat(addQty) || 0,
      unit: addUnit,
      location: addLocation.trim() || 'Main Store',
      category: addCategory.trim() || 'General',
      par: parseFloat(addPar) || 0,
      lastUpdated: new Date().toISOString()
    };
    setItems([newItem, ...items]);
    setShowAdd(false);
    resetAddForm();
  };

  const resetAddForm = () => {
    setAddName('');
    setAddQty('');
    setAddUnit('Units');
    setAddLocation('Main Store');
    setAddCategory('General');
    setAddPar('0');
  };

  const adjustQty = (id: string, delta: number) => {
    setItems(prev => prev.map(i =>
      i.id === id ? { ...i, qty: Math.max(0, i.qty + delta), lastUpdated: new Date().toISOString() } : i
    ));
  };

  const deleteItem = (id: string) => {
    if (window.confirm('Permanently remove this item?')) {
      setItems(prev => prev.filter(i => i.id !== id));
    }
  };

  const toggleSection = (section: string) => {
    setCollapsedSections(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const exportInventory = () => {
    const header = ['ID', 'Name', 'Qty', 'Unit', 'Location', 'Category', 'Par Level', 'Last Updated'];
    const rows = [header, ...items.map(i => [
      String(i.id),
      String(i.name),
      String(i.qty),
      String(i.unit),
      String(i.location),
      String(i.category),
      String(i.par),
      String(i.lastUpdated)
    ])];
    exportCSV(rows, `Inventory-Master-${new Date().toISOString().split('T')[0]}.csv`);
    setShowAdminSidebar(false);
  };

  const saveAuditLog = () => {
    const log = {
      date: new Date().toLocaleDateString(),
      total: items.length,
      lowStock: stats.low,
      outOfStock: stats.out,
      timestamp: new Date().toISOString(),
      type: 'Full Stock Audit'
    };
    const existing = JSON.parse(localStorage.getItem('inventory_logs_v1') || '[]');
    localStorage.setItem('inventory_logs_v1', JSON.stringify([log, ...existing]));
    alert('Current stock levels archived to History.');
  };

  return (
    <IonPage className="inv-page-root">
      <style>{`
        .inv-page-root {
          --m3-surface: #FDFCF4;
          --m3-primary: #2D1B14;
          --m3-accent: #D6E8B1;
          --m3-warning: #FF9800;
          --m3-error: #B3261E;
          --m3-on-surface-variant: #8D6E63;
          --m3-success: #2E7D32;
        }

        .inv-page-root .inv-layout {
          background-color: var(--m3-surface);
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
        }

        .inv-page-root .header-espresso {
          background: #2D1B14;
          padding: 24px 24px 40px;
          color: white;
          width: 100%;
          position: relative;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          box-shadow: 0 4px 20px rgba(0,0,0,0.25);
        }

        .inv-page-root .liquid-wave {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 30px;
          fill: var(--m3-surface);
          pointer-events: none;
        }

        .inv-page-root .top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          max-width: 1400px;
          z-index: 10;
        }

        .inv-page-root .brand-box {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .inv-page-root .logo-icon {
          background: linear-gradient(135deg, #E6BEAE 0%, #D7CCC8 100%);
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #2D1B14;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        }

        .inv-page-root .main-scroll {
          padding: 20px 20px 120px;
          flex: 1;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          overflow-y: auto;
        }

        .inv-page-root .grid-max {
          width: 100%;
          max-width: 1400px;
        }

        .inv-page-root .stats-summary {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          width: 100%;
        }

        .inv-page-root .stat-card {
          flex: 1;
          background: white;
          padding: 16px;
          border-radius: 24px;
          border: 1px solid #E1E3D3;
          box-shadow: 0 4px 12px rgba(45, 27, 20, 0.04);
        }

        .inv-page-root .filter-tabs {
          display: flex;
          background: #F8F5F2;
          padding: 4px;
          border-radius: 16px;
          margin-bottom: 20px;
          border: 1px solid #E1E3D3;
        }

        .inv-page-root .filter-tab {
          flex: 1;
          padding: 10px;
          border-radius: 12px;
          border: none;
          background: transparent;
          font-weight: 800;
          font-size: 0.75rem;
          color: #8D6E63;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
        }

        .inv-page-root .filter-tab.active {
          background: white;
          color: #2D1B14;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .inv-page-root .search-bar {
          background: white;
          border-radius: 20px;
          padding: 12px 18px;
          margin-bottom: 24px;
          box-shadow: 0 4px 15px rgba(45, 27, 20, 0.04);
          border: 1px solid #E1E3D3;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .inv-page-root .search-bar input { border: none; outline: none; flex: 1; font-weight: 700; color: #2D1B14; background: transparent; }

        .inv-page-root .section-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 24px 0 12px;
          padding: 0 8px;
          cursor: pointer;
        }

        .inv-page-root .section-title {
          font-weight: 900;
          font-size: 0.85rem;
          color: #8D6E63;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          flex: 1;
        }

        .inv-page-root .stock-item-row {
          background: white;
          border-radius: 20px;
          padding: 16px;
          margin-bottom: 8px;
          border: 1px solid #E1E3D3;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: transform 0.2s;
        }

        .inv-page-root .stock-item-row.low { border-left: 6px solid var(--m3-warning); }
        .inv-page-root .stock-item-row.out { border-left: 6px solid var(--m3-error); }

        .inv-page-root .item-main { flex: 1; }
        .inv-page-root .item-name { font-weight: 800; color: #2D1B14; margin-bottom: 2px; }
        .inv-page-root .item-meta { font-size: 0.7rem; font-weight: 700; color: #A1887F; text-transform: uppercase; display: flex; gap: 8px; }

        .inv-page-root .qty-box {
          display: flex; align-items: center; gap: 8px; background: #F8F5F2;
          padding: 4px; border-radius: 14px;
        }

        .inv-page-root .qty-btn-sm {
          width: 32px; height: 32px; border-radius: 10px; background: white;
          border: none; color: #2D1B14; display: flex; align-items: center; justify-content: center;
          cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .inv-page-root .qty-text { min-width: 36px; text-align: center; font-weight: 900; font-size: 1.1rem; }

        .inv-page-root .fab-add {
          position: fixed; bottom: 100px; right: 24px; width: 64px; height: 64px; border-radius: 22px;
          background: #2D1B14; color: white; display: flex; align-items: center; justify-content: center;
          box-shadow: 0 10px 30px rgba(45, 27, 20, 0.4); z-index: 1000; border: none;
        }

        .inv-page-root .m3-nav {
          position: fixed; bottom: 0; left: 0; right: 0; height: 85px; background: #FFFFFF;
          display: flex; border-top: 1px solid #E1E3D3; padding-bottom: env(safe-area-inset-bottom);
          z-index: 1000; box-shadow: 0 -4px 20px rgba(0,0,0,0.05);
        }

        .inv-page-root .nav-tab { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #A1887F; font-size: 0.75rem; font-weight: 800; cursor: pointer; }
        .inv-page-root .nav-tab.active { color: #2D1B14; }
        .inv-page-root .nav-indicator { width: 64px; height: 32px; border-radius: 100px; display: flex; align-items: center; justify-content: center; transition: all 0.3s; margin-bottom: 4px; }
        .inv-page-root .nav-tab.active .nav-indicator { background: #2D1B1412; transform: translateY(-2px); }

        .inv-page-root .m3-modal-overlay {
          position: fixed; inset: 0; background: rgba(45, 27, 20, 0.4); backdrop-filter: blur(8px);
          z-index: 4000; display: flex; align-items: center; justify-content: center; padding: 24px;
        }

        .inv-page-root .m3-dialog {
          background: white; border-radius: 32px; padding: 32px; width: 100%; max-width: 500px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.2); animation: inv-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.1);
        }
        @keyframes inv-pop { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }

        .inv-page-root .m3-input-field {
          width: 100%; padding: 16px; border-radius: 16px; background: #F8F5F2; border: 2px solid #E1E3D3;
          font-weight: 700; color: #2D1B14; outline: none; margin-bottom: 12px;
        }

        .inv-page-root .sidebar-m3 {
          position: fixed; top: 0; right: -100%; width: 100%; height: 100%; background: white;
          z-index: 3000; transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1); padding: 24px;
          display: flex; flex-direction: column; box-shadow: -15px 0 50px rgba(0,0,0,0.2);
          transform: translateX(100%);
        }
        .inv-page-root .sidebar-m3.active { transform: translateX(0); }
        
        @media (min-width: 768px) {
          .inv-page-root .sidebar-m3 {
            width: 340px;
            border-radius: 40px 0 0 40px;
          }
        }

        .inv-page-root .scrim-m3 { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(8px); z-index: 2500; opacity: 0; pointer-events: none; transition: opacity 0.5s ease; }
        .inv-page-root .scrim-m3.active { opacity: 1; pointer-events: auto; }
        .inv-page-root .m3-card-wide { padding: 20px; border-radius: 20px; background: #F8F5F2; display: flex; align-items: center; gap: 15px; cursor: pointer; margin-bottom: 12px; transition: 0.2s; }
        .inv-page-root .m3-card-wide:active { background: #E6E1DC; }

        @media (max-width: 768px) {
          .inv-page-root .main-scroll { padding: 16px 16px 120px; }
          .inv-page-root .header-espresso { padding: 16px 16px 30px; }
          .inv-page-root .stats-summary { flex-direction: column; }
          .inv-page-root .search-bar { margin-bottom: 16px; padding: 8px 14px; }
          .inv-page-root .filter-tabs { margin-bottom: 16px; }
          .inv-page-root .stock-item-row { flex-wrap: wrap; }
          .inv-page-root .qty-box { margin-top: 12px; width: 100%; justify-content: center; }
          .inv-page-root .fab-add { width: 56px; height: 56px; border-radius: 18px; bottom: 90px; }
          .inv-page-root .m3-dialog { padding: 24px; }
          .inv-page-root .m3-dialog .flex { flex-direction: column; }
        }
      `}</style>

      <div className="inv-layout">
        <header className="header-espresso">
          <div className="top-bar">
            <div className="brand-box" onClick={() => history.push('/dashboard')}>
              <div className="logo-icon"><IonIcon icon={albumsOutline} /></div>
              <h1 style={{ margin: 0, fontWeight: 900, fontSize: '1.6rem', letterSpacing: '-1px' }}>NexusPour</h1>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button className="round-btn" style={{ width: 40, height: 40, borderRadius: 12, border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white' }} onClick={() => setShowAdminSidebar(true)}>
                <IonIcon icon={settingsOutline} style={{ fontSize: '1.4rem' }} />
              </button>
              <IonAvatar style={{ width: '40px', height: '40px', border: '2px solid rgba(255,255,255,0.2)' }}>
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Store" alt="User" />
              </IonAvatar>
            </div>
          </div>

          <div style={{ marginTop: '24px', width: '100%', maxWidth: '1400px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white' }} onClick={() => history.goBack()}>
                <IonIcon icon={chevronBackOutline} style={{ fontSize: '1.4rem' }} />
              </button>
              <div>
                <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.8rem' }}>Inventory</h2>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.7, color: 'var(--m3-accent)' }}>Live Stock Monitor</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 900, opacity: 0.6, letterSpacing: '1px' }}>STOCK HEALTH</div>
              <div style={{ fontWeight: 900, fontSize: '1.4rem' }}>{Math.round(stats.healthScore)}%</div>
            </div>
          </div>
          <svg className="liquid-wave" viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path d="M0,32L60,42.7C120,53,240,75,360,74.7C480,75,600,53,720,48C840,43,960,53,1080,58.7C1200,64,1320,64,1380,64L1440,64L1440,120L1380,120C1320,120,1200,120,1080,120C960,120,840,120,720,120C600,120,480,120,360,120C240,120,120,120,60,120L0,120Z"></path>
          </svg>
        </header>

        <main className="main-scroll">
          <div className="grid-max">
            <div className="stats-summary">
              <div className="stat-card" style={{ borderLeft: '6px solid var(--m3-primary)' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#8D6E63' }}>TOTAL SKU</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{stats.total}</div>
              </div>
              <div className="stat-card" style={{ borderLeft: '6px solid var(--m3-warning)' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#8D6E63' }}>LOW STOCK</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: stats.low > 0 ? 'var(--m3-warning)' : 'inherit' }}>{stats.low}</div>
              </div>
              <div className="stat-card" style={{ borderLeft: '6px solid var(--m3-error)' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#8D6E63' }}>OUT OF STOCK</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: stats.out > 0 ? 'var(--m3-error)' : 'inherit' }}>{stats.out}</div>
              </div>
            </div>

            <div className="search-bar">
              <IonIcon icon={searchOutline} style={{ color: '#8D6E63', fontSize: '1.2rem' }} />
              <input placeholder="Search by name, location or category..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>

            <div className="filter-tabs">
              <button className={`filter-tab ${filterStatus === 'all' ? 'active' : ''}`} onClick={() => setFilterStatus('all')}>All Items</button>
              <button className={`filter-tab ${filterStatus === 'low' ? 'active' : ''}`} onClick={() => setFilterStatus('low')}>Low Stock</button>
              <button className={`filter-tab ${filterStatus === 'out' ? 'active' : ''}`} onClick={() => setFilterStatus('out')}>Out</button>
            </div>

            {groupedItems.map(([location, sectionItems]) => {
              const isCollapsed = collapsedSections.includes(location);
              return (
                <section key={location}>
                  <div className="section-header" onClick={() => toggleSection(location)}>
                    <IonIcon icon={isCollapsed ? caretForwardOutline : caretDownOutline} style={{ color: '#8D6E63' }} />
                    <span className="section-title">{location}</span>
                    <IonBadge style={{ background: '#F8F5F2', color: '#8D6E63', borderRadius: '8px' }}>{sectionItems.length}</IonBadge>
                  </div>

                  {!isCollapsed && sectionItems.map(item => {
                    const isLow = item.qty <= item.par && item.qty > 0;
                    const isOut = item.qty <= 0;
                    return (
                      <div key={item.id} className={`stock-item-row ${isLow ? 'low' : isOut ? 'out' : ''}`}>
                        <div className="item-main">
                          <div className="item-name">{item.name}</div>
                          <div className="item-meta">
                            <span>{item.category}</span>
                            <span>•</span>
                            <span style={{ color: isLow || isOut ? 'inherit' : '#2E7D32' }}>Par: {item.par} {item.unit}</span>
                          </div>
                        </div>

                        <div className="qty-box">
                          <button className="qty-btn-sm" onClick={() => adjustQty(item.id, -1)}><IonIcon icon={removeOutline} /></button>
                          <div className="qty-text" style={{ color: isOut ? 'var(--m3-error)' : isLow ? 'var(--m3-warning)' : 'inherit' }}>{item.qty}</div>
                          <button className="qty-btn-sm" onClick={() => adjustQty(item.id, 1)}><IonIcon icon={addOutline} /></button>
                        </div>

                        <button style={{ background: 'none', border: 'none', color: '#E1E3D3', padding: '8px' }} onClick={() => deleteItem(item.id)}>
                          <IonIcon icon={trashOutline} />
                        </button>
                      </div>
                    );
                  })}
                </section>
              );
            })}

            {items.length === 0 && (
              <div style={{ textAlign: 'center', padding: '80px 20px', opacity: 0.4 }}>
                <IonIcon icon={sparklesOutline} style={{ fontSize: '4rem' }} />
                <p style={{ fontWeight: 700, marginTop: '16px' }}>Ready to organize? Add your first item.</p>
              </div>
            )}
          </div>
        </main>

        <button className="fab-add ion-activatable" onClick={() => setShowAdd(true)}>
          <IonIcon icon={addOutline} style={{ fontSize: '2.4rem' }} />
          <IonRippleEffect />
        </button>

        <nav className="m3-nav">
          <div className="nav-tab" onClick={() => history.push('/dashboard')}>
            <div className="nav-indicator"><IonIcon icon={home} style={{ fontSize: '1.5rem' }} /></div>
            <span>Home</span>
          </div>
          <div className="nav-tab" onClick={() => history.push('/temp-check')}>
            <div className="nav-indicator"><IonIcon icon={thermometerOutline} style={{ fontSize: '1.5rem' }} /></div>
            <span>Temps</span>
          </div>
          <div className="nav-tab" onClick={() => history.push('/checklist')}>
            <div className="nav-indicator"><IonIcon icon={clipboardOutline} style={{ fontSize: '1.5rem' }} /></div>
            <span>Checks</span>
          </div>
          <div className="nav-tab active">
            <div className="nav-indicator"><IonIcon icon={albumsOutline} style={{ fontSize: '1.5rem' }} /></div>
            <span>Stock</span>
          </div>
          <div className="nav-tab" onClick={() => history.push('/allergens')}>
            <div className="nav-indicator"><IonIcon icon={warningOutline} style={{ fontSize: '1.5rem' }} /></div>
            <span>Allergens</span>
          </div>
        </nav>

        <div className={`scrim-m3 ${showAdminSidebar ? 'active' : ''}`} onClick={() => setShowAdminSidebar(false)} />
        <aside className={`sidebar-m3 ${showAdminSidebar ? 'active' : ''}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontWeight: 900, margin: 0, fontSize: '1.8rem', color: '#2D1B14' }}>Inventory Tools</h2>
            <button className="round-btn" style={{ background: '#F8F5F2', color: '#2D1B14', border: 'none', width: 40, height: 40, borderRadius: 12 }} onClick={() => setShowAdminSidebar(false)}>
              <IonIcon icon={closeOutline} style={{ fontSize: '2rem' }} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="m3-card-wide" onClick={() => { history.push('/history'); setShowAdminSidebar(false); }}>
              <IonIcon icon={timeOutline} style={{ fontSize: '1.8rem', color: '#2D1B14' }} />
              <span style={{ fontWeight: 800 }}>Audit History</span>
            </div>
            <div className="m3-card-wide" onClick={saveAuditLog}>
              <IonIcon icon={saveOutline} style={{ fontSize: '1.8rem', color: '#2D1B14' }} />
              <span style={{ fontWeight: 800 }}>Archive Current Levels</span>
            </div>
            <div className="m3-card-wide" onClick={exportInventory}>
              <IonIcon icon={downloadOutline} style={{ fontSize: '1.8rem', color: '#2D1B14' }} />
              <span style={{ fontWeight: 800 }}>Export Master List (CSV)</span>
            </div>
            <div className="m3-card-wide" style={{ marginTop: '24px' }} onClick={() => { if(confirm('Clear all stock data?')) { setItems([]); setShowAdminSidebar(false); } }}>
              <IonIcon icon={trashOutline} style={{ fontSize: '1.8rem', color: 'var(--m3-error)' }} />
              <span style={{ fontWeight: 800, color: 'var(--m3-error)' }}>Wipe Inventory</span>
            </div>
          </div>
        </aside>

        {showAdd && (
          <div className="m3-modal-overlay" onClick={() => setShowAdd(false)}>
            <div className="m3-dialog" onClick={e => e.stopPropagation()}>
              <header style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ width: '56px', height: '56px', background: '#F8F5F2', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#2D1B14' }}>
                  <IonIcon icon={addOutline} style={{ fontSize: '1.8rem' }} />
                </div>
                <h3 style={{ margin: 0, fontWeight: 900, color: '#2D1B14', fontSize: '1.6rem' }}>Add New Stock</h3>
              </header>

              <div className="flex flex-col gap-1">
                <input className="m3-input-field" placeholder="Item Name (e.g. Arabica Beans)" value={addName} onChange={e => setAddName(e.target.value)} autoFocus />
                <div className="flex flex-col md:flex-row gap-3">
                  <input className="m3-input-field" style={{ flex: 1 }} type="number" placeholder="Initial Qty" value={addQty} onChange={e => setAddQty(e.target.value)} />
                  <select className="m3-input-field" style={{ flex: 1 }} value={addUnit} onChange={e => setAddUnit(e.target.value)}>
                    <option>Units</option><option>Liters</option><option>KG</option><option>Grams</option><option>Cases</option><option>Packs</option>
                  </select>
                </div>
                <div className="flex flex-col md:flex-row gap-3">
                  <input className="m3-input-field" style={{ flex: 1 }} placeholder="Location (e.g. Fridge 1)" value={addLocation} onChange={e => setAddLocation(e.target.value)} />
                  <input className="m3-input-field" style={{ flex: 1 }} placeholder="Category (e.g. Dairy)" value={addCategory} onChange={e => setAddCategory(e.target.value)} />
                </div>
                <input className="m3-input-field" type="number" placeholder="Par Level (Min Stock to trigger alert)" value={addPar} onChange={e => setAddPar(e.target.value)} />
              </div>

              <div className="flex flex-col-reverse md:flex-row gap-3 mt-6">
                <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: 18, fontWeight: 800, color: '#8D6E63', border: 'none', background: 'none' }}>CANCEL</button>
                <button onClick={handleAddItem} style={{ flex: 1.5, padding: 18, borderRadius: 20, background: '#2D1B14', color: 'white', fontWeight: 900, boxShadow: '0 8px 20px rgba(45, 27, 20, 0.3)' }}>CREATE ITEM</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </IonPage>
  );
};

export default Inventory;

