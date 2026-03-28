require("dotenv").config();

const app = require("./src/app");
const http = require("http");
const { Server } = require("socket.io");

// 🔥 Import scheduler (IMPORTANT)
require("./src/utils/scheduler");

const server = http.createServer(app);

// 🔥 Setup socket
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

global.io = io;

// 🔥 Optional: connection log
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
});

// 🔥 Port fix
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
