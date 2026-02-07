# Car Rental App

A modern React Native Web car rental application built with Expo.

## Features

- **User Authentication**
  - User login (for renters and owners)
  - Separate admin login
  - User registration with role selection

- **Role-Based Access**
  - **Renter Dashboard**: Browse available vehicles, filter by type/brand/price/location, view details and rent
  - **Owner Dashboard**: Manage your listed vehicles, add/edit/delete vehicles, track availability
  - **Admin Dashboard**: Platform overview, manage users and vehicles, view statistics

- **Filtering & Search**
  - Filter by vehicle type (Sedan, SUV, Sports, Electric)
  - Filter by brand
  - Filter by location
  - Price range selection
  - Transmission type filter
  - Search functionality

## Tech Stack

- React Native with Expo
- React Navigation for routing
- React Context API for state management
- Modern UI with custom styling

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npx expo start --web
```

3. Open your browser and navigate to the URL shown in the terminal (usually http://localhost:8081)

## Demo Credentials

### User Login
- **Owner**: owner@test.com / password
- **Renter**: renter@test.com / password

### Admin Login
- **Admin**: admin@test.com / admin123

## Project Structure

```
├── App.js                    # Main app entry point
├── src/
│   ├── context/
│   │   ├── AuthContext.js    # Authentication state management
│   │   └── VehicleContext.js # Vehicle and rental state management
│   ├── data/
│   │   └── vehicles.js       # Mock vehicle data
│   ├── navigation/
│   │   └── AppNavigator.js   # Navigation configuration
│   └── screens/
│       ├── AuthScreens.js    # Login, Register, Welcome screens
│       ├── RenterDashboard.js # Renter view
│       ├── OwnerDashboard.js  # Owner view
│       └── AdminDashboard.js  # Admin view
├── package.json
└── app.json
```

## Screenshots

The app features a modern dark theme with:
- Clean, intuitive user interface
- Vehicle cards with key information
- Modal-based filters and vehicle details
- Responsive design for web browsers

## License

This project is for demonstration purposes.
