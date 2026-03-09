import React, { useEffect, useState, useMemo } from 'react';
import {
  IonContent,
  IonPage,
  IonIcon,
  IonAvatar,
  IonBadge,
  IonRippleEffect,
  IonButton,
  IonAlert,
  IonToast,
  IonSegment,
  IonSegmentButton,
  IonLabel
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
  warningOutline,
  sunnyOutline,
  moonOutline,
  calendarOutline,
  buildOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { API_BASE_URL } from '../apiConfig';

type CheckFrequency = 'daily' | 'weekly' | 'monthly';
type TaskType = 'opening' | 'closing' | 'general';

type Task = {
  id: string;
  frequency: CheckFrequency;
  section: string;
  text: string;
  type: TaskType;
  completions: Record<string, boolean>
};

const Checklist: React.FC = () => {
  const history = useHistory();
  const [pivotDate, setPivotDate] = useState(new Date());
  const [showAdminSidebar, setShowAdminSidebar] = useState(false);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeFrequency, setActiveFrequency] = useState<CheckFrequency>('daily');
  const [activeType, setActiveType] = useState<TaskType>('opening');

  const [showAdd, setShowAdd] = useState(false);
  const [addFreq, setAddFreq] = useState<CheckFrequency>('daily');
  const [addType, setAddType] = useState<TaskType>('opening');
  const [addText, setAddText] = useState('');
  const [addSection, setAddSection] = useState('General');

  const [showPurgeAlert, setShowPurgeAlert] = useState(false);
  const [showToast, setShowToast] = useState({ show: false, message: '', color: 'success' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/checklists`);
      const data = await res.json();
      setTasks(data);
    } catch (error) {
      console.error("Failed to fetch checklists", error);
    }
  };

  const currentKey = useMemo(() => {
    if (activeFrequency === 'daily') return pivotDate.toISOString().split('T')[0];
    if (activeFrequency === 'weekly') {
        const d = new Date(pivotDate);
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
        return `${d.getFullYear()}-W${weekNo}`;
    }
    return `${pivotDate.getFullYear()}-${(pivotDate.getMonth() + 1).toString().padStart(2, '0')}`;
  }, [pivotDate, activeFrequency]);

  const toggleCompletion = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newStatus = !task.completions[currentKey];

    await fetch(`${API_BASE_URL}/checklists/${taskId}/completion`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dateKey: currentKey, status: newStatus }),
    });
    fetchData();
  };

  const removeTask = async (id: string) => {
    if (window.confirm('Delete this check permanently?')) {
      await fetch(`${API_BASE_URL}/checklists/${id}`, { method: 'DELETE' });
      fetchData();
    }
  };

  const addTask = async () => {
    if (!addText.trim()) return;
    const newTask = {
      id: Date.now().toString(),
      frequency: addFreq,
      type: addFreq === 'daily' ? addType : 'general',
      section: addSection || 'General',
      text: addText.trim(),
    };

    await fetch(`${API_BASE_URL}/checklists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
    });

    setAddText('');
    setShowAdd(false);
    fetchData();
  };

  const purgeAllChecklists = async () => {
    await fetch(`${API_BASE_URL}/checklists/purge`, { method: 'DELETE' });
    setShowToast({ show: true, message: 'All checklists purged.', color: 'success' });
    fetchData();
    setShowAdminSidebar(false);
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
        if (t.frequency !== activeFrequency) return false;
        if (activeFrequency === 'daily' && t.type !== activeType) return false;
        return true;
    });
  }, [tasks, activeFrequency, activeType]);

  const sections = useMemo(() => {
    const s = Array.from(new Set(filteredTasks.map(t => t.section)));
    return s.length ? s : ['General'];
  }, [filteredTasks]);

  return (
    <IonPage className="cl-page-root">
      <style>{`
        .cl-page-root .checks-layout { background: #FDFCF4; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
        .cl-page-root .espresso-header { background: #2D1B14; padding: 20px 20px 40px; color: white; position: relative; flex-shrink: 0; box-shadow: 0 4px 20px rgba(0,0,0,0.3); }

        .cl-page-root .top-bar-nav { display: flex; justify-content: space-between; align-items: center; width: 100%; max-width: 1200px; margin: 0 auto; z-index: 10; }
        .cl-page-root .brand-logo { display: flex; align-items: center; gap: 12px; }
        .cl-page-root .logo-box { background: linear-gradient(135deg, #E6BEAE 0%, #D7CCC8 100%); width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #2D1B14; }
        .cl-page-root .logo-text { font-weight: 900; font-size: 1.4rem; margin: 0; letter-spacing: -0.5px; }

        .cl-page-root .header-controls { margin-top: 20px; width: 100%; max-width: 800px; margin-left: auto; margin-right: auto; z-index: 10; }

        .cl-page-root .date-navigator { display: flex; align-items: center; justify-content: center; gap: 20px; margin-top: 15px; }
        .cl-page-root .nav-btn { background: rgba(255,255,255,0.1); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .cl-page-root .date-label { font-weight: 800; font-size: 1.1rem; color: #E6BEAE; min-width: 180px; text-align: center; }

        .cl-page-root .m3-segment { --background: rgba(255,255,255,0.05); margin-top: 15px; border-radius: 14px; overflow: hidden; }
        .cl-page-root ion-segment-button { --color: #A1887F; --color-checked: #white; --indicator-color: #E6BEAE; }

        .cl-page-root .main-scroll { flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; align-items: center; padding-bottom: 120px; }
        .cl-page-root .tasks-container { width: 100%; max-width: 800px; }

        .cl-page-root .section-block { margin-bottom: 30px; width: 100%; }
        .cl-page-root .section-title { font-weight: 900; font-size: 0.8rem; color: #8D6E63; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 12px; padding-left: 10px; border-left: 4px solid #2D1B14; }

        .cl-page-root .task-card { background: white; border-radius: 20px; padding: 18px 20px; margin-bottom: 10px; display: flex; align-items: center; gap: 15px; border: 1px solid #E1E3D3; box-shadow: 0 2px 8px rgba(0,0,0,0.02); transition: all 0.2s; cursor: pointer; }
        .cl-page-root .task-card.checked { background: #F9FBF2; border-color: #D6E8B1; }
        .cl-page-root .task-card:active { transform: scale(0.98); }

        .cl-page-root .check-box { width: 32px; height: 32px; border-radius: 10px; border: 2.5px solid #E1E3D3; display: flex; align-items: center; justify-content: center; transition: all 0.2s; color: white; background: #F8F5F2; }
        .cl-page-root .task-card.checked .check-box { background: #2D1B14; border-color: #2D1B14; }

        .cl-page-root .task-info { flex: 1; }
        .cl-page-root .task-text { font-weight: 700; color: #2D1B14; font-size: 1rem; }
        .cl-page-root .task-card.checked .task-text { text-decoration: line-through; opacity: 0.5; }

        .cl-page-root .fab-add { position: fixed; bottom: 100px; right: 24px; width: 60px; height: 60px; border-radius: 20px; background: #2D1B14; color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 25px rgba(0,0,0,0.3); z-index: 100; border: none; cursor: pointer; }

        .cl-page-root .m3-nav { position: fixed; bottom: 0; left: 0; right: 0; height: 80px; background: white; display: flex; border-top: 1px solid #E1E3D3; padding-bottom: env(safe-area-inset-bottom); z-index: 1000; box-shadow: 0 -4px 20px rgba(0,0,0,0.05); }
        .cl-page-root .nav-tab { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #A1887F; font-size: 0.7rem; font-weight: 800; cursor: pointer; }
        .cl-page-root .nav-tab.active { color: #2D1B14; }
        .cl-page-root .nav-indicator { width: 50px; height: 30px; border-radius: 15px; display: flex; align-items: center; justify-content: center; transition: 0.3s; margin-bottom: 4px; }
        .cl-page-root .nav-tab.active .nav-indicator { background: #2D1B1412; }

        .cl-page-root .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(5px); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .cl-page-root .modal-card { background: white; border-radius: 28px; padding: 30px; width: 100%; max-width: 450px; box-shadow: 0 15px 40px rgba(0,0,0,0.2); }
        .cl-page-root .m3-input { width: 100%; padding: 16px; border-radius: 16px; background: #F8F5F2; border: 1.5px solid #E1E3D3; font-weight: 700; color: #2D1B14; margin-bottom: 15px; outline: none; }
        .cl-page-root .m3-input:focus { border-color: #2D1B14; }

        .cl-page-root .sidebar { position: fixed; top: 0; right: 0; width: 300px; height: 100%; background: white; z-index: 3000; transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: -10px 0 40px rgba(0,0,0,0.1); padding: 40px 20px; display: flex; flex-direction: column; transform: translateX(100%); }
        .cl-page-root .sidebar.active { transform: translateX(0); }
        .cl-page-root .scrim { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 2500; opacity: 0; pointer-events: none; transition: 0.4s; }
        .cl-page-root .scrim.active { opacity: 1; pointer-events: auto; }
      `}</style>

      <div className="checks-layout">
        <header className="espresso-header">
          <div className="top-bar-nav">
            <div className="brand-logo">
              <button className="nav-btn" onClick={() => history.push('/dashboard')}><IonIcon icon={chevronBackOutline} /></button>
              <div className="logo-box"><IonIcon icon={cafeOutline} /></div>
              <h1 className="logo-text">NexusPour</h1>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="nav-btn" onClick={() => setShowAdminSidebar(true)}><IonIcon icon={settingsOutline} /></button>
              <IonAvatar style={{ width: '36px', height: '36px', border: '2px solid rgba(255,255,255,0.2)' }}><img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Staff" alt="Staff" /></IonAvatar>
            </div>
          </div>

          <div className="header-controls">
            <IonSegment value={activeFrequency} onIonChange={e => setActiveFrequency(e.detail.value as CheckFrequency)} className="m3-segment" mode="ios">
              <IonSegmentButton value="daily"><IonLabel>DAILY</IonLabel></IonSegmentButton>
              <IonSegmentButton value="weekly"><IonLabel>WEEKLY</IonLabel></IonSegmentButton>
              <IonSegmentButton value="monthly"><IonLabel>MONTHLY</IonLabel></IonSegmentButton>
            </IonSegment>

            {activeFrequency === 'daily' && (
              <IonSegment value={activeType} onIonChange={e => setActiveType(e.detail.value as TaskType)} className="m3-segment" mode="md" style={{ marginTop: '10px', height: '40px' }}>
                <IonSegmentButton value="opening"><div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><IonIcon icon={sunnyOutline} /> OPENING</div></IonSegmentButton>
                <IonSegmentButton value="closing"><div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><IonIcon icon={moonOutline} /> CLOSING</div></IonSegmentButton>
              </IonSegment>
            )}

            <div className="date-navigator">
              <button className="nav-btn" onClick={() => {
                const d = new Date(pivotDate);
                if (activeFrequency === 'daily') d.setDate(d.getDate() - 1);
                else if (activeFrequency === 'weekly') d.setDate(d.getDate() - 7);
                else d.setMonth(d.getMonth() - 1);
                setPivotDate(d);
              }}><IonIcon icon={chevronBack} /></button>
              <span className="date-label">
                {activeFrequency === 'daily' && pivotDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                {activeFrequency === 'weekly' && currentKey}
                {activeFrequency === 'monthly' && pivotDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
              </span>
              <button className="nav-btn" onClick={() => {
                const d = new Date(pivotDate);
                if (activeFrequency === 'daily') d.setDate(d.getDate() + 1);
                else if (activeFrequency === 'weekly') d.setDate(d.getDate() + 7);
                else d.setMonth(d.getMonth() + 1);
                setPivotDate(d);
              }}><IonIcon icon={chevronForward} /></button>
            </div>
          </div>
        </header>

        <main className="main-scroll">
          <div className="tasks-container">
            {sections.map(sec => (
              <div key={sec} className="section-block">
                <h2 className="section-title">{sec}</h2>
                {filteredTasks.filter(t => t.section === sec).map(t => (
                  <div key={t.id} className={`task-card ${t.completions[currentKey] ? 'checked' : ''}`} onClick={() => toggleCompletion(t.id)}>
                    <div className="check-box">
                      {t.completions[currentKey] && <IonIcon icon={checkmarkCircle} style={{ fontSize: '1.5rem' }} />}
                    </div>
                    <div className="task-info">
                      <div className="task-text">{t.text}</div>
                    </div>
                    <button style={{ background: 'none', border: 'none', color: '#E57373', opacity: 0.3 }} onClick={(e) => { e.stopPropagation(); removeTask(t.id); }}>
                      <IonIcon icon={trashOutline} />
                    </button>
                  </div>
                ))}
              </div>
            ))}

            {filteredTasks.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 20px', opacity: 0.4 }}>
                <IonIcon icon={sparklesOutline} style={{ fontSize: '4rem' }} />
                <p style={{ fontWeight: 700, marginTop: '10px' }}>No {activeFrequency} tasks defined here yet.</p>
              </div>
            )}
          </div>
        </main>

        <button className="fab-add ion-activatable" onClick={() => setShowAdd(true)}>
          <IonIcon icon={addOutline} style={{ fontSize: '2rem' }} />
          <IonRippleEffect />
        </button>

        <div className={`scrim ${showAdminSidebar ? 'active' : ''}`} onClick={() => setShowAdminSidebar(false)} />
        <aside className={`sidebar ${showAdminSidebar ? 'active' : ''}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h2 style={{ fontWeight: 900, margin: 0 }}>Options</h2>
            <button className="nav-btn" style={{ background: '#F8F5F2', color: '#2D1B14' }} onClick={() => setShowAdminSidebar(false)}><IonIcon icon={closeOutline} /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button style={{ padding: '18px', borderRadius: '16px', background: '#F8F5F2', border: 'none', fontWeight: 800, textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px' }} onClick={() => { history.push('/history'); setShowAdminSidebar(false); }}>
              <IonIcon icon={timeOutline} style={{ fontSize: '1.4rem' }} /> Historical Logs
            </button>
            <button style={{ padding: '18px', borderRadius: '16px', background: '#FFF8F8', border: '1.5px solid #FFCDD2', color: '#B3261E', fontWeight: 800, textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', marginTop: 'auto' }} onClick={() => setShowPurgeAlert(true)}>
              <IonIcon icon={trashOutline} style={{ fontSize: '1.4rem' }} /> Purge All Data
            </button>
          </div>
        </aside>

        <nav className="m3-nav">
          <div className="nav-tab" onClick={() => history.push('/dashboard')}><div className="nav-indicator"><IonIcon icon={home} /></div><span>Home</span></div>
          <div className="nav-tab" onClick={() => history.push('/temp-check')}><div className="nav-indicator"><IonIcon icon={thermometerOutline} /></div><span>Temps</span></div>
          <div className="nav-tab active"><div className="nav-indicator"><IonIcon icon={clipboardOutline} /></div><span>Checks</span></div>
          <div className="nav-tab" onClick={() => history.push('/inventory')}><div className="nav-indicator"><IonIcon icon={albumsOutline} /></div><span>Stock</span></div>
          <div className="nav-tab" onClick={() => history.push('/allergens')}><div className="nav-indicator"><IonIcon icon={warningOutline} /></div><span>Allergens</span></div>
        </nav>

        {showAdd && (
          <div className="modal-overlay" onClick={() => setShowAdd(false)}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
              <h3 style={{ fontWeight: 900, fontSize: '1.5rem', marginTop: 0 }}>Add Requirement</h3>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <select className="m3-input" style={{ flex: 1 }} value={addFreq} onChange={e => setAddFreq(e.target.value as CheckFrequency)}>
                  <option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>
                </select>
                {addFreq === 'daily' && (
                  <select className="m3-input" style={{ flex: 1 }} value={addType} onChange={e => setAddType(e.target.value as TaskType)}>
                    <option value="opening">Opening</option><option value="closing">Closing</option><option value="general">General</option>
                  </select>
                )}
              </div>

              <input placeholder="Task description..." value={addText} onChange={e => setAddText(e.target.value)} className="m3-input" />
              <input placeholder="Section (e.g. Bar, Kitchen)" value={addSection} onChange={e => setAddSection(e.target.value)} className="m3-input" />

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button style={{ flex: 1, padding: '15px', borderRadius: '14px', border: 'none', fontWeight: 800, background: '#F8F5F2' }} onClick={() => setShowAdd(false)}>Cancel</button>
                <button style={{ flex: 1.5, padding: '15px', borderRadius: '14px', border: 'none', fontWeight: 900, background: '#2D1B14', color: 'white' }} onClick={addTask}>Add Task</button>
              </div>
            </div>
          </div>
        )}

        <IonAlert isOpen={showPurgeAlert} onDidDismiss={() => setShowPurgeAlert(false)} header="Purge Everything?" message="Delete all checklist requirements?" buttons={[{ text: 'Cancel', role: 'cancel' }, { text: 'Purge', role: 'destructive', handler: purgeAllChecklists }]} />
        <IonToast isOpen={showToast.show} onDidDismiss={() => setShowToast({ ...showToast, show: false })} message={showToast.message} duration={2000} color={showToast.color} position="bottom" />
      </div>
    </IonPage>
  );
};

export default Checklist;
