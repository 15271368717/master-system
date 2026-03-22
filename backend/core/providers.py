"""
M.A.S.T.E.R. System - AI Provider Integrations
Supports multiple LLM and Search providers
"""

import os
import asyncio
from abc import ABC, abstractmethod
from typing import Optional

from .api_keys import get_key_manager


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


class OpenAIProvider(AIProvider):
    def __init__(self):
        self.client = None
    
    def _get_client(self):
        if self.client is None:
            key_mgr = get_key_manager()
            api_key = key_mgr.get("openai")
            if api_key:
                from openai import AsyncOpenAI
                self.client = AsyncOpenAI(api_key=api_key)
        return self.client
    
    async def chat(self, prompt: str, model: str = "gpt-3.5-turbo", **kwargs) -> str:
        client = self._get_client()
        if not client:
            return "[OpenAI] API Key 未配置"
        
        resp = await client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=kwargs.get("max_tokens", 2000),
            temperature=kwargs.get("temperature", 0.7)
        )
        return resp.choices[0].message.content
    
    async def health_check(self) -> bool:
        return self._get_client() is not None


class AnthropicProvider(AIProvider):
    def __init__(self):
        self.client = None
    
    def _get_client(self):
        if self.client is None:
            key_mgr = get_key_manager()
            api_key = key_mgr.get("anthropic")
            if api_key:
                from anthropic import AsyncAnthropic
                self.client = AsyncAnthropic(api_key=api_key)
        return self.client
    
    async def chat(self, prompt: str, model: str = "claude-3-haiku-20240307", **kwargs) -> str:
        client = self._get_client()
        if not client:
            return "[Anthropic] API Key 未配置"
        
        resp = await client.messages.create(
            model=model,
            max_tokens=kwargs.get("max_tokens", 2000),
            messages=[{"role": "user", "content": prompt}]
        )
        return resp.content[0].text
    
    async def health_check(self) -> bool:
        return self._get_client() is not None


class DeepSeekProvider(AIProvider):
    def __init__(self):
        self.client = None
    
    def _get_client(self):
        if self.client is None:
            key_mgr = get_key_manager()
            api_key = key_mgr.get("deepseek")
            if api_key:
                from openai import AsyncOpenAI
                self.client = AsyncOpenAI(api_key=api_key, base_url="https://api.deepseek.com")
        return self.client
    
    async def chat(self, prompt: str, model: str = "deepseek-chat", **kwargs) -> str:
        client = self._get_client()
        if not client:
            return "[DeepSeek] API Key 未配置"
        
        resp = await client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=kwargs.get("max_tokens", 2000),
            temperature=kwargs.get("temperature", 0.7)
        )
        return resp.choices[0].message.content
    
    async def health_check(self) -> bool:
        return self._get_client() is not None


class MoonshotProvider(AIProvider):
    def __init__(self):
        self.client = None
    
    def _get_client(self):
        if self.client is None:
            key_mgr = get_key_manager()
            api_key = key_mgr.get("moonshot")
            if api_key:
                from openai import AsyncOpenAI
                self.client = AsyncOpenAI(api_key=api_key, base_url="https://api.moonshot.cn/v1")
        return self.client
    
    async def chat(self, prompt: str, model: str = "moonshot-v1-8k", **kwargs) -> str:
        client = self._get_client()
        if not client:
            return "[Moonshot] API Key 未配置"
        
        resp = await client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=kwargs.get("max_tokens", 2000),
            temperature=kwargs.get("temperature", 0.7)
        )
        return resp.choices[0].message.content
    
    async def health_check(self) -> bool:
        return self._get_client() is not None


class QwenProvider(AIProvider):
    def __init__(self):
        self.client = None
    
    def _get_client(self):
        if self.client is None:
            key_mgr = get_key_manager()
            api_key = key_mgr.get("qwen")
            if api_key:
                from openai import AsyncOpenAI
                self.client = AsyncOpenAI(api_key=api_key, base_url="https://dashscope.aliyuncs.com/compatible-mode/v1")
        return self.client
    
    async def chat(self, prompt: str, model: str = "qwen-turbo", **kwargs) -> str:
        client = self._get_client()
        if not client:
            return "[Qwen] API Key 未配置"
        
        resp = await client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=kwargs.get("max_tokens", 2000),
            temperature=kwargs.get("temperature", 0.7)
        )
        return resp.choices[0].message.content
    
    async def health_check(self) -> bool:
        return self._get_client() is not None


class DoubaoProvider(AIProvider):
    def __init__(self):
        self.client = None
    
    def _get_client(self):
        if self.client is None:
            key_mgr = get_key_manager()
            api_key = key_mgr.get("doubao")
            if api_key:
                from openai import AsyncOpenAI
                self.client = AsyncOpenAI(api_key=api_key, base_url="https://ark.cn-beijing.volces.com/api/v3")
        return self.client
    
    async def chat(self, prompt: str, model: str = "doubao-pro-32k", **kwargs) -> str:
        client = self._get_client()
        if not client:
            return "[Doubao] API Key 未配置"
        
        resp = await client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=kwargs.get("max_tokens", 2000),
            temperature=kwargs.get("temperature", 0.7)
        )
        return resp.choices[0].message.content
    
    async def health_check(self) -> bool:
        return self._get_client() is not None


# ==================== Search Providers ====================

class TavilySearchProvider(AIProvider):
    def __init__(self):
        self.api_key = None
    
    def _get_key(self):
        if self.api_key is None:
            key_mgr = get_key_manager()
            self.api_key = key_mgr.get("tavily")
        return self.api_key
    
    async def chat(self, query: str, **kwargs) -> str:
        api_key = self._get_key()
        if not api_key:
            return "[Tavily] API Key 未配置"
        
        try:
            import aiohttp
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    "https://api.tavily.com/search",
                    json={"query": query, "api_key": api_key},
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
        return bool(self._get_key())


class BraveSearchProvider(AIProvider):
    def __init__(self):
        self.api_key = None
    
    def _get_key(self):
        if self.api_key is None:
            key_mgr = get_key_manager()
            self.api_key = key_mgr.get("brave")
        return self.api_key
    
    async def chat(self, query: str, **kwargs) -> str:
        api_key = self._get_key()
        if not api_key:
            return "[Brave] API Key 未配置"
        
        try:
            import aiohttp
            headers = {"X-Subscription-Token": api_key}
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
        return bool(self._get_key())


class SerperSearchProvider(AIProvider):
    def __init__(self):
        self.api_key = None
    
    def _get_key(self):
        if self.api_key is None:
            key_mgr = get_key_manager()
            self.api_key = key_mgr.get("serper")
        return self.api_key
    
    async def chat(self, query: str, **kwargs) -> str:
        api_key = self._get_key()
        if not api_key:
            return "[Serper] API Key 未配置"
        
        try:
            import aiohttp
            headers = {"X-API-KEY": api_key, "Content-Type": "application/json"}
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
        return bool(self._get_key())


class DuckDuckGoProvider(AIProvider):
    async def chat(self, query: str, **kwargs) -> str:
        try:
            import aiohttp
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
        return True


class ProviderManager:
    """Manage all AI providers"""
    
    def __init__(self):
        self.llm_providers = {
            "openai": OpenAIProvider(),
            "anthropic": AnthropicProvider(),
            "deepseek": DeepSeekProvider(),
            "moonshot": MoonshotProvider(),
            "qwen": QwenProvider(),
            "doubao": DoubaoProvider(),
        }
        
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
        key_mgr = get_key_manager()
        return key_mgr.get_available_providers()


_provider_manager = None

def get_provider_manager() -> ProviderManager:
    global _provider_manager
    if _provider_manager is None:
        _provider_manager = ProviderManager()
    return _provider_manager