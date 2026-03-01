// bookings.js - Manage and display user bookings
class BookingsManager {
    constructor() {
        this.bookings = [];
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.loadBookings();
        this.attachEventListeners();
        this.render();
    }

    loadBookings() {
        try {
            // Try to fetch from localStorage (mock data)
            const stored = localStorage.getItem('userBookings');
            if (stored) {
                this.bookings = JSON.parse(stored);
            } else {
                // If no bookings, create empty array
                this.bookings = [];
            }
        } catch (e) {
            console.error('Error loading bookings:', e);
            this.bookings = [];
        }
    }

    saveBookings() {
        try {
            localStorage.setItem('userBookings', JSON.stringify(this.bookings));
        } catch (e) {
            console.error('Error saving bookings:', e);
        }
    }

    attachEventListeners() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class from all buttons
                filterBtns.forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                e.target.classList.add('active');
                // Update filter and render
                this.currentFilter = e.target.getAttribute('data-status');
                this.render();
            });
        });
    }

    getFilteredBookings() {
        if (this.currentFilter === 'all') {
            return this.bookings;
        }
        return this.bookings.filter(booking => booking.status === this.currentFilter);
    }

    getStatusBadgeColor(status) {
        const colors = {
            'upcoming': '#3b82f6',
            'completed': '#10b981',
            'cancelled': '#ef4444',
            'confirmed': '#8b5cf6'
        };
        return colors[status] || '#6b7280';
    }

    formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    render() {
        const bookingsList = document.getElementById('bookings-list');
        const emptyState = document.getElementById('empty-state');
        const filtered = this.getFilteredBookings();

        if (filtered.length === 0) {
            bookingsList.style.display = 'none';
            emptyState.style.display = 'flex';
            return;
        }

        bookingsList.style.display = 'grid';
        emptyState.style.display = 'none';
        bookingsList.innerHTML = filtered.map(booking => this.createBookingCard(booking)).join('');
    }

    createBookingCard(booking) {
        const statusColor = this.getStatusBadgeColor(booking.status);
        return `
            <div class="booking-card">
                <div class="booking-header">
                    <div class="booking-info">
                        <h3>${booking.carModel || 'Vehicle'}</h3>
                        <p class="booking-id">Booking ID: ${booking.id || 'N/A'}</p>
                    </div>
                    <span class="status-badge" style="background-color: ${statusColor}">${booking.status || 'pending'}</span>
                </div>

                <div class="booking-details">
                    <div class="detail-item">
                        <span class="detail-label">📅 Pickup Date</span>
                        <span class="detail-value">${this.formatDate(booking.pickupDate)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">📅 Return Date</span>
                        <span class="detail-value">${this.formatDate(booking.returnDate)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">💰 Price</span>
                        <span class="detail-value">$${booking.totalPrice || '0'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">📍 Location</span>
                        <span class="detail-value">${booking.pickupLocation || 'Not specified'}</span>
                    </div>
                </div>

                <div class="booking-actions">
                    ${booking.status === 'upcoming' ? `
                        <button class="action-btn cancel-btn" onclick="bookingsManager.cancelBooking('${booking.id}')">
                            Cancel Booking
                        </button>
                    ` : ''}
                    <button class="action-btn" onclick="bookingsManager.viewDetails('${booking.id}')">
                        View Details
                    </button>
                </div>
            </div>
        `;
    }

    cancelBooking(bookingId) {
        const booking = this.bookings.find(b => b.id === bookingId);
        if (booking && confirm('Are you sure you want to cancel this booking?')) {
            booking.status = 'cancelled';
            this.saveBookings();
            this.render();
            alert('Booking cancelled successfully');
        }
    }

    viewDetails(bookingId) {
        const booking = this.bookings.find(b => b.id === bookingId);
        if (booking) {
            const details = `
Booking Details:
ID: ${booking.id}
Vehicle: ${booking.carModel}
Pickup: ${this.formatDate(booking.pickupDate)}
Return: ${this.formatDate(booking.returnDate)}
Location: ${booking.pickupLocation}
Price: $${booking.totalPrice}
Status: ${booking.status}
Notes: ${booking.notes || 'None'}
            `;
            alert(details);
        }
    }

    // Add booking (for testing)
    addBooking(bookingData) {
        const booking = {
            id: `BK${Date.now()}`,
            status: 'upcoming',
            ...bookingData
        };
        this.bookings.push(booking);
        this.saveBookings();
        this.render();
    }
}

// Initialize bookings manager when page loads
let bookingsManager;
document.addEventListener('DOMContentLoaded', () => {
    bookingsManager = new BookingsManager();
});
