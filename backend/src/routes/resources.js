const express = require('express');
const { getPool, sql } = require('../config/db');

const router = express.Router();

// ── GET /api/resources ──
router.get('/', async (_req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request().query('SELECT * FROM Resources ORDER BY Name');
    return res.json(result.recordset);
  } catch (err) {
    console.error('Resources GET error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── GET /api/resources/summary ──
router.get('/summary', async (_req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request().query('SELECT * FROM vw_ResourceSummary');
    return res.json(result.recordset);
  } catch (err) {
    console.error('Resource summary error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── GET /api/resources/:id ──
router.get('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .input('id', sql.Int, parseInt(req.params.id))
      .query('SELECT * FROM Resources WHERE ResourceId = @id');
    const row = result.recordset[0];
    return row ? res.json(row) : res.status(404).json({ error: 'Not found.' });
  } catch (err) {
    console.error('Resource GET by id error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── POST /api/resources ──
router.post('/', async (req, res) => {
  try {
    const { Name, Category, Quantity, Unit, Status, Location, EmergencyId } = req.body;
    const pool = getPool();
    const result = await pool.request()
      .input('Name',        sql.NVarChar, Name)
      .input('Category',    sql.NVarChar, Category)
      .input('Quantity',    sql.Int, Quantity)
      .input('Unit',        sql.NVarChar, Unit || 'Units')
      .input('Status',      sql.NVarChar, Status || 'Available')
      .input('Location',    sql.NVarChar, Location)
      .input('EmergencyId', sql.Int, EmergencyId || null)
      .query(`INSERT INTO Resources (Name, Category, Quantity, Unit, Status, Location, EmergencyId)
              VALUES (@Name, @Category, @Quantity, @Unit, @Status, @Location, @EmergencyId);
              SELECT CAST(SCOPE_IDENTITY() AS INT) AS resourceId;`);
    return res.json({ resourceId: result.recordset[0].resourceId });
  } catch (err) {
    console.error('Resource POST error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── PUT /api/resources/:id ──
router.put('/:id', async (req, res) => {
  try {
    const { Name, Category, Quantity, Unit, Status, Location, EmergencyId } = req.body;
    const pool = getPool();
    const result = await pool.request()
      .input('ResourceId',  sql.Int, parseInt(req.params.id))
      .input('Name',        sql.NVarChar, Name)
      .input('Category',    sql.NVarChar, Category)
      .input('Quantity',    sql.Int, Quantity)
      .input('Unit',        sql.NVarChar, Unit)
      .input('Status',      sql.NVarChar, Status)
      .input('Location',    sql.NVarChar, Location)
      .input('EmergencyId', sql.Int, EmergencyId || null)
      .query(`UPDATE Resources SET Name=@Name, Category=@Category, Quantity=@Quantity,
              Unit=@Unit, Status=@Status, Location=@Location, EmergencyId=@EmergencyId
              WHERE ResourceId=@ResourceId`);
    return result.rowsAffected[0] === 0
      ? res.status(404).json({ error: 'Not found.' })
      : res.json({ message: 'Updated.' });
  } catch (err) {
    console.error('Resource PUT error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── DELETE /api/resources/:id ──
router.delete('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .input('id', sql.Int, parseInt(req.params.id))
      .query('DELETE FROM Resources WHERE ResourceId = @id');
    return result.rowsAffected[0] === 0
      ? res.status(404).json({ error: 'Not found.' })
      : res.json({ message: 'Deleted.' });
  } catch (err) {
    console.error('Resource DELETE error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
