#!/usr/bin/env python3
"""
AI Builder API
VS Code-style AI assistant for building the platform
Integrates with OpenAI/Claude for code generation
"""

import os
import json
import subprocess
from pathlib import Path
from typing import Optional, List, Dict
from datetime import datetime
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, BackgroundTasks

# Router
router = APIRouter(prefix="/api/ai-builder", tags=["AI Builder"])

# Project root
PROJECT_ROOT = Path('/home/jamie/Desktop/Jamie\'s Personal Vault/bigdataclaw')

class ChatMessage(BaseModel):
    role: str  # 'user', 'assistant', 'system'
    content: str
    timestamp: Optional[str] = None

class CodeRequest(BaseModel):
    message: str
    context: Optional[str] = ""  # Current file content
    file_path: Optional[str] = None
    conversation_history: Optional[List[ChatMessage]] = []

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
    """Chat with AI assistant for code help"""
    try:
        # Get API key from environment
        api_key = os.getenv('OPENAI_API_KEY') or os.getenv('ANTHROPIC_API_KEY')
        
        if not api_key:
            # Return mock response for demo
            return generate_mock_response(request)
        
        # TODO: Implement actual AI integration
        # For now, return mock response
        return generate_mock_response(request)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def generate_mock_response(request: CodeRequest):
    """Generate mock AI response for demo"""
    message = request.message.lower()
    
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
            ]
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
            ]
        }
    
    elif 'style' in message or 'css' in message or 'tailwind' in message:
        return {
            'response': "Here's the Tailwind CSS styling for your component:",
            'code_blocks': [
                {
                    'language': 'jsx',
                    'content': '<div className="bg-bg-card border border-border-subtle rounded-xl p-6 shadow-lg">\n  <h2 className="text-lg font-semibold text-text-primary">Styled Component</h2>\n  <p className="text-text-secondary mt-2">This is styled with Tailwind!</p>\n</div>'
                }
            ]
        }
    
    elif 'explain' in message or 'how' in message:
        return {
            'response': "Let me explain how this works:\n\n1. The component receives props\n2. It renders the UI based on state\n3. Events update the state\n4. The UI re-renders automatically",
            'code_blocks': [],
            'suggestions': [
                'Show me an example',
                'How do I add state?',
                'How do I handle events?'
            ]
        }
    
    else:
        return {
            'response': "I can help you with:\n\n• Creating new components\n• Fixing errors\n• Adding styles\n• Explaining code\n• Refactoring\n\nWhat would you like to work on?",
            'suggestions': [
                'Create a new component',
                'Fix an error',
                'Add styling',
                'Explain the code'
            ]
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
