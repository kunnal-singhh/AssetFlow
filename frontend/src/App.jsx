import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import AssetInventory from './components/AssetInventory';
import AuditView from './components/AuditView';
import BookingMaintenance from './components/BookingMaintenance';
import AssetAllocation from './components/AssetAllocation';

// Developer 1: App entry point. Set up global layout and routing constraints.
function App() {
  return (
    <Router>
      <div className="app-container">
        <nav>
          <ul>
            <li><Link to="/">Dashboard</Link></li>
            <li><Link to="/assets">Asset Inventory</Link></li>
            <li><Link to="/allocations">Allocation & Transfer</Link></li>
            <li><Link to="/audits">Audit Cycles</Link></li>
            <li><Link to="/bookings">Bookings & Maintenance</Link></li>
          </ul>
        </nav>
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/assets" element={<AssetInventory />} />
            <Route path="/allocations" element={<AssetAllocation />} />
            <Route path="/audits" element={<AuditView />} />
            <Route path="/bookings" element={<BookingMaintenance />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;