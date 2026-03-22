"""
M.A.S.T.E.R. System - AI Provider Integrations
Supports multiple LLM and Search providers
"""

import os
import asyncio
import json
from abc import ABC, abstractmethod
from typing import Any, Optional
from dataclasses import dataclass


# ==================== Provider Base ====================

class AIProvider(ABC):
    """Base class for AI providers"""
    
    @abstractmethod
    async def chat(self, prompt: str, model: str = None, **kwargs) -> str:
        """Send chat request and get response"""
        pass
    
    @abstractmethod
    async def health_check(self) -> bool:
        """Check if provider is available"""
        pass


# ==================== LLM Providers ====================

class OpenAIProvider(AIProvider):
    """OpenAI GPT models"""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.client = None
        if self.api_key:
            try:
                from openai import AsyncOpenAI
                self.client = AsyncOpenAI(api_key=self.api_key)
            except ImportError:
                pass
    
    async def chat(self, prompt: str, model: str = "gpt-3.5-turbo", **kwargs) -> str:
        if not self.client:
            return "[OpenAI] No API key configured"
        
        resp = await self.client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=kwargs.get("max_tokens", 2000),
            temperature=kwargs.get("temperature", 0.7)
        )
        return resp.choices[0].message.content
    
    async def health_check(self) -> bool:
        return self.client is not None


class AnthropicProvider(AIProvider):
    """Anthropic Claude models"""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        self.client = None
        if self.api_key:
            try:
                from anthropic import AsyncAnthropic
                self.client = AsyncAnthropic(api_key=self.api_key)
            except ImportError:
                pass
    
    async def chat(self, prompt: str, model: str = "claude-3-haiku-20240307", **kwargs) -> str:
        if not self.client:
            return "[Anthropic] No API key configured"
        
        resp = await self.client.messages.create(
            model=model,
            max_tokens=kwargs.get("max_tokens", 2000),
            messages=[{"role": "user", "content": prompt}]
        )
        return resp.content[0].text
    
    async def health_check(self) -> bool:
        return self.client is not None


class DeepSeekProvider(AIProvider):
    """DeepSeek models (deepseek-chat, deepseek-coder)"""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("DEEPSEEK_API_KEY")
        self.base_url = "https://api.deepseek.com"
        self.client = None
        if self.api_key:
            try:
                from openai import AsyncOpenAI
                self.client = AsyncOpenAI(api_key=self.api_key, base_url=self.base_url)
            except ImportError:
                pass
    
    async def chat(self, prompt: str, model: str = "deepseek-chat", **kwargs) -> str:
        if not self.client:
            return "[DeepSeek] No API key configured"
        
        resp = await self.client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=kwargs.get("max_tokens", 2000),
            temperature=kwargs.get("temperature", 0.7)
        )
        return resp.choices[0].message.content
    
    async def health_check(self) -> bool:
        return self.client is not None


class MoonshotProvider(AIProvider):
    """Moonshot AI (Kimi)"""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("MOONSHOT_API_KEY")
        self.base_url = "https://api.moonshot.cn/v1"
        self.client = None
        if self.api_key:
            try:
                from openai import AsyncOpenAI
                self.client = AsyncOpenAI(api_key=self.api_key, base_url=self.base_url)
            except ImportError:
                pass
    
    async def chat(self, prompt: str, model: str = "moonshot-v1-8k", **kwargs) -> str:
        if not self.client:
            return "[Moonshot] No API key configured"
        
        resp = await self.client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=kwargs.get("max_tokens", 2000),
            temperature=kwargs.get("temperature", 0.7)
        )
        return resp.choices[0].message.content
    
    async def health_check(self) -> bool:
        return self.client is not None


class QwenProvider(AIProvider):
    """Alibaba Qwen models"""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("DASHSCOPE_API_KEY")  # Alibaba uses dashscope
        self.base_url = "https://dashscope.aliyuncs.com/compatible-mode/v1"
        self.client = None
        if self.api_key:
            try:
                from openai import AsyncOpenAI
                self.client = AsyncOpenAI(api_key=self.api_key, base_url=self.base_url)
            except ImportError:
                pass
    
    async def chat(self, prompt: str, model: str = "qwen-turbo", **kwargs) -> str:
        if not self.client:
            return "[Qwen] No API key configured"
        
        resp = await self.client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=kwargs.get("max_tokens", 2000),
            temperature=kwargs.get("temperature", 0.7)
        )
        return resp.choices[0].message.content
    
    async def health_check(self) -> bool:
        return self.client is not None


class DoubaoProvider(AIProvider):
    """ByteDance Doubao models"""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("DOUBAO_API_KEY")
        self.base_url = "https://ark.cn-beijing.volces.com/api/v3"
        self.client = None
        if self.api_key:
            try:
                from openai import AsyncOpenAI
                self.client = AsyncOpenAI(api_key=self.api_key, base_url=self.base_url)
            except ImportError:
                pass
    
    async def chat(self, prompt: str, model: str = "doubao-pro-32k", **kwargs) -> str:
        if not self.client:
            return "[Doubao] No API key configured"
        
        resp = await self.client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=kwargs.get("max_tokens", 2000),
            temperature=kwargs.get("temperature", 0.7)
        )
        return resp.choices[0].message.content
    
    async def health_check(self) -> bool:
        return self.client is not None


# ==================== Search Providers ====================

class TavilySearchProvider(AIProvider):
    """Tavily Search API - AI-powered search"""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("TAVILY_API_KEY")
    
    async def chat(self, query: str, **kwargs) -> str:
        if not self.api_key:
            return "[Tavily] No API key configured"
        
        try:
            import aiohttp
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    "https://api.tavily.com/search",
                    json={"query": query, "api_key": self.api_key},
                    timeout=10
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        results = data.get("results", [])
                        if results:
                            return "\n".join([
                                f"- {r.get('title', '')}: {r.get('content', '')[:200]}"
                                for r in results[:5]
                            ])
                        return "No results found"
                    return f"[Tavily] Error: {resp.status}"
        except Exception as e:
            return f"[Tavily] Error: {str(e)}"
    
    async def health_check(self) -> bool:
        return bool(self.api_key)


class BraveSearchProvider(AIProvider):
    """Brave Search API"""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("BRAVE_API_KEY")
    
    async def chat(self, query: str, **kwargs) -> str:
        if not self.api_key:
            return "[Brave Search] No API key configured"
        
        try:
            import aiohttp
            headers = {"X-Subscription-Token": self.api_key}
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"https://api.search.brave.com/res/v1/web/search?q={query}",
                    headers=headers,
                    timeout=10
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        web = data.get("web", {}).get("results", [])
                        if web:
                            return "\n".join([
                                f"- {r.get('title', '')}: {r.get('description', '')[:200]}"
                                for r in web[:5]
                            ])
                        return "No results found"
                    return f"[Brave] Error: {resp.status}"
        except Exception as e:
            return f"[Brave] Error: {str(e)}"
    
    async def health_check(self) -> bool:
        return bool(self.api_key)


class SerperSearchProvider(AIProvider):
    """Serper.dev Google Search API"""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("SERPER_API_KEY")
    
    async def chat(self, query: str, **kwargs) -> str:
        if not self.api_key:
            return "[Serper] No API key configured"
        
        try:
            import aiohttp
            headers = {"X-API-KEY": self.api_key, "Content-Type": "application/json"}
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    "https://google.serper.dev/search",
                    json={"q": query},
                    headers=headers,
                    timeout=10
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        organic = data.get("organic", [])
                        if organic:
                            return "\n".join([
                                f"- {r.get('title', '')}: {r.get('snippet', '')[:200]}"
                                for r in organic[:5]
                            ])
                        return "No results found"
                    return f"[Serper] Error: {resp.status}"
        except Exception as e:
            return f"[Serper] Error: {str(e)}"
    
    async def health_check(self) -> bool:
        return bool(self.api_key)


class DuckDuckGoProvider(AIProvider):
    """DuckDuckGo (free, no API key needed)"""
    
    def __init__(self, api_key: str = None):
        pass  # No API key needed
    
    async def chat(self, query: str, **kwargs) -> str:
        try:
            import aiohttp
            # Using DuckDuckGo instant answer API
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    "https://api.duckduckgo.com/",
                    params={"q": query, "format": "json", "no_html": "1"},
                    timeout=10
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        if data.get("AbstractText"):
                            return data["AbstractText"]
                        # Try related topics
                        related = data.get("RelatedTopics", [])
                        if related:
                            return "\n".join([
                                f"- {r.get('Text', '')}"
                                for r in related[:5]
                            ])
                        return "No results found"
                    return f"[DuckDuckGo] Error: {resp.status}"
        except Exception as e:
            return f"[DuckDuckGo] Error: {str(e)}"
    
    async def health_check(self) -> bool:
        return True  # Always available


# ==================== Provider Manager ====================

class ProviderManager:
    """Manage all AI providers"""
    
    def __init__(self):
        # LLM Providers
        self.llm_providers = {
            "openai": OpenAIProvider(),
            "anthropic": AnthropicProvider(),
            "deepseek": DeepSeekProvider(),
            "moonshot": MoonshotProvider(),
            "qwen": QwenProvider(),
            "doubao": DoubaoProvider(),
        }
        
        # Search Providers
        self.search_providers = {
            "tavily": TavilySearchProvider(),
            "brave": BraveSearchProvider(),
            "serper": SerperSearchProvider(),
            "duckduckgo": DuckDuckGoProvider(),
        }
    
    def get_llm(self, provider: str) -> Optional[AIProvider]:
        return self.llm_providers.get(provider.lower())
    
    def get_search(self, provider: str) -> Optional[AIProvider]:
        return self.search_providers.get(provider.lower())
    
    async def check_all_health(self) -> dict:
        """Check health of all providers"""
        health = {"llm": {}, "search": {}}
        
        for name, provider in self.llm_providers.items():
            try:
                health["llm"][name] = await provider.health_check()
            except:
                health["llm"][name] = False
        
        for name, provider in self.search_providers.items():
            try:
                health["search"][name] = await provider.health_check()
            except:
                health["search"][name] = False
        
        return health


# Singleton instance
_provider_manager = None

def get_provider_manager() -> ProviderManager:
    global _provider_manager
    if _provider_manager is None:
        _provider_manager = ProviderManager()
    return _provider_manager