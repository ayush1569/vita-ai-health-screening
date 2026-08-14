# Vita AI — Health Screening & Intake Web Application
> Project Assessment Submission for **Sasahyog Technologies**

Vita AI is a full-stack real-time voice application designed for preliminary patient health intake and screening. It allows patients to talk naturally in English or Hindi, collects key clinical symptoms through an adaptive Q&A flow, and compiles a structured health summary report for attending physicians.

---

## 📌 Project Architecture & Highlights

- **Real-Time Voice Call Interface**: Uses WebSocket (`ws`) bi-directional audio transport with live Web Audio frequency visualization. Includes dedicated **Push to Speak**, **Done Speaking**, and **Barge-in (Interrupt AI)** controls.
- **Conversational Intake Specialist (Dr. Vita)**: Asks one screening question at a time (Name, Chief Complaint, Duration/Onset, Severity 1–10, Associated Symptoms, History) and adapts if answers are vague.
- **Bilingual English & Hindi Support**: Auto-detects patient language and responds fluently in either English or Hindi.
- **Structured Clinical Intake Report**: Generates a doctor summary chart with Severity Score (1–10), Triage Priority Level, Symptom Tags, Risk Flags, and Recommended Next Steps.
- **Zero-Config Fallback Engine**: Works out-of-the-box using browser Web Speech APIs if no external API key is provided, or integrates with OpenAI (Whisper + GPT-4o-mini + TTS) when an API key is configured.

---

## 📂 Folder Structure

```
project assessment ssahyog/
├── frontend/                  # React + Vite Client (Port 3000)
│   ├── src/
│   │   ├── components/
│   │   │   ├── AudioVisualizer.jsx  # Canvas frequency waveform
│   │   │   ├── CallInterface.jsx    # Live voice call screen & controls
│   │   │   ├── Header.jsx           # Navbar & language switcher
│   │   │   ├── HealthReport.jsx     # Clinical chart report view
│   │   │   └── SettingsModal.jsx    # API key configuration modal
│   │   ├── hooks/
│   │   │   └── useVoiceCall.js      # WebSocket state & audio recorder
│   │   ├── App.jsx
│   │   └── index.css                # Obsidian glassmorphism styles
│   ├── index.html
│   └── package.json
│
├── backend/                   # Node.js + Express + WebSocket Server (Port 5000)
│   ├── src/
│   │   ├── prompts/
│   │   │   └── intakeAgentPrompt.js # System intake & report prompts
│   │   ├── services/
│   │   │   ├── sttService.js        # Speech-to-text wrapper
│   │   │   ├── llmService.js        # Intake dialogue logic
│   │   │   ├── ttsService.js        # Text-to-speech audio synthesis
│   │   │   └── reportService.js     # Health summary report generator
│   │   └── index.js                 # Server entry point
│   ├── .env.example
│   └── package.json
│
├── package.json               # Root workspace scripts
└── README.md
```

---

## ⚡ How to Run Locally

### 1. Install Dependencies
In the root folder, run:
```bash
npm run install:all
```
*(This installs root, backend, and frontend dependencies all at once).*

### 2. Set Up Environment Variables (Optional)
Create a `.env` file inside the `backend` folder:
```bash
# inside backend/.env
PORT=5000
OPENAI_API_KEY=your_openai_api_key_here
```
> *Note: If no API key is provided, the application automatically uses browser Web Speech APIs and built-in rules so it can be tested completely offline.*

### 3. Start the Application
Run the dev server:
```bash
npm run dev
```
- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Backend API & WebSocket**: [http://localhost:5000](http://localhost:5000) (`ws://localhost:5000/ws`)

---

## ☁️ Deployment Instructions

### Deploying the Backend (Render / Railway)
1. Set root directory to `backend`.
2. Build command: `npm install`
3. Start command: `node src/index.js`
4. Add environment variable: `OPENAI_API_KEY`

### Deploying the Frontend (Vercel / Netlify)
1. Set root directory to `frontend`.
2. Build command: `npm run build`
3. Output directory: `dist`

---

Developed for **Sasahyog Technologies Project Assessment**.
