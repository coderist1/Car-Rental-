import { useCallback } from 'react';

const DAMAGE_REPORTS_STORAGE_KEY = 'damageReports_v2';

// Local storage fallback for damage reports
export function loadDamageReports() {
  try {
    const raw = localStorage.getItem(DAMAGE_REPORTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error loading damage reports from storage:', e);
    return [];
  }
}

export function saveDamageReports(reports) {
  try {
    localStorage.setItem(DAMAGE_REPORTS_STORAGE_KEY, JSON.stringify(reports));
  } catch (e) {
    console.error('Error saving damage reports to storage:', e);
  }
}

export function createLocalDamageReport(reportData) {
  const newReport = {
    id: `LOCAL_${Date.now()}`,
    ...reportData,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    photos: [],
  };

  const reports = loadDamageReports();
  reports.push(newReport);
  saveDamageReports(reports);
  return newReport;
}

export function updateLocalDamageReport(reportId, updates) {
  const reports = loadDamageReports();
  const index = reports.findIndex((r) => String(r.id) === String(reportId));
  if (index === -1) return null;

  reports[index] = {
    ...reports[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveDamageReports(reports);
  return reports[index];
}

export function deleteLocalDamageReport(reportId) {
  const reports = loadDamageReports();
  const filtered = reports.filter((r) => String(r.id) !== String(reportId));
  saveDamageReports(filtered);
}

export function addPhotoToLocalReport(reportId, photo) {
  const reports = loadDamageReports();
  const report = reports.find((r) => String(r.id) === String(reportId));
  if (!report) return null;

  if (!report.photos) {
    report.photos = [];
  }

  const newPhoto = {
    id: `PHOTO_${Date.now()}`,
    ...photo,
    uploadedDate: new Date().toISOString(),
  };

  report.photos.push(newPhoto);
  report.updatedAt = new Date().toISOString();
  saveDamageReports(reports);
  return newPhoto;
}

export function removePhotoFromLocalReport(reportId, photoId) {
  const reports = loadDamageReports();
  const report = reports.find((r) => String(r.id) === String(reportId));
  if (!report) return false;

  report.photos = (report.photos || []).filter((p) => String(p.id) !== String(photoId));
  report.updatedAt = new Date().toISOString();
  saveDamageReports(reports);
  return true;
}

export function useDamageReportStorage() {
  const load = useCallback(() => loadDamageReports(), []);
  const create = useCallback((data) => createLocalDamageReport(data), []);
  const update = useCallback((id, updates) => updateLocalDamageReport(id, updates), []);
  const remove = useCallback((id) => deleteLocalDamageReport(id), []);
  const addPhoto = useCallback((reportId, photo) => addPhotoToLocalReport(reportId, photo), []);
  const removePhoto = useCallback((reportId, photoId) => removePhotoFromLocalReport(reportId, photoId), []);

  return { load, create, update, remove, addPhoto, removePhoto };
}
