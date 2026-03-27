require("dotenv").config();
const db = require("./src/config/db");

(async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS rfqs (
        id SERIAL PRIMARY KEY,
        name TEXT,
        start_time TIMESTAMP,
        close_time TIMESTAMP,
        forced_close_time TIMESTAMP,
        trigger_window INT,
        extension_duration INT,
        trigger_type TEXT,
        status TEXT DEFAULT 'SCHEDULED'
      );

      CREATE TABLE IF NOT EXISTS bids (
        id SERIAL PRIMARY KEY,
        rfq_id INT REFERENCES rfqs(id),
        supplier_id INT,
        price NUMERIC,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        rfq_id INT,
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Tables created ✅");
  } catch (err) {
    console.error("Table creation failed ❌", err.message);
  } finally {
    process.exit(0);
  }
})();
