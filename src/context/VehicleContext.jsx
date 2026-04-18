import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { apiRequest, realtimeManager } from '../lib/api';
import {
  SAVED_CARS_KEY,
  RENTAL_HISTORY_KEY,
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

  const loadRentalHistory = useCallback(() => {
    try {
      const raw = localStorage.getItem(RENTAL_HISTORY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setRentalHistory(Array.isArray(parsed) ? parsed : []);
        return;
      }
    } catch (e) {
      console.error('Error loading rental history:', e);
    }
    setRentalHistory([]);
  }, []);

  useEffect(() => {
    if (didInitialize.current) return;
    didInitialize.current = true;

    loadVehicles();
    loadSavedCars();
    loadRentalHistory();

    const handleStorageChange = (e) => {
      if (e.key === SAVED_CARS_KEY) loadSavedCars();
      if (e.key === RENTAL_HISTORY_KEY) loadRentalHistory();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadVehicles, loadSavedCars, loadRentalHistory]);

  // Subscribe to real-time vehicle updates
  useEffect(() => {
    realtimeManager.connect();

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

    return () => {
      unsubscribeVehicleCreate();
      unsubscribeVehicleUpdate();
      unsubscribeVehicleDelete();
    };
  }, []);

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

  const saveRentalHistoryToStorage = (history) => {
    try {
      localStorage.setItem(RENTAL_HISTORY_KEY, JSON.stringify(history));
      setRentalHistory(history);
    } catch (e) {
      console.error('Error saving rental history:', e);
    }
  };

  const addRentalRecord = (vehicle, renterInfo = {}) => {
    const record = {
      id: Date.now(),
      vehicleId: vehicle.id,
      vehicleName: `${vehicle.brand || ''} ${vehicle.name || ''}`.trim() || vehicle.name || 'Vehicle',
      ownerName: vehicle.owner || '',
      ownerEmail: vehicle.ownerEmail || '',
      renterName: renterInfo.name || user?.fullName || 'Unknown',
      renterEmail: renterInfo.email || user?.email || '',
      renterId: user?.id,
      startDate: new Date().toISOString(),
      endDate: null,
      amount: vehicle.pricePerDay || 0,
      status: 'pending',
    };
    const updatedHistory = [...rentalHistory, record];
    saveRentalHistoryToStorage(updatedHistory);
    return record;
  };

  const updateRentalStatus = (recordId, status, additionalData = {}) => {
    const updatedHistory = rentalHistory.map((r) =>
      r.id === recordId ? { ...r, status, ...additionalData } : r
    );
    saveRentalHistoryToStorage(updatedHistory);
  };

  const approveBooking = (recordId) => {
    const record = rentalHistory.find((r) => r.id === recordId);
    if (!record) return;
    updateRentalStatus(recordId, 'active');
    updateVehicle(record.vehicleId, { status: 'rented' });
  };

  const rejectBooking = (recordId) => {
    const record = rentalHistory.find((r) => r.id === recordId);
    if (!record) return;
    updateRentalStatus(recordId, 'rejected', { endDate: new Date().toISOString() });
    updateVehicle(record.vehicleId, { status: 'available' });
  };

  const requestReturn = (recordId) => {
    updateRentalStatus(recordId, 'return_requested', {
      returnRequested: true,
      returnRequestedAt: new Date().toISOString(),
    });
  };

  const acceptReturn = (recordId) => {
    const record = rentalHistory.find((r) => r.id === recordId);
    if (!record) return;
    updateRentalStatus(recordId, 'returned', {
      returnAccepted: true,
      returnAcceptedAt: new Date().toISOString(),
      endDate: new Date().toISOString(),
    });
    updateVehicle(record.vehicleId, { status: 'available' });
  };

  const clearRentalHistory = () => {
    saveRentalHistoryToStorage([]);
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
    return rentalHistory.filter((r) => r.renterId === user.id);
  };

  const getOwnerRentals = () => {
    if (!user) return [];
    const ownerVehicleIds = vehicles.filter((v) => v.ownerId === user.id).map((v) => v.id);
    return rentalHistory.filter((r) => ownerVehicleIds.includes(r.vehicleId));
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
