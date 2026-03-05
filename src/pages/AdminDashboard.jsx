import React, { useState, useMemo } from 'react';
import { useAuth, useVehicles } from '../hooks';
import { ProfileMenu, Modal, ConfirmModal } from '../components';
import '../styles/pages/AdminDashboard.css';

function AdminDashboard() {
  const { user, getRegisteredUsers, updateUser, deleteUser } = useAuth();
  const { vehicles, rentalHistory, deleteVehicle } = useVehicles();
  
  const [activePanel, setActivePanel] = useState('users');
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);

  // Confirmation dialog state used for any destructive/important action
  const [confirmState, setConfirmState] = useState({
    open: false,
    message: '',
    onConfirm: null,
    variant: 'danger'
  });

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

  // Status badge color map — guarantees colors even if CSS is overridden
  const getStatusStyle = (status = 'available') => {
    const map = {
      available:   { background: '#dcfce7', color: '#16a34a' },
      rented:      { background: '#dbeafe', color: '#2563eb' },
      active:      { background: '#dbeafe', color: '#2563eb' },
      pending:     { background: '#fef3c7', color: '#d97706' },
      maintenance: { background: '#ffedd5', color: '#ea580c' },
      inactive:    { background: '#f1f5f9', color: '#64748b' },
      unavailable: { background: '#f1f5f9', color: '#64748b' },
      rejected:    { background: '#fee2e2', color: '#dc2626' },
      declined:    { background: '#fee2e2', color: '#dc2626' },
    };
    return map[status.toLowerCase()] || { background: '#f1f5f9', color: '#64748b' };
  };

  const renderUsersPanel = () => {
    return (
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
              <div className="th">Actions</div>
            </div>
            {users.map(u => (
            <div key={u.id} className="table-row">
              <div className="td">{u.fullName || `${u.firstName} ${u.lastName}`}</div>
              <div className="td">{u.email}</div>
              <div className="td">
                <span className={`role-badge ${u.role}`}>{u.role}</span>
              </div>
              <div className="td action-buttons">
                {/* action buttons with confirmation */}
                <button
                  className="btn btn-warning btn-sm"
                  onClick={() => {
                    setConfirmState({
                      open: true,
                      variant: 'warning',
                      message: `Are you sure you want to ${u.active !== false ? 'deactivate' : 'activate'} this user?`,
                      onConfirm: () => {
                        updateUser(u.id, { active: !u.active });
                      }
                    });
                  }}
                >
                  {u.active !== false ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => {
                    setConfirmState({
                      open: true,
                      variant: 'danger',
                      message: 'Are you sure you want to delete this user?',
                      onConfirm: () => {
                        deleteUser(u.id);
                      }
                    });
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
  };

const renderVehiclesPanel = () => (
  <div className="admin-panel">
    <h2 className="panel-title">Vehicles</h2>
    {vehicles.length === 0 ? (
      <div className="admin-empty">No registered vehicles</div>
    ) : (
      <div className="admin-table vehicles-table">
        <div className="table-header">
          <div className="th">Vehicle</div>
          <div className="th">Owner</div>
          <div className="th">Price/Day</div>
          <div className="th">Status</div>
          <div className="th">Actions</div>
        </div>
        {vehicles.map(v => (
          <div key={v.id} className="table-row">
            <div className="td">{v.brand} {v.name}</div>
            <div className="td">{v.owner || 'Unknown'}</div>
            <div className="td">₱{Number(v.pricePerDay || 0).toLocaleString()}</div>
            <div className="td">
              <span
                className={`vehicle-status-badge vehicle-status-${(v.status || 'available').toLowerCase()}`}
                style={getStatusStyle(v.status || 'available')}
              >
                {v.status || 'Available'}
              </span>
            </div>
            <div className="td action-buttons">
              <button
                className="btn btn-danger btn-sm"
                onClick={() => {
                  setConfirmState({
                    open: true,
                    variant: 'danger',
                    message: 'Are you sure you want to delete this vehicle?',
                    onConfirm: () => {
                      deleteVehicle(v.id);
                    }
                  });
                }}
              >
                Delete
              </button>
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
        <div className="admin-table no-status">
          <div className="table-header">
            <div className="th">Vehicle</div>
            <div className="th">Renter</div>
            <div className="th">Owner</div>
            <div className="th">Amount</div>
          </div>
          {rentalHistory.slice().reverse().map(r => (
            <div key={r.id} className="table-row">
              <div className="td">{r.vehicleName}</div>
              <div className="td">{r.renterName}</div>
              <div className="td">{r.ownerName}</div>
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
                <span
                  className={`vehicle-status-badge vehicle-status-${(v.status || 'available').toLowerCase()}`}
                  style={getStatusStyle(v.status || 'available')}
                >
                  {v.status || 'Available'}
                </span>
                <span>₱{v.pricePerDay?.toLocaleString()}/day</span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* universal confirmation modal for admin actions */}
      <ConfirmModal
        isOpen={confirmState.open}
        onClose={() => setConfirmState(s => ({ ...s, open: false }))}
        message={confirmState.message}
        onConfirm={() => {
          if (confirmState.onConfirm) confirmState.onConfirm();
          setConfirmState(s => ({ ...s, open: false }));
        }}
        variant={confirmState.variant}
      />
    </div>
  );
}

export default AdminDashboard;