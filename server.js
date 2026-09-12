const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3007;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(__dirname));

// Serve index.htm as default
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.htm'));
});

// Initialize Firebase Admin
let db;
try {
  // Try to initialize Firebase from service account file
  const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  db = admin.firestore();
  console.log('✅ Firebase initialized successfully!');
} catch (error) {
  console.log('⚠️  Firebase service account not found. Using in-memory data for demo.');
  
  // In-memory fallback for demo purposes
  db = {
    _data: {
      shipments: [
        { id: '1', tracking_number: 'HC123456789', customer_name: 'John Doe', origin: 'New York, NY', destination: 'Los Angeles, CA', service_type: 'Express', status: 'in_transit', weight: 2.5, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: '2', tracking_number: 'HC987654321', customer_name: 'Jane Smith', origin: 'Chicago, IL', destination: 'Houston, TX', service_type: 'Standard', status: 'delivered', weight: 5.0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: '3', tracking_number: 'HC456123789', customer_name: 'Robert Johnson', origin: 'Miami, FL', destination: 'Seattle, WA', service_type: 'Overnight', status: 'pending', weight: 1.8, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      ],
      customers: [
        { id: '1', name: 'John Doe', email: 'john.doe@example.com', phone: '+1 555 123 4567', city: 'New York, NY', created_at: new Date().toISOString() },
        { id: '2', name: 'Jane Smith', email: 'jane.smith@example.com', phone: '+1 555 987 6543', city: 'Los Angeles, CA', created_at: new Date().toISOString() }
      ],
      services: [
        { id: '1', name: 'Ocean Freight', description: 'Ship bulk goods globally with ease.', price: 499, icon: 'ship', created_at: new Date().toISOString() },
        { id: '2', name: 'Road Freight', description: 'Swift and reliable road transport.', price: 199, icon: 'truck', created_at: new Date().toISOString() },
        { id: '3', name: 'Air Freight', description: 'Global air shipping solutions.', price: 799, icon: 'plane', created_at: new Date().toISOString() },
        { id: '4', name: 'Train Freight', description: 'Efficient rail transport.', price: 299, icon: 'train', created_at: new Date().toISOString() }
      ],
      tracking_updates: []
    },
    
    async collection(name) {
      const self = this;
      return {
        async get() {
          const docs = self._data[name] || [];
          return {
            docs: docs.map(doc => ({ id: doc.id, data: () => ({ ...doc }) }))
          };
        },
        async add(data) {
          const id = Date.now().toString();
          self._data[name].push({ id, ...data, created_at: new Date().toISOString() });
          return { id };
        },
        doc(id) {
          return {
            async get() {
              const doc = self._data[name].find(d => d.id === id);
              return {
                exists: !!doc,
                data: () => doc
              };
            },
            async update(data) {
              const index = self._data[name].findIndex(d => d.id === id);
              if (index !== -1) {
                self._data[name][index] = { ...self._data[name][index], ...data, updated_at: new Date().toISOString() };
              }
            },
            async set(data) {
              const index = self._data[name].findIndex(d => d.id === id);
              if (index !== -1) {
                self._data[name][index] = { ...self._data[name][index], ...data };
              } else {
                self._data[name].push({ id, ...data, created_at: new Date().toISOString() });
              }
            },
            async delete() {
              const index = self._data[name].findIndex(d => d.id === id);
              if (index !== -1) {
                self._data[name].splice(index, 1);
              }
            },
            where(field, operator, value) {
              const filtered = (self._data[name] || []).filter(doc => {
                if (operator === '==') return doc[field] === value;
                return true;
              });
              return {
                async get() {
                  return {
                    docs: filtered.map(doc => ({ id: doc.id, data: () => ({ ...doc }) }))
                  };
                }
              };
            }
          };
        }
      };
    }
  };
}

// --- API ENDPOINTS ---

// Seed initial data
const seedInitialData = async () => {
  if (db._data) {
    // In-memory mode already has data
    return;
  }

  // Check if we already have data
  const shipmentsSnapshot = await db.collection('shipments').limit(1).get();
  if (!shipmentsSnapshot.empty) {
    return;
  }

  console.log("Seeding initial data into Firestore...");

  // Seed Services
  const services = [
    { name: "Ocean Freight", description: "Ship bulk goods globally with ease.", price: 499, icon: "ship" },
    { name: "Road Freight", description: "Swift and reliable road transport.", price: 199, icon: "truck" },
    { name: "Air Freight", description: "Global air shipping solutions.", price: 799, icon: "plane" },
    { name: "Train Freight", description: "Efficient rail transport.", price: 299, icon: "train" }
  ];
  for (const service of services) {
    await db.collection('services').add({ ...service, created_at: admin.firestore.FieldValue.serverTimestamp() });
  }

  // Seed Customers
  const customers = [
    { name: "John Doe", email: "john.doe@example.com", phone: "+1 555 123 4567", city: "New York, NY" },
    { name: "Jane Smith", email: "jane.smith@example.com", phone: "+1 555 987 6543", city: "Los Angeles, CA" }
  ];
  for (const customer of customers) {
    await db.collection('customers').add({ ...customer, created_at: admin.firestore.FieldValue.serverTimestamp() });
  }

  // Seed Shipments
  const shipments = [
    { tracking_number: "HC123456789", customer_name: "John Doe", origin: "New York, NY", destination: "Los Angeles, CA", service_type: "Express", status: "in_transit", weight: 2.5 },
    { tracking_number: "HC987654321", customer_name: "Jane Smith", origin: "Chicago, IL", destination: "Houston, TX", service_type: "Standard", status: "delivered", weight: 5.0 },
    { tracking_number: "HC456123789", customer_name: "Robert Johnson", origin: "Miami, FL", destination: "Seattle, WA", service_type: "Overnight", status: "pending", weight: 1.8 }
  ];
  for (const shipment of shipments) {
    await db.collection('shipments').add({ ...shipment, created_at: admin.firestore.FieldValue.serverTimestamp(), updated_at: admin.firestore.FieldValue.serverTimestamp() });
  }

  console.log("Initial data seeded successfully!");
};

// Helper function to get all docs from a collection
const getDocuments = async (collectionName) => {
  if (db._data && db._data[collectionName]) {
    // In-memory mode
    return db._data[collectionName];
  }
  const snapshot = await db.collection(collectionName).get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Shipment endpoints
app.get('/api/shipments', async (req, res) => {
  try {
    const shipments = await getDocuments('shipments');
    res.json(shipments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/shipments/:id', async (req, res) => {
  try {
    const doc = await db.collection('shipments').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    
    const shipment = { id: doc.id, ...doc.data() };
    const updatesSnapshot = await db.collection('tracking_updates').where('shipment_id', '==', req.params.id).get();
    const updates = updatesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    res.json({ ...shipment, updates });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/shipments/track/:trackingNumber', async (req, res) => {
  try {
    const snapshot = await db.collection('shipments').where('tracking_number', '==', req.params.trackingNumber).get();
    if (snapshot.empty) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    
    const doc = snapshot.docs[0];
    const shipment = { id: doc.id, ...doc.data() };
    const updatesSnapshot = await db.collection('tracking_updates').where('shipment_id', '==', doc.id).get();
    const updates = updatesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    res.json({ ...shipment, updates });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/shipments', async (req, res) => {
  try {
    const data = {
      ...req.body,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (db._data) { // In-memory fallback
      data.created_at = new Date().toISOString();
      data.updated_at = new Date().toISOString();
    }
    
    const result = await db.collection('shipments').add(data);
    res.status(201).json({ id: result.id, ...data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/shipments/:id', async (req, res) => {
  try {
    const data = {
      ...req.body,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (db._data) { // In-memory fallback
      data.updated_at = new Date().toISOString();
    }
    
    const docRef = db.collection('shipments').doc(req.params.id);
    await docRef.update(data);
    
    const doc = await docRef.get();
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/shipments/:id', async (req, res) => {
  try {
    // Delete tracking updates first
    const updatesSnapshot = await db.collection('tracking_updates').where('shipment_id', '==', req.params.id).get();
    for (const doc of updatesSnapshot.docs) {
      await db.collection('tracking_updates').doc(doc.id).delete();
    }
    
    // Delete shipment
    await db.collection('shipments').doc(req.params.id).delete();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Customer endpoints
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await getDocuments('customers');
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/customers/:id', async (req, res) => {
  try {
    const doc = await db.collection('customers').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const data = {
      ...req.body,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (db._data) { // In-memory fallback
      data.created_at = new Date().toISOString();
    }
    
    const result = await db.collection('customers').add(data);
    res.status(201).json({ id: result.id, ...data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/customers/:id', async (req, res) => {
  try {
    await db.collection('customers').doc(req.params.id).update(req.body);
    const doc = await db.collection('customers').doc(req.params.id).get();
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/customers/:id', async (req, res) => {
  try {
    await db.collection('customers').doc(req.params.id).delete();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Service endpoints
app.get('/api/services', async (req, res) => {
  try {
    const services = await getDocuments('services');
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/services/:id', async (req, res) => {
  try {
    const doc = await db.collection('services').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Service not found' });
    }
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/services', async (req, res) => {
  try {
    const data = {
      ...req.body,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (db._data) { // In-memory fallback
      data.created_at = new Date().toISOString();
    }
    
    const result = await db.collection('services').add(data);
    res.status(201).json({ id: result.id, ...data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/services/:id', async (req, res) => {
  try {
    await db.collection('services').doc(req.params.id).update(req.body);
    const doc = await db.collection('services').doc(req.params.id).get();
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/services/:id', async (req, res) => {
  try {
    await db.collection('services').doc(req.params.id).delete();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Tracking updates
app.post('/api/shipments/:id/tracking', async (req, res) => {
  try {
    const trackingData = {
      shipment_id: req.params.id,
      status: req.body.status,
      location: req.body.location,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (db._data) { // In-memory fallback
      trackingData.timestamp = new Date().toISOString();
    }
    
    await db.collection('tracking_updates').add(trackingData);
    
    // Update shipment status
    await db.collection('shipments').doc(req.params.id).update({
      status: req.body.status,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
    
    const doc = await db.collection('shipments').doc(req.params.id).get();
    const updatesSnapshot = await db.collection('tracking_updates').where('shipment_id', '==', req.params.id).get();
    const updates = updatesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    res.json({ id: doc.id, ...doc.data(), updates });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Track shipment by tracking number
app.get('/api/track/:trackingNumber', async (req, res) => {
  try {
    const trackingNumber = req.params.trackingNumber.toUpperCase();
    let shipment;

    if (db._data) { // In-memory mode
      shipment = db._data.shipments.find(s => s.tracking_number.toUpperCase() === trackingNumber);
    } else {
      const snapshot = await db.collection('shipments').where('tracking_number', '==', trackingNumber).get();
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        shipment = { id: doc.id, ...doc.data() };
      }
    }

    if (shipment) {
      res.json(shipment);
    } else {
      res.status(404).json({ error: 'Tracking number not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dashboard stats
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    let totalShipments, totalCustomers, totalRevenue = 0, onTimeDeliveries = 0;

    if (db._data) { // In-memory mode
      totalShipments = db._data.shipments.length;
      totalCustomers = db._data.customers.length;
      db._data.services.forEach(service => totalRevenue += (service.price || 0));
      db._data.shipments.forEach(shipment => {
        if (shipment.status === 'delivered') {
          onTimeDeliveries++;
        }
      });
    } else {
      const [shipmentsSnapshot, customersSnapshot, servicesSnapshot] = await Promise.all([
        db.collection('shipments').get(),
        db.collection('customers').get(),
        db.collection('services').get()
      ]);
      totalShipments = shipmentsSnapshot.size;
      totalCustomers = customersSnapshot.size;
      const services = servicesSnapshot.docs.map(doc => doc.data());
      services.forEach(service => totalRevenue += (service.price || 0));
      shipmentsSnapshot.docs.forEach(doc => {
        if (doc.data().status === 'delivered') {
          onTimeDeliveries++;
        }
      });
    }
    
    res.json({
      totalShipments,
      totalCustomers,
      totalRevenue: totalRevenue * 100, // For demo
      onTimeRate: totalShipments > 0 ? Math.round((onTimeDeliveries / totalShipments) * 100 * 10) / 10 : 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

(async () => {
  try {
    if (!db._data) {
      await seedInitialData();
    }
  } catch (error) {
    console.error('Failed to seed initial data, starting server anyway:', error);
  }

  const basePort = Number(PORT) || 3007;
  const maxAttempts = 20;

  const startServer = (port, attempt = 0) => {
    const server = app.listen(port, () => {
      console.log(`🚀 HILTON CARGO Server is running!`);
      console.log(`Server is running at http://localhost:${port}`);
      console.log(`Admin panel at http://localhost:${port}/admin/index.html`);
      console.log(`Shipments page at http://localhost:${port}/admin/shipments.html`);
      if (db._data) {
        console.log(`⚠️  Using in-memory data. Add firebase-service-account.json to use Firebase!`);
      } else {
        console.log(`✅ Connected to Firebase Firestore!`);
      }
    });

    server.on('error', (error) => {
      if (error && error.code === 'EADDRINUSE' && attempt < maxAttempts) {
        console.error(`Port ${port} is already in use. Trying port ${port + 1}...`);
        startServer(port + 1, attempt + 1);
        return;
      }

      console.error('Failed to start server:', error);
      process.exit(1);
    });
  };

  startServer(basePort);
})().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
