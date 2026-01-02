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
  return (
    <div style={{ textAlign: "center", marginTop: 30 }}>
      {!joined ? (
        <>
          <h2>Join Room</h2>
          <input
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Room ID"
          />
          <button onClick={joinRoom}>Join</button>
          <button
  onClick={screenSharing ? stopScreenShare : startScreenShare}
  style={{ marginLeft: 10 }}
>
  {screenSharing ? "Stop Sharing 🛑" : "Share Screen 🖥️"}
</button>

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

    <div style={{ marginTop: 20 }}>
      <button onClick={toggleMic}>
        {micOn ? "Mute Mic 🔇" : "Unmute Mic 🎤"}
      </button>

      <button onClick={toggleCamera} style={{ marginLeft: 10 }}>
        {camOn ? "Turn Camera Off 🎥" : "Turn Camera On 📷"}
      </button>
    </div>
  </>
)
}
    </div>
  );
}
