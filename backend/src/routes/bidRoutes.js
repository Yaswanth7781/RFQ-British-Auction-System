const express = require("express");
const router = express.Router();
const bidController = require("../controllers/bidController");

router.post("/", bidController.placeBid);

router.get("/:rfq_id", bidController.getBidsByRfq);

module.exports = router;
