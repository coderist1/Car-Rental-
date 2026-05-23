import React, { useState } from 'react';
import { useVehicles } from '../context/VehicleContext';
import '../styles/components/ReturnVehicleModal.css';

export function ReturnVehicleModal({ booking, onClose, onSuccess }) {
  const { requestReturn } = useVehicles();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleReturn = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Calls the function already defined in your VehicleContext.jsx
      await requestReturn(booking.id);
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to request return. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!booking) return null;

  return (
    <div className="return-modal-overlay">
      <div className="return-modal-content">
        <h2>Return Vehicle</h2>
        <p>
          Are you sure you want to initiate the return process for <strong>{booking.vehicleName}</strong>? 
          The vehicle owner will be notified to inspect and acknowledge the return.
        </p>
        
        {error && <div className="return-error-message">{error}</div>}
        
        <div className="return-modal-actions">
          <button className="btn-return-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn-return-primary" onClick={handleReturn} disabled={loading}>
            {loading ? 'Processing...' : 'Confirm Return'}
          </button>
        </div>
      </div>
    </div>
  );
}