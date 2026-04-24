// Endpoints:
//   GET    /api/emergencies/events          → List all disaster events
//   GET    /api/emergencies/events/:id      → Get one event
//   POST   /api/emergencies/events          → Create a new event
//   PUT    /api/emergencies/events/:id      → Update an event
//
//   GET    /api/emergencies/reports         → List all emergency reports
//   GET    /api/emergencies/reports/:id     → Get one report
//   POST   /api/emergencies/reports         → Create a new report
//   PUT    /api/emergencies/reports/:id     → Update a report
//
// Access: Administrator, Emergency Operator, Field Officer


const express = require('express');
const { getPool, sql } = require('../config/db');

const router = express.Router();


//  GET /api/emergencies/events 
// List all disaster events (optional filters: ?status=Active&type=Flood)
router.get('/events', async (req, res) => {
  try {
    const pool = getPool();
    const { status, type } = req.query;

    // Parameterized queries — using @status, @type instead of string
    // concatenation prevents SQL injection attacks
    let query = 'SELECT * FROM Disaster_Event WHERE 1=1';
    const request = pool.request();

    if (status) {
      query += ' AND status = @status';
      request.input('status', sql.VarChar(20), status);
    }
    if (type) {
      query += ' AND disaster_type = @type';
      request.input('type', sql.VarChar(50), type);
    }

    query += ' ORDER BY start_date DESC';

    const result = await request.query(query);
    return res.json(result.recordset);

  // Graceful error handling — catches DB errors and returns a clean
  // JSON response instead of crashing the server
  } catch (err) {
    console.error('Get events error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


//  GET /api/emergencies/events/:id 
// Get a single disaster event by ID
router.get('/events/:id', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT * FROM Disaster_Event WHERE event_id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    return res.json(result.recordset[0]);

  } catch (err) {
    console.error('Get event error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


//  POST /api/emergencies/events 
// Create a new disaster event
// Body: { event_name, disaster_type, affected_areas, start_date }
router.post('/events', async (req, res) => {
  try {
    const { event_name, disaster_type, affected_areas, start_date } = req.body;

    if (!event_name || !disaster_type || !start_date) {
      return res.status(400).json({ error: 'event_name, disaster_type, and start_date are required.' });
    }

    const pool = getPool();
    const result = await pool.request()
      .input('event_name',     sql.VarChar(100), event_name)
      .input('disaster_type',  sql.VarChar(50),  disaster_type)
      .input('affected_areas', sql.VarChar(sql.MAX), affected_areas || null)
      .input('start_date',     sql.DateTime,     new Date(start_date))
      .query(`
        INSERT INTO Disaster_Event (event_name, disaster_type, affected_areas, start_date)
        VALUES (@event_name, @disaster_type, @affected_areas, @start_date);

        SELECT CAST(SCOPE_IDENTITY() AS INT) AS event_id;
      `);

    return res.status(201).json({
      message: 'Disaster event created.',
      event_id: result.recordset[0].event_id
    });

  } catch (err) {
    console.error('Create event error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


//  PUT /api/emergencies/events/:id 
// Update a disaster event (status, end_date, etc.)
// Body: { event_name, disaster_type, affected_areas, status, end_date }
router.put('/events/:id', async (req, res) => {
  try {
    const { event_name, disaster_type, affected_areas, status, end_date } = req.body;
    const pool = getPool();

    const result = await pool.request()
      .input('id',             sql.Int,          req.params.id)
      .input('event_name',     sql.VarChar(100), event_name)
      .input('disaster_type',  sql.VarChar(50),  disaster_type)
      .input('affected_areas', sql.VarChar(sql.MAX), affected_areas || null)
      .input('status',         sql.VarChar(20),  status)
      .input('end_date',       sql.DateTime,     end_date ? new Date(end_date) : null)
      .query(`
        UPDATE Disaster_Event
    //  COALESCE for partial updates — only updates fields the client sends,
    // keeps existing values for fields not included in the request body
        SET event_name     = COALESCE(@event_name, event_name),
            disaster_type  = COALESCE(@disaster_type, disaster_type),
            affected_areas = COALESCE(@affected_areas, affected_areas),
            status         = COALESCE(@status, status),
            end_date       = COALESCE(@end_date, end_date)
        WHERE event_id = @id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    return res.json({ message: 'Event updated.' });

  } catch (err) {
    console.error('Update event error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


//  GET /api/emergencies/reports 
// List all emergency reports (optional filters: ?severity=Critical&status=Open&event_id=1)
router.get('/reports', async (req, res) => {
  try {
    const pool = getPool();
    const { severity, status, event_id } = req.query;

    let query = `
      SELECT er.*, u.full_name AS reporter_name, de.event_name
      FROM Emergency_Report er
      JOIN Users u ON er.reported_by = u.user_id
      JOIN Disaster_Event de ON er.event_id = de.event_id
      WHERE 1=1
    `;
    //  JOIN queries — fetches related data from multiple tables
    // (reports + user who reported + event info) in a single query
    const request = pool.request();

    if (severity) {
      query += ' AND er.severity = @severity';
      request.input('severity', sql.VarChar(20), severity);
    }
    if (status) {
      query += ' AND er.status = @status';
      request.input('status', sql.VarChar(20), status);
    }
    if (event_id) {
      query += ' AND er.event_id = @event_id';
      request.input('event_id', sql.Int, event_id);
    }

    query += ' ORDER BY er.report_time DESC';

    const result = await request.query(query);
    return res.json(result.recordset);

  } catch (err) {
    console.error('Get reports error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


//  GET /api/emergencies/reports/:id 
// Get a single emergency report by ID
router.get('/reports/:id', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`
        SELECT er.*, u.full_name AS reporter_name, de.event_name
        FROM Emergency_Report er
        JOIN Users u ON er.reported_by = u.user_id
        JOIN Disaster_Event de ON er.event_id = de.event_id
        WHERE er.report_id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    return res.json(result.recordset[0]);

  } catch (err) {
    console.error('Get report error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


//  POST /api/emergencies/reports 
// Create a new emergency report
// Body: { event_id, area_name, latitude, longitude, severity }
router.post('/reports', async (req, res) => {
  try {
    const { event_id, area_name, latitude, longitude, severity } = req.body;

    if (!event_id || !area_name || !latitude || !longitude || !severity) {
      return res.status(400).json({
        error: 'event_id, area_name, latitude, longitude, and severity are required.'
      });
    }
    const reported_by = req.user.userId;

    const pool = getPool();
    const result = await pool.request()
      .input('event_id',    sql.Int,            event_id)
      .input('reported_by', sql.Int,            reported_by)
      .input('area_name',   sql.VarChar(100),   area_name)
      .input('latitude',    sql.Decimal(9, 6),  latitude)
      .input('longitude',   sql.Decimal(9, 6),  longitude)
      .input('severity',    sql.VarChar(20),    severity)
      .query(`
        INSERT INTO Emergency_Report (event_id, reported_by, area_name, latitude, longitude, severity)
        VALUES (@event_id, @reported_by, @area_name, @latitude, @longitude, @severity);

        SELECT CAST(SCOPE_IDENTITY() AS INT) AS report_id;
      `);

    return res.status(201).json({
      message: 'Emergency report created.',
      report_id: result.recordset[0].report_id
    });

  } catch (err) {
    console.error('Create report error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


//  PUT /api/emergencies/reports/:id 
// Update a report (e.g. change status or severity)
// Body: { status, severity, area_name }
router.put('/reports/:id', async (req, res) => {
  try {
    const { status, severity, area_name } = req.body;
    const pool = getPool();

    const result = await pool.request()
      .input('id',        sql.Int,          req.params.id)
      .input('status',    sql.VarChar(20),  status)
      .input('severity',  sql.VarChar(20),  severity)
      .input('area_name', sql.VarChar(100), area_name)
      .query(`
        UPDATE Emergency_Report
        SET status    = COALESCE(@status, status),
            severity  = COALESCE(@severity, severity),
            area_name = COALESCE(@area_name, area_name)
        WHERE report_id = @id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    return res.json({ message: 'Report updated.' });

  } catch (err) {
    console.error('Update report error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


module.exports = router;
