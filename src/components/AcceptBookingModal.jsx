import React, { useState } from 'react';
import { useVehicles } from '../context/VehicleContext';
import '../styles/components/AcceptBookingModal.css';

export function AcceptBookingModal({ booking, onClose, onSuccess }) {
  const { approveBooking } = useVehicles();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleApprove = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await approveBooking(booking.id);
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to approve booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!booking) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  return (
    <div className="accept-modal-overlay">
      <div className="accept-modal-content">
        <div className="accept-modal-header">
          <div className="header-icon">✓</div>
          <h2>Approve Booking</h2>
        </div>
        
        <p className="accept-modal-desc">
          Please review the rental details before approving the request.
        </p>

        <div className="booking-summary-card">
          <div className="summary-item">
            <span className="summary-label">Vehicle</span>
            <span className="summary-value">{booking.vehicleName}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Renter</span>
            <span className="summary-value">{booking.renterName || 'Unknown Renter'}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Dates</span>
            <span className="summary-value">
              {formatDate(booking.startDate)} — {formatDate(booking.endDate)}
            </span>
          </div>
          <div className="summary-item total-amount">
            <span className="summary-label">Total Earnings</span>
            <span className="summary-value">${booking.amount}</span>
          </div>
        </div>
        
        {error && <div className="accept-error-message">{error}</div>}
        
        <div className="accept-modal-actions">
          <button className="btn-accept-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn-accept-primary" onClick={handleApprove} disabled={loading}>
            {loading ? 'Approving...' : 'Confirm & Approve'}
          </button>
        </div>
      </div>
    </div>
  );
}