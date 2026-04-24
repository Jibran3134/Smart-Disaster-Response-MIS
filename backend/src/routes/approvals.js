// ============================================================
// approvals.js — Approval Request Workflow
// ============================================================
// Endpoints:
//   GET    /api/approvals/                  → List all approval requests
//   GET    /api/approvals/:id               → Get one approval request
//   POST   /api/approvals/                  → Create an approval request
//   PUT    /api/approvals/:id/approve       → Approve a request
//   PUT    /api/approvals/:id/reject        → Reject a request
//
// Access: Administrator, Emergency Operator, Finance Officer
// ============================================================

const express = require('express');
const { getPool, sql } = require('../config/db');
const { requireRoles } = require('../middleware/rbac');

const router = express.Router();


// ── GET /api/approvals/ ──
// List all approval requests (optional filters: ?status=Pending&request_type=Resource)
router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const { status, request_type } = req.query;

    let query = `
      SELECT ar.*,
             req.full_name AS requested_by_name,
             rev.full_name AS reviewed_by_name
      FROM Approval_Request ar
      JOIN Users req ON ar.requested_by = req.user_id
      LEFT JOIN Users rev ON ar.approved_by = rev.user_id
      WHERE 1=1
    `;
    const request = pool.request();

    if (status) {
      query += ' AND ar.status = @status';
      request.input('status', sql.VarChar(20), status);
    }
    if (request_type) {
      query += ' AND ar.request_type = @request_type';
      request.input('request_type', sql.VarChar(50), request_type);
    }

    query += ' ORDER BY ar.request_time DESC';

    const result = await request.query(query);
    return res.json(result.recordset);

  } catch (err) {
    console.error('Get approvals error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


// ── GET /api/approvals/:id ──
// Get a single approval request
router.get('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`
        SELECT ar.*,
               req.full_name AS requested_by_name,
               rev.full_name AS reviewed_by_name
        FROM Approval_Request ar
        JOIN Users req ON ar.requested_by = req.user_id
        LEFT JOIN Users rev ON ar.approved_by = rev.user_id
        WHERE ar.request_id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Approval request not found.' });
    }

    return res.json(result.recordset[0]);

  } catch (err) {
    console.error('Get approval error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


// ── POST /api/approvals/ ──
// Create a new approval request
// Body: { request_type, reference_id, remarks }
// request_type examples: "Resource Distribution", "Rescue Deployment", "Financial Approval"
router.post('/', async (req, res) => {
  try {
    const { request_type, reference_id, remarks } = req.body;

    if (!request_type) {
      return res.status(400).json({ error: 'request_type is required.' });
    }

    // Use logged-in user as the requester
    const requested_by = req.user.userId;

    const pool = getPool();
    const result = await pool.request()
      .input('requested_by',  sql.Int,              requested_by)
      .input('request_type',  sql.VarChar(50),      request_type)
      .input('reference_id',  sql.Int,              reference_id || null)
      .input('remarks',       sql.VarChar(sql.MAX), remarks || null)
      .query(`
        INSERT INTO Approval_Request (requested_by, request_type, reference_id, remarks)
        VALUES (@requested_by, @request_type, @reference_id, @remarks);

        SELECT CAST(SCOPE_IDENTITY() AS INT) AS request_id;
      `);

    return res.status(201).json({
      message: 'Approval request created.',
      request_id: result.recordset[0].request_id
    });

  } catch (err) {
    console.error('Create approval error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


// ── PUT /api/approvals/:id/approve ──
// Approve a pending request
// Body: { remarks } (optional)
router.put('/:id/approve',
  requireRoles('Administrator', 'Emergency Operator', 'Finance Officer'),
  async (req, res) => {
    try {
      const { remarks } = req.body;
      const approved_by = req.user.userId;

      const pool = getPool();

      // Check it's still Pending
      const check = await pool.request()
        .input('id', sql.Int, req.params.id)
        .query('SELECT status FROM Approval_Request WHERE request_id = @id');

      if (check.recordset.length === 0) {
        return res.status(404).json({ error: 'Approval request not found.' });
      }
      if (check.recordset[0].status !== 'Pending') {
        return res.status(400).json({ error: `Request is already ${check.recordset[0].status}.` });
      }

      // Update to Approved
      await pool.request()
        .input('id',          sql.Int,              req.params.id)
        .input('approved_by', sql.Int,              approved_by)
        .input('remarks',     sql.VarChar(sql.MAX), remarks || null)
        .query(`
          UPDATE Approval_Request
          SET status      = 'Approved',
              approved_by = @approved_by,
              remarks     = COALESCE(@remarks, remarks)
          WHERE request_id = @id
        `);

      return res.json({ message: 'Request approved.' });

    } catch (err) {
      console.error('Approve error:', err.message);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);


// ── PUT /api/approvals/:id/reject ──
// Reject a pending request
// Body: { remarks } (optional — reason for rejection)
router.put('/:id/reject',
  requireRoles('Administrator', 'Emergency Operator', 'Finance Officer'),
  async (req, res) => {
    try {
      const { remarks } = req.body;
      const approved_by = req.user.userId;

      const pool = getPool();

      // Check it's still Pending
      const check = await pool.request()
        .input('id', sql.Int, req.params.id)
        .query('SELECT status FROM Approval_Request WHERE request_id = @id');

      if (check.recordset.length === 0) {
        return res.status(404).json({ error: 'Approval request not found.' });
      }
      if (check.recordset[0].status !== 'Pending') {
        return res.status(400).json({ error: `Request is already ${check.recordset[0].status}.` });
      }

      // Update to Rejected
      await pool.request()
        .input('id',          sql.Int,              req.params.id)
        .input('approved_by', sql.Int,              approved_by)
        .input('remarks',     sql.VarChar(sql.MAX), remarks || null)
        .query(`
          UPDATE Approval_Request
          SET status      = 'Rejected',
              approved_by = @approved_by,
              remarks     = COALESCE(@remarks, remarks)
          WHERE request_id = @id
        `);

      return res.json({ message: 'Request rejected.' });

    } catch (err) {
      console.error('Reject error:', err.message);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);


module.exports = router;
