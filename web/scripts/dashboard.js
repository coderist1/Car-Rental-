// Dashboard JavaScript
// Sample data - simulating system data
const STORAGE_KEY = 'ownerVehicles';
const defaultVehicles = [
    {
        id: 2,
        name: "BMW X5",
        brand: "BMW",
        year: 2022,
        pricePerDay: 5500,
        location: "Makati",
        seats: 7,
        transmission: "Automatic",
        type: "SUV",
        fuel: "Diesel",
        plate: "ABC 1234",
        color: "White",
        status: "rented",
        available: false,
        image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80"
    },
    {
        id: 3,
        name: "Ferrari 488",
        brand: "Ferrari",
        year: 2021,
        pricePerDay: 25000,
        location: "Taguig",
        seats: 2,
        transmission: "Manual",
        type: "Sports",
        fuel: "Gasoline",
        plate: "XYZ 5678",
        color: "Red",
        status: "available",
        available: true,
        image: "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=800&q=80"
    }
];

let vehicles = [];

let editingVehicleId = null;

// Initialize the dashboard
function initDashboard() {
    vehicles = defaultVehicles.slice();
    updateStats();
    renderVehicles();
    setupSearch();
}

function normalizeVehicle(vehicle) {
    const status = vehicle.status || (vehicle.available ? 'available' : 'rented');
    return {
        ...vehicle,
        status,
        available: status === 'available'
    };
}

function loadStoredVehicles() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : null;
    } catch (err) {
        return null;
    }
}

function saveStoredVehicles() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles));
    } catch (err) {
        // Ignore storage errors (private mode, quota).
    }
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

    // Wait for custom element to be defined before rendering
    customElements.whenDefined('vehicle-card').then(() => {
        grid.innerHTML = '';
        filteredVehicles.forEach(vehicle => {
            const card = document.createElement('vehicle-card');
            card.setAttribute('vehicle-id', vehicle.id);
            card.setAttribute('name', `${vehicle.brand} ${vehicle.name}`);
            card.setAttribute('type', vehicle.type);
            card.setAttribute('price', vehicle.pricePerDay.toLocaleString());
            card.setAttribute('image', vehicle.image);
            card.setAttribute('location', vehicle.location);
            card.setAttribute('seats', vehicle.seats);
            card.setAttribute('transmission', vehicle.transmission);
            card.setAttribute('status', vehicle.status || (vehicle.available ? 'available' : 'rented'));
            card.setAttribute('mode', 'owner');
            
            card.addEventListener('vehicle-action', (e) => {
                const { action, vehicleId } = e.detail;
                if (action === 'edit') {
                    editVehicle(vehicleId);
                } else if (action === 'delete') {
                    deleteVehicle(vehicleId);
                }
            });

            card.addEventListener('vehicle-click', (e) => {
                const { vehicleId } = e.detail;
                if (vehicleId !== null && !Number.isNaN(vehicleId)) {
                    openCarDetails(vehicleId);
                }
            });
            
            grid.appendChild(card);
        });
    });
}

// Open car details page: store selected vehicle and navigate
// Open car details modal: populate and show modal overlay
function openCarDetails(id){
    const vehicle = vehicles.find(v=>v.id===id);
    if(!vehicle) return;
    populateCarDetailModal(vehicle);
    showCarDetailModal();
}

function populateCarDetailModal(vehicle){
    document.getElementById('modal-car-title').textContent = `${vehicle.brand} ${vehicle.name}`;
    document.getElementById('modal-make').value = vehicle.brand || '';
    document.getElementById('modal-model').value = vehicle.name || '';
    document.getElementById('modal-year').value = vehicle.year || '';
    document.getElementById('modal-price').value = vehicle.pricePerDay || '';
    document.getElementById('modal-availability').value = vehicle.status || (vehicle.available ? 'available' : 'rented');
    if(document.getElementById('modal-location')) document.getElementById('modal-location').value = vehicle.location || 'Manila';
    document.getElementById('modal-description').value = vehicle.description || '';
    // image
    const img = document.getElementById('modal-car-image');
    if(vehicle.image) img.src = vehicle.image;

    const form = document.getElementById('modal-car-form');
    Array.from(form.elements).forEach(el => {
        el.disabled = true;
    });
}

function showCarDetailModal(){
    document.getElementById('car-detail-modal').style.display = 'block';
}

function closeCarDetailModal(){
    document.getElementById('car-detail-modal').style.display = 'none';
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
    const availabilitySelect = document.getElementById('vehicle-availability');
    if (availabilitySelect) availabilitySelect.value = 'available';
    // reset image preview and internal image data
    const preview = document.getElementById('vehicle-image-preview');
    if(preview) preview.src = '../assets/car-placeholder.jpg';
    window._vehicleImageDataUrl = null;
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
    if (document.getElementById('vehicle-availability')) {
        document.getElementById('vehicle-availability').value = vehicle.status || (vehicle.available ? 'available' : 'rented');
    }
    if(document.getElementById('vehicle-fuel')) document.getElementById('vehicle-fuel').value = vehicle.fuel || '';
    if(document.getElementById('vehicle-plate')) document.getElementById('vehicle-plate').value = vehicle.plate || '';
    if(document.getElementById('vehicle-color')) document.getElementById('vehicle-color').value = vehicle.color || '';
    if(document.getElementById('vehicle-description')) document.getElementById('vehicle-description').value = vehicle.description || '';
    // populate image preview & internal data
    const preview = document.getElementById('vehicle-image-preview');
    if(preview && vehicle.image) preview.src = vehicle.image;
    window._vehicleImageDataUrl = vehicle.image || null;

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
        fuel: document.getElementById('vehicle-fuel') ? document.getElementById('vehicle-fuel').value : '',
        plate: document.getElementById('vehicle-plate') ? document.getElementById('vehicle-plate').value : '',
        color: document.getElementById('vehicle-color') ? document.getElementById('vehicle-color').value : '',
        description: document.getElementById('vehicle-description') ? document.getElementById('vehicle-description').value : '',
        status: document.getElementById('vehicle-availability')
            ? document.getElementById('vehicle-availability').value
            : 'available',
        available: document.getElementById('vehicle-availability')
            ? document.getElementById('vehicle-availability').value === 'available'
            : true,
        image: window._vehicleImageDataUrl || getVehicleImage(document.getElementById('vehicle-type').value)
    };

    if (!formData.name || !formData.brand || !formData.pricePerDay || !formData.location || !formData.type || !formData.transmission || !formData.fuel || !formData.plate) {
        alert('Please fill in all required fields (marked with *)');
        return;
    }

    // Ask for confirmation when editing existing vehicle
    if (editingVehicleId) {
        showConfirm('Save changes to this vehicle?').then(ok => {
            if (!ok) return; // User cancelled

            // Update existing vehicle
            const index = vehicles.findIndex(v => v.id === editingVehicleId);
            vehicles[index] = { ...vehicles[index], ...formData };

            updateStats();
            renderVehicles();
            closeModal();
        });
    } else {
        // Add new vehicle (no confirmation needed for new items)
        const newId = Math.max(...vehicles.map(v => v.id), 0) + 1;
        vehicles.push({ id: newId, ...formData });

        updateStats();
        renderVehicles();
        closeModal();
    }
}

function deleteVehicle(id) {
    showConfirm('Are you sure you want to delete this vehicle?').then(ok=>{
        if(!ok) return;
        vehicles = vehicles.filter(v => v.id !== id);
        updateStats();
        renderVehicles();
    });
}

function getVehicleImage(type){
    const imgs = {
        'Sedan': 'https://images.unsplash.com/photo-1549921296-3b6a7aa7a10b?auto=format&fit=crop&w=800&q=80',
        'SUV': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80',
        'Sports': 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=800&q=80',
        'Pickup': 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=800&q=80',
        'Hatchback': 'https://images.unsplash.com/photo-1549921296-3b6a7aa7a10b?auto=format&fit=crop&w=800&q=80',
        'Van': 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=800&q=80',
        'MPV': 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=800&q=80',
        'Crossover': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80',
        'Coupe': 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=800&q=80'
    };
    return imgs[type] || imgs['Sedan'];
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initDashboard);

// Generic showConfirm that returns a Promise<boolean>
function showConfirm(message){
    return customElements.whenDefined('confirm-modal').then(() => {
        const modal = document.getElementById('confirm-modal');
        if (!modal) {
            console.log('Confirm modal not found, using native confirm');
            return Promise.resolve(window.confirm(message));
        }
        return modal.show(message);
    });
}

// Close modal when clicking outside
window.onclick = function(event) {
    const addModal = document.getElementById('vehicle-modal');
    const detailModal = document.getElementById('car-detail-modal');
    if (event.target === addModal) {
        closeModal();
    }
    if (event.target === detailModal) {
        closeCarDetailModal();
    }
}

// handle vehicle image input preview and data URL storage
document.addEventListener('DOMContentLoaded', ()=>{
    const input = document.getElementById('vehicle-image-input');
    const preview = document.getElementById('vehicle-image-preview');
    if(!input || !preview) return;
    input.addEventListener('change', (ev)=>{
        const file = ev.target.files && ev.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = function(e){
            const url = e.target.result;
            preview.src = url;
            window._vehicleImageDataUrl = url; // store for saving
        };
        reader.readAsDataURL(file);
    });
});