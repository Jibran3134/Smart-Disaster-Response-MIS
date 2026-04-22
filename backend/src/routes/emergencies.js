const express = require('express');
const { getPool, sql } = require('../config/db');

const router = express.Router();

// ── GET /api/emergencies ──
router.get('/', async (_req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request().query('SELECT * FROM Emergencies ORDER BY ReportedAt DESC');
    return res.json(result.recordset);
  } catch (err) {
    console.error('Emergencies GET error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── GET /api/emergencies/active ──
router.get('/active', async (_req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request().query('SELECT * FROM vw_ActiveEmergencies ORDER BY Severity DESC');
    return res.json(result.recordset);
  } catch (err) {
    console.error('Active emergencies error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── GET /api/emergencies/:id ──
router.get('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .input('id', sql.Int, parseInt(req.params.id))
      .query('SELECT * FROM Emergencies WHERE EmergencyId = @id');
    const row = result.recordset[0];
    return row ? res.json(row) : res.status(404).json({ error: 'Not found.' });
  } catch (err) {
    console.error('Emergency GET by id error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── POST /api/emergencies ──
router.post('/', async (req, res) => {
  try {
    const { Title, Description, Type, Severity, Status, Latitude, Longitude, Location, ReportedBy, AssignedTo } = req.body;
    const pool = getPool();
    const result = await pool.request()
      .input('Title',       sql.NVarChar, Title)
      .input('Description', sql.NVarChar, Description)
      .input('Type',        sql.NVarChar, Type)
      .input('Severity',    sql.NVarChar, Severity)
      .input('Status',      sql.NVarChar, Status || 'Reported')
      .input('Latitude',    sql.Decimal(9,6), Latitude)
      .input('Longitude',   sql.Decimal(9,6), Longitude)
      .input('Location',    sql.NVarChar, Location)
      .input('ReportedBy',  sql.Int, ReportedBy)
      .input('AssignedTo',  sql.Int, AssignedTo || null)
      .query(`INSERT INTO Emergencies (Title, Description, Type, Severity, Status, Latitude, Longitude, Location, ReportedBy, AssignedTo)
              VALUES (@Title, @Description, @Type, @Severity, @Status, @Latitude, @Longitude, @Location, @ReportedBy, @AssignedTo);
              SELECT CAST(SCOPE_IDENTITY() AS INT) AS emergencyId;`);
    return res.json({ emergencyId: result.recordset[0].emergencyId });
  } catch (err) {
    console.error('Emergency POST error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── PUT /api/emergencies/:id ──
router.put('/:id', async (req, res) => {
  try {
    const { Title, Description, Type, Severity, Status, Latitude, Longitude, Location, AssignedTo } = req.body;
    const pool = getPool();
    const result = await pool.request()
      .input('EmergencyId', sql.Int, parseInt(req.params.id))
      .input('Title',       sql.NVarChar, Title)
      .input('Description', sql.NVarChar, Description)
      .input('Type',        sql.NVarChar, Type)
      .input('Severity',    sql.NVarChar, Severity)
      .input('Status',      sql.NVarChar, Status)
      .input('Latitude',    sql.Decimal(9,6), Latitude)
      .input('Longitude',   sql.Decimal(9,6), Longitude)
      .input('Location',    sql.NVarChar, Location)
      .input('AssignedTo',  sql.Int, AssignedTo || null)
      .query(`UPDATE Emergencies SET Title=@Title, Description=@Description, Type=@Type,
              Severity=@Severity, Status=@Status, Latitude=@Latitude, Longitude=@Longitude,
              Location=@Location, AssignedTo=@AssignedTo WHERE EmergencyId=@EmergencyId`);
    return result.rowsAffected[0] === 0
      ? res.status(404).json({ error: 'Not found.' })
      : res.json({ message: 'Updated.' });
  } catch (err) {
    console.error('Emergency PUT error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── DELETE /api/emergencies/:id ──
router.delete('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .input('id', sql.Int, parseInt(req.params.id))
      .query('DELETE FROM Emergencies WHERE EmergencyId = @id');
    return result.rowsAffected[0] === 0
      ? res.status(404).json({ error: 'Not found.' })
      : res.json({ message: 'Deleted.' });
  } catch (err) {
    console.error('Emergency DELETE error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
