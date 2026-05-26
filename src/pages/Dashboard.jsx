import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAuth, useVehicles } from '../hooks';
import { useFeedback } from '../context/FeedbackContext';
import { ProfileMenu, VehicleCard, Modal, ConfirmModal, DamageReportInbox } from '../components';
import { useLogReport } from '../context/LogReportContext';
import OwnerLogReport from '../components/ui/OwnerLogReport';
import * as DamageReportExports from '../context/DamageReportContext';
import '../styles/pages/Dashboard.css';
import '../styles/pages/LogReport.css';
import { normalizePhotos } from '../utils/photoUtils';

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

const useDamageContextHook = DamageReportExports.useDamageReport 
  || DamageReportExports.useDamageReports 
  || DamageReportExports.useDamageReportContext 
  || (() => ({ reports: [], acknowledgeReport: () => {}, resolveReport: () => {} }));

function Dashboard() {
  const { user } = useAuth();
  const {
    vehicles, addVehicle, updateVehicle, deleteVehicle,
    getStats, rentalHistory, approveBooking, rejectBooking, acceptReturn,
  } = useVehicles();

  const { createCheckin, reports } = useLogReport();
  
  const damageContext = useDamageContextHook();

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

  const [viewingVehicle, setViewingVehicle] = useState(null);
  const [confirmAdd, setConfirmAdd] = useState(false);
  const [confirmSaveEdit, setConfirmSaveEdit] = useState(false);
  const [confirmRemovePhoto, setConfirmRemovePhoto] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState(null);
  const [discardConfirm, setDiscardConfirm] = useState({ open: false, nextVehicle: null, closeMode: null });

  const { feedback, getFeedbackForOwner, refreshFeedback } = useFeedback();

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

  const ownerFeedbacks = useMemo(() => {
    const vehicleIds = ownerVehicles.map(v => v.id);
    return getFeedbackForOwner(user?.email || user?.id, vehicleIds);
  }, [getFeedbackForOwner, ownerVehicles, user?.email, user?.id]);

  const ownerDamageReports = useMemo(() => {
    if (!damageContext || !damageContext.reports) return [];
    const ownerVehicleIds = ownerVehicles.map(v => String(v.id));
    return damageContext.reports.filter(r => 
      String(r.ownerId) === String(user?.id) || 
      r.ownerName === userName ||
      ownerVehicleIds.includes(String(r.vehicleId || r.vehicle))
    );
  }, [damageContext, user, userName, ownerVehicles]);

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
      (r) => vehicleIds.has(String(r.vehicleId || r.vehicle))
    ).length;
  }, [reports, ownerVehicles]);

  const ownerRentalsForLogReport = useMemo(() => {
    return ownerRentals;
  }, [ownerRentals]);

  const isAlreadyLogged = (rentalId) => {
    return reports.some(r => String(r.rentalId || r.rental) === String(rentalId)) || loggedRentalIds.includes(String(rentalId));
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

  const getEmptyForm = () => ({
    name: '', brand: '', year: new Date().getFullYear(),
    pricePerDay: '', status: 'available', location: '',
    seats: 5, transmission: '', type: '', fuel: '',
    description: '', image: '',
  });

  const isFormDirty = () => {
    if (editingVehicle) {
      const v = editingVehicle;
      const compare = {
        name: v.name || '',
        brand: v.brand || '',
        year: v.year || new Date().getFullYear(),
        pricePerDay: v.pricePerDay || '',
        status: v.available ? 'available' : 'rented',
        location: v.location || '',
        seats: v.seats || 5,
        transmission: v.transmission || '',
        type: v.type || '',
        fuel: v.fuel || '',
        description: v.description || '',
        image: v.image || '',
      };
      return Object.keys(compare).some((k) => String(compare[k]) !== String(formData[k] ?? ''));
    }
    const empty = getEmptyForm();
    return Object.keys(empty).some((k) => String(empty[k]) !== String(formData[k] ?? ''));
  };

  const handleAddVehicle = (e) => {
    e.preventDefault();
    setConfirmAdd(true);
  };
  const doAddVehicle = async () => {
    try {
      await addVehicle(formData);
      resetForm();
      setIsAddModalOpen(false);
    } catch (err) {
      alert(`Failed to add vehicle: ${err.message}`);
    }
  };

  const handleEditVehicle = (e) => {
    e.preventDefault();
    setConfirmSaveEdit(true);
  };
  const doEditVehicle = async () => {
    if (editingVehicle) {
      try {
        await updateVehicle(editingVehicle.id, formData);
        setIsEditModalOpen(false);
        setEditingVehicle(null);
        resetForm();
      } catch (err) {
        alert(`Failed to update vehicle: ${err.message}`);
      }
    }
  };

  const openEditModal = (vehicle) => {
    // If already editing this same vehicle, just re-open modal without clearing form
    if (editingVehicle && editingVehicle.id === vehicle.id) {
      setIsEditModalOpen(true);
      return;
    }

    // If form has unsaved changes, ask before switching to another vehicle
    if (isFormDirty() && editingVehicle && editingVehicle.id !== vehicle.id) {
      setDiscardConfirm({ open: true, nextVehicle: vehicle, closeMode: null });
      return;
    }

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

  const attemptCloseEditModal = () => {
    if (isFormDirty()) {
      setDiscardConfirm({ open: true, nextVehicle: null, closeMode: 'edit' });
      return;
    }
    setIsEditModalOpen(false);
    setEditingVehicle(null);
    resetForm();
  };

  const attemptCloseAddModal = () => {
    if (isFormDirty()) {
      setDiscardConfirm({ open: true, nextVehicle: null, closeMode: 'add' });
      return;
    }
    setIsAddModalOpen(false);
    resetForm();
  };

  const proceedDiscard = () => {
    const { nextVehicle, closeMode } = discardConfirm;
    setDiscardConfirm({ open: false, nextVehicle: null, closeMode: null });
    if (nextVehicle) {
      setEditingVehicle(nextVehicle);
      setFormData({
        name: nextVehicle.name,
        brand: nextVehicle.brand,
        year: nextVehicle.year,
        pricePerDay: nextVehicle.pricePerDay,
        status: nextVehicle.available ? 'available' : 'rented',
        location: nextVehicle.location,
        seats: nextVehicle.seats,
        transmission: nextVehicle.transmission,
        type: nextVehicle.type,
        fuel: nextVehicle.fuel,
        description: nextVehicle.description,
        image: nextVehicle.image,
      });
      setIsEditModalOpen(true);
      return;
    }
    if (closeMode === 'edit') {
      setIsEditModalOpen(false);
      setEditingVehicle(null);
      resetForm();
      return;
    }
    if (closeMode === 'add') {
      setIsAddModalOpen(false);
      resetForm();
      return;
    }
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

  const handleApproveBooking = async (rentalId) => {
    try {
      await approveBooking(rentalId);
      alert('Booking approved');
    } catch (err) {
      console.error('Approve booking failed:', err);
      alert('Failed to approve booking. See console for details.');
    }
  };

  const handleRejectBooking = async (rentalId) => {
    try {
      await rejectBooking(rentalId);
      alert('Booking rejected');
    } catch (err) {
      console.error('Reject booking failed:', err);
      alert('Failed to reject booking. See console for details.');
    }
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
            My Vehicles
          </button>
          <button 
            className={`nav-item ${activeTab === 'rentals' ? 'active' : ''}`}
            onClick={() => setActiveTab('rentals')}
          >
            Rental History
          </button>
          <button 
            className={`nav-item ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            Log Book
            {logReportCount > 0 && <span className="nav-badge">{logReportCount}</span>}
          </button>
          <button 
            className={`nav-item ${activeTab === 'feedback' ? 'active' : ''}`}
            onClick={() => setActiveTab('feedback')}
          >
            Feedback
            {ownerFeedbacks.length > 0 && <span className="nav-badge" style={{ background: '#3b82f6', boxShadow: '0 2px 6px rgba(59,130,246,.4)' }}>{ownerFeedbacks.length}</span>}
          </button>
          <button 
            className={`nav-item ${activeTab === 'damage-reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('damage-reports')}
          >
            Damage Reports
            {ownerDamageReports.filter(r => ['submitted', 'under_review', 'new'].includes(r.status)).length > 0 && (
              <span className="nav-badge" style={{ background: '#f59e0b', boxShadow: '0 2px 6px rgba(245,158,11,.4)' }}>
                {ownerDamageReports.filter(r => ['submitted', 'under_review', 'new'].includes(r.status)).length}
              </span>
            )}
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
                {activeTab === 'feedback' && 'Renter Feedback'}
                {activeTab === 'damage-reports' && 'Damage Reports'}
              </h1>
              <p className="header-subtitle">
                {activeTab === 'vehicles' && 'Manage your rental vehicles'}
                {activeTab === 'rentals' && 'Track all rental transactions'}
                {activeTab === 'logs' && 'Vehicle condition check-in logs'}
                {activeTab === 'feedback' && 'See what renters are saying about your vehicles'}
                {activeTab === 'damage-reports' && 'Review and manage damage reports submitted by renters'}
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
                <button className="filter-button add-button" onClick={() => setIsAddModalOpen(true)}>
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
                        onView={(v) => setViewingVehicle(v)}
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
            <div className="panel" style={{ background: 'transparent', boxShadow: 'none', padding: 0 }}>
              {ownerRentals.length === 0 ? (
                <div className="empty-state" style={{ background: '#fff', borderRadius: 16, border: '1px dashed #cbd5e1', padding: '60px 20px', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)' }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>📜</div>
                  <h3 style={{ fontSize: 18, color: '#334155', margin: '0 0 8px', fontWeight: 700 }}>No rental history</h3>
                  <p style={{ color: '#64748b', margin: 0, fontSize: 14 }}>Your vehicle rental history will appear here once bookings are made.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {ownerRentals.slice().reverse().map((rental) => {
                    const logged = isAlreadyLogged(rental.id);
                    return (
                      <div key={rental.id} style={{
                        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16,
                        padding: '24px', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
                        display: 'flex', flexDirection: 'column', gap: 16, transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'; e.currentTarget.style.borderColor = '#0d9488'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                          <div>
                            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{rental.vehicleName}</h3>
                            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px 12px', fontSize: 13, color: '#64748b', fontWeight: 500 }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" /></svg>
                                {rental.renterName}
                              </span>
                              <span style={{ color: '#cbd5e1' }}>•</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                {new Date(rental.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} → {rental.endDate ? new Date(rental.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Ongoing'}
                              </span>
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                            <span style={{ 
                              fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                              padding: '4px 12px', borderRadius: 999,
                              ...(rental.status === 'pending' ? { background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' } : 
                                  rental.status === 'active' || rental.status === 'approved' ? { background: '#d1fae5', color: '#059669', border: '1px solid #a7f3d0' } :
                                  rental.status === 'returned' ? { background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' } :
                                  rental.status === 'rejected' ? { background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' } :
                                  rental.status === 'return_requested' ? { background: '#dbeafe', color: '#2563eb', border: '1px solid #bfdbfe' } :
                                  { background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' })
                            }}>
                              {rental.status.replace('_', ' ')}
                            </span>
                            <span style={{ fontSize: 16, fontWeight: 800, color: '#0d9488' }}>
                              ₱{rental.amount?.toLocaleString()}/day
                            </span>
                          </div>
                        </div>

                        <div style={{ height: 1, background: '#f1f5f9', margin: '4px 0' }} />

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 10 }}>
                          {rental.status === 'pending' && (
                            <>
                              <button onClick={() => handleRejectBooking(rental.id)} style={{ padding: '8px 16px', background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', fontSize: 13, fontWeight: 600, borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s' }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#fca5a5'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#e2e8f0'; }}>
                                Reject
                              </button>
                              <button onClick={() => handleApproveBooking(rental.id)} style={{ padding: '8px 20px', background: '#0d9488', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, borderRadius: 8, cursor: 'pointer', boxShadow: '0 2px 4px rgb(13 148 136 / 0.2)', transition: 'all 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#0f766e'}
                                onMouseLeave={e => e.currentTarget.style.background = '#0d9488'}>
                                Approve
                              </button>
                            </>
                          )}

                          {rental.status === 'return_requested' && (
                            <button onClick={async () => {
                                try {
                                  await acceptReturn(rental.id);
                                  alert('Return accepted');
                                } catch (err) {
                                  console.error('Accept return failed:', err);
                                  alert('Failed to accept return. See console for details.');
                                }
                              }} style={{ padding: '8px 20px', background: '#2563eb', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, borderRadius: 8, cursor: 'pointer', boxShadow: '0 2px 4px rgb(37 99 235 / 0.2)', transition: 'all 0.2s' }}
                              onMouseEnter={e => e.currentTarget.style.background = '#1d4ed8'}
                              onMouseLeave={e => e.currentTarget.style.background = '#2563eb'}>
                              Accept Return
                            </button>
                          )}

                          {(rental.status === 'active' || rental.status === 'approved') && (
                            <button
                              onClick={() => handleRecordToLogBook(rental)}
                              disabled={logged}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                background: logged ? '#f0fdf4' : '#fff',
                                color: logged ? '#059669' : '#0d9488',
                                border: logged ? '1px solid #bbf7d0' : '1px solid #0d9488',
                                cursor: logged ? 'default' : 'pointer',
                                fontSize: 13, fontWeight: 600, borderRadius: 8, padding: '8px 16px',
                                transition: 'all 0.2s', boxShadow: logged ? 'none' : '0 1px 2px rgb(13 148 136 / 0.05)'
                              }}
                              onMouseEnter={e => { if (!logged) { e.currentTarget.style.background = '#f0fdfa'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                              onMouseLeave={e => { if (!logged) { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'none'; } }}
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

          {activeTab === 'feedback' && (
            <div className="panel" style={{ background: 'transparent', boxShadow: 'none', padding: 0 }}>
              {ownerFeedbacks.length === 0 ? (
                <div className="empty-state" style={{ background: '#fff', borderRadius: 16, border: '1px dashed #cbd5e1', padding: '60px 20px', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)' }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>⭐</div>
                  <h3 style={{ fontSize: 18, color: '#334155', margin: '0 0 8px', fontWeight: 700 }}>No feedback yet</h3>
                  <p style={{ color: '#64748b', margin: 0, fontSize: 14 }}>Feedback submitted by your renters will appear here.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {ownerFeedbacks.slice().reverse().map(f => (
                    <div key={f.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '24px', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'flex-start' }}>
                        <div>
                          <h4 style={{ margin: '0 0 6px 0', fontSize: 17, color: '#0f172a' }}>{f.vehicleName}</h4>
                          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>From: {f.renterName} • {new Date(f.date).toLocaleDateString()}</div>
                        </div>
                        <div style={{ background: '#fef3c7', color: '#d97706', padding: '4px 12px', borderRadius: 999, fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
                          {f.rating}
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        </div>
                      </div>
                      <div style={{ height: 1, background: '#f1f5f9', margin: '12px 0' }} />
                      <p style={{ margin: 0, color: '#334155', lineHeight: 1.6, fontSize: 14 }}>"{f.text}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'damage-reports' && (
            <div className="panel" style={{ background: 'transparent', boxShadow: 'none', padding: 0 }}>
              {ownerDamageReports.length === 0 ? (
                <div className="empty-state" style={{ background: '#fff', borderRadius: 16, border: '1px dashed #cbd5e1', padding: '60px 20px', boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>📸</div>
                  <h3 style={{ fontSize: 18, color: '#334155', margin: '0 0 8px', fontWeight: 700 }}>No damage reports</h3>
                  <p style={{ color: '#64748b', margin: 0, fontSize: 14 }}>There are no damage reports for your vehicles.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {ownerDamageReports.slice().reverse().map(r => {
                    const parsedPhotos = normalizePhotos(r.photos);

                    return (
                    <div key={r.id} className="damage-report-card">
                      <div className="damage-report-header">
                        <div>
                          <h4 className="damage-report-title">{r.vehicleName || 'Vehicle'}</h4>
                          <div className="damage-report-meta">Reported by: {r.renterName || 'Renter'} • {new Date(r.reportedDate || r.createdAt || Date.now()).toLocaleDateString()}</div>
                        </div>
                        <div className="damage-report-badges">
                          <span className={`damage-report-badge severity-${r.severity || 'minor'}`}>
                            {r.severity}
                          </span>
                          <span className={`damage-report-badge status-${r.status?.replace('_', '-') || 'submitted'}`}>
                            {r.status?.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      <div className="damage-report-divider" />
                      {/** New grid: hero photo + content */}
                      {(() => {
                        const photos = parsedPhotos;
                        const hero = photos[0];
                        const thumbs = photos.slice(1);
                        return (
                          <div className="damage-report-grid">
                            <div className="damage-hero" onClick={() => hero && setViewingPhoto(hero.src)}>
                              {hero ? (
                                <img src={hero.src} alt={hero.caption || 'Damage'} />
                              ) : (
                                <div className="hero-placeholder">No photo</div>
                              )}
                              {thumbs.length > 0 && (
                                <div className="hero-thumbs">
                                  {thumbs.map(t => t.src ? (
                                    <img key={t.id} src={t.src} alt={t.caption || 'thumb'} onClick={(e) => { e.stopPropagation(); setViewingPhoto(t.src); }} />
                                  ) : null)}
                                </div>
                              )}
                            </div>

                            <div className="damage-content">
                              <div className="damage-report-body">
                                <strong>{r.title}</strong>
                                <p>{r.description}</p>
                                <div style={{ marginTop: 8, color: '#64748b', fontSize: 13 }}>{r.renterName || 'Renter'} • {new Date(r.reportedDate || r.createdAt || Date.now()).toLocaleDateString()}</div>
                              </div>
                              <div className="damage-report-actions">
                                {['submitted', 'under_review', 'draft', 'new'].includes(r.status) && (
                                  <button className="btn btn-primary btn-sm" onClick={async () => { try { if (damageContext.acknowledgeReport) { await damageContext.acknowledgeReport(r.id); } else if (damageContext.updateDamageReport) { await damageContext.updateDamageReport(r.id, { status: 'acknowledged' }); } } catch (err) { console.error(err); } }}>Acknowledge Report</button>
                                )}
                                {r.status === 'acknowledged' && (
                                  <button className="btn btn-success btn-sm" onClick={async () => { try { if (damageContext.resolveReport) { await damageContext.resolveReport(r.id); } else if (damageContext.updateDamageReport) { await damageContext.updateDamageReport(r.id, { status: 'resolved' }); } } catch (err) { console.error(err); } }}>Mark as Resolved</button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )})}
                </div>
              )}
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
        onClose={attemptCloseAddModal}
        title="Add New Vehicle" size="large">
        {renderVehicleForm(handleAddVehicle)}
      </Modal>

      <Modal isOpen={isEditModalOpen}
        onClose={attemptCloseEditModal}
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

      <ConfirmModal
        isOpen={discardConfirm.open}
        onClose={() => setDiscardConfirm({ open: false, nextVehicle: null, closeMode: null })}
        onConfirm={proceedDiscard}
        title="Unsaved Changes"
        message="Are you sure? Unsaved changes will be lost."
        confirmText="Yes, Discard"
        cancelText="No, Keep Editing"
        variant="warning"
      />

      {/* Vehicle Detail View Modal */}
      <Modal
        isOpen={!!viewingVehicle}
        onClose={() => setViewingVehicle(null)}
        title="Vehicle Details"
        size="large"
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => { openEditModal(viewingVehicle); setViewingVehicle(null); }}>
              Edit
            </button>
            <button className="btn btn-danger" onClick={() => { setDeleteConfirm({ open: true, vehicleId: viewingVehicle.id }); setViewingVehicle(null); }}>
              Delete
            </button>
          </div>
        }
      >
        {viewingVehicle && (
          <div className="vehicle-detail-view">
            {viewingVehicle.image ? (
              <img
                src={viewingVehicle.image}
                alt={viewingVehicle.name}
                style={{ width: '100%', maxHeight: 200, objectFit: 'contain', background: '#f8fafc', borderRadius: 10, marginBottom: 20 }}
              />
            ) : (
              <div style={{ width: '100%', height: 180, background: '#f1f5f9', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, marginBottom: 20 }}>
                🚗
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
              {[
                ['Brand', viewingVehicle.brand],
                ['Model', viewingVehicle.name],
                ['Year', viewingVehicle.year],
                ['Type', viewingVehicle.type],
                ['Transmission', viewingVehicle.transmission],
                ['Fuel', viewingVehicle.fuel],
                ['Seats', viewingVehicle.seats ? `${viewingVehicle.seats} seats` : null],
                ['Location', viewingVehicle.location],
                ['Price', viewingVehicle.pricePerDay ? `₱${Number(viewingVehicle.pricePerDay).toLocaleString()}/day` : null],
                ['Status', viewingVehicle.status || (viewingVehicle.available ? 'Available' : 'Rented')],
              ].filter(([, v]) => v).map(([label, val]) => (
                <div key={label}>
                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 15, color: '#1e293b', fontWeight: 500, textTransform: label === 'Status' ? 'capitalize' : 'none' }}>{val}</div>
                </div>
              ))}
            </div>
            {viewingVehicle.description && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Description</div>
                <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, margin: 0 }}>{viewingVehicle.description}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Photo Viewer Modal */}
      <Modal
        isOpen={!!viewingPhoto}
        onClose={() => setViewingPhoto(null)}
        title="Damage Photo"
        size="large"
      >
        {viewingPhoto && <img src={viewingPhoto} alt="Damage" style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: 8 }} />}
      </Modal>

    </div>
  );
}

export default Dashboard;
