const sql = require('mssql');
require('dotenv').config();

const config = {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'Novaera',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '',
  port: 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    instanceName: process.env.DB_SERVER?.includes('\\') ? process.env.DB_SERVER.split('\\')[1] : undefined
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// If using named instance, remove port and use instance name
if (process.env.DB_SERVER?.includes('\\')) {
  config.server = process.env.DB_SERVER.split('\\')[0];
  delete config.port;
}

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('Connected to SQL Server');
    return pool;
  })
  .catch(err => {
    console.error('Database connection failed:', err);
    throw err;
  });

const getPool = async () => {
  const pool = await poolPromise;
  if (!pool) throw new Error('Database pool not available');
  return pool;
};

module.exports = { sql, poolPromise, getPool };
