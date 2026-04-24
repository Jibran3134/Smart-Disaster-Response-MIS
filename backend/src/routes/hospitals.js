// ============================================================
// hospitals.js — Hospitals & Patients
// ============================================================
// Endpoints:
//   GET    /api/hospitals/                  → List all hospitals
//   GET    /api/hospitals/:id               → Get one hospital (with patients)
//   POST   /api/hospitals/                  → Create a hospital
//   PUT    /api/hospitals/:id               → Update a hospital
//
//   GET    /api/hospitals/:id/patients      → List patients in a hospital
//   POST   /api/hospitals/:id/patients      → Admit a patient
//   PUT    /api/hospitals/patients/:id      → Update patient info
//
// Access: Administrator, Emergency Operator
// ============================================================

const express = require('express');
const { getPool, sql } = require('../config/db');

const router = express.Router();


// ════════════════════════════════════════════════════════════
//  HOSPITALS
// ════════════════════════════════════════════════════════════

// ── GET /api/hospitals/ ──
// List all hospitals (optional filter: ?status=Operational&city=Lahore)
router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const { status, city } = req.query;

    let query = 'SELECT * FROM Hospital WHERE 1=1';
    const request = pool.request();

    if (status) {
      query += ' AND status = @status';
      request.input('status', sql.VarChar(30), status);
    }
    if (city) {
      query += ' AND city = @city';
      request.input('city', sql.VarChar(200), city);
    }

    query += ' ORDER BY hospital_name';

    const result = await request.query(query);
    return res.json(result.recordset);

  } catch (err) {
    console.error('Get hospitals error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


// ── GET /api/hospitals/patients/:patientId ──
// Update a patient record
// (Must be defined BEFORE /:id so "patients" isn't treated as an id)
router.put('/patients/:patientId', async (req, res) => {
  try {
    const { condition, hospital_id } = req.body;
    const pool = getPool();

    const result = await pool.request()
      .input('id',          sql.Int,          req.params.patientId)
      .input('condition',   sql.VarChar(100), condition)
      .input('hospital_id', sql.Int,          hospital_id)
      .query(`
        UPDATE Patient
        SET condition   = COALESCE(@condition, condition),
            hospital_id = COALESCE(@hospital_id, hospital_id)
        WHERE patient_id = @id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Patient not found.' });
    }

    return res.json({ message: 'Patient updated.' });

  } catch (err) {
    console.error('Update patient error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


// ── GET /api/hospitals/:id ──
// Get a single hospital with patient count
router.get('/:id', async (req, res) => {
  try {
    const pool = getPool();

    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`
        SELECT h.*,
               (SELECT COUNT(*) FROM Patient p WHERE p.hospital_id = h.hospital_id) AS current_patients
        FROM Hospital h
        WHERE h.hospital_id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Hospital not found.' });
    }

    return res.json(result.recordset[0]);

  } catch (err) {
    console.error('Get hospital error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


// ── POST /api/hospitals/ ──
// Create a new hospital
// Body: { hospital_name, total_beds, available_beds, address, city }
router.post('/', async (req, res) => {
  try {
    const { hospital_name, total_beds, available_beds, address, city } = req.body;

    if (!hospital_name || !total_beds || !address || !city) {
      return res.status(400).json({
        error: 'hospital_name, total_beds, address, and city are required.'
      });
    }

    const pool = getPool();
    const result = await pool.request()
      .input('hospital_name', sql.VarChar(100), hospital_name)
      .input('total_beds',    sql.Int,          total_beds)
      .input('available_beds', sql.Int,         available_beds || total_beds)
      .input('address',       sql.VarChar(200), address)
      .input('city',          sql.VarChar(200), city)
      .query(`
        INSERT INTO Hospital (hospital_name, total_beds, available_beds, address, city)
        VALUES (@hospital_name, @total_beds, @available_beds, @address, @city);

        SELECT CAST(SCOPE_IDENTITY() AS INT) AS hospital_id;
      `);

    return res.status(201).json({
      message: 'Hospital created.',
      hospital_id: result.recordset[0].hospital_id
    });

  } catch (err) {
    console.error('Create hospital error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


// ── PUT /api/hospitals/:id ──
// Update a hospital (e.g. available beds, status)
// Body: { hospital_name, total_beds, available_beds, address, city }
router.put('/:id', async (req, res) => {
  try {
    const { hospital_name, total_beds, available_beds, address, city } = req.body;
    const pool = getPool();

    const result = await pool.request()
      .input('id',             sql.Int,          req.params.id)
      .input('hospital_name',  sql.VarChar(100), hospital_name)
      .input('total_beds',     sql.Int,          total_beds)
      .input('available_beds', sql.Int,          available_beds)
      .input('address',        sql.VarChar(200), address)
      .input('city',           sql.VarChar(200), city)
      .query(`
        UPDATE Hospital
        SET hospital_name  = COALESCE(@hospital_name, hospital_name),
            total_beds     = COALESCE(@total_beds, total_beds),
            available_beds = COALESCE(@available_beds, available_beds),
            address        = COALESCE(@address, address),
            city           = COALESCE(@city, city)
        WHERE hospital_id = @id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Hospital not found.' });
    }

    return res.json({ message: 'Hospital updated.' });

  } catch (err) {
    console.error('Update hospital error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


// ════════════════════════════════════════════════════════════
//  PATIENTS
// ════════════════════════════════════════════════════════════

// ── GET /api/hospitals/:id/patients ──
// List all patients in a specific hospital
router.get('/:id/patients', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .input('hospital_id', sql.Int, req.params.id)
      .query(`
        SELECT p.*, er.area_name AS report_area, er.severity AS report_severity
        FROM Patient p
        LEFT JOIN Emergency_Report er ON p.report_id = er.report_id
        WHERE p.hospital_id = @hospital_id
        ORDER BY p.admission_time DESC
      `);

    return res.json(result.recordset);

  } catch (err) {
    console.error('Get patients error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


// ── POST /api/hospitals/:id/patients ──
// Admit a patient to a hospital
// Body: { patient_name, dob, condition, report_id }
router.post('/:id/patients', async (req, res) => {
  try {
    const hospital_id = req.params.id;
    const { patient_name, dob, condition, report_id } = req.body;

    if (!patient_name) {
      return res.status(400).json({ error: 'patient_name is required.' });
    }

    const pool = getPool();
    const transaction = new sql.Transaction(pool);

    try {
      await transaction.begin();

      // Step 1: Check if hospital has available beds
      const hospCheck = await new sql.Request(transaction)
        .input('hospital_id', sql.Int, hospital_id)
        .query('SELECT available_beds FROM Hospital WHERE hospital_id = @hospital_id');

      if (hospCheck.recordset.length === 0) {
        throw new Error('Hospital not found.');
      }
      if (hospCheck.recordset[0].available_beds <= 0) {
        throw new Error('No available beds in this hospital.');
      }

      // Step 2: Insert the patient
      const patientResult = await new sql.Request(transaction)
        .input('hospital_id', sql.Int,          hospital_id)
        .input('report_id',   sql.Int,          report_id || null)
        .input('patient_name', sql.VarChar(100), patient_name)
        .input('dob',         sql.Date,         dob ? new Date(dob) : null)
        .input('condition',   sql.VarChar(100), condition || null)
        .query(`
          INSERT INTO Patient (hospital_id, report_id, patient_name, dob, condition)
          VALUES (@hospital_id, @report_id, @patient_name, @dob, @condition);

          SELECT CAST(SCOPE_IDENTITY() AS INT) AS patient_id;
        `);

      // Step 3: Decrease available beds by 1
      await new sql.Request(transaction)
        .input('hospital_id', sql.Int, hospital_id)
        .query(`
          UPDATE Hospital
          SET available_beds = available_beds - 1
          WHERE hospital_id = @hospital_id
        `);

      await transaction.commit();

      return res.status(201).json({
        message: 'Patient admitted.',
        patient_id: patientResult.recordset[0].patient_id
      });

    } catch (err) {
      try { await transaction.rollback(); } catch (_) {}
      throw err;
    }

  } catch (err) {
    console.error('Admit patient error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});


module.exports = router;
