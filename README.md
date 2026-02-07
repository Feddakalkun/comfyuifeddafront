# ComfyFront

**Premium Web Frontend for ComfyUI**

A modern, modular React-based frontend for ComfyUI image/video generation.

---

## 🚀 Quick Start

### 1. Installation
Run the automated installer. This will set up Python, Git, Node.js, ComfyUI, and all dependencies.

```bash
install.bat
```

**⚠️ Installation Estimate:**
- **Fast Internet/PC:** ~20-30 minutes (tested on 1Gbps fiber + NVMe)
- **Slower Internet/PC:** ~40-60 minutes
- **Download Size:** ~6-8 GB
- **Process:** Completely automated. The installer handles Python, Git, Node.js, ComfyUI, Models, and Dependencies. Grab a coffee ☕

### 2. Run the Application
Start the entire ecosystem (Frontend, Backend, AI Engine).

```bash
run.bat
```

The app will open at **http://localhost:5173**  
ComfyUI API runs at **http://localhost:8188**

---

## 📁 Project Structure

```
comfyfront/
├── frontend/                    # React Frontend
│   ├── src/
│   │   ├── components/          # UI Components
│   │   │   ├── layout/          # Layout components (Sidebar, etc.)
│   │   │   └── ui/              # Reusable UI components (Button, etc.)
│   │   ├── pages/               # Page components (ImagePage, VideoPage)
│   │   ├── services/            # API services (comfyService.ts)
│   │   ├── hooks/               # Custom React hooks
│   │   ├── types/               # TypeScript type definitions
│   │   ├── config/              # Configuration files
│   │   └── utils/               # Utility functions
│   └── package.json
├── ComfyUI/                     # Backend (ComfyUI)
├── assets/                      # Workflows & resources
│   └── workflows/               # ComfyUI workflow JSON files
├── config/                      # Configuration
│   └── nodes.json               # Custom nodes
├── scripts/                     # Installation scripts
│   └── install.ps1
├── install.bat                  # Main installer
└── run.bat                      # Launcher
```

---

## 🎨 Features

### ✅ **Implemented**
- Modern dark UI with purple/blue gradients
- Real-time connection status to ComfyUI
- Modular component architecture
- Tab-based navigation (Image, Video, Audio, Logs, Settings)
- Model selection (Z-Image, Flux, Qwen, etc.)
- WebSocket support for live updates
- TypeScript for type safety

### 🔨 **In Progress**
- Workflow loading from `assets/workflows/`
- Image generation integration
- Gallery with history
- Video generation UI
- Advanced parameter controls

---

## 🧩 Architecture

### **Frontend Stack**
- **React 18** - Component framework
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Lucide React** - Icon library
- **Framer Motion** - Animations

### **Backend**
- **ComfyUI** - Generation engine (Port 8188)
- **Python** - Embedded runtime
- **WebSocket** - Real-time communication

---

## 🔧 Development

### Run Frontend Only (Dev Mode)
```bash
cd frontend
npm run dev
```

### Run Backend Only
```bash
python_embeded\python.exe ComfyUI\main.py --listen 127.0.0.1 --port 8188
```

### Build for Production
```bash
cd frontend
npm run build
```

---

## 📝 File Overview

### **Key Files**
| File | Purpose |
|------|---------|
| `src/services/comfyService.ts` | ComfyUI API communication |
| `src/hooks/useComfyStatus.ts` | Connection status monitoring |
| `src/components/layout/Sidebar.tsx` | Main navigation |
| `src/pages/ImagePage.tsx` | Image generation UI |
| `src/config/api.ts` | API endpoints & constants |

---

## 🎯 Next Steps

1. **Load Workflows** - Implement workflow loader from `assets/workflows/`
2. **Gallery** - Display generated images with history
3. **Parameters** - Add advanced controls (steps, CFG, sampler, etc.)
4. **Video Integration** - Connect video models (Wan, LTX-2)
5. **Settings** - User preferences and configuration

---

## 📚 Resources

- [ComfyUI API Docs](https://github.com/comfyanonymous/ComfyUI)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

Made with 💜 by ComfyFront Team
