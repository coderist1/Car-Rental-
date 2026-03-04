# Car Rental App (React + JSX)

A component-based car rental application built with React, Vite, and React Router.

## Features

- Role-based authentication (Owner, Renter, Admin)
- Owner dashboard for vehicle management
- Renter dashboard for browsing and booking vehicles
- Admin dashboard with analytics and logs
- Profile management and password updates

## Tech Stack

- React 18
- React Router DOM
- Vite
- Context API for state management

## Project Structure

```text
src/
  components/   # Reusable UI components
  context/      # App state providers
  hooks/        # App hooks (useAuth, useVehicles)
  pages/        # Route pages
  styles/       # Global styles
```

## Run the project

```bash
npm install
npm run dev
```

Then open: http://localhost:3000
