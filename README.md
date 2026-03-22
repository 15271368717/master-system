# M.A.S.T.E.R. System v2.1

## 多 AI 协同系统 (Multi-Agent Synergized Task Execution & Result Integration)

通过决策 AI 的智能调度，整合多个垂直领域 AI 的专业能力，实现复杂任务的高效拆解、并行处理与成果融合。

## 快速开始 (Windows)

### Option 1: 一键安装 (推荐)

1. 从 GitHub 下载代码
2. 解压到 `D:\master-system\`
3. 双击 `install.bat`
4. 等待安装完成
5. 双击 `start-all.bat`

### Option 2: 手动启动

```bash
# 安装依赖
pip install fastapi uvicorn pydantic python-dotenv aiohttp
cd frontend && npm install

# 终端 1 - 后端
cd backend && python main.py

# 终端 2 - 前端
cd frontend && npm run dev

# 打开浏览器
http://localhost:3000
```

### 环境配置

```bash
# 进入后端目录
cd backend

# 复制配置示例
copy .env.example .env

# 编辑 .env 填入你的 API Keys
```

## 系统特性

- ✅ 三栏布局 (历史记录 / 核心对话 / 智能协作面板)
- ✅ 任务分布甜甜圈图
- ✅ AI 能力雷达图
- ✅ 协议可视化 [SYS_ROUTING]
- ✅ 评审团机制 (Jury) - 多 AI 结果评估
- ✅ 协作模式切换 (标准/共识/评审团)
- ✅ 流畅动画

## 已接入 AI 节点

### LLM 大语言模型

| 节点 | 提供商 | 特色能力 | 状态 |
|:---|:---|:---|:---:|
| DeepSeek-V3 | DeepSeek | 逻辑推理、代码生成、数学 | ✅ |
| Doubao | ByteDance | 创意写作、通用问答 | ✅ |
| Kimi | Moonshot | 长文本分析、文档阅读 | ✅ |
| Tongyi Qwen | Alibaba | 通用 QA、多模态 | ✅ |
| Claude 3 | Anthropic | 推理、编码、分析 | ✅ |
| GPT-3.5 | OpenAI | 通用目的、快速 | ✅ |

### 搜索 AI

| 节点 | 提供商 | 特色能力 | 状态 |
|:---|:---|:---|:---:|
| Tavily | Tavily | AI 驱动的语义搜索 | ✅ |
| Brave Search | Brave | 隐私保护、新闻 | ✅ |
| Serper | Serper | Google 搜索结果 | ✅ |
| DuckDuckGo | DDG | 免费、无需 API Key | ✅ |

## 工作流程

```
用户输入 → 决策 AI 解析任务 → 匹配最佳 AI 节点 → 
并行执行 → 结果评估/整合 → 最终输出
```

## 协作模式

1. **标准分工 (Standard)** - 决策 AI 拆解任务 → 分发给指定 AI → 整合输出
2. **讨论共识 (Consensus)** - 广播任务 → 多轮讨论 → 达成共识
3. **评审团 (Jury)** - 多 AI 独立完成 → 互评打分 → 采纳最佳

## API 接口

| 方法 | 路径 | 说明 |
|:---|:---|:---|
| GET | `/api/health` | 检查系统及 AI 提供商状态 |
| GET | `/api/agents` | 获取所有 AI 节点信息 |
| GET | `/api/agents/categories` | 按类别列出 AI 节点 |
| POST | `/api/agents/{id}/test` | 测试单个 AI 连接 |
| POST | `/api/tasks` | 创建并执行任务 |
| WS | `/ws` | WebSocket 实时通信 |

## 环境变量

详见 `.env.example`：

```env
# 至少需要一个 LLM API Key
OPENAI_API_KEY=sk-...
DEEPSEEK_API_KEY=sk-...
MOONSHOT_API_KEY=sk-...
DASHSCOPE_API_KEY=sk-...

# 搜索 API (推荐至少配置一个)
TAVILY_API_KEY=...
SERPER_API_KEY=...
# DuckDuckGo 无需 API Key
```

## 文件结构

```
master-system/
├── backend/
│   ├── core/
│   │   ├── engine.py      # 决策引擎
│   │   └── providers.py   # AI 提供商集成
│   ├── main.py            # FastAPI 主程序
│   ├── .env.example       # 环境配置示例
│   └── requirements.txt   # Python 依赖
├── frontend/              # React 前端
├── README.md
└── SPEC.md               # 技术规格
```

## 故障排除

**端口被占用？**
- 关闭占用 3000/8000 端口的程序，或在配置中修改端口

**安装失败？**
- 确保 Python 和 Node.js 已安装并添加到 PATH
- 运行 `pip install -r requirements.txt` 查看具体错误

**AI 无法连接？**
- 检查 `.env` 文件中的 API Key 是否正确
- 访问 `/api/health` 查看提供商连接状态

**显示异常？**
- 清除浏览器缓存，使用 Chrome/Edge

---

*Powered by M.A.S.T.E.R. Decision Agent v2.1*