const jwt = require('jsonwebtoken');

const OPEN_PATHS = ['/api/auth/login', '/api/auth/register'];

/**
 * JWT authentication middleware.
 * Skips open paths (login / register).
 * On success, attaches `req.user = { userId, email, role, fullName }`.
 */
function authMiddleware(req, res, next) {
  // Allow open endpoints through
  if (OPEN_PATHS.includes(req.path.toLowerCase())) {
    return next();
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing authentication token.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer:   process.env.JWT_ISSUER,
      audience: process.env.JWT_AUDIENCE,
    });

    // Attach user info to request
    req.user = {
      userId:   decoded.userId,
      email:    decoded.email,
      role:     decoded.role,
      fullName: decoded.fullName,
    };

    next();
  } catch (_err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

module.exports = { authMiddleware };
