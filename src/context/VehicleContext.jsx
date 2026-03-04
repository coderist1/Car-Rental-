import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const VehicleContext = createContext(null);

const VEHICLE_STORAGE_KEY = 'ownerVehicles';
const SAVED_CARS_KEY = 'renterSavedCars';
const RENTAL_HISTORY_KEY = 'rentalHistory';

export function VehicleProvider({ children }) {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [savedCars, setSavedCars] = useState([]);
  const [rentalHistory, setRentalHistory] = useState([]);

  // Load vehicles from storage
  const loadVehicles = useCallback(() => {
    try {
      const raw = localStorage.getItem(VEHICLE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setVehicles(parsed.map(normalizeVehicle));
          return;
        }
      }
    } catch (e) {
      console.error('Error loading vehicles:', e);
    }
    setVehicles([]);
  }, []);

  // Load saved cars
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

  // Load rental history
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
    loadVehicles();
    loadSavedCars();
    loadRentalHistory();

    // Listen for storage changes
    const handleStorageChange = (e) => {
      if (e.key === VEHICLE_STORAGE_KEY) loadVehicles();
      if (e.key === SAVED_CARS_KEY) loadSavedCars();
      if (e.key === RENTAL_HISTORY_KEY) loadRentalHistory();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadVehicles, loadSavedCars, loadRentalHistory]);

  const normalizeVehicle = (vehicle) => {
    const status = vehicle.status || (vehicle.available ? 'available' : 'rented');
    const priceValue = Number(vehicle.pricePerDay ?? vehicle.price ?? 0);
    return {
      ...vehicle,
      price: Number.isNaN(priceValue) ? 0 : priceValue,
      pricePerDay: Number.isNaN(priceValue) ? 0 : priceValue,
      imageUri: vehicle.imageUri || vehicle.image || '',
      image: vehicle.image || vehicle.imageUri || '',
      status,
      available: status === 'available',
      owner: vehicle.owner || '',
      ownerEmail: vehicle.ownerEmail || '',
      features: Array.isArray(vehicle.features) && vehicle.features.length > 0
        ? vehicle.features
        : ['Aircon', 'Bluetooth', 'ABS', 'Backup Camera']
    };
  };

  const saveVehicles = (vehiclesToSave) => {
    try {
      localStorage.setItem(VEHICLE_STORAGE_KEY, JSON.stringify(vehiclesToSave.map(normalizeVehicle)));
      setVehicles(vehiclesToSave.map(normalizeVehicle));
    } catch (e) {
      console.error('Error saving vehicles:', e);
    }
  };

  const addVehicle = (vehicleData) => {
    const ownerName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';
    const newVehicle = normalizeVehicle({
      id: Date.now(),
      ...vehicleData,
      owner: ownerName,
      ownerEmail: user?.email || '',
      ownerId: user?.id,
      createdAt: new Date().toISOString()
    });

    const updatedVehicles = [...vehicles, newVehicle];
    saveVehicles(updatedVehicles);
    return newVehicle;
  };

  const updateVehicle = (vehicleId, updates) => {
    const updatedVehicles = vehicles.map(v => 
      v.id === vehicleId ? normalizeVehicle({ ...v, ...updates }) : v
    );
    saveVehicles(updatedVehicles);
  };

  const deleteVehicle = (vehicleId) => {
    const updatedVehicles = vehicles.filter(v => v.id !== vehicleId);
    saveVehicles(updatedVehicles);
  };

  // Saved cars functions
  const toggleSavedCar = (vehicleId) => {
    let updated;
    if (savedCars.includes(vehicleId)) {
      updated = savedCars.filter(id => id !== vehicleId);
    } else {
      updated = [...savedCars, vehicleId];
    }
    localStorage.setItem(SAVED_CARS_KEY, JSON.stringify(updated));
    setSavedCars(updated);
  };

  const isCarSaved = (vehicleId) => savedCars.includes(vehicleId);

  // Rental history functions
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
      status: 'pending'
    };

    const updatedHistory = [...rentalHistory, record];
    saveRentalHistoryToStorage(updatedHistory);
    return record;
  };

  const updateRentalStatus = (recordId, status, additionalData = {}) => {
    const updatedHistory = rentalHistory.map(r => 
      r.id === recordId ? { ...r, status, ...additionalData } : r
    );
    saveRentalHistoryToStorage(updatedHistory);
  };

  const approveBooking = (recordId) => {
    const record = rentalHistory.find(r => r.id === recordId);
    if (!record) return;

    updateRentalStatus(recordId, 'active');
    
    // Update vehicle status
    updateVehicle(record.vehicleId, { status: 'rented', available: false });
  };

  const rejectBooking = (recordId) => {
    const record = rentalHistory.find(r => r.id === recordId);
    if (!record) return;

    updateRentalStatus(recordId, 'rejected', { endDate: new Date().toISOString() });
    
    // Make vehicle available again
    updateVehicle(record.vehicleId, { status: 'available', available: true });
  };

  const requestReturn = (recordId) => {
    updateRentalStatus(recordId, 'return_requested', { 
      returnRequested: true,
      returnRequestedAt: new Date().toISOString()
    });
  };

  const acceptReturn = (recordId) => {
    const record = rentalHistory.find(r => r.id === recordId);
    if (!record) return;

    updateRentalStatus(recordId, 'returned', {
      returnAccepted: true,
      returnAcceptedAt: new Date().toISOString(),
      endDate: new Date().toISOString()
    });

    // Make vehicle available again
    updateVehicle(record.vehicleId, { status: 'available', available: true });
  };

  const clearRentalHistory = () => {
    saveRentalHistoryToStorage([]);
  };

  // Stats calculations
  const getStats = () => {
    const total = vehicles.length;
    const available = vehicles.filter(v => v.available).length;
    const rented = total - available;
    const estimatedDailyEarnings = vehicles
      .filter(v => v.status === 'rented')
      .reduce((sum, v) => sum + Number(v.pricePerDay || 0), 0);
    const avgPrice = total > 0 
      ? Math.round(vehicles.reduce((sum, v) => sum + Number(v.pricePerDay || 0), 0) / total)
      : 0;

    return { total, available, rented, estimatedDailyEarnings, avgPrice, savedCount: savedCars.length };
  };

  // Get rentals for current user
  const getUserRentals = () => {
    if (!user) return [];
    return rentalHistory.filter(r => r.renterId === user.id);
  };

  // Get rentals for owner's vehicles
  const getOwnerRentals = () => {
    if (!user) return [];
    const ownerVehicleIds = vehicles.filter(v => v.ownerId === user.id).map(v => v.id);
    return rentalHistory.filter(r => ownerVehicleIds.includes(r.vehicleId));
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
    getOwnerRentals
  };

  return (
    <VehicleContext.Provider value={value}>
      {children}
    </VehicleContext.Provider>
  );
}

export function useVehicles() {
  const context = useContext(VehicleContext);
  if (!context) {
    throw new Error('useVehicles must be used within a VehicleProvider');
  }
  return context;
}

export default VehicleContext;
