# Video_Conferencing_App
A WebRTC-based video conferencing application supporting one-to-one conference 

# Video Conferencing App
A real-time video conferencing application built using WebRTC and Socket.IO.  
This project is being developed as a placement-oriented system design and full-stack project.

---

## 🚀 Features
- One-to-one video calling
- Group video calls (planned)
- Audio / Video communication
- Screen sharing (planned)
- Real-time signaling using WebSockets
- Client-side recording (planned)

---

## 🧱 Tech Stack
**Frontend**
- React.js
- WebRTC
- Socket.IO Client

**Backend**
- Node.js
- Express.js
- Socket.IO

**Deployment**
- Backend: Render (Free tier)
- Frontend: To be deployed

---

## 🏗️ System Architecture
- Browser-based clients communicate using WebRTC (peer-to-peer)
- Socket.IO server handles signaling (offer, answer, ICE candidates)
- Media streams flow directly between clients for low latency

Frontend (React - Vercel)
|
| Socket.IO (Signaling)
|
Backend (Node + Express - Render)
|
| WebRTC (P2P Media)
|
Peer ↔ Peer

---

## 🔑 Key Engineering Concepts

- WebRTC offer/answer model
- ICE candidate exchange
- STUN/TURN servers for firewall and NAT traversal
- MediaStreamTrack control for mute/unmute and camera toggle
- Screen sharing using `RTCRtpSender.replaceTrack()`
- React state and lifecycle management
- Production deployment and environment variables

---

## 🛠️ Local Setup

### 1️⃣ Clone the repository
```bash
git clone https://github.com/<your-username>/<repository-name>.git
cd <repository-name>

---

## 🌍 Live Backend
- Backend URL: https://video-conferencing-app-4yjh.onrender.com

---

## 🛠️ Setup Instructions (Local)

### Backend
```bash
cd backend
npm install
node server.js

---

🌐 Environment Variables
REACT_APP_BACKEND_URL=https://video-conferencing-app-4yjh.onrender.com
