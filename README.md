# M.A.S.T.E.R. System v2.0

## 快速安装 (Windows)

### 1. 下载代码
```bash
git clone https://github.com/15271368717/master-system.git
cd master-system
```

### 2. 安装依赖
```bash
# 后端
pip install fastapi uvicorn pydantic python-dotenv

# 前端
cd frontend
npm install
```

### 3. 启动
```bash
# 终端1 - 后端
cd backend
python main.py

# 终端2 - 前端
cd frontend
npm run dev
```

### 4. 访问
```
http://localhost:3000
```

---

## 技术栈

- 前端: React 18 + TypeScript + Tailwind CSS 4.0 + Framer Motion
- 后端: Python FastAPI
- 字体: Space Grotesk

---

## 功能特性

✅ 三栏式布局（历史/对话/控制面板）  
✅ 环形图资源概览  
✅ AI 能力雷达图  
✅ 协议可视化 [SYS_ROUTING]  
✅ 评审团机制（默认后台运行）  
✅ 协作模式切换  
✅ 动效交互  

---

## AI 节点

- **DeepSeek-V3** (深度求索) - 逻辑推理
- **豆包** (字节跳动) - 创意写作
- **Kimi** (月之暗面) - 长文本分析
- **通义千问** (阿里云) - 综合问答
- **Gemini-3-Pro** (Google) - 决策中枢

---

*Powered by Gemini-3-Pro Decision Agent*