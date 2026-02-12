// vehicle-card.js - Reusable vehicle card component
class VehicleCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        this.attachEventListeners();
    }

    static get observedAttributes() {
        return ['name', 'type', 'price', 'image', 'location', 'seats', 'transmission', 'mode'];
    }

    attributeChangedCallback() {
        this.render();
        this.attachEventListeners();
    }

    render() {
        const name = this.getAttribute('name') || 'Vehicle';
        const type = this.getAttribute('type') || 'SUV';
        const price = this.getAttribute('price') || '0';
        const image = this.getAttribute('image') || '';
        const location = this.getAttribute('location') || '';
        const seats = this.getAttribute('seats') || '';
        const transmission = this.getAttribute('transmission') || '';
        const mode = this.getAttribute('mode') || 'renter'; // 'renter' or 'owner'
        const vehicleId = this.getAttribute('vehicle-id') || '';

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                }

                .vehicle-card {
                    background: white;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    transition: all 0.3s ease;
                    cursor: pointer;
                }

                .vehicle-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 6px 16px rgba(0,0,0,0.15);
                }

                .vehicle-image {
                    width: 100%;
                    height: 200px;
                    object-fit: contain;
                    background: #f8f9fa;
                    padding: 16px;
                }

                .vehicle-info {
                    padding: 16px;
                }

                .vehicle-name {
                    font-size: 20px;
                    font-weight: bold;
                    color: #1a2c5e;
                    margin-bottom: 4px;
                }

                .vehicle-type {
                    font-size: 14px;
                    color: #6b7280;
                    margin-bottom: 12px;
                }

                .vehicle-meta {
                    display: flex;
                    gap: 12px;
                    flex-wrap: wrap;
                    margin-bottom: 12px;
                    font-size: 13px;
                    color: #6b7280;
                }

                .vehicle-meta span {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .vehicle-price {
                    font-size: 24px;
                    font-weight: bold;
                    color: #3F9B84;
                    margin-bottom: 12px;
                }

                .vehicle-actions {
                    display: flex;
                    gap: 8px;
                }

                .btn {
                    padding: 10px 16px;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    flex: 1;
                }

                .btn-primary {
                    background: #3F9B84;
                    color: white;
                }

                .btn-primary:hover {
                    background: #358a75;
                }

                .btn-secondary {
                    background: #e2e8f0;
                    color: #1a2c5e;
                }

                .btn-secondary:hover {
                    background: #cbd5e1;
                }

                .btn-danger {
                    background: #ef4444;
                    color: white;
                }

                .btn-danger:hover {
                    background: #dc2626;
                }
            </style>
            <div class="vehicle-card">
                <img 
                    src="${image}" 
                    alt="${name}" 
                    class="vehicle-image"
                    onerror="this.src='https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=800&q=80'"
                />
                <div class="vehicle-info">
                    <div class="vehicle-name">${name}</div>
                    <div class="vehicle-type">${type}</div>
                    ${location || seats || transmission ? `
                        <div class="vehicle-meta">
                            ${location ? `<span>📍 ${location}</span>` : ''}
                            ${seats ? `<span>👥 ${seats} seats</span>` : ''}
                            ${transmission ? `<span>⚙️ ${transmission}</span>` : ''}
                        </div>
                    ` : ''}
                    <div class="vehicle-price">₱${price}/day</div>
                    <div class="vehicle-actions">
                        ${mode === 'renter' ? `
                            <button class="btn btn-primary" data-action="view">View Details</button>
                        ` : `
                            <button class="btn btn-secondary" data-action="edit">Edit</button>
                            <button class="btn btn-danger" data-action="delete">Delete</button>
                        `}
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        const buttons = this.shadowRoot.querySelectorAll('[data-action]');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.getAttribute('data-action');
                const rawId = this.getAttribute('vehicle-id');
                const vehicleId = rawId === null ? null : Number(rawId);
                this.dispatchEvent(new CustomEvent('vehicle-action', {
                    bubbles: true,
                    composed: true,
                    detail: {
                        action,
                        vehicleId,
                        vehicleData: {
                            name: this.getAttribute('name'),
                            type: this.getAttribute('type'),
                            price: this.getAttribute('price'),
                            image: this.getAttribute('image'),
                            location: this.getAttribute('location'),
                            seats: this.getAttribute('seats'),
                            transmission: this.getAttribute('transmission')
                        }
                    }
                }));
            });
        });

        // Card click for view details
        const card = this.shadowRoot.querySelector('.vehicle-card');
        if (card) {
            card.addEventListener('click', () => {
                const rawId = this.getAttribute('vehicle-id');
                const vehicleId = rawId === null ? null : Number(rawId);
                this.dispatchEvent(new CustomEvent('vehicle-click', {
                    bubbles: true,
                    composed: true,
                    detail: {
                        vehicleId
                    }
                }));
            });
        }
    }
}

customElements.define('vehicle-card', VehicleCard);
