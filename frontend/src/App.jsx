import React, { createContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import AssetInventory from './components/AssetInventory';
import AuditView from './components/AuditView';
import BookingMaintenance from './components/BookingMaintenance';
import OrganizationSetup from './components/OrganizationSetup';
import { ReportsAnalytics, ActivityLogs } from './components/audit-analytics';

// Create the shared state context
export const AppContext = createContext();

// Pre-seeded mock data matching Excalidraw mockup and system requirements
const initialDepartments = [
  { id: 1, name: 'Engineering', head: 'aditi rao', parent: '-', status: 'Active' },
  { id: 2, name: 'Facilities', head: 'rohan mehta', parent: '-', status: 'Active' },
  { id: 3, name: 'Field ops (east)', head: 'sana iqbal', parent: 'Field Ops', status: 'Inactive' },
  { id: 4, name: 'Field Ops', head: '-', parent: '-', status: 'Active' }
];

const initialCategories = [
  { id: 1, name: 'Electronics', attributes: { warrantyPeriod: '24 months', voltage: '220V' } },
  { id: 2, name: 'Furniture', attributes: { material: 'Oak Wood', dimensions: 'Standard' } },
  { id: 3, name: 'Vehicles', attributes: { fuelType: 'Diesel', transmission: 'Automatic' } },
  { id: 4, name: 'Spaces', attributes: { capacity: '10 people', projector: 'Yes' } }
];

const initialEmployees = [
  { id: 1, name: 'aditi rao', email: 'aditi.rao@assetflow.com', department: 'Engineering', role: 'Department Head', status: 'Active' },
  { id: 2, name: 'rohan mehta', email: 'rohan.mehta@assetflow.com', department: 'Facilities', role: 'Department Head', status: 'Active' },
  { id: 3, name: 'sana iqbal', email: 'sana.iqbal@assetflow.com', department: 'Field ops (east)', role: 'Employee', status: 'Active' },
  { id: 4, name: 'Priya Shah', email: 'priya.shah@assetflow.com', department: 'Engineering', role: 'Employee', status: 'Active' },
  { id: 5, name: 'Raj Patel', email: 'raj.patel@assetflow.com', department: 'Facilities', role: 'Employee', status: 'Active' },
  { id: 6, name: 'Kunal Singh', email: 'kunal.singh@assetflow.com', department: 'Engineering', role: 'Admin', status: 'Active' },
  { id: 7, name: 'Vikram Seth', email: 'vikram.seth@assetflow.com', department: 'Field Ops', role: 'Asset Manager', status: 'Active' }
];

const initialAssets = [
  { id: 1, tag: 'AF-0114', name: 'MacBook Pro 16"', category: 'Electronics', serial: 'SN-X987342', acquisitionDate: '2025-10-12', acquisitionCost: 2400, condition: 'Excellent', location: 'HQ - 4th Floor', shared: false, status: 'Allocated', department: 'Engineering', employee: 'Priya Shah', expectedReturnDate: '2026-07-10' }, // Overdue
  { id: 2, tag: 'AF-0062', name: 'Epson Projector 4K', category: 'Electronics', serial: 'SN-P293847', acquisitionDate: '2025-05-15', acquisitionCost: 950, condition: 'Good', location: 'Conf Room B2', shared: true, status: 'Available', department: '-', employee: '-', expectedReturnDate: '' },
  { id: 3, tag: 'AF-0099', name: 'Tesla Model 3', category: 'Vehicles', serial: 'SN-V827384', acquisitionDate: '2024-03-20', acquisitionCost: 35000, condition: 'Good', location: 'HQ Parking', shared: true, status: 'Under Maintenance', department: 'Field Ops', employee: '-', expectedReturnDate: '' },
  { id: 4, tag: 'AF-0105', name: 'Ergonomic Desk Chair', category: 'Furniture', serial: 'SN-C482938', acquisitionDate: '2025-01-10', acquisitionCost: 350, condition: 'Excellent', location: 'HQ - 3rd Floor', shared: false, status: 'Allocated', department: 'Facilities', employee: 'Rohan Mehta', expectedReturnDate: '2026-07-05' }, // Overdue
  { id: 5, tag: 'AF-0122', name: 'Dell UltraSharp 32"', category: 'Electronics', serial: 'SN-M384729', acquisitionDate: '2025-11-01', acquisitionCost: 700, condition: 'Good', location: 'HQ - 4th Floor', shared: false, status: 'Allocated', department: 'Engineering', employee: 'aditi rao', expectedReturnDate: '2026-07-01' }  // Overdue
];

const initialActivity = [
  { id: 1, type: 'allocation', text: 'Laptop AF-0114 - allocated to Priya Shah - Engineering dept', time: '2 hours ago' },
  { id: 2, type: 'booking', text: 'Room B2 - booking confirmed - 2:00 to 3:00 PM', time: '4 hours ago' },
  { id: 3, type: 'maintenance', text: 'Projector AF-0062 - maintenance resolved', time: '1 day ago' },
  { id: 4, type: 'registration', text: 'Tesla Model 3 AF-0099 registered successfully', time: '2 days ago' }
];

const initialBookings = [
  { id: 1, assetName: 'Epson Projector 4K', assetTag: 'AF-0062', userName: 'Raj Patel', startTime: '2026-07-12T14:00', endTime: '2026-07-12T15:00', status: 'Approved' }
];

const initialMaintenance = [
  { id: 1, assetName: 'Tesla Model 3', assetTag: 'AF-0099', userName: 'Vikram Seth', description: 'Brake inspection and tire rotation', status: 'In Progress', priority: 'High', date: '2026-07-12' }
];

const initialAuditCycles = [
  { id: 1, name: 'Q2 2026 Office Hardware Audit', department: 'Engineering', location: 'HQ - 4th Floor', auditor: 'Vikram Seth', status: 'In Progress' }
];

const initialTransfers = [
  { id: 1, assetTag: 'AF-0122', assetName: 'Dell UltraSharp 32"', currentHolder: 'aditi rao', requester: 'Priya Shah', department: 'Engineering', reason: 'Dual monitor workspace setup request.', status: 'Pending Approval' }
];

// Sidebar navigation link component to style active routes
function SidebarLink({ to, label, icon }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
        isActive
          ? 'bg-emerald-600 text-white font-medium shadow-lg shadow-emerald-950/20'
          : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}

function NavigationAndSidebar() {
  const { currentRole, setCurrentRole, assets } = React.useContext(AppContext);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedAssetDetail, setSelectedAssetDetail] = useState(null);

  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    const filtered = assets.filter(
      a => a.tag.toLowerCase().includes(q.toLowerCase()) || 
           a.serial.toLowerCase().includes(q.toLowerCase()) ||
           a.name.toLowerCase().includes(q.toLowerCase())
    );
    setSearchResults(filtered);
  };

  const handleSelectAsset = (asset) => {
    setSelectedAssetDetail(asset);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Get active name based on simulated role
  const getLoggedInUser = () => {
    switch (currentRole) {
      case 'Admin': return { name: 'Kunal Singh', email: 'kunal.singh@assetflow.com' };
      case 'Asset Manager': return { name: 'Vikram Seth', email: 'vikram.seth@assetflow.com' };
      case 'Department Head': return { name: 'Aditi Rao', email: 'aditi.rao@assetflow.com' };
      case 'Employee': return { name: 'Priya Shah', email: 'priya.shah@assetflow.com' };
      default: return { name: 'Kunal Singh', email: 'kunal.singh@assetflow.com' };
    }
  };

  const loggedIn = getLoggedInUser();

  return (
    <div className="flex h-screen w-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
      {/* Fixed Sidebar */}
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo */}
          <div className="px-6 py-6 border-b border-zinc-800/80 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-zinc-950 text-lg shadow-md shadow-emerald-500/10">
              AF
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-wider bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                AssetFlow
              </h1>
              <span className="text-[10px] text-zinc-500 font-semibold tracking-widest uppercase">
                ENTERPRISE RESOURCE
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 py-6 space-y-1">
            <SidebarLink to="/" label="Dashboard" icon="📊" />
            <SidebarLink to="/setup" label="Organization setup" icon="🏢" />
            <SidebarLink to="/assets" label="Assets" icon="📦" />
            <SidebarLink to="/allocations" label="Allocation & Transfer" icon="🔄" />
            <SidebarLink to="/bookings" label="Resource Booking" icon="📅" />
            <SidebarLink to="/maintenance" label="Maintenance" icon="🛠️" />
            <SidebarLink to="/audits" label="Audit" icon="📋" />
            <SidebarLink to="/reports" label="Reports" icon="📈" />
            <SidebarLink to="/notifications" label="Notifications" icon="🔔" />
          </nav>
        </div>

        {/* User Info / Role Swapper */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/40">
          <div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            <span>Simulate User Role</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <select
            value={currentRole}
            onChange={(e) => setCurrentRole(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-sm rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer font-medium"
          >
            <option value="Admin">Admin (Kunal S.)</option>
            <option value="Asset Manager">Asset Manager (Vikram S.)</option>
            <option value="Department Head">Dept Head (Aditi R.)</option>
            <option value="Employee">Employee (Priya S.)</option>
          </select>
          <div className="mt-3 flex items-center space-x-3 px-1">
            <div className="w-8 h-8 rounded-full bg-emerald-800 flex items-center justify-center font-semibold text-xs text-emerald-200 uppercase">
              {loggedIn.name[0] || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-zinc-200 truncate">{loggedIn.name}</p>
              <p className="text-[10px] text-zinc-500 truncate">{currentRole}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-zinc-950 overflow-hidden">
        {/* Header with search bar */}
        <header className="h-16 border-b border-zinc-800/80 px-8 flex items-center justify-between bg-zinc-900/30 backdrop-blur-md sticky top-0 z-10 shrink-0">
          <div className="flex items-center space-x-3 shrink-0">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
              Overview
            </span>
            <span className="text-zinc-700">|</span>
            <h2 className="text-xs font-bold text-zinc-400 tracking-wide">
              {currentRole} Console
            </h2>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-md mx-8 relative">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500 text-xs">🔍</span>
              <input
                type="text"
                placeholder="Search Asset Tag / Serial (e.g. AF-0114)..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full bg-zinc-950 border border-zinc-800/70 text-zinc-200 text-xs rounded-full pl-9 pr-4 py-2 focus:outline-none focus:border-emerald-500 transition-all placeholder-zinc-650"
              />
            </div>
            {/* Search Dropdown Results */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden max-h-64 overflow-y-auto z-50">
                {searchResults.map(asset => (
                  <div
                    key={asset.id}
                    onClick={() => handleSelectAsset(asset)}
                    className="px-4 py-3 hover:bg-zinc-800/40 cursor-pointer flex justify-between items-center text-xs border-b border-zinc-850 last:border-b-0"
                  >
                    <div>
                      <div className="font-semibold text-white">{asset.name}</div>
                      <div className="text-[10px] text-zinc-500">Serial: {asset.serial}</div>
                    </div>
                    <div className="text-right">
                      <span className="bg-zinc-950 px-2 py-0.5 border border-zinc-800 text-[10px] text-zinc-400 font-mono font-bold rounded-md">{asset.tag}</span>
                      <span className={`text-[10px] block mt-1 font-semibold ${
                        asset.status === 'Available' ? 'text-emerald-400' :
                        asset.status === 'Allocated' ? 'text-amber-400' : 'text-red-400'
                      }`}>{asset.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4 shrink-0">
            <div className="bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full text-xs font-medium text-zinc-400 flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Active: <strong className="text-zinc-200">{loggedIn.name}</strong></span>
            </div>
          </div>
        </header>

        {/* View Canvas */}
        <div className="flex-1 p-8 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/setup" element={<OrganizationSetup />} />
            <Route path="/assets" element={<AssetInventory />} />
            <Route path="/allocations" element={<div className="p-6 bg-zinc-900/50 rounded-xl border border-zinc-800 text-center"><h2 className="text-xl font-bold text-zinc-200 mb-2">Asset Allocation & Transfer</h2><p className="text-zinc-500">Manage asset transfers and handovers here. Currently using the quick action panel on the Dashboard.</p></div>} />
            <Route path="/bookings" element={<BookingMaintenance />} />
            <Route path="/maintenance" element={<div className="p-6 bg-zinc-900/50 rounded-xl border border-zinc-800 text-center"><h2 className="text-xl font-bold text-zinc-200 mb-2">Maintenance Management</h2><p className="text-zinc-500">Route repairs and inspect assets. Access this using the "Raise Request" action on the Dashboard.</p></div>} />
            <Route path="/audits" element={<AuditView />} />
            <Route path="/reports" element={<ReportsAnalytics />} />
            <Route path="/notifications" element={<ActivityLogs />} />
          </Routes>
        </div>
      </main>

      {/* Global Quick Search Detail Modal */}
      {selectedAssetDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden animate-zoomIn shadow-2xl">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] bg-zinc-950 border border-zinc-800 font-mono font-bold px-2 py-0.5 rounded text-zinc-400 uppercase">
                  Asset Lookup
                </span>
                <h3 className="font-bold text-lg text-white mt-1">Asset Details</h3>
              </div>
              <button onClick={() => setSelectedAssetDetail(null)} className="text-zinc-500 hover:text-zinc-300 text-lg cursor-pointer">✕</button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Asset Name</span>
                  <span className="text-zinc-200 font-semibold">{selectedAssetDetail.name}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Asset Tag</span>
                  <span className="text-emerald-400 font-mono font-bold">{selectedAssetDetail.tag}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Category</span>
                  <span className="text-zinc-200 font-semibold">{selectedAssetDetail.category}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Serial Number</span>
                  <span className="text-zinc-250 font-mono font-semibold">{selectedAssetDetail.serial}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Acquisition Date</span>
                  <span className="text-zinc-300">{selectedAssetDetail.acquisitionDate}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Acquisition Cost</span>
                  <span className="text-zinc-300">${selectedAssetDetail.acquisitionCost}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Condition</span>
                  <span className="text-zinc-300">{selectedAssetDetail.condition}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Location</span>
                  <span className="text-zinc-300">{selectedAssetDetail.location}</span>
                </div>
              </div>

              <div className="border-t border-zinc-800 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Current Holder</span>
                    <span className="text-zinc-200 font-semibold">{selectedAssetDetail.employee || 'None'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Status</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                      selectedAssetDetail.status === 'Available' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50' :
                      selectedAssetDetail.status === 'Allocated' ? 'bg-amber-950/40 text-amber-400 border border-amber-900/50' :
                      'bg-red-950/40 text-red-400 border border-red-900/50'
                    }`}>
                      {selectedAssetDetail.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end">
                <button
                  onClick={() => setSelectedAssetDetail(null)}
                  className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-bold text-zinc-200 transition-all cursor-pointer"
                >
                  Close View
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  const [currentRole, setCurrentRole] = useState(() => {
    return localStorage.getItem('af_current_role') || 'Admin';
  });

  const [departments, setDepartments] = useState(() => {
    const saved = localStorage.getItem('af_departments');
    return saved ? JSON.parse(saved) : initialDepartments;
  });

  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('af_categories');
    return saved ? JSON.parse(saved) : initialCategories;
  });

  const [employees, setEmployees] = useState(() => {
    const saved = localStorage.getItem('af_employees');
    return saved ? JSON.parse(saved) : initialEmployees;
  });

  const [assets, setAssets] = useState(() => {
    const saved = localStorage.getItem('af_assets');
    return saved ? JSON.parse(saved) : initialAssets;
  });

  const [activity, setActivity] = useState(() => {
    const saved = localStorage.getItem('af_activity');
    return saved ? JSON.parse(saved) : initialActivity;
  });

  const [bookings, setBookings] = useState(() => {
    const saved = localStorage.getItem('af_bookings');
    return saved ? JSON.parse(saved) : initialBookings;
  });

  const [maintenance, setMaintenance] = useState(() => {
    const saved = localStorage.getItem('af_maintenance');
    return saved ? JSON.parse(saved) : initialMaintenance;
  });

  const [auditCycles, setAuditCycles] = useState(() => {
    const saved = localStorage.getItem('af_audit_cycles');
    return saved ? JSON.parse(saved) : initialAuditCycles;
  });

  const [transfers, setTransfers] = useState(() => {
    const saved = localStorage.getItem('af_transfers');
    return saved ? JSON.parse(saved) : initialTransfers;
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('af_current_role', currentRole);
  }, [currentRole]);

  useEffect(() => {
    localStorage.setItem('af_departments', JSON.stringify(departments));
  }, [departments]);

  useEffect(() => {
    localStorage.setItem('af_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('af_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('af_assets', JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
    localStorage.setItem('af_activity', JSON.stringify(activity));
  }, [activity]);

  useEffect(() => {
    localStorage.setItem('af_bookings', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem('af_maintenance', JSON.stringify(maintenance));
  }, [maintenance]);

  useEffect(() => {
    localStorage.setItem('af_audit_cycles', JSON.stringify(auditCycles));
  }, [auditCycles]);

  useEffect(() => {
    localStorage.setItem('af_transfers', JSON.stringify(transfers));
  }, [transfers]);

  // Helpers to add or update records
  const addDepartment = (dept) => {
    setDepartments((prev) => [...prev, { ...dept, id: Date.now() }]);
    logActivity('registration', `Department "${dept.name}" created under organization setup.`);
  };

  const updateDepartment = (updatedDept) => {
    setDepartments((prev) => prev.map((d) => (d.id === updatedDept.id ? updatedDept : d)));
    logActivity('registration', `Department "${updatedDept.name}" updated in organization setup.`);
  };

  const addCategory = (cat) => {
    setCategories((prev) => [...prev, { ...cat, id: Date.now() }]);
    logActivity('registration', `Category "${cat.name}" added to organization setup.`);
  };

  const updateCategory = (updatedCat) => {
    setCategories((prev) => prev.map((c) => (c.id === updatedCat.id ? updatedCat : c)));
    logActivity('registration', `Category "${updatedCat.name}" updated in organization setup.`);
  };

  const addEmployee = (emp) => {
    setEmployees((prev) => [...prev, { ...emp, id: Date.now() }]);
    logActivity('registration', `New employee "${emp.name}" joined - role set to ${emp.role}.`);
  };

  const updateEmployee = (updatedEmp) => {
    setEmployees((prev) => prev.map((e) => (e.id === updatedEmp.id ? updatedEmp : e)));
    logActivity('registration', `Employee directory record updated for "${updatedEmp.name}".`);
  };

  const registerAsset = (asset) => {
    const newTag = `AF-${String(assets.length + 100).padStart(4, '0')}`;
    const newAsset = { ...asset, id: Date.now(), tag: newTag, status: 'Available', employee: '-', expectedReturnDate: '' };
    setAssets((prev) => [...prev, newAsset]);
    logActivity('registration', `Registered new asset ${newAsset.name} (Tag: ${newTag}) in ${asset.location}`);
  };

  const createBooking = (booking) => {
    const newBooking = { ...booking, id: Date.now(), status: 'Approved' };
    setBookings((prev) => [...prev, newBooking]);
    // Find asset and allocate it
    setAssets((prev) =>
      prev.map((a) =>
        a.tag === booking.assetTag ? { ...a, status: 'Allocated', employee: booking.userName, expectedReturnDate: booking.endTime.split('T')[0] } : a
      )
    );
    logActivity('booking', `${booking.assetName} - booking confirmed for ${booking.userName}`);
  };

  const createMaintenanceRequest = (request) => {
    const newReq = { ...request, id: Date.now(), status: 'In Progress' };
    setMaintenance((prev) => [...prev, newReq]);
    // Set asset to Under Maintenance
    setAssets((prev) =>
      prev.map((a) => (a.tag === request.assetTag ? { ...a, status: 'Under Maintenance' } : a))
    );
    logActivity('maintenance', `${request.assetName} (${request.assetTag}) - maintenance requested: ${request.description}`);
  };

  const addAuditCycle = (audit) => {
    const newAudit = { ...audit, id: Date.now(), status: 'In Progress' };
    setAuditCycles((prev) => [...prev, newAudit]);
    logActivity('audit', `New Audit Cycle "${audit.name}" launched for ${audit.department} dept.`);
  };

  const requestTransfer = (transfer) => {
    const newTransfer = { ...transfer, id: Date.now(), status: 'Pending Approval' };
    setTransfers((prev) => [...prev, newTransfer]);
    logActivity('transfer', `Transfer requested: ${transfer.assetName} (${transfer.assetTag}) to ${transfer.requester}`);
  };

  const approveTransfer = (transferId) => {
    const target = transfers.find(t => t.id === transferId);
    if (!target) return;

    // Allocate asset to requester
    setAssets((prev) =>
      prev.map((a) =>
        a.tag === target.assetTag ? { ...a, employee: target.requester, department: target.department, status: 'Allocated' } : a
      )
    );

    // Update transfer status
    setTransfers((prev) =>
      prev.map((t) => (t.id === transferId ? { ...t, status: 'Approved' } : t))
    );

    logActivity('transfer', `Transfer approved: ${target.assetName} (${target.assetTag}) re-allocated to ${target.requester}`);
  };

  const returnAsset = (assetTag, notes) => {
    const target = assets.find(a => a.tag === assetTag);
    if (!target) return;

    setAssets((prev) =>
      prev.map((a) =>
        a.tag === assetTag
          ? { ...a, status: 'Available', employee: '-', department: '-', expectedReturnDate: '', condition: notes || a.condition }
          : a
      )
    );

    logActivity('allocation', `${target.name} (${assetTag}) returned by ${target.employee} - notes: ${notes || 'Good'}`);
  };

  const logActivity = (type, text) => {
    const newAct = {
      id: Date.now(),
      type,
      text,
      time: 'Just now'
    };
    setActivity((prev) => [newAct, ...prev]);
  };

  return (
    <AppContext.Provider
      value={{
        currentRole,
        setCurrentRole,
        departments,
        addDepartment,
        updateDepartment,
        categories,
        addCategory,
        updateCategory,
        employees,
        addEmployee,
        updateEmployee,
        assets,
        registerAsset,
        activity,
        bookings,
        createBooking,
        maintenance,
        createMaintenanceRequest,
        auditCycles,
        addAuditCycle,
        transfers,
        requestTransfer,
        approveTransfer,
        returnAsset,
        logActivity
      }}
    >
      <Router>
        <NavigationAndSidebar />
      </Router>
    </AppContext.Provider>
  );
}

export default App;