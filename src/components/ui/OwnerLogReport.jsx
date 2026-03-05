import React, { useState, useMemo, useRef } from 'react';
import { Modal } from '../../components';
import { useLogReport } from '../../context/LogReportContext';

const DEFAULT_CHECKLIST = [
  { id: 'exterior_scratches', label: 'Exterior scratches / dents'  },
  { id: 'windshield',         label: 'Windshield cracks / chips'   },
  { id: 'tires',              label: 'Tire damage / flat tires'    },
  { id: 'interior',           label: 'Interior damage'             },
  { id: 'missing_parts',      label: 'Missing parts / accessories' },
  { id: 'engine',             label: 'Engine / mechanical issue'   },
  { id: 'lights',             label: 'Lights / signals broken'     },
  { id: 'fuel_low',           label: 'Fuel level low'              },
];

const FUEL_OPTS = ['Full', '3/4', '1/2', '1/4', 'Empty'];

const fmtDate = iso => iso ? new Date(iso).toLocaleString() : '—';
const fmtShortDate = iso => iso ? new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

const ClipboardIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);
const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);
const ChevronRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);
const ImageIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21" />
  </svg>
);
const AlertIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
  </svg>
);
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);
const CommentIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);
const UserIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
  </svg>
);
const CarIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 17H3a2 2 0 01-2-2V9a2 2 0 012-2h3.5l2-3h7l2 3H21a2 2 0 012 2v6a2 2 0 01-2 2h-2M8 17a2 2 0 104 0 2 2 0 00-4 0zm8 0a2 2 0 104 0 2 2 0 00-4 0z" />
  </svg>
);
const CalendarIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2"/><path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

function PhotoUploader({ photos = [], onChange, label = 'Photos' }) {
  const inputRef = useRef();
  const handleFiles = (e) => {
    const files = Array.from(e.target.files);
    const readers = files.map(f => new Promise(res => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.readAsDataURL(f);
    }));
    Promise.all(readers).then(newPhotos => onChange([...photos, ...newPhotos]));
    e.target.value = '';
  };
  const removePhoto = (idx) => onChange(photos.filter((_, i) => i !== idx));
  return (
    <div style={{ marginBottom: 16 }}>
      <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>{label}</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
        {photos.map((src, i) => (
          <div key={i} style={{ position: 'relative', width: 90, height: 90 }}>
            <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }} />
            <button onClick={() => removePhoto(i)}
              style={{ position: 'absolute', top: 2, right: 2, background: '#ef4444', border: 'none', borderRadius: '50%', width: 20, height: 20, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
        <button onClick={() => inputRef.current.click()}
          style={{ width: 90, height: 90, border: '2px dashed #d1d5db', borderRadius: 8, background: '#f9fafb', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: '#9ca3af', fontSize: 11 }}>
          <ImageIcon />
          Add photo
        </button>
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple onChange={handleFiles} style={{ display: 'none' }} />
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

function ChecklistEditor({ issues, customLabels, onChange, onLabelChange }) {
  const [otherText, setOtherText] = useState('');
  const allItems = [
    ...DEFAULT_CHECKLIST,
    ...Object.keys(customLabels || {}).filter(k => !DEFAULT_CHECKLIST.find(d => d.id === k)).map(k => ({ id: k, label: customLabels[k] })),
  ];
  const toggle = (id) => issues.includes(id) ? onChange(issues.filter(i => i !== id)) : onChange([...issues, id]);
  const addOther = () => {
    const trimmed = otherText.trim();
    if (!trimmed) return;
    const id = `custom_${Date.now()}`;
    onLabelChange({ ...(customLabels || {}), [id]: trimmed });
    onChange([...issues, id]);
    setOtherText('');
  };
  const removeCustom = (id) => {
    onChange(issues.filter(i => i !== id));
    const next = { ...(customLabels || {}) };
    delete next[id];
    onLabelChange(next);
  };
  return (
    <div className="lr-view-section">
      <p className="lr-view-section-title">Condition Checklist</p>
      <div className="lr-checklist">
        {allItems.map(item => {
          const isCustom = !DEFAULT_CHECKLIST.find(d => d.id === item.id);
          return (
            <label key={item.id} className="lr-check">
              <input type="checkbox" checked={issues.includes(item.id)} onChange={() => toggle(item.id)} />
              <span className="lr-check-label">{item.label}</span>
              {isCustom && (
                <button type="button" className="lr-check-remove" onClick={e => { e.preventDefault(); removeCustom(item.id); }}>Remove</button>
              )}
            </label>
          );
        })}
        <div className="lr-add-other-row">
          <input className="form-input lr-other-input" placeholder="Add custom issue…" value={otherText}
            onChange={e => setOtherText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addOther())} />
          <button type="button" className="btn btn-outline lr-add-btn" onClick={addOther}><PlusIcon /> Add</button>
        </div>
      </div>
    </div>
  );
}

function RentalInfoBanner({ report }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)',
      border: '1px solid rgba(63,155,132,.3)',
      borderRadius: 12,
      padding: '14px 18px',
      marginBottom: 18,
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#6b7280', margin: '0 0 10px' }}>
        Rental Information
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#1a2c5e' }}>
          <CarIcon /><span><strong>{report.vehicleName}</strong></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#374151' }}>
          <UserIcon /><span>Renter: <strong>{report.renterName || '—'}</strong></span>
        </div>
        {report.startDate && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#374151' }}>
            <CalendarIcon /><span>Start: <strong>{fmtShortDate(report.startDate)}</strong></span>
          </div>
        )}
        {report.endDate && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#374151' }}>
            <CalendarIcon /><span>End: <strong>{fmtShortDate(report.endDate)}</strong></span>
          </div>
        )}
        {report.amount && (
          <div style={{ fontSize: 13, color: '#374151' }}>
            Rate: <strong>&#8369;{report.amount}/day</strong>
          </div>
        )}
      </div>
    </div>
  );
}

function ReportForm({ initial, subtitle, onSave, onCancel }) {
  const [issues,       setIssues]       = useState(initial.issues || []);
  const [customLabels, setCustomLabels] = useState(initial.customLabels || {});
  const [notes,        setNotes]        = useState(initial.notes || '');
  const [odometer,     setOdometer]     = useState(initial.odometer || '');
  const [fuelLevel,    setFuelLevel]    = useState(initial.fuelLevel || '');
  const [photos,       setPhotos]       = useState(initial.photos || []);

  return (
    <div>
      {initial.vehicleName && <RentalInfoBanner report={initial} />}
      {subtitle && <p className="lr-form-subtitle">{subtitle}</p>}
      <div className="lr-form-grid">
        <div className="form-group">
          <label className="form-label">Odometer (km)</label>
          <input className="form-input" type="number" placeholder="e.g. 45230" value={odometer} onChange={e => setOdometer(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Fuel Level</label>
          <select className="form-input" value={fuelLevel} onChange={e => setFuelLevel(e.target.value)}>
            <option value="">Select…</option>
            {FUEL_OPTS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </div>
      <ChecklistEditor issues={issues} customLabels={customLabels} onChange={setIssues} onLabelChange={setCustomLabels} />
      <div className="lr-view-section">
        <p className="lr-view-section-title">Notes</p>
        <textarea className="form-input" rows={4} placeholder="Describe the vehicle condition…" value={notes} onChange={e => setNotes(e.target.value)} style={{ resize: 'vertical' }} />
      </div>
      <PhotoUploader photos={photos} onChange={setPhotos} label="Condition Photos" />
      <div className="lr-form-actions">
        <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" onClick={() => onSave({ issues, customLabels, notes, odometer, fuelLevel, photos })}>Save Report</button>
      </div>
    </div>
  );
}

function IssueBlock({ issues, labelFn, newIssues = [] }) {
  if (!issues.length) return (
    <div className="lr-view-section">
      <p className="lr-view-section-title">Condition</p>
      <p className="lr-ok" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><CheckIcon /> No issues flagged</p>
    </div>
  );
  return (
    <div className="lr-view-section">
      <p className="lr-view-section-title">Condition</p>
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
    </div>
  );
}

function ReportDetailView({ report, onEdit, onAddCheckout, onEditCheckout, onBack }) {
  const hasCheckout = !!report.checkout;
  const ciIssues    = report.issues || [];
  const coIssues    = report.checkout?.issues || [];
  const newIssues   = hasCheckout ? coIssues.filter(i => !ciIssues.includes(i)) : [];
  const allLabels   = id => {
    const d = DEFAULT_CHECKLIST.find(x => x.id === id);
    return (report.customLabels || {})[id] || (report.checkout?.customLabels || {})[id] || d?.label || id;
  };

  return (
    <div>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#3F9B84', fontWeight: 600, fontSize: 13, padding: '0 0 16px 0' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to list
      </button>

      <RentalInfoBanner report={report} />

      {hasCheckout ? (
        <div className="lr-compare-grid">
          <div className="lr-compare-col">
            <div className="lr-compare-header lr-compare-header--ci">
              <span>Before Trip</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <small>{fmtDate(report.createdAt)}</small>
                <button onClick={onEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#059669', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, padding: '2px 6px', borderRadius: 6 }}>
                  <EditIcon /> Edit
                </button>
              </span>
            </div>
            {report.odometer && <div className="lr-view-section" style={{ padding: '8px 14px' }}><span className="lr-view-label">Odometer</span> <span className="lr-view-value">{report.odometer} km</span></div>}
            {report.fuelLevel && <div className="lr-view-section" style={{ padding: '8px 14px' }}><span className="lr-view-label">Fuel</span> <span className="lr-view-value">{report.fuelLevel}</span></div>}
            <IssueBlock issues={ciIssues} labelFn={allLabels} newIssues={[]} />
            <div style={{ padding: '0 14px 12px' }}>
              <p className="lr-view-section-title">Notes</p>
              <pre className="lr-view-notes">{report.notes || 'No notes.'}</pre>
            </div>
            <PhotoGallery photos={report.photos} label="Check-in Photos" />
          </div>
          <div className="lr-compare-col">
            <div className="lr-compare-header lr-compare-header--co">
              <span>After Trip</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <small>{fmtDate(report.checkout.createdAt)}</small>
                <button onClick={onEditCheckout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b45309', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, padding: '2px 6px', borderRadius: 6 }}>
                  <EditIcon /> Edit
                </button>
              </span>
            </div>
            {report.checkout.odometer && <div className="lr-view-section" style={{ padding: '8px 14px' }}><span className="lr-view-label">Odometer</span> <span className="lr-view-value">{report.checkout.odometer} km</span></div>}
            {report.checkout.fuelLevel && <div className="lr-view-section" style={{ padding: '8px 14px' }}><span className="lr-view-label">Fuel</span> <span className="lr-view-value">{report.checkout.fuelLevel}</span></div>}
            <IssueBlock issues={coIssues} labelFn={allLabels} newIssues={newIssues} />
            <div style={{ padding: '0 14px 12px' }}>
              <p className="lr-view-section-title">Notes</p>
              <pre className="lr-view-notes">{report.checkout.notes || 'No notes.'}</pre>
            </div>
            <PhotoGallery photos={report.checkout.photos} label="Check-out Photos" />
          </div>
        </div>
      ) : (
        <>
          <div className="lr-awaiting-co">
            No check-out report yet. Add one when the vehicle is returned.
          </div>
          <div className="lr-view-grid">
            <div className="lr-view-field"><span className="lr-view-label">Logged On</span><span className="lr-view-value">{fmtDate(report.createdAt)}</span></div>
            {report.odometer && <div className="lr-view-field"><span className="lr-view-label">Odometer</span><span className="lr-view-value">{report.odometer} km</span></div>}
            {report.fuelLevel && <div className="lr-view-field"><span className="lr-view-label">Fuel Level</span><span className="lr-view-value">{report.fuelLevel}</span></div>}
          </div>
          <IssueBlock issues={ciIssues} labelFn={allLabels} newIssues={[]} />
          <div className="lr-view-section">
            <p className="lr-view-section-title">Notes</p>
            <pre className="lr-view-notes">{report.notes || 'No notes.'}</pre>
          </div>
          <PhotoGallery photos={report.photos} label="Check-in Photos" />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button className="btn btn-secondary" onClick={onEdit}><EditIcon /> Edit Check-in</button>
            <button className="btn btn-primary" onClick={onAddCheckout}><PlusIcon /> Add Check-out</button>
          </div>
        </>
      )}

      {(report.comments || []).length > 0 && (
        <div className="lr-comments-section">
          <p className="lr-view-section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><CommentIcon /> Comments</p>
          <div className="lr-comments-list">
            {report.comments.map(c => (
              <div key={c.id} className="lr-comment">
                <div className="lr-comment-meta">
                  <span className="lr-comment-author" style={{ display: 'flex', alignItems: 'center', gap: 5 }}><UserIcon />{c.authorName}</span>
                  <span className="lr-comment-date">{fmtDate(c.createdAt)}</span>
                </div>
                <p className="lr-comment-text">{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function OwnerLogReport({ isOpen, onClose, ownerRentals }) {
  const { reports, editCheckin, addCheckoutReport, editCheckout, removeReport } = useLogReport();

  const [search,         setSearch]         = useState('');
  const [view,           setView]           = useState('list');
  const [selectedReport, setSelectedReport] = useState(null);

  const ownerVehicleNames = useMemo(() => new Set(ownerRentals.map(r => r.vehicleName)), [ownerRentals]);

  const ownerReports = useMemo(() => {
    const ownerRentalIds = new Set(ownerRentals.map(r => String(r.id)));
    return reports.filter(r =>
      ownerRentalIds.has(String(r.rentalId)) || ownerVehicleNames.has(r.vehicleName)
    );
  }, [reports, ownerRentals, ownerVehicleNames]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return ownerReports.filter(r => !q ||
      (r.vehicleName || '').toLowerCase().includes(q) ||
      (r.renterName || '').toLowerCase().includes(q)
    );
  }, [ownerReports, search]);

  const getRentalForReport = (report) => ownerRentals.find(r => String(r.id) === String(report.rentalId));

  const openReport = (r) => {
    const rental = getRentalForReport(r);
    setSelectedReport({
      ...r,
      startDate: rental?.startDate || r.startDate,
      endDate:   rental?.endDate   || r.endDate,
      amount:    rental?.amount    || r.amount,
    });
    setView('detail');
  };
  const backToList = () => { setView('list'); setSelectedReport(null); };

  const handleSaveCheckin = (updates) => {
    editCheckin(selectedReport.id, updates);
    setSelectedReport(prev => ({ ...prev, ...updates }));
    setView('detail');
  };
  const handleSaveCheckout = (updates) => {
    editCheckout(selectedReport.id, updates);
    setSelectedReport(prev => ({ ...prev, checkout: { ...prev.checkout, ...updates } }));
    setView('detail');
  };
  const handleAddCheckout = (updates) => {
    addCheckoutReport(selectedReport.id, updates);
    setSelectedReport(prev => ({ ...prev, checkout: { ...updates, createdAt: new Date().toISOString() } }));
    setView('detail');
  };
  const handleDelete = (id) => {
    if (!window.confirm('Delete this log entry? This cannot be undone.')) return;
    removeReport(id);
    if (selectedReport?.id === id) backToList();
  };

  const modalTitle = view === 'list'          ? 'Log Book'
                   : view === 'detail'        ? 'Log Entry Details'
                   : view === 'edit-checkin'  ? 'Edit Check-in Record'
                   : view === 'add-checkout'  ? 'Record Check-out'
                   : view === 'edit-checkout' ? 'Edit Check-out Record'
                   : 'Log Book';

  return (
    <Modal isOpen={isOpen} onClose={() => { onClose(); setView('list'); setSelectedReport(null); }} title={modalTitle} size="xlarge">

      {view === 'list' && (
        <>
          <p className="lr-form-subtitle">
            Vehicle log book — all check-in and check-out records for your rentals. Click an entry to view details, edit, or record a check-out.
          </p>
          <div className="lr-list-controls">
            <input className="form-input" placeholder="Search by vehicle or renter…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {filtered.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 0', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, color: '#9ca3af' }}><ClipboardIcon /></div>
              <h3>No log entries yet</h3>
              <p>Use "Record to Log Book" on an approved rental in Rental History to create a log entry.</p>
            </div>
          ) : (
            <div className="lr-list">
              {filtered.slice().reverse().map(r => (
                <div key={r.id} className="lr-list-row" onClick={() => openReport(r)}>
                  <div className="lr-list-body">
                    <div className="lr-list-tags">
                      <span className="lr-tag lr-tag--ci">Check-in</span>
                      {r.checkout
                        ? <span className="lr-badge lr-badge--linked">Trip Complete</span>
                        : <span className="lr-badge lr-badge--pending">Awaiting Check-out</span>}
                      {(r.comments || []).length > 0 && (
                        <span className="lr-badge lr-badge--comment" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <CommentIcon /> {r.comments.length}
                        </span>
                      )}
                    </div>
                    <p className="lr-list-vehicle">{r.vehicleName}</p>
                    <div className="lr-list-meta">
                      <span>{fmtDate(r.createdAt)}</span>
                      {(r.issues || []).length > 0
                        ? <span className="lr-flag" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><AlertIcon />{r.issues.length} issue{r.issues.length > 1 ? 's' : ''}</span>
                        : <span className="lr-ok" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><CheckIcon />No issues on check-in</span>}
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><UserIcon />{r.renterName}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={e => { e.stopPropagation(); handleDelete(r.id); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px 6px', borderRadius: 6 }}>
                      <TrashIcon />
                    </button>
                    <span className="lr-list-arrow"><ChevronRightIcon /></span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>
        </>
      )}

      {view === 'detail' && selectedReport && (
        <ReportDetailView
          report={selectedReport}
          onEdit={() => setView('edit-checkin')}
          onAddCheckout={() => setView('add-checkout')}
          onEditCheckout={() => setView('edit-checkout')}
          onBack={backToList}
        />
      )}

      {view === 'edit-checkin' && selectedReport && (
        <ReportForm
          initial={selectedReport}
          subtitle="Update the check-in condition record for this rental."
          onSave={handleSaveCheckin}
          onCancel={() => setView('detail')}
        />
      )}

      {view === 'add-checkout' && selectedReport && (
        <ReportForm
          initial={{ ...selectedReport, issues: [], notes: '', odometer: '', fuelLevel: '', photos: [], customLabels: selectedReport.customLabels }}
          subtitle="Record the vehicle condition upon return."
          onSave={handleAddCheckout}
          onCancel={() => setView('detail')}
        />
      )}

      {view === 'edit-checkout' && selectedReport && (
        <ReportForm
          initial={{ ...selectedReport.checkout, vehicleName: selectedReport.vehicleName, renterName: selectedReport.renterName, startDate: selectedReport.startDate, endDate: selectedReport.endDate, amount: selectedReport.amount }}
          subtitle="Update the check-out condition record for this rental."
          onSave={handleSaveCheckout}
          onCancel={() => setView('detail')}
        />
      )}
    </Modal>
  );
}