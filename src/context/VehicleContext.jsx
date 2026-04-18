import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { apiRequest, realtimeManager } from '../lib/api';

const VehicleContext = createContext(null);

const ACCESS_TOKEN_KEY = 'authAccessToken';
const SAVED_CARS_KEY = 'renterSavedCars';
const RENTAL_HISTORY_KEY = 'rentalHistory';

const getToken = () => sessionStorage.getItem(ACCESS_TOKEN_KEY);

const fromApiVehicle = (vehicle) => {
  const price = Number(vehicle.pricePerDay ?? vehicle.daily_rate ?? 0);
  const status = vehicle.status || (vehicle.available ? 'available' : 'rented');

  return {
    ...vehicle,
    id: Number(vehicle.id),
    name: vehicle.name || vehicle.model || '',
    model: vehicle.model || vehicle.name || '',
    pricePerDay: Number.isNaN(price) ? 0 : price,
    price: Number.isNaN(price) ? 0 : price,
    available: status === 'available',
    status,
    owner: vehicle.owner || '',
    ownerId: vehicle.ownerId || null,
    ownerEmail: vehicle.ownerEmail || '',
    features: Array.isArray(vehicle.features) && vehicle.features.length > 0
      ? vehicle.features
      : ['Aircon', 'Bluetooth', 'ABS', 'Backup Camera'],
  };
};

const toApiVehicle = (vehicleData) => {
  const rawPrice = Number(vehicleData.pricePerDay ?? vehicleData.price ?? 0);
  return {
    brand: vehicleData.brand || '',
    model: vehicleData.model || vehicleData.name || '',
    year: Number(vehicleData.year || new Date().getFullYear()),
    daily_rate: Number.isNaN(rawPrice) ? 0 : rawPrice,
    available: (vehicleData.status || 'available') === 'available',
  };
};

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
    const token = getToken();
    if (!token) return;

    realtimeManager.connect(token);

    const unsubscribeVehicleCreate = realtimeManager.on('vehicle_created', ({ payload }) => {
      const normalized = fromApiVehicle(payload);
      setVehicles((prev) => (prev.find((v) => v.id === normalized.id) ? prev : [normalized, ...prev]));
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
    const token = getToken();
    if (!token) throw new Error('Not authenticated');

    const created = await apiRequest('/api/cars/', {
      method: 'POST',
      token,
      body: toApiVehicle(vehicleData),
    });

    const normalized = fromApiVehicle(created);
    setVehicles((prev) => [normalized, ...prev]);
    return normalized;
  };

  const updateVehicle = async (vehicleId, updates) => {
    const token = getToken();
    if (!token) return;

    const updated = await apiRequest(`/api/cars/${vehicleId}/`, {
      method: 'PATCH',
      token,
      body: toApiVehicle({ ...updates, model: updates.model || updates.name, brand: updates.brand }),
    });

    const normalized = fromApiVehicle(updated);
    setVehicles((prev) => prev.map((v) => (v.id === vehicleId ? normalized : v)));
  };

  const deleteVehicle = async (vehicleId) => {
    const token = getToken();
    if (!token) return;

    await apiRequest(`/api/cars/${vehicleId}/`, {
      method: 'DELETE',
      token,
    });

    setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
  };

  const toggleSavedCar = (vehicleId) => {
    let updated;
    if (savedCars.includes(vehicleId)) {
      updated = savedCars.filter((id) => id !== vehicleId);
    } else {
      updated = [...savedCars, vehicleId];
    }
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
    const ownerName = vehicle.owner || '';
    const record = {
      id: Date.now(),
      vehicleId: vehicle.id,
      vehicleName: `${vehicle.brand || ''} ${vehicle.name || ''}`.trim() || vehicle.name || 'Vehicle',
      ownerName,
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
    updateVehicle(record.vehicleId, { status: 'rented', available: false });
  };

  const rejectBooking = (recordId) => {
    const record = rentalHistory.find((r) => r.id === recordId);
    if (!record) return;
    updateRentalStatus(recordId, 'rejected', { endDate: new Date().toISOString() });
    updateVehicle(record.vehicleId, { status: 'available', available: true });
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

    updateVehicle(record.vehicleId, { status: 'available', available: true });
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
    const avgPrice = total > 0
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

export default VehicleContext;
