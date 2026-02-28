import React, { useRef, useState, useEffect } from 'react';
import { 
  IonContent, 
  IonPage, 
  IonIcon, 
  IonAvatar,
  IonRippleEffect,
  IonGrid,
  IonRow,
  IonCol,
  IonBadge,
  IonButton
} from '@ionic/react';
import {
  thermometerOutline,
  clipboardOutline,
  albumsOutline,
  warningOutline,
  home,
  downloadOutline,
  cloudUploadOutline,
  settingsOutline,
  closeOutline,
  cafeOutline,
  timeOutline,
  notificationsOutline,
  chevronForwardOutline,
  archiveOutline,
  trashOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import JSZip from 'jszip';

const Dashboard: React.FC = () => {
  const history = useHistory();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [showExportFormat, setShowExportFormat] = useState(false);
  const [showImportFormat, setShowImportFormat] = useState(false);
  const [showAdminSidebar, setShowAdminSidebar] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [importFormat, setImportFormat] = useState<'json' | 'zip'>('json');
  const [isLoaded, setIsLoaded] = useState(false);

  const [archivedFiles, setArchivedFiles] = useState<{name: string, data: any, date: string}[]>(() => {
    try {
      const saved = localStorage.getItem('cafeops_reserved_archives_v1');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 150);
    return () => clearTimeout(timer);
  }, []);

  const STORAGE_KEYS = [
    'temp_logs_v2', 'checklist', 'checklist_logs_v1',
    'stock_list', 'inventory_logs_v1', 'cafe_sections_v1', 'master_fridges_v1',
    'allergens_map_v1', 'cafeops_dishes_v1', 'cafeops_checklists_v3', 'cafeops_stock_master_v2'
  ];

  const saveToArchive = (name: string, data: any) => {
    const newArchive = { name, data, date: new Date().toLocaleString() };
    const updated = [newArchive, ...archivedFiles].slice(0, 15);
    setArchivedFiles(updated);
    localStorage.setItem('cafeops_reserved_archives_v1', JSON.stringify(updated));
  };

  const restoreFromArchive = (archive: any) => {
    try {
      const data = archive.data;
      Object.entries(data).forEach(([key, value]) => {
        if (STORAGE_KEYS.includes(key)) localStorage.setItem(key, JSON.stringify(value));
      });
      alert('System restored. Reloading...');
      window.location.reload();
    } catch (e) {
      alert('Restore failed');
    }
  };

  const deleteArchive = (index: number) => {
    if (window.confirm('Delete this backup?')) {
      const updated = archivedFiles.filter((_, i) => i !== index);
      setArchivedFiles(updated);
      localStorage.setItem('cafeops_reserved_archives_v1', JSON.stringify(updated));
    }
  };

  const exportData = async (format: 'json' | 'zip') => {
    const data: Record<string, any> = {};
    STORAGE_KEYS.forEach(key => {
      const value = localStorage.getItem(key);
      data[key] = value ? JSON.parse(value) : null;
    });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const jsonStr = JSON.stringify(data, null, 2);
    if (format === 'json') {
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cafeops-backup-${timestamp}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const zip = new JSZip();
      STORAGE_KEYS.forEach(key => {
        const value = localStorage.getItem(key);
        zip.file(`${key}.json`, value || 'null');
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cafeops-backup-${timestamp}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    }
    saveToArchive(`Manual Backup (${timestamp})`, data);
    setShowExportFormat(false);
  };

  const importData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      Object.entries(data).forEach(([key, value]) => {
        if (STORAGE_KEYS.includes(key)) localStorage.setItem(key, JSON.stringify(value));
      });
      saveToArchive(file.name, data);
      alert('Import successful and reserved.');
      window.location.reload();
    } catch (err) {
      alert('Import failed.');
    } finally {
      setShowImportFormat(false);
    }
  };

  const modules = [
    { title: "Temperature Log", icon: thermometerOutline, link: "/temp-check", color: "#4E342E", desc: "Monitor fridge & freezer conditions" },
    { title: "Shift Checklists", icon: clipboardOutline, link: "/checklist", color: "#5D4037", desc: "Manage opening and closing tasks" },
    { title: "Stock Inventory", icon: albumsOutline, link: "/inventory", color: "#6D4C41", desc: "Track stock & waste levels" },
    { title: "Allergen Matrix", icon: warningOutline, link: "/allergens", color: "#795548", desc: "Compliance and dish allergen tracking" },
  ];

  const notifications = [
    { id: 1, text: "System is ready", type: "success", time: "Just now" },
    { id: 2, text: "Shift monitoring active", type: "info", time: "Today" },
  ];

  return (
    <IonPage>
      <style>{`
        .dashboard-main-view {
          --background: #FDFCF4;
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
        }

        /* Splash Coffee Header */
        .espresso-header {
          background: #2D1B14;
          padding: 60px 24px 80px; /* Increased top padding for breathing room */
          color: white;
          width: 100%;
          position: relative;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }

        .liquid-splash {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 80px;
          background: #FDFCF4;
          clip-path: polygon(0% 100%, 100% 100%, 100% 0%, 85% 40%, 75% 10%, 65% 50%, 50% 20%, 35% 60%, 25% 10%, 10% 40%, 0% 0%);
        }

        .top-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          max-width: 1100px; /* Slightly tighter max-width for better focus */
          z-index: 10;
        }

        .logo-wrap {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .logo-icon-box {
          background: linear-gradient(135deg, #E6BEAE 0%, #D7CCC8 100%);
          width: 52px;
          height: 52px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #2D1B14;
          box-shadow: 0 6px 15px rgba(0,0,0,0.4);
        }

        .logo-text {
          font-weight: 900;
          font-size: 2rem;
          letter-spacing: -1.2px;
          color: white;
          margin: 0;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }

        .header-actions {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .icon-btn-m3 {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.15);
          transition: all 0.2s;
          position: relative;
        }

        .icon-btn-m3:active { transform: scale(0.9); background: rgba(255,255,255,0.2); }

        .hero-greet {
          margin-top: 48px;
          text-align: center;
          z-index: 10;
          opacity: 0;
          transform: translateY(15px);
          transition: all 0.8s ease-out;
          width: 100%;
        }

        .hero-greet.visible { opacity: 1; transform: translateY(0); }

        .status-pill-m3 {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.12);
          padding: 10px 24px;
          border-radius: 100px;
          font-size: 0.85rem;
          font-weight: 800;
          margin-top: 24px;
          color: #E6BEAE;
          border: 1px solid rgba(255, 255, 255, 0.15);
          letter-spacing: 1.5px;
        }

        .pulse-dot {
          width: 10px; height: 10px; border-radius: 50%; background: #81C784;
          box-shadow: 0 0 12px #81C784; animation: m3-pulse 2s infinite;
        }

        @keyframes m3-pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.6; }
          100% { transform: scale(1); opacity: 1; }
        }

        .main-scroll {
          padding: 20px;
          margin-top: -30px;
          flex: 1;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          overflow-y: auto;
        }

        .grid-max-width {
          width: 100%;
          max-width: 1100px;
        }

        .m3-card-wide {
          background: white;
          border-radius: 32px;
          padding: 24px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 24px;
          box-shadow: 0 4px 20px rgba(45, 27, 20, 0.06);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          opacity: 0;
          transform: translateY(20px);
          cursor: pointer;
          border: 1px solid #E1E3D3;
          width: 100%;
        }

        .m3-card-wide.visible { opacity: 1; transform: translateY(0); }
        .m3-card-wide:hover { transform: translateY(-8px) scale(1.02); box-shadow: 0 20px 40px rgba(45, 27, 20, 0.12); border-color: #A1887F; }
        .m3-card-wide:active { transform: scale(0.97); }

        .card-icon-m3 {
          width: 64px; height: 64px; border-radius: 20px;
          display: flex; align-items: center; justify-content: center;
          font-size: 2.2rem; background: #F8F5F2; color: #2D1B14; flex-shrink: 0;
          box-shadow: inset 0 2px 5px rgba(0,0,0,0.05);
        }

        .card-content-m3 { flex: 1; }
        .card-title-m3 { font-size: 1.4rem; font-weight: 900; color: #2D1B14; margin: 0; letter-spacing: -0.5px; }
        .card-desc-m3 { color: #7D746D; font-size: 0.95rem; margin: 4px 0 0; line-height: 1.4; font-weight: 500; }

        .m3-footer-nav {
          background: #ffffff;
          height: 85px;
          display: flex;
          border-top: 1px solid #E1E3D3;
          padding-bottom: env(safe-area-inset-bottom);
          box-shadow: 0 -4px 25px rgba(0,0,0,0.05);
          width: 100%;
          justify-content: space-around;
          position: relative;
          z-index: 100;
        }

        .nav-link-m3 {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #A1887F;
          font-size: 0.75rem;
          font-weight: 800;
          text-decoration: none;
        }

        .nav-link-m3.active { color: #2D1B14; }

        .nav-pill-m3 {
          padding: 4px 24px;
          border-radius: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          margin-bottom: 4px;
          width: 64px; /* Fixed width to prevent stretching */
          height: 32px;
        }

        .nav-link-m3.active .nav-pill-m3 {
          background: #2D1B1412;
          transform: translateY(-2px);
        }

        .nav-link-m3 ion-icon { font-size: 1.6rem; }

        .side-sheet {
          position: fixed; top: 0; right: -340px; width: 320px; height: 100%; background: white;
          z-index: 3000; transition: right 0.5s cubic-bezier(0.4, 0, 0.2, 1); padding: 40px 28px;
          display: flex; flex-direction: column; box-shadow: -15px 0 50px rgba(0,0,0,0.2); border-radius: 40px 0 0 40px;
        }
        .side-sheet.active { right: 0; }
        .scrim { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(8px); z-index: 2500; opacity: 0; pointer-events: none; transition: opacity 0.5s ease; }
        .scrim.active { opacity: 1; pointer-events: auto; }
      `}</style>

      <IonContent scrollY={false}>
        <div className="dashboard-main-view">
          <header className="espresso-header">
            <div className="top-nav">
              <div className="logo-wrap">
                <div className="logo-icon-box">
                  <IonIcon icon={cafeOutline} />
                </div>
                <h1 className="logo-text">NexusPour</h1>
              </div>
              <div className="header-actions">
                <button className="icon-btn-m3" onClick={() => setShowNotifications(true)} aria-label="Notifications">
                  <IonIcon icon={notificationsOutline} style={{ fontSize: '1.6rem' }} />
                  <IonBadge color="danger" style={{ position: 'absolute', top: '2px', right: '2px', scale: '0.7' }}>3</IonBadge>
                </button>
                <button className="icon-btn-m3" onClick={() => setShowAdminSidebar(true)} aria-label="Settings">
                  <IonIcon icon={settingsOutline} style={{ fontSize: '1.6rem' }} />
                </button>
                <IonAvatar style={{ width: '46px', height: '46px', border: '3px solid rgba(255,255,255,0.2)', marginLeft: '4px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Coffee" alt="Avatar" />
                </IonAvatar>
              </div>
            </div>

            <div className={`hero-greet ${isLoaded ? 'visible' : ''}`}>
              <h2 style={{ fontSize: '2.4rem', fontWeight: 800, margin: 0, color: 'white', textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>Welcome, Xedono</h2>
              <div className="status-pill-m3">
                <div className="pulse-dot"></div>
                SYSTEM OPERATIONAL
              </div>
            </div>

            <div className="liquid-splash"></div>
          </header>

          <main className="main-scroll">
            <div className="grid-max-width">
              <IonGrid className="p-0">
                <IonRow>
                  {modules.map((m, i) => (
                    <IonCol size="12" sizeMd="6" key={i} className="p-2">
                      <div
                        className={`m3-card-wide ion-activatable ${isLoaded ? 'visible' : ''}`}
                        style={{ transitionDelay: `${0.2 + (i * 0.1)}s` }}
                        onClick={() => history.push(m.link)}
                      >
                        <div className="card-icon-m3">
                          <IonIcon icon={m.icon} />
                        </div>
                        <div className="card-content-m3">
                          <h3 className="card-title-m3">{m.title}</h3>
                          <p className="card-desc-m3">{m.desc}</p>
                        </div>
                        <IonIcon icon={chevronForwardOutline} style={{ color: '#A1887F', fontSize: '1.6rem' }} />
                        <IonRippleEffect />
                      </div>
                    </IonCol>
                  ))}
                </IonRow>
              </IonGrid>
            </div>

            <div style={{ marginTop: '32px', width: '100%', maxWidth: '1100px', padding: '0 8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontWeight: 900, color: '#2D1B14', fontSize: '1.4rem' }}>Archives</h3>
                <IonButton fill="clear" size="small" onClick={() => setShowArchive(!showArchive)} style={{ fontWeight: 800 }}>
                  {showArchive ? 'Hide' : 'Reserved Storage'}
                </IonButton>
              </div>

              {showArchive && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {archivedFiles.length === 0 && <p style={{ textAlign: 'center', opacity: 0.5, padding: '20px' }}>No backups reserved.</p>}
                  {archivedFiles.map((archive, idx) => (
                    <div key={idx} className="m3-card-wide" style={{ opacity: 1, transform: 'none', margin: 0, padding: '20px' }}>
                      <IonIcon icon={archiveOutline} style={{ fontSize: '1.8rem', color: '#2D1B14' }} />
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem', color: '#2D1B14' }}>{archive.name}</p>
                        <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.6, fontWeight: 700 }}>{archive.date}</p>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => restoreFromArchive(archive)} style={{ background: '#2D1B14', color: 'white', padding: '10px 18px', border: 'none', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 900 }}>Restore</button>
                        <button onClick={() => deleteArchive(idx)} style={{ color: '#E57373', fontSize: '1.5rem', background: 'none', border: 'none' }} aria-label="Delete backup"><IonIcon icon={trashOutline} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>

          <footer style={{ padding: '40px 20px', textAlign: 'center', opacity: 0.3 }}>
            <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 900, color: '#2D1B14', letterSpacing: '4px' }}>NEXUSPOUR • PREMIUM HUB</p>
          </footer>
        </div>
      </IonContent>

      <nav className="m3-footer-nav">
        <div className="nav-link-m3 active" onClick={() => history.push('/dashboard')}>
          <div className="nav-pill-m3"><IonIcon icon={home} /></div>
          <span>Home</span>
        </div>
        <div className="nav-link-m3" onClick={() => history.push('/temp-check')}>
          <div className="nav-pill-m3"><IonIcon icon={thermometerOutline} /></div>
          <span>Temps</span>
        </div>
        <div className="nav-link-m3" onClick={() => history.push('/checklist')}>
          <div className="nav-pill-m3"><IonIcon icon={clipboardOutline} /></div>
          <span>Checks</span>
        </div>
        <div className="nav-link-m3" onClick={() => history.push('/inventory')}>
          <div className="nav-pill-m3"><IonIcon icon={albumsOutline} /></div>
          <span>Stock</span>
        </div>
        <div className="nav-link-m3" onClick={() => history.push('/allergens')}>
          <div className="nav-pill-m3"><IonIcon icon={warningOutline} /></div>
          <span>Allergens</span>
        </div>
      </nav>

      <div className={`scrim ${showAdminSidebar || showNotifications ? 'active' : ''}`}
           onClick={() => { setShowAdminSidebar(false); setShowNotifications(false); }} />

      <aside className={`side-sheet ${showAdminSidebar ? 'active' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontWeight: 900, margin: 0, fontSize: '1.8rem', color: '#2D1B14' }}>Control</h2>
          <button className="icon-btn-m3" style={{ background: '#F8F5F2', color: '#2D1B14', border: 'none' }} onClick={() => setShowAdminSidebar(false)}>
            <IonIcon icon={closeOutline} style={{ fontSize: '2rem' }} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div className="m3-card-wide" style={{ padding: '20px', borderRadius: '20px', opacity: 1, transform: 'none', margin: 0, boxShadow: 'none', background: '#F8F5F2' }} onClick={() => { history.push('/history'); setShowAdminSidebar(false); }}>
            <IonIcon icon={timeOutline} style={{ fontSize: '1.8rem', color: '#2D1B14' }} />
            <span style={{ fontWeight: 800, color: '#2D1B14' }}>History Log</span>
          </div>
          <div className="m3-card-wide" style={{ padding: '20px', borderRadius: '20px', opacity: 1, transform: 'none', margin: 0, boxShadow: 'none', background: '#F8F5F2' }} onClick={() => setShowExportFormat(true)}>
            <IonIcon icon={downloadOutline} style={{ fontSize: '1.8rem', color: '#2D1B14' }} />
            <span style={{ fontWeight: 800, color: '#2D1B14' }}>Backup</span>
          </div>
          <div className="m3-card-wide" style={{ padding: '20px', borderRadius: '20px', opacity: 1, transform: 'none', margin: 0, boxShadow: 'none', background: '#F8F5F2' }} onClick={() => setShowImportFormat(true)}>
            <IonIcon icon={cloudUploadOutline} style={{ fontSize: '1.8rem', color: '#2D1B14' }} />
            <span style={{ fontWeight: 800, color: '#2D1B14' }}>Restore</span>
          </div>
        </div>
      </aside>

      <aside className={`side-sheet ${showNotifications ? 'active' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontWeight: 900, margin: 0, fontSize: '1.8rem', color: '#2D1B14' }}>Alerts</h2>
          <button className="icon-btn-m3" style={{ background: '#F8F5F2', color: '#2D1B14', border: 'none' }} onClick={() => setShowNotifications(false)}>
            <IonIcon icon={closeOutline} style={{ fontSize: '2rem' }} />
          </button>
        </div>
        {notifications.map(n => (
          <div key={n.id} style={{ padding: '20px', borderRadius: '24px', background: '#F8F5F2', marginBottom: '15px', borderLeft: '6px solid #2D1B14', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
            <p style={{ margin: 0, fontWeight: 800, color: '#2D1B14', fontSize: '1.1rem' }}>{n.text}</p>
            <span style={{ fontSize: '0.85rem', opacity: 0.6, fontWeight: 700 }}>{n.time}</span>
          </div>
        ))}
      </aside>

      {(showImportFormat || showExportFormat) && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'rgba(0,0,0,0.4)' }}>
          <div style={{ borderRadius: '35px', padding: '32px', background: 'white', width: '100%', maxWidth: '400px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.8rem', color: '#2D1B14' }}>Data Sync</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '24px' }}>
              <button onClick={() => setImportFormat('json')} style={{ padding: '18px', borderRadius: '18px', border: '2px solid', borderColor: importFormat === 'json' ? '#2D1B14' : '#F5F5F5', background: 'white', textAlign: 'left', fontWeight: 800, color: '#2D1B14', fontSize: '1.1rem' }}>JSON DATABASE</button>
              <button onClick={() => setImportFormat('zip')} style={{ padding: '18px', borderRadius: '18px', border: '2px solid', borderColor: importFormat === 'zip' ? '#2D1B14' : '#F5F5F5', background: 'white', textAlign: 'left', fontWeight: 800, color: '#2D1B14', fontSize: '1.1rem' }}>ZIP ARCHIVE</button>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
              <button style={{ flex: 1, padding: '12px', fontWeight: 800, color: '#7D746D', background: 'none', border: 'none' }} onClick={() => { setShowExportFormat(false); setShowImportFormat(false); }}>Cancel</button>
              <button style={{ flex: 1, padding: '12px', background: '#2D1B14', color: 'white', borderRadius: '16px', fontWeight: 900, fontSize: '1rem', boxShadow: '0 10px 25px rgba(45, 27, 20, 0.3)' }} onClick={() => showImportFormat ? fileRef.current?.click() : exportData(importFormat)}>
                {showImportFormat ? 'SELECT' : 'DOWNLOAD'}
              </button>
            </div>
            <input ref={fileRef} type="file" accept={importFormat === 'json' ? '.json' : '.zip'} onChange={importData} style={{ display: 'none' }} />
          </div>
        </div>
      )}
    </IonPage>
  );
};

export default Dashboard;
