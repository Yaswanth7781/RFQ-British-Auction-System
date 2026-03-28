const express = require("express");
const cors = require("cors");

const rfqRoutes = require("./routes/rfqRoutes");
const bidRoutes = require("./routes/bidRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// 🔥 Routes
app.use("/rfq", rfqRoutes);
app.use("/bid", bidRoutes);

// ✅ Test route
app.get("/", (req, res) => {
  res.send("RFQ Auction API Running");
});

module.exports = app;
