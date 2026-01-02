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
  socket.on("offer", ({ roomId, offer }) => {
  socket.to(roomId).emit("offer", { offer });
});

socket.on("answer", ({ roomId, answer }) => {
  socket.to(roomId).emit("answer", { answer });
});

  console.log("User connected:", socket.id);

  socket.on("join-room", async (roomId) => {
  socket.join(roomId);

  const clients = await io.in(roomId).fetchSockets();

  if (clients.length === 2) {
    // Tell ONLY the first user to start WebRTC
    socket.to(roomId).emit("room-ready");
  }
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
