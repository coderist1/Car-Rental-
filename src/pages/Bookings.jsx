import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useVehicles } from '../hooks';
import '../styles/pages/Bookings.css';

function Bookings() {
  const { user } = useAuth();
  const { rentalHistory } = useVehicles();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter rentals for current user
  const userRentals = useMemo(() => {
    return rentalHistory.filter(rental => rental.renterId === user?.email);
  }, [rentalHistory, user]);

  // Filter by tab and search
  const filteredRentals = useMemo(() => {
    let rentals = userRentals;

    // Filter by status tab
    if (activeTab !== 'all') {
      rentals = rentals.filter(r => r.status === activeTab);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      rentals = rentals.filter(r => 
        r.vehicleName?.toLowerCase().includes(query) ||
        r.vehicleModel?.toLowerCase().includes(query) ||
        r.ownerName?.toLowerCase().includes(query)
      );
    }

    return rentals;
  }, [userRentals, activeTab, searchQuery]);

  // Stats
  const stats = useMemo(() => ({
    total: userRentals.length,
    pending: userRentals.filter(r => r.status === 'pending').length,
    approved: userRentals.filter(r => r.status === 'approved').length,
    completed: userRentals.filter(r => r.status === 'completed').length,
    rejected: userRentals.filter(r => r.status === 'rejected').length
  }), [userRentals]);

  const handleBack = () => {
    navigate(-1);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: 'pending', icon: '⏳', text: 'Pending' },
      approved: { class: 'approved', icon: '✓', text: 'Approved' },
      completed: { class: 'completed', icon: '✓', text: 'Completed' },
      rejected: { class: 'rejected', icon: '✗', text: 'Rejected' }
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`status-badge ${badge.class}`}>
        <span>{badge.icon}</span> {badge.text}
      </span>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (price) => {
    return `₱${parseFloat(price || 0).toLocaleString()}`;
  };

  return (
    <div className="bookings-container">
      <header className="bookings-header">
        <button className="back-button" onClick={handleBack}>
          ← Back
        </button>
        <div className="header-info">
          <h1 className="page-title">My Bookings</h1>
          <p className="page-subtitle">View and manage your rental history</p>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="stats-row">
        <div className="stat-card total">
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Bookings</span>
          </div>
        </div>
        <div className="stat-card pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <span className="stat-value">{stats.pending}</span>
            <span className="stat-label">Pending</span>
          </div>
        </div>
        <div className="stat-card approved">
          <div className="stat-icon">✓</div>
          <div className="stat-info">
            <span className="stat-value">{stats.approved}</span>
            <span className="stat-label">Active</span>
          </div>
        </div>
        <div className="stat-card completed">
          <div className="stat-icon">🏁</div>
          <div className="stat-info">
            <span className="stat-value">{stats.completed}</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All ({stats.total})
          </button>
          <button 
            className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending ({stats.pending})
          </button>
          <button 
            className={`tab ${activeTab === 'approved' ? 'active' : ''}`}
            onClick={() => setActiveTab('approved')}
          >
            Active ({stats.approved})
          </button>
          <button 
            className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            Completed ({stats.completed})
          </button>
          <button 
            className={`tab ${activeTab === 'rejected' ? 'active' : ''}`}
            onClick={() => setActiveTab('rejected')}
          >
            Rejected ({stats.rejected})
          </button>
        </div>

        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search bookings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Bookings List */}
      <div className="bookings-list">
        {filteredRentals.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No bookings found</h3>
            <p>
              {activeTab === 'all' 
                ? "You haven't made any rental requests yet."
                : `No ${activeTab} bookings at the moment.`}
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/renter-dashboard')}>
              Browse Vehicles
            </button>
          </div>
        ) : (
          filteredRentals.map((rental, index) => (
            <div key={rental.id || index} className="booking-card">
              <div className="booking-vehicle">
                <div className="vehicle-image">
                  {rental.vehicleImage ? (
                    <img src={rental.vehicleImage} alt={rental.vehicleName} />
                  ) : (
                    <span className="no-image">🚗</span>
                  )}
                </div>
                <div className="vehicle-info">
                  <h3 className="vehicle-name">{rental.vehicleName || 'Unknown Vehicle'}</h3>
                  <p className="vehicle-model">{rental.vehicleModel || ''}</p>
                  <p className="owner-info">Owner: {rental.ownerName || 'Unknown'}</p>
                </div>
                {getStatusBadge(rental.status)}
              </div>

              <div className="booking-details">
                <div className="detail-item">
                  <span className="detail-label">📅 Rental Period</span>
                  <span className="detail-value">
                    {formatDate(rental.startDate)} - {formatDate(rental.endDate)}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">💰 Total Price</span>
                  <span className="detail-value price">{formatPrice(rental.totalPrice)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">📍 Pickup Location</span>
                  <span className="detail-value">{rental.pickupLocation || 'To be determined'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">📝 Booked On</span>
                  <span className="detail-value">{formatDate(rental.createdAt)}</span>
                </div>
              </div>

              {rental.status === 'rejected' && rental.rejectionReason && (
                <div className="rejection-reason">
                  <strong>Reason:</strong> {rental.rejectionReason}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Bookings;
