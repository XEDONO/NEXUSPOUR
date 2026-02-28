import React, { useState, useEffect, useMemo } from 'react';
import {
  IonContent,
  IonPage,
  IonIcon,
  IonAvatar,
  IonRippleEffect,
  IonProgressBar,
  IonBadge,
  IonButton
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
  warningOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';

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

const MASTER_FRIDGES_KEY = 'master_fridges_v1';
const TEMP_LOGS_KEY = 'temp_logs_v2';
const RESERVED_KEY = 'cafeops_reserved_archives_v1';

const STORAGE_KEYS = [
  'temp_logs_v2', 'checklist', 'checklist_logs_v1',
  'stock_list', 'inventory_logs_v1', 'cafe_sections_v1', 'master_fridges_v1', 'allergens_map_v1'
];

const DEFAULT_FRIDGES: FridgeTemplate[] = [
  { id: 'fridge-1', location: 'Main Fridge', expectedMin: 2, expectedMax: 5 },
  { id: 'fridge-2', location: 'Milk Fridge', expectedMin: 2, expectedMax: 5 },
  { id: 'fridge-3', location: 'Display Fridge', expectedMin: 2, expectedMax: 5 },
  { id: 'freezer-a', location: 'Main Freezer', expectedMin: -20, expectedMax: -15 },
  { id: 'freezer-b', location: 'Ice Cream Freezer', expectedMin: -20, expectedMax: -15 },
];

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
  const [logs, setLogs] = useState<DailyLog[]>(() => {
    try { return JSON.parse(localStorage.getItem(TEMP_LOGS_KEY) || '[]'); } catch { return []; }
  });
  const [masterFridges, setMasterFridges] = useState<FridgeTemplate[]>(() => {
    try {
      const stored = localStorage.getItem(MASTER_FRIDGES_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_FRIDGES;
    } catch {
      return DEFAULT_FRIDGES;
    }
  });

  const [showAddFridgeModal, setShowAddFridgeModal] = useState(false);
  const [showManageUnitsModal, setShowManageUnitsModal] = useState(false);
  const [showAdminSidebar, setShowAdminSidebar] = useState(false);
  const [newFridgeName, setNewFridgeName] = useState('');
  const [newFridgeMinTemp, setNewFridgeMinTemp] = useState('2');
  const [newFridgeMaxTemp, setNewFridgeMaxTemp] = useState('5');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 150);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem(MASTER_FRIDGES_KEY, JSON.stringify(masterFridges));
  }, [masterFridges]);

  useEffect(() => {
    localStorage.setItem(TEMP_LOGS_KEY, JSON.stringify(logs));
  }, [logs]);

  const weekDays = useMemo(() => getWeekDays(currentWeekStart), [currentWeekStart]);

  const handleReadingChange = (date: string, fridgeId: string, value: string) => {
    const fridge = masterFridges.find(f => f.id === fridgeId);
    if (!fridge) return;

    const temp = parseFloat(value);
    const pass = !isNaN(temp) && temp >= fridge.expectedMin && temp <= fridge.expectedMax;

    setLogs(prevLogs => {
      const newLogs = [...prevLogs];
      let dayLogIndex = newLogs.findIndex(l => l.date === date);

      if (dayLogIndex === -1) {
        newLogs.push({
          date,
          readings: masterFridges.map(mf => ({
            id: mf.id,
            location: mf.location,
            expectedMin: mf.expectedMin,
            expectedMax: mf.expectedMax,
            reading: mf.id === fridgeId ? value : '',
            timestamp: date,
            pass: mf.id === fridgeId ? pass : false
          }))
        });
      } else {
        const dayLog = { ...newLogs[dayLogIndex] };
        const updatedReadings = [...dayLog.readings];
        const readingIndex = updatedReadings.findIndex(r => r.id === fridgeId);

        if (readingIndex === -1) {
           updatedReadings.push({
             id: fridge.id,
             location: fridge.location,
             expectedMin: fridge.expectedMin,
             expectedMax: fridge.expectedMax,
             reading: value,
             timestamp: date,
             pass
           });
        } else {
           updatedReadings[readingIndex] = {
             ...updatedReadings[readingIndex],
             reading: value,
             pass
           };
        }
        dayLog.readings = updatedReadings;
        newLogs[dayLogIndex] = dayLog;
      }
      return newLogs;
    });
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

  const addFridge = () => {
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

    setMasterFridges([...masterFridges, newFridge]);
    setNewFridgeName('');
    setShowAddFridgeModal(false);
  };

  const deleteFridge = (id: string) => {
    if (window.confirm('Delete this unit? All historical readings for this unit in the table view will be hidden.')) {
      setMasterFridges(masterFridges.filter(f => f.id !== id));
    }
  };

  const saveAndReserve = () => {
    localStorage.setItem(TEMP_LOGS_KEY, JSON.stringify(logs));

    const allData: Record<string, any> = {};
    STORAGE_KEYS.forEach(key => {
      const value = localStorage.getItem(key);
      allData[key] = value ? JSON.parse(value) : null;
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const archivesString = localStorage.getItem(RESERVED_KEY);
    const archives = archivesString ? JSON.parse(archivesString) : [];

    const newArchive = {
      name: `Weekly Temp Backup (${timestamp})`,
      data: allData,
      date: new Date().toLocaleString()
    };

    localStorage.setItem(RESERVED_KEY, JSON.stringify([newArchive, ...archives].slice(0, 15)));

    const header = ['Unit', 'Range', ...weekDays].join(',');
    const rows = masterFridges.map(mf => {
      const range = `${mf.expectedMin}-${mf.expectedMax}`;
      const values = weekDays.map(date => getReadingValue(date, mf.id) || 'N/A');
      return [`"${mf.location}"`, `"${range}"`, ...values].join(',');
    });

    const csvContent = [header, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Weekly-Temps-${weekDays[0]}-to-${weekDays[6]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    alert('Data secured, reserved in Archive, and exported.');
  };

  const recordedCount = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const dayLog = logs.find(l => l.date === todayStr);
    return dayLog ? dayLog.readings.filter(r => r.reading !== '').length : 0;
  }, [logs]);

  const totalCount = masterFridges.length;
  const progress = totalCount > 0 ? recordedCount / totalCount : 0;

  return (
    <IonPage className="tc-page-root">
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
          align-items: center;
          gap: 12px;
        }

        .tc-page-root .logo-graphic-box {
          background: linear-gradient(135deg, #E6BEAE 0%, #D7CCC8 100%);
          width: 34px;
          height: 34px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #2D1B14;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        }

        .tc-page-root .logo-text-m3 {
          font-weight: 900;
          font-size: 1.4rem;
          letter-spacing: -0.8px;
          color: white;
          margin: 0;
          text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .tc-page-root .action-row-m3 {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .tc-page-root .round-btn-m3 {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.08);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.2s;
          position: relative;
        }

        .tc-page-root .round-btn-m3:active { transform: scale(0.9); background: rgba(255,255,255,0.15); }

        .tc-page-root .page-header-content {
          margin-top: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          max-width: 1400px;
          z-index: 10;
          opacity: 0;
          transform: translateY(10px);
          transition: all 0.6s ease-out;
        }

        .tc-page-root .page-header-content.visible { opacity: 1; transform: translateY(0); }

        .tc-page-root .header-title-box {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .tc-page-root .page-title-m3 {
          font-size: 1.4rem;
          font-weight: 800;
          margin: 0;
          color: white;
        }

        .tc-page-root .pass-rate-indicator {
          background: rgba(255, 255, 255, 0.1);
          color: #E6BEAE;
          padding: 4px 14px;
          border-radius: 100px;
          font-weight: 800;
          font-size: 0.7rem;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 1px solid rgba(255,255,255,0.1);
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

        .tc-page-root .main-scroll-content {
          padding: 16px 0 120px;
          flex: 1;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          overflow-y: auto;
        }

        .tc-page-root .grid-max-container {
          width: 100%;
          max-width: 1400px;
          padding: 0 16px;
        }

        .tc-page-root .control-panel-m3 {
          background: white;
          border-radius: 20px;
          padding: 12px;
          margin-bottom: 16px;
          box-shadow: 0 4px 15px rgba(45, 27, 20, 0.04);
          border: 1px solid #E1E3D3;
          width: 100%;
        }

        .tc-page-root .week-nav-box {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #F8F5F2;
          padding: 8px;
          border-radius: 14px;
          margin-bottom: 10px;
        }

        .tc-page-root .nav-btn-arrow {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: white;
          border: none;
          color: #2D1B14;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.04);
          cursor: pointer;
        }

        .tc-page-root .m3-progress-container {
          width: 100%;
          height: 12px;
          background: white;
          border: 2px solid #2D1B14;
          border-radius: 100px;
          overflow: hidden;
          position: relative;
        }

        .tc-page-root .m3-progress-fill {
          height: 100%;
          background: #2D1B14;
          transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .tc-page-root .table-viewport-m3 {
          width: 100%;
          overflow-x: auto;
          background: white;
          border-radius: 20px;
          border: 1px solid #E1E3D3;
          box-shadow: 0 4px 15px rgba(45, 27, 20, 0.04);
          transition: opacity 0.3s ease, transform 0.3s ease;
        }

        .tc-page-root .table-viewport-m3.sliding { opacity: 0; transform: translateY(10px); }

        .tc-page-root table { width: 100%; border-collapse: collapse; min-width: 800px; table-layout: fixed; }
        .tc-page-root th {
          background: #FDFCF4; padding: 12px 4px; font-size: 0.7rem; font-weight: 900;
          color: #2D1B14; border-bottom: 1px solid #E1E3D3; text-transform: uppercase;
          letter-spacing: 0.5px; text-align: center;
          width: 90px;
        }

        .tc-page-root .sticky-unit-name {
          width: 180px !important; min-width: 180px; position: sticky; left: 0; background: #FFFFFF;
          z-index: 10; border-right: 1px solid #E1E3D3; padding-left: 16px; text-align: left;
        }
        
        .tc-page-root tr:not(:last-child) {
          border-bottom: 1px solid #F0F0F0;
        }

        .tc-page-root .cell-input-m3 {
          width: 100%; border: none; padding: 16px 4px; text-align: center;
          font-weight: 900; font-size: 1rem; background: transparent;
          outline: none; transition: all 0.2s;
        }

        .tc-page-root .cell-input-m3.pass { background: var(--m3-success-bg); color: var(--m3-success); }
        .tc-page-root .cell-input-m3.fail { background: var(--m3-error-bg); color: var(--m3-error); }
        .tc-page-root .cell-input-m3:focus { background: #F3F4E9; box-shadow: inset 0 0 0 2px var(--m3-accent); }

        .tc-page-root .m3-footer-nav {
          background: #ffffff;
          height: 75px;
          display: flex;
          border-top: 1px solid #E1E3D3;
          padding-bottom: env(safe-area-inset-bottom);
          box-shadow: 0 -4px 15px rgba(0,0,0,0.04);
          width: 100%;
          justify-content: space-around;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 1000;
        }

        .tc-page-root .nav-link-m3 {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #A1887F;
          font-size: 0.7rem;
          font-weight: 800;
          text-decoration: none;
          cursor: pointer;
        }

        .tc-page-root .nav-link-m3.active { color: #2D1B14; }

        .tc-page-root .nav-pill-m3 {
          padding: 4px 24px;
          border-radius: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          margin-bottom: 2px;
          width: 64px;
          height: 32px;
        }

        .tc-page-root .nav-link-m3.active .nav-pill-m3 {
          background: #2D1B1412;
          transform: translateY(-2px);
        }

        .tc-page-root .nav-link-m3 ion-icon { font-size: 1.4rem; }

        .tc-page-root .fab-save-m3 {
          position: fixed; bottom: 90px; right: 16px; width: 56px; height: 56px; border-radius: 16px;
          background: #2D1B14; color: white; display: flex; align-items: center; justify-content: center;
          box-shadow: 0 8px 20px rgba(45, 27, 20, 0.3); z-index: 1500; border: none;
        }

        .tc-page-root .fab-save-m3:active { transform: scale(0.92); }

        .tc-page-root .fab-refresh-m3 {
          position: fixed; bottom: 90px; right: 80px; width: 56px; height: 56px; border-radius: 16px;
          background: white; color: #2D1B14; display: flex; align-items: center; justify-content: center;
          box-shadow: 0 8px 20px rgba(45, 27, 20, 0.1); z-index: 1500; border: 1px solid #E1E3D3;
        }

        .tc-page-root .fab-refresh-m3:active { transform: scale(0.92); background: #F8F5F2; }

        .tc-page-root .sidebar-m3 {
          position: fixed; top: 0; right: -100%; width: 100%; height: 100%; background: white;
          z-index: 3000; transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1); padding: 24px;
          display: flex; flex-direction: column; box-shadow: -15px 0 50px rgba(0,0,0,0.2); 
          transform: translateX(100%);
        }
        .tc-page-root .sidebar-m3.active { transform: translateX(0); }
        .tc-page-root .scrim-m3 { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(8px); z-index: 2500; opacity: 0; pointer-events: none; transition: opacity 0.5s ease; }
        .tc-page-root .scrim-m3.active { opacity: 1; pointer-events: auto; }

        .tc-page-root .unit-manage-item {
          display: flex; justify-content: space-between; align-items: center;
          padding: 14px; background: #F8F5F2; border-radius: 14px; margin-bottom: 10px;
        }
        .tc-page-root .delete-btn-m3 { color: var(--m3-error); font-size: 1.3rem; background: none; border: none; cursor: pointer; }

        .tc-page-root .modal-blur-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(5px);
          z-index: 4000; display: flex; align-items: center; justify-content: center; padding: 24px;
        }
        .tc-page-root .m3-dialog-sheet {
          background: white; border-radius: 24px; padding: 24px; width: 100%; max-width: 360px;
          box-shadow: 0 15px 35px rgba(0,0,0,0.25);
        }
        
        @media (min-width: 768px) {
          .tc-page-root .sidebar-m3 {
            width: 340px;
            border-radius: 40px 0 0 40px;
          }
        }
      `}</style>

      <IonContent scrollY={false}>
        <div className="temp-main-view">
          <header className="header-espresso-splash">
            <div className="top-bar-nav">
              <div className="brand-logo-wrap">
                <div className="logo-graphic-box">
                  <IonIcon icon={cafeOutline} />
                </div>
                <h1 className="logo-text-m3">NexusPour</h1>
              </div>
              <div className="action-row-m3">
                <button className="round-btn-m3" onClick={() => setShowAdminSidebar(true)} aria-label="Settings">
                  <IonIcon icon={settingsOutline} style={{ fontSize: '1.2rem' }} />
                </button>
                <IonAvatar style={{ width: '36px', height: '36px', border: '2px solid rgba(255,255,255,0.2)', marginLeft: '4px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Coffee" alt="User" />
                </IonAvatar>
              </div>
            </div>

            <div className={`page-header-content ${isLoaded ? 'visible' : ''}`}>
              <div className="header-title-box">
                <button className="round-btn-m3" onClick={() => history.goBack()} aria-label="Go back">
                  <IonIcon icon={chevronBackOutline} style={{ fontSize: '1.1rem' }} />
                </button>
                <h2 className="page-title-m3">Temp Monitor</h2>
              </div>

              <div className="pass-rate-indicator">
                 <div className="pulse-dot"></div>
                 {recordedCount} / {totalCount} Recorded
              </div>
            </div>

            <svg className="liquid-wave" viewBox="0 0 1440 120" preserveAspectRatio="none">
              <path d="M0,32L60,42.7C120,53,240,75,360,74.7C480,75,600,53,720,48C840,43,960,53,1080,58.7C1200,64,1320,64,1380,64L1440,64L1440,120L1380,120C1320,120,1200,120,1080,120C960,120,840,120,720,120C600,120,480,120,360,120C240,120,120,120,60,120L0,120Z"></path>
            </svg>
          </header>

          <main className="main-scroll-content">
            <div className="grid-max-container">
              <section className="control-panel-m3">
                <div className="week-nav-box">
                  <button className="nav-btn-arrow" onClick={() => changeWeek(-1)} aria-label="Previous week"><IonIcon icon={chevronBack} /></button>
                  <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => (document.getElementById('hidden-date-picker') as HTMLInputElement)?.showPicker()}>
                    <span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#8D6E63', letterSpacing: '1px', display: 'block', marginBottom: '2px' }}>SHIFT WINDOW</span>
                    <div style={{ fontWeight: 800, color: '#2D1B14', fontSize: '1rem' }}>
                      {new Date(weekDays[0]).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} — {new Date(weekDays[6]).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </div>
                    <input id="hidden-date-picker" type="date" style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }} onChange={(e) => setCurrentWeekStart(getStartOfWeek(new Date(e.target.value)))} />
                  </div>
                  <button className="nav-btn-arrow" onClick={() => changeWeek(1)} aria-label="Next week"><IonIcon icon={chevronForward} /></button>
                </div>
                <div className="m3-progress-container">
                  <div className="m3-progress-fill" style={{ width: `${progress * 100}%` }}></div>
                </div>
              </section>

              <div className={`table-viewport-m3 ${isTransitioning ? 'sliding' : ''}`}>
                <table>
                  <thead>
                    <tr>
                      <th className="sticky-unit-name">UNIT</th>
                      {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((d, i) => (
                        <th key={d}>{d}<br/><span style={{ opacity: 0.6, fontSize: '0.65rem' }}>{weekDays[i].split('-')[2]}/{weekDays[i].split('-')[1]}</span></th>
                      ))}
                    </tr>
                  </thead>
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
                              <input
                                type="number"
                                placeholder="-"
                                className={`cell-input-m3 ${pass === true ? 'pass' : pass === false ? 'fail' : ''}`}
                                value={getReadingValue(date, mf.id)}
                                onChange={(e) => handleReadingChange(date, mf.id, e.target.value)}
                              />
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

        <button className="fab-refresh-m3 ion-activatable relative" onClick={() => window.location.reload()} aria-label="Refresh Page">
          <IonIcon icon={refreshOutline} style={{ fontSize: '1.8rem' }} />
          <IonRippleEffect />
        </button>

        <button className="fab-save-m3 ion-activatable relative" onClick={saveAndReserve} aria-label="Save and Export">
          <IonIcon icon={saveOutline} style={{ fontSize: '2rem' }} />
          <IonRippleEffect />
        </button>
      </IonContent>

      <nav className="m3-footer-nav">
        <div className="nav-link-m3" onClick={() => history.push('/dashboard')}>
          <div className="nav-pill-m3"><IonIcon icon={home} /></div>
          <span>Home</span>
        </div>
        <div className="nav-link-m3 active">
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

      <div className={`scrim-m3 ${showAdminSidebar ? 'active' : ''}`} onClick={() => setShowAdminSidebar(false)} />
      <aside className={`sidebar-m3 ${showAdminSidebar ? 'active' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontWeight: 900, margin: 0, fontSize: '1.8rem', color: '#2D1B14' }}>Settings</h2>
          <button className="round-btn-m3" style={{ background: '#F8F5F2', color: '#2D1B14', border: 'none' }} onClick={() => setShowAdminSidebar(false)}>
            <IonIcon icon={closeOutline} style={{ fontSize: '2rem' }} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div className="m3-card-wide" style={{ padding: '20px', borderRadius: '20px', opacity: 1, transform: 'none', margin: 0, boxShadow: 'none', background: '#F8F5F2', display: 'flex', alignItems: 'center', gap: '15px' }} onClick={() => { history.push('/history'); setShowAdminSidebar(false); }}>
            <IonIcon icon={timeOutline} style={{ fontSize: '1.8rem', color: '#2D1B14' }} />
            <span style={{ fontWeight: 800, color: '#2D1B14' }}>Historical Logs</span>
          </div>
          <div className="m3-card-wide" style={{ padding: '20px', borderRadius: '20px', opacity: 1, transform: 'none', margin: 0, boxShadow: 'none', background: '#F8F5F2', display: 'flex', alignItems: 'center', gap: '15px' }} onClick={() => { setShowAdminSidebar(false); setShowManageUnitsModal(true); }}>
            <IonIcon icon={constructOutline} style={{ fontSize: '1.8rem', color: '#2D1B14' }} />
            <span style={{ fontWeight: 800, color: '#2D1B14' }}>Manage Units</span>
          </div>
          <div className="m3-card-wide" style={{ padding: '20px', borderRadius: '20px', opacity: 1, transform: 'none', margin: 0, boxShadow: 'none', background: '#F8F5F2', display: 'flex', alignItems: 'center', gap: '15px' }} onClick={() => { setShowAdminSidebar(false); setShowAddFridgeModal(true); }}>
            <IonIcon icon={addOutline} style={{ fontSize: '1.8rem', color: '#2D1B14' }} />
            <span style={{ fontWeight: 800, color: '#2D1B14' }}>Add New Unit</span>
          </div>
        </div>
      </aside>

      {showAddFridgeModal && (
        <div className="modal-blur-overlay" onClick={() => setShowAddFridgeModal(false)}>
          <div className="m3-dialog-sheet" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontWeight: 900, margin: '0 0 24px', fontSize: '1.8rem', textAlign: 'center', color: '#000000' }}>Setup Unit</h2>
            <input placeholder="Equipment Name" value={newFridgeName} onChange={e => setNewFridgeName(e.target.value)}
                   style={{ width: '100%', padding: '16px', borderRadius: '16px', background: '#000000', border: 'none', marginBottom: '16px', fontWeight: 700 }} />
            <div style={{ display: 'flex', gap: '16px' }}>
              <input type="number" value={newFridgeMinTemp} onChange={e => setNewFridgeMinTemp(e.target.value)}
                     style={{ width: '100%', padding: '12px', borderRadius: '16px', background: '#000000', border: 'none', textAlign: 'center', fontWeight: 700 }} placeholder="Min" />
              <input type="number" value={newFridgeMaxTemp} onChange={e => setNewFridgeMaxTemp(e.target.value)}
                     style={{ width: '100%', padding: '12px', borderRadius: '16px', background: '#000000', border: 'none', textAlign: 'center', fontWeight: 700 }} placeholder="Max" />
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
              <button style={{ flex: 1, height: '52px', borderRadius: '14px', border: 'none', fontWeight: 800, background: '#FF0000' }} onClick={() => setShowAddFridgeModal(false)}>CANCEL</button>
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
    </IonPage>
  );
};

export default TempCheck;

 
