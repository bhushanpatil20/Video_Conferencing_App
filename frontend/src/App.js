import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import "./App.css";

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

const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";


export default function App() {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerRef = useRef(null);
  const socketRef = useRef(null);
  const screenStreamRef = useRef(null);

  const [roomId, setRoomId] = useState("");
  const [joined, setJoined] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);


  /* ---------------- SOCKET ---------------- */
  useEffect(() => {
    socketRef.current = io(BACKEND_URL);

    socketRef.current.on("room-ready", async () => {
      console.log("🔥 room-ready → creating offer");
      await createPeer();
      const offer = await peerRef.current.createOffer();
      await peerRef.current.setLocalDescription(offer);
      socketRef.current.emit("offer", { roomId, offer });
    });

    socketRef.current.on("offer", async ({ offer }) => {
      console.log("📩 offer received");
      await createPeer();
      await peerRef.current.setRemoteDescription(offer);

      const answer = await peerRef.current.createAnswer();
      await peerRef.current.setLocalDescription(answer);
      socketRef.current.emit("answer", { roomId, answer });
    });

    socketRef.current.on("answer", async ({ answer }) => {
      console.log("✅ answer received");
      await peerRef.current.setRemoteDescription(answer);
    });

    socketRef.current.on("ice-candidate", async ({ candidate }) => {
      if (candidate) {
        await peerRef.current.addIceCandidate(candidate);
      }
    });

    return () => socketRef.current.disconnect();
  }, [roomId]);

  /* ---------------

  /* ---------------- PEER ---------------- */
  const createPeer = async () => {
    if (peerRef.current) return;

    peerRef.current = new RTCPeerConnection(ICE_SERVERS);

    // add local tracks FIRST
    localStreamRef.current.getTracks().forEach((track) => {
      peerRef.current.addTrack(track, localStreamRef.current);
    });

    peerRef.current.ontrack = (event) => {
      console.log("🎥 remote stream received");
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

  /* ---------------- JOIN ---------------- */
  const joinRoom = async () => {
  console.log("JOIN CLICKED");

  setJoined(true); // ✅ render video element FIRST

  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });

  localStreamRef.current = stream;

  // wait for React to paint
  setTimeout(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
  }, 0);

  socketRef.current.emit("join-room", roomId);
};

const toggleMic = () => {
  if (!localStreamRef.current) return;

  localStreamRef.current.getAudioTracks().forEach(track => {
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
  });
};

const toggleCamera = () => {
  if (!localStreamRef.current) return;

  localStreamRef.current.getVideoTracks().forEach(track => {
    track.enabled = !track.enabled;
    setCamOn(track.enabled);
  });
};

const startScreenShare = async () => {
  try {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
    });

    screenStreamRef.current = screenStream;
    setScreenSharing(true);

    const screenTrack = screenStream.getVideoTracks()[0];

    // Replace video track being sent to peer
    const sender = peerRef.current
      .getSenders()
      .find((s) => s.track.kind === "video");

    if (sender) {
      sender.replaceTrack(screenTrack);
    }

    // Show screen locally
    localVideoRef.current.srcObject = screenStream;

    // When user stops screen sharing
    screenTrack.onended = stopScreenShare;
  } catch (err) {
    console.error("Screen share error:", err);
  }
};

const stopScreenShare = () => {
  const cameraTrack = localStreamRef.current.getVideoTracks()[0];

  const sender = peerRef.current
    .getSenders()
    .find((s) => s.track.kind === "video");

  if (sender) {
    sender.replaceTrack(cameraTrack);
  }

  localVideoRef.current.srcObject = localStreamRef.current;
  setScreenSharing(false);

  if (screenStreamRef.current) {
    screenStreamRef.current.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
  }
};

  /* ---------------- UI ---------------- */

// return (
//   <div style={styles.app}>
//     {!joined ? (
//       <div style={styles.joinBox}>
//         <h1 style={styles.title}>Video Conferencing App</h1>

//         <input
//           value={roomId}
//           onChange={(e) => setRoomId(e.target.value)}
//           placeholder="Enter Room ID"
//           style={styles.input}
//         />

//         <button onClick={joinRoom} style={styles.primaryBtn}>
//           Join Room
//         </button>
//       </div>
//     ) : (
//       <>
//         {/* Header */}
//         <div style={styles.header}>
//           <h3>Room: {roomId}</h3>
//         </div>

//         {/* Videos */}
//         <div style={styles.videoGrid}>
//           <video
//             ref={remoteVideoRef}
//             autoPlay
//             playsInline
//             style={styles.video}
//           />

//           <video
//             ref={localVideoRef}
//             autoPlay
//             muted
//             playsInline
//             style={styles.localVideo}
//           />
//         </div>

//         {/* Controls */}
//         <div style={styles.controls}>
//           <button onClick={toggleMic} style={styles.controlBtn}>
//             {micOn ? "🎤 Mute" : "🔇 Unmute"}
//           </button>

//           <button onClick={toggleCamera} style={styles.controlBtn}>
//             {camOn ? "🎥 Camera Off" : "📷 Camera On"}
//           </button>

//           <button style={styles.leaveBtn}>⛔ Leave</button>
//         </div>
//       </>
//     )}
//   </div>
// );
// }

return (
  <div className="app">
    {!joined ? (
      <div className="join-card">
        <h1>Join a Room</h1>
        <input
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          placeholder="Enter Room ID"
        />
        <button onClick={joinRoom}>Join</button>
      </div>
    ) : (
      <div className="call-container">
        <div className="videos">
          <video ref={remoteVideoRef} autoPlay playsInline className="remote-video" />
          <video ref={localVideoRef} autoPlay muted playsInline className="local-video" />
        </div>

        <div className="controls">
          <button onClick={toggleMic}>
            {micOn ? "Mute 🎙️" : "Unmute 🔇"}
          </button>
          <button onClick={toggleCamera}>
            {camOn ? "Camera Off 📷" : "Camera On 🎥"}
          </button>
        </div>
      </div>
    )}
  </div>
);
}

const styles = {
  app: {
    backgroundColor: "#0f172a",
    color: "#e5e7eb",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },

  joinBox: {
    marginTop: "20vh",
    background: "#111827",
    padding: "40px",
    borderRadius: "12px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
    textAlign: "center",
  },

  title: {
    marginBottom: "20px",
  },

  input: {
    padding: "12px",
    width: "250px",
    borderRadius: "6px",
    border: "none",
    marginBottom: "15px",
    fontSize: "16px",
  },

  primaryBtn: {
    padding: "12px 24px",
    borderRadius: "6px",
    border: "none",
    background: "#3b82f6",
    color: "white",
    cursor: "pointer",
    fontSize: "16px",
  },

  header: {
    width: "100%",
    padding: "15px",
    textAlign: "center",
    background: "#020617",
  },

  videoGrid: {
    position: "relative",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginTop: "20px",
  },

  video: {
    width: "70vw",
    maxHeight: "70vh",
    borderRadius: "12px",
    background: "black",
  },

  localVideo: {
    position: "absolute",
    bottom: "20px",
    right: "20px",
    width: "200px",
    borderRadius: "10px",
    border: "2px solid #3b82f6",
    background: "black",
  },

  controls: {
    position: "fixed",
    bottom: "30px",
    display: "flex",
    gap: "15px",
    background: "#020617",
    padding: "15px 25px",
    borderRadius: "50px",
  },

  controlBtn: {
    padding: "10px 16px",
    borderRadius: "999px",
    border: "none",
    background: "#1f2933",
    color: "white",
    cursor: "pointer",
  },

  leaveBtn: {
    padding: "10px 18px",
    borderRadius: "999px",
    border: "none",
    background: "#ef4444",
    color: "white",
    cursor: "pointer",
  },
};

