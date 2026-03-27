const express = require("express");
const cors = require("cors");

const rfqRoutes = require("./routes/rfqRoutes");
const bidRoutes = require("./routes/bidRoutes");

require("./utils/scheduler");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/rfq", rfqRoutes);
app.use("/bid", bidRoutes);

module.exports = app;
