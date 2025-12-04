require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({ 
  origin: '*', 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For PayPal IPN

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/shop', require('./routes/shop'));
app.use('/api/rankings', require('./routes/rankings'));
app.use('/api/server', require('./routes/server'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/daily', require('./routes/daily'));
app.use('/api/roulette', require('./routes/roulette'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/character', require('./routes/character'));
app.use('/api/payments/paypal', require('./routes/paypal'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`NovaEra API running on port ${PORT}`);
});

module.exports = app;
