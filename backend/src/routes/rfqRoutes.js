const express = require("express");
const router = express.Router();
const rfqController = require("../controllers/rfqController");

router.post("/", rfqController.createRFQ);
router.post("/create", rfqController.createRFQ);

module.exports = router;
