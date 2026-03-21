# M.A.S.T.E.R. System 安装指南

## 环境要求

- **操作系统**: Windows 10/11, macOS, Linux
- **Python**: 3.10+
- **Node.js**: 18+ (仅前端)
- **内存**: 建议 4GB+

---

## 快速安装 (Windows)

### 方式一：一键启动（推荐）

1. 解压 `master-system.zip`
2. 双击 `start.bat`
3. 浏览器打开 http://localhost:3000

### 方式二：Docker 部署（推荐配置）

```bash
# 1. 安装 Docker Desktop (https://www.docker.com/)

# 2. 解压后进入目录
cd master-system

# 3. 启动服务
docker-compose up -d

# 4. 访问 http://localhost:3000
```

---

## 手动安装 (全平台通用)

### 1. 后端

```bash
# 进入后端目录
cd backend

# 安装依赖
pip install -r requirements.txt

# 启动服务
python main.py
```

### 2. 前端

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

---

## 配置 API Key (可选)

如需使用真实 AI 服务，在 `.env` 文件中配置：

```env
# 至少选择一个

# OpenAI
OPENAI_API_KEY=sk-xxxxx

# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-xxxxx

# DeepSeek
DEEPSEEK_API_KEY=sk-xxxxx
```

不配置则使用**模拟模式**，可正常演示所有功能。

---

## 访问地址

| 服务 | 地址 |
|:---|:---|
| 前端界面 | http://localhost:3000 |
| 后端 API | http://localhost:8000 |
| API 文档 | http://localhost:8000/docs |

---

## 功能说明

- **评审团模式**: 默认启用，多 AI 协同处理
- **浏览器自动化**: 需额外配置 Playwright
- **支持模型**: DeepSeek、豆包、ChatGPT、Claude 等

---

## 常见问题

### 端口被占用？
修改以下文件中的端口：
- `backend/main.py` (第 X 行: port=8000)
- `frontend/vite.config.ts` (port: 3000)

### 前端无法连接后端？
确保后端先启动，等待看到 "Uvicorn running" 后再启动前端。

---

*M.A.S.T.E.R. System v1.0 - 多智能体协同任务调度与成果整合系统*