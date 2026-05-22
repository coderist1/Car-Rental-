import React, { useState, useMemo } from 'react';
import { useDamageReports } from '../context/DamageReportContext';
import { useAuth } from '../hooks/useAuth';
import '../styles/components/DamageReportInbox.css';
import { normalizePhotos } from '../utils/photoUtils';

export function DamageReportInbox({ embedded = false }) {
  const { user } = useAuth();
  const { reports, acknowledgeReport, resolveReport, loading } = useDamageReports();
  const [selectedReport, setSelectedReport] = useState(null);
  const [statusFilter, setStatusFilter] = useState('new');
  const [expandedReportId, setExpandedReportId] = useState(null);

  // Get reports for this owner
  const ownerReports = useMemo(() => {
    return reports.filter((r) => Number(r.ownerId) === Number(user?.id));
  }, [reports, user?.id]);

  // Filter reports by status
  const filteredReports = useMemo(() => {
    if (statusFilter === 'new') {
      return ownerReports.filter((r) => r.status === 'submitted');
    } else if (statusFilter === 'reviewing') {
      return ownerReports.filter((r) => r.status === 'under_review');
    } else if (statusFilter === 'resolved') {
      return ownerReports.filter((r) => r.status === 'resolved');
    } else if (statusFilter === 'acknowledged') {
      return ownerReports.filter((r) => r.status === 'acknowledged');
    }
    return ownerReports;
  }, [ownerReports, statusFilter]);

  // Count reports by status
  const statusCounts = useMemo(() => ({
    new: ownerReports.filter((r) => r.status === 'submitted').length,
    reviewing: ownerReports.filter((r) => r.status === 'under_review').length,
    acknowledged: ownerReports.filter((r) => r.status === 'acknowledged').length,
    resolved: ownerReports.filter((r) => r.status === 'resolved').length,
  }), [ownerReports]);

  const handleAcknowledge = async (reportId, e) => {
    e.stopPropagation();
    if (window.confirm('Acknowledge this damage report?')) {
      await acknowledgeReport(reportId);
      setSelectedReport(null);
    }
  };

  const handleResolve = async (reportId, e) => {
    e.stopPropagation();
    if (window.confirm('Mark this report as resolved?')) {
      await resolveReport(reportId, '');
      setSelectedReport(null);
    }
  };

  const getSeverityBadge = (severity) => {
    const badges = {
      minor: { icon: '⚪', color: 'minor' },
      moderate: { icon: '🟡', color: 'moderate' },
      severe: { icon: '🔴', color: 'severe' },
    };
    const badge = badges[severity] || badges.minor;
    return <span className={`severity-badge ${badge.color}`}>{badge.icon} {severity}</span>;
  };

  const getStatusBadge = (status) => {
    const badges = {
      submitted: { label: 'NEW', class: 'new' },
      under_review: { label: 'REVIEWING', class: 'reviewing' },
      acknowledged: { label: 'ACKNOWLEDGED', class: 'acknowledged' },
      resolved: { label: 'RESOLVED', class: 'resolved' },
    };
    const badge = badges[status] || badges.submitted;
    return <span className={`status-badge ${badge.class}`}>{badge.label}</span>;
  };

  return (
    <div className={`damage-report-inbox${embedded ? ' embedded' : ''}`}>
      {!embedded && (
        <header className="inbox-header">
          <h1>Damage Reports</h1>
          <p className="subtitle">Manage damage reports from renters</p>
        </header>
      )}

      {/* Status Tabs */}
      <div className="status-tabs">
        <button
          className={`tab ${statusFilter === 'new' ? 'active' : ''}`}
          onClick={() => setStatusFilter('new')}
        >
          New {statusCounts.new > 0 && <span className="badge">{statusCounts.new}</span>}
        </button>
        <button
          className={`tab ${statusFilter === 'reviewing' ? 'active' : ''}`}
          onClick={() => setStatusFilter('reviewing')}
        >
          Under Review {statusCounts.reviewing > 0 && <span className="badge">{statusCounts.reviewing}</span>}
        </button>
        <button
          className={`tab ${statusFilter === 'acknowledged' ? 'active' : ''}`}
          onClick={() => setStatusFilter('acknowledged')}
        >
          Acknowledged {statusCounts.acknowledged > 0 && <span className="badge">{statusCounts.acknowledged}</span>}
        </button>
        <button
          className={`tab ${statusFilter === 'resolved' ? 'active' : ''}`}
          onClick={() => setStatusFilter('resolved')}
        >
          Resolved {statusCounts.resolved > 0 && <span className="badge">{statusCounts.resolved}</span>}
        </button>
      </div>

      {/* Reports List or Detail View */}
      {selectedReport ? (
        <div className="report-detail-view">
          <button className="back-button" onClick={() => setSelectedReport(null)}>
            ← Back to List
          </button>

          <div className="report-detail-card">
            <div className="detail-header">
              <div className="header-info">
                <h2>{selectedReport.title}</h2>
                <div className="badges">
                  {getSeverityBadge(selectedReport.severity)}
                  {getStatusBadge(selectedReport.status)}
                </div>
              </div>
            </div>

            {/* Rental Information */}
            <section className="detail-section">
              <h3>Rental Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Vehicle:</span>
                  <span className="value">{selectedReport.vehicleName}</span>
                </div>
                <div className="info-item">
                  <span className="label">Renter:</span>
                  <span className="value">{selectedReport.renterName}</span>
                </div>
                <div className="info-item">
                  <span className="label">Rental Period:</span>
                  <span className="value">
                    {new Date(selectedReport.rentalStartDate).toLocaleDateString()} -
                    {new Date(selectedReport.rentalEndDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="info-item">
                  <span className="label">Reported Date:</span>
                  <span className="value">
                    {new Date(selectedReport.reportedDate).toLocaleString()}
                  </span>
                </div>
              </div>
            </section>

            {/* Damage Details */}
            <section className="detail-section">
              <h3>Damage Details</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Type:</span>
                  <span className="value">{selectedReport.type.replace('_', ' ')}</span>
                </div>
                <div className="info-item">
                  <span className="label">Location:</span>
                  <span className="value">{selectedReport.location}</span>
                </div>
                <div className="info-item">
                  <span className="label">Discovered Date:</span>
                  <span className="value">
                    {new Date(selectedReport.discoveredDate).toLocaleDateString()}
                  </span>
                </div>
                {selectedReport.estimatedRepairCost && (
                  <div className="info-item">
                    <span className="label">Est. Repair Cost:</span>
                    <span className="value">₱{parseFloat(selectedReport.estimatedRepairCost).toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="description-box">
                <h4>Description:</h4>
                <p>{selectedReport.description}</p>
              </div>
            </section>

            {/* Photos */}
            {normalizePhotos(selectedReport.photos).length > 0 && (
              <section className="detail-section">
                <h3>Evidence Photos ({normalizePhotos(selectedReport.photos).length})</h3>
                <div className="photos-gallery">
                      {normalizePhotos(selectedReport.photos).map((p, idx) => (
                        <div key={p.id || `photo_${idx}`} className="photo-item">
                          <img src={p.src} alt={p.caption || `evidence-${idx + 1}`} />
                          {p.caption && <p className="caption">{p.caption}</p>}
                        </div>
                      ))}
                </div>
              </section>
            )}

            {/* Actions */}
            {selectedReport.status !== 'resolved' && (
              <section className="detail-section actions">
                {selectedReport.status === 'submitted' && (
                  <button
                    className="button primary"
                    onClick={(e) => handleAcknowledge(selectedReport.id, e)}
                    disabled={loading}
                  >
                    {loading ? 'Acknowledging...' : 'Acknowledge Report'}
                  </button>
                )}
                {selectedReport.status !== 'resolved' && (
                  <button
                    className="button secondary"
                    onClick={(e) => handleResolve(selectedReport.id, e)}
                    disabled={loading}
                  >
                    {loading ? 'Resolving...' : 'Mark as Resolved'}
                  </button>
                )}
              </section>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Reports List */}
          {filteredReports.length === 0 ? (
            <div className="empty-state">
              <p>No reports in this category</p>
            </div>
          ) : (
            <div className="reports-list">
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  className="report-card"
                  onClick={() => setSelectedReport(report)}
                >
                  <div className="card-header">
                    <div className="title-section">
                      <h3>{report.title}</h3>
                      <div className="badges">
                        {getSeverityBadge(report.severity)}
                        {getStatusBadge(report.status)}
                      </div>
                    </div>
                  </div>

                  <div className="card-body">
                    <div className="info-row">
                      <span className="label">Vehicle:</span>
                      <span className="value">{report.vehicleName}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Renter:</span>
                      <span className="value">{report.renterName}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Reported:</span>
                      <span className="value">
                        {new Date(report.reportedDate).toLocaleString()}
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="label">Location:</span>
                      <span className="value">{report.location}</span>
                    </div>
                    {normalizePhotos(report.photos).length > 0 && (
                      <div className="info-row">
                        <span className="label">Photos:</span>
                        <span className="value">{normalizePhotos(report.photos).length} attached</span>
                      </div>
                    )}
                  </div>

                  <div className="card-footer">
                    <span className="arrow">→</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
