// ============================================================
// rbac.js — Role-Based Access Control Middleware
// ============================================================
// This middleware checks if the logged-in user's ROLE is
// allowed to access the current route.
//
// Roles (from the Role table in our database):
//   1. Administrator       → full access to everything
//   2. Emergency Operator   → emergencies, teams, approvals
//   3. Field Officer        → emergencies, teams, resources
//   4. Warehouse Manager    → resources, inventory, warehouses
//   5. Finance Officer      → finance, approvals
//
// How it works:
//   - We define which roles can access which route prefixes
//   - Administrator bypasses ALL checks (can access everything)
//   - If your role is not in the allowed list → 403 Forbidden
// ============================================================

// These paths don't need any role check (public endpoints)
const OPEN_PATHS = ['/api/auth/login', '/api/auth/register'];

// ── Route → Allowed Roles mapping ──
// Each key is a route prefix, and the value is an array of roles allowed
const ROLE_POLICY = {
  // Auth routes — all roles can access (view profile, etc.)
  '/api/auth':         ['Administrator', 'Emergency Operator', 'Field Officer', 'Warehouse Manager', 'Finance Officer'],

  // Emergency reports — operators and field officers handle emergencies
  '/api/emergencies':  ['Administrator', 'Emergency Operator', 'Field Officer'],

  // Rescue teams — operators coordinate, field officers are on ground
  '/api/teams':        ['Administrator', 'Emergency Operator', 'Field Officer'],

  // Resources & inventory — field officers request, warehouse managers manage
  '/api/resources':    ['Administrator', 'Field Officer', 'Warehouse Manager'],

  // Warehouses — only warehouse managers and admins
  '/api/warehouses':   ['Administrator', 'Warehouse Manager'],

  // Hospitals — operators coordinate with hospitals
  '/api/hospitals':    ['Administrator', 'Emergency Operator'],

  // Finance — only finance officers and admins
  '/api/finance':      ['Administrator', 'Finance Officer'],

  // Approvals — admins, operators (emergency approvals), finance (budget approvals)
  '/api/approvals':    ['Administrator', 'Emergency Operator', 'Finance Officer'],

  // Transactions — all roles can view, but mostly finance and warehouse
  '/api/transactions': ['Administrator', 'Emergency Operator', 'Field Officer', 'Warehouse Manager', 'Finance Officer'],

  // Audit logs — admin only
  '/api/audit':        ['Administrator'],

  // Reports/dashboard — all roles can view their own dashboards
  '/api/reports':      ['Administrator', 'Emergency Operator', 'Field Officer', 'Warehouse Manager', 'Finance Officer'],
};

/**
 * RBAC middleware — checks if the user's role can access this route
 */
function rbacMiddleware(req, res, next) {
  // Step 1: Skip open paths (login, register)
  // Note: We use req.originalUrl because the middleware is mounted at '/api'
  // which strips '/api' from req.path. originalUrl keeps the full path.
  if (OPEN_PATHS.includes(req.originalUrl.split('?')[0].toLowerCase())) {
    return next();
  }

  // Step 2: Get the user's role (set by auth middleware)
  const role = req.user && req.user.role;

  // If no role found (shouldn't happen if auth middleware ran first)
  if (!role) {
    return res.status(403).json({ error: 'Access denied. No role found.' });
  }

  // Step 3: Administrator can access EVERYTHING — skip all checks
  if (role === 'Administrator') {
    return next();
  }

  // Step 4: Check if the route matches any policy
  for (const [prefix, allowedRoles] of Object.entries(ROLE_POLICY)) {
    if (req.originalUrl.toLowerCase().startsWith(prefix.toLowerCase())) {
      // Found a matching policy — check if role is allowed
      if (!allowedRoles.includes(role)) {
        return res.status(403).json({
          error: `Role '${role}' is not allowed to access ${prefix}.`
        });
      }
      // Role IS allowed — continue
      return next();
    }
  }

  // Step 5: No policy matched this route — allow by default
  // (You could change this to deny by default for stricter security)
  next();
}

// ── Helper function for route-level role checks ──
// Use this when you need to restrict a SPECIFIC route to certain roles
// Example: router.post('/approve', requireRoles('Administrator', 'Finance Officer'), handler)
function requireRoles(...roles) {
  return (req, res, next) => {
    const userRole = req.user && req.user.role;

    if (!userRole) {
      return res.status(403).json({ error: 'Access denied. No role found.' });
    }

    // Check if user's role is in the allowed list
    if (roles.includes(userRole)) {
      return next(); // Allowed
    }

    return res.status(403).json({
      error: `This action requires one of: ${roles.join(', ')}. Your role: ${userRole}`
    });
  };
}

module.exports = { rbacMiddleware, requireRoles };
