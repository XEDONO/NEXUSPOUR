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
  IonToast,
  IonModal
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
import { db } from '../firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { useAuth } from '../utils/useAuth';

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
  const { isStaff, isAdmin } = useAuth();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getStartOfWeek(new Date()));
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [masterFridges, setMasterFridges] = useState<FridgeTemplate[]>([]);
  const [rawLogs, setRawLogs] = useState<any[]>([]);

  const [showAddFridgeModal, setShowAddFridgeModal] = useState(false);
  const [showManageUnitsModal, setShowManageUnitsModal] = useState(false);
  const [newFridgeName, setNewFridgeName] = useState('');
  const [newFridgeMinTemp, setNewFridgeMinTemp] = useState('2');
  const [newFridgeMaxTemp, setNewFridgeMaxTemp] = useState('5');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [showToast, setShowToast] = useState({ show: false, message: '', color: 'success' });

  useEffect(() => {
    const unsubFridges = onSnapshot(collection(db, 'fridges'), (snapshot) => {
      const fridgesData: FridgeTemplate[] = snapshot.docs.map(docSnap => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          location: d.location || '',
          expectedMin: Number(d.expectedMin ?? 2),
          expectedMax: Number(d.expectedMax ?? 5)
        };
      });
      setMasterFridges(fridgesData);
    }, (err) => console.warn('Firestore fridges error:', err));

    const unsubLogs = onSnapshot(collection(db, 'temp_logs'), (snapshot) => {
      const logsData = snapshot.docs.map(docSnap => docSnap.data());
      setRawLogs(logsData);
    }, (err) => console.warn('Firestore temp_logs error:', err));

    setIsLoaded(true);

    return () => {
      unsubFridges();
      unsubLogs();
    };
  }, []);

  useEffect(() => {
    const dailyLogs = rawLogs.reduce((acc: DailyLog[], log: any) => {
      let dayLog = acc.find(l => l.date === log.date);
      if (!dayLog) {
        dayLog = { date: log.date, readings: [] };
        acc.push(dayLog);
      }
      const fridge = masterFridges.find((f: FridgeTemplate) => f.id === log.fridge_id);
      if (fridge) {
        dayLog.readings.push({
          id: fridge.id,
          location: fridge.location,
          expectedMin: fridge.expectedMin,
          expectedMax: fridge.expectedMax,
          reading: log.reading || '',
          timestamp: log.date,
          pass: !!log.pass
        });
      }
      return acc;
    }, []);

    setLogs(dailyLogs);
  }, [rawLogs, masterFridges]);

  const weekDays = useMemo(() => getWeekDays(currentWeekStart), [currentWeekStart]);

  const handleReadingChange = async (date: string, fridgeId: string, value: string) => {
    const fridge = masterFridges.find(f => f.id === fridgeId);
    if (!fridge) return;

    const temp = parseFloat(value);
    const pass = !isNaN(temp) && temp >= fridge.expectedMin && temp <= fridge.expectedMax;

    try {
      const logDocId = `${date}_${fridgeId}`;
      await setDoc(doc(db, 'temp_logs', logDocId), {
        date,
        fridge_id: fridgeId,
        reading: value,
        pass
      }, { merge: true });
    } catch (err) {
      console.error('Error saving temperature log in Firestore:', err);
    }
  };

  const saveToHistory = async () => {
    setShowToast({ show: true, message: 'History updated.', color: 'success' });
  };

  const fetchData = async () => {
    try {
      const fridgesSnap = await getDocs(collection(db, 'fridges'));
      setMasterFridges(fridgesSnap.docs.map(d => ({
        id: d.id,
        location: d.data().location || '',
        expectedMin: Number(d.data().expectedMin ?? 2),
        expectedMax: Number(d.data().expectedMax ?? 5)
      })));
      const logsSnap = await getDocs(collection(db, 'temp_logs'));
      setRawLogs(logsSnap.docs.map(d => d.data()));
      setShowToast({ show: true, message: 'Data synced.', color: 'success' });
    } catch (e: any) {
      console.warn('Sync error:', e);
    }
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
    if (isStaff) {
      alert("Access Blocked: Managing fridge units requires Admin / Manager role.");
      return;
    }
    const name = newFridgeName.trim();
    const minTemp = parseFloat(newFridgeMinTemp);
    const maxTemp = parseFloat(newFridgeMaxTemp);

    if (!name || isNaN(minTemp) || isNaN(maxTemp)) {
      setShowToast({ show: true, message: 'Please enter valid name and temperatures.', color: 'danger' });
      return;
    }

    setIsAdding(true);
    const fridgeId = `fridge-${Date.now()}`;
    const newFridge: FridgeTemplate = {
      id: fridgeId, 
      location: name,
      expectedMin: minTemp,
      expectedMax: maxTemp
    };

    try {
      await setDoc(doc(db, 'fridges', fridgeId), newFridge);
      setShowAddFridgeModal(false);
      setNewFridgeName('');
      setNewFridgeMinTemp('2'); 
      setNewFridgeMaxTemp('5'); 
      setShowToast({ show: true, message: 'New unit added successfully!', color: 'success' });
    } catch (error: any) {
      console.error("Error adding fridge to Firestore:", error);
      setShowToast({ show: true, message: `Error adding unit: ${error.message}`, color: 'danger' });
    } finally {
      setIsAdding(false);
    }
  };

  const deleteFridge = async (id: string) => {
    if (isStaff) {
      alert("Access Blocked: Managing fridge units requires Admin / Manager role.");
      return;
    }
    if (window.confirm('Delete this unit? All historical readings for this unit in the table view will be hidden.')) {
      try {
        await deleteDoc(doc(db, 'fridges', id));
      } catch (err) {
        console.error('Error deleting fridge from Firestore:', err);
      }
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
    <IonPage className="tc-page-root">
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

        .tc-page-root .m3-input { width: 100%; padding: 16px; border-radius: 16px; background: #FDFCF4; border: 2px solid #E1E3D3; margin-bottom: 16px; font-weight: 700; color: #2D1B14; text-align: center; transition: border-color 0.2s; }
        .tc-page-root .m3-input:focus { outline: none; border-color: var(--m3-primary); }

        .tc-page-root .unit-manage-item {
          display: flex; justify-content: space-between; align-items: center;
          padding: 14px; background: #F8F5F2; border-radius: 14px; margin-bottom: 10px;
        }
        .tc-page-root .delete-btn-m3 { color: var(--m3-error); font-size: 1.3rem; background: none; border: none; cursor: pointer; }

        ion-modal.sheet-modal::part(backdrop) {
            background: rgba(45, 27, 20, 0.4);
            -webkit-backdrop-filter: blur(8px);
            backdrop-filter: blur(8px);
        }
        ion-modal.sheet-modal {
            --background: transparent;
            --box-shadow: none;
        }
        .m3-dialog-sheet {
            background: #FDFCF4; /* --m3-surface */
            border-radius: 28px;
            padding: 24px;
            width: 100%;
            max-width: 380px;
            box-shadow: 0 10px 40px rgba(45, 27, 20, 0.2);
            border: 1px solid rgba(45, 27, 20, 0.1);
        }
        .modal-header-m3 { text-align: center; margin-bottom: 24px; }
        .modal-icon-m3 { width: 56px; height: 56px; background: #F8F5F2; border-radius: 18px; display: inline-flex; align-items: center; justify-content: center; margin: 0 auto 16px; color: #2D1B14; border: 1px solid #E1E3D3; }
        .modal-icon-m3 ion-icon { font-size: 1.8rem; }
        .modal-title-m3 { margin: 0; font-weight: 900; color: #2D1B14; font-size: 1.6rem; }
        .modal-subtitle-m3 { margin: 4px 0 0; color: #8D6E63; font-weight: 700; font-size: 0.85rem; }
        .m3-button-group { display: flex; gap: 12px; margin-top: 24px; }
        .m3-button { flex: 1; height: 52px; border-radius: 16px; border: none; font-weight: 800; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; }
        .m3-button-primary { background: #2D1B14; color: white; box-shadow: 0 4px 15px rgba(45, 27, 20, 0.2); }
        .m3-button-primary:active { transform: translateY(1px); box-shadow: 0 2px 10px rgba(45, 27, 20, 0.2); }
        .m3-button-secondary { background: #F8F5F2; color: #2D1B14; border: 1px solid #E1E3D3; }
        .m3-button-secondary:active { background: #E6E1DC; }
        .m3-button:disabled { opacity: 0.5; cursor: not-allowed; filter: grayscale(1); pointer-events: none; }
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
              <button className="fab-action-m3" onClick={() => { if (isStaff) { alert("Access Blocked: Managing fridge units requires Admin / Manager role."); } else { setShowAddFridgeModal(true); setShowFabMenu(false); } }} aria-label="Add Unit"><IonIcon icon={addOutline} /></button>
              <button className="fab-action-m3" onClick={() => { if (isStaff) { alert("Access Blocked: Managing fridge units requires Admin / Manager role."); } else { setShowManageUnitsModal(true); setShowFabMenu(false); } }} aria-label="Manage Units"><IonIcon icon={constructOutline} /></button>
            </>
          )}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="fab-main-m3" onClick={fetchData} aria-label="Refresh Data"><IonIcon icon={refreshOutline} /></button>
            <button className="fab-main-m3" onClick={() => setShowFabMenu(!showFabMenu)}><IonIcon icon={showFabMenu ? closeOutline : settingsOutline} /><IonRippleEffect /></button>
          </div>
        </div>
      </IonContent>
      
      {/*
        IonModal components should be placed outside the main content flow,
        typically as direct children of IonPage, to ensure they render correctly
        and are not affected by parent styling or overflow properties.
      */}
      <nav className="m3-footer-nav">
        <div className="nav-link-m3" onClick={() => history.push('/dashboard')}><div className="nav-pill-m3"><IonIcon icon={home} /></div><span>Home</span></div>
        <div className="nav-link-m3 active"><div className="nav-pill-m3"><IonIcon icon={thermometerOutline} /></div><span>Temps</span></div>
        <div className="nav-link-m3" onClick={() => history.push('/checklist')}><div className="nav-pill-m3"><IonIcon icon={clipboardOutline} /></div><span>Checks</span></div>
        <div className="nav-link-m3" onClick={() => history.push('/inventory')}><div className="nav-pill-m3"><IonIcon icon={albumsOutline} /></div><span>Stock</span></div>
        <div className="nav-link-m3" onClick={() => history.push('/allergens')}><div className="nav-pill-m3"><IonIcon icon={warningOutline} /></div><span>Allergens</span></div>
      </nav>

      <IonModal
        isOpen={showAddFridgeModal}
        onDidDismiss={() => setShowAddFridgeModal(false)}
        className="sheet-modal"
        backdropDismiss={true}
      >
        <div className="m3-dialog-sheet" onClick={e => e.stopPropagation()}>
          <header className="modal-header-m3">
              <div className="modal-icon-m3">
                  <IonIcon icon={addOutline} />
              </div>
              <h3 className="modal-title-m3">Add New Unit</h3>
              <p className="modal-subtitle-m3">Define a new fridge or freezer to monitor.</p>
          </header>
          <input placeholder="Equipment Name" value={newFridgeName} onChange={e => setNewFridgeName(e.target.value)} className="m3-input" autoFocus />
          <div style={{ display: 'flex', gap: '16px' }}>
            <input type="number" value={newFridgeMinTemp} onChange={e => setNewFridgeMinTemp(e.target.value)} className="m3-input" placeholder="Min Temp" />
            <input type="number" value={newFridgeMaxTemp} onChange={e => setNewFridgeMaxTemp(e.target.value)} className="m3-input" placeholder="Max Temp" />
          </div>
          <div className="m3-button-group">
            <button className="m3-button m3-button-secondary" onClick={() => setShowAddFridgeModal(false)}>CANCEL</button>
            <button
              className="m3-button m3-button-primary"
              onClick={addFridge}
              disabled={isAdding || !newFridgeName.trim() || isNaN(parseFloat(newFridgeMinTemp)) || isNaN(parseFloat(newFridgeMaxTemp))}
            >{isAdding ? 'CREATING...' : 'CREATE'}</button>
          </div>
        </div>
      </IonModal>

      <IonModal
        isOpen={showManageUnitsModal}
        onDidDismiss={() => setShowManageUnitsModal(false)}
        className="sheet-modal"
        backdropDismiss={true}
      >
        <div className="m3-dialog-sheet" onClick={e => e.stopPropagation()}>
          <header className="modal-header-m3">
              <div className="modal-icon-m3">
                  <IonIcon icon={constructOutline} />
              </div>
              <h3 className="modal-title-m3">Manage Units</h3>
              <p className="modal-subtitle-m3">Edit or remove existing temperature units.</p>
          </header>
          <div style={{ maxHeight: '300px', overflowY: 'auto', padding: '0 4px' }}>
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
          <div className="m3-button-group">
              <button className="m3-button m3-button-primary" style={{flex: '1 1 100%'}} onClick={() => setShowManageUnitsModal(false)}>DONE</button>
          </div>
        </div>
      </IonModal>

      <IonToast isOpen={showToast.show} onDidDismiss={() => setShowToast({ ...showToast, show: false })} message={showToast.message} duration={2000} color={showToast.color} icon={checkmarkDoneOutline} position="top" />
    </IonPage>
  );
};

export default TempCheck;
