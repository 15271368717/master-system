# M.A.S.T.E.R. System v2.1

## Quick Start (Windows)

### Option 1: Installer (Recommended)

1. Download code from GitHub
2. Extract to `D:\master-system\`
3. Double-click `install.bat`
4. Wait for installation to complete
5. Double-click `start-all.bat`

### Option 2: Manual

```bash
# Install dependencies
pip install fastapi uvicorn pydantic python-dotenv
cd frontend && npm install

# Terminal 1 - Backend
cd backend && python main.py

# Terminal 2 - Frontend
cd frontend && npm run dev

# Open browser
http://localhost:3000
```

---

## System Requirements

| Software | Version | Download |
|:---|:---|:---|
| Python | 3.10+ | python.org |
| Node.js | 18+ | nodejs.org |

---

## Features

- Three-column layout (History / Chat / Control Panel)
- Donut chart for task distribution
- AI capability radar chart
- Protocol visualization [SYS_ROUTING]
- Jury mechanism (evaluates AI output results)
- Collaboration mode switching
- Smooth animations

---

## AI Nodes

| Node | Provider | Specialty |
|:---|:---|:---|
| DeepSeek-V3 | DeepSeek | Logic & Reasoning |
| Doubao | ByteDance | Creative Writing |
| Kimi | Moonshot | Long Text Analysis |
| Tongyi Qwen | Alibaba | General QA |

---

## Workflow

```
User Input -> Decision AI splits task -> Distribute to AI nodes -> 
AI output results -> Jury evaluates results -> Final output
```

---

## File Description

| File | Description |
|:---|:---|
| `install.bat` | One-click installer |
| `start-all.bat` | Start all services |
| `start-backend.bat` | Start backend only |
| `start-frontend.bat` | Start frontend only |
| `backend/` | Backend code |
| `frontend/` | Frontend code |

---

## Troubleshooting

**Port already in use?**
- Close programs using port 3000/8000, or change port in config

**Installation failed?**
- Make sure Python and Node.js are installed and added to PATH

**Display issues?**
- Clear browser cache, use Chrome/Edge

---

*Powered by Gemini-3-Pro Decision Agent*