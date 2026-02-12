// Renter Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Mock data for vehicles
    const vehicles = [
        {
            id: 1,
            name: 'BMW X5',
            brand: 'BMW',
            type: 'SUV',
            seats: 5,
            transmission: 'Automatic',
            fuel: 'Petrol',
            features: ['GPS', 'Air Conditioning', 'Bluetooth'],
            price: 85,
            owner: 'John Smith',
            available: true,
            image: '🚗',
            imageUri: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 2,
            name: 'Honda Civic',
            brand: 'Honda',
            type: 'Sedan',
            seats: 5,
            transmission: 'Manual',
            fuel: 'Petrol',
            features: ['Air Conditioning', 'Bluetooth'],
            price: 45,
            owner: 'Sarah Johnson',
            available: true,
            image: '🚙'
        },
        {
            id: 3,
            name: 'Ford Mustang',
            brand: 'Ford',
            type: 'Sports',
            seats: 4,
            transmission: 'Automatic',
            fuel: 'Petrol',
            features: ['GPS', 'Air Conditioning', 'Bluetooth', 'Leather Seats'],
            price: 120,
            owner: 'Mike Davis',
            available: false,
            image: '🏎️'
        },
        {
            id: 4,
            name: 'Toyota Prius',
            brand: 'Toyota',
            type: 'Hybrid',
            seats: 5,
            transmission: 'Automatic',
            fuel: 'Hybrid',
            features: ['GPS', 'Air Conditioning', 'Bluetooth'],
            price: 55,
            owner: 'Emma Wilson',
            available: true,
            image: '🚐'
        },
        {
            id: 5,
            name: 'Mercedes C-Class',
            brand: 'Mercedes',
            type: 'Luxury',
            seats: 5,
            transmission: 'Automatic',
            fuel: 'Diesel',
            features: ['GPS', 'Air Conditioning', 'Bluetooth', 'Leather Seats', 'Sunroof'],
            price: 95,
            owner: 'David Brown',
            available: true,
            image: '🚗'
        }
    ];

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
    const logoutButton = document.getElementById('logoutButton');

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

    // Initialize
    renderVehicles(vehicles);
    updateStats(vehicles);

    // Event Listeners
    searchInput.addEventListener('input', handleSearch);
    filterButton.addEventListener('click', openFilterModal);
    closeFilter.addEventListener('click', closeFilterModal);
    closeDetail.addEventListener('click', closeDetailModal);
    applyFilters.addEventListener('click', applyFiltersHandler);
    clearFilters.addEventListener('click', clearFiltersHandler);
    logoutButton.addEventListener('click', handleLogout);

    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === filterModal) {
            closeFilterModal();
        }
        if (event.target === detailModal) {
            closeDetailModal();
        }
    });

    // Functions
    function handleSearch() {
        currentFilters.search = searchInput.value.toLowerCase();
        filterVehicles();
    }

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
                if (!vehicle.name.toLowerCase().includes(searchTerm) &&
                    !vehicle.brand.toLowerCase().includes(searchTerm) &&
                    !vehicle.owner.toLowerCase().includes(searchTerm)) {
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
        if (vehiclesToRender.length === 0) {
            vehiclesContainer.innerHTML = `
                <div class="empty-container">
                    <div class="empty-emoji">🔍</div>
                    <div class="empty-text">No vehicles found</div>
                    <div class="empty-subtext">Try adjusting your search or filters</div>
                </div>
            `;
            return;
        }

        vehiclesContainer.innerHTML = vehiclesToRender.map(vehicle => `
            <div class="vehicle-card" onclick="showVehicleDetail(${vehicle.id})">
                <div class="vehicle-image-container">
                    ${vehicle.imageUri ? `<img src="${vehicle.imageUri}" alt="${vehicle.name}" class="vehicle-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">` : ''}
                    <div class="vehicle-emoji" style="${vehicle.imageUri ? 'display:none;' : ''}">${vehicle.image}</div>
                </div>
                <div class="vehicle-info">
                    <div class="vehicle-header">
                        <div class="vehicle-name">${vehicle.name}</div>
                        <div class="availability-badge ${vehicle.available ? '' : 'unavailable-badge'}">
                            ${vehicle.available ? 'Available' : 'Unavailable'}
                        </div>
                    </div>
                    <div class="vehicle-brand">${vehicle.brand}</div>
                    <div class="vehicle-details">
                        <div class="vehicle-detail">👥 ${vehicle.seats} seats</div>
                        <div class="vehicle-detail">⚙️ ${vehicle.transmission}</div>
                        <div class="vehicle-detail">⛽ ${vehicle.fuel}</div>
                    </div>
                    <div class="vehicle-features">
                        ${vehicle.features.slice(0, 3).map(feature => `<span class="feature-tag">${feature}</span>`).join('')}
                        ${vehicle.features.length > 3 ? `<span class="feature-tag">+${vehicle.features.length - 3}</span>` : ''}
                    </div>
                    <div class="price-row">
                        <div class="price-label">per day</div>
                        <div class="price">$${vehicle.price}</div>
                    </div>
                    <div class="owner-name">by ${vehicle.owner}</div>
                </div>
            </div>
        `).join('');
    }

    function updateStats(vehiclesToCount) {
        const totalVehicles = vehiclesToCount.length;
        const availableVehicles = vehiclesToCount.filter(v => v.available).length;
        const avgPrice = vehiclesToCount.length > 0
            ? Math.round(vehiclesToCount.reduce((sum, v) => sum + v.price, 0) / vehiclesToCount.length)
            : 0;

        document.getElementById('totalVehicles').textContent = totalVehicles;
        document.getElementById('availableVehicles').textContent = availableVehicles;
        document.getElementById('avgPrice').textContent = `$${avgPrice}`;
    }

    // Global function for vehicle detail (called from onclick)
    window.showVehicleDetail = function(vehicleId) {
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (!vehicle) return;

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
                <div class="detail-price">$${vehicle.price}</div>
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

            ${vehicle.available ?
                '<button class="rent-button" onclick="rentVehicle(' + vehicle.id + ')">Rent This Vehicle</button>' :
                '<div class="unavailable-button">Currently Unavailable</div>'
            }
        `;

        detailModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    };

    // Global function for renting vehicle
    window.rentVehicle = function(vehicleId) {
        alert('Vehicle rental functionality would be implemented here. Vehicle ID: ' + vehicleId);
        closeDetailModal();
    };

    // Filter option click handlers
    document.querySelectorAll('.filter-option').forEach(option => {
        option.addEventListener('click', function() {
            this.classList.toggle('active');
        });
    });

    function handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            // In a real app, this would clear authentication tokens
            window.location.href = '../index.html';
        }
    }
});