import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const iceServers = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
  ],
};

const BACKEND_URL = "https://YOUR-RENDER-URL.onrender.com";

function App() {
  const videoRef = useRef(null);
  const peerConnection = useRef(null);
  const localStreamRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState("");
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    const newSocket = io("https://video-conferencing-app-4yjh.onrender.com");

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected:", newSocket.id);
    });

    newSocket.on("user-joined", async () => {
  console.log("Another user joined, creating offer...");

  // 🔹 create peer connection
  peerConnection.current = new RTCPeerConnection(iceServers);

  // 🔹 add local tracks
  localStreamRef.current.getTracks().forEach(track => {
    peerConnection.current.addTrack(track, localStreamRef.current);
  });

  // 🔹 send ICE candidates
  peerConnection.current.onicecandidate = (event) => {
    if (event.candidate) {
      newSocket.emit("ice-candidate", {
        roomId,
        candidate: event.candidate,
      });
    }
  };

  // 🔹 create OFFER
  const offer = await peerConnection.current.createOffer();
  await peerConnection.current.setLocalDescription(offer);

  // 🔹 send offer via signaling server
  newSocket.emit("offer", { roomId, offer });
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
        
        localStreamRef.current = stream;

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
