import { IonContent, IonPage } from '@ionic/react';
import ExploreContainer from '../components/ExploreContainer';
import Onboarding from '../components/Onboarding';

const Home: React.FC = () => {
  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="min-h-screen p-6 mobile-container" style={{ background: 'var(--bg)' }}>
          <div className="topbar">
            <div>
              <h1 className="text-2xl brand heading-display">CafeOps</h1>
              <div className="brand-sub">Fast, friendly cafe operations</div>
            </div>
            <div className="flex items-center gap-3">
              <button aria-label="notifications" className="p-2 rounded-lg bg-[rgba(0,0,0,0.04)]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 17H9" stroke="#334155" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <div className="user-bubble">CJ</div>
            </div>
          </div>

          <section className="mt-6 hero card animate-entrance">
            <div className="flex items-start gap-4">
              <div className="hero-illustration">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C12 2 7 6 7 10C7 13.866 9.68629 17 12 17C14.3137 17 17 13.866 17 10C17 6 12 2 12 2Z" stroke="#45A852" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div>
                <strong className="block text-lg">Ready to run your cafe today?</strong>
                <p className="muted">Check temperature logs, audits, and daily prep with one tap.</p>
                <div className="hero-cta">
                  <button className="btn btn-primary">Start Check</button>
                  <button className="btn" style={{ background: 'transparent', color: 'var(--coffee-700)' }}>View History</button>
                </div>
              </div>
            </div>
          </section>

          <div className="mt-6">
            <ExploreContainer />
          </div>

          {/* Show onboarding on first run */}
          {!localStorage.getItem('seen_onboarding') && (
            <Onboarding onClose={() => { localStorage.setItem('seen_onboarding', '1'); window.location.reload(); }} />
          )}

        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;
