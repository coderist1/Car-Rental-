const LOG_KEY = 'logReports';

export function loadLogReports() {
  try { return JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); }
  catch (e) { return []; }
}

export function saveLogReports(list) {
  try { localStorage.setItem(LOG_KEY, JSON.stringify(list)); } catch (e) {}
}

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