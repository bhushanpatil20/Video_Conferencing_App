import React, { useEffect, useRef } from "react";
import { io } from "socket.io-client";

const BACKEND_URL = "https://video-conferencing-app-4yjh.onrender.com";

function App() {
  const videoRef = useRef(null);

  useEffect(() => {
    // 1️⃣ Connect to backend
    const socket = io(BACKEND_URL);

    socket.on("connect", () => {
      console.log("Connected to backend with socket id:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from backend");
    });

    // 2️⃣ Get camera
    async function getCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Camera error:", err);
      }
    }

    getCamera();

    // cleanup
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "40px" }}>
      <h2>Video Conferencing App</h2>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{ width: "60%", border: "2px solid black" }}
      />
    </div>
  );
}

export default App;

