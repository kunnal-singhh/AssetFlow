import React, { useState, useMemo } from 'react';
import { CheckCircle, XCircle, AlertTriangle, FileText, Search, Settings } from 'lucide-react';

const mockAuditItems = [
  { id: 'AF-001', name: 'MacBook Pro 16"', department: 'Engineering', location: 'Floor 3, Desk 12', expectedStatus: 'Allocated', status: 'Pending' },
  { id: 'AF-002', name: 'Dell UltraSharp Monitor', department: 'Engineering', location: 'Floor 3, Desk 12', expectedStatus: 'Allocated', status: 'Pending' },
  { id: 'AF-003', name: 'Dell Laptop', department: 'Sales', location: 'Floor 2, Room 4', expectedStatus: 'Available', status: 'Pending' },
  { id: 'AF-004', name: 'Conference Projector', department: 'Operations', location: 'Meeting Room A', expectedStatus: 'Available', status: 'Pending' },
  { id: 'AF-005', name: 'Ergonomic Chair', department: 'HR', location: 'Floor 1, Desk 5', expectedStatus: 'Allocated', status: 'Pending' },
];

export default function AssetAuditWorkspace() {
  const [items, setItems] = useState(mockAuditItems);
  const [searchQuery, setSearchQuery] = useState('');

  const handleStatusChange = (id, newStatus) => {
    setItems(items.map(item => item.id === id ? { ...item, status: newStatus } : item));
  };

  const handleCloseAudit = () => {
    alert('Audit cycle closed! Batch status shifts would execute here.');
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = useMemo(() => {
    return items.reduce((acc, item) => {
      acc[item.status]++;
      return acc;
    }, { Pending: 0, Verified: 0, Missing: 0, Damaged: 0 });
  }, [items]);

  const discrepancyCount = stats.Missing + stats.Damaged;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-base-content">Asset Audit Workspace</h1>
          <p className="text-base-content/70">Active Cycle: Q3 Annual Inventory Check</p>
        </div>
        <button className="btn btn-primary" onClick={handleCloseAudit}>
          <FileText className="w-4 h-4 mr-2" />
          Close Audit Cycle
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat bg-base-100 shadow rounded-box">
          <div className="stat-title">Total Items</div>
          <div className="stat-value">{items.length}</div>
        </div>
        <div className="stat bg-base-100 shadow rounded-box text-success">
          <div className="stat-title text-success">Verified</div>
          <div className="stat-value">{stats.Verified}</div>
        </div>
        <div className="stat bg-base-100 shadow rounded-box text-warning">
          <div className="stat-title text-warning">Pending</div>
          <div className="stat-value">{stats.Pending}</div>
        </div>
        <div className="stat bg-base-100 shadow rounded-box text-error">
          <div className="stat-title text-error">Discrepancies</div>
          <div className="stat-value">{discrepancyCount}</div>
        </div>
      </div>

      {discrepancyCount > 0 && (
        <div className="alert alert-error shadow-lg">
          <AlertTriangle />
          <div>
            <h3 className="font-bold">Discrepancies Detected</h3>
            <div className="text-xs">There are {discrepancyCount} items marked as missing or damaged. These will require resolution workflows upon cycle close.</div>
          </div>
        </div>
      )}

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex justify-between items-center mb-4">
            <h2 className="card-title">Verification Checklist</h2>
            <div className="form-control w-full max-w-xs relative">
               <Search className="absolute left-3 top-3 w-4 h-4 text-base-content/50" />
               <input 
                 type="text" 
                 placeholder="Search ID or Name..." 
                 className="input input-bordered w-full pl-10" 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
               />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Asset ID</th>
                  <th>Details</th>
                  <th>Location</th>
                  <th>Expected State</th>
                  <th>Verification Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(item => (
                  <tr key={item.id} className="hover">
                    <td className="font-mono text-sm">{item.id}</td>
                    <td>
                      <div className="font-semibold">{item.name}</div>
                      <div className="text-xs opacity-70">{item.department}</div>
                    </td>
                    <td>{item.location}</td>
                    <td><div className="badge badge-ghost">{item.expectedStatus}</div></td>
                    <td>
                      <div className="join">
                        <button 
                          className={`btn btn-sm join-item ${item.status === 'Verified' ? 'btn-success text-white' : 'btn-outline'}`}
                          onClick={() => handleStatusChange(item.id, 'Verified')}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button 
                          className={`btn btn-sm join-item ${item.status === 'Missing' ? 'btn-error text-white' : 'btn-outline'}`}
                          onClick={() => handleStatusChange(item.id, 'Missing')}
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                        <button 
                          className={`btn btn-sm join-item ${item.status === 'Damaged' ? 'btn-warning text-white' : 'btn-outline'}`}
                          onClick={() => handleStatusChange(item.id, 'Damaged')}
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-base-content/50">No items found matching criteria.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
