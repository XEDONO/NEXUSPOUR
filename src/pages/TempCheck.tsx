import React, { useState, useEffect, useMemo } from 'react';
import {
  IonContent,
  IonPage,
  IonIcon,
  IonAvatar,
  IonRippleEffect,
  IonProgressBar,
  IonBadge,
  IonButton,
  IonToast
} from '@ionic/react';
import {
  chevronBackOutline,
  settingsOutline,
  notificationsOutline,
  cafeOutline,
  thermometerOutline,
  home,
  trashOutline,
  saveOutline,
  chevronBack,
  chevronForward,
  closeOutline,
  timeOutline,
  addOutline,
  clipboardOutline,
  albumsOutline,
  constructOutline,
  calendarOutline,
  checkmarkCircle,
  alertCircleOutline,
  checkmarkCircleOutline,
  refreshOutline,
  warningOutline,
  checkmarkDoneOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { API_BASE_URL } from '../apiConfig';

type FridgeTemplate = { id: string; location: string; expectedMin: number; expectedMax: number };

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

const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

const getWeekDays = (startDate: Date) => {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    return d.toISOString().split('T')[0];
  });
};

const TempCheck: React.FC = () => {
  const history = useHistory();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getStartOfWeek(new Date()));
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [masterFridges, setMasterFridges] = useState<FridgeTemplate[]>([]);

  const [showAddFridgeModal, setShowAddFridgeModal] = useState(false);
  const [showManageUnitsModal, setShowManageUnitsModal] = useState(false);
  const [newFridgeName, setNewFridgeName] = useState('');
  const [newFridgeMinTemp, setNewFridgeMinTemp] = useState('2');
  const [newFridgeMaxTemp, setNewFridgeMaxTemp] = useState('5');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    fetchData();
    setIsLoaded(true);
  }, []);

  const fetchData = async () => {
    try {
      const fridgesRes = await fetch(`${API_BASE_URL}/fridges`);
      const fridgesData = await fridgesRes.json();
      setMasterFridges(fridgesData);

      const logsRes = await fetch(`${API_BASE_URL}/logs`);
      const logsData = await logsRes.json();

      const dailyLogs = logsData.reduce((acc: DailyLog[], log: any) => {
          let dayLog = acc.find(l => l.date === log.date);
          if (!dayLog) {
              dayLog = { date: log.date, readings: [] };
              acc.push(dayLog);
          }
          const fridge = fridgesData.find((f: FridgeTemplate) => f.id === log.fridge_id);
          if (fridge) {
              dayLog.readings.push({
                  id: fridge.id,
                  location: fridge.location,
                  expectedMin: fridge.expectedMin,
                  expectedMax: fridge.expectedMax,
                  reading: log.reading,
                  timestamp: log.date,
                  pass: !!log.pass
              });
          }
          return acc;
      }, []);

      setLogs(dailyLogs);
    } catch (error) {
      console.error("Failed to fetch data", error);
    }
  };

  const weekDays = useMemo(() => getWeekDays(currentWeekStart), [currentWeekStart]);

  const handleReadingChange = async (date: string, fridgeId: string, value: string) => {
    const fridge = masterFridges.find(f => f.id === fridgeId);
    if (!fridge) return;

    const temp = parseFloat(value);
    const pass = !isNaN(temp) && temp >= fridge.expectedMin && temp <= fridge.expectedMax;

    await fetch(`${API_BASE_URL}/logs`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, fridge_id: fridgeId, reading: value, pass }),
    });

    fetchData();
  };

  const saveToHistory = async () => {
    setShowToast(true);
    fetchData();
  };

  const getReadingValue = (date: string, fridgeId: string) => {
    const dayLog = logs.find(l => l.date === date);
    if (!dayLog) return '';
    const reading = dayLog.readings.find(r => r.id === fridgeId);
    return reading ? reading.reading : '';
  };

  const isPassing = (date: string, fridgeId: string) => {
    const val = getReadingValue(date, fridgeId);
    if (!val) return null;
    const dayLog = logs.find(l => l.date === date);
    const reading = dayLog?.readings.find(r => r.id === fridgeId);
    return reading ? reading.pass : null;
  };

  const changeWeek = (direction: number) => {
    setSlideDirection(direction > 0 ? 'left' : 'right');
    setIsTransitioning(true);

    setTimeout(() => {
      const newDate = new Date(currentWeekStart);
      newDate.setDate(newDate.getDate() + (direction * 7));
      setCurrentWeekStart(newDate);

      setTimeout(() => {
        setIsTransitioning(false);
        setSlideDirection(null);
      }, 50);
    }, 250);
  };

  const addFridge = async () => {
    const name = newFridgeName.trim();
    const minTemp = parseFloat(newFridgeMinTemp);
    const maxTemp = parseFloat(newFridgeMaxTemp);
    if (!name || isNaN(minTemp) || isNaN(maxTemp)) return;

    const newFridge: FridgeTemplate = {
      id: `fridge-${Date.now()}`,
      location: name,
      expectedMin: minTemp,
      expectedMax: maxTemp
    };

    await fetch(`${API_BASE_URL}/fridges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFridge),
    });

    setShowAddFridgeModal(false);
    setNewFridgeName('');
    fetchData();
  };

  const deleteFridge = async (id: string) => {
    if (window.confirm('Delete this unit? All historical readings for this unit in the table view will be hidden.')) {
      await fetch(`${API_BASE_URL}/fridges/${id}`, {
          method: 'DELETE',
      });
      fetchData();
    }
  };

  const recordedCount = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const dayLog = logs.find(l => l.date === todayStr);
    return dayLog ? dayLog.readings.filter(r => r.reading !== '').length : 0;
  }, [logs]);

  const totalCount = masterFridges.length;
  const progress = totalCount > 0 ? recordedCount / totalCount : 0;

  return (
    <IonPage>
      {/* ... style content omitted for brevity, same as original ... */}
      <style>{`
        .tc-page-root {
          --m3-surface: #FDFCF4;
          --m3-primary: #2D1B14;
          --m3-accent: #D6E8B1;
          --m3-success: #81C784;
          --m3-error: #B3261E;
          --m3-success-bg: #E8F5E9;
          --m3-error-bg: #FFEBEE;
        }

        .tc-page-root .temp-main-view {
          --background: var(--m3-surface);
          display: flex;
          flex-direction: column;
          height: 100vh;
          align-items: center;
          overflow: hidden;
        }

        .tc-page-root .header-espresso-splash {
          background: #2D1B14;
          padding: 20px 24px 30px;
          color: white;
          width: 100%;
          position: relative;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        }

        .tc-page-root .liquid-wave {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 25px;
          fill: #FDFCF4;
          pointer-events: none;
        }

        .tc-page-root .top-bar-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          max-width: 1400px;
          z-index: 10;
        }

        .tc-page-root .brand-logo-wrap {
          display: flex;
          align-items: center; gap: 12px;
        }

        .tc-page-root .logo-graphic-box {
          background: linear-gradient(135deg, #E6BEAE 0%, #D7CCC8 100%);
          width: 34px; height: 34px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          color: #2D1B14; box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        }

        .tc-page-root .logo-text-m3 {
          font-weight: 900; font-size: 1.4rem; letter-spacing: -0.8px;
          color: white; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .tc-page-root .round-btn-m3 {
          width: 36px; height: 36px; border-radius: 50%;
          background: rgba(255, 255, 255, 0.08); color: white;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.1); transition: all 0.2s;
        }

        .tc-page-root .page-header-content {
          margin-top: 12px; display: flex; justify-content: space-between;
          align-items: center; width: 100%; max-width: 1400px; z-index: 10;
          opacity: 0; transform: translateY(10px); transition: all 0.6s ease-out;
        }

        .tc-page-root .page-header-content.visible { opacity: 1; transform: translateY(0); }

        .tc-page-root .page-title-m3 { font-size: 1.4rem; font-weight: 800; margin: 0; color: white; }

        .tc-page-root .pass-rate-indicator {
          background: rgba(255, 255, 255, 0.1); color: #E6BEAE; padding: 4px 14px;
          border-radius: 100px; font-weight: 800; font-size: 0.7rem; display: inline-flex;
          align-items: center; gap: 6px; border: 1px solid rgba(255,255,255,0.1);
        }

        .tc-page-root .pulse-dot {
          width: 6px; height: 6px; border-radius: 50%; background: var(--m3-success);
          box-shadow: 0 0 6px var(--m3-success); animation: m3-pulse-tc 2s infinite;
        }

        @keyframes m3-pulse-tc {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.6; }
          100% { transform: scale(1); opacity: 1; }
        }

        .tc-page-root .main-scroll-content { padding: 16px 0 180px; flex: 1; width: 100%; display: flex; flex-direction: column; align-items: center; overflow-y: auto; }
        .tc-page-root .grid-max-container { width: 100%; max-width: 1400px; padding: 0 16px; }
        .tc-page-root .control-panel-m3 { background: white; border-radius: 20px; padding: 12px; margin-bottom: 16px; box-shadow: 0 4px 15px rgba(45, 27, 20, 0.04); border: 1px solid #E1E3D3; width: 100%; }
        .tc-page-root .week-nav-box { display: flex; align-items: center; justify-content: space-between; background: #F8F5F2; padding: 8px; border-radius: 14px; margin-bottom: 10px; }
        .tc-page-root .nav-btn-arrow { width: 32px; height: 32px; border-radius: 8px; background: white; border: none; color: #2D1B14; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.04); cursor: pointer; }
        .tc-page-root .m3-progress-container { width: 100%; height: 12px; background: white; border: 2px solid #2D1B14; border-radius: 100px; overflow: hidden; position: relative; }
        .tc-page-root .m3-progress-fill { height: 100%; background: #2D1B14; transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
        .tc-page-root .table-viewport-m3 { width: 100%; overflow-x: auto; background: white; border-radius: 20px; border: 1px solid #E1E3D3; box-shadow: 0 4px 15px rgba(45, 27, 20, 0.04); transition: opacity 0.3s ease, transform 0.3s ease; }
        .tc-page-root .table-viewport-m3.sliding { opacity: 0; transform: translateY(10px); }
        .tc-page-root table { width: 100%; border-collapse: collapse; min-width: 800px; table-layout: fixed; }
        .tc-page-root th { background: #FDFCF4; padding: 12px 4px; font-size: 0.7rem; font-weight: 900; color: #2D1B14; border-bottom: 1px solid #E1E3D3; text-transform: uppercase; letter-spacing: 0.5px; text-align: center; width: 90px; }
        .tc-page-root .sticky-unit-name { width: 180px !important; min-width: 180px; position: sticky; left: 0; background: #FFFFFF; z-index: 10; border-right: 1px solid #E1E3D3; padding-left: 16px; text-align: left; }
        .tc-page-root tr:not(:last-child) { border-bottom: 1px solid #F0F0F0; }
        .tc-page-root .cell-input-m3 { width: 100%; border: none; padding: 16px 4px; text-align: center; font-weight: 900; font-size: 1rem; background: transparent; outline: none; transition: all 0.2s; }
        .tc-page-root .cell-input-m3.pass { background: var(--m3-success-bg); color: var(--m3-success); }
        .tc-page-root .cell-input-m3.fail { background: var(--m3-error-bg); color: var(--m3-error); }
        .tc-page-root .cell-input-m3:focus { background: #F3F4E9; box-shadow: inset 0 0 0 2px var(--m3-accent); }

        .tc-page-root .m3-footer-nav { background: #ffffff; height: 75px; display: flex; border-top: 1px solid #E1E3D3; padding-bottom: env(safe-area-inset-bottom); box-shadow: 0 -4px 15px rgba(0,0,0,0.04); width: 100%; justify-content: space-around; position: fixed; bottom: 0; left: 0; right: 0; z-index: 1000; }
        .tc-page-root .nav-link-m3 { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #A1887F; font-size: 0.75rem; font-weight: 800; text-decoration: none; cursor: pointer; }
        .tc-page-root .nav-link-m3.active { color: #2D1B14; }
        .tc-page-root .nav-pill-m3 { padding: 4px 24px; border-radius: 100px; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease; margin-bottom: 2px; width: 64px; height: 32px; }
        .tc-page-root .nav-link-m3.active .nav-pill-m3 { background: #2D1B1412; transform: translateY(-2px); }
        .tc-page-root .nav-link-m3 ion-icon { font-size: 1.4rem; }

        .tc-page-root .fab-menu-container { position: fixed; bottom: 90px; right: 16px; display: flex; flex-direction: column; align-items: center; gap: 12px; z-index: 1600; }
        .tc-page-root .fab-main-m3 { width: 56px; height: 56px; border-radius: 16px; background: var(--m3-primary); color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 20px rgba(45, 27, 20, 0.3); border: none; }
        .tc-page-root .fab-action-m3 { width: 48px; height: 48px; border-radius: 12px; background: white; color: var(--m3-primary); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(45, 27, 20, 0.2); border: 1px solid #E1E3D3; }

        .tc-page-root .m3-input { width: 100%; padding: 16px; border-radius: 12px; background: #F8F5F2; border: 1px solid #E1E3D3; margin-bottom: 16px; font-weight: 700; color: #2D1B14; text-align: center; }
        .tc-page-root .modal-blur-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(5px); z-index: 4000; display: flex; align-items: center; justify-content: center; padding: 24px; }
        .tc-page-root .m3-dialog-sheet { background: white; border-radius: 24px; padding: 24px; width: 100%; max-width: 360px; box-shadow: 0 15px 35px rgba(0,0,0,0.25); }

        .tc-page-root .unit-manage-item {
          display: flex; justify-content: space-between; align-items: center;
          padding: 14px; background: #F8F5F2; border-radius: 14px; margin-bottom: 10px;
        }
        .tc-page-root .delete-btn-m3 { color: var(--m3-error); font-size: 1.3rem; background: none; border: none; cursor: pointer; }
      `}</style>

      <IonContent scrollY={false} className="tc-page-root">
        <div className="temp-main-view">
          <header className="header-espresso-splash">
            <div className="top-bar-nav">
              <div className="brand-logo-wrap">
                <div className="logo-graphic-box"><IonIcon icon={cafeOutline} /></div>
                <h1 className="logo-text-m3">NexusPour</h1>
              </div>
              <IonAvatar style={{ width: '36px', height: '36px', border: '2px solid rgba(255,255,255,0.2)' }}>
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Coffee" alt="User" />
              </IonAvatar>
            </div>

            <div className={`page-header-content ${isLoaded ? 'visible' : ''}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button className="round-btn-m3" onClick={() => history.push('/dashboard')}><IonIcon icon={chevronBackOutline} /></button>
                <h2 className="page-title-m3">Temp Monitor</h2>
              </div>
              <div className="pass-rate-indicator">
                 <div className="pulse-dot"></div>
                 {recordedCount} / {totalCount} Recorded
              </div>
            </div>
            <svg className="liquid-wave" viewBox="0 0 1440 120" preserveAspectRatio="none"><path d="M0,32L60,42.7C120,53,240,75,360,74.7C480,75,600,53,720,48C840,43,960,53,1080,58.7C1200,64,1320,64,1380,64L1440,64L1440,120L1380,120C1320,120,1200,120,1080,120C960,120,840,120,720,120C600,120,480,120,360,120C240,120,120,120,60,120L0,120Z"></path></svg>
          </header>

          <main className="main-scroll-content">
            <div className="grid-max-container">
              <section className="control-panel-m3">
                <div className="week-nav-box">
                  <button className="nav-btn-arrow" onClick={() => changeWeek(-1)}><IonIcon icon={chevronBack} /></button>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 800, color: '#2D1B14', fontSize: '1rem' }}>
                      {new Date(weekDays[0]).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} — {new Date(weekDays[6]).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </div>
                  </div>
                  <button className="nav-btn-arrow" onClick={() => changeWeek(1)}><IonIcon icon={chevronForward} /></button>
                </div>
                <div className="m3-progress-container"><div className="m3-progress-fill" style={{ width: `${progress * 100}%` }}></div></div>
              </section>

              <div className={`table-viewport-m3 ${isTransitioning ? 'sliding' : ''}`}>
                <table>
                  <thead><tr><th className="sticky-unit-name">UNIT</th>{['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((d, i) => (<th key={d}>{d}<br/><span style={{ opacity: 0.6, fontSize: '0.65rem' }}>{weekDays[i].split('-')[2]}/{weekDays[i].split('-')[1]}</span></th>))}</tr></thead>
                  <tbody>
                    {masterFridges.map(mf => (
                      <tr key={mf.id}>
                        <td className="sticky-unit-name">
                          <div style={{ fontWeight: 900, fontSize: '0.9rem', color: '#2D1B14' }}>{mf.location}</div>
                          <div style={{ fontSize: '10px', fontWeight: 700, color: '#8D6E63' }}>{mf.expectedMin}° to {mf.expectedMax}°C</div>
                        </td>
                        {weekDays.map(date => {
                          const pass = isPassing(date, mf.id);
                          return (
                            <td key={date}>
                              <input type="number" className={`cell-input-m3 ${pass === true ? 'pass' : pass === false ? 'fail' : ''}`} value={getReadingValue(date, mf.id)} onChange={(e) => handleReadingChange(date, mf.id, e.target.value)} />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>

        <div className="fab-menu-container">
          {showFabMenu && (
            <>
              <button className="fab-action-m3" onClick={saveToHistory} aria-label="Save to History"><IonIcon icon={saveOutline} /></button>
              <button className="fab-action-m3" onClick={() => {setShowAddFridgeModal(true); setShowFabMenu(false);}} aria-label="Add Unit"><IonIcon icon={addOutline} /></button>
              <button className="fab-action-m3" onClick={() => {setShowManageUnitsModal(true); setShowFabMenu(false);}} aria-label="Manage Units"><IonIcon icon={constructOutline} /></button>
            </>
          )}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="fab-main-m3" onClick={fetchData} aria-label="Refresh Data"><IonIcon icon={refreshOutline} /></button>
            <button className="fab-main-m3" onClick={() => setShowFabMenu(!showFabMenu)}><IonIcon icon={showFabMenu ? closeOutline : settingsOutline} /><IonRippleEffect /></button>
          </div>
        </div>
      </IonContent>
      
      <nav className="m3-footer-nav">
        <div className="nav-link-m3" onClick={() => history.push('/dashboard')}><div className="nav-pill-m3"><IonIcon icon={home} /></div><span>Home</span></div>
        <div className="nav-link-m3 active"><div className="nav-pill-m3"><IonIcon icon={thermometerOutline} /></div><span>Temps</span></div>
        <div className="nav-link-m3" onClick={() => history.push('/checklist')}><div className="nav-pill-m3"><IonIcon icon={clipboardOutline} /></div><span>Checks</span></div>
        <div className="nav-link-m3" onClick={() => history.push('/inventory')}><div className="nav-pill-m3"><IonIcon icon={albumsOutline} /></div><span>Stock</span></div>
        <div className="nav-link-m3" onClick={() => history.push('/allergens')}><div className="nav-pill-m3"><IonIcon icon={warningOutline} /></div><span>Allergens</span></div>
      </nav>

      {showAddFridgeModal && (
        <div className="modal-blur-overlay" onClick={() => setShowAddFridgeModal(false)}>
          <div className="m3-dialog-sheet" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontWeight: 900, margin: '0 0 24px', fontSize: '1.8rem', textAlign: 'center', color: '#2D1B14' }}>Add New Unit</h2>
            <input placeholder="Equipment Name" value={newFridgeName} onChange={e => setNewFridgeName(e.target.value)} className="m3-input" />
            <div style={{ display: 'flex', gap: '16px' }}>
              <input type="number" value={newFridgeMinTemp} onChange={e => setNewFridgeMinTemp(e.target.value)} className="m3-input" placeholder="Min Temp" />
              <input type="number" value={newFridgeMaxTemp} onChange={e => setNewFridgeMaxTemp(e.target.value)} className="m3-input" placeholder="Max Temp" />
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
              <button style={{ flex: 1, height: '52px', borderRadius: '14px', border: 'none', fontWeight: 800, background: '#F8F5F2', color: '#2D1B14' }} onClick={() => setShowAddFridgeModal(false)}>CANCEL</button>
              <button style={{ flex: 1, height: '52px', borderRadius: '14px', border: 'none', fontWeight: 800, background: '#2D1B14', color: 'white' }} onClick={addFridge}>CREATE</button>
            </div>
          </div>
        </div>
      )}

      {showManageUnitsModal && (
        <div className="modal-blur-overlay" onClick={() => setShowManageUnitsModal(false)}>
          <div className="m3-dialog-sheet" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <h3 style={{ fontWeight: 900, margin: 0, fontSize: '1.8rem' }}>Active Units</h3>
              <button className="round-btn-m3" style={{ background: '#F8F5F2', color: '#2D1B14', border: 'none' }} onClick={() => setShowManageUnitsModal(false)}><IonIcon icon={closeOutline} /></button>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {masterFridges.map(f => (
                <div key={f.id} className="unit-manage-item">
                  <div>
                    <div style={{ fontWeight: 900, color: '#2D1B14' }}>{f.location}</div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#8D6E63' }}>{f.expectedMin}° to {f.expectedMax}°C</div>
                  </div>
                  <button className="delete-btn-m3" onClick={() => deleteFridge(f.id)}><IonIcon icon={trashOutline} /></button>
                </div>
              ))}
            </div>
            <button style={{ width: '100%', height: '56px', borderRadius: '18px', border: 'none', fontWeight: 900, background: '#2D1B14', color: 'white', marginTop: '24px' }} onClick={() => setShowManageUnitsModal(false)}>DONE</button>
          </div>
        </div>
      )}

      <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)} message="History updated." duration={2000} color="success" icon={checkmarkDoneOutline} position="top" />
    </IonPage>
  );
};

export default TempCheck;
