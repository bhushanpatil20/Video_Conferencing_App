import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

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

const BACKEND_URL = "https://video-conferencing-app-4yjh.onrender.com";

function App() {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const localStreamRef = useRef(null);
  const peerRef = useRef(null);
  const socketRef = useRef(null);

  const [roomId, setRoomId] = useState("");
  const [joined, setJoined] = useState(false);

  /* ---------- SOCKET ---------- */
  useEffect(() => {
    socketRef.current = io(BACKEND_URL);

    socketRef.current.on("user-joined", async () => {
      console.log("Peer joined → creating offer");
      await createPeer();
      const offer = await peerRef.current.createOffer();
      await peerRef.current.setLocalDescription(offer);
      socketRef.current.emit("offer", { roomId, offer });
    });

    socketRef.current.on("offer", async ({ offer }) => {
      console.log("Offer received");
      await createPeer();
      await peerRef.current.setRemoteDescription(offer);
      const answer = await peerRef.current.createAnswer();
      await peerRef.current.setLocalDescription(answer);
      socketRef.current.emit("answer", { roomId, answer });
    });

    socketRef.current.on("answer", async ({ answer }) => {
      console.log("Answer received");
      await peerRef.current.setRemoteDescription(answer);
    });

    socketRef.current.on("ice-candidate", async ({ candidate }) => {
      if (candidate) {
        await peerRef.current.addIceCandidate(candidate);
      }
    });

    return () => socketRef.current.disconnect();
  }, [roomId]);

  /* ---------- CAMERA ---------- */
  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localStreamRef.current = stream;
    localVideoRef.current.srcObject = stream;
  };

  /* ---------- PEER ---------- */
  const createPeer = async () => {
    if (peerRef.current) return;

    peerRef.current = new RTCPeerConnection(ICE_SERVERS);

    localStreamRef.current.getTracks().forEach(track =>
      peerRef.current.addTrack(track, localStreamRef.current)
    );

    peerRef.current.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    peerRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit("ice-candidate", {
          roomId,
          candidate: event.candidate,
        });
      }
    };
  };

  /* ---------- JOIN ---------- */
  const joinRoom = async () => {
    await startCamera();
    socketRef.current.emit("join-room", roomId);
    setJoined(true);
  };

  /* ---------- UI ---------- */
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
          <h3>Local</h3>
          <video ref={localVideoRef} autoPlay muted playsInline width="45%" />
          <h3>Remote</h3>
          <video ref={remoteVideoRef} autoPlay playsInline width="45%" />
        </>
      )}
    </div>
  );
}

export default App;

  