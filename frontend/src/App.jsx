import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ScenarioModeller from './pages/ScenarioModeller';
import Procurement from './pages/Procurement';
import DigitalTwin from './pages/DigitalTwin';
import Settings from './pages/Settings';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/scenario" element={<ScenarioModeller />} />
          <Route path="/procurement" element={<Procurement />} />
          <Route path="/map" element={<DigitalTwin />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
