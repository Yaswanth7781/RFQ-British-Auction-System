const { Pool } = require("pg");

const pool = new Pool({
  connectionString: "postgresql://yaswanth:D4hSwVoBO56MiHMfbZgsA25D0MWBS34F@dpg-d7np1rpkh4rs73bbktb0-a.oregon-postgres.render.com/rfq_db",
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params)
};
