require("dotenv").config();

const app = require("./src/app");
const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

global.io = io;

const port = process.env.PORT || 5000;

server.listen(port, () => {
  console.log("Server running on port", port);
});
