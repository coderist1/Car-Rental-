import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { realtimeManager, apiRequest } from '../lib/api';
import {
  fromApiReport,
  toApiPayload,
  updatesToApiPatch,
} from '../utils/logReportUtils';

const LogReportContext = createContext(null);
const LOG_REPORT_BASE_PATHS = ['/api/logreports/', '/api/log-reports/'];

function isNotFoundError(error) {
  const message = String(error?.message || error || '');
  return message.includes('Not Found') || message.includes('404');
}

async function requestLogReport(resourcePath = '', options = {}) {
  let lastError = null;
  for (const basePath of LOG_REPORT_BASE_PATHS) {
    try {
      return await apiRequest(`${basePath}${resourcePath}`, options);
    } catch (error) {
      lastError = error;
      if (!isNotFoundError(error)) throw error;
    }
  }
  throw lastError || new Error('Log report request failed');
}

function normalizeReportsResponse(data) {
  if (!Array.isArray(data)) return [];
  return data
    .filter((item) => item.type !== 'feedback' && item.type !== 'damage')
    .map(fromApiReport);
}

function upsertReport(list, report) {
  if (!report) return list;
  const normalized = fromApiReport(report);
  const reportId = String(normalized.id);
  const next = list.filter((item) => String(item.id) !== reportId);
  return [...next, normalized];
}

export function LogReportProvider({ children }) {
  const [reports, setReports] = useState([]);

  const loadReports = useCallback(async () => {
    try {
      const data = await requestLogReport();
      setReports(normalizeReportsResponse(data));
    } catch (e) {
      console.error('Error loading log reports:', e);
      setReports([]);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  useEffect(() => {
    const onCreate = ({ payload }) => {
      if (!payload || payload.type === 'feedback' || payload.type === 'damage') return;
      setReports((prev) => upsertReport(prev, payload));
    };
    const onUpdate = ({ id, payload }) => {
      if (payload?.type === 'feedback' || payload?.type === 'damage') return;
      setReports((prev) => upsertReport(prev.filter((r) => String(r.id) !== String(id)), payload));
    };
    const onDelete = ({ id }) => {
      setReports((prev) => prev.filter((r) => String(r.id) !== String(id)));
    };

    const offCreate = realtimeManager.on('logreport_created', onCreate);
    const offUpdate = realtimeManager.on('logreport_updated', onUpdate);
    const offDelete = realtimeManager.on('logreport_deleted', onDelete);

    return () => {
      offCreate();
      offUpdate();
      offDelete();
    };
  }, []);

  const createCheckin = useCallback(async (rental) => {
    const payload = toApiPayload({
      type: 'checkin',
      rental: {
        ...rental,
        rentalId: rental.rentalId ?? rental.id,
        renterEmail: rental.renterEmail,
      },
      checkin: {
        issues: [],
        notes: '',
        odometer: '',
        fuel: '',
        photos: [],
      },
    });

    const createdReport = await requestLogReport('', { method: 'POST', body: payload });
    const normalized = fromApiReport(createdReport);
    setReports((prev) => upsertReport(prev, normalized));
    return normalized;
  }, []);

  const editCheckin = useCallback(async (id, updates) => {
    const existing = reports.find((r) => String(r.id) === String(id));
    const patch = updatesToApiPatch({ checkin: updates }, existing);
    const updatedReport = await requestLogReport(`${id}/`, { method: 'PATCH', body: patch });
    const normalized = fromApiReport(updatedReport);
    setReports((prev) => upsertReport(prev.filter((r) => String(r.id) !== String(id)), normalized));
    return normalized;
  }, [reports]);

  const addCheckoutReport = useCallback(async (checkinId, data) => {
    let updatedReport;
    try {
      updatedReport = await requestLogReport(`${checkinId}/checkout/`, {
        method: 'POST',
        body: { ...data, createdAt: new Date().toISOString() },
      });
    } catch {
      updatedReport = await requestLogReport(`${checkinId}/`, {
        method: 'PATCH',
        body: { checkout: { ...data, createdAt: new Date().toISOString() } },
      });
    }
    const normalized = fromApiReport(updatedReport);
    setReports((prev) => upsertReport(prev.filter((r) => String(r.id) !== String(checkinId)), normalized));
    return normalized;
  }, []);

  const editCheckout = useCallback(async (checkinId, updates) => {
    const updatedReport = await requestLogReport(`${checkinId}/`, {
      method: 'PATCH',
      body: { checkout: updates },
    });
    const normalized = fromApiReport(updatedReport);
    setReports((prev) => upsertReport(prev.filter((r) => String(r.id) !== String(checkinId)), normalized));
    return normalized;
  }, []);

  const removeReport = useCallback(async (id) => {
    await requestLogReport(`${id}/`, { method: 'DELETE' });
    setReports((prev) => prev.filter((r) => String(r.id) !== String(id)));
  }, []);

  const postComment = useCallback(async (reportId, comment) => {
    const payload = {
      author: comment.author || comment.name || 'Anonymous',
      message: comment.message || comment.text || '',
    };
    const updatedReport = await requestLogReport(`${reportId}/comments/`, {
      method: 'POST',
      body: payload,
    });
    const normalized = fromApiReport(updatedReport);
    setReports((prev) => upsertReport(prev.filter((r) => String(r.id) !== String(reportId)), normalized));
    return normalized;
  }, []);

  return (
    <LogReportContext.Provider value={{
      reports,
      refresh: loadReports,
      createCheckin,
      editCheckin,
      addCheckoutReport,
      editCheckout,
      removeReport,
      postComment,
      getReportsForVehicle: useCallback((vehicleId) => reports.filter((r) => String(r.vehicleId || r.rental?.vehicleId) === String(vehicleId)), [reports]),
      getReportsForRental: useCallback((rentalId) => reports.filter((r) => String(r.rentalId || r.rental?.rentalId) === String(rentalId)), [reports]),
    }}>
      {children}
    </LogReportContext.Provider>
  );
}

export function useLogReport() {
  const ctx = useContext(LogReportContext);
  if (!ctx) {
    console.error('[LogReport] useLogReport() called outside <LogReportProvider>.');
    return {
      reports: [],
      refresh: () => {},
      createCheckin: async () => null,
      editCheckin: async () => null,
      addCheckoutReport: async () => null,
      editCheckout: async () => null,
      removeReport: async () => {},
      postComment: async () => null,
      getReportsForVehicle: () => [],
      getReportsForRental: () => [],
    };
  }
  return ctx;
}

export default LogReportContext;
