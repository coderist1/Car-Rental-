// Dashboard JavaScript
// Sample data - simulating system data
let vehicles = [
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
        available: true,
        image: "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=800&q=80"
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
        <div class="vehicle-card" onclick="openCarDetails(${vehicle.id})" role="button" tabindex="0">
            <div class="vehicle-image"><img src="${vehicle.image}" alt="${vehicle.name}"></div>
            <div class="vehicle-info">
                <h3 class="vehicle-name">${vehicle.name}</h3>
                <div class="vehicle-details">${vehicle.brand} • ${vehicle.year} • ${vehicle.type}</div>
                <div class="vehicle-meta">📍 ${vehicle.location} • 👥 ${vehicle.seats} seats • ⚙️ ${vehicle.transmission}</div>
                <div class="vehicle-price">₱${vehicle.pricePerDay.toLocaleString()}/day</div>
                <span class="vehicle-status ${vehicle.available ? 'status-available' : 'status-rented'}">
                    ${vehicle.available ? 'Available' : 'Rented'}
                </span>
                <div class="vehicle-actions">
                    <button class="btn btn-secondary" onclick="event.stopPropagation(); editVehicle(${vehicle.id})">Edit</button>
                    <button class="btn btn-danger" onclick="event.stopPropagation(); deleteVehicle(${vehicle.id})">Delete</button>
                </div>
            </div>
        </div>
    `).join('');
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
    document.getElementById('modal-availability').value = vehicle.available ? 'available' : 'rented';
    if(document.getElementById('modal-location')) document.getElementById('modal-location').value = vehicle.location || 'Manila';
    document.getElementById('modal-description').value = vehicle.description || '';
    // image
    const img = document.getElementById('modal-car-image');
    if(vehicle.image) img.src = vehicle.image;

    // set form readonly
    setModalReadonly(true);
    // track which vehicle is being edited in the modal
    window._currentModalVehicleId = vehicle.id;

    // attach edit/save handlers once (idempotent)
    if(!window._carDetailModalHandlersAttached){
        document.getElementById('modal-edit-btn').addEventListener('click', ()=> setModalReadonly(false));
        document.getElementById('modal-save-btn').addEventListener('click', modalSaveHandler);
        // Add image button + input handlers
        const imageInput = document.getElementById('modal-image-input');
        const addImageBtn = document.getElementById('modal-add-image-btn');
        addImageBtn.addEventListener('click', (ev)=>{
            ev.preventDefault();
            // only allow changing image when editing
            if (document.getElementById('modal-save-btn').disabled && document.getElementById('modal-edit-btn').disabled === false) {
                // not in edit mode
            }
            imageInput.click();
        });
        imageInput.addEventListener('change', (ev)=>{
            const f = ev.target.files && ev.target.files[0];
            if(!f) return;
            const reader = new FileReader();
            reader.onload = function(e){
                const url = e.target.result;
                document.getElementById('modal-car-image').src = url;
            };
            reader.readAsDataURL(f);
        });
        window._carDetailModalHandlersAttached = true;
    }
}

function setModalReadonly(readonly){
    const form = document.getElementById('modal-car-form');
    Array.from(form.elements).forEach(el => el.disabled = readonly);
    document.getElementById('modal-save-btn').disabled = readonly;
    document.getElementById('modal-edit-btn').disabled = !readonly ? true : false;
}

function modalSaveHandler(e){
    e.preventDefault();
    const idTitle = document.getElementById('modal-car-title').textContent;
    const data = {
        brand: document.getElementById('modal-make').value,
        name: document.getElementById('modal-model').value,
        year: parseInt(document.getElementById('modal-year').value),
        pricePerDay: parseFloat(document.getElementById('modal-price').value),
        available: document.getElementById('modal-availability').value === 'available',
        location: document.getElementById('modal-location') ? document.getElementById('modal-location').value : '',
        description: document.getElementById('modal-description').value,
        image: document.getElementById('modal-car-image').src
    };
    // ask user for permission before saving using custom confirm
    showConfirm('Save changes to this vehicle?').then(ok =>{
      if(!ok){
        document.getElementById('modal-save-note').textContent = 'Save cancelled.';
        return;
      }

      // find and update original vehicles array by tracked id
      const idx = vehicles.findIndex(v => v.id === window._currentModalVehicleId);
      if(idx >= 0){
          vehicles[idx] = { ...vehicles[idx], ...data };
      }

      // refresh UI
      updateStats();
      renderVehicles();
      setModalReadonly(true);
      document.getElementById('modal-save-note').textContent = 'Saved locally.';
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
        available: true,
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
    return new Promise(resolve=>{
        const modal = document.getElementById('confirm-modal');
        const msg = document.getElementById('confirm-message');
        const yes = document.getElementById('confirm-yes');
        const no = document.getElementById('confirm-no');
        if(!modal || !msg || !yes || !no){
            console.log('Confirm modal elements not found, using native confirm');
            // fallback to native confirm if modal not present
            resolve(window.confirm(message));
            return;
        }
        console.log('Showing confirm modal with message:', message);
        msg.textContent = message;
        modal.style.display = 'flex'; // Changed to flex to match CSS
        const cleanup = ()=>{
            modal.style.display = 'none';
            yes.removeEventListener('click', onYes);
            no.removeEventListener('click', onNo);
        };
        const onYes = ()=>{ console.log('Yes clicked'); cleanup(); resolve(true); };
        const onNo = ()=>{ console.log('No clicked'); cleanup(); resolve(false); };
        yes.addEventListener('click', onYes);
        no.addEventListener('click', onNo);
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