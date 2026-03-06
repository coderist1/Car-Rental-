import React, { useState, useMemo, useRef } from 'react';
import { useAuth, useVehicles } from '../hooks';
import { ProfileMenu, VehicleCard, Modal, ConfirmModal } from '../components';
import { useLogReport } from '../context/LogReportContext';
import OwnerLogReport from '../components/ui/OwnerLogReport';
import '../styles/pages/Dashboard.css';
import '../styles/pages/LogReport.css';

const LOCATIONS = [
  'Manila', 'Quezon City', 'Cebu City', 'Davao City',
  'Makati', 'Taguig', 'Pasig', 'Parañaque', 'Caloocan', 'Antipolo',
];
const VEHICLE_TYPES  = ['Sedan','SUV','Hatchback','Pickup','Van','MPV','Crossover','Coupe','Sports'];
const TRANSMISSIONS  = ['Automatic','Manual','CVT'];
const FUEL_TYPES     = ['Gasoline','Diesel','Hybrid','Electric'];

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

function Dashboard() {
  const { user } = useAuth();
  const {
    vehicles, addVehicle, updateVehicle, deleteVehicle,
    getStats, rentalHistory, approveBooking, rejectBooking, acceptReturn,
  } = useVehicles();

  const { createCheckin, reports } = useLogReport();

  const [searchQuery,      setSearchQuery]      = useState('');
  const [isFilterOpen,     setIsFilterOpen]     = useState(false);
  const [filters,          setFilters]          = useState({ types: [], transmissions: [], fuels: [], statuses: [], minPrice: '', maxPrice: '' });
  const [isAddModalOpen,   setIsAddModalOpen]   = useState(false);
  const [isEditModalOpen,  setIsEditModalOpen]  = useState(false);
  const [isRentalHistOpen, setIsRentalHistOpen] = useState(false);
  const [isLogReportOpen,  setIsLogReportOpen]  = useState(false);
  const [deleteConfirm,    setDeleteConfirm]    = useState({ open: false, vehicleId: null });
  const [editingVehicle,   setEditingVehicle]   = useState(null);
  const [loggedRentalIds,  setLoggedRentalIds]  = useState(() => {
    try { return JSON.parse(localStorage.getItem('loggedRentalIds') || '[]'); } catch { return []; }
  });

  const [formData, setFormData] = useState({
    name: '', brand: '', year: new Date().getFullYear(),
    pricePerDay: '', status: 'available', location: '',
    seats: 5, transmission: '', type: '', fuel: '',
    description: '', image: '',
  });

  const [confirmAdd,         setConfirmAdd]         = useState(false);
  const [confirmSaveEdit,    setConfirmSaveEdit]     = useState(false);
  const [confirmRemovePhoto, setConfirmRemovePhoto]  = useState(false);

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
    if (filters.types.length > 0)         result = result.filter(v => filters.types.includes(v.type));
    if (filters.transmissions.length > 0) result = result.filter(v => filters.transmissions.includes(v.transmission));
    if (filters.fuels.length > 0)         result = result.filter(v => filters.fuels.includes(v.fuel));
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
    const total             = ownerVehicles.length;
    const available         = ownerVehicles.filter((v) => v.available).length;
    const rented            = total - available;
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
      name: vehicle.name || '', brand: vehicle.brand || '',
      year: vehicle.year || new Date().getFullYear(),
      pricePerDay: vehicle.pricePerDay || '', status: vehicle.status || 'available',
      location: vehicle.location || '', seats: vehicle.seats || 5,
      transmission: vehicle.transmission || '', type: vehicle.type || '',
      fuel: vehicle.fuel || '', description: vehicle.description || '',
      image: vehicle.image || '',
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (vehicleId) => setDeleteConfirm({ open: true, vehicleId });
  const confirmDelete     = () => {
    if (deleteConfirm.vehicleId) deleteVehicle(deleteConfirm.vehicleId);
    setDeleteConfirm({ open: false, vehicleId: null });
  };

  const handleApproveBooking = (rentalId) => {
    approveBooking(rentalId);
  };

  const handleRecordToLogBook = (rental) => {
    if (isAlreadyLogged(rental.id)) return;
    createCheckin(rental);
    const updated = [...loggedRentalIds, String(rental.id)];
    setLoggedRentalIds(updated);
    try { localStorage.setItem('loggedRentalIds', JSON.stringify(updated)); } catch {}
  };

  const renderVehicleForm = (onSubmit, isEdit = false) => (
    <form onSubmit={onSubmit} className="vehicle-form">

      <div className="vf-section">
        <div className="vf-section-header">
          <span className="vf-section-icon">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21"/></svg>
          </span>
          Vehicle Photo
        </div>
        <div
          className={`vf-photo-zone${formData.image ? ' vf-photo-zone--filled' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={handlePhotoDrop}
        >
          {formData.image ? (
            <>
              <img src={formData.image} alt="Preview" className="vf-photo-preview" />
              <div className="vf-photo-overlay">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 11l-5 5v3h3l5-5m0 0l3.536-3.536M9 11l3.536-3.536"/></svg>
                <span>Change Photo</span>
              </div>
            </>
          ) : (
            <div className="vf-photo-empty">
              <div className="vf-upload-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              </div>
              <p className="vf-upload-title">Click to upload or drag & drop</p>
              <p className="vf-upload-hint">JPG, PNG, WEBP · up to 10 MB</p>
            </div>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
        {formData.image && (
          <button type="button" className="vf-remove-photo"
            onClick={e => { e.stopPropagation(); setConfirmRemovePhoto(true); }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            Remove photo
          </button>
        )}
      </div>

      <div className="vf-section">
        <div className="vf-section-header">
          <span className="vf-section-icon">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 17H3a2 2 0 01-2-2V9a2 2 0 012-2h3.5l2-3h7l2 3H21a2 2 0 012 2v6a2 2 0 01-2 2h-2M8 17a2 2 0 104 0 2 2 0 00-4 0zm8 0a2 2 0 104 0 2 2 0 00-4 0z"/></svg>
          </span>
          Basic Information
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Brand <span className="required">*</span></label>
            <input type="text" name="brand" className="form-input" placeholder="e.g. Toyota, Honda"
              value={formData.brand} onChange={handleFormChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Model Name <span className="required">*</span></label>
            <input type="text" name="name" className="form-input" placeholder="e.g. Civic, Vios, Fortuner"
              value={formData.name} onChange={handleFormChange} required />
          </div>
        </div>
        <div className="form-row three-cols">
          <div className="form-group">
            <label className="form-label">Year <span className="required">*</span></label>
            <input type="number" name="year" className="form-input" min="1990" max="2030"
              value={formData.year} onChange={handleFormChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Seats</label>
            <input type="number" name="seats" className="form-input" min="2" max="15"
              value={formData.seats} onChange={handleFormChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select name="status" className="form-input" value={formData.status} onChange={handleFormChange}>
              <option value="available">Available</option>
              <option value="rented">Rented</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        </div>
      </div>

      <div className="vf-section">
        <div className="vf-section-header">
          <span className="vf-section-icon">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path strokeLinecap="round" strokeLinejoin="round" d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/></svg>
          </span>
          Specifications
        </div>
        <div className="form-row three-cols">
          <div className="form-group">
            <label className="form-label">Vehicle Type</label>
            <select name="type" className="form-input" value={formData.type} onChange={handleFormChange}>
              <option value="">Select type</option>
              {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Transmission</label>
            <select name="transmission" className="form-input" value={formData.transmission} onChange={handleFormChange}>
              <option value="">Select</option>
              {TRANSMISSIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Fuel Type</label>
            <select name="fuel" className="form-input" value={formData.fuel} onChange={handleFormChange}>
              <option value="">Select</option>
              {FUEL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="vf-section">
        <div className="vf-section-header">
          <span className="vf-section-icon">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </span>
          Pricing & Location
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Price per Day (&#8369;) <span className="required">*</span></label>
            <div className="vf-prefix-wrap">
              <span className="vf-prefix">₱</span>
              <input type="number" name="pricePerDay" className="form-input vf-prefixed"
                placeholder="e.g. 2500" value={formData.pricePerDay} onChange={handleFormChange} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Location</label>
            <select name="location" className="form-input" value={formData.location} onChange={handleFormChange}>
              <option value="">Select location</option>
              {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="vf-section" style={{ marginBottom: 0 }}>
        <div className="vf-section-header">
          <span className="vf-section-icon">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h12M4 18h8"/></svg>
          </span>
          Description
        </div>
        <textarea name="description" className="form-input" rows="3"
          placeholder="Briefly describe the vehicle — condition, features, notes for renters…"
          value={formData.description} onChange={handleFormChange} />
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={() => {
          isEdit ? setIsEditModalOpen(false) : setIsAddModalOpen(false);
          resetForm();
        }}>Cancel</button>
        <button type="submit" className="btn btn-primary">
          {isEdit ? 'Save Changes' : 'Add Vehicle'}
        </button>
      </div>
    </form>
  );

  return (
    <div className="dashboard-container">

      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-info">
            <h1>Owner Dashboard</h1>
            <p className="header-subtitle">Manage your fleet</p>
          </div>
          <div className="user-info">
            <button className="btn btn-outline" onClick={() => setIsRentalHistOpen(true)}>
              Rental History
            </button>
            <button className="btn btn-outline lr-toolbar-btn" onClick={() => setIsLogReportOpen(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9h6m-6 4h4" />
              </svg>
              Log Reports
              {logReportCount > 0 && <span className="lr-badge-pill">{logReportCount}</span>}
            </button>
            <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
              + Add Vehicle
            </button>
            <span className="welcome-text">Welcome, {userName}</span>
            <ProfileMenu />
          </div>
        </div>
      </header>

      <section className="stats-section">
        <div className="stat-card">
          <div className="stat-number">{ownerStats.total}</div>
          <div className="stat-label">Total Vehicles</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{ownerStats.available}</div>
          <div className="stat-label">Available</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{ownerStats.rented}</div>
          <div className="stat-label">Rented</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">&#8369;{ownerStats.estimatedEarnings.toLocaleString()}</div>
          <div className="stat-label">Est. Earnings / Day</div>
        </div>
      </section>

      <section className="search-section">
        <div className="search-container">
          <div className="search-input-wrapper">
            <span className="search-icon"><SearchIcon /></span>
            <input
              type="text"
              className="search-input"
              placeholder="Search your vehicles…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="filter-button" onClick={() => setIsFilterOpen(true)}>
            <span className="filter-icon"><FilterIcon /></span>
            {activeFiltersCount > 0 && <span className="filter-badge">{activeFiltersCount}</span>}
          </button>
        </div>
      </section>

      <section className="vehicles-section">
        {filteredVehicles.length === 0 ? (
          <div className="empty-state">
            <h3>No vehicles found</h3>
            <p>{activeFiltersCount > 0 ? 'Try adjusting your filters.' : 'Click "+ Add Vehicle" to list your first car for rent.'}</p>
          </div>
        ) : (
          <div className="vehicles-grid">
            {filteredVehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} mode="owner"
                onEdit={openEditModal} onDelete={handleDeleteClick} />
            ))}
          </div>
        )}
      </section>

      <Modal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} title="Filters"
        footer={
          <>
            <button className="btn btn-secondary" onClick={clearFilters}>Reset</button>
            <button className="btn btn-primary" onClick={() => setIsFilterOpen(false)}>Apply</button>
          </>
        }>
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
            <label className="filter-label">Price Range (&#8369;/day)</label>
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

      <Modal isOpen={isRentalHistOpen} onClose={() => setIsRentalHistOpen(false)}
        title="Rental History" size="large">
        {ownerRentals.length === 0 ? (
          <div className="empty-state"><p>No rental history yet.</p></div>
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
                    <span>&#8369;{rental.amount}/day</span>
                  </div>
                  <div className="rental-dates">
                    {new Date(rental.startDate).toLocaleDateString()} &rarr;{' '}
                    {rental.endDate ? new Date(rental.endDate).toLocaleDateString() : 'Ongoing'}
                  </div>

                  <div className="rental-actions">
                    {rental.status === 'pending' && (
                      <>
                        <button className="btn btn-primary btn-sm"
                          onClick={() => handleApproveBooking(rental.id)}>
                          Approve
                        </button>
                        <button className="btn btn-danger btn-sm"
                          onClick={() => rejectBooking(rental.id)}>
                          Reject
                        </button>
                      </>
                    )}

                    {rental.status === 'return_requested' && (
                      <button className="btn btn-primary btn-sm"
                        onClick={() => acceptReturn(rental.id)}>
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
      </Modal>

      <OwnerLogReport
        isOpen={isLogReportOpen}
        onClose={() => setIsLogReportOpen(false)}
        ownerRentals={ownerRentals}
        ownerName={userName}
      />

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