const db = require("../config/db");

const closedAuctions = new Set();

setInterval(async () => {
  try {
    const rfqs = await db.query("SELECT * FROM rfqs");
    const now = new Date();

    for (let rfq of rfqs.rows) {

      if (
        rfq.status !== "CLOSED" &&
        now >= new Date(rfq.close_time) &&
        !closedAuctions.has(rfq.id)
      ) {
        await db.query("UPDATE rfqs SET status='CLOSED' WHERE id=$1", [rfq.id]);

        closedAuctions.add(rfq.id); // 🔥 prevent repeat

        if (global.io) {
          global.io.emit("auction_closed", { rfq_id: rfq.id });
        }
      }

     
      if (
        now >= new Date(rfq.forced_close_time) &&
        rfq.status !== "FORCE_CLOSED"
      ) {
        await db.query("UPDATE rfqs SET status='FORCE_CLOSED' WHERE id=$1", [rfq.id]);
      }
    }
  } catch (error) {
    console.error("Scheduler error:", error);
  }
}, 1000);
