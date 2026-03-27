const db = require("../config/db");

exports.placeBid = async (req, res) => {
  try {
    const { rfq_id, supplier_id, price } = req.body;

    const rfqResult = await db.query("SELECT * FROM rfqs WHERE id=$1", [rfq_id]);
    const rfq = rfqResult.rows[0];

    if (!rfq) return res.status(404).send("RFQ not found");

    const now = new Date();

    if (now > new Date(rfq.forced_close_time)) {
      return res.status(400).send("Auction closed");
    }

    await db.query(
      "INSERT INTO bids (rfq_id, supplier_id, price) VALUES ($1,$2,$3)",
      [rfq_id, supplier_id, price]
    );

    const bids = await db.query(
      "SELECT * FROM bids WHERE rfq_id=$1 ORDER BY price ASC, created_at ASC",
      [rfq_id]
    );

    const inTriggerWindow =
      now >= new Date(rfq.close_time) - rfq.trigger_window * 60000;

    let newClose = new Date(rfq.close_time);

    if (inTriggerWindow) {
      let extended =
        new Date(rfq.close_time).getTime() +
        rfq.extension_duration * 60000;

      if (extended > new Date(rfq.forced_close_time).getTime()) {
        extended = new Date(rfq.forced_close_time).getTime();
      }

      newClose = new Date(extended);

      await db.query("UPDATE rfqs SET close_time=$1 WHERE id=$2", [
        newClose,
        rfq_id
      ]);
    }

    if (global.io) {
      global.io.emit("auction_update", {
        bids: bids.rows,
        close_time: newClose
      });
    }

    res.send("Bid placed");
  } catch (error) {
    console.error("placeBid error:", error);
    res.status(500).send("Unable to place bid");
  }
};
