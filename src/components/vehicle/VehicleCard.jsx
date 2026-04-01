import React from 'react';
import '../../styles/components/VehicleCard.css';

// ── SVG Icons ────────────────────────────────────────────────────
const CarIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 17H3a2 2 0 01-2-2V9a2 2 0 012-2h3.5l2-3h7l2 3H21a2 2 0 012 2v6a2 2 0 01-2 2h-2" />
    <circle cx="8.5" cy="17" r="2.5" />
    <circle cx="15.5" cy="17" r="2.5" />
  </svg>
);

const TypeIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 17H3a2 2 0 01-2-2V9a2 2 0 012-2h3.5l2-3h7l2 3H21a2 2 0 012 2v6a2 2 0 01-2 2h-2" />
    <circle cx="8.5" cy="17" r="2.5" />
    <circle cx="15.5" cy="17" r="2.5" />
  </svg>
);

const TransmissionIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="5" cy="6" r="2" />
    <circle cx="12" cy="6" r="2" />
    <circle cx="19" cy="6" r="2" />
    <circle cx="5" cy="18" r="2" />
    <circle cx="12" cy="18" r="2" />
    <path d="M5 8v8M12 8v2M19 8v2M12 14v2M12 14h5a2 2 0 002-2v-2" />
  </svg>
);

const SeatsIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37" />
    <circle cx="8" cy="8" r="3" />
    <circle cx="16" cy="8" r="3" />
    <path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
  </svg>
);

const FuelIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 22V8l6-6h6l2 2v2h1a2 2 0 012 2v5a2 2 0 01-2 2h-1v5" />
    <path d="M9 2v6H3" />
    <rect x="5" y="12" width="8" height="6" rx="1" />
  </svg>
);

const LocationIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const HeartIcon = ({ filled }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? '#ef4444' : 'none'} stroke={filled ? '#ef4444' : '#64748b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);

function VehicleCard({
  vehicle,
  mode = 'renter', // 'renter' or 'owner'
  onSave,
  onRent,
  onEdit,
  onDelete,
  onView,
  isSaved = false
}) {
  const {
    id,
    name,
    brand,
    type,
    price,
    pricePerDay,
    image,
    imageUri,
    location,
    seats,
    transmission,
    status,
    available,
    fuel,
    year
  } = vehicle;

  const displayPrice = pricePerDay || price || 0;
  const displayImage = image || imageUri || '';
  const isAvailable = status === 'available' || available;

  const handleCardClick = () => {
    if (onView) onView(vehicle);
  };

  const handleSaveClick = (e) => {
    e.stopPropagation();
    if (onSave) onSave(id);
  };

  const handleRentClick = (e) => {
    e.stopPropagation();
    if (onRent) onRent(vehicle);
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    if (onEdit) onEdit(vehicle);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete(id);
  };

  const getStatusBadgeClass = () => {
    switch (status) {
      case 'available': return 'status-badge available';
      case 'rented': return 'status-badge rented';
      case 'maintenance': return 'status-badge maintenance';
      default: return 'status-badge';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'available': return 'Available';
      case 'rented': return 'Rented';
      case 'maintenance': return 'Maintenance';
      default: return status;
    }
  };

  return (
    <div className={`vehicle-card ${mode}`} onClick={handleCardClick}>
      <div
        className="vehicle-image-container"
        style={{
          position: 'relative',
          width: '100%',
          height: '190px',
          overflow: 'hidden',
          background: '#f1f5f9',
          flexShrink: 0,
        }}
      >
        {displayImage ? (
          <img
            src={displayImage}
            alt={name}
            className="vehicle-image"
            style={{
              position: 'absolute',
              top: 0, left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block',
            }}
          />
        ) : (
          <div className="vehicle-image-placeholder">
            <CarIcon />
          </div>
        )}
        {mode === 'renter' && (
          <button 
            className={`save-button ${isSaved ? 'saved' : ''}`}
            onClick={handleSaveClick}
            aria-label={isSaved ? 'Remove from saved' : 'Save vehicle'}
          >
            <HeartIcon filled={isSaved} />
          </button>
        )}
        {mode === 'owner' && (
          <span className={getStatusBadgeClass()}>{getStatusText()}</span>
        )}
      </div>

      <div className="vehicle-info">
        <div className="vehicle-header">
          <h3 className="vehicle-name">{brand} {name}</h3>
          {year && <span className="vehicle-year">{year}</span>}
        </div>

        <div className="vehicle-details">
          {type && (
            <span className="detail-item">
              <span className="detail-icon"><TypeIcon /></span>
              {type}
            </span>
          )}
          {transmission && (
            <span className="detail-item">
              <span className="detail-icon"><TransmissionIcon /></span>
              {transmission}
            </span>
          )}
          {seats && (
            <span className="detail-item">
              <span className="detail-icon"><SeatsIcon /></span>
              {seats} seats
            </span>
          )}
          {fuel && (
            <span className="detail-item">
              <span className="detail-icon"><FuelIcon /></span>
              {fuel}
            </span>
          )}
        </div>

        {location && (
          <div className="vehicle-location">
            <span className="location-icon"><LocationIcon /></span>
            {location}
          </div>
        )}

        <div className="vehicle-footer">
          <div className="vehicle-price">
            <span className="price-amount">₱{displayPrice.toLocaleString()}</span>
            <span className="price-period">/day</span>
          </div>

          {mode === 'renter' && isAvailable && (
            <div className="vehicle-actions">
              <button 
                className={`btn btn-secondary saved-btn ${isSaved ? 'saved' : ''}`}
                onClick={handleSaveClick}
                aria-label={isSaved ? 'Remove from saved' : 'Save vehicle'}
              >
                <HeartIcon filled={isSaved} />
                {isSaved ? 'Saved' : 'Save'}
              </button>
              <button className="btn btn-primary rent-btn" onClick={handleRentClick}>
                Rent Now
              </button>
            </div>
          )}

          {mode === 'owner' && (
            <div className="owner-actions">
              <button className="btn btn-secondary" onClick={handleEditClick}>
                Edit
              </button>
              <button className="btn btn-danger" onClick={handleDeleteClick}>
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VehicleCard;