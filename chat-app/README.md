# 💬 ChatMERN — Real-Time Chat Application

A full-stack real-time chat application built with the MERN stack and Socket.io. Supports 1-to-1 messaging, group chats, file sharing, read receipts, and typing indicators.

## 🚀 Live Demo
> **Frontend:** https://chatmern.vercel.app  
> **Backend:** https://chatmern-api.onrender.com

---

## ✨ Features

- **Real-Time Messaging** — Instant 1-to-1 and group messages via Socket.io WebSockets
- **Group Chats** — Create groups, add/remove members, admin controls
- **Typing Indicators** — Live "typing..." animation when other user is typing
- **Read Receipts** — Blue tick when your message is read
- **Online/Offline Status** — Real-time presence tracking with last seen
- **File & Image Sharing** — Upload images and files via Cloudinary
- **Message Reply** — Reply to any message with quote preview
- **Message Delete** — Delete your own messages for everyone
- **JWT Authentication** — Secure login/register with protected routes
- **User Search** — Find users by name or email to start a chat
- **Responsive UI** — Clean dark theme with Tailwind CSS

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, Vite, Tailwind CSS, Zustand |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Real-Time | **Socket.io** (WebSockets) |
| Auth | JWT (JSON Web Tokens) |
| File Upload | Cloudinary + Multer |
| State Management | Zustand |
| Date Handling | date-fns |

---

## 📁 Project Structure

```
chat-app/
├── backend/
│   ├── models/           # User, Conversation, Group, Message
│   ├── controllers/      # Auth, Conversation, Group, Message, User
│   ├── routes/           # REST API routes
│   ├── middleware/       # JWT auth, Cloudinary upload
│   ├── socket/
│   │   └── socketHandler.js   # ⚡ All real-time events
│   └── server.js         # Express + Socket.io setup
│
└── frontend/
    └── src/
        ├── components/chat/   # Sidebar, ChatWindow, MessageInput
        ├── context/           # Zustand stores (auth, chat)
        ├── hooks/             # useSocket (central socket listener)
        ├── pages/             # ChatPage, LoginPage, RegisterPage
        └── utils/             # Axios instance, Socket.io singleton
```

---

## ⚡ Socket.io Events

| Event | Direction | Description |
|---|---|---|
| `message:send` | Client → Server | Send 1-to-1 message |
| `message:received` | Server → Client | Receive message |
| `group:message:send` | Client → Server | Send group message |
| `group:message:received` | Server → Client | Receive group message |
| `typing:start` / `typing:stop` | Client → Server | Typing indicators |
| `messages:read` | Client → Server | Mark messages as read |
| `user:online` | Server → Client | Online/offline status |
| `message:delete` | Client → Server | Delete a message |

---

## 🏃 Setup & Installation

### Prerequisites
- Node.js v18+
- MongoDB Atlas account
- Cloudinary account

### Backend
```bash
cd backend
npm install
cp .env.example .env      # Fill in your values
npm run dev               # Runs on http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev               # Runs on http://localhost:5173
```

### Environment Variables
```env
# backend/.env
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secret_key

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

---

## 🌐 Deployment

| Service | Platform |
|---|---|
| Frontend | Vercel |
| Backend + Socket.io | Render (Web Service) |
| Database | MongoDB Atlas |
| File Storage | Cloudinary |

> **Note:** Render supports WebSockets natively — no extra config needed for Socket.io.

---

## 👤 Author

**Saurav Satyam**  
[GitHub](https://github.com/sauravsatyam27) | [LinkedIn](https://linkedin.com/in/sauravsatyam27)
