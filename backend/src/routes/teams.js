const express = require('express');
const { getPool, sql } = require('../config/db');
const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request().query('SELECT * FROM Teams ORDER BY TeamName');
    return res.json(result.recordset);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.get('/deployed', async (_req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request().query("SELECT * FROM vw_TeamDeployment WHERE Status = 'Deployed'");
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
      .query('SELECT * FROM Teams WHERE TeamId = @id');
    const row = result.recordset[0];
    return row ? res.json(row) : res.status(404).json({ error: 'Not found.' });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { TeamName, Specialization, Status, LeaderId, MemberCount, EmergencyId, DeployedAt } = req.body;
    const pool = getPool();
    const result = await pool.request()
      .input('TeamName', sql.NVarChar, TeamName)
      .input('Specialization', sql.NVarChar, Specialization)
      .input('Status', sql.NVarChar, Status || 'Available')
      .input('LeaderId', sql.Int, LeaderId || null)
      .input('MemberCount', sql.Int, MemberCount || 0)
      .input('EmergencyId', sql.Int, EmergencyId || null)
      .input('DeployedAt', sql.DateTime2, DeployedAt || null)
      .query(`INSERT INTO Teams (TeamName, Specialization, Status, LeaderId, MemberCount, EmergencyId, DeployedAt)
              VALUES (@TeamName, @Specialization, @Status, @LeaderId, @MemberCount, @EmergencyId, @DeployedAt);
              SELECT CAST(SCOPE_IDENTITY() AS INT) AS teamId;`);
    return res.json({ teamId: result.recordset[0].teamId });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { TeamName, Specialization, Status, LeaderId, EmergencyId, DeployedAt } = req.body;
    const pool = getPool();
    const result = await pool.request()
      .input('TeamId', sql.Int, parseInt(req.params.id))
      .input('TeamName', sql.NVarChar, TeamName)
      .input('Specialization', sql.NVarChar, Specialization)
      .input('Status', sql.NVarChar, Status)
      .input('LeaderId', sql.Int, LeaderId || null)
      .input('EmergencyId', sql.Int, EmergencyId || null)
      .input('DeployedAt', sql.DateTime2, DeployedAt || null)
      .query(`UPDATE Teams SET TeamName=@TeamName, Specialization=@Specialization, Status=@Status,
              LeaderId=@LeaderId, EmergencyId=@EmergencyId, DeployedAt=@DeployedAt
              WHERE TeamId=@TeamId`);
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
      .query('DELETE FROM Teams WHERE TeamId = @id');
    return result.rowsAffected[0] === 0
      ? res.status(404).json({ error: 'Not found.' })
      : res.json({ message: 'Deleted.' });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
