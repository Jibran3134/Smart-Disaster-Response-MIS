// ACID Transactions — these endpoints call SQL Server stored procedures
// that handle BEGIN TRAN / COMMIT / ROLLBACK internally.
// Express no longer manages transactions; the DB enforces atomicity.

const express = require('express');
const { getPool, sql } = require('../config/db');

const router = express.Router();

//   Calls: sp_AllocateResource
//   Steps inside SQL:  Check stock → Create Allocation → Detail row → Deduct inventory
router.post('/allocate-resource', async (req, res) => {
  const { report_id, allocated_by, warehouse_id, resource_id, quantity } = req.body;

  if (!report_id || !allocated_by || !warehouse_id || !resource_id || !quantity) {
    return res.status(400).json({ error: 'All fields are required: report_id, allocated_by, warehouse_id, resource_id, quantity' });
  }

  try {
    const pool = getPool();
    const result = await pool.request()
      .input('report_id',    sql.Int, report_id)
      .input('allocated_by', sql.Int, allocated_by)
      .input('warehouse_id', sql.Int, warehouse_id)
      .input('resource_id',  sql.Int, resource_id)
      .input('quantity',     sql.Int, quantity)
      .output('allocation_id',  sql.Int)
      .output('remaining_stock', sql.Int)
      .output('error_message',  sql.VarChar(500))
      .execute('sp_AllocateResource');

    const { allocation_id, remaining_stock, error_message } = result.output;

    if (error_message) {
      return res.status(500).json({
        error: 'Transaction failed. All changes rolled back.',
        details: error_message
      });
    }

    return res.json({
      message: 'Resource allocated and inventory updated successfully!',
      allocation_id,
      quantity_deducted: quantity,
      remaining_stock
    });

  } catch (err) {
    console.error('Transaction 1 FAILED (allocate-resource):', err.message);
    return res.status(500).json({
      error: 'Transaction failed. All changes rolled back.',
      details: err.message
    });
  }
});


//   Calls: sp_AssignTeam
//   Steps inside SQL:  Check availability → Insert assignment → Team=Assigned → Report=In Progress
router.post('/assign-team', async (req, res) => {
  const { team_id, report_id } = req.body;

  if (!team_id || !report_id) {
    return res.status(400).json({ error: 'Both team_id and report_id are required.' });
  }

  try {
    const pool = getPool();
    const result = await pool.request()
      .input('team_id',   sql.Int, team_id)
      .input('report_id', sql.Int, report_id)
      .output('error_message', sql.VarChar(500))
      .execute('sp_AssignTeam');

    const { error_message } = result.output;

    if (error_message) {
      return res.status(500).json({
        error: 'Transaction failed. All changes rolled back.',
        details: error_message
      });
    }

    return res.json({
      message: 'Team assigned and statuses updated successfully!',
      team_id,
      report_id,
      team_status: 'Assigned',
      report_status: 'In Progress'
    });

  } catch (err) {
    console.error('Transaction 2 FAILED (assign-team):', err.message);
    return res.status(500).json({
      error: 'Transaction failed. All changes rolled back.',
      details: err.message
    });
  }
});


//   Calls: sp_FinancialEntry
//   Steps inside SQL:  Insert transaction → Audit log → Update budget (if Expense)
router.post('/financial-entry', async (req, res) => {
  const { made_by_user, made_by_donor, event_id, amount, transaction_type, performed_by } = req.body;

  if (!amount || !transaction_type) {
    return res.status(400).json({ error: 'amount and transaction_type are required.' });
  }
  if ((!made_by_user && !made_by_donor) || (made_by_user && made_by_donor)) {
    return res.status(400).json({ error: 'Provide either made_by_user OR made_by_donor (not both).' });
  }
  if (!performed_by) {
    return res.status(400).json({ error: 'performed_by (user_id) is required for audit logging.' });
  }

  try {
    const pool = getPool();
    const result = await pool.request()
      .input('made_by_user',    sql.Int,            made_by_user || null)
      .input('made_by_donor',   sql.Int,            made_by_donor || null)
      .input('event_id',        sql.Int,            event_id || null)
      .input('amount',          sql.Decimal(12, 2), amount)
      .input('transaction_type', sql.VarChar(20),   transaction_type)
      .input('performed_by',    sql.Int,            performed_by)
      .output('transaction_id', sql.Int)
      .output('error_message',  sql.VarChar(500))
      .execute('sp_FinancialEntry');

    const { transaction_id, error_message } = result.output;

    if (error_message) {
      return res.status(500).json({
        error: 'Transaction failed. All changes rolled back.',
        details: error_message
      });
    }

    return res.json({
      message: 'Financial transaction recorded and audit log created successfully!',
      transaction_id,
      transaction_type,
      amount,
      audit_logged: true
    });

  } catch (err) {
    console.error('Transaction 3 FAILED (financial-entry):', err.message);
    return res.status(500).json({
      error: 'Transaction failed. All changes rolled back.',
      details: err.message
    });
  }
});


module.exports = router;
