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

const generateToken = (user) => {
  return jwt.sign(
    { id: user.AccountId, username: user.Name, isAdmin: user.Authority >= 2 },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

module.exports = { authMiddleware, generateToken, JWT_SECRET };
