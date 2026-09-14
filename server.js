const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

(function loadDotenv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, 'utf8');
  raw.split(/\r?\n/).forEach(line => {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m) return;
    let val = m[2];
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[m[1]] === undefined) process.env[m[1]] = val;
  });
})();

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

const createInMemoryDb = () => ({
  _data: {
    shipments: [
      {
        id: '1',
        tracking_number: 'HC123456789',
        customer_name: 'John Doe',
        sender_name: 'John Doe',
        sender_email: 'john.doe@example.com',
        sender_address: '123 Broadway Ave, New York, NY 10001',
        sender_phone: '+1 (555) 123-4567',
        sender_country: 'United States',
        receiver_name: 'Emily Carter',
        receiver_email: 'emily.carter@example.com',
        receiver_address: '456 Hollywood Blvd, Los Angeles, CA 90028',
        receiver_phone: '+1 (555) 987-6543',
        receiver_country: 'United States',
        package_description: 'Electronics — 2 laptops, 1 tablet, accessories',
        package_weight: 2.5,
        date_sent: '2026-09-10T09:30:00.000Z',
        date_expected: '2026-09-17T18:00:00.000Z',
        progress_pct: 40,
        current_location: 'Denver Distribution Center, CO',
        invoice_created_at: '2026-09-10T08:00:00.000Z',
        total_amount: 799.00,
        origin: 'New York, NY',
        destination: 'Los Angeles, CA',
        service_type: 'Express',
        status: 'in_transit',
        weight: 2.5,
        created_at: '2026-09-10T08:00:00.000Z',
        updated_at: '2026-09-12T14:20:00.000Z'
      },
      {
        id: '2',
        tracking_number: 'HC987654321',
        customer_name: 'Jane Smith',
        sender_name: 'Jane Smith',
        sender_email: 'jane.smith@example.com',
        sender_address: '789 Michigan Ave, Chicago, IL 60601',
        sender_phone: '+1 (555) 222-3344',
        sender_country: 'United States',
        receiver_name: 'Michael Brown',
        receiver_email: 'michael.brown@example.com',
        receiver_address: '321 Main St, Houston, TX 77002',
        receiver_phone: '+1 (555) 444-5566',
        receiver_country: 'United States',
        package_description: 'Industrial Machine Parts — 3 crates, heavy machinery components',
        package_weight: 5.0,
        date_sent: '2026-09-01T10:15:00.000Z',
        date_expected: '2026-09-08T17:00:00.000Z',
        progress_pct: 100,
        current_location: 'Houston, TX — Delivered',
        invoice_created_at: '2026-09-01T09:00:00.000Z',
        total_amount: 199.00,
        origin: 'Chicago, IL',
        destination: 'Houston, TX',
        service_type: 'Standard',
        status: 'delivered',
        weight: 5.0,
        created_at: '2026-09-01T09:00:00.000Z',
        updated_at: '2026-09-07T15:45:00.000Z'
      },
      {
        id: '3',
        tracking_number: 'HC456123789',
        customer_name: 'Robert Johnson',
        sender_name: 'Robert Johnson',
        sender_email: 'robert.johnson@example.com',
        sender_address: '100 Ocean Dr, Miami, FL 33139',
        sender_phone: '+1 (555) 777-8899',
        sender_country: 'United States',
        receiver_name: 'Sarah Williams',
        receiver_email: 'sarah.williams@example.com',
        receiver_address: '555 Pine St, Seattle, WA 98101',
        receiver_phone: '+1 (555) 111-2233',
        receiver_country: 'United States',
        package_description: 'Medical Supplies — Temperature-sensitive pharmaceuticals',
        package_weight: 1.8,
        date_sent: '2026-09-12T06:00:00.000Z',
        date_expected: '2026-09-13T12:00:00.000Z',
        progress_pct: 5,
        current_location: 'Miami International Hub, FL',
        invoice_created_at: '2026-09-12T05:30:00.000Z',
        total_amount: 1299.00,
        origin: 'Miami, FL',
        destination: 'Seattle, WA',
        service_type: 'Overnight',
        status: 'pending',
        weight: 1.8,
        created_at: '2026-09-12T05:30:00.000Z',
        updated_at: '2026-09-12T05:30:00.000Z'
      }
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

  collection(name) {
    const self = this;
    return {
      async get() {
        const docs = self._data[name] || [];
        return {
          docs: docs.map(doc => ({ id: doc.id, data: () => ({ ...doc }) })),
          get empty() { return docs.length === 0; },
          get size() { return docs.length; }
        };
      },
      async add(data) {
        const id = Date.now().toString();
        self._data[name].push({ id, ...data, created_at: new Date().toISOString() });
        return { id };
      },
      limit(n) {
        const docs = (self._data[name] || []).slice(0, n);
        return {
          async get() {
            return {
              docs: docs.map(doc => ({ id: doc.id, data: () => ({ ...doc }) })),
              get empty() { return docs.length === 0; },
              get size() { return docs.length; }
            };
          }
        };
      },
      doc(id) {
        return {
          async get() {
            const doc = self._data[name].find(d => d.id === id);
            return {
              get exists() { return !!doc; },
              data() { return doc ? { ...doc } : undefined; }
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
          }
        };
      },
      where(field, operator, value) {
        const filtered = (self._data[name] || []).filter(doc => {
          if (operator === '==') return doc[field] === value;
          return true;
        });
        return {
          async get() {
            return {
              get docs() { return filtered.map(doc => ({ id: doc.id, data: () => ({ ...doc }) })); },
              get empty() { return filtered.length === 0; }
            };
          },
          limit(n) {
            const limited = filtered.slice(0, n);
            return {
              async get() {
                return {
                  docs: limited.map(doc => ({ id: doc.id, data: () => ({ ...doc }) })),
                  get empty() { return limited.length === 0; }
                };
              }
            };
          }
        };
      }
    };
  }
});

let db;
let firestoreDb = null;
let firebaseInitError = null;
let currentServiceAccountEmail = null;
let currentProjectId = null;
try {
  const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');
  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error('firebase-service-account.json not found at: ' + serviceAccountPath);
  }
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  } catch (parseErr) {
    throw new Error('firebase-service-account.json is not valid JSON: ' + parseErr.message);
  }
  if (!serviceAccount || !serviceAccount.private_key || !serviceAccount.project_id || !serviceAccount.client_email) {
    throw new Error('firebase-service-account.json is missing required fields (private_key, project_id, client_email). Did you download the correct file?');
  }
  if (serviceAccount.private_key.includes('-----BEGIN PRIVATE KEY-----') === false) {
    throw new Error('Private key in firebase-service-account.json is malformed. It must start with "-----BEGIN PRIVATE KEY-----".');
  }

  currentServiceAccountEmail = serviceAccount.client_email;
  const explicitProjectId = (process.env.SERVER_FIREBASE_PROJECT_ID || serviceAccount.project_id || '').trim();
  currentProjectId = explicitProjectId || serviceAccount.project_id || null;
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    ...(explicitProjectId ? { projectId: explicitProjectId } : {})
  });
  firestoreDb = admin.firestore();
  try {
    firestoreDb.settings({
      ...(explicitProjectId ? { projectId: explicitProjectId } : {}),
      ignoreUndefinedProperties: true
    });
  } catch (settingsErr) {
    // Settings may already be applied; ignore.
  }
  console.log('');
  console.log('ℹ️  Firebase admin SDK initialized successfully.');
  console.log('   Project ID     : ' + (explicitProjectId || '(auto)'));
  console.log('   Service account: ' + serviceAccount.client_email);
  console.log('   Verifying Firestore connection (up to 15s)...');
  console.log('');
} catch (error) {
  firebaseInitError = error;
  console.log('');
  console.log('─────────────────────────────────────────────────────────────');
  console.log('⚠️  FIREBASE SERVICE ACCOUNT INIT FAILED');
  console.log('─────────────────────────────────────────────────────────────');
  console.log('   Reason: ' + (error.message || String(error)));
  console.log('');
  console.log('   TROUBLESHOOTING:');
  console.log('   • If the file does not exist:');
  console.log('     Go to Firebase Console → Project Settings → Service Accounts');
  console.log('     → Click "Generate new private key" → Download JSON');
  console.log('     → Save it as firebase-service-account.json in this folder');
  console.log('');
  console.log('   • If the JSON is invalid:');
  console.log('     Re-download the key from Firebase Console (do NOT edit it by hand)');
  console.log('     and completely replace firebase-service-account.json');
  console.log('─────────────────────────────────────────────────────────────');
  console.log('   Falling back to in-memory demo data.');
  console.log('─────────────────────────────────────────────────────────────');
  console.log('');
  db = createInMemoryDb();
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
    {
      tracking_number: "HC123456789",
      customer_name: "John Doe",
      sender_name: "John Doe",
      sender_email: "john.doe@example.com",
      sender_address: "123 Broadway Ave, New York, NY 10001",
      sender_phone: "+1 (555) 123-4567",
      sender_country: "United States",
      receiver_name: "Emily Carter",
      receiver_email: "emily.carter@example.com",
      receiver_address: "456 Hollywood Blvd, Los Angeles, CA 90028",
      receiver_phone: "+1 (555) 987-6543",
      receiver_country: "United States",
      package_description: "Electronics — 2 laptops, 1 tablet, accessories",
      package_weight: 2.5,
      date_sent: "2026-09-10T09:30:00.000Z",
      date_expected: "2026-09-17T18:00:00.000Z",
      progress_pct: 40,
      current_location: "Denver Distribution Center, CO",
      invoice_created_at: "2026-09-10T08:00:00.000Z",
      total_amount: 799.00,
      origin: "New York, NY",
      destination: "Los Angeles, CA",
      service_type: "Express",
      status: "in_transit",
      weight: 2.5
    },
    {
      tracking_number: "HC987654321",
      customer_name: "Jane Smith",
      sender_name: "Jane Smith",
      sender_email: "jane.smith@example.com",
      sender_address: "789 Michigan Ave, Chicago, IL 60601",
      sender_phone: "+1 (555) 222-3344",
      sender_country: "United States",
      receiver_name: "Michael Brown",
      receiver_email: "michael.brown@example.com",
      receiver_address: "321 Main St, Houston, TX 77002",
      receiver_phone: "+1 (555) 444-5566",
      receiver_country: "United States",
      package_description: "Industrial Machine Parts — 3 crates, heavy machinery components",
      package_weight: 5.0,
      date_sent: "2026-09-01T10:15:00.000Z",
      date_expected: "2026-09-08T17:00:00.000Z",
      progress_pct: 100,
      current_location: "Houston, TX — Delivered",
      invoice_created_at: "2026-09-01T09:00:00.000Z",
      total_amount: 199.00,
      origin: "Chicago, IL",
      destination: "Houston, TX",
      service_type: "Standard",
      status: "delivered",
      weight: 5.0
    },
    {
      tracking_number: "HC456123789",
      customer_name: "Robert Johnson",
      sender_name: "Robert Johnson",
      sender_email: "robert.johnson@example.com",
      sender_address: "100 Ocean Dr, Miami, FL 33139",
      sender_phone: "+1 (555) 777-8899",
      sender_country: "United States",
      receiver_name: "Sarah Williams",
      receiver_email: "sarah.williams@example.com",
      receiver_address: "555 Pine St, Seattle, WA 98101",
      receiver_phone: "+1 (555) 111-2233",
      receiver_country: "United States",
      package_description: "Medical Supplies — Temperature-sensitive pharmaceuticals",
      package_weight: 1.8,
      date_sent: "2026-09-12T06:00:00.000Z",
      date_expected: "2026-09-13T12:00:00.000Z",
      progress_pct: 5,
      current_location: "Miami International Hub, FL",
      invoice_created_at: "2026-09-12T05:30:00.000Z",
      total_amount: 1299.00,
      origin: "Miami, FL",
      destination: "Seattle, WA",
      service_type: "Overnight",
      status: "pending",
      weight: 1.8
    }
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

const SERVICE_PRICE_MAP = {
  'Ocean Freight': 499,
  'Road Freight': 199,
  'Air Freight': 799,
  'Train Freight': 299,
  'Standard': 199,
  'Express': 799,
  'Overnight': 1299,
  'Economy': 99
};

const getServicePrice = (serviceType) => {
  if (!serviceType) return 299;
  const key = Object.keys(SERVICE_PRICE_MAP).find(k =>
    serviceType.toLowerCase() === k.toLowerCase() ||
    serviceType.toLowerCase().includes(k.toLowerCase().split(' ')[0])
  );
  return key ? SERVICE_PRICE_MAP[key] : 299;
};

const getProgressForStatus = (status) => {
  if (!status) return 0;
  switch (status.toLowerCase()) {
    case 'pending': return 5;
    case 'in_transit': return 40;
    case 'delivered': return 100;
    case 'cancelled': return 0;
    default: return 0;
  }
};

const addDays = (isoDateStr, days) => {
  const d = new Date(isoDateStr || Date.now());
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

const normalizeShipmentData = (input, { isCreate = true, existingShipment = null } = {}) => {
  const prev = existingShipment || {};
  const now = new Date().toISOString();

  const sender_name = input.sender_name || input.customer_name || prev.sender_name || prev.customer_name || '';
  const package_weight = input.package_weight !== undefined ? Number(input.package_weight) :
                        (input.weight !== undefined ? Number(input.weight) : (prev.package_weight || prev.weight || 0));
  const package_description = input.package_description || prev.package_description || 'General Cargo';
  const status = input.status || prev.status || 'pending';
  const created_at_val = prev.created_at || now;
  const date_sent = input.date_sent || prev.date_sent || created_at_val;
  const date_expected = input.date_expected || prev.date_expected || addDays(date_sent, 7);
  const progress_pct = input.progress_pct !== undefined ? Number(input.progress_pct) :
                       (prev.progress_pct !== undefined ? prev.progress_pct : getProgressForStatus(status));
  const service_type = input.service_type || prev.service_type || 'Standard';
  const total_amount = input.total_amount !== undefined ? Number(input.total_amount) :
                       (prev.total_amount !== undefined ? prev.total_amount : getServicePrice(service_type));
  const origin = input.origin || prev.origin || (input.sender_address || prev.sender_address || '').split(', ').slice(0, 2).join(', ');
  const destination = input.destination || prev.destination || (input.receiver_address || prev.receiver_address || '').split(', ').slice(0, 2).join(', ');
  const current_location = input.current_location || prev.current_location || origin;

  const result = {
    ...input,
    sender_name,
    sender_email: input.sender_email || prev.sender_email || '',
    sender_address: input.sender_address || prev.sender_address || origin,
    sender_phone: input.sender_phone || prev.sender_phone || '',
    sender_country: input.sender_country || prev.sender_country || '',
    receiver_name: input.receiver_name || prev.receiver_name || '',
    receiver_email: input.receiver_email || prev.receiver_email || '',
    receiver_address: input.receiver_address || prev.receiver_address || destination,
    receiver_phone: input.receiver_phone || prev.receiver_phone || '',
    receiver_country: input.receiver_country || prev.receiver_country || '',
    package_description,
    package_weight,
    date_sent,
    date_expected,
    progress_pct,
    current_location,
    invoice_created_at: input.invoice_created_at || prev.invoice_created_at || now,
    total_amount,
    customer_name: input.customer_name || sender_name,
    origin,
    destination,
    service_type,
    status,
    weight: input.weight !== undefined ? Number(input.weight) : (prev.weight || package_weight)
  };

  if (isCreate) {
    result.created_at = prev.created_at || now;
  }
  result.updated_at = now;

  return result;
};

const formatDate = (isoStr) => {
  if (!isoStr) return '-';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) +
           ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return isoStr;
  }
};

const formatCurrency = (num) => {
  const n = Number(num) || 0;
  return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const statusBadgeColor = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'delivered': return '#10b981';
    case 'in_transit': return '#3b82f6';
    case 'pending': return '#f59e0b';
    case 'cancelled': return '#ef4444';
    default: return '#6b7280';
  }
};

const renderReceiptHtml = (shipment) => {
  const s = shipment || {};
  const prog = Math.max(0, Math.min(100, Number(s.progress_pct) || 0));
  const sectionHeader = '#29B6F6';
  const rowBorder = '#B3E5FC';
  const brandBlue = '#0277BD';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>HILTON CARGO - Shipment Invoice ${s.tracking_number || ''}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    font-family: 'Helvetica Neue', Arial, sans-serif;
    background: #ffffff;
    color: #212121;
    line-height: 1.4;
  }
  body {
    padding: 24px;
  }
  .page {
    width: 100%;
    max-width: 850px;
    margin: 0 auto;
    background: #ffffff;
    border: 2px solid ${rowBorder};
    padding: 36px 40px 40px;
    position: relative;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 32px;
    flex-wrap: wrap;
    gap: 20px;
  }
  .logo-block {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .logo-box {
    width: 68px;
    height: 56px;
    border: 4px solid ${brandBlue};
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #ffffff;
  }
  .logo-box img {
    width: 44px;
    height: 44px;
    object-fit: contain;
  }
  .logo-box .fallback {
    font-size: 28px;
    font-weight: 900;
    color: ${brandBlue};
    letter-spacing: -1px;
  }
  .brand-title {
    font-size: 26px;
    font-weight: 900;
    color: ${brandBlue};
    letter-spacing: 0.3px;
    line-height: 1;
  }
  .brand-sub {
    font-size: 14px;
    color: #455A64;
    font-weight: 700;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    margin-top: 4px;
  }
  .header-right {
    text-align: right;
    font-size: 14px;
    line-height: 1.75;
    padding-top: 4px;
  }
  .header-right .row-line {
    display: block;
  }
  .header-right .label {
    font-weight: 600;
    color: #37474F;
    margin-right: 6px;
  }
  .header-right .value {
    font-weight: 700;
    color: #212121;
  }
  .header-right .tracking-line .value {
    color: ${brandBlue};
    font-size: 15px;
  }
  .section {
    margin-bottom: 22px;
    border-radius: 2px;
    overflow: hidden;
  }
  .section-title {
    background: ${sectionHeader};
    color: #ffffff;
    padding: 10px 16px;
    font-size: 15px;
    font-weight: 800;
    letter-spacing: 0.2px;
  }
  .section-rows {
    border-left: 1px solid ${rowBorder};
    border-right: 1px solid ${rowBorder};
    border-bottom: 1px solid ${rowBorder};
  }
  .row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 10px 16px;
    border-bottom: 1px solid ${rowBorder};
    font-size: 14px;
    gap: 16px;
  }
  .row:last-child { border-bottom: none; }
  .row .label {
    color: #37474F;
    font-weight: 700;
    min-width: 140px;
    flex-shrink: 0;
  }
  .row .value {
    color: #212121;
    font-weight: 600;
    text-align: right;
    word-break: break-word;
  }
  .row .value.mono {
    font-family: 'Courier New', monospace;
  }
  .total-row {
    display: flex;
    justify-content: flex-end;
    padding-top: 6px;
  }
  .total-box {
    font-size: 17px;
    font-weight: 800;
    color: #212121;
    padding-right: 16px;
  }
  .total-box .amount {
    font-family: 'Courier New', monospace;
    margin-left: 8px;
  }
  .actions {
    position: fixed;
    bottom: 24px;
    right: 24px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    z-index: 100;
  }
  .btn-print {
    background: ${brandBlue};
    color: #ffffff;
    border: none;
    padding: 14px 22px;
    border-radius: 50px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 6px 16px rgba(2,119,189,0.35);
    letter-spacing: 0.5px;
    text-transform: uppercase;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }
  .btn-print:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 24px rgba(2,119,189,0.45);
  }
  .btn-download {
    background: ${sectionHeader};
    color: #ffffff;
    border: none;
    padding: 12px 20px;
    border-radius: 50px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(41,182,246,0.35);
    letter-spacing: 0.4px;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }
  .btn-download:hover {
    transform: translateY(-2px);
  }
  .btn-back {
    background: #ffffff;
    color: #374151;
    border: 1px solid #d1d5db;
    padding: 10px 18px;
    border-radius: 50px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    text-align: center;
    box-shadow: 0 2px 6px rgba(0,0,0,0.06);
  }
  .btn-back:hover { background: #f9fafb; }
  .notfound {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #ffffff;
  }
  .notfound-box {
    text-align: center;
    max-width: 480px;
    padding: 40px;
  }
  .notfound-box h1 {
    font-size: 72px;
    color: ${brandBlue};
    margin-bottom: 8px;
    font-family: 'Courier New', monospace;
  }
  .notfound-box h2 {
    font-size: 22px;
    color: #111827;
    margin-bottom: 12px;
  }
  .notfound-box p {
    color: #6b7280;
    margin-bottom: 24px;
  }
  @media print {
    body { padding: 0; background: #ffffff; }
    .page {
      margin: 0;
      border: none;
      padding: 24px 28px;
      max-width: none;
      box-shadow: none;
    }
    .actions { display: none !important; }
    @page { size: A4; margin: 10mm; }
  }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="logo-block">
      <div class="logo-box">
        <img src="../images/hiltonlogo.png" alt="HILTON CARGO" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
        <div class="fallback" style="display:none;">HC</div>
      </div>
      <div>
        <div class="brand-title">HILTON CARGO</div>
        <div class="brand-sub">LOGISTICS</div>
      </div>
    </div>
    <div class="header-right">
      <span class="row-line tracking-line">
        <span class="label">Tracking Code:</span><span class="value mono">${s.tracking_number || '-'}</span>
      </span>
      <span class="row-line">
        <span class="label">Date Sent:</span><span class="value">${formatDate(s.date_sent)}</span>
      </span>
      <span class="row-line">
        <span class="label">Date Expected:</span><span class="value">${formatDate(s.date_expected)}</span>
      </span>
      <span class="row-line">
        <span class="label">Invoice created at:</span><span class="value">${formatDate(s.invoice_created_at || s.created_at)}</span>
      </span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Sender Details</div>
    <div class="section-rows">
      <div class="row"><div class="label">Name</div><div class="value">${s.sender_name || s.customer_name || '-'}</div></div>
      <div class="row"><div class="label">Email</div><div class="value">${s.sender_email || '-'}</div></div>
      <div class="row"><div class="label">Address</div><div class="value">${s.sender_address || '-'}</div></div>
      <div class="row"><div class="label">Phone</div><div class="value">${s.sender_phone || '-'}</div></div>
      <div class="row"><div class="label">Country</div><div class="value">${s.sender_country || '-'}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Receiver Details</div>
    <div class="section-rows">
      <div class="row"><div class="label">Name</div><div class="value">${s.receiver_name || '-'}</div></div>
      <div class="row"><div class="label">Email</div><div class="value">${s.receiver_email || '-'}</div></div>
      <div class="row"><div class="label">Address</div><div class="value">${s.receiver_address || '-'}</div></div>
      <div class="row"><div class="label">Phone</div><div class="value">${s.receiver_phone || '-'}</div></div>
      <div class="row"><div class="label">Country</div><div class="value">${s.receiver_country || '-'}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Shipment Information</div>
    <div class="section-rows">
      <div class="row"><div class="label">Name</div><div class="value">${s.receiver_name || s.sender_name || s.customer_name || '-'}</div></div>
      <div class="row"><div class="label">Description</div><div class="value">${s.package_description || 'General Cargo'}</div></div>
      <div class="row"><div class="label">Weight</div><div class="value">${(Number(s.package_weight || s.weight) || 0).toFixed(1)}KG</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Tracking Information</div>
    <div class="section-rows">
      <div class="row"><div class="label">Status</div><div class="value">${(s.status || 'pending').replace(/&nbsp;/g, ' ').replace(/_/g, ' ')}</div></div>
      <div class="row"><div class="label">Date Sent</div><div class="value">${formatDate(s.date_sent)}</div></div>
      <div class="row"><div class="label">Expected Date of Arrival</div><div class="value">${formatDate(s.date_expected)}</div></div>
      <div class="row"><div class="label">Progress</div><div class="value">${prog}%</div></div>
      <div class="row"><div class="label">Current Location</div><div class="value">${s.current_location || s.origin || '-'}</div></div>
    </div>
  </div>

  <div class="total-row">
    <div class="total-box">Total:<span class="amount">${formatCurrency(s.total_amount)}</span></div>
  </div>
</div>

<div class="actions">
  <button class="btn-print" onclick="window.print()">&#128438; Print Invoice</button>
  <button class="btn-download" onclick="downloadInvoice()">&#128190; Save as HTML</button>
  <a href="javascript:history.back()" class="btn-back">&larr; Back</a>
</div>
<script>
function downloadInvoice() {
  var actionsEl = document.querySelector('.actions');
  if (actionsEl) actionsEl.style.display = 'none';
  var html = '<!DOCTYPE html>' + document.documentElement.outerHTML;
  var blob = new Blob([html], { type: 'text/html' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  var t = '${s.tracking_number || 'invoice'}' + '_' + new Date().toISOString().slice(0,10);
  a.download = 'invoice_' + t.replace(/[^a-zA-Z0-9_-]/g,'') + '.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  if (actionsEl) actionsEl.style.display = 'flex';
}
</script>
</body>
</html>`;
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
    const normalized = normalizeShipmentData(req.body || {}, { isCreate: true });

    const created_at_ts = admin.firestore.FieldValue ? admin.firestore.FieldValue.serverTimestamp() : normalized.created_at;
    const updated_at_ts = admin.firestore.FieldValue ? admin.firestore.FieldValue.serverTimestamp() : normalized.updated_at;

    const data = {
      ...normalized,
      created_at: created_at_ts,
      updated_at: updated_at_ts
    };

    if (db._data) {
      data.created_at = normalized.created_at;
      data.updated_at = normalized.updated_at;
    }

    const result = await db.collection('shipments').add(data);
    res.status(201).json({ id: result.id, ...normalized });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/shipments/:id', async (req, res) => {
  try {
    const docRef = db.collection('shipments').doc(req.params.id);
    const existingDoc = await docRef.get();
    let existingShipment = {};
    if (existingDoc.exists) {
      existingShipment = existingDoc.data() || {};
      if (existingShipment && typeof existingShipment.created_at !== 'string' && existingShipment.created_at && existingShipment.created_at.toDate) {
        existingShipment.created_at = existingShipment.created_at.toDate().toISOString();
      }
    }

    const normalized = normalizeShipmentData(req.body || {}, { isCreate: false, existingShipment });

    const updated_at_ts = admin.firestore.FieldValue ? admin.firestore.FieldValue.serverTimestamp() : normalized.updated_at;
    const data = { ...normalized, updated_at: updated_at_ts };

    if (db._data) {
      data.updated_at = normalized.updated_at;
      delete data.created_at;
    }

    await docRef.update(data);

    const doc = await docRef.get();
    const rawData = doc.data() || {};
    const result = { id: doc.id, ...rawData };
    if (result.created_at && result.created_at.toDate) result.created_at = result.created_at.toDate().toISOString();
    if (result.updated_at && result.updated_at.toDate) result.updated_at = result.updated_at.toDate().toISOString();
    res.json(result);
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

const render404Html = () => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>HILTON CARGO - 404 Not Found</title>
<style>
  body { font-family:'Georgia','Courier New',serif; background:#ffffff; min-height:100vh; display:flex; align-items:center; justify-content:center; margin:0; }
  .nfbox { text-align:center; max-width:480px; padding:40px; }
  .nfbox h1 { font-size:72px; color:#001B90; margin:0 0 8px; font-family:'Courier New',monospace; }
  .nfbox h2 { font-size:22px; color:#111827; margin:0 0 12px; }
  .nfbox p { color:#6b7280; margin:0 0 24px; line-height:1.6; }
  .backbtn { display:inline-block; background:#001B90; color:#fff; padding:12px 24px; border-radius:50px; text-decoration:none; font-family:'Courier New',monospace; font-weight:700; letter-spacing:0.5px; text-transform:uppercase; font-size:13px; }
</style>
</head>
<body>
<div class="nfbox">
  <h1>404</h1>
  <h2>Shipment Not Found</h2>
  <p>The shipment ID you requested could not be located. Please verify the ID and try again.</p>
  <a href="javascript:history.back()" class="backbtn">&larr; Go Back</a>
</div>
</body>
</html>`;

app.get('/admin/receipt', async (req, res) => {
  try {
    const shipmentId = req.query.id;
    if (!shipmentId) {
      res.status(404).type('html').send(render404Html());
      return;
    }

    let shipment = null;

    if (db._data) {
      shipment = db._data.shipments.find(s => s.id === shipmentId);
      if (shipment) shipment = { ...shipment };
    } else {
      const doc = await db.collection('shipments').doc(shipmentId).get();
      if (doc.exists) {
        shipment = { id: doc.id, ...doc.data() };
        if (shipment.created_at && shipment.created_at.toDate) shipment.created_at = shipment.created_at.toDate().toISOString();
        if (shipment.updated_at && shipment.updated_at.toDate) shipment.updated_at = shipment.updated_at.toDate().toISOString();
        if (shipment.date_sent && shipment.date_sent.toDate) shipment.date_sent = shipment.date_sent.toDate().toISOString();
        if (shipment.date_expected && shipment.date_expected.toDate) shipment.date_expected = shipment.date_expected.toDate().toISOString();
        if (shipment.invoice_created_at && shipment.invoice_created_at.toDate) shipment.invoice_created_at = shipment.invoice_created_at.toDate().toISOString();
      }
    }

    if (!shipment) {
      res.status(404).type('html').send(render404Html());
      return;
    }

    const download = req.query.download === '1' || req.query.attachment === '1';
    const html = renderReceiptHtml(shipment);
    if (download) {
      const safeName = (shipment.tracking_number || 'invoice_' + shipmentId).replace(/[^a-zA-Z0-9_-]/g, '');
      res.setHeader('Content-Disposition', `attachment; filename="invoice_${safeName}.html"`);
    }
    res.type('html').send(html);
  } catch (error) {
    res.status(500).type('html').send(`<html><body><h1>Server Error</h1><p>${error.message}</p></body></html>`);
  }
});

app.get('/api/shipments/:id/receipt', (req, res) => {
  const id = req.params.id;
  const download = req.query.download === '1' ? '&download=1' : '';
  res.redirect(302, '/admin/receipt?id=' + encodeURIComponent(id) + download);
});

app.get('/api/shipments/:id/download', async (req, res) => {
  try {
    const shipmentId = req.params.id;
    let shipment = null;

    if (db._data) {
      shipment = db._data.shipments.find(s => s.id === shipmentId);
      if (shipment) shipment = { ...shipment };
    } else {
      const doc = await db.collection('shipments').doc(shipmentId).get();
      if (doc.exists) {
        shipment = { id: doc.id, ...doc.data() };
        if (shipment.created_at && shipment.created_at.toDate) shipment.created_at = shipment.created_at.toDate().toISOString();
        if (shipment.updated_at && shipment.updated_at.toDate) shipment.updated_at = shipment.updated_at.toDate().toISOString();
        if (shipment.date_sent && shipment.date_sent.toDate) shipment.date_sent = shipment.date_sent.toDate().toISOString();
        if (shipment.date_expected && shipment.date_expected.toDate) shipment.date_expected = shipment.date_expected.toDate().toISOString();
        if (shipment.invoice_created_at && shipment.invoice_created_at.toDate) shipment.invoice_created_at = shipment.invoice_created_at.toDate().toISOString();
      }
    }

    if (!shipment) {
      res.status(404).json({ error: 'Shipment not found' });
      return;
    }

    const safeName = (shipment.tracking_number || 'invoice_' + shipmentId).replace(/[^a-zA-Z0-9_-]/g, '');
    const html = renderReceiptHtml(shipment);
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="invoice_${safeName}.html"`);
    res.send(html);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/shipments/export/invoices', async (req, res) => {
  try {
    const all = await getDocuments('shipments');
    const normalized = all.map(s => {
      const o = { ...s };
      ['created_at','updated_at','date_sent','date_expected','invoice_created_at'].forEach(k => {
        if (o[k] && o[k].toDate) o[k] = o[k].toDate().toISOString();
      });
      return o;
    });

    const sectionHeader = '#29B6F6';
    const rowBorder = '#B3E5FC';
    const brandBlue = '#0277BD';

    const invoiceCards = normalized.map(s => {
      const prog = Math.max(0, Math.min(100, Number(s.progress_pct) || 0));
      return `
<div class="page" style="page-break-after: always;">
  <div class="header">
    <div class="logo-block">
      <div class="logo-box"><div class="fallback">HC</div></div>
      <div>
        <div class="brand-title">HILTON CARGO</div>
        <div class="brand-sub">LOGISTICS</div>
      </div>
    </div>
    <div class="header-right">
      <span class="row-line tracking-line"><span class="label">Tracking Code:</span><span class="value mono">${s.tracking_number || '-'}</span></span>
      <span class="row-line"><span class="label">Date Sent:</span><span class="value">${formatDate(s.date_sent)}</span></span>
      <span class="row-line"><span class="label">Date Expected:</span><span class="value">${formatDate(s.date_expected)}</span></span>
      <span class="row-line"><span class="label">Invoice created at:</span><span class="value">${formatDate(s.invoice_created_at || s.created_at)}</span></span>
    </div>
  </div>
  <div class="section"><div class="section-title">Sender Details</div><div class="section-rows">
    <div class="row"><div class="label">Name</div><div class="value">${s.sender_name || s.customer_name || '-'}</div></div>
    <div class="row"><div class="label">Email</div><div class="value">${s.sender_email || '-'}</div></div>
    <div class="row"><div class="label">Address</div><div class="value">${s.sender_address || '-'}</div></div>
    <div class="row"><div class="label">Phone</div><div class="value">${s.sender_phone || '-'}</div></div>
    <div class="row"><div class="label">Country</div><div class="value">${s.sender_country || '-'}</div></div>
  </div></div>
  <div class="section"><div class="section-title">Receiver Details</div><div class="section-rows">
    <div class="row"><div class="label">Name</div><div class="value">${s.receiver_name || '-'}</div></div>
    <div class="row"><div class="label">Email</div><div class="value">${s.receiver_email || '-'}</div></div>
    <div class="row"><div class="label">Address</div><div class="value">${s.receiver_address || '-'}</div></div>
    <div class="row"><div class="label">Phone</div><div class="value">${s.receiver_phone || '-'}</div></div>
    <div class="row"><div class="label">Country</div><div class="value">${s.receiver_country || '-'}</div></div>
  </div></div>
  <div class="section"><div class="section-title">Shipment Information</div><div class="section-rows">
    <div class="row"><div class="label">Name</div><div class="value">${s.receiver_name || s.sender_name || s.customer_name || '-'}</div></div>
    <div class="row"><div class="label">Description</div><div class="value">${s.package_description || 'General Cargo'}</div></div>
    <div class="row"><div class="label">Weight</div><div class="value">${(Number(s.package_weight || s.weight) || 0).toFixed(1)}KG</div></div>
  </div></div>
  <div class="section"><div class="section-title">Tracking Information</div><div class="section-rows">
    <div class="row"><div class="label">Status</div><div class="value">${(s.status || 'pending').replace(/_/g, ' ')}</div></div>
    <div class="row"><div class="label">Date Sent</div><div class="value">${formatDate(s.date_sent)}</div></div>
    <div class="row"><div class="label">Expected Date of Arrival</div><div class="value">${formatDate(s.date_expected)}</div></div>
    <div class="row"><div class="label">Progress</div><div class="value">${prog}%</div></div>
    <div class="row"><div class="label">Current Location</div><div class="value">${s.current_location || s.origin || '-'}</div></div>
  </div></div>
  <div class="total-row"><div class="total-box">Total:<span class="amount">${formatCurrency(s.total_amount)}</span></div></div>
</div>`;
    }).join('\n');

    const combinedHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>HILTON CARGO - All Shipments Invoices</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f5f5f5; color: #212121; line-height: 1.4; }
body { padding: 24px; }
.toolbar { max-width: 850px; margin: 0 auto 20px; display: flex; gap: 10px; flex-wrap: wrap; }
.toolbar button { background: ${brandBlue}; color: #fff; border: none; padding: 12px 22px; border-radius: 50px; font-size: 14px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 14px rgba(2,119,189,0.35); }
.toolbar .back { background: #fff; color: #374151; border: 1px solid #d1d5db; box-shadow: none; }
.page { width: 100%; max-width: 850px; margin: 0 auto 30px; background: #fff; border: 2px solid ${rowBorder}; padding: 36px 40px 40px; position: relative; }
.header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; flex-wrap: wrap; gap: 20px; }
.logo-block { display: flex; align-items: center; gap: 14px; }
.logo-box { width: 68px; height: 56px; border: 4px solid ${brandBlue}; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: #fff; }
.logo-box .fallback { font-size: 28px; font-weight: 900; color: ${brandBlue}; letter-spacing: -1px; }
.brand-title { font-size: 26px; font-weight: 900; color: ${brandBlue}; letter-spacing: 0.3px; line-height: 1; }
.brand-sub { font-size: 14px; color: #455A64; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; margin-top: 4px; }
.header-right { text-align: right; font-size: 14px; line-height: 1.75; padding-top: 4px; }
.header-right .row-line { display: block; }
.header-right .label { font-weight: 600; color: #37474F; margin-right: 6px; }
.header-right .value { font-weight: 700; color: #212121; }
.header-right .tracking-line .value { color: ${brandBlue}; font-size: 15px; }
.section { margin-bottom: 22px; border-radius: 2px; overflow: hidden; }
.section-title { background: ${sectionHeader}; color: #fff; padding: 10px 16px; font-size: 15px; font-weight: 800; letter-spacing: 0.2px; }
.section-rows { border-left: 1px solid ${rowBorder}; border-right: 1px solid ${rowBorder}; border-bottom: 1px solid ${rowBorder}; }
.row { display: flex; justify-content: space-between; align-items: flex-start; padding: 10px 16px; border-bottom: 1px solid ${rowBorder}; font-size: 14px; gap: 16px; }
.row:last-child { border-bottom: none; }
.row .label { color: #37474F; font-weight: 700; min-width: 140px; flex-shrink: 0; }
.row .value { color: #212121; font-weight: 600; text-align: right; word-break: break-word; }
.row .value.mono { font-family: 'Courier New', monospace; }
.total-row { display: flex; justify-content: flex-end; padding-top: 6px; }
.total-box { font-size: 17px; font-weight: 800; color: #212121; padding-right: 16px; }
.total-box .amount { font-family: 'Courier New', monospace; margin-left: 8px; }
.summary { max-width: 850px; margin: 0 auto 24px; background: #fff; border: 1px solid ${rowBorder}; border-radius: 8px; padding: 18px 22px; }
.summary h2 { font-size: 18px; color: ${brandBlue}; margin-bottom: 8px; }
.summary p { color: #455A64; font-size: 14px; }
@media print {
  body { padding: 0; background: #fff; }
  .toolbar, .summary { display: none !important; }
  .page { margin: 0 auto; border: none; max-width: none; box-shadow: none; }
  @page { size: A4; margin: 10mm; }
}
</style>
</head>
<body>
<div class="toolbar">
  <button onclick="window.print()">&#128438; Print All</button>
  <button onclick="downloadAll()">&#128190; Save as HTML File</button>
  <button class="back" onclick="window.close()">&larr; Close</button>
</div>
<div class="summary">
  <h2>All Shipments Invoices Export</h2>
  <p>Generated: ${new Date().toLocaleString()} &bull; Total shipments: ${normalized.length}</p>
</div>
${invoiceCards}
<script>
function downloadAll() {
  var tb = document.querySelector('.toolbar');
  var sm = document.querySelector('.summary');
  if (tb) tb.style.display = 'none';
  if (sm) sm.style.display = 'none';
  var html = '<!DOCTYPE html>' + document.documentElement.outerHTML;
  var blob = new Blob([html], { type: 'text/html' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  var d = new Date().toISOString().slice(0,10);
  a.download = 'all_invoices_' + d + '.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  if (tb) tb.style.display = 'flex';
  if (sm) sm.style.display = 'block';
}
</script>
</body>
</html>`;

    const stamp = new Date().toISOString().slice(0,10);
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="all_shipments_invoices_${stamp}.html"`);
    res.send(combinedHtml);
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
  if (!db && firestoreDb) {
    try {
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('__timeout__')), 15000);
        firestoreDb.collection('services').limit(1).get()
          .then(() => { clearTimeout(timeout); resolve(); })
          .catch((err) => { clearTimeout(timeout); reject(err); });
      });
      db = firestoreDb;
      console.log('✅ Firebase credentials verified! Connected to Firestore successfully.');
      console.log('');
    } catch (verificationError) {
      let reasonLabel, troubleshooting;
      const isTimeout = verificationError && verificationError.message === '__timeout__';
      const errCode = verificationError && !isTimeout ? (verificationError.code || '') : '';
      const errMsg = verificationError && !isTimeout ? (verificationError.message || '') : '';

      if (isTimeout) {
        reasonLabel = 'Connection timed out (15s)';
        troubleshooting = [
          '• Internet connection is unstable or offline',
          '• Firewall / proxy is blocking connections to Google APIs (port 443)',
          '• Firebase servers are temporarily unavailable (check status.firebase.google.com)',
          '• The Firestore database region is very far from this server (try using a closer region)'
        ];
      } else if (errCode === 7 || /permission/i.test(errMsg)) {
        reasonLabel = 'PERMISSION_DENIED (IAM role missing)';
        const projectForIam = currentProjectId || 'YOUR_PROJECT_ID';
        const saForIam = currentServiceAccountEmail || 'YOUR_SERVICE_ACCOUNT_EMAIL';
        troubleshooting = [
          'Your service account lacks Firestore permissions. Go to Google Cloud Console:',
          '  https://console.cloud.google.com/iam-admin/iam?project=' + projectForIam,
          '  → Find the service account: ' + saForIam,
          '  → Click "Edit" (pencil) → "Add another role" → grant one of these:',
          '    - Firebase Admin SDK Administrator Service Agent (recommended)',
          '    - Cloud Datastore User',
          '    - Firebase Firestore Service Agent',
          '    - Owner (for testing only, not recommended for production)'
        ];
      } else if (errCode === 5 || /not.?found/i.test(errMsg)) {
        reasonLabel = 'NOT_FOUND (Firestore database not created)';
        const projectForFirestore = currentProjectId || 'YOUR_PROJECT_ID';
        troubleshooting = [
          'You must create the Firestore database first! Go to Firebase Console:',
          '  https://console.firebase.google.com/project/' + projectForFirestore + '/firestore',
          '  → Click "Create database"',
          '  → Choose "Start in production mode" (or test mode for development)',
          '  → Choose a location (e.g., nam5, us-central, europe-west, asia-east)',
          '  → Click "Enable"',
          '  Then wait 2-3 minutes and restart this server.'
        ];
      } else if (errCode === 16 || /unauthenticated/i.test(errMsg) || /invalid.*credential/i.test(errMsg)) {
        reasonLabel = 'UNAUTHENTICATED (Credentials invalid/revoked)';
        const projectForSa = currentProjectId || 'YOUR_PROJECT_ID';
        troubleshooting = [
          'The private key in firebase-service-account.json has been REVOKED, DELETED, or was NEVER ACTIVATED.',
          'You MUST generate a NEW key from Firebase Console:',
          '  1. Go to: https://console.firebase.google.com/project/' + projectForSa + '/settings/serviceaccounts/adminsdk',
          '  2. Make sure "Node.js" is selected at the top',
          '  3. Click the BIG BLUE BUTTON: "Generate new private key"',
          '  4. A warning pop-up appears → click "Generate key"',
          '  5. A JSON file will be downloaded to your computer',
          '  6. RENAME the downloaded file to: firebase-service-account.json',
          '  7. COPY and REPLACE it into this folder, overwriting the existing old one',
          '  8. Restart this server (Ctrl+C, then: node server.js)',
          '',
          '   ⚠️  IMPORTANT: Do NOT edit the downloaded JSON file by hand.',
          '   Each line, every character matters (including the "-----BEGIN PRIVATE KEY-----" block).',
          '   Just download → rename → copy → paste → overwrite.'
        ];
      } else if (errCode === 14 || /unavailable/i.test(errMsg)) {
        reasonLabel = 'UNAVAILABLE (Service or network issue)';
        troubleshooting = [
          '• Check your internet connection (can you open google.com?)',
          '• Firebase service outage: check https://status.firebase.google.com',
          '• Project ID mismatch: compare project_id in firebase-service-account.json',
          '  with the project ID in Firebase Console.'
        ];
      } else {
        reasonLabel = (verificationError && (verificationError.code || verificationError.message)) || 'Unknown error';
        troubleshooting = [
          'Please share the full error output above with support, or:',
          '• Regenerate a new service account key as described in the UNAUTHENTICATED case above',
          '• Make sure you are replacing the ENTIRE firebase-service-account.json file (not editing it)',
          '• Check that Firestore is created in Firebase Console → Firestore Database'
        ];
      }

      console.log('');
      console.log('─────────────────────────────────────────────────────────────────────');
      console.log('⚠️  FIREBASE CONNECTION FAILED');
      console.log('─────────────────────────────────────────────────────────────────────');
      console.log('   Reason: ' + reasonLabel);
      if (!isTimeout && errMsg && !reasonLabel.includes(errMsg)) {
        console.log('   Details: ' + errMsg);
      }
      console.log('');
      console.log('   🔧 TROUBLESHOOTING:');
      troubleshooting.forEach(line => console.log('   ' + line));
      console.log('');
      console.log('   Until fixed: Server will use IN-MEMORY demo data.');
      console.log('   (Shipments you create now will be LOST when the server restarts.)');
      console.log('─────────────────────────────────────────────────────────────────────');
      console.log('');
      db = createInMemoryDb();
    }
  }

  if (!db) {
    db = createInMemoryDb();
  }

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
      console.log('');
      console.log('╔══════════════════════════════════════════════════════════════════╗');
      console.log('║          🚀  HILTON CARGO SERVER STARTED SUCCESSFULLY              ║');
      console.log('╚══════════════════════════════════════════════════════════════════╝');
      console.log('');
      console.log('   🌐 Website              : http://localhost:' + port);
      console.log('   📊 Admin Dashboard   : http://localhost:' + port + '/admin/index.html');
      console.log('   📦 Shipments   : http://localhost:' + port + '/admin/shipments.html');
      console.log('');
      if (db._data) {
        console.log('   🗄️  DATABASE MODE  : IN-MEMORY (DEMO ONLY — DATA NOT PERSISTED');
        console.log('');
        console.log('   ⚠️  WARNING: Shipments/customers you create/edit will be LOST when');
        console.log('      the server restarts! To fix this, see instructions above,');
        console.log('      or read the TROUBLESHOOTING steps that were printed.');
        console.log('      You need: a valid service account + Firestore database.');
      } else {
        console.log('   🗄️  DATABASE MODE  : FIREBASE FIRESTORE (PERSISTENT)');
        console.log('   ✅ All data is saved to the cloud and will survive restarts.');
      }
      console.log('');
      console.log('───────────────────────────────────────────────────────────────────');
      console.log('');
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
