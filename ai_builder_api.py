#!/usr/bin/env python3
"""
AI Builder API
VS Code-style AI assistant for building the platform
Multi-LLM router supporting Kimi, Qwen, Llama, and OpenClaw
"""

import os
import json
import subprocess
import httpx
import re
from pathlib import Path
from typing import Optional, List, Dict
from datetime import datetime
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, BackgroundTasks

# Router
router = APIRouter(prefix="/api/ai-builder", tags=["AI Builder"])

# Project root
PROJECT_ROOT = Path("/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw")

# ───────────────────────────────────────────────────────────────
# LLM Configuration
# ───────────────────────────────────────────────────────────────

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
KIMI_API_KEY = os.getenv("KIMI_API_KEY")
KIMI_API_URL = "https://api.moonshot.cn/v1/chat/completions"
KIMI_MODEL = os.getenv("KIMI_MODEL", "moonshot-v1-8k")
OPENCLAW_API_URL = os.getenv("OPENCLAW_API_URL", "")  # Optional real OpenClaw HTTP API

# ───────────────────────────────────────────────────────────────
# System Prompts per Model Persona
# ───────────────────────────────────────────────────────────────

KIMI_SYSTEM_PROMPT = """You are Kimi, an expert software engineer and code architect for the BigDataClaw NERVE platform.
You write clean, modern React + Vite + Tailwind CSS code and Python FastAPI backends.
When the user asks for code:
1. Write complete, working code
2. Use existing project conventions
3. Prefer functional React components with hooks
4. Use Tailwind CSS for styling
5. Return code inside markdown blocks with the file path in the language tag, e.g. ```jsx:nerve/src/components/Example.jsx
Always respond in this JSON format:
{
  "response": "conversational explanation",
  "code_blocks": [
    {
      "language": "jsx",
      "file_path": "relative/path/from/project/root",
      "content": "full file content"
    }
  ],
  "suggestions": ["next step 1", "next step 2"],
  "actions": [
    {"type": "create_file", "path": "relative/path", "description": "..."}
  ]
}"""

QWEN_SYSTEM_PROMPT = """You are Qwen, a balanced and thorough AI assistant for the BigDataClaw NERVE platform.
You excel at analysis, explanation, research, and general-purpose coding.
When the user asks a question, provide clear, well-structured answers.
If writing code, return complete, working examples using the project's stack (React, Vite, Tailwind, FastAPI).
Return your response in this JSON format:
{
  "response": "your helpful answer",
  "code_blocks": [],
  "suggestions": ["related question 1", "related question 2"],
  "actions": []
}"""

LLAMA_SYSTEM_PROMPT = """You are Llama, a careful and precise AI assistant focused on verification, testing, and factual correctness.
You review code for errors, write unit tests, and validate assumptions.
When the user asks you to check something, be rigorous and point out specific issues with line references if possible.
Return your response in this JSON format:
{
  "response": "your verification or test code",
  "code_blocks": [],
  "suggestions": [],
  "actions": []
}"""

OPENCLAW_SYSTEM_PROMPT = """You are OpenClaw, a creative and critical-thinking AI assistant for BigDataClaw.
You challenge assumptions, suggest optimizations, and generate bold ideas.
You think outside the box while staying practical.
Return your response in this JSON format:
{
  "response": "your creative or critical analysis",
  "code_blocks": [],
  "suggestions": ["idea 1", "idea 2"],
  "actions": []
}"""

# ───────────────────────────────────────────────────────────────
# Task Router
# ───────────────────────────────────────────────────────────────

TASK_KEYWORDS = {
    "code": [
        "create", "component", "fix", "error", "bug", "refactor", "code", "function",
        "class", "import", "export", "jsx", "react", "hook", "api", "endpoint",
        "database", "migration", "write", "implement", "build", "script", "file",
        "component", "page", "view", "style", "css", "tailwind", "monaco", "editor",
        "route", "router", "middleware", "schema", "model", "table", "query"
    ],
    "verify": [
        "check", "verify", "test", "validate", "confirm", "fact", "truth",
        "accurate", "correctness", "assert", "unit test", "review", "audit",
        "find issue", "what is wrong", "debug", "lint", "inspect", "prove"
    ],
    "ideate": [
        "idea", "brainstorm", "improve", "optimize", "suggest", "creative",
        "think", "challenge", "alternative", "what if", "envision", "innovate",
        "feature", "enhancement", "better way", "redesign", "reimagine"
    ],
}

MODEL_REGISTRY = {
    "kimi": {
        "name": "Kimi",
        "description": "Best for code generation and complex engineering tasks",
        "color": "#8b5cf6",
        "available": bool(KIMI_API_KEY),
    },
    "qwen": {
        "name": "Qwen",
        "description": "Balanced all-rounder running locally via Ollama",
        "color": "#06b6d4",
        "available": True,
    },
    "llama": {
        "name": "Llama",
        "description": "Reliable and precise — great for verification and testing",
        "color": "#10b981",
        "available": True,
    },
    "openclaw": {
        "name": "OpenClaw",
        "description": "Creative challenger and idea generator",
        "color": "#f59e0b",
        "available": True,  # Virtual via fallback if no API URL
    },
}


def classify_task(message: str) -> str:
    """Classify user message into a task type"""
    text = message.lower()
    scores = {"code": 0, "verify": 0, "ideate": 0, "analysis": 0}
    for task, keywords in TASK_KEYWORDS.items():
        for kw in keywords:
            if kw in text:
                scores[task] += 1
    # Tie-breaker: analysis is default
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "analysis"


def route_task(task_type: str, preferred_model: Optional[str] = None) -> str:
    """Return the model ID to use"""
    if preferred_model and preferred_model != "auto":
        if preferred_model in MODEL_REGISTRY:
            return preferred_model
    # Auto routing
    mapping = {
        "code": "kimi",
        "verify": "llama",
        "ideate": "openclaw",
        "analysis": "qwen",
    }
    model = mapping.get(task_type, "qwen")
    # Fallback if model unavailable
    if not MODEL_REGISTRY[model]["available"]:
        fallbacks = {
            "kimi": "qwen",
            "openclaw": "qwen",
            "llama": "qwen",
            "qwen": "kimi" if MODEL_REGISTRY["kimi"]["available"] else "llama",
        }
        model = fallbacks.get(model, "qwen")
    return model


# ───────────────────────────────────────────────────────────────
# LLM Client Wrappers
# ───────────────────────────────────────────────────────────────

async def _call_ollama(model: str, messages: List[Dict], temperature: float = 0.7, max_tokens: int = 2048) -> str:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{OLLAMA_HOST}/api/chat",
            json={
                "model": model,
                "messages": messages,
                "stream": False,
                "options": {
                    "temperature": temperature,
                    "num_predict": max_tokens,
                }
            },
            timeout=120.0,
        )
        response.raise_for_status()
        data = response.json()
        return data.get("message", {}).get("content", "")


async def _call_kimi(messages: List[Dict], temperature: float = 0.3, max_tokens: int = 2048) -> str:
    if not KIMI_API_KEY:
        raise RuntimeError("KIMI_API_KEY not configured")
    async with httpx.AsyncClient() as client:
        response = await client.post(
            KIMI_API_URL,
            headers={
                "Authorization": f"Bearer {KIMI_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": KIMI_MODEL,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
            },
            timeout=60.0,
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]


async def _call_openclaw(messages: List[Dict]) -> str:
    if OPENCLAW_API_URL:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{OPENCLAW_API_URL.rstrip('/')}/chat",
                json={"messages": messages},
                timeout=60.0,
            )
            response.raise_for_status()
            return response.json().get("response", "")
    # Virtual OpenClaw: fall back to Qwen with OpenClaw persona
    return await _call_ollama("llama3.1:8b", messages, temperature=0.8, max_tokens=2048)


def _build_messages(system_prompt: str, user_message: str, context: str, file_path: Optional[str], history: List[Dict]) -> List[Dict]:
    messages = [{"role": "system", "content": system_prompt}]
    # Add recent history (last 6 messages)
    if history:
        for h in history[-6:]:
            role = h.get("role", "user")
            if role in ("user", "assistant", "system"):
                messages.append({"role": role, "content": h.get("content", "")})
    # Build user prompt with context
    prompt_parts = [user_message]
    if file_path:
        prompt_parts.append(f"\n\n[Current file: {file_path}]")
    if context:
        prompt_parts.append(f"\n\n[File content]\n```\n{context[:4000]}\n```")
    messages.append({"role": "user", "content": "\n".join(prompt_parts)})
    return messages


def _parse_llm_response(raw_text: str, model_id: str) -> Dict:
    """Try to extract JSON from model response, fallback to wrapping text"""
    raw = raw_text.strip()
    # Try to extract JSON from markdown code block
    if "```json" in raw:
        raw = raw.split("```json")[1].split("```")[0].strip()
    elif raw.startswith("```") and "```" in raw[3:]:
        raw = raw[3:].split("```")[0].strip()
    try:
        parsed = json.loads(raw)
        return {
            "response": parsed.get("response", raw_text),
            "code_blocks": parsed.get("code_blocks", []),
            "suggestions": parsed.get("suggestions", []),
            "actions": parsed.get("actions", []),
        }
    except json.JSONDecodeError:
        pass
    # Try to find a JSON object anywhere in the text
    match = re.search(r'\{.*"response".*?\}', raw, re.DOTALL)
    if match:
        try:
            parsed = json.loads(match.group(0))
            return {
                "response": parsed.get("response", raw_text),
                "code_blocks": parsed.get("code_blocks", []),
                "suggestions": parsed.get("suggestions", []),
                "actions": parsed.get("actions", []),
            }
        except json.JSONDecodeError:
            pass
    # Some models omit outer braces — try to extract key-value pairs directly
    response_match = re.search(r'"response"\s*:\s*"((?:[^"\\]|\\.)*)"', raw)
    if response_match:
        return {
            "response": response_match.group(1).replace('\\"', '"').replace("\\n", "\n"),
            "code_blocks": [],
            "suggestions": [],
            "actions": [],
        }
    # Fallback: wrap the entire text as response
    return {
        "response": raw_text,
        "code_blocks": [],
        "suggestions": [],
        "actions": [],
    }


async def generate_ai_response(
    message: str,
    model_id: str,
    context: str = "",
    file_path: Optional[str] = None,
    conversation_history: Optional[List[Dict]] = None,
) -> Dict:
    """Route to the selected model and return a normalized response"""
    history = conversation_history or []

    if model_id == "kimi":
        messages = _build_messages(KIMI_SYSTEM_PROMPT, message, context, file_path, history)
        raw = await _call_kimi(messages, temperature=0.3)
        parsed = _parse_llm_response(raw, model_id)

    elif model_id == "qwen":
        messages = _build_messages(QWEN_SYSTEM_PROMPT, message, context, file_path, history)
        raw = await _call_ollama("qwen2.5:14b", messages, temperature=0.7)
        parsed = _parse_llm_response(raw, model_id)

    elif model_id == "llama":
        messages = _build_messages(LLAMA_SYSTEM_PROMPT, message, context, file_path, history)
        raw = await _call_ollama("llama3.1:8b", messages, temperature=0.5)
        parsed = _parse_llm_response(raw, model_id)

    elif model_id == "openclaw":
        messages = _build_messages(OPENCLAW_SYSTEM_PROMPT, message, context, file_path, history)
        raw = await _call_openclaw(messages)
        parsed = _parse_llm_response(raw, model_id)

    else:
        raise ValueError(f"Unknown model: {model_id}")

    return {
        **parsed,
        "model_used": model_id,
        "task_type": classify_task(message),
    }


# ───────────────────────────────────────────────────────────────
# API Models
# ───────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str  # 'user', 'assistant', 'system'
    content: str
    timestamp: Optional[str] = None


class CodeRequest(BaseModel):
    message: str
    context: Optional[str] = ""  # Current file content
    file_path: Optional[str] = None
    conversation_history: Optional[List[ChatMessage]] = []
    model: Optional[str] = "auto"  # auto, kimi, qwen, llama, openclaw


class FileOperation(BaseModel):
    path: str
    content: Optional[str] = None


class AIBuilderSession:
    """Manages AI Builder session state"""

    def __init__(self):
        self.conversations: Dict[str, List[ChatMessage]] = {}
        self.current_file: Optional[str] = None

    def get_conversation(self, session_id: str) -> List[ChatMessage]:
        return self.conversations.get(session_id, [])

    def add_message(self, session_id: str, message: ChatMessage):
        if session_id not in self.conversations:
            self.conversations[session_id] = []
        self.conversations[session_id].append(message)


# Global session manager
session_manager = AIBuilderSession()

# ───────────────────────────────────────────────────────────────
# Endpoints
# ───────────────────────────────────────────────────────────────

@router.get("/models")
async def list_models():
    """List available LLMs and their capabilities"""
    return {
        "models": MODEL_REGISTRY,
        "default": "auto",
        "routing": {
            "code": "kimi",
            "verify": "llama",
            "ideate": "openclaw",
            "analysis": "qwen",
        }
    }


@router.get("/files")
async def list_files(path: str = ""):
    """List files and directories"""
    try:
        target_path = PROJECT_ROOT / path if path else PROJECT_ROOT

        if not target_path.exists():
            raise HTTPException(status_code=404, detail="Path not found")

        items = []
        for item in sorted(target_path.iterdir()):
            # Skip hidden files and node_modules
            if item.name.startswith('.') or item.name == 'node_modules':
                continue

            items.append({
                'name': item.name,
                'path': str(item.relative_to(PROJECT_ROOT)),
                'type': 'directory' if item.is_dir() else 'file',
                'size': item.stat().st_size if item.is_file() else None,
                'modified': datetime.fromtimestamp(item.stat().st_mtime).isoformat()
            })

        return {
            'current_path': path,
            'items': items,
            'is_root': path == ""
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/file")
async def read_file(path: str):
    """Read file content"""
    try:
        file_path = PROJECT_ROOT / path

        # Security check - ensure file is within project
        if not str(file_path.resolve()).startswith(str(PROJECT_ROOT.resolve())):
            raise HTTPException(status_code=403, detail="Access denied")

        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")

        if not file_path.is_file():
            raise HTTPException(status_code=400, detail="Not a file")

        # Read file content
        content = file_path.read_text(encoding='utf-8', errors='replace')

        return {
            'path': path,
            'content': content,
            'language': get_language_from_path(path),
            'size': len(content)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/file")
async def write_file(operation: FileOperation):
    """Write file content"""
    try:
        file_path = PROJECT_ROOT / operation.path

        # Security check
        if not str(file_path.resolve()).startswith(str(PROJECT_ROOT.resolve())):
            raise HTTPException(status_code=403, detail="Access denied")

        # Create parent directories if needed
        file_path.parent.mkdir(parents=True, exist_ok=True)

        # Write file
        file_path.write_text(operation.content or '', encoding='utf-8')

        return {
            'success': True,
            'path': operation.path,
            'message': 'File saved successfully'
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/file")
async def delete_file(path: str):
    """Delete a file"""
    try:
        file_path = PROJECT_ROOT / path

        # Security check
        if not str(file_path.resolve()).startswith(str(PROJECT_ROOT.resolve())):
            raise HTTPException(status_code=403, detail="Access denied")

        if file_path.is_file():
            file_path.unlink()
        elif file_path.is_dir():
            import shutil
            shutil.rmtree(file_path)

        return {
            'success': True,
            'path': path,
            'message': 'Deleted successfully'
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat")
async def chat_with_ai(request: CodeRequest, background_tasks: BackgroundTasks):
    """Chat with AI assistant for code help — multi-LLM routed"""
    try:
        task_type = classify_task(request.message)
        model_id = route_task(task_type, request.model)

        # Check if any real LLM is available; if not, use mock
        all_offline = not any(m["available"] for m in MODEL_REGISTRY.values())
        if all_offline:
            return generate_mock_response(request)

        result = await generate_ai_response(
            message=request.message,
            model_id=model_id,
            context=request.context or "",
            file_path=request.file_path,
            conversation_history=[
                {"role": m.role, "content": m.content}
                for m in (request.conversation_history or [])
            ],
        )

        return result

    except httpx.HTTPStatusError as e:
        # Auth or rate limit error from primary model — try fallback chain
        print(f"⚠️ LLM HTTP error ({e}), attempting fallback")
        fallback_order = ["llama", "qwen", "openclaw"] if model_id == "kimi" else ["llama", "qwen", "openclaw"]
        for fallback_id in fallback_order:
            if fallback_id == model_id:
                continue
            try:
                result = await generate_ai_response(
                    message=request.message,
                    model_id=fallback_id,
                    context=request.context or "",
                    file_path=request.file_path,
                    conversation_history=[
                        {"role": m.role, "content": m.content}
                        for m in (request.conversation_history or [])
                    ],
                )
                return result
            except Exception as fb_err:
                print(f"⚠️ Fallback {fallback_id} failed: {fb_err}")
                continue
        # All fallbacks exhausted
        mock = generate_mock_response(request)
        mock["model_used"] = "mock"
        mock["task_type"] = classify_task(request.message)
        return mock
    except httpx.ConnectError as e:
        # Ollama or remote API unreachable — fall back to mock
        print(f"⚠️ LLM connection error ({e}), using mock response")
        mock = generate_mock_response(request)
        mock["model_used"] = "mock"
        mock["task_type"] = classify_task(request.message)
        return mock
    except Exception as e:
        print(f"⚠️ Chat error: {e}, using mock response")
        mock = generate_mock_response(request)
        mock["model_used"] = "mock"
        mock["task_type"] = classify_task(request.message)
        return mock


def generate_mock_response(request: CodeRequest):
    """Generate mock AI response for demo"""
    message = request.message.lower()
    model_used = getattr(request, 'model', 'auto') or 'auto'

    # Determine intent and generate appropriate response
    if 'create' in message and 'component' in message:
        return {
            'response': "I'll create a new React component for you. Here's the code:",
            'code_blocks': [
                {
                    'language': 'jsx',
                    'file_path': 'nerve/src/components/NewComponent.jsx',
                    'content': '''import React from 'react';

const NewComponent = () => {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">New Component</h1>
      <p>This is your new component!</p>
    </div>
  );
};

export default NewComponent;'''
                }
            ],
            'actions': [
                {
                    'type': 'create_file',
                    'path': 'nerve/src/components/NewComponent.jsx',
                    'description': 'Create the component file'
                }
            ],
            'model_used': model_used if model_used != 'auto' else 'mock',
            'task_type': 'code'
        }

    elif 'fix' in message or 'error' in message:
        return {
            'response': "I can see the issue. Here's the fix:",
            'code_blocks': [
                {
                    'language': 'javascript',
                    'content': '// Fixed code here',
                    'explanation': 'The issue was...'
                }
            ],
            'actions': [
                {
                    'type': 'apply_fix',
                    'description': 'Apply the suggested fix'
                }
            ],
            'model_used': model_used if model_used != 'auto' else 'mock',
            'task_type': 'verify'
        }

    elif 'style' in message or 'css' in message or 'tailwind' in message:
        return {
            'response': "Here's the Tailwind CSS styling for your component:",
            'code_blocks': [
                {
                    'language': 'jsx',
                    'content': '<div className="bg-bg-card border border-border-subtle rounded-xl p-6 shadow-lg">\n  <h2 className="text-lg font-semibold text-text-primary">Styled Component</h2>\n  <p className="text-text-secondary mt-2">This is styled with Tailwind!</p>\n</div>'
                }
            ],
            'model_used': model_used if model_used != 'auto' else 'mock',
            'task_type': 'code'
        }

    elif 'explain' in message or 'how' in message:
        return {
            'response': "Let me explain how this works:\n\n1. The component receives props\n2. It renders the UI based on state\n3. Events update the state\n4. The UI re-renders automatically",
            'code_blocks': [],
            'suggestions': [
                'Show me an example',
                'How do I add state?',
                'How do I handle events?'
            ],
            'model_used': model_used if model_used != 'auto' else 'mock',
            'task_type': 'analysis'
        }

    else:
        return {
            'response': "I can help you with:\n\n• Creating new components\n• Fixing errors\n• Adding styles\n• Explaining code\n• Refactoring\n\nWhat would you like to work on?",
            'suggestions': [
                'Create a new component',
                'Fix an error',
                'Add styling',
                'Explain the code'
            ],
            'model_used': model_used if model_used != 'auto' else 'mock',
            'task_type': 'analysis'
        }


@router.post("/execute")
async def execute_command(command: str):
    """Execute a shell command (restricted)"""
    try:
        # Whitelist of allowed commands
        allowed_commands = ['npm', 'node', 'git', 'ls', 'cat', 'echo']

        cmd_parts = command.split()
        if not cmd_parts or cmd_parts[0] not in allowed_commands:
            raise HTTPException(status_code=400, detail="Command not allowed")

        # Execute command
        result = subprocess.run(
            cmd_parts,
            cwd=PROJECT_ROOT,
            capture_output=True,
            text=True,
            timeout=30
        )

        return {
            'stdout': result.stdout,
            'stderr': result.stderr,
            'returncode': result.returncode
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search")
async def search_files(q: str):
    """Search files by content"""
    try:
        results = []

        for root, dirs, files in os.walk(PROJECT_ROOT):
            # Skip node_modules and hidden
            dirs[:] = [d for d in dirs if not d.startswith('.') and d != 'node_modules']

            for file in files:
                if file.startswith('.'):
                    continue

                file_path = Path(root) / file

                try:
                    content = file_path.read_text(encoding='utf-8', errors='ignore')

                    if q.lower() in content.lower():
                        # Find line numbers
                        lines = content.split('\n')
                        matches = []

                        for i, line in enumerate(lines, 1):
                            if q.lower() in line.lower():
                                matches.append({
                                    'line': i,
                                    'content': line.strip()
                                })

                        if matches:
                            results.append({
                                'path': str(file_path.relative_to(PROJECT_ROOT)),
                                'matches': matches[:5]  # Limit matches per file
                            })

                except Exception:
                    continue

        return {
            'query': q,
            'results': results[:20],  # Limit total results
            'total': len(results)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def get_language_from_path(file_path: str) -> str:
    """Determine programming language from file extension"""
    ext_map = {
        '.js': 'javascript',
        '.jsx': 'jsx',
        '.ts': 'typescript',
        '.tsx': 'tsx',
        '.py': 'python',
        '.html': 'html',
        '.css': 'css',
        '.scss': 'scss',
        '.json': 'json',
        '.md': 'markdown',
        '.sql': 'sql',
        '.sh': 'shell',
        '.yml': 'yaml',
        '.yaml': 'yaml',
        '.vue': 'vue',
        '.svelte': 'svelte'
    }

    ext = Path(file_path).suffix.lower()
    return ext_map.get(ext, 'plaintext')
