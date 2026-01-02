import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const BACKEND_URL = "https://YOUR-RENDER-URL.onrender.com";

function App() {
  const videoRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState("");
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    const newSocket = io("https://video-conferencing-app-4yjh.onrender.com", {
  transports: ["polling", "websocket"],
});


    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected:", newSocket.id);
    });

    newSocket.on("user-joined", (id) => {
      console.log("Another user joined:", id);
    });

    return () => newSocket.disconnect();
  }, []);

  // 🎥 Start camera ONLY after join
  useEffect(() => {
    if (!joined) return;

    async function getCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera error:", err);
      }
    }

    getCamera();
  }, [joined]);

  const joinRoom = () => {
    if (roomId && socket) {
      socket.emit("join-room", roomId);
      setJoined(true);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "40px" }}>
      {!joined ? (
        <>
          <h2>Join Room</h2>
          <input
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Enter Room ID"
          />
          <button onClick={joinRoom}>Join</button>
        </>
      ) : (
        <>
          <h2>Room: {roomId}</h2>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{ width: "60%", border: "2px solid black" }}
          />
        </>
      )}
    </div>
  );
}

export default App;
