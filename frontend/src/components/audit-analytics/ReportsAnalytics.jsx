import React from 'react';
import { BarChart3, TrendingUp, AlertCircle, Clock } from 'lucide-react';

const mockWatchlist = [
  { id: 'AF-0021', name: 'Mobile Workstation', user: 'Sarah Jenkins', daysOverdue: 3 },
  { id: 'AF-0045', name: 'Sony A7III Camera', user: 'Marketing Dept', daysOverdue: 1 },
];

const mockUtilization = [
  { name: 'Laptops', value: 85 },
  { name: 'Monitors', value: 60 },
  { name: 'Projectors', value: 30 },
  { name: 'Tablets', value: 45 },
];

export default function ReportsAnalytics() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-base-content">Reports & Analytics</h1>
        <p className="text-base-content/70">System-wide asset utilization and health metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Utilization Chart Stub */}
        <div className="card bg-base-100 shadow-xl col-span-1 md:col-span-2">
          <div className="card-body">
            <h2 className="card-title"><BarChart3 className="w-5 h-5 mr-2"/> Asset Utilization by Category</h2>
            <div className="flex flex-col gap-4 mt-4">
              {mockUtilization.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{item.name}</span>
                    <span className="font-bold">{item.value}%</span>
                  </div>
                  <progress className="progress progress-primary w-full" value={item.value} max="100"></progress>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex flex-col gap-6">
          <div className="card bg-primary text-primary-content shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-sm opacity-80 uppercase tracking-wider">Total Value Managed</h2>
              <div className="text-4xl font-bold">$1.2M</div>
              <div className="flex items-center text-sm mt-2 opacity-90">
                <TrendingUp className="w-4 h-4 mr-1"/> +4.2% from last month
              </div>
            </div>
          </div>
          
          <div className="card bg-base-100 shadow-xl">
             <div className="card-body p-4 flex flex-row items-center gap-4">
                <div className="p-3 bg-secondary/10 text-secondary rounded-full">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-base-content">24%</div>
                  <div className="text-sm text-base-content/70">Idle Assets (30+ days)</div>
                </div>
             </div>
          </div>
        </div>

        {/* Watchlist */}
        <div className="card bg-base-100 shadow-xl col-span-1 md:col-span-3">
          <div className="card-body">
            <h2 className="card-title text-error mb-2"><AlertCircle className="w-5 h-5 mr-2"/> Aging Equipment & Overdue Watchlist</h2>
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Asset ID</th>
                    <th>Name</th>
                    <th>Current Holder</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {mockWatchlist.map(item => (
                    <tr key={item.id}>
                      <td className="font-mono text-sm">{item.id}</td>
                      <td>{item.name}</td>
                      <td>{item.user}</td>
                      <td>
                        <span className="badge badge-error gap-1">
                          Overdue: {item.daysOverdue} days
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
