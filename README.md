# FEDDA Front - Ultimate Local AI Studio

**A complete, portable, one-click AI ecosystem for Image, Video, and Chat generation.**

This works out-of-the-box. No complex setup required. We handle Python, Git, Node.js, and everything else for you.

---

## 📦 What's Included?
This isn't just a frontend. It's a full production studio that installs locally on your PC:

- **🎨 ComfyUI Backend**: The world's most powerful node-based image & video generation engine.
- **💬 Ollama Integration**: Built-in local LLM server for intelligent chat assistance.
- **🖥️ Modern Web Dashboard**: A slick, dark-mode React UI to control everything.
- **🎤 Audio Engine**: Integrated Text-to-Speech (TTS) and Voice-to-Text capabilities.
- **🔌 100% Portable**: Runs isolated with its own embedded Python, Git, and Node.js. Won't mess up your system!

---

## 🚀 Quick Start

### 1. Installation
Run the automated installer. It will detect your GPU (RTX 30xx vs 40xx) and optimize libraries (SageAttention/Xformers) automatically.

```bash
install.bat
```

**⚠️ Installation Estimates:**
- **Fast Internet/PC:** ~20-30 minutes (tested on 1Gbps fiber + NVMe)
- **Slower Internet/PC:** ~40-60 minutes
- **Download Size:** ~6-8 GB
- **Process:** Completely automated. Grab a coffee ☕

### 2. Launch
Start the entire ecosystem (Frontend, Backend, AI Engines) with one click.

```bash
run.bat
```

The app will open automatically at **http://localhost:5173**

---

## ✨ Features
- **Smart GPU Detection**: Automatically installs the best optimization kernels for your specific NVIDIA card.
- **Voice Control**: Talk to the AI and have it talk back using local high-quality TTS.
- **Workflow Library**: Comes pre-loaded with advanced video/image workflows (Wan, LTX-2, Flux).
- **Auto-Updates**: Built-in scripts to keep your environment fresh.

---

## 🔧 For Developers
If you want to modify the code:

**Project Structure:**
- `frontend/` - React/Vite application
- `backend/` - Python audio/utility servers
- `ComfyUI/` - The generation engine (cloned during install)
- `assets/` - Workflows and resources

**Dev Commands:**
```bash
# Run just the frontend for UI dev
cd frontend
npm run dev

# Run just the audio backend
python_embeded\python.exe backend\server.py
```

---

Made by **Feddakalkun**.
