"""
M.A.S.T.E.R. System - FastAPI Main Application
"""

import os
import asyncio
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from core.engine import TaskMode, DEFAULT_AGENTS, get_decision_engine
from core.providers import get_provider_manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[M.A.S.T.E.R.] Starting up...")
    
    # Check provider health on startup
    provider_mgr = get_provider_manager()
    health = await provider_mgr.check_all_health()
    print(f"[M.A.S.T.E.R.] Provider Health: {health}")
    
    yield
    print("[M.A.S.T.E.R.] Shutting down...")


app = FastAPI(
    title="M.A.S.T.E.R. System API",
    description="Multi-Agent Synergized Task Execution & Result Integration System",
    version="2.1.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Data Models
class TaskRequest(BaseModel):
    input: str
    mode: str = "standard"
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
    provider_type: str
    provider: str
    model: str
    strengths: list[str]
    radar: dict[str, int]


# API Routes
@app.get("/")
async def root():
    return {
        "name": "M.A.S.T.E.R. System",
        "version": "2.1.0",
        "status": "running"
    }


@app.get("/api/health")
async def health():
    """Check system and provider health"""
    provider_mgr = get_provider_manager()
    provider_health = await provider_mgr.check_all_health()
    
    # Count available providers
    llm_count = sum(1 for v in provider_health["llm"].values() if v)
    search_count = sum(1 for v in provider_health["search"].values() if v)
    
    return {
        "status": "healthy",
        "providers": {
            "llm": f"{llm_count}/{len(provider_health['llm'])}",
            "search": f"{search_count}/{len(provider_health['search'])}"
        },
        "details": provider_health
    }


@app.get("/api/agents", response_model=list[AgentInfo])
async def list_agents():
    """Get all AI node information"""
    return [
        AgentInfo(
            agent_id=agent.agent_id,
            name=agent.name,
            provider_type=agent.provider_type,
            provider=agent.provider,
            model=agent.model,
            strengths=agent.strengths,
            radar=agent.radar
        )
        for agent in DEFAULT_AGENTS.values()
    ]


@app.get("/api/agents/categories")
async def list_agent_categories():
    """Get agents grouped by category"""
    llm_agents = []
    search_agents = []
    
    for agent in DEFAULT_AGENTS.values():
        agent_info = {
            "agent_id": agent.agent_id,
            "name": agent.name,
            "provider": agent.provider,
            "model": agent.model,
            "strengths": agent.strengths
        }
        if agent.provider_type == "llm":
            llm_agents.append(agent_info)
        else:
            search_agents.append(agent_info)
    
    return {
        "llm": llm_agents,
        "search": search_agents
    }


@app.post("/api/agents/{agent_id}/test")
async def test_agent(agent_id: str):
    """Test single AI connection"""
    if agent_id not in DEFAULT_AGENTS:
        raise HTTPException(status_code=404, detail="AI node not found")
    
    agent = DEFAULT_AGENTS[agent_id]
    engine = get_decision_engine()
    
    try:
        result = await engine._call_agent(agent, "Hello, please introduce yourself in one sentence")
        return {"status": "ok", "response": result[:500]}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/api/tasks", response_model=TaskResponse)
async def create_task(request: TaskRequest):
    """Create and execute new task"""
    
    try:
        mode = TaskMode(request.mode)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid mode: standard/consensus/jury")
    
    agents = None
    if request.agent_ids:
        from core.engine import DEFAULT_AGENTS
        agents = [DEFAULT_AGENTS[a] for a in request.agent_ids if a in DEFAULT_AGENTS]
        if not agents:
            raise HTTPException(status_code=400, detail="Specified AI node not found")
    
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
        raise HTTPException(status_code=500, detail=f"Task execution failed: {str(e)}")


# WebSocket
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
    
    async def send_message(self, message: dict, websocket: WebSocket):
        await websocket.send_json(message)
    
    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            await connection.send_json(message)


manager = ConnectionManager()


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket real-time communication"""
    await manager.connect(websocket)
    
    try:
        while True:
            data = await websocket.receive_json()
            
            msg_type = data.get("type", "task")
            
            if msg_type == "task":
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
            
            elif msg_type == "health":
                provider_mgr = get_provider_manager()
                health = await provider_mgr.check_all_health()
                await manager.send_message({"type": "health", "data": health}, websocket)
    
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        manager.disconnect(websocket)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)