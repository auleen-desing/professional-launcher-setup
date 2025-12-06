/**
 * Security Middleware for NovaEra API
 * Implements: Rate Limiting, Security Headers, Input Sanitization, Login Protection
 */

// In-memory rate limiting store (use Redis in production for multiple instances)
const rateLimitStore = new Map();
const loginAttemptsStore = new Map();
const blockedIPs = new Set();

// Configuration
const CONFIG = {
  // General rate limiting
  RATE_LIMIT: {
    WINDOW_MS: 60 * 1000, // 1 minute
    MAX_REQUESTS: 100, // 100 requests per minute per IP
  },
  // Stricter limits for sensitive endpoints
  AUTH_RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 10, // 10 login attempts per 15 minutes
  },
  // Account lockout
  LOGIN_PROTECTION: {
    MAX_ATTEMPTS: 5, // Lock after 5 failed attempts
    LOCKOUT_TIME: 15 * 60 * 1000, // 15 minutes lockout
  },
  // IP blocking
  BLOCK_DURATION: 60 * 60 * 1000, // 1 hour block for malicious IPs
};

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  
  // Clean rate limit store
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.timestamp > CONFIG.RATE_LIMIT.WINDOW_MS * 2) {
      rateLimitStore.delete(key);
    }
  }
  
  // Clean login attempts store
  for (const [key, data] of loginAttemptsStore.entries()) {
    if (now - data.lastAttempt > CONFIG.LOGIN_PROTECTION.LOCKOUT_TIME) {
      loginAttemptsStore.delete(key);
    }
  }
  
  // Clean blocked IPs
  for (const ip of blockedIPs) {
    const data = rateLimitStore.get(`block_${ip}`);
    if (data && now - data.timestamp > CONFIG.BLOCK_DURATION) {
      blockedIPs.delete(ip);
      rateLimitStore.delete(`block_${ip}`);
    }
  }
}, 60 * 1000); // Run every minute

/**
 * Get client IP address
 */
function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
         req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         req.ip || 
         'unknown';
}

/**
 * Security Headers Middleware
 */
function securityHeaders(req, res, next) {
  // Prevent XSS attacks
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Control referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com");
  
  // Strict Transport Security (HTTPS only)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Permissions Policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Remove server identification
  res.removeHeader('X-Powered-By');
  
  next();
}

/**
 * General Rate Limiting Middleware
 */
function rateLimit(req, res, next) {
  const ip = getClientIP(req);
  
  // Check if IP is blocked
  if (blockedIPs.has(ip)) {
    console.log(`[SECURITY] Blocked IP attempted access: ${ip}`);
    return res.status(403).json({ 
      success: false, 
      error: 'Access denied. Your IP has been temporarily blocked.' 
    });
  }
  
  const key = `rate_${ip}`;
  const now = Date.now();
  const data = rateLimitStore.get(key) || { count: 0, timestamp: now };
  
  // Reset if window has passed
  if (now - data.timestamp > CONFIG.RATE_LIMIT.WINDOW_MS) {
    data.count = 0;
    data.timestamp = now;
  }
  
  data.count++;
  rateLimitStore.set(key, data);
  
  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', CONFIG.RATE_LIMIT.MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, CONFIG.RATE_LIMIT.MAX_REQUESTS - data.count));
  res.setHeader('X-RateLimit-Reset', Math.ceil((data.timestamp + CONFIG.RATE_LIMIT.WINDOW_MS) / 1000));
  
  if (data.count > CONFIG.RATE_LIMIT.MAX_REQUESTS) {
    console.log(`[SECURITY] Rate limit exceeded for IP: ${ip}`);
    
    // If exceeding by a lot, block the IP
    if (data.count > CONFIG.RATE_LIMIT.MAX_REQUESTS * 3) {
      blockedIPs.add(ip);
      rateLimitStore.set(`block_${ip}`, { timestamp: now });
      console.log(`[SECURITY] IP blocked for excessive requests: ${ip}`);
    }
    
    return res.status(429).json({ 
      success: false, 
      error: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((CONFIG.RATE_LIMIT.WINDOW_MS - (now - data.timestamp)) / 1000)
    });
  }
  
  next();
}

/**
 * Strict Rate Limiting for Auth Endpoints
 */
function authRateLimit(req, res, next) {
  const ip = getClientIP(req);
  const key = `auth_${ip}`;
  const now = Date.now();
  const data = rateLimitStore.get(key) || { count: 0, timestamp: now };
  
  if (now - data.timestamp > CONFIG.AUTH_RATE_LIMIT.WINDOW_MS) {
    data.count = 0;
    data.timestamp = now;
  }
  
  data.count++;
  rateLimitStore.set(key, data);
  
  if (data.count > CONFIG.AUTH_RATE_LIMIT.MAX_REQUESTS) {
    console.log(`[SECURITY] Auth rate limit exceeded for IP: ${ip}`);
    return res.status(429).json({ 
      success: false, 
      error: 'Too many authentication attempts. Please wait 15 minutes.',
      retryAfter: Math.ceil((CONFIG.AUTH_RATE_LIMIT.WINDOW_MS - (now - data.timestamp)) / 1000)
    });
  }
  
  next();
}

/**
 * Login Attempt Tracking (call on failed login)
 */
function recordFailedLogin(username, ip) {
  const key = `login_${username}_${ip}`;
  const now = Date.now();
  const data = loginAttemptsStore.get(key) || { attempts: 0, lastAttempt: now, lockedUntil: 0 };
  
  data.attempts++;
  data.lastAttempt = now;
  
  if (data.attempts >= CONFIG.LOGIN_PROTECTION.MAX_ATTEMPTS) {
    data.lockedUntil = now + CONFIG.LOGIN_PROTECTION.LOCKOUT_TIME;
    console.log(`[SECURITY] Account locked due to failed attempts: ${username} from ${ip}`);
  }
  
  loginAttemptsStore.set(key, data);
  
  return {
    locked: data.lockedUntil > now,
    remainingAttempts: Math.max(0, CONFIG.LOGIN_PROTECTION.MAX_ATTEMPTS - data.attempts),
    lockedUntil: data.lockedUntil
  };
}

/**
 * Check if Login is Allowed
 */
function isLoginAllowed(username, ip) {
  const key = `login_${username}_${ip}`;
  const data = loginAttemptsStore.get(key);
  
  if (!data) return { allowed: true, remainingAttempts: CONFIG.LOGIN_PROTECTION.MAX_ATTEMPTS };
  
  const now = Date.now();
  
  // Check if lockout has expired
  if (data.lockedUntil && data.lockedUntil > now) {
    return { 
      allowed: false, 
      remainingAttempts: 0,
      lockedUntil: data.lockedUntil,
      waitSeconds: Math.ceil((data.lockedUntil - now) / 1000)
    };
  }
  
  // Reset if lockout expired
  if (data.lockedUntil && data.lockedUntil <= now) {
    loginAttemptsStore.delete(key);
    return { allowed: true, remainingAttempts: CONFIG.LOGIN_PROTECTION.MAX_ATTEMPTS };
  }
  
  return { 
    allowed: true, 
    remainingAttempts: Math.max(0, CONFIG.LOGIN_PROTECTION.MAX_ATTEMPTS - data.attempts)
  };
}

/**
 * Clear login attempts on successful login
 */
function clearLoginAttempts(username, ip) {
  const key = `login_${username}_${ip}`;
  loginAttemptsStore.delete(key);
}

/**
 * Input Sanitization Middleware
 */
function sanitizeInput(req, res, next) {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      // Remove null bytes
      obj = obj.replace(/\0/g, '');
      // Remove potential SQL injection patterns (extra layer, parameterized queries are primary defense)
      obj = obj.replace(/(['";]|--)/g, '');
      return obj.trim();
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const key of Object.keys(obj)) {
        // Sanitize keys too
        const cleanKey = key.replace(/[^\w\-]/g, '');
        sanitized[cleanKey] = sanitize(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };
  
  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }
  if (req.params) {
    req.params = sanitize(req.params);
  }
  
  next();
}

/**
 * Request Logging Middleware (for security audit)
 */
function securityLogger(req, res, next) {
  const ip = getClientIP(req);
  const timestamp = new Date().toISOString();
  
  // Log suspicious requests
  const suspiciousPatterns = [
    /(<script|javascript:|data:|vbscript:)/i,
    /(union\s+select|drop\s+table|insert\s+into)/i,
    /(\.\.\/)|(\.\.\\)/,
    /(etc\/passwd|etc\/shadow)/i,
  ];
  
  const requestData = JSON.stringify({ body: req.body, query: req.query, params: req.params });
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(requestData) || pattern.test(req.url)) {
      console.log(`[SECURITY ALERT] Suspicious request detected:
        IP: ${ip}
        Time: ${timestamp}
        Method: ${req.method}
        URL: ${req.url}
        Pattern: ${pattern}
      `);
      
      // Block malicious IPs immediately
      blockedIPs.add(ip);
      rateLimitStore.set(`block_${ip}`, { timestamp: Date.now() });
      
      return res.status(403).json({ 
        success: false, 
        error: 'Malicious request detected. Access denied.' 
      });
    }
  }
  
  next();
}

/**
 * CORS with specific origins (production)
 */
function createCorsConfig(allowedOrigins = ['*']) {
  return {
    origin: function(origin, callback) {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log(`[SECURITY] CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 86400 // 24 hours
  };
}

module.exports = {
  securityHeaders,
  rateLimit,
  authRateLimit,
  sanitizeInput,
  securityLogger,
  createCorsConfig,
  recordFailedLogin,
  isLoginAllowed,
  clearLoginAttempts,
  getClientIP,
  CONFIG
};
