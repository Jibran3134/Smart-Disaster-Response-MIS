const sql = require('mssql');

// .env has "JIBRAN-PC\SQLEXPRESS"
// We need to split that into server + instance
const serverRaw = process.env.DB_SERVER || 'localhost';
const parts = serverRaw.split('\\');
const serverName = parts[0];                 
const instanceName = parts.length > 1 ? parts[1] : undefined; 

// Centralized DB config, all credentials loaded from .env (security best practice)
const config = {
  server:   serverName,
  database: process.env.DB_NAME || 'DisasterResponseDB',
  options: {
    encrypt: false,                    
    trustServerCertificate: true,      
    instanceName: instanceName,       
  },
  port: instanceName ? undefined : 1433,
};

//  SQL Auth
if (process.env.DB_TRUSTED_CONNECTION === 'true') {
  config.options.trustedConnection = true;
} else {
  config.user     = process.env.DB_USER;
  config.password = process.env.DB_PASSWORD;
}

// Connection Pooling — reuses a shared pool of connections so
// multiple concurrent API requests are handled gracefully without opening/closing connections repeatedly
let pool;

async function connectDB() {
  if (!pool) {
    pool = await sql.connect(config);
  }
  return pool;
}
function getPool() {
  if (!pool) throw new Error('Database not connected. Call connectDB() first.');
  return pool;
}

module.exports = { connectDB, getPool, sql };
