# Car Rental Web App

A modern, component-based car rental application built with native Web Components. Zero dependencies, no framework required.

## Features

- **User Authentication**
  - User login for renters and owners
  - Demo credentials for testing
  - Secure authentication flow

- **Role-Based Access**
  - **Renter Dashboard**: Browse available vehicles, filter by type/price, view details
  - **Owner Dashboard**: Manage listed vehicles, add/edit/delete vehicles, track availability
  - **Admin Dashboard**: Platform overview, manage users and vehicles, view statistics (disabled by default)

- **Filtering & Search**
  - Filter by vehicle type (SUV, Sedan, Sports, Luxury, etc.)
  - Filter by transmission type  
  - Filter by fuel type
  - Price range selection
  - Real-time search functionality

## Tech Stack

- **Pure Web Technologies**: HTML5, CSS3, JavaScript (ES6+)
- **Native Web Components**: Custom Elements with Shadow DOM
- **Architecture**: Component-based, reusable, encapsulated
- **No Build Step Required**: Runs directly in modern browsers

## Project Structure

```
CarRental/
├── web/
│   ├── components/          # Reusable Web Components
│   │   ├── app-header.js
│   │   ├── auth-form.js
│   │   ├── vehicle-card.js
│   │   ├── confirm-modal.js
│   │   └── README.md        # Component documentation
│   ├── pages/               # HTML pages
│   │   ├── login.html
│   │   ├── dashboard.html    # Owner dashboard
│   │   ├── renter-dashboard.html
│   │   └── admin-dashboard.html
│   ├── scripts/             # Page-specific JavaScript
│   ├── styles/              # CSS stylesheets
│   └── index.html           # Landing page
├── package.json             # Minimal config for deployment
└── README.md
```

## Getting Started

### Prerequisites

- A modern web browser (Chrome 54+, Firefox 63+, Safari 10.1+, Edge 79+)
- Python (for local server) OR any static file server

### Installation & Running

**Option 1: Python HTTP Server** (Recommended)

No installation needed! Just run:
```bash
cd web
python -m http.server 8000
```

Then open http://localhost:8000

**Option 2: Using npm script**
```bash
npm start
```

Then open http://localhost:8000

**Option 3: Any static file server**
```bash
# Using Node.js http-server
npx http-server web -p 8000

# Using PHP
php -S localhost:8000 -t web
```

## Demo Credentials

### User Login
- **Owner**: owner@test.com / password
- **Renter**: renter@test.com / password

### Admin Login (Disabled)
- Admin login has been disabled for security

## Web Components

This app uses 4 reusable Web Components:

1. **`<app-header>`** - Logo, title, subtitle display
2. **`<auth-form>`** - Authentication form with validation
3. **`<vehicle-card>`** - Vehicle display with actions (owner/renter modes)
4. **`<confirm-modal>`** - Promise-based confirmation dialogs

See [web/components/README.md](web/components/README.md) for detailed documentation.

## Features

- **Zero Dependencies**: Pure vanilla JavaScript, no frameworks
- **Modern Architecture**: Web Components with Shadow DOM encapsulation  
- **Component-Based**: Reusable, maintainable components
- **Responsive Design**: Works on desktop and mobile browsers
- **Philippines Localization**: PHP currency, Manila locations
- **Interactive**: Smooth animations and user feedback

## Deployment

To deploy to GitHub Pages:

```bash
npm run deploy
```

This will deploy the `web/` folder to the `gh-pages` branch.

## Browser Support

Web Components are supported in:
- Chrome/Edge 54+
- Firefox 63+
- Safari 10.1+

## License

This project is for demonstration purposes.
