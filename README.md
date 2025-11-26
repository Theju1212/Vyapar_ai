✅ 1. README for Frontend (Vyapar_ai — Client)

📌 Repo: https://github.com/Theju1212/Vyapar_ai

VyapaarAI — Frontend (React)

Smart AI-powered dashboard for Kirana shops and small businesses.
This frontend provides interfaces for inventory tracking, AI chatbot, stock alerts, expiry alerts, analytics dashboards, and daily PDF report generation.

📌 Features (Frontend)

AI Chatbot (English)

Inventory management UI

Alerts for low stock & expiry

Daily insights dashboard

Sales analytics charts (Bar, Line, Pie)

Multilingual support

Seamless communication with backend AI Engine

🛠️ Tech Stack
Category	Tools
Frontend Framework	React.js
State Management	useState, useMemo
UI / Animations	Custom CSS, Framer Motion
API Handling	Axios
Charts	Recharts
Multilingual Chatbot	OpenAI / NLP APIs (via backend)
📁 Project Structure
Vyapar_ai/
│── public/
│── src/
│   ├── components/
│   ├── pages/
│   ├── context/
│   ├── hooks/
│   ├── utils/
│   ├── assets/
│   └── App.jsx
│
└── package.json

🚀 Getting Started
1️⃣ Install dependencies
npm install

2️⃣ Create .env file

Create a file:

VITE_BACKEND_URL=http://localhost:5000


(Use your actual backend URL.)

3️⃣ Run development server
npm run dev


Frontend runs at:

http://localhost:5173

🔗 Backend Connection

The frontend connects with the backend here:
src/utils/api.js → uses Axios baseURL from the .env.

🤖 AI Features (Handled via Backend)

Frontend triggers backend AI routes for:

Stock prediction

Expiry alerts

Chatbot responses

Automatic report generation

📸 Screenshots

Add these screenshots from your slides:

Architecture

Technical Approach

AI Integration

Impact & Benefits

Place inside:

/docs/images/

📄 License

MIT License.