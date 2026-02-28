import React, { useEffect, useState } from 'react';
import {
  IonContent,
  IonPage,
  IonIcon,
  IonAvatar,
  IonBadge,
  IonRippleEffect,
  IonGrid,
  IonRow,
  IonCol,
  IonButton
} from '@ionic/react';
import {
  chevronBackOutline,
  trashOutline,
  cafeOutline,
  notificationsOutline,
  settingsOutline,
  closeOutline,
  home,
  thermometerOutline,
  clipboardOutline,
  albumsOutline,
  timeOutline,
  calendarOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  chevronBack,
  chevronForward,
  archiveOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';

type TemperatureReading = {
  id: string;
  location: string;
  expectedMin: number;
  expectedMax: number;
  reading: string;
  timestamp: string;
  pass: boolean;
};

type DailyLog = {
  date: string;
  readings: TemperatureReading[];
};

const History: React.FC = () => {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [checklistLogs, setChecklistLogs] = useState<any[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<any[]>([]);
  const [logType, setLogType] = useState<'temperature' | 'checklist' | 'inventory'>('temperature');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAdminSidebar, setShowAdminSidebar] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0,0,0,0);
    return monday;
  });

  const history = useHistory();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 150);
    loadAllLogs();
    return () => clearTimeout(timer);
  }, []);

  const loadAllLogs = () => {
    const existingTemps = JSON.parse(localStorage.getItem('temp_logs_v2') || '[]');
    setLogs(existingTemps);

    try { setChecklistLogs(JSON.parse(localStorage.getItem('checklist_logs_v1') || '[]')); } catch {}
    try { setInventoryLogs(JSON.parse(localStorage.getItem('inventory_logs_v1') || '[]')); } catch {}
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentWeekStart);
    d.setDate(currentWeekStart.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  const allLocations = Array.from(new Set(logs.flatMap(l => l.readings.map(r => r.location))));

  const getReading = (date: string, location: string) => {
    const dayLog = logs.find(l => l.date === date);
    return dayLog?.readings.find(r => r.location === location);
  };

  const changeWeek = (dir: number) => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + (dir * 7));
    setCurrentWeekStart(d);
  };

  const deleteTempLogsForDate = (date: string) => {
    if (window.confirm(`Delete all temperature logs for ${date}?`)) {
      const updatedLogs = logs.filter(l => l.date !== date);
      localStorage.setItem('temp_logs_v2', JSON.stringify(updatedLogs));
      setLogs(updatedLogs);
    }
  };

  const deleteChecklistLog = (date: string) => {
    if (window.confirm('Delete this checklist log permanently?')) {
      const updated = checklistLogs.filter(l => l.date !== date);
      localStorage.setItem('checklist_logs_v1', JSON.stringify(updated));
      setChecklistLogs(updated);
    }
  };

  const deleteInventoryLog = (date: string) => {
    if (window.confirm('Delete this inventory log permanently?')) {
      const updated = inventoryLogs.filter(l => l.date !== date);
      localStorage.setItem('inventory_logs_v1', JSON.stringify(updated));
      setInventoryLogs(updated);
    }
  };

  return (
    <IonPage className="his-page-root">
      <style>{`
        .his-page-root .history-main-container {
          background-color: #FDFCF4;
          min-height: 100%;
          display: flex;
          flex-direction: column;
        }

        .his-page-root .header-espresso {
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

        .his-page-root .liquid-wave {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 30px;
          fill: #FDFCF4;
          pointer-events: none;
        }

        .his-page-root .top-bar-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          max-width: 1400px;
          z-index: 10;
        }

        .his-page-root .content-area {
          padding: 20px 20px 120px;
          margin-top: -20px;
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .his-page-root .m3-selector {
          background: white;
          border-radius: 24px;
          padding: 6px;
          display: flex;
          gap: 6px;
          margin-bottom: 24px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
          border: 1px solid #E1E3D3;
          width: 100%;
          max-width: 1400px;
        }

        .his-page-root .type-tab {
          flex: 1;
          padding: 12px;
          border-radius: 18px;
          font-size: 0.8rem;
          font-weight: 800;
          text-transform: uppercase;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          color: #A1887F;
          background: transparent;
          border: none;
          cursor: pointer;
        }

        .his-page-root .type-tab.active {
          background: #2D1B14;
          color: white;
        }

        .his-page-root .grid-card {
          background: white;
          border-radius: 32px;
          padding: 24px;
          border: 1px solid #E1E3D3;
          box-shadow: 0 4px 20px rgba(45, 27, 20, 0.05);
          width: 100%;
          max-width: 1400px;
          opacity: 0;
          transform: translateY(15px);
          transition: opacity 0.6s ease-out, transform 0.6s ease-out;
          overflow: hidden;
          margin-bottom: 20px;
        }

        .his-page-root .grid-card.loaded {
          opacity: 1;
          transform: translateY(0);
        }

        .his-page-root .table-viewport {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          border-radius: 20px;
        }

        .his-page-root table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1000px;
          table-layout: fixed;
        }

        .his-page-root th {
          padding: 16px 8px;
          font-size: 0.8rem;
          font-weight: 900;
          color: #2D1B14;
          text-transform: uppercase;
          letter-spacing: 1px;
          border-bottom: 2px solid #FDFCF4;
          text-align: center;
          width: 110px;
        }

        .his-page-root .sticky-unit {
          position: sticky;
          left: 0;
          background: #FFFFFF;
          z-index: 10;
          width: 230px !important;
          min-width: 230px;
          text-align: left;
          padding-left: 20px;
          font-weight: 900;
          color: #2D1B14;
          border-right: 2px solid #E1E3D3;
        }

        .his-page-root td {
          padding: 12px 8px;
          text-align: center;
          border-bottom: 1px solid #FDFCF4;
        }

        .his-page-root .reading-badge {
          font-weight: 900;
          font-size: 1rem;
          padding: 10px;
          border-radius: 14px;
          display: inline-block;
          min-width: 70px;
        }

        .his-page-root .reading-badge.pass { color: #2E7D32; background: #E8F5E9; }
        .his-page-root .reading-badge.fail { color: #D32F2F; background: #FFEBEE; }
        .his-page-root .reading-badge.empty { color: #BDBDBD; background: #F5F5F5; }

        .his-page-root .week-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #F8F5F2;
          padding: 12px 24px;
          border-radius: 24px;
          margin-bottom: 24px;
          width: 100%;
          max-width: 1400px;
        }

        .his-page-root .m3-nav {
          position: fixed; bottom: 0; left: 0; right: 0; height: 85px; background: #FFFFFF;
          display: flex; border-top: 1px solid #E1E3D3; padding-bottom: env(safe-area-inset-bottom); z-index: 1000;
          box-shadow: 0 -4px 20px rgba(0,0,0,0.05);
        }

        .his-page-root .nav-tab { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #A1887F; font-size: 0.75rem; font-weight: 800; cursor: pointer; }
        .his-page-root .nav-tab.active { color: #2D1B14; }
        .his-page-root .nav-indicator { width: 64px; height: 32px; border-radius: 100px; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease; margin-bottom: 4px; }
        .his-page-root .nav-tab.active .nav-indicator { background: #2D1B1412; transform: translateY(-2px); }

        .his-page-root .log-item-row {
          padding: 18px 24px;
          border-bottom: 1px solid #FDFCF4;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: background 0.2s;
        }
        .his-page-root .log-item-row:hover { background: #FDFCF4; }

        .his-page-root .trash-btn {
          color: #E57373;
          background: none;
          border: none;
          padding: 8px;
          font-size: 1.4rem;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .his-page-root .trash-btn:active { transform: scale(0.9); }

        .his-page-root .header-day-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .his-page-root .day-delete-trigger {
          opacity: 0.2;
          transition: opacity 0.2s;
          color: #E57373;
          font-size: 1rem;
          cursor: pointer;
          border: none;
          background: none;
        }
        .his-page-root th:hover .day-delete-trigger { opacity: 1; }

        .his-page-root .side-sheet-m3 {
          position: fixed;
          top: 0;
          right: -340px;
          width: 320px;
          height: 100%;
          background: white;
          z-index: 3000;
          transition: right 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          padding: 40px 28px;
          display: flex; flex-direction: column;
          box-shadow: -15px 0 50px rgba(0,0,0,0.2);
          border-radius: 40px 0 0 40px;
        }
        .his-page-root .side-sheet-m3.active { right: 0; }

        .his-page-root .scrim-m3 {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          z-index: 2500;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.5s ease;
        }
        .his-page-root .scrim-m3.active { opacity: 1; pointer-events: auto; }

        .his-page-root .icon-btn-m3 {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.2s;
        }
      `}</style>

      <IonContent scrollY={true}>
        <div className="history-main-container">
          <header className="header-espresso">
            <div className="top-bar-nav">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'linear-gradient(135deg, #E6BEAE 0%, #D7CCC8 100%)', width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                  <IonIcon icon={cafeOutline} style={{ color: '#2D1B14', fontSize: '1.4rem' }} />
                </div>
                <span style={{ fontWeight: 900, fontSize: '1.4rem', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>NexusPour</span>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <button className="icon-btn-m3" onClick={() => setShowNotifications(true)}>
                  <IonIcon icon={notificationsOutline} style={{ fontSize: '1.3rem' }} />
                </button>
                <button className="icon-btn-m3" onClick={() => setShowAdminSidebar(true)}>
                  <IonIcon icon={settingsOutline} style={{ fontSize: '1.3rem' }} />
                </button>
                <IonAvatar style={{ width: '38px', height: '38px', border: '2px solid rgba(255,255,255,0.2)', marginLeft: '4px' }}>
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Coffee" alt="Avatar" />
                </IonAvatar>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '30px', width: '100%', maxWidth: '1400px' }}>
              <button style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => history.goBack()}>
                <IonIcon icon={chevronBackOutline} style={{ fontSize: '1.2rem' }} />
              </button>
              <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: 'white' }}>Historical Logs</h1>
            </div>
            <svg className="liquid-wave" viewBox="0 0 1440 120" preserveAspectRatio="none">
              <path d="M0,32L60,42.7C120,53,240,75,360,74.7C480,75,600,53,720,48C840,43,960,53,1080,58.7C1200,64,1320,64,1380,64L1440,64L1440,120L1380,120C1320,120,1200,120,1080,120C960,120,840,120,720,120C600,120,480,120,360,120C240,120,120,120,60,120L0,120Z"></path>
            </svg>
          </header>

          <main className="content-area">
            <div className="m3-selector">
              <button className={`type-tab ${logType === 'temperature' ? 'active' : ''}`} onClick={() => setLogType('temperature')}>Temps</button>
              <button className={`type-tab ${logType === 'checklist' ? 'active' : ''}`} onClick={() => setLogType('checklist')}>Tasks</button>
              <button className={`type-tab ${logType === 'inventory' ? 'active' : ''}`} onClick={() => setLogType('inventory')}>Stock</button>
            </div>

            <div className="week-nav">
              <button onClick={() => changeWeek(-1)} style={{ background: 'white', border: 'none', width: '36px', height: '36px', borderRadius: '10px', color: '#2D1B14', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}><IonIcon icon={chevronBack} /></button>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#8D6E63', letterSpacing: '1.5px', display: 'block', marginBottom: '4px' }}>SHIFT ARCHIVE</span>
                <div style={{ fontWeight: 800, color: '#2D1B14', fontSize: '1.2rem' }}>{weekDays[0]} — {weekDays[6]}</div>
              </div>
              <button onClick={() => changeWeek(1)} style={{ background: 'white', border: 'none', width: '36px', height: '36px', borderRadius: '10px', color: '#2D1B14', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}><IonIcon icon={chevronForward} /></button>
            </div>

            {logType === 'temperature' && (
              <div className={`grid-card ${isLoaded ? 'loaded' : ''}`}>
                <div className="table-viewport">
                  <table>
                    <thead>
                      <tr>
                        <th className="sticky-unit">Equipment</th>
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                          <th key={day}>
                            <div className="header-day-group">
                              <span>{day}</span>
                              <span style={{ opacity: 0.6, fontSize: '0.65rem' }}>{weekDays[i].slice(8,10)}/{weekDays[i].slice(5,7)}</span>
                              <button className="day-delete-trigger" onClick={() => deleteTempLogsForDate(weekDays[i])} aria-label={`Delete logs for ${weekDays[i]}`}>
                                <IonIcon icon={trashOutline} />
                              </button>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {allLocations.length === 0 && <tr><td colSpan={8} style={{ padding: '60px', opacity: 0.5, textAlign: 'center', fontWeight: 700 }}>No temperature records for this window.</td></tr>}
                      {allLocations.map(loc => (
                        <tr key={loc}>
                          <td className="sticky-unit">{loc}</td>
                          {weekDays.map(date => {
                            const r = getReading(date, loc);
                            return (
                              <td key={date}>
                                <div className={`reading-badge ${r ? (r.pass ? 'pass' : 'fail') : 'empty'}`}>
                                  {r ? `${r.reading}°` : '-'}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {logType === 'checklist' && (
              <div className={`grid-card ${isLoaded ? 'loaded' : ''}`} style={{ padding: '0' }}>
                {checklistLogs.length === 0 && <div style={{ padding: '60px', opacity: 0.5, textAlign: 'center', fontWeight: 700 }}>No checklist logs found.</div>}
                {checklistLogs.map((log, idx) => (
                  <div key={idx} className="log-item-row">
                    <div>
                      <div style={{ fontWeight: 900, color: '#2D1B14', fontSize: '1.1rem' }}>{log.date}</div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.6 }}>Shift Completion Log</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#2E7D32', background: '#E8F5E9', padding: '6px 14px', borderRadius: '10px' }}>{log.completed}/{log.total} DONE</div>
                      <button className="trash-btn" onClick={() => deleteChecklistLog(log.date)}><IonIcon icon={trashOutline} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {logType === 'inventory' && (
              <div className={`grid-card ${isLoaded ? 'loaded' : ''}`} style={{ padding: '0' }}>
                {inventoryLogs.length === 0 && <div style={{ padding: '60px', opacity: 0.5, textAlign: 'center', fontWeight: 700 }}>No inventory logs found.</div>}
                {inventoryLogs.map((log, idx) => (
                  <div key={idx} className="log-item-row">
                    <div>
                      <div style={{ fontWeight: 900, color: '#2D1B14', fontSize: '1.1rem' }}>{log.date}</div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.6 }}>Stock Level Audit</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#2D1B14', background: '#F8F5F2', padding: '6px 14px', borderRadius: '10px' }}>{log.total} ITEMS</div>
                      <button className="trash-btn" onClick={() => deleteInventoryLog(log.date)}><IonIcon icon={trashOutline} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </IonContent>

      <div className="m3-nav">
        <div className="nav-tab" onClick={() => history.push('/dashboard')}>
          <div className="nav-indicator"><IonIcon icon={home} /></div>
          <span>Home</span>
        </div>
        <div className="nav-tab" onClick={() => history.push('/temp-check')}>
          <div className="nav-indicator"><IonIcon icon={thermometerOutline} /></div>
          <span>Temps</span>
        </div>
        <div className="nav-tab active">
          <div className="nav-indicator"><IonIcon icon={clipboardOutline} /></div>
          <span>Checks</span>
        </div>
        <div className="nav-tab" onClick={() => history.push('/inventory')}>
          <div className="nav-indicator"><IonIcon icon={albumsOutline} /></div>
          <span>Stock</span>
        </div>
      </div>

      <div className={`scrim-m3 ${showAdminSidebar || showNotifications ? 'active' : ''}`}
           onClick={() => { setShowAdminSidebar(false); setShowNotifications(false); }} />

      <aside className={`side-sheet-m3 ${showAdminSidebar ? 'active' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontWeight: 900, margin: 0, fontSize: '1.8rem', color: '#2D1B14' }}>Control</h2>
          <button className="icon-btn-m3" style={{ background: '#F8F5F2', color: '#2D1B14', border: 'none' }} onClick={() => setShowAdminSidebar(false)}>
            <IonIcon icon={closeOutline} style={{ fontSize: '2rem' }} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontWeight: 700, opacity: 0.5, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Storage Management</p>
            <div className="log-item-row" style={{ background: '#F8F5F2', borderRadius: '20px', border: 'none' }} onClick={() => { if(window.confirm("Clear all logs permanently?")) { localStorage.clear(); window.location.reload(); } }}>
              <span style={{ fontWeight: 800, color: '#B3261E' }}>Wipe All Data</span>
              <IonIcon icon={trashOutline} style={{ color: '#B3261E', fontSize: '1.4rem' }} />
            </div>
        </div>
      </aside>

      <aside className={`side-sheet-m3 ${showNotifications ? 'active' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontWeight: 900, margin: 0, fontSize: '1.8rem', color: '#2D1B14' }}>Alerts</h2>
          <button className="icon-btn-m3" style={{ background: '#F8F5F2', color: '#2D1B14', border: 'none' }} onClick={() => setShowNotifications(false)}>
            <IonIcon icon={closeOutline} style={{ fontSize: '2rem' }} />
          </button>
        </div>
        <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.5 }}>
          <IonIcon icon={notificationsOutline} style={{ fontSize: '3rem', marginBottom: '16px' }} />
          <p style={{ fontWeight: 700 }}>No new alerts</p>
        </div>
      </aside>
    </IonPage>
  );
};

export default History;
