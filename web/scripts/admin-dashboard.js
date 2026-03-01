// admin-dashboard.js - minimal admin controls
document.addEventListener('DOMContentLoaded', () => {
    loadAdminProfile();
    refreshAdminDashboard();

    // Refresh when profile changes
    window.addEventListener('profileUpdated', () => {
        loadAdminProfile();
    });
    // initialize admin panel visibility and navigation
    try{
        // show only users panel by default
        document.querySelectorAll('.admin-panel, #analytics-panel').forEach(el=>{ el.style.display = 'none'; });
        const defaultPanel = document.getElementById('users-panel');
        if(defaultPanel) defaultPanel.style.display = '';

        // global navigate function used by sidebar links
        window.navigateAdmin = function(e){
            e.preventDefault();
            const target = e.currentTarget.getAttribute('data-target');
            if(!target) return;

            // hide analytics wrapper and all admin panels
            document.querySelectorAll('.admin-panel, #analytics-panel').forEach(el=>{ el.style.display = 'none'; });

            // show target panel (could be analytics-panel or an admin-panel id)
            const targetEl = document.getElementById(target);
            if(targetEl) targetEl.style.display = '';

            // update active link state
            document.querySelectorAll('.sidebar-nav a').forEach(a=>a.classList.remove('active'));
            e.currentTarget.classList.add('active');

            // ensure the visible section is scrolled into view
            if(targetEl) targetEl.scrollIntoView({behavior:'smooth', block:'start'});
        };
    }catch(e){}
});

function refreshAdminDashboard() {
    renderUsers();
    renderVehicles();
    renderOwnerApprovals();
    renderVehicleApprovals();
    renderRentals();
    renderAnalytics();
}

function loadAdminProfile() {
    try {
        const raw = localStorage.getItem('userProfile');
        if (!raw) return;
        const u = JSON.parse(raw);
        const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Admin';
        const el = document.getElementById('admin-welcome');
        if (el) el.textContent = `Welcome, ${name}`;
        const pm = document.getElementById('adminProfile');
        if (pm) pm.setAttribute('username', name);
    } catch (e) {}
}

function getUsers() {
    try {
        const raw = localStorage.getItem('carRentalUsers');
        return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
}

function saveUsers(users) {
    try { localStorage.setItem('carRentalUsers', JSON.stringify(users)); } catch(e){}
}

function renderUsers(){
    const container = document.getElementById('admin-users');
    const users = getUsers();
    if(!container) return;
    if(users.length===0){ container.innerHTML = '<div class="admin-empty">No users</div>'; return; }
    const rows = users.map(u=>{
        const name = u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim();
        const active = u.active === false ? 'deactivated' : 'active';
        return `<div class="admin-row">
            <div class="admin-row-main">
                <strong class="admin-row-title">${name || 'Unnamed User'}</strong>
                <small class="admin-row-meta">${u.email || '-'} • ${u.role || 'user'} • ${active}</small>
            </div>
            <div class="admin-row-actions">
                <button class="btn btn-outline" onclick="adminToggleUser(${u.id})">${u.active === false ? 'Activate' : 'Deactivate'}</button>
                <button class="btn btn-secondary" onclick="showUserVehicles(${u.id})">View Cars</button>
                <button class="btn btn-danger" onclick="adminDeleteUser(${u.id})">Delete</button>
            </div>
        </div>`;
    }).join('');
    container.innerHTML = `<div class="admin-list">${rows}</div>`;
}

function showUserVehicles(userId){
    try{
        const users = getUsers();
        const user = users.find(u=>u.id===userId);
        const containerWrap = document.getElementById('user-vehicles');
        const listEl = document.getElementById('user-vehicles-list');
        if(!containerWrap || !listEl) return;

        const allVehicles = getVehicles();
        const ownerEmail = user && user.email ? user.email : '';
        const ownerNameLower = user ? (user.fullName || `${user.firstName||''} ${user.lastName||''}`).trim().toLowerCase() : '';

        const vehicles = allVehicles.filter(v=>{
            try{
                if(v == null) return false;
                if(v.ownerId && String(v.ownerId) === String(userId)) return true;
                if(ownerEmail && (v.ownerEmail === ownerEmail || v.owner === ownerEmail)) return true;
                const vOwnerName = (v.ownerName || v.owner || v.ownerFullName || '').toLowerCase();
                if(ownerNameLower && vOwnerName && vOwnerName.includes(ownerNameLower)) return true;
                return false;
            }catch(e){return false}
        });

        // header: show panel and update title to include owner name
        containerWrap.style.display = '';
        const titleEl = containerWrap.querySelector('.panel-subtitle');
        const ownerName = user ? (user.fullName || `${user.firstName||''} ${user.lastName||''}`.trim()) : 'Owner';
        if(titleEl) titleEl.textContent = `Vehicles owned by ${ownerName}`;
        if(user){
            listEl.innerHTML = `<div style="padding:8px 12px 6px;"><strong>${ownerName}</strong> — ${user.email || ''}</div>`;
        } else {
            listEl.innerHTML = `<div style="padding:8px 12px 6px;">Owner not found</div>`;
        }

        if(vehicles.length===0){
            // helpful hint when none are found + diagnostic output
            listEl.innerHTML += '<div class="admin-empty">This owner has no vehicles. Ensure each vehicle has `ownerId` (matching user id) or `ownerEmail` set.</div>';
            // diagnostic: show all vehicles with owner fields to help debug
            const all = allVehicles.map(v=>({ id: v.id, name: v.name, ownerId: v.ownerId, ownerEmail: v.ownerEmail, ownerName: v.ownerName || v.owner || v.ownerFullName || '', rawOwner: v.owner }));
            let diag = '<div style="margin-top:10px;padding:8px;border-top:1px dashed #e6eef3;">';
            diag += '<strong>Vehicles (diagnostic)</strong>';
            diag += '<div style="font-size:0.9rem;margin-top:8px;">';
            diag += '<button class="btn btn-outline" onclick="tryLinkVehiclesToOwner('+userId+')">Attempt link vehicles to this owner</button>';
            diag += '<div style="margin-top:8px;">';
            diag += all.map(a=>`<div style="padding:6px 0;border-bottom:1px solid #f1f5f9;"><strong>#${a.id}</strong> ${a.name||''} — ownerId: <em>${a.ownerId||''}</em> ownerEmail: <em>${a.ownerEmail||''}</em> ownerName: <em>${a.ownerName||''}</em></div>`).join('');
            diag += '</div></div></div>';
            listEl.innerHTML += diag;
        } else {
            const rows = vehicles.map(v=>{
                // choose best available image: photo array, imageUri, image property
                const thumbSrc = v.photos && v.photos[0]
                    ? v.photos[0]
                    : (v.imageUri || v.image || '');
                const price = v.price ? `₱${Number(v.price).toLocaleString()}` : '-';
                const status = v.approval || v.status || 'unknown';
                return `<div class="uv-card">
                    <div class="uv-thumb">${ thumbSrc ? `<img src="${thumbSrc}" alt="${v.name||''}" style="width:100%;height:100%;object-fit:cover">` : '🚗' }</div>
                    <div class="uv-body">
                        <div class="uv-title">${v.brand || ''} ${v.name || ''}</div>
                        <div class="uv-meta">${v.plate || '-'} • ${v.location || '-'} • ${status}</div>
                        <div class="uv-meta">Owner: ${ownerName}</div>
                        <div class="uv-meta">Price: ${price}</div>
                        <div class="uv-footer">
                            ${ status === 'pending' ? `<button class="btn btn-primary" onclick="approveVehicle(${v.id})">Approve</button>` : '' }
                        </div>
                    </div>
                </div>`;
            }).join('');
            listEl.innerHTML += `<div class="vehicle-grid">${rows}</div>`;
        }

        // scroll to the user vehicles area
        containerWrap.scrollIntoView({behavior:'smooth', block:'center'});
    }catch(e){console.error(e)}
}

function closeUserVehicles(){
    const containerWrap = document.getElementById('user-vehicles');
    if(containerWrap) containerWrap.style.display = 'none';
}

function tryLinkVehiclesToOwner(userId){
    try{
        const users = getUsers();
        const user = users.find(u=>u.id===userId);
        if(!user){ alert('Owner not found'); return; }
        const vehicles = getVehicles();
        const ownerEmail = (user.email||'').toLowerCase();
        const ownerFull = (user.fullName || `${user.firstName||''} ${user.lastName||''}`).trim().toLowerCase();
        let changed = 0;
        vehicles.forEach(v=>{
            if(v.ownerId && String(v.ownerId)===String(userId)) return; // already linked
            const vOwner = (v.owner || v.ownerName || v.ownerFullName || '').toString().toLowerCase();
            if(v.ownerEmail && v.ownerEmail.toLowerCase() === ownerEmail){ v.ownerId = userId; v.ownerName = user.fullName || ownerFull; changed++; }
            else if(ownerFull && vOwner === ownerFull){ v.ownerId = userId; v.ownerEmail = user.email || ''; v.ownerName = user.fullName || ownerFull; changed++; }
            else if(ownerFull && vOwner.includes(ownerFull)){ v.ownerId = userId; v.ownerEmail = user.email || ''; v.ownerName = user.fullName || ownerFull; changed++; }
        });
        if(changed>0){ saveVehicles(vehicles); refreshAdminDashboard(); alert('Linked '+changed+' vehicle(s) to this owner.'); showUserVehicles(userId); }
        else { alert('No vehicles matched automatically. Check the diagnostic list for owner fields.'); }
    }catch(e){ console.error(e); alert('Error while linking vehicles') }
}

window.adminToggleUser = function(userId){
    try{
        const users = getUsers();
        const idx = users.findIndex(u=>u.id===userId);
        if(idx===-1) return;
        users[idx].active = !(users[idx].active === false);
        saveUsers(users);
        refreshAdminDashboard();
        alert('User status updated');
    }catch(e){console.error(e)}
}

window.adminDeleteUser = function(userId){
    if(!confirm('Delete user? This cannot be undone.')) return;
    try{
        let users = getUsers();
        users = users.filter(u=>u.id!==userId);
        saveUsers(users);
        refreshAdminDashboard();
        alert('User deleted');
    }catch(e){console.error(e)}
}

function getVehicles(){
    try{ const raw = localStorage.getItem('ownerVehicles'); return raw? JSON.parse(raw): []; }catch(e){return []}
}

function saveVehicles(v){ try{ localStorage.setItem('ownerVehicles', JSON.stringify(v)); }catch(e){} }

function renderVehicles(){
    const container = document.getElementById('admin-vehicles');
    const vehicles = getVehicles();
    const users = getUsers();
    if(!container) return;
    if(vehicles.length===0){ container.innerHTML = '<div class="admin-empty">No vehicles</div>'; return; }
    const rows = vehicles.map(v=>{
        const owner = users.find(u =>
            (v.ownerId != null && String(u.id) === String(v.ownerId)) ||
            ((v.ownerEmail || '').toLowerCase() !== '' && (u.email || '').toLowerCase() === (v.ownerEmail || '').toLowerCase()) ||
            ((v.ownerName || v.owner || '').toLowerCase() !== '' &&
                (u.fullName || `${u.firstName||''} ${u.lastName||''}`.trim()).toLowerCase() === (v.ownerName || v.owner || '').toLowerCase())
        );
        const ownerName = owner
            ? (owner.fullName || `${owner.firstName||''} ${owner.lastName||''}`.trim())
            : (v.ownerName || v.owner || v.ownerEmail || 'Unknown owner');
        return `<div class="admin-row">
            <div class="admin-row-main">
                <strong class="admin-row-title">${v.brand || ''} ${v.name || ''}</strong>
                <small class="admin-row-meta">${v.plate || '-'} • ${v.location || '-'} • ${v.status || 'unknown'}</small>
                <small class="admin-row-meta">Owner: ${ownerName}</small>
            </div>
            <div class="admin-row-actions">
                <button class="btn btn-outline" onclick="adminDeleteVehicle(${v.id})">Delete</button>
            </div>
        </div>`;
    }).join('');
    container.innerHTML = `<div class="admin-list">${rows}</div>`;
}

// Owner approvals
function renderOwnerApprovals(){
    const container = document.getElementById('owner-approvals');
    if(!container) return;
    const users = getUsers().filter(u => u.role === 'owner');
    const pending = users.filter(u => (u.ownerStatus || 'pending') === 'pending');
    if(pending.length===0){ container.innerHTML = '<div class="admin-empty">No pending owner registrations</div>'; return; }
    const rows = pending.map(u=>{
        const name = u.fullName || `${u.firstName||''} ${u.lastName||''}`.trim();
        return `<div class="admin-row">
            <div class="admin-row-main">
                <strong class="admin-row-title">${name || 'Unnamed'}</strong>
                <small class="admin-row-meta">${u.email || '-'} • ${u.ownerStatus || 'pending'}</small>
            </div>
            <div class="admin-row-actions">
                <button class="btn btn-primary" onclick="approveOwner(${u.id})">Approve</button>
                <button class="btn btn-outline" onclick="rejectOwner(${u.id})">Reject</button>
            </div>
        </div>`;
    }).join('');
    container.innerHTML = `<div class="admin-list">${rows}</div>`;
}

window.approveOwner = function(userId){
    if(!confirm('Approve this owner registration?')) return;
    try{
        const users = getUsers();
        const idx = users.findIndex(u=>u.id===userId);
        if(idx===-1) return;
        users[idx].ownerStatus = 'approved';
        users[idx].verifiedAt = new Date().toISOString();
        saveUsers(users);
        refreshAdminDashboard();
        alert('Owner approved');
    }catch(e){console.error(e)}
}

window.rejectOwner = function(userId){
    if(!confirm('Reject this owner registration?')) return;
    try{
        const users = getUsers();
        const idx = users.findIndex(u=>u.id===userId);
        if(idx===-1) return;
        users[idx].ownerStatus = 'rejected';
        saveUsers(users);
        refreshAdminDashboard();
        alert('Owner rejected');
    }catch(e){console.error(e)}
}

// Vehicle listing approvals
function renderVehicleApprovals(){
    const container = document.getElementById('vehicle-approvals');
    if(!container) return;
    const vehicles = getVehicles();
    const pending = vehicles.filter(v => (v.approval || 'pending') === 'pending');
    if(pending.length===0){ container.innerHTML = '<div class="admin-empty">No pending vehicle listings</div>'; return; }
    const rows = pending.map(v=>{
        return `<div class="admin-row">
            <div class="admin-row-main">
                <strong class="admin-row-title">${v.brand || ''} ${v.name || ''}</strong>
                <small class="admin-row-meta">${v.plate || '-'} • ${v.location || '-'} • ${v.approval || 'pending'}</small>
            </div>
            <div class="admin-row-actions">
                <button class="btn btn-primary" onclick="approveVehicle(${v.id})">Approve</button>
                <button class="btn btn-outline" onclick="rejectVehicle(${v.id})">Reject</button>
            </div>
        </div>`;
    }).join('');
    container.innerHTML = `<div class="admin-list">${rows}</div>`;
}

window.approveVehicle = function(vehicleId){
    if(!confirm('Approve this vehicle listing?')) return;
    try{
        const v = getVehicles();
        const idx = v.findIndex(x=>x.id===vehicleId);
        if(idx===-1) return;
        v[idx].approval = 'approved';
        v[idx].approvedAt = new Date().toISOString();
        v[idx].status = v[idx].status || 'available';
        saveVehicles(v);
        refreshAdminDashboard();
        alert('Vehicle approved');
    }catch(e){console.error(e)}
}

window.rejectVehicle = function(vehicleId){
    if(!confirm('Reject this vehicle listing?')) return;
    try{
        const v = getVehicles();
        const idx = v.findIndex(x=>x.id===vehicleId);
        if(idx===-1) return;
        v[idx].approval = 'rejected';
        saveVehicles(v);
        refreshAdminDashboard();
        alert('Vehicle rejected');
    }catch(e){console.error(e)}
}

window.adminDeleteVehicle = function(id){
    if(!confirm('Delete vehicle?')) return;
    try{
        let v = getVehicles();
        v = v.filter(x=>x.id!==id);
        saveVehicles(v);
        refreshAdminDashboard();
        alert('Vehicle deleted');
    }catch(e){console.error(e)}
}

function getRentals(){
    try{ const raw = localStorage.getItem('rentalHistory'); return raw? JSON.parse(raw): []; }catch(e){return []}
}

function editVehicle(id){
    // simple inline edit stub — open vehicle in new tab or modal
    const vehicles = getVehicles();
    const v = vehicles.find(x=>x.id===id);
    if(!v){ alert('Vehicle not found'); return; }
    // for now just prompt to change name
    const newName = prompt('Edit vehicle name', v.name || '');
    if(newName===null) return;
    v.name = newName;
    saveVehicles(vehicles);
    refreshAdminDashboard();
    alert('Vehicle updated');
}
function saveRentals(r){ try{ localStorage.setItem('rentalHistory', JSON.stringify(r)); }catch(e){} }

function renderRentals(){
    const container = document.getElementById('admin-rentals');
    const rentals = getRentals();
    if(!container) return;
    if(rentals.length===0){ container.innerHTML = '<div class="admin-empty">No rental records</div>'; return; }
    const rows = rentals.map(r=>{
        const status = r.endDate ? 'Completed' : (r.returnRequested ? 'Return requested' : 'Ongoing');
        const pillClass = r.endDate ? 'done' : 'pending';
        return `<div class="admin-row">
            <div class="admin-row-main">
                <strong class="admin-row-title">${r.vehicleName || 'Vehicle'}</strong>
                <small class="admin-row-meta">Renter: ${r.renterName || 'N/A'} • ${status}</small>
            </div>
            <div class="admin-row-actions">
                <span class="admin-pill ${pillClass}">${status}</span>
                ${!r.endDate ? `<button class="btn btn-primary" onclick="adminForceComplete(${r.id})">Force Complete</button>` : ''}
            </div>
        </div>`;
    }).join('');
    container.innerHTML = `<div class="admin-list">${rows}</div>`;
}

window.adminForceComplete = function(recordId){
    if(!confirm('Mark this rental as completed?')) return;
    try{
        const rentals = getRentals();
        const idx = rentals.findIndex(r=>r.id===recordId);
        if(idx===-1) return;
        rentals[idx].endDate = new Date().toISOString();
        rentals[idx].returnAccepted = true;
        saveRentals(rentals);

        // update vehicle availability if present
        const vehicles = getVehicles();
        const vid = rentals[idx].vehicleId;
        const vIdx = vehicles.findIndex(v=>v.id===vid);
        if(vIdx!==-1){ vehicles[vIdx].status = 'available'; vehicles[vIdx].available = true; saveVehicles(vehicles); }

        refreshAdminDashboard();
        alert('Rental marked completed');
    }catch(e){console.error(e)}
}

function renderAnalytics() {
    const users = getUsers();
    const vehicles = getVehicles();
    const rentals = getRentals();

    const totalUsers = users.length;
    const activeVehicles = vehicles.filter(v => (v.status || '').toLowerCase() === 'available').length;
    const ongoingRentals = rentals.filter(r => !r.endDate).length;
    const dailyRevenue = rentals
        .filter(r => !r.endDate)
        .reduce((sum, rental) => sum + Number(rental.amount || 0), 0);

    const usersEl = document.getElementById('analytics-users');
    const vehiclesEl = document.getElementById('analytics-vehicles');
    const rentalsEl = document.getElementById('analytics-rentals');
    const revenueEl = document.getElementById('analytics-revenue');

    if (usersEl) usersEl.textContent = String(totalUsers);
    if (vehiclesEl) vehiclesEl.textContent = String(activeVehicles);
    if (rentalsEl) rentalsEl.textContent = String(ongoingRentals);
    if (revenueEl) revenueEl.textContent = `₱${dailyRevenue.toLocaleString()}`;
}
