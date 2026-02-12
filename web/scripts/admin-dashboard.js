// Admin Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Mock data
    const mockUsers = [
        {
            id: 1,
            name: 'John Smith',
            email: 'john@example.com',
            role: 'owner',
            vehicles: []
        },
        {
            id: 2,
            name: 'Sarah Johnson',
            email: 'sarah@example.com',
            role: 'renter'
        },
        {
            id: 3,
            name: 'Mike Davis',
            email: 'mike@example.com',
            role: 'owner',
            vehicles: []
        },
        {
            id: 4,
            name: 'Emma Wilson',
            email: 'emma@example.com',
            role: 'renter'
        }
    ];

    const mockVehicles = [
        {
            id: 1,
            name: 'BMW X5',
            brand: 'BMW',
            year: 2022,
            pricePerDay: 85,
            location: 'New York',
            ownerName: 'John Smith',
            ownerId: 1,
            available: true,
            image: '🚗'
        },
        {
            id: 2,
            name: 'Honda Civic',
            brand: 'Honda',
            year: 2021,
            pricePerDay: 45,
            location: 'Los Angeles',
            ownerName: 'Mike Davis',
            ownerId: 3,
            available: true,
            image: '🚙'
        },
        {
            id: 3,
            name: 'Ford Mustang',
            brand: 'Ford',
            year: 2020,
            pricePerDay: 120,
            location: 'Chicago',
            ownerName: 'Mike Davis',
            ownerId: 3,
            available: false,
            image: '🏎️'
        }
    ];

    const mockRentals = [
        { id: 1, vehicleId: 3, status: 'active' }
    ];

    // DOM Elements
    const tabs = document.querySelectorAll('.tab');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const userSearchInput = document.getElementById('userSearchInput');
    const vehicleSearchInput = document.getElementById('vehicleSearchInput');
    const logoutButton = document.getElementById('logoutButton');

    // Modal elements
    const userDetailModal = document.getElementById('userDetailModal');
    const vehicleDetailModal = document.getElementById('vehicleDetailModal');
    const closeUserModal = document.getElementById('closeUserModal');
    const closeVehicleModal = document.getElementById('closeVehicleModal');

    // Current state
    let currentUserSearch = '';
    let currentVehicleSearch = '';
    let selectedUser = null;
    let selectedVehicle = null;
    let isEditingVehicle = false;

    // Initialize
    updateOverviewStats();
    renderRecentVehicles();
    renderUsers();
    renderVehicles();

    // Event Listeners
    tabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    userSearchInput.addEventListener('input', handleUserSearch);
    vehicleSearchInput.addEventListener('input', handleVehicleSearch);
    logoutButton.addEventListener('click', handleLogout);

    // Modal event listeners
    closeUserModal.addEventListener('click', () => closeModal(userDetailModal));
    closeVehicleModal.addEventListener('click', () => closeModal(vehicleDetailModal));

    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === userDetailModal) {
            closeModal(userDetailModal);
        }
        if (event.target === vehicleDetailModal) {
            closeModal(vehicleDetailModal);
        }
    });

    // Functions
    function switchTab(tabName) {
        tabs.forEach(tab => tab.classList.remove('active'));
        tabPanes.forEach(pane => pane.classList.remove('active'));

        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}Tab`).classList.add('active');

        // Clear search when switching tabs
        if (tabName === 'users') {
            userSearchInput.value = '';
            currentUserSearch = '';
            renderUsers();
        } else if (tabName === 'vehicles') {
            vehicleSearchInput.value = '';
            currentVehicleSearch = '';
            renderVehicles();
        }
    }

    function handleUserSearch() {
        currentUserSearch = userSearchInput.value.toLowerCase();
        renderUsers();
    }

    function handleVehicleSearch() {
        currentVehicleSearch = vehicleSearchInput.value.toLowerCase();
        renderVehicles();
    }

    function updateOverviewStats() {
        const totalUsers = mockUsers.filter(u => u.role !== 'admin').length;
        const owners = mockUsers.filter(u => u.role === 'owner').length;
        const renters = mockUsers.filter(u => u.role === 'renter').length;
        const totalVehicles = mockVehicles.length;
        const availableVehicles = mockVehicles.filter(v => v.available).length;
        const rentedVehicles = totalVehicles - availableVehicles;
        const activeRentals = mockRentals.filter(r => r.status === 'active').length;
        const totalRevenue = mockVehicles.reduce((sum, v) => sum + v.pricePerDay, 0) * 30;

        document.getElementById('totalUsers').textContent = totalUsers;
        document.getElementById('totalVehicles').textContent = totalVehicles;
        document.getElementById('activeRentals').textContent = activeRentals;
        document.getElementById('availableVehicles').textContent = availableVehicles;
        document.getElementById('rentedVehicles').textContent = rentedVehicles;
        document.getElementById('ownersCount').textContent = owners;
        document.getElementById('rentersCount').textContent = renters;
        document.getElementById('revenueAmount').textContent = `$${totalRevenue.toLocaleString()}`;
    }

    function renderRecentVehicles() {
        const recentVehicles = mockVehicles.slice(0, 3);
        const container = document.getElementById('recentVehicles');

        container.innerHTML = recentVehicles.map(vehicle => `
            <div class="vehicle-card" onclick="showVehicleDetail(${vehicle.id})">
                <div class="vehicle-image-container">
                    <div class="vehicle-emoji">${vehicle.image}</div>
                </div>
                <div class="vehicle-info">
                    <div class="vehicle-name">${vehicle.name}</div>
                    <div class="vehicle-brand">${vehicle.brand} • ${vehicle.year}</div>
                    <div class="vehicle-details">
                        <div class="vehicle-detail">📍 ${vehicle.location}</div>
                        <div class="vehicle-detail">💰 $${vehicle.pricePerDay}/day</div>
                    </div>
                    <div class="owner-name">Owner: ${vehicle.ownerName}</div>
                    <div class="status-badge ${vehicle.available ? 'available-badge' : 'rented-badge'}">
                        ${vehicle.available ? 'Available' : 'Rented'}
                    </div>
                </div>
            </div>
        `).join('');
    }

    function renderUsers() {
        const filteredUsers = mockUsers.filter(user => {
            if (user.role === 'admin') return false;
            if (!currentUserSearch) return true;
            const searchTerm = currentUserSearch.toLowerCase();
            return user.name.toLowerCase().includes(searchTerm) ||
                   user.email.toLowerCase().includes(searchTerm);
        });

        const container = document.getElementById('usersContainer');

        if (filteredUsers.length === 0) {
            container.innerHTML = `
                <div class="empty-container">
                    <div class="empty-emoji">👤</div>
                    <div class="empty-text">No users found</div>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredUsers.map(user => `
            <div class="user-card" onclick="showUserDetail(${user.id})">
                <div class="user-avatar">
                    <div class="avatar-text">${user.name.charAt(0).toUpperCase()}</div>
                </div>
                <div class="user-info">
                    <div class="user-name">${user.name}</div>
                    <div class="user-email">${user.email}</div>
                    <div class="role-badge ${user.role}-badge">${user.role.toUpperCase()}</div>
                </div>
            </div>
        `).join('');
    }

    function renderVehicles() {
        const filteredVehicles = mockVehicles.filter(vehicle => {
            if (!currentVehicleSearch) return true;
            const searchTerm = currentVehicleSearch.toLowerCase();
            return vehicle.name.toLowerCase().includes(searchTerm) ||
                   vehicle.brand.toLowerCase().includes(searchTerm) ||
                   vehicle.ownerName.toLowerCase().includes(searchTerm);
        });

        const container = document.getElementById('vehiclesContainer');

        if (filteredVehicles.length === 0) {
            container.innerHTML = `
                <div class="empty-container">
                    <div class="empty-emoji">🚗</div>
                    <div class="empty-text">No vehicles found</div>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredVehicles.map(vehicle => `
            <div class="vehicle-card" onclick="showVehicleDetail(${vehicle.id})">
                <div class="vehicle-image-container">
                    <div class="vehicle-emoji">${vehicle.image}</div>
                </div>
                <div class="vehicle-info">
                    <div class="vehicle-name">${vehicle.name}</div>
                    <div class="vehicle-brand">${vehicle.brand} • ${vehicle.year}</div>
                    <div class="vehicle-details">
                        <div class="vehicle-detail">📍 ${vehicle.location}</div>
                        <div class="vehicle-detail">💰 $${vehicle.pricePerDay}/day</div>
                    </div>
                    <div class="owner-name">Owner: ${vehicle.ownerName}</div>
                    <div class="status-badge ${vehicle.available ? 'available-badge' : 'rented-badge'}">
                        ${vehicle.available ? 'Available' : 'Rented'}
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Global functions for onclick handlers
    window.showUserDetail = function(userId) {
        selectedUser = mockUsers.find(u => u.id === userId);
        if (!selectedUser) return;

        const userVehicles = selectedUser.role === 'owner'
            ? mockVehicles.filter(v => v.ownerId === selectedUser.id)
            : [];

        const content = document.getElementById('userDetailContent');
        content.innerHTML = `
            <div class="user-detail-header">
                <div class="large-avatar">
                    <div class="large-avatar-text">${selectedUser.name.charAt(0).toUpperCase()}</div>
                </div>
                <div class="detail-name">${selectedUser.name}</div>
                <div class="detail-email">${selectedUser.email}</div>
                <div class="role-badge-large ${selectedUser.role}-badge">${selectedUser.role.toUpperCase()}</div>
            </div>

            ${selectedUser.role === 'owner' ? `
                <div class="section">
                    <div class="section-title">Listed Vehicles (${userVehicles.length})</div>
                    ${userVehicles.length > 0 ? userVehicles.map(vehicle => `
                        <div class="mini-vehicle-card">
                            <div class="mini-vehicle-emoji">${vehicle.image}</div>
                            <div class="mini-vehicle-info">
                                <div class="mini-vehicle-name">${vehicle.name}</div>
                                <div class="mini-vehicle-price">$${vehicle.pricePerDay}/day</div>
                            </div>
                        </div>
                    `).join('') : '<div class="no-data-text">No vehicles listed</div>'}
                </div>
            ` : ''}

            <div class="section">
                <div class="section-title">Account Info</div>
                <div class="info-row">
                    <div class="info-label">User ID</div>
                    <div class="info-value">${selectedUser.id}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Role</div>
                    <div class="info-value">${selectedUser.role}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Status</div>
                    <div class="info-value active-status">Active</div>
                </div>
            </div>
        `;

        userDetailModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    };

    window.showVehicleDetail = function(vehicleId) {
        selectedVehicle = mockVehicles.find(v => v.id === vehicleId);
        if (!selectedVehicle) return;

        isEditingVehicle = false;
        renderVehicleDetailModal();
        vehicleDetailModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    };

    function renderVehicleDetailModal() {
        const formContainer = document.getElementById('vehicleDetailForm');
        const imageContainer = document.getElementById('vehicleDetailImage');

        if (isEditingVehicle) {
            formContainer.innerHTML = `
                <div class="editing-title">Edit Vehicle Details</div>

                <div class="detail-card">
                    <div class="card-title">Vehicle Image</div>
                    <div class="image-edit-container">
                        <div class="image-preview-box">
                            <div class="image-preview-text">${selectedVehicle.image}</div>
                        </div>
                        <button class="pick-image-button">📷 Pick Image</button>
                        <input type="text" class="image-edit-input" value="${selectedVehicle.image}" placeholder="Or paste emoji" maxlength="5">
                    </div>
                </div>

                <div class="detail-card">
                    <div class="card-title">Vehicle Info</div>
                    <div class="form-group">
                        <label class="input-label">Name</label>
                        <input type="text" class="edit-input" value="${selectedVehicle.name}">
                    </div>
                    <div class="form-group">
                        <label class="input-label">Brand</label>
                        <input type="text" class="edit-input" value="${selectedVehicle.brand}">
                    </div>
                    <div class="form-group">
                        <label class="input-label">Year</label>
                        <input type="number" class="edit-input" value="${selectedVehicle.year}">
                    </div>
                </div>

                <div class="detail-card">
                    <div class="card-title">Pricing & Location</div>
                    <div class="form-group">
                        <label class="input-label">Price/Day ($)</label>
                        <input type="number" class="edit-input" value="${selectedVehicle.pricePerDay}">
                    </div>
                    <div class="form-group">
                        <label class="input-label">Location</label>
                        <input type="text" class="edit-input" value="${selectedVehicle.location}">
                    </div>
                </div>

                <div class="edit-action-buttons">
                    <button class="cancel-edit-button" onclick="cancelEditVehicle()">Cancel</button>
                    <button class="save-edit-button" onclick="saveVehicleChanges()">Save Changes</button>
                </div>
            `;

            imageContainer.innerHTML = `
                <div class="vehicle-emoji-large">${selectedVehicle.image}</div>
            `;
        } else {
            formContainer.innerHTML = `
                <div class="detail-header">
                    <div class="detail-title">${selectedVehicle.name}</div>
                    <div class="status-badge-detail ${selectedVehicle.available ? 'available-badge-detail' : 'rented-badge-detail'}">
                        ${selectedVehicle.available ? 'Available' : 'Rented'}
                    </div>
                </div>
                <div class="detail-subtitle">${selectedVehicle.brand} • ${selectedVehicle.year}</div>

                <div class="detail-card">
                    <div class="card-title">Vehicle Info</div>
                    <div class="detail-row">
                        <div class="detail-label">Brand</div>
                        <div class="detail-value">${selectedVehicle.brand}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Year</div>
                        <div class="detail-value">${selectedVehicle.year}</div>
                    </div>
                </div>

                <div class="detail-card">
                    <div class="card-title">Pricing & Location</div>
                    <div class="detail-row">
                        <div class="detail-label">Price/Day</div>
                        <div class="detail-value price-value">$${selectedVehicle.pricePerDay}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Location</div>
                        <div class="detail-value">${selectedVehicle.location}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Owner</div>
                        <div class="detail-value">${selectedVehicle.ownerName}</div>
                    </div>
                </div>

                <button class="edit-action-button" onclick="startEditVehicle()">✏️ Edit Details</button>
            `;

            imageContainer.innerHTML = `
                <div class="vehicle-emoji-large">${selectedVehicle.image}</div>
            `;
        }
    }

    window.startEditVehicle = function() {
        isEditingVehicle = true;
        renderVehicleDetailModal();
    };

    window.cancelEditVehicle = function() {
        isEditingVehicle = false;
        renderVehicleDetailModal();
    };

    window.saveVehicleChanges = function() {
        const inputs = document.querySelectorAll('.edit-input');
        const imageInput = document.querySelector('.image-edit-input');

        selectedVehicle.name = inputs[0].value;
        selectedVehicle.brand = inputs[1].value;
        selectedVehicle.year = parseInt(inputs[2].value);
        selectedVehicle.pricePerDay = parseInt(inputs[3].value);
        selectedVehicle.location = inputs[4].value;
        selectedVehicle.image = imageInput.value;

        isEditingVehicle = false;
        renderVehicleDetailModal();
        renderVehicles();
        renderRecentVehicles();
        updateOverviewStats();

        // Close modal before showing alert to ensure it appears in front
        closeModal(vehicleDetailModal);
        setTimeout(() => {
            alert('Vehicle details updated successfully!');
        }, 100);
    };

    function closeModal(modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        selectedUser = null;
        selectedVehicle = null;
        isEditingVehicle = false;
    }

    function handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            window.location.href = '../index.html';
        }
    }
});