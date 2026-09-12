# HILTON CARGO - Complete Logistics Solution

## Backend Setup & Installation

### Step 1: Install Dependencies
Make sure you have Node.js installed on your computer, then run:

```bash
npm install
```

### Step 2: Set up Firebase
To use Firebase Firestore as your database:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use an existing one)
3. Go to **Project Settings > Service Accounts**
4. Click **Generate New Private Key** and download the JSON file
5. Save the file as `firebase-service-account.json` in your project's root folder

**Note**: If you don't set up Firebase, the server will use in-memory data for demo purposes!

### Step 3: Start the Server
Run the server with:

```bash
npm start
```

### Step 4: Access the Application
Once the server is running, open these URLs in your browser:
- **Website Homepage**: `http://localhost:3000/index.htm`
- **Admin Dashboard**: `http://localhost:3000/admin/index.html`


## API Endpoints

### Shipments
- `GET /api/shipments` - Get all shipments
- `GET /api/shipments/:id` - Get a shipment by ID
- `GET /api/shipments/track/:trackingNumber` - Track a shipment
- `POST /api/shipments` - Create a new shipment
- `PUT /api/shipments/:id` - Update a shipment
- `DELETE /api/shipments/:id` - Delete a shipment

### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get a customer by ID
- `POST /api/customers` - Create a new customer
- `PUT /api/customers/:id` - Update a customer
- `DELETE /api/customers/:id` - Delete a customer

### Services
- `GET /api/services` - Get all services
- `GET /api/services/:id` - Get a service by ID
- `POST /api/services` - Create a new service

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics


## Database
All data is stored in Firebase Firestore. If no Firebase service account is provided, the server uses in-memory data for demo purposes.