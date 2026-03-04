import React, { useState, useMemo } from 'react';
import { useAuth, useVehicles } from '../hooks';
import { ProfileMenu, VehicleCard, Modal, ConfirmModal } from '../components';
import '../styles/pages/Dashboard.css';

const LOCATIONS = [
  'Manila', 'Quezon City', 'Cebu City', 'Davao City', 
  'Makati', 'Taguig', 'Pasig', 'Parañaque', 'Caloocan', 'Antipolo'
];

const VEHICLE_TYPES = [
  'Sedan', 'SUV', 'Hatchback', 'Pickup', 'Van', 'MPV', 'Crossover', 'Coupe', 'Sports'
];

const TRANSMISSIONS = ['Automatic', 'Manual', 'CVT'];
const FUEL_TYPES = ['Gasoline', 'Diesel', 'Hybrid', 'Electric'];

function Dashboard() {
  const { user } = useAuth();
  const { 
    vehicles, 
    addVehicle, 
    updateVehicle, 
    deleteVehicle, 
    getStats, 
    rentalHistory,
    approveBooking,
    rejectBooking,
    acceptReturn 
  } = useVehicles();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'available', 'rented'
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRentalHistoryOpen, setIsRentalHistoryOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, vehicleId: null });
  const [editingVehicle, setEditingVehicle] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    year: new Date().getFullYear(),
    pricePerDay: '',
    status: 'available',
    location: '',
    seats: 5,
    transmission: '',
    type: '',
    fuel: '',
    description: '',
    image: ''
  });

  const stats = getStats();
  const userName = user?.fullName || user?.firstName || 'Owner';

  // Filter vehicles by owner and search
  const ownerVehicles = useMemo(() => {
    return vehicles.filter(v => v.ownerId === user?.id);
  }, [vehicles, user?.id]);

  const filteredVehicles = useMemo(() => {
    return ownerVehicles.filter(vehicle => {
      const matchesSearch = 
        vehicle.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.type?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilter = 
        filterStatus === 'all' || 
        (filterStatus === 'available' && vehicle.available) ||
        (filterStatus === 'rented' && !vehicle.available);
      
      return matchesSearch && matchesFilter;
    });
  }, [ownerVehicles, searchQuery, filterStatus]);

  // Owner's rental records
  const ownerRentals = useMemo(() => {
    const ownerVehicleIds = ownerVehicles.map(v => v.id);
    return rentalHistory.filter(r => ownerVehicleIds.includes(r.vehicleId));
  }, [ownerVehicles, rentalHistory]);

  const ownerStats = useMemo(() => {
    const total = ownerVehicles.length;
    const available = ownerVehicles.filter(v => v.available).length;
    const rented = total - available;
    const estimatedEarnings = ownerVehicles
      .filter(v => !v.available)
      .reduce((sum, v) => sum + Number(v.pricePerDay || 0), 0);
    return { total, available, rented, estimatedEarnings };
  }, [ownerVehicles]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      brand: '',
      year: new Date().getFullYear(),
      pricePerDay: '',
      status: 'available',
      location: '',
      seats: 5,
      transmission: '',
      type: '',
      fuel: '',
      description: '',
      image: ''
    });
  };

  const handleAddVehicle = (e) => {
    e.preventDefault();
    addVehicle(formData);
    resetForm();
    setIsAddModalOpen(false);
  };

  const handleEditVehicle = (e) => {
    e.preventDefault();
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
      name: vehicle.name || '',
      brand: vehicle.brand || '',
      year: vehicle.year || new Date().getFullYear(),
      pricePerDay: vehicle.pricePerDay || '',
      status: vehicle.status || 'available',
      location: vehicle.location || '',
      seats: vehicle.seats || 5,
      transmission: vehicle.transmission || '',
      type: vehicle.type || '',
      fuel: vehicle.fuel || '',
      description: vehicle.description || '',
      image: vehicle.image || ''
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (vehicleId) => {
    setDeleteConfirm({ open: true, vehicleId });
  };

  const confirmDelete = () => {
    if (deleteConfirm.vehicleId) {
      deleteVehicle(deleteConfirm.vehicleId);
    }
    setDeleteConfirm({ open: false, vehicleId: null });
  };

  const renderVehicleForm = (onSubmit, isEdit = false) => (
    <form onSubmit={onSubmit} className="vehicle-form">
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Vehicle Name <span className="required">*</span></label>
          <input
            type="text"
            name="name"
            className="form-input"
            placeholder="e.g. Civic, Vios, Fortuner"
            value={formData.name}
            onChange={handleFormChange}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Brand <span className="required">*</span></label>
          <input
            type="text"
            name="brand"
            className="form-input"
            placeholder="e.g. Toyota, Honda, Ford"
            value={formData.brand}
            onChange={handleFormChange}
            required
          />
        </div>
      </div>

      <div className="form-row three-cols">
        <div className="form-group">
          <label className="form-label">Year <span className="required">*</span></label>
          <input
            type="number"
            name="year"
            className="form-input"
            min="1990"
            max="2026"
            value={formData.year}
            onChange={handleFormChange}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Price/Day (₱) <span className="required">*</span></label>
          <input
            type="number"
            name="pricePerDay"
            className="form-input"
            placeholder="e.g. 2500"
            value={formData.pricePerDay}
            onChange={handleFormChange}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Status</label>
          <select
            name="status"
            className="form-input"
            value={formData.status}
            onChange={handleFormChange}
          >
            <option value="available">Available</option>
            <option value="rented">Rented</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Location <span className="required">*</span></label>
        <select
          name="location"
          className="form-input"
          value={formData.location}
          onChange={handleFormChange}
          required
        >
          <option value="">-- Select Location --</option>
          {LOCATIONS.map(loc => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Seats</label>
          <input
            type="number"
            name="seats"
            className="form-input"
            min="1"
            max="15"
            value={formData.seats}
            onChange={handleFormChange}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Transmission</label>
          <select
            name="transmission"
            className="form-input"
            value={formData.transmission}
            onChange={handleFormChange}
          >
            <option value="">-- Select --</option>
            {TRANSMISSIONS.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Type</label>
          <select
            name="type"
            className="form-input"
            value={formData.type}
            onChange={handleFormChange}
          >
            <option value="">-- Select Type --</option>
            {VEHICLE_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Fuel Type</label>
          <select
            name="fuel"
            className="form-input"
            value={formData.fuel}
            onChange={handleFormChange}
          >
            <option value="">-- Select --</option>
            {FUEL_TYPES.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Image URL</label>
        <input
          type="url"
          name="image"
          className="form-input"
          placeholder="https://example.com/car-image.jpg"
          value={formData.image}
          onChange={handleFormChange}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea
          name="description"
          className="form-input"
          rows="3"
          placeholder="Brief description of the vehicle..."
          value={formData.description}
          onChange={handleFormChange}
        />
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={() => {
          isEdit ? setIsEditModalOpen(false) : setIsAddModalOpen(false);
          resetForm();
        }}>
          Cancel
        </button>
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
          <h1>Owner Dashboard</h1>
          <div className="user-info">
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
        <div 
          className={`stat-card clickable ${filterStatus === 'available' ? 'active' : ''}`}
          onClick={() => setFilterStatus(filterStatus === 'available' ? 'all' : 'available')}
        >
          <div className="stat-number">{ownerStats.available}</div>
          <div className="stat-label">Available</div>
        </div>
        <div 
          className={`stat-card clickable ${filterStatus === 'rented' ? 'active' : ''}`}
          onClick={() => setFilterStatus(filterStatus === 'rented' ? 'all' : 'rented')}
        >
          <div className="stat-number">{ownerStats.rented}</div>
          <div className="stat-label">Rented</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">₱{ownerStats.estimatedEarnings.toLocaleString()}</div>
          <div className="stat-label">Est. Earnings / Day</div>
        </div>
      </section>

      <section className="search-section">
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search your vehicles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="btn btn-outline" onClick={() => setIsRentalHistoryOpen(true)}>
            Rental History
          </button>
          <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
            + Add Vehicle
          </button>
        </div>
      </section>

      <section className="vehicles-grid">
        {filteredVehicles.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🚗</div>
            <h3>No vehicles yet</h3>
            <p>Click "Add Vehicle" to list your first car for rent.</p>
          </div>
        ) : (
          filteredVehicles.map(vehicle => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              mode="owner"
              onEdit={openEditModal}
              onDelete={handleDeleteClick}
            />
          ))
        )}
      </section>

      {/* Add Vehicle Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); resetForm(); }}
        title="Add New Vehicle"
        size="large"
      >
        {renderVehicleForm(handleAddVehicle)}
      </Modal>

      {/* Edit Vehicle Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setEditingVehicle(null); resetForm(); }}
        title="Edit Vehicle"
        size="large"
      >
        {renderVehicleForm(handleEditVehicle, true)}
      </Modal>

      {/* Rental History Modal */}
      <Modal
        isOpen={isRentalHistoryOpen}
        onClose={() => setIsRentalHistoryOpen(false)}
        title="Rental History"
        size="large"
      >
        {ownerRentals.length === 0 ? (
          <div className="empty-state">
            <p>No rental history yet.</p>
          </div>
        ) : (
          <div className="rental-history-list">
            {ownerRentals.slice().reverse().map(rental => (
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
                  {new Date(rental.startDate).toLocaleDateString()} → 
                  {rental.endDate ? new Date(rental.endDate).toLocaleDateString() : 'Ongoing'}
                </div>
                {rental.status === 'pending' && (
                  <div className="rental-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => approveBooking(rental.id)}>
                      Approve
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => rejectBooking(rental.id)}>
                      Reject
                    </button>
                  </div>
                )}
                {rental.status === 'return_requested' && (
                  <div className="rental-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => acceptReturn(rental.id)}>
                      Accept Return
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, vehicleId: null })}
        onConfirm={confirmDelete}
        title="Delete Vehicle"
        message="Are you sure you want to delete this vehicle? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}

export default Dashboard;
