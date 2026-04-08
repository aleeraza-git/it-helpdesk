/**
 * IMARAT IT Support - Authentication Middleware
 */

const jwt = require('jsonwebtoken');
const { helpers } = require('./database');

const JWT_SECRET = process.env.JWT_SECRET || 'imarat-it-support-secret-2024-change-in-production';
const JWT_EXPIRES = '24h';

/**
 * Sign a JWT token for a user
 */
function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

/**
 * Verify a JWT token and return the payload
 */
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/**
 * Express middleware: require a valid JWT
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const token = header.slice(7);
  try {
    const payload = verifyToken(token);
    // Refresh user data from DB on each request
    const user = helpers.getUserById.get(payload.id);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Express middleware: require agent or manager role
 */
function requireAgent(req, res, next) {
  if (req.user.role !== 'agent' && req.user.role !== 'manager') {
    return res.status(403).json({ error: 'Agent access required' });
  }
  next();
}

/**
 * Express middleware: require manager role
 */
function requireManager(req, res, next) {
  if (req.user.role !== 'manager') {
    return res.status(403).json({ error: 'Manager access required' });
  }
  next();
}

module.exports = { signToken, verifyToken, requireAuth, requireAgent, requireManager };
