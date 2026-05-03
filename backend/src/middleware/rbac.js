// These paths don't need any role check (public endpoints)
const OPEN_PATHS = ['/api/auth/login', '/api/auth/register'];

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

  // Finance — finance officers, admins, and warehouse managers (for procurement)
  '/api/finance':      ['Administrator', 'Finance Officer', 'Warehouse Manager'],

  // Approvals — admins, operators, finance (can approve), and warehouse managers, field officers (can request)
  '/api/approvals':    ['Administrator', 'Emergency Operator', 'Finance Officer', 'Warehouse Manager', 'Field Officer'],

  // Transactions — all roles can view, but mostly finance and warehouse
  '/api/transactions': ['Administrator', 'Emergency Operator', 'Field Officer', 'Warehouse Manager', 'Finance Officer'],

  // Audit logs — admin only
  '/api/audit':        ['Administrator'],

  // Reports/dashboard — all roles can view their own dashboards
  '/api/reports':      ['Administrator', 'Emergency Operator', 'Field Officer', 'Warehouse Manager', 'Finance Officer'],
};

// checks if the user's role can access this route

function rbacMiddleware(req, res, next) {
  if (OPEN_PATHS.includes(req.originalUrl.split('?')[0].toLowerCase())) {
    return next();
  }

  const role = req.user && req.user.role;

  if (!role) {
    return res.status(403).json({ error: 'Access denied. No role found.' });
  }

  // Administrator can access EVERYTHING 
  if (role === 'Administrator') {
    return next();
  }

  // Dashboard analytics should be shown for every user
  if (req.method === 'GET') {
    const path = req.originalUrl.split('?')[0].toLowerCase();
    const dashboardPaths = [
      '/api/emergencies/reports',
      '/api/emergencies/events',
      '/api/teams',
      '/api/finance/summary',
      '/api/approvals',
      '/api/resources/inventory'
    ];
    if (dashboardPaths.includes(path)) {
      return next();
    }
  }

  for (const [prefix, allowedRoles] of Object.entries(ROLE_POLICY)) {
    if (req.originalUrl.toLowerCase().startsWith(prefix.toLowerCase())) {
      if (!allowedRoles.includes(role)) {
        return res.status(403).json({
          error: `Role '${role}' is not allowed to access ${prefix}.`
        });
      }
      return next();
    }
  }
  next();
}

function requireRoles(...roles) {
  return (req, res, next) => {
    const userRole = req.user && req.user.role;

    if (!userRole) {
      return res.status(403).json({ error: 'Access denied. No role found.' });
    }

    // Check if user's role is in the allowed list
    if (roles.includes(userRole)) {
      return next(); 
    }

    return res.status(403).json({
      error: `This action requires one of: ${roles.join(', ')}. Your role: ${userRole}`
    });
  };
}

module.exports = { rbacMiddleware, requireRoles };
