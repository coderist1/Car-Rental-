import React, { useState, useMemo, useRef } from 'react';
import { Modal } from '../../components';
import { useLogReport } from '../../context/LogReportContext';

/* ─── Constants ─── */
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

const FUEL_OPTS        = ['Full', '3/4', '1/2', '1/4', 'Empty'];
const CONDITION_RATINGS = ['Excellent', 'Good', 'Fair', 'Poor'];

const CONDITION_COLORS = {
  Excellent: { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' },
  Good:      { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' },
  Fair:      { bg: '#fef3c7', color: '#92400e', border: '#fcd34d' },
  Poor:      { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
};

const FUEL_PCT = { 'Full': 100, '3/4': 75, '1/2': 50, '1/4': 25, 'Empty': 0 };

/* ─── Helpers ─── */
const fmtDate      = iso => iso ? new Date(iso).toLocaleString()  : '—';
const fmtShortDate = iso => iso ? new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
const tripDays     = (s, e) => { if (!s || !e) return null; return Math.max(1, Math.round((new Date(e) - new Date(s)) / 86400000)); };

/* ─── Design tokens ─── */
const C = {
  primary:   '#3F9B84',
  primaryDk: '#2e7d67',
  primaryLt: '#ecfdf5',
  navy:      '#1a2c5e',
  danger:    '#ef4444',
  warning:   '#f59e0b',
  success:   '#22c55e',
  g50:  '#f9fafb',
  g100: '#f3f4f6',
  g200: '#e5e7eb',
  g300: '#d1d5db',
  g400: '#9ca3af',
  g500: '#6b7280',
  g700: '#374151',
  g900: '#111827',
  shadow: '0 1px 3px rgba(0,0,0,.07), 0 4px 12px rgba(0,0,0,.05)',
  shadowHover: '0 4px 16px rgba(63,155,132,.15)',
  r: 12, r2: 8,
};

/* ═══════════════ ICONS ═══════════════ */
const Ico = ({ d, w = 14 }) => (
  <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {typeof d === 'string' ? <path d={d} /> : d}
  </svg>
);
const ClipboardIcon  = () => <Ico w={16} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />;
const EditIcon       = () => <Ico d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />;
const TrashIcon      = () => <Ico d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />;
const PlusIcon       = () => <Ico d="M12 4v16m8-8H4" />;
const ChevronRIcon   = () => <Ico w={16} d="M9 5l7 7-7 7" />;
const ChevronLIcon   = () => <Ico d="M15 19l-7-7 7-7" />;
const AlertIcon      = () => <Ico d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />;
const CheckIcon      = () => <Ico d="M5 13l4 4L19 7" />;
const CommentIcon    = () => <Ico d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />;
const UserIcon       = () => <Ico d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />;
const CarIcon        = () => <Ico d="M5 17H3a2 2 0 01-2-2V9a2 2 0 012-2h3.5l2-3h7l2 3H21a2 2 0 012 2v6a2 2 0 01-2 2h-2M8 17a2 2 0 104 0 2 2 0 00-4 0zm8 0a2 2 0 104 0 2 2 0 00-4 0z" />;
const CalIcon        = () => <Ico d={<><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18" /></>} />;
const PrintIcon      = () => <Ico d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2m-2-4H8v8h8v-8z" />;
const SignIcon       = () => <Ico d="M15.232 5.232l3.536 3.536M9 11l-5 5v3h3l5-5m0 0l3.536-3.536M9 11l3.536-3.536" />;
const DamageIcon     = () => <Ico d="M12 9v2m0 4h.01M5.07 19H19a2 2 0 001.75-2.9L13.75 5a2 2 0 00-3.5 0L3.25 16.1A2 2 0 005.07 19z" />;
const SearchIcon     = () => <Ico w={15} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />;
const ImageIcon      = () => <Ico d={<><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21" /></>} />;
const XIcon          = () => <Ico d="M18 6L6 18M6 6l12 12" />;
const CloseSmIcon    = () => <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M6 18L18 6M6 6l12 12" /></svg>;

/* ═══════════════ CONFIRM DIALOG ═══════════════ */
function ConfirmDialog({ isOpen, title, message, confirmLabel = 'Confirm', variant = 'danger', onConfirm, onCancel }) {
  if (!isOpen) return null;
  const btnBg    = variant === 'danger' ? C.danger : variant === 'warning' ? C.warning : C.primary;
  const emoji    = variant === 'danger' ? '🗑️' : variant === 'warning' ? '⚠️' : '✅';
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(15,23,42,.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 18, padding: '32px 28px 24px', maxWidth: 380, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,.22)' }}>
        <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 14 }}>{emoji}</div>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: C.navy, textAlign: 'center', margin: '0 0 8px' }}>{title}</h3>
        <p style={{ fontSize: 13, color: C.g500, textAlign: 'center', margin: '0 0 24px', lineHeight: 1.65 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '11px 0', border: `1.5px solid ${C.g200}`, borderRadius: 10, background: '#fff', color: C.g700, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            No, Cancel
          </button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '11px 0', border: 'none', borderRadius: 10, background: btnBg, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 12px ${btnBg}44` }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ SECTION WRAPPER ═══════════════ */
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

/* ═══════════════ FUEL GAUGE ═══════════════ */
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

/* ═══════════════ CONDITION BADGE ═══════════════ */
function ConditionBadge({ rating }) {
  if (!rating) return null;
  const c = CONDITION_COLORS[rating] || { bg: C.g100, color: C.g700, border: C.g200 };
  return (
    <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, padding: '3px 11px', borderRadius: 999, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
      {rating}
    </span>
  );
}

/* ═══════════════ STATS BAR ═══════════════ */
function StatsBar({ reports }) {
  const complete  = reports.filter(r => !!r.checkout).length;
  const awaiting  = reports.filter(r => !r.checkout).length;
  const newDamage = reports.filter(r => {
    if (!r.checkout) return false;
    const ci = r.issues || [], co = r.checkout.issues || [];
    return co.some(i => !ci.includes(i));
  }).length;
  const stats = [
    { label: 'Total Entries',      value: reports.length, color: C.primary },
    { label: 'Trips Complete',     value: complete,        color: '#3b82f6' },
    { label: 'Awaiting Check-out', value: awaiting,        color: C.warning },
    { label: 'New Damage',         value: newDamage,       color: C.danger  },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 22 }}>
      {stats.map(s => (
        <div key={s.label} style={{ background: '#fff', borderRadius: C.r, padding: '14px 16px', borderLeft: `4px solid ${s.color}`, border: `1px solid ${s.color}18`, borderLeftWidth: 4, boxShadow: C.shadow }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
          <div style={{ fontSize: 11, color: C.g500, fontWeight: 500, marginTop: 3 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════ TRIP SUMMARY ═══════════════ */
function TripSummaryCard({ report }) {
  if (!report.checkout) return null;
  const days     = tripDays(report.startDate, report.endDate);
  const revenue  = days && report.amount ? days * Number(report.amount) : null;
  const ciOdo    = parseFloat(report.odometer);
  const coOdo    = parseFloat(report.checkout?.odometer);
  const kmDriven = (!isNaN(ciOdo) && !isNaN(coOdo) && coOdo > ciOdo) ? coOdo - ciOdo : null;
  const ciIssues = report.issues || [];
  const coIssues = report.checkout?.issues || [];
  const newDmg   = coIssues.filter(i => !ciIssues.includes(i));
  const status   = newDmg.length > 0 ? 'Damage Reported' : coIssues.length > ciIssues.length ? 'Minor Issues' : 'Clean Return';
  const sColor   = status === 'Damage Reported' ? C.danger : status === 'Minor Issues' ? C.warning : C.success;
  const metrics  = [
    days     !== null && { label: 'Days Rented',  val: `${days}`,                         color: C.navy    },
    revenue  !== null && { label: 'Revenue',      val: `₱${revenue.toLocaleString()}`,     color: C.primary },
    kmDriven !== null && { label: 'km Driven',    val: `${kmDriven.toLocaleString()} km`,  color: C.navy    },
    newDmg.length > 0  && { label: 'New Issues',  val: `${newDmg.length}`,                 color: C.danger  },
    report.checkout?.damageCost && { label: 'Damage Est.', val: `₱${parseFloat(report.checkout.damageCost).toLocaleString()}`, color: C.danger },
  ].filter(Boolean);

  return (
    <div style={{ background: `linear-gradient(135deg, ${C.primaryLt}, #f0fdfa)`, border: `1px solid ${C.primary}28`, borderRadius: C.r, padding: '16px 20px', marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: C.g500 }}>Trip Summary</span>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 999, background: `${sColor}14`, color: sColor, border: `1px solid ${sColor}35` }}>
          {status === 'Damage Reported' && '⚠ '}{status}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 14 }}>
        {metrics.map((m, i) => (
          <div key={i}>
            <div style={{ fontSize: 20, fontWeight: 800, color: m.color, lineHeight: 1 }}>{m.val}</div>
            <div style={{ fontSize: 11, color: C.g500, marginTop: 2 }}>{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════ RENTAL BANNER ═══════════════ */
function RentalBanner({ report }) {
  const items = [
    { icon: <CarIcon />,  label: 'Vehicle', val: report.vehicleName },
    { icon: <UserIcon />, label: 'Renter',  val: report.renterName || '—' },
    report.startDate && { icon: <CalIcon />, label: 'Start', val: fmtShortDate(report.startDate) },
    report.endDate   && { icon: <CalIcon />, label: 'End',   val: fmtShortDate(report.endDate) },
    report.amount    && { icon: null,        label: 'Rate',  val: `₱${report.amount}/day` },
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

/* ═══════════════ PHOTO UPLOADER ═══════════════ */
function PhotoUploader({ photos = [], onChange }) {
  const ref = useRef();
  const handleFiles = e => {
    const readers = Array.from(e.target.files).map(f => new Promise(res => {
      const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(f);
    }));
    Promise.all(readers).then(np => onChange([...photos, ...np]));
    e.target.value = '';
  };
  return (
    <Sec label="Condition Photos">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {photos.map((src, i) => (
          <div key={i} style={{ position: 'relative', width: 86, height: 86 }}>
            <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: C.r2, border: `1px solid ${C.g200}` }} />
            <button onClick={() => onChange(photos.filter((_, j) => j !== i))} style={{
              position: 'absolute', top: -6, right: -6, background: C.danger, border: '2px solid #fff',
              borderRadius: '50%', width: 22, height: 22, color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
            }}><CloseSmIcon /></button>
          </div>
        ))}
        <button onClick={() => ref.current.click()} style={{
          width: 86, height: 86, border: `2px dashed ${C.g300}`, borderRadius: C.r2, background: C.g50,
          cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 5, color: C.g400, fontSize: 11, fontWeight: 500,
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.color = C.primary; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.g300;    e.currentTarget.style.color = C.g400;    }}>
          <ImageIcon />Add Photo
        </button>
      </div>
      <input ref={ref} type="file" accept="image/*" multiple onChange={handleFiles} style={{ display: 'none' }} />
    </Sec>
  );
}

/* ═══════════════ PHOTO GALLERY ═══════════════ */
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
        <div onClick={() => setLb(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={lb} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: C.r, boxShadow: '0 24px 60px rgba(0,0,0,.5)' }} />
        </div>
      )}
    </Sec>
  );
}

/* ═══════════════ CHECKLIST EDITOR ═══════════════ */
function ChecklistEditor({ issues, customLabels, onChange, onLabelChange }) {
  const [input, setInput] = useState('');

  const allItems = [
    ...DEFAULT_CHECKLIST,
    ...Object.keys(customLabels || {})
      .filter(k => !DEFAULT_CHECKLIST.find(d => d.id === k))
      .map(k => ({ id: k, label: customLabels[k] })),
  ];

  const toggle = id => issues.includes(id)
    ? onChange(issues.filter(i => i !== id))
    : onChange([...issues, id]);

  const addCustom = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const id = `custom_${Date.now()}`;
    onLabelChange({ ...(customLabels || {}), [id]: trimmed });
    onChange([...issues, id]);
    setInput('');
  };

  const removeCustom = id => {
    onChange(issues.filter(i => i !== id));
    const next = { ...(customLabels || {}) };
    delete next[id];
    onLabelChange(next);
  };

  return (
    <Sec label="Condition Checklist">
      {/* Checkbox grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 8, marginBottom: 12 }}>
        {allItems.map(item => {
          const isCustom = !DEFAULT_CHECKLIST.find(d => d.id === item.id);
          const checked  = issues.includes(item.id);
          return (
            <label key={item.id} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
              border: `1.5px solid ${checked ? C.primary + '55' : C.g200}`,
              background: checked ? `${C.primary}08` : C.g50,
              borderRadius: C.r2, cursor: 'pointer', userSelect: 'none', transition: 'all .13s',
            }}>
              <input type="checkbox" checked={checked} onChange={() => toggle(item.id)}
                style={{ accentColor: C.primary, width: 15, height: 15, flexShrink: 0, cursor: 'pointer' }} />
              <span style={{ flex: 1, fontSize: 13, color: checked ? C.primaryDk : C.g700, fontWeight: checked ? 600 : 400 }}>
                {item.label}
              </span>
              {isCustom && (
                <button type="button" onClick={e => { e.preventDefault(); e.stopPropagation(); removeCustom(item.id); }}
                  style={{ background: 'none', border: 'none', color: C.danger, cursor: 'pointer', fontSize: 11, fontWeight: 700, padding: '1px 4px', borderRadius: 4, opacity: 0.6, flexShrink: 0 }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => e.currentTarget.style.opacity = 0.6}>
                  ✕
                </button>
              )}
            </label>
          );
        })}
      </div>

      {/* Add custom issue row — clear inline design, no stray plus button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: C.g50, border: `1.5px dashed ${C.g300}`, borderRadius: C.r2 }}>
        <span style={{ color: C.g400, display: 'flex', flexShrink: 0 }}><PlusIcon /></span>
        <input
          type="text"
          placeholder="Add a custom issue, then press Enter or click Add"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
          style={{
            flex: 1, border: 'none', background: 'transparent', fontSize: 13,
            color: C.g900, outline: 'none', padding: 0, minWidth: 0,
          }}
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={!input.trim()}
          style={{
            padding: '5px 16px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 600,
            background: input.trim() ? C.primary : C.g200,
            color: input.trim() ? '#fff' : C.g400,
            cursor: input.trim() ? 'pointer' : 'default',
            flexShrink: 0, transition: 'all .14s',
          }}>
          Add
        </button>
      </div>
    </Sec>
  );
}

/* ═══════════════ REPORT FORM ═══════════════ */
function ReportForm({ initial, subtitle, onSave, onCancel, isCheckout = false, checkinIssues = [] }) {
  const [issues,       setIssues]       = useState(initial.issues || []);
  const [customLabels, setCL]           = useState(initial.customLabels || {});
  const [notes,        setNotes]        = useState(initial.notes || '');
  const [odometer,     setOdometer]     = useState(initial.odometer || '');
  const [fuelLevel,    setFuelLevel]    = useState(initial.fuelLevel || '');
  const [cRating,      setCRating]      = useState(initial.conditionRating || '');
  const [photos,       setPhotos]       = useState(initial.photos || []);
  const [damageCost,   setDamageCost]   = useState(initial.damageCost || '');
  const [cfSave,       setCfSave]       = useState(false);
  const [cfCancel,     setCfCancel]     = useState(false);

  const newIssues = isCheckout ? issues.filter(i => !checkinIssues.includes(i)) : [];

  const inp = {
    width: '100%', padding: '10px 13px', border: `1.5px solid ${C.g200}`,
    borderRadius: C.r2, fontSize: 14, color: C.g900, background: '#fff',
    outline: 'none', boxSizing: 'border-box', transition: 'border-color .15s',
    fontFamily: 'inherit',
  };
  const lbl = { display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: C.g400, marginBottom: 6 };

  return (
    <div>
      <ConfirmDialog isOpen={cfSave} title="Save Report?" message="Are you sure you want to save this condition record?" confirmLabel="Yes, Save" variant="primary"
        onConfirm={() => { setCfSave(false); onSave({ issues, customLabels, notes, odometer, fuelLevel, conditionRating: cRating, photos, damageCost: damageCost || undefined }); }}
        onCancel={() => setCfSave(false)} />
      <ConfirmDialog isOpen={cfCancel} title="Discard Changes?" message="Go back without saving? Your changes will be lost." confirmLabel="Yes, Discard" variant="danger"
        onConfirm={() => { setCfCancel(false); onCancel(); }} onCancel={() => setCfCancel(false)} />

      {initial.vehicleName && <RentalBanner report={initial} />}
      {subtitle && <p style={{ fontSize: 13, color: C.g500, marginBottom: 20, marginTop: -6 }}>{subtitle}</p>}

      {/* Vehicle data */}
      <Sec label="Vehicle Data">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
          <div>
            <label style={lbl}>Odometer (km)</label>
            <input style={inp} type="number" placeholder="e.g. 45230" value={odometer} onChange={e => setOdometer(e.target.value)}
              onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = C.g200} />
          </div>
          <div>
            <label style={lbl}>Fuel Level</label>
            <select style={{ ...inp, cursor: 'pointer' }} value={fuelLevel} onChange={e => setFuelLevel(e.target.value)}
              onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = C.g200}>
              <option value="">Select…</option>
              {FUEL_OPTS.map(f => <option key={f}>{f}</option>)}
            </select>
            {fuelLevel && <div style={{ marginTop: 8 }}><FuelGauge level={fuelLevel} /></div>}
          </div>
        </div>
      </Sec>

      {/* Condition rating */}
      <Sec label="Overall Condition">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {CONDITION_RATINGS.map(r => {
            const c = CONDITION_COLORS[r], active = cRating === r;
            return (
              <button key={r} type="button" onClick={() => setCRating(active ? '' : r)} style={{
                padding: '8px 20px', borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                background: active ? c.bg : '#fff', color: active ? c.color : C.g500,
                border: active ? `2px solid ${c.border}` : `1.5px solid ${C.g200}`,
                boxShadow: active ? `0 2px 8px ${c.border}55` : 'none', transition: 'all .14s',
              }}>{r}</button>
            );
          })}
        </div>
      </Sec>

      {/* Checklist — fixed, clearly labeled */}
      <ChecklistEditor issues={issues} customLabels={customLabels} onChange={setIssues} onLabelChange={setCL} />

      {/* New damage cost */}
      {isCheckout && newIssues.length > 0 && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: C.r, padding: '14px 18px', marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#991b1b', fontWeight: 700, fontSize: 13, marginBottom: 10 }}>
            <DamageIcon /> {newIssues.length} new issue{newIssues.length > 1 ? 's' : ''} found at check-out
          </div>
          <label style={{ ...lbl, color: C.g500 }}>
            Estimated Damage Cost (₱) <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: C.g400 }}>— optional</span>
          </label>
          <input style={{ ...inp, borderColor: '#fca5a5' }} type="number" placeholder="e.g. 5000" value={damageCost} onChange={e => setDamageCost(e.target.value)}
            onFocus={e => e.target.style.borderColor = C.danger} onBlur={e => e.target.style.borderColor = '#fca5a5'} />
        </div>
      )}

      {/* Notes */}
      <Sec label="Notes">
        <textarea style={{ ...inp, resize: 'vertical', minHeight: 88 }} rows={4}
          placeholder="Describe the vehicle condition, any observations…"
          value={notes} onChange={e => setNotes(e.target.value)}
          onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = C.g200} />
      </Sec>

      <PhotoUploader photos={photos} onChange={setPhotos} />

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24, paddingTop: 18, borderTop: `1px solid ${C.g100}` }}>
        <button onClick={() => setCfCancel(true)} style={{ padding: '10px 22px', border: `1.5px solid ${C.g200}`, borderRadius: C.r2, background: '#fff', color: C.g700, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          Cancel
        </button>
        <button onClick={() => setCfSave(true)} style={{ padding: '10px 28px', border: 'none', borderRadius: C.r2, background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDk})`, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 14px ${C.primary}50` }}>
          Save Report
        </button>
      </div>
    </div>
  );
}

/* ═══════════════ ISSUE BLOCK (read-only) ═══════════════ */
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
            background: isNew ? '#fef2f2' : C.g50, border: `1px solid ${isNew ? '#fca5a5' : C.g200}`,
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

/* ═══════════════ SIGNATURE DISPLAY ═══════════════ */
function SigDisplay({ label, name, date }) {
  return (
    <div style={{ border: `1px solid ${C.g200}`, borderRadius: C.r2, padding: '12px 16px', background: C.g50, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: C.g400 }}>{label}</span>
      {name
        ? <span style={{ fontSize: 14, fontWeight: 700, color: C.navy, fontStyle: 'italic' }}>{name}</span>
        : <span style={{ fontSize: 13, color: C.g300 }}>Not signed</span>}
      {date && <span style={{ fontSize: 11, color: C.g400 }}>{fmtDate(date)}</span>}
    </div>
  );
}

/* ═══════════════ PRINT ═══════════════ */
function printReport(report) {
  const allLabels = id => {
    const d = DEFAULT_CHECKLIST.find(x => x.id === id);
    return (report.customLabels || {})[id] || (report.checkout?.customLabels || {})[id] || d?.label || id;
  };
  const ciIssues = report.issues || [], coIssues = report.checkout?.issues || [];
  const newIssues = coIssues.filter(i => !ciIssues.includes(i));
  const days = tripDays(report.startDate, report.endDate);
  const revenue = days && report.amount ? days * Number(report.amount) : null;
  const ciOdo = parseFloat(report.odometer), coOdo = parseFloat(report.checkout?.odometer);
  const kmDriven = !isNaN(ciOdo) && !isNaN(coOdo) && coOdo > ciOdo ? coOdo - ciOdo : null;
  const win = window.open('', '_blank');
  win.document.write(`<html><head><title>Log Report – ${report.vehicleName}</title>
  <style>body{font-family:Georgia,serif;max-width:760px;margin:0 auto;padding:32px;color:#111}h1{font-size:22px;margin-bottom:4px}.sub{color:#6b7280;font-size:13px;margin-bottom:24px}.sec-title{font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:#9ca3af;font-weight:700;margin-bottom:8px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.field{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px 14px}.fl{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af}.fv{font-size:14px;font-weight:700;color:#111;margin-top:2px}.issue{padding:6px 10px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;font-size:13px;margin-bottom:4px}.issue.new{background:#fef2f2;border-color:#fca5a5;color:#991b1b}.ch{font-size:12px;font-weight:700;padding:8px 12px;border-radius:8px;margin-bottom:8px}.ci{background:#d1fae5;color:#065f46}.co{background:#fef3c7;color:#92400e}.sum{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px;margin-bottom:20px}.sigs{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:32px}.sb{border:1px solid #e5e7eb;border-radius:8px;padding:12px 16px}.sl{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af}.sn{font-size:15px;font-style:italic;font-weight:700;margin-top:4px}@media print{body{padding:0}}</style>
  </head><body>
  <h1>Vehicle Log Report — ${report.vehicleName}</h1>
  <p class="sub">Renter: ${report.renterName || '—'} | Period: ${fmtShortDate(report.startDate)} – ${fmtShortDate(report.endDate)} | Rate: ₱${report.amount || '—'}/day</p>
  ${report.checkout ? `<div class="sum"><div class="sec-title">Trip Summary</div><div class="grid">
    ${days ? `<div class="field"><div class="fl">Days</div><div class="fv">${days}</div></div>` : ''}
    ${revenue ? `<div class="field"><div class="fl">Revenue</div><div class="fv">₱${revenue.toLocaleString()}</div></div>` : ''}
    ${kmDriven ? `<div class="field"><div class="fl">km Driven</div><div class="fv">${kmDriven.toLocaleString()} km</div></div>` : ''}
    ${newIssues.length ? `<div class="field"><div class="fl">New Damage</div><div class="fv" style="color:#ef4444">${newIssues.length} issue(s)</div></div>` : ''}
    ${report.checkout.damageCost ? `<div class="field"><div class="fl">Damage Est.</div><div class="fv" style="color:#ef4444">₱${parseFloat(report.checkout.damageCost).toLocaleString()}</div></div>` : ''}
  </div></div>
  <div class="grid"><div>
    <div class="ch ci">Before Trip — ${fmtShortDate(report.createdAt)}</div>
    <div class="field" style="margin-bottom:8px"><div class="fl">Odometer</div><div class="fv">${report.odometer ? report.odometer + ' km' : '—'}</div></div>
    <div class="field" style="margin-bottom:8px"><div class="fl">Fuel</div><div class="fv">${report.fuelLevel || '—'}</div></div>
    ${report.conditionRating ? `<div class="field" style="margin-bottom:8px"><div class="fl">Condition</div><div class="fv">${report.conditionRating}</div></div>` : ''}
    <div class="sec-title" style="margin-top:12px">Issues</div>
    ${ciIssues.length ? ciIssues.map(k => `<div class="issue">${allLabels(k)}</div>`).join('') : '<p style="color:#6b7280;font-size:13px">None</p>'}
    <div class="sec-title" style="margin-top:12px">Notes</div><p style="font-size:13px">${report.notes || 'No notes.'}</p>
  </div><div>
    <div class="ch co">After Trip — ${fmtShortDate(report.checkout.createdAt)}</div>
    <div class="field" style="margin-bottom:8px"><div class="fl">Odometer</div><div class="fv">${report.checkout.odometer ? report.checkout.odometer + ' km' : '—'}</div></div>
    <div class="field" style="margin-bottom:8px"><div class="fl">Fuel</div><div class="fv">${report.checkout.fuelLevel || '—'}</div></div>
    ${report.checkout.conditionRating ? `<div class="field" style="margin-bottom:8px"><div class="fl">Condition</div><div class="fv">${report.checkout.conditionRating}</div></div>` : ''}
    <div class="sec-title" style="margin-top:12px">Issues</div>
    ${coIssues.length ? coIssues.map(k => `<div class="issue ${newIssues.includes(k)?'new':''}">${allLabels(k)}${newIssues.includes(k)?' [NEW]':''}</div>`).join('') : '<p style="color:#6b7280;font-size:13px">None</p>'}
    <div class="sec-title" style="margin-top:12px">Notes</div><p style="font-size:13px">${report.checkout.notes || 'No notes.'}</p>
  </div></div>` : `<div>
    <div class="sec-title">Check-in Record — ${fmtDate(report.createdAt)}</div>
    <div class="grid">
      <div class="field"><div class="fl">Odometer</div><div class="fv">${report.odometer ? report.odometer + ' km' : '—'}</div></div>
      <div class="field"><div class="fl">Fuel</div><div class="fv">${report.fuelLevel || '—'}</div></div>
      ${report.conditionRating ? `<div class="field"><div class="fl">Condition</div><div class="fv">${report.conditionRating}</div></div>` : ''}
    </div>
    <div class="sec-title" style="margin-top:12px">Issues</div>
    ${ciIssues.length ? ciIssues.map(k => `<div class="issue">${allLabels(k)}</div>`).join('') : '<p style="color:#6b7280;font-size:13px">None</p>'}
    <div class="sec-title" style="margin-top:12px">Notes</div><p style="font-size:13px">${report.notes || 'No notes.'}</p>
  </div>`}
  <div class="sigs">
    <div class="sb"><div class="sl">Owner Signature</div><div class="sn">${report.ownerSignature || '(not provided)'}</div></div>
    <div class="sb"><div class="sl">Renter Acknowledgement</div><div class="sn">${report.renterSignature || '(not provided)'}</div></div>
  </div>
  <p style="font-size:11px;color:#9ca3af;margin-top:32px;text-align:center">Generated ${new Date().toLocaleString()}</p>
  </body></html>`);
  win.document.close(); win.focus(); setTimeout(() => win.print(), 500);
}

/* ═══════════════ SIGNATURES SECTION ═══════════════ */
function SignaturesSection({ report, onUpdate }) {
  const [ownerSig,  setOwnerSig]  = useState(report.ownerSignature || '');
  const [renterSig, setRenterSig] = useState(report.renterSignature || '');
  const [editing,   setEditing]   = useState(false);
  const [cfSave,    setCfSave]    = useState(false);
  const [cfCancel,  setCfCancel]  = useState(false);

  const doSave = () => { onUpdate({ ownerSignature: ownerSig, renterSignature: renterSig }); setEditing(false); setCfSave(false); };

  const inp = { width: '100%', padding: '10px 13px', border: `1.5px solid ${C.g200}`, borderRadius: C.r2, fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
  const lbl = { display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: C.g400, marginBottom: 6 };

  return (
    <Sec label="Signatures">
      <ConfirmDialog isOpen={cfSave}   title="Save Signatures?"  message="Are you sure you want to save the signature changes?" confirmLabel="Yes, Save" variant="primary" onConfirm={doSave} onCancel={() => setCfSave(false)} />
      <ConfirmDialog isOpen={cfCancel} title="Discard Changes?" message="Cancel without saving signature changes?" confirmLabel="Yes, Discard" variant="danger"
        onConfirm={() => { setOwnerSig(report.ownerSignature || ''); setRenterSig(report.renterSignature || ''); setEditing(false); setCfCancel(false); }} onCancel={() => setCfCancel(false)} />

      {!editing ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <SigDisplay label="Owner Signature"       name={report.ownerSignature}  date={report.ownerSignatureAt} />
            <SigDisplay label="Renter Acknowledgement" name={report.renterSignature} date={report.renterSignatureAt} />
          </div>
          <button onClick={() => setEditing(true)} style={{ background: 'none', border: `1.5px solid ${C.primary}`, color: C.primary, padding: '7px 16px', borderRadius: C.r2, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <EditIcon /> Edit Signatures
          </button>
        </>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div><label style={lbl}>Owner Name</label>
              <input style={inp} value={ownerSig}  onChange={e => setOwnerSig(e.target.value)}  placeholder="Type owner name"
                onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = C.g200} />
            </div>
            <div><label style={lbl}>Renter Acknowledgement</label>
              <input style={inp} value={renterSig} onChange={e => setRenterSig(e.target.value)} placeholder="Type renter name"
                onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = C.g200} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setCfCancel(true)} style={{ padding: '8px 18px', border: `1.5px solid ${C.g200}`, borderRadius: C.r2, background: '#fff', color: C.g700, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            <button onClick={() => setCfSave(true)}   style={{ padding: '8px 18px', border: 'none', borderRadius: C.r2, background: C.primary, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Save Signatures</button>
          </div>
        </>
      )}
    </Sec>
  );
}

/* ═══════════════ COMMENTS ═══════════════ */
function CommentsSection({ report, ownerName, onReply }) {
  const [text, setText]           = useState('');
  const [submitting, setSubmit]   = useState(false);
  const comments = report.comments || [];

  const submit = () => {
    if (!text.trim()) return;
    setSubmit(true);
    onReply({ authorName: ownerName || 'Owner', authorRole: 'owner', text: text.trim() });
    setText(''); setSubmit(false);
  };

  return (
    <Sec label={`Comments${comments.length ? ` (${comments.length})` : ''}`}>
      {comments.length === 0
        ? <p style={{ color: C.g400, fontSize: 13, margin: '0 0 14px' }}>No comments yet.</p>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {comments.map(c => {
              const isOwner = c.authorRole === 'owner' || c.authorName?.toLowerCase().includes('owner');
              return (
                <div key={c.id} style={{ borderRadius: C.r2, padding: '12px 14px', borderLeft: `3px solid ${isOwner ? C.primary : '#6366f1'}`, border: `1px solid ${isOwner ? C.primary + '22' : '#6366f122'}`, background: isOwner ? `${C.primary}05` : 'rgba(99,102,241,.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: isOwner ? C.primary : '#4338ca' }}>
                      <UserIcon />{c.authorName}
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 999, background: isOwner ? `${C.primary}18` : 'rgba(99,102,241,.15)', color: isOwner ? '#065f46' : '#3730a3' }}>
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
        <textarea rows="3" placeholder="Reply as owner…" value={text} onChange={e => setText(e.target.value)}
          style={{ width: '100%', padding: '10px 13px', border: `1.5px solid ${C.g200}`, borderRadius: C.r2, fontSize: 13, resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color .15s' }}
          onFocus={e => e.target.style.borderColor = C.primary} onBlur={e => e.target.style.borderColor = C.g200} />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={submit} disabled={submitting || !text.trim()} style={{
            padding: '9px 20px', border: 'none', borderRadius: C.r2, fontSize: 13, fontWeight: 700,
            background: text.trim() ? C.primary : C.g200, color: text.trim() ? '#fff' : C.g400,
            cursor: text.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: 6, transition: 'all .15s',
          }}>
            <CommentIcon /> {submitting ? 'Sending…' : 'Send Reply'}
          </button>
        </div>
      </div>
    </Sec>
  );
}

/* ═══════════════ COLUMN CARD (detail view) ═══════════════ */
function ColCard({ title, titleColor, headerBg, headerBorder, date, onEdit, children }) {
  return (
    <div style={{ border: `1px solid ${C.g200}`, borderRadius: C.r, overflow: 'hidden', background: '#fff', boxShadow: C.shadow }}>
      <div style={{ background: headerBg, borderBottom: `1px solid ${headerBorder}`, padding: '11px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: titleColor }}>{title}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, color: C.g400 }}>{fmtDate(date)}</span>
          <button onClick={onEdit} style={{ background: 'none', border: `1px solid ${titleColor}55`, cursor: 'pointer', color: titleColor, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 6 }}>
            <EditIcon /> Edit
          </button>
        </div>
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

function DataGrid({ odometer, fuelLevel, conditionRating }) {
  if (!odometer && !fuelLevel && !conditionRating) return null;
  const lbl = { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: C.g400, marginBottom: 3 };
  const box = { background: C.g50, border: `1px solid ${C.g200}`, borderRadius: C.r2, padding: '10px 12px' };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
      {odometer && <div style={box}><div style={lbl}>Odometer</div><div style={{ fontSize: 15, fontWeight: 700, color: C.navy }}>{odometer} km</div></div>}
      {fuelLevel && <div style={box}><div style={lbl}>Fuel</div><FuelGauge level={fuelLevel} /></div>}
      {conditionRating && <div style={{ ...box, gridColumn: '1 / -1' }}><div style={lbl}>Condition</div><div style={{ marginTop: 5 }}><ConditionBadge rating={conditionRating} /></div></div>}
    </div>
  );
}

/* ═══════════════ DETAIL VIEW ═══════════════ */
function DetailView({ report, ownerName, onEdit, onAddCheckout, onEditCheckout, onBack, onUpdateSignatures, onReply }) {
  const hasCheckout = !!report.checkout;
  const ciIssues   = report.issues || [];
  const coIssues   = report.checkout?.issues || [];
  const newIssues  = hasCheckout ? coIssues.filter(i => !ciIssues.includes(i)) : [];
  const allLabels  = id => {
    const d = DEFAULT_CHECKLIST.find(x => x.id === id);
    return (report.customLabels || {})[id] || (report.checkout?.customLabels || {})[id] || d?.label || id;
  };
  const noteStyle = { fontFamily: 'inherit', fontSize: 13, color: C.g700, background: C.g50, border: `1px solid ${C.g200}`, borderRadius: C.r2, padding: '10px 12px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, lineHeight: 1.6 };

  return (
    <div>
      {/* Top nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${C.g100}` }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: C.primary, fontWeight: 600, fontSize: 13, padding: 0 }}>
          <ChevronLIcon /> Back to Log Book
        </button>
        <button onClick={() => printReport(report)} style={{ display: 'flex', alignItems: 'center', gap: 6, border: `1.5px solid ${C.g200}`, background: '#fff', color: C.g700, fontWeight: 600, fontSize: 12, padding: '7px 14px', borderRadius: C.r2, cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.color = C.primary; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.g200; e.currentTarget.style.color = C.g700; }}>
          <PrintIcon /> Print / Export
        </button>
      </div>

      <RentalBanner report={report} />
      {hasCheckout && <TripSummaryCard report={report} />}

      {hasCheckout && report.checkout?.damageCost && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: C.r2, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: C.danger, display: 'flex' }}><DamageIcon /></span>
          <span style={{ fontSize: 13, color: '#991b1b', fontWeight: 600 }}>Damage estimated at ₱{parseFloat(report.checkout.damageCost).toLocaleString()}</span>
        </div>
      )}

      {hasCheckout ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24, alignItems: 'start' }}>
          <ColCard title="📥 Before Trip" titleColor="#065f46" headerBg="rgba(16,185,129,.07)" headerBorder="rgba(16,185,129,.18)" date={report.createdAt} onEdit={onEdit}>
            <DataGrid odometer={report.odometer} fuelLevel={report.fuelLevel} conditionRating={report.conditionRating} />
            <Sec label="Issues"><IssueBlock issues={ciIssues} labelFn={allLabels} newIssues={[]} /></Sec>
            <Sec label="Notes"><pre style={noteStyle}>{report.notes || 'No notes.'}</pre></Sec>
            <PhotoGallery photos={report.photos} label="Check-in Photos" />
          </ColCard>
          <ColCard title="📤 After Trip" titleColor="#92400e" headerBg="rgba(245,158,11,.07)" headerBorder="rgba(245,158,11,.2)" date={report.checkout.createdAt} onEdit={onEditCheckout}>
            <DataGrid odometer={report.checkout.odometer} fuelLevel={report.checkout.fuelLevel} conditionRating={report.checkout.conditionRating} />
            <Sec label="Issues"><IssueBlock issues={coIssues} labelFn={allLabels} newIssues={newIssues} /></Sec>
            <Sec label="Notes"><pre style={noteStyle}>{report.checkout.notes || 'No notes.'}</pre></Sec>
            <PhotoGallery photos={report.checkout.photos} label="Check-out Photos" />
          </ColCard>
        </div>
      ) : (
        <>
          <div style={{ background: 'rgba(245,158,11,.07)', border: '1px dashed rgba(245,158,11,.4)', borderRadius: C.r, padding: '14px 18px', marginBottom: 20, textAlign: 'center', fontSize: 13, color: '#92400e', lineHeight: 1.6 }}>
            ⏳ No check-out report yet. Add one when the vehicle is returned.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 20 }}>
            {[
              { l: 'Logged On',      v: fmtDate(report.createdAt), always: true },
              report.odometer        && { l: 'Odometer',       v: `${report.odometer} km` },
              report.conditionRating && { l: 'Condition',      v: <ConditionBadge rating={report.conditionRating} /> },
            ].filter(Boolean).map((f, i) => (
              <div key={i} style={{ background: C.g50, border: `1px solid ${C.g200}`, borderRadius: C.r2, padding: '12px 14px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: C.g400, marginBottom: 4 }}>{f.l}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>{f.v}</div>
              </div>
            ))}
            {report.fuelLevel && (
              <div style={{ background: C.g50, border: `1px solid ${C.g200}`, borderRadius: C.r2, padding: '12px 14px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: C.g400, marginBottom: 6 }}>Fuel Level</div>
                <FuelGauge level={report.fuelLevel} />
              </div>
            )}
          </div>
          <Sec label="Condition Issues"><IssueBlock issues={ciIssues} labelFn={allLabels} newIssues={[]} /></Sec>
          <Sec label="Notes"><pre style={{ fontFamily: 'inherit', fontSize: 13, color: C.g700, background: C.g50, border: `1px solid ${C.g200}`, borderRadius: C.r2, padding: '10px 12px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, lineHeight: 1.6 }}>{report.notes || 'No notes.'}</pre></Sec>
          <PhotoGallery photos={report.photos} label="Check-in Photos" />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button onClick={onEdit} style={{ padding: '9px 18px', border: `1.5px solid ${C.g200}`, borderRadius: C.r2, background: '#fff', color: C.g700, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <EditIcon /> Edit Check-in
            </button>
            <button onClick={onAddCheckout} style={{ padding: '9px 22px', border: 'none', borderRadius: C.r2, background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDk})`, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: `0 4px 14px ${C.primary}50` }}>
              <PlusIcon /> Add Check-out
            </button>
          </div>
        </>
      )}

      <div style={{ height: 1, background: C.g100, margin: '24px 0' }} />
      <SignaturesSection report={report} onUpdate={onUpdateSignatures} />
      <div style={{ height: 1, background: C.g100, margin: '24px 0' }} />
      <CommentsSection report={report} ownerName={ownerName} onReply={onReply} />
    </div>
  );
}

/* ═══════════════ MAIN COMPONENT ═══════════════ */
export default function OwnerLogReport({ isOpen, onClose, ownerRentals, ownerName, displayInPanel = false }) {
  const { reports, editCheckin, addCheckoutReport, editCheckout, removeReport, postComment } = useLogReport();

  const [search,   setSearch]   = useState('');
  const [view,     setView]     = useState('list');
  const [sel,      setSel]      = useState(null);
  const [delId,    setDelId]    = useState(null);

  const ownerVehicleNames = useMemo(() => new Set(ownerRentals.map(r => r.vehicleName)), [ownerRentals]);

  const ownerReports = useMemo(() => {
    const ids = new Set(ownerRentals.map(r => String(r.id)));
    return reports.filter(r => ids.has(String(r.rentalId)) || ownerVehicleNames.has(r.vehicleName));
  }, [reports, ownerRentals, ownerVehicleNames]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return ownerReports.filter(r => !q || (r.vehicleName||'').toLowerCase().includes(q) || (r.renterName||'').toLowerCase().includes(q));
  }, [ownerReports, search]);

  const getRental = r => ownerRentals.find(x => String(x.id) === String(r.rentalId));

  const open = r => {
    const rental = getRental(r);
    setSel({ ...r, startDate: rental?.startDate || r.startDate, endDate: rental?.endDate || r.endDate, amount: rental?.amount || r.amount });
    setView('detail');
  };
  const backToList = () => { setView('list'); setSel(null); };

  const handleSaveCI  = upd => { editCheckin(sel.id, upd); setSel(p => ({ ...p, ...upd })); setView('detail'); };
  const handleSaveCO  = upd => { editCheckout(sel.id, upd); setSel(p => ({ ...p, checkout: { ...p.checkout, ...upd } })); setView('detail'); };
  const handleAddCO   = upd => { addCheckoutReport(sel.id, upd); setSel(p => ({ ...p, checkout: { ...upd, createdAt: new Date().toISOString() } })); setView('detail'); };
  const handleDelete  = id  => setDelId(id);
  const doDelete      = ()  => { removeReport(delId); if (sel?.id === delId) backToList(); setDelId(null); };
  const handleSigs    = s   => { editCheckin(sel.id, s); setSel(p => ({ ...p, ...s })); };
  const handleReply   = c   => { postComment(sel.id, c); setSel(p => ({ ...p, comments: [...(p.comments||[]), { id: `cmt-${Date.now()}`, ...c, createdAt: new Date().toISOString() }] })); };

  const titleMap = { list: 'Log Book', detail: 'Log Entry Details', 'edit-checkin': 'Edit Check-in Record', 'add-checkout': 'Record Check-out', 'edit-checkout': 'Edit Check-out Record' };

  // Content wrapper that can render with or without Modal
  const content = (
    <>
      <ConfirmDialog isOpen={!!delId} title="Delete Log Entry?" message="This log entry will be permanently deleted. This cannot be undone." confirmLabel="Yes, Delete" variant="danger" onConfirm={doDelete} onCancel={() => setDelId(null)} />

      {/* ── LIST ── */}
      {view === 'list' && (
        <>
          <p style={{ fontSize: 13, color: C.g500, marginBottom: 20, marginTop: -4 }}>
            Vehicle log book — all check-in and check-out records for your rentals.
          </p>

          <StatsBar reports={ownerReports} />

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 18 }}>
            <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: C.g400, display: 'flex', pointerEvents: 'none' }}><SearchIcon /></span>
            <input
              style={{ width: '100%', padding: '11px 14px 11px 40px', border: `1.5px solid ${C.g200}`, borderRadius: C.r2, fontSize: 14, color: C.g900, background: '#fff', outline: 'none', boxSizing: 'border-box', transition: 'border-color .15s' }}
              placeholder="Search by vehicle or renter…"
              value={search} onChange={e => setSearch(e.target.value)}
              onFocus={e => e.target.style.borderColor = C.primary}
              onBlur={e => e.target.style.borderColor = C.g200}
            />
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', background: C.g50, borderRadius: C.r, border: `1px dashed ${C.g200}` }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>📋</div>
              <h3 style={{ fontSize: 17, color: C.g700, margin: '0 0 8px' }}>No log entries yet</h3>
              <p style={{ fontSize: 13, color: C.g400, margin: 0 }}>Use "Record to Log Book" on an approved rental to create a log entry.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.slice().reverse().map(r => {
                const ciIssues  = r.issues || [];
                const coIssues  = r.checkout?.issues || [];
                const newDamage = r.checkout ? coIssues.filter(i => !ciIssues.includes(i)) : [];
                return (
                  <div key={r.id} onClick={() => open(r)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', border: `1.5px solid ${C.g200}`, borderRadius: C.r, cursor: 'pointer', background: '#fff', boxShadow: C.shadow, transition: 'all .14s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.boxShadow = C.shadowHover; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.g200;    e.currentTarget.style.boxShadow = C.shadow;       e.currentTarget.style.transform = 'none'; }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Tag row */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 999, background: 'rgba(16,185,129,.1)', color: '#059669', border: '1px solid rgba(16,185,129,.25)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Check-in</span>
                        {r.checkout
                          ? <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 999, background: `${C.primary}14`, color: C.primary, border: `1px solid ${C.primary}35` }}>✓ Trip Complete</span>
                          : <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 999, background: 'rgba(245,158,11,.1)', color: '#b45309', border: '1px solid rgba(245,158,11,.3)' }}>⏳ Awaiting Check-out</span>}
                        {r.conditionRating && <ConditionBadge rating={r.conditionRating} />}
                        {newDamage.length > 0 && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 999, background: '#fef2f2', color: '#991b1b', border: '1px solid #fca5a5', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <DamageIcon /> {newDamage.length} new damage
                          </span>
                        )}
                        {(r.comments||[]).length > 0 && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 999, background: 'rgba(99,102,241,.1)', color: '#4338ca', border: '1px solid rgba(99,102,241,.25)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <CommentIcon /> {r.comments.length}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: C.navy, marginBottom: 5 }}>{r.vehicleName}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12, color: C.g500 }}>
                        <span>{fmtDate(r.createdAt)}</span>
                        {(r.issues||[]).length > 0
                          ? <span style={{ color: '#b45309', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}><AlertIcon />{r.issues.length} issue{r.issues.length > 1 ? 's' : ''}</span>
                          : <span style={{ color: C.success, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}><CheckIcon />Clean check-in</span>}
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><UserIcon />{r.renterName}</span>
                        {r.checkout?.damageCost && <span style={{ color: C.danger, fontWeight: 600 }}>₱{parseFloat(r.checkout.damageCost).toLocaleString()} damage</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 12 }}>
                      <button onClick={e => { e.stopPropagation(); handleDelete(r.id); }} style={{ background: 'none', border: '1px solid transparent', color: C.danger, padding: '6px 8px', borderRadius: C.r2, cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all .14s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#fca5a5'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none';    e.currentTarget.style.borderColor = 'transparent'; }}>
                        <TrashIcon />
                      </button>
                      <span style={{ color: C.g400, display: 'flex' }}><ChevronRIcon /></span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.g100}` }}>
            <button onClick={onClose} style={{ padding: '9px 22px', border: `1.5px solid ${C.g200}`, borderRadius: C.r2, background: '#fff', color: C.g700, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Close</button>
          </div>
        </>
      )}

      {view === 'detail' && sel && (
        <DetailView report={sel} ownerName={ownerName}
          onEdit={() => setView('edit-checkin')}
          onAddCheckout={() => setView('add-checkout')}
          onEditCheckout={() => setView('edit-checkout')}
          onBack={backToList}
          onUpdateSignatures={handleSigs}
          onReply={handleReply}
        />
      )}

      {view === 'edit-checkin' && sel && (
        <ReportForm initial={sel} subtitle="Update the check-in condition record for this rental."
          onSave={handleSaveCI} onCancel={() => setView('detail')} />
      )}

      {view === 'add-checkout' && sel && (
        <ReportForm
          initial={{ ...sel, issues: [], notes: '', odometer: '', fuelLevel: '', conditionRating: '', photos: [], customLabels: sel.customLabels }}
          subtitle="Record the vehicle condition upon return."
          isCheckout checkinIssues={sel.issues || []}
          onSave={handleAddCO} onCancel={() => setView('detail')} />
      )}

      {view === 'edit-checkout' && sel && (
        <ReportForm
          initial={{ ...sel.checkout, vehicleName: sel.vehicleName, renterName: sel.renterName, startDate: sel.startDate, endDate: sel.endDate, amount: sel.amount }}
          subtitle="Update the check-out condition record for this rental."
          isCheckout checkinIssues={sel.issues || []}
          onSave={handleSaveCO} onCancel={() => setView('detail')} />
      )}
    </>
  );

  // If displayInPanel is true, render content directly without Modal wrapper
  if (displayInPanel) {
    return content;
  }

  // Otherwise, render with Modal wrapper (for backward compatibility)
  return (
    <Modal isOpen={isOpen} onClose={() => { onClose(); setView('list'); setSel(null); }} title={titleMap[view] || 'Log Book'} size="xlarge">
      {content}
    </Modal>
  );
}