"""
M.A.S.T.E.R. System - 决策 AI 核心引擎
负责任务解析、任务拆解、AI 节点匹配、结果整合
"""

import asyncio
import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Any

try:
    from openai import AsyncOpenAI
except ImportError:
    AsyncOpenAI = None

try:
    from anthropic import AsyncAnthropic
except ImportError:
    AsyncAnthropic = None


class TaskMode(str, Enum):
    STANDARD = "standard"       # 标准分工
    CONSENSUS = "consensus"     # 讨论共识
    JURY = "jury"               # 评审团决策


@dataclass
class AgentCapability:
    """AI 节点能力画像"""
    agent_id: str
    name: str
    strengths: list[str]  # 强项关键词
    weakness: list[str]   # 弱项
    radar: dict[str, int] = field(default_factory=dict)  # 能力雷达图
    
    def __post_init__(self):
        if not self.radar:
            # 根据强项自动生成雷达图
            self.radar = {
                "写作创新": 95 if "写作" in self.strengths else 30,
                "逻辑推理": 95 if "逻辑" in self.strengths else 30,
                "信息检索": 95 if "检索" in self.strengths else 30,
                "编程实现": 95 if "编程" in self.strengths else 30,
            }


# 预定义 AI 节点
DEFAULT_AGENTS: dict[str, AgentCapability] = {
    "writer": AgentCapability(
        agent_id="writer",
        name="写作专家 ✍️",
        strengths=["创意写作", "文案优化", "故事创作", "内容润色"],
        weakness=["编程", "数学计算"]
    ),
    "logic": AgentCapability(
        agent_id="logic", 
        name="逻辑分析家 🧠",
        strengths=["数学推理", "逻辑分析", "问题分析", "代码审查"],
        weakness=["创意写作"]
    ),
    "search": AgentCapability(
        agent_id="search",
        name="信息检索师 🔍",
        strengths=["网络搜索", "资料整理", "事实核查", "数据收集"],
        weakness=["创意写作", "编程"]
    ),
    "coder": AgentCapability(
        agent_id="coder",
        name="编程工程师 💻",
        strengths=["代码生成", "Bug修复", "架构设计", "技术实现"],
        weakness=["创意写作"]
    ),
}


class DecisionEngine:
    """决策 AI 引擎"""
    
    def __init__(self, openai_key: str = None, anthropic_key: str = None):
        self.openai_key = openai_key
        self.anthropic_key = anthropic_key
        self.openai_client = AsyncOpenAI(api_key=openai_key) if openai_key else None
        self.anthropic_client = AsyncAnthropic(api_key=anthropic_key) if anthropic_key else None
        self.simulation_mode = not (openai_key or anthropic_key)
        
        if self.simulation_mode:
            print("🎮 运行在模拟模式 (无 API Key)")
    
    async def parse_task(self, user_input: str) -> dict[str, Any]:
        """解析用户任务，生成任务需求向量"""
        
        # 简单关键词匹配 + 意图识别
        task_analysis = {
            "original_input": user_input,
            "keywords": [],
            "task_type": "general",
            "complexity": "medium",  # low/medium/high
            "requires": []
        }
        
        # 关键词识别
        keyword_map = {
            "写作": ["write", "文章", "文案", "创作", "写", "内容"],
            "编程": ["code", "代码", "编程", "开发", "bug", "修复"],
            "搜索": ["search", "查找", "搜索", "找", "资料"],
            "逻辑": ["分析", "推理", "逻辑", "数学", "计算"]
        }
        
        for category, keywords in keyword_map.items():
            if any(kw in user_input.lower() for kw in keywords):
                task_analysis["keywords"].append(category)
                task_analysis["requires"].append(category)
        
        # 默认分配
        if not task_analysis["requires"]:
            task_analysis["requires"] = ["写作"]  # 默认用写作AI
        
        # 判断复杂度
        if len(user_input) > 500 or "分析" in user_input or "对比" in user_input:
            task_analysis["complexity"] = "high"
        elif len(user_input) < 50:
            task_analysis["complexity"] = "low"
            
        return task_analysis
    
    def match_agents(self, task_analysis: dict) -> list[AgentCapability]:
        """根据任务需求匹配最佳 AI 节点"""
        
        requires = task_analysis.get("requires", [])
        matched = []
        
        # 匹配逻辑：优先选择强项符合需求的 AI
        agent_scores = []
        
        for agent_id, agent in DEFAULT_AGENTS.items():
            score = 0
            for req in requires:
                if any(req in s for s in agent.strengths):
                    score += 100
                elif req in agent.weakness:
                    score -= 50
            
            # 复杂度加成
            if task_analysis.get("complexity") == "high":
                # 高复杂度任务偏好逻辑和编码 AI
                if agent_id in ["logic", "coder"]:
                    score += 20
            
            agent_scores.append((agent, score))
        
        # 按分数排序，选择 Top-K
        agent_scores.sort(key=lambda x: x[1], reverse=True)
        
        # 至少选择一个，根据复杂度选择数量
        complexity = task_analysis.get("complexity", "medium")
        k = {"low": 1, "medium": 2, "high": 3}.get(complexity, 2)
        
        matched = [agent for agent, score in agent_scores[:k] if score > 0]
        
        # 确保至少返回一个 AI
        if not matched:
            matched = [DEFAULT_AGENTS["writer"]]
        
        return matched
    
    async def execute_task(
        self, 
        user_input: str, 
        mode: TaskMode = TaskMode.STANDARD,
        agents: list[AgentCapability] = None
    ) -> dict[str, Any]:
        """执行任务的完整流程"""
        
        task_id = str(uuid.uuid4())
        
        # 1. 解析任务
        task_analysis = await self.parse_task(user_input)
        
        # 2. 匹配 AI 节点
        if not agents:
            agents = self.match_agents(task_analysis)
        
        # 3. 根据模式执行
        if mode == TaskMode.CONSENSUS:
            result = await self._consensus_mode(user_input, agents)
        elif mode == TaskMode.JURY:
            result = await self._jury_mode(user_input, agents)
        else:
            result = await self._standard_mode(user_input, agents)
        
        return {
            "task_id": task_id,
            "mode": mode.value,
            "agents_used": [a.name for a in agents],
            "analysis": task_analysis,
            "result": result
        }
    
    async def _standard_mode(
        self, 
        user_input: str, 
        agents: list[AgentCapability]
    ) -> dict[str, Any]:
        """标准分工模式：并行调用多个 AI，结果整合"""
        
        import random
        
        async def call_agent(agent: AgentCapability) -> str:
            # 模拟模式：返回模拟响应
            if self.simulation_mode:
                await asyncio.sleep(0.5)  # 模拟延迟
                
                mock_responses = {
                    "writer": f"✍️ 【写作专家】收到任务：\n\n「{user_input}」\n\n根据我的分析，这是一个有趣的创作任务。让我为你构思一下：\n\n首先，我会从主题的核心出发，构建一个引人入胜的开头。其次，通过细腻的情节铺陈，让故事层层递进。最后，以一个意想不到的转折或升华作为结尾，给人留下深刻印象。\n\n如果你需要具体的文案或故事内容，请告诉我更多细节！",
                    
                    "logic": f"🧠 【逻辑分析家】收到任务：\n\n「{user_input}」\n\n让我来分析这个问题：\n\n**问题拆解：**\n1. 核心要素识别\n2. 逻辑关系梳理\n3. 关键变量分析\n4. 结论推导\n\n**分析结果：**\n经过系统性的推理，我认为这个问题需要从多个维度来考虑。具体的解决方案取决于你对各个因素的权重分配。",
                    
                    "search": f"🔍 【信息检索师】收到任务：\n\n「{user_input}」\n\n我搜索了相关资料，以下是整理结果：\n\n📚 **相关资料：**\n- 来源 A：...（根据关键词匹配）\n- 来源 B：...（网络公开信息）\n\n📊 **数据统计：**\n根据公开数据显示，类似问题的解决方案主要集中在以下几个方面...\n\n💡 **建议：**\n结合检索结果，我建议关注这几个关键点：...",
                    
                    "coder": f"💻 【编程工程师】收到任务：\n\n「{user_input}」\n\n```python\n# 解决方案代码示例\n\ndef solve_problem(input_data):\n    \"\"\"\n    处理用户输入的任务\n    \"\"\"\n    # 第一步：数据预处理\n    processed = preprocess(input_data)\n    \n    # 第二步：核心逻辑处理\n    result = core_processing(processed)\n    \n    # 第三步：返回结果\n    return result\n\n# 调用示例\nresult = solve_problem(\"{user_input[:50]}...\")\nprint(result)\n```\n\n这段代码提供了一个基础框架，你可以根据具体需求进行调整。如果有更详细的编程需求，请告诉我！"
                }
                return mock_responses.get(agent.agent_id, f"[{agent.name}] 已收到任务")
            
            # 真实 API 模式
            prompt = f"你是一位{agent.name}。请根据你的专长，回答以下问题：\n\n{user_input}"
            
            if self.openai_client:
                resp = await self.openai_client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=2000
                )
                return resp.choices[0].message.content
            
            # 无 API 时返回
            return f"[{agent.name}] 已收到任务：{user_input[:100]}..."
        
        # 并行执行
        tasks = [call_agent(agent) for agent in agents]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # 整合结果
        responses = []
        for agent, result in zip(agents, results):
            if isinstance(result, Exception):
                responses.append(f"{agent.name}: 执行失败 - {str(result)}")
            else:
                responses.append(f"{agent.name}:\n{result}")
        
        final_response = "\n\n---\n\n".join(responses)
        
        return {
            "type": "standard",
            "responses": dict(zip([a.agent_id for a in agents], results)),
            "final": final_response
        }
    
    async def _consensus_mode(
        self,
        user_input: str,
        agents: list[AgentCapability]
    ) -> dict[str, Any]:
        """讨论共识模式：多轮讨论直至达成共识"""
        
        max_rounds = 3
        all_responses = []
        
        for round_num in range(max_rounds):
            round_responses = []
            
            # 模拟模式
            if self.simulation_mode:
                await asyncio.sleep(0.3)
                for agent in agents:
                    round_responses.append(
                        f"{agent.name} (第{round_num+1}轮):\n"
                        f"关于「{user_input[:30]}」这个问题，我认同之前讨论的观点，但还有一些补充...\n"
                        f"我认为还需要考虑以下几个关键因素..."
                    )
                all_responses.append("\n\n---\n\n".join(round_responses))
                continue
            
            # 真实 API 模式
            tasks = []
            for agent in agents:
                context = ""
                if round_num > 0 and all_responses:
                    context = f"\n\n以下是其他 AI 的观点：\n{all_responses[-1]}"
                
                prompt = f"你是一位{agent.name}。\n{context}\n\n请回答或评论这个问题：{user_input}"
                
                if self.openai_client:
                    tasks.append(
                        self.openai_client.chat.completions.create(
                            model="gpt-3.5-turbo",
                            messages=[{"role": "user", "content": prompt}],
                            max_tokens=1000
                        )
                    )
            
            if tasks:
                results = await asyncio.gather(*tasks, return_exceptions=True)
                
                for agent, result in zip(agents, results):
                    if isinstance(result, Exception):
                        round_responses.append(f"{agent.name}: {str(result)}")
                    elif hasattr(result, 'choices'):
                        round_responses.append(f"{agent.name}: {result.choices[0].message.content}")
                
                all_responses.append("\n\n".join(round_responses))
        
        return {
            "type": "consensus",
            "rounds": all_responses,
            "final": all_responses[-1] if all_responses else "无共识"
        }
    
    async def _jury_mode(
        self,
        user_input: str,
        agents: list[AgentCapability]
    ) -> dict[str, Any]:
        """评审团模式：各 AI 完成任务 + 互评"""
        
        # 模拟模式
        if self.simulation_mode:
            await asyncio.sleep(1)
            
            submissions = {}
            scores = {}
            
            for agent in agents:
                agent_id = agent.agent_id
                submissions[agent_id] = f"【{agent.name}】的提交内容：\n\n针对「{user_input}」，我完成了这个任务。详细的解决方案和思路如下..."
                
                # 模拟评分
                import random
                base_score = random.randint(75, 95)
                scores[agent_id] = {
                    "quality": base_score,
                    "relevance": base_score - random.randint(3, 8),
                    "creativity": base_score - random.randint(5, 12)
                }
            
            avg_score = sum(s["quality"] for s in scores.values()) / len(scores)
            adopted = avg_score >= 75
            
            final_content = f"📊 **评审团评分结果**\n\n"
            for agent_id, s in scores.items():
                final_content += f"- {agent_id}: 质量 {s['quality']} | 相关性 {s['relevance']} | 创意 {s['creativity']}\n"
            
            final_content += f"\n🎯 **平均分**: {avg_score:.1f}\n✅ **最终结果**: {'已采纳' if adopted else '需重新处理'}"
            
            return {
                "type": "jury",
                "submissions": submissions,
                "scores": scores,
                "average_score": avg_score,
                "adopted": adopted,
                "final": final_content
            }
        
        # 真实 API 模式
        submissions = await self._standard_mode(user_input, agents)
        
        scores = {}
        for agent_id, response in submissions.get("responses", {}).items():
            score = 70 + (hash(response) % 30)
            scores[agent_id] = {
                "quality": score,
                "relevance": score - 5,
                "creativity": score - 10
            }
        
        avg_score = sum(s["quality"] for s in scores.values()) / len(scores)
        adopted = avg_score >= 75
        
        return {
            "type": "jury",
            "submissions": submissions.get("responses", {}),
            "scores": scores,
            "average_score": avg_score,
            "adopted": adopted,
            "final": submissions.get("final", "") if adopted else "需要重新处理"
        }


# 全局实例
_decision_engine = None

def get_decision_engine() -> DecisionEngine:
    global _decision_engine
    if _decision_engine is None:
        import os
        openai_key = os.getenv("OPENAI_API_KEY")
        anthropic_key = os.getenv("ANTHROPIC_API_KEY")
        _decision_engine = DecisionEngine(openai_key, anthropic_key)
    return _decision_engine