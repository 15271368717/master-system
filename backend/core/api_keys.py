"""
M.A.S.T.E.R. System - API Key Manager
集中管理 API Keys，用户无需配置
"""

import os
from typing import Optional
from dataclasses import dataclass


@dataclass
class APIKeyConfig:
    """API Key Configuration"""
    openai: str = ""
    anthropic: str = ""
    deepseek: str = ""
    moonshot: str = ""
    dashscope: str = ""
    doubao: str = ""
    tavily: str = ""
    brave: str = ""
    serper: str = ""


class APIKeyManager:
    """Manage API Keys - Developer configures, users use for free"""
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        
        # Load from environment (developer config)
        self.config = APIKeyConfig(
            openai=os.getenv("OPENAI_API_KEY", ""),
            anthropic=os.getenv("ANTHROPIC_API_KEY", ""),
            deepseek=os.getenv("DEEPSEEK_API_KEY", ""),
            moonshot=os.getenv("MOONSHOT_API_KEY", ""),
            dashscope=os.getenv("DASHSCOPE_API_KEY", ""),
            doubao=os.getenv("DOUBAO_API_KEY", ""),
            tavily=os.getenv("TAVILY_API_KEY", ""),
            brave=os.getenv("BRAVE_API_KEY", ""),
            serper=os.getenv("SERPER_API_KEY", ""),
        )
        
        self._initialized = True
        self._log_available_keys()
    
    def _log_available_keys(self):
        """Log which providers have API keys configured"""
        available = []
        if self.config.openai: available.append("OpenAI")
        if self.config.anthropic: available.append("Anthropic")
        if self.config.deepseek: available.append("DeepSeek")
        if self.config.moonshot: available.append("Moonshot")
        if self.config.dashscope: available.append("Qwen")
        if self.config.doubao: available.append("Doubao")
        if self.config.tavily: available.append("Tavily")
        if self.config.brave: available.append("Brave")
        if self.config.serper: available.append("Serper")
        
        print(f"[API Keys] 已配置: {', '.join(available) if available else '无'}")
        if not available:
            print("[API Keys] 警告: 未配置任何 API Key，系统将在模拟模式运行")
    
    def get(self, provider: str) -> str:
        """Get API key for a provider"""
        key_map = {
            "openai": self.config.openai,
            "anthropic": self.config.anthropic,
            "deepseek": self.config.deepseek,
            "moonshot": self.config.moonshot,
            "qwen": self.config.dashscope,
            "doubao": self.config.doubao,
            "tavily": self.config.tavily,
            "brave": self.config.brave,
            "serper": self.config.serper,
        }
        return key_map.get(provider.lower(), "")
    
    def has_key(self, provider: str) -> bool:
        """Check if provider has API key"""
        return bool(self.get(provider))
    
    def get_available_providers(self) -> dict:
        """Get all available providers"""
        return {
            "llm": {
                "openai": bool(self.config.openai),
                "anthropic": bool(self.config.anthropic),
                "deepseek": bool(self.config.deepseek),
                "moonshot": bool(self.config.moonshot),
                "qwen": bool(self.config.dashscope),
                "doubao": bool(self.config.doubao),
            },
            "search": {
                "tavily": bool(self.config.tavily),
                "brave": bool(self.config.brave),
                "serper": bool(self.config.serper),
                "duckduckgo": True,  # Free, no key needed
            }
        }
    
    @property
    def is_configured(self) -> bool:
        """Check if any API key is configured"""
        return any([
            self.config.openai, self.config.anthropic, self.config.deepseek,
            self.config.moonshot, self.config.dashscope, self.config.doubao
        ])


# Singleton
_key_manager = None

def get_key_manager() -> APIKeyManager:
    global _key_manager
    if _key_manager is None:
        _key_manager = APIKeyManager()
    return _key_manager