import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { SDKConfigurationManager } from './components/SDKConfiguration';
import { CampaignManager } from './components/CampaignManager';
import { InventoryManager } from './components/InventoryManager';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/sdk-config" element={<SDKConfigurationManager />} />
          <Route path="/campaigns" element={<CampaignManager />} />
          <Route path="/inventory" element={<InventoryManager />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;