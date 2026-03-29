const db = require("../config/db");

exports.createRFQ = async (req, res) => {
  try {
    const {
      name,
      start_time,
      close_time,
      forced_close_time,
      trigger_window,
      extension_duration,
      trigger_type
    } = req.body;

    const existing = await db.query(
      "SELECT 1 FROM rfqs WHERE LOWER(name) = LOWER($1)",
      [name]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        error: "Auction with this name already exists"
      });
    }

    const result = await db.query(
      `INSERT INTO rfqs 
      (name, start_time, close_time, forced_close_time, trigger_window, extension_duration, trigger_type, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,'SCHEDULED')
      RETURNING *`,
      [
        name,
        start_time,
        close_time,
        forced_close_time,
        trigger_window,
        extension_duration,
        trigger_type
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to create RFQ" });
  }
};


exports.getRFQs = async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM rfqs ORDER BY id DESC");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch RFQs" });
  }
};

exports.deleteRFQ = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query("DELETE FROM bids WHERE rfq_id=$1", [id]);
    await db.query("DELETE FROM rfqs WHERE id=$1", [id]);

    res.json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Delete failed" });
  }
};
