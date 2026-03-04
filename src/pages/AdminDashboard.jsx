import React, { useState, useMemo } from 'react';
import { useAuth, useVehicles } from '../hooks';
import { ProfileMenu, Modal } from '../components';
import '../styles/pages/AdminDashboard.css';

function AdminDashboard() {
  const { user, getRegisteredUsers } = useAuth();
  const { vehicles, rentalHistory } = useVehicles();
  
  const [activePanel, setActivePanel] = useState('users');
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);

  const users = getRegisteredUsers();
  const userName = user?.fullName || 'Admin';

  // Analytics calculations
  const analytics = useMemo(() => {
    const activeRentals = rentalHistory.filter(r => r.status === 'active').length;
    const openDisputes = 0; // Placeholder for future feature
    const estimatedRevenue = rentalHistory
      .filter(r => r.status === 'active')
      .reduce((sum, r) => sum + Number(r.amount || 0), 0);

    return {
      totalUsers: users.length,
      totalVehicles: vehicles.length,
      activeRentals,
      openDisputes,
      estimatedRevenue
    };
  }, [users, vehicles, rentalHistory]);

  // Group vehicles by owner
  const vehiclesByOwner = useMemo(() => {
    const grouped = {};
    vehicles.forEach(v => {
      const ownerId = v.ownerId || 'unknown';
      if (!grouped[ownerId]) {
        grouped[ownerId] = {
          owner: v.owner || 'Unknown Owner',
          email: v.ownerEmail || '',
          vehicles: []
        };
      }
      grouped[ownerId].vehicles.push(v);
    });
    return grouped;
  }, [vehicles]);

  const handleViewOwnerVehicles = (ownerId) => {
    setSelectedOwner(vehiclesByOwner[ownerId]);
    setIsVehicleModalOpen(true);
  };

  const renderUsersPanel = () => (
    <div className="admin-panel">
      <h2 className="panel-title">Users</h2>
      {users.length === 0 ? (
        <div className="admin-empty">No registered users</div>
      ) : (
        <div className="admin-table">
          <div className="table-header">
            <div className="th">Name</div>
            <div className="th">Email</div>
            <div className="th">Role</div>
            <div className="th">Status</div>
          </div>
          {users.map(u => (
            <div key={u.id} className="table-row">
              <div className="td">{u.fullName || `${u.firstName} ${u.lastName}`}</div>
              <div className="td">{u.email}</div>
              <div className="td">
                <span className={`role-badge ${u.role}`}>{u.role}</span>
              </div>
              <div className="td">
                <span className={`status-badge ${u.active !== false ? 'active' : 'inactive'}`}>
                  {u.active !== false ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderVehiclesPanel = () => (
    <div className="admin-panel">
      <h2 className="panel-title">Vehicles</h2>
      {vehicles.length === 0 ? (
        <div className="admin-empty">No registered vehicles</div>
      ) : (
        <div className="admin-table">
          <div className="table-header">
            <div className="th">Vehicle</div>
            <div className="th">Owner</div>
            <div className="th">Price/Day</div>
            <div className="th">Status</div>
          </div>
          {vehicles.map(v => (
            <div key={v.id} className="table-row">
              <div className="td">{v.brand} {v.name}</div>
              <div className="td">{v.owner || 'Unknown'}</div>
              <div className="td">₱{v.pricePerDay?.toLocaleString()}</div>
              <div className="td">
                <span className={`status-badge ${v.status}`}>{v.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderRentalsPanel = () => (
    <div className="admin-panel">
      <h2 className="panel-title">Rentals</h2>
      {rentalHistory.length === 0 ? (
        <div className="admin-empty">No rental records</div>
      ) : (
        <div className="admin-table">
          <div className="table-header">
            <div className="th">Vehicle</div>
            <div className="th">Renter</div>
            <div className="th">Owner</div>
            <div className="th">Status</div>
            <div className="th">Amount</div>
          </div>
          {rentalHistory.slice().reverse().map(r => (
            <div key={r.id} className="table-row">
              <div className="td">{r.vehicleName}</div>
              <div className="td">{r.renterName}</div>
              <div className="td">{r.ownerName}</div>
              <div className="td">
                <span className={`status-badge ${r.status}`}>{r.status}</span>
              </div>
              <div className="td">₱{r.amount}/day</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderApprovalsPanel = () => (
    <div className="admin-panel">
      <h2 className="panel-title">Approvals</h2>
      <div className="admin-empty">No pending approvals</div>
    </div>
  );

  const renderDisputesPanel = () => (
    <div className="admin-panel">
      <h2 className="panel-title">Disputes</h2>
      <div className="admin-empty">No open disputes</div>
    </div>
  );

  const renderLogsPanel = () => (
    <div className="admin-panel">
      <h2 className="panel-title">Audit Log</h2>
      <div className="admin-empty">No audit logs available</div>
    </div>
  );

  const renderAnalyticsPanel = () => (
    <div className="admin-panel">
      <h2 className="panel-title">Analytics Overview</h2>
      <div className="analytics-grid">
        <div className="analytics-card">
          <div className="analytics-label">Total Users</div>
          <div className="analytics-value">{analytics.totalUsers}</div>
        </div>
        <div className="analytics-card">
          <div className="analytics-label">Active Vehicles</div>
          <div className="analytics-value">{analytics.totalVehicles}</div>
        </div>
        <div className="analytics-card">
          <div className="analytics-label">Ongoing Rentals</div>
          <div className="analytics-value">{analytics.activeRentals}</div>
        </div>
        <div className="analytics-card">
          <div className="analytics-label">Open Disputes</div>
          <div className="analytics-value">{analytics.openDisputes}</div>
        </div>
        <div className="analytics-card">
          <div className="analytics-label">Est. Daily Revenue</div>
          <div className="analytics-value">₱{analytics.estimatedRevenue.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );

  const panels = {
    users: renderUsersPanel,
    vehicles: renderVehiclesPanel,
    rentals: renderRentalsPanel,
    approvals: renderApprovalsPanel,
    disputes: renderDisputesPanel,
    logs: renderLogsPanel,
    analytics: renderAnalyticsPanel
  };

  const navItems = [
    { id: 'users', label: 'Users' },
    { id: 'vehicles', label: 'Vehicles' },
    { id: 'approvals', label: 'Approvals' },
    { id: 'rentals', label: 'Rentals' },
    { id: 'disputes', label: 'Disputes' },
    { id: 'logs', label: 'Audit Log' },
    { id: 'analytics', label: 'Analytics' }
  ];

  return (
    <div className="admin-dashboard">
      <div className="admin-layout">
        <aside className="sidebar">
          <div className="sidebar-brand">CarRental</div>
          <nav className="sidebar-nav">
            {navItems.map(item => (
              <button
                key={item.id}
                className={`nav-item ${activePanel === item.id ? 'active' : ''}`}
                onClick={() => setActivePanel(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="admin-main">
          <header className="admin-header">
            <div className="admin-heading">
              <h1>Admin Dashboard</h1>
              <p className="admin-subtitle">Monitor users, vehicles, and rentals in one place.</p>
            </div>
            <div className="user-info">
              <span className="welcome-text">Welcome, {userName}</span>
              <ProfileMenu />
            </div>
          </header>

          <section className="admin-analytics-summary">
            <div className="analytics-card">
              <div className="analytics-label">Total Users</div>
              <div className="analytics-value">{analytics.totalUsers}</div>
            </div>
            <div className="analytics-card">
              <div className="analytics-label">Active Vehicles</div>
              <div className="analytics-value">{analytics.totalVehicles}</div>
            </div>
            <div className="analytics-card">
              <div className="analytics-label">Ongoing Rentals</div>
              <div className="analytics-value">{analytics.activeRentals}</div>
            </div>
            <div className="analytics-card">
              <div className="analytics-label">Est. Daily Revenue</div>
              <div className="analytics-value">₱{analytics.estimatedRevenue.toLocaleString()}</div>
            </div>
          </section>

          <section className="admin-content">
            {panels[activePanel]()}
          </section>
        </main>
      </div>

      {/* Owner Vehicles Modal */}
      <Modal
        isOpen={isVehicleModalOpen}
        onClose={() => { setIsVehicleModalOpen(false); setSelectedOwner(null); }}
        title={`Vehicles for ${selectedOwner?.owner || 'Owner'}`}
        size="large"
      >
        {selectedOwner && (
          <div className="owner-vehicles-list">
            {selectedOwner.vehicles.map(v => (
              <div key={v.id} className="owner-vehicle-item">
                <span>{v.brand} {v.name}</span>
                <span className={`status-badge ${v.status}`}>{v.status}</span>
                <span>₱{v.pricePerDay?.toLocaleString()}/day</span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default AdminDashboard;
