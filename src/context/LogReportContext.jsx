import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { realtimeManager } from '../lib/api';
import {
  loadLogReports,
  saveLogReports,
  createLogReport,
  updateLogReport,
  deleteLogReport,
  addCheckout,
  addComment,
  getReportsForVehicle,
  getReportsForRental,
} from '../hooks/useLogReport';

const LogReportContext = createContext(null);

export function LogReportProvider({ children }) {
  const [reports, setReports] = useState(() => loadLogReports());

  const refresh = useCallback(() => setReports(loadLogReports()), []);

  // Subscribe to real-time log report updates
  useEffect(() => {
    const unsubscribeReportCreate = realtimeManager.on('logreport_created', ({ payload }) => {
      const all = loadLogReports();
      if (!all.find((r) => r.id === payload.id)) {
        saveLogReports([...all, payload]);
        refresh();
      }
    });

    const unsubscribeReportUpdate = realtimeManager.on('logreport_updated', ({ id, payload }) => {
      const all = loadLogReports();
      const idx = all.findIndex((r) => r.id === Number(id));
      if (idx !== -1) {
        all[idx] = payload;
        saveLogReports(all);
        refresh();
      }
    });

    const unsubscribeReportDelete = realtimeManager.on('logreport_deleted', ({ id }) => {
      const all = loadLogReports();
      const filtered = all.filter((r) => r.id !== Number(id));
      if (filtered.length !== all.length) {
        saveLogReports(filtered);
        refresh();
      }
    });

    return () => {
      unsubscribeReportCreate();
      unsubscribeReportUpdate();
      unsubscribeReportDelete();
    };
  }, [refresh]);

  const createCheckin = useCallback((rental) => {
    const report = createLogReport({
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
    });
    refresh();
    return report;
  }, [refresh]);

  const editCheckin = useCallback((id, updates) => {
    updateLogReport(id, updates);
    refresh();
  }, [refresh]);

  const addCheckoutReport = useCallback((checkinId, data) => {
    addCheckout(checkinId, data);
    refresh();
  }, [refresh]);

  const editCheckout = useCallback((checkinId, updates) => {
    const all = loadLogReports();
    const idx = all.findIndex(r => r.id === checkinId);
    if (idx === -1) return;
    all[idx].checkout = { ...all[idx].checkout, ...updates };
    saveLogReports(all);
    refresh();
  }, [refresh]);

  const removeReport = useCallback((id) => {
    deleteLogReport(id);
    refresh();
  }, [refresh]);

  const postComment = useCallback((reportId, comment) => {
    addComment(reportId, comment);
    refresh();
  }, [refresh]);

  return (
    <LogReportContext.Provider value={{
      reports,
      refresh,
      createCheckin,
      editCheckin,
      addCheckoutReport,
      editCheckout,
      removeReport,
      postComment,
      getReportsForVehicle,
      getReportsForRental,
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