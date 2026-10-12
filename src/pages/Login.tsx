import React, { useState, useEffect } from 'react';
import { IonContent, IonPage, IonIcon } from '@ionic/react';
import { cafeOutline, personOutline, lockClosedOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../utils/useAuth';

const Login: React.FC = () => {
  const history = useHistory();
  const { isAuthenticated, loginWithCredentials, setRole, setIsAuthenticated } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      history.replace('/dashboard');
    }
  }, [isAuthenticated]);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Please enter your username.');
      return;
    }

    const success = loginWithCredentials(username, password);
    if (success) {
      setIsAuthenticated(true);
      history.replace('/dashboard');
    } else {
      setError('Invalid username or password.');
    }
  };

  const handleQuickLogin = (roleType: 'admin' | 'staff') => {
    setRole(roleType);
    setIsAuthenticated(true);
    history.replace('/dashboard');
  };

  return (
    <IonPage className="login-page-root">
      <style>{`
        .login-page-root {
          background: #2D1B14;
          --background: #2D1B14;
          width: 100%;
          height: 100%;
        }
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: radial-gradient(circle at center, #3E2723 0%, #2D1B14 100%);
        }
        .login-card {
          background: #FDFCF4;
          border-radius: 36px;
          padding: 40px 32px;
          width: 100%;
          max-width: 440px;
          box-shadow: 0 25px 60px rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
        }
        .login-logo-box {
          width: 72px;
          height: 72px;
          border-radius: 20px;
          background: #2D1B14;
          color: #E6BEAE;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
          margin: 0 auto 20px;
          box-shadow: 0 10px 25px rgba(45, 27, 20, 0.3);
        }
        .m3-input-group {
          position: relative;
          margin-bottom: 20px;
        }
        .m3-input-group ion-icon {
          position: absolute;
          left: 18px;
          top: 50%;
          transform: translateY(-50%);
          color: #8D6E63;
          font-size: 1.3rem;
        }
        .m3-input-group input {
          width: 100%;
          padding: 18px 18px 18px 54px;
          border-radius: 20px;
          background: #F8F5F2;
          border: 2px solid #E1E3D3;
          font-weight: 700;
          color: #2D1B14;
          outline: none;
          font-size: 1rem;
          transition: border-color 0.2s;
        }
        .m3-input-group input:focus {
          border-color: #2D1B14;
          background: white;
        }
        .btn-primary-m3 {
          width: 100%;
          padding: 18px;
          border-radius: 20px;
          background: #2D1B14;
          color: white;
          font-weight: 900;
          font-size: 1.05rem;
          border: none;
          cursor: pointer;
          box-shadow: 0 10px 25px rgba(45, 27, 20, 0.3);
          transition: transform 0.2s;
        }
        .btn-primary-m3:active {
          transform: scale(0.98);
        }
        .quick-btn {
          flex: 1;
          padding: 12px 8px;
          border-radius: 14px;
          background: #F8F5F2;
          border: 1.5px solid #E1E3D3;
          font-weight: 800;
          font-size: 0.75rem;
          color: #2D1B14;
          cursor: pointer;
          text-align: center;
          transition: all 0.2s;
        }
        .quick-btn:hover {
          background: #E6E1DC;
          border-color: #2D1B14;
        }
      `}</style>
      <IonContent scrollY={false}>
        <div className="login-container">
          <div className="login-card">
            <div className="login-logo-box">
              <IonIcon icon={cafeOutline} />
            </div>
            <h1 style={{ textAlign: 'center', fontWeight: 900, fontSize: '2rem', color: '#2D1B14', margin: '0 0 8px', letterSpacing: '-1px' }}>NexusPour</h1>
            <p style={{ textAlign: 'center', color: '#7D746D', fontWeight: 600, fontSize: '0.9rem', margin: '0 0 32px' }}>Sign in to access station operations</p>

            <form onSubmit={handleLogin}>
              <div className="m3-input-group">
                <IonIcon icon={personOutline} />
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="m3-input-group">
                <IonIcon icon={lockClosedOutline} />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>

              {error && (
                <div style={{ padding: '12px 16px', background: '#FFEBEE', color: '#B3261E', borderRadius: '14px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '20px' }}>
                  {error}
                </div>
              )}

              <button type="submit" className="btn-primary-m3">
                SIGN IN
              </button>
            </form>

            <div style={{ marginTop: '28px', borderTop: '1px solid #E1E3D3', paddingTop: '24px' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#8D6E63', textAlign: 'center', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Quick Access Demo Roles</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className="quick-btn" onClick={() => handleQuickLogin('admin')}>
                  ⚙️ Admin
                </button>
                <button type="button" className="quick-btn" onClick={() => handleQuickLogin('staff')}>
                  👤 Staff
                </button>
              </div>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;
