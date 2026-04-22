/**
 * Role-Based Access Control middleware.
 * Maps path prefixes to allowed roles – mirrors RbacMiddleware.cs.
 */

const OPEN_PATHS = ['/api/auth/login', '/api/auth/register'];

const ROLE_POLICY = {
  '/api/auth':        ['Admin', 'Coordinator', 'Responder', 'Medical', 'Finance'],
  '/api/emergencies': ['Admin', 'Coordinator', 'Responder'],
  '/api/resources':   ['Admin', 'Coordinator', 'Responder'],
  '/api/teams':       ['Admin', 'Coordinator', 'Responder'],
  '/api/hospitals':   ['Admin', 'Coordinator', 'Medical'],
  '/api/finance':     ['Admin', 'Finance'],
  '/api/approvals':   ['Admin', 'Coordinator', 'Finance'],
};

function rbacMiddleware(req, res, next) {
  // Skip open auth endpoints
  if (OPEN_PATHS.includes(req.path.toLowerCase())) {
    return next();
  }

  const role = req.user && req.user.role;
  if (!role) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  // Admin can access everything
  if (role === 'Admin') {
    return next();
  }

  // Check path-based policy
  for (const [prefix, allowedRoles] of Object.entries(ROLE_POLICY)) {
    if (req.originalUrl.toLowerCase().startsWith(prefix.toLowerCase())) {
      if (!allowedRoles.includes(role)) {
        return res.status(403).json({ error: `Role '${role}' cannot access ${prefix}.` });
      }
      break;
    }
  }

  next();
}

module.exports = { rbacMiddleware };
