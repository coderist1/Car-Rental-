import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useVehicles } from '../hooks';
import { useLogReport } from '../context/LogReportContext';
import { Modal, ConfirmModal } from '../components';
import '../styles/pages/AdminDashboard.css';

function AdminDashboard() {
  const { user, getRegisteredUsers, updateUser, deleteUser, logout } = useAuth();
  const { vehicles, rentalHistory, deleteVehicle } = useVehicles();
  const { reports, removeReport } = useLogReport();
  const navigate = useNavigate();

  const [activePanel, setActivePanel] = useState('users');
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [confirmState, setConfirmState] = useState({
    open: false,
    message: '',
    onConfirm: null,
    variant: 'danger'
  });

  const handleLogout = () => {
    setProfileMenuOpen(false);
    setConfirmState({
      open: true,
      variant: 'danger',
      message: 'Are you sure you want to log out?',
      onConfirm: () => {
        logout();
        navigate('/login');
      }
    });
  };

  const users = getRegisteredUsers();
  const userName = user?.fullName || 'Admin';


  const analytics = useMemo(() => {
    const activeRentals = rentalHistory.filter(r => r.status === 'active').length;
    const openDisputes = reports.length;
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
  }, [users, vehicles, rentalHistory, reports]);

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
      {reports.length === 0 ? (
        <div className="admin-empty">No open disputes</div>
      ) : (
        <div className="admin-table disputes-table">
          <div className="table-header">
            <div className="th">Vehicle</div>
            <div className="th">Renter</div>
            <div className="th">Type</div>
            <div className="th">Date</div>
            <div className="th">Actions</div>
          </div>
          {reports.slice().reverse().map(r => (
            <div key={r.id} className="table-row">
              <div className="td">{r.vehicleName}</div>
              <div className="td">{r.renterName}</div>
              <div className="td">
                <span className="dispute-type-badge">
                  {r.type || 'Report'}
                </span>
              </div>
              <div className="td">{new Date(r.createdAt).toLocaleDateString()}</div>
              <div className="td action-buttons">
                <button
                  className="btn btn-sm btn-view"
                  onClick={() => setSelectedDispute(r)}
                >
                  View
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => {
                    setConfirmState({
                      open: true,
                      variant: 'danger',
                      message: 'Are you sure you want to delete this dispute report?',
                      onConfirm: () => removeReport(r.id)
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
          <div className="sidebar-brand"><svg width="30" height="30" viewBox="0 0 24 23" fill="none" stroke="currentColor" strokeWidth="2.5" className="auth-logo-svg">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M12 8v4" />
              <path d="M12 17h.01" />
            </svg> CarRental</div>
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
              <div className="admin-profile-menu" ref={profileMenuRef}>
                <button
                  className="admin-avatar-btn"
                  onClick={() => setProfileMenuOpen(o => !o)}
                >
                  {user?.avatar
                    ? <img src={user.avatar} alt="avatar" className="admin-avatar-img" />
                    : <span className="admin-avatar-initials">
                        {(user?.fullName || user?.firstName || 'A').charAt(0).toUpperCase()}
                      </span>
                  }
                </button>

                {profileMenuOpen && (
                  <div className="admin-profile-dropdown">
                    <div className="apd-header">
                      <div className="apd-avatar">
                        {user?.avatar
                          ? <img src={user.avatar} alt="avatar" className="admin-avatar-img" />
                          : <span className="admin-avatar-initials">
                              {(user?.fullName || user?.firstName || 'A').charAt(0).toUpperCase()}
                            </span>
                        }
                      </div>
                      <div>
                        <div className="apd-name">{userName}</div>
                        <div className="apd-email">{user?.email || ''}</div>
                        <span className="apd-role-badge">Administrator</span>
                      </div>
                    </div>
                    <div className="apd-divider" />
                    <button className="apd-item" onClick={() => { setProfileMenuOpen(false); navigate('/profile'); }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                      </svg>
                      My Profile
                    </button>
                    <div className="apd-divider" />
                    <button className="apd-item apd-logout" onClick={handleLogout}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h6a2 2 0 012 2v1"/>
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>


          <section className="admin-content">
            {panels[activePanel]()}
          </section>
        </main>
      </div>

      <Modal
        isOpen={!!selectedDispute}
        onClose={() => setSelectedDispute(null)}
        title="Dispute Details"
        size="medium"
      >
        {selectedDispute && (
          <div className="dispute-detail">
            <div className="dispute-detail-header">
              <span className="dispute-type-badge dispute-type-badge--lg">
                {selectedDispute.type || 'Report'}
              </span>
              <span className="dispute-detail-date">
                {new Date(selectedDispute.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}
              </span>
            </div>

            <div className="dispute-detail-grid">
              <div className="dispute-detail-item">
                <span className="dispute-detail-label">Vehicle</span>
                <span className="dispute-detail-value">{selectedDispute.vehicleName || '—'}</span>
              </div>
              <div className="dispute-detail-item">
                <span className="dispute-detail-label">Reported By</span>
                <span className="dispute-detail-value">{selectedDispute.renterName || '—'}</span>
              </div>
              <div className="dispute-detail-item">
                <span className="dispute-detail-label">Owner</span>
                <span className="dispute-detail-value">{selectedDispute.ownerName || '—'}</span>
              </div>
              <div className="dispute-detail-item">
                <span className="dispute-detail-label">Rental Period</span>
                <span className="dispute-detail-value">
                  {selectedDispute.startDate && selectedDispute.endDate
                    ? `${new Date(selectedDispute.startDate).toLocaleDateString()} — ${new Date(selectedDispute.endDate).toLocaleDateString()}`
                    : '—'}
                </span>
              </div>
            </div>

            <div className="dispute-message-box">
              <div className="dispute-message-box-header">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
                </svg>
                <span>Report Notes</span>
              </div>
              <p className="dispute-message-text">
                {[
                  selectedDispute.notes ? `Check-in Notes:\n${selectedDispute.notes}` : null,
                  selectedDispute.checkout?.notes ? `Check-out Notes:\n${selectedDispute.checkout.notes}` : null
                ]
                .filter(Boolean)
                .join('\n\n') || <em style={{ color: '#94a3b8' }}>No notes provided.</em>}
              </p>
            </div>

            <div className="dispute-detail-actions">
              <button
                className="btn btn-danger"
                onClick={() => {
                  setSelectedDispute(null);
                  setConfirmState({
                    open: true,
                    variant: 'danger',
                    message: 'Are you sure you want to delete this dispute report?',
                    onConfirm: () => removeReport(selectedDispute.id)
                  });
                }}
              >
                Delete Dispute
              </button>
              <button className="btn btn-secondary" onClick={() => setSelectedDispute(null)}>
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

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