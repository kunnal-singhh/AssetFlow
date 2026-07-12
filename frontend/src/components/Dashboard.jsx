import React, { useState, useEffect } from 'react';

// Developer 1: Dashboard Logic. Implement aggregate view constraints (e.g. total assets vs allocated).
const Dashboard = () => {
  const [stats, setStats] = useState({ totalAssets: 0, allocations: 0 });

  useEffect(() => {
    // Fetch summary stats from API
  }, []);

  return (
    <div className="dashboard">
      <h1>AssetFlow Dashboard</h1>
      {/* Developer 1: Add summary cards here */}
      <div className="stats-container">
        <p>Total Assets: {stats.totalAssets}</p>
        <p>Allocated: {stats.allocations}</p>
      </div>
    </div>
  );
};

export default Dashboard;
