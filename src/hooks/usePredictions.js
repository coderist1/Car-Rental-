import { useCallback, useState } from 'react';
import { apiRequest } from '../lib/api';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(isoDate, days) {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function usePredictions() {
  const [demandResult, setDemandResult] = useState(null);
  const [cancellationResult, setCancellationResult] = useState(null);
  const [loadingDemand, setLoadingDemand] = useState(false);
  const [loadingCancellation, setLoadingCancellation] = useState(false);
  const [error, setError] = useState('');

  const predictDemand = useCallback(async ({ startDate, endDate } = {}) => {
    setLoadingDemand(true);
    setError('');
    try {
      const start = startDate || todayIso();
      const end = endDate || addDaysIso(start, 29);
      const data = await apiRequest('/api/predict_demand/', {
        method: 'POST',
        body: {
          start_date: start,
          end_date: end,
        },
      });
      setDemandResult(data);
      return { success: true, data };
    } catch (err) {
      const message = err?.message || 'Failed to generate demand forecast';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoadingDemand(false);
    }
  }, []);

  const predictCancellation = useCallback(async (form) => {
    setLoadingCancellation(true);
    setError('');
    try {
      const data = await apiRequest('/api/predict/', {
        method: 'POST',
        body: {
          vehicle_model_id: form.vehicleModelId ? Number(form.vehicleModelId) : null,
          from_area_id: form.fromAreaId ? Number(form.fromAreaId) : null,
          to_area_id: form.toAreaId ? Number(form.toAreaId) : null,
          online_booking: form.onlineBooking ? 1 : 0,
          mobile_site_booking: form.mobileBooking ? 1 : 0,
          from_date: form.fromDate || null,
          to_date: form.toDate || null,
          booking_created: form.bookingCreated || null,
        },
      });
      setCancellationResult(data);
      return { success: true, data };
    } catch (err) {
      const message = err?.message || 'Failed to estimate cancellation risk';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoadingCancellation(false);
    }
  }, []);

  return {
    demandResult,
    cancellationResult,
    loadingDemand,
    loadingCancellation,
    error,
    predictDemand,
    predictCancellation,
    clearError: () => setError(''),
  };
}
