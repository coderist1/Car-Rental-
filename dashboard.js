// Dashboard JavaScript
// Sample data - simulating system data
let vehicles = [
    {
        id: 1,
        name: "Tesla Model 3",
        brand: "Tesla",
        year: 2023,
        pricePerDay: 85,
        location: "New York",
        seats: 5,
        transmission: "Automatic",
        type: "Sedan",
        available: true,
        image: "🚗"
    },
    {
        id: 2,
        name: "BMW X5",
        brand: "BMW",
        year: 2022,
        pricePerDay: 120,
        location: "Los Angeles",
        seats: 7,
        transmission: "Automatic",
        type: "SUV",
        available: false,
        image: "🚙"
    },
    {
        id: 3,
        name: "Ferrari 488",
        brand: "Ferrari",
        year: 2021,
        pricePerDay: 500,
        location: "Miami",
        seats: 2,
        transmission: "Manual",
        type: "Sports",
        available: true,
        image: "🏎️"
    }
];

let editingVehicleId = null;

// Initialize the dashboard
function initDashboard() {
    updateStats();
    renderVehicles();
    setupSearch();
}

// Update statistics
function updateStats() {
    const total = vehicles.length;
    const available = vehicles.filter(v => v.available).length;
    const rented = total - available;

    document.getElementById('total-vehicles').textContent = total;
    document.getElementById('available-vehicles').textContent = available;
    document.getElementById('rented-vehicles').textContent = rented;
}

// Render vehicles grid
function renderVehicles(filteredVehicles = vehicles) {
    const grid = document.getElementById('vehicles-grid');

    if (filteredVehicles.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-emoji">🚗</div>
                <h3 class="empty-title">No vehicles yet</h3>
                <p class="empty-text">Add your first vehicle to start earning</p>
                <button class="btn btn-primary" onclick="openAddModal()">+ Add Vehicle</button>
            </div>
        `;
        return;
    }

    grid.innerHTML = filteredVehicles.map(vehicle => `
        <div class="vehicle-card">
            <div class="vehicle-image">${vehicle.image}</div>
            <div class="vehicle-info">
                <h3 class="vehicle-name">${vehicle.name}</h3>
                <div class="vehicle-details">${vehicle.brand} • ${vehicle.year}</div>
                <div class="vehicle-price">$${vehicle.pricePerDay}/day</div>
                <span class="vehicle-status ${vehicle.available ? 'status-available' : 'status-rented'}">
                    ${vehicle.available ? 'Available' : 'Rented'}
                </span>
                <div class="vehicle-actions">
                    <button class="btn btn-secondary" onclick="editVehicle(${vehicle.id})">Edit</button>
                    <button class="btn btn-danger" onclick="deleteVehicle(${vehicle.id})">Delete</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Setup search functionality
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        const filtered = vehicles.filter(vehicle =>
            vehicle.name.toLowerCase().includes(query) ||
            vehicle.brand.toLowerCase().includes(query)
        );
        renderVehicles(filtered);
    });
}

// Modal functions
function openAddModal() {
    editingVehicleId = null;
    document.getElementById('modal-title').textContent = 'Add New Vehicle';
    document.getElementById('vehicle-form').reset();
    document.getElementById('vehicle-modal').style.display = 'block';
}

function editVehicle(id) {
    const vehicle = vehicles.find(v => v.id === id);
    if (!vehicle) return;

    editingVehicleId = id;
    document.getElementById('modal-title').textContent = 'Edit Vehicle';

    // Populate form
    document.getElementById('vehicle-name').value = vehicle.name;
    document.getElementById('vehicle-brand').value = vehicle.brand;
    document.getElementById('vehicle-year').value = vehicle.year;
    document.getElementById('vehicle-price').value = vehicle.pricePerDay;
    document.getElementById('vehicle-location').value = vehicle.location;
    document.getElementById('vehicle-seats').value = vehicle.seats;
    document.getElementById('vehicle-transmission').value = vehicle.transmission;
    document.getElementById('vehicle-type').value = vehicle.type;

    document.getElementById('vehicle-modal').style.display = 'block';
}

function closeModal() {
    document.getElementById('vehicle-modal').style.display = 'none';
    editingVehicleId = null;
}

function saveVehicle() {
    const formData = {
        name: document.getElementById('vehicle-name').value,
        brand: document.getElementById('vehicle-brand').value,
        year: parseInt(document.getElementById('vehicle-year').value),
        pricePerDay: parseInt(document.getElementById('vehicle-price').value),
        location: document.getElementById('vehicle-location').value,
        seats: parseInt(document.getElementById('vehicle-seats').value),
        transmission: document.getElementById('vehicle-transmission').value,
        type: document.getElementById('vehicle-type').value,
        available: true,
        image: getVehicleEmoji(document.getElementById('vehicle-type').value)
    };

    if (!formData.name || !formData.brand || !formData.pricePerDay) {
        alert('Please fill in all required fields');
        return;
    }

    if (editingVehicleId) {
        // Update existing vehicle
        const index = vehicles.findIndex(v => v.id === editingVehicleId);
        vehicles[index] = { ...vehicles[index], ...formData };
    } else {
        // Add new vehicle
        const newId = Math.max(...vehicles.map(v => v.id), 0) + 1;
        vehicles.push({ id: newId, ...formData });
    }

    updateStats();
    renderVehicles();
    closeModal();
}

function deleteVehicle(id) {
    if (confirm('Are you sure you want to delete this vehicle?')) {
        vehicles = vehicles.filter(v => v.id !== id);
        updateStats();
        renderVehicles();
    }
}

function getVehicleEmoji(type) {
    const emojis = {
        'Sedan': '🚗',
        'SUV': '🚙',
        'Sports': '🏎️',
        'Truck': '🚛'
    };
    return emojis[type] || '🚗';
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initDashboard);

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('vehicle-modal');
    if (event.target === modal) {
        closeModal();
    }
}