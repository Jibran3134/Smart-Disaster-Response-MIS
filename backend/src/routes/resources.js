//  Named routes (warehouses, inventory, allocations)
// Endpoints:
//   GET/POST          /api/resources/
//   GET/PUT           /api/resources/:id
//   GET/POST/PUT      /api/resources/warehouses[/:id]
//   GET/PUT           /api/resources/inventory
//   GET               /api/resources/inventory/low-stock
//   GET               /api/resources/allocations[/:id]
//
// Access: Administrator, Field Officer, Warehouse Manager

const express = require('express');
const { getPool, sql } = require('../config/db');
const { requireRoles } = require('../middleware/rbac');

const router = express.Router();

//  GET /api/resources/warehouses 
router.get('/warehouses', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request().query(`
      SELECT w.*, u.full_name AS manager_name
      FROM Warehouse w
      JOIN Users u ON w.managed_by = u.user_id
      ORDER BY w.warehouse_name
    `);
    return res.json(result.recordset);
  } catch (err) {
    console.error('Get warehouses error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

//  GET /api/resources/warehouses/:id 
router.get('/warehouses/:id', async (req, res) => {
  try {
    const pool = getPool();
    const whResult = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`
        SELECT w.*, u.full_name AS manager_name
        FROM Warehouse w
        JOIN Users u ON w.managed_by = u.user_id
        WHERE w.warehouse_id = @id
      `);

    if (whResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Warehouse not found.' });
    }

    // Get inventory for this warehouse
    const invResult = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`
        SELECT i.*, r.resource_name, r.resource_type, r.unit_cost
        FROM Inventory i
        JOIN Resource r ON i.resource_id = r.resource_id
        WHERE i.warehouse_id = @id
      `);

    return res.json({ ...whResult.recordset[0], inventory: invResult.recordset });
  } catch (err) {
    console.error('Get warehouse error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

//  POST /api/resources/warehouses 
router.post('/warehouses', requireRoles('Administrator', 'Warehouse Manager'), async (req, res) => {
  try {
    const { warehouse_name, capacity, street, city, managed_by } = req.body;
    if (!warehouse_name || !capacity || !city) {
      return res.status(400).json({ error: 'warehouse_name, capacity, and city are required.' });
    }
    const manager = managed_by || req.user.userId;
    const pool = getPool();
    const result = await pool.request()
      .input('managed_by',     sql.Int,          manager)
      .input('warehouse_name', sql.VarChar(100), warehouse_name)
      .input('capacity',       sql.Int,          capacity)
      .input('street',         sql.VarChar(200), street || null)
      .input('city',           sql.VarChar(200), city)
      .query(`
        INSERT INTO Warehouse (managed_by, warehouse_name, capacity, street, city)
        VALUES (@managed_by, @warehouse_name, @capacity, @street, @city);
        SELECT CAST(SCOPE_IDENTITY() AS INT) AS warehouse_id;
      `);
    return res.status(201).json({ message: 'Warehouse created.', warehouse_id: result.recordset[0].warehouse_id });
  } catch (err) {
    console.error('Create warehouse error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

//  PUT /api/resources/warehouses/:id 
router.put('/warehouses/:id', requireRoles('Administrator', 'Warehouse Manager'), async (req, res) => {
  try {
    const { warehouse_name, capacity, street, city, managed_by } = req.body;
    const pool = getPool();
    const result = await pool.request()
      .input('id',             sql.Int,          req.params.id)
      .input('warehouse_name', sql.VarChar(100), warehouse_name)
      .input('capacity',       sql.Int,          capacity)
      .input('street',         sql.VarChar(200), street)
      .input('city',           sql.VarChar(200), city)
      .input('managed_by',     sql.Int,          managed_by)
      .query(`
        UPDATE Warehouse
        SET warehouse_name = COALESCE(@warehouse_name, warehouse_name),
            capacity       = COALESCE(@capacity, capacity),
            street         = COALESCE(@street, street),
            city           = COALESCE(@city, city),
            managed_by     = COALESCE(@managed_by, managed_by)
        WHERE warehouse_id = @id
      `);
    if (result.rowsAffected[0] === 0) return res.status(404).json({ error: 'Warehouse not found.' });
    return res.json({ message: 'Warehouse updated.' });
  } catch (err) {
    console.error('Update warehouse error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

//  GET /api/resources/inventory 
router.get('/inventory', async (req, res) => {
  try {
    const pool = getPool();
    const { warehouse_id } = req.query;
    let query = `
      SELECT i.*, r.resource_name, r.resource_type, w.warehouse_name
      FROM Inventory i
      JOIN Resource r ON i.resource_id = r.resource_id
      JOIN Warehouse w ON i.warehouse_id = w.warehouse_id
      WHERE 1=1
    `;
    const request = pool.request();
    if (warehouse_id) {
      query += ' AND i.warehouse_id = @warehouse_id';
      request.input('warehouse_id', sql.Int, warehouse_id);
    }
    query += ' ORDER BY w.warehouse_name, r.resource_name';
    const result = await request.query(query);
    return res.json(result.recordset);
  } catch (err) {
    console.error('Get inventory error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

//  GET /api/resources/inventory/low-stock 
router.get('/inventory/low-stock', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request().query(`
      SELECT i.*, r.resource_name, r.resource_type, w.warehouse_name
      FROM Inventory i
      JOIN Resource r ON i.resource_id = r.resource_id
      JOIN Warehouse w ON i.warehouse_id = w.warehouse_id
      WHERE i.quantity_available <= i.threshold_level
      ORDER BY i.quantity_available ASC
    `);
    return res.json(result.recordset);
  } catch (err) {
    console.error('Get low-stock error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

//  PUT /api/resources/inventory 
router.put('/inventory', requireRoles('Administrator', 'Warehouse Manager'), async (req, res) => {
  try {
    const { warehouse_id, resource_id, quantity_available, threshold_level } = req.body;
    if (!warehouse_id || !resource_id) {
      return res.status(400).json({ error: 'warehouse_id and resource_id are required.' });
    }
    const pool = getPool();

    // Check if inventory row exists
    const existing = await pool.request()
      .input('warehouse_id', sql.Int, warehouse_id)
      .input('resource_id',  sql.Int, resource_id)
      .query('SELECT * FROM Inventory WHERE warehouse_id = @warehouse_id AND resource_id = @resource_id');

    if (existing.recordset.length === 0) {
      // Create new inventory row
      await pool.request()
        .input('warehouse_id',      sql.Int, warehouse_id)
        .input('resource_id',       sql.Int, resource_id)
        .input('quantity_available', sql.Int, quantity_available || 0)
        .input('threshold_level',   sql.Int, threshold_level || 10)
        .query(`
          INSERT INTO Inventory (warehouse_id, resource_id, quantity_available, threshold_level)
          VALUES (@warehouse_id, @resource_id, @quantity_available, @threshold_level)
        `);
      return res.status(201).json({ message: 'Inventory row created.' });
    }

    // Update existing
    await pool.request()
      .input('warehouse_id',      sql.Int, warehouse_id)
      .input('resource_id',       sql.Int, resource_id)
      .input('quantity_available', sql.Int, quantity_available)
      .input('threshold_level',   sql.Int, threshold_level)
      .query(`
        UPDATE Inventory
        SET quantity_available = COALESCE(@quantity_available, quantity_available),
            threshold_level   = COALESCE(@threshold_level, threshold_level)
        WHERE warehouse_id = @warehouse_id AND resource_id = @resource_id
      `);
    return res.json({ message: 'Inventory updated.' });
  } catch (err) {
    console.error('Update inventory error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


//  GET /api/resources/allocations 
router.get('/allocations', async (req, res) => {
  try {
    const pool = getPool();
    const { status } = req.query;
    let query = `
      SELECT a.*, u.full_name AS allocated_by_name,
             w.warehouse_name, er.area_name AS report_area
      FROM Allocation a
      JOIN Users u ON a.allocated_by = u.user_id
      LEFT JOIN Warehouse w ON a.warehouse_id = w.warehouse_id
      JOIN Emergency_Report er ON a.report_id = er.report_id
      WHERE 1=1
    `;
    const request = pool.request();
    if (status) {
      query += ' AND a.status = @status';
      request.input('status', sql.VarChar(20), status);
    }
    query += ' ORDER BY a.allocation_id DESC';
    const result = await request.query(query);
    return res.json(result.recordset);
  } catch (err) {
    console.error('Get allocations error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

//  GET /api/resources/allocations/:id 
router.get('/allocations/:id', async (req, res) => {
  try {
    const pool = getPool();
    const allocResult = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`
        SELECT a.*, u.full_name AS allocated_by_name,
               w.warehouse_name, er.area_name AS report_area
        FROM Allocation a
        JOIN Users u ON a.allocated_by = u.user_id
        LEFT JOIN Warehouse w ON a.warehouse_id = w.warehouse_id
        JOIN Emergency_Report er ON a.report_id = er.report_id
        WHERE a.allocation_id = @id
      `);
    if (allocResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Allocation not found.' });
    }
    // Get resource items
    const itemsResult = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`
        SELECT ra.*, r.resource_name, r.resource_type, r.unit_cost
        FROM Resource_Allocation ra
        JOIN Resource r ON ra.resource_id = r.resource_id
        WHERE ra.allocation_id = @id
      `);
    return res.json({ ...allocResult.recordset[0], items: itemsResult.recordset });
  } catch (err) {
    console.error('Get allocation error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

//  GET /api/resources/ 
router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const { type } = req.query;
    let query = 'SELECT * FROM Resource WHERE 1=1';
    const request = pool.request();
    if (type) {
      query += ' AND resource_type = @type';
      request.input('type', sql.VarChar(50), type);
    }
    query += ' ORDER BY resource_name';
    const result = await request.query(query);
    return res.json(result.recordset);
  } catch (err) {
    console.error('Get resources error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

//  POST /api/resources/ 
router.post('/', requireRoles('Administrator', 'Warehouse Manager'), async (req, res) => {
  try {
    const { resource_name, resource_type, unit_cost } = req.body;
    if (!resource_name || !resource_type || !unit_cost) {
      return res.status(400).json({ error: 'resource_name, resource_type, and unit_cost are required.' });
    }
    const pool = getPool();
    const result = await pool.request()
      .input('resource_name', sql.VarChar(100),   resource_name)
      .input('resource_type', sql.VarChar(50),    resource_type)
      .input('unit_cost',     sql.Decimal(10, 2), unit_cost)
      .query(`
        INSERT INTO Resource (resource_name, resource_type, unit_cost)
        VALUES (@resource_name, @resource_type, @unit_cost);
        SELECT CAST(SCOPE_IDENTITY() AS INT) AS resource_id;
      `);
    return res.status(201).json({ message: 'Resource created.', resource_id: result.recordset[0].resource_id });
  } catch (err) {
    console.error('Create resource error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

//  GET /api/resources/:id  (MUST be after all named routes)
router.get('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT * FROM Resource WHERE resource_id = @id');
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Resource not found.' });
    }
    return res.json(result.recordset[0]);
  } catch (err) {
    console.error('Get resource error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

//  PUT /api/resources/:id 
router.put('/:id', requireRoles('Administrator', 'Warehouse Manager'), async (req, res) => {
  try {
    const { resource_name, resource_type, unit_cost } = req.body;
    const pool = getPool();
    const result = await pool.request()
      .input('id',            sql.Int,            req.params.id)
      .input('resource_name', sql.VarChar(100),   resource_name)
      .input('resource_type', sql.VarChar(50),    resource_type)
      .input('unit_cost',     sql.Decimal(10, 2), unit_cost)
      .query(`
        UPDATE Resource
        SET resource_name = COALESCE(@resource_name, resource_name),
            resource_type = COALESCE(@resource_type, resource_type),
            unit_cost     = COALESCE(@unit_cost, unit_cost)
        WHERE resource_id = @id
      `);
    if (result.rowsAffected[0] === 0) return res.status(404).json({ error: 'Resource not found.' });
    return res.json({ message: 'Resource updated.' });
  } catch (err) {
    console.error('Update resource error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


module.exports = router;
