import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

/* ================= ICE SERVERS ================= */
const iceServers = {
  iceServers: [
    {
      urls: "stun:stun.relay.metered.ca:80",
    },
    {
      urls: "turn:global.relay.metered.ca:80",
      username: "e18d81096242f7d0c0dbd194",
      credential: "I6SLjCDUbeI0mvUa",
    },
    {
      urls: "turn:global.relay.metered.ca:443",
      username: "e18d81096242f7d0c0dbd194",
      credential: "I6SLjCDUbeI0mvUa",
    },
  ],
};

const BACKEND_URL = "https://video-conferencing-app-4yjh.onrender.com";

/* ================= APP ================= */
function App() {
  // Video refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // WebRTC refs
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);

  // State
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState("");
  const [joined, setJoined] = useState(false);

  /* ================= SOCKET SETUP ================= */
  useEffect(() => {
    const newSocket = io(BACKEND_URL);
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
    });

    /* ---------- USER JOINED → CREATE OFFER ---------- */
    newSocket.on("user-joined", async () => {
      console.log("User joined → creating offer");

      createPeerConnection(newSocket);

      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);

      newSocket.emit("offer", { roomId, offer });
    });

    /* ---------- RECEIVE OFFER → CREATE ANSWER ---------- */
    newSocket.on("offer", async ({ offer }) => {
      console.log("Offer received");

      createPeerConnection(newSocket);

      await peerConnectionRef.current.setRemoteDescription(offer);

      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);

      newSocket.emit("answer", { roomId, answer });
    });

    /* ---------- RECEIVE ANSWER ---------- */
    newSocket.on("answer", async ({ answer }) => {
      console.log("Answer received");
      await peerConnectionRef.current.setRemoteDescription(answer);
    });

    /* ---------- RECEIVE ICE ---------- */
    newSocket.on("ice-candidate", async ({ candidate }) => {
      if (candidate) {
        await peerConnectionRef.current.addIceCandidate(candidate);
      }
    });

    return () => newSocket.disconnect();
  }, [roomId]);

  /* ================= CAMERA ================= */
  useEffect(() => {
    if (!joined) return;

    async function startCamera() {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localStreamRef.current = stream;
      localVideoRef.current.srcObject = stream;
    }

    startCamera();
  }, [joined]);

  /* ================= CREATE PEER CONNECTION ================= */
  const createPeerConnection = (socket) => {
    peerConnectionRef.current = new RTCPeerConnection(iceServers);

    // Reset remote stream
    remoteStreamRef.current = new MediaStream();
    remoteVideoRef.current.srcObject = remoteStreamRef.current;

    // Add local tracks
    localStreamRef.current.getTracks().forEach((track) => {
      peerConnectionRef.current.addTrack(track, localStreamRef.current);
    });

    // Receive remote tracks
    peerConnectionRef.current.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStreamRef.current.addTrack(track);
      });
    };

    // ICE candidates
    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          roomId,
          candidate: event.candidate,
        });
      }
    };
  };

  /* ================= JOIN ROOM ================= */
  const joinRoom = () => {
    if (roomId && socket) {
      socket.emit("join-room", roomId);
      setJoined(true);
    }
  };

  /* ================= UI ================= */
  return (
    <div style={{ textAlign: "center", marginTop: 40 }}>
      {!joined ? (
        <>
          <h2>Join Room</h2>
          <input
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Room ID"
          />
          <button onClick={joinRoom}>Join</button>
        </>
      ) : (
        <>
          <h2>Local Video</h2>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            disablePictureInPicture
            width="45%"
          />

          <h2>Remote Video</h2>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            disablePictureInPicture
            width="45%"
          />
        </>
      )}
    </div>
  );
}

export default App;

  