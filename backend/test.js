require("dotenv").config();
const db = require("./src/config/db");

(async () => {
  try {
    const res = await db.query("SELECT NOW()");
    console.log("Connected ✅", res.rows);
  } catch (err) {
    console.error("Error ❌", err.message);
  } finally {
    process.exit(0);
  }
})();
