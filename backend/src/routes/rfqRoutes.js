const express = require("express");
const router = express.Router();
const rfqController = require("../controllers/rfqController");

router.post("/", rfqController.createRFQ);
router.get("/", rfqController.getRFQs);
router.delete("/:id", rfqController.deleteRFQ);

module.exports = router;
