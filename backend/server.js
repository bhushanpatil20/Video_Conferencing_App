const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

// Create HTTP server
const server = http.createServer(app);

// Attach Socket.IO to server
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});


// Socket connection
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);

    socket.to(roomId).emit("user-joined", socket.id);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});


// Use dynamic port (important for deployment later)
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log("Backend running on port", PORT);
});
