import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

/* Import Pages */
import Dashboard from './pages/Dashboard';
import TempCheck from './pages/TempCheck';
import History from './pages/History';
import Inventory from './pages/Inventory';
import Checklist from './pages/Checklist';
import Allergens from './pages/Allergens';
// Settings page removed per user request

/* Core CSS */
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import './theme/variables.css';

setupIonicReact();

const App: React.FC = () => (
  <IonApp className="bg-gray-900">
    <IonReactRouter>
      <IonRouterOutlet>
        <Route exact path="/dashboard">
          <Dashboard />
        </Route>
        <Route exact path="/temp-check">
          <TempCheck />
        </Route>
        <Route exact path="/history">
          <History />
        </Route>
        <Route exact path="/inventory">
          <Inventory />
        </Route>
        <Route exact path="/allergens">
          <Allergens />
        </Route>
        {/* settings route removed */}
        <Route exact path="/checklist">
          <Checklist />
        </Route>
        <Route exact path="/">
          <Redirect to="/dashboard" />
        </Route>
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;