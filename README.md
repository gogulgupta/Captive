# Captive 🎬✨

> **Raw Video → Ready-to-Post in Seconds**  
> AI Dynamic Hinglish Captions • Hormozi Kinetic Bounces • Smart Emojis • Direct MP4 Export • Offline-first (No API Keys needed!)

---

## 🚀 Key Features

- **🎤 Local & Offline Speech-to-Text:** Runs completely offline using Python & `faster-whisper` (`small` model) with zero cloud API keys or costs.
- **🇮🇳 Hinglish + English Mode:** Transcribes Hindi speech into readable Roman Hinglish (`"Toh aaj hum jaanenge sensor kaise kaam karta hai"`).
- **⚡ Voice Cadence Auto-Sync:** Words automatically pop on screen matched to natural speaking rhythm (1 or 2 words per frame).
- **🎨 9+ Viral Creator Styles:** Includes *Hormozi Gold*, *Cyber Beast*, *Ali Abdaal Clean*, *Tokyo Cyberpunk*, *Matrix Hacker*, and more.
- **✨ Semantic Smart Emojis:** Contextual emojis (💸, 🔥, 🚀, 📡, ⚠️) auto-tagged on important words without cluttering filler words.
- **↕️ Flexible Text Positioning:** Adjust caption height anywhere from top (25%) to bottom reel safe zone (68%) directly on the screen or via sliders.
- **📥 Direct MP4 / WebM Export:** Render and download video in **720p**, **1080p (Full HD)**, or **4K** at **30fps / 60fps** with full audio sync.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS, Lucide Icons, Canvas Confetti
- **Backend Service:** Python, Flask, `faster-whisper`, PyAV
- **Transliteration Engine:** Custom phonetic converter + Schwa-deletion rule

---

## 💻 Quick Start

### 1. Start Python Transcription Server
```bash
python server.py
```
*(Runs at `http://127.0.0.1:5000`)*

### 2. Start Frontend App
```bash
npm install
npm run dev
```
*(Opens at `http://localhost:5173`)*

---

## 📄 License
MIT License
