const express = require("express");
const router = express.Router();
const rfqController = require("../controllers/rfqController");


router.post("/", rfqController.createRFQ);
router.post("/create", rfqController.createRFQ);

router.get("/", rfqController.getRFQs);

module.exports = router;
