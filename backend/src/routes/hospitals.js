const express = require('express');
const { getPool, sql } = require('../config/db');
const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request().query('SELECT * FROM Hospitals ORDER BY Name');
    return res.json(result.recordset);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.get('/capacity', async (_req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request().query('SELECT * FROM vw_HospitalCapacity ORDER BY OccupancyPct DESC');
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
      .query('SELECT * FROM Hospitals WHERE HospitalId = @id');
    const row = result.recordset[0];
    return row ? res.json(row) : res.status(404).json({ error: 'Not found.' });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { Name, Address, City, Latitude, Longitude, TotalBeds, AvailableBeds, Phone, Status } = req.body;
    const pool = getPool();
    const result = await pool.request()
      .input('Name', sql.NVarChar, Name)
      .input('Address', sql.NVarChar, Address)
      .input('City', sql.NVarChar, City)
      .input('Latitude', sql.Decimal(9,6), Latitude)
      .input('Longitude', sql.Decimal(9,6), Longitude)
      .input('TotalBeds', sql.Int, TotalBeds || 0)
      .input('AvailableBeds', sql.Int, AvailableBeds || 0)
      .input('Phone', sql.NVarChar, Phone)
      .input('Status', sql.NVarChar, Status || 'Operational')
      .query(`INSERT INTO Hospitals (Name, Address, City, Latitude, Longitude, TotalBeds, AvailableBeds, Phone, Status)
              VALUES (@Name, @Address, @City, @Latitude, @Longitude, @TotalBeds, @AvailableBeds, @Phone, @Status);
              SELECT CAST(SCOPE_IDENTITY() AS INT) AS hospitalId;`);
    return res.json({ hospitalId: result.recordset[0].hospitalId });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { Name, Address, City, Latitude, Longitude, TotalBeds, AvailableBeds, Phone, Status } = req.body;
    const pool = getPool();
    const result = await pool.request()
      .input('HospitalId', sql.Int, parseInt(req.params.id))
      .input('Name', sql.NVarChar, Name)
      .input('Address', sql.NVarChar, Address)
      .input('City', sql.NVarChar, City)
      .input('Latitude', sql.Decimal(9,6), Latitude)
      .input('Longitude', sql.Decimal(9,6), Longitude)
      .input('TotalBeds', sql.Int, TotalBeds)
      .input('AvailableBeds', sql.Int, AvailableBeds)
      .input('Phone', sql.NVarChar, Phone)
      .input('Status', sql.NVarChar, Status)
      .query(`UPDATE Hospitals SET Name=@Name, Address=@Address, City=@City,
              Latitude=@Latitude, Longitude=@Longitude, TotalBeds=@TotalBeds,
              AvailableBeds=@AvailableBeds, Phone=@Phone, Status=@Status
              WHERE HospitalId=@HospitalId`);
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
      .query('DELETE FROM Hospitals WHERE HospitalId = @id');
    return result.rowsAffected[0] === 0
      ? res.status(404).json({ error: 'Not found.' })
      : res.json({ message: 'Deleted.' });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
