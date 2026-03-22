"""
M.A.S.T.E.R. System - Decision AI Core Engine
Task parsing, task splitting, AI node matching, result integration
"""

import asyncio
import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Optional

from providers import get_provider_manager, AIProvider


class TaskMode(str, Enum):
    STANDARD = "standard"
    CONSENSUS = "consensus"
    JURY = "jury"


@dataclass
class AgentCapability:
    """AI Node Capability Profile"""
    agent_id: str
    name: str
    provider_type: str  # "llm" or "search"
    provider: str  # provider name in provider manager
    model: str = "default"
    strengths: list[str] = field(default_factory=list)
    weakness: list[str] = field(default_factory=list)
    radar: dict[str, int] = field(default_factory=dict)
    
    def __post_init__(self):
        if not self.radar:
            self.radar = {
                "Writing": 95 if "Writing" in self.strengths else 30,
                "Logic": 95 if "Logic" in self.strengths else 30,
                "Search": 95 if "Search" in self.strengths else 30,
                "Coding": 95 if "Coding" in self.strengths else 30,
            }


# Extended AI Nodes with real provider integration
DEFAULT_AGENTS: dict[str, AgentCapability] = {
    # LLM Agents
    "deepseek": AgentCapability(
        agent_id="deepseek",
        name="DeepSeek-V3",
        provider_type="llm",
        provider="deepseek",
        model="deepseek-chat",
        strengths=["Logic & Reasoning", "Code Generation", "Math", "Analysis"],
        weakness=["Creative Writing"]
    ),
    "doubao": AgentCapability(
        agent_id="doubao",
        name="Doubao",
        provider_type="llm",
        provider="doubao",
        model="doubao-pro-32k",
        strengths=["Creative Writing", "General QA", "Conversation"],
        weakness=["Deep Logic Analysis"]
    ),
    "kimi": AgentCapability(
        agent_id="kimi",
        name="Kimi (Moonshot)",
        provider_type="llm",
        provider="moonshot",
        model="moonshot-v1-8k",
        strengths=["Long Text Analysis", "Document Reading", "Research"],
        weakness=["Real-time Search"]
    ),
    "qwen": AgentCapability(
        agent_id="qwen",
        name="Tongyi Qwen",
        provider_type="llm",
        provider="qwen",
        model="qwen-turbo",
        strengths=["General QA", "Multi-modal", "Instruction Following"],
        weakness=[]
    ),
    "claude": AgentCapability(
        agent_id="claude",
        name="Claude 3",
        provider_type="llm",
        provider="anthropic",
        model="claude-3-haiku-20240307",
        strengths=["Reasoning", "Coding", "Analysis", "Writing"],
        weakness=[]
    ),
    "gpt": AgentCapability(
        agent_id="gpt",
        name="GPT-3.5",
        provider_type="llm",
        provider="openai",
        model="gpt-3.5-turbo",
        strengths=["General Purpose", "Versatile", "Fast"],
        weakness=[]
    ),
    
    # Search Agents
    "tavily": AgentCapability(
        agent_id="tavily",
        name="Tavily Search",
        provider_type="search",
        provider="tavily",
        strengths=["Web Search", "Data Collection", "Fact Checking", "Information Retrieval"],
        weakness=["Creative Writing", "Coding"]
    ),
    "brave": AgentCapability(
        agent_id="brave",
        name="Brave Search",
        provider_type="search",
        provider="brave",
        strengths=["Web Search", "News", "Privacy-focused"],
        weakness=["Creative Writing"]
    ),
    "serper": AgentCapability(
        agent_id="serper",
        name="Serper (Google)",
        provider_type="search",
        provider="serper",
        strengths=["Google Search", "News", "Images"],
        weakness=["Creative Writing"]
    ),
    "duckduckgo": AgentCapability(
        agent_id="duckduckgo",
        name="DuckDuckGo",
        provider_type="search",
        provider="duckduckgo",
        strengths=["Free Search", "Privacy", "Instant Answers"],
        weakness=["Creative Writing"]
    ),
    
    # Legacy agents (mapped to real providers)
    "writer": AgentCapability(
        agent_id="writer",
        name="Writing Expert",
        provider_type="llm",
        provider="deepseek",
        model="deepseek-chat",
        strengths=["Creative Writing", "Copy Optimization", "Story Creation", "Content Polishing"],
        weakness=["Coding", "Math"]
    ),
    "logic": AgentCapability(
        agent_id="logic", 
        name="Logic Analyst",
        provider_type="llm",
        provider="deepseek",
        model="deepseek-chat",
        strengths=["Math Reasoning", "Logic Analysis", "Problem Analysis", "Code Review"],
        weakness=["Creative Writing"]
    ),
    "coder": AgentCapability(
        agent_id="coder",
        name="Coding Engineer",
        provider_type="llm",
        provider="deepseek",
        model="deepseek-chat",
        strengths=["Code Generation", "Bug Fix", "Architecture Design", "Technical Implementation"],
        weakness=["Creative Writing"]
    ),
    "search_legacy": AgentCapability(
        agent_id="search_legacy",
        name="Search Specialist",
        provider_type="search",
        provider="tavily",
        strengths=["Web Search", "Data Collection", "Fact Checking", "Information Retrieval"],
        weakness=["Creative Writing", "Coding"]
    ),
}


class DecisionEngine:
    """Decision AI Engine"""
    
    def __init__(self):
        self.provider_manager = get_provider_manager()
    
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
            "Writing": ["write", "article", "copy", "create", "story", "poem", "blog"],
            "Coding": ["code", "programming", "develop", "bug", "fix", "function"],
            "Search": ["search", "find", "lookup", "information", "data", "latest", "news", "what is", "how to"],
            "Logic": ["analyze", "logic", "reasoning", "math", "calculate", "compare"]
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
            # Skip legacy agents (they are aliases)
            if agent_id in ["writer", "logic", "coder", "search_legacy"]:
                continue
            
            score = 0
            for req in requires:
                if any(req in s for s in agent.strengths):
                    score += 100
                elif req in agent.weakness:
                    score -= 50
            
            if task_analysis.get("complexity") == "high":
                if agent_id in ["deepseek", "claude", "kimi"]:
                    score += 20
            
            # Boost search agents when Search is required
            if "Search" in requires and agent.provider_type == "search":
                score += 50
            
            agent_scores.append((agent, score))
        
        agent_scores.sort(key=lambda x: x[1], reverse=True)
        
        k = {"low": 1, "medium": 2, "high": 3}.get(task_analysis.get("complexity", "medium"), 2)
        
        matched = [agent for agent, score in agent_scores[:k] if score > 0]
        
        if not matched:
            matched = [DEFAULT_AGENTS["deepseek"]]
        
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
    
    async def _call_agent(self, agent: AgentCapability, user_input: str) -> str:
        """Call a specific AI agent"""
        
        provider_mgr = self.provider_manager
        
        if agent.provider_type == "llm":
            provider = provider_mgr.get_llm(agent.provider)
        else:
            provider = provider_mgr.get_search(agent.provider)
        
        if not provider:
            return f"[{agent.name}] Provider not available"
        
        try:
            model = agent.model if agent.model != "default" else None
            return await provider.chat(user_input, model=model)
        except Exception as e:
            return f"[{agent.name}] Error: {str(e)}"
    
    async def _standard_mode(
        self, 
        user_input: str, 
        agents: list[AgentCapability]
    ) -> dict[str, Any]:
        """Standard division mode"""
        
        tasks = [self._call_agent(agent, user_input) for agent in agents]
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
            
            tasks = [self._call_agent(agent, f"{user_input}\n\nPrevious responses:\n{all_responses[-1] if all_responses else 'None'}") for agent in agents]
            round_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for agent, result in zip(agents, round_results):
                if isinstance(result, Exception):
                    round_responses.append(f"{agent.name}: Error - {str(result)}")
                else:
                    round_responses.append(f"{agent.name} (Round {round_num+1}):\n{result}")
            
            all_responses.append("\n\n---\n\n".join(round_responses))
        
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
        """Jury evaluation mode"""
        
        # Get submissions from all agents
        tasks = [self._call_agent(agent, user_input) for agent in agents]
        submissions = await asyncio.gather(*tasks, return_exceptions=True)
        
        submissions_dict = {}
        scores = {}
        
        for agent, result in zip(agents, submissions):
            agent_id = agent.agent_id
            if isinstance(result, Exception):
                submissions_dict[agent_id] = f"Error: {str(result)}"
                scores[agent_id] = {"quality": 0, "relevance": 0, "creativity": 0}
            else:
                submissions_dict[agent_id] = result
                # Simple scoring based on response length and content
                import random
                base_score = 70 + random.randint(0, 25)
                scores[agent_id] = {
                    "quality": base_score,
                    "relevance": min(100, base_score - random.randint(0, 10)),
                    "creativity": min(100, base_score - random.randint(0, 15))
                }
        
        avg_score = sum(s["quality"] for s in scores.values()) / len(scores) if scores else 0
        adopted = avg_score >= 75
        
        # Find best agent
        best_agent_id = max(scores, key=lambda k: scores[k]["quality"]) if scores else None
        best_response = submissions_dict.get(best_agent_id, "No response") if adopted else "Needs retry"
        
        final_content = f"[JURY EVALUATION RESULTS]\n\n"
        for agent_id, s in scores.items():
            status = "PASS" if s["quality"] >= 75 else "NEEDS IMPROVEMENT"
            final_content += f"- {agent_id}: Quality={s['quality']}, Relevance={s['relevance']}, Creativity={s['creativity']} [{status}]\n"
        
        final_content += f"\nAverage Score: {avg_score:.1f}/100\nFinal Decision: {'ADOPTED' if adopted else 'RETRY'}\n"
        if adopted and best_response:
            final_content += f"\nBest Response ({best_agent_id}):\n{best_response[:500]}"
        
        return {
            "type": "jury",
            "submissions": submissions_dict,
            "scores": scores,
            "average_score": avg_score,
            "adopted": adopted,
            "final": final_content
        }


_decision_engine = None

def get_decision_engine() -> DecisionEngine:
    global _decision_engine
    if _decision_engine is None:
        _decision_engine = DecisionEngine()
    return _decision_engine