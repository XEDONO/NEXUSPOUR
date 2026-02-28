import React, { useEffect, useState, useMemo } from 'react';
import {
  IonContent,
  IonPage,
  IonIcon,
  IonAvatar,
  IonBadge,
  IonRippleEffect,
  IonButton
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
  chevronDownOutline,
  chevronUpOutline,
  chevronBack,
  chevronForward,
  timeOutline,
  sparklesOutline,
  layersOutline,
  warningOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';

type CheckFrequency = 'daily' | 'weekly' | 'monthly';
type Task = {
  id: string;
  frequency: CheckFrequency;
  section: string;
  text: string;
  completions: Record<string, boolean>
};

const Checklist: React.FC = () => {
  const history = useHistory();
  const [isLoaded, setIsLoaded] = useState(false);
  const [pivotDate, setPivotDate] = useState(new Date());
  const [showAdminSidebar, setShowAdminSidebar] = useState(false);

  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const stored = localStorage.getItem('cafeops_checklists_v3');
      if (stored) return JSON.parse(stored);
      return [
        { id: '1', frequency: 'daily', section: 'Opening', text: 'Calibrate Espresso Machine', completions: {} },
        { id: '2', frequency: 'daily', section: 'Closing', text: 'Deep Clean Steam Wands', completions: {} },
        { id: '3', frequency: 'weekly', section: 'Maintenance', text: 'Backflush Group Heads with Detergent', completions: {} },
        { id: '4', frequency: 'monthly', section: 'Audit', text: 'Check Inventory Expiry Dates', completions: {} },
      ];
    } catch { return []; }
  });

  const [activeTabs, setActiveTabs] = useState<CheckFrequency[]>(['daily']);
  const [showAdd, setShowAdd] = useState(false);
  const [addText, setAddText] = useState('');
  const [addFreq, setAddFreq] = useState<CheckFrequency>('daily');
  const [addSection, setAddSection] = useState('General');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 150);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('cafeops_checklists_v3', JSON.stringify(tasks));
  }, [tasks]);

  const getWeekNumber = (d: Date) => {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  const columns = useMemo(() => {
    const cols: Record<CheckFrequency, { key: string; label: string; subLabel: string }[]> = {
      daily: [], weekly: [], monthly: []
    };

    const startOfWeek = new Date(pivotDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      cols.daily.push({
        key: d.toISOString().split('T')[0],
        label: d.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase(),
        subLabel: `${d.getDate()}/${d.getMonth() + 1}`
      });
    }

    for (let i = -1; i < 3; i++) {
      const d = new Date(pivotDate);
      d.setDate(pivotDate.getDate() + (i * 7));
      const weekNum = getWeekNumber(d);
      cols.weekly.push({
        key: `${d.getFullYear()}-W${weekNum}`,
        label: `WEEK ${weekNum}`,
        subLabel: d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()
      });
    }

    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    for (let i = 0; i < 12; i++) {
      cols.monthly.push({
        key: `${pivotDate.getFullYear()}-${(i + 1).toString().padStart(2, '0')}`,
        label: months[i],
        subLabel: pivotDate.getFullYear().toString()
      });
    }

    return cols;
  }, [pivotDate]);

  const toggleTab = (freq: CheckFrequency) => {
    setActiveTabs(prev => prev.includes(freq) ? prev.filter(t => t !== freq) : [...prev, freq]);
  };

  const toggleCompletion = (taskId: string, dateKey: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const newCompletions = { ...t.completions };
        newCompletions[dateKey] = !newCompletions[dateKey];
        return { ...t, completions: newCompletions };
      }
      return t;
    }));
  };

  const removeTask = (id: string) => {
    if (window.confirm('Delete this check permanently?')) {
      setTasks(prev => prev.filter(t => t.id !== id));
    }
  };

  const addTask = () => {
    if (!addText.trim()) return;
    const newTask: Task = {
      id: Date.now().toString(),
      frequency: addFreq,
      section: addSection || 'General',
      text: addText.trim(),
      completions: {}
    };
    setTasks([...tasks, newTask]);
    setAddText('');
    setAddSection('General');
    setShowAdd(false);
  };

  const saveToHistory = (freq: CheckFrequency) => {
    const freqTasks = tasks.filter(t => t.frequency === freq);
    const dateStr = freq === 'daily' ? columns.daily[0].key + ' to ' + columns.daily[6].key :
                    freq === 'weekly' ? pivotDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) :
                    pivotDate.getFullYear().toString();

    const snapshot = {
      date: dateStr,
      type: `Checklist Audit: ${freq.toUpperCase()}`,
      total: freqTasks.length,
      completed: freqTasks.filter(t => Object.values(t.completions).some(v => v)).length,
      savedAt: new Date().toISOString()
    };

    try {
      const existing = JSON.parse(localStorage.getItem('checklist_logs_v1') || '[]');
      localStorage.setItem('checklist_logs_v1', JSON.stringify([snapshot, ...existing]));
      alert(`ARCHIVED: ${freq.toUpperCase()} checks sent to History.`);
    } catch {
      alert('Archive failed.');
    }
  };

  const renderTable = (freq: CheckFrequency) => {
    const filtered = tasks.filter(t => t.frequency === freq);
    const freqCols = columns[freq];

    return (
      <div className={`frequency-section ${activeTabs.includes(freq) ? 'active' : ''}`}>
        <header className="freq-header" onClick={() => toggleTab(freq)}>
          <div className="freq-info">
            <div className="freq-title-group">
              <span className="freq-indicator"></span>
              <h2 className="freq-name">{freq.toUpperCase()} CHECKS</h2>
            </div>
            <IonBadge color="light" className="task-count-badge">{filtered.length} TASKS</IonBadge>
          </div>
          <div className="freq-actions">
            <button className="archive-trigger" onClick={(e) => { e.stopPropagation(); saveToHistory(freq); }}>
              <IonIcon icon={saveOutline} />
              <span>ARCHIVE</span>
            </button>
            <IonIcon icon={activeTabs.includes(freq) ? chevronUpOutline : chevronDownOutline} className="toggle-icon" />
          </div>
        </header>

        {activeTabs.includes(freq) && (
          <div className="table-viewport m3-scroll">
            <table>
              <thead>
                <tr>
                  <th className="sticky-col">TASK DESCRIPTION</th>
                  {freqCols.map(col => (
                    <th key={col.key}>
                      <div className="col-header-content">
                        <span className="col-label">{col.label}</span>
                        <span className="col-sub">{col.subLabel}</span>
                      </div>
                    </th>
                  ))}
                  <th className="no-border-cell" style={{ width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={freqCols.length + 2} className="empty-row">
                      No items. Click + to add.
                    </td>
                  </tr>
                )}
                {filtered.map(t => (
                  <tr key={t.id}>
                    <td className="sticky-col task-text-cell">
                      <div className="task-main-text">{t.text}</div>
                      <div className="task-sub-text">{t.section}</div>
                    </td>
                    {freqCols.map(col => (
                      <td key={col.key} className="checkbox-cell">
                        <div
                          className={`m3-matrix-check ${t.completions[col.key] ? 'checked' : ''}`}
                          onClick={() => toggleCompletion(t.id, col.key)}
                        >
                          {t.completions[col.key] && <IonIcon icon={checkmarkCircle} />}
                        </div>
                      </td>
                    ))}
                    <td className="no-border-cell">
                      <button className="row-delete-btn" onClick={() => removeTask(t.id)}>
                        <IonIcon icon={trashOutline} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <IonPage className="cl-page-root">
      <style>{`
        .cl-page-root .checks-layout { --background: #FDFCF4; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
        .cl-page-root .espresso-header { background: #2D1B14; padding: 24px 24px 40px; color: white; width: 100%; position: relative; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; box-shadow: 0 4px 20px rgba(0,0,0,0.25); }
        .cl-page-root .liquid-splash { position: absolute; bottom: 0; left: 0; width: 100%; height: 30px; background: #FDFCF4; clip-path: polygon(0% 100%, 100% 100%, 100% 0%, 85% 40%, 75% 10%, 65% 50%, 50% 20%, 35% 60%, 25% 10%, 10% 40%, 0% 0%); }
        .cl-page-root .top-bar-nav { display: flex; justify-content: space-between; align-items: center; width: 100%; max-width: 1400px; z-index: 10; }
        .cl-page-root .logo-wrap { display: flex; align-items: center; gap: 12px; }
        .cl-page-root .logo-box { background: linear-gradient(135deg, #E6BEAE 0%, #D7CCC8 100%); width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #2D1B14; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
        .cl-page-root .logo-box ion-icon { font-size: 1.2rem; }
        .cl-page-root .top-bar-nav h1 { font-weight: 900; font-size: 1.6rem; margin: 0; letter-spacing: -1px; color: white; }
        .cl-page-root .nav-controls { display: flex; align-items: center; gap: 20px; background: rgba(255,255,255,0.05); padding: 8px 20px; border-radius: 100px; border: 1px solid rgba(255,255,255,0.1); margin-top: 16px; z-index: 10; }
        .cl-page-root .nav-arrow { background: none; border: none; color: white; font-size: 1.4rem; cursor: pointer; display: flex; }
        .cl-page-root .current-pivot { font-weight: 800; font-size: 0.9rem; letter-spacing: 1px; color: #E6BEAE; }
        .cl-page-root .main-scroll { padding: 20px 24px 150px; flex: 1; width: 100%; display: flex; flex-direction: column; align-items: center; overflow-y: auto; }
        .cl-page-root .grid-max { width: 100%; max-width: 1400px; }
        .cl-page-root .frequency-section { background: white; border-radius: 32px; border: 1px solid #E1E3D3; box-shadow: 0 4px 20px rgba(45, 27, 20, 0.05); margin-bottom: 20px; width: 100%; }
        .cl-page-root .freq-header { padding: 24px 32px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
        .cl-page-root .freq-info { display: flex; align-items: center; gap: 24px; }
        .cl-page-root .freq-title-group { display: flex; align-items: center; gap: 12px; }
        .cl-page-root .freq-indicator { width: 4px; height: 24px; background: #2D1B14; border-radius: 2px; }
        .cl-page-root .freq-name { font-weight: 900; fontSize: 1.2rem; margin: 0; letter-spacing: 1px; color: #2D1B14; }
        .cl-page-root .task-count-badge { font-size: 0.75rem; padding: 4px 8px; }
        .cl-page-root .archive-trigger { background: #FDFCF4; border: 1px solid #E1E3D3; padding: 8px 16px; border-radius: 100px; display: flex; align-items: center; gap: 8px; color: #2D1B14; font-weight: 800; font-size: 0.75rem; }
        .cl-page-root .toggle-icon { font-size: 1.4rem; color: #A1887F; }
        .cl-page-root .table-viewport { width: 100%; overflow-x: auto; padding: 0 32px 32px; }
        .cl-page-root table { width: 100%; border-collapse: collapse; min-width: 1300px; border: 1px solid #E1E3D3; table-layout: fixed; }
        .cl-page-root th { padding: 16px; text-align: center; border: 1px solid #E1E3D3; background: white; position: sticky; top: 0; z-index: 5; font-size: 0.8rem; width: 100px; }
        .cl-page-root .sticky-col { position: sticky; left: 0; background: white; z-index: 10; text-align: left !important; width: 320px !important; min-width: 320px; border: 1px solid #E1E3D3; padding-left: 12px !important; }
        .cl-page-root .no-border-cell { border: none !important; background: transparent !important; width: 60px !important; }
        .cl-page-root .col-header-content { display: flex; flex-direction: column; align-items: center; gap: 4px; }
        .cl-page-root .col-label { font-weight: 900; font-size: 0.75rem; color: #2D1B14; }
        .cl-page-root .col-sub { font-weight: 700; font-size: 0.6rem; color: #A1887F; }
        .cl-page-root .task-main-text { font-weight: 800; font-size: 1rem; color: #2D1B14; }
        .cl-page-root .task-sub-text { font-weight: 700; font-size: 0.7rem; color: #A1887F; text-transform: uppercase; margin-top: 2px; }
        .cl-page-root td { padding: 12px 16px; border: 1px solid #E1E3D3; vertical-align: middle; }
        .cl-page-root .m3-matrix-check { width: 36px; height: 36px; border-radius: 12px; border: 2px solid #E1E3D3; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; color: white; background: #F8F5F2; transition: all 0.2s; }
        .cl-page-root .m3-matrix-check.checked { background: #2D1B14; border-color: #2D1B14; }
        .cl-page-root .m3-matrix-check ion-icon { font-size: 1.4rem; }
        .cl-page-root .row-delete-btn { background: none; border: none; color: #E57373; cursor: pointer; padding: 8px; font-size: 1.2rem; opacity: 0.3; }
        .cl-page-root .fab-primary { position: fixed; bottom: 100px; right: 24px; width: 64px; height: 64px; border-radius: 22px; background: #2D1B14; color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 30px rgba(45, 27, 20, 0.4); z-index: 1000; border: none; }

        .cl-page-root .m3-nav {
          position: fixed; bottom: 0; left: 0; right: 0; height: 85px; background: #FFFFFF;
          display: flex; border-top: 1px solid #E1E3D3; padding-bottom: env(safe-area-inset-bottom);
          z-index: 1000; box-shadow: 0 -4px 20px rgba(0,0,0,0.05);
        }
        .cl-page-root .nav-tab { flex: 1; display: flex; flex-direction: column; align-items: center; justifyContent: center; color: #A1887F; font-size: 0.75rem; font-weight: 800; cursor: pointer; }
        .cl-page-root .nav-tab.active { color: #2D1B14; }
        .cl-page-root .nav-indicator { width: 64px; height: 32px; border-radius: 100px; display: flex; align-items: center; justify-content: center; transition: all 0.3s; margin-bottom: 4px; }
        .cl-page-root .nav-tab.active .nav-indicator { background: #2D1B1412; transform: translateY(-2px); }

        .cl-page-root .action-row-m3 { display: flex; gap: 12px; align-items: center; }
        .cl-page-root .round-btn-m3 {
          width: 36px; height: 36px; border-radius: 50%;
          background: rgba(255, 255, 255, 0.08); color: white;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.1); transition: all 0.2s;
          position: relative; cursor: pointer;
        }
        .cl-page-root .round-btn-m3:active { transform: scale(0.9); background: rgba(255,255,255,0.15); }

        .cl-page-root .sidebar-m3 {
          position: fixed; top: 0; right: -340px; width: 320px; height: 100%; background: white;
          z-index: 3000; transition: right 0.5s cubic-bezier(0.4, 0, 0.2, 1); padding: 40px 28px;
          display: flex; flex-direction: column; box-shadow: -15px 0 50px rgba(0,0,0,0.2); border-radius: 40px 0 0 40px;
        }
        .cl-page-root .sidebar-m3.active { right: 0; }
        .cl-page-root .scrim-m3 {
          position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px); z-index: 2500; opacity: 0; pointer-events: none;
          transition: opacity 0.5s ease;
        }
        .cl-page-root .scrim-m3.active { opacity: 1; pointer-events: auto; }
        .cl-page-root .m3-card-wide {
          padding: 20px; border-radius: 20px; background: #F8F5F2;
          display: flex; align-items: center; gap: 15px; cursor: pointer;
          transition: background 0.2s;
        }
        .cl-page-root .m3-card-wide:active { background: #E6E1DC; }

        /* ADD MODAL STYLES */
        .cl-page-root .m3-modal-overlay {
          position: fixed; inset: 0; background: rgba(45, 27, 20, 0.4); backdrop-filter: blur(8px);
          z-index: 4000; display: flex; align-items: center; justify-content: center; padding: 24px;
          animation: m3-fade-in 0.3s ease-out;
        }
        @keyframes m3-fade-in { from { opacity: 0; } to { opacity: 1; } }

        .cl-page-root .m3-dialog {
          background: white; border-radius: 32px; padding: 32px; width: 100%; max-width: 440px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.2); animation: m3-slide-up 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.1);
          border: 1px solid rgba(45, 27, 20, 0.05);
        }
        @keyframes m3-slide-up { from { transform: translateY(30px) scale(0.95); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }

        .cl-page-root .freq-segmented-control {
          display: flex; background: #F8F5F2; padding: 6px; border-radius: 20px; margin-bottom: 24px;
          border: 1px solid #E1E3D3;
        }
        .cl-page-root .freq-segment-btn {
          flex: 1; padding: 12px; border-radius: 16px; border: none; background: transparent;
          color: #8D6E63; font-weight: 800; font-size: 0.75rem; text-transform: uppercase;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer;
        }
        .cl-page-root .freq-segment-btn.active { background: #2D1B14; color: white; box-shadow: 0 4px 12px rgba(45, 27, 20, 0.2); }

        .cl-page-root .m3-input-group { position: relative; margin-bottom: 20px; }
        .cl-page-root .m3-input-group ion-icon { position: absolute; left: 18px; top: 18px; color: #8D6E63; font-size: 1.2rem; }
        .cl-page-root .m3-input-field {
          width: 100%; padding: 18px 18px 18px 52px; border-radius: 20px; background: #FDFCF4;
          border: 2px solid #E1E3D3; font-weight: 700; color: #2D1B14; outline: none;
          transition: all 0.2s; font-size: 0.95rem;
        }
        .cl-page-root .m3-input-field:focus { border-color: #2D1B14; background: white; box-shadow: 0 0 0 4px rgba(45, 27, 20, 0.05); }
        .cl-page-root .m3-input-field::placeholder { color: #A1887F; opacity: 0.6; }

        .cl-page-root .dialog-actions-m3 { display: flex; gap: 16px; margin-top: 32px; }
        .cl-page-root .btn-cancel-m3 {
          flex: 1; padding: 18px; border-radius: 20px; border: none; background: #F8F5F2;
          color: #8D6E63; font-weight: 800; cursor: pointer; transition: all 0.2s;
        }
        .cl-page-root .btn-cancel-m3:active { background: #E6E1DC; transform: scale(0.98); }
        .cl-page-root .btn-create-m3 {
          flex: 1.5; padding: 18px; border-radius: 20px; border: none; background: #2D1B14;
          color: white; font-weight: 900; cursor: pointer; transition: all 0.3s;
          box-shadow: 0 8px 20px rgba(45, 27, 20, 0.25);
        }
        .cl-page-root .btn-create-m3:active { transform: scale(0.96); box-shadow: 0 4px 10px rgba(45, 27, 20, 0.2); }
      `}</style>

      <IonContent scrollY={false}>
        <div className="checklist-page-scope">
          <div className="checks-layout">
            <header className="espresso-header">
              <div className="top-bar-nav">
                <div className="logo-wrap">
                  <button className="round-btn-m3" onClick={() => history.push('/dashboard')} aria-label="Go home" style={{ marginRight: '8px' }}>
                    <IonIcon icon={chevronBackOutline} style={{ fontSize: '1.1rem' }} />
                  </button>
                  <div className="logo-box"><IonIcon icon={cafeOutline} /></div>
                  <h1>NexusPour</h1>
                </div>
                <div className="action-row-m3">
                  <button className="round-btn-m3" onClick={() => setShowAdminSidebar(true)} aria-label="Settings">
                    <IonIcon icon={settingsOutline} style={{ fontSize: '1.2rem' }} />
                  </button>
                  <IonAvatar style={{ width: '40px', height: '40px', border: '2px solid rgba(255,255,255,0.2)' }}>
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Ops" alt="User" />
                  </IonAvatar>
                </div>
              </div>

              <div className="nav-controls">
                <button className="nav-arrow" onClick={() => {
                  const d = new Date(pivotDate); d.setDate(d.getDate() - 7); setPivotDate(d);
                }}><IonIcon icon={chevronBack} /></button>
                <span className="current-pivot">
                  {pivotDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }).toUpperCase()}
                </span>
                <button className="nav-arrow" onClick={() => {
                  const d = new Date(pivotDate); d.setDate(d.getDate() + 7); setPivotDate(d);
                }}><IonIcon icon={chevronForward} /></button>
              </div>
              <div className="liquid-splash"></div>
            </header>

            <main className="main-scroll">
              <div className="grid-max">
                {renderTable('daily')}
                {renderTable('weekly')}
                {renderTable('monthly')}
              </div>
            </main>
          </div>

          <button className="fab-primary ion-activatable" onClick={() => setShowAdd(true)}>
            <IonIcon icon={addOutline} style={{ fontSize: '2.4rem' }} />
            <IonRippleEffect />
          </button>

          <div className={`scrim-m3 ${showAdminSidebar ? 'active' : ''}`} onClick={() => setShowAdminSidebar(false)} />
          <aside className={`sidebar-m3 ${showAdminSidebar ? 'active' : ''}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
              <h2 style={{ fontWeight: 900, margin: 0, fontSize: '1.8rem', color: '#2D1B14' }}>Settings</h2>
              <button className="round-btn-m3" style={{ background: '#F8F5F2', color: '#2D1B14', border: 'none' }} onClick={() => setShowAdminSidebar(false)}>
                <IonIcon icon={closeOutline} style={{ fontSize: '2rem' }} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div className="m3-card-wide" onClick={() => { history.push('/history'); setShowAdminSidebar(false); }}>
                <IonIcon icon={timeOutline} style={{ fontSize: '1.8rem', color: '#2D1B14' }} />
                <span style={{ fontWeight: 800, color: '#2D1B14' }}>Historical Logs</span>
              </div>
            </div>
          </aside>

          <nav className="m3-nav">
            <div className="nav-tab" onClick={() => history.push('/dashboard')}>
              <div className="nav-indicator"><IonIcon icon={home} style={{ fontSize: '1.5rem' }} /></div>
              <span>Home</span>
            </div>
            <div className="nav-tab" onClick={() => history.push('/temp-check')}>
              <div className="nav-indicator"><IonIcon icon={thermometerOutline} style={{ fontSize: '1.5rem' }} /></div>
              <span>Temps</span>
            </div>
            <div className="nav-tab active">
              <div className="nav-indicator"><IonIcon icon={clipboardOutline} style={{ fontSize: '1.5rem' }} /></div>
              <span>Checks</span>
            </div>
            <div className="nav-tab" onClick={() => history.push('/inventory')}>
              <div className="nav-indicator"><IonIcon icon={albumsOutline} style={{ fontSize: '1.5rem' }} /></div>
              <span>Stock</span>
            </div>
            <div className="nav-tab" onClick={() => history.push('/allergens')}>
              <div className="nav-indicator"><IonIcon icon={warningOutline} style={{ fontSize: '1.5rem' }} /></div>
              <span>Allergens</span>
            </div>
          </nav>

          {showAdd && (
            <div className="m3-modal-overlay" onClick={() => setShowAdd(false)}>
              <div className="m3-dialog" onClick={e => e.stopPropagation()}>
                <header style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <div style={{ width: '56px', height: '56px', background: '#F8F5F2', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#2D1B14' }}>
                    <IonIcon icon={sparklesOutline} style={{ fontSize: '1.8rem' }} />
                  </div>
                  <h3 style={{ margin: 0, fontWeight: 900, color: '#2D1B14', fontSize: '1.6rem', letterSpacing: '-0.5px' }}>New Requirement</h3>
                  <p style={{ margin: '4px 0 0', color: '#8D6E63', fontWeight: 700, fontSize: '0.85rem' }}>Add a new operational check</p>
                </header>

                <div className="freq-segmented-control">
                  {(['daily', 'weekly', 'monthly'] as CheckFrequency[]).map(f => (
                    <button
                      key={f}
                      onClick={() => setAddFreq(f)}
                      className={`freq-segment-btn ${addFreq === f ? 'active' : ''}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                <div className="m3-input-group">
                  <IonIcon icon={clipboardOutline} />
                  <input
                    placeholder="Task description..."
                    value={addText}
                    onChange={e => setAddText(e.target.value)}
                    className="m3-input-field"
                  />
                </div>

                <div className="m3-input-group">
                  <IonIcon icon={layersOutline} />
                  <input
                    placeholder="Section (e.g. Opening, Closing)"
                    value={addSection}
                    onChange={e => setAddSection(e.target.value)}
                    className="m3-input-field"
                  />
                </div>

                <div className="dialog-actions-m3">
                  <button className="btn-cancel-m3" onClick={() => setShowAdd(false)}>CANCEL</button>
                  <button className="btn-create-m3" onClick={addTask}>CREATE TASK</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Checklist;
