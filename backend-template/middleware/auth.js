const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'novaera_secret_key_change_this';

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.authority < 100) {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  next();
};

const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.AccountId, 
      username: user.Name, 
      authority: user.Authority,
      isAdmin: user.Authority >= 100 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

module.exports = { authMiddleware, adminMiddleware, generateToken, JWT_SECRET };
