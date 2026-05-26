import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { realtimeManager, apiRequest } from '../lib/api';
import {
  fromApiDamageReport,
  toApiDamagePayload,
  toApiDamagePatch,
} from '../utils/damageReportUtils';

const DamageReportContext = createContext(null);

const DAMAGE_REPORT_BASE_PATHS = ['/api/damage-reports/', '/api/damage_reports/'];
const LOG_REPORT_BASE_PATHS = ['/api/logreports/', '/api/log-reports/'];

function normalizeDamageReport(r) {
  return fromApiDamageReport(r);
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
      if (!isNotFoundError(error)) throw error;
    }
  }

  throw lastError || new Error('Damage report request failed');
}

async function patchLogReport(reportId, body) {
  let lastError = null;

  for (const basePath of [...DAMAGE_REPORT_BASE_PATHS, ...LOG_REPORT_BASE_PATHS]) {
    try {
      return await apiRequest(`${basePath}${reportId}/`, {
        method: 'PATCH',
        body,
      });
    } catch (error) {
      lastError = error;
      if (!isNotFoundError(error)) throw error;
    }
  }

  throw lastError || new Error('Failed to update damage report');
}

function readLocalDamageReports() {
  try {
    const localData = localStorage.getItem('car_rental_damage_reports_v2');
    return localData ? JSON.parse(localData) : [];
  } catch {
    return [];
  }
}

function writeLocalDamageReports(nextReports) {
  localStorage.setItem('car_rental_damage_reports_v2', JSON.stringify(nextReports));
}

function isDamagePayload(payload) {
  return payload?.type === 'damage' || payload?.customLabels?.title;
}

export function DamageReportProvider({ children }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const didInitialize = useRef(false);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await requestDamageReport();
      setReports(normalizeReportsResponse(data));
    } catch (e) {
      console.error('Error loading damage reports:', e);
      setError(e.message);
      setReports(readLocalDamageReports().map(normalizeDamageReport));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (didInitialize.current) return;
    didInitialize.current = true;
    loadReports();
  }, [loadReports]);

  useEffect(() => {
    realtimeManager.connect();

    const handleRealtime = ({ payload }) => {
      if (!isDamagePayload(payload)) return;
      setReports((prev) => upsertReport(prev, payload));
    };

    const handleDelete = ({ id, payload }) => {
      if (payload && !isDamagePayload(payload)) return;
      setReports((prev) => prev.filter((r) => String(r.id) !== String(id)));
    };

    const unsubCreate = realtimeManager.on('logreport_created', handleRealtime);
    const unsubUpdate = realtimeManager.on('logreport_updated', ({ payload }) => handleRealtime({ payload }));
    const unsubDelete = realtimeManager.on('logreport_deleted', handleDelete);
    const unsubLegacyCreate = realtimeManager.on('damage_reported', handleRealtime);
    const unsubLegacyUpdate = realtimeManager.on('damage_updated', ({ payload }) => handleRealtime({ payload }));
    const unsubLegacyDelete = realtimeManager.on('damage_deleted', handleDelete);

    return () => {
      unsubCreate();
      unsubUpdate();
      unsubDelete();
      unsubLegacyCreate();
      unsubLegacyUpdate();
      unsubLegacyDelete();
    };
  }, []);

  const createDamageReport = useCallback(async (input, user = null, photoItems = []) => {
    const payload = toApiDamagePayload(input, user, photoItems);

    try {
      const createdReport = await requestDamageReport('', {
        method: 'POST',
        body: payload,
      });
      setReports((prev) => {
        const next = upsertReport(prev, createdReport);
        writeLocalDamageReports(next);
        return next;
      });
      return normalizeDamageReport(createdReport);
    } catch (error) {
      console.error('Error creating damage report:', error);
      const fallback = normalizeDamageReport({
        id: `DR-${Date.now()}`,
        ...payload,
        ...payload.customLabels,
        status: payload.customLabels?.status || 'submitted',
        createdAt: new Date().toISOString(),
      });
      setReports((prev) => {
        const next = [fallback, ...prev];
        writeLocalDamageReports(next);
        return next;
      });
      return fallback;
    }
  }, []);

  const updateDamageReport = useCallback(async (id, updates) => {
    const existing = reports.find((r) => String(r.id) === String(id));
    const mergedCustom = {
      bookingId: existing?.bookingId,
      title: existing?.title,
      description: existing?.description,
      severity: existing?.severity,
      status: existing?.status,
      location: existing?.location,
      ownerId: existing?.ownerId,
      ownerName: existing?.ownerName,
      renterId: existing?.renterId,
      estimatedRepairCost: existing?.estimatedRepairCost,
      discoveredDate: existing?.discoveredDate,
      discoveryType: existing?.type,
      acknowledgedDate: existing?.acknowledgedDate,
      resolvedDate: existing?.resolvedDate,
      resolutionNotes: existing?.resolutionNotes,
      ...(updates.customLabels || {}),
    };

    if (updates.status !== undefined) mergedCustom.status = updates.status;
    if (updates.acknowledgedDate !== undefined) mergedCustom.acknowledgedDate = updates.acknowledgedDate;
    if (updates.resolvedDate !== undefined) mergedCustom.resolvedDate = updates.resolvedDate;
    if (updates.resolutionNotes !== undefined) mergedCustom.resolutionNotes = updates.resolutionNotes;

    const patchBody = toApiDamagePatch({ ...updates, customLabels: mergedCustom });

    try {
      const updatedReport = await patchLogReport(id, patchBody);
      setReports((prev) => {
        const next = upsertReport(prev.filter((r) => String(r.id) !== String(id)), updatedReport);
        writeLocalDamageReports(next);
        return next;
      });
      return normalizeDamageReport(updatedReport);
    } catch (error) {
      console.error(`Error updating damage report ${id}:`, error);
      setReports((prev) => {
        const next = prev.map((r) => (String(r.id) === String(id) ? normalizeDamageReport({ ...r, ...updates }) : r));
        writeLocalDamageReports(next);
        return next;
      });
      return { id, ...updates };
    }
  }, []);

  const deleteDamageReport = useCallback(async (id) => {
    try {
      await requestDamageReport(`${id}/`, { method: 'DELETE' });
    } catch (error) {
      console.error(`Error deleting damage report ${id}:`, error);
    }

    setReports((prev) => {
      const next = prev.filter((r) => String(r.id) !== String(id));
      writeLocalDamageReports(next);
      return next;
    });
  }, []);

  const uploadPhotoToReport = useCallback(async (reportId, photoUrl) => {
    const existing = reports.find((r) => String(r.id) === String(reportId));
    const photos = [...(existing?.photos || []), photoUrl].filter(Boolean);
    return updateDamageReport(reportId, { photos });
  }, [reports, updateDamageReport]);

  const acknowledgeReport = useCallback(async (reportId) => {
    return updateDamageReport(reportId, {
      status: 'acknowledged',
      acknowledgedDate: new Date().toISOString(),
    });
  }, [updateDamageReport]);

  const resolveReport = useCallback(async (reportId, resolutionNotes = '') => {
    return updateDamageReport(reportId, {
      status: 'resolved',
      resolvedDate: new Date().toISOString(),
      resolutionNotes,
    });
  }, [updateDamageReport]);

  const getVehicleReports = useCallback((vehicleId) => {
    return reports.filter((r) => Number(r.vehicleId) === Number(vehicleId));
  }, [reports]);

  const getBookingReports = useCallback((bookingId) => {
    return reports.filter((r) => Number(r.bookingId) === Number(bookingId));
  }, [reports]);

  const getUnreviewedReports = useCallback((ownerId) => {
    return reports.filter(
      (r) => String(r.ownerId) === String(ownerId) && r.status === 'submitted'
    );
  }, [reports]);

  const getReportsByStatus = useCallback((status) => {
    return reports.filter((r) => r.status === status);
  }, [reports]);

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

export const useDamageReport = useDamageReports;
export const useDamageReportContext = useDamageReports;
