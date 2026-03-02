// Renter Dashboard DOM Selectors & Hooks

// Search & Filter Hooks
export const SEARCH_HOOKS = {
  searchInput: () => document.getElementById('searchInput'),
  filterButton: () => document.getElementById('filterButton'),
  filterModal: () => document.getElementById('filterModal'),
  closeFilter: () => document.getElementById('closeFilter'),
  applyFilters: () => document.getElementById('applyFilters'),
  clearFilters: () => document.getElementById('clearFilters'),
  minPriceInput: () => document.getElementById('minPrice'),
  maxPriceInput: () => document.getElementById('maxPrice'),
  filterBadge: () => document.querySelector('.filter-badge'),
};

// Vehicle Display Hooks
export const VEHICLE_HOOKS = {
  vehiclesContainer: () => document.getElementById('vehiclesContainer'),
  detailModal: () => document.getElementById('detailModal'),
  closeDetail: () => document.getElementById('closeDetail'),
  detailContent: () => document.getElementById('detailContent'),
  typeFilters: () => document.querySelectorAll('.filter-option[data-filter="type"]'),
  transmissionFilters: () => document.querySelectorAll('.filter-option[data-filter="transmission"]'),
  fuelFilters: () => document.querySelectorAll('.filter-option[data-filter="fuel"]'),
  allFilterOptions: () => document.querySelectorAll('.filter-option'),
};

// Stats Hooks
export const STATS_HOOKS = {
  totalVehicles: () => document.getElementById('totalVehicles'),
  availableVehicles: () => document.getElementById('availableVehicles'),
  avgPrice: () => document.getElementById('avgPrice'),
  savedVehicles: () => document.getElementById('savedVehicles'),
};

// Profile & History Hooks
export const PROFILE_HOOKS = {
  profileMenu: () => document.getElementById('profileMenu'),
  myRentalsBtn: () => document.getElementById('myRentalsBtn'),
  savedCardContainer: () => document.getElementById('savedCardContainer'),
  greetingEl: () => document.querySelector('.greeting'),
};

// Rental History Hooks
export const HISTORY_HOOKS = {
  historyModal: () => document.getElementById('renter-rental-history-modal'),
  historyList: () => document.getElementById('renter-rental-history-list'),
  historyEmpty: () => document.getElementById('renter-rental-history-empty'),
  closeRenterHistory: () => document.getElementById('closeRenterHistory'),
  closeRenterHistoryFooter: () => document.getElementById('closeRenterHistoryFooter'),
};

// Rental Date Input Hooks
export const RENTAL_HOOKS = {
  rentStartDate: () => document.getElementById('rent-start-date'),
  rentEndDate: () => document.getElementById('rent-end-date'),
  rentSummary: () => document.getElementById('rent-summary'),
  rentDuration: () => document.getElementById('rent-duration'),
  rentTotal: () => document.getElementById('rent-total'),
};

// Helper function to get all hooks at once
export function getRenterDashboardHooks() {
  return {
    search: Object.entries(SEARCH_HOOKS).reduce((acc, [key, fn]) => {
      acc[key] = fn();
      return acc;
    }, {}),
    vehicle: Object.entries(VEHICLE_HOOKS).reduce((acc, [key, fn]) => {
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
    history: Object.entries(HISTORY_HOOKS).reduce((acc, [key, fn]) => {
      acc[key] = fn();
      return acc;
    }, {}),
    rental: Object.entries(RENTAL_HOOKS).reduce((acc, [key, fn]) => {
      acc[key] = fn();
      return acc;
    }, {}),
  };
}
