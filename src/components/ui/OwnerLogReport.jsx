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
const CONDITION_RATINGS = ['Excellent', 'Good', 'Fair', 'Poor'];

const CONDITION_COLORS = {
  Excellent: { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' },
  Good:      { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' },
  Fair:      { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' },
  Poor:      { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
};

const FUEL_BAR_WIDTH = { 'Full': 100, '3/4': 75, '1/2': 50, '1/4': 25, 'Empty': 0 };

const fmtDate      = iso => iso ? new Date(iso).toLocaleString()  : '—';
const fmtShortDate = iso => iso ? new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

const tripDays = (start, end) => {
  if (!start || !end) return null;
  const ms = new Date(end) - new Date(start);
  return Math.max(1, Math.round(ms / 86400000));
};

/* ─── Icons ─── */
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
const PrintIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2m-2-4H8v8h8v-8z" />
  </svg>
);
const PhilippeSignIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 11l-5 5v3h3l5-5m0 0l3.536-3.536M9 11l3.536-3.536" />
  </svg>
);
const DamageIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M5.07 19H19a2 2 0 001.75-2.9L13.75 5a2 2 0 00-3.5 0L3.25 16.1A2 2 0 005.07 19z" />
  </svg>
);

/* ─── Fuel gauge visual ─── */
function FuelGauge({ level }) {
  if (!level) return null;
  const pct = FUEL_BAR_WIDTH[level] ?? 0;
  const color = pct >= 75 ? '#22c55e' : pct >= 50 ? '#84cc16' : pct >= 25 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width .4s' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 32, textAlign: 'right' }}>{level}</span>
    </div>
  );
}

/* ─── Condition badge ─── */
function ConditionBadge({ rating }) {
  if (!rating) return null;
  const c = CONDITION_COLORS[rating] || { bg: '#f3f4f6', color: '#374151', border: '#d1d5db' };
  return (
    <span style={{
      display: 'inline-block', fontSize: 11, fontWeight: 700,
      padding: '3px 10px', borderRadius: 999,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
    }}>{rating}</span>
  );
}

/* ─── Stats bar ─── */
function LogStatsBar({ reports }) {
  const complete  = reports.filter(r => !!r.checkout).length;
  const awaiting  = reports.filter(r => !r.checkout).length;
  const newDamage = reports.filter(r => {
    if (!r.checkout) return false;
    const ci = r.issues || [];
    const co = r.checkout.issues || [];
    return co.some(i => !ci.includes(i));
  }).length;
  const pills = [
    { label: 'Total Entries', value: reports.length, color: '#3F9B84' },
    { label: 'Trips Complete', value: complete,       color: '#3b82f6' },
    { label: 'Awaiting Check-out', value: awaiting,   color: '#f59e0b' },
    { label: 'New Damage Reports', value: newDamage,  color: '#ef4444' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 18 }}>
      {pills.map(p => (
        <div key={p.label} style={{
          background: '#fff', border: `1.5px solid ${p.color}22`,
          borderLeft: `4px solid ${p.color}`,
          borderRadius: 10, padding: '10px 14px',
          display: 'flex', flexDirection: 'column', gap: 2,
        }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: p.color, lineHeight: 1 }}>{p.value}</span>
          <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>{p.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Trip summary card (shown when both check-in and check-out exist) ─── */
function TripSummaryCard({ report }) {
  if (!report.checkout) return null;

  const days    = tripDays(report.startDate, report.endDate);
  const revenue = days && report.amount ? days * Number(report.amount) : null;
  const ciOdo   = parseFloat(report.odometer);
  const coOdo   = parseFloat(report.checkout?.odometer);
  const kmDriven = (!isNaN(ciOdo) && !isNaN(coOdo) && coOdo > ciOdo) ? (coOdo - ciOdo) : null;
  const ciIssues = report.issues || [];
  const coIssues = report.checkout?.issues || [];
  const newDamage = coIssues.filter(i => !ciIssues.includes(i));
  const overallStatus = newDamage.length > 0 ? 'Damage Reported'
    : coIssues.length > ciIssues.length ? 'Minor Issues'
    : 'Clean Return';
  const statusColor = overallStatus === 'Damage Reported' ? '#ef4444'
    : overallStatus === 'Minor Issues' ? '#f59e0b'
    : '#22c55e';

  return (
    <div style={{
      background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)',
      border: '1px solid rgba(63,155,132,.25)',
      borderRadius: 12, padding: '14px 18px', marginBottom: 18,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#6b7280' }}>
          Trip Summary
        </span>
        <span style={{
          fontSize: 11, fontWeight: 800, padding: '3px 12px', borderRadius: 999,
          background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}44`,
        }}>
          {overallStatus === 'Damage Reported' && '⚠ '}{overallStatus}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10 }}>
        {days !== null && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#1a2c5e' }}>{days}</span>
            <span style={{ fontSize: 11, color: '#6b7280' }}>Days Rented</span>
          </div>
        )}
        {revenue !== null && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#3F9B84' }}>₱{revenue.toLocaleString()}</span>
            <span style={{ fontSize: 11, color: '#6b7280' }}>Total Revenue</span>
          </div>
        )}
        {kmDriven !== null && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#1a2c5e' }}>{kmDriven.toLocaleString()}</span>
            <span style={{ fontSize: 11, color: '#6b7280' }}>km Driven</span>
          </div>
        )}
        {newDamage.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#ef4444' }}>{newDamage.length}</span>
            <span style={{ fontSize: 11, color: '#6b7280' }}>New Issues</span>
          </div>
        )}
        {report.checkout?.damageCost && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#ef4444' }}>₱{parseFloat(report.checkout.damageCost).toLocaleString()}</span>
            <span style={{ fontSize: 11, color: '#6b7280' }}>Damage Est.</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Photo uploader ─── */
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

/* ─── Photo gallery ─── */
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

/* ─── Checklist editor ─── */
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

/* ─── Rental info banner ─── */
function RentalInfoBanner({ report }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)',
      border: '1px solid rgba(63,155,132,.3)',
      borderRadius: 12, padding: '14px 18px', marginBottom: 18,
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

/* ─── Report form (check-in or check-out) ─── */
function ReportForm({ initial, subtitle, onSave, onCancel, isCheckout = false, checkinIssues = [] }) {
  const [issues,        setIssues]        = useState(initial.issues || []);
  const [customLabels,  setCustomLabels]  = useState(initial.customLabels || {});
  const [notes,         setNotes]         = useState(initial.notes || '');
  const [odometer,      setOdometer]      = useState(initial.odometer || '');
  const [fuelLevel,     setFuelLevel]     = useState(initial.fuelLevel || '');
  const [conditionRating, setConditionRating] = useState(initial.conditionRating || '');
  const [photos,        setPhotos]        = useState(initial.photos || []);
  const [damageCost,    setDamageCost]    = useState(initial.damageCost || '');

  const newIssues = isCheckout ? issues.filter(i => !checkinIssues.includes(i)) : [];
  const showDamageCostField = isCheckout && newIssues.length > 0;

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
          {fuelLevel && <div style={{ marginTop: 6 }}><FuelGauge level={fuelLevel} /></div>}
        </div>
        <div className="form-group">
          <label className="form-label">Overall Condition Rating</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
            {CONDITION_RATINGS.map(r => {
              const c = CONDITION_COLORS[r];
              const active = conditionRating === r;
              return (
                <button key={r} type="button"
                  onClick={() => setConditionRating(active ? '' : r)}
                  style={{
                    padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    background: active ? c.bg : '#f9fafb',
                    color:      active ? c.color : '#6b7280',
                    border:     active ? `1.5px solid ${c.border}` : '1.5px solid #e5e7eb',
                  }}>{r}</button>
              );
            })}
          </div>
        </div>
      </div>

      <ChecklistEditor issues={issues} customLabels={customLabels} onChange={setIssues} onLabelChange={setCustomLabels} />

      {showDamageCostField && (
        <div className="lr-view-section" style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px' }}>
          <p className="lr-view-section-title" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#991b1b' }}>
            <DamageIcon /> {newIssues.length} new issue{newIssues.length > 1 ? 's' : ''} found at check-out
          </p>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Estimated Damage Cost (₱) <span style={{ color: '#9ca3af', fontWeight: 400 }}>— optional</span></label>
            <input className="form-input" type="number" placeholder="e.g. 5000" value={damageCost} onChange={e => setDamageCost(e.target.value)} />
          </div>
        </div>
      )}

      <div className="lr-view-section">
        <p className="lr-view-section-title">Notes</p>
        <textarea className="form-input" rows={4} placeholder="Describe the vehicle condition…" value={notes} onChange={e => setNotes(e.target.value)} style={{ resize: 'vertical' }} />
      </div>

      <PhotoUploader photos={photos} onChange={setPhotos} label="Condition Photos" />

      <div className="lr-form-actions">
        <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" onClick={() => onSave({ issues, customLabels, notes, odometer, fuelLevel, conditionRating, photos, damageCost: damageCost || undefined })}>
          Save Report
        </button>
      </div>
    </div>
  );
}

/* ─── Issue block ─── */
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

/* ─── Signature block ─── */
function SignatureDisplay({ label, name, date }) {
  return (
    <div style={{
      border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 16px',
      background: '#fafafa', display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#9ca3af' }}>{label}</span>
      {name
        ? <span style={{ fontSize: 14, fontWeight: 700, color: '#1a2c5e', fontStyle: 'italic' }}>{name}</span>
        : <span style={{ fontSize: 13, color: '#d1d5db' }}>Not signed</span>}
      {date && <span style={{ fontSize: 11, color: '#9ca3af' }}>{fmtDate(date)}</span>}
    </div>
  );
}

/* ─── Print helper ─── */
function printReport(report) {
  const allLabels = id => {
    const d = DEFAULT_CHECKLIST.find(x => x.id === id);
    return (report.customLabels || {})[id] || (report.checkout?.customLabels || {})[id] || d?.label || id;
  };
  const ciIssues = report.issues || [];
  const coIssues = report.checkout?.issues || [];
  const newIssues = coIssues.filter(i => !ciIssues.includes(i));
  const days = tripDays(report.startDate, report.endDate);
  const revenue = days && report.amount ? days * Number(report.amount) : null;
  const ciOdo = parseFloat(report.odometer);
  const coOdo = parseFloat(report.checkout?.odometer);
  const kmDriven = !isNaN(ciOdo) && !isNaN(coOdo) && coOdo > ciOdo ? coOdo - ciOdo : null;

  const win = window.open('', '_blank');
  win.document.write(`
    <html><head><title>Log Report – ${report.vehicleName}</title>
    <style>
      body { font-family: Georgia, serif; max-width: 760px; margin: 0 auto; padding: 32px; color: #111; }
      h1 { font-size: 22px; margin-bottom: 4px; }
      .subtitle { color: #6b7280; font-size: 13px; margin-bottom: 24px; }
      .section { margin-bottom: 20px; }
      .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: .1em; color: #9ca3af; font-weight: 700; margin-bottom: 8px; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      .field { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 14px; }
      .field-label { font-size: 10px; text-transform: uppercase; letter-spacing: .08em; color: #9ca3af; }
      .field-value { font-size: 14px; font-weight: 700; color: #111; margin-top: 2px; }
      .issue { padding: 6px 10px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 13px; margin-bottom: 4px; }
      .issue.new { background: #fef2f2; border-color: #fca5a5; color: #991b1b; }
      .col-header { font-size: 12px; font-weight: 700; padding: 8px 12px; border-radius: 8px; margin-bottom: 8px; }
      .ci { background: #d1fae5; color: #065f46; } .co { background: #fef3c7; color: #92400e; }
      .summary { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 16px; margin-bottom: 20px; }
      .sig-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 32px; }
      .sig-box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 16px; }
      .sig-label { font-size: 10px; text-transform: uppercase; letter-spacing: .08em; color: #9ca3af; }
      .sig-name { font-size: 15px; font-style: italic; font-weight: 700; margin-top: 4px; }
      @media print { body { padding: 0; } }
    </style></head><body>
    <h1>Vehicle Log Report — ${report.vehicleName}</h1>
    <p class="subtitle">Renter: ${report.renterName || '—'} &nbsp;|&nbsp; Period: ${fmtShortDate(report.startDate)} – ${fmtShortDate(report.endDate)} &nbsp;|&nbsp; Rate: ₱${report.amount || '—'}/day</p>
    ${report.checkout ? `
    <div class="summary">
      <div class="section-title">Trip Summary</div>
      <div class="grid">
        ${days ? `<div class="field"><div class="field-label">Days Rented</div><div class="field-value">${days}</div></div>` : ''}
        ${revenue ? `<div class="field"><div class="field-label">Total Revenue</div><div class="field-value">₱${revenue.toLocaleString()}</div></div>` : ''}
        ${kmDriven ? `<div class="field"><div class="field-label">km Driven</div><div class="field-value">${kmDriven.toLocaleString()} km</div></div>` : ''}
        ${newIssues.length ? `<div class="field"><div class="field-label">New Damage</div><div class="field-value" style="color:#ef4444">${newIssues.length} issue(s)</div></div>` : ''}
        ${report.checkout.damageCost ? `<div class="field"><div class="field-label">Damage Est.</div><div class="field-value" style="color:#ef4444">₱${parseFloat(report.checkout.damageCost).toLocaleString()}</div></div>` : ''}
      </div>
    </div>
    <div class="grid">
      <div>
        <div class="col-header ci">Before Trip — ${fmtShortDate(report.createdAt)}</div>
        <div class="field" style="margin-bottom:8px"><div class="field-label">Odometer</div><div class="field-value">${report.odometer ? report.odometer + ' km' : '—'}</div></div>
        <div class="field" style="margin-bottom:8px"><div class="field-label">Fuel</div><div class="field-value">${report.fuelLevel || '—'}</div></div>
        ${report.conditionRating ? `<div class="field" style="margin-bottom:8px"><div class="field-label">Condition</div><div class="field-value">${report.conditionRating}</div></div>` : ''}
        <div class="section-title" style="margin-top:12px">Issues</div>
        ${ciIssues.length ? ciIssues.map(k => `<div class="issue">${allLabels(k)}</div>`).join('') : '<p style="color:#6b7280;font-size:13px">None</p>'}
        <div class="section-title" style="margin-top:12px">Notes</div>
        <p style="font-size:13px">${report.notes || 'No notes.'}</p>
      </div>
      <div>
        <div class="col-header co">After Trip — ${fmtShortDate(report.checkout.createdAt)}</div>
        <div class="field" style="margin-bottom:8px"><div class="field-label">Odometer</div><div class="field-value">${report.checkout.odometer ? report.checkout.odometer + ' km' : '—'}</div></div>
        <div class="field" style="margin-bottom:8px"><div class="field-label">Fuel</div><div class="field-value">${report.checkout.fuelLevel || '—'}</div></div>
        ${report.checkout.conditionRating ? `<div class="field" style="margin-bottom:8px"><div class="field-label">Condition</div><div class="field-value">${report.checkout.conditionRating}</div></div>` : ''}
        <div class="section-title" style="margin-top:12px">Issues</div>
        ${coIssues.length ? coIssues.map(k => `<div class="issue ${newIssues.includes(k) ? 'new' : ''}">${allLabels(k)}${newIssues.includes(k) ? ' [NEW]' : ''}</div>`).join('') : '<p style="color:#6b7280;font-size:13px">None</p>'}
        <div class="section-title" style="margin-top:12px">Notes</div>
        <p style="font-size:13px">${report.checkout.notes || 'No notes.'}</p>
      </div>
    </div>` : `
    <div class="section">
      <div class="section-title">Check-in Record — ${fmtDate(report.createdAt)}</div>
      <div class="grid">
        <div class="field"><div class="field-label">Odometer</div><div class="field-value">${report.odometer ? report.odometer + ' km' : '—'}</div></div>
        <div class="field"><div class="field-label">Fuel</div><div class="field-value">${report.fuelLevel || '—'}</div></div>
        ${report.conditionRating ? `<div class="field"><div class="field-label">Condition Rating</div><div class="field-value">${report.conditionRating}</div></div>` : ''}
      </div>
      <div class="section-title" style="margin-top:12px">Issues</div>
      ${ciIssues.length ? ciIssues.map(k => `<div class="issue">${allLabels(k)}</div>`).join('') : '<p style="color:#6b7280;font-size:13px">None</p>'}
      <div class="section-title" style="margin-top:12px">Notes</div>
      <p style="font-size:13px">${report.notes || 'No notes.'}</p>
    </div>`}
    <div class="sig-row">
      <div class="sig-box"><div class="sig-label">Owner Signature</div><div class="sig-name">${report.ownerSignature || '(not provided)'}</div></div>
      <div class="sig-box"><div class="sig-label">Renter Acknowledgement</div><div class="sig-name">${report.renterSignature || '(not provided)'}</div></div>
    </div>
    <p style="font-size:11px;color:#9ca3af;margin-top:32px;text-align:center">Generated ${new Date().toLocaleString()}</p>
    </body></html>
  `);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 500);
}

/* ─── Signatures section — owner edits only their own name ─── */
function SignaturesSection({ report, onUpdate }) {
  const [ownerSig, setOwnerSig] = useState(report.ownerSignature || '');
  const [editing, setEditing]   = useState(false);

  const save = () => {
    onUpdate({ ownerSignature: ownerSig, ownerSignatureAt: new Date().toISOString() });
    setEditing(false);
  };

  const renterSigned = !!report.renterSignature;

  return (
    <div className="lr-view-section">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <p className="lr-view-section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          <PhilippeSignIcon /> Signatures
        </p>
        {!editing && (
          <button onClick={() => setEditing(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3F9B84', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            <EditIcon /> {report.ownerSignature ? 'Edit My Signature' : 'Sign'}
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: editing ? 14 : 0 }}>
        {/* Owner signature — editable */}
        {editing ? (
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Your Signature (Owner)</label>
            <input
              className="form-input"
              value={ownerSig}
              onChange={e => setOwnerSig(e.target.value)}
              placeholder="Type your full name"
              autoFocus
            />
          </div>
        ) : (
          <SignatureDisplay label="Owner Signature" name={report.ownerSignature} date={report.ownerSignatureAt} />
        )}

        {/* Renter acknowledgement — read-only for owner */}
        <div style={{
          border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 16px',
          background: renterSigned ? '#f0fdf4' : '#fffbeb',
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#9ca3af' }}>
            Renter Acknowledgement
          </span>
          {renterSigned ? (
            <>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1a2c5e', fontStyle: 'italic' }}>{report.renterSignature}</span>
              {report.renterSignatureAt && <span style={{ fontSize: 11, color: '#9ca3af' }}>{fmtDate(report.renterSignatureAt)}</span>}
            </>
          ) : (
            <span style={{ fontSize: 12, color: '#d97706', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5 }}>
              ⏳ Awaiting renter signature
            </span>
          )}
        </div>
      </div>

      {editing && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => { setOwnerSig(report.ownerSignature || ''); setEditing(false); }}>Cancel</button>
          <button className="btn btn-primary" onClick={save}>Save My Signature</button>
        </div>
      )}
    </div>
  );
}

/* ─── Comments section with owner reply ─── */
function CommentsSection({ report, ownerName, onReply }) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!text.trim()) return;
    setSubmitting(true);
    onReply({ authorName: ownerName || 'Owner', authorRole: 'owner', text: text.trim() });
    setText('');
    setSubmitting(false);
  };

  const comments = report.comments || [];

  return (
    <div className="lr-comments-section">
      <p className="lr-view-section-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <CommentIcon /> Comments {comments.length > 0 && `(${comments.length})`}
      </p>
      {comments.length === 0
        ? <p className="lr-muted">No comments yet.</p>
        : (
          <div className="lr-comments-list">
            {comments.map(c => {
              const isOwner = c.authorRole === 'owner' || c.authorName?.toLowerCase().includes('owner');
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
          placeholder="Reply as owner…"
          value={text}
          onChange={e => setText(e.target.value)}
          style={{ resize: 'vertical' }}
        />
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={submitting || !text.trim()}
          style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <CommentIcon /> {submitting ? 'Sending…' : 'Send Reply'}
        </button>
      </div>
    </div>
  );
}

/* ─── Detail view ─── */
function ReportDetailView({ report, ownerName, onEdit, onAddCheckout, onEditCheckout, onBack, onUpdateSignatures, onReply }) {
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
      {/* Back + Print row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#3F9B84', fontWeight: 600, fontSize: 13, padding: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to list
        </button>
        <button onClick={() => printReport(report)}
          style={{ background: 'none', border: '1px solid #e5e7eb', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#374151', fontWeight: 600, fontSize: 12, padding: '6px 14px', borderRadius: 8 }}>
          <PrintIcon /> Print / Export
        </button>
      </div>

      <RentalInfoBanner report={report} />

      {/* Trip summary (only when complete) */}
      {hasCheckout && <TripSummaryCard report={report} />}

      {/* Damage cost banner if present */}
      {hasCheckout && report.checkout?.damageCost && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '12px 16px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
          <DamageIcon />
          <span style={{ fontSize: 13, color: '#991b1b', fontWeight: 600 }}>
            Damage estimated at ₱{parseFloat(report.checkout.damageCost).toLocaleString()}
          </span>
        </div>
      )}

      {hasCheckout ? (
        <div className="lr-compare-grid">
          {/* Check-in column */}
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
            {(report.odometer || report.fuelLevel || report.conditionRating) && (
              <div className="lr-view-section" style={{ padding: '10px 14px' }}>
                {report.odometer && <div style={{ marginBottom: 6 }}><span className="lr-view-label">Odometer </span><span className="lr-view-value">{report.odometer} km</span></div>}
                {report.fuelLevel && <div style={{ marginBottom: 6 }}><span className="lr-view-label">Fuel </span><FuelGauge level={report.fuelLevel} /></div>}
                {report.conditionRating && <div><span className="lr-view-label">Condition </span><ConditionBadge rating={report.conditionRating} /></div>}
              </div>
            )}
            <IssueBlock issues={ciIssues} labelFn={allLabels} newIssues={[]} />
            <div style={{ padding: '0 14px 12px' }}>
              <p className="lr-view-section-title">Notes</p>
              <pre className="lr-view-notes">{report.notes || 'No notes.'}</pre>
            </div>
            <PhotoGallery photos={report.photos} label="Check-in Photos" />
          </div>
          {/* Check-out column */}
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
            {(report.checkout.odometer || report.checkout.fuelLevel || report.checkout.conditionRating) && (
              <div className="lr-view-section" style={{ padding: '10px 14px' }}>
                {report.checkout.odometer && <div style={{ marginBottom: 6 }}><span className="lr-view-label">Odometer </span><span className="lr-view-value">{report.checkout.odometer} km</span></div>}
                {report.checkout.fuelLevel && <div style={{ marginBottom: 6 }}><span className="lr-view-label">Fuel </span><FuelGauge level={report.checkout.fuelLevel} /></div>}
                {report.checkout.conditionRating && <div><span className="lr-view-label">Condition </span><ConditionBadge rating={report.checkout.conditionRating} /></div>}
              </div>
            )}
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
            {report.fuelLevel && (
              <div className="lr-view-field">
                <span className="lr-view-label">Fuel Level</span>
                <FuelGauge level={report.fuelLevel} />
              </div>
            )}
            {report.conditionRating && (
              <div className="lr-view-field">
                <span className="lr-view-label">Condition Rating</span>
                <ConditionBadge rating={report.conditionRating} />
              </div>
            )}
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

      {/* Signatures */}
      <SignaturesSection report={report} onUpdate={onUpdateSignatures} />

      {/* Comments */}
      <CommentsSection report={report} ownerName={ownerName} onReply={onReply} />
    </div>
  );
}

/* ─── Main component ─── */
export default function OwnerLogReport({ isOpen, onClose, ownerRentals, ownerName }) {
  const { reports, editCheckin, addCheckoutReport, editCheckout, removeReport, postComment } = useLogReport();
  const { loadLogReports: _unused, saveLogReports: _unused2, ...rest } = {};

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
  const handleUpdateSignatures = (sigs) => {
    editCheckin(selectedReport.id, sigs);
    setSelectedReport(prev => ({ ...prev, ...sigs }));
  };
  const handleReply = (comment) => {
    postComment(selectedReport.id, comment);
    const updated = { ...selectedReport, comments: [...(selectedReport.comments || []), { id: `cmt-${Date.now()}`, ...comment, createdAt: new Date().toISOString() }] };
    setSelectedReport(updated);
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

          {/* Stats bar */}
          <LogStatsBar reports={ownerReports} />

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
              {filtered.slice().reverse().map(r => {
                const ciIssues = r.issues || [];
                const coIssues = r.checkout?.issues || [];
                const newDamage = r.checkout ? coIssues.filter(i => !ciIssues.includes(i)) : [];
                return (
                  <div key={r.id} className="lr-list-row" onClick={() => openReport(r)}>
                    <div className="lr-list-body">
                      <div className="lr-list-tags">
                        <span className="lr-tag lr-tag--ci">Check-in</span>
                        {r.checkout
                          ? <span className="lr-badge lr-badge--linked">Trip Complete</span>
                          : <span className="lr-badge lr-badge--pending">Awaiting Check-out</span>}
                        {r.conditionRating && <ConditionBadge rating={r.conditionRating} />}
                        {newDamage.length > 0 && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 999, background: '#fef2f2', color: '#991b1b', border: '1px solid #fca5a5' }}>
                            <DamageIcon /> {newDamage.length} new damage
                          </span>
                        )}
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
                        {r.checkout?.damageCost && (
                          <span style={{ color: '#ef4444', fontWeight: 600 }}>₱{parseFloat(r.checkout.damageCost).toLocaleString()} damage</span>
                        )}
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
                );
              })}
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
          ownerName={ownerName}
          onEdit={() => setView('edit-checkin')}
          onAddCheckout={() => setView('add-checkout')}
          onEditCheckout={() => setView('edit-checkout')}
          onBack={backToList}
          onUpdateSignatures={handleUpdateSignatures}
          onReply={handleReply}
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
          initial={{ ...selectedReport, issues: [], notes: '', odometer: '', fuelLevel: '', conditionRating: '', photos: [], customLabels: selectedReport.customLabels }}
          subtitle="Record the vehicle condition upon return."
          isCheckout={true}
          checkinIssues={selectedReport.issues || []}
          onSave={handleAddCheckout}
          onCancel={() => setView('detail')}
        />
      )}

      {view === 'edit-checkout' && selectedReport && (
        <ReportForm
          initial={{ ...selectedReport.checkout, vehicleName: selectedReport.vehicleName, renterName: selectedReport.renterName, startDate: selectedReport.startDate, endDate: selectedReport.endDate, amount: selectedReport.amount }}
          subtitle="Update the check-out condition record for this rental."
          isCheckout={true}
          checkinIssues={selectedReport.issues || []}
          onSave={handleSaveCheckout}
          onCancel={() => setView('detail')}
        />
      )}
    </Modal>
  );
}