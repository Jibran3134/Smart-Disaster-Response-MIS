const express = require('express');
const { getPool, sql } = require('../config/db');
const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request().query('SELECT * FROM FinancialTransactions ORDER BY TransactionDate DESC');
    return res.json(result.recordset);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.get('/summary', async (_req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request().query('SELECT * FROM vw_FinanceSummary');
    return res.json(result.recordset);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.get('/dashboard', async (_req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request().query('SELECT * FROM vw_DashboardStats');
    return res.json(result.recordset[0] || {});
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .input('id', sql.Int, parseInt(req.params.id))
      .query('SELECT * FROM FinancialTransactions WHERE TransactionId = @id');
    const row = result.recordset[0];
    return row ? res.json(row) : res.status(404).json({ error: 'Not found.' });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { EmergencyId, Type, Amount, Currency, Description, ApprovedBy, Status } = req.body;
    const pool = getPool();
    const result = await pool.request()
      .input('EmergencyId', sql.Int, EmergencyId || null)
      .input('Type', sql.NVarChar, Type)
      .input('Amount', sql.Decimal(18,2), Amount)
      .input('Currency', sql.NVarChar, Currency || 'USD')
      .input('Description', sql.NVarChar, Description)
      .input('ApprovedBy', sql.Int, ApprovedBy || null)
      .input('Status', sql.NVarChar, Status || 'Pending')
      .query(`INSERT INTO FinancialTransactions (EmergencyId, Type, Amount, Currency, Description, ApprovedBy, Status)
              VALUES (@EmergencyId, @Type, @Amount, @Currency, @Description, @ApprovedBy, @Status);
              SELECT CAST(SCOPE_IDENTITY() AS INT) AS transactionId;`);
    return res.json({ transactionId: result.recordset[0].transactionId });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { EmergencyId, Type, Amount, Currency, Description, ApprovedBy, Status } = req.body;
    const pool = getPool();
    const result = await pool.request()
      .input('TransactionId', sql.Int, parseInt(req.params.id))
      .input('EmergencyId', sql.Int, EmergencyId || null)
      .input('Type', sql.NVarChar, Type)
      .input('Amount', sql.Decimal(18,2), Amount)
      .input('Currency', sql.NVarChar, Currency)
      .input('Description', sql.NVarChar, Description)
      .input('ApprovedBy', sql.Int, ApprovedBy || null)
      .input('Status', sql.NVarChar, Status)
      .query(`UPDATE FinancialTransactions SET EmergencyId=@EmergencyId, Type=@Type,
              Amount=@Amount, Currency=@Currency, Description=@Description,
              ApprovedBy=@ApprovedBy, Status=@Status WHERE TransactionId=@TransactionId`);
    return result.rowsAffected[0] === 0
      ? res.status(404).json({ error: 'Not found.' })
      : res.json({ message: 'Updated.' });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .input('id', sql.Int, parseInt(req.params.id))
      .query('DELETE FROM FinancialTransactions WHERE TransactionId = @id');
    return result.rowsAffected[0] === 0
      ? res.status(404).json({ error: 'Not found.' })
      : res.json({ message: 'Deleted.' });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
