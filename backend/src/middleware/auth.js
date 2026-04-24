//  enforce secure access to all API routes
// Verifies the jwt token
// Runs BEFORE every api route


const jwt = require('jsonwebtoken');
const OPEN_PATHS = ['/api/auth/login', '/api/auth/register'];

// [PROJECT] Middleware pattern: (req, res, next) — req is the incoming request,
// res is the response we send back, next() passes control to the next middleware
function authMiddleware(req, res, next) {
  // Skip open paths
  if (OPEN_PATHS.includes(req.originalUrl.split('?')[0].toLowerCase())) {
    return next();
  }

  // Get the token from the Authorization header
  // Expected format: "Bearer eyJhbGciOiJ..."
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)   // Remove "Bearer " prefix to get just the token
    : null;

  // [PROJECT] Graceful error handling — returns clear HTTP status codes instead of crashing
  if (!token) {
    return res.status(401).json({ error: 'Missing authentication token.' });
  }

  // Verify the token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer:   process.env.JWT_ISSUER,
      audience: process.env.JWT_AUDIENCE,
    });

    req.user = {
      userId:   decoded.userId,
      email:    decoded.email,
      role:     decoded.role,       
      fullName: decoded.fullName,
    };

    // Token is valid
    next();
  } catch (err) {
    // Token is expired
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

module.exports = { authMiddleware };
