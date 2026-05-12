import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { realtimeManager, apiRequest } from '../lib/api'; // Import apiRequest
import {
  loadLogReports as localLoad,
  createLogReport as localCreate,
  updateLogReport as localUpdate,
  deleteLogReport as localDelete,
  addCheckout as localAddCheckout,
  addComment as localAddComment
} from '../hooks/useLogReport';

const LogReportContext = createContext(null);

// Keep ONLY the correct URL path that matches your Django urls.py
const LOG_REPORT_BASE_PATHS = ['/api/log_reports/', '/api/reports/']; 

function normalizeReportsResponse(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (data && Array.isArray(data.results)) {
    return data.results;
  }

  return [];
}

function upsertReport(list, report) {
  if (!report) {
    return list;
  }

  const reportId = String(report.id);
  const next = list.filter((item) => String(item.id) !== reportId);
  return [...next, report];
}

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
      if (!isNotFoundError(error)) {
        throw error;
      }
    }
  }

  throw lastError || new Error('Log report request failed');
}

export function LogReportProvider({ children }) {
  const [reports, setReports] = useState([]); // Initialize as empty array

  // New function to load log reports from API
  const loadReports = useCallback(async () => {
    try {
      const data = await requestLogReport();
      setReports(normalizeReportsResponse(data));
    } catch (e) {
      if (isNotFoundError(e)) {
        console.warn('Log reports API not found. Falling back to local storage.');
        setReports(localLoad());
      } else {
        console.error('Error loading log reports:', e);
        setReports([]);
      }
    }
  }, []);

  // Initial load of reports
  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Subscribe to real-time log report updates
  useEffect(() => {
    realtimeManager.connect(); // Ensure connection is established

    const unsubscribeReportCreate = realtimeManager.on('logreport_created', ({ payload }) => {
      setReports((prev) => upsertReport(prev, payload));
    });

    const unsubscribeReportUpdate = realtimeManager.on('logreport_updated', ({ id, payload }) => {
      setReports((prev) => upsertReport(prev.filter((r) => String(r.id) !== String(id)), payload));
    });

    const unsubscribeReportDelete = realtimeManager.on('logreport_deleted', ({ id }) => {
      setReports((prev) => prev.filter((r) => String(r.id) !== String(id)));
    });

    return () => {
      unsubscribeReportCreate();
      unsubscribeReportUpdate();
      unsubscribeReportDelete();
    };
  }, []); // Dependencies for this useEffect should be empty as it sets up listeners once.

  const createCheckin = useCallback(async (rental) => {
    try {
      const newReportData = {
      type: 'checkin',
      vehicleId:   rental.vehicleId,
      vehicleName: rental.vehicleName,
      rentalId:    rental.id,
      renterName:  rental.renterName,
      startDate:   rental.startDate,
      endDate:     rental.endDate,
      amount:      rental.amount,
      issues:       [],
      notes:        '',
      odometer:     '',
      fuelLevel:    '',
      photos:       [],
      customLabels: {},
        // Add ownerId if needed by backend
      };
      const createdReport = await requestLogReport('', {
        method: 'POST',
        body: newReportData,
      });
      // The real-time event will update the state, but we can add it directly for immediate feedback
      setReports((prev) => upsertReport(prev, createdReport));
      return createdReport;
    } catch (error) {
      if (isNotFoundError(error)) {
        const localReport = localCreate(newReportData);
        setReports((prev) => upsertReport(prev, localReport));
        return localReport;
      }
      console.error('Error creating checkin report:', error);
      return null;
    }
  }, []);

  const editCheckin = useCallback(async (id, updates) => {
    try {
      const updatedReport = await requestLogReport(`${id}/`, {
        method: 'PATCH',
        body: updates,
      });
      setReports((prev) => upsertReport(prev.filter((r) => String(r.id) !== String(id)), updatedReport));
      return updatedReport;
    } catch (error) {
      if (isNotFoundError(error)) {
        localUpdate(id, updates);
        setReports(localLoad());
        return updates;
      }
      console.error(`Error editing checkin report ${id}:`, error);
      return null;
    }
  }, []);

  const addCheckoutReport = useCallback(async (checkinId, data) => {
    try {
      let updatedReport;
      try {
        updatedReport = await requestLogReport(`${checkinId}/checkout/`, {
          method: 'POST',
          body: data,
        });
      } catch {
        updatedReport = await requestLogReport(`${checkinId}/`, {
          method: 'PATCH',
          body: { checkout: data },
        });
      }
      setReports((prev) => upsertReport(prev.filter((r) => String(r.id) !== String(checkinId)), updatedReport));
      return updatedReport;
    } catch (error) {
      if (isNotFoundError(error)) {
        localAddCheckout(checkinId, data);
        setReports(localLoad());
        return data;
      }
      console.error(`Error adding checkout report for checkin ${checkinId}:`, error);
      return null;
    }
  }, []);

  const editCheckout = useCallback(async (checkinId, updates) => {
    try {
      const updatedReport = await requestLogReport(`${checkinId}/`, {
        method: 'PATCH',
        body: { checkout: updates },
      });
      setReports((prev) => upsertReport(prev.filter((r) => String(r.id) !== String(checkinId)), updatedReport));
      return updatedReport;
    } catch (error) {
      if (isNotFoundError(error)) {
        const all = localLoad();
        const rep = all.find(r => String(r.id) === String(checkinId));
        if (rep) {
          localUpdate(checkinId, { checkout: { ...rep.checkout, ...updates } });
        }
        setReports(localLoad());
        return updates;
      }
      console.error(`Error editing checkout for checkin ${checkinId}:`, error);
      return null;
    }
  }, []);

  const removeReport = useCallback(async (id) => {
    try {
      await requestLogReport(`${id}/`, {
        method: 'DELETE',
      });
      setReports((prev) => prev.filter((r) => String(r.id) !== String(id)));
    } catch (error) {
      if (isNotFoundError(error)) {
        localDelete(id);
        setReports(localLoad());
        return;
      }
      console.error(`Error removing report ${id}:`, error);
    }
  }, []);

  const postComment = useCallback(async (reportId, comment) => {
    try {
      let updatedReport;
      try {
        updatedReport = await requestLogReport(`${reportId}/comments/`, {
          method: 'POST',
          body: comment,
        });
      } catch {
        updatedReport = await requestLogReport(`${reportId}/`, {
          method: 'PATCH',
          body: {
            commentsAppend: {
              ...comment,
              createdAt: new Date().toISOString(),
            },
          },
        });
      }
      setReports((prev) => upsertReport(prev.filter((r) => String(r.id) !== String(reportId)), updatedReport));
      return updatedReport;
    } catch (error) {
      if (isNotFoundError(error)) {
        localAddComment(reportId, comment);
        setReports(localLoad());
        return comment;
      }
      console.error(`Error posting comment for report ${reportId}:`, error);
      return null;
    }
  }, []);

  return (
    <LogReportContext.Provider value={{
      reports,
      refresh: loadReports, // refresh now triggers a full reload from API
      createCheckin,
      editCheckin,
      addCheckoutReport,
      editCheckout,
      removeReport,
      postComment,
      getReportsForVehicle: useCallback((vehicleId) => reports.filter(r => String(r.vehicleId || r.vehicle) === String(vehicleId)), [reports]),
      getReportsForRental: useCallback((rentalId) => reports.filter(r => String(r.rentalId || r.rental) === String(rentalId)), [reports]),
    }}>
      {children}
    </LogReportContext.Provider>
  );
}

export function useLogReport() {
  const ctx = useContext(LogReportContext);
  if (!ctx) {
    console.error('[LogReport] useLogReport() called outside <LogReportProvider>. Add <LogReportProvider> to App.jsx.');
    return {
      reports: [],
      refresh: () => {},
      createCheckin: () => {},
      editCheckin: () => {},
      addCheckoutReport: () => {},
      editCheckout: () => {},
      removeReport: () => {},
      postComment: () => {},
      getReportsForVehicle: () => [],
      getReportsForRental: () => [],
    };
  }
  return ctx;
}

export default LogReportContext;