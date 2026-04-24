// [PROJECT] ACID Transactions  these endpoints modify MULTIPLE tables in a single
// atomic operation. If ANY step fails, ALL changes are rolled back

const express = require('express');
const { getPool, sql } = require('../config/db');

const router = express.Router();

//   Step 1: Check if enough stock exists in the warehouse
//   Step 2: Create a new allocation record
//   Step 3: Create resource_allocation detail row
//   Step 4: Subtract quantity from inventory
//   If anything fails → ROLLBACK everything
router.post('/allocate-resource', async (req, res) => {
  // Get input from the request body
  const { report_id, allocated_by, warehouse_id, resource_id, quantity } = req.body;

  if (!report_id || !allocated_by || !warehouse_id || !resource_id || !quantity) {
    return res.status(400).json({ error: 'All fields are required: report_id, allocated_by, warehouse_id, resource_id, quantity' });
  }

  const pool = getPool();

  const transaction = new sql.Transaction(pool);

  try {
    // BEGIN TRANSACTION 
    //  Nothing is saved to DB until we call commit()
    await transaction.begin();

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

    const allocationResult = await new sql.Request(transaction)
      .input('report_id', sql.Int, report_id)
      .input('allocated_by', sql.Int, allocated_by)
      .input('warehouse_id', sql.Int, warehouse_id)
      .query(`
        INSERT INTO Allocation (report_id, allocated_by, warehouse_id, status)
        VALUES (@report_id, @allocated_by, @warehouse_id, 'Dispatched');

        SELECT CAST(SCOPE_IDENTITY() AS INT) AS allocation_id;
      `);

    const allocation_id = allocationResult.recordset[0].allocation_id;

    await new sql.Request(transaction)
      .input('allocation_id', sql.Int, allocation_id)
      .input('resource_id', sql.Int, resource_id)
      .input('quantity', sql.Int, quantity)
      .query(`
        INSERT INTO Resource_Allocation (allocation_id, resource_id, requested_qty, approved_qty)
        VALUES (@allocation_id, @resource_id, @quantity, @quantity);
      `);

    await new sql.Request(transaction)
      .input('warehouse_id', sql.Int, warehouse_id)
      .input('resource_id', sql.Int, resource_id)
      .input('quantity', sql.Int, quantity)
      .query(`
        UPDATE Inventory
        SET quantity_available = quantity_available - @quantity
        WHERE warehouse_id = @warehouse_id AND resource_id = @resource_id;
      `);

    // COMMIT  all 4 steps succeeded, NOW all changes are permanently saved
    await transaction.commit();

    return res.json({
      message: 'Resource allocated and inventory updated successfully!',
      allocation_id: allocation_id,
      quantity_deducted: quantity,
      remaining_stock: currentStock - quantity
    });

  } catch (err) {
    //  ROLLBACK  something failed, UNDO all changes made since begin()
 try { await transaction.rollback(); } catch (_) { /* already rolled back */ }

    console.error('Transaction 1 FAILED (allocate-resource):', err.message);
    return res.status(500).json({
      error: 'Transaction failed. All changes rolled back.',
      details: err.message
    });
  }
});


//Team Assignment + Status Update
//   Step 1: Check the team is currently 'Available'
//   Step 2: Insert a row into Team_Assignment table
//   Step 3: Update the rescue team status to 'Assigned'
//   Step 4: Update the emergency report status to 'In Progress'
//   If anything fails → ROLLBACK everything
router.post('/assign-team', async (req, res) => {
  const { team_id, report_id } = req.body;

  if (!team_id || !report_id) {
    return res.status(400).json({ error: 'Both team_id and report_id are required.' });
  }

  const pool = getPool();

  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    const teamCheck = await new sql.Request(transaction)
      .input('team_id', sql.Int, team_id)
      .query(`
        SELECT availability_status
        FROM Rescue_Team
        WHERE team_id = @team_id
      `);

    const teamStatus = teamCheck.recordset[0]?.availability_status;
    if (!teamStatus) {
      throw new Error(`Team with id ${team_id} not found.`);
    }
  if (teamStatus !== 'Available') {
      throw new Error(`Team is not available. Current status: ${teamStatus}`);
    }

    await new sql.Request(transaction)
      .input('team_id', sql.Int, team_id)
      .input('report_id', sql.Int, report_id)
      .query(`
        INSERT INTO Team_Assignment (team_id, report_id, assigned_at)
        VALUES (@team_id, @report_id, GETDATE());
      `);

    await new sql.Request(transaction)
      .input('team_id', sql.Int, team_id)
      .query(`
        UPDATE Rescue_Team
        SET availability_status = 'Assigned'
        WHERE team_id = @team_id;
      `);

    await new sql.Request(transaction)
      .input('report_id', sql.Int, report_id)
      .query(`
        UPDATE Emergency_Report
        SET status = 'In Progress'
        WHERE report_id = @report_id;
      `);

    await transaction.commit();

    return res.json({
      message: 'Team assigned and statuses updated successfully!',
      team_id: team_id,
      report_id: report_id,
      team_status: 'Assigned',
      report_status: 'In Progress'
    });

  } catch (err) {
    try { await transaction.rollback(); } catch (_) { /* already rolled back */ }

    console.error('Transaction 2 FAILED (assign-team):', err.message);
    return res.status(500).json({
      error: 'Transaction failed. All changes rolled back.',
      details: err.message
    });
  }
});


// Financial Entry + Audit Log
//   Step 1: Insert a financial transaction record
//   Step 2: Insert an entry into the Audit_Log table
//   Step 3: If it's an Expense, update the Budget spent amount
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

  const pool = getPool();

  const transaction = new sql.Transaction(pool);

  try {
    
    await transaction.begin();

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

    // Insert into Audit_Log to keep a record of who did what
    await new sql.Request(transaction)
      .input('user_id', sql.Int, performed_by)
      .input('record_id', sql.Int, transaction_id)
      .input('action_type', sql.VarChar(50), 'INSERT')
      .input('table_name', sql.VarChar(50), 'Financial_Transaction')
      .input('new_value', sql.VarChar(sql.MAX),
        `${transaction_type} of ${amount} | txn_id=${transaction_id}`)
      .query(`
        INSERT INTO Audit_Log
          (user_id, record_id, action_type, table_name, old_value, new_value)
        VALUES
          (@user_id, @record_id, @action_type, @table_name, NULL, @new_value);
      `);

    // Budget table
    
    if (transaction_type === 'Expense' && event_id) {
      await new sql.Request(transaction)
        .input('event_id', sql.Int, event_id)
        .input('amount', sql.Decimal(12, 2), amount)
        .query(`
          UPDATE Budget
          SET total_spent = total_spent + @amount
          WHERE event_id = @event_id;
        `);
    }

    await transaction.commit();

    return res.json({
      message: 'Financial transaction recorded and audit log created successfully!',
      transaction_id: transaction_id,
      transaction_type: transaction_type,
      amount: amount,
      audit_logged: true
    });

  } catch (err) {
    try { await transaction.rollback(); } catch (_) { /* already rolled back */ }

    console.error('Transaction 3 FAILED (financial-entry):', err.message);
    return res.status(500).json({
      error: 'Transaction failed. All changes rolled back.',
      details: err.message
    });
  }
});


module.exports = router;
