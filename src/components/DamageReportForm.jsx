import React, { useEffect } from 'react';
import { useDamageReportForm } from '../hooks/useDamageReportForm';
import '../styles/components/DamageReportForm.css';

export function DamageReportForm({ booking, onSubmitSuccess, onClose }) {
  const {
    formData,
    photos,
    loading,
    error,
    validation,
    updateField,
    addPhoto,
    removePhoto,
    updatePhotoCaption,
    submitReport,
  } = useDamageReportForm();

  // Initialize form with booking data
  useEffect(() => {
    if (booking) {
      updateField('bookingId', booking.id);
      updateField('vehicleId', booking.vehicleId);
      if (booking.ownerId != null) {
        updateField('ownerId', booking.ownerId);
      }
      if (booking.ownerName) {
        updateField('ownerName', booking.ownerName);
      }
      if (booking.vehicleName) {
        updateField('vehicleName', booking.vehicleName);
      }
      if (booking.renterName || booking.renter) {
        updateField('renterName', booking.renterName || (typeof booking.renter === 'string' ? booking.renter : booking.renter?.name || ''));
      }
    }
  }, [booking]);

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      addPhoto(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await submitReport();
    if (result) {
      onSubmitSuccess?.(result);
    }
  };

  const severityOptions = [
    { value: 'minor', label: 'Minor', icon: '⚪' },
    { value: 'moderate', label: 'Moderate', icon: '🟡' },
    { value: 'severe', label: 'Severe', icon: '🔴' },
  ];

  const typeOptions = [
    { value: 'pre_rental', label: 'Before Rental' },
    { value: 'during_rental', label: 'During Rental' },
    { value: 'post_rental', label: 'After Rental' },
  ];

  return (
    <div className="damage-report-form-overlay" onClick={onClose}>
      <div className="damage-report-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="form-header">
          <h2>Report Vehicle Damage</h2>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="damage-report-form">
          {/* Rental Information */}
          {booking && (
            <section className="form-section">
              <h3>Rental Information</h3>
              <div className="rental-info-panel">
                <div className="info-row">
                  <span className="label">Vehicle:</span>
                  <span className="value">{booking.vehicleName}</span>
                </div>
                <div className="info-row">
                  <span className="label">Rental Period:</span>
                  <span className="value">
                    {new Date(booking.startDate).toLocaleDateString()} -{' '}
                    {new Date(booking.endDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">Owner:</span>
                  <span className="value">{booking.ownerName}</span>
                </div>
              </div>
            </section>
          )}

          {/* Damage Type */}
          <section className="form-section">
            <label className="section-label">When was the damage discovered?</label>
            <div className="radio-group">
              {typeOptions.map((option) => (
                <label key={option.value} className="radio-option">
                  <input
                    type="radio"
                    name="type"
                    value={option.value}
                    checked={formData.type === option.value}
                    onChange={(e) => updateField('type', e.target.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Damage Title */}
          <section className="form-section">
            <label className="required">Damage Title</label>
            <input
              type="text"
              maxLength="200"
              placeholder="e.g., Scratch on hood, Dent on door"
              value={formData.title}
              onChange={(e) => updateField('title', e.target.value)}
              className={validation.errors.title ? 'input-error' : ''}
            />
            {validation.errors.title && (
              <span className="error-text">{validation.errors.title}</span>
            )}
          </section>

          {/* Severity */}
          <section className="form-section">
            <label className="required">Severity Level</label>
            <div className="severity-selector">
              {severityOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`severity-button ${formData.severity === option.value ? 'active' : ''}`}
                  onClick={() => updateField('severity', option.value)}
                >
                  <span className="icon">{option.icon}</span>
                  <span className="label">{option.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Location */}
          <section className="form-section">
            <label className="required">Location on Vehicle</label>
            <input
              type="text"
              placeholder="e.g., Front bumper, Driver door, Windshield"
              value={formData.location}
              onChange={(e) => updateField('location', e.target.value)}
              className={validation.errors.location ? 'input-error' : ''}
            />
            {validation.errors.location && (
              <span className="error-text">{validation.errors.location}</span>
            )}
          </section>

          {/* Detailed Description */}
          <section className="form-section">
            <label className="required">Detailed Description</label>
            <textarea
              placeholder="Describe the damage in detail. Include what caused it if known, size, and any safety concerns."
              minLength="10"
              rows="5"
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              className={validation.errors.description ? 'input-error' : ''}
            />
            <span className="char-count">{formData.description.length} characters</span>
            {validation.errors.description && (
              <span className="error-text">{validation.errors.description}</span>
            )}
          </section>

          {/* Estimated Repair Cost */}
          <section className="form-section">
            <label>Estimated Repair Cost (Optional)</label>
            <div className="input-with-currency">
              <span className="currency">₱</span>
              <input
                type="number"
                placeholder="0.00"
                step="0.01"
                min="0"
                value={formData.estimatedRepairCost}
                onChange={(e) => updateField('estimatedRepairCost', e.target.value)}
              />
            </div>
          </section>

          {/* Photo Upload */}
          <section className="form-section">
            <label className="required">Photos & Evidence</label>
            <p className="section-help">
              Upload photos to document the damage. Max 10 photos, 5MB each.
            </p>

            <label className="upload-button">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={photos.length >= 10}
                style={{ display: 'none' }}
              />
              <span className="button-content">
                📸 Add Photos
                {photos.length > 0 && ` (${photos.length}/10)`}
              </span>
            </label>

            {validation.errors.photos && (
              <span className="error-text">{validation.errors.photos}</span>
            )}

            {/* Photo Preview Grid */}
            {photos.length > 0 && (
              <div className="photos-grid">
                {photos.map((photo) => (
                  <div key={photo.id} className="photo-card">
                    <img src={photo.preview} alt="preview" className="photo-preview" />
                    <input
                      type="text"
                      placeholder="Photo caption"
                      maxLength="100"
                      value={photo.caption}
                      onChange={(e) => updatePhotoCaption(photo.id, e.target.value)}
                      className="photo-caption"
                    />
                    <button
                      type="button"
                      className="remove-photo"
                      onClick={() => removePhoto(photo.id)}
                      title="Remove photo"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="button secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button primary"
              disabled={!validation.isValid || loading}
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
