const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',          // your local PG username
  host: 'localhost',         // always localhost for local DB
  database: 'splitpaydb',       // your local DB name
  password: 'Krish1234', // your local PG password
  port: 5433                 // default PG port
  // no SSL for local
});

module.exports = pool;
