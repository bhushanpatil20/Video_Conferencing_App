# Video_Conferencing_App
A WebRTC-based video conferencing application supporting one-to-one and group calls with screen sharing.

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
