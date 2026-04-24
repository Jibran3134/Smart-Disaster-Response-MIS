// Endpoints:
//   GET    /api/finance/transactions        → List all financial transactions
//   GET    /api/finance/transactions/:id    → Get one transaction
//   PUT    /api/finance/transactions/:id    → Update transaction status
//
//   GET    /api/finance/donors              → List all donors
//   POST   /api/finance/donors             → Create a donor
//
//   GET    /api/finance/budgets             → List all budgets
//   POST   /api/finance/budgets            → Create a budget
//   PUT    /api/finance/budgets/:id        → Update a budget
//
//   GET    /api/finance/summary             → Financial summary report
//
// Access: Administrator, Finance Officer

const express = require('express');
const { getPool, sql } = require('../config/db');

const router = express.Router();

//  GET /api/finance/transactions 
// List all financial transactions (optional filters: ?type=Donation&status=Completed&event_id=1)
router.get('/transactions', async (req, res) => {
  try {
    const pool = getPool();
    const { type, status, event_id } = req.query;

    let query = `
      SELECT ft.*,
             u.full_name AS user_name,
             d.donor_name,
             de.event_name
      FROM Financial_Transaction ft
      LEFT JOIN Users u ON ft.made_by_user = u.user_id
      LEFT JOIN Donor d ON ft.made_by_donor = d.donor_id
      LEFT JOIN Disaster_Event de ON ft.event_id = de.event_id
      WHERE 1=1
    `;
    const request = pool.request();

    if (type) {
      query += ' AND ft.transaction_type = @type';
      request.input('type', sql.VarChar(20), type);
    }
    if (status) {
      query += ' AND ft.status = @status';
      request.input('status', sql.VarChar(20), status);
    }
    if (event_id) {
      query += ' AND ft.event_id = @event_id';
      request.input('event_id', sql.Int, event_id);
    }

    query += ' ORDER BY ft.transaction_date DESC';

    const result = await request.query(query);
    return res.json(result.recordset);

  } catch (err) {
    console.error('Get transactions error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


//  GET /api/finance/transactions/:id 
// Get a single transaction with its audit log
router.get('/transactions/:id', async (req, res) => {
  try {
    const pool = getPool();

    // Get transaction
    const txResult = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`
        SELECT ft.*,
               u.full_name AS user_name,
               d.donor_name,
               de.event_name
        FROM Financial_Transaction ft
        LEFT JOIN Users u ON ft.made_by_user = u.user_id
        LEFT JOIN Donor d ON ft.made_by_donor = d.donor_id
        LEFT JOIN Disaster_Event de ON ft.event_id = de.event_id
        WHERE ft.transaction_id = @id
      `);

    if (txResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    // Get audit log entries for this transaction
    const logResult = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`
        SELECT ftl.*, u.full_name AS performed_by_name
        FROM Financial_Transaction_Log ftl
        JOIN Users u ON ftl.performed_by = u.user_id
        WHERE ftl.transaction_id = @id
        ORDER BY ftl.log_time DESC
      `);

    return res.json({
      ...txResult.recordset[0],
      audit_log: logResult.recordset
    });

  } catch (err) {
    console.error('Get transaction error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


//  PUT /api/finance/transactions/:id 
// Update transaction status (e.g. Pending → Completed)
// Body: { status }
router.put('/transactions/:id', async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'status is required.' });
    }

    const pool = getPool();
    const result = await pool.request()
      .input('id',     sql.Int,         req.params.id)
      .input('status', sql.VarChar(20), status)
      .query(`
        UPDATE Financial_Transaction
        SET status = @status
        WHERE transaction_id = @id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    return res.json({ message: 'Transaction status updated.' });

  } catch (err) {
    console.error('Update transaction error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

//  GET /api/finance/donors 
// List all donors
router.get('/donors', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request().query(`
      SELECT d.*,
             (SELECT COUNT(*) FROM Financial_Transaction ft WHERE ft.made_by_donor = d.donor_id) AS total_donations,
             (SELECT ISNULL(SUM(ft.amount), 0) FROM Financial_Transaction ft WHERE ft.made_by_donor = d.donor_id) AS total_amount
      FROM Donor d
      ORDER BY d.donor_name
    `);

    return res.json(result.recordset);

  } catch (err) {
    console.error('Get donors error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


//  POST /api/finance/donors 
// Create a new donor
// Body: { donor_name, donor_type, contact_info }
router.post('/donors', async (req, res) => {
  try {
    const { donor_name, donor_type, contact_info } = req.body;

    if (!donor_name) {
      return res.status(400).json({ error: 'donor_name is required.' });
    }

    const pool = getPool();
    const result = await pool.request()
      .input('donor_name',   sql.VarChar(100), donor_name)
      .input('donor_type',   sql.VarChar(50),  donor_type || null)
      .input('contact_info', sql.VarChar(100), contact_info || null)
      .query(`
        INSERT INTO Donor (donor_name, donor_type, contact_info)
        VALUES (@donor_name, @donor_type, @contact_info);

        SELECT CAST(SCOPE_IDENTITY() AS INT) AS donor_id;
      `);

    return res.status(201).json({
      message: 'Donor created.',
      donor_id: result.recordset[0].donor_id
    });

  } catch (err) {
    console.error('Create donor error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

//  GET /api/finance/budgets 
// List all budgets with event info
router.get('/budgets', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request().query(`
      SELECT b.*, de.event_name, de.disaster_type, de.status AS event_status
      FROM Budget b
      JOIN Disaster_Event de ON b.event_id = de.event_id
      ORDER BY de.start_date DESC
    `);

    return res.json(result.recordset);

  } catch (err) {
    console.error('Get budgets error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


//  POST /api/finance/budgets 
// Create a new budget for a disaster event
// Body: { event_id, total_allocated }
router.post('/budgets', async (req, res) => {
  try {
    const { event_id, total_allocated } = req.body;

    if (!event_id || !total_allocated) {
      return res.status(400).json({ error: 'event_id and total_allocated are required.' });
    }

    const pool = getPool();
    const result = await pool.request()
      .input('event_id',        sql.Int,            event_id)
      .input('total_allocated', sql.Decimal(12, 2), total_allocated)
      .query(`
        INSERT INTO Budget (event_id, total_allocated)
        VALUES (@event_id, @total_allocated);

        SELECT CAST(SCOPE_IDENTITY() AS INT) AS budget_id;
      `);

    return res.status(201).json({
      message: 'Budget created.',
      budget_id: result.recordset[0].budget_id
    });

  } catch (err) {
    console.error('Create budget error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


//  PUT /api/finance/budgets/:id 
// Update a budget
// Body: { total_allocated, total_spent }
router.put('/budgets/:id', async (req, res) => {
  try {
    const { total_allocated, total_spent } = req.body;
    const pool = getPool();

    const result = await pool.request()
      .input('id',              sql.Int,            req.params.id)
      .input('total_allocated', sql.Decimal(12, 2), total_allocated)
      .input('total_spent',     sql.Decimal(12, 2), total_spent)
      .query(`
        UPDATE Budget
        SET total_allocated = COALESCE(@total_allocated, total_allocated),
            total_spent     = COALESCE(@total_spent, total_spent)
        WHERE budget_id = @id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Budget not found.' });
    }

    return res.json({ message: 'Budget updated.' });

  } catch (err) {
    console.error('Update budget error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


//  GET /api/finance/summary 
// Returns aggregated financial summary
router.get('/summary', async (req, res) => {
  try {
    const pool = getPool();

    const result = await pool.request().query(`
      SELECT
        (SELECT ISNULL(SUM(amount), 0) FROM Financial_Transaction WHERE transaction_type = 'Donation'    AND status = 'Completed') AS total_donations,
        (SELECT ISNULL(SUM(amount), 0) FROM Financial_Transaction WHERE transaction_type = 'Expense'     AND status = 'Completed') AS total_expenses,
        (SELECT ISNULL(SUM(amount), 0) FROM Financial_Transaction WHERE transaction_type = 'Procurement' AND status = 'Completed') AS total_procurement,
        (SELECT COUNT(*)               FROM Financial_Transaction WHERE status = 'Pending')    AS pending_transactions,
        (SELECT COUNT(*)               FROM Financial_Transaction WHERE status = 'Completed')  AS completed_transactions
    `);

    return res.json(result.recordset[0]);

  } catch (err) {
    console.error('Get summary error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


module.exports = router;
