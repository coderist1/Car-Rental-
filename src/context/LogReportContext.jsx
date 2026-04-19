import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { realtimeManager, apiRequest } from '../lib/api'; // Import apiRequest

const LogReportContext = createContext(null);

export function LogReportProvider({ children }) {
  const [reports, setReports] = useState([]); // Initialize as empty array

  // New function to load log reports from API
  const loadReports = useCallback(async () => {
    try {
      const data = await apiRequest('/api/logreports/'); // Assuming this endpoint exists
      setReports(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error loading log reports:', e);
      setReports([]);
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
      setReports((prev) => (prev.find((r) => r.id === payload.id) ? prev : [...prev, payload]));
    });

    const unsubscribeReportUpdate = realtimeManager.on('logreport_updated', ({ id, payload }) => {
      setReports((prev) => prev.map((r) => (r.id === Number(id) ? payload : r)));
    });

    const unsubscribeReportDelete = realtimeManager.on('logreport_deleted', ({ id }) => {
      setReports((prev) => prev.filter((r) => r.id !== Number(id)));
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
      const createdReport = await apiRequest('/api/logreports/', {
        method: 'POST',
        body: newReportData,
      });
      // The real-time event will update the state, but we can add it directly for immediate feedback
      setReports((prev) => [...prev, createdReport]);
      return createdReport;
    } catch (error) {
      console.error('Error creating checkin report:', error);
      return null;
    }
  }, []);

  const editCheckin = useCallback(async (id, updates) => {
    try {
      const updatedReport = await apiRequest(`/api/logreports/${id}/`, {
        method: 'PATCH',
        body: updates,
      });
      setReports((prev) => prev.map((r) => (r.id === id ? updatedReport : r)));
      return updatedReport;
    } catch (error) {
      console.error(`Error editing checkin report ${id}:`, error);
      return null;
    }
  }, []);

  const addCheckoutReport = useCallback(async (checkinId, data) => {
    try {
      let updatedReport;
      try {
        updatedReport = await apiRequest(`/api/logreports/${checkinId}/checkout/`, {
          method: 'POST',
          body: data,
        });
      } catch {
        updatedReport = await apiRequest(`/api/logreports/${checkinId}/`, {
          method: 'PATCH',
          body: { checkout: data },
        });
      }
      setReports((prev) => prev.map((r) => (r.id === checkinId ? updatedReport : r)));
      return updatedReport;
    } catch (error) {
      console.error(`Error adding checkout report for checkin ${checkinId}:`, error);
      return null;
    }
  }, []);

  const editCheckout = useCallback(async (checkinId, updates) => {
    try {
      const updatedReport = await apiRequest(`/api/logreports/${checkinId}/`, {
        method: 'PATCH',
        body: { checkout: updates },
      });
      setReports((prev) => prev.map((r) => (r.id === checkinId ? updatedReport : r)));
      return updatedReport;
    } catch (error) {
      console.error(`Error editing checkout for checkin ${checkinId}:`, error);
      return null;
    }
  }, []);

  const removeReport = useCallback(async (id) => {
    try {
      await apiRequest(`/api/logreports/${id}/`, {
        method: 'DELETE',
      });
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error(`Error removing report ${id}:`, error);
    }
  }, []);

  const postComment = useCallback(async (reportId, comment) => {
    try {
      let updatedReport;
      try {
        updatedReport = await apiRequest(`/api/logreports/${reportId}/comments/`, {
          method: 'POST',
          body: comment,
        });
      } catch {
        updatedReport = await apiRequest(`/api/logreports/${reportId}/`, {
          method: 'PATCH',
          body: {
            commentsAppend: {
              ...comment,
              createdAt: new Date().toISOString(),
            },
          },
        });
      }
      setReports((prev) => prev.map((r) => (r.id === reportId ? updatedReport : r)));
      return updatedReport;
    } catch (error) {
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