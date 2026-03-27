const express = require("express");
const router = express.Router();
const bidController = require("../controllers/bidController");

router.post("/", bidController.placeBid);

module.exports = router;
