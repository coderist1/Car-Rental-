const LOG_KEY = 'logReports';

// ✅ Simple approach: Just use the backend URL directly
const API_BASE = 'http://127.0.0.1:8000';

// ============================================
// LocalStorage Fallback Functions
// ============================================

export function loadLogReports() {
  try { return JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); }
  catch (e) { return []; }
}

export function saveLogReports(list) {
  try { localStorage.setItem(LOG_KEY, JSON.stringify(list)); } catch (e) {}
}

// ============================================
// API Functions (Primary - Database)
// ============================================

/**
 * Fetch all log reports from backend API
 */
export async function fetchLogReports() {
  try {
    const response = await fetch(`${API_BASE}/api/logreports`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn('Failed to fetch reports from API, falling back to localStorage:', error);
    return loadLogReports();
  }
}

/**
 * Create a new log report via API
 */
export async function createLogReportAPI(data) {
  try {
    const response = await fetch(`${API_BASE}/api/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: data.type || 'checkin',
        vehicleId: data.vehicleId,
        vehicleName: data.vehicleName,
        rentalId: data.rentalId,
        renterName: data.renterName,
        startDate: data.startDate,
        endDate: data.endDate,
        amount: data.amount || 0,
        issues: data.issues || [],
        notes: data.notes || '',
        odometer: data.odometer || '',
        fuelLevel: data.fuelLevel || '',
        photos: data.photos || [],
        customLabels: data.customLabels || {},
        checkout: data.checkout || '',
        comments: data.comments || [],
      }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to create report via API:', error);
    // Fallback to localStorage
    return createLogReport(data);
  }
}

// ============================================
// LocalStorage Fallback Functions (Kept for compatibility)
// ============================================

export function createLogReport(data) {
  const all = loadLogReports();
  const report = {
    id: `log-${Date.now()}`,
    ...data,
    photos: data.photos || [],
    comments: [],
    createdAt: new Date().toISOString(),
  };
  all.push(report);
  saveLogReports(all);
  return report;
}

export function updateLogReport(id, updates) {
  const all = loadLogReports().map(r => r.id === id ? { ...r, ...updates } : r);
  saveLogReports(all);
}

export function deleteLogReport(id) {
  saveLogReports(loadLogReports().filter(r => r.id !== id));
}

export function addCheckout(checkinId, checkoutData) {
  const all = loadLogReports();
  const idx = all.findIndex(r => r.id === checkinId);
  if (idx === -1) return;
  all[idx].checkout = {
    photos: [],
    ...checkoutData,
    createdAt: new Date().toISOString(),
  };
  saveLogReports(all);
}

export function addComment(reportId, comment) {
  const all = loadLogReports().map(r => {
    if (r.id !== reportId) return r;
    return {
      ...r,
      comments: [
        ...(r.comments || []),
        {
          id: `cmt-${Date.now()}`,
          ...comment,
          createdAt: new Date().toISOString(),
        },
      ],
    };
  });
  saveLogReports(all);
}

export function getReportsForVehicle(vehicleId) {
  return loadLogReports().filter(r => String(r.vehicleId) === String(vehicleId));
}

export function getReportsForRental(rentalId) {
  return loadLogReports().filter(r => String(r.rentalId) === String(rentalId));
}