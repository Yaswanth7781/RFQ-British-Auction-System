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

    const result = await db.query(
      `INSERT INTO rfqs 
      (name, start_time, close_time, forced_close_time, trigger_window, extension_duration, trigger_type)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
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
    console.error("createRFQ error:", error);
    res.status(500).send("Unable to create RFQ");
  }
};
