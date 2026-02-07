import React, { createContext, useState, useContext } from 'react';
import { vehicles as initialVehicles } from '../data/vehicles';

const VehicleContext = createContext();

export const useVehicles = () => {
  const context = useContext(VehicleContext);
  if (!context) {
    throw new Error('useVehicles must be used within a VehicleProvider');
  }
  return context;
};

export const VehicleProvider = ({ children }) => {
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [rentals, setRentals] = useState([]);

  const addVehicle = (vehicle, ownerId, ownerName) => {
    const newVehicle = {
      ...vehicle,
      id: `${Date.now()}`,
      ownerId,
      ownerName,
      available: true,
    };
    setVehicles([...vehicles, newVehicle]);
    return newVehicle;
  };

  const updateVehicle = (vehicleId, updates) => {
    setVehicles(vehicles.map(v => 
      v.id === vehicleId ? { ...v, ...updates } : v
    ));
  };

  const deleteVehicle = (vehicleId) => {
    setVehicles(vehicles.filter(v => v.id !== vehicleId));
  };

  const getOwnerVehicles = (ownerId) => {
    return vehicles.filter(v => v.ownerId === ownerId);
  };

  const getAvailableVehicles = () => {
    return vehicles.filter(v => v.available);
  };

  const rentVehicle = (vehicleId, renterId, renterName, startDate, endDate) => {
    const rental = {
      id: `rental_${Date.now()}`,
      vehicleId,
      renterId,
      renterName,
      startDate,
      endDate,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    
    setRentals([...rentals, rental]);
    updateVehicle(vehicleId, { available: false });
    return rental;
  };

  const returnVehicle = (rentalId) => {
    const rental = rentals.find(r => r.id === rentalId);
    if (rental) {
      setRentals(rentals.map(r => 
        r.id === rentalId ? { ...r, status: 'completed' } : r
      ));
      updateVehicle(rental.vehicleId, { available: true });
    }
  };

  const getRenterRentals = (renterId) => {
    return rentals.filter(r => r.renterId === renterId);
  };

  const getOwnerRentals = (ownerId) => {
    const ownerVehicleIds = vehicles.filter(v => v.ownerId === ownerId).map(v => v.id);
    return rentals.filter(r => ownerVehicleIds.includes(r.vehicleId));
  };

  const value = {
    vehicles,
    rentals,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    getOwnerVehicles,
    getAvailableVehicles,
    rentVehicle,
    returnVehicle,
    getRenterRentals,
    getOwnerRentals,
  };

  return (
    <VehicleContext.Provider value={value}>
      {children}
    </VehicleContext.Provider>
  );
};

export default VehicleContext;
