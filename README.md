# Billing Software

A comprehensive billing and inventory management system built with React and Node.js.

## Features

- **Sales Management**: Create and manage sales transactions
- **Purchase Management**: Track and manage purchase orders
- **Customer Management**: Maintain customer database
- **Product Management**: Inventory tracking and product management
- **Supplier Management**: Manage supplier information
- **Stock Management**: Real-time inventory tracking
- **Reports**: Generate sales and purchase reports
- **Multi-language Support**: Built-in translation service
- **Firebase Integration**: Cloud-based data storage

## Tech Stack

### Frontend
- React 18 with Vite
- Tailwind CSS for styling
- Firebase for authentication and data storage

### Backend
- Node.js with Express
- Firebase Firestore database
- Translation API integration
- RESTful API design

## Project Structure

```
├── frontend/           # React frontend application
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Application pages
│   │   ├── services/   # API services
│   │   └── utils/      # Utility functions
├── backend/            # Node.js backend API
│   ├── src/
│   │   ├── controllers/# Route controllers
│   │   ├── models/     # Data models
│   │   ├── routes/     # API routes
│   │   └── services/   # Business services
│   ├── scripts/        # Database scripts
│   └── config/         # Configuration files
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- Firebase account
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/MVISHAL0123/Billing-Software.git
cd Billing-Software
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

4. Configure Firebase:
   - Set up your Firebase project
   - Add Firebase configuration to the config files
   - Enable Firestore database

### Running the Application

1. Start the backend server:
```bash
cd backend
npm start
```

2. Start the frontend development server:
```bash
cd frontend
npm run dev
```

The application will be available at `http://localhost:5173` (frontend) and the API at `http://localhost:3000` (backend).

## License

This project is licensed under the MIT License.
