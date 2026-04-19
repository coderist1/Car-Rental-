import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { apiRequest, realtimeManager } from '../lib/api';
import {
  SAVED_CARS_KEY, // Keep for saved cars, which are local
  fromApiVehicle,
  toApiVehicle,
  toApiVehiclePatch,
} from './vehicleUtils';

const VehicleContext = createContext(null);

export function VehicleProvider({ children }) {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [savedCars, setSavedCars] = useState([]);
  const [rentalHistory, setRentalHistory] = useState([]);
  const didInitialize = useRef(false);

  const normalizeBooking = useCallback((booking) => {
    if (!booking) return booking;
    const rawVehicle = booking.vehicle;
    // vehicle may be an ID or an object { id, ... }
    const vehicleIdCandidate = booking.vehicleId ?? (rawVehicle && (rawVehicle.id ?? rawVehicle));
    const renterCandidate = booking.renterId ?? (booking.renter && (booking.renter.id ?? booking.renter));
    return {
      ...booking,
      id: Number(booking.id ?? booking._id ?? booking.pk),
      vehicleId: Number(vehicleIdCandidate ?? NaN),
      renterId: Number(renterCandidate ?? NaN),
      startDate: booking.startDate ?? booking.start_date,
      endDate: booking.endDate ?? booking.end_date,
      amount: Number(booking.amount ?? booking.pricePerDay ?? 0),
      vehicleName: booking.vehicleName || booking.vehicle_name || booking.carName || booking.vehicle_model || 'Vehicle',
      ownerName: booking.ownerName || booking.owner_name || booking.owner || '',
      renterName: booking.renterName || booking.renter_name || booking.renter_full_name || '',
    };
  }, []);

  const loadVehicles = useCallback(async () => {
    try {
      const rows = await apiRequest('/api/cars/');
      setVehicles(Array.isArray(rows) ? rows.map(fromApiVehicle) : []);
    } catch (e) {
      console.error('Error loading vehicles:', e);
      setVehicles([]);
    }
  }, []);

  const loadSavedCars = useCallback(() => {
    try {
      const raw = localStorage.getItem(SAVED_CARS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setSavedCars(Array.isArray(parsed) ? parsed : []);
        return;
      }
    } catch (e) {
      console.error('Error loading saved cars:', e);
    }
    setSavedCars([]);
  }, []);

  // New function to load bookings from API
  const loadBookings = useCallback(async () => {
    if (!user) { // Only load bookings if a user is logged in
      setRentalHistory([]);
      return;
    }
    try {
      // Assuming a single endpoint for bookings that returns relevant ones for the user
      const data = await apiRequest('/api/bookings/');
      setRentalHistory(Array.isArray(data) ? data.map(normalizeBooking) : []);
    } catch (e) {
      console.error('Error loading bookings:', e);
      setRentalHistory([]);
    }
  }, [user, normalizeBooking]); // Reload bookings when user changes

  useEffect(() => {
    if (didInitialize.current) return;
    didInitialize.current = true;

    loadVehicles();
    loadSavedCars();
    loadBookings(); // Initial load if user already exists

    // Connect to realtime manager only once when the component mounts
    // and ensure it's connected for all contexts.
    // It's safe to call connect multiple times, it will only establish if not already open.
    realtimeManager.connect();

    // If user changes, we need to reload bookings, but the dependency array of this useEffect
    // should not include `user` as it's for initial setup. `loadBookings` already depends on `user`.
    // The `loadBookings` call above will handle initial load based on `user` state.

    const handleStorageChange = (e) => {
      if (e.key === SAVED_CARS_KEY) loadSavedCars();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadVehicles, loadSavedCars, loadBookings]);

  useEffect(() => {
    loadBookings();
  }, [user, loadBookings]);

  // Subscribe to real-time vehicle updates
  useEffect(() => {
    const unsubscribeVehicleCreate = realtimeManager.on('vehicle_created', ({ payload }) => {
      const normalized = fromApiVehicle(payload);
      setVehicles((prev) =>
        prev.find((v) => v.id === normalized.id) ? prev : [normalized, ...prev]
      );
    });

    const unsubscribeVehicleUpdate = realtimeManager.on('vehicle_updated', ({ id, payload }) => {
      const normalized = fromApiVehicle(payload);
      setVehicles((prev) => prev.map((v) => (v.id === Number(id) ? normalized : v)));
    });

    const unsubscribeVehicleDelete = realtimeManager.on('vehicle_deleted', ({ id }) => {
      setVehicles((prev) => prev.filter((v) => v.id !== Number(id)));
    });

    // --- Real-time booking updates ---
    const unsubscribeBookingCreated = realtimeManager.on('booking_created', ({ payload }) => {
      const normalized = normalizeBooking(payload);
      setRentalHistory((prev) => (prev.find((b) => b.id === normalized.id) ? prev : [...prev, normalized]));
    });

    const unsubscribeBookingUpdated = realtimeManager.on('booking_updated', ({ id, payload }) => {
      const normalized = normalizeBooking(payload);
      setRentalHistory((prev) => prev.map((b) => (b.id === Number(id) ? normalized : b)));
    });

    const unsubscribeBookingDeleted = realtimeManager.on('booking_deleted', ({ id }) => {
      setRentalHistory((prev) => prev.filter((b) => b.id !== Number(id)));
    });
    // --- End real-time booking updates ---

    return () => {
      unsubscribeVehicleCreate();
      unsubscribeVehicleUpdate();
      unsubscribeVehicleDelete();
      // --- Unsubscribe booking events ---
      unsubscribeBookingCreated();
      unsubscribeBookingUpdated();
      unsubscribeBookingDeleted();
      // --- End unsubscribe booking events ---
    };
  }, [normalizeBooking]);

  const addVehicle = async (vehicleData) => {
    const created = await apiRequest('/api/cars/', {
      method: 'POST',
      body: toApiVehicle(vehicleData, user),
    });
    const normalized = fromApiVehicle(created);
    setVehicles((prev) => [normalized, ...prev]);
    return normalized;
  };

  const updateVehicle = async (vehicleId, updates) => {
    const updated = await apiRequest(`/api/cars/${vehicleId}/`, {
      method: 'PATCH',
      body: toApiVehiclePatch(updates),
    });
    const normalized = fromApiVehicle(updated);
    setVehicles((prev) => prev.map((v) => (v.id === vehicleId ? normalized : v)));
  };

  const deleteVehicle = async (vehicleId) => {
    await apiRequest(`/api/cars/${vehicleId}/`, {
      method: 'DELETE',
    });
    setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
  };

  const toggleSavedCar = (vehicleId) => {
    const updated = savedCars.includes(vehicleId)
      ? savedCars.filter((id) => id !== vehicleId)
      : [...savedCars, vehicleId];
    localStorage.setItem(SAVED_CARS_KEY, JSON.stringify(updated));
    setSavedCars(updated);
  };

  const isCarSaved = (vehicleId) => savedCars.includes(vehicleId);

  const addRentalRecord = async (vehicle, renterInfo = {}) => {
    const record = {
      id: Date.now(),
      vehicleId: vehicle.id,
      vehicleName: `${vehicle.brand || ''} ${vehicle.name || ''}`.trim() || vehicle.name || 'Vehicle',
      ownerName: vehicle.owner || '',
      ownerEmail: vehicle.ownerEmail || '',
      renterName: renterInfo.name || user?.fullName || 'Unknown',
      renterEmail: renterInfo.email || user?.email || '',
      renterId: renterInfo.id || user?.id,
      startDate: new Date().toISOString(),
      endDate: null,
      amount: vehicle.pricePerDay || 0,
      status: 'pending',
    };
    // The above record structure is for local storage.
    // For API, we need to send data that matches the backend booking model.
    if (!user) {
      console.error('User must be logged in to add a rental record.');
      return null;
    }

    const nowIso = new Date().toISOString();
    const newBookingData = {
      vehicle: vehicle.id, // Backend expects vehicle ID
      renter: renterInfo.id || user.id,     // Backend expects renter ID
      startDate: nowIso,
      start_date: nowIso,
      endDate: null, // Will be set upon return
      end_date: null,
      amount: vehicle.pricePerDay || 0,
      status: 'pending',
      // Other fields as required by your backend booking model
    };

    try {
      const createdBooking = await apiRequest('/api/bookings/', {
        method: 'POST',
        body: newBookingData,
      });
      // The real-time event 'booking_created' will update the state,
      // but we can also update it directly for immediate UI feedback.
      const normalized = normalizeBooking(createdBooking);
      setRentalHistory((prev) => [...prev, normalized]);
      return normalized;
    } catch (error) {
      console.error('Error creating rental record:', error);
      return null;
    }
  };

  const updateRentalStatus = async (recordId, status, additionalData = {}) => {
    try {
      const updatedBooking = await apiRequest(`/api/bookings/${recordId}/`, {
        method: 'PATCH',
        body: { status, ...additionalData },
      });
      // Real-time event 'booking_updated' will update the state,
      // but we can also update it directly for immediate UI feedback.
      const normalized = normalizeBooking(updatedBooking);
      setRentalHistory((prev) => prev.map((b) => (Number(b.id) === Number(recordId) ? normalized : b)));
      return normalized;
    } catch (error) {
      console.error(`Error updating rental status for booking ${recordId}:`, error);
      throw error;
    }
  };

  const approveBooking = async (recordId) => {
    const record = rentalHistory.find((r) => Number(r.id) === Number(recordId));
    if (!record) return;

    await updateRentalStatus(recordId, 'active');
    // Prefer normalized `vehicleId` to update vehicle status
    const vehicleId = Number(record.vehicleId ?? (record.vehicle && (record.vehicle.id ?? record.vehicle)));
    if (vehicleId && !Number.isNaN(vehicleId)) {
      await updateVehicle(vehicleId, { status: 'rented' });
    }
  };

  const rejectBooking = async (recordId) => {
    const record = rentalHistory.find((r) => Number(r.id) === Number(recordId));
    if (!record) return;

    await updateRentalStatus(recordId, 'rejected', { endDate: new Date().toISOString() });
    const vehicleId = Number(record.vehicleId ?? (record.vehicle && (record.vehicle.id ?? record.vehicle)));
    if (vehicleId && !Number.isNaN(vehicleId)) await updateVehicle(vehicleId, { status: 'available' });
  };

  const requestReturn = async (recordId) => {
    await updateRentalStatus(recordId, 'return_requested', {
      returnRequested: true,
      returnRequestedAt: new Date().toISOString(),
    });
  };

  const acceptReturn = async (recordId) => {
    const record = rentalHistory.find((r) => Number(r.id) === Number(recordId));
    if (!record) return;

    await updateRentalStatus(recordId, 'returned', {
      returnAccepted: true,
      returnAcceptedAt: new Date().toISOString(),
      endDate: new Date().toISOString(),
    });
    const vehicleId = Number(record.vehicleId ?? (record.vehicle && (record.vehicle.id ?? record.vehicle)));
    if (vehicleId && !Number.isNaN(vehicleId)) await updateVehicle(vehicleId, { status: 'available' });
  };

  const clearRentalHistory = async () => {
    // This operation might be complex or not directly supported by a single API call
    // if it means deleting all bookings for a user.
    // For now, let's assume an API endpoint to clear all user's bookings.
    // Alternatively, this function could be removed or re-evaluated based on backend capabilities.
    if (!user) {
      console.error('User must be logged in to clear rental history.');
      return;
    }
    try {
      await apiRequest(`/api/bookings/clear_user_bookings/`, { // Placeholder endpoint
        method: 'DELETE',
        body: { user_id: user.id } // Assuming backend needs user ID for this
      });
      setRentalHistory([]); // Clear local state
    } catch (error) {
      console.error('Error clearing rental history:', error);
    }
  };

  const getStats = () => {
    const total = vehicles.length;
    const available = vehicles.filter((v) => v.available).length;
    const rented = total - available;
    const estimatedDailyEarnings = vehicles
      .filter((v) => v.status === 'rented')
      .reduce((sum, v) => sum + Number(v.pricePerDay || 0), 0);
    const avgPrice =
      total > 0
        ? Math.round(vehicles.reduce((sum, v) => sum + Number(v.pricePerDay || 0), 0) / total)
        : 0;
    return { total, available, rented, estimatedDailyEarnings, avgPrice, savedCount: savedCars.length };
  };

  const getUserRentals = () => {
    if (!user) return [];
    return rentalHistory.filter((r) => String(r.renterId ?? (r.renter && (r.renter.id ?? r.renter))) === String(user.id));
  };

  const getOwnerRentals = () => {
    if (!user) return [];
    const ownerVehicleIds = vehicles.filter((v) => v.ownerId === user.id).map((v) => v.id);
    return rentalHistory.filter((b) => ownerVehicleIds.includes(Number(b.vehicleId ?? (b.vehicle && (b.vehicle.id ?? b.vehicle))))); // Handle both shapes
  };
  const value = {
    vehicles,
    savedCars,
    rentalHistory,
    loadVehicles,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    toggleSavedCar,
    isCarSaved,
    addRentalRecord,
    updateRentalStatus,
    approveBooking,
    rejectBooking,
    requestReturn,
    acceptReturn,
    clearRentalHistory,
    getStats,
    getUserRentals,
    getOwnerRentals,
  };

  return <VehicleContext.Provider value={value}>{children}</VehicleContext.Provider>;
}

export function useVehicles() {
  const context = useContext(VehicleContext);
  if (!context) {
    throw new Error('useVehicles must be used within a VehicleProvider');
  }
  return context;
}
