import React from 'react';
import '../../styles/components/VehicleCard.css';

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
      <div className="vehicle-image-container">
        {displayImage ? (
          <img src={displayImage} alt={name} className="vehicle-image" />
        ) : (
          <div className="vehicle-image-placeholder">
            <span>🚗</span>
          </div>
        )}
        {mode === 'renter' && (
          <button 
            className={`save-button ${isSaved ? 'saved' : ''}`}
            onClick={handleSaveClick}
            aria-label={isSaved ? 'Remove from saved' : 'Save vehicle'}
          >
            {isSaved ? '❤️' : '🤍'}
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
              <span className="detail-icon">🚙</span>
              {type}
            </span>
          )}
          {transmission && (
            <span className="detail-item">
              <span className="detail-icon">⚙️</span>
              {transmission}
            </span>
          )}
          {seats && (
            <span className="detail-item">
              <span className="detail-icon"></span>
              {seats} seats
            </span>
          )}
          {fuel && (
            <span className="detail-item">
              <span className="detail-icon">⛽</span>
              {fuel}
            </span>
          )}
        </div>

        {location && (
          <div className="vehicle-location">
            <span className="location-icon">📍</span>
            {location}
          </div>
        )}

        <div className="vehicle-footer">
          <div className="vehicle-price">
            <span className="price-amount">₱{displayPrice.toLocaleString()}</span>
            <span className="price-period">/day</span>
          </div>

          {mode === 'renter' && isAvailable && (
            <button className="btn btn-primary rent-btn" onClick={handleRentClick}>
              Rent Now
            </button>
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
