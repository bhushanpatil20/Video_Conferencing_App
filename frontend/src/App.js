import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

/* ================= ICE SERVERS ================= */
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.relay.metered.ca:80" },
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

/* ================= SOCKET (ONLY ONCE) ================= */
const socket = io("https://video-conferencing-app-4yjh.onrender.com", {
  transports: ["websocket"],
});

function App() {
  /* ================= REFS ================= */
  const socketRef = useRef(socket);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  /* ================= STATE ================= */
  const [roomId, setRoomId] = useState("");
  const [joined, setJoined] = useState(false);

 // eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => {
  const s = socketRef.current;

  s.on("connect", () => {
    console.log("Connected:", s.id);
  });

  s.on("room-ready", async () => {
    console.log("🔥 ROOM READY RECEIVED");

    await createPeer();

    const offer = await peerRef.current.createOffer();
    await peerRef.current.setLocalDescription(offer);

    s.emit("offer", { roomId, offer });
  });

  s.on("offer", async ({ offer }) => {
    await createPeer();
    await peerRef.current.setRemoteDescription(offer);

    const answer = await peerRef.current.createAnswer();
    await peerRef.current.setLocalDescription(answer);

    s.emit("answer", { roomId, answer });
  });

  s.on("answer", async ({ answer }) => {
    await peerRef.current.setRemoteDescription(answer);
  });

  s.on("ice-candidate", async ({ candidate }) => {
    if (candidate && peerRef.current) {
      await peerRef.current.addIceCandidate(candidate);
    }
  });

  return () => s.off();
}, [roomId]);

  /* ================= CAMERA ================= */
  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    localStreamRef.current = stream;
    localVideoRef.current.srcObject = stream;
  };

  /* ================= PEER CONNECTION ================= */
  const createPeer = async () => {
    if (peerRef.current) return;

    peerRef.current = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks
    localStreamRef.current.getTracks().forEach((track) => {
      peerRef.current.addTrack(track, localStreamRef.current);
    });

    // Receive remote stream
    peerRef.current.ontrack = (event) => {
      console.log("🎥 Remote track received");
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    // ICE candidates
    peerRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit("ice-candidate", {
          roomId,
          candidate: event.candidate,
        });
      }
    };
  };

  /* ================= JOIN ROOM ================= */
  const joinRoom = async () => {
    console.log("JOINING ROOM:", roomId.trim());

    await startCamera();
    socketRef.current.emit("join-room", roomId.trim());
    setJoined(true);
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
          <h3>Local Video</h3>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            width="45%"
          />

          <h3>Remote Video</h3>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            width="45%"
          />
        </>
      )}
    </div>
  );
}

export default App;
