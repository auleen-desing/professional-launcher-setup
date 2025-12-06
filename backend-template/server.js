require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { 
  securityHeaders, 
  rateLimit, 
  sanitizeInput, 
  securityLogger,
  createCorsConfig 
} = require('./middleware/security');

const app = express();

// ===========================================
// SECURITY MIDDLEWARE (Order matters!)
// ===========================================

// 1. Security headers on all responses
app.use(securityHeaders);

// 2. CORS configuration
// In production, replace '*' with your actual domain(s)
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['*'];
app.use(cors(createCorsConfig(allowedOrigins)));

// 3. Rate limiting (before body parsing to protect against large payloads)
app.use(rateLimit);

// 4. Body parsing with size limits
app.use(express.json({ limit: '10kb' })); // Limit JSON body size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 5. Input sanitization
app.use(sanitizeInput);

// 6. Security logging (detect and block malicious requests)
app.use(securityLogger);

// ===========================================
// API ROUTES
// ===========================================
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
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Global error handler (don't leak error details in production)
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack);
  
  // Don't leak error details in production
  const isDev = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({ 
    success: false, 
    error: isDev ? err.message : 'Internal server error'
  });
});

// ===========================================
// SERVER START
// ===========================================
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`🛡️  NovaEra API running on http://${HOST}:${PORT}`);
  console.log(`🔒 Security features enabled: Rate Limiting, Security Headers, Input Sanitization`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

module.exports = app;
