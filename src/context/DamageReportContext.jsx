import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { realtimeManager, apiRequest } from '../lib/api';

const DamageReportContext = createContext(null);

const DAMAGE_REPORT_BASE_PATHS = ['/api/damage-reports/', '/api/damage_reports/'];

function normalizeDamageReport(r) {
  if (!r) return r;
  return {
    ...r,
    id: r.id ?? r._id ?? r.pk,
    bookingId: r.bookingId ?? r.booking_id ?? r.booking,
    vehicleId: r.vehicleId ?? r.vehicle_id ?? r.vehicle,
    renterId: r.renterId ?? r.renter_id ?? r.renter,
    ownerId: r.ownerId ?? r.owner_id ?? r.owner,
    vehicleName: r.vehicleName ?? r.vehicle_name ?? 'Vehicle',
    renterName: r.renterName ?? r.renter_name ?? '',
    ownerName: r.ownerName ?? r.owner_name ?? '',
    discoveredDate: r.discoveredDate ?? r.discovered_date,
    reportedDate: r.reportedDate ?? r.reported_date,
    acknowledgedDate: r.acknowledgedDate ?? r.acknowledged_date,
    resolvedDate: r.resolvedDate ?? r.resolved_date,
    estimatedRepairCost: r.estimatedRepairCost ?? r.estimated_repair_cost,
    fuelLevel: r.fuelLevel ?? r.fuel_level,
  };
}

function normalizeReportsResponse(data) {
  if (Array.isArray(data)) {
    return data.map(normalizeDamageReport);
  }
  if (data && Array.isArray(data.results)) {
    return data.results.map(normalizeDamageReport);
  }
  return [];
}

function upsertReport(list, report) {
  if (!report) return list;
  const normalized = normalizeDamageReport(report);
  const reportId = String(normalized.id);
  const next = list.filter((item) => String(item.id) !== reportId);
  return [...next, normalized];
}

function isNotFoundError(error) {
  const message = String(error?.message || error || '');
  return message.includes('Not Found') || message.includes('404');
}

async function requestDamageReport(resourcePath = '', options = {}) {
  let lastError = null;

  for (const basePath of DAMAGE_REPORT_BASE_PATHS) {
    try {
      return await apiRequest(`${basePath}${resourcePath}`, options);
    } catch (error) {
      lastError = error;
      if (!isNotFoundError(error)) {
        throw error;
      }
    }
  }

  throw lastError || new Error('Damage report request failed');
}

export function DamageReportProvider({ children }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const didInitialize = useRef(false);

  // Load all damage reports
  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await requestDamageReport();
      setReports(normalizeReportsResponse(data));
    } catch (e) {
      console.error('Error loading damage reports:', e);
      setError(e.message);
      // Local fallback
      const localData = localStorage.getItem('car_rental_damage_reports_v2');
      if (localData) {
        try { setReports(JSON.parse(localData)); } catch(err) { setReports([]); }
      } else {
        setReports([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (didInitialize.current) return;
    didInitialize.current = true;
    loadReports();
  }, [loadReports]);

  // Subscribe to real-time updates
  useEffect(() => {
    realtimeManager.connect();

    const unsubscribeCreate = realtimeManager.on('damage_reported', ({ payload }) => {
      setReports((prev) => upsertReport(prev, payload));
    });

    const unsubscribeUpdate = realtimeManager.on('damage_updated', ({ id, payload }) => {
      setReports((prev) => upsertReport(prev.filter((r) => String(r.id) !== String(id)), payload));
    });

    const unsubscribeDelete = realtimeManager.on('damage_deleted', ({ id }) => {
      setReports((prev) => prev.filter((r) => String(r.id) !== String(id)));
    });

    return () => {
      unsubscribeCreate();
      unsubscribeUpdate();
      unsubscribeDelete();
    };
  }, []);

  // Create damage report
  const createDamageReport = useCallback(async (formData) => {
    try {
      const createdReport = await requestDamageReport('', {
        method: 'POST',
        body: formData,
      });
      setReports((prev) => {
        const next = upsertReport(prev, createdReport);
        localStorage.setItem('car_rental_damage_reports_v2', JSON.stringify(next));
        return next;
      });
      return createdReport;
    } catch (error) {
      console.error('Error creating damage report:', error);
      // Local fallback
      const newReport = {
        id: 'DR-' + Date.now(),
        status: 'submitted',
        createdAt: new Date().toISOString(),
        photos: []
      };
      if (formData && typeof formData.entries === 'function') {
        const previews = formData.getAll('photoPreviews');
        const photoFiles = formData.getAll('photos');
        
        if (previews && previews.length > 0) {
          newReport.photos = previews;
        } else if (photoFiles && photoFiles.length > 0) {
          newReport.photos = photoFiles.map(val => typeof val === 'string' ? val : (val instanceof File ? URL.createObjectURL(val) : val));
        }

        for (let [key, value] of formData.entries()) {
          if (key !== 'photos' && key !== 'photoPreviews') {
            newReport[key] = value;
          }
        }
      } else if (typeof formData === 'object') {
        Object.assign(newReport, formData);
      }
      setReports((prev) => {
        const next = [newReport, ...prev];
        localStorage.setItem('car_rental_damage_reports_v2', JSON.stringify(next));
        return next;
      });
      return newReport;
    }
  }, []);

  // Update damage report (for drafts)
  const updateDamageReport = useCallback(async (id, updates) => {
    try {
      const updatedReport = await requestDamageReport(`${id}/`, {
        method: 'PATCH',
        body: updates,
      });
      setReports((prev) => {
        const next = upsertReport(prev.filter((r) => String(r.id) !== String(id)), updatedReport);
        localStorage.setItem('car_rental_damage_reports_v2', JSON.stringify(next));
        return next;
      });
      return updatedReport;
    } catch (error) {
      console.error(`Error updating damage report ${id}:`, error);
      setReports(prev => {
        const next = prev.map(r => String(r.id) === String(id) ? { ...r, ...updates } : r);
        localStorage.setItem('car_rental_damage_reports_v2', JSON.stringify(next));
        return next;
      });
      return { id, ...updates };
    }
  }, []);

  // Delete damage report
  const deleteDamageReport = useCallback(async (id) => {
    try {
      await requestDamageReport(`${id}/`, { method: 'DELETE' });
      setReports((prev) => {
        const next = prev.filter((r) => String(r.id) !== String(id));
        localStorage.setItem('car_rental_damage_reports_v2', JSON.stringify(next));
        return next;
      });
    } catch (error) {
      console.error(`Error deleting damage report ${id}:`, error);
      setReports((prev) => {
        const next = prev.filter((r) => String(r.id) !== String(id));
        localStorage.setItem('car_rental_damage_reports_v2', JSON.stringify(next));
        return next;
      });
    }
  }, []);

  // Upload photo to report
  const uploadPhotoToReport = useCallback(async (reportId, photoFormData) => {
    try {
      const result = await requestDamageReport(`${reportId}/photos/`, {
        method: 'POST',
        body: photoFormData,
      });
      return result;
    } catch (error) {
      console.error(`Error uploading photo to report ${reportId}:`, error);
      const photo = photoFormData.get ? photoFormData.get('image') || photoFormData.get('photo') : null;
      const url = photo instanceof File ? URL.createObjectURL(photo) : photo;
      if (url) {
        setReports(prev => {
          const next = prev.map(r => String(r.id) === String(reportId) ? { ...r, photos: [...(r.photos || []), url] } : r);
          localStorage.setItem('car_rental_damage_reports_v2', JSON.stringify(next));
          return next;
        });
      }
      return { url };
    }
  }, []);

  // Owner acknowledges report
  const acknowledgeReport = useCallback(async (reportId) => {
    try {
      const updatedReport = await requestDamageReport(`${reportId}/acknowledge/`, {
        method: 'POST',
      });
      setReports((prev) => {
        const next = upsertReport(prev.filter((r) => String(r.id) !== String(reportId)), updatedReport);
        localStorage.setItem('car_rental_damage_reports_v2', JSON.stringify(next));
        return next;
      });
      return updatedReport;
    } catch (error) {
      console.error(`Error acknowledging report ${reportId}:`, error);
      setReports(prev => {
        const next = prev.map(r => String(r.id) === String(reportId) ? { ...r, status: 'acknowledged', acknowledgedDate: new Date().toISOString() } : r);
        localStorage.setItem('car_rental_damage_reports_v2', JSON.stringify(next));
        return next;
      });
      return { id: reportId, status: 'acknowledged' };
    }
  }, []);

  // Owner resolves report
  const resolveReport = useCallback(async (reportId, resolutionNotes = '') => {
    try {
      const updatedReport = await requestDamageReport(`${reportId}/resolve/`, {
        method: 'POST',
        body: { resolutionNotes },
      });
      setReports((prev) => {
        const next = upsertReport(prev.filter((r) => String(r.id) !== String(reportId)), updatedReport);
        localStorage.setItem('car_rental_damage_reports_v2', JSON.stringify(next));
        return next;
      });
      return updatedReport;
    } catch (error) {
      console.error(`Error resolving report ${reportId}:`, error);
      setReports(prev => {
        const next = prev.map(r => String(r.id) === String(reportId) ? { ...r, status: 'resolved', resolvedDate: new Date().toISOString(), resolutionNotes } : r);
        localStorage.setItem('car_rental_damage_reports_v2', JSON.stringify(next));
        return next;
      });
      return { id: reportId, status: 'resolved' };
    }
  }, []);

  // Get reports for a specific vehicle (owner view)
  const getVehicleReports = useCallback((vehicleId) => {
    return reports.filter((r) => Number(r.vehicleId) === Number(vehicleId));
  }, [reports]);

  // Get reports for a specific rental (renter view)
  const getBookingReports = useCallback((bookingId) => {
    return reports.filter((r) => Number(r.bookingId) === Number(bookingId));
  }, [reports]);

  // Get unreviewed reports for owner
  const getUnreviewedReports = useCallback((ownerId) => {
    return reports.filter(
      (r) => Number(r.ownerId) === Number(ownerId) && r.status === 'submitted'
    );
  }, [reports]);

  // Filter reports by status
  const getReportsByStatus = useCallback((status) => {
    return reports.filter((r) => r.status === status);
  }, [reports]);

  // Filter reports by severity
  const getReportsBySeverity = useCallback((severity) => {
    return reports.filter((r) => r.severity === severity);
  }, [reports]);

  const value = {
    reports,
    loading,
    error,
    createDamageReport,
    updateDamageReport,
    deleteDamageReport,
    uploadPhotoToReport,
    acknowledgeReport,
    resolveReport,
    loadReports,
    getVehicleReports,
    getBookingReports,
    getUnreviewedReports,
    getReportsByStatus,
    getReportsBySeverity,
  };

  return (
    <DamageReportContext.Provider value={value}>
      {children}
    </DamageReportContext.Provider>
  );
}

export function useDamageReports() {
  const context = useContext(DamageReportContext);
  if (!context) {
    throw new Error('useDamageReports must be used within DamageReportProvider');
  }
  return context;
}

// Backwards-compatible aliases
export const useDamageReport = useDamageReports;
export const useDamageReportContext = useDamageReports;
