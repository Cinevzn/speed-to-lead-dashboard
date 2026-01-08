import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import SetterReport from './components/SetterReport';
import OverallStats from './components/OverallStats';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="App">
      <div className="container">
        <div className="header">
          <h1>Speed to Lead Dashboard</h1>
          <p>Track and monitor appointment setter performance</p>
        </div>

        <div className="tabs">
          <button
            className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`tab ${activeTab === 'overall' ? 'active' : ''}`}
            onClick={() => setActiveTab('overall')}
          >
            Overall Stats
          </button>
          <button
            className={`tab ${activeTab === 'setters' ? 'active' : ''}`}
            onClick={() => setActiveTab('setters')}
          >
            Setter Reports
          </button>
        </div>

        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'overall' && <OverallStats />}
        {activeTab === 'setters' && <SetterReport />}
      </div>
    </div>
  );
}

export default App;

