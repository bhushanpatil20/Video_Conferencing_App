import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const iceServers = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

const BACKEND_URL = "https://video-conferencing-app-4yjh.onrender.com";

function App() {
  // 🔹 Refs
  const videoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const localStreamRef = useRef(null);

  // 🔹 State
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState("");
  const [joined, setJoined] = useState(false);

  // 🔹 SOCKET SETUP
  useEffect(() => {
    const newSocket = io(BACKEND_URL);
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected:", newSocket.id);
    });

    // USER JOINED → CREATE OFFER
    newSocket.on("user-joined", async () => {
      console.log("Another user joined, creating offer");

      peerConnection.current = new RTCPeerConnection(iceServers);

      localStreamRef.current.getTracks().forEach(track =>
        peerConnection.current.addTrack(track, localStreamRef.current)
      );

      peerConnection.current.ontrack = event => {
        remoteVideoRef.current.srcObject = event.streams[0];
      };

      peerConnection.current.onicecandidate = event => {
        if (event.candidate) {
          newSocket.emit("ice-candidate", {
            roomId,
            candidate: event.candidate,
          });
        }
      };

      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      newSocket.emit("offer", { roomId, offer });
    });

    // RECEIVE OFFER → CREATE ANSWER
    newSocket.on("offer", async ({ offer }) => {
      console.log("Offer received");

      peerConnection.current = new RTCPeerConnection(iceServers);

      localStreamRef.current.getTracks().forEach(track =>
        peerConnection.current.addTrack(track, localStreamRef.current)
      );

      peerConnection.current.ontrack = event => {
        remoteVideoRef.current.srcObject = event.streams[0];
      };

      peerConnection.current.onicecandidate = event => {
        if (event.candidate) {
          newSocket.emit("ice-candidate", {
            roomId,
            candidate: event.candidate,
          });
        }
      };

      await peerConnection.current.setRemoteDescription(offer);

      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      newSocket.emit("answer", { roomId, answer });
    });

    // RECEIVE ANSWER
    newSocket.on("answer", async ({ answer }) => {
      console.log("Answer received");
      await peerConnection.current.setRemoteDescription(answer);
    });

    // RECEIVE ICE
    newSocket.on("ice-candidate", async ({ candidate }) => {
      if (candidate) {
        await peerConnection.current.addIceCandidate(candidate);
      }
    });

    return () => newSocket.disconnect();
  }, [roomId]);

  // 🔹 CAMERA SETUP
  useEffect(() => {
    if (!joined) return;

    async function startCamera() {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localStreamRef.current = stream;
      videoRef.current.srcObject = stream;
    }

    startCamera();
  }, [joined]);

  // 🔹 JOIN ROOM
  const joinRoom = () => {
    if (roomId && socket) {
      socket.emit("join-room", roomId);
      setJoined(true);
    }
  };

  // 🔹 UI
  return (
    <div style={{ textAlign: "center", marginTop: 40 }}>
      {!joined ? (
        <>
          <h2>Join Room</h2>
          <input
            value={roomId}
            onChange={e => setRoomId(e.target.value)}
            placeholder="Room ID"
          />
          <button onClick={joinRoom}>Join</button>
        </>
      ) : (
        <>
          <h2>Local Video</h2>
          <video ref={videoRef} autoPlay muted playsInline width="45%" />
          <h2>Remote Video</h2>
          <video ref={remoteVideoRef} autoPlay playsInline width="45%" />
        </>
      )}
    </div>
  );
}

export default App;

  