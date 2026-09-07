const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize MongoDB Atlas connection & seeding
if (process.env.MONGODB_URI) {
  const { initMongo } = require('./mongo');
  initMongo(process.env.MONGODB_URI);
} else {
  console.warn('[Server Warning] MONGODB_URI is not set in environment.');
}

// Serve static uploaded files (Logo & Group Photos)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes
const authRoutes = require('./routes/auth');
const festivalsRoutes = require('./routes/festivals');
const membersRoutes = require('./routes/members');
const donorsRoutes = require('./routes/donors');
const transactionsRoutes = require('./routes/transactions');
const settingsRoutes = require('./routes/settings');
const templatesRoutes = require('./routes/templates');
const reportsRoutes = require('./routes/reports');
const whatsappRoutes = require('./routes/whatsapp');
const auditRoutes = require('./routes/audit');

app.use('/api/auth', authRoutes);
app.use('/api/festivals', festivalsRoutes);
app.use('/api/members', membersRoutes);
app.use('/api/donors', donorsRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/templates', templatesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/audit', auditRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  if (err) {
    console.error('[Express Error]:', err.message);
    return res.status(400).json({ error: err.message || 'An unexpected error occurred' });
  }
  next();
});

// Serve frontend static build if in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  Vinayaka Chavithi Backend Running on Port ${PORT}`);
  console.log(`====================================================`);
});
