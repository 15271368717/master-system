# M.A.S.T.E.R. System 🦋

> Multi-Agent Synergized Task Execution & Result Integration System
> 多智能体协同任务调度与成果整合系统

## 快速开始

### 1. 克隆项目
```bash
cd projects/master-system
```

### 2. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env，填入你的 API Key
```

### 3. 启动服务

#### 方式 A: Docker (推荐)
```bash
docker-compose up -d
```

#### 方式 B: 本地开发
```bash
# 后端
cd backend
pip install -r requirements.txt
python main.py

# 前端 (新终端)
cd frontend
npm install
npm run dev
```

### 4. 访问
- 前端: http://localhost:3000
- API: http://localhost:8000
- API 文档: http://localhost:8000/docs

## 功能特性

### 🤖 智能协作模式

| 模式 | 说明 | 适用场景 |
|:---|:---|:---|
| **标准分工** | 决策 AI 拆解任务，分配给最合适的 AI | 任务结构清晰 |
| **讨论共识** | 多 AI 讨论直至达成共识 | 创意类、需多角度论证 |
| **评审团** | 多 AI 独立完成 + 互评打分 | 高要求任务，质量保障 |

### 📊 内置 AI 节点

- ✍️ **写作专家** - 创意写作、文案优化
- 🧠 **逻辑分析家** - 推理分析、代码审查
- 🔍 **信息检索师** - 搜索整理、资料收集
- 💻 **编程工程师** - 代码生成、Bug 修复

### 🌐 API 接口

```
POST /api/tasks          # 创建任务
GET  /api/tasks/{id}     # 获取任务结果
GET  /api/agents         # 获取 AI 节点列表
WS   /ws                 # WebSocket 实时通信
```

## 技术栈

| 层级 | 技术 |
|:---|:---|
| 前端 | React + TypeScript + Vite |
| 后端 | Python FastAPI + asyncio |
| AI | OpenAI / Anthropic SDK |

## 项目结构

```
master-system/
├── backend/
│   ├── core/
│   │   └── engine.py    # 决策 AI 引擎
│   ├── main.py          # FastAPI 应用
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx      # 主应用
│   │   └── index.css    # 样式
│   └── package.json
├── SPEC.md              # 技术规格文档
├── Dockerfile
├── docker-compose.yaml
└── .env.example
```

## License

MIT