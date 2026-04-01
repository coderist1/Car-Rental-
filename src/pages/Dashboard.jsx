import React, { useState, useMemo, useRef } from 'react';
import { useAuth, useVehicles } from '../hooks';
import { ProfileMenu, VehicleCard, Modal, ConfirmModal } from '../components';
import { useLogReport } from '../context/LogReportContext';
import OwnerLogReport from '../components/ui/OwnerLogReport';
import '../styles/pages/Dashboard.css';
import '../styles/pages/LogReport.css';

// Icons
const VehicleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 17H3a2 2 0 01-2-2V9a2 2 0 012-2h3.5l2-3h7l2 3H21a2 2 0 012 2v6a2 2 0 01-2 2h-2M8 17a2 2 0 104 0 2 2 0 00-4 0zm8 0a2 2 0 104 0 2 2 0 00-4 0z" />
  </svg>
);

const HistoryIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 2H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V9z" />
  </svg>
);

const LogIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const BookIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
  </svg>
);

const FilterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 10h10M11 16h2" />
  </svg>
);

const LOCATIONS = [
  'Manila', 'Quezon City', 'Cebu City', 'Davao City',
  'Makati', 'Taguig', 'Pasig', 'Parañaque', 'Caloocan', 'Antipolo',
];
const VEHICLE_TYPES  = ['Sedan','SUV','Hatchback','Pickup','Van','MPV','Crossover','Coupe','Sports'];
const TRANSMISSIONS  = ['Automatic','Manual','CVT'];
const FUEL_TYPES     = ['Gasoline','Diesel','Hybrid','Electric'];

function Dashboard() {
  const { user } = useAuth();
  const {
    vehicles, addVehicle, updateVehicle, deleteVehicle,
    getStats, rentalHistory, approveBooking, rejectBooking, acceptReturn,
  } = useVehicles();

  const { createCheckin, reports } = useLogReport();

  const [activeTab, setActiveTab] = useState('vehicles');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({ types: [], transmissions: [], fuels: [], statuses: [], minPrice: '', maxPrice: '' });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLogReportOpen, setIsLogReportOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, vehicleId: null });
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [loggedRentalIds, setLoggedRentalIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('loggedRentalIds') || '[]'); } catch { return []; }
  });

  const [formData, setFormData] = useState({
    name: '', brand: '', year: new Date().getFullYear(),
    pricePerDay: '', status: 'available', location: '',
    seats: 5, transmission: '', type: '', fuel: '',
    description: '', image: '',
  });

  const [confirmAdd, setConfirmAdd] = useState(false);
  const [confirmSaveEdit, setConfirmSaveEdit] = useState(false);
  const [confirmRemovePhoto, setConfirmRemovePhoto] = useState(false);

  const fileInputRef = useRef(null);

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setFormData(p => ({ ...p, image: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const handlePhotoDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => setFormData(p => ({ ...p, image: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const userName = user?.fullName || user?.firstName || 'Owner';

  const ownerVehicles = useMemo(
    () => vehicles.filter((v) => v.ownerId === user?.id),
    [vehicles, user?.id]
  );

  const filteredVehicles = useMemo(() => {
    let result = ownerVehicles;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(v =>
        v.name?.toLowerCase().includes(q) ||
        v.brand?.toLowerCase().includes(q) ||
        v.type?.toLowerCase().includes(q) ||
        v.location?.toLowerCase().includes(q)
      );
    }
    if (filters.statuses.length > 0)
      result = result.filter(v =>
        filters.statuses.includes('available') && v.available ||
        filters.statuses.includes('rented') && !v.available
      );
    if (filters.types.length > 0) result = result.filter(v => filters.types.includes(v.type));
    if (filters.transmissions.length > 0) result = result.filter(v => filters.transmissions.includes(v.transmission));
    if (filters.fuels.length > 0) result = result.filter(v => filters.fuels.includes(v.fuel));
    if (filters.minPrice) result = result.filter(v => Number(v.pricePerDay || 0) >= Number(filters.minPrice));
    if (filters.maxPrice) result = result.filter(v => Number(v.pricePerDay || 0) <= Number(filters.maxPrice));
    return result;
  }, [ownerVehicles, searchQuery, filters]);

  const activeFiltersCount = filters.types.length + filters.transmissions.length + filters.fuels.length + filters.statuses.length + (filters.minPrice ? 1 : 0) + (filters.maxPrice ? 1 : 0);

  const handleFilterToggle = (cat, val) => setFilters(prev => ({
    ...prev,
    [cat]: prev[cat].includes(val) ? prev[cat].filter(v => v !== val) : [...prev[cat], val],
  }));
  const clearFilters = () => setFilters({ types: [], transmissions: [], fuels: [], statuses: [], minPrice: '', maxPrice: '' });

  const ownerRentals = useMemo(() => {
    const ids = new Set(ownerVehicles.map((v) => v.id));
    return rentalHistory.filter((r) => ids.has(r.vehicleId));
  }, [ownerVehicles, rentalHistory]);

  const ownerStats = useMemo(() => {
    const total = ownerVehicles.length;
    const available = ownerVehicles.filter((v) => v.available).length;
    const rented = total - available;
    const estimatedEarnings = ownerVehicles
      .filter((v) => !v.available)
      .reduce((s, v) => s + Number(v.pricePerDay || 0), 0);
    return { total, available, rented, estimatedEarnings };
  }, [ownerVehicles]);

  const logReportCount = useMemo(() => {
    const vehicleIds = new Set(ownerVehicles.map((v) => String(v.id)));
    return reports.filter(
      (r) => vehicleIds.has(String(r.vehicleId))
    ).length;
  }, [reports, ownerVehicles]);

  const ownerRentalsForLogReport = useMemo(() => {
    return ownerRentals;
  }, [ownerRentals]);

  const isAlreadyLogged = (rentalId) => {
    return reports.some(r => String(r.rentalId) === String(rentalId)) || loggedRentalIds.includes(String(rentalId));
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const resetForm = () => setFormData({
    name: '', brand: '', year: new Date().getFullYear(),
    pricePerDay: '', status: 'available', location: '',
    seats: 5, transmission: '', type: '', fuel: '',
    description: '', image: '',
  });

  const handleAddVehicle = (e) => {
    e.preventDefault();
    setConfirmAdd(true);
  };
  const doAddVehicle = () => {
    addVehicle(formData);
    resetForm();
    setIsAddModalOpen(false);
  };

  const handleEditVehicle = (e) => {
    e.preventDefault();
    setConfirmSaveEdit(true);
  };
  const doEditVehicle = () => {
    if (editingVehicle) {
      updateVehicle(editingVehicle.id, formData);
      setIsEditModalOpen(false);
      setEditingVehicle(null);
      resetForm();
    }
  };

  const openEditModal = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      name: vehicle.name,
      brand: vehicle.brand,
      year: vehicle.year,
      pricePerDay: vehicle.pricePerDay,
      status: vehicle.available ? 'available' : 'rented',
      location: vehicle.location,
      seats: vehicle.seats,
      transmission: vehicle.transmission,
      type: vehicle.type,
      fuel: vehicle.fuel,
      description: vehicle.description,
      image: vehicle.image,
    });
    setIsEditModalOpen(true);
  };

  

  const handleApproveBooking = (rentalId) => {
    approveBooking(rentalId);
  };

  const handleRecordToLogBook = (rental) => {
    createCheckin({
      rentalId: rental.id,
      vehicleId: rental.vehicleId,
      vehicleName: rental.vehicleName,
      ownerName: userName,
    });
    const newLoggedIds = [...loggedRentalIds, String(rental.id)];
    setLoggedRentalIds(newLoggedIds);
    localStorage.setItem('loggedRentalIds', JSON.stringify(newLoggedIds));
  };

  const confirmDelete = () => {
    if (deleteConfirm.vehicleId) {
      deleteVehicle(deleteConfirm.vehicleId);
      setDeleteConfirm({ open: false, vehicleId: null });
    }
  };

  const renderVehicleForm = (onSubmit, isEdit = false) => (
    <form onSubmit={onSubmit} className="vehicle-form">
      <div className="form-row">
        <div className="form-group">
          <label>Brand *</label>
          <input type="text" name="brand" value={formData.brand} onChange={handleFormChange} required />
        </div>
        <div className="form-group">
          <label>Model/Name *</label>
          <input type="text" name="name" value={formData.name} onChange={handleFormChange} required />
        </div>

      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Year *</label>
          <input type="number" name="year" value={formData.year} onChange={handleFormChange} min="1900" max={new Date().getFullYear()} required />
        </div>
        <div className="form-group">
          <label>Type *</label>
          <select name="type" value={formData.type} onChange={handleFormChange} required>
            <option value="">Select Type</option>
            {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Transmission *</label>
          <select name="transmission" value={formData.transmission} onChange={handleFormChange} required>
            <option value="">Select Transmission</option>
            {TRANSMISSIONS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Fuel Type *</label>
          <select name="fuel" value={formData.fuel} onChange={handleFormChange} required>
            <option value="">Select Fuel Type</option>
            {FUEL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Seats *</label>
          <input type="number" name="seats" value={formData.seats} onChange={handleFormChange} min="1" max="12" required />
        </div>
        <div className="form-group">
          <label>Price Per Day (₱) *</label>
          <input type="number" name="pricePerDay" value={formData.pricePerDay} onChange={handleFormChange} min="0" step="100" required />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Location *</label>
          <select name="location" value={formData.location} onChange={handleFormChange} required>
            <option value="">Select Location</option>
            {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>

      <div className="form-group full-width">
        <label>Description</label>
        <textarea name="description" value={formData.description} onChange={handleFormChange} rows="4"></textarea>
      </div>

      <div className="form-group full-width">
        <label>Vehicle Photo</label>
        <div className="photo-upload" onDrop={handlePhotoDrop} onDragOver={(e) => e.preventDefault()}>
          {formData.image ? (
            <div className="photo-preview">
              <img src={formData.image} alt="Vehicle" />
              <button type="button" onClick={() => setConfirmRemovePhoto(true)} className="btn-remove">Remove</button>
            </div>
          ) : (
            <>
              <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" style={{ display: 'none' }} />
              <p>Click to upload or drag and drop</p>
              <p className="text-muted">PNG, JPG, GIF up to 5MB</p>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="btn btn-secondary">Choose File</button>
            </>
          )}
        </div>
        
      </div>

      <div className="form-actions">

        <button type="submit" className="btn btn-primary">
          {isEdit ? 'Save Changes' : 'Add Vehicle'}
        </button>
      </div>
    </form>
  );

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <svg width="55" height="55" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="auth-logo-svg" aria-hidden="true">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
            <circle cx="7" cy="17" r="2" />
            <path d="M9 17h6" />
            <circle cx="17" cy="17" r="2" />
          </svg> CarRental
        </div>
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'vehicles' ? 'active' : ''}`}
            onClick={() => setActiveTab('vehicles')}
          >
            <VehicleIcon />
            My Vehicles
          </button>
          <button 
            className={`nav-item ${activeTab === 'rentals' ? 'active' : ''}`}
            onClick={() => setActiveTab('rentals')}
          >
            <HistoryIcon />
            Rental History
          </button>
          <button 
            className={`nav-item ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            <LogIcon />
            Log Book
            {logReportCount > 0 && <span className="nav-badge">{logReportCount}</span>}
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Header */}
        <div className="dashboard-header">
          <div className="header-content">
            <div className="header-info">
              <h1>
                {activeTab === 'vehicles' && 'My Vehicles'}
                {activeTab === 'rentals' && 'Rental History'}
                {activeTab === 'logs' && 'Log Book'}
              </h1>
              <p className="header-subtitle">
                {activeTab === 'vehicles' && 'Manage your rental vehicles'}
                {activeTab === 'rentals' && 'Track all rental transactions'}
                {activeTab === 'logs' && 'Vehicle condition check-in logs'}
              </p>
            </div>
            <div className="user-info">
              <span className="welcome-text">Welcome, {userName}!</span>
              <ProfileMenu />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="dashboard-content">
          {activeTab === 'vehicles' && (
            <>
              {/* Stats */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-label">Total Vehicles</div>
                  <div className="stat-value">{ownerStats.total}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Available</div>
                  <div className="stat-value">{ownerStats.available}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Rented</div>
                  <div className="stat-value">{ownerStats.rented}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Est. Daily Earnings</div>
                  <div className="stat-value">₱{ownerStats.estimatedEarnings.toLocaleString()}</div>
                </div>
              </div>

              {/* Search & Filter */}
              <div className="search-filter-bar">
                <div className="search-container">
                  <div className="search-icon"><SearchIcon /></div>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search vehicles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button className="filter-button" onClick={() => setIsFilterOpen(true)}>
                  <FilterIcon />
                  Filter
                  {activeFiltersCount > 0 && <span className="filter-badge">{activeFiltersCount}</span>}
                </button>
                <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
                  + Add Vehicle
                </button>
              </div>

              {/* Vehicles Grid */}
              <div className="panel">
                {filteredVehicles.length === 0 ? (
                  <div className="empty-state">
                    <h3>No vehicles found</h3>
                    <p>{searchQuery ? 'Try adjusting your search query.' : 'Start by adding your first vehicle.'}</p>
                  </div>
                ) : (
                  <div className="vehicles-grid">
                    {filteredVehicles.map((vehicle) => (
                      <VehicleCard
                        key={vehicle.id}
                        vehicle={vehicle}
                        mode="owner"
                        onEdit={() => openEditModal(vehicle)}
                        onDelete={() => setDeleteConfirm({ open: true, vehicleId: vehicle.id })}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'rentals' && (
            <div className="panel">
              {ownerRentals.length === 0 ? (
                <div className="empty-state">
                  <h3>No rental history</h3>
                  <p>Your vehicle rental history will appear here.</p>
                </div>
              ) : (
                <div className="rental-history-list">
                  {ownerRentals.slice().reverse().map((rental) => {
                    const logged = isAlreadyLogged(rental.id);
                    return (
                      <div key={rental.id} className="rental-item">
                        <div className="rental-header">
                          <span className="rental-vehicle">{rental.vehicleName}</span>
                          <span className={`rental-status ${rental.status}`}>{rental.status}</span>
                        </div>
                        <div className="rental-details">
                          <span>Renter: {rental.renterName}</span>
                          <span>₱{rental.amount}/day</span>
                        </div>
                        <div className="rental-dates">
                          {new Date(rental.startDate).toLocaleDateString()} → {' '}
                          {rental.endDate ? new Date(rental.endDate).toLocaleDateString() : 'Ongoing'}
                        </div>

                        <div className="rental-actions">
                          {rental.status === 'pending' && (
                            <>
                              <button className="btn btn-primary btn-sm" onClick={() => handleApproveBooking(rental.id)}>
                                Approve
                              </button>
                              <button className="btn btn-danger btn-sm" onClick={() => rejectBooking(rental.id)}>
                                Reject
                              </button>
                            </>
                          )}

                          {rental.status === 'return_requested' && (
                            <button className="btn btn-primary btn-sm" onClick={() => acceptReturn(rental.id)}>
                              Accept Return
                            </button>
                          )}

                          {(rental.status === 'active' || rental.status === 'approved') && (
                            <button
                              className="btn btn-sm"
                              onClick={() => handleRecordToLogBook(rental)}
                              disabled={logged}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                background: logged ? '#f0fdf4' : '#3F9B84',
                                color: logged ? '#059669' : '#fff',
                                border: logged ? '1px solid #bbf7d0' : 'none',
                                cursor: logged ? 'default' : 'pointer',
                                fontWeight: 600, borderRadius: 8, padding: '6px 12px',
                              }}
                            >
                              <BookIcon />
                              {logged ? 'Recorded in Log Book' : 'Record to Log Book'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="panel">
              {/* RENDER OWNERLOGREPORT CONTENT DIRECTLY IN PANEL - NO MODAL WRAPPER */}
              <OwnerLogReport
                isOpen={true}
                onClose={() => {}}
                ownerRentals={ownerRentalsForLogReport}
                ownerName={userName}
                displayInPanel={true}
              />
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <Modal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} title="Filters">
        <div className="filter-content">
          <div className="filter-group">
            <label className="filter-label">Status</label>
            <div className="filter-options">
              {['available', 'rented'].map(s => (
                <button key={s} className={`filter-option ${filters.statuses.includes(s) ? 'active' : ''}`}
                  onClick={() => handleFilterToggle('statuses', s)}
                  style={{ textTransform: 'capitalize' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <label className="filter-label">Vehicle Type</label>
            <div className="filter-options">
              {VEHICLE_TYPES.map(type => (
                <button key={type} className={`filter-option ${filters.types.includes(type) ? 'active' : ''}`}
                  onClick={() => handleFilterToggle('types', type)}>{type}</button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <label className="filter-label">Transmission</label>
            <div className="filter-options">
              {TRANSMISSIONS.map(t => (
                <button key={t} className={`filter-option ${filters.transmissions.includes(t) ? 'active' : ''}`}
                  onClick={() => handleFilterToggle('transmissions', t)}>{t}</button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <label className="filter-label">Fuel Type</label>
            <div className="filter-options">
              {FUEL_TYPES.map(f => (
                <button key={f} className={`filter-option ${filters.fuels.includes(f) ? 'active' : ''}`}
                  onClick={() => handleFilterToggle('fuels', f)}>{f}</button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <label className="filter-label">Price Range (₱/day)</label>
            <div className="price-inputs">
              <input type="number" className="price-input" placeholder="Min"
                value={filters.minPrice} onChange={e => setFilters(p => ({ ...p, minPrice: e.target.value }))} />
              <span className="price-separator">to</span>
              <input type="number" className="price-input" placeholder="Max"
                value={filters.maxPrice} onChange={e => setFilters(p => ({ ...p, maxPrice: e.target.value }))} />
            </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); resetForm(); }}
        title="Add New Vehicle" size="large">
        {renderVehicleForm(handleAddVehicle)}
      </Modal>

      <Modal isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setEditingVehicle(null); resetForm(); }}
        title="Edit Vehicle" size="large">
        {renderVehicleForm(handleEditVehicle, true)}
      </Modal>
      


      <ConfirmModal
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, vehicleId: null })}
        onConfirm={confirmDelete}
        title="Delete Vehicle"
        message="Are you sure you want to delete this vehicle? This action cannot be undone."
        confirmText="Yes, Delete"
        cancelText="No, Cancel"
        variant="danger"
      />

      <ConfirmModal
        isOpen={confirmAdd}
        onClose={() => setConfirmAdd(false)}
        onConfirm={doAddVehicle}
        title="Add Vehicle"
        message={`Are you sure you want to list "${formData.brand} ${formData.name}" for rent?`}
        confirmText="Yes, Add"
        cancelText="No, Go Back"
        variant="primary"
      />

      <ConfirmModal
        isOpen={confirmSaveEdit}
        onClose={() => setConfirmSaveEdit(false)}
        onConfirm={doEditVehicle}
        title="Save Changes"
        message={`Are you sure you want to save changes to "${formData.brand} ${formData.name}"?`}
        confirmText="Yes, Save"
        cancelText="No, Go Back"
        variant="primary"
      />

      <ConfirmModal
        isOpen={confirmRemovePhoto}
        onClose={() => setConfirmRemovePhoto(false)}
        onConfirm={() => setFormData(p => ({ ...p, image: '' }))}
        title="Remove Photo"
        message="Are you sure you want to remove this vehicle photo?"
        confirmText="Yes, Remove"
        cancelText="No, Keep"
        variant="warning"
      />
    </div>
  );
}

export default Dashboard;