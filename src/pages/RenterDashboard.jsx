import React, { useState, useMemo, useCallback } from 'react';
import { useVehicles } from '../hooks';
import { useAuth } from '../context/AuthContext';
import { ProfileMenu, VehicleCard, Modal } from '../components';
import { loadLogReports, addComment, saveLogReports } from '../hooks/useLogReport';
import '../styles/pages/RenterDashboard.css';
import '../styles/pages/LogReport.css';

const DEFAULT_CHECKLIST = [
  { id: 'exterior_scratches', label: 'Exterior scratches / dents'   },
  { id: 'windshield',         label: 'Windshield cracks / chips'    },
  { id: 'tires',              label: 'Tire damage / flat tires'     },
  { id: 'interior',           label: 'Interior damage (seats, dash)'},
  { id: 'missing_parts',      label: 'Missing parts / accessories'  },
  { id: 'engine',             label: 'Engine / mechanical issue'    },
  { id: 'lights',             label: 'Lights / signals broken'      },
  { id: 'fuel_low',           label: 'Fuel level low'               },
];

const fmtDate = iso => iso ? new Date(iso).toLocaleString() : '—';

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

const ClipboardIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const CarIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 17H3a2 2 0 01-2-2V9a2 2 0 012-2h3.5l2-3h7l2 3H21a2 2 0 012 2v6a2 2 0 01-2 2h-2M8 17a2 2 0 104 0 2 2 0 00-4 0zm8 0a2 2 0 104 0 2 2 0 00-4 0z" />
  </svg>
);

const UserIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
  </svg>
);

const AlertIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
  </svg>
);

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const CommentIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const LinkIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

const ClockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
  </svg>
);

const EyeIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

const CONDITION_COLORS_R = {
  Excellent: { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' },
  Good:      { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' },
  Fair:      { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' },
  Poor:      { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
};
const FUEL_BAR_R = { 'Full': 100, '3/4': 75, '1/2': 50, '1/4': 25, 'Empty': 0 };

function FuelGaugeR({ level }) {
  if (!level) return <span style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>{level || '—'}</span>;
  const pct = FUEL_BAR_R[level] ?? 0;
  const color = pct >= 75 ? '#22c55e' : pct >= 50 ? '#84cc16' : pct >= 25 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
      <div style={{ flex: 1, height: 7, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4 }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 32, textAlign: 'right' }}>{level}</span>
    </div>
  );
}

function ConditionBadgeR({ rating }) {
  if (!rating) return null;
  const c = CONDITION_COLORS_R[rating] || { bg: '#f3f4f6', color: '#374151', border: '#d1d5db' };
  return (
    <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>{rating}</span>
  );
}

function TripSummaryRenter({ report }) {
  if (!report.checkout) return null;
  const ms = report.startDate && report.endDate ? new Date(report.endDate) - new Date(report.startDate) : 0;
  const days = ms > 0 ? Math.max(1, Math.round(ms / 86400000)) : null;
  const ciOdo = parseFloat(report.odometer);
  const coOdo = parseFloat(report.checkout?.odometer);
  const kmDriven = !isNaN(ciOdo) && !isNaN(coOdo) && coOdo > ciOdo ? coOdo - ciOdo : null;
  const ciIssues = report.issues || [];
  const coIssues = report.checkout?.issues || [];
  const newDamage = coIssues.filter(i => !ciIssues.includes(i));

  return (
    <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)', border: '1px solid rgba(63,155,132,.25)', borderRadius: 12, padding: '14px 18px', marginBottom: 18 }}>
      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#6b7280', margin: '0 0 10px' }}>Trip Summary</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 10 }}>
        {days && <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><span style={{ fontSize: 18, fontWeight: 800, color: '#1a2c5e' }}>{days}</span><span style={{ fontSize: 11, color: '#6b7280' }}>Days</span></div>}
        {kmDriven && <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><span style={{ fontSize: 18, fontWeight: 800, color: '#1a2c5e' }}>{kmDriven.toLocaleString()}</span><span style={{ fontSize: 11, color: '#6b7280' }}>km Driven</span></div>}
        {newDamage.length > 0 && <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><span style={{ fontSize: 18, fontWeight: 800, color: '#ef4444' }}>{newDamage.length}</span><span style={{ fontSize: 11, color: '#6b7280' }}>New Issues</span></div>}
      </div>
      {newDamage.length > 0 && (
        <div style={{ marginTop: 12, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, color: '#991b1b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          ⚠ New damage was recorded at check-out. Contact the owner if you have concerns.
        </div>
      )}
    </div>
  );
}


function PhotoGallery({ photos = [], label }) {
  const [lightbox, setLightbox] = useState(null);
  if (!photos.length) return null;
  return (
    <div className="lr-view-section">
      <p className="lr-view-section-title">{label}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {photos.map((src, i) => (
          <img key={i} src={src} alt="" onClick={() => setLightbox(src)}
            style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb', cursor: 'pointer' }} />
        ))}
      </div>
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={lightbox} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 8 }} />
        </div>
      )}
    </div>
  );
}

function IssueBlock({ issues, labelFn, newIssues = [] }) {
  return (
    <div className="lr-view-section">
      <p className="lr-view-section-title">Condition</p>
      {issues.length > 0 ? (
        <ul className="lr-view-issues">
          {issues.map(k => {
            const isNew = newIssues.includes(k);
            return (
              <li key={k} className={isNew ? 'lr-issue-new' : ''}>
                <span className={`lr-dot${isNew ? ' lr-dot--new' : ''}`} />
                {labelFn(k)}
                {isNew && <span className="lr-new-badge">NEW</span>}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="lr-ok" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><CheckIcon /> No issues flagged</p>
      )}
    </div>
  );
}

function NotesBlock({ notes }) {
  return (
    <div className="lr-view-section">
      <p className="lr-view-section-title">Notes</p>
      <pre className="lr-view-notes">{notes || 'No notes provided.'}</pre>
    </div>
  );
}

function RenterLogListModal({ isOpen, onClose, reports, onView }) {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return reports.filter(r => !q || (r.vehicleName || '').toLowerCase().includes(q));
  }, [reports, search]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="My Vehicle Log Reports" size="large">
      <p className="lr-form-subtitle">Log reports made by the owner for your rented vehicles. You can view and comment.</p>
      <div className="lr-list-controls">
        <input className="form-input" placeholder="Search vehicle…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      {filtered.length === 0 ? (
        <div className="empty-state" style={{ padding: '40px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, color: '#9ca3af' }}><ClipboardIcon /></div>
          <h3>No log reports yet</h3>
          <p>The owner has not created a log report for your rentals yet.</p>
        </div>
      ) : (
        <div className="lr-list">
          {filtered.slice().reverse().map(r => (
            <div key={r.id} className="lr-list-row" onClick={() => onView(r)}>
              <div className="lr-list-body">
                <div className="lr-list-tags">
                  <span className="lr-tag lr-tag--ci">Check-in</span>
                  {r.checkout
                    ? <span className="lr-badge lr-badge--linked" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><LinkIcon /> Trip Complete</span>
                    : <span className="lr-badge lr-badge--pending" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><ClockIcon /> Awaiting Check-out</span>}
                  {(r.comments || []).length > 0 && (
                    <span className="lr-badge lr-badge--comment" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <CommentIcon /> {r.comments.length}
                    </span>
                  )}
                </div>
                <p className="lr-list-vehicle">{r.vehicleName}</p>
                <div className="lr-list-meta">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><ClockIcon />{fmtDate(r.createdAt)}</span>
                  {(r.issues || []).length > 0
                    ? <span className="lr-flag" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><AlertIcon />{r.issues.length} issue{r.issues.length > 1 ? 's' : ''}</span>
                    : <span className="lr-ok" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><CheckIcon />No issues on check-in</span>}
                </div>
              </div>
              <span className="lr-list-arrow"><ChevronRightIcon /></span>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
        <button className="btn btn-secondary" onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
}

function RenterLogViewModal({ isOpen, onClose, report, onCommentAdded, user }) {
  const [commentText,  setCommentText]  = useState('');
  const [submitting,   setSubmitting]   = useState(false);
  const [localReport,  setLocalReport]  = useState(report);
  const [sigText,      setSigText]      = useState('');
  const [sigEditing,   setSigEditing]   = useState(false);
  const [sigSaving,    setSigSaving]    = useState(false);

  React.useEffect(() => { setLocalReport(report); }, [report]);

  if (!localReport) return null;

  const hasCheckout   = !!localReport.checkout;
  const ciIssues      = localReport.issues || [];
  const newIssues     = hasCheckout ? (localReport.checkout.issues || []).filter(i => !ciIssues.includes(i)) : [];
  const alreadySigned = !!localReport.renterSignature;

  const allLabels = id => {
    const d = DEFAULT_CHECKLIST.find(x => x.id === id);
    return (localReport.customLabels || {})[id] || (localReport.checkout?.customLabels || {})[id] || d?.label || id;
  };

  const handleComment = () => {
    if (!commentText.trim()) return;
    setSubmitting(true);
    addComment(localReport.id, {
      authorName: user?.fullName || user?.firstName || 'Renter',
      authorId: user?.id,
      authorRole: 'renter',
      text: commentText.trim(),
    });
    const fresh = loadLogReports().find(r => r.id === localReport.id);
    if (fresh) setLocalReport(fresh);
    setCommentText('');
    setSubmitting(false);
    onCommentAdded && onCommentAdded();
  };

  const handleSign = () => {
    if (!sigText.trim()) return;
    setSigSaving(true);
    const all = loadLogReports();
    const idx = all.findIndex(r => r.id === localReport.id);
    if (idx !== -1) {
      all[idx].renterSignature   = sigText.trim();
      all[idx].renterSignatureAt = new Date().toISOString();
      saveLogReports(all);
    }
    const fresh = loadLogReports().find(r => r.id === localReport.id);
    if (fresh) setLocalReport(fresh);
    setSigText('');
    setSigEditing(false);
    setSigSaving(false);
    onCommentAdded && onCommentAdded();
  };

  return (
    <Modal
      isOpen={isOpen} onClose={onClose}
      title={hasCheckout ? 'Trip Log Report' : 'Check-in Log Report'}
      size="xlarge"
      footer={<button className="btn btn-secondary" onClick={onClose}>Close</button>}
    >
      <div className="lr-renter-notice" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <EyeIcon /> This report was made by the vehicle owner. You can view it and leave a comment if you have concerns.
      </div>

      <div className="lr-trip-banner">
        <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><CarIcon />{localReport.vehicleName}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><UserIcon />Renter: <strong>{localReport.renterName || '—'}</strong></span>
      </div>

      {/* Trip summary when complete */}
      <TripSummaryRenter report={localReport} />

      {hasCheckout ? (
        <div className="lr-compare-grid">
          <div className="lr-compare-col">
            <div className="lr-compare-header lr-compare-header--ci"><span>Before Trip</span><small>{fmtDate(localReport.createdAt)}</small></div>
            {(localReport.odometer || localReport.fuelLevel || localReport.conditionRating) && (
              <div className="lr-view-section" style={{ padding: '10px 14px' }}>
                {localReport.odometer && <div style={{ marginBottom: 6 }}><span className="lr-view-label">Odometer </span><span className="lr-view-value">{localReport.odometer} km</span></div>}
                {localReport.fuelLevel && <div style={{ marginBottom: 6 }}><span className="lr-view-label">Fuel </span><FuelGaugeR level={localReport.fuelLevel} /></div>}
                {localReport.conditionRating && <div><span className="lr-view-label">Condition </span><ConditionBadgeR rating={localReport.conditionRating} /></div>}
              </div>
            )}
            <IssueBlock issues={ciIssues} labelFn={allLabels} newIssues={[]} />
            <NotesBlock notes={localReport.notes} />
            <PhotoGallery photos={localReport.photos} label="Check-in Photos" />
          </div>
          <div className="lr-compare-col">
            <div className="lr-compare-header lr-compare-header--co"><span>After Trip</span><small>{fmtDate(localReport.checkout.createdAt)}</small></div>
            {(localReport.checkout.odometer || localReport.checkout.fuelLevel || localReport.checkout.conditionRating) && (
              <div className="lr-view-section" style={{ padding: '10px 14px' }}>
                {localReport.checkout.odometer && <div style={{ marginBottom: 6 }}><span className="lr-view-label">Odometer </span><span className="lr-view-value">{localReport.checkout.odometer} km</span></div>}
                {localReport.checkout.fuelLevel && <div style={{ marginBottom: 6 }}><span className="lr-view-label">Fuel </span><FuelGaugeR level={localReport.checkout.fuelLevel} /></div>}
                {localReport.checkout.conditionRating && <div><span className="lr-view-label">Condition </span><ConditionBadgeR rating={localReport.checkout.conditionRating} /></div>}
              </div>
            )}
            <IssueBlock issues={localReport.checkout.issues || []} labelFn={allLabels} newIssues={newIssues} />
            <NotesBlock notes={localReport.checkout.notes} />
            <PhotoGallery photos={localReport.checkout.photos} label="Check-out Photos" />
          </div>
        </div>
      ) : (
        <>
          <div className="lr-view-grid">
            <div className="lr-view-field"><span className="lr-view-label">Vehicle</span><span className="lr-view-value">{localReport.vehicleName}</span></div>
            <div className="lr-view-field"><span className="lr-view-label">Date</span><span className="lr-view-value">{fmtDate(localReport.createdAt)}</span></div>
            {localReport.odometer && <div className="lr-view-field"><span className="lr-view-label">Odometer</span><span className="lr-view-value">{localReport.odometer} km</span></div>}
            {localReport.fuelLevel && (
              <div className="lr-view-field">
                <span className="lr-view-label">Fuel Level</span>
                <FuelGaugeR level={localReport.fuelLevel} />
              </div>
            )}
            {localReport.conditionRating && (
              <div className="lr-view-field">
                <span className="lr-view-label">Condition Rating</span>
                <ConditionBadgeR rating={localReport.conditionRating} />
              </div>
            )}
          </div>
          <IssueBlock issues={ciIssues} labelFn={allLabels} newIssues={[]} />
          <NotesBlock notes={localReport.notes} />
          <PhotoGallery photos={localReport.photos} label="Check-in Photos" />
        </>
      )}

      {/* Renter Acknowledgement Signature */}
      <div className="lr-view-section">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <p className="lr-view-section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 11l-5 5v3h3l5-5m0 0l3.536-3.536M9 11l3.536-3.536" />
            </svg>
            Your Acknowledgement
          </p>
          {!sigEditing && (
            <button
              onClick={() => { setSigText(localReport.renterSignature || user?.fullName || user?.firstName || ''); setSigEditing(true); }}
              style={{ background: alreadySigned ? 'none' : '#4338ca', color: alreadySigned ? '#4338ca' : '#fff', border: alreadySigned ? '1px solid #c7d2fe' : 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              {alreadySigned ? '✏ Edit Signature' : 'Sign Acknowledgement'}
            </button>
          )}
        </div>

        {alreadySigned && !sigEditing ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 16px' }}>
            <span style={{ fontSize: 20 }}></span>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1a2c5e', fontStyle: 'italic' }}>{localReport.renterSignature}</p>
              {localReport.renterSignatureAt && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9ca3af' }}>Signed {fmtDate(localReport.renterSignatureAt)}</p>}
            </div>
          </div>
        ) : sigEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#1e40af' }}>
              {alreadySigned
                ? 'Update your acknowledgement signature below. Type your full name to confirm.'
                : 'By signing, you acknowledge that you have read this vehicle log report and agree with its contents. Type your full name below to sign.'}
            </div>
            <input
              className="form-input"
              value={sigText}
              onChange={e => setSigText(e.target.value)}
              placeholder="Type your full name to sign…"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleSign()}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary" onClick={() => { setSigEditing(false); setSigText(''); }}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={handleSign}
                disabled={sigSaving || !sigText.trim()}
                style={{ background: '#4338ca', border: 'none' }}
              >
                {sigSaving ? 'Saving…' : alreadySigned ? '✍ Update Signature' : '✍ Confirm Signature'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#92400e' }}>
            ⏳ You haven't signed this report yet. Click "Sign Acknowledgement" to confirm you've reviewed it.
          </div>
        )}
      </div>

      <div className="lr-comments-section">
        <p className="lr-view-section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><CommentIcon /> Comments</p>
        {(localReport.comments || []).length === 0
          ? <p className="lr-muted">No comments yet. Be the first to comment.</p>
          : (
            <div className="lr-comments-list">
              {localReport.comments.map(c => {
                const isOwner = c.authorRole === 'owner';
                return (
                  <div key={c.id} className="lr-comment" style={{
                    borderLeft: `3px solid ${isOwner ? '#3F9B84' : '#6366f1'}`,
                    background: isOwner ? 'rgba(63,155,132,.04)' : 'rgba(99,102,241,.04)',
                  }}>
                    <div className="lr-comment-meta">
                      <span className="lr-comment-author" style={{ display: 'flex', alignItems: 'center', gap: 5, color: isOwner ? '#3F9B84' : '#4338ca' }}>
                        <UserIcon />{c.authorName}
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 999, background: isOwner ? 'rgba(63,155,132,.15)' : 'rgba(99,102,241,.15)', color: isOwner ? '#065f46' : '#3730a3' }}>
                          {isOwner ? 'Owner' : 'Renter'}
                        </span>
                      </span>
                      <span className="lr-comment-date">{fmtDate(c.createdAt)}</span>
                    </div>
                    <p className="lr-comment-text">{c.text}</p>
                  </div>
                );
              })}
            </div>
          )
        }
        <div className="lr-comment-form">
          <textarea
            className="form-input"
            rows="3"
            placeholder="Have a concern about this report? Write your comment here…"
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
          />
          <button
            className="btn btn-primary"
            onClick={handleComment}
            disabled={submitting || !commentText.trim()}
            style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <CommentIcon /> {submitting ? 'Sending…' : 'Send Comment'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function RenterDashboard() {
  const { user }   = useAuth();
  const { vehicles, toggleSavedCar, isCarSaved, savedCars, addRentalRecord, getUserRentals, requestReturn } = useVehicles();

  const [searchQuery,     setSearchQuery]     = useState('');
  const [isFilterOpen,    setIsFilterOpen]    = useState(false);
  const [isDetailOpen,    setIsDetailOpen]    = useState(false);
  const [isHistoryOpen,   setIsHistoryOpen]   = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showingSaved,    setShowingSaved]    = useState(false);

  const [logReports,    setLogReports]    = useState(() => loadLogReports());
  const [isLogListOpen, setIsLogListOpen] = useState(false);
  const [isLogViewOpen, setIsLogViewOpen] = useState(false);
  const [viewingReport, setViewingReport] = useState(null);

  const refreshLogs = useCallback(() => setLogReports(loadLogReports()), []);

  const [filters, setFilters] = useState({ types: [], transmissions: [], fuels: [], minPrice: '', maxPrice: '' });

  const userName    = user?.fullName || user?.firstName || 'Renter';
  const userRentals = getUserRentals();

  const renterLogReports = useMemo(() => {
    const myRentalIds = new Set(userRentals.map(r => String(r.id)));
    return logReports.filter(lr =>
      (lr.rentalId && myRentalIds.has(String(lr.rentalId))) ||
      (lr.renterName && lr.renterName === (user?.fullName || user?.firstName))
    );
  }, [logReports, userRentals, user]);

  const logCount = renterLogReports.length;

  const availableVehicles = useMemo(() => vehicles.filter(v => v.available), [vehicles]);

  const filteredVehicles = useMemo(() => {
    let result = showingSaved ? vehicles.filter(v => savedCars.includes(v.id)) : availableVehicles;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(v =>
        v.name?.toLowerCase().includes(q) || v.brand?.toLowerCase().includes(q) ||
        v.type?.toLowerCase().includes(q) || v.location?.toLowerCase().includes(q)
      );
    }
    if (filters.types.length > 0)        result = result.filter(v => filters.types.includes(v.type));
    if (filters.transmissions.length > 0) result = result.filter(v => filters.transmissions.includes(v.transmission));
    if (filters.fuels.length > 0)         result = result.filter(v => filters.fuels.includes(v.fuel));
    if (filters.minPrice) result = result.filter(v => Number(v.pricePerDay || 0) >= Number(filters.minPrice));
    if (filters.maxPrice) result = result.filter(v => Number(v.pricePerDay || 0) <= Number(filters.maxPrice));
    return result;
  }, [availableVehicles, vehicles, savedCars, showingSaved, searchQuery, filters]);

  const stats = useMemo(() => {
    const avgPrice = availableVehicles.length > 0
      ? Math.round(availableVehicles.reduce((s, v) => s + Number(v.pricePerDay || 0), 0) / availableVehicles.length)
      : 0;
    return { total: vehicles.length, available: availableVehicles.length, avgPrice, saved: savedCars.length };
  }, [vehicles, availableVehicles, savedCars]);

  const activeFiltersCount = filters.types.length + filters.transmissions.length + filters.fuels.length + (filters.minPrice ? 1 : 0) + (filters.maxPrice ? 1 : 0);

  const handleFilterToggle = (cat, val) => setFilters(prev => ({
    ...prev,
    [cat]: prev[cat].includes(val) ? prev[cat].filter(v => v !== val) : [...prev[cat], val],
  }));
  const clearFilters = () => setFilters({ types: [], transmissions: [], fuels: [], minPrice: '', maxPrice: '' });

  const handleViewVehicle = vehicle => { setSelectedVehicle(vehicle); setIsDetailOpen(true); };
  const handleRentVehicle = vehicle => {
    if (!vehicle) return;
    if (window.confirm(`Request to rent ${vehicle.brand} ${vehicle.name} for ₱${vehicle.pricePerDay}/day?`)) {
      addRentalRecord(vehicle);
      alert('Rental request sent! The owner will review your request.');
      setIsDetailOpen(false);
    }
  };
  const handleRequestReturn = rentalId => {
    if (window.confirm('Request to return this vehicle?')) { requestReturn(rentalId); alert('Return request sent!'); }
  };

  const handleViewLog = report => { setViewingReport(report); setIsLogViewOpen(true); setIsLogListOpen(false); };

  return (
    <div className="renter-dashboard">
      <header className="renter-header">
        <div className="header-info">
          <h1 className="greeting">Hello, {userName}</h1>
          <p className="header-subtitle">Find your perfect ride</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline lr-toolbar-btn" onClick={() => { refreshLogs(); setIsLogListOpen(true); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <ClipboardIcon /> Log Reports
            {logCount > 0 && <span className="lr-badge-pill">{logCount}</span>}
          </button>
          <button className="btn btn-outline" onClick={() => setIsHistoryOpen(true)}>My Rentals</button>
          <ProfileMenu />
        </div>
      </header>

      <section className="search-section">
        <div className="search-container">
          <div className="search-input-wrapper">
            <span className="search-icon"><SearchIcon /></span>
            <input type="text" className="search-input" placeholder="Search cars…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <button className="filter-button" onClick={() => setIsFilterOpen(true)}>
            <span className="filter-icon"><FilterIcon /></span>
            {activeFiltersCount > 0 && <span className="filter-badge">{activeFiltersCount}</span>}
          </button>
        </div>
      </section>

      <section className="stats-section">
        <div className="stat-card"><div className="stat-number">{stats.total}</div><div className="stat-label">Total Cars</div></div>
        <div className="stat-card"><div className="stat-number">{stats.available}</div><div className="stat-label">Available</div></div>
        <div className="stat-card"><div className="stat-number">&#8369;{stats.avgPrice.toLocaleString()}</div><div className="stat-label">Avg Price</div></div>
        <div className={`stat-card clickable ${showingSaved ? 'active' : ''}`} onClick={() => setShowingSaved(!showingSaved)}>
          <div className="stat-number">{stats.saved}</div><div className="stat-label">Saved</div>
        </div>
      </section>

      <section className="vehicles-section">
        {filteredVehicles.length === 0 ? (
          <div className="empty-state">
            <h3>{showingSaved ? 'No saved vehicles' : 'No vehicles found'}</h3>
            <p>{showingSaved ? 'Save vehicles you like by clicking the heart icon.' : 'Try adjusting your search or filters.'}</p>
          </div>
        ) : (
          <div className="vehicles-grid">
            {filteredVehicles.map(vehicle => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} mode="renter"
                isSaved={isCarSaved(vehicle.id)}
                onSave={() => toggleSavedCar(vehicle.id)}
                onRent={() => handleRentVehicle(vehicle)}
                onView={() => handleViewVehicle(vehicle)} />
            ))}
          </div>
        )}
      </section>

      <Modal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} title="Filters"
        footer={<><button className="btn btn-secondary" onClick={clearFilters}>Reset</button><button className="btn btn-primary" onClick={() => setIsFilterOpen(false)}>Apply</button></>}>
        <div className="filter-content">
          <div className="filter-group">
            <label className="filter-label">Vehicle Type</label>
            <div className="filter-options">
              {['SUV','Sedan','Sports','Hatchback','Van'].map(type => (
                <button key={type} className={`filter-option ${filters.types.includes(type) ? 'active' : ''}`} onClick={() => handleFilterToggle('types', type)}>{type}</button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <label className="filter-label">Transmission</label>
            <div className="filter-options">
              {['Automatic','Manual','CVT'].map(t => (
                <button key={t} className={`filter-option ${filters.transmissions.includes(t) ? 'active' : ''}`} onClick={() => handleFilterToggle('transmissions', t)}>{t}</button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <label className="filter-label">Fuel Type</label>
            <div className="filter-options">
              {['Gasoline','Diesel','Hybrid','Electric'].map(f => (
                <button key={f} className={`filter-option ${filters.fuels.includes(f) ? 'active' : ''}`} onClick={() => handleFilterToggle('fuels', f)}>{f}</button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <label className="filter-label">Price Range (&#8369;/day)</label>
            <div className="price-inputs">
              <input type="number" className="price-input" placeholder="Min" value={filters.minPrice} onChange={e => setFilters(p => ({ ...p, minPrice: e.target.value }))} />
              <span className="price-separator">to</span>
              <input type="number" className="price-input" placeholder="Max" value={filters.maxPrice} onChange={e => setFilters(p => ({ ...p, maxPrice: e.target.value }))} />
            </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isDetailOpen} onClose={() => { setIsDetailOpen(false); setSelectedVehicle(null); }}
        title={selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.name}` : 'Vehicle Details'} size="large">
        {selectedVehicle && (
          <div className="vehicle-detail">
            <div className="detail-image">
              {selectedVehicle.image
                ? <img src={selectedVehicle.image} alt={selectedVehicle.name} />
                : <div className="image-placeholder"><CarIcon /></div>}
            </div>
            <div className="detail-info">
              <div className="detail-price"><span className="price-amount">&#8369;{selectedVehicle.pricePerDay?.toLocaleString()}</span><span className="price-period">/day</span></div>
              <div className="detail-specs">
                {selectedVehicle.type         && <div className="spec-item"><span>{selectedVehicle.type}</span></div>}
                {selectedVehicle.transmission && <div className="spec-item"><span>{selectedVehicle.transmission}</span></div>}
                {selectedVehicle.seats        && <div className="spec-item"><span>{selectedVehicle.seats} seats</span></div>}
                {selectedVehicle.fuel         && <div className="spec-item"><span>{selectedVehicle.fuel}</span></div>}
                {selectedVehicle.year         && <div className="spec-item"><span>{selectedVehicle.year}</span></div>}
              </div>
              {selectedVehicle.location    && <div className="detail-location"><span>{selectedVehicle.location}</span></div>}
              {selectedVehicle.owner       && <div className="detail-owner"><span>Owner: {selectedVehicle.owner}</span></div>}
              {selectedVehicle.description && <div className="detail-description"><p>{selectedVehicle.description}</p></div>}
              {selectedVehicle.features?.length > 0 && (
                <div className="detail-features">
                  <h4>Features</h4>
                  <div className="features-list">{selectedVehicle.features.map((f, i) => <span key={i} className="feature-tag">{f}</span>)}</div>
                </div>
              )}
              {selectedVehicle.available && (
                <button className="btn btn-primary btn-full" onClick={() => handleRentVehicle(selectedVehicle)}>Request to Rent</button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} title="My Rentals" size="large">
        {userRentals.length === 0
          ? <div className="empty-state"><p>You have no rentals yet.</p></div>
          : (
            <div className="rental-history-list">
              {userRentals.slice().reverse().map(rental => (
                <div key={rental.id} className="rental-item">
                  <div className="rental-header">
                    <span className="rental-vehicle">{rental.vehicleName}</span>
                    <span className={`rental-status ${rental.status}`}>{rental.status}</span>
                  </div>
                  <div className="rental-details"><span>Owner: {rental.ownerName}</span><span>&#8369;{rental.amount}/day</span></div>
                  <div className="rental-dates">
                    {new Date(rental.startDate).toLocaleDateString()} &rarr;{' '}
                    {rental.endDate ? new Date(rental.endDate).toLocaleDateString() : 'Ongoing'}
                  </div>
                  {rental.status === 'active' && (
                    <div className="rental-actions">
                      <button className="btn btn-outline btn-sm" onClick={() => handleRequestReturn(rental.id)}>Request Return</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        }
      </Modal>

      <RenterLogListModal isOpen={isLogListOpen} onClose={() => setIsLogListOpen(false)} reports={renterLogReports} onView={handleViewLog} />
      <RenterLogViewModal isOpen={isLogViewOpen} onClose={() => { setIsLogViewOpen(false); setIsLogListOpen(true); }} report={viewingReport} onCommentAdded={refreshLogs} user={user} />
    </div>
  );
}

export default RenterDashboard;