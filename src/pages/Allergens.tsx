import React, { useState, useEffect, useMemo } from 'react';
import {
  IonContent,
  IonPage,
  IonIcon,
  IonAvatar,
  IonRippleEffect,
  IonBadge
} from '@ionic/react';
import {
  chevronBackOutline,
  settingsOutline,
  cafeOutline,
  clipboardOutline,
  home,
  thermometerOutline,
  albumsOutline,
  addOutline,
  trashOutline,
  closeOutline,
  saveOutline,
  checkmarkCircle,
  chevronBack,
  chevronForward,
  searchOutline,
  restaurantOutline,
  warningOutline,
  sparklesOutline,
  listOutline,
  timeOutline,
  downloadOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';

type Dish = {
  id: string;
  name: string;
  allergens: string[]; // List of allergen keys
};

const ALLERGENS = [
  { key: 'celery', label: 'Celery' },
  { key: 'gluten', label: 'Gluten' },
  { key: 'crustaceans', label: 'Crustaceans' },
  { key: 'eggs', label: 'Eggs' },
  { key: 'fish', label: 'Fish' },
  { key: 'lupin', label: 'Lupin' },
  { key: 'milk', label: 'Milk' },
  { key: 'molluscs', label: 'Molluscs' },
  { key: 'mustard', label: 'Mustard' },
  { key: 'nuts', label: 'Nuts' },
  { key: 'peanuts', label: 'Peanuts' },
  { key: 'sesame', label: 'Sesame' },
  { key: 'soya', label: 'Soya' },
  { key: 'sulphites', label: 'Sulphites' }
];

const STORAGE_KEY = 'cafeops_dishes_v1';

const Allergens: React.FC = () => {
  const history = useHistory();
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchOutline] = useState('');
  const [showAddDish, setShowAddDish] = useState(false);
  const [showAdminSidebar, setShowAdminSidebar] = useState(false);
  const [newDishName, setNewDishName] = useState('');
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);

  const [dishes, setDishes] = useState<Dish[]>(() => {
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dishes));
  }, [dishes]);

  const filteredDishes = useMemo(() => {
    return dishes.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [dishes, searchQuery]);

  const toggleAllergenInSelection = (key: string) => {
    setSelectedAllergens(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const addDish = () => {
    if (!newDishName.trim()) return;
    const newDish: Dish = {
      id: Date.now().toString(),
      name: newDishName.trim(),
      allergens: selectedAllergens
    };
    setDishes([newDish, ...dishes]);
    setNewDishName('');
    setSelectedAllergens([]);
    setShowAddDish(false);
  };

  const deleteDish = (id: string) => {
    if (window.confirm('Remove this dish from the allergen matrix?')) {
      setDishes(dishes.filter(d => d.id !== id));
    }
  };

  const exportAllergens = () => {
    const header = ['Dish Name', ...ALLERGENS.map(a => a.label)].join(',');
    const rows = dishes.map(dish => {
      const row = [
        `"${dish.name}"`,
        ...ALLERGENS.map(a => dish.allergens.includes(a.key) ? 'YES' : 'NO')
      ];
      return row.join(',');
    });

    const csvContent = [header, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Allergen-Matrix-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setShowAdminSidebar(false);
  };

  return (
    <IonPage className="alg-page-root">
      <style>{`
        .alg-page-root {
          --m3-surface: #FDFCF4;
          --m3-primary: #2D1B14;
          --m3-accent: #D6E8B1;
          --m3-error: #B3261E;
          width: 100%;
          height: 100%;
        }

        .alg-page-root .alg-main-container {
          background-color: var(--m3-surface);
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
        }

        .alg-page-root .header-espresso {
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

        .alg-page-root .liquid-wave {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 30px;
          fill: var(--m3-surface);
          pointer-events: none;
        }

        .alg-page-root .top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          max-width: 1400px;
          z-index: 10;
        }

        .alg-page-root .brand-box {
          display: flex;
          align-items: center; gap: 12px;
        }

        .alg-page-root .logo-icon {
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

        .alg-page-root .page-title-row {
          margin-top: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          max-width: 1400px;
          z-index: 10;
        }

        .alg-page-root .main-scroll {
          padding: 20px 20px 120px;
          flex: 1;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          overflow-y: auto;
        }

        .alg-page-root .grid-max {
          width: 100%;
          max-width: 1400px;
        }

        .alg-page-root .search-box {
          background: white;
          border-radius: 20px;
          padding: 12px 18px;
          margin-bottom: 20px;
          box-shadow: 0 4px 15px rgba(45, 27, 20, 0.04);
          border: 1px solid #E1E3D3;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .alg-page-root .search-box input {
          border: none;
          outline: none;
          flex: 1;
          font-weight: 700;
          color: #2D1B14;
          font-size: 1rem;
        }

        .alg-page-root .table-viewport {
          width: 100%;
          overflow-x: auto;
          background: white;
          border-radius: 24px;
          border: 1px solid #E1E3D3;
          box-shadow: 0 4px 20px rgba(45, 27, 20, 0.05);
        }

        .alg-page-root table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1200px;
          table-layout: fixed;
        }

        .alg-page-root th {
          background: #FDFCF4;
          padding: 16px 8px;
          font-size: 0.65rem;
          font-weight: 900;
          color: #8D6E63;
          text-transform: uppercase;
          letter-spacing: 1px;
          border-bottom: 1px solid #E1E3D3;
          text-align: center;
          width: 80px;
        }

        .alg-page-root .sticky-dish-name {
          width: 240px !important;
          min-width: 240px;
          position: sticky;
          left: 0;
          background: #FFFFFF;
          z-index: 10;
          border-right: 1px solid #E1E3D3;
          padding-left: 24px;
          text-align: left;
          font-weight: 800;
          color: #2D1B14;
          font-size: 0.95rem;
        }

        .alg-page-root td {
          padding: 12px 8px;
          text-align: center;
          border-bottom: 1px solid #FDFCF4;
        }

        .alg-page-root .allergen-check {
          width: 24px;
          height: 24px;
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #F8F5F2;
          color: #E1E3D3;
          font-size: 1.2rem;
        }

        .alg-page-root .allergen-check.active {
          background: #B3261E;
          color: white;
          box-shadow: 0 2px 6px rgba(179, 38, 30, 0.3);
        }

        .alg-page-root .fab-add {
          position: fixed;
          bottom: 100px;
          right: 24px;
          width: 64px;
          height: 64px;
          border-radius: 22px;
          background: #2D1B14;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 30px rgba(45, 27, 20, 0.4);
          z-index: 1000;
          border: none;
          cursor: pointer;
        }

        .alg-page-root .m3-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 85px;
          background: #FFFFFF;
          display: flex;
          border-top: 1px solid #E1E3D3;
          padding-bottom: env(safe-area-inset-bottom);
          z-index: 1000;
          box-shadow: 0 -4px 20px rgba(0,0,0,0.05);
        }

        .alg-page-root .nav-tab { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #A1887F; font-size: 0.75rem; font-weight: 800; cursor: pointer; }
        .alg-page-root .nav-tab.active { color: #2D1B14; }
        .alg-page-root .nav-indicator { width: 64px; height: 32px; border-radius: 100px; display: flex; align-items: center; justify-content: center; transition: all 0.3s; margin-bottom: 4px; }
        .alg-page-root .nav-tab.active .nav-indicator { background: #2D1B1412; transform: translateY(-2px); }

        .alg-page-root .m3-modal-overlay {
          position: fixed; inset: 0; background: rgba(45, 27, 20, 0.4); backdrop-filter: blur(8px);
          z-index: 4000; display: flex; align-items: center; justify-content: center; padding: 24px;
        }

        .alg-page-root .m3-dialog {
          background: white; border-radius: 32px; padding: 32px; width: 100%; max-width: 500px;
          max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 50px rgba(0,0,0,0.2);
          border: 1px solid rgba(45, 27, 20, 0.05);
        }

        .alg-page-root .allergen-grid-select {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-bottom: 24px;
        }

        .alg-page-root .allergen-select-item {
          padding: 14px;
          border-radius: 16px;
          background: #F8F5F2;
          border: 2px solid #E1E3D3;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 700;
          color: #8D6E63;
          font-size: 0.85rem;
        }

        .alg-page-root .allergen-select-item.selected {
          border-color: #B3261E;
          background: #FDF2F2;
          color: #B3261E;
        }

        .alg-page-root .m3-input-field {
          width: 100%; padding: 18px; border-radius: 20px; background: #FDFCF4;
          border: 2px solid #E1E3D3; font-weight: 700; color: #2D1B14; outline: none;
          margin-bottom: 20px; font-size: 1rem;
        }

        .alg-page-root .m3-input-field:focus { border-color: #2D1B14; }

        .alg-page-root .btn-create {
          width: 100%; padding: 18px; border-radius: 20px; border: none; background: #2D1B14;
          color: white; font-weight: 900; cursor: pointer; box-shadow: 0 8px 20px rgba(45, 27, 20, 0.25);
        }

        .alg-page-root .round-btn {
          width: 40px; height: 40px; border-radius: 12px; background: rgba(255,255,255,0.1);
          border: none; color: white; display: flex; align-items: center; justify-content: center; cursor: pointer;
        }

        .alg-page-root .sidebar-m3 {
          position: fixed; top: 0; right: -340px; width: 320px; height: 100%; background: white;
          z-index: 3000; transition: right 0.5s cubic-bezier(0.4, 0, 0.2, 1); padding: 40px 28px;
          display: flex; flex-direction: column; box-shadow: -15px 0 50px rgba(0,0,0,0.2); border-radius: 40px 0 0 40px;
        }
        .alg-page-root .sidebar-m3.active { right: 0; }
        .alg-page-root .scrim-m3 {
          position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px); z-index: 2500; opacity: 0; pointer-events: none;
          transition: opacity 0.5s ease;
        }
        .alg-page-root .scrim-m3.active { opacity: 1; pointer-events: auto; }
        .alg-page-root .m3-card-wide {
          padding: 20px; border-radius: 20px; background: #F8F5F2;
          display: flex; align-items: center; gap: 15px; cursor: pointer;
          transition: background 0.2s; margin-bottom: 12px;
        }
        .alg-page-root .m3-card-wide:active { background: #E6E1DC; }
      `}</style>

      <div className="alg-main-container">
        <header className="header-espresso">
          <div className="top-bar">
            <div className="brand-box">
              <div className="logo-icon"><IonIcon icon={warningOutline} /></div>
              <h1 style={{ margin: 0, fontWeight: 900, fontSize: '1.6rem', letterSpacing: '-1px' }}>NexusPour</h1>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button className="round-btn" onClick={() => setShowAdminSidebar(true)}>
                <IonIcon icon={settingsOutline} />
              </button>
              <IonAvatar style={{ width: '40px', height: '40px', border: '2px solid rgba(255,255,255,0.2)' }}>
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Safe" alt="User" />
              </IonAvatar>
            </div>
          </div>

          <div className="page-title-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button className="round-btn" onClick={() => history.push('/dashboard')}>
                <IonIcon icon={chevronBackOutline} />
              </button>
              <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.5rem' }}>Allergen Matrix</h2>
            </div>
            <IonBadge color="danger" style={{ padding: '6px 12px', borderRadius: '100px', fontWeight: 800 }}>14 CATEGORIES</IonBadge>
          </div>
          <svg className="liquid-wave" viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path d="M0,32L60,42.7C120,53,240,75,360,74.7C480,75,600,53,720,48C840,43,960,53,1080,58.7C1200,64,1320,64,1380,64L1440,64L1440,120L1380,120C1320,120,1200,120,1080,120C960,120,840,120,720,120C600,120,480,120,360,120C240,120,120,120,60,120L0,120Z"></path>
          </svg>
        </header>

        <main className="main-scroll">
          <div className="grid-max">
            <div className="search-box">
              <IonIcon icon={searchOutline} style={{ color: '#8D6E63', fontSize: '1.2rem' }} />
              <input
                placeholder="Search dish name..."
                value={searchQuery}
                onChange={e => setSearchOutline(e.target.value)}
              />
            </div>

            <div className="table-viewport">
              <table>
                <thead>
                  <tr>
                    <th className="sticky-dish-name">DISH / MENU ITEM</th>
                    {ALLERGENS.map(a => (
                      <th key={a.key}>{a.label}</th>
                    ))}
                    <th style={{ width: '60px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDishes.length === 0 && (
                    <tr>
                      <td colSpan={16} style={{ padding: '60px', textAlign: 'center', color: '#8D6E63', fontWeight: 700 }}>
                        No dishes recorded. Click + to add your first menu item.
                      </td>
                    </tr>
                  )}
                  {filteredDishes.map(dish => (
                    <tr key={dish.id}>
                      <td className="sticky-dish-name">{dish.name}</td>
                      {ALLERGENS.map(a => (
                        <td key={a.key}>
                          <div className={`allergen-check ${dish.allergens.includes(a.key) ? 'active' : ''}`}>
                            {dish.allergens.includes(a.key) ? <IonIcon icon={checkmarkCircle} /> : '—'}
                          </div>
                        </td>
                      ))}
                      <td>
                        <button
                          style={{ background: 'none', border: 'none', color: '#E57373', cursor: 'pointer', fontSize: '1.2rem' }}
                          onClick={() => deleteDish(dish.id)}
                        >
                          <IonIcon icon={trashOutline} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        <button className="fab-add ion-activatable" onClick={() => setShowAddDish(true)}>
          <IonIcon icon={addOutline} style={{ fontSize: '2.4rem' }} />
          <IonRippleEffect />
        </button>

        <div className={`scrim-m3 ${showAdminSidebar ? 'active' : ''}`} onClick={() => setShowAdminSidebar(false)} />
        <aside className={`sidebar-m3 ${showAdminSidebar ? 'active' : ''}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontWeight: 900, margin: 0, fontSize: '1.8rem', color: '#2D1B14' }}>Control</h2>
            <button className="round-btn" style={{ background: '#F8F5F2', color: '#2D1B14' }} onClick={() => setShowAdminSidebar(false)}>
              <IonIcon icon={closeOutline} style={{ fontSize: '2rem' }} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="m3-card-wide" onClick={() => { history.push('/history'); setShowAdminSidebar(false); }}>
              <IonIcon icon={timeOutline} style={{ fontSize: '1.8rem', color: '#2D1B14' }} />
              <span style={{ fontWeight: 800, color: '#2D1B14' }}>Historical Logs</span>
            </div>
            <div className="m3-card-wide" onClick={exportAllergens}>
              <IonIcon icon={downloadOutline} style={{ fontSize: '1.8rem', color: '#2D1B14' }} />
              <span style={{ fontWeight: 800, color: '#2D1B14' }}>Export Matrix (CSV)</span>
            </div>
          </div>
        </aside>

        {showAddDish && (
          <div className="m3-modal-overlay" onClick={() => setShowAddDish(false)}>
            <div className="m3-dialog" onClick={e => e.stopPropagation()}>
              <header style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ width: '56px', height: '56px', background: '#F8F5F2', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#B3261E' }}>
                  <IonIcon icon={restaurantOutline} style={{ fontSize: '1.8rem' }} />
                </div>
                <h3 style={{ margin: 0, fontWeight: 900, color: '#2D1B14', fontSize: '1.6rem' }}>Add Menu Item</h3>
                <p style={{ margin: '4px 0 0', color: '#8D6E63', fontWeight: 700, fontSize: '0.85rem' }}>Select all contained allergens</p>
              </header>

              <input
                className="m3-input-field"
                placeholder="Enter Dish Name (e.g. Avocado Toast)"
                value={newDishName}
                onChange={e => setNewDishName(e.target.value)}
                autoFocus
              />

              <div className="allergen-grid-select">
                {ALLERGENS.map(a => (
                  <div
                    key={a.key}
                    className={`allergen-select-item ${selectedAllergens.includes(a.key) ? 'selected' : ''}`}
                    onClick={() => toggleAllergenInSelection(a.key)}
                  >
                    <div style={{ width: '20px', height: '20px', borderRadius: '4px', border: '2px solid', borderColor: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {selectedAllergens.includes(a.key) && <IonIcon icon={checkmarkCircle} />}
                    </div>
                    {a.label}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  style={{ flex: 1, padding: '18px', borderRadius: '20px', border: 'none', background: '#F8F5F2', color: '#8D6E63', fontWeight: 800, cursor: 'pointer' }}
                  onClick={() => setShowAddDish(false)}
                >
                  CANCEL
                </button>
                <button className="btn-create" onClick={addDish}>
                  SAVE DISH
                </button>
              </div>
            </div>
          </div>
        )}

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
          <div className="nav-tab" onClick={() => history.push('/inventory')}>
            <div className="nav-indicator"><IonIcon icon={albumsOutline} style={{ fontSize: '1.5rem' }} /></div>
            <span>Stock</span>
          </div>
          <div className="nav-tab active">
            <div className="nav-indicator"><IonIcon icon={warningOutline} style={{ fontSize: '1.5rem' }} /></div>
            <span>Allergens</span>
          </div>
        </nav>
      </div>
    </IonPage>
  );
};

export default Allergens;
