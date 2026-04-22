const express = require('express');
const { getPool, sql } = require('../config/db');
const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request().query('SELECT * FROM Approvals ORDER BY RequestedAt DESC');
    return res.json(result.recordset);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.get('/pending', async (_req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request().query('SELECT * FROM vw_PendingApprovals ORDER BY RequestedAt ASC');
    return res.json(result.recordset);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .input('id', sql.Int, parseInt(req.params.id))
      .query('SELECT * FROM Approvals WHERE ApprovalId = @id');
    const row = result.recordset[0];
    return row ? res.json(row) : res.status(404).json({ error: 'Not found.' });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { EntityType, EntityId, RequestedBy, Comments } = req.body;
    const pool = getPool();
    const result = await pool.request()
      .input('EntityType', sql.NVarChar, EntityType)
      .input('EntityId', sql.Int, EntityId)
      .input('RequestedBy', sql.Int, RequestedBy)
      .input('Comments', sql.NVarChar, Comments)
      .query(`INSERT INTO Approvals (EntityType, EntityId, RequestedBy, Comments)
              VALUES (@EntityType, @EntityId, @RequestedBy, @Comments);
              SELECT CAST(SCOPE_IDENTITY() AS INT) AS approvalId;`);
    return res.json({ approvalId: result.recordset[0].approvalId });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.put('/:id/review', async (req, res) => {
  try {
    const reviewerId = req.user && req.user.userId;
    const { Status, Comments } = req.body;
    const pool = getPool();
    const result = await pool.request()
      .input('ApprovalId', sql.Int, parseInt(req.params.id))
      .input('Status', sql.NVarChar, Status)
      .input('ReviewedBy', sql.Int, reviewerId ? parseInt(reviewerId) : null)
      .input('Comments', sql.NVarChar, Comments)
      .query(`UPDATE Approvals SET Status=@Status, ReviewedBy=@ReviewedBy, Comments=@Comments
              WHERE ApprovalId=@ApprovalId AND Status='Pending'`);
    return result.rowsAffected[0] === 0
      ? res.status(404).json({ error: 'Not found or already reviewed.' })
      : res.json({ message: 'Reviewed.' });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
