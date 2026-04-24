// Approval-Based Workflow
// Critical actions must go through: Request (Pending) → Approve/Reject → Execute
//
// Request endpoints (create Pending approval):
//   POST /api/approvals/request-allocation   → Resource distribution request
//   POST /api/approvals/request-deployment   → Rescue team deployment request
//   POST /api/approvals/request-financial    → Financial approval request
//
// Management endpoints:
//   GET    /api/approvals/                   → List all approval requests
//   GET    /api/approvals/history            → Approval history (approved/rejected only)
//   GET    /api/approvals/:id               → Get one approval request
//   PUT    /api/approvals/:id/approve       → Approve + EXECUTE the action
//   PUT    /api/approvals/:id/reject        → Reject the request
//
// Access: Administrator, Emergency Operator, Finance Officer

const express = require('express');
const { getPool, sql } = require('../config/db');
const { requireRoles } = require('../middleware/rbac');

const router = express.Router();


// GET /api/approvals/
// List all approval requests (optional filters: ?status=Pending&request_type=Resource Distribution)
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


// GET /api/approvals/history
// Returns only approved/rejected requests (approval history trail)
router.get('/history', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .query(`
        SELECT ar.*,
               req.full_name AS requested_by_name,
               rev.full_name AS reviewed_by_name
        FROM Approval_Request ar
        JOIN Users req ON ar.requested_by = req.user_id
        LEFT JOIN Users rev ON ar.approved_by = rev.user_id
        WHERE ar.status IN ('Approved', 'Rejected')
        ORDER BY ar.request_time DESC
      `);

    return res.json(result.recordset);

  } catch (err) {
    console.error('Get approval history error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


// GET /api/approvals/:id
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

    // Parse the payload from remarks so the caller can see the original request data
    const row = result.recordset[0];
    try { row.payload = JSON.parse(row.remarks); } catch (_) { /* remarks is plain text */ }

    return res.json(row);

  } catch (err) {
    console.error('Get approval error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


// POST /api/approvals/request-allocation
// Request resource distribution (stored as Pending, not executed yet)
// Body: { report_id, warehouse_id, resource_id, quantity }
router.post('/request-allocation', async (req, res) => {
  try {
    const { report_id, warehouse_id, resource_id, quantity } = req.body;

    if (!report_id || !warehouse_id || !resource_id || !quantity) {
      return res.status(400).json({
        error: 'report_id, warehouse_id, resource_id, and quantity are required.'
      });
    }

    const requested_by = req.user.userId;

    const payload = JSON.stringify({
      report_id, allocated_by: requested_by, warehouse_id, resource_id, quantity
    });

    const pool = getPool();
    const result = await pool.request()
      .input('requested_by', sql.Int, requested_by)
      .input('request_type', sql.VarChar(50), 'Resource Distribution')
      .input('remarks', sql.VarChar(sql.MAX), payload)
      .query(`
        INSERT INTO Approval_Request (requested_by, request_type, remarks)
        VALUES (@requested_by, @request_type, @remarks);

        SELECT CAST(SCOPE_IDENTITY() AS INT) AS request_id;
      `);

    return res.status(201).json({
      message: 'Resource distribution request submitted for approval.',
      request_id: result.recordset[0].request_id,
      status: 'Pending'
    });

  } catch (err) {
    console.error('Request allocation error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


// POST /api/approvals/request-deployment
// Request rescue team deployment (stored as Pending, not executed yet)
// Body: { team_id, report_id }
router.post('/request-deployment', async (req, res) => {
  try {
    const { team_id, report_id } = req.body;

    if (!team_id || !report_id) {
      return res.status(400).json({ error: 'team_id and report_id are required.' });
    }

    const requested_by = req.user.userId;

    const payload = JSON.stringify({ team_id, report_id });

    const pool = getPool();
    const result = await pool.request()
      .input('requested_by', sql.Int, requested_by)
      .input('request_type', sql.VarChar(50), 'Rescue Deployment')
      .input('remarks', sql.VarChar(sql.MAX), payload)
      .query(`
        INSERT INTO Approval_Request (requested_by, request_type, remarks)
        VALUES (@requested_by, @request_type, @remarks);

        SELECT CAST(SCOPE_IDENTITY() AS INT) AS request_id;
      `);

    return res.status(201).json({
      message: 'Rescue deployment request submitted for approval.',
      request_id: result.recordset[0].request_id,
      status: 'Pending'
    });

  } catch (err) {
    console.error('Request deployment error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


// POST /api/approvals/request-financial
// Request financial approval (stored as Pending, not executed yet)
// Body: { made_by_user OR made_by_donor, event_id, amount, transaction_type }
router.post('/request-financial', async (req, res) => {
  try {
    const { made_by_user, made_by_donor, event_id, amount, transaction_type } = req.body;

    if (!amount || !transaction_type) {
      return res.status(400).json({ error: 'amount and transaction_type are required.' });
    }
    if ((!made_by_user && !made_by_donor) || (made_by_user && made_by_donor)) {
      return res.status(400).json({ error: 'Provide either made_by_user OR made_by_donor (not both).' });
    }

    const requested_by = req.user.userId;

    const payload = JSON.stringify({
      made_by_user: made_by_user || null,
      made_by_donor: made_by_donor || null,
      event_id: event_id || null,
      amount,
      transaction_type,
      performed_by: requested_by
    });

    const pool = getPool();
    const result = await pool.request()
      .input('requested_by', sql.Int, requested_by)
      .input('request_type', sql.VarChar(50), 'Financial Approval')
      .input('remarks', sql.VarChar(sql.MAX), payload)
      .query(`
        INSERT INTO Approval_Request (requested_by, request_type, remarks)
        VALUES (@requested_by, @request_type, @remarks);

        SELECT CAST(SCOPE_IDENTITY() AS INT) AS request_id;
      `);

    return res.status(201).json({
      message: 'Financial approval request submitted.',
      request_id: result.recordset[0].request_id,
      status: 'Pending'
    });

  } catch (err) {
    console.error('Request financial error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


// POST /api/approvals/  (generic — for any other approval type)
// Body: { request_type, reference_id, remarks }
router.post('/', async (req, res) => {
  try {
    const { request_type, reference_id, remarks } = req.body;

    if (!request_type) {
      return res.status(400).json({ error: 'request_type is required.' });
    }

    const requested_by = req.user.userId;

    const pool = getPool();
    const result = await pool.request()
      .input('requested_by', sql.Int, requested_by)
      .input('request_type', sql.VarChar(50), request_type)
      .input('reference_id', sql.Int, reference_id || null)
      .input('remarks', sql.VarChar(sql.MAX), remarks || null)
      .query(`
        INSERT INTO Approval_Request (requested_by, request_type, reference_id, remarks)
        VALUES (@requested_by, @request_type, @reference_id, @remarks);

        SELECT CAST(SCOPE_IDENTITY() AS INT) AS request_id;
      `);//SCOPE_IDENTITY() is the newly auto generated id 

    return res.status(201).json({
      message: 'Approval request created.',
      request_id: result.recordset[0].request_id,
      status: 'Pending'
    });

  } catch (err) {
    console.error('Create approval error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/approvals/:id/approve
router.put('/:id/approve',
  requireRoles('Administrator', 'Emergency Operator', 'Finance Officer'),
  async (req, res) => {
    const pool = getPool();
    const transaction = new sql.Transaction(pool);

    try {
      await transaction.begin();

      const check = await new sql.Request(transaction)
        .input('id', sql.Int, req.params.id)
        .query(`
          SELECT request_id, request_type, remarks, status
          FROM Approval_Request
          WHERE request_id = @id
        `);

      if (check.recordset.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Approval request not found.' });
      }

      const request = check.recordset[0];

      if (request.status !== 'Pending') {
        await transaction.rollback();
        return res.status(400).json({ error: `Request is already ${request.status}.` });
      }

      let payload = {};
      try { payload = JSON.parse(request.remarks); } catch (_) { /* no payload */ }

      const approved_by = req.user.userId;
      const approverRemarks = req.body.remarks || null;

      await new sql.Request(transaction)
        .input('id', sql.Int, req.params.id)
        .input('approved_by', sql.Int, approved_by)
        .input('remarks', sql.VarChar(sql.MAX),
          approverRemarks
            ? JSON.stringify({ ...payload, approver_remarks: approverRemarks })
            : request.remarks
        )
        .query(`
          UPDATE Approval_Request
          SET status = 'Approved',
              approved_by = @approved_by,
              remarks = @remarks
          WHERE request_id = @id
        `);

      let executionResult = {};

      if (request.request_type === 'Resource Distribution') {
        const { report_id, allocated_by, warehouse_id, resource_id, quantity } = payload;

        const stockCheck = await new sql.Request(transaction)
          .input('warehouse_id', sql.Int, warehouse_id)
          .input('resource_id', sql.Int, resource_id)
          .query(`
            SELECT quantity_available
            FROM Inventory
            WHERE warehouse_id = @warehouse_id AND resource_id = @resource_id
          `);

        const currentStock = stockCheck.recordset[0]?.quantity_available || 0;
        if (currentStock < quantity) {
          throw new Error(`Not enough stock. Available: ${currentStock}, Requested: ${quantity}`);
        }

        // Create allocation
        const allocResult = await new sql.Request(transaction)
          .input('report_id', sql.Int, report_id)
          .input('allocated_by', sql.Int, allocated_by)
          .input('warehouse_id', sql.Int, warehouse_id)
          .query(`
            INSERT INTO Allocation (report_id, allocated_by, warehouse_id, status)
            VALUES (@report_id, @allocated_by, @warehouse_id, 'Dispatched');
            SELECT CAST(SCOPE_IDENTITY() AS INT) AS allocation_id;
          `);

        const allocation_id = allocResult.recordset[0].allocation_id;

        // Create detail row
        await new sql.Request(transaction)
          .input('allocation_id', sql.Int, allocation_id)
          .input('resource_id', sql.Int, resource_id)
          .input('quantity', sql.Int, quantity)
          .query(`
            INSERT INTO Resource_Allocation (allocation_id, resource_id, requested_qty, approved_qty)
            VALUES (@allocation_id, @resource_id, @quantity, @quantity);
          `);

        // Update inventory
        await new sql.Request(transaction)
          .input('warehouse_id', sql.Int, warehouse_id)
          .input('resource_id', sql.Int, resource_id)
          .input('quantity', sql.Int, quantity)
          .query(`
            UPDATE Inventory
            SET quantity_available = quantity_available - @quantity
            WHERE warehouse_id = @warehouse_id AND resource_id = @resource_id;
          `);

        executionResult = { allocation_id, quantity_deducted: quantity };

      } else if (request.request_type === 'Rescue Deployment') {
        // Execute team assignment transaction
        const { team_id, report_id } = payload;

        // Check team availability
        const teamCheck = await new sql.Request(transaction)
          .input('team_id', sql.Int, team_id)
          .query('SELECT availability_status FROM Rescue_Team WHERE team_id = @team_id');

        const teamStatus = teamCheck.recordset[0]?.availability_status;
        if (!teamStatus) throw new Error(`Team ${team_id} not found.`);
        if (teamStatus !== 'Available') throw new Error(`Team not available. Status: ${teamStatus}`);

        // Insert assignment
        await new sql.Request(transaction)
          .input('team_id', sql.Int, team_id)
          .input('report_id', sql.Int, report_id)
          .query(`
            INSERT INTO Team_Assignment (team_id, report_id, assigned_at)
            VALUES (@team_id, @report_id, GETDATE());
          `);

        // Update team status
        await new sql.Request(transaction)
          .input('team_id', sql.Int, team_id)
          .query("UPDATE Rescue_Team SET availability_status = 'Assigned' WHERE team_id = @team_id");

        // Update report status
        await new sql.Request(transaction)
          .input('report_id', sql.Int, report_id)
          .query("UPDATE Emergency_Report SET status = 'In Progress' WHERE report_id = @report_id");

        executionResult = { team_id, report_id, team_status: 'Assigned' };

      } else if (request.request_type === 'Financial Approval') {
        // Execute financial transaction
        const { made_by_user, made_by_donor, event_id, amount, transaction_type, performed_by } = payload;

        const ftResult = await new sql.Request(transaction)
          .input('made_by_user', sql.Int, made_by_user || null)
          .input('made_by_donor', sql.Int, made_by_donor || null)
          .input('event_id', sql.Int, event_id || null)
          .input('amount', sql.Decimal(12, 2), amount)
          .input('transaction_type', sql.VarChar(20), transaction_type)
          .query(`
            INSERT INTO Financial_Transaction
              (made_by_user, made_by_donor, event_id, amount, transaction_type, status)
            VALUES
              (@made_by_user, @made_by_donor, @event_id, @amount, @transaction_type, 'Completed');
            SELECT CAST(SCOPE_IDENTITY() AS INT) AS transaction_id;
          `);

        const transaction_id = ftResult.recordset[0].transaction_id;

        // Audit log
        await new sql.Request(transaction)
          .input('user_id', sql.Int, performed_by || approved_by)
          .input('record_id', sql.Int, transaction_id)
          .input('action_type', sql.VarChar(50), 'INSERT')
          .input('table_name', sql.VarChar(50), 'Financial_Transaction')
          .input('new_value', sql.VarChar(sql.MAX),
            `${transaction_type} of ${amount} | txn_id=${transaction_id} | approved_by=${approved_by}`)
          .query(`
            INSERT INTO Audit_Log
              (user_id, record_id, action_type, table_name, old_value, new_value)
            VALUES
              (@user_id, @record_id, @action_type, @table_name, NULL, @new_value);
          `);

        // Update budget if expense
        if (transaction_type === 'Expense' && event_id) {
          await new sql.Request(transaction)
            .input('event_id', sql.Int, event_id)
            .input('amount', sql.Decimal(12, 2), amount)
            .query('UPDATE Budget SET total_spent = total_spent + @amount WHERE event_id = @event_id');
        }

        executionResult = { transaction_id, transaction_type, amount };
      }
      // For generic/unknown request types, just approve without execution

      await transaction.commit();

      return res.json({
        message: `Request approved and executed successfully.`,
        request_id: parseInt(req.params.id),
        request_type: request.request_type,
        approved_by: approved_by,
        execution: executionResult
      });

    } catch (err) {
      try { await transaction.rollback(); } catch (_) { /* already rolled back */ }
      console.error('Approve+Execute error:', err.message);
      return res.status(500).json({
        error: 'Approval failed. All changes rolled back.',
        details: err.message
      });
    }
  }
);

// PUT /api/approvals/:id/reject
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
        .query('SELECT status, remarks FROM Approval_Request WHERE request_id = @id');

      if (check.recordset.length === 0) {
        return res.status(404).json({ error: 'Approval request not found.' });
      }
      if (check.recordset[0].status !== 'Pending') {
        return res.status(400).json({ error: `Request is already ${check.recordset[0].status}.` });
      }

      // Keep original payload and append rejection reason
      let updatedRemarks = check.recordset[0].remarks;
      if (remarks) {
        try {
          const existing = JSON.parse(updatedRemarks);
          existing.rejection_reason = remarks;
          updatedRemarks = JSON.stringify(existing);
        } catch (_) {
          updatedRemarks = remarks;
        }
      }

      await pool.request()
        .input('id', sql.Int, req.params.id)
        .input('approved_by', sql.Int, approved_by)
        .input('remarks', sql.VarChar(sql.MAX), updatedRemarks)
        .query(`
          UPDATE Approval_Request
          SET status = 'Rejected',
              approved_by = @approved_by,
              remarks = @remarks
          WHERE request_id = @id
        `);

      return res.json({
        message: 'Request rejected.',
        request_id: parseInt(req.params.id),
        rejected_by: approved_by
      });

    } catch (err) {
      console.error('Reject error:', err.message);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
);


module.exports = router;
