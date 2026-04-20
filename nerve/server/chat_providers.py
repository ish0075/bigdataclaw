"""
Chat provider abstraction for Mission Control.
Supports Kimi (primary), OpenAI (fallback), and Ollama/Gemma4 (local).
"""

import os
import json
import asyncio
from abc import ABC, abstractmethod
from typing import AsyncGenerator, List, Dict, Optional

import httpx


# ---------------------------------------------------------------------------
# Provider interface
# ---------------------------------------------------------------------------

class ChatProvider(ABC):
    """Abstract chat provider."""

    @abstractmethod
    async def complete(self, messages: List[Dict[str, str]], mode: str = "fast", persona: str = "concierge") -> str:
        """Non-streaming completion."""
        ...

    @abstractmethod
    async def stream(self, messages: List[Dict[str, str]], mode: str = "fast", persona: str = "concierge") -> AsyncGenerator[str, None]:
        """Streaming completion — yields token chunks."""
        ...

    @property
    @abstractmethod
    def name(self) -> str:
        ...

    @property
    def available(self) -> bool:
        return True


# ---------------------------------------------------------------------------
# Kimi / Moonshot provider (primary — branded as Gemma4/OpenClaw)
# ---------------------------------------------------------------------------

KIMI_API_URL = "https://api.moonshot.cn/v1/chat/completions"
KIMI_MODEL_FAST = "moonshot-v1-8k"
KIMI_MODEL_DEEP = "moonshot-v1-32k"
KIMI_MODEL_REPORT = "moonshot-v1-128k"

PERSONA_PROMPTS = {
    "concierge": """You are Gemma 4, the friendly Website Concierge for Mission Control — a commercial real estate intelligence platform.

Your job:
• Greet visitors and explain what Mission Control does
• Answer general questions about CRE, the platform, and pricing
• Guide users to the right tools (Buyer Matcher, Lender Matcher, Hot Money, etc.)
• Capture interest — suggest signing up or booking a demo

Rules:
• NEVER expose internal database details or raw record counts beyond what's public
• Keep responses friendly and conversational
• Suggest next steps ("Try the Buyer Matcher", "View our Hot Money radar")
• If asked for deep data analysis, offer to connect them with a specialist
""",
    "analyst": """You are Gemma 4, the Mission Control Analyst — a deep CRE intelligence agent with direct access to live data.

You have access to TOOLS. When you need data, respond with:
TOOL_CALL: {"tool": "tool_name", "args": {...}}

Available tools:
{tool_schemas}

After receiving tool results, synthesize them into a clear, actionable answer.
Always cite specific numbers and entities from the data.

Rules:
• Use tools when the user asks for specific data (buyers, lenders, deals, stats)
• Do not hallucinate data — always use tools or say you don't have it
• Format results with markdown (bold, bullet points)
• Suggest next actions based on findings
""",
}

MODE_PROMPTS = {
    "fast": "\nMode: FAST — Keep answers to 2-3 sentences. Prioritize speed and clarity.",
    "deep": "\nMode: DEEP — Provide thorough analysis with specific data points, numbers, and reasoning. Include actionable next steps.",
    "report": "\nMode: REPORT — Generate a structured report with sections: Summary, Key Findings, Data Points, Recommendations, Next Steps.",
}


class KimiProvider(ChatProvider):
    """Kimi / Moonshot API provider."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("KIMI_API_KEY", "")
        self._client = httpx.AsyncClient(timeout=60.0)

    @property
    def name(self) -> str:
        return "kimi"

    @property
    def available(self) -> bool:
        return bool(self.api_key)

    def _model_for_mode(self, mode: str) -> str:
        return {
            "fast": KIMI_MODEL_FAST,
            "deep": KIMI_MODEL_DEEP,
            "report": KIMI_MODEL_REPORT,
        }.get(mode, KIMI_MODEL_FAST)

    def _build_messages(self, messages: List[Dict[str, str]], mode: str, persona: str = "concierge") -> List[Dict[str, str]]:
        from tool_executor import get_tool_schemas_json
        base_prompt = PERSONA_PROMPTS.get(persona, PERSONA_PROMPTS["concierge"])
        if persona == "analyst":
            base_prompt = base_prompt.replace("{tool_schemas}", get_tool_schemas_json())
        system = base_prompt + MODE_PROMPTS.get(mode, "")
        return [{"role": "system", "content": system}] + messages

    async def complete(self, messages: List[Dict[str, str]], mode: str = "fast", persona: str = "concierge") -> str:
        if not self.api_key:
            raise RuntimeError("KIMI_API_KEY not configured")

        payload = {
            "model": self._model_for_mode(mode),
            "messages": self._build_messages(messages, mode, persona),
            "temperature": 0.7,
            "max_tokens": 1200 if mode == "report" else 800,
        }
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        response = await self._client.post(KIMI_API_URL, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]

    async def stream(self, messages: List[Dict[str, str]], mode: str = "fast", persona: str = "concierge") -> AsyncGenerator[str, None]:
        if not self.api_key:
            raise RuntimeError("KIMI_API_KEY not configured")

        payload = {
            "model": self._model_for_mode(mode),
            "messages": self._build_messages(messages, mode, persona),
            "temperature": 0.7,
            "max_tokens": 1200 if mode == "report" else 800,
            "stream": True,
        }
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        async with self._client.stream("POST", KIMI_API_URL, json=payload, headers=headers) as resp:
            async for line in resp.aiter_lines():
                if not line.strip():
                    continue
                if line.startswith("data: "):
                    data = line[6:]
                    if data == "[DONE]":
                        break
                    try:
                        chunk = json.loads(data)
                        delta = chunk.get("choices", [{}])[0].get("delta", {})
                        token = delta.get("content", "")
                        if token:
                            yield token
                    except json.JSONDecodeError:
                        continue


# ---------------------------------------------------------------------------
# OpenAI provider (fallback)
# ---------------------------------------------------------------------------

class OpenAIProvider(ChatProvider):
    """OpenAI API provider."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY", "")
        self._client = httpx.AsyncClient(timeout=60.0)

    @property
    def name(self) -> str:
        return "openai"

    @property
    def available(self) -> bool:
        return bool(self.api_key)

    def _build_messages(self, messages: List[Dict[str, str]], mode: str, persona: str = "concierge") -> List[Dict[str, str]]:
        from tool_executor import get_tool_schemas_json
        base_prompt = PERSONA_PROMPTS.get(persona, PERSONA_PROMPTS["concierge"])
        if persona == "analyst":
            base_prompt = base_prompt.replace("{tool_schemas}", get_tool_schemas_json())
        system = base_prompt + MODE_PROMPTS.get(mode, "")
        return [{"role": "system", "content": system}] + messages

    async def complete(self, messages: List[Dict[str, str]], mode: str = "fast", persona: str = "concierge") -> str:
        if not self.api_key:
            raise RuntimeError("OPENAI_API_KEY not configured")

        payload = {
            "model": "gpt-4o-mini",
            "messages": self._build_messages(messages, mode, persona),
            "temperature": 0.7,
            "max_tokens": 1200 if mode == "report" else 800,
        }
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        response = await self._client.post("https://api.openai.com/v1/chat/completions", json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]

    async def stream(self, messages: List[Dict[str, str]], mode: str = "fast", persona: str = "concierge") -> AsyncGenerator[str, None]:
        if not self.api_key:
            raise RuntimeError("OPENAI_API_KEY not configured")

        payload = {
            "model": "gpt-4o-mini",
            "messages": self._build_messages(messages, mode, persona),
            "temperature": 0.7,
            "max_tokens": 1200 if mode == "report" else 800,
            "stream": True,
        }
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        async with self._client.stream("POST", "https://api.openai.com/v1/chat/completions", json=payload, headers=headers) as resp:
            async for line in resp.aiter_lines():
                if not line.strip():
                    continue
                if line.startswith("data: "):
                    data = line[6:]
                    if data == "[DONE]":
                        break
                    try:
                        chunk = json.loads(data)
                        delta = chunk.get("choices", [{}])[0].get("delta", {})
                        token = delta.get("content", "")
                        if token:
                            yield token
                    except json.JSONDecodeError:
                        continue


# ---------------------------------------------------------------------------
# Ollama / Gemma4 local provider
# ---------------------------------------------------------------------------

class Gemma4OllamaProvider(ChatProvider):
    """Local Ollama-backed Gemma 4 provider."""

    def __init__(self, host: Optional[str] = None, model: Optional[str] = None):
        self.host = (host or os.getenv("OLLAMA_HOST", "http://localhost:11434")).rstrip("/")
        self.model = model or os.getenv("OLLAMA_MODEL", "gemma4:26b")
        self._client = httpx.AsyncClient(timeout=120.0)

    @property
    def name(self) -> str:
        return "gemma4-ollama"

    @property
    def available(self) -> bool:
        try:
            r = httpx.get(f"{self.host}/api/tags", timeout=5)
            return r.status_code == 200
        except Exception:
            return False

    def _build_messages(self, messages: List[Dict[str, str]], mode: str, persona: str = "concierge") -> List[Dict[str, str]]:
        from tool_executor import get_tool_schemas_json
        base_prompt = PERSONA_PROMPTS.get(persona, PERSONA_PROMPTS["concierge"])
        if persona == "analyst":
            base_prompt = base_prompt.replace("{tool_schemas}", get_tool_schemas_json())
        system = base_prompt + MODE_PROMPTS.get(mode, "")
        return [{"role": "system", "content": system}] + messages

    async def complete(self, messages: List[Dict[str, str]], mode: str = "fast", persona: str = "concierge") -> str:
        payload = {
            "model": self.model,
            "messages": self._build_messages(messages, mode, persona),
            "stream": False,
            "options": {"temperature": 0.7, "num_ctx": 8192},
        }
        response = await self._client.post(f"{self.host}/api/chat", json=payload)
        response.raise_for_status()
        return response.json().get("message", {}).get("content", "")

    async def stream(self, messages: List[Dict[str, str]], mode: str = "fast", persona: str = "concierge") -> AsyncGenerator[str, None]:
        payload = {
            "model": self.model,
            "messages": self._build_messages(messages, mode, persona),
            "stream": True,
            "options": {"temperature": 0.7, "num_ctx": 8192},
        }

        async with self._client.stream("POST", f"{self.host}/api/chat", json=payload) as resp:
            async for line in resp.aiter_lines():
                if not line.strip():
                    continue
                try:
                    data = json.loads(line)
                    chunk = data.get("message", {}).get("content", "")
                    if chunk:
                        yield chunk
                except json.JSONDecodeError:
                    continue


# ---------------------------------------------------------------------------
# Provider registry / factory
# ---------------------------------------------------------------------------

class ProviderRegistry:
    """Registry that picks the best available provider."""

    _providers: List[ChatProvider] = []

    @classmethod
    def discover(cls) -> ChatProvider:
        """Return the first available provider in priority order.
        
        Priority:
        1. Local Gemma4 (Ollama) — fastest, no API costs, user-preferred
        2. Kimi (Moonshot) — remote, reliable fallback
        3. OpenAI — final fallback
        """
        if not cls._providers:
            cls._providers = [
                Gemma4OllamaProvider(),  # Primary — local Gemma4
                KimiProvider(),          # Fallback — remote Kimi
                OpenAIProvider(),        # Final fallback
            ]
        for provider in cls._providers:
            if provider.available:
                return provider
        raise RuntimeError("No chat provider available. Start Ollama (gemma4), or set KIMI_API_KEY / OPENAI_API_KEY.")

    @classmethod
    def get(cls, name: str) -> ChatProvider:
        """Get a specific provider by name."""
        name = name.lower()
        mapping = {
            "kimi": KimiProvider,
            "openai": OpenAIProvider,
            "gemma4": Gemma4OllamaProvider,
            "ollama": Gemma4OllamaProvider,
        }
        provider_cls = mapping.get(name)
        if not provider_cls:
            raise ValueError(f"Unknown provider: {name}")
        provider = provider_cls()
        if not provider.available:
            raise RuntimeError(f"Provider '{name}' is not available (missing API key or service).")
        return provider


# Singleton accessor
def get_provider(name: Optional[str] = None) -> ChatProvider:
    if name:
        return ProviderRegistry.get(name)
    return ProviderRegistry.discover()
