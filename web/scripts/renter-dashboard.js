// Renter Dashboard JavaScript
// Default sample vehicles
const VEHICLE_STORAGE_KEY = 'ownerVehicles';
const SAVED_CARS_STORAGE_KEY = 'renterSavedCars';
const defaultVehicles = [
    {
        id: 2,
        name: "BMW X5",
        brand: "BMW",
        year: 2022,
        price: 5500,
        location: "Makati",
        seats: 7,
        transmission: "Automatic",
        type: "SUV",
        fuel: "Diesel",
        plate: "XYZ 5678",
        color: "White",
        status: "rented",
        available: false,
        owner: "Jane Smith",
        features: ["Leather Seats", "Sunroof", "Navigation", "Premium Sound"],
        imageUri: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80"
    },
    {
        id: 3,
        name: "Ferrari 488",
        brand: "Ferrari",
        year: 2021,
        price: 25000,
        location: "Taguig",
        seats: 2,
        transmission: "Manual",
        type: "Sports",
        fuel: "Gasoline",
        plate: "FER 2021",
        color: "Red",
        status: "available",
        available: true,
        owner: "Mike Johnson",
        features: ["Sport Mode", "Carbon Fiber Interior", "Launch Control", "Track Pack"],
        imageUri: "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=800&q=80"
    }
];

function normalizeVehicle(vehicle) {
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
        owner: vehicle.owner || 'Admin Owner',
        features: Array.isArray(vehicle.features) && vehicle.features.length > 0
            ? vehicle.features
            : ["Aircon", "Bluetooth", "ABS", "Backup Camera"]
    };
}

function toStoredVehicle(vehicle) {
    return {
        ...vehicle,
        pricePerDay: Number(vehicle.pricePerDay ?? vehicle.price ?? 0),
        image: vehicle.image || vehicle.imageUri || '',
        status: vehicle.status || (vehicle.available ? 'available' : 'rented'),
        available: (vehicle.status || (vehicle.available ? 'available' : 'rented')) === 'available'
    };
}

function loadVehiclesFromStorage() {
    try {
        const raw = localStorage.getItem(VEHICLE_STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed.map(normalizeVehicle);
            }
        }
    } catch (error) {
    }

    const seededVehicles = defaultVehicles.map(normalizeVehicle);
    saveVehiclesToStorage(seededVehicles);
    return seededVehicles;
}

function saveVehiclesToStorage(vehiclesToSave) {
    try {
        localStorage.setItem(VEHICLE_STORAGE_KEY, JSON.stringify(vehiclesToSave.map(toStoredVehicle)));
    } catch (error) {
    }
}

function loadSavedCars() {
    try {
        const raw = localStorage.getItem(SAVED_CARS_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
}

function saveSavedCars(savedCars) {
    try {
        localStorage.setItem(SAVED_CARS_STORAGE_KEY, JSON.stringify(savedCars));
    } catch (error) {
    }
}

document.addEventListener('DOMContentLoaded', function() {
    let vehicles = [];
    let savedCars = loadSavedCars();

    // DOM Elements
    const searchInput = document.getElementById('searchInput');
    const filterButton = document.getElementById('filterButton');
    const filterModal = document.getElementById('filterModal');
    const closeFilter = document.getElementById('closeFilter');
    const applyFilters = document.getElementById('applyFilters');
    const clearFilters = document.getElementById('clearFilters');
    const vehiclesContainer = document.getElementById('vehiclesContainer');
    const detailModal = document.getElementById('detailModal');
    const closeDetail = document.getElementById('closeDetail');
    const profileMenu = document.getElementById('profileMenu');

    // Filter elements
    const typeFilters = document.querySelectorAll('.filter-option[data-filter="type"]');
    const transmissionFilters = document.querySelectorAll('.filter-option[data-filter="transmission"]');
    const fuelFilters = document.querySelectorAll('.filter-option[data-filter="fuel"]');
    const minPriceInput = document.getElementById('minPrice');
    const maxPriceInput = document.getElementById('maxPrice');

    // Current filters
    let currentFilters = {
        search: '',
        types: [],
        transmissions: [],
        fuels: [],
        minPrice: '',
        maxPrice: ''
    };

    // Initialize with stored vehicles
    vehicles = loadVehiclesFromStorage();
    renderVehicles(vehicles);
    updateStats(vehicles);

    // Event Listeners
    searchInput.addEventListener('input', handleSearch);
    filterButton.addEventListener('click', openFilterModal);
    closeFilter.addEventListener('click', closeFilterModal);
    closeDetail.addEventListener('click', closeDetailModal);
    applyFilters.addEventListener('click', applyFiltersHandler);
    clearFilters.addEventListener('click', clearFiltersHandler);

    // Profile Menu Event Listener
    profileMenu.addEventListener('menu-action', (e) => {
        handleMenuAction(e.detail.action);
    });

    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === filterModal) {
            closeFilterModal();
        }
        if (event.target === detailModal) {
            closeDetailModal();
        }
    });

    // ===== Profile Menu Actions =====
    function handleMenuAction(action) {
        switch(action) {
            case 'profile':
                navigateToPage('../pages/profile.html');
                break;
            case 'change-password':
                navigateToPage('../pages/change-password.html');
                break;
            case 'logout':
                handleLogout();
                break;
            default:
                console.log('Unknown action:', action);
        }
    }

    function navigateToPage(page) {
        window.location.href = page;
    }

    function handleLogout() {
        // Show confirmation before logout
        const confirmed = confirm('Are you sure you want to logout?');
        if (confirmed) {
            // Clear any session data if needed
            sessionStorage.clear();
            navigateToPage('../index.html');
        }
    }

    // ===== Search Functionality =====
    function handleSearch() {
        currentFilters.search = searchInput.value.toLowerCase();
        filterVehicles();
    }

    // ===== Filter Modal Functions =====
    function openFilterModal() {
        filterModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    function closeFilterModal() {
        filterModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    function closeDetailModal() {
        detailModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    function applyFiltersHandler() {
        // Get selected types
        currentFilters.types = Array.from(typeFilters)
            .filter(option => option.classList.contains('active'))
            .map(option => option.textContent);

        // Get selected transmissions
        currentFilters.transmissions = Array.from(transmissionFilters)
            .filter(option => option.classList.contains('active'))
            .map(option => option.textContent);

        // Get selected fuels
        currentFilters.fuels = Array.from(fuelFilters)
            .filter(option => option.classList.contains('active'))
            .map(option => option.textContent);

        // Get price range
        currentFilters.minPrice = minPriceInput.value;
        currentFilters.maxPrice = maxPriceInput.value;

        filterVehicles();
        closeFilterModal();
        updateFilterBadge();
    }

    function clearFiltersHandler() {
        // Clear all filter selections
        document.querySelectorAll('.filter-option').forEach(option => {
            option.classList.remove('active');
        });
        minPriceInput.value = '';
        maxPriceInput.value = '';

        // Reset current filters
        currentFilters = {
            search: currentFilters.search,
            types: [],
            transmissions: [],
            fuels: [],
            minPrice: '',
            maxPrice: ''
        };

        filterVehicles();
        updateFilterBadge();
    }

    function filterVehicles() {
        let filteredVehicles = vehicles.filter(vehicle => {
            // Search filter
            if (currentFilters.search) {
                const searchTerm = currentFilters.search.toLowerCase();
                const name = (vehicle.name || '').toLowerCase();
                const brand = (vehicle.brand || '').toLowerCase();
                const owner = (vehicle.owner || '').toLowerCase();
                if (!name.includes(searchTerm) &&
                    !brand.includes(searchTerm) &&
                    !owner.includes(searchTerm)) {
                    return false;
                }
            }

            // Type filter
            if (currentFilters.types.length > 0 && !currentFilters.types.includes(vehicle.type)) {
                return false;
            }

            // Transmission filter
            if (currentFilters.transmissions.length > 0 && !currentFilters.transmissions.includes(vehicle.transmission)) {
                return false;
            }

            // Fuel filter
            if (currentFilters.fuels.length > 0 && !currentFilters.fuels.includes(vehicle.fuel)) {
                return false;
            }

            // Price filter
            if (currentFilters.minPrice && vehicle.price < parseInt(currentFilters.minPrice)) {
                return false;
            }
            if (currentFilters.maxPrice && vehicle.price > parseInt(currentFilters.maxPrice)) {
                return false;
            }

            return true;
        });

        renderVehicles(filteredVehicles);
        updateStats(filteredVehicles);
    }

    function updateFilterBadge() {
        const activeFilters = currentFilters.types.length + currentFilters.transmissions.length +
                             currentFilters.fuels.length +
                             (currentFilters.minPrice ? 1 : 0) + (currentFilters.maxPrice ? 1 : 0);

        const badge = document.querySelector('.filter-badge');
        if (activeFilters > 0) {
            badge.textContent = activeFilters;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }

    function renderVehicles(vehiclesToRender) {
        const visibleVehicles = vehiclesToRender.filter(vehicle => vehicle.available);

        if (visibleVehicles.length === 0) {
            vehiclesContainer.innerHTML = `
                <div class="empty-container">
                    <div class="empty-emoji">🔍</div>
                    <div class="empty-text">No vehicles found</div>
                    <div class="empty-subtext">Try adjusting your search or filters</div>
                </div>
            `;
            return;
        }

        // Wait for custom element to be defined before rendering
        customElements.whenDefined('vehicle-card').then(() => {
            vehiclesContainer.innerHTML = '';
            visibleVehicles.forEach(vehicle => {
                const card = document.createElement('vehicle-card');
                card.setAttribute('vehicle-id', vehicle.id);
                card.setAttribute('name', vehicle.name);
                card.setAttribute('type', vehicle.type);
                card.setAttribute('price', vehicle.price);
                card.setAttribute('image', vehicle.imageUri || 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=800&q=80');
                card.setAttribute('seats', vehicle.seats);
                card.setAttribute('transmission', vehicle.transmission);
                if (vehicle.status) {
                    card.setAttribute('status', vehicle.status);
                }
                card.setAttribute('mode', 'renter');
                
                card.addEventListener('vehicle-click', (e) => {
                    showVehicleDetail(e.detail.vehicleId);
                });
                
                vehiclesContainer.appendChild(card);
            });
        });
    }

    function updateStats(vehiclesToCount) {
        const totalVehicles = vehiclesToCount.length;
        const availableVehicles = vehiclesToCount.filter(v => v.available).length;
        const avgPrice = vehiclesToCount.length > 0
            ? Math.round(vehiclesToCount.reduce((sum, v) => sum + v.price, 0) / vehiclesToCount.length)
            : 0;

        document.getElementById('totalVehicles').textContent = totalVehicles;
        document.getElementById('availableVehicles').textContent = availableVehicles;
        document.getElementById('avgPrice').textContent = `₱${avgPrice}`;
    }

    // Global function for vehicle detail (called from onclick)
    window.showVehicleDetail = function(vehicleId) {
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (!vehicle) return;
        const isSaved = savedCars.includes(vehicle.id);

        const detailContent = document.getElementById('detailContent');
        detailContent.innerHTML = `
            <div class="detail-image-container">
                ${vehicle.imageUri ? `<img src="${vehicle.imageUri}" alt="${vehicle.name}" class="detail-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : ''}
                <div class="detail-emoji" style="${vehicle.imageUri ? 'display:none;' : ''}">${vehicle.image}</div>
            </div>
            <div class="detail-name">${vehicle.name}</div>
            <div class="detail-brand">${vehicle.brand}</div>

            <div class="detail-price-container">
                <div class="detail-price-label">Price per day</div>
                <div class="detail-price">₱${vehicle.price}</div>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">Specifications</div>
                <div class="specs-grid">
                    <div class="spec-item">
                        <div class="spec-icon">👥</div>
                        <div class="spec-label">Seats</div>
                        <div class="spec-value">${vehicle.seats}</div>
                    </div>
                    <div class="spec-item">
                        <div class="spec-icon">⚙️</div>
                        <div class="spec-label">Transmission</div>
                        <div class="spec-value">${vehicle.transmission}</div>
                    </div>
                    <div class="spec-item">
                        <div class="spec-icon">⛽</div>
                        <div class="spec-label">Fuel</div>
                        <div class="spec-value">${vehicle.fuel}</div>
                    </div>
                    <div class="spec-item">
                        <div class="spec-icon">🚗</div>
                        <div class="spec-label">Type</div>
                        <div class="spec-value">${vehicle.type}</div>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">Features</div>
                <div class="features-container">
                    ${vehicle.features.map(feature => `<span class="feature-tag-large"><span class="feature-text-large">${feature}</span></span>`).join('')}
                </div>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">Owner</div>
                <div class="owner-info">${vehicle.owner}</div>
            </div>

            ${vehicle.available
                ? '<div class="detail-actions"><button class="rent-button" onclick="rentVehicle(' + vehicle.id + ')">Rent This Vehicle</button><button class="btn btn-secondary save-car-button" onclick="saveCar(' + vehicle.id + ')">' + (isSaved ? 'Saved' : 'Save Car') + '</button></div>'
                : `<div class="unavailable-button">${vehicle.status === 'maintenance' ? 'Under Maintenance' : 'Currently Unavailable'}</div>`
            }
        `;

        detailModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    };

    // Global function for renting vehicle
    window.rentVehicle = function(vehicleId) {
        const index = vehicles.findIndex(v => v.id === vehicleId);
        if (index === -1) return;

        vehicles[index] = {
            ...vehicles[index],
            status: 'rented',
            available: false
        };

        saveVehiclesToStorage(vehicles);
        filterVehicles();
        alert('Vehicle rented successfully.');
        closeDetailModal();
    };

    window.saveCar = function(vehicleId) {
        if (savedCars.includes(vehicleId)) {
            alert('This car is already saved.');
            return;
        }

        savedCars = [...savedCars, vehicleId];
        saveSavedCars(savedCars);
        alert('Car saved successfully.');
        showVehicleDetail(vehicleId);
    };

    // Filter option click handlers
    document.querySelectorAll('.filter-option').forEach(option => {
        option.addEventListener('click', function() {
            this.classList.toggle('active');
        });
    });
});