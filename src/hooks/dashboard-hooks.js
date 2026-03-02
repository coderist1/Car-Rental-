// Dashboard (Owner) DOM Selectors & Hooks

// Card Hooks
export const CARD_HOOKS = {
  availableCard: () => document.getElementById('availableCard'),
  rentedCard: () => document.getElementById('rentedCard'),
};

// Modal Hooks
export const MODAL_HOOKS = {
  addVehicleModal: () => document.getElementById('addVehicleModal'),
  editVehicleModal: () => document.getElementById('editVehicleModal'),
  rentalHistoryModal: () => document.getElementById('rental-history-modal'),
  closeAddVehicle: () => document.getElementById('closeAddVehicle'),
  closeEditVehicle: () => document.getElementById('closeEditVehicle'),
  closeRentalHistory: () => document.getElementById('closeRentalHistory'),
  closeRentalHistoryFooter: () => document.getElementById('closeRentalHistoryFooter'),
};

// Form Hooks
export const FORM_HOOKS = {
  addVehicleForm: () => document.getElementById('addVehicleForm'),
  editVehicleForm: () => document.getElementById('editVehicleForm'),
  vehicleNameInput: () => document.getElementById('vehicleName'),
  vehiclePriceInput: () => document.getElementById('vehiclePrice'),
  vehicleTypeSelect: () => document.getElementById('vehicleType'),
  vehicleTransmissionSelect: () => document.getElementById('vehicleTransmission'),
  vehicleFuelSelect: () => document.getElementById('vehicleFuel'),
  vehicleImageInput: () => document.getElementById('vehicleImage'),
  editVehicleImageInput: () => document.getElementById('editVehicleImage'),
};

// Content Display Hooks
export const CONTENT_HOOKS = {
  vehiclesList: () => document.getElementById('vehiclesList'),
  rentalHistoryList: () => document.getElementById('rental-history-list'),
  rentalHistoryEmpty: () => document.getElementById('rental-history-empty'),
  searchInput: () => document.getElementById('searchInput'),
};

// Stats Hooks
export const STATS_HOOKS = {
  totalVehiclesEl: () => document.getElementById('totalVehicles'),
  rentedVehiclesEl: () => document.getElementById('rentedVehicles'),
};

// Profile Hooks
export const PROFILE_HOOKS = {
  profileMenu: () => document.getElementById('profileMenu'),
};

// Helper function to get all hooks at once
export function getDashboardHooks() {
  return {
    card: Object.entries(CARD_HOOKS).reduce((acc, [key, fn]) => {
      acc[key] = fn();
      return acc;
    }, {}),
    modal: Object.entries(MODAL_HOOKS).reduce((acc, [key, fn]) => {
      acc[key] = fn();
      return acc;
    }, {}),
    form: Object.entries(FORM_HOOKS).reduce((acc, [key, fn]) => {
      acc[key] = fn();
      return acc;
    }, {}),
    content: Object.entries(CONTENT_HOOKS).reduce((acc, [key, fn]) => {
      acc[key] = fn();
      return acc;
    }, {}),
    stats: Object.entries(STATS_HOOKS).reduce((acc, [key, fn]) => {
      acc[key] = fn();
      return acc;
    }, {}),
    profile: Object.entries(PROFILE_HOOKS).reduce((acc, [key, fn]) => {
      acc[key] = fn();
      return acc;
    }, {}),
  };
}
