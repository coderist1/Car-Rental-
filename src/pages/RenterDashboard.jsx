import React, { useState, useMemo } from 'react';
import { useVehicles } from '../hooks';
import { useAuth } from '../context/AuthContext';
import { ProfileMenu, VehicleCard, Modal } from '../components';
import '../styles/pages/RenterDashboard.css';

function RenterDashboard() {
  const { user } = useAuth();
  const { 
    vehicles, 
    toggleSavedCar, 
    isCarSaved, 
    savedCars,
    addRentalRecord,
    getUserRentals,
    requestReturn 
  } = useVehicles();

  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showingSaved, setShowingSaved] = useState(false);
  
  const [filters, setFilters] = useState({
    types: [],
    transmissions: [],
    fuels: [],
    minPrice: '',
    maxPrice: ''
  });

  const userName = user?.fullName || user?.firstName || 'Renter';
  const userRentals = getUserRentals();

  // Filter available vehicles only
  const availableVehicles = useMemo(() => {
    return vehicles.filter(v => v.available);
  }, [vehicles]);

  const filteredVehicles = useMemo(() => {
    let result = showingSaved 
      ? vehicles.filter(v => savedCars.includes(v.id))
      : availableVehicles;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(v =>
        v.name?.toLowerCase().includes(query) ||
        v.brand?.toLowerCase().includes(query) ||
        v.type?.toLowerCase().includes(query) ||
        v.location?.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (filters.types.length > 0) {
      result = result.filter(v => filters.types.includes(v.type));
    }

    // Transmission filter
    if (filters.transmissions.length > 0) {
      result = result.filter(v => filters.transmissions.includes(v.transmission));
    }

    // Fuel filter
    if (filters.fuels.length > 0) {
      result = result.filter(v => filters.fuels.includes(v.fuel));
    }

    // Price filter
    if (filters.minPrice) {
      result = result.filter(v => Number(v.pricePerDay || 0) >= Number(filters.minPrice));
    }
    if (filters.maxPrice) {
      result = result.filter(v => Number(v.pricePerDay || 0) <= Number(filters.maxPrice));
    }

    return result;
  }, [availableVehicles, vehicles, savedCars, showingSaved, searchQuery, filters]);

  // Stats
  const stats = useMemo(() => {
    const avgPrice = availableVehicles.length > 0
      ? Math.round(availableVehicles.reduce((sum, v) => sum + Number(v.pricePerDay || 0), 0) / availableVehicles.length)
      : 0;
    
    return {
      total: vehicles.length,
      available: availableVehicles.length,
      avgPrice,
      saved: savedCars.length
    };
  }, [vehicles, availableVehicles, savedCars]);

  const activeFiltersCount = 
    filters.types.length + 
    filters.transmissions.length + 
    filters.fuels.length + 
    (filters.minPrice ? 1 : 0) + 
    (filters.maxPrice ? 1 : 0);

  const handleFilterToggle = (category, value) => {
    setFilters(prev => {
      const current = prev[category];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [category]: updated };
    });
  };

  const clearFilters = () => {
    setFilters({
      types: [],
      transmissions: [],
      fuels: [],
      minPrice: '',
      maxPrice: ''
    });
  };

  const handleViewVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setIsDetailOpen(true);
  };

  const handleRentVehicle = (vehicle) => {
    if (!vehicle) return;
    
    if (window.confirm(`Request to rent ${vehicle.brand} ${vehicle.name} for ₱${vehicle.pricePerDay}/day?`)) {
      addRentalRecord(vehicle);
      alert('Rental request sent! The owner will review your request.');
      setIsDetailOpen(false);
    }
  };

  const handleRequestReturn = (rentalId) => {
    if (window.confirm('Request to return this vehicle?')) {
      requestReturn(rentalId);
      alert('Return request sent!');
    }
  };

  return (
    <div className="renter-dashboard">
      <header className="renter-header">
        <div className="header-info">
          <h1 className="greeting">Hello, {userName} 👋</h1>
          <p className="header-subtitle">Find your perfect ride</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={() => setIsHistoryOpen(true)}>
            My Rentals
          </button>
          <ProfileMenu />
        </div>
      </header>

      <section className="search-section">
        <div className="search-container">
          <div className="search-input-wrapper">
            <span className="search-icon"></span>
            <input
              type="text"
              className="search-input"
              placeholder="Search cars..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            className="filter-button" 
            onClick={() => setIsFilterOpen(true)}
          >
            <span className="filter-icon">⚙️</span>
            {activeFiltersCount > 0 && (
              <span className="filter-badge">{activeFiltersCount}</span>
            )}
          </button>
        </div>
      </section>

      <section className="stats-section">
        <div className="stat-card">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total Cars</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.available}</div>
          <div className="stat-label">Available</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">₱{stats.avgPrice.toLocaleString()}</div>
          <div className="stat-label">Avg Price</div>
        </div>
        <div 
          className={`stat-card clickable ${showingSaved ? 'active' : ''}`}
          onClick={() => setShowingSaved(!showingSaved)}
        >
          <div className="stat-number">{stats.saved}</div>
          <div className="stat-label">Saved</div>
        </div>
      </section>

      <section className="vehicles-section">
        {filteredVehicles.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🚗</div>
            <h3>{showingSaved ? 'No saved vehicles' : 'No vehicles found'}</h3>
            <p>{showingSaved 
              ? 'Save vehicles you like by clicking the heart icon.' 
              : 'Try adjusting your search or filters.'
            }</p>
          </div>
        ) : (
          <div className="vehicles-grid">
            {filteredVehicles.map(vehicle => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                mode="renter"
                isSaved={isCarSaved(vehicle.id)}
                onSave={() => toggleSavedCar(vehicle.id)}
                onRent={() => handleRentVehicle(vehicle)}
                onView={() => handleViewVehicle(vehicle)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Filter Modal */}
      <Modal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title="Filters"
        footer={
          <>
            <button className="btn btn-secondary" onClick={clearFilters}>Reset</button>
            <button className="btn btn-primary" onClick={() => setIsFilterOpen(false)}>Apply Filters</button>
          </>
        }
      >
        <div className="filter-content">
          <div className="filter-group">
            <label className="filter-label">Vehicle Type</label>
            <div className="filter-options">
              {['SUV', 'Sedan', 'Sports', 'Hatchback', 'Van'].map(type => (
                <button
                  key={type}
                  className={`filter-option ${filters.types.includes(type) ? 'active' : ''}`}
                  onClick={() => handleFilterToggle('types', type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">Transmission</label>
            <div className="filter-options">
              {['Automatic', 'Manual', 'CVT'].map(trans => (
                <button
                  key={trans}
                  className={`filter-option ${filters.transmissions.includes(trans) ? 'active' : ''}`}
                  onClick={() => handleFilterToggle('transmissions', trans)}
                >
                  {trans}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">Fuel Type</label>
            <div className="filter-options">
              {['Gasoline', 'Diesel', 'Hybrid', 'Electric'].map(fuel => (
                <button
                  key={fuel}
                  className={`filter-option ${filters.fuels.includes(fuel) ? 'active' : ''}`}
                  onClick={() => handleFilterToggle('fuels', fuel)}
                >
                  {fuel}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">Price Range (per day, ₱)</label>
            <div className="price-inputs">
              <input
                type="number"
                className="price-input"
                placeholder="Min"
                value={filters.minPrice}
                onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
              />
              <span className="price-separator">to</span>
              <input
                type="number"
                className="price-input"
                placeholder="Max"
                value={filters.maxPrice}
                onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Vehicle Detail Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setSelectedVehicle(null); }}
        title={selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.name}` : 'Vehicle Details'}
        size="large"
      >
        {selectedVehicle && (
          <div className="vehicle-detail">
            <div className="detail-image">
              {selectedVehicle.image ? (
                <img src={selectedVehicle.image} alt={selectedVehicle.name} />
              ) : (
                <div className="image-placeholder">🚗</div>
              )}
            </div>

            <div className="detail-info">
              <div className="detail-price">
                <span className="price-amount">₱{selectedVehicle.pricePerDay?.toLocaleString()}</span>
                <span className="price-period">/day</span>
              </div>

              <div className="detail-specs">
                {selectedVehicle.type && (
                  <div className="spec-item">
                    <span className="spec-icon">🚙</span>
                    <span>{selectedVehicle.type}</span>
                  </div>
                )}
                {selectedVehicle.transmission && (
                  <div className="spec-item">
                    <span className="spec-icon">⚙️</span>
                    <span>{selectedVehicle.transmission}</span>
                  </div>
                )}
                {selectedVehicle.seats && (
                  <div className="spec-item">
                    <span className="spec-icon"></span>
                    <span>{selectedVehicle.seats} seats</span>
                  </div>
                )}
                {selectedVehicle.fuel && (
                  <div className="spec-item">
                    <span className="spec-icon">⛽</span>
                    <span>{selectedVehicle.fuel}</span>
                  </div>
                )}
                {selectedVehicle.year && (
                  <div className="spec-item">
                    <span className="spec-icon">📅</span>
                    <span>{selectedVehicle.year}</span>
                  </div>
                )}
              </div>

              {selectedVehicle.location && (
                <div className="detail-location">
                  <span className="location-icon">📍</span>
                  <span>{selectedVehicle.location}</span>
                </div>
              )}

              {selectedVehicle.owner && (
                <div className="detail-owner">
                  <span>Owner: {selectedVehicle.owner}</span>
                </div>
              )}

              {selectedVehicle.description && (
                <div className="detail-description">
                  <p>{selectedVehicle.description}</p>
                </div>
              )}

              {selectedVehicle.features && selectedVehicle.features.length > 0 && (
                <div className="detail-features">
                  <h4>Features</h4>
                  <div className="features-list">
                    {selectedVehicle.features.map((feature, idx) => (
                      <span key={idx} className="feature-tag">{feature}</span>
                    ))}
                  </div>
                </div>
              )}

              {selectedVehicle.available && (
                <button 
                  className="btn btn-primary btn-full"
                  onClick={() => handleRentVehicle(selectedVehicle)}
                >
                  Request to Rent
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* My Rentals Modal */}
      <Modal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        title="My Rentals"
        size="large"
      >
        {userRentals.length === 0 ? (
          <div className="empty-state">
            <p>You have no rentals yet.</p>
          </div>
        ) : (
          <div className="rental-history-list">
            {userRentals.slice().reverse().map(rental => (
              <div key={rental.id} className="rental-item">
                <div className="rental-header">
                  <span className="rental-vehicle">{rental.vehicleName}</span>
                  <span className={`rental-status ${rental.status}`}>{rental.status}</span>
                </div>
                <div className="rental-details">
                  <span>Owner: {rental.ownerName}</span>
                  <span>₱{rental.amount}/day</span>
                </div>
                <div className="rental-dates">
                  {new Date(rental.startDate).toLocaleDateString()} → 
                  {rental.endDate ? new Date(rental.endDate).toLocaleDateString() : 'Ongoing'}
                </div>
                {rental.status === 'active' && (
                  <div className="rental-actions">
                    <button 
                      className="btn btn-outline btn-sm" 
                      onClick={() => handleRequestReturn(rental.id)}
                    >
                      Request Return
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default RenterDashboard;
