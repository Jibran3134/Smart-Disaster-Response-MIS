// ============================================================
// auth.js — JWT Authentication Middleware
// ============================================================
// This middleware checks if the user has a valid JWT token.
// It runs BEFORE every /api/* route.
//
// How it works:
//   1. Some paths are "open" (login, register) — no token needed
//   2. For all other paths, we look for "Bearer <token>" in headers
//   3. If valid, we attach user info to req.user
//   4. If invalid or missing, we return 401 Unauthorized
// ============================================================

const jwt = require('jsonwebtoken');

// These paths don't require a token (anyone can access them)
const OPEN_PATHS = ['/api/auth/login', '/api/auth/register'];

/**
 * Authentication middleware — checks JWT token
 */
function authMiddleware(req, res, next) {
  // Step 1: Skip open paths (login and register don't need a token)
  // Note: We use req.originalUrl because the middleware is mounted at '/api'
  // which strips '/api' from req.path. originalUrl keeps the full path.
  if (OPEN_PATHS.includes(req.originalUrl.split('?')[0].toLowerCase())) {
    return next();
  }

  // Step 2: Get the token from the Authorization header
  // Expected format: "Bearer eyJhbGciOiJ..."
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)   // Remove "Bearer " prefix to get just the token
    : null;

  // Step 3: If no token found, deny access
  if (!token) {
    return res.status(401).json({ error: 'Missing authentication token.' });
  }

  // Step 4: Verify the token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer:   process.env.JWT_ISSUER,
      audience: process.env.JWT_AUDIENCE,
    });

    // Step 5: Attach user info to the request so other code can use it
    req.user = {
      userId:   decoded.userId,
      email:    decoded.email,
      role:     decoded.role,       // e.g. "Administrator", "Field Officer"
      fullName: decoded.fullName,
    };

    // Token is valid — continue to the next middleware/route
    next();
  } catch (err) {
    // Token is expired or tampered with
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

module.exports = { authMiddleware };
