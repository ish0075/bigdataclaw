#!/usr/bin/env python3
"""
Obsidian Integration API - CORRECTED Architecture

Main Working Vault: /home/jamie/Desktop/Jamie's Personal Vault (READ + WRITE)
BDAIV2 Vault: /home/jamie/Documents/BDAIV2 (READ ONLY - NEVER WRITE HERE)

All writes (sessions, agent workspaces, etc.) go to Main Working Vault ONLY.
BDAIV2 is for reference data only - no writes ever.
"""

import os
import json
import re
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

router = APIRouter(prefix="/api/obsidian", tags=["Obsidian Integration"])

# Configuration
DEFAULT_API_KEY = os.environ.get(
    'OBSIDIAN_API_KEY',
    'REDACTED_OBSIDIAN_API_KEY'
)

# Vault Configuration
MAIN_VAULT_URL = os.environ.get('MAIN_VAULT_URL', 'https://127.0.0.1:27124')
MAIN_VAULT_PATH = "/home/jamie/Desktop/Jamie's Personal Vault"

BDAIV2_URL = os.environ.get('BDAIV2_URL', 'https://127.0.0.1:27125')  # If/when active
BDAIV2_PATH = "/home/jamie/Documents/BDAIV2"

# ============================================================================
# Pydantic Models
# ============================================================================

class ObsidianStatus(BaseModel):
    vault: str
    connected: bool
    path: str
    total_files: int
    mode: str  # "read-write" or "read-only"

class CreateNoteRequest(BaseModel):
    path: str
    content: str
    frontmatter: Optional[Dict[str, Any]] = {}
    folder: Optional[str] = None

class UpdateNoteRequest(BaseModel):
    content: str
    frontmatter: Optional[Dict[str, Any]] = None

class SearchRequest(BaseModel):
    query: str
    vault: str = "main"  # "main" or "bdaiv2"
    limit: int = 20

# ============================================================================
# Vault Clients
# ============================================================================

class ObsidianVaultClient:
    """Base client for Obsidian REST API"""
    
    def __init__(self, base_url: str, api_key: str, vault_path: str, read_only: bool = False):
        self.base_url = base_url
        self.api_key = api_key
        self.vault_path = vault_path
        self.read_only = read_only
        self.headers = {'Authorization': f'Bearer {api_key}'}
    
    def request(self, method: str, path: str, **kwargs) -> requests.Response:
        """Make request to Obsidian API"""
        url = f"{self.base_url}{path}"
        headers = {**self.headers, **kwargs.pop('headers', {})}
        return requests.request(
            method, url, headers=headers, verify=False, timeout=30, **kwargs
        )
    
    def test_connection(self) -> tuple[bool, dict]:
        """Test connection to vault"""
        try:
            resp = self.request('GET', '/vault/')
            if resp.status_code == 200:
                return True, resp.json()
            return False, {"error": f"HTTP {resp.status_code}"}
        except Exception as e:
            return False, {"error": str(e)}
    
    def list_files(self) -> List[str]:
        """List all files"""
        try:
            resp = self.request('GET', '/vault/')
            if resp.status_code == 200:
                return resp.json().get('files', [])
            return []
        except:
            return []
    
    def get_file(self, path: str) -> Optional[str]:
        """Get file content"""
        try:
            encoded_path = requests.utils.quote(path)
            resp = self.request('GET', f'/vault/{encoded_path}')
            if resp.status_code == 200:
                return resp.text
            return None
        except:
            return None
    
    def search(self, query: str) -> List[Dict]:
        """Search vault"""
        try:
            resp = self.request('POST', '/search/',
                              headers={'Content-Type': 'application/json'},
                              json={'query': query})
            if resp.status_code == 200:
                return resp.json()
            return []
        except:
            return []
    
    # WRITE OPERATIONS - Only for non-read-only vaults
    def create_file(self, path: str, content: str) -> bool:
        """Create new file - BLOCKED if read-only"""
        if self.read_only:
            raise PermissionError(f"Cannot write to {self.vault_path} - read-only vault")
        
        try:
            encoded_path = requests.utils.quote(path)
            resp = self.request('PUT', f'/vault/{encoded_path}',
                              data=content,
                              headers={'Content-Type': 'text/markdown'})
            return resp.status_code in (200, 204)
        except Exception as e:
            print(f"Error creating file: {e}")
            return False
    
    def update_file(self, path: str, content: str) -> bool:
        """Update file - BLOCKED if read-only"""
        if self.read_only:
            raise PermissionError(f"Cannot write to {self.vault_path} - read-only vault")
        
        try:
            encoded_path = requests.utils.quote(path)
            resp = self.request('PUT', f'/vault/{encoded_path}',
                              data=content,
                              headers={'Content-Type': 'text/markdown'})
            return resp.status_code in (200, 204)
        except:
            return False
    
    def delete_file(self, path: str) -> bool:
        """Delete file - BLOCKED if read-only"""
        if self.read_only:
            raise PermissionError(f"Cannot delete from {self.vault_path} - read-only vault")
        
        try:
            encoded_path = requests.utils.quote(path)
            resp = self.request('DELETE', f'/vault/{encoded_path}')
            return resp.status_code in (200, 204)
        except:
            return False


# Initialize clients
main_vault = ObsidianVaultClient(
    base_url=MAIN_VAULT_URL,
    api_key=DEFAULT_API_KEY,
    vault_path=MAIN_VAULT_PATH,
    read_only=False  # Main vault allows writes
)

bdaiv2_vault = ObsidianVaultClient(
    base_url=BDAIV2_URL,
    api_key=DEFAULT_API_KEY,
    vault_path=BDAIV2_PATH,
    read_only=True  # BDAIV2 is read-only
)

# ============================================================================
# API Endpoints
# ============================================================================

@router.get("/status")
async def get_status(vault: str = Query("main", enum=["main", "bdaiv2", "all"])):
    """Get vault status"""
    result = {}
    
    if vault in ["main", "all"]:
        connected, data = main_vault.test_connection()
        result["main_vault"] = ObsidianStatus(
            vault="main",
            connected=connected,
            path=MAIN_VAULT_PATH,
            total_files=len(data.get('files', [])) if connected else 0,
            mode="read-write"
        ).dict()
    
    if vault in ["bdaiv2", "all"]:
        connected, data = bdaiv2_vault.test_connection()
        result["bdaiv2_vault"] = ObsidianStatus(
            vault="bdaiv2",
            connected=connected,
            path=BDAIV2_PATH,
            total_files=len(data.get('files', [])) if connected else 0,
            mode="read-only"
        ).dict()
    
    return result

@router.get("/files")
async def list_files(
    vault: str = Query("main", enum=["main", "bdaiv2"]),
    folder: Optional[str] = None
):
    """List files from vault"""
    client = main_vault if vault == "main" else bdaiv2_vault
    files = client.list_files()
    
    if folder:
        files = [f for f in files if f.startswith(folder)]
    
    return {
        "vault": vault,
        "files": files,
        "total": len(files),
        "mode": "read-write" if vault == "main" else "read-only"
    }

@router.get("/files/{file_path:path}")
async def get_file(file_path: str, vault: str = Query("main", enum=["main", "bdaiv2"])):
    """Get file content"""
    client = main_vault if vault == "main" else bdaiv2_vault
    content = client.get_file(file_path)
    
    if content is None:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Parse frontmatter
    frontmatter = {}
    body = content
    if content.startswith('---'):
        try:
            fm_end = content.find('---', 3)
            if fm_end > 0:
                fm_text = content[3:fm_end].strip()
                for line in fm_text.split('\n'):
                    if ':' in line:
                        key, value = line.split(':', 1)
                        frontmatter[key.strip()] = value.strip().strip('"').strip("'")
                body = content[fm_end+3:].strip()
        except:
            pass
    
    return {
        "vault": vault,
        "path": file_path,
        "content": body,
        "frontmatter": frontmatter,
        "raw": content
    }

@router.post("/files")
async def create_file(request: CreateNoteRequest):
    """
    Create file - ALWAYS writes to Main Working Vault
    NEVER writes to BDAIV2 (read-only)
    """
    # Force write to main vault
    vault = "main"
    client = main_vault
    
    # Build path
    if request.folder:
        full_path = f"{request.folder}/{request.path}"
    else:
        full_path = request.path
    
    if not full_path.endswith('.md'):
        full_path += '.md'
    
    # Build content with frontmatter
    content = request.content
    if request.frontmatter:
        fm_lines = ["---"]
        for key, value in request.frontmatter.items():
            if isinstance(value, list):
                fm_lines.append(f"{key}: {json.dumps(value)}")
            else:
                fm_lines.append(f"{key}: {value}")
        fm_lines.append("---")
        fm_lines.append("")
        content = '\n'.join(fm_lines) + content
    
    # Create in main vault
    success = client.create_file(full_path, content)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to create file")
    
    return {
        "success": True,
        "vault": vault,
        "path": full_path,
        "message": f"File created in Main Working Vault: {full_path}"
    }

@router.put("/files/{file_path:path}")
async def update_file(file_path: str, request: UpdateNoteRequest):
    """
    Update file - ALWAYS updates in Main Working Vault
    """
    # Always use main vault
    client = main_vault
    
    # Get current content if exists
    current = client.get_file(file_path)
    
    # Build content
    content = request.content
    if request.frontmatter:
        fm_lines = ["---"]
        for key, value in request.frontmatter.items():
            fm_lines.append(f"{key}: {value}")
        fm_lines.append("---")
        fm_lines.append("")
        content = '\n'.join(fm_lines) + content
    elif current and current.startswith('---'):
        # Preserve existing frontmatter
        fm_end = current.find('---', 3)
        if fm_end > 0:
            content = current[:fm_end+3] + '\n\n' + request.content
    
    success = client.update_file(file_path, content)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update file")
    
    return {
        "success": True,
        "vault": "main",
        "path": file_path,
        "message": f"File updated in Main Working Vault: {file_path}"
    }

@router.delete("/files/{file_path:path}")
async def delete_file(file_path: str):
    """
    Delete file - ALWAYS from Main Working Vault
    NEVER deletes from BDAIV2
    """
    success = main_vault.delete_file(file_path)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete file")
    
    return {
        "success": True,
        "vault": "main",
        "path": file_path,
        "message": f"File deleted from Main Working Vault: {file_path}"
    }

@router.post("/search")
async def search_vaults(request: SearchRequest):
    """Search vault"""
    client = main_vault if request.vault == "main" else bdaiv2_vault
    results = client.search(request.query)
    
    return {
        "vault": request.vault,
        "query": request.query,
        "results": results,
        "total": len(results),
        "mode": "read-write" if request.vault == "main" else "read-only"
    }

@router.post("/session-log")
async def log_session(session_data: Dict[str, Any]):
    """
    Log session - ALWAYS writes to Main Working Vault Session_Logs/
    NEVER writes to BDAIV2
    """
    date_str = datetime.now().strftime('%Y-%m-%d')
    time_str = datetime.now().strftime('%H-%M-%S')
    filename = f"Session_{date_str}_{time_str}.md"
    
    # Build markdown
    md_content = f"""---
date: {date_str}
time: {time_str}
type: session-log
session_id: {session_data.get('session_id', 'unknown')}
tags: [session, {session_data.get('category', 'general')}]
---

# {session_data.get('title', 'Session Log')}

**Session ID:** `{session_data.get('session_id', 'N/A')}`  
**Timestamp:** {datetime.now().isoformat()}

## Summary

{session_data.get('summary', 'No summary')}

## Work Completed

"""
    for item in session_data.get('work_completed', []):
        md_content += f"- **{item.get('title', 'Task')}:** {item.get('description', '')}\n"
    
    md_content += f"""
---

*Logged by BigDataClaw NERVE*
"""
    
    # Save to Main Working Vault only
    folder = "Session_Logs"
    full_path = f"{folder}/{filename}"
    
    success = main_vault.create_file(full_path, md_content)
    
    if success:
        return {
            "success": True,
            "vault": "main",
            "path": full_path,
            "message": "Session logged to Main Working Vault"
        }
    else:
        raise HTTPException(status_code=500, detail="Failed to log session")


# ============================================================================
# Test
# ============================================================================

if __name__ == '__main__':
    print("Testing Dual Vault Architecture")
    print("=" * 60)
    print(f"Main Vault: {MAIN_VAULT_PATH}")
    print(f"  Mode: read-write")
    print(f"  URL: {MAIN_VAULT_URL}")
    print()
    print(f"BDAIV2: {BDAIV2_PATH}")
    print(f"  Mode: read-only")
    print(f"  URL: {BDAIV2_URL}")
    print("=" * 60)
    
    import asyncio
    
    async def test():
        # Test main vault
        print("\nTesting Main Vault (read-write):")
        connected, data = main_vault.test_connection()
        print(f"  Connected: {connected}")
        if connected:
            print(f"  Files: {len(data.get('files', []))}")
        
        # Test BDAIV2
        print("\nTesting BDAIV2 (read-only):")
        connected, data = bdaiv2_vault.test_connection()
        print(f"  Connected: {connected}")
        if connected:
            print(f"  Files: {len(data.get('files', []))}")
        
        # Test write protection on BDAIV2
        print("\nTesting BDAIV2 write protection:")
        try:
            bdaiv2_vault.create_file("test.md", "test")
            print("  ❌ FAIL: Write was allowed!")
        except PermissionError as e:
            print(f"  ✅ PASS: Write blocked")
            print(f"     {e}")
    
    asyncio.run(test())
