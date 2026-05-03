const express = require('express');
const { sql, getPool } = require('../config/db');
const { requireRoles } = require('../middleware/rbac');

const router = express.Router();

// GET /api/audit
// Fetch audit logs
router.get('/', requireRoles('Administrator'), async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request().query(`
      SELECT 
        a.log_id,
        a.user_id,
        u.full_name as user_name,
        r.role_name,
        a.record_id,
        a.action_type,
        a.table_name,
        a.old_value,
        a.new_value,
        a.log_time
      FROM Audit_Log a
      LEFT JOIN [Users] u ON a.user_id = u.user_id
      LEFT JOIN Role r ON u.role_id = r.role_id
      ORDER BY a.log_time DESC
    `);
    return res.json(result.recordset);
  } catch (err) {
    console.error('Fetch audit log error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
