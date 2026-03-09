/**
 * RENTER DASHBOARD - Updated to display log reports in panel
 * The RenterLogViewModal has been replaced with inline log viewing
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useVehicles } from '../hooks';
import { useAuth } from '../context/AuthContext';
import { ProfileMenu, VehicleCard, Modal, ConfirmModal } from '../components';
import { loadLogReports, addComment, saveLogReports } from '../hooks/useLogReport';
import '../styles/pages/RenterDashboard.css';

const C = {
  primary:   '#3F9B84',
  primaryDk: '#2e7d67',
  primaryLt: '#ecfdf5',
  navy:      '#1a2c5e',
  danger:    '#ef4444',
  warning:   '#f59e0b',
  success:   '#22c55e',
  indigo:    '#6366f1',
  indigoDk:  '#4338ca',
  g50:  '#f9fafb',
  g100: '#f3f4f6',
  g200: '#e5e7eb',
  g300: '#d1d5db',
  g400: '#9ca3af',
  g500: '#6b7280',
  g700: '#374151',
  g900: '#111827',
  shadow:      '0 1px 3px rgba(0,0,0,.07), 0 4px 12px rgba(0,0,0,.05)',
  shadowHover: '0 4px 16px rgba(63,155,132,.15)',
  r: 12, r2: 8,
};

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

const CONDITION_COLORS = {
  Excellent: { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' },
  Good:      { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' },
  Fair:      { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' },
  Poor:      { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
};

const FUEL_PCT = { 'Full': 100, '3/4': 75, '1/2': 50, '1/4': 25, 'Empty': 0 };

const fmtDate      = iso => iso ? new Date(iso).toLocaleString() : '—';
const fmtShortDate = iso => iso ? new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
const tripDays     = (s, e) => { if (!s || !e) return null; return Math.max(1, Math.round((new Date(e) - new Date(s)) / 86400000)); };

const Ico = ({ d, w = 14 }) => (
  <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {typeof d === 'string' ? <path d={d} /> : d}
  </svg>
);

const SearchIcon    = () => <Ico w={15} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />;
const FilterIcon    = () => <Ico w={16} d="M3 4h18M7 10h10M11 16h2" />;

const CarIcon       = () => <Ico w={14} d="M5 17H3a2 2 0 01-2-2V9a2 2 0 012-2h3.5l2-3h7l2 3H21a2 2 0 012 2v6a2 2 0 01-2 2h-2M8 17a2 2 0 104 0 2 2 0 00-4 0zm8 0a2 2 0 104 0 2 2 0 00-4 0z" />;
const UserIcon      = () => <Ico w={13} d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />;
const AlertIcon     = () => <Ico w={13} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />;
const CheckIcon     = () => <Ico w={13} d="M5 13l4 4L19 7" />;
const CommentIcon   = () => <Ico w={13} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />;
const CalIcon       = () => <Ico w={13} d={<><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18" /></>} />;
const ChevronLIcon  = () => <Ico w={14} d="M15 19l-7-7 7-7" />;
const ChevronRIcon  = () => <Ico w={16} d="M9 5l7 7-7 7" />;
const DamageIcon    = () => <Ico w={13} d="M12 9v2m0 4h.01M5.07 19H19a2 2 0 001.75-2.9L13.75 5a2 2 0 00-3.5 0L3.25 16.1A2 2 0 005.07 19z" />;
const SignIcon      = () => <Ico w={14} d="M15.232 5.232l3.536 3.536M9 11l-5 5v3h3l5-5m0 0l3.536-3.536M9 11l3.536-3.536" />;
const EyeIcon       = () => <Ico w={13} d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z" />;
const PrintIcon     = () => <Ico w={13} d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2m-2-4H8v8h8v-8z" />;
const HomeIcon      = () => <Ico w={14} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />;
const HeartIcon     = () => <Ico w={14} d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />;
const HistoryIcon   = () => <Ico w={14} d="M13 2H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V9z" />;
const ClipboardIcon = () => <Ico w={15} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />;

// Helper Components
function Sec({ label, children, style }) {
  return (
    <div style={{ marginBottom: 22, ...style }}>
      {label && (
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: C.g400, margin: '0 0 10px', paddingBottom: 8, borderBottom: `1px solid ${C.g100}` }}>
          {label}
        </p>
      )}
      {children}
    </div>
  );
}

function FuelGauge({ level }) {
  if (!level) return null;
  const pct   = FUEL_PCT[level] ?? 0;
  const color = pct >= 75 ? C.success : pct >= 50 ? '#84cc16' : pct >= 25 ? C.warning : C.danger;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 6, background: C.g200, borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width .4s ease' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 34, textAlign: 'right' }}>{level}</span>
    </div>
  );
}

function ConditionBadge({ rating }) {
  if (!rating) return null;
  const c = CONDITION_COLORS[rating] || { bg: C.g100, color: C.g700, border: C.g200 };
  return (
    <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, padding: '3px 11px', borderRadius: 999, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
      {rating}
    </span>
  );
}

function DataGrid({ odometer, fuelLevel, conditionRating }) {
  if (!odometer && !fuelLevel && !conditionRating) return null;
  const lbl = { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: C.g400, marginBottom: 3 };
  const box = { background: C.g50, border: `1px solid ${C.g200}`, borderRadius: C.r2, padding: '10px 12px' };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
      {odometer       && <div style={box}><div style={lbl}>Odometer</div><div style={{ fontSize: 15, fontWeight: 700, color: C.navy }}>{odometer} km</div></div>}
      {fuelLevel      && <div style={box}><div style={lbl}>Fuel</div><div style={{ marginTop: 6 }}><FuelGauge level={fuelLevel} /></div></div>}
      {conditionRating && <div style={{ ...box, gridColumn: '1 / -1' }}><div style={lbl}>Condition</div><div style={{ marginTop: 5 }}><ConditionBadge rating={conditionRating} /></div></div>}
    </div>
  );
}

function RentalBanner({ report }) {
  const items = [
    { icon: <CarIcon />,  label: 'Vehicle', val: report.vehicleName },
    { icon: <UserIcon />, label: 'Owner',   val: report.ownerName || report.owner || '—' },
    report.startDate && { icon: <CalIcon />, label: 'Start', val: fmtShortDate(report.startDate) },
    report.endDate   && { icon: <CalIcon />, label: 'End',   val: fmtShortDate(report.endDate)   },
    report.amount    && { icon: null,         label: 'Rate',  val: `₱${report.amount}/day`        },
  ].filter(Boolean);
  return (
    <div style={{ background: `linear-gradient(135deg, ${C.primaryLt}, #f0fdfa)`, border: `1px solid ${C.primary}28`, borderRadius: C.r, padding: '14px 18px', marginBottom: 20 }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: C.g400, marginBottom: 10 }}>Rental Information</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {it.icon && <span style={{ color: C.primary, display: 'flex' }}>{it.icon}</span>}
            <span style={{ fontSize: 12, color: C.g500 }}>{it.label}:</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>{it.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TripSummaryCard({ report }) {
  if (!report.checkout) return null;
  const days      = tripDays(report.startDate, report.endDate);
  const ciOdo     = parseFloat(report.odometer);
  const coOdo     = parseFloat(report.checkout?.odometer);
  const kmDriven  = (!isNaN(ciOdo) && !isNaN(coOdo) && coOdo > ciOdo) ? coOdo - ciOdo : null;
  const ciIssues  = report.issues || [];
  const coIssues  = report.checkout?.issues || [];
  const newDmg    = coIssues.filter(i => !ciIssues.includes(i));
  const status    = newDmg.length > 0 ? 'Damage Reported' : 'Clean Return';
  const sColor    = newDmg.length > 0 ? C.danger : C.success;
  const metrics   = [
    days     !== null && { label: 'Days Rented', val: `${days}`,                        color: C.navy   },
    kmDriven !== null && { label: 'km Driven',   val: `${kmDriven.toLocaleString()} km`, color: C.navy  },
    newDmg.length > 0  && { label: 'New Issues', val: `${newDmg.length}`,                color: C.danger },
  ].filter(Boolean);

  return (
    <div style={{ background: `linear-gradient(135deg, ${C.primaryLt}, #f0fdfa)`, border: `1px solid ${C.primary}28`, borderRadius: C.r, padding: '16px 20px', marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: C.g500 }}>Trip Summary</span>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 999, background: `${sColor}14`, color: sColor, border: `1px solid ${sColor}35` }}>
          {status}
        </span>
      </div>
      {metrics.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 14 }}>
          {metrics.map((m, i) => (
            <div key={i}>
              <div style={{ fontSize: 20, fontWeight: 800, color: m.color, lineHeight: 1 }}>{m.val}</div>
              <div style={{ fontSize: 11, color: C.g500, marginTop: 2 }}>{m.label}</div>
            </div>
          ))}
        </div>
      )}
      {newDmg.length > 0 && (
        <div style={{ marginTop: 14, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: C.r2, fontSize: 13, color: '#991b1b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <DamageIcon /> New damage was recorded at check-out. Contact the owner if you have concerns.
        </div>
      )}
    </div>
  );
}



function PhotoGallery({ photos = [], label }) {
  const [lb, setLb] = useState(null);
  if (!photos.length) return null;
  return (
    <Sec label={label}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {photos.map((src, i) => (
          <img key={i} src={src} alt="" onClick={() => setLb(src)} style={{
            width: 74, height: 74, objectFit: 'cover', borderRadius: C.r2,
            border: `1px solid ${C.g200}`, cursor: 'pointer', transition: 'transform .15s',
          }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          />
        ))}
      </div>
      {lb && (
        <div onClick={() => setLb(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.88)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button onClick={() => setLb(null)} style={{ position: 'absolute', top: 18, right: 22, background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.3)', color: '#fff', width: 36, height: 36, borderRadius: '50%', fontSize: 18, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          <img src={lb} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: C.r, boxShadow: '0 24px 60px rgba(0,0,0,.5)' }} onClick={e => e.stopPropagation()} />
        </div>
      )}
    </Sec>
  );
}

function IssueBlock({ issues, labelFn, newIssues = [] }) {
  if (!issues.length) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: C.success, fontSize: 13, fontWeight: 600, padding: '8px 0' }}>
      <CheckIcon /> No issues flagged
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {issues.map(k => {
        const isNew = newIssues.includes(k);
        return (
          <div key={k} style={{
            display: 'flex', alignItems: 'center', gap: 9, padding: '8px 12px', borderRadius: C.r2,
            background: isNew ? '#fef2f2' : C.g50,
            border: `1px solid ${isNew ? '#fca5a5' : C.g200}`,
            fontSize: 13, color: isNew ? '#991b1b' : C.g700,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: isNew ? C.danger : C.g400, flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{labelFn(k)}</span>
            {isNew && <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 7px', background: C.danger, color: '#fff', borderRadius: 999, letterSpacing: '.06em' }}>NEW</span>}
          </div>
        );
      })}
    </div>
  );
}

function ColCard({ title, titleColor, headerBg, headerBorder, date, children }) {
  return (
    <div style={{ border: `1px solid ${C.g200}`, borderRadius: C.r, overflow: 'hidden', background: '#fff', boxShadow: C.shadow }}>
      <div style={{ background: headerBg, borderBottom: `1px solid ${headerBorder}`, padding: '11px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: titleColor }}>{title}</span>
        <span style={{ fontSize: 11, color: C.g400 }}>{fmtDate(date)}</span>
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

function SignatureSection({ localReport, onSigned }) {
  const [sigText,      setSigText]      = useState('');
  const [editing,      setEditing]      = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [confirmEdit,  setConfirmEdit]  = useState(false);
  const [confirmSave,  setConfirmSave]  = useState(false);
  const alreadySigned = !!localReport.renterSignature;

  const inp = { width: '100%', padding: '10px 13px', border: `1.5px solid ${C.g200}`, borderRadius: C.r2, fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color .15s' };

  const doSave = () => {
    if (!sigText.trim()) return;
    setSaving(true);
    const all = loadLogReports();
    const idx = all.findIndex(r => r.id === localReport.id);
    if (idx !== -1) {
      all[idx].renterSignature   = sigText.trim();
      all[idx].renterSignatureAt = new Date().toISOString();
      saveLogReports(all);
    }
    setSaving(false);
    setEditing(false);
    setSigText('');
    onSigned && onSigned();
  };

  const handleEditClick = () => {
    if (alreadySigned) {
      setConfirmEdit(true);
    } else {
      setSigText('');
      setEditing(true);
    }
  };

  const handleConfirmEditOpen = () => {
    setSigText(localReport.renterSignature || '');
    setEditing(true);
  };

  const handleSaveClick = () => {
    if (!sigText.trim()) return;
    if (alreadySigned) {
      setConfirmSave(true);
    } else {
      doSave();
    }
  };

  return (
    <>
      <Sec label="Your Acknowledgement">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: C.g500, display: 'flex', alignItems: 'center', gap: 6 }}>
            <SignIcon /> Acknowledge that you have reviewed this report
          </span>
          {!editing && (
            <button
              onClick={handleEditClick}
              style={{ background: alreadySigned ? 'none' : C.indigoDk, color: alreadySigned ? C.indigoDk : '#fff', border: alreadySigned ? `1px solid #c7d2fe` : 'none', borderRadius: C.r2, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, transition: 'all .14s' }}>
              <SignIcon /> {alreadySigned ? 'Edit Signature' : 'Sign Acknowledgement'}
            </button>
          )}
        </div>

        {alreadySigned && !editing ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: C.r, padding: '14px 18px' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckIcon />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.navy, fontStyle: 'italic' }}>{localReport.renterSignature}</p>
              {localReport.renterSignatureAt && <p style={{ margin: '3px 0 0', fontSize: 11, color: C.g400 }}>Signed {fmtDate(localReport.renterSignatureAt)}</p>}
            </div>
          </div>
        ) : editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: C.r2, padding: '10px 14px', fontSize: 13, color: '#1e40af', lineHeight: 1.6 }}>
              {alreadySigned
                ? 'You are updating your existing signature. Type your full name below to confirm the change.'
                : 'By signing, you confirm you have read this vehicle log report. Type your full name below.'}
            </div>
            <input style={inp} value={sigText} onChange={e => setSigText(e.target.value)}
              placeholder="Type your full name to sign…" autoFocus
              onFocus={e => e.target.style.borderColor = C.indigoDk}
              onBlur={e => e.target.style.borderColor = C.g200}
              onKeyDown={e => { if (e.key === 'Enter') handleSaveClick(); }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { setEditing(false); setSigText(''); }}
                style={{ padding: '8px 18px', border: `1.5px solid ${C.g200}`, borderRadius: C.r2, background: '#fff', color: C.g700, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                onClick={handleSaveClick}
                disabled={saving || !sigText.trim()}
                style={{ padding: '8px 20px', border: 'none', borderRadius: C.r2, background: sigText.trim() ? C.indigoDk : C.g200, color: sigText.trim() ? '#fff' : C.g400, fontSize: 13, fontWeight: 700, cursor: sigText.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: 5, transition: 'all .14s' }}>
                <SignIcon /> {saving ? 'Saving…' : alreadySigned ? 'Update Signature' : 'Confirm Signature'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: C.r, padding: '14px 18px', fontSize: 13, color: '#92400e', lineHeight: 1.6 }}>
            You have not signed this report yet. Click "Sign Acknowledgement" to confirm you've reviewed it.
          </div>
        )}
      </Sec>

      <ConfirmModal
        isOpen={confirmEdit}
        onClose={() => setConfirmEdit(false)}
        onConfirm={handleConfirmEditOpen}
        title="Edit Your Signature?"
        message="You have already signed this report. Are you sure you want to edit your acknowledgement signature?"
        confirmText="Yes, Edit"
        cancelText="Keep Current"
        variant="warning"
      />

      <ConfirmModal
        isOpen={confirmSave}
        onClose={() => setConfirmSave(false)}
        onConfirm={doSave}
        title="Update Signature?"
        message={`You are replacing your existing signature with "${sigText}". This action will update your acknowledgement on this report. Are you sure?`}
        confirmText="Yes, Update"
        cancelText="Go Back"
        variant="warning"
      />
    </>
  );
}

function CommentsSection({ localReport, user, onCommentAdded }) {
  const [text,       setText]       = useState('');
  const [submitting, setSubmitting] = useState(false);
  const comments = localReport.comments || [];

  const submit = () => {
    if (!text.trim()) return;
    setSubmitting(true);
    addComment(localReport.id, {
      authorName: user?.fullName || user?.firstName || 'Renter',
      authorId:   user?.id,
      authorRole: 'renter',
      text: text.trim(),
    });
    setText('');
    setSubmitting(false);
    onCommentAdded && onCommentAdded();
  };

  return (
    <Sec label={`Comments${comments.length ? ` (${comments.length})` : ''}`}>
      {comments.length === 0
        ? <p style={{ color: C.g400, fontSize: 13, margin: '0 0 14px' }}>No comments yet. Be the first to leave one.</p>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {comments.map(c => {
              const isOwner = c.authorRole === 'owner';
              return (
                <div key={c.id} style={{ borderRadius: C.r2, padding: '12px 14px', borderLeft: `3px solid ${isOwner ? C.primary : C.indigo}`, border: `1px solid ${isOwner ? C.primary + '22' : C.indigo + '22'}`, background: isOwner ? `${C.primary}05` : `${C.indigo}05` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: isOwner ? C.primary : C.indigoDk }}>
                      <UserIcon />{c.authorName}
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 999, background: isOwner ? `${C.primary}18` : `${C.indigo}18`, color: isOwner ? '#065f46' : '#3730a3' }}>
                        {isOwner ? 'Owner' : 'Renter'}
                      </span>
                    </span>
                    <span style={{ fontSize: 11, color: C.g400 }}>{fmtDate(c.createdAt)}</span>
                  </div>
                  <p style={{ fontSize: 13, color: C.g700, lineHeight: 1.6, margin: 0 }}>{c.text}</p>
                </div>
              );
            })}
          </div>
        )
      }
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <textarea rows="3" placeholder="Have a concern about this report? Write your comment here…" value={text} onChange={e => setText(e.target.value)}
          style={{ width: '100%', padding: '10px 13px', border: `1.5px solid ${C.g200}`, borderRadius: C.r2, fontSize: 13, resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color .15s' }}
          onFocus={e => e.target.style.borderColor = C.indigo}
          onBlur={e => e.target.style.borderColor = C.g200}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={submit} disabled={submitting || !text.trim()} style={{
            padding: '9px 20px', border: 'none', borderRadius: C.r2, fontSize: 13, fontWeight: 700,
            background: text.trim() ? C.indigoDk : C.g200, color: text.trim() ? '#fff' : C.g400,
            cursor: text.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: 6, transition: 'all .15s',
          }}>
            <CommentIcon /> {submitting ? 'Sending…' : 'Send Comment'}
          </button>
        </div>
      </div>
    </Sec>
  );
}

function printReport(report) {
  const allLabels = id => {
    const d = DEFAULT_CHECKLIST.find(x => x.id === id);
    return (report.customLabels || {})[id] || (report.checkout?.customLabels || {})[id] || d?.label || id;
  };
  const ciIssues  = report.issues || [];
  const coIssues  = report.checkout?.issues || [];
  const newIssues = coIssues.filter(i => !ciIssues.includes(i));
  const days      = tripDays(report.startDate, report.endDate);
  const ciOdo     = parseFloat(report.odometer);
  const coOdo     = parseFloat(report.checkout?.odometer);
  const kmDriven  = !isNaN(ciOdo) && !isNaN(coOdo) && coOdo > ciOdo ? coOdo - ciOdo : null;

  const win = window.open('', '_blank');
  win.document.write(`<html><head><title>Log Report – ${report.vehicleName}</title>
  <style>body{font-family:Georgia,serif;max-width:760px;margin:0 auto;padding:32px;color:#111}h1{font-size:22px;margin-bottom:4px}.sub{color:#6b7280;font-size:13px;margin-bottom:24px}.sec-title{font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:#9ca3af;font-weight:700;margin-bottom:8px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.field{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px 14px}.fl{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af}.fv{font-size:14px;font-weight:700;color:#111;margin-top:2px}.issue{padding:6px 10px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;font-size:13px;margin-bottom:4px}.issue.new{background:#fef2f2;border-color:#fca5a5;color:#991b1b}.ch{font-size:12px;font-weight:700;padding:8px 12px;border-radius:8px;margin-bottom:8px}.ci{background:#d1fae5;color:#065f46}.co{background:#fef3c7;color:#92400e}.sig{border:1px solid #e5e7eb;border-radius:10px;padding:14px;margin-top:28px}.sl{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af}.sn{font-size:15px;font-style:italic;font-weight:700;margin-top:4px}@media print{body{padding:0}}</style>
  </head><body>
  <h1>Vehicle Log Report — ${report.vehicleName}</h1>
  <p class="sub">Owner: ${report.ownerName || '—'} | Period: ${fmtShortDate(report.startDate)} – ${fmtShortDate(report.endDate)} | Rate: ₱${report.amount || '—'}/day</p>
  ${report.checkout ? `<div class="grid">
    <div><div class="ch ci">Before Trip — ${fmtShortDate(report.createdAt)}</div>
      <div class="field" style="margin-bottom:8px"><div class="fl">Odometer</div><div class="fv">${report.odometer ? report.odometer + ' km' : '—'}</div></div>
      <div class="field" style="margin-bottom:8px"><div class="fl">Fuel</div><div class="fv">${report.fuelLevel || '—'}</div></div>
      <div class="sec-title" style="margin-top:12px">Issues</div>
      ${ciIssues.length ? ciIssues.map(k => `<div class="issue">${allLabels(k)}</div>`).join('') : '<p style="color:#6b7280;font-size:13px">None</p>'}
      <div class="sec-title" style="margin-top:12px">Notes</div><p style="font-size:13px">${report.notes || '—'}</p>
    </div>
    <div><div class="ch co">After Trip — ${fmtShortDate(report.checkout.createdAt)}</div>
      <div class="field" style="margin-bottom:8px"><div class="fl">Odometer</div><div class="fv">${report.checkout.odometer ? report.checkout.odometer + ' km' : '—'}</div></div>
      <div class="field" style="margin-bottom:8px"><div class="fl">Fuel</div><div class="fv">${report.checkout.fuelLevel || '—'}</div></div>
      <div class="sec-title" style="margin-top:12px">Issues</div>
      ${coIssues.length ? coIssues.map(k => `<div class="issue ${newIssues.includes(k) ? 'new' : ''}">${allLabels(k)}${newIssues.includes(k) ? ' [NEW]' : ''}</div>`).join('') : '<p style="color:#6b7280;font-size:13px">None</p>'}
      <div class="sec-title" style="margin-top:12px">Notes</div><p style="font-size:13px">${report.checkout.notes || '—'}</p>
    </div>
  </div>` : `
    <div class="field" style="margin-bottom:8px"><div class="fl">Odometer</div><div class="fv">${report.odometer ? report.odometer + ' km' : '—'}</div></div>
    <div class="field" style="margin-bottom:8px"><div class="fl">Fuel</div><div class="fv">${report.fuelLevel || '—'}</div></div>
    <div class="sec-title" style="margin-top:12px">Issues</div>
    ${ciIssues.length ? ciIssues.map(k => `<div class="issue">${allLabels(k)}</div>`).join('') : '<p style="color:#6b7280;font-size:13px">None</p>'}
    <div class="sec-title" style="margin-top:12px">Notes</div><p style="font-size:13px">${report.notes || '—'}</p>
  `}
  ${report.renterSignature ? `<div class="sig"><div class="sl">Renter Acknowledgement</div><div class="sn">${report.renterSignature}</div></div>` : ''}
  <p style="font-size:11px;color:#9ca3af;margin-top:32px;text-align:center">Generated ${new Date().toLocaleString()}</p>
  </body></html>`);
  win.document.close(); win.focus(); setTimeout(() => win.print(), 500);
}



function RenterDashboard() {
  const { user } = useAuth();
  const { vehicles, toggleSavedCar, isCarSaved, savedCars, addRentalRecord, getUserRentals, requestReturn } = useVehicles();

  const [searchQuery,     setSearchQuery]     = useState('');
  const [isFilterOpen,    setIsFilterOpen]    = useState(false);
  const [isDetailOpen,    setIsDetailOpen]    = useState(false);

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [activeNav,       setActiveNav]       = useState('browse');

  const [logReports,      setLogReports]      = useState(() => loadLogReports());
  const [viewingReport,   setViewingReport]   = useState(null);
  const [logSearchQuery,  setLogSearchQuery]  = useState('');

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

  const filteredLogReports = useMemo(() => {
    if (!logSearchQuery.trim()) return renterLogReports;
    const q = logSearchQuery.toLowerCase();
    return renterLogReports.filter(r =>
      (r.vehicleName || '').toLowerCase().includes(q) ||
      (r.ownerName || '').toLowerCase().includes(q)
    );
  }, [renterLogReports, logSearchQuery]);

  const logCount          = renterLogReports.length;
  const availableVehicles = useMemo(() => vehicles.filter(v => v.available), [vehicles]);

  const filteredVehicles = useMemo(() => {
    let result = availableVehicles;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(v =>
        v.name?.toLowerCase().includes(q) || v.brand?.toLowerCase().includes(q) ||
        v.type?.toLowerCase().includes(q)  || v.location?.toLowerCase().includes(q)
      );
    }
    if (filters.types.length)         result = result.filter(v => filters.types.includes(v.type));
    if (filters.transmissions.length) result = result.filter(v => filters.transmissions.includes(v.transmission));
    if (filters.fuels.length)         result = result.filter(v => filters.fuels.includes(v.fuel));
    if (filters.minPrice)             result = result.filter(v => Number(v.pricePerDay || 0) >= Number(filters.minPrice));
    if (filters.maxPrice)             result = result.filter(v => Number(v.pricePerDay || 0) <= Number(filters.maxPrice));
    return result;
  }, [availableVehicles, searchQuery, filters]);

  const favoriteVehicles = useMemo(() => {
    return vehicles.filter(v => savedCars.includes(v.id));
  }, [vehicles, savedCars]);

  const stats = useMemo(() => {
    const avgPrice = availableVehicles.length > 0
      ? Math.round(availableVehicles.reduce((s, v) => s + Number(v.pricePerDay || 0), 0) / availableVehicles.length)
      : 0;
    return { total: vehicles.length, available: availableVehicles.length, avgPrice, saved: savedCars.length };
  }, [vehicles, availableVehicles, savedCars]);

  const activeFiltersCount = filters.types.length + filters.transmissions.length + filters.fuels.length + (filters.minPrice ? 1 : 0) + (filters.maxPrice ? 1 : 0);

  const handleFilterToggle = (cat, val) => setFilters(prev => ({
    ...prev, [cat]: prev[cat].includes(val) ? prev[cat].filter(v => v !== val) : [...prev[cat], val],
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
  const handleViewLog = report => { setViewingReport(report); };

  const currentTitle = {
    browse: 'Browse Vehicles',
    favorites: 'Saved Vehicles',
    rentals: 'My Rentals',
    logs: 'Log Reports',
  }[activeNav];

  const currentSubtitle = {
    browse: `${filteredVehicles.length} available`,
    favorites: `${favoriteVehicles.length} saved`,
    rentals: `${userRentals.length} rental${userRentals.length !== 1 ? 's' : ''}`,
    logs: `${logCount} report${logCount !== 1 ? 's' : ''}`,
  }[activeNav];

  return (
    <div className="renter-dashboard">
      {/* Sidebar - Similar to Admin */}
      <aside className="renter-sidebar">
        <div className="sidebar-brand">
          <svg width="55" height="55" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="auth-logo-svg" aria-hidden="true">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
            <circle cx="7" cy="17" r="2" />
            <path d="M9 17h6" />
            <circle cx="17" cy="17" r="2" />
          </svg> CarRental
        </div>
        <nav className="sidebar-nav">
          <button className={`nav-item ${activeNav === 'browse' ? 'active' : ''}`} onClick={() => setActiveNav('browse')}>
            <HomeIcon /> Browse
          </button>
          <button className={`nav-item ${activeNav === 'favorites' ? 'active' : ''}`} onClick={() => setActiveNav('favorites')}>
            <HeartIcon /> Favorites {savedCars.length > 0 && `(${savedCars.length})`}
          </button>
          <button className={`nav-item ${activeNav === 'rentals' ? 'active' : ''}`} onClick={() => setActiveNav('rentals')}>
            <HistoryIcon /> My Rentals
          </button>
          <button className={`nav-item ${activeNav === 'logs' ? 'active' : ''}`} onClick={() => { setActiveNav('logs'); refreshLogs(); }}>
            <ClipboardIcon /> Log Reports {logCount > 0 && <span className="nav-badge">{logCount}</span>}
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="renter-main">
        {/* Header - Similar to Admin */}
        <div className="renter-header">
          <div className="renter-heading">
            <h1>{currentTitle}</h1>
            <p className="renter-subtitle">{currentSubtitle}</p>
          </div>
          <div className="user-info">
            <span className="welcome-text">Welcome, {userName}</span>
            <ProfileMenu />
          </div>
        </div>

        {/* Content Panel */}
        <div className="renter-content">
          {/* Browse View */}
          {activeNav === 'browse' && (
            <>
              <div className="search-filter-bar">
                <div className="search-container">
                  <span className="search-icon"><SearchIcon /></span>
                  <input type="text" className="search-input" placeholder="Search vehicles…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                <button className="filter-button" onClick={() => setIsFilterOpen(true)}>
                  <span className="filter-icon"><FilterIcon /></span>
                  {activeFiltersCount > 0 && <span className="filter-badge">{activeFiltersCount}</span>}
                </button>
              </div>

              <div className="panel">
                {filteredVehicles.length === 0 ? (
                  <div className="empty-state">
                    <h3>No vehicles found</h3>
                    <p>Try adjusting your search or filters.</p>
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
              </div>
            </>
          )}

          {/* Favorites View */}
          {activeNav === 'favorites' && (
            <div className="panel">
              {favoriteVehicles.length === 0 ? (
                <div className="empty-state">
                  <h3>No saved vehicles</h3>
                  <p>Save vehicles you like by clicking the heart icon.</p>
                </div>
              ) : (
                <div className="vehicles-grid">
                  {favoriteVehicles.map(vehicle => (
                    <VehicleCard key={vehicle.id} vehicle={vehicle} mode="renter"
                      isSaved={isCarSaved(vehicle.id)}
                      onSave={() => toggleSavedCar(vehicle.id)}
                      onRent={() => handleRentVehicle(vehicle)}
                      onView={() => handleViewVehicle(vehicle)} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Rentals View */}
          {activeNav === 'rentals' && (
            <div className="panel">
              {userRentals.length === 0 ? (
                <div className="empty-state">
                  <h3>No active rentals</h3>
                  <p>Browse our vehicles to get started.</p>
                </div>
              ) : (
                <div className="rentals-list">
                  {userRentals.slice().reverse().map(rental => (
                    <div key={rental.id} className="rental-card">
                      <div className="rental-header">
                        <div className="rental-info">
                          <h3 className="rental-vehicle">{rental.vehicleName}</h3>
                          <p className="rental-owner">Owner: {rental.ownerName}</p>
                        </div>
                        <span className={`rental-status ${rental.status}`}>{rental.status}</span>
                      </div>
                      <div className="rental-details">
                        <span className="rental-price">₱{rental.amount}/day</span>
                        <span className="rental-dates">{new Date(rental.startDate).toLocaleDateString()} → {rental.endDate ? new Date(rental.endDate).toLocaleDateString() : 'Ongoing'}</span>
                      </div>
                      {rental.status === 'active' && (
                        <button className="btn btn-outline btn-sm" onClick={() => handleRequestReturn(rental.id)}>Request Return</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Log Reports View - DISPLAYED DIRECTLY IN PANEL */}
          {activeNav === 'logs' && (
            <>
              {renterLogReports.length === 0 ? (
                <div className="panel">
                  <div className="empty-state">
                    <h3>No log reports yet</h3>
                    <p>Reports will appear here after the owner logs your vehicle check-in.</p>
                  </div>
                </div>
              ) : !viewingReport ? (
                <div className="panel">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Search Bar */}
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', background: '#fff', border: '1.5px solid var(--g200)', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow)' }}>
                        <span style={{ position: 'absolute', left: 12, color: 'var(--g400)', display: 'flex', flexShrink: 0, pointerEvents: 'none' }}><SearchIcon /></span>
                        <input type="text" style={{ flex: 1, padding: '10px 14px 10px 38px', border: 'none', background: 'transparent', fontSize: 14, fontFamily: 'inherit', color: 'var(--g900)', outline: 'none' }} placeholder="Search by vehicle or owner…" value={logSearchQuery} onChange={e => setLogSearchQuery(e.target.value)} />
                      </div>
                    </div>

                    {/* Log List */}
                    {filteredLogReports.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '50px 20px', background: 'var(--g50)', borderRadius: 'var(--radius)', border: '1px dashed var(--g200)' }}>
                        <div style={{ fontSize: 44, marginBottom: 12 }}>📋</div>
                        <h3 style={{ fontSize: 17, color: 'var(--g700)', margin: '0 0 8px' }}>No reports found</h3>
                        <p style={{ fontSize: 13, color: 'var(--g400)', margin: 0 }}>Try adjusting your search query.</p>
                      </div>
                    ) : (
                      <div className="logs-list">
                        {filteredLogReports.slice().reverse().map(r => {
                          const ciIssues  = r.issues || [];
                          const coIssues  = r.checkout?.issues || [];
                          const newDamage = r.checkout ? coIssues.filter(i => !ciIssues.includes(i)) : [];
                          const hasSig    = !!r.renterSignature;
                          const hasComments = (r.comments || []).length > 0;
                          return (
                            <div key={r.id} onClick={() => handleViewLog(r)} className="log-card">
                              <div className="log-header">
                                <div>
                                  <div className="log-vehicle"><CarIcon /> {r.vehicleName}</div>
                                  {r.ownerName && <div className="log-owner"><UserIcon /> {r.ownerName}</div>}
                                </div>
                                <ChevronRIcon />
                              </div>

                              <div className="log-meta">
                                <span className="log-date"><CalIcon /> {fmtShortDate(r.createdAt)}</span>
                                {ciIssues.length > 0 ? (
                                  <span className="log-issues"><AlertIcon /> {ciIssues.length} issue{ciIssues.length > 1 ? 's' : ''}</span>
                                ) : (
                                  <span className="log-status-clean"><CheckIcon /> Clean</span>
                                )}
                              </div>

                              {(r.odometer || r.fuelLevel || r.conditionRating) && (
                                <div className="log-details">
                                  {r.odometer && <span>{r.odometer} km</span>}
                                  {r.fuelLevel && <span>⚡ {r.fuelLevel}</span>}
                                  {r.conditionRating && <span><ConditionBadge rating={r.conditionRating} /></span>}
                                </div>
                              )}

                              <div className="log-tags">
                                <span className="tag-complete"><CheckIcon /> Check-in</span>
                                {r.checkout ? (
                                  <span className="tag-trip-complete">Trip Complete</span>
                                ) : (
                                  <span className="tag-pending"><AlertIcon /> Awaiting Check-out</span>
                                )}
                                {newDamage.length > 0 && <span className="tag-damage"><DamageIcon /> {newDamage.length} dmg</span>}
                                {hasComments && <span className="tag-comments"><CommentIcon /> {r.comments.length}</span>}
                                {hasSig && <span className="tag-signed"><CheckIcon /> Signed</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Log Detail View - Displayed in panel */
                <div className="panel">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${C.g100}` }}>
                      <button onClick={() => setViewingReport(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: C.primary, fontWeight: 600, fontSize: 13, padding: 0 }}>
                        <ChevronLIcon /> Back to Log Reports
                      </button>
                      <button onClick={() => printReport(viewingReport)} style={{ display: 'flex', alignItems: 'center', gap: 6, border: `1.5px solid ${C.g200}`, background: '#fff', color: C.g700, fontWeight: 600, fontSize: 12, padding: '7px 14px', borderRadius: C.r2, cursor: 'pointer', transition: 'all .14s' }}>
                        <PrintIcon /> Print/Export
                      </button>
                    </div>

                    <div style={{ background: `${C.indigo}08`, border: `1px solid ${C.indigo}28`, borderRadius: C.r, padding: '11px 16px', fontSize: 13, color: C.indigoDk, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, lineHeight: 1.6 }}>
                      <EyeIcon /> This report was created by the vehicle owner. You can view the condition details and leave a comment if you have concerns.
                    </div>

                    <RentalBanner report={viewingReport} />
                    {viewingReport.checkout && <TripSummaryCard report={viewingReport} />}

                    {viewingReport.checkout ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24, alignItems: 'start' }}>
                        <ColCard title="Before Trip" titleColor="#065f46" headerBg="rgba(16,185,129,.07)" headerBorder="rgba(16,185,129,.18)" date={viewingReport.createdAt}>
                          <DataGrid odometer={viewingReport.odometer} fuelLevel={viewingReport.fuelLevel} conditionRating={viewingReport.conditionRating} />
                          <Sec label="Issues"><IssueBlock issues={viewingReport.issues || []} labelFn={id => DEFAULT_CHECKLIST.find(x => x.id === id)?.label || id} /></Sec>
                          <Sec label="Notes"><pre style={{ fontFamily: 'inherit', fontSize: 13, color: C.g700, background: C.g50, border: `1px solid ${C.g200}`, borderRadius: C.r2, padding: '10px 12px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, lineHeight: 1.6 }}>{viewingReport.notes || 'No notes.'}</pre></Sec>
                          <PhotoGallery photos={viewingReport.photos} label="Check-in Photos" />
                        </ColCard>
                        <ColCard title="After Trip" titleColor="#92400e" headerBg="rgba(245,158,11,.07)" headerBorder="rgba(245,158,11,.2)" date={viewingReport.checkout.createdAt}>
                          <DataGrid odometer={viewingReport.checkout.odometer} fuelLevel={viewingReport.checkout.fuelLevel} conditionRating={viewingReport.checkout.conditionRating} />
                          <Sec label="Issues"><IssueBlock issues={viewingReport.checkout.issues || []} labelFn={id => DEFAULT_CHECKLIST.find(x => x.id === id)?.label || id} newIssues={(viewingReport.checkout.issues || []).filter(i => !(viewingReport.issues || []).includes(i))} /></Sec>
                          <Sec label="Notes"><pre style={{ fontFamily: 'inherit', fontSize: 13, color: C.g700, background: C.g50, border: `1px solid ${C.g200}`, borderRadius: C.r2, padding: '10px 12px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, lineHeight: 1.6 }}>{viewingReport.checkout.notes || 'No notes.'}</pre></Sec>
                          <PhotoGallery photos={viewingReport.checkout.photos} label="Check-out Photos" />
                        </ColCard>
                      </div>
                    ) : (
                      <>
                        <div style={{ background: 'rgba(245,158,11,.07)', border: '1px dashed rgba(245,158,11,.4)', borderRadius: C.r, padding: '14px 18px', marginBottom: 20, textAlign: 'center', fontSize: 13, color: '#92400e', lineHeight: 1.6 }}>
                          No check-out report has been added by the owner yet.
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 20 }}>
                          {[
                            { l: 'Logged On', v: fmtDate(viewingReport.createdAt), always: true },
                            viewingReport.odometer && { l: 'Odometer', v: `${viewingReport.odometer} km` },
                            viewingReport.conditionRating && { l: 'Condition', v: <ConditionBadge rating={viewingReport.conditionRating} /> },
                          ].filter(Boolean).map((f, i) => (
                            <div key={i} style={{ background: C.g50, border: `1px solid ${C.g200}`, borderRadius: C.r2, padding: '12px 14px' }}>
                              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: C.g400, marginBottom: 4 }}>{f.l}</div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>{f.v}</div>
                            </div>
                          ))}
                          {viewingReport.fuelLevel && (
                            <div style={{ background: C.g50, border: `1px solid ${C.g200}`, borderRadius: C.r2, padding: '12px 14px' }}>
                              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: C.g400, marginBottom: 6 }}>Fuel Level</div>
                              <FuelGauge level={viewingReport.fuelLevel} />
                            </div>
                          )}
                        </div>
                        
                        <Sec label="Condition Issues"><IssueBlock issues={viewingReport.issues || []} labelFn={id => DEFAULT_CHECKLIST.find(x => x.id === id)?.label || id} /></Sec>
                        <Sec label="Notes"><pre style={{ fontFamily: 'inherit', fontSize: 13, color: C.g700, background: C.g50, border: `1px solid ${C.g200}`, borderRadius: C.r2, padding: '10px 12px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, lineHeight: 1.6 }}>{viewingReport.notes || 'No notes.'}</pre></Sec>
                        <PhotoGallery photos={viewingReport.photos} label="Check-in Photos" />
                      </>
                    )}

                    <div style={{ height: 1, background: C.g100, margin: '24px 0' }} />
                    <SignatureSection localReport={viewingReport} onSigned={refreshLogs} />
                    <div style={{ height: 1, background: C.g100, margin: '24px 0' }} />
                    <CommentsSection localReport={viewingReport} user={user} onCommentAdded={refreshLogs} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} title="Filters" footer={<><button className="btn btn-secondary" onClick={clearFilters}>Reset</button><button className="btn btn-primary" onClick={() => setIsFilterOpen(false)}>Apply</button></>}>
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
            <label className="filter-label">Price Range (₱/day)</label>
            <div className="price-inputs">
              <input type="number" className="price-input" placeholder="Min" value={filters.minPrice} onChange={e => setFilters(p => ({ ...p, minPrice: e.target.value }))} />
              <span className="price-separator">to</span>
              <input type="number" className="price-input" placeholder="Max" value={filters.maxPrice} onChange={e => setFilters(p => ({ ...p, maxPrice: e.target.value }))} />
            </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isDetailOpen} onClose={() => { setIsDetailOpen(false); setSelectedVehicle(null); }} title={selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.name}` : 'Vehicle Details'} size="large">
        {selectedVehicle && (
          <div className="vehicle-detail">
            <div className="detail-image">
              {selectedVehicle.image ? <img src={selectedVehicle.image} alt={selectedVehicle.name} /> : <div className="image-placeholder"><CarIcon /></div>}
            </div>
            <div className="detail-info">
              <div className="detail-price"><span className="price-amount">₱{selectedVehicle.pricePerDay?.toLocaleString()}</span><span className="price-period">/day</span></div>
              <div className="detail-specs">
                {selectedVehicle.type && <div className="spec-item"><span>{selectedVehicle.type}</span></div>}
                {selectedVehicle.transmission && <div className="spec-item"><span>{selectedVehicle.transmission}</span></div>}
                {selectedVehicle.seats && <div className="spec-item"><span>{selectedVehicle.seats} seats</span></div>}
                {selectedVehicle.fuel && <div className="spec-item"><span>{selectedVehicle.fuel}</span></div>}
                {selectedVehicle.year && <div className="spec-item"><span>{selectedVehicle.year}</span></div>}
              </div>
              {selectedVehicle.location && <div className="detail-location"><span>{selectedVehicle.location}</span></div>}
              {selectedVehicle.owner && <div className="detail-owner"><span>Owner: {selectedVehicle.owner}</span></div>}
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


    </div>
  );
}

export default RenterDashboard;