// Endpoints:
//   GET    /api/teams/                     → List all rescue teams
//   GET    /api/teams/:id                  → Get one team (with contacts)
//   POST   /api/teams/                     → Create a rescue team
//   PUT    /api/teams/:id                  → Update a team
//
//   GET    /api/teams/assignments           → List all team assignments
//   PUT    /api/teams/assignments/complete  → Mark assignment as completed
//
// Access: Administrator, Emergency Operator, Field Officer

const express = require('express');
const { getPool, sql } = require('../config/db');
const { requireRoles } = require('../middleware/rbac');

const router = express.Router();

//  GET /api/teams/ 
// List all rescue teams (optional filters: ?status=Available&type=Medical)
router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const { status, type } = req.query;

    let query = 'SELECT * FROM Rescue_Team WHERE 1=1';
    const request = pool.request();

    if (status) {
      query += ' AND availability_status = @status';
      request.input('status', sql.VarChar(20), status);
    }
    if (type) {
      query += ' AND team_type = @type';
      request.input('type', sql.VarChar(50), type);
    }

    query += ' ORDER BY team_name';

    const result = await request.query(query);
    return res.json(result.recordset);

  } catch (err) {
    console.error('Get teams error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


//  GET /api/teams/assignments 
// List all team assignments with team and report info
router.get('/assignments', async (req, res) => {
  try {
    const pool = getPool();
    const { team_id, report_id } = req.query;

    let query = `
      SELECT ta.*, rt.team_name, rt.team_type,
             er.area_name, er.severity AS report_severity
      FROM Team_Assignment ta
      JOIN Rescue_Team rt ON ta.team_id = rt.team_id
      JOIN Emergency_Report er ON ta.report_id = er.report_id
      WHERE 1=1
    `;
    const request = pool.request();

    if (team_id) {
      query += ' AND ta.team_id = @team_id';
      request.input('team_id', sql.Int, team_id);
    }
    if (report_id) {
      query += ' AND ta.report_id = @report_id';
      request.input('report_id', sql.Int, report_id);
    }

    query += ' ORDER BY ta.assigned_at DESC';

    const result = await request.query(query);
    return res.json(result.recordset);

  } catch (err) {
    console.error('Get assignments error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


//  PUT /api/teams/assignments/complete 
// Mark a team assignment as completed + set team status back to Available
// Body: { team_id, report_id }
router.put('/assignments/complete',
  requireRoles('Administrator', 'Emergency Operator', 'Field Officer'),
  async (req, res) => {
    try {
      const { team_id, report_id } = req.body;

      if (!team_id || !report_id) {
        return res.status(400).json({ error: 'team_id and report_id are required.' });
      }

      const pool = getPool();
      const transaction = new sql.Transaction(pool);

      try {
        await transaction.begin();

        await new sql.Request(transaction)
          .input('team_id',   sql.Int, team_id)
          .input('report_id', sql.Int, report_id)
          .query(`
            UPDATE Team_Assignment
            SET completed_at = GETDATE()
            WHERE team_id = @team_id AND report_id = @report_id
          `);

        await new sql.Request(transaction)
          .input('team_id', sql.Int, team_id)
          .query(`
            UPDATE Rescue_Team
            SET availability_status = 'Available'
            WHERE team_id = @team_id
          `);

        await new sql.Request(transaction)
          .input('report_id', sql.Int, report_id)
          .query(`
            UPDATE Emergency_Report
            SET status = 'Resolved'
            WHERE report_id = @report_id
          `);

        await transaction.commit();

        return res.json({
          message: 'Assignment completed. Team is now Available, report is Resolved.'
        });

      } catch (err) {
        try { await transaction.rollback(); } catch (_) {}
        throw err;
      }

    } catch (err) {
      console.error('Complete assignment error:', err.message);
      return res.status(500).json({ error: 'Internal server error.', details: err.message });
    }
  }
);



//  GET /api/teams/:id 
// Get a single team by ID (includes contact numbers)
router.get('/:id', async (req, res) => {
  try {
    const pool = getPool();

    // Get team info
    const teamResult = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT * FROM Rescue_Team WHERE team_id = @id');

    if (teamResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Team not found.' });
    }

    // Get team contacts
    const contactsResult = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT * FROM Team_Contact WHERE team_id = @id');

    // Get current assignments
    const assignResult = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`
        SELECT ta.*, er.area_name, er.severity
        FROM Team_Assignment ta
        JOIN Emergency_Report er ON ta.report_id = er.report_id
        WHERE ta.team_id = @id AND ta.completed_at IS NULL
      `);

    return res.json({
      ...teamResult.recordset[0],
      contacts: contactsResult.recordset,
      active_assignments: assignResult.recordset
    });

  } catch (err) {
    console.error('Get team error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


//  POST /api/teams/ 
// Create a new rescue team
// Body: { team_name, team_type, latitude, longitude, area_name, contacts: ["0300...", "0311..."] }
router.post('/', requireRoles('Administrator', 'Emergency Operator'), async (req, res) => {
  try {
    const { team_name, team_type, latitude, longitude, area_name, contacts } = req.body;

    if (!team_name || !team_type) {
      return res.status(400).json({ error: 'team_name and team_type are required.' });
    }

    const pool = getPool();
    const transaction = new sql.Transaction(pool);

    try {
      await transaction.begin();

      // Step 1: Create the team
      const teamResult = await new sql.Request(transaction)
        .input('team_name',  sql.VarChar(100),  team_name)
        .input('team_type',  sql.VarChar(50),   team_type)
        .input('latitude',   sql.Decimal(9, 6), latitude || null)
        .input('longitude',  sql.Decimal(9, 6), longitude || null)
        .input('area_name',  sql.VarChar(100),  area_name || null)
        .query(`
          INSERT INTO Rescue_Team (team_name, team_type, latitude, longitude, area_name)
          VALUES (@team_name, @team_type, @latitude, @longitude, @area_name);

          SELECT CAST(SCOPE_IDENTITY() AS INT) AS team_id;
        `);

      const team_id = teamResult.recordset[0].team_id;

      // Step 2: Insert contact numbers (if provided)
      if (contacts && Array.isArray(contacts)) {
        for (const number of contacts) {
          await new sql.Request(transaction)
            .input('team_id', sql.Int, team_id)
            .input('contact_number', sql.VarChar(20), number)
            .query(`
              INSERT INTO Team_Contact (team_id, contact_number)
              VALUES (@team_id, @contact_number)
            `);
        }
      }

      await transaction.commit();

      return res.status(201).json({
        message: 'Rescue team created.',
        team_id: team_id
      });

    } catch (err) {
      try { await transaction.rollback(); } catch (_) {}
      throw err;
    }

  } catch (err) {
    console.error('Create team error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


//  PUT /api/teams/:id 
// Update a rescue team
// Body: { team_name, team_type, latitude, longitude, area_name, availability_status }
router.put('/:id', requireRoles('Administrator', 'Emergency Operator'), async (req, res) => {
  try {
    const { team_name, team_type, latitude, longitude, area_name, availability_status } = req.body;
    const pool = getPool();

    const result = await pool.request()
      .input('id',                  sql.Int,           req.params.id)
      .input('team_name',           sql.VarChar(100),  team_name)
      .input('team_type',           sql.VarChar(50),   team_type)
      .input('latitude',            sql.Decimal(9, 6), latitude)
      .input('longitude',           sql.Decimal(9, 6), longitude)
      .input('area_name',           sql.VarChar(100),  area_name)
      .input('availability_status', sql.VarChar(20),   availability_status)
      .query(`
        UPDATE Rescue_Team
        SET team_name           = COALESCE(@team_name, team_name),
            team_type           = COALESCE(@team_type, team_type),
            latitude            = COALESCE(@latitude, latitude),
            longitude           = COALESCE(@longitude, longitude),
            area_name           = COALESCE(@area_name, area_name),
            availability_status = COALESCE(@availability_status, availability_status)
        WHERE team_id = @id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Team not found.' });
    }

    return res.json({ message: 'Team updated.' });

  } catch (err) {
    console.error('Update team error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


module.exports = router;
