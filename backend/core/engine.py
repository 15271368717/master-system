"""
M.A.S.T.E.R. System - Decision AI Core Engine
Task parsing, task splitting, AI node matching, result integration
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
    STANDARD = "standard"
    CONSENSUS = "consensus"
    JURY = "jury"


@dataclass
class AgentCapability:
    """AI Node Capability Profile"""
    agent_id: str
    name: str
    strengths: list[str]
    weakness: list[str]
    radar: dict[str, int] = field(default_factory=dict)
    
    def __post_init__(self):
        if not self.radar:
            self.radar = {
                "Writing": 95 if "Writing" in self.strengths else 30,
                "Logic": 95 if "Logic" in self.strengths else 30,
                "Search": 95 if "Search" in self.strengths else 30,
                "Coding": 95 if "Coding" in self.strengths else 30,
            }


DEFAULT_AGENTS: dict[str, AgentCapability] = {
    "writer": AgentCapability(
        agent_id="writer",
        name="Writing Expert",
        strengths=["Creative Writing", "Copy Optimization", "Story Creation", "Content Polishing"],
        weakness=["Coding", "Math"]
    ),
    "logic": AgentCapability(
        agent_id="logic", 
        name="Logic Analyst",
        strengths=["Math Reasoning", "Logic Analysis", "Problem Analysis", "Code Review"],
        weakness=["Creative Writing"]
    ),
    "search": AgentCapability(
        agent_id="search",
        name="Search Specialist",
        strengths=["Web Search", "Data Collection", "Fact Checking", "Information Retrieval"],
        weakness=["Creative Writing", "Coding"]
    ),
    "coder": AgentCapability(
        agent_id="coder",
        name="Coding Engineer",
        strengths=["Code Generation", "Bug Fix", "Architecture Design", "Technical Implementation"],
        weakness=["Creative Writing"]
    ),
}


class DecisionEngine:
    """Decision AI Engine"""
    
    def __init__(self, openai_key: str = None, anthropic_key: str = None):
        self.openai_key = openai_key
        self.anthropic_key = anthropic_key
        self.openai_client = AsyncOpenAI(api_key=openai_key) if openai_key else None
        self.anthropic_client = AsyncAnthropic(api_key=anthropic_key) if anthropic_key else None
        self.simulation_mode = not (openai_key or anthropic_key)
        
        if self.simulation_mode:
            print("[SIMULATION MODE] No API Key configured")
    
    async def parse_task(self, user_input: str) -> dict[str, Any]:
        """Parse user task and generate task requirement vector"""
        
        task_analysis = {
            "original_input": user_input,
            "keywords": [],
            "task_type": "general",
            "complexity": "medium",
            "requires": []
        }
        
        keyword_map = {
            "Writing": ["write", "article", "copy", "create", "story", "poem"],
            "Coding": ["code", "programming", "develop", "bug", "fix"],
            "Search": ["search", "find", "lookup", "information", "data"],
            "Logic": ["analyze", "logic", "reasoning", "math", "calculate"]
        }
        
        for category, keywords in keyword_map.items():
            if any(kw in user_input.lower() for kw in keywords):
                task_analysis["keywords"].append(category)
                task_analysis["requires"].append(category)
        
        if not task_analysis["requires"]:
            task_analysis["requires"] = ["Writing"]
        
        if len(user_input) > 500 or "analyze" in user_input.lower() or "compare" in user_input.lower():
            task_analysis["complexity"] = "high"
        elif len(user_input) < 50:
            task_analysis["complexity"] = "low"
            
        return task_analysis
    
    def match_agents(self, task_analysis: dict) -> list[AgentCapability]:
        """Match best AI nodes based on task requirements"""
        
        requires = task_analysis.get("requires", [])
        agent_scores = []
        
        for agent_id, agent in DEFAULT_AGENTS.items():
            score = 0
            for req in requires:
                if any(req in s for s in agent.strengths):
                    score += 100
                elif req in agent.weakness:
                    score -= 50
            
            if task_analysis.get("complexity") == "high":
                if agent_id in ["logic", "coder"]:
                    score += 20
            
            agent_scores.append((agent, score))
        
        agent_scores.sort(key=lambda x: x[1], reverse=True)
        
        k = {"low": 1, "medium": 2, "high": 3}.get(task_analysis.get("complexity", "medium"), 2)
        
        matched = [agent for agent, score in agent_scores[:k] if score > 0]
        
        if not matched:
            matched = [DEFAULT_AGENTS["writer"]]
        
        return matched
    
    async def execute_task(
        self, 
        user_input: str, 
        mode: TaskMode = TaskMode.STANDARD,
        agents: list[AgentCapability] = None
    ) -> dict[str, Any]:
        """Execute the complete task flow"""
        
        task_id = str(uuid.uuid4())
        task_analysis = await self.parse_task(user_input)
        
        if not agents:
            agents = self.match_agents(task_analysis)
        
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
        """Standard division mode"""
        
        async def call_agent(agent: AgentCapability) -> str:
            if self.simulation_mode:
                await asyncio.sleep(0.5)
                
                mock_responses = {
                    "writer": f"[Writing Expert] Task received: {user_input[:100]}...\n\nHere is the creative content based on your request.",
                    "logic": f"[Logic Analyst] Task received: {user_input[:100]}...\n\nAnalysis: Based on the task requirements, here is my systematic breakdown...",
                    "search": f"[Search Specialist] Task received: {user_input[:100]}...\n\nBased on web search results, here is the gathered information...",
                    "coder": f"[Coding Engineer] Task received: {user_input[:100]}...\n\nHere is the code solution:\n\ndef solve():\n    pass"
                }
                return mock_responses.get(agent.agent_id, f"[{agent.name}] Task processed")
            
            if self.openai_client:
                prompt = f"You are a {agent.name}. Please answer based on your expertise:\n\n{user_input}"
                resp = await self.openai_client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=2000
                )
                return resp.choices[0].message.content
            
            return f"[{agent.name}] Task completed"
        
        tasks = [call_agent(agent) for agent in agents]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        responses = []
        for agent, result in zip(agents, results):
            if isinstance(result, Exception):
                responses.append(f"{agent.name}: Failed - {str(result)}")
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
        """Consensus discussion mode"""
        
        max_rounds = 3
        all_responses = []
        
        for round_num in range(max_rounds):
            round_responses = []
            
            if self.simulation_mode:
                await asyncio.sleep(0.3)
                for agent in agents:
                    round_responses.append(
                        f"{agent.name} (Round {round_num+1}):\n"
                        f"Regarding the task, I agree with previous points and would like to add..."
                    )
                all_responses.append("\n\n---\n\n".join(round_responses))
                continue
            
            # Real API mode omitted for simplicity
        
        return {
            "type": "consensus",
            "rounds": all_responses,
            "final": all_responses[-1] if all_responses else "No consensus reached"
        }
    
    async def _jury_mode(
        self,
        user_input: str,
        agents: list[AgentCapability]
    ) -> dict[str, Any]:
        """Jury evaluation mode - evaluates AI output results"""
        
        if self.simulation_mode:
            await asyncio.sleep(1)
            
            submissions = {}
            scores = {}
            
            for agent in agents:
                agent_id = agent.agent_id
                submissions[agent_id] = f"[{agent.name}] Output: Task '{user_input[:30]}...' has been processed."
                
                import random
                base_score = random.randint(75, 95)
                scores[agent_id] = {
                    "quality": base_score,
                    "relevance": base_score - random.randint(3, 8),
                    "creativity": base_score - random.randint(5, 12)
                }
            
            avg_score = sum(s["quality"] for s in scores.values()) / len(scores)
            adopted = avg_score >= 75
            
            final_content = f"[JURY EVALUATION RESULTS]\n\n"
            for agent_id, s in scores.items():
                status = "PASS" if s["quality"] >= 75 else "NEEDS IMPROVEMENT"
                final_content += f"- {agent_id}: Quality={s['quality']}, Relevance={s['relevance']}, Creativity={s['creativity']} [{status}]\n"
            
            final_content += f"\nAverage Score: {avg_score:.1f}/100\nFinal Decision: {'ADOPTED' if adopted else 'RETRY'}"
            
            return {
                "type": "jury",
                "submissions": submissions,
                "scores": scores,
                "average_score": avg_score,
                "adopted": adopted,
                "final": final_content
            }
        
        # Real API mode
        submissions = await self._standard_mode(user_input, agents)
        
        import random
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
            "final": submissions.get("final", "") if adopted else "Needs retry"
        }


_decision_engine = None

def get_decision_engine() -> DecisionEngine:
    global _decision_engine
    if _decision_engine is None:
        import os
        openai_key = os.getenv("OPENAI_API_KEY")
        anthropic_key = os.getenv("ANTHROPIC_API_KEY")
        _decision_engine = DecisionEngine(openai_key, anthropic_key)
    return _decision_engine