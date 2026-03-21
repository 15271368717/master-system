# M.A.S.T.E.R. System v2.0

## 🚀 快速开始

### 方式一：安装程序（推荐 Windows 用户）

1. **下载代码**
   - 方法 A: 克隆仓库
     ```bash
     git clone https://github.com/15271368717/master-system.git
     ```
   - 方法 B: 下载 ZIP
     - 打开 https://github.com/15271368717/master-system
     - 点击绿色 Code 按钮 → Download ZIP

2. **解压**到 `D:\master-system\`

3. **双击运行** `install.bat`

4. **等待安装完成**，会自动创建桌面快捷方式

5. **双击桌面快捷方式** 启动系统

---

### 方式二：手动启动

```bash
# 1. 安装依赖
pip install fastapi uvicorn pydantic python-dotenv
cd frontend && npm install

# 2. 启动后端（终端1）
cd backend && python main.py

# 3. 启动前端（终端2）
cd frontend && npm run dev

# 4. 打开浏览器
http://localhost:3000
```

---

## 📋 系统要求

| 软件 | 版本 | 下载地址 |
|:---|:---|:---|
| Python | 3.10+ | python.org |
| Node.js | 18+ | nodejs.org |

---

## 🎯 功能特性

✅ 三栏式布局（历史记录 / 核心对话 / 智能面板）  
✅ 环形图资源概览（实时任务分配）  
✅ AI 能力雷达图  
✅ 协议可视化 [SYS_ROUTING]  
✅ 评审团机制（后台自动运行）  
✅ 协作模式切换  
✅ 动效交互  

---

## 🤖 AI 节点

| 节点 | 厂商 | 专长 |
|:---|:---|:---|
| DeepSeek-V3 | 深度求索 | 逻辑推理 |
| 豆包 | 字节跳动 | 创意写作 |
| Kimi | 月之暗面 | 长文本分析 |
| 通义千问 | 阿里云 | 综合问答 |
| Gemini-3-Pro | Google | 决策中枢 |

---

## 📁 文件说明

| 文件 | 说明 |
|:---|:---|
| `install.bat` | 一键安装脚本 |
| `start-all.bat` | 一键启动 |
| `start-backend.bat` | 仅启动后端 |
| `start-frontend.bat` | 仅启动前端 |
| `backend/` | 后端代码 |
| `frontend/` | 前端代码 |

---

## ⚠️ 常见问题

**Q: 端口被占用？**
A: 关闭占用 3000/8000 端口的程序，或修改端口

**Q: 安装失败？**
A: 确保 Python 和 Node.js 已正确安装并添加到 PATH

**Q: 界面显示异常？**
A: 清除浏览器缓存，或使用 Chrome/Edge 浏览器

---

*Powered by Gemini-3-Pro Decision Agent*