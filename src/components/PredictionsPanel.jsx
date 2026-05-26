import React, { useEffect, useMemo, useState } from 'react';
import { usePredictions } from '../hooks';
import '../styles/components/PredictionsPanel.css';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(isoDate, days) {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatShortDate(isoDate) {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export default function PredictionsPanel() {
  const {
    demandResult,
    cancellationResult,
    loadingDemand,
    loadingCancellation,
    error,
    predictDemand,
    predictCancellation,
    clearError,
  } = usePredictions();

  const [activeTab, setActiveTab] = useState('demand');
  const [demandForm, setDemandForm] = useState({
    startDate: todayIso(),
    endDate: addDaysIso(todayIso(), 29),
  });
  const [cancelForm, setCancelForm] = useState({
    vehicleModelId: '12',
    fromAreaId: '1021',
    toAreaId: '1323',
    fromDate: todayIso(),
    toDate: addDaysIso(todayIso(), 2),
    bookingCreated: todayIso(),
    onlineBooking: true,
    mobileBooking: false,
  });

  useEffect(() => {
    predictDemand({
      startDate: todayIso(),
      endDate: addDaysIso(todayIso(), 29),
    });
  }, [predictDemand]);

  const chartMax = useMemo(() => {
    if (!demandResult?.predictions?.length) return 1;
    return Math.max(...demandResult.predictions.map((item) => item.predicted_bookings), 1);
  }, [demandResult]);

  const handleDemandSubmit = (event) => {
    event.preventDefault();
    clearError();
    predictDemand(demandForm);
  };

  const handleCancelSubmit = (event) => {
    event.preventDefault();
    clearError();
    predictCancellation(cancelForm);
  };

  const riskPercent = cancellationResult ? Math.round(cancellationResult.score * 100) : 0;
  const isHighRisk = cancellationResult?.label === 'Cancelled';

  return (
    <div className="predictions-panel">
      <div className="predictions-header">
        <div>
          <h2 className="panel-title">AI Predictions</h2>
          <p className="predictions-subtitle">
            Forecast rental demand and estimate booking cancellation risk.
          </p>
        </div>
        <div className="predictions-tabs">
          <button
            type="button"
            className={`predictions-tab ${activeTab === 'demand' ? 'active' : ''}`}
            onClick={() => setActiveTab('demand')}
          >
            Demand Forecast
          </button>
          <button
            type="button"
            className={`predictions-tab ${activeTab === 'cancellation' ? 'active' : ''}`}
            onClick={() => setActiveTab('cancellation')}
          >
            Cancellation Risk
          </button>
        </div>
      </div>

      {error && (
        <div className="predictions-error" role="alert">
          {error}
        </div>
      )}

      {activeTab === 'demand' && (
        <div className="predictions-section">
          <form className="predictions-form" onSubmit={handleDemandSubmit}>
            <div className="predictions-form-grid">
              <label className="predictions-field">
                <span>Start date</span>
                <input
                  type="date"
                  value={demandForm.startDate}
                  onChange={(e) => setDemandForm((prev) => ({ ...prev, startDate: e.target.value }))}
                  required
                />
              </label>
              <label className="predictions-field">
                <span>End date</span>
                <input
                  type="date"
                  value={demandForm.endDate}
                  min={demandForm.startDate}
                  onChange={(e) => setDemandForm((prev) => ({ ...prev, endDate: e.target.value }))}
                  required
                />
              </label>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loadingDemand}>
              {loadingDemand ? 'Generating forecast…' : 'Generate Forecast'}
            </button>
          </form>

          {demandResult && (
            <div className="predictions-results">
              <div className="predictions-summary">
                <div className="predictions-stat">
                  <span className="predictions-stat-label">Forecast period</span>
                  <strong>{demandResult.number_of_days} days</strong>
                </div>
                <div className="predictions-stat">
                  <span className="predictions-stat-label">Total predicted bookings</span>
                  <strong>{demandResult.total_predicted_bookings.toLocaleString()}</strong>
                </div>
                <div className="predictions-stat">
                  <span className="predictions-stat-label">Daily average</span>
                  <strong>
                    {Math.round(demandResult.total_predicted_bookings / Math.max(demandResult.number_of_days, 1))}
                  </strong>
                </div>
                <div className="predictions-stat">
                  <span className="predictions-stat-label">Data source</span>
                  <strong>{demandResult.source?.replace('_', ' ') || 'model'}</strong>
                </div>
              </div>

              <div className="demand-chart">
                {demandResult.predictions.map((item) => (
                  <div key={item.date} className="demand-chart-bar-wrap" title={`${item.date}: ${item.predicted_bookings} bookings`}>
                    <div
                      className="demand-chart-bar"
                      style={{ height: `${(item.predicted_bookings / chartMax) * 100}%` }}
                    />
                    <span className="demand-chart-value">{item.predicted_bookings}</span>
                    <span className="demand-chart-label">{formatShortDate(item.date)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'cancellation' && (
        <div className="predictions-section">
          <form className="predictions-form" onSubmit={handleCancelSubmit}>
            <div className="predictions-form-grid predictions-form-grid--wide">
              <label className="predictions-field">
                <span>Vehicle model ID</span>
                <input
                  type="number"
                  min="1"
                  value={cancelForm.vehicleModelId}
                  onChange={(e) => setCancelForm((prev) => ({ ...prev, vehicleModelId: e.target.value }))}
                />
              </label>
              <label className="predictions-field">
                <span>From area ID</span>
                <input
                  type="number"
                  min="0"
                  value={cancelForm.fromAreaId}
                  onChange={(e) => setCancelForm((prev) => ({ ...prev, fromAreaId: e.target.value }))}
                />
              </label>
              <label className="predictions-field">
                <span>To area ID</span>
                <input
                  type="number"
                  min="0"
                  value={cancelForm.toAreaId}
                  onChange={(e) => setCancelForm((prev) => ({ ...prev, toAreaId: e.target.value }))}
                />
              </label>
              <label className="predictions-field">
                <span>Pickup date</span>
                <input
                  type="date"
                  value={cancelForm.fromDate}
                  onChange={(e) => setCancelForm((prev) => ({ ...prev, fromDate: e.target.value }))}
                />
              </label>
              <label className="predictions-field">
                <span>Return date</span>
                <input
                  type="date"
                  value={cancelForm.toDate}
                  min={cancelForm.fromDate}
                  onChange={(e) => setCancelForm((prev) => ({ ...prev, toDate: e.target.value }))}
                />
              </label>
              <label className="predictions-field">
                <span>Booking created</span>
                <input
                  type="date"
                  value={cancelForm.bookingCreated}
                  onChange={(e) => setCancelForm((prev) => ({ ...prev, bookingCreated: e.target.value }))}
                />
              </label>
            </div>

            <div className="predictions-checkboxes">
              <label className="predictions-checkbox">
                <input
                  type="checkbox"
                  checked={cancelForm.onlineBooking}
                  onChange={(e) => setCancelForm((prev) => ({ ...prev, onlineBooking: e.target.checked }))}
                />
                Online booking
              </label>
              <label className="predictions-checkbox">
                <input
                  type="checkbox"
                  checked={cancelForm.mobileBooking}
                  onChange={(e) => setCancelForm((prev) => ({ ...prev, mobileBooking: e.target.checked }))}
                />
                Mobile booking
              </label>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loadingCancellation}>
              {loadingCancellation ? 'Analyzing booking…' : 'Predict Cancellation'}
            </button>
          </form>

          {cancellationResult && (
            <div className="cancellation-result">
              <div className={`cancellation-badge ${isHighRisk ? 'high' : 'low'}`}>
                {cancellationResult.label}
              </div>
              <div className="cancellation-meter">
                <div className="cancellation-meter-track">
                  <div
                    className={`cancellation-meter-fill ${isHighRisk ? 'high' : 'low'}`}
                    style={{ width: `${riskPercent}%` }}
                  />
                </div>
                <span className="cancellation-meter-label">{riskPercent}% cancellation probability</span>
              </div>
              <p className="cancellation-note">
                {isHighRisk
                  ? 'This booking profile shows elevated cancellation risk. Consider confirmation follow-up or flexible policies.'
                  : 'This booking profile looks stable. Standard confirmation flow should be sufficient.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
