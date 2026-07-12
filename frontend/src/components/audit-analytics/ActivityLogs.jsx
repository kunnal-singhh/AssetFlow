import React, { useState } from 'react';
import { Calendar, Search, Filter, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const mockLogs = [
  { id: 1, type: 'Alerts', message: 'Overdue return: AF-0021 by Sarah Jenkins', time: '10 mins ago', date: '2026-07-12 12:00' },
  { id: 2, type: 'Approvals', message: 'Maintenance ticket #451 approved by Manager', time: '1 hour ago', date: '2026-07-12 11:10' },
  { id: 3, type: 'Bookings', message: 'Meeting Room A reserved for Marketing Sync', time: '2 hours ago', date: '2026-07-12 10:05' },
  { id: 4, type: 'Alerts', message: 'Audit discrepancy: AF-003 missing', time: '5 hours ago', date: '2026-07-12 07:15' },
  { id: 5, type: 'Bookings', message: 'Dell UltraSharp allocated to New Hire', time: '1 day ago', date: '2026-07-11 09:30' },
];

export default function ActivityLogs() {
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');

  const tabs = ['All', 'Alerts', 'Approvals', 'Bookings'];

  const filteredLogs = mockLogs.filter(log => {
    const matchesTab = activeTab === 'All' || log.type === activeTab;
    const matchesSearch = log.message.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getIcon = (type) => {
    switch (type) {
      case 'Alerts': return <AlertTriangle className="w-5 h-5 text-error" />;
      case 'Approvals': return <CheckCircle className="w-5 h-5 text-success" />;
      case 'Bookings': return <Calendar className="w-5 h-5 text-info" />;
      default: return <Clock className="w-5 h-5 text-base-content/50" />;
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-base-content">System Activity Logs</h1>
          <p className="text-base-content/70">Real-time audit trail and event tracking</p>
        </div>

        <div className="form-control relative w-full sm:w-auto">
          <Search className="w-4 h-4 absolute left-3 top-3 text-base-content/50" />
          <input
            type="text"
            placeholder="Search logs..."
            className="input input-bordered pl-10 w-full"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="tabs tabs-boxed bg-base-200/50 p-1 w-full max-w-md">
        {tabs.map(tab => (
          <button
            key={tab}
            className={`tab flex-1 ${activeTab === tab ? 'tab-active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-base-100 rounded-box shadow-xl border border-base-200">
        <ul className="divide-y divide-base-200">
          {filteredLogs.map(log => (
            <li key={log.id} className="p-4 hover:bg-base-200/50 transition-colors flex gap-4 items-start">
              <div className="mt-1">
                {getIcon(log.type)}
              </div>
              <div className="flex-1">
                <p className="text-base-content font-medium">{log.message}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-base-content/60">
                  <span className="badge badge-ghost badge-sm">{log.type}</span>
                  <span>•</span>
                  <span>{log.time}</span>
                  <span className="hidden sm:inline">• {log.date}</span>
                </div>
              </div>
              <div className="flex-none">
                <label className="cursor-pointer label">
                  <input type="checkbox" className="checkbox checkbox-sm" />
                </label>
              </div>
            </li>
          ))}
          {filteredLogs.length === 0 && (
            <li className="p-8 text-center text-base-content/50">
              No activity logs found matching the current filters.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
