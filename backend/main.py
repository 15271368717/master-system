"""
M.A.S.T.E.R. System - FastAPI 主应用
"""

import os
import asyncio
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from core.engine import TaskMode, DEFAULT_AGENTS, get_decision_engine


# 直接从环境变量读取
openai_api_key = os.getenv("OPENAI_API_KEY")
anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时初始化
    print("🚀 M.A.S.T.E.R. System 启动中...")
    yield
    # 关闭时清理
    print("🛑 M.A.S.T.E.R. System 关闭")


app = FastAPI(
    title="M.A.S.T.E.R. System API",
    description="多智能体协同任务调度与成果整合系统",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============== 数据模型 ==============

class TaskRequest(BaseModel):
    input: str
    mode: str = "standard"  # standard / consensus / jury
    agent_ids: Optional[list[str]] = None


class TaskResponse(BaseModel):
    task_id: str
    status: str
    mode: str
    agents_used: list[str]
    result: dict


class AgentInfo(BaseModel):
    agent_id: str
    name: str
    strengths: list[str]
    radar: dict[str, int]


# ============== API 路由 ==============

@app.get("/")
async def root():
    return {
        "name": "M.A.S.T.E.R. System",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/api/health")
async def health():
    return {"status": "healthy"}


@app.get("/api/agents", response_model=list[AgentInfo])
async def list_agents():
    """获取所有 AI 节点信息"""
    return [
        AgentInfo(
            agent_id=agent.agent_id,
            name=agent.name,
            strengths=agent.strengths,
            radar=agent.radar
        )
        for agent in DEFAULT_AGENTS.values()
    ]


@app.post("/api/agents/{agent_id}/test")
async def test_agent(agent_id: str):
    """测试单个 AI 连接"""
    if agent_id not in DEFAULT_AGENTS:
        raise HTTPException(status_code=404, detail="AI 节点不存在")
    
    engine = get_decision_engine()
    
    try:
        # 简单测试
        result = await engine._standard_mode(
            "你好，请用一句话介绍你自己",
            [DEFAULT_AGENTS[agent_id]]
        )
        return {"status": "ok", "response": result["final"][:200]}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/api/tasks", response_model=TaskResponse)
async def create_task(request: TaskRequest):
    """创建并执行新任务"""
    
    # 验证模式
    try:
        mode = TaskMode(request.mode)
    except ValueError:
        raise HTTPException(status_code=400, detail="无效的模式: standard/consensus/jury")
    
    # 获取指定 AI 或自动匹配
    agents = None
    if request.agent_ids:
        from core.engine import DEFAULT_AGENTS
        agents = [DEFAULT_AGENTS[a] for a in request.agent_ids if a in DEFAULT_AGENTS]
        if not agents:
            raise HTTPException(status_code=400, detail="指定的 AI 节点不存在")
    
    # 执行任务
    engine = get_decision_engine()
    
    try:
        result = await engine.execute_task(
            user_input=request.input,
            mode=mode,
            agents=agents
        )
        
        return TaskResponse(
            task_id=result["task_id"],
            status="completed",
            mode=result["mode"],
            agents_used=result["agents_used"],
            result=result["result"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"任务执行失败: {str(e)}")


# ============== WebSocket ==============

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
    
    async def send_message(self, message: dict, websocket: WebSocket):
        await websocket.send_json(message)
    
    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            await connection.send_json(message)


manager = ConnectionManager()


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket 实时通信"""
    await manager.connect(websocket)
    
    try:
        while True:
            data = await websocket.receive_json()
            
            # 处理消息
            msg_type = data.get("type", "task")
            
            if msg_type == "task":
                # 执行任务
                engine = get_decision_engine()
                try:
                    mode = TaskMode(data.get("mode", "standard"))
                    result = await engine.execute_task(
                        user_input=data.get("input", ""),
                        mode=mode
                    )
                    
                    await manager.send_message({
                        "type": "task_result",
                        "data": result
                    }, websocket)
                except Exception as e:
                    await manager.send_message({
                        "type": "error",
                        "message": str(e)
                    }, websocket)
            
            elif msg_type == "ping":
                await manager.send_message({"type": "pong"}, websocket)
    
    except WebSocketDisconnect:
        manager.disconnect(websocket)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)