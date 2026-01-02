const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

// Create HTTP server
const server = http.createServer(app);

// Attach Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// 🔑 Track number of users per room
const rooms = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // 🔹 Join room
  socket.on("join-room", (roomId) => {
    socket.join(roomId);

    const count = rooms.get(roomId) || 0;
    rooms.set(roomId, count + 1);

    console.log(`Room ${roomId} count:`, rooms.get(roomId));

    // 🔥 Start WebRTC ONLY when second user joins
    if (rooms.get(roomId) === 2) {
      console.log("🔥 EMITTING room-ready");
      socket.to(roomId).emit("room-ready");
    }
  });

  // 🔹 Forward offer
  socket.on("offer", ({ roomId, offer }) => {
    socket.to(roomId).emit("offer", { offer });
  });

  // 🔹 Forward answer
  socket.on("answer", ({ roomId, answer }) => {
    socket.to(roomId).emit("answer", { answer });
  });

  // 🔹 Forward ICE candidates
  socket.on("ice-candidate", ({ roomId, candidate }) => {
    socket.to(roomId).emit("ice-candidate", { candidate });
  });

  // 🔹 Handle disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    for (const [roomId, count] of rooms.entries()) {
      if (count > 0) {
        rooms.set(roomId, count - 1);
      }
    }
  });
});

// Use Render dynamic port
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log("Backend running on port", PORT);
});
