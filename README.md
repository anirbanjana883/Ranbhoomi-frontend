# 🏹 Ranbhoomi – Scalable Competitive Programming & Interview Platform (Frontend)

**Ranbhoomi** is a high-performance, production-grade frontend for a comprehensive **competitive programming** and **real-time interview preparation** platform.

Built for **speed, scalability, and real-time collaboration**, the frontend leverages **React 19**, **Vite 7**, and **Tailwind CSS v4** to deliver a seamless experience across complex interactive interfaces.

---

## 🛠️ Tech Stack & Dependencies

### 🔹 Core
- **React 19**
- **Vite 7**

### 🔹 State Management
- **Redux Toolkit v2**

### 🔹 Routing
- **React Router v7**

### 🔹 Styling & Animation
- **Tailwind CSS v4**
- **Framer Motion**

### 🔹 Code Editor
- **CodeMirror 6**
  - Multi-language support (C++, Java, Python, JavaScript)
  - Multiple themes (Dracula, VSCode, GitHub)

### 🔹 Real-Time
- **Socket.IO Client v4**
- **WebRTC**

### 🔹 Whiteboard
- **tldraw**

### 🔹 Data Visualization
- **Recharts**
- **react-calendar-heatmap**

### 🔹 Markdown Rendering
- **react-markdown**
- **remark-gfm**
- **DOMPurify**

### 🔹 Auth & Backend Integration
- **Firebase v12 (Google OAuth)**
- **Axios**

---

## 🚀 Key Features

---

### 💻 Advanced Problem Solving Engine

- **CodeMirror 6 Integration**
  - Supports multiple programming languages
  - Theme switching (Dracula, GitHub, VSCode)

- **Split-Pane Layout**
  - Resizable panels for:
    - Problem description
    - Code editor
    - Console / output

- **Rich Markdown Rendering**
  - Problems rendered using `react-markdown`
  - Sanitized using `DOMPurify` to prevent XSS

- **Activity Graph**
  - GitHub-style streak tracking
  - Powered by `react-calendar-heatmap`

---

### 🎙️ Real-Time Interview Environment

- **WebRTC-powered Video Calls**
  - Floating & draggable video tiles
  - Optimized for low latency

- **Synchronized Code Editor**
  - Live pair programming
  - Real-time cursor & code sync via Socket.IO

- **Infinite Whiteboard**
  - Real-time collaborative sketching
  - Powered by `tldraw`

- **Dynamic Tab Synchronization**
  - Editor tabs and language selections synced across peers

---

### 🏆 Contest Arena

- **Live Countdown Timers**
  - Server-time synced using `date-fns`

- **Dynamic Real-Time Leaderboards**
  - Auto-updating ranks during contests

- **Contest Rating Graphs**
  - User progress & performance analytics
  - Visualized using `Recharts`

---

### 🤖 Context-Aware AI Assistant

- **Gemini-powered AI Chat Panel**
  - Embedded directly inside the coding environment

- **Context Awareness**
  - Understands:
    - Current problem
    - User’s code
    - Language & constraints

- **Premium Lock**
  - Feature gating based on subscription quota
  - Clean UI-based access control

---

### 🔐 Secure & Dynamic Routing

- **Role-Based Access Control (RBAC)**
  - User
  - Admin
  - Master

- **Protected Routes**
  - Authentication-aware routing

- **Google OAuth**
  - Seamless login via Firebase

- **Secure API Requests**
  - Axios interceptors for JWT handling

---

## 🏗️ High-Level Architecture
```

User Interface (React 19 + Vite 7)
│
├── Routing Layer (React Router v7)
│ ├── Public Routes (Login, Signup, Home)
│ ├── Protected Routes (User Profile, Problems)
│ └── Admin Routes (MasterRoute, AdminRoute)
│
├── State Management (Redux Toolkit)
│ ├── User Slice (Auth, Roles, Preferences)
│ └── UI Slice (Theme, Modals, Loading States)
│
├── Real-Time Layer
│ ├── WebRTC (Peer-to-Peer Video/Audio)
│ └── Socket.IO (Editor Sync, Signaling, Chat)
│
└── Data Layer
├── Axios Interceptors (JWT passing)
└── Backend API Gateway

```



## 🗂️ Project Structure
```

ranbhoomi-frontend/
├── public/ # Static assets
├── src/
│ ├── assets/ # Images, icons
│ ├── component/ # Reusable UI components
│ │ ├── adminComponents/
│ │ ├── ContestPageComponent/
│ │ ├── InterviewPageComponent/ # tldraw, CodeMirror, WebRTC
│ │ └── ProblemPageComponent/ # Markdown, Console, Splitters
│ ├── customHooks/ # Shared hooks (useGetCurrentUser)
│ ├── pages/ # Route-level pages
│ │ ├── authenticationPages/
│ │ ├── contestPages/
│ │ ├── interviewPages/
│ │ └── problemPages/
│ ├── redux/ # Redux store & slices
│ ├── utils/ # Constants, Firebase config, mock data
│ ├── App.jsx # App router
│ └── main.jsx # React root
├── .gitignore
├── eslint.config.js # ESLint 9
├── package.json
└── vite.config.js # Tailwind v4 & Vite config


```

## 🔗 Core Routes (High-Level)

### 👤 Public & Auth Routes

| Route | Component | Description |
|------|----------|-------------|
| `/` | Home.jsx | Landing page |
| `/login` | Login.jsx | User login |
| `/signup` | SignUp.jsx | User registration |
| `/pricing` | PricingPage.jsx | Subscription plans |

---

### 🛠️ Core Application Routes

| Route | Component | Description |
|------|----------|-------------|
| `/problems` | ProblemListPage.jsx | Filterable problem list |
| `/problems/:slug` | ProblemPage.jsx | Editor, Console, AI Chat |
| `/contests` | ContestListPage.jsx | Available contests |
| `/contests/:slug` | ContestInterface.jsx | Live contest arena |
| `/interview/:roomId` | InterviewRoom.jsx | Editor + Video + Whiteboard |
| `/community` | Community.jsx | Social feed |
| `/roadmap` | RoadmapListPage.jsx | Learning guides |

---

## ⚙️ Setup Instructions (Local)

### 1️⃣ Prerequisites
- Node.js **≥ 18**
- npm or yarn

---

### 2️⃣ Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000

# Firebase Config
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id

```
## ⚙️ Setup Instructions (Local)

### 3️⃣ Install Dependencies
```bash
npm install
```
### 4️⃣ Run Development Server
```bash
npm run dev
```
### 5️⃣ Build for Production
```bash
npm run build
```


**🧠 What This Frontend Demonstrates**
- ✅ Real-time peer-to-peer collaboration (WebRTC + Socket.IO)
- ✅ Complex editor & whiteboard integrations (CodeMirror 6 + tldraw)
- ✅ Advanced data visualization & analytics (Recharts, Heatmaps)
- ✅ Secure, scalable routing & authentication architecture
- ✅ Production-level AI integration inside coding workflows