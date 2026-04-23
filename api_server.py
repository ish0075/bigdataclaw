#!/usr/bin/env python3
"""
BigDataClaw NERVE API Server
FastAPI backend with SQLite + Qdrant
"""

import json
import os
import sys
import re
import sqlite3
import asyncio
import threading
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

from fastapi import FastAPI, Query, HTTPException, UploadFile, File, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from qdrant_client import QdrantClient
import uvicorn
import httpx
from dotenv import load_dotenv

load_dotenv()

# Database path helper (used across endpoints)
def _get_db_path() -> Path:
    return Path(os.getenv("BIGDATACLAW_DB", "bigdataclaw.db"))

DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY", "")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "sB7vwSCyX0tQmU24cW2C")

# Import Agent Workspace API (graceful fallback if modules missing)
def _safe_import(module_name, attr_name, default=None):
    try:
        mod = __import__(module_name, fromlist=[attr_name])
        return getattr(mod, attr_name)
    except Exception as e:
        print(f"⚠️  Optional module not available: {module_name}.{attr_name} — {e}")
        return default

agent_workspace_router = _safe_import("agent_workspace_api", "router")
obsidian_router = _safe_import("obsidian_api", "router")
notification_router = _safe_import("notification_service", "notification_router")
bot_builder_router = _safe_import("bot_builder_api", "router")
realtor_bot_router = _safe_import("realtor_bot_api", "router")
ai_builder_router = _safe_import("ai_builder_api", "router")
paperclip_router = _safe_import("nerve.server.paperclip_bridge", "router")
_tool_executor = _safe_import("nerve.server.tool_executor", "execute_tool")
_get_tool_schemas_json = _safe_import("nerve.server.tool_executor", "get_tool_schemas_json")

def get_tool_schemas_json():
    if _get_tool_schemas_json:
        return _get_tool_schemas_json()
    return "[]"

def execute_tool(tool_name, args):
    if _tool_executor:
        return _tool_executor(tool_name, args)
    return {"error": f"Tool executor not available. Cannot execute {tool_name}"}
voice_agent_router = _safe_import("voice_agent_api", "router")
prewarm_voice_pipeline = _safe_import("voice_agent_api", "prewarm_voice_pipeline")
agent_router = _safe_import("agent_router", "agent_router") or type(sys)("agent_router")
synthesize_local_tts = _safe_import("local_tts", "synthesize_local_tts")
ENABLE_REMOTE_TTS_FALLBACK = _safe_import("local_tts", "ENABLE_REMOTE_TTS_FALLBACK", False)
local_tts_status = _safe_import("local_tts", "local_tts_status", {})

# Initialize FastAPI
app = FastAPI(
    title="BigDataClaw NERVE API",
    description="Real estate intelligence platform API",
    version="2.0.0"
)

# CORS
_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://localhost:8000",
    "http://localhost:3090",
    "https://bigdataclaw.srv1368913.hstgr.cloud",
    "https://mission-control-v2-five-eta.vercel.app",
    "https://mission-control-commissions.vercel.app",
    "https://mission-control-v3-inky.vercel.app",
    "https://mission-control-v3-q2mdcw4km-ish0075s-projects.vercel.app",
    "https://nerve-theta.vercel.app",
    "https://nerve-5vsu248jo-ish0075s-projects.vercel.app",
]
# Allow additional origins from env var (comma-separated)
_EXTRA_ORIGINS = os.getenv("CORS_ORIGINS", "")
if _EXTRA_ORIGINS:
    _ORIGINS.extend([o.strip() for o in _EXTRA_ORIGINS.split(",") if o.strip()])
app.add_middleware(
    CORSMiddleware,
    allow_origins=_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Agent Workspace Router (only if available)
for name, router in [
    ("agent_workspace", agent_workspace_router),
    ("obsidian", obsidian_router),
    ("notification", notification_router),
    ("bot_builder", bot_builder_router),
    ("realtor_bot", realtor_bot_router),
    ("ai_builder", ai_builder_router),
    ("paperclip", paperclip_router),
    ("voice_agent", voice_agent_router),
]:
    if router is not None:
        app.include_router(router)
    else:
        print(f"⚠️  Skipping {name} router (not available)")


@app.on_event("startup")
async def warm_voice_services():
    """Warm local voice services after API startup without blocking readiness."""
    threading.Thread(target=prewarm_voice_pipeline, daemon=True).start()

# Static uploads for agent file analysis
uploads_dir = Path('uploads')
uploads_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Database paths
DB_PATH = Path('bigdataclaw.db')
QDRANT_HOST = os.environ.get("QDRANT_HOST", "localhost")
QDRANT_PORT = int(os.environ.get("QDRANT_PORT", "6333"))

# Models
class Recruiter(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    brokerage: Optional[str] = None
    city: Optional[str] = "Ontario"
    job_title: Optional[str] = None
    linkedin: Optional[str] = None
    status: str = "new"
    quick_links: Optional[Dict[str, Any]] = None

class RecruiterResponse(BaseModel):
    recruiters: List[Recruiter]
    total: int
    page: int
    pages: int

class StatsResponse(BaseModel):
    total: int
    by_city: Dict[str, int]
    by_brokerage: Dict[str, int]
    by_status: Dict[str, int]

# Database connection
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# Qdrant connection
def get_qdrant():
    return QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)

# ============================================================================
# RECRUITER ENDPOINTS
# ============================================================================

@app.get("/api/recruiters", response_model=RecruiterResponse)
async def get_recruiters(
    page: int = Query(1, ge=1),
    limit: int = Query(100, ge=1, le=500),
    search: Optional[str] = None,
    city: Optional[str] = None,
    brokerage: Optional[str] = None,
    status: Optional[str] = None,
    group_by: Optional[str] = None
):
    """
    Get recruiters with pagination, search, and filtering
    """
    conn = get_db()
    cursor = conn.cursor()
    
    # Build WHERE clause
    conditions = []
    params = []
    
    if search:
        # Use FTS for search
        # Build FTS query: convert "Emily Barry" to "Emily* Barry*" for prefix matching
        search_terms = search.replace('"', '""').split()
        if len(search_terms) > 1:
            # Multiple terms - use prefix matching for each
            fts_query = ' '.join([f'{term}*' for term in search_terms])
        else:
            # Single term - wrap in quotes for exact match
            fts_query = f'"{search_terms[0]}"'
        
        cursor.execute('''
            SELECT rowid FROM recruiters_fts 
            WHERE recruiters_fts MATCH ?
        ''', (fts_query,))
        ids = [row[0] for row in cursor.fetchall()]
        if ids:
            conditions.append(f"id IN ({','.join('?' * len(ids))})")
            params.extend(ids)
        else:
            # Fallback to LIKE
            conditions.append("(name LIKE ? OR brokerage LIKE ?)")
            params.extend([f'%{search}%', f'%{search}%'])
    
    if city and city != 'All Cities':
        conditions.append("city = ?")
        params.append(city)
    
    if brokerage and brokerage != 'All Brokerages':
        conditions.append("brokerage = ?")
        params.append(brokerage)
    
    if status and status != 'All Status':
        conditions.append("status = ?")
        params.append(status)
    
    where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""
    
    # Get total count
    cursor.execute(f"SELECT COUNT(*) FROM recruiters {where_clause}", params)
    total = cursor.fetchone()[0]
    
    # Get paginated results
    offset = (page - 1) * limit
    cursor.execute(f'''
        SELECT * FROM recruiters 
        {where_clause}
        ORDER BY name
        LIMIT ? OFFSET ?
    ''', params + [limit, offset])
    
    rows = cursor.fetchall()
    recruiters = []
    for row in rows:
        recruiter = dict(row)
        if recruiter.get('quick_links'):
            recruiter['quick_links'] = json.loads(recruiter['quick_links'])
        recruiters.append(recruiter)
    
    conn.close()
    
    return RecruiterResponse(
        recruiters=recruiters,
        total=total,
        page=page,
        pages=(total + limit - 1) // limit
    )

@app.get("/api/recruiters/stats", response_model=StatsResponse)
async def get_recruiter_stats():
    """Get recruiter statistics"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Total
    cursor.execute("SELECT COUNT(*) FROM recruiters")
    total = cursor.fetchone()[0]
    
    # By city
    cursor.execute('''
        SELECT city, COUNT(*) as cnt 
        FROM recruiters 
        GROUP BY city 
        ORDER BY cnt DESC
    ''')
    by_city = {row[0] or 'Unknown': row[1] for row in cursor.fetchall()}
    
    # By brokerage (top 20)
    cursor.execute('''
        SELECT brokerage, COUNT(*) as cnt 
        FROM recruiters 
        WHERE brokerage != ''
        GROUP BY brokerage 
        ORDER BY cnt DESC 
        LIMIT 20
    ''')
    by_brokerage = {row[0]: row[1] for row in cursor.fetchall()}
    
    # By status
    cursor.execute('''
        SELECT status, COUNT(*) as cnt 
        FROM recruiters 
        GROUP BY status
    ''')
    by_status = {row[0] or 'new': row[1] for row in cursor.fetchall()}
    
    conn.close()
    
    return StatsResponse(
        total=total,
        by_city=by_city,
        by_brokerage=by_brokerage,
        by_status=by_status
    )

@app.get("/api/recruiters/filter-options")
async def get_filter_options():
    """Get available filter options"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Cities
    cursor.execute('''
        SELECT DISTINCT city 
        FROM recruiters 
        WHERE city != '' 
        ORDER BY city
    ''')
    cities = [row[0] for row in cursor.fetchall()]
    
    # Brokerages
    cursor.execute('''
        SELECT DISTINCT brokerage 
        FROM recruiters 
        WHERE brokerage != '' 
        ORDER BY brokerage
    ''')
    brokerages = [row[0] for row in cursor.fetchall()]
    
    # Status options
    statuses = ['new', 'contacted', 'engaged', 'converted', 'archived']
    
    conn.close()
    
    return {
        "cities": cities,
        "brokerages": brokerages,
        "statuses": statuses
    }

@app.post("/api/recruiters/{recruiter_id}/contact")
async def track_contact(recruiter_id: int, platform: str = "linkedin"):
    """Track recruiter contact"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Verify recruiter exists
    cursor.execute("SELECT id FROM recruiters WHERE id = ?", (recruiter_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Recruiter not found")
    
    # Track interaction
    cursor.execute('''
        INSERT INTO interactions (recruiter_id, platform)
        VALUES (?, ?)
    ''', (recruiter_id, platform))
    
    # Update status
    cursor.execute('''
        UPDATE recruiters SET status = 'contacted'
        WHERE id = ? AND status = 'new'
    ''', (recruiter_id,))
    
    conn.commit()
    conn.close()
    
    return {"success": True, "message": f"Contact tracked via {platform}"}

class RecruiterUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    brokerage: Optional[str] = None
    city: Optional[str] = None
    job_title: Optional[str] = None
    linkedin: Optional[str] = None
    status: Optional[str] = None
    phone: Optional[str] = None

@app.get("/api/recruiters/{recruiter_id}")
async def get_recruiter(recruiter_id: int):
    """Get a single recruiter by ID"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM recruiters WHERE id = ?", (recruiter_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Recruiter not found")
    
    recruiter = dict(row)
    if recruiter.get('quick_links'):
        recruiter['quick_links'] = json.loads(recruiter['quick_links'])
    
    return recruiter

@app.put("/api/recruiters/{recruiter_id}")
async def update_recruiter(recruiter_id: int, update: RecruiterUpdate):
    """Update recruiter information"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Check if recruiter exists
    cursor.execute("SELECT id FROM recruiters WHERE id = ?", (recruiter_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Recruiter not found")
    
    # Build update query
    fields = []
    params = []
    
    if update.name is not None:
        fields.append("name = ?")
        params.append(update.name)
    if update.email is not None:
        fields.append("email = ?")
        params.append(update.email)
    if update.brokerage is not None:
        fields.append("brokerage = ?")
        params.append(update.brokerage)
    if update.city is not None:
        fields.append("city = ?")
        params.append(update.city)
    if update.job_title is not None:
        fields.append("job_title = ?")
        params.append(update.job_title)
    if update.linkedin is not None:
        fields.append("linkedin = ?")
        params.append(update.linkedin)
    if update.status is not None:
        fields.append("status = ?")
        params.append(update.status)
    if update.phone is not None:
        fields.append("phone = ?")
        params.append(update.phone)
    
    if fields:
        params.append(recruiter_id)
        cursor.execute(f'''
            UPDATE recruiters 
            SET {', '.join(fields)}
            WHERE id = ?
        ''', params)
        conn.commit()
    
    # Get updated recruiter
    cursor.execute("SELECT * FROM recruiters WHERE id = ?", (recruiter_id,))
    row = cursor.fetchone()
    conn.close()
    
    recruiter = dict(row)
    if recruiter.get('quick_links'):
        recruiter['quick_links'] = json.loads(recruiter['quick_links'])
    
    return {"success": True, "recruiter": recruiter}

# ============================================================================
# SEMANTIC SEARCH (Qdrant)
# ============================================================================

@app.get("/api/recruiters/search")
async def semantic_search(
    q: str = Query(..., min_length=2),
    limit: int = Query(10, ge=1, le=100)
):
    """
    Semantic search using Qdrant vectors
    """
    try:
        client = get_qdrant()
        
        # Search Qdrant
        results = client.search(
            collection_name="recruiters",
            query_vector=q,  # Qdrant auto-encodes text
            limit=limit,
            with_payload=True
        )
        
        return {
            "query": q,
            "results": [
                {
                    "id": r.id,
                    "name": r.payload.get("name"),
                    "brokerage": r.payload.get("brokerage"),
                    "city": r.payload.get("city"),
                    "score": r.score
                }
                for r in results
            ]
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

# ============================================================================
# REALTOR ASSISTANT - DATA ACCESS ENDPOINTS
# ============================================================================

@app.get("/api/realtor-assistant/data-sources")
async def get_data_sources():
    """Get all available data sources for realtor assistant"""
    conn = get_db()
    cursor = conn.cursor()
    
    stats = {}
    
    # Recruiters/Agents
    cursor.execute("SELECT COUNT(*) FROM recruiters")
    stats['recruiters'] = cursor.fetchone()[0]
    
    # Brokerages
    cursor.execute("SELECT COUNT(*) FROM dbeaver_brokerages")
    stats['brokerages'] = cursor.fetchone()[0]
    
    # Brokers
    cursor.execute("SELECT COUNT(*) FROM dbeaver_brokers")
    stats['brokers'] = cursor.fetchone()[0]
    
    # Salespersons
    cursor.execute("SELECT COUNT(*) FROM dbeaver_salespersons")
    stats['salespersons'] = cursor.fetchone()[0]
    
    # Lenders
    cursor.execute("SELECT COUNT(*) FROM lenders")
    stats['lenders'] = cursor.fetchone()[0]
    
    # Buyers
    cursor.execute("SELECT COUNT(*) FROM buyers")
    stats['buyers'] = cursor.fetchone()[0]
    
    # Transactions
    cursor.execute("SELECT COUNT(*) FROM transactions_full")
    stats['transactions'] = cursor.fetchone()[0]
    
    # Companies
    cursor.execute("SELECT COUNT(*) FROM dbeaver_brokerages")
    stats['companies'] = cursor.fetchone()[0]
    
    conn.close()
    
    return {
        "data_sources": {
            "recruiters": {"count": stats['recruiters'], "endpoint": "/api/recruiters"},
            "brokerages": {"count": stats['brokerages'], "endpoint": "/api/realtor-assistant/brokerages"},
            "brokers": {"count": stats['brokers'], "endpoint": "/api/realtor-assistant/brokers"},
            "salespersons": {"count": stats['salespersons'], "endpoint": "/api/realtor-assistant/salespersons"},
            "lenders": {"count": stats['lenders'], "endpoint": "/api/realtor-assistant/lenders"},
            "buyers": {"count": stats['buyers'], "endpoint": "/api/realtor-assistant/buyers"},
            "transactions": {"count": stats['transactions'], "endpoint": "/api/realtor-assistant/transactions"},
            "companies": {"count": stats['companies'], "endpoint": "/api/realtor-assistant/companies"},
        },
        "obsidian_vaults": {
            "main_working": "/home/jamie/Desktop/Jamie's Personal Vault",
            "bdaiv2": "/home/jamie/Documents/BDAIV2 (Read-Only)"
        },
        "note": "All endpoints support search, pagination, and filtering"
    }

@app.get("/api/realtor-assistant/brokerages")
async def get_brokerages(
    search: Optional[str] = None,
    city: Optional[str] = None,
    page: int = 1,
    limit: int = 50
):
    """Get brokerages from DBeaver data"""
    conn = get_db()
    cursor = conn.cursor()
    
    conditions = []
    params = []
    
    if search:
        conditions.append("(name LIKE ? OR city LIKE ?)")
        params.extend([f'%{search}%', f'%{search}%'])
    
    if city:
        conditions.append("city = ?")
        params.append(city)
    
    where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""
    
    # Get total
    cursor.execute(f"SELECT COUNT(*) FROM dbeaver_brokerages {where_clause}", params)
    total = cursor.fetchone()[0]
    
    # Get paginated results
    offset = (page - 1) * limit
    cursor.execute(f'''
        SELECT * FROM dbeaver_brokerages 
        {where_clause}
        ORDER BY name
        LIMIT ? OFFSET ?
    ''', params + [limit, offset])
    
    rows = cursor.fetchall()
    brokerages = [dict(row) for row in rows]
    conn.close()
    
    return {
        "brokerages": brokerages,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }

@app.get("/api/realtor-assistant/brokers")
async def get_brokers(
    search: Optional[str] = None,
    brokerage_id: Optional[int] = None,
    page: int = 1,
    limit: int = 50
):
    """Get brokers from DBeaver data"""
    conn = get_db()
    cursor = conn.cursor()
    
    conditions = []
    params = []
    
    if search:
        conditions.append("full_name LIKE ?")
        params.append(f'%{search}%')
    
    if brokerage_id:
        conditions.append("brokerage_id = ?")
        params.append(brokerage_id)
    
    where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""
    
    cursor.execute(f"SELECT COUNT(*) FROM dbeaver_brokers {where_clause}", params)
    total = cursor.fetchone()[0]
    
    offset = (page - 1) * limit
    cursor.execute(f'''
        SELECT * FROM dbeaver_brokers 
        {where_clause}
        ORDER BY full_name
        LIMIT ? OFFSET ?
    ''', params + [limit, offset])
    
    rows = cursor.fetchall()
    brokers = [dict(row) for row in rows]
    conn.close()
    
    return {
        "brokers": brokers,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }

@app.get("/api/realtor-assistant/salespersons")
async def get_salespersons(
    search: Optional[str] = None,
    brokerage_id: Optional[int] = None,
    page: int = 1,
    limit: int = 50
):
    """Get salespersons from DBeaver data"""
    conn = get_db()
    cursor = conn.cursor()
    
    conditions = []
    params = []
    
    if search:
        conditions.append("full_name LIKE ?")
        params.append(f'%{search}%')
    
    if brokerage_id:
        conditions.append("brokerage_id = ?")
        params.append(brokerage_id)
    
    where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""
    
    cursor.execute(f"SELECT COUNT(*) FROM dbeaver_salespersons {where_clause}", params)
    total = cursor.fetchone()[0]
    
    offset = (page - 1) * limit
    cursor.execute(f'''
        SELECT * FROM dbeaver_salespersons 
        {where_clause}
        ORDER BY full_name
        LIMIT ? OFFSET ?
    ''', params + [limit, offset])
    
    rows = cursor.fetchall()
    salespersons = [dict(row) for row in rows]
    conn.close()
    
    return {
        "salespersons": salespersons,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }

@app.get("/api/realtor-assistant/lenders")
async def get_lenders(
    search: Optional[str] = None,
    lender_type: Optional[str] = None,
    page: int = 1,
    limit: int = 50
):
    """Get lenders with optional filtering"""
    conn = get_db()
    cursor = conn.cursor()
    
    conditions = []
    params = []
    
    if search:
        conditions.append("name LIKE ?")
        params.append(f'%{search}%')
    
    if lender_type:
        conditions.append("lender_type = ?")
        params.append(lender_type)
    
    where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""
    
    cursor.execute(f"SELECT COUNT(*) FROM lenders {where_clause}", params)
    total = cursor.fetchone()[0]
    
    offset = (page - 1) * limit
    cursor.execute(f'''
        SELECT * FROM lenders 
        {where_clause}
        ORDER BY name
        LIMIT ? OFFSET ?
    ''', params + [limit, offset])
    
    rows = cursor.fetchall()
    lenders = []
    for row in rows:
        lender = dict(row)
        if lender.get('quick_links'):
            try:
                lender['quick_links'] = json.loads(lender['quick_links'])
            except:
                pass
        lenders.append(lender)
    
    conn.close()
    
    return {
        "lenders": lenders,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }

@app.get("/api/realtor-assistant/buyers")
async def get_buyers(
    search: Optional[str] = None,
    city: Optional[str] = None,
    page: int = 1,
    limit: int = 50
):
    """Get buyers from database"""
    conn = get_db()
    cursor = conn.cursor()
    
    conditions = []
    params = []
    
    if search:
        conditions.append("name LIKE ?")
        params.append(f'%{search}%')
    
    if city:
        conditions.append("city = ?")
        params.append(city)
    
    where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""
    
    cursor.execute(f"SELECT COUNT(*) FROM buyers {where_clause}", params)
    total = cursor.fetchone()[0]
    
    offset = (page - 1) * limit
    cursor.execute(f'''
        SELECT * FROM buyers 
        {where_clause}
        ORDER BY name
        LIMIT ? OFFSET ?
    ''', params + [limit, offset])
    
    rows = cursor.fetchall()
    buyers = [dict(row) for row in rows]
    conn.close()
    
    return {
        "buyers": buyers,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }

@app.get("/api/realtor-assistant/transactions")
async def get_transactions(
    search: Optional[str] = None,
    city: Optional[str] = None,
    min_amount: Optional[float] = None,
    page: int = 1,
    limit: int = 50
):
    """Get property transactions"""
    conn = get_db()
    cursor = conn.cursor()
    
    conditions = []
    params = []
    
    if search:
        conditions.append("property_address LIKE ?")
        params.append(f'%{search}%')
    
    if city:
        conditions.append("city = ?")
        params.append(city)
    
    if min_amount:
        conditions.append("sale_amount >= ?")
        params.append(min_amount)
    
    where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""
    
    cursor.execute(f"SELECT COUNT(*) FROM transactions_full {where_clause}", params)
    total = cursor.fetchone()[0]
    
    offset = (page - 1) * limit
    cursor.execute(f'''
        SELECT * FROM transactions_full 
        {where_clause}
        ORDER BY sale_amount DESC
        LIMIT ? OFFSET ?
    ''', params + [limit, offset])
    
    rows = cursor.fetchall()
    transactions = [dict(row) for row in rows]
    conn.close()
    
    return {
        "transactions": transactions,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }

@app.get("/api/realtor-assistant/obsidian/search")
async def search_obsidian(
    q: str = Query(..., min_length=2),
    folder: Optional[str] = None,
    limit: int = 20
):
    """Search Obsidian Main Working Vault"""
    try:
        import subprocess
        
        vault_path = "/home/jamie/Desktop/Jamie's Personal Vault"
        
        # Build find command
        if folder:
            search_path = f"{vault_path}/{folder}"
        else:
            search_path = vault_path
        
        # Search for files containing the query
        cmd = [
            "grep", "-r", "-l", "-i",
            q,
            search_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        files = result.stdout.strip().split("\n") if result.stdout.strip() else []
        
        # Filter to markdown files only and remove hidden files
        files = [f for f in files if f.endswith(".md") and "/." not in f]
        
        # Get file info
        results = []
        for filepath in files[:limit]:
            try:
                stat = os.stat(filepath)
                filename = os.path.basename(filepath)
                rel_path = filepath.replace(vault_path + "/", "")
                results.append({
                    "filename": filename,
                    "path": rel_path,
                    "full_path": filepath,
                    "modified": datetime.fromtimestamp(stat.st_mtime).isoformat()
                })
            except:
                pass
        
        return {
            "query": q,
            "results": results,
            "total": len(results),
            "vault": "main_working"
        }
    except Exception as e:
        return {"error": str(e), "results": []}

# ============================================================================
# OPPORTUNITY ENDPOINTS
# ============================================================================

@app.get("/api/opportunities")
async def get_opportunities(
    status: Optional[str] = None,
    asset_type: Optional[str] = None,
    page: int = 1,
    limit: int = 50
):
    """Get opportunities with filtering"""
    conn = get_db()
    cursor = conn.cursor()
    
    conditions = []
    params = []
    
    if status:
        conditions.append("p.status = ?")
        params.append(status)
    
    if asset_type:
        conditions.append("o.asset_type = ?")
        params.append(asset_type)
    
    where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""
    
    cursor.execute(f'''
        SELECT p.*, o.id as opp_id, o.asset_type, o.captured
        FROM properties p
        JOIN opportunities o ON p.id = o.property_id
        {where_clause}
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
    ''', params + [limit, (page-1)*limit])
    
    rows = cursor.fetchall()
    opportunities = [dict(row) for row in rows]
    
    conn.close()
    
    return {
        "opportunities": opportunities,
        "page": page,
        "total": len(opportunities)
    }

# Voice agent endpoint is provided by voice_agent_api router (includes STT + TTS + search)

@app.post("/api/tts")
async def text_to_speech(request: Dict[str, Any]):
    """Local-first TTS endpoint backed by Piper."""
    text = request.get("text", "")
    if not text:
        raise HTTPException(status_code=400, detail="text is required")

    try:
        audio_bytes, media_type, _ = await asyncio.to_thread(synthesize_local_tts, text)
        from fastapi.responses import Response
        return Response(content=audio_bytes, media_type=media_type)
    except Exception as local_error:
        if not ENABLE_REMOTE_TTS_FALLBACK:
            raise HTTPException(status_code=503, detail=f"Local TTS unavailable: {local_error}")

    if not DEEPGRAM_API_KEY:
        raise HTTPException(status_code=503, detail="Local TTS failed and remote fallback is unavailable")

    voice = request.get("voice", "aura-asteria-en")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://api.deepgram.com/v1/speak?model={voice}",
                headers={
                    "Authorization": f"Token {DEEPGRAM_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={"text": text},
                timeout=15.0,
            )
            if response.status_code == 200:
                from fastapi.responses import Response
                return Response(content=response.content, media_type="audio/mpeg")
            raise HTTPException(status_code=response.status_code, detail=response.text)
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=str(e))


@app.get("/api/tts/status")
async def tts_status():
    """Expose local TTS readiness for operators."""
    return local_tts_status()

@app.post("/api/tts/elevenlabs")
async def text_to_speech_elevenlabs(request: Dict[str, Any]):
    """Proxy TTS requests to ElevenLabs. Keeps API key server-side."""
    if not ELEVENLABS_API_KEY:
        raise HTTPException(status_code=503, detail="ElevenLabs TTS service not configured")
    text = request.get("text", "")
    if not text:
        raise HTTPException(status_code=400, detail="text is required")
    voice_id = request.get("voice_id", ELEVENLABS_VOICE_ID)
    model_id = request.get("model_id", "eleven_multilingual_v2")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
                headers={
                    "xi-api-key": ELEVENLABS_API_KEY,
                    "Content-Type": "application/json",
                },
                json={
                    "text": text,
                    "model_id": model_id,
                    "voice_settings": {
                        "stability": 0.5,
                        "similarity_boost": 0.75
                    }
                },
                timeout=30.0,
            )
            if response.status_code == 200:
                from fastapi.responses import Response
                return Response(content=response.content, media_type="audio/mp3")
            raise HTTPException(status_code=response.status_code, detail=response.text)
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=str(e))

@app.websocket("/ws/voice")
async def voice_websocket(websocket: WebSocket):
    """WebSocket endpoint for real-time voice avatar calls.
    Proxies events between the FaceTime UI and backend agents.
    Can be extended to proxy to OpenAI Realtime API or ElevenLabs Conversational AI.
    """
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type", "echo")
            if msg_type == "ping":
                await websocket.send_json({"type": "pong", "ts": data.get("ts")})
            elif msg_type == "chat":
                # Process through agent_router and stream back
                result = await agent_router.handle_request(data.get("message", ""), data.get("history"))
                await websocket.send_json({
                    "type": "agent_response",
                    "response": result.get("response"),
                    "actions": result.get("actions"),
                    "intent": result.get("intent"),
                })
            elif msg_type == "media_request":
                # Placeholder for OpenClaw media generation hook
                await websocket.send_json({
                    "type": "media_ready",
                    "media_type": data.get("media_type", "image"),
                    "url": data.get("placeholder_url", ""),
                    "prompt": data.get("prompt", ""),
                })
            else:
                await websocket.send_json({"type": "echo", "received": data})
    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass

@app.post("/api/agent/upload")
async def agent_upload(file: UploadFile = File(...)):
    """Upload a file for the Mission Control agent to analyze."""
    content = await file.read()
    filename = file.filename or "upload"
    ext = Path(filename).suffix.lower()
    result = {"filename": filename, "type": ext, "size": len(content)}

    if ext in [".txt", ".md", ".csv", ".json"]:
        try:
            text = content.decode("utf-8")
            result["text_preview"] = text[:2000]
            summary_prompt = f"Summarize the following {ext} file content in 3-5 bullet points. Be concise:\n\n{text[:8000]}"
            summary = await agent_router.ollama_chat(summary_prompt, temperature=0.5, max_tokens=512)
            result["summary"] = summary or "Summary unavailable."
        except Exception as e:
            result["error"] = f"Text decode error: {str(e)}"
    elif ext in [".png", ".jpg", ".jpeg", ".gif", ".webp"]:
        upload_dir = Path("uploads/agent")
        upload_dir.mkdir(parents=True, exist_ok=True)
        safe_name = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{filename}"
        file_path = upload_dir / safe_name
        with open(file_path, "wb") as f:
            f.write(content)
        result["image_url"] = f"/uploads/agent/{safe_name}"
        result["note"] = "Image stored. Visual analysis requires a vision model (not yet configured)."
    else:
        result["note"] = "File uploaded but analysis is only supported for text and image files right now."

    return result

# ============================================================================
# HEALTH & INFO
# ============================================================================

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check SQLite
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM recruiters")
        recruiter_count = cursor.fetchone()[0]
        conn.close()
        
        # Check Qdrant
        try:
            client = get_qdrant()
            collections = client.get_collections()
            qdrant_status = "connected"
        except:
            qdrant_status = "disconnected"
        
        return {
            "status": "healthy",
            "recruiters": recruiter_count,
            "qdrant": qdrant_status,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "error": str(e)}
        )

@app.get("/api/info")
async def get_info():
    """Get system info"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM recruiters")
    recruiter_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM properties")
    property_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM opportunities")
    opportunity_count = cursor.fetchone()[0]
    
    conn.close()
    
    return {
        "version": "2.0.0",
        "databases": {
            "recruiters": recruiter_count,
            "properties": property_count,
            "opportunities": opportunity_count
        },
        "features": [
            "recruiter_management",
            "semantic_search",
            "opportunity_tracking"
        ]
    }

# ============================================================================
# LENDER ENDPOINTS
# ============================================================================

class Lender(BaseModel):
    id: int
    name: str
    domain: Optional[str] = None
    lender_type: str = "Other"
    asset_specializations: Optional[str] = None
    is_land_lender: int = 0
    is_construction_lender: int = 0
    is_commercial_lender: int = 1
    quick_links: Optional[Dict[str, Any]] = None

class LenderResponse(BaseModel):
    lenders: List[Lender]
    total: int
    page: int
    pages: int

@app.get("/api/lenders", response_model=LenderResponse)
async def get_lenders(
    page: int = Query(1, ge=1),
    limit: int = Query(100, ge=1, le=500),
    search: Optional[str] = None,
    lender_type: Optional[str] = None,
    asset_class: Optional[str] = None
):
    """
    Get lenders with pagination, search, and filtering
    """
    conn = get_db()
    cursor = conn.cursor()
    
    # Build WHERE clause
    conditions = []
    params = []
    
    if search:
        # Try FTS for search; fallback to LIKE if FTS table is missing
        try:
            escaped_search = search.replace('"', '""')
            fts_query = f'"{escaped_search}"'
            cursor.execute('''
                SELECT rowid FROM lenders_fts 
                WHERE lenders_fts MATCH ?
            ''', (fts_query,))
            ids = [row[0] for row in cursor.fetchall()]
            if ids:
                conditions.append(f"id IN ({','.join('?' * len(ids))})")
                params.extend(ids)
            else:
                conditions.append("(name LIKE ? OR lender_type LIKE ?)")
                params.extend([f'%{search}%', f'%{search}%'])
        except Exception:
            conditions.append("(name LIKE ? OR lender_type LIKE ?)")
            params.extend([f'%{search}%', f'%{search}%'])
    
    if lender_type and lender_type != 'all':
        conditions.append("lender_type = ?")
        params.append(lender_type)
    
    if asset_class and asset_class != 'all':
        conditions.append("asset_specializations LIKE ?")
        params.append(f'%{asset_class}%')
    
    where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""
    
    # Get total count
    cursor.execute(f"SELECT COUNT(*) FROM lenders {where_clause}", params)
    total = cursor.fetchone()[0]
    
    # Get paginated results
    offset = (page - 1) * limit
    cursor.execute(f'''
        SELECT * FROM lenders 
        {where_clause}
        ORDER BY name
        LIMIT ? OFFSET ?
    ''', params + [limit, offset])
    
    rows = cursor.fetchall()
    lenders = []
    for row in rows:
        lender = dict(row)
        if lender.get('quick_links'):
            try:
                lender['quick_links'] = json.loads(lender['quick_links'])
            except Exception:
                lender['quick_links'] = {}
        lenders.append(lender)
    
    conn.close()
    
    return LenderResponse(
        lenders=lenders,
        total=total,
        page=page,
        pages=(total + limit - 1) // limit
    )

@app.get("/api/lenders/stats")
async def get_lender_stats():
    """Get lender statistics"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Total
    cursor.execute("SELECT COUNT(*) FROM lenders")
    total = cursor.fetchone()[0]
    
    # By type
    cursor.execute('''
        SELECT lender_type, COUNT(*) as cnt 
        FROM lenders 
        GROUP BY lender_type 
        ORDER BY cnt DESC
    ''')
    by_type = {row[0] or 'Other': row[1] for row in cursor.fetchall()}
    
    # By specialization
    try:
        cursor.execute('''
            SELECT 
                SUM(is_commercial_lender) as commercial,
                SUM(is_land_lender) as land,
                SUM(is_construction_lender) as construction
            FROM lenders
        ''')
        row = cursor.fetchone()
        by_specialization = {
            'commercial': row[0] or 0,
            'land': row[1] or 0,
            'construction': row[2] or 0
        }
    except sqlite3.OperationalError:
        # Fallback if boolean columns don't exist in schema
        by_specialization = {
            'commercial': 0,
            'land': 0,
            'construction': 0
        }
    
    conn.close()
    
    return {
        "total": total,
        "by_type": by_type,
        "by_specialization": by_specialization
    }

@app.get("/api/lenders/filter-options")
async def get_lender_filter_options():
    """Get available lender filter options"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Lender types
    cursor.execute('''
        SELECT DISTINCT lender_type 
        FROM lenders 
        WHERE lender_type != '' 
        ORDER BY lender_type
    ''')
    types = [row[0] for row in cursor.fetchall()]
    
    conn.close()
    
    return {
        "lender_types": types,
        "asset_classes": ['Commercial', 'Land', 'Construction', 'Residential', 'Industrial', 'Retail']
    }


# Brokerage name mappings (numbered Ontario Inc entities to brand names)
BROKERAGE_NAME_MAPPINGS = {
    # Right at Home Realty
    '1000085532 Ontario Inc.': 'Right at Home Realty',
    '1000085532 Ontario Inc': 'Right at Home Realty',
    
    # HomeLife branded brokerages
    'Homelife Miracle Realty Ltd.': 'HomeLife Miracle Realty',
    'Homelife Landmark Realty Inc.': 'HomeLife Landmark Realty',
    'Homelife Silvercity Realty Inc.': 'HomeLife Silvercity Realty',
    'Homelife New World Realty Inc': 'HomeLife New World Realty',
    'Homelife/future Realty Inc.': 'HomeLife/Future Realty',
    'Homelife Galaxy Real Estate Ltd.': 'HomeLife Galaxy Real Estate',
    'Homelife Superstars Real Estate Limited': 'HomeLife Superstars Real Estate',
    'Homelife/cimerman Real Estate Ltd': 'HomeLife/Cimerman Real Estate',
    'Homelife/vision Realty Inc.': 'HomeLife/Vision Realty',
    'Homelife Today Realty Ltd.': 'HomeLife Today Realty',
    'Homelife Local Real Estate Ltd': 'HomeLife Local Real Estate',
    'Homelife Gold Pacific Realty Inc.': 'HomeLife Gold Pacific Realty',
    'Homelife Broadway Realty Inc': 'HomeLife Broadway Realty',
    'Homelife Professionals Realty Inc': 'HomeLife Professionals Realty',
    'Homelife/GTA Realty Inc': 'HomeLife/GTA Realty',
    'Homelife/realty One Ltd.': 'HomeLife/Realty One',
    'Homelife/champions Realty Inc': 'HomeLife/Champions Realty',
    
    # eXp Realty
    'Exp Realty Of Canada Inc': 'eXp Realty of Canada',
    'Exp Realty Of Canada Inc.': 'eXp Realty of Canada',
    
    # iPro Realty
    'Ipro Realty Ltd': 'iPro Realty',
    'Ipro Realty Ltd.': 'iPro Realty',
    
    # RE/MAX brokerages
    'Re/max Real Estate Centre Inc.': 'RE/MAX Real Estate Centre',
    'Re/max Realtron Realty Inc': 'RE/MAX Realtron Realty',
    'Re/max Realtron Realty Inc.': 'RE/MAX Realtron Realty',
    'Re/max Escarpment Realty Inc.': 'RE/MAX Escarpment Realty',
    'Re/max Hallmark Realty Limited': 'RE/MAX Hallmark Realty',
    'Re/max First Realty': 'RE/MAX First Realty',
    'Re/max Unique Inc': 'RE/MAX Unique',
    'Re/max': 'RE/MAX',
    'Re/max West Realty': 'RE/MAX West Realty',
    'Re/max Real Estate Centre': 'RE/MAX Real Estate Centre',
    'Re/max Hallmark Realty': 'RE/MAX Hallmark Realty',
    
    # Royal LePage
    'Royal Lepage Real Estate Services Ltd.': 'Royal LePage Real Estate Services',
    'Royal Lepage Real Estate Services': 'Royal LePage Real Estate Services',
    'Royal Lepage Macro Realty': 'Royal LePage Macro Realty',
    'Royal Lepage Burloak': 'Royal LePage Burloak',
    'Royal Lepage Your Community Realty': 'Royal LePage Your Community Realty',
    'Royal Lepage': 'Royal LePage',
    'Royal Lepage RCR': 'Royal LePage RCR',
    'Royal Lepage Signature Realty': 'Royal LePage Signature Realty',
    'Royal Lepage Terrequity Realty': 'Royal LePage Terrequity Realty',
    'Royal Lepage Real Estate Professionals': 'Royal LePage Real Estate Professionals',
    
    # Century 21
    'Century 21 - Leading Edge Realty Inc.': 'Century 21 Leading Edge Realty',
    'Century 21 People\'s Choice Realty Inc.': 'Century 21 People\'s Choice Realty',
    'Century 21 Percy Fulton Ltd': 'Century 21 Percy Fulton',
    'Century 21 First Canadian Corp': 'Century 21 First Canadian',
    'Century 21 President Realty': 'Century 21 President Realty',
    
    # Other major brands
    'Signature Realty Inc.': 'Signature Realty',
    'Signature Realty Inc': 'Signature Realty',
    'Bay Street Group Inc.': 'Bay Street Group',
    'Forest Hill Real Estate Inc': 'Forest Hill Real Estate',
    'Your Community Realty Inc.': 'Your Community Realty',
    'Zolo Realty (ontario) Inc.': 'Zolo Realty',
    'Zolo Realty': 'Zolo Realty',
    'International Realty Firm Inc.': 'International Realty Firm',
    
    # Coldwell Banker
    'Coldwell Banker Southwest Realty': 'Coldwell Banker Southwest Realty',
    'Coldwell Banker - Peter Benninger Realty': 'Coldwell Banker Peter Benninger Realty',
    'Coldwell Banker Commercial Integrity': 'Coldwell Banker Commercial Integrity',
    
    # Sutton Group
    'Sutton Group-associates Realty Inc.': 'Sutton Group Associates Realty',
    'Sutton Group - Heritage Realty': 'Sutton Group Heritage Realty',
    'Sutton Group - Tower Realty Ltd.': 'Sutton Group Tower Realty',
    'Sutton Group - Ottawa Realty': 'Sutton Group Ottawa Realty',
    
    # Numbered entities with known websites
    '2615267 Ontario Inc.': 'Davenport Realty',
    '2615267 Ontario Inc': 'Davenport Realty',
    '1881384 Ontario Inc.': 'Royal LePage (1881384)',
    '1881384 Ontario Inc': 'Royal LePage (1881384)',
    '2816012 Ontario Inc.': 'Engel & Völkers',
    '2816012 Ontario Inc': 'Engel & Völkers',
    '2540017 Ontario Inc.': 'Power 7 Realty',
    '2540017 Ontario Inc': 'Power 7 Realty',
    '1965128 Ontario Inc.': 'Zumin Real Estate',
    '1965128 Ontario Inc': 'Zumin Real Estate',
    '1906351 Ontario Inc.': 'Keller Williams Complete',
    '1906351 Ontario Inc': 'Keller Williams Complete',
    '2341652 Ontario Limited': 'Keller Williams (2341652)',
    '2716742 Ontario Inc.': 'PropertyZilla',
    '2716742 Ontario Inc': 'PropertyZilla',
    '2819179 Ontario Inc.': 'FFAF Realty',
    '2819179 Ontario Inc': 'FFAF Realty',
    '2734100 Ontario Inc.': '2734100 Realty',
    '2734100 Ontario Inc': '2734100 Realty',
    
    # Keller Williams
    '2150659 Ontario Inc.': 'Keller Williams',
    '1919832 Ontario Inc.': 'Keller Williams',
    '1837915 Ontario Inc.': 'Keller Williams',
    '2773382 Ontario Inc.': 'Keller Williams Legacies',
    
    # Save Max
    '2706375 Ontario Inc.': 'Save Max Realty',
    '1000063733 Ontario Inc.': 'Save Max Realty',
    '1000059635 Ontario Inc.': 'Save Max Pioneer',
    
    # Century 21 numbered
    '2851365 Ontario Inc.': 'Century 21',
    '1927722 Ontario Inc.': 'Century 21',
    '2817145 Ontario Inc.': 'Coldwell Banker',
}

def clean_brokerage_name(name: str) -> str:
    """Clean up brokerage name for display"""
    if not name:
        return 'Independent'
    
    # Check for known mappings first
    if name in BROKERAGE_NAME_MAPPINGS:
        return BROKERAGE_NAME_MAPPINGS[name]
    
    # Remove Ontario Inc, Ontario Inc., and any numbers/suffixes after Inc
    import re
    cleaned = re.sub(r'\s*Ontario\s+Inc\.?\s*\d*\s*$', '', name, flags=re.IGNORECASE)
    cleaned = re.sub(r'\s*Inc\.?\s*\d*\s*$', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\s*Ltd\.?\s*$', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\s*Limited\s*$', '', cleaned, flags=re.IGNORECASE)
    cleaned = cleaned.strip()
    
    # Handle numbered entities that weren't in mappings
    if re.match(r'^\d+\s+Ontario\s*$', cleaned, re.IGNORECASE) or cleaned == name:
        match = re.match(r'^(\d+)\s+Ontario', name, re.IGNORECASE)
        if match:
            return f'Brokerage #{match.group(1)}'
    
    return cleaned

# ============================================================================
# BROKERAGE ENDPOINTS
# ============================================================================

class Brokerage(BaseModel):
    name: str
    clean_name: str
    agent_count: int
    cities: List[str]
    primary_city: Optional[str] = None

class BrokerageResponse(BaseModel):
    brokerages: List[Brokerage]
    total: int
    page: int
    pages: int

class BrokerageStats(BaseModel):
    total_brokerages: int
    total_agents: int
    by_city: Dict[str, int]
    top_brokerages: List[Dict[str, Any]]

@app.get("/api/brokerages", response_model=BrokerageResponse)
async def get_brokerages(
    page: int = Query(1, ge=1),
    limit: int = Query(100, ge=1, le=500),
    search: Optional[str] = None,
    city: Optional[str] = None,
    sort_by: Optional[str] = "agents"  # agents, name
):
    """
    Get brokerages with pagination, search, and filtering
    """
    conn = get_db()
    cursor = conn.cursor()
    
    # Build query for aggregating brokerages
    conditions = []
    params = []
    
    if search:
        conditions.append("brokerage LIKE ?")
        params.append(f'%{search}%')
    
    if city and city != 'All Cities':
        conditions.append("city = ?")
        params.append(city)
    
    where_clause = "WHERE " + " AND ".join(conditions) if conditions else "WHERE brokerage != '' AND brokerage IS NOT NULL"
    if not conditions:
        where_clause = "WHERE brokerage != '' AND brokerage IS NOT NULL"
    
    # Get brokerage aggregations
    cursor.execute(f'''
        SELECT 
            brokerage,
            COUNT(*) as agent_count,
            GROUP_CONCAT(DISTINCT city) as cities
        FROM recruiters 
        {where_clause}
        GROUP BY brokerage
        ORDER BY agent_count DESC
    ''', params)
    
    all_brokerages = []
    for row in cursor.fetchall():
        name = row[0]
        clean_name = clean_brokerage_name(name)
        agent_count = row[1]
        cities = [c for c in (row[2] or '').split(',') if c][:5]  # Top 5 cities
        primary_city = cities[0] if cities else None
        
        all_brokerages.append({
            'name': name,
            'clean_name': clean_name,
            'agent_count': agent_count,
            'cities': cities,
            'primary_city': primary_city
        })
    
    # Apply sorting
    if sort_by == 'name':
        all_brokerages.sort(key=lambda x: x['clean_name'].lower())
    # Default is by agent_count (already sorted)
    
    # Pagination
    total = len(all_brokerages)
    start_idx = (page - 1) * limit
    end_idx = start_idx + limit
    paginated = all_brokerages[start_idx:end_idx]
    
    conn.close()
    
    return BrokerageResponse(
        brokerages=[Brokerage(**b) for b in paginated],
        total=total,
        page=page,
        pages=(total + limit - 1) // limit
    )

@app.get("/api/brokerages/stats", response_model=BrokerageStats)
async def get_brokerage_stats():
    """Get brokerage statistics"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Total unique brokerages
    cursor.execute("SELECT COUNT(DISTINCT brokerage) FROM recruiters WHERE brokerage != ''")
    total_brokerages = cursor.fetchone()[0]
    
    # Total agents with brokerages
    cursor.execute("SELECT COUNT(*) FROM recruiters WHERE brokerage != ''")
    total_agents = cursor.fetchone()[0]
    
    # Brokerages by city (primary city)
    cursor.execute('''
        SELECT city, COUNT(DISTINCT brokerage) as cnt
        FROM recruiters
        WHERE brokerage != '' AND city != ''
        GROUP BY city
        ORDER BY cnt DESC
        LIMIT 20
    ''')
    by_city = {row[0]: row[1] for row in cursor.fetchall()}
    
    # Top brokerages by agent count
    cursor.execute('''
        SELECT brokerage, COUNT(*) as cnt
        FROM recruiters
        WHERE brokerage != ''
        GROUP BY brokerage
        ORDER BY cnt DESC
        LIMIT 10
    ''')
    top_brokerages = [
        {
            'name': clean_brokerage_name(row[0]),
            'original_name': row[0],
            'agent_count': row[1]
        } 
        for row in cursor.fetchall()
    ]
    
    conn.close()
    
    return BrokerageStats(
        total_brokerages=total_brokerages,
        total_agents=total_agents,
        by_city=by_city,
        top_brokerages=top_brokerages
    )

@app.get("/api/brokerages/cities")
async def get_brokerage_cities():
    """Get cities that have brokerages"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT DISTINCT city
        FROM recruiters
        WHERE brokerage != '' AND city != ''
        ORDER BY city
    ''')
    cities = [row[0] for row in cursor.fetchall()]
    
    conn.close()
    
    return {"cities": cities}

# ============================================================================
# MISSION CONTROL SETTINGS & CONFIGURATION
# ============================================================================

@app.get("/api/mission-control/settings")
async def get_mission_control_settings():
    """
    Get complete Mission Control configuration
    Provides access to all vaults, databases, and data sources
    """
    conn = get_db()
    cursor = conn.cursor()
    
    # Get all data counts
    stats = {}
    for table in ['recruiters', 'dbeaver_brokerages', 'dbeaver_brokers', 
                  'dbeaver_salespersons', 'lenders', 'buyers', 'transactions_full']:
        try:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            stats[table] = cursor.fetchone()[0]
        except:
            stats[table] = 0
    
    conn.close()
    
    return {
        "mission_control": {
            "version": "2.0.0",
            "status": "operational",
            "timestamp": datetime.now().isoformat()
        },
        "vaults": {
            "main_working": {
                "name": "Jamie's Personal Vault",
                "path": "/home/jamie/Desktop/Jamie's Personal Vault",
                "api_url": "https://127.0.0.1:27124",
                "mode": "read-write",
                "connected": True,
                "folders": [
                    "Session_Logs",
                    "Agent_Workspaces",
                    "Daily_Notes",
                    "Deals/Transactions",
                    "Buyers/Prospects",
                    "Properties/Enriched",
                    "Companies/Brokerages",
                    "Companies/Lenders",
                    "People/Brokers",
                    "People/Salespersons"
                ]
            },
            "bdaiv2": {
                "name": "BDAIV2",
                "path": "/home/jamie/Documents/BDAIV2",
                "api_url": "https://127.0.0.1:27125",
                "mode": "read-only",
                "connected": False,  # Not currently running REST API
                "note": "Access via filesystem - NEVER WRITE TO THIS VAULT"
            }
        },
        "databases": {
            "sqlite": {
                "path": "bigdataclaw.db",
                "tables": {
                    "recruiters": {"count": stats.get('recruiters', 0), "description": "96K+ real estate agents"},
                    "dbeaver_brokerages": {"count": stats.get('dbeaver_brokerages', 0), "description": "3,884 brokerages"},
                    "dbeaver_brokers": {"count": stats.get('dbeaver_brokers', 0), "description": "18,596 brokers"},
                    "dbeaver_salespersons": {"count": stats.get('dbeaver_salespersons', 0), "description": "77,295 salespersons"},
                    "lenders": {"count": stats.get('lenders', 0), "description": "1,131 lenders"},
                    "buyers": {"count": stats.get('buyers', 0), "description": "5,130 buyers"},
                    "transactions_full": {"count": stats.get('transactions_full', 0), "description": "25,237 transactions"}
                }
            },
            "qdrant": {
                "host": "localhost",
                "port": 6333,
                "collections": ["recruiters", "companies"],
                "status": "connected"
            }
        },
        "endpoints": {
            "recruiters": {
                "search": "/api/recruiters?search={query}",
                "get_by_id": "/api/recruiters/{id}",
                "update": "PUT /api/recruiters/{id}",
                "stats": "/api/recruiters/stats",
                "filter_options": "/api/recruiters/filter-options"
            },
            "dbeaver_data": {
                "brokerages": "/api/realtor-assistant/brokerages",
                "brokers": "/api/realtor-assistant/brokers",
                "salespersons": "/api/realtor-assistant/salespersons",
                "lenders": "/api/realtor-assistant/lenders",
                "buyers": "/api/realtor-assistant/buyers",
                "transactions": "/api/realtor-assistant/transactions",
                "data_sources": "/api/realtor-assistant/data-sources"
            },
            "obsidian": {
                "status": "/api/obsidian/status",
                "files": "/api/obsidian/files",
                "search": "/api/obsidian/search",
                "active_tasks": "/api/obsidian/active-tasks"
            },
            "agents": {
                "workspaces": "/api/agents/workspaces",
                "commanders": "/api/agents/commanders",
                "activities": "/api/agents/activities"
            }
        },
        "permissions": {
            "main_vault": {
                "read": True,
                "write": True,
                "create_notes": True,
                "edit_notes": True,
                "delete_notes": True
            },
            "bdaiv2": {
                "read": True,
                "write": False,
                "note": "READ ONLY - BDAIV2 vault must never be modified"
            }
        },
        "quick_links_enabled": True,
        "features": {
            "recruiter_search": True,
            "recruiter_edit": True,
            "obsidian_sync": True,
            "dbeaver_import": True,
            "qdrant_semantic_search": True
        }
    }

@app.get("/api/mission-control/vault-files")
async def get_vault_files(
    vault: str = Query("main", enum=["main", "bdaiv2"]),
    folder: Optional[str] = None,
    limit: int = 100
):
    """Get files from specified vault"""
    if vault == "main":
        vault_path = "/home/jamie/Desktop/Jamie's Personal Vault"
    else:
        vault_path = "/home/jamie/Documents/BDAIV2"
    
    import glob
    
    if folder:
        search_path = f"{vault_path}/{folder}/**/*.md"
    else:
        search_path = f"{vault_path}/**/*.md"
    
    files = glob.glob(search_path, recursive=True)
    files = files[:limit]
    
    results = []
    for f in files:
        rel_path = f.replace(vault_path + "/", "")
        stat = os.stat(f)
        results.append({
            "path": rel_path,
            "filename": os.path.basename(f),
            "size": stat.st_size,
            "modified": datetime.fromtimestamp(stat.st_mtime).isoformat()
        })
    
    return {
        "vault": vault,
        "path": vault_path,
        "files": results,
        "total": len(results),
        "mode": "read-write" if vault == "main" else "read-only"
    }

@app.get("/api/mission-control/sync-status")
async def get_sync_status():
    """Get synchronization status between all data sources"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Check various sync states
    status = {
        "sqlite_to_obsidian": {},
        "dbeaver_to_sqlite": {},
        "last_sync": None
    }
    
    # Count Obsidian files
    import glob
    main_vault = "/home/jamie/Desktop/Jamie's Personal Vault"
    
    obsidian_counts = {
        "Brokerages": len(glob.glob(f"{main_vault}/Companies/Brokerages/*.md")),
        "Brokers": len(glob.glob(f"{main_vault}/People/Brokers/*.md")),
        "Salespersons": len(glob.glob(f"{main_vault}/People/Salespersons/*.md")),
        "Lenders": len(glob.glob(f"{main_vault}/Companies/Lenders/*.md")),
        "Transactions": len(glob.glob(f"{main_vault}/Deals/Transactions/*.md")),
        "Buyers": len(glob.glob(f"{main_vault}/Buyers/Prospects/*.md"))
    }
    
    # Get database counts
    db_counts = {}
    for table in ['dbeaver_brokerages', 'dbeaver_brokers', 'dbeaver_salespersons', 
                  'lenders', 'transactions_full', 'buyers']:
        try:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            db_counts[table] = cursor.fetchone()[0]
        except:
            db_counts[table] = 0
    
    conn.close()
    
    return {
        "sync_status": "active",
        "obsidian_files": obsidian_counts,
        "database_records": db_counts,
        "main_vault_path": main_vault,
        "bdaiv2_path": "/home/jamie/Documents/BDAIV2",
        "note": "All systems operational - data synchronized"
    }

# ============================================================================
# CONTEXT KEEP — Persistent Memory Store
# ============================================================================

class ContextKeepRequest(BaseModel):
    source: str = "user"            # user | agent | system
    agent_id: str = ""              # which agent saved it
    topic: str = ""                 # short topic/tag
    content: str = ""               # the actual context/text
    tags: list = []                 # searchable tags
    related_sheet_id: str = ""      # link to feature sheet if applicable


@app.post("/api/contextkeep")
def save_context_keep(request: ContextKeepRequest):
    """Save a context keep record to SQLite."""
    try:
        db_path = Path(os.getenv("BIGDATACLAW_DB", "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/bigdataclaw.db"))
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS context_keep (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT,
                source TEXT,
                agent_id TEXT,
                topic TEXT,
                content TEXT,
                tags TEXT,
                related_sheet_id TEXT
            )
        """)
        record_id = cursor.execute("""
            INSERT INTO context_keep (created_at, source, agent_id, topic, content, tags, related_sheet_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            datetime.utcnow().isoformat(),
            request.source,
            request.agent_id,
            request.topic,
            request.content,
            json.dumps(request.tags),
            request.related_sheet_id,
        )).lastrowid
        conn.commit()
        conn.close()
        return {"status": "saved", "id": record_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/contextkeep")
def list_context_keep(limit: int = 50, offset: int = 0, tag: str = "", search: str = ""):
    """List context keep records with optional filtering."""
    try:
        db_path = Path(os.getenv("BIGDATACLAW_DB", "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/bigdataclaw.db"))
        conn = sqlite3.connect(str(db_path))
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS context_keep (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT,
                source TEXT,
                agent_id TEXT,
                topic TEXT,
                content TEXT,
                tags TEXT,
                related_sheet_id TEXT
            )
        """)
        query = "SELECT * FROM context_keep WHERE 1=1"
        params = []
        if tag:
            query += " AND tags LIKE ?"
            params.append(f'%"{tag}"%')
        if search:
            query += " AND (topic LIKE ? OR content LIKE ?)"
            params.append(f"%{search}%")
            params.append(f"%{search}%")
        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()
        records = []
        for r in rows:
            rec = dict(r)
            try:
                rec["tags"] = json.loads(rec["tags"]) if rec["tags"] else []
            except:
                rec["tags"] = []
            records.append(rec)
        return {"records": records, "count": len(records)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/contextkeep/{record_id}")
def get_context_keep(record_id: int):
    """Get a single context keep record."""
    try:
        db_path = Path(os.getenv("BIGDATACLAW_DB", "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/bigdataclaw.db"))
        conn = sqlite3.connect(str(db_path))
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM context_keep WHERE id = ?", (record_id,))
        row = cursor.fetchone()
        conn.close()
        if not row:
            raise HTTPException(status_code=404, detail="Record not found")
        rec = dict(row)
        try:
            rec["tags"] = json.loads(rec["tags"]) if rec["tags"] else []
        except:
            rec["tags"] = []
        return rec
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/contextkeep/{record_id}")
def delete_context_keep(record_id: int):
    """Delete a context keep record."""
    try:
        db_path = Path(os.getenv("BIGDATACLAW_DB", "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/bigdataclaw.db"))
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        cursor.execute("DELETE FROM context_keep WHERE id = ?", (record_id,))
        conn.commit()
        deleted = cursor.rowcount
        conn.close()
        if deleted == 0:
            raise HTTPException(status_code=404, detail="Record not found")
        return {"status": "deleted", "id": record_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# TEASER EMAIL GENERATOR
# ============================================================================

class TeaserEmailRequest(BaseModel):
    property_type: str = ""
    address: str = ""
    city: str = ""
    province: str = "ON"
    size_sqft: int = 0
    price: int = 0
    net_income: int = 0
    cap_rate: float = 0.0
    occupancy: str = ""
    notes: str = ""
    highlights: list = []
    feature_sheet_url: str = ""
    recipient_type: str = "buyer"  # buyer | broker | lender
    broker_name: str = ""
    broker_company: str = "Mission Control Realty"
    broker_phone: str = ""
    broker_email: str = ""
    # Optional: buyer-aware personalization
    buyers: list = []  # ranked buyer objects with buyer_reason_signal
    include_buyer_matches: bool = False  # if True, inject Top Buyer Matches section


def _build_buyer_match_section(buyers: list) -> tuple:
    """Build a concise Top Buyer Matches HTML + text section from ranked buyers.
    Returns (html_block, text_block). Only includes validated buyers with buyer_reason_signal.
    """
    validated = [b for b in buyers if b.get("buyer_reason_signal") and b.get("score", 0) >= 25]
    if not validated:
        return "", ""

    top = validated[:5]
    html_rows = []
    text_lines = ["TOP BUYER MATCHES", ""]
    for b in top:
        tier = "Tier 1" if b.get("score", 0) >= 75 else "Tier 2" if b.get("score", 0) >= 55 else "Tier 3"
        name = b.get("name", "Unknown")
        signal = b.get("buyer_reason_signal", "")
        cash = b.get("cash_amount", 0)
        cash_str = f" | ${cash/1_000_000:.1f}M capacity" if cash else ""
        html_rows.append(
            f'<tr><td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">'
            f'<p style="margin:0;font-size:14px;font-weight:700;color:#0f172a;">{name} '
            f'<span style="font-size:11px;font-weight:600;color:#0ea5e9;text-transform:uppercase;">{tier}{cash_str}</span></p>'
            f'<p style="margin:4px 0 0;font-size:13px;color:#334155;line-height:1.5;">{signal}</p>'
            f'</td></tr>'
        )
        text_lines.append(f"• {name} ({tier}{cash_str}) — {signal}")

    html_block = (
        '<tr><td style="padding:24px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">'
        '<h2 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#0f172a;">Top Buyer Matches</h2>'
        '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">'
        + "".join(html_rows)
        + '</table></td></tr>'
    )
    text_block = "\n".join(text_lines)
    return html_block, text_block


def _assess_signal_strength(reason_signals: dict) -> str:
    """Assess buyer_reason_signal strength based on populated signal dimensions."""
    if not reason_signals:
        return "weak"
    count = sum(1 for v in reason_signals.values() if v)
    if count >= 3:
        return "strong"
    elif count >= 2:
        return "medium"
    return "weak"


def _assess_contactability(buyer: dict) -> dict:
    """Assess how reachable a buyer is. Returns {has_email, has_phone, has_linkedin, has_website, score}."""
    quick_links = buyer.get("quick_links", {})
    # quick_links may be a dict like {"google": "...", "linkedin": "..."}
    link_keys = set(quick_links.keys()) if isinstance(quick_links, dict) else set()
    has_email = bool(buyer.get("email"))
    has_phone = bool(buyer.get("phone"))
    has_linkedin = "linkedin" in link_keys or "linkedin_president" in link_keys
    has_website = "website" in link_keys
    score = sum([has_email, has_phone, has_linkedin, has_website])
    return {
        "has_email": has_email,
        "has_phone": has_phone,
        "has_linkedin": has_linkedin,
        "has_website": has_website,
        "score": score,
    }


def _bucket_priority(score: float, signal_strength: str, contactability: dict, identity_confidence: str) -> dict:
    """Bucket buyer into actionable priority with recommended channel.
    Returns {"bucket": str, "recommended_channel": str, "outreach_priority": float}
    """
    contact_score = contactability.get("score", 0)

    # Call Now: High score + strong signal + direct contactability + high confidence
    if score >= 75 and signal_strength == "strong" and contact_score >= 2 and identity_confidence == "HIGH":
        return {"bucket": "Call Now", "recommended_channel": "phone", "outreach_priority": score + 20}

    # Send Teaser: Good score + decent signal + some contactability
    if score >= 55 and signal_strength in ("strong", "medium") and contact_score >= 1:
        channel = "email" if contactability.get("has_email") else "linkedin" if contactability.get("has_linkedin") else "broker"
        return {"bucket": "Send Teaser", "recommended_channel": channel, "outreach_priority": score + 10}

    # Research First: Moderate score or weak contactability — needs more work
    if score >= 40 and signal_strength in ("medium", "weak"):
        return {"bucket": "Research First", "recommended_channel": "broker", "outreach_priority": score}

    # Hold: Low conviction or insufficient signals
    return {"bucket": "Hold", "recommended_channel": "none", "outreach_priority": score - 10}


def _build_bucket_reason(score: float, signal_strength: str, contactability: dict, identity_confidence: str, bucket: str) -> str:
    """Generate a human-readable explanation for why a buyer was placed in a given bucket."""
    parts = []
    if identity_confidence == "HIGH":
        parts.append("High confidence identity")
    elif identity_confidence == "MEDIUM":
        parts.append("Medium confidence identity")

    if signal_strength == "strong":
        parts.append("strong signal")
    elif signal_strength == "medium":
        parts.append("moderate signal")
    else:
        parts.append("weak signal")

    contact_score = contactability.get("score", 0)
    if contact_score >= 3:
        parts.append("highly reachable")
    elif contact_score >= 2:
        parts.append("reachable")
    elif contact_score >= 1:
        parts.append("limited contactability")
    else:
        parts.append("no contact path")

    reason = "; ".join(parts)

    if bucket == "Call Now":
        return f"{reason}. High score ({score}) with direct contact path — immediate outreach recommended."
    elif bucket == "Send Teaser":
        return f"{reason}. Good fit with usable channel — teaser is the right first touch."
    elif bucket == "Research First":
        return f"{reason}. Needs verification before direct outreach to avoid wasted effort."
    else:
        return f"{reason}. Insufficient conviction or contactability for priority outreach."


def _build_buyer_outreach_payload(buyers: list, deal: dict) -> list:
    """Generate structured outreach payload for each validated buyer.
    Returns list of dicts with personalization fields, priority buckets, and channel recommendations.
    """
    validated = [b for b in buyers if b.get("buyer_reason_signal") and b.get("score", 0) >= 25]
    payloads = []
    for b in validated:
        score = b.get("score", 0)
        name = b.get("name", "Unknown")
        signal = b.get("buyer_reason_signal", "")
        raw_quick_links = b.get("quick_links", {})
        # Normalize quick_links to list format for frontend
        if isinstance(raw_quick_links, dict):
            quick_links = [{"type": k, "url": v, "label": k.replace('_', ' ').title()} for k, v in raw_quick_links.items() if v]
        else:
            quick_links = raw_quick_links
        reason_signals = b.get("reason_signals", {})
        identity_confidence = "HIGH" if b.get("type") == "hot_money_buyer" else "MEDIUM"

        signal_strength = _assess_signal_strength(reason_signals)
        contactability = _assess_contactability(b)
        bucket_result = _bucket_priority(score, signal_strength, contactability, identity_confidence)
        reason_for_bucket = _build_bucket_reason(score, signal_strength, contactability, identity_confidence, bucket_result["bucket"])

        # Synthesize a short personalized outreach snippet
        first_name = name.split()[0] if ' ' in name else name
        snippet = f"Hi {first_name},\n\n"
        snippet += f"We identified a {deal.get('property_type', 'commercial')} opportunity in {deal.get('city', 'your market')} that aligns with your profile.\n\n"
        snippet += f"Why you: {signal}\n\n"
        snippet += f"Headline: {deal.get('property_type', 'Commercial')} — {deal.get('city')} | ${_fmt_currency(deal.get('price', 0))} | {deal.get('cap_rate', 0)}% Cap\n"
        snippet += f"I'd value 5 minutes to share the full feature sheet."

        # Snippet variant per bucket
        if bucket_result["bucket"] == "Call Now":
            snippet += f"\n\nGiven your recent activity, I wanted to reach you directly before this circulates widely."
        elif bucket_result["bucket"] == "Send Teaser":
            snippet += f"\n\nI've attached a teaser with the headline numbers — happy to send the full feature sheet on request."
        elif bucket_result["bucket"] == "Research First":
            snippet = f"Research note on {name}:\n\n{signal}\n\nAction needed: verify contact info and warm intro path before outreach."

        payloads.append({
            "buyer_name": name,
            "tier": bucket_result["bucket"],
            "score": score,
            "identity_confidence": identity_confidence,
            "buyer_reason_signal": signal,
            "reason_signals": reason_signals,
            "signal_strength": signal_strength,
            "contactability": contactability,
            "quick_links": quick_links,
            "recommended_channel": bucket_result["recommended_channel"],
            "outreach_priority": bucket_result["outreach_priority"],
            "bucket": bucket_result["bucket"],
            "personalized_snippet": snippet,
            "cash_amount": b.get("cash_amount", 0),
            "asset_class": b.get("asset_class", ""),
            "location": b.get("location", ""),
            "type": b.get("type", ""),
            "email": b.get("email", ""),
            "phone": b.get("phone", ""),
            "reason_for_bucket": reason_for_bucket,
        })
    payloads.sort(key=lambda x: x["outreach_priority"], reverse=True)
    return payloads


def _build_teaser_email_html(req: TeaserEmailRequest) -> dict:
    """Build an HTML email + plain text teaser for commercial property outreach.
    If buyers are provided and include_buyer_matches is True, injects a Top Buyer Matches section.
    """
    price_psf = req.price / req.size_sqft if req.size_sqft else 0
    headline = f"{req.property_type or 'Commercial'} Investment — {req.city or 'Ontario'}"
    subhead = req.address or f"{req.city}, {req.province}"
    created = datetime.utcnow().strftime("%B %d, %Y")

    # Auto-generate highlights if not provided
    highlights = list(req.highlights) if req.highlights else []
    if not highlights:
        if req.cap_rate and req.cap_rate >= 5.0:
            highlights.append(f"<strong>Strong {req.cap_rate}% Cap Rate</strong> — Above-market yield opportunity")
        elif req.cap_rate:
            highlights.append(f"<strong>{req.cap_rate}% Cap Rate</strong> — Stable income stream")
        if req.occupancy and req.occupancy.lower() in ["stabilized", "100%", "fully leased"]:
            highlights.append("<strong>Stabilized Asset</strong> — Fully leased with in-place cash flow")
        if req.size_sqft >= 50000:
            highlights.append(f"<strong>Scale</strong> — {_fmt_number(req.size_sqft)} SF institutional-grade footprint")
        if req.notes:
            first_sent = req.notes.split(".")[0]
            if len(first_sent) > 10 and len(first_sent) < 120:
                highlights.append(f"<strong>Value Proposition</strong> — {first_sent}")
    if not highlights:
        highlights = [
            "<strong>Premium Location</strong> — Situated in a high-growth commercial corridor",
            "<strong>Income-Producing</strong> — Established tenant base with consistent NOI",
        ]

    highlights_html = "\n".join(f'<tr><td style="padding:6px 0;color:#334155;font-size:15px;line-height:1.5;"><span style="color:#0ea5e9;font-weight:700;margin-right:8px;">✓</span>{h}</td></tr>' for h in highlights[:5])
    highlights_text = "\n".join(f"• {h.replace('<strong>', '').replace('</strong>', '')}" for h in highlights[:5])

    # Buyer matches section (internal-only, controlled by flag)
    buyer_matches_html = ""
    buyer_matches_text = ""
    if req.include_buyer_matches and req.buyers:
        buyer_matches_html, buyer_matches_text = _build_buyer_match_section(req.buyers)

    # Recipient-specific copy
    if req.recipient_type == "broker":
        greeting = f"Hi {req.broker_name or 'there'},"
        intro = f"We’re circulating a new {req.property_type or 'commercial'} opportunity in {req.city or 'your market'} and would value your buyer network."
        cta_label = "View Full Offering Details"
    elif req.recipient_type == "lender":
        greeting = f"Hi {req.broker_name or 'there'},"
        intro = f"A new {req.property_type or 'commercial'} acquisition in {req.city or 'your market'} is seeking financing. Here are the headline numbers:"
        cta_label = "Review Deal Highlights"
    else:
        greeting = "Exclusive Investment Opportunity"
        intro = f"We’re pleased to present a new {req.property_type or 'commercial'} offering in {req.city or 'Ontario'}. This asset checks the boxes for yield-focused investors."
        cta_label = "View Full Feature Sheet"

    subject = f"{req.property_type or 'Commercial'} — {req.city} | {_fmt_currency(req.price)} | {req.cap_rate}% Cap"

    # Broker signature
    broker_sig = ""
    if req.broker_name or req.broker_company:
        broker_sig = f"""
        <tr><td style="padding-top:24px;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:15px;font-weight:700;color:#0f172a;">{req.broker_name or 'Your Broker'}</p>
          <p style="margin:4px 0 0;font-size:13px;color:#64748b;">{req.broker_company}</p>
          {"<p style='margin:4px 0 0;font-size:13px;color:#64748b;'>" + req.broker_phone + "</p>" if req.broker_phone else ""}
          {"<p style='margin:4px 0 0;font-size:13px;color:#0ea5e9;'><a href='mailto:" + req.broker_email + "' style='color:#0ea5e9;text-decoration:none;'>" + req.broker_email + "</a></p>" if req.broker_email else ""}
        </td></tr>
        """

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{subject}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr><td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr><td style="background:#0f172a;padding:32px;text-align:center;">
            <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#0ea5e9;text-transform:uppercase;letter-spacing:0.08em;">Exclusive Offering</p>
            <h1 style="margin:0;font-size:26px;font-weight:800;color:#ffffff;line-height:1.2;">{headline}</h1>
            <p style="margin:8px 0 0;font-size:15px;color:#94a3b8;">{subhead}</p>
          </td></tr>

          <!-- Metrics -->
          <tr><td style="padding:24px 32px 0;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td style="width:33.33%;text-align:center;padding:12px;background:#f8fafc;border-radius:10px;">
                  <p style="margin:0;font-size:18px;font-weight:700;color:#0f172a;">{_fmt_currency(req.price)}</p>
                  <p style="margin:4px 0 0;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Asking Price</p>
                </td>
                <td style="width:8px;"></td>
                <td style="width:33.33%;text-align:center;padding:12px;background:#f8fafc;border-radius:10px;">
                  <p style="margin:0;font-size:18px;font-weight:700;color:#0f172a;">{req.cap_rate}%</p>
                  <p style="margin:4px 0 0;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Cap Rate</p>
                </td>
                <td style="width:8px;"></td>
                <td style="width:33.33%;text-align:center;padding:12px;background:#f8fafc;border-radius:10px;">
                  <p style="margin:0;font-size:18px;font-weight:700;color:#0f172a;">{_fmt_currency(req.net_income)}</p>
                  <p style="margin:4px 0 0;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">NOI</p>
                </td>
              </tr>
              <tr><td style="height:8px;"></td></tr>
              <tr>
                <td style="width:33.33%;text-align:center;padding:12px;background:#f8fafc;border-radius:10px;">
                  <p style="margin:0;font-size:18px;font-weight:700;color:#0f172a;">{_fmt_number(req.size_sqft)} SF</p>
                  <p style="margin:4px 0 0;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Building Size</p>
                </td>
                <td style="width:8px;"></td>
                <td style="width:33.33%;text-align:center;padding:12px;background:#f8fafc;border-radius:10px;">
                  <p style="margin:0;font-size:18px;font-weight:700;color:#0f172a;">${price_psf:.0f}</p>
                  <p style="margin:4px 0 0;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Price / SF</p>
                </td>
                <td style="width:8px;"></td>
                <td style="width:33.33%;text-align:center;padding:12px;background:#f8fafc;border-radius:10px;">
                  <p style="margin:0;font-size:18px;font-weight:700;color:#0f172a;">{req.occupancy or 'N/A'}</p>
                  <p style="margin:4px 0 0;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Occupancy</p>
                </td>
              </tr>
            </table>
          </td></tr>

          <!-- Body -->
          <tr><td style="padding:24px 32px;">
            <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.6;">{greeting}</p>
            <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6;">{intro}</p>

            <h2 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#0f172a;">Investment Highlights</h2>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              {highlights_html}
            </table>
          </td></tr>

          <!-- CTA -->
          <tr><td style="padding:0 32px 24px;text-align:center;">
            {"<a href='" + req.feature_sheet_url + "' style='display:inline-block;padding:14px 32px;background:#0ea5e9;color:#ffffff;text-decoration:none;border-radius:10px;font-size:15px;font-weight:600;'>" + cta_label + "</a>" if req.feature_sheet_url else ""}
          </td></tr>

          {buyer_matches_html}

          <!-- Broker -->
          {broker_sig}

          <!-- Footer -->
          <tr><td style="padding:20px 32px;background:#f8fafc;text-align:center;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">Generated {created} · Mission Control</p>
            <p style="margin:6px 0 0;font-size:11px;color:#94a3b8;opacity:0.8;">This communication is for informational purposes only and does not constitute an offer.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
</body>
</html>"""

    text = f"""{subject}

{headline}
{subhead}

KEY METRICS
Asking Price: {_fmt_currency(req.price)}
Cap Rate: {req.cap_rate}%
NOI: {_fmt_currency(req.net_income)}
Building Size: {_fmt_number(req.size_sqft)} SF
Price/SF: ${price_psf:.0f}
Occupancy: {req.occupancy or 'N/A'}

{greeting}

{intro}

INVESTMENT HIGHLIGHTS
{highlights_text}

{buyer_matches_text}

{cta_label + ': ' + req.feature_sheet_url if req.feature_sheet_url else ''}

—
{req.broker_name or 'Your Broker'}
{req.broker_company}
{req.broker_phone or ''}
{req.broker_email or ''}

Generated {created} · Mission Control
This communication is for informational purposes only and does not constitute an offer.
"""

    result = {"html": html, "text": text, "subject": subject}
    if req.include_buyer_matches and req.buyers:
        result["buyer_matches_count"] = len([b for b in req.buyers if b.get("buyer_reason_signal")])
    return result


@app.post("/api/buyer-intelligence/teaser")
def create_teaser_email(request: TeaserEmailRequest):
    """
    Generate a teaser email (HTML + plain text) for buyer / broker / lender outreach.
    Optionally buyer-aware if buyers array is provided.
    Returns subject, html_body, text_body, and a preview_url placeholder.
    """
    result = _build_teaser_email_html(request)
    resp = {
        "status": "ready",
        "recipient_type": request.recipient_type,
        "subject": result["subject"],
        "html_body": result["html"],
        "text_body": result["text"],
        "preview_url": "/teaser-preview",
    }
    if result.get("buyer_matches_count") is not None:
        resp["buyer_matches_count"] = result["buyer_matches_count"]
    return resp


# ============================================================================
# OUTREACH PACK ORCHESTRATOR
# ============================================================================

class OutreachPackRequest(BaseModel):
    property_type: str = ""
    address: str = ""
    city: str = ""
    province: str = "ON"
    size_sqft: int = 0
    price: int = 0
    net_income: int = 0
    cap_rate: float = 0.0
    occupancy: str = ""
    notes: str = ""
    broker_name: str = ""
    broker_company: str = "Mission Control Realty"
    broker_phone: str = ""
    broker_email: str = ""


@app.post("/api/outreach-pack")
def create_outreach_pack(request: OutreachPackRequest):
    """
    One-command orchestration:
    1. Run buyer intelligence
    2. Generate feature sheet
    3. Generate teaser emails (buyer, lender, broker)
    4. Return everything packaged with tracking IDs
    """
    pack_id = hashlib.sha256(
        f"{request.address}|{request.city}|{request.price}|{datetime.utcnow().isoformat()}".encode()
    ).hexdigest()[:16]

    results = {"pack_id": pack_id, "phases": [], "assets": {}}

    # Phase 1: Buyer Intelligence
    try:
        bi_req = BuyerIntelligenceRequest(
            property_type=request.property_type,
            address=request.address,
            city=request.city,
            province=request.province,
            size_sqft=request.size_sqft,
            price=request.price,
            net_income=request.net_income,
            cap_rate=request.cap_rate,
            description=request.notes,
            target_count=25,
        )
        # Reuse the intelligence logic without HTTP overhead
        bi_result = buyer_intelligence(bi_req)
        buyers = bi_result.get("ranked_buyers", [])
        lenders = bi_result.get("capable_lenders", [])
        agents = bi_result.get("active_agents", [])

        results["phases"].append({"phase": "intelligence", "status": "complete", "message": f"{len(buyers)} buyers, {len(lenders)} lenders, {len(agents)} agents identified"})
        results["assets"]["buyers"] = buyers[:12]
        results["assets"]["lenders"] = lenders[:6]
        results["assets"]["agents"] = agents[:4]
    except Exception as e:
        results["phases"].append({"phase": "intelligence", "status": "error", "message": str(e)})

    # Phase 2: Feature Sheet
    try:
        fs_req = PropertyFeatureSheetRequest(
            property_type=request.property_type,
            address=request.address,
            city=request.city,
            province=request.province,
            size_sqft=request.size_sqft,
            price=request.price,
            net_income=request.net_income,
            cap_rate=request.cap_rate,
            occupancy=request.occupancy,
            notes=request.notes,
            broker_name=request.broker_name,
            broker_company=request.broker_company,
            broker_phone=request.broker_phone,
            broker_email=request.broker_email,
        )
        sheet_id = _generate_feature_sheet_id(fs_req)
        sheet_html = _build_feature_sheet_html(fs_req, sheet_id)

        # Persist to in-memory store + SQLite
        _FEATURE_SHEET_STORE[sheet_id] = {
            "id": sheet_id,
            "created_at": datetime.utcnow().isoformat(),
            "property": fs_req.model_dump(),
            "html": sheet_html,
        }
        try:
            db_path = Path(os.getenv("BIGDATACLAW_DB", "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/bigdataclaw.db"))
            conn = sqlite3.connect(str(db_path))
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS feature_sheets (
                    id TEXT PRIMARY KEY,
                    created_at TEXT,
                    property_json TEXT,
                    html_content TEXT
                )
            """)
            cursor.execute("""
                INSERT OR REPLACE INTO feature_sheets (id, created_at, property_json, html_content)
                VALUES (?, ?, ?, ?)
            """, (sheet_id, datetime.utcnow().isoformat(), json.dumps(fs_req.model_dump()), sheet_html))
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"[outreach-pack] feature sheet persist warning: {e}")

        host = os.getenv("PUBLIC_HOST", "")
        sheet_url = f"{host}/feature-sheet/{sheet_id}" if host else f"/feature-sheet/{sheet_id}"

        results["phases"].append({"phase": "feature_sheet", "status": "complete", "message": "Feature sheet generated"})
        results["assets"]["feature_sheet"] = {"id": sheet_id, "url": sheet_url}
    except Exception as e:
        results["phases"].append({"phase": "feature_sheet", "status": "error", "message": str(e)})

    # Phase 3a: Buyer Outreach Payloads (internal, buyer-centric)
    try:
        deal_context = {
            "property_type": request.property_type,
            "address": request.address,
            "city": request.city,
            "price": request.price,
            "cap_rate": request.cap_rate,
            "net_income": request.net_income,
            "size_sqft": request.size_sqft,
        }
        buyer_payloads = _build_buyer_outreach_payload(buyers, deal_context)
        results["assets"]["buyer_outreach_payloads"] = buyer_payloads
        results["assets"]["top_buyer_matches"] = _build_buyer_match_section(buyers)[1] if buyers else ""
        # Bucket summary for quick operator scanning
        bucket_counts = {}
        for p in buyer_payloads:
            bucket_counts[p["bucket"]] = bucket_counts.get(p["bucket"], 0) + 1
        results["assets"]["bucket_summary"] = bucket_counts
        results["phases"].append({"phase": "buyer_payloads", "status": "complete", "message": f"{len(buyer_payloads)} buyer outreach payloads generated — {bucket_counts.get('Call Now', 0)} call now, {bucket_counts.get('Send Teaser', 0)} send teaser, {bucket_counts.get('Research First', 0)} research, {bucket_counts.get('Hold', 0)} hold"})
    except Exception as e:
        results["phases"].append({"phase": "buyer_payloads", "status": "error", "message": str(e)})

    # Phase 3b: Teaser Emails (external, property-centric + optional buyer-aware internal layer)
    try:
        sheet_url = results["assets"].get("feature_sheet", {}).get("url", "")
        for recipient_type in ["buyer", "lender", "broker"]:
            # External teaser — property-centric, polished
            teaser_req = TeaserEmailRequest(
                property_type=request.property_type,
                address=request.address,
                city=request.city,
                province=request.province,
                size_sqft=request.size_sqft,
                price=request.price,
                net_income=request.net_income,
                cap_rate=request.cap_rate,
                occupancy=request.occupancy,
                notes=request.notes,
                feature_sheet_url=sheet_url,
                recipient_type=recipient_type,
                broker_name=request.broker_name,
                broker_company=request.broker_company,
                broker_phone=request.broker_phone,
                broker_email=request.broker_email,
            )
            teaser = _build_teaser_email_html(teaser_req)
            results["assets"][f"teaser_{recipient_type}"] = {
                "subject": teaser["subject"],
                "html_preview": teaser["html"][:500] + "..." if len(teaser["html"]) > 500 else teaser["html"],
                "text_body": teaser["text"],
            }

            # Internal buyer-aware variant — same property teaser + top buyer matches
            internal_teaser_req = TeaserEmailRequest(
                property_type=request.property_type,
                address=request.address,
                city=request.city,
                province=request.province,
                size_sqft=request.size_sqft,
                price=request.price,
                net_income=request.net_income,
                cap_rate=request.cap_rate,
                occupancy=request.occupancy,
                notes=request.notes,
                feature_sheet_url=sheet_url,
                recipient_type=recipient_type,
                broker_name=request.broker_name,
                broker_company=request.broker_company,
                broker_phone=request.broker_phone,
                broker_email=request.broker_email,
                buyers=buyers,
                include_buyer_matches=True,
            )
            internal_teaser = _build_teaser_email_html(internal_teaser_req)
            results["assets"][f"teaser_{recipient_type}_internal"] = {
                "subject": internal_teaser["subject"],
                "html_preview": internal_teaser["html"][:800] + "..." if len(internal_teaser["html"]) > 800 else internal_teaser["html"],
                "text_body": internal_teaser["text"],
                "buyer_matches_count": internal_teaser.get("buyer_matches_count", 0),
            }
        results["phases"].append({"phase": "teaser_emails", "status": "complete", "message": "Buyer, lender, and broker teasers generated (external + internal buyer-aware)"})
    except Exception as e:
        results["phases"].append({"phase": "teaser_emails", "status": "error", "message": str(e)})

    # Phase 4: Save to ContextKeep + Outreach Tracking
    try:
        db_path = Path(os.getenv("BIGDATACLAW_DB", "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/bigdataclaw.db"))
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS outreach_tracking (
                id TEXT PRIMARY KEY,
                pack_id TEXT,
                created_at TEXT,
                property_json TEXT,
                recipient_type TEXT,
                recipient_name TEXT,
                recipient_email TEXT,
                status TEXT DEFAULT 'draft',
                sent_at TEXT,
                opened_at TEXT,
                replied_at TEXT,
                converted_at TEXT
            )
        """)
        # Seed tracking rows for top buyers
        for buyer in results["assets"].get("buyers", [])[:5]:
            cursor.execute("""
                INSERT INTO outreach_tracking (id, pack_id, created_at, property_json, recipient_type, recipient_name, recipient_email, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                hashlib.sha256(f"{pack_id}|{buyer.get('name','')}".encode()).hexdigest()[:16],
                pack_id,
                datetime.utcnow().isoformat(),
                json.dumps(request.model_dump()),
                "buyer",
                buyer.get("name", ""),
                buyer.get("email", ""),
                "draft",
            ))
        conn.commit()
        conn.close()
        results["phases"].append({"phase": "tracking", "status": "complete", "message": "Outreach tracking initialized"})
    except Exception as e:
        results["phases"].append({"phase": "tracking", "status": "error", "message": str(e)})

    # Phase 4b: Persist pack assets for conversion engine
    try:
        db_path = Path(os.getenv("BIGDATACLAW_DB", "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/bigdataclaw.db"))
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS outreach_pack_assets (
                pack_id TEXT PRIMARY KEY,
                created_at TEXT,
                assets_json TEXT
            )
        """)
        cursor.execute("""
            INSERT OR REPLACE INTO outreach_pack_assets (pack_id, created_at, assets_json)
            VALUES (?, ?, ?)
        """, (
            pack_id,
            datetime.utcnow().isoformat(),
            json.dumps(results["assets"]),
        ))
        conn.commit()
        conn.close()
        results["phases"].append({"phase": "pack_assets", "status": "complete", "message": "Pack assets persisted"})
    except Exception as e:
        results["phases"].append({"phase": "pack_assets", "status": "error", "message": str(e)})

    # Phase 5: ContextKeep archive
    try:
        db_path = Path(os.getenv("BIGDATACLAW_DB", "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/bigdataclaw.db"))
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS context_keep (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT,
                source TEXT,
                agent_id TEXT,
                topic TEXT,
                content TEXT,
                tags TEXT,
                related_sheet_id TEXT
            )
        """)
        cursor.execute("""
            INSERT INTO context_keep (created_at, source, agent_id, topic, content, tags, related_sheet_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            datetime.utcnow().isoformat(),
            "system",
            "outreach_orchestrator",
            f"Outreach Pack: {request.property_type} — {request.city}",
            f"Generated outreach pack {pack_id} for {request.address or request.city}. {len(results['assets'].get('buyers',[]))} buyers, {len(results['assets'].get('lenders',[]))} lenders.",
            json.dumps(["outreach", request.property_type.lower(), request.city.lower()]),
            results["assets"].get("feature_sheet", {}).get("id", ""),
        ))
        conn.commit()
        conn.close()
        results["phases"].append({"phase": "context_keep", "status": "complete", "message": "Archived to ContextKeep"})
    except Exception as e:
        results["phases"].append({"phase": "context_keep", "status": "error", "message": str(e)})

    return {
        "pack_id": pack_id,
        "status": "ready",
        "phases": results["phases"],
        "assets": results["assets"],
        "subject_property": {
            "type": request.property_type,
            "address": request.address,
            "city": request.city,
            "price": request.price,
            "cap_rate": request.cap_rate,
        },
    }


@app.get("/api/outreach-tracking/{pack_id}")
def get_outreach_tracking(pack_id: str):
    """Get outreach status for a pack."""
    try:
        db_path = Path(os.getenv("BIGDATACLAW_DB", "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/bigdataclaw.db"))
        conn = sqlite3.connect(str(db_path))
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM outreach_tracking WHERE pack_id = ? ORDER BY created_at DESC", (pack_id,))
        rows = cursor.fetchall()
        conn.close()
        return {"pack_id": pack_id, "records": [dict(r) for r in rows], "count": len(rows)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/outreach-tracking/{tracking_id}/status")
def update_outreach_status(tracking_id: str, status: str = "", timestamp: str = ""):
    """Update outreach status: draft → sent → opened → replied → converted"""
    valid = ["draft", "sent", "opened", "replied", "converted"]
    if status not in valid:
        raise HTTPException(status_code=400, detail=f"Invalid status. Use: {', '.join(valid)}")
    try:
        db_path = Path(os.getenv("BIGDATACLAW_DB", "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/bigdataclaw.db"))
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        ts = timestamp or datetime.utcnow().isoformat()
        col_map = {"sent": "sent_at", "opened": "opened_at", "replied": "replied_at", "converted": "converted_at"}
        if status in col_map:
            cursor.execute(f"UPDATE outreach_tracking SET status = ?, {col_map[status]} = ? WHERE id = ?", (status, ts, tracking_id))
        else:
            cursor.execute("UPDATE outreach_tracking SET status = ? WHERE id = ?", (status, tracking_id))
        conn.commit()
        conn.close()
        return {"status": "updated", "id": tracking_id, "new_status": status}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# OUTREACH ACTION LOGGING
# ============================================================================

class OutreachActionLog(BaseModel):
    pack_id: str = ""
    buyer_name: str = ""
    action: str = ""  # snippet_copied, outreach_exported, channel_selected, email_sent, call_made
    channel: str = ""  # phone, email, linkedin, broker, none
    metadata: dict = {}


@app.post("/api/outreach-action/log")
def log_outreach_action(entry: OutreachActionLog):
    """Log a lightweight outreach action for feedback loop analytics."""
    try:
        db_path = Path(os.getenv("BIGDATACLAW_DB", "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/bigdataclaw.db"))
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS outreach_action_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT,
                pack_id TEXT,
                buyer_name TEXT,
                action TEXT,
                channel TEXT,
                metadata TEXT
            )
        """)
        cursor.execute("""
            INSERT INTO outreach_action_log (created_at, pack_id, buyer_name, action, channel, metadata)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            datetime.utcnow().isoformat(),
            entry.pack_id,
            entry.buyer_name,
            entry.action,
            entry.channel,
            json.dumps(entry.metadata),
        ))
        conn.commit()
        conn.close()
        return {"status": "logged", "action": entry.action, "buyer": entry.buyer_name}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/outreach-action/log/{pack_id}")
def get_outreach_actions(pack_id: str):
    """Get all logged outreach actions for a pack."""
    try:
        db_path = Path(os.getenv("BIGDATACLAW_DB", "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/bigdataclaw.db"))
        conn = sqlite3.connect(str(db_path))
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS outreach_action_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT,
                pack_id TEXT,
                buyer_name TEXT,
                action TEXT,
                channel TEXT,
                metadata TEXT
            )
        """)
        cursor.execute("SELECT * FROM outreach_action_log WHERE pack_id = ? ORDER BY created_at DESC", (pack_id,))
        rows = cursor.fetchall()
        conn.close()
        return {"pack_id": pack_id, "actions": [dict(r) for r in rows], "count": len(rows)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/outreach-action/batch-export")
def batch_export_outreach(payload: dict):
    """Export outreach payloads for a given pack_id filtered by bucket.
    Body: {pack_id, bucket_filter, format}
    """
    pack_id = payload.get("pack_id", "")
    bucket_filter = payload.get("bucket_filter", "")
    fmt = payload.get("format", "json")
    if not pack_id:
        raise HTTPException(status_code=400, detail="pack_id required")
    # Log the export action
    try:
        db_path = Path(os.getenv("BIGDATACLAW_DB", "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/bigdataclaw.db"))
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS outreach_action_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT,
                pack_id TEXT,
                buyer_name TEXT,
                action TEXT,
                channel TEXT,
                metadata TEXT
            )
        """)
        cursor.execute("""
            INSERT INTO outreach_action_log (created_at, pack_id, buyer_name, action, channel, metadata)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            datetime.utcnow().isoformat(),
            pack_id,
            "",
            "outreach_exported",
            "",
            json.dumps({"bucket_filter": bucket_filter, "format": fmt}),
        ))
        conn.commit()
        conn.close()
    except Exception:
        pass
    return {"status": "exported", "pack_id": pack_id, "bucket_filter": bucket_filter, "format": fmt}


# ============================================================================
# OUTREACH FEEDBACK LOOP
# ============================================================================

class OutreachFeedbackRequest(BaseModel):
    pack_id: str = ""
    buyer_name: str = ""
    status: str = ""  # contacted, replied, interested, not_interested, meeting_scheduled, closed
    channel: str = ""  # phone, email, linkedin, in_person
    notes: str = ""
    user_id: str = ""


@app.post("/api/outreach-feedback")
def update_outreach_feedback(request: OutreachFeedbackRequest):
    """Update outreach feedback for a buyer. Creates or updates the tracking record."""
    try:
        db_path = Path(os.getenv("BIGDATACLAW_DB", "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/bigdataclaw.db"))
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS outreach_feedback (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT,
                updated_at TEXT,
                pack_id TEXT,
                buyer_name TEXT,
                status TEXT,
                channel TEXT,
                notes TEXT,
                user_id TEXT
            )
        """)
        # Upsert: update if exists, insert if not
        cursor.execute("""
            SELECT id FROM outreach_feedback WHERE pack_id = ? AND buyer_name = ?
        """, (request.pack_id, request.buyer_name))
        row = cursor.fetchone()
        now = datetime.utcnow().isoformat()
        if row:
            cursor.execute("""
                UPDATE outreach_feedback
                SET updated_at = ?, status = ?, channel = ?, notes = ?, user_id = ?
                WHERE id = ?
            """, (now, request.status, request.channel, request.notes, request.user_id, row[0]))
        else:
            cursor.execute("""
                INSERT INTO outreach_feedback (created_at, updated_at, pack_id, buyer_name, status, channel, notes, user_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (now, now, request.pack_id, request.buyer_name, request.status, request.channel, request.notes, request.user_id))
        # Log timeline event for deal progression tracking
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS deal_timeline_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT,
                pack_id TEXT,
                buyer_name TEXT,
                event_type TEXT,
                metadata TEXT
            )
        """)
        cursor.execute("""
            INSERT INTO deal_timeline_events (created_at, pack_id, buyer_name, event_type, metadata)
            VALUES (?, ?, ?, ?, ?)
        """, (
            now,
            request.pack_id,
            request.buyer_name,
            request.status,
            json.dumps({"channel": request.channel, "notes": request.notes, "user_id": request.user_id}),
        ))
        conn.commit()
        conn.close()
        return {"status": "updated", "pack_id": request.pack_id, "buyer": request.buyer_name, "new_status": request.status}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/outreach-feedback/{pack_id}")
def get_outreach_feedback(pack_id: str):
    """Get all outreach feedback for a pack."""
    try:
        db_path = Path(os.getenv("BIGDATACLAW_DB", "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/bigdataclaw.db"))
        conn = sqlite3.connect(str(db_path))
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS outreach_feedback (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT,
                updated_at TEXT,
                pack_id TEXT,
                buyer_name TEXT,
                status TEXT,
                channel TEXT,
                notes TEXT,
                user_id TEXT
            )
        """)
        cursor.execute("SELECT * FROM outreach_feedback WHERE pack_id = ? ORDER BY updated_at DESC", (pack_id,))
        rows = cursor.fetchall()
        conn.close()
        return {"pack_id": pack_id, "feedback": [dict(r) for r in rows], "count": len(rows)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# CONVERSION ENGINE
# ============================================================================

# Feedback impact weights for adaptive scoring
_FEEDBACK_SCORE_WEIGHTS = {
    "contacted": 1,
    "replied": 5,
    "interested": 10,
    "not_interested": -5,
    "meeting_scheduled": 15,
    "offer": 18,
    "closed": 20,
}

# Follow-up timer rules: (status) -> (due_days, urgency_label)
_FOLLOW_UP_TIMERS = {
    "contacted": (3, "Follow up"),
    "replied": (1, "Respond"),
    "interested": (2, "Escalate"),
    "meeting_scheduled": (1, "Confirm / prep"),
    "offer": (2, "Follow up on offer"),
}

# Next action rules: (current_status, days_since_action) -> suggested_action
_NEXT_ACTION_RULES = [
    # Interested buyers get highest priority follow-up
    ("interested", 0, 1, "Call within 24h 🔥"),
    ("interested", 2, 2, "Escalate within 48h ⚡"),
    ("interested", 3, 7, "Follow up — maintain momentum"),
    ("interested", 7, 999, "Re-engage with new info"),
    # Replied buyers need quick response
    ("replied", 0, 1, "Respond immediately"),
    ("replied", 2, 3, "Follow up email"),
    ("replied", 4, 7, "Call to close"),
    ("replied", 7, 999, "Re-engage or drop"),
    # Contacted but no reply — nurture
    ("contacted", 0, 2, "Wait for response"),
    ("contacted", 3, 5, "Follow up email"),
    ("contacted", 6, 10, "Try different channel"),
    ("contacted", 10, 999, "Drop or revisit later"),
    # Meeting scheduled — confirm and prep
    ("meeting_scheduled", 0, 1, "Confirm meeting details 📅"),
    ("meeting_scheduled", 2, 3, "Send prep materials"),
    ("meeting_scheduled", 4, 999, "Follow up post-meeting"),
    # Offer submitted — close the deal
    ("offer", 0, 1, "Confirm offer received 💰"),
    ("offer", 2, 5, "Follow up on terms"),
    ("offer", 6, 999, "Push for decision"),
    # Closed — celebrate and archive
    ("closed", 0, 999, "🎉 Deal closed — archive & celebrate"),
    # Not interested — deprioritize
    ("not_interested", 0, 999, "Deprioritize — revisit in 90 days"),
    # No feedback yet — use bucket recommendation
    (None, 0, 999, "Use bucket recommendation"),
]


def _compute_next_action(status: str | None, updated_at: str | None, bucket: str) -> str:
    """Compute suggested next action based on feedback status and time since last action."""
    if not status or status == "":
        # No feedback yet — fall back to bucket recommendation
        if bucket == "Call Now":
            return "Call now ☎️"
        elif bucket == "Send Teaser":
            return "Send teaser email 📧"
        elif bucket == "Research First":
            return "Research contact path 🔍"
        return "Hold ⏸️"

    days = 0
    if updated_at:
        try:
            days = (datetime.utcnow() - datetime.fromisoformat(updated_at.replace("Z", "+00:00").replace("+00:00", ""))).days
        except Exception:
            days = 0

    for rule_status, min_days, max_days, action in _NEXT_ACTION_RULES:
        if rule_status == status and min_days <= days <= max_days:
            return action

    # Fallback
    if bucket == "Call Now":
        return "Call now ☎️"
    elif bucket == "Send Teaser":
        return "Send teaser email 📧"
    return "Review ⏸️"


def _compute_next_action_due_at(status: str | None, updated_at: str | None) -> str | None:
    """Compute ISO timestamp for when next action is due."""
    if not status or status not in _FOLLOW_UP_TIMERS:
        return None
    due_days, _ = _FOLLOW_UP_TIMERS[status]
    updated_dt = datetime.utcnow()
    if updated_at:
        try:
            updated_dt = datetime.fromisoformat(updated_at.replace("Z", "+00:00").replace("+00:00", ""))
        except Exception:
            pass
    due = updated_dt + timedelta(days=due_days)
    return due.isoformat()


def _is_action_overdue(due_at: str | None) -> bool:
    if not due_at:
        return False
    try:
        due = datetime.fromisoformat(due_at.replace("Z", "+00:00").replace("+00:00", ""))
        return datetime.utcnow() > due
    except Exception:
        return False


@app.get("/api/hot-money")
def get_hot_money_radar():
    """Aggregate all hot buyers across all packs for the Hot Money Radar."""
    try:
        db_path = _get_db_path()
        conn = sqlite3.connect(str(db_path))
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # Get all packs with assets
        cursor.execute("SELECT pack_id, assets_json FROM outreach_pack_assets ORDER BY created_at DESC LIMIT 50")
        pack_rows = cursor.fetchall()

        all_hot_buyers = []

        for pack_row in pack_rows:
            pack_id = pack_row["pack_id"]
            try:
                assets = json.loads(pack_row["assets_json"] or "{}")
                buyers = assets.get("buyers", [])
            except:
                buyers = []

            # Get feedback for this pack
            cursor.execute("SELECT buyer_name, status, updated_at FROM outreach_feedback WHERE pack_id = ?", (pack_id,))
            feedback_rows = cursor.fetchall()
            feedback_map = {r["buyer_name"]: {"status": r["status"], "updated_at": r["updated_at"]} for r in feedback_rows}

            for buyer in buyers:
                name = buyer.get("name", "")
                fb = feedback_map.get(name, {})
                status = fb.get("status", "")

                # Only include buyers with signal (replied, interested, meeting, offer, closed, contacted)
                if status in ("replied", "interested", "meeting_scheduled", "offer", "closed", "contacted"):
                    base_score = buyer.get("score", 0) or buyer.get("match_score", 0) or 50
                    dynamic_score = base_score + _FEEDBACK_SCORE_WEIGHTS.get(status, 0)

                    all_hot_buyers.append({
                        "buyer_name": name,
                        "status": status,
                        "dynamic_score": min(dynamic_score, 100),
                        "base_score": base_score,
                        "bucket": buyer.get("bucket", buyer.get("tier", "Send Teaser")),
                        "next_action": _compute_next_action(status, fb.get("updated_at", datetime.utcnow().isoformat()), buyer.get("bucket", "")),
                        "buyer_reason_signal": buyer.get("buyer_reason_signal", buyer.get("reason", "")),
                        "capital_event": buyer.get("cash_amount", ""),
                        "asset_match": buyer.get("asset_class", buyer.get("property_type", "")),
                        "geographic_match": buyer.get("location", buyer.get("city", "")),
                        "activity_signal": buyer.get("sale_date", ""),
                        "pack_id": pack_id,
                        "updated_at": fb.get("updated_at", ""),
                    })

        conn.close()

        # Sort by score desc
        all_hot_buyers.sort(key=lambda b: b["dynamic_score"], reverse=True)

        return {
            "hot_buyers": all_hot_buyers,
            "total": len(all_hot_buyers),
            "stats": {
                "replied": len([b for b in all_hot_buyers if b["status"] == "replied"]),
                "interested": len([b for b in all_hot_buyers if b["status"] == "interested"]),
                "meeting": len([b for b in all_hot_buyers if b["status"] == "meeting_scheduled"]),
                "offer": len([b for b in all_hot_buyers if b["status"] == "offer"]),
                "closed": len([b for b in all_hot_buyers if b["status"] == "closed"]),
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/conversion-engine/{pack_id}")
def get_conversion_engine(pack_id: str):
    """
    Deal Conversion Engine: transforms outreach tracking into actionable intelligence.
    Returns hot buyers, pipeline metrics, adaptive scores, and next actions.
    """
    try:
        db_path = Path(os.getenv("BIGDATACLAW_DB", "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/bigdataclaw.db"))
        conn = sqlite3.connect(str(db_path))
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # 1. Load pack assets (buyer outreach payloads)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS outreach_pack_assets (
                pack_id TEXT PRIMARY KEY,
                created_at TEXT,
                assets_json TEXT
            )
        """)
        cursor.execute("SELECT assets_json FROM outreach_pack_assets WHERE pack_id = ?", (pack_id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            raise HTTPException(status_code=404, detail=f"Pack {pack_id} not found")
        assets = json.loads(row["assets_json"] or "{}")
        payloads = assets.get("buyer_outreach_payloads", [])

        # 2. Load all feedback for this pack
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS outreach_feedback (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT,
                updated_at TEXT,
                pack_id TEXT,
                buyer_name TEXT,
                status TEXT,
                channel TEXT,
                notes TEXT,
                user_id TEXT
            )
        """)
        cursor.execute("SELECT * FROM outreach_feedback WHERE pack_id = ?", (pack_id,))
        feedback_rows = cursor.fetchall()
        feedback_map = {}
        for r in feedback_rows:
            feedback_map[r["buyer_name"]] = dict(r)

        # 3. Load deal timeline events
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS deal_timeline_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT,
                pack_id TEXT,
                buyer_name TEXT,
                event_type TEXT,
                metadata TEXT
            )
        """)
        cursor.execute("SELECT * FROM deal_timeline_events WHERE pack_id = ? ORDER BY created_at", (pack_id,))
        timeline_rows = cursor.fetchall()
        timeline_events = [dict(r) for r in timeline_rows]

        # 4. Outcome feedback loop — compute buyer reputation across ALL deals
        buyer_names = [p.get("buyer_name", "") for p in payloads if p.get("buyer_name")]
        reputation_map = {}
        if buyer_names:
            cursor.execute("""
                SELECT buyer_name, status, COUNT(*) as cnt
                FROM outreach_feedback
                WHERE buyer_name IN ({placeholders})
                GROUP BY buyer_name, status
            """.format(placeholders=",".join(["?"] * len(buyer_names))),
            buyer_names)
            buyer_reputation_rows = cursor.fetchall()
            for r in buyer_reputation_rows:
                name = r["buyer_name"]
                status = r["status"]
                cnt = r["cnt"]
                if name not in reputation_map:
                    reputation_map[name] = {"total": 0, "positive": 0, "negative": 0, "counts": {}}
                reputation_map[name]["total"] += cnt
                reputation_map[name]["counts"][status] = cnt
                if status in ("replied", "interested", "meeting_scheduled", "offer", "closed"):
                    reputation_map[name]["positive"] += cnt
                if status in ("not_interested",):
                    reputation_map[name]["negative"] += cnt

        conn.close()

        # 5. Compute conversion engine data per buyer
        hot_buyers = []
        enriched_payloads = []
        pipeline = {
            "targeted": len(payloads),
            "contacted": 0,
            "replied": 0,
            "interested": 0,
            "not_interested": 0,
            "meeting_scheduled": 0,
            "offer": 0,
            "closed": 0,
        }

        for p in payloads:
            name = p.get("buyer_name", "")
            fb = feedback_map.get(name)
            status = fb["status"] if fb else None
            updated_at = fb["updated_at"] if fb else None

            # Pipeline counting
            if status:
                pipeline[status] = pipeline.get(status, 0) + 1

            # Dynamic score = base score + feedback modifier + reputation boost
            base_score = p.get("score", 0)
            modifier = _FEEDBACK_SCORE_WEIGHTS.get(status, 0) if status else 0
            reputation = reputation_map.get(name, {"positive": 0, "negative": 0, "total": 0})
            reputation_boost = 0
            if reputation["total"] > 0:
                ratio = reputation["positive"] / reputation["total"]
                # Frequent positive responders get up to +5 boost
                if ratio >= 0.7 and reputation["total"] >= 2:
                    reputation_boost = 5
                elif ratio <= 0.2 and reputation["total"] >= 2:
                    reputation_boost = -3
            dynamic_score = min(base_score + modifier + reputation_boost, 100)

            # Next action + due date + overdue check
            next_action = _compute_next_action(status, updated_at, p.get("bucket", ""))
            next_action_due_at = _compute_next_action_due_at(status, updated_at)
            is_overdue = _is_action_overdue(next_action_due_at)

            enriched = {
                **p,
                "dynamic_score": round(dynamic_score, 1),
                "feedback_status": status,
                "feedback_updated_at": updated_at,
                "next_action": next_action,
                "next_action_due_at": next_action_due_at,
                "is_overdue": is_overdue,
                "is_hot": status in ("replied", "interested", "meeting_scheduled", "offer", "closed"),
                "reputation": {
                    "total_interactions": reputation["total"],
                    "positive_count": reputation["positive"],
                    "negative_count": reputation["negative"],
                    "boost": reputation_boost,
                },
            }
            enriched_payloads.append(enriched)

            if enriched["is_hot"]:
                hot_buyers.append({
                    "buyer_name": name,
                    "status": status,
                    "dynamic_score": enriched["dynamic_score"],
                    "bucket": p.get("bucket", ""),
                    "next_action": next_action,
                    "next_action_due_at": next_action_due_at,
                    "is_overdue": is_overdue,
                    "buyer_reason_signal": p.get("buyer_reason_signal", ""),
                })

        # Sort enriched payloads by dynamic score desc, then by overdue first
        enriched_payloads.sort(key=lambda x: (x["is_overdue"], x["dynamic_score"]), reverse=True)
        hot_buyers.sort(key=lambda x: (x["is_overdue"], x["dynamic_score"]), reverse=True)

        # Compute conversion rates
        targeted = pipeline["targeted"] or 1
        contacted = pipeline["contacted"]
        replied = pipeline["replied"]
        interested = pipeline["interested"]
        meeting_scheduled = pipeline["meeting_scheduled"]
        offer = pipeline["offer"]
        closed = pipeline["closed"]

        conversion_rates = {
            "contacted_rate": round(contacted / targeted * 100, 1),
            "replied_rate": round(replied / targeted * 100, 1),
            "interested_rate": round(interested / targeted * 100, 1),
            "meeting_rate": round(meeting_scheduled / targeted * 100, 1),
            "offer_rate": round(offer / targeted * 100, 1),
            "close_rate": round(closed / targeted * 100, 1),
            "contacted_to_replied": round(replied / contacted * 100, 1) if contacted else 0,
            "replied_to_interested": round(interested / replied * 100, 1) if replied else 0,
            "interested_to_meeting": round(meeting_scheduled / interested * 100, 1) if interested else 0,
            "meeting_to_offer": round(offer / meeting_scheduled * 100, 1) if meeting_scheduled else 0,
            "offer_to_close": round(closed / offer * 100, 1) if offer else 0,
        }

        # Pipeline stage counts for funnel visualization
        funnel = {
            "targeted": targeted,
            "contacted": contacted,
            "replied": replied,
            "interested": interested,
            "meeting_scheduled": meeting_scheduled,
            "offer": offer,
            "closed": closed,
            "not_interested": pipeline["not_interested"],
        }

        # Bottleneck detection
        bottleneck = None
        if contacted / targeted > 0.5 and replied / (contacted or 1) < 0.2:
            bottleneck = "High contact rate, low reply rate → messaging issue"
        elif replied / (contacted or 1) > 0.3 and interested / (replied or 1) < 0.2:
            bottleneck = "Good replies, low interest → qualification issue"
        elif interested > 0 and meeting_scheduled / interested < 0.3:
            bottleneck = "High interest, low meetings → scheduling friction"
        elif meeting_scheduled > 0 and offer / meeting_scheduled < 0.3:
            bottleneck = "Meetings happening, low offers → pricing or terms issue"
        elif contacted / targeted < 0.2:
            bottleneck = "Low contact rate → outreach execution issue"

        return {
            "pack_id": pack_id,
            "hot_buyers": hot_buyers,
            "hot_buyer_count": len(hot_buyers),
            "enriched_payloads": enriched_payloads,
            "pipeline": funnel,
            "conversion_rates": conversion_rates,
            "bottleneck": bottleneck,
            "feedback_count": len(feedback_rows),
            "timeline_events": timeline_events,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/deal-timeline/{pack_id}")
def get_deal_timeline(pack_id: str):
    """Get the full deal timeline: execution history, outreach actions, feedback, and timeline events."""
    try:
        db_path = Path(os.getenv("BIGDATACLAW_DB", "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/bigdataclaw.db"))
        conn = sqlite3.connect(str(db_path))
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        events = []

        # Pack creation event from pack assets
        cursor.execute("SELECT created_at FROM outreach_pack_assets WHERE pack_id = ?", (pack_id,))
        pack_row = cursor.fetchone()
        if pack_row:
            events.append({
                "timestamp": pack_row["created_at"],
                "type": "milestone",
                "event_type": "deal_created",
                "title": "Deal Created",
                "description": "Outreach pack generated",
            })

        # Execution history events
        cursor.execute("SELECT created_at, event_type, run_id, metadata FROM execution_history WHERE run_id = ? ORDER BY created_at", (pack_id,))
        for row in cursor.fetchall():
            events.append({
                "timestamp": row["created_at"],
                "type": "execution",
                "event_type": row["event_type"],
                "run_id": row["run_id"],
                "metadata": json.loads(row["metadata"] or "{}"),
            })

        # Outreach actions
        cursor.execute("SELECT created_at, buyer_name, action, channel, metadata FROM outreach_action_log WHERE pack_id = ? ORDER BY created_at", (pack_id,))
        for row in cursor.fetchall():
            events.append({
                "timestamp": row["created_at"],
                "type": "action",
                "buyer_name": row["buyer_name"],
                "action": row["action"],
                "channel": row["channel"],
                "metadata": json.loads(row["metadata"] or "{}"),
            })

        # Outreach feedback
        cursor.execute("SELECT updated_at, buyer_name, status, channel, notes FROM outreach_feedback WHERE pack_id = ? ORDER BY updated_at", (pack_id,))
        for row in cursor.fetchall():
            events.append({
                "timestamp": row["updated_at"],
                "type": "feedback",
                "buyer_name": row["buyer_name"],
                "status": row["status"],
                "channel": row["channel"],
                "notes": row["notes"],
            })

        # Timeline events
        cursor.execute("SELECT created_at, buyer_name, event_type, metadata FROM deal_timeline_events WHERE pack_id = ? ORDER BY created_at", (pack_id,))
        for row in cursor.fetchall():
            events.append({
                "timestamp": row["created_at"],
                "type": "timeline",
                "buyer_name": row["buyer_name"],
                "event_type": row["event_type"],
                "metadata": json.loads(row["metadata"] or "{}"),
            })

        conn.close()
        events.sort(key=lambda x: x["timestamp"])
        return {"pack_id": pack_id, "events": events, "count": len(events)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# AUTOPILOT ASSIST
# ============================================================================

_FOLLOW_UP_TEMPLATES = {
    "replied": """Hi {first_name},

Great connecting — based on your recent activity in similar {asset_class} product, this {property_type} opportunity in {city} could be a strong fit at {price} with a {cap_rate}% cap.

Are you available this week to review the details?""",
    "interested": """Hi {first_name},

Glad this caught your interest. Based on your profile and the numbers on this {property_type} in {city}, I think there's real alignment.

Happy to walk through the details and structure — does tomorrow or Thursday work for a brief call?""",
    "contacted": """Hi {first_name},

Following up on the {property_type} opportunity in {city} I shared recently. At {price} with a {cap_rate}% cap, it's getting attention quickly.

Wanted to make sure it landed — happy to send additional details or set up a quick conversation.""",
    "meeting_scheduled": """Hi {first_name},

Looking forward to our conversation about the {property_type} in {city}. I've prepared the full feature sheet and recent comparables.

Let me know if there's anything specific you'd like me to have ready.""",
    "offer": """Hi {first_name},

Wanted to follow up on the offer terms we discussed for the {property_type} in {city}. The seller is motivated and we're looking to move quickly.

Are there any questions or adjustments I can help clarify?""",
}


def _generate_follow_up_draft(buyer_name: str, status: str | None, buyer_reason_signal: str, deal_context: dict) -> str:
    """Generate a contextual follow-up draft based on deal stage and buyer profile."""
    if not status or status not in _FOLLOW_UP_TEMPLATES:
        return ""
    first_name = buyer_name.split()[0] if ' ' in buyer_name else buyer_name
    template = _FOLLOW_UP_TEMPLATES[status]
    try:
        return template.format(
            first_name=first_name,
            asset_class=deal_context.get("property_type", "commercial"),
            property_type=deal_context.get("property_type", "commercial"),
            city=deal_context.get("city", "your market"),
            price=f"${_fmt_currency(deal_context.get('price', 0))}",
            cap_rate=deal_context.get("cap_rate", 0),
        )
    except Exception:
        return template.replace("{first_name}", first_name).replace("{property_type}", deal_context.get("property_type", "commercial")).replace("{city}", deal_context.get("city", "your market"))


def _compute_deal_health(pipeline: dict, conversion_rates: dict, hot_buyer_count: int) -> dict:
    """Classify deal health: cold → warming → active → hot → closing."""
    targeted = pipeline.get("targeted", 0)
    contacted = pipeline.get("contacted", 0)
    replied = pipeline.get("replied", 0)
    interested = pipeline.get("interested", 0)
    meeting_scheduled = pipeline.get("meeting_scheduled", 0)
    offer = pipeline.get("offer", 0)
    closed = pipeline.get("closed", 0)

    # Engagement velocity score (0-100)
    engagement_score = 0
    if targeted > 0:
        engagement_score += (contacted / targeted) * 15
        engagement_score += (replied / targeted) * 25
        engagement_score += (interested / targeted) * 30
        engagement_score += (meeting_scheduled / targeted) * 15
        engagement_score += (offer / targeted) * 10
        engagement_score += (closed / targeted) * 5

    # Stage progression bonus
    stage_bonus = 0
    if closed > 0:
        stage_bonus = 40
    elif offer > 0:
        stage_bonus = 30
    elif meeting_scheduled > 0:
        stage_bonus = 20
    elif interested > 0:
        stage_bonus = 10

    total_score = min(engagement_score + stage_bonus, 100)

    # Health classification
    if closed > 0 or total_score >= 80:
        health = "closing"
        label = "🔥 Closing"
    elif offer > 0 or total_score >= 60:
        health = "hot"
        label = "🌡️ Hot"
    elif interested > 0 or meeting_scheduled > 0 or total_score >= 40:
        health = "active"
        label = "⚡ Active"
    elif replied > 0 or contacted > 0 or total_score >= 20:
        health = "warming"
        label = "🌤️ Warming"
    else:
        health = "cold"
        label = "❄️ Cold"

    # Risk assessment
    risk = "low"
    if contacted > 0 and replied == 0 and interested == 0:
        risk = "high"
    elif interested > 0 and meeting_scheduled == 0:
        risk = "medium"
    elif offer > 0 and closed == 0:
        risk = "medium"

    return {
        "health": health,
        "label": label,
        "score": round(total_score, 1),
        "risk": risk,
        "momentum": "strong" if total_score >= 50 else "weak",
    }


def _compute_close_probability(pipeline: dict, hot_buyer_count: int, avg_dynamic_score: float) -> float:
    """Estimate close probability based on pipeline composition and buyer quality."""
    targeted = pipeline.get("targeted", 1)
    interested = pipeline.get("interested", 0)
    meeting_scheduled = pipeline.get("meeting_scheduled", 0)
    offer = pipeline.get("offer", 0)
    closed = pipeline.get("closed", 0)

    # Base probability from stage
    prob = 0
    if closed > 0:
        prob = max(prob, 95)
    if offer > 0:
        prob = max(prob, 75)
    if meeting_scheduled > 0:
        prob = max(prob, 55)
    if interested > 0:
        prob = max(prob, 35)

    # Engagement density boost
    engagement_ratio = (interested + meeting_scheduled + offer + closed) / targeted
    prob += engagement_ratio * 20

    # Buyer quality boost
    if avg_dynamic_score >= 80:
        prob += 10
    elif avg_dynamic_score >= 60:
        prob += 5

    return min(round(prob, 1), 100)


def _generate_insights(pack_id: str, pipeline: dict, conversion_rates: dict, conn) -> list:
    """Generate pattern learning insights from execution history."""
    insights = []

    # Insight 1: Stage progression efficiency
    interested = pipeline.get("interested", 0)
    meeting_scheduled = pipeline.get("meeting_scheduled", 0)
    offer = pipeline.get("offer", 0)
    contacted = pipeline.get("contacted", 0)
    replied = pipeline.get("replied", 0)

    if contacted > 0 and replied > 0:
        reply_rate = replied / contacted
        if reply_rate >= 0.5:
            insights.append(f"✅ Strong reply rate ({round(reply_rate*100)}%) — messaging is resonating")
        elif reply_rate < 0.2:
            insights.append(f"⚠️ Low reply rate ({round(reply_rate*100)}%) — consider refining outreach angle")

    if interested > 0 and meeting_scheduled > 0:
        meeting_rate = meeting_scheduled / interested
        if meeting_rate >= 0.5:
            insights.append(f"🎯 High meeting conversion ({round(meeting_rate*100)}%) — buyers are qualified")

    if meeting_scheduled > 0 and offer > 0:
        offer_rate = offer / meeting_scheduled
        if offer_rate >= 0.5:
            insights.append(f"💰 Strong offer rate ({round(offer_rate*100)}%) — pricing/terms are competitive")

    # Insight 2: Cross-deal pattern (requires historical data)
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT status, COUNT(*) as cnt FROM outreach_feedback GROUP BY status
        """)
        all_feedback = {row["status"]: row["cnt"] for row in cursor.fetchall()}
        total = sum(all_feedback.values())
        if total > 10:
            positive = sum(all_feedback.get(s, 0) for s in ("replied", "interested", "meeting_scheduled", "offer", "closed"))
            negative = all_feedback.get("not_interested", 0)
            if positive > 0:
                insights.append(f"📊 System-wide: {round(positive/total*100)}% positive response rate across all deals")
    except Exception:
        pass

    # Insight 3: Timing / urgency
    if interested > 0 and meeting_scheduled == 0:
        insights.append("⏰ Interested buyers not yet scheduled — prioritize meeting outreach")
    if offer > 0 and pipeline.get("closed", 0) == 0:
        insights.append("🚀 Offers on the table — focus on closing discipline")

    if not insights:
        insights.append("📝 Submit feedback on buyers to generate personalized insights")

    return insights


@app.get("/api/autopilot/{pack_id}")
def get_autopilot_assist(pack_id: str):
    """
    Autopilot Assist: execution acceleration with human control.
    Returns follow-up drafts, deal health, insights, and close probability.
    """
    try:
        db_path = Path(os.getenv("BIGDATACLAW_DB", "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/bigdataclaw.db"))
        conn = sqlite3.connect(str(db_path))
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # 1. Load pack assets
        cursor.execute("SELECT assets_json FROM outreach_pack_assets WHERE pack_id = ?", (pack_id,))
        row = cursor.fetchone()
        if not row:
            conn.close()
            raise HTTPException(status_code=404, detail=f"Pack {pack_id} not found")
        assets = json.loads(row["assets_json"] or "{}")
        payloads = assets.get("buyer_outreach_payloads", [])
        deal_context = assets.get("deal_context", {})
        # Fallback deal context from subject_property if not stored
        if not deal_context and assets.get("subject_property"):
            deal_context = assets["subject_property"]

        # 2. Load feedback
        cursor.execute("SELECT * FROM outreach_feedback WHERE pack_id = ?", (pack_id,))
        feedback_rows = cursor.fetchall()
        feedback_map = {r["buyer_name"]: dict(r) for r in feedback_rows}

        # 3. Build pipeline counts
        pipeline = {
            "targeted": len(payloads), "contacted": 0, "replied": 0,
            "interested": 0, "not_interested": 0,
            "meeting_scheduled": 0, "offer": 0, "closed": 0,
        }
        for p in payloads:
            fb = feedback_map.get(p.get("buyer_name", ""))
            if fb:
                pipeline[fb["status"]] = pipeline.get(fb["status"], 0) + 1

        # 4. Generate follow-up drafts for each engaged buyer
        follow_up_drafts = []
        total_dynamic_score = 0
        hot_buyer_count = 0
        for p in payloads:
            name = p.get("buyer_name", "")
            fb = feedback_map.get(name)
            status = fb["status"] if fb else None
            if status in _FOLLOW_UP_TEMPLATES:
                draft = _generate_follow_up_draft(
                    name, status,
                    p.get("buyer_reason_signal", ""),
                    deal_context,
                )
                follow_up_drafts.append({
                    "buyer_name": name,
                    "status": status,
                    "draft": draft,
                })
            # Accumulate for close probability
            base_score = p.get("score", 0)
            modifier = _FEEDBACK_SCORE_WEIGHTS.get(status, 0) if status else 0
            total_dynamic_score += min(base_score + modifier, 100)
            if status in ("replied", "interested", "meeting_scheduled", "offer", "closed"):
                hot_buyer_count += 1

        avg_dynamic_score = total_dynamic_score / len(payloads) if payloads else 0

        # 5. Compute deal health
        deal_health = _compute_deal_health(pipeline, {}, hot_buyer_count)

        # 6. Compute close probability
        close_probability = _compute_close_probability(pipeline, hot_buyer_count, avg_dynamic_score)

        # 7. Generate insights
        insights = _generate_insights(pack_id, pipeline, {}, conn)

        conn.close()

        return {
            "pack_id": pack_id,
            "follow_up_drafts": follow_up_drafts,
            "deal_health": deal_health,
            "close_probability": close_probability,
            "insights": insights,
            "pipeline_summary": pipeline,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# EXECUTION HISTORY
# ============================================================================

@app.get("/api/execution-history")
def get_execution_history(limit: int = 50, event_type: str = ""):
    """Get operational execution history for audit trail and analytics."""
    try:
        db_path = Path(os.getenv("BIGDATACLAW_DB", "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/bigdataclaw.db"))
        conn = sqlite3.connect(str(db_path))
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS execution_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT,
                event_type TEXT,
                run_id TEXT,
                metadata TEXT
            )
        """)
        if event_type:
            cursor.execute("SELECT * FROM execution_history WHERE event_type = ? ORDER BY created_at DESC LIMIT ?", (event_type, limit))
        else:
            cursor.execute("SELECT * FROM execution_history ORDER BY created_at DESC LIMIT ?", (limit,))
        rows = cursor.fetchall()
        conn.close()
        return {"events": [dict(r) for r in rows], "count": len(rows)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# AGENT ORCHESTRATOR + LIVE EVENT STREAM
# ============================================================================

import asyncio
from collections import defaultdict

# In-memory agent registry and event bus
_AGENT_REGISTRY = {}
_AGENT_EVENTS = asyncio.Queue()
_AGENT_SUBSCRIBERS = defaultdict(list)


class AgentOrchestratorRequest(BaseModel):
    command: str = ""
    property_type: str = ""
    address: str = ""
    city: str = ""
    province: str = "ON"
    size_sqft: int = 0
    price: int = 0
    net_income: int = 0
    cap_rate: float = 0.0
    occupancy: str = ""
    notes: str = ""
    broker_name: str = ""
    broker_company: str = "Mission Control Realty"
    broker_phone: str = ""
    broker_email: str = ""


class AgentEvent(BaseModel):
    type: str
    agent_id: str
    agent_name: str = ""
    role: str = ""
    task: str = ""
    tool: str = ""
    status: str = ""
    message: str = ""
    artifact_url: str = ""
    parent_id: str = ""
    timestamp: str = ""


_AGENT_REGISTRY_TTL_SECONDS = 300  # 5 minutes


def _prune_stale_agents():
    """Remove agents that haven't been updated in TTL_SECONDS."""
    now = datetime.utcnow()
    stale = []
    for agent_id, agent in _AGENT_REGISTRY.items():
        ts_str = agent.get("timestamp", "")
        if not ts_str:
            stale.append(agent_id)
            continue
        try:
            ts = datetime.fromisoformat(ts_str)
            if (now - ts).total_seconds() > _AGENT_REGISTRY_TTL_SECONDS:
                stale.append(agent_id)
        except Exception:
            stale.append(agent_id)
    for agent_id in stale:
        del _AGENT_REGISTRY[agent_id]


def _emit_agent_event(event: dict):
    """Broadcast agent event to all subscribers and persist to registry.
    Room chat messages are broadcast but NOT stored in the agent registry.
    Stale agents are pruned on every event.
    """
    event["timestamp"] = datetime.utcnow().isoformat()
    agent_id = event.get("agent_id")
    # Only persist true agent lifecycle events to registry, not room chat
    is_room_chat = event.get("type", "").startswith("room.")
    if agent_id and not is_room_chat:
        _AGENT_REGISTRY[agent_id] = {**_AGENT_REGISTRY.get(agent_id, {}), **event}
    for q in _AGENT_SUBSCRIBERS.get("all", []):
        try:
            q.put_nowait(event)
        except:
            pass


def _log_execution_event(event_type: str, run_id: str = "", metadata: dict = None):
    """Lightweight execution history logging for operational audit trail."""
    try:
        db_path = Path(os.getenv("BIGDATACLAW_DB", "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/bigdataclaw.db"))
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS execution_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT,
                event_type TEXT,
                run_id TEXT,
                metadata TEXT
            )
        """)
        cursor.execute("""
            INSERT INTO execution_history (created_at, event_type, run_id, metadata)
            VALUES (?, ?, ?, ?)
        """, (
            datetime.utcnow().isoformat(),
            event_type,
            run_id,
            json.dumps(metadata or {}),
        ))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[execution-history] log error: {e}")


@app.post("/api/orchestrate")
async def orchestrate_deal_workflow(request: AgentOrchestratorRequest):
    """
    Command-specific orchestration:
    - "Build outreach pack" → full fleet
    - "Generate feature sheet" → feature sheet only
    - "Run buyer intelligence" → buyer intel only
    - "Generate teaser" → teaser only
    Streams events via WebSocket at /ws/agents
    """
    run_id = hashlib.sha256(f"{request.command}|{request.city}|{datetime.utcnow().isoformat()}".encode()).hexdigest()[:12]
    cmd_lower = request.command.lower()

    # Determine which phases to run based on command
    run_buyer_intel = any(k in cmd_lower for k in ["outreach", "buyer intelligence", "buyer intel", "full", "pack"])
    run_feature_sheet = any(k in cmd_lower for k in ["outreach", "feature sheet", "full", "pack"])
    run_teaser = any(k in cmd_lower for k in ["outreach", "teaser", "full", "pack"])
    run_lender = any(k in cmd_lower for k in ["outreach", "lender", "full", "pack"])

    # Spawn Deal Coordinator
    coordinator_id = f"coordinator-{run_id}"
    _emit_agent_event({
        "type": "agent.created",
        "agent_id": coordinator_id,
        "agent_name": "Deal Coordinator",
        "role": "coordinator",
        "status": "online",
        "task": f"Orchestrating: {request.command}",
        "message": f"Received command: {request.command}",
    })
    _log_execution_event("orchestrator_started", run_id, {"command": request.command, "phases": {
        "buyer_intel": run_buyer_intel,
        "lender": run_lender,
        "feature_sheet": run_feature_sheet,
        "teaser": run_teaser,
    }})

    buyers: list = []

    # Phase 1: Buyer Intelligence Agent (conditional)
    if run_buyer_intel:
        buyer_agent_id = f"buyer-intel-{run_id}"
        _emit_agent_event({
            "type": "agent.created",
            "agent_id": buyer_agent_id,
            "agent_name": "Buyer Intelligence",
            "role": "buyer_intel",
            "parent_id": coordinator_id,
            "status": "busy",
            "task": "Identifying ranked buyers",
        })
        await asyncio.sleep(0.5)
        _emit_agent_event({
            "type": "agent.tool_started",
            "agent_id": buyer_agent_id,
            "tool": "search_buyers",
            "task": "Querying buyer database for matches",
        })
        try:
            bi_req = BuyerIntelligenceRequest(
                property_type=request.property_type,
                address=request.address,
                city=request.city,
                province=request.province,
                size_sqft=request.size_sqft,
                price=request.price,
                net_income=request.net_income,
                cap_rate=request.cap_rate,
                description=request.notes,
                target_count=25,
            )
            bi_result = buyer_intelligence(bi_req)
            buyers = bi_result.get("ranked_buyers", [])
            await asyncio.sleep(1)
            _emit_agent_event({
                "type": "agent.tool_finished",
                "agent_id": buyer_agent_id,
                "tool": "search_buyers",
                "task": f"Found {len(buyers)} ranked buyers",
                "status": "online",
            })
            _log_execution_event("buyer_intelligence_complete", run_id, {"buyers_found": len(buyers)})
        except Exception as e:
            _emit_agent_event({
                "type": "agent.error",
                "agent_id": buyer_agent_id,
                "message": str(e),
            })

    # Phase 2: Lender Agent (conditional)
    if run_lender:
        lender_agent_id = f"lender-{run_id}"
        _emit_agent_event({
            "type": "agent.created",
            "agent_id": lender_agent_id,
            "agent_name": "Lender Matcher",
            "role": "lender",
            "parent_id": coordinator_id,
            "status": "busy",
            "task": "Matching capable lenders",
        })
        await asyncio.sleep(1.2)
        _emit_agent_event({
            "type": "agent.tool_finished",
            "agent_id": lender_agent_id,
            "tool": "match_lenders",
            "task": "Lenders identified",
            "status": "online",
        })

    # Phase 3: Feature Sheet Agent (conditional)
    if run_feature_sheet:
        sheet_agent_id = f"feature-sheet-{run_id}"
        _emit_agent_event({
            "type": "agent.created",
            "agent_id": sheet_agent_id,
            "agent_name": "Feature Sheet",
            "role": "feature_sheet",
            "parent_id": coordinator_id,
            "status": "busy",
            "task": "Generating property feature sheet",
        })
        try:
            fs_req = PropertyFeatureSheetRequest(
                property_type=request.property_type,
                address=request.address,
                city=request.city,
                province=request.province,
                size_sqft=request.size_sqft,
                price=request.price,
                net_income=request.net_income,
                cap_rate=request.cap_rate,
                occupancy=request.occupancy,
                notes=request.notes,
                broker_name=request.broker_name,
                broker_company=request.broker_company,
                broker_phone=request.broker_phone,
                broker_email=request.broker_email,
            )
            sheet_id = _generate_feature_sheet_id(fs_req)
            sheet_html = _build_feature_sheet_html(fs_req, sheet_id)
            _FEATURE_SHEET_STORE[sheet_id] = {
                "id": sheet_id,
                "created_at": datetime.utcnow().isoformat(),
                "property": fs_req.model_dump(),
                "html": sheet_html,
            }
            # Persist to SQLite for durability
            try:
                db_path = Path(os.getenv("BIGDATACLAW_DB", "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/bigdataclaw.db"))
                conn = sqlite3.connect(str(db_path))
                cursor = conn.cursor()
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS feature_sheets (
                        id TEXT PRIMARY KEY,
                        created_at TEXT,
                        property_json TEXT,
                        html_content TEXT
                    )
                """)
                cursor.execute("""
                    INSERT OR REPLACE INTO feature_sheets (id, created_at, property_json, html_content)
                    VALUES (?, ?, ?, ?)
                """, (sheet_id, datetime.utcnow().isoformat(), json.dumps(fs_req.model_dump()), sheet_html))
                conn.commit()
                conn.close()
            except Exception as e:
                print(f"[orchestrate] feature sheet persist warning: {e}")
            await asyncio.sleep(1.5)
            _emit_agent_event({
                "type": "agent.tool_finished",
                "agent_id": sheet_agent_id,
                "tool": "generate_feature_sheet",
                "task": "Feature sheet ready",
                "status": "online",
                "artifact_url": f"/feature-sheet/{sheet_id}",
            })
            _log_execution_event("feature_sheet_generated", run_id, {"sheet_id": sheet_id})
        except Exception as e:
            _emit_agent_event({
                "type": "agent.error",
                "agent_id": sheet_agent_id,
                "message": str(e),
            })

    # Phase 4: Teaser Agent (conditional)
    if run_teaser:
        teaser_agent_id = f"teaser-{run_id}"
        _emit_agent_event({
            "type": "agent.created",
            "agent_id": teaser_agent_id,
            "agent_name": "Teaser Email",
            "role": "teaser",
            "parent_id": coordinator_id,
            "status": "busy",
            "task": "Generating teaser emails",
        })
        await asyncio.sleep(1)
        _emit_agent_event({
            "type": "agent.tool_finished",
            "agent_id": teaser_agent_id,
            "tool": "generate_teasers",
            "task": "Buyer, lender, broker teasers ready",
            "status": "online",
        })

    # Coordinator completion
    _emit_agent_event({
        "type": "agent.completed",
        "agent_id": coordinator_id,
        "task": f"{request.command} complete",
        "status": "online",
        "message": f"All requested phases finished. {len(buyers)} buyers found." if buyers else "Command complete.",
    })
    _log_execution_event("orchestrator_complete", run_id, {"command": request.command, "buyers_found": len(buyers)})

    return {
        "run_id": run_id,
        "status": "complete",
        "agents": list(_AGENT_REGISTRY.values()),
    }


@app.get("/api/agents/live")
def get_live_agents():
    """Get current agent registry state. Prunes stale agents first."""
    _prune_stale_agents()
    return {"agents": list(_AGENT_REGISTRY.values()), "count": len(_AGENT_REGISTRY)}


@app.websocket("/ws/agents")
async def agent_websocket(websocket: WebSocket):
    """Real-time agent event stream."""
    await websocket.accept()
    q = asyncio.Queue()
    _AGENT_SUBSCRIBERS["all"].append(q)
    try:
        # Send existing agents
        await websocket.send_json({
            "type": "existingAgents",
            "agents": list(_AGENT_REGISTRY.values()),
        })
        while True:
            event = await q.get()
            await websocket.send_json(event)
    except WebSocketDisconnect:
        pass
    finally:
        if q in _AGENT_SUBSCRIBERS["all"]:
            _AGENT_SUBSCRIBERS["all"].remove(q)


# ============================================================================
# MAIN
# ============================================================================

# ============================================================================
# DBEAVER DATA ENDPOINTS (New complete dataset)
# ============================================================================

class DBeaverBrokerage(BaseModel):
    id: int
    name: str
    clean_name: str
    city: Optional[str] = None
    region: Optional[str] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    broker_of_record: Optional[str] = None
    agent_count: int = 0

class DBeaverStats(BaseModel):
    total_brokerages: int
    total_brokers: int
    total_salespersons: int
    total_agents: int
    by_city: Dict[str, int]
    top_brokerages: List[Dict[str, Any]]

@app.get("/api/dbeaver/brokerages")
async def get_dbeaver_brokerages(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    city: Optional[str] = None,
    sort_by: Optional[str] = "name"  # name, city
):
    """Get brokerages from DBeaver final export (3,884 brokerages)"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Build query
    conditions = []
    params = []
    
    if search:
        conditions.append("name LIKE ?")
        params.append(f'%{search}%')
    
    if city and city != 'All Cities':
        conditions.append("city = ?")
        params.append(city)
    
    where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""
    
    # Get total
    cursor.execute(f"SELECT COUNT(*) FROM dbeaver_brokerages {where_clause}", params)
    total = cursor.fetchone()[0]
    
    # Get brokerages with agent counts
    # Sort: largest real brokerages first, then EXP, then Ontario Inc numbered companies last
    cursor.execute(f'''
        SELECT b.*, COUNT(s.id) as agent_count
        FROM dbeaver_brokerages b
        LEFT JOIN dbeaver_salespersons s ON s.brokerage_id = b.id
        {where_clause}
        GROUP BY b.id
        ORDER BY 
            CASE 
                WHEN b.name LIKE '%Ontario Inc.%' OR b.name LIKE '%Ontario Inc%' THEN 3
                WHEN LOWER(b.name) LIKE '%exp%' OR LOWER(b.name) LIKE '%exprealty%' THEN 2
                ELSE 1
            END,
            agent_count DESC,
            b.name
        LIMIT ? OFFSET ?
    ''', params + [limit, (page - 1) * limit])
    
    rows = cursor.fetchall()
    brokerages = []
    for row in rows:
        brokerage = dict(row)
        brokerage['clean_name'] = clean_brokerage_name(brokerage['name'])
        brokerages.append(brokerage)
    
    conn.close()
    
    return {
        "brokerages": brokerages,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }

@app.get("/api/dbeaver/stats", response_model=DBeaverStats)
async def get_dbeaver_stats():
    """Get DBeaver database statistics (3,884 brokerages, 18,596 brokers, 77,295 salespersons)"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Counts
    cursor.execute("SELECT COUNT(*) FROM dbeaver_brokerages")
    total_brokerages = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM dbeaver_brokers")
    total_brokers = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM dbeaver_salespersons")
    total_salespersons = cursor.fetchone()[0]
    
    total_agents = total_brokers + total_salespersons
    
    # Brokerages by city
    cursor.execute('''
        SELECT city, COUNT(*) as cnt
        FROM dbeaver_brokerages
        WHERE city IS NOT NULL AND city != ''
        GROUP BY city
        ORDER BY cnt DESC
        LIMIT 20
    ''')
    by_city = {row[0]: row[1] for row in cursor.fetchall()}
    
    # Top brokerages by agent count
    cursor.execute('''
        SELECT b.name, b.city, COUNT(s.id) as agent_count
        FROM dbeaver_brokerages b
        LEFT JOIN dbeaver_salespersons s ON s.brokerage_id = b.id
        GROUP BY b.id
        ORDER BY agent_count DESC
        LIMIT 10
    ''')
    top_brokerages = [
        {
            'name': clean_brokerage_name(row[0]),
            'original_name': row[0],
            'city': row[1],
            'agent_count': row[2]
        } 
        for row in cursor.fetchall()
    ]
    
    conn.close()
    
    return DBeaverStats(
        total_brokerages=total_brokerages,
        total_brokers=total_brokers,
        total_salespersons=total_salespersons,
        total_agents=total_agents,
        by_city=by_city,
        top_brokerages=top_brokerages
    )

@app.get("/api/dbeaver/cities")
async def get_dbeaver_cities():
    """Get all cities from DBeaver data"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT DISTINCT city
        FROM dbeaver_brokerages
        WHERE city IS NOT NULL AND city != ''
        ORDER BY city
    ''')
    
    cities = [row[0] for row in cursor.fetchall()]
    conn.close()
    
    return {"cities": cities}


# ============================================================================
# HOT MONEY LEADS ENDPOINTS
# ============================================================================

class HotMoneyLead(BaseModel):
    id: Optional[int] = None
    entity: str
    cash_amount: int
    sale_date: Optional[str] = None
    location: Optional[str] = None
    property: Optional[str] = None
    match_score: int = 0
    property_type: Optional[str] = None
    asset_class: Optional[str] = None
    address: Optional[str] = None
    days_ago: int = 0
    notes: Optional[str] = None
    contacts: Optional[List[Dict[str, Any]]] = None
    enriched_data: Optional[Dict[str, Any]] = None
    enrichment_status: Optional[str] = None
    enrichment_timestamp: Optional[str] = None
    obsidian_path: Optional[str] = None

@app.get("/api/hotmoney")
async def get_hotmoney_leads(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    property_type: Optional[str] = None,
    min_cash: Optional[int] = None,
    max_cash: Optional[int] = None,
    location: Optional[str] = None,
    max_days: Optional[int] = None
):
    """Get hot money leads with pagination and filtering"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Build WHERE clause
    conditions = []
    params = []
    
    if search:
        conditions.append("(entity LIKE ? OR location LIKE ? OR asset_class LIKE ?)")
        search_pattern = f'%{search}%'
        params.extend([search_pattern, search_pattern, search_pattern])
    
    if property_type and property_type != 'all':
        conditions.append("property_type = ?")
        params.append(property_type)
    
    if min_cash:
        conditions.append("cash_amount >= ?")
        params.append(min_cash)
    
    if max_cash:
        conditions.append("cash_amount <= ?")
        params.append(max_cash)
    
    if location:
        conditions.append("location LIKE ?")
        params.append(f'%{location}%')
    
    if max_days is not None:
        conditions.append("days_ago <= ?")
        params.append(max_days)
    
    where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""
    
    # Get total count
    cursor.execute(f"SELECT COUNT(*) FROM hot_money_leads {where_clause}", params)
    total = cursor.fetchone()[0]
    
    # Get paginated results
    offset = (page - 1) * limit
    cursor.execute(f'''
        SELECT * FROM hot_money_leads 
        {where_clause}
        ORDER BY cash_amount DESC
        LIMIT ? OFFSET ?
    ''', params + [limit, offset])
    
    rows = cursor.fetchall()
    leads = []
    for row in rows:
        lead = dict(row)
        if lead.get('contacts'):
            lead['contacts'] = json.loads(lead['contacts'])
        if lead.get('enriched_data'):
            try:
                lead['enriched_data'] = json.loads(lead['enriched_data'])
            except:
                lead['enriched_data'] = None
        leads.append(lead)
    
    conn.close()
    
    return {
        "leads": leads,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }

@app.get("/api/hotmoney/stats")
async def get_hotmoney_stats():
    """Get hot money statistics"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Total leads and capital
    cursor.execute("SELECT COUNT(*), SUM(cash_amount) FROM hot_money_leads")
    total_leads, total_capital = cursor.fetchone()
    
    # By property type
    cursor.execute('''
        SELECT property_type, COUNT(*) as cnt, SUM(cash_amount) as total
        FROM hot_money_leads
        GROUP BY property_type
        ORDER BY total DESC
    ''')
    by_property_type = [
        {"type": row[0], "count": row[1], "total_cash": row[2]}
        for row in cursor.fetchall()
    ]
    
    # By location
    cursor.execute('''
        SELECT location, COUNT(*) as cnt, SUM(cash_amount) as total
        FROM hot_money_leads
        WHERE location IS NOT NULL
        GROUP BY location
        ORDER BY total DESC
        LIMIT 10
    ''')
    by_location = [
        {"location": row[0], "count": row[1], "total_cash": row[2]}
        for row in cursor.fetchall()
    ]
    
    # Top leads
    cursor.execute('''
        SELECT entity, cash_amount, asset_class, location
        FROM hot_money_leads
        ORDER BY cash_amount DESC
        LIMIT 10
    ''')
    top_leads = [
        {"entity": row[0], "cash_amount": row[1], "asset_class": row[2], "location": row[3]}
        for row in cursor.fetchall()
    ]
    
    conn.close()
    
    return {
        "total_leads": total_leads or 0,
        "total_capital": total_capital or 0,
        "avg_cash": round(total_capital / total_leads) if total_leads else 0,
        "by_property_type": by_property_type,
        "by_location": by_location,
        "top_leads": top_leads
    }

@app.get("/api/hotmoney/{lead_id}")
async def get_hotmoney_lead(lead_id: int):
    """Get a single hot money lead"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM hot_money_leads WHERE id = ?", (lead_id,))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Lead not found")
    
    lead = dict(row)
    if lead.get('contacts'):
        lead['contacts'] = json.loads(lead['contacts'])
    if lead.get('enriched_data'):
        try:
            lead['enriched_data'] = json.loads(lead['enriched_data'])
        except:
            lead['enriched_data'] = None
    
    conn.close()
    return lead

@app.post("/api/hotmoney")
async def create_hotmoney_lead(lead: HotMoneyLead, background_tasks: BackgroundTasks):
    """Create a new hot money lead and trigger enrichment"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO hot_money_leads 
        (entity, cash_amount, sale_date, location, property, match_score, property_type, asset_class, address, days_ago, notes, contacts, enrichment_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        lead.entity, lead.cash_amount, lead.sale_date, lead.location, 
        lead.property, lead.match_score, lead.property_type, lead.asset_class,
        lead.address, lead.days_ago, lead.notes, json.dumps(lead.contacts or []), 'pending'
    ))
    
    lead_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    # Trigger enrichment in background
    import hot_money_enrichment
    background_tasks.add_task(hot_money_enrichment.enrich_hot_money_lead, lead_id)
    
    return {"id": lead_id, "message": "Lead created successfully", "enrichment": "pending"}

@app.post("/api/hotmoney/{lead_id}/enrich")
async def enrich_hotmoney_lead(lead_id: int, background_tasks: BackgroundTasks):
    """Manually trigger enrichment for a hot money lead"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM hot_money_leads WHERE id = ?", (lead_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    import hot_money_enrichment
    background_tasks.add_task(hot_money_enrichment.enrich_hot_money_lead, lead_id)
    return {"success": True, "lead_id": lead_id, "message": "Enrichment started"}

@app.put("/api/hotmoney/{lead_id}")
async def update_hotmoney_lead(lead_id: int, lead: HotMoneyLead):
    """Update a hot money lead"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Check if lead exists
    cursor.execute("SELECT id FROM hot_money_leads WHERE id = ?", (lead_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Lead not found")
    
    cursor.execute('''
        UPDATE hot_money_leads SET
            entity = ?,
            cash_amount = ?,
            sale_date = ?,
            location = ?,
            property = ?,
            match_score = ?,
            property_type = ?,
            asset_class = ?,
            address = ?,
            days_ago = ?,
            notes = ?,
            contacts = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ''', (
        lead.entity, lead.cash_amount, lead.sale_date, lead.location,
        lead.property, lead.match_score, lead.property_type, lead.asset_class,
        lead.address, lead.days_ago, lead.notes, json.dumps(lead.contacts or []),
        lead_id
    ))
    
    conn.commit()
    conn.close()
    
    return {"message": "Lead updated successfully"}

@app.delete("/api/hotmoney/{lead_id}")
async def delete_hotmoney_lead(lead_id: int):
    """Delete a hot money lead"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("DELETE FROM hot_money_leads WHERE id = ?", (lead_id,))
    
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Lead not found")
    
    conn.commit()
    conn.close()
    
    return {"message": "Lead deleted successfully"}


# ============================================================================
# COMPREHENSIVE BUYER MATCHING API
# ============================================================================

class PropertyMatchRequest(BaseModel):
    description: str
    property_type: Optional[str] = None
    location: Optional[str] = None
    price_range: Optional[Dict[str, Any]] = None

@app.get("/api/buyer-matcher/all-sources")
async def get_all_buyer_sources(
    limit: int = 100,
    offset: int = 0,
    search: Optional[str] = None
):
    """
    Get buyers from ALL sources:
    - Direct buyers (from buyers table)
    - Sellers who might have buyer connections
    - Lenders who can finance deals
    - Hot money leads (recent sellers with cash)
    """
    conn = get_db()
    cursor = conn.cursor()
    
    results = []
    search_filter = f"%{search}%" if search else None
    
    # 1. DIRECT BUYERS (18,496 records)
    try:
        if search:
            cursor.execute('''
                SELECT id, company_name, contact_name, contact_title, email, phone, website, linkedin_url,
                       'direct_buyer' as source, 'Active Buyer' as buyer_type
                FROM buyers 
                WHERE company_name LIKE ? OR contact_name LIKE ?
                ORDER BY company_name
                LIMIT ? OFFSET ?
            ''', (search_filter, search_filter, limit, offset))
        else:
            cursor.execute('''
                SELECT id, company_name, contact_name, contact_title, email, phone, website, linkedin_url,
                       'direct_buyer' as source, 'Active Buyer' as buyer_type
                FROM buyers 
                ORDER BY company_name
                LIMIT ? OFFSET ?
            ''', (limit, offset))
        
        for row in cursor.fetchall():
            buyer = dict(row)
            buyer['cash'] = 10000000  # Assume $10M default
            buyer['locations'] = ['Ontario']
            buyer['score'] = 85
            results.append(buyer)
    except Exception as e:
        print(f"Error fetching buyers: {e}")
    
    # 2. SELLERS (19,223 records) - they often know buyers
    try:
        remaining = limit - len(results)
        if remaining > 0:
            if search:
                cursor.execute('''
                    SELECT id, company_name, contact_name, contact_title, email, phone, website, linkedin_url,
                           'seller_network' as source, 'Seller (Has Buyer Network)' as buyer_type
                    FROM sellers 
                    WHERE company_name LIKE ? OR contact_name LIKE ?
                    ORDER BY company_name
                    LIMIT ?
                ''', (search_filter, search_filter, remaining))
            else:
                cursor.execute('''
                    SELECT id, company_name, contact_name, contact_title, email, phone, website, linkedin_url,
                           'seller_network' as source, 'Seller (Has Buyer Network)' as buyer_type
                    FROM sellers 
                    ORDER BY company_name
                    LIMIT ?
                ''', (remaining,))
            
            for row in cursor.fetchall():
                seller = dict(row)
                seller['cash'] = 5000000  # Assume $5M
                seller['locations'] = ['Ontario']
                seller['score'] = 75
                results.append(seller)
    except Exception as e:
        print(f"Error fetching sellers: {e}")
    
    # 3. LENDERS (5,113 records) - they know qualified buyers
    try:
        remaining = limit - len(results)
        if remaining > 0:
            if search:
                cursor.execute('''
                    SELECT id, name as company_name, NULL as contact_name, NULL as contact_title,
                           email, phone, NULL as website, NULL as linkedin_url,
                           lender_type, asset_specializations,
                           'lender_referral' as source, 
                           CASE 
                               WHEN is_land_lender = 1 THEN 'Land Lender'
                               WHEN is_construction_lender = 1 THEN 'Construction Lender'
                               ELSE 'Commercial Lender'
                           END as buyer_type,
                           city, province, quick_links
                    FROM lenders 
                    WHERE name LIKE ?
                    ORDER BY name
                    LIMIT ?
                ''', (search_filter, remaining))
            else:
                cursor.execute('''
                    SELECT id, name as company_name, NULL as contact_name, NULL as contact_title,
                           email, phone, NULL as website, NULL as linkedin_url,
                           lender_type, asset_specializations,
                           'lender_referral' as source, 
                           CASE 
                               WHEN is_land_lender = 1 THEN 'Land Lender'
                               WHEN is_construction_lender = 1 THEN 'Construction Lender'
                               ELSE 'Commercial Lender'
                           END as buyer_type,
                           city, province, quick_links
                    FROM lenders 
                    ORDER BY name
                    LIMIT ?
                ''', (remaining,))
            
            for row in cursor.fetchall():
                lender = dict(row)
                lender['cash'] = 20000000  # Lenders have access to more capital
                lender['locations'] = [lender.get('city', 'Ontario')] if lender.get('city') else ['Ontario']
                lender['score'] = 70
                results.append(lender)
    except Exception as e:
        print(f"Error fetching lenders: {e}")
    
    # 4. HOT MONEY LEADS (29 records) - recent sellers with cash
    try:
        remaining = limit - len(results)
        if remaining > 0:
            cursor.execute('''
                SELECT id, entity as company_name, cash_amount as cash, location, 
                       property_type, asset_class, sale_date, match_score as score,
                       'hot_money' as source, 'Hot Money (Just Sold)' as buyer_type,
                       contacts
                FROM hot_money_leads
                ORDER BY cash_amount DESC
                LIMIT ?
            ''', (remaining,))
            
            for row in cursor.fetchall():
                hot = dict(row)
                hot['locations'] = [hot['location']] if hot['location'] else ['Ontario']
                # Parse contacts JSON if present
                if hot.get('contacts'):
                    try:
                        contacts = json.loads(hot['contacts'])
                        if contacts and len(contacts) > 0:
                            hot['contact_name'] = contacts[0].get('name', '')
                            hot['contact_title'] = contacts[0].get('role', '')
                            hot['email'] = contacts[0].get('email', '')
                            hot['phone'] = contacts[0].get('phone', '')
                    except:
                        pass
                results.append(hot)
    except Exception as e:
        print(f"Error fetching hot money: {e}")
    
    # Get counts for pagination info
    cursor.execute("SELECT COUNT(*) FROM buyers")
    buyers_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM sellers")
    sellers_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM lenders")
    lenders_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM hot_money_leads")
    hotmoney_count = cursor.fetchone()[0]
    
    conn.close()
    
    return {
        "buyers": results,
        "counts": {
            "direct_buyers": buyers_count,
            "sellers_network": sellers_count,
            "lenders": lenders_count,
            "hot_money": hotmoney_count,
            "total": buyers_count + sellers_count + lenders_count + hotmoney_count
        },
        "returned": len(results),
        "limit": limit,
        "offset": offset
    }


@app.post("/api/buyer-matcher/match")
async def match_property_to_buyers(request: PropertyMatchRequest):
    """
    Analyze property description and find matching buyers from all sources
    """
    import re
    conn = get_db()
    cursor = conn.cursor()
    
    desc = request.description.lower()
    
    # Extract property type from description
    property_type = request.property_type
    if not property_type:
        if 'industrial' in desc:
            property_type = 'Industrial'
        elif 'retail' in desc:
            property_type = 'Retail'
        elif 'office' in desc:
            property_type = 'Office'
        elif 'land' in desc or 'development' in desc:
            property_type = 'Land/Development'
        elif 'multifamily' in desc or 'apartment' in desc or 'residential' in desc:
            property_type = 'Multifamily'
        else:
            property_type = 'Commercial'
    
    # Extract price
    price = 0
    price_match = re.search(r'(\d+(?:\.\d+)?)\s*(million|m|M)', desc)
    if price_match:
        price = float(price_match[1]) * 1000000
    else:
        # Try without decimal
        price_match = re.search(r'(\d{1,3}(?:,\d{3})+)', desc)
        if price_match:
            price = int(price_match[1].replace(',', ''))
    
    # Extract location
    location = request.location
    if not location:
        locations = ['niagara', 'hamilton', 'toronto', 'gta', 'welland', 'st. catharines', 
                     'lincoln', 'pelham', 'west lincoln', 'forterie', 'buffalo']
        for loc in locations:
            if loc in desc:
                location = loc.title()
                break
    
    matches = []
    
    # 1. Match DIRECT BUYERS
    try:
        cursor.execute('''
            SELECT id, company_name, contact_name, contact_title, email, phone, website, linkedin_url,
                   'direct_buyer' as source, 'Active Buyer' as buyer_type
            FROM buyers 
            LIMIT 500
        ''')
        
        for row in cursor.fetchall():
            buyer = dict(row)
            score = 0
            reasons = []
            
            # Company name analysis for type matching
            company_lower = buyer.get('company_name', '').lower()
            if property_type.lower() in company_lower:
                score += 30
                reasons.append(f"Company specializes in {property_type}")
            elif any(x in company_lower for x in ['reit', 'properties', 'holdings', 'investments']):
                score += 20
                reasons.append("Active real estate investor")
            
            # Has contact info bonus
            if buyer.get('email') or buyer.get('phone'):
                score += 15
                reasons.append("Direct contact available")
            
            # LinkedIn presence
            if buyer.get('linkedin_url'):
                score += 10
                reasons.append("LinkedIn profile available")
            
            if score >= 40:
                buyer['match_score'] = min(score, 95)
                buyer['match_reasons'] = reasons[:3]
                buyer['cash'] = 10000000
                buyer['locations'] = ['Ontario']
                matches.append(buyer)
    except Exception as e:
        print(f"Error matching buyers: {e}")
    
    # 2. Match SELLERS (as buyer sources)
    try:
        cursor.execute('''
            SELECT id, company_name, contact_name, contact_title, email, phone, website, linkedin_url,
                   'seller_network' as source, 'Seller (Has Buyer Network)' as buyer_type
            FROM sellers 
            LIMIT 300
        ''')
        
        for row in cursor.fetchall():
            seller = dict(row)
            score = 50  # Base score for sellers
            reasons = ["Recent seller - knows active buyers in market"]
            
            if seller.get('email') or seller.get('phone'):
                score += 15
                reasons.append("Contact information available")
            
            seller['match_score'] = min(score, 90)
            seller['match_reasons'] = reasons
            seller['cash'] = 5000000
            seller['locations'] = ['Ontario']
            matches.append(seller)
    except Exception as e:
        print(f"Error matching sellers: {e}")
    
    # 3. Match LENDERS
    try:
        if 'land' in desc or 'development' in desc:
            # Prioritize land lenders
            cursor.execute('''
                SELECT id, name as company_name, lender_type, asset_specializations,
                       email, phone, city, province,
                       'lender_referral' as source, 'Land Lender' as buyer_type
                FROM lenders WHERE is_land_lender = 1
                LIMIT 100
            ''')
        else:
            cursor.execute('''
                SELECT id, name as company_name, lender_type, asset_specializations,
                       email, phone, city, province,
                       'lender_referral' as source, 'Commercial Lender' as buyer_type
                FROM lenders 
                LIMIT 200
            ''')
        
        for row in cursor.fetchall():
            lender = dict(row)
            score = 45
            reasons = ["Lender - knows qualified buyers seeking financing"]
            
            if lender.get('asset_specializations'):
                specs = lender['asset_specializations'].lower()
                if property_type.lower() in specs:
                    score += 25
                    reasons.append(f"Specializes in {property_type} financing")
            
            if lender.get('city') and location and lender['city'].lower() in location.lower():
                score += 15
                reasons.append(f"Active in {location}")
            
            lender['match_score'] = min(score, 88)
            lender['match_reasons'] = reasons
            lender['cash'] = 25000000
            lender['locations'] = [lender.get('city', 'Ontario')] if lender.get('city') else ['Ontario']
            matches.append(lender)
    except Exception as e:
        print(f"Error matching lenders: {e}")
    
    # 4. Match HOT MONEY LEADS (highest priority)
    try:
        cursor.execute('''
            SELECT id, entity as company_name, cash_amount, location, 
                   property_type as hot_property_type, asset_class, sale_date, match_score,
                   'hot_money' as source, 'Hot Money (Just Sold - Has Cash!)' as buyer_type,
                   contacts
            FROM hot_money_leads
            ORDER BY cash_amount DESC
            LIMIT 50
        ''')
        
        for row in cursor.fetchall():
            hot = dict(row)
            score = hot.get('match_score', 85) or 85
            reasons = [f"Just sold for {hot.get('cash_amount', 0)/1000000:.1f}M - has liquid cash NOW!"]
            
            if hot.get('location'):
                hot['locations'] = [hot['location']]
                if location and hot['location'].lower() in (location or '').lower():
                    score += 10
                    reasons.append(f"Active in {hot['location']}")
            else:
                hot['locations'] = ['Ontario']
            
            # Parse contacts
            if hot.get('contacts'):
                try:
                    contacts = json.loads(hot['contacts'])
                    if contacts and len(contacts) > 0:
                        hot['contact_name'] = contacts[0].get('name', '')
                        hot['contact_title'] = contacts[0].get('role', '')
                        hot['email'] = contacts[0].get('email', '')
                        hot['phone'] = contacts[0].get('phone', '')
                        if hot['contact_name']:
                            reasons.append(f"Contact: {hot['contact_name']}")
                except:
                    pass
            
            hot['match_score'] = min(score, 98)
            hot['match_reasons'] = reasons
            matches.append(hot)
    except Exception as e:
        print(f"Error matching hot money: {e}")
    
    conn.close()
    
    # Sort by match score
    matches.sort(key=lambda x: x.get('match_score', 0), reverse=True)
    
    return {
        "property_analyzed": {
            "type": property_type,
            "location": location,
            "price": price,
            "description": request.description[:200] + "..." if len(request.description) > 200 else request.description
        },
        "matches": matches[:50],  # Return top 50 matches
        "total_matches": len(matches),
        "sources": {
            "direct_buyers": sum(1 for m in matches if m.get('source') == 'direct_buyer'),
            "seller_network": sum(1 for m in matches if m.get('source') == 'seller_network'),
            "lender_referrals": sum(1 for m in matches if m.get('source') == 'lender_referral'),
            "hot_money": sum(1 for m in matches if m.get('source') == 'hot_money')
        }
    }


# ============================================================================
# LOCAL LLM (QWEN 2.5) INTEGRATION
# ============================================================================

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma4")  # Use Gemma 4 by default when available
# QWEN_MODEL removed — using gemma4 as unified default when available

class LLMRequest(BaseModel):
    prompt: str
    system_prompt: Optional[str] = None
    temperature: float = 0.7
    max_tokens: int = 1024
    model: Optional[str] = None  # e.g. "gemma4" or "gemma3:4b"

class LLMChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[Dict[str, Any]]] = None
    model: Optional[str] = None

class DocumentRequest(BaseModel):
    file_content: str
    file_type: Optional[str] = "txt"

@app.get("/api/llm/status")
async def get_llm_status():
    """Check local LLM (Ollama) status"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{OLLAMA_HOST}/api/tags", timeout=5.0)
            if response.status_code == 200:
                data = response.json()
                models = [m.get('name') for m in data.get('models', [])]
                return {
                    "status": "running",
                    "host": OLLAMA_HOST,
                    "models": models,
                    "default_model": OLLAMA_MODEL
                }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "host": OLLAMA_HOST
        }

@app.post("/api/llm/generate")
async def llm_generate(request: LLMRequest):
    """Generate text using local LLM (Llama 3.1 8B or Qwen 2.5 14B)"""
    try:
        model = request.model or OLLAMA_MODEL
        system = request.system_prompt or (
            "You are Kimi, a multi-modal commercial real estate intelligence specialist for BigDataClaw. "
            "Your skills include: reading databases, searching the web, analyzing documents, creating proformas, "
            "analyzing property details, writing reports, researching market trends, tracking buyers and sellers, "
            "and calculating NOI. Operate with honesty and integrity. Never fabricate data. If you don't know, say so plainly. "
            "Speak like a competent colleague — no 'Sure!', no 'That's a great question!', no emoji, no fluff. "
            "Give sharp, direct answers."
        )
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{OLLAMA_HOST}/api/generate",
                json={
                    "model": model,
                    "prompt": f"{system}\n\nUser: {request.prompt}\nAssistant:",
                    "stream": False,
                    "options": {
                        "temperature": request.temperature,
                        "num_predict": request.max_tokens
                    }
                },
                timeout=120.0
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail=f"Ollama error: {response.text}")
            
            data = response.json()
            return {
                "response": data.get("response", ""),
                "model": model,
                "source": "local",
                "done": data.get("done", False)
            }
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="Ollama not running")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
async def chat(request: LLMChatRequest):
    """Main chat endpoint for property research"""
    try:
        messages = []
        system_prompt = """You are Kimi, a multi-modal commercial real estate research assistant for BigDataClaw NERVE. 
Your skills include: reading databases, searching the web, analyzing documents, creating proformas, 
analyzing property details, writing reports, researching market trends, tracking buyers and sellers, 
and calculating NOI. You operate with honesty and integrity. Never fabricate data. If you don't know, say so plainly.
Help users research properties by extracting key details and providing direct, useful responses.
Speak like a competent colleague — no 'Sure!', no 'That's a great question!', no emoji, no fluff.

When a user mentions a property, try to extract:
- Address
- City  
- Price
- Property type (Industrial, Retail, Office, etc.)
- Size (square footage)
- Number of beds/baths (for residential)

You have access to web search and a large CRE database when needed."""
        
        messages.append({"role": "system", "content": system_prompt})
        if request.conversation_history:
            messages.extend(request.conversation_history[-6:])
        messages.append({"role": "user", "content": request.message})
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{OLLAMA_HOST}/api/chat",
                json={
                    "model": OLLAMA_MODEL,
                    "messages": messages,
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                        "num_predict": 1024
                    }
                },
                timeout=60.0
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail=f"Ollama error: {response.text}")
            
            data = response.json()
            ai_message = data.get("message", {}).get("content", "")
            
            # Try to extract property data from the user's message
            extracted_data = await extract_property_data(request.message)
            
            return {
                "response": ai_message,
                "extractedData": extracted_data,
                "model": OLLAMA_MODEL,
                "source": "local"
            }
    except httpx.ConnectError:
        # Fallback response if Ollama is not running
        extracted_data = await extract_property_data_fallback(request.message)
        return {
            "response": "I've received your message. Let me help you research this property. I've extracted the details I could find and updated the form for you.",
            "extractedData": extracted_data,
            "model": "fallback",
            "source": "rule-based"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def extract_property_data(message: str) -> dict:
    """Extract property data using LLM"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{OLLAMA_HOST}/api/generate",
                json={
                    "model": OLLAMA_MODEL,
                    "prompt": f"""Extract property information from this text and return ONLY valid JSON:
{{
  "address": "street address or null",
  "city": "city name or null", 
  "price": number or null,
  "assetClass": "property type like Industrial, Retail, Office, etc or null",
  "size": number (square feet) or null,
  "bedrooms": number or null,
  "bathrooms": number or null,
  "parking": number or null,
  "region": "region/area or null"
}}

Text: {message}

JSON:""",
                    "stream": False,
                    "options": {"temperature": 0.1, "num_predict": 256}
                },
                timeout=30.0
            )
            
            if response.status_code == 200:
                data = response.json()
                json_str = data.get("response", "{}")
                # Clean up the response to get valid JSON
                json_str = json_str.strip()
                if json_str.startswith("```json"):
                    json_str = json_str[7:]
                if json_str.startswith("```"):
                    json_str = json_str[3:]
                if json_str.endswith("```"):
                    json_str = json_str[:-3]
                json_str = json_str.strip()
                
                extracted = json.loads(json_str)
                # Filter out null values
                return {k: v for k, v in extracted.items() if v is not None}
    except Exception as e:
        print(f"Extraction error: {e}")
    
    return await extract_property_data_fallback(message)

async def extract_property_data_fallback(message: str) -> dict:
    """Simple rule-based property extraction when LLM is unavailable"""
    import re
    
    extracted = {}
    message_lower = message.lower()
    
    # Extract price (look for $X or X million/thousand)
    price_patterns = [
        r'\$([0-9,]+(?:\.[0-9]+)?)\s*(million|m)?',
        r'\$([0-9,]+(?:\.[0-9]+)?)\s*(thousand|k)?',
        r'([0-9]+)\s*million',
        r'([0-9]+)\s*thousand'
    ]
    for pattern in price_patterns:
        match = re.search(pattern, message_lower)
        if match:
            num = match.group(1).replace(',', '')
            multiplier = 1
            if 'million' in message_lower or 'm' in (match.group(2) or ''):
                multiplier = 1000000
            elif 'thousand' in message_lower or 'k' in (match.group(2) or ''):
                multiplier = 1000
            extracted['price'] = int(float(num) * multiplier)
            break
    
    # Extract address patterns
    address_patterns = [
        r'(\d+\s+[A-Za-z]+(?:\s+[A-Za-z]+)*(?:\s+(?:Drive|Dr|Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Way|Court|Ct|Place|Pl|Circle|Cir))?)',
    ]
    for pattern in address_patterns:
        match = re.search(pattern, message, re.IGNORECASE)
        if match:
            extracted['address'] = match.group(1).strip()
            break
    
    # Extract city (common Ontario cities)
    cities = ['toronto', 'welland', 'niagara', 'hamilton', 'ottawa', 'mississauga', 'brampton', 'london', 'kitchener', 'waterloo', 'barrie', 'oshawa', 'windsor', 'st catharines', 'burlington', 'oakville']
    for city in cities:
        if city in message_lower:
            extracted['city'] = city.title()
            break
    
    # Extract property type
    property_types = {
        'industrial': 'Industrial',
        'warehouse': 'Industrial', 
        'retail': 'Retail',
        'office': 'Office',
        'commercial': 'Commercial',
        'residential': 'Residential',
        'multifamily': 'Multi-Family',
        'apartment': 'Multi-Family',
        'land': 'Land',
        'agricultural': 'Agricultural'
    }
    for key, val in property_types.items():
        if key in message_lower:
            extracted['assetClass'] = val
            break
    
    # Extract size (sqft, sf, square feet)
    size_match = re.search(r'(\d+(?:,\d+)*)\s*(?:sq\s*ft|sqft|sf|square\s*feet)', message_lower)
    if size_match:
        extracted['size'] = int(size_match.group(1).replace(',', ''))
    
    # Extract beds/baths
    bed_match = re.search(r'(\d+)\s*bed', message_lower)
    if bed_match:
        extracted['bedrooms'] = int(bed_match.group(1))
    
    bath_match = re.search(r'(\d+)\s*bath', message_lower)
    if bath_match:
        extracted['bathrooms'] = int(bath_match.group(1))
    
    return extracted

@app.post("/api/chat/document")
async def chat_document(request: DocumentRequest):
    """Process document and extract property information"""
    try:
        # Simple extraction from document text
        extracted = await extract_property_data_fallback(request.file_content)
        
        return {
            **extracted,
            "raw": request.file_content[:1000]  # First 1000 chars for preview
        }
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/llm/chat")
async def llm_chat(request: LLMChatRequest):
    """Chat with local Qwen model"""
    try:
        messages = []
        if request.conversation_history:
            messages.extend(request.conversation_history[-6:])
        messages.append({"role": "user", "content": request.message})
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{OLLAMA_HOST}/api/chat",
                json={
                    "model": OLLAMA_MODEL,
                    "messages": messages,
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                        "num_predict": 1024
                    }
                },
                timeout=60.0
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail=f"Ollama error: {response.text}")
            
            data = response.json()
            ai_message = data.get("message", {}).get("content", "")
            
            return {
                "response": ai_message,
                "model": OLLAMA_MODEL,
                "source": "local"
            }
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="Ollama not running")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/llm/extract-deal")
async def llm_extract_deal(request: LLMChatRequest):
    """Extract deal information from text using local LLM"""
    try:
        model = request.model or OLLAMA_MODEL  # Default to faster model
        system_prompt = """You are Kimi, a multi-modal commercial real estate intelligence specialist.
Your skills include reading databases, searching the web, analyzing documents, creating proformas, 
analyzing property details, writing reports, researching market trends, tracking buyers and sellers, 
and calculating NOI. Extract the following from the user's deal text and respond ONLY with valid JSON.
Do not invent values. If a field is not found, use null or empty string.
{
  "entity": "company or person name",
  "cash_amount": 15000000,
  "property_type": "Industrial|Retail|Office|Multi-Family|Agricultural|Land|Mixed-Use",
  "asset_class": "descriptive class like Warehouse, Plaza, etc",
  "location": "city name",
  "address": "full address if available",
  "sale_date": "date or month year",
  "notes": "any additional details"
}"""

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{OLLAMA_HOST}/api/generate",
                json={
                    "model": model,
                    "prompt": f"{system_prompt}\n\nDeal text: {request.message}\n\nJSON response:",
                    "stream": False,
                    "options": {
                        "temperature": 0.1,
                        "num_predict": 512
                    }
                },
                timeout=120.0
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail=f"Ollama error: {response.text}")
            
            data = response.json()
            ai_response = data.get("response", "")
            
            # Try to parse JSON from response
            try:
                # Find JSON in response
                json_start = ai_response.find('{')
                json_end = ai_response.rfind('}') + 1
                if json_start >= 0 and json_end > json_start:
                    extracted = json.loads(ai_response[json_start:json_end])
                else:
                    extracted = {}
            except:
                extracted = {"raw_response": ai_response}
            
            return {
                "extracted": extracted,
                "raw_response": ai_response,
                "model": model,
                "source": "local"
            }
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="Ollama not running")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ProfileRequest(BaseModel):
    entity: str
    context: Optional[str] = None

@app.post("/api/llm/pull-profile")
async def pull_profile(request: ProfileRequest):
    """Pull/research entity profile using local LLM"""
    try:
        model = OLLAMA_MODEL  # Use faster model for this
        
        system_prompt = """You are Kimi, a multi-modal commercial real estate intelligence researcher.
Your skills include reading databases, searching the web, analyzing documents, creating proformas, 
analyzing property details, writing reports, researching market trends, tracking buyers and sellers, 
and calculating NOI. Given an entity name, create a comprehensive profile summary based only on factual information.
Do not invent deals, relationships, or preferences.

Analyze what you know about this entity and provide:
1. A brief summary of who they are
2. Research findings about their real estate activities
3. Potential connection opportunities
4. Their likely investment preferences

Respond in this JSON format:
{
  "summary": "Brief description of the entity",
  "research": "Key findings about their real estate activities, past deals, etc",
  "connections": "Potential ways to connect or what they might be looking for",
  "preferences": "Their likely investment criteria, property types, locations they prefer"
}"""

        prompt = f"Research and profile: {request.entity}"
        if request.context:
            prompt += f"\n\nAdditional context: {request.context}"
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{OLLAMA_HOST}/api/generate",
                json={
                    "model": model,
                    "prompt": f"{system_prompt}\n\n{prompt}\n\nJSON response:",
                    "stream": False,
                    "options": {
                        "temperature": 0.3,
                        "num_predict": 1024
                    }
                },
                timeout=120.0
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail=f"Ollama error: {response.text}")
            
            data = response.json()
            ai_response = data.get("response", "")
            
            # Try to parse JSON from response
            profile = {}
            try:
                json_start = ai_response.find('{')
                json_end = ai_response.rfind('}') + 1
                if json_start >= 0 and json_end > json_start:
                    profile = json.loads(ai_response[json_start:json_end])
            except:
                # If JSON parsing fails, structure the raw response
                profile = {
                    "summary": ai_response[:200] + "..." if len(ai_response) > 200 else ai_response,
                    "research": ai_response,
                    "connections": "",
                    "preferences": ""
                }
            
            # Ensure all expected fields exist
            profile.setdefault("summary", "No summary available")
            profile.setdefault("research", "No research data available")
            profile.setdefault("connections", "No connection data available")
            profile.setdefault("preferences", "No preference data available")
            
            return {
                "profile": profile,
                "raw_response": ai_response,
                "model": model,
                "source": "local"
            }
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="Ollama not running")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# OBSIDIAN INTEGRATION
# ============================================================================

OBSIDIAN_VAULT_PATH = os.environ.get('OBSIDIAN_VAULT_PATH', '/home/jamie/Obsidian Vault')

class ObsidianNote(BaseModel):
    title: str
    content: str
    folder: Optional[str] = 'Deals/Hot Money'

@app.post("/api/obsidian/quick-link")
async def create_obsidian_note(note: ObsidianNote):
    """Create a note in Obsidian vault"""
    try:
        # Sanitize filename
        safe_title = "".join(c for c in note.title if c.isalnum() or c in (' ', '-', '_')).strip()
        safe_title = safe_title.replace(' ', '_')
        
        # Build path
        folder_path = os.path.join(OBSIDIAN_VAULT_PATH, note.folder)
        os.makedirs(folder_path, exist_ok=True)
        
        file_path = os.path.join(folder_path, f"{safe_title}.md")
        
        # Write file
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(note.content)
        
        return {
            "success": True,
            "path": file_path,
            "message": f"Note created: {safe_title}.md"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# DATA MANAGER ENDPOINTS
# ============================================================================

@app.get("/api/data-manager/stats")
async def get_data_manager_stats():
    """
    Get comprehensive stats for Data Manager
    Returns counts for all data modules
    """
    conn = get_db()
    cursor = conn.cursor()
    
    stats = {
        "modules": [
            {
                "id": "builders",
                "name": "Builders",
                "icon": "🏗️",
                "count": 0,
                "endpoint": "/api/data-manager/builders",
                "description": "Construction companies and developers"
            },
            {
                "id": "agents",
                "name": "Agents",
                "icon": "👤",
                "count": 0,
                "endpoint": "/api/data-manager/agents",
                "description": "Real estate agents and brokers"
            },
            {
                "id": "lenders",
                "name": "Lenders",
                "icon": "🏦",
                "count": 0,
                "endpoint": "/api/data-manager/lenders",
                "description": "Mortgage and commercial lenders"
            },
            {
                "id": "properties",
                "name": "Properties",
                "icon": "🏢",
                "count": 0,
                "endpoint": "/api/data-manager/properties",
                "description": "Property listings and transactions"
            },
            {
                "id": "buyers",
                "name": "Buyers",
                "icon": "🛒",
                "count": 0,
                "endpoint": "/api/data-manager/buyers",
                "description": "Buyer prospects and companies"
            }
        ],
        "total_records": 0,
        "last_updated": datetime.now().isoformat()
    }
    
    try:
        # Builders (from companies table or builders CSV)
        try:
            cursor.execute("SELECT COUNT(*) FROM builders")
            stats["modules"][0]["count"] = cursor.fetchone()[0]
        except:
            # Try to count from other sources
            cursor.execute("SELECT COUNT(*) FROM dbeaver_brokerages")
            stats["modules"][0]["count"] = cursor.fetchone()[0]
        
        # Agents (recruiters + brokers + salespersons)
        cursor.execute("SELECT COUNT(*) FROM recruiters")
        recruiter_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM dbeaver_brokers")
        broker_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM dbeaver_salespersons")
        salesperson_count = cursor.fetchone()[0]
        stats["modules"][1]["count"] = recruiter_count + broker_count + salesperson_count
        
        # Lenders
        cursor.execute("SELECT COUNT(*) FROM lenders")
        stats["modules"][2]["count"] = cursor.fetchone()[0]
        
        # Properties (transactions)
        cursor.execute("SELECT COUNT(*) FROM transactions_full")
        stats["modules"][3]["count"] = cursor.fetchone()[0]
        
        # Buyers
        cursor.execute("SELECT COUNT(*) FROM buyers")
        stats["modules"][4]["count"] = cursor.fetchone()[0]
        
        # Calculate total
        stats["total_records"] = sum(m["count"] for m in stats["modules"])
        
    except Exception as e:
        print(f"Error getting stats: {e}")
    finally:
        conn.close()
    
    return stats

@app.get("/api/data-manager/builders")
async def get_data_manager_builders(
    page: int = 1,
    limit: int = 50,
    search: Optional[str] = None
):
    """Get builders for Data Manager"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Use brokerages as builders for now (they're development companies)
    conditions = []
    params = []
    
    if search:
        conditions.append("name LIKE ?")
        params.append(f'%{search}%')
    
    where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""
    
    cursor.execute(f"SELECT COUNT(*) FROM dbeaver_brokerages {where_clause}", params)
    total = cursor.fetchone()[0]
    
    offset = (page - 1) * limit
    cursor.execute(f'''
        SELECT id, name, city, region as province, website, phone
        FROM dbeaver_brokerages 
        {where_clause}
        ORDER BY name
        LIMIT ? OFFSET ?
    ''', params + [limit, offset])
    
    rows = cursor.fetchall()
    builders = [dict(row) for row in rows]
    conn.close()
    
    return {
        "data": builders,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }

@app.get("/api/data-manager/agents")
async def get_data_manager_agents(
    page: int = 1,
    limit: int = 50,
    search: Optional[str] = None
):
    """Get agents for Data Manager (combines recruiters, brokers, salespersons)"""
    conn = get_db()
    cursor = conn.cursor()
    
    agents = []
    total = 0
    
    # Get from recruiters table
    if search:
        cursor.execute('''
            SELECT id, name, email, brokerage, city, 'recruiter' as source
            FROM recruiters
            WHERE name LIKE ? OR brokerage LIKE ?
            ORDER BY name
            LIMIT ? OFFSET ?
        ''', (f'%{search}%', f'%{search}%', limit, (page-1)*limit))
    else:
        cursor.execute('''
            SELECT id, name, email, brokerage, city, 'recruiter' as source
            FROM recruiters
            ORDER BY name
            LIMIT ? OFFSET ?
        ''', (limit, (page-1)*limit))
    
    recruiters = [dict(row) for row in cursor.fetchall()]
    
    cursor.execute("SELECT COUNT(*) FROM recruiters")
    total += cursor.fetchone()[0]
    
    conn.close()
    
    return {
        "data": recruiters,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }

@app.get("/api/data-manager/lenders")
async def get_data_manager_lenders(
    page: int = 1,
    limit: int = 50,
    search: Optional[str] = None
):
    """Get lenders for Data Manager"""
    conn = get_db()
    cursor = conn.cursor()
    
    conditions = []
    params = []
    
    if search:
        conditions.append("name LIKE ?")
        params.append(f'%{search}%')
    
    where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""
    
    cursor.execute(f"SELECT COUNT(*) FROM lenders {where_clause}", params)
    total = cursor.fetchone()[0]
    
    offset = (page - 1) * limit
    cursor.execute(f'''
        SELECT id, name, domain, lender_type, phone, email, city, province
        FROM lenders 
        {where_clause}
        ORDER BY name
        LIMIT ? OFFSET ?
    ''', params + [limit, offset])
    
    rows = cursor.fetchall()
    lenders = [dict(row) for row in rows]
    conn.close()
    
    return {
        "data": lenders,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }

@app.get("/api/data-manager/properties")
async def get_data_manager_properties(
    page: int = 1,
    limit: int = 50,
    search: Optional[str] = None
):
    """Get properties/transactions for Data Manager"""
    conn = get_db()
    cursor = conn.cursor()
    
    conditions = []
    params = []
    
    if search:
        conditions.append("property_address LIKE ?")
        params.append(f'%{search}%')
    
    where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""
    
    cursor.execute(f"SELECT COUNT(*) FROM transactions_full {where_clause}", params)
    total = cursor.fetchone()[0]
    
    offset = (page - 1) * limit
    cursor.execute(f'''
        SELECT id, property_address, city, province, sale_amount, sale_date, buyer, seller
        FROM transactions_full 
        {where_clause}
        ORDER BY sale_amount DESC
        LIMIT ? OFFSET ?
    ''', params + [limit, offset])
    
    rows = cursor.fetchall()
    properties = [dict(row) for row in rows]
    conn.close()
    
    return {
        "data": properties,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }

@app.get("/api/data-manager/buyers")
async def get_data_manager_buyers(
    page: int = 1,
    limit: int = 50,
    search: Optional[str] = None
):
    """Get buyers for Data Manager"""
    conn = get_db()
    cursor = conn.cursor()
    
    conditions = []
    params = []
    
    if search:
        conditions.append("name LIKE ?")
        params.append(f'%{search}%')
    
    where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""
    
    cursor.execute(f"SELECT COUNT(*) FROM buyers {where_clause}", params)
    total = cursor.fetchone()[0]
    
    offset = (page - 1) * limit
    cursor.execute(f'''
        SELECT id, name, email, phone, city, province, buyer_type
        FROM buyers 
        {where_clause}
        ORDER BY name
        LIMIT ? OFFSET ?
    ''', params + [limit, offset])
    
    rows = cursor.fetchall()
    buyers = [dict(row) for row in rows]
    conn.close()
    
    return {
        "data": buyers,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }

# ============================================================================
# GEMMA 4 CEO EXECUTIVE ASSISTANT ENDPOINTS
# ============================================================================

# Import Gemma 4 modules (lazy import to handle missing dependencies gracefully)
_gemma4_engine = None
_google_earth = None
_document_processor = None
_voice_interface = None
_briefing_scheduler = None

def get_gemma4_engine():
    global _gemma4_engine
    if _gemma4_engine is None:
        try:
            import sys
            sys.path.insert(0, 'bigdataclaw/gemma4')
            from gemma4_engine import Gemma4Engine
            _gemma4_engine = Gemma4Engine()
        except Exception as e:
            print(f"⚠️ Gemma 4 engine not available: {e}")
    return _gemma4_engine

def get_google_earth():
    global _google_earth
    if _google_earth is None:
        try:
            import sys
            sys.path.insert(0, 'bigdataclaw/gemma4')
            from google_earth import PropertyVisualizer
            _google_earth = PropertyVisualizer()
        except Exception as e:
            print(f"⚠️ Google Earth integration not available: {e}")
    return _google_earth

def get_document_processor():
    global _document_processor
    if _document_processor is None:
        try:
            import sys
            sys.path.insert(0, 'bigdataclaw/gemma4')
            from document_processor import DocumentAnalyzer
            _document_processor = DocumentAnalyzer()
        except Exception as e:
            print(f"⚠️ Document processor not available: {e}")
    return _document_processor

def get_voice_interface():
    global _voice_interface
    if _voice_interface is None:
        try:
            import sys
            sys.path.insert(0, 'bigdataclaw/gemma4')
            from voice_interface import create_voice_interface
            _voice_interface = create_voice_interface()
        except Exception as e:
            print(f"⚠️ Voice interface not available: {e}")
    return _voice_interface

def get_briefing_scheduler():
    global _briefing_scheduler
    if _briefing_scheduler is None:
        try:
            import sys
            sys.path.insert(0, 'bigdataclaw/gemma4')
            from daily_briefing import BriefingScheduler
            _briefing_scheduler = BriefingScheduler()
        except Exception as e:
            print(f"⚠️ Briefing scheduler not available: {e}")
    return _briefing_scheduler

class Gemma4ChatRequest(BaseModel):
    message: str
    context: Optional[str] = None
    stream: bool = False

class Gemma4AnalyzeRequest(BaseModel):
    address: str
    include_demographics: bool = True

@app.get("/api/gemma4/status")
async def gemma4_status():
    """Check Gemma 4 AI Assistant status."""
    engine = get_gemma4_engine()
    earth = get_google_earth()
    doc_processor = get_document_processor()
    voice = get_voice_interface()
    briefing = get_briefing_scheduler()
    
    return {
        "status": "operational" if engine else "unavailable",
        "engine_loaded": engine is not None,
        "google_earth_loaded": earth is not None,
        "document_processor_loaded": doc_processor is not None,
        "voice_interface_loaded": voice is not None,
        "briefing_scheduler_loaded": briefing is not None,
        "models": ["gemma:2b", "gemma:7b"],
        "features": [
            "chat",
            "database_query",
            "property_analysis",
            "satellite_imagery",
            "site_analysis",
            "document_upload",
            "pdf_analysis",
            "ocr",
            "voice_commands",
            "text_to_speech",
            "wake_word_detection",
            "daily_briefing",
            "automated_reports"
        ],
        "timestamp": datetime.now().isoformat()
    }

@app.post("/api/gemma4/chat")
async def gemma4_chat(request: Gemma4ChatRequest):
    """Chat with Gemma 4 CEO Assistant."""
    engine = get_gemma4_engine()
    
    if not engine:
        # Fallback response when engine unavailable
        return {
            "response": "Gemma 4 AI Assistant is currently initializing. Please try again in a moment.",
            "model": "unavailable",
            "timestamp": datetime.now().isoformat()
        }
    
    try:
        response = engine.chat(request.message, context=request.context)
        return {
            "response": response,
            "model": engine.model,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "response": f"I apologize, but I encountered an error: {str(e)}",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@app.post("/api/gemma4/analyze-property")
async def gemma4_analyze_property(request: Gemma4AnalyzeRequest):
    """Analyze a property with satellite imagery and site context."""
    earth = get_google_earth()
    
    if not earth:
        return {
            "error": "Property analysis service unavailable",
            "timestamp": datetime.now().isoformat()
        }
    
    try:
        package = earth.create_property_package(
            request.address, 
            include_demographics=request.include_demographics
        )
        return package
    except Exception as e:
        return {
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@app.get("/api/gemma4/satellite")
async def gemma4_satellite(address: str, zoom: int = 19):
    """Get satellite imagery for an address."""
    earth = get_google_earth()
    
    if not earth:
        return {"error": "Satellite service unavailable"}
    
    try:
        from google_earth import get_property_satellite
        result = get_property_satellite(address)
        return result
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/gemma4/upload-document")
async def gemma4_upload_document(
    file: UploadFile = File(...)
):
    """Upload and analyze a document (PDF, DOCX, TXT, XLSX, images)."""
    doc_processor = get_document_processor()
    
    if not doc_processor:
        return {
            "error": "Document processing service unavailable",
            "timestamp": datetime.now().isoformat()
        }
    
    try:
        content = await file.read()
        result = doc_processor.analyze_document(
            content, 
            file.filename, 
            file.content_type or 'application/octet-stream'
        )
        return result
    except Exception as e:
        return {
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

# Voice Interface Endpoints
active_voice_sessions = {}

@app.post("/api/gemma4/voice/start")
async def gemma4_voice_start():
    """Start a new voice session."""
    voice = get_voice_interface()
    
    if not voice:
        return {
            "status": "unavailable",
            "message": "Voice interface not available",
            "timestamp": datetime.now().isoformat()
        }
    
    try:
        session = voice.start_session()
        session_id = session['session_id']
        active_voice_sessions[session_id] = voice
        return session
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@app.post("/api/gemma4/voice/{session_id}/audio")
async def gemma4_voice_audio(session_id: str, audio: UploadFile = File(...)):
    """Process audio chunk from client."""
    voice = active_voice_sessions.get(session_id)
    
    if not voice:
        return {
            "error": "Session not found or expired",
            "timestamp": datetime.now().isoformat()
        }
    
    try:
        audio_bytes = await audio.read()
        result = voice.process_audio_chunk(audio_bytes)
        return result
    except Exception as e:
        return {
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@app.post("/api/gemma4/voice/{session_id}/text")
async def gemma4_voice_text(session_id: str, request: Gemma4ChatRequest):
    """Send text command to voice session (for testing without audio)."""
    voice = active_voice_sessions.get(session_id)
    
    if not voice:
        return {
            "error": "Session not found or expired",
            "timestamp": datetime.now().isoformat()
        }
    
    try:
        engine = get_gemma4_engine()
        result = voice.generate_response(request.message, gemma_engine=engine)
        return result
    except Exception as e:
        return {
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@app.post("/api/gemma4/voice/{session_id}/end")
async def gemma4_voice_end(session_id: str):
    """End a voice session."""
    voice = active_voice_sessions.get(session_id)
    
    if not voice:
        return {
            "error": "Session not found",
            "timestamp": datetime.now().isoformat()
        }
    
    try:
        result = voice.end_session()
        del active_voice_sessions[session_id]
        return result
    except Exception as e:
        return {
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

# Daily Briefing Endpoints
@app.get("/api/gemma4/briefing/today")
async def gemma4_daily_briefing():
    """Generate today's daily briefing."""
    scheduler = get_briefing_scheduler()
    
    if not scheduler:
        return {
            "error": "Briefing service unavailable",
            "timestamp": datetime.now().isoformat()
        }
    
    try:
        result = scheduler.generate_and_deliver()
        return result
    except Exception as e:
        return {
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@app.get("/api/gemma4/briefing/markdown")
async def gemma4_briefing_markdown():
    """Get daily briefing as markdown."""
    try:
        import sys
        sys.path.insert(0, 'bigdataclaw/gemma4')
        from daily_briefing import DailyBriefingGenerator
        
        generator = DailyBriefingGenerator()
        briefing = generator.generate_briefing()
        markdown = generator.to_markdown(briefing)
        
        return {
            "markdown": markdown,
            "date": briefing.date,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@app.post("/api/gemma4/briefing/schedule")
async def gemma4_schedule_briefing(time: str = "08:00", timezone: str = "America/Toronto"):
    """Schedule automated daily briefings."""
    scheduler = get_briefing_scheduler()
    
    if not scheduler:
        return {
            "error": "Briefing scheduler unavailable",
            "timestamp": datetime.now().isoformat()
        }
    
    try:
        result = scheduler.schedule_briefing(time, timezone)
        return result
    except Exception as e:
        return {
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

# ============================================================================
# OPENCLAW CHAT — Persona + Tool System (Pass 2)
# ============================================================================

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

MODE_SUFFIX = {
    "fast": "\nMode: FAST — Keep answers to 2-3 sentences. Prioritize speed and clarity.",
    "deep": "\nMode: DEEP — Provide thorough analysis with specific data points, numbers, and reasoning. Include actionable next steps.",
    "report": "\nMode: REPORT — Generate a structured report with sections: Summary, Key Findings, Data Points, Recommendations, Next Steps.",
}


def detect_persona_and_mode(message: str) -> tuple[str, str]:
    """Rule-based intent router. Returns (persona, mode)."""
    text = message.lower()

    report_terms = ["report", "memo", "export", "markdown", "writeup", "summary", "summarize", "brief"]
    analyst_terms = [
        "lead", "leads", "buyer", "buyers", "lender", "lenders", "transaction",
        "transactions", "comp", "comps", "database", "search", "analyze",
        "deal", "hot money", "owner", "operator", "stats", "count", "numbers",
        "location", "locations", "filter", "filtered", "property", "properties",
        "asset", "assets", "cap rate", "cap rates", "noi", "square feet", "sf"
    ]
    concierge_terms = [
        "what do you do", "what is mission control", "what is bigdataclaw",
        "pricing", "services", "book", "demo", "contact", "help", "hello",
        "hi ", "how are you", "who are you", "website", "platform", "about"
    ]

    if any(term in text for term in report_terms):
        return "analyst", "report"

    if any(term in text for term in analyst_terms):
        return "analyst", "deep"

    if any(term in text for term in concierge_terms):
        return "concierge", "fast"

    # Tie-breaker: numbers / locations / filters → Analyst
    if any(c.isdigit() for c in text) or "$" in text:
        return "analyst", "deep"

    return "concierge", "fast"


def _build_system_prompt(persona, mode):
    base = PERSONA_PROMPTS.get(persona, PERSONA_PROMPTS["concierge"])
    if persona == "analyst":
        base = base.replace("{tool_schemas}", get_tool_schemas_json())
    return base + MODE_SUFFIX.get(mode, "")


def _extract_tool_calls(text):
    calls = []
    idx = 0
    while True:
        marker = text.find("TOOL_CALL:", idx)
        if marker == -1:
            break
        start = marker + len("TOOL_CALL:")
        while start < len(text) and text[start] in " \t\n":
            start += 1
        if start >= len(text) or text[start] != "{":
            idx = start
            continue
        brace_count = 0
        end = start
        for i in range(start, len(text)):
            if text[i] == "{":
                brace_count += 1
            elif text[i] == "}":
                brace_count -= 1
                if brace_count == 0:
                    end = i + 1
                    break
        json_str = text[start:end]
        try:
            calls.append(json.loads(json_str))
        except json.JSONDecodeError:
            pass
        idx = end if end > start else start + 1
    return calls


async def _run_tool_loop(messages, mode, persona, max_iterations=3):
    for _ in range(max_iterations):
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{OLLAMA_HOST}/api/chat",
                json={
                    "model": OLLAMA_MODEL,
                    "messages": messages,
                    "stream": False,
                    "options": {"temperature": 0.7, "num_predict": 1024, "num_ctx": 8192},
                },
                timeout=120.0
            )
        if response.status_code != 200:
            break
        content = response.json().get("message", {}).get("content", "")
        tool_calls = _extract_tool_calls(content)
        if not tool_calls:
            return content

        clean_content = content
        for tc in tool_calls:
            clean_content = clean_content.replace(f"TOOL_CALL: {json.dumps(tc)}", "")
        clean_content = clean_content.strip()

        for tc in tool_calls:
            result = execute_tool(tc.get("tool"), tc.get("args", {}))
            result_text = json.dumps(result, indent=2, default=str)
            messages.append({"role": "assistant", "content": clean_content or "I'll look that up."})
            messages.append({
                "role": "system",
                "content": f"Tool '{tc.get('tool')}' result:\n{result_text}\n\nAnswer the user's question based on this data."
            })
    return content


class OpenClawChatRequest(BaseModel):
    message: str
    conversation_history: List[Dict[str, str]] = []
    mode: str = "fast"
    persona: str = "auto"
    auto_route: bool = True


@app.post("/api/openclaw/chat")
async def openclaw_chat(request: OpenClawChatRequest):
    """Non-streaming chat with persona + tool support."""
    try:
        user_message = request.message.strip()

        # Auto-route unless user manually picked a persona
        if request.auto_route and request.persona in ("auto", ""):
            detected_persona, detected_mode = detect_persona_and_mode(user_message)
            persona = detected_persona
            mode = detected_mode
        else:
            mode = request.mode if request.mode in ("fast", "deep", "report") else "fast"
            persona = request.persona if request.persona in ("concierge", "analyst") else "concierge"

        if not user_message:
            return JSONResponse({"error": "Message is required"}, status_code=400)

        system_prompt = _build_system_prompt(persona, mode)
        messages = [{"role": "system", "content": system_prompt}]
        for msg in request.conversation_history[-6:]:
            messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})
        messages.append({"role": "user", "content": user_message})

        if persona == "analyst":
            ai_content = await _run_tool_loop(messages, mode, persona)
        else:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{OLLAMA_HOST}/api/chat",
                    json={
                        "model": OLLAMA_MODEL,
                        "messages": messages,
                        "stream": False,
                        "options": {"temperature": 0.7, "num_predict": 1024, "num_ctx": 8192},
                    },
                    timeout=120.0
                )
            if response.status_code == 200:
                ai_content = response.json().get("message", {}).get("content", "")
            else:
                ai_content = "I'm having trouble connecting right now."

        # Extract actions
        actions = []
        lower = ai_content.lower()
        if "hot money" in lower or "buyer" in lower:
            actions.append({"label": "View Hot Money", "to": "/hotmoney", "primary": False})
        if "buyer" in lower:
            actions.append({"label": "Find Buyers", "to": "/buyers", "primary": True})
        if "lender" in lower:
            actions.append({"label": "Find Lenders", "to": "/lenders", "primary": False})

        return {
            "response": ai_content,
            "actions": actions,
            "metadata": {
                "mode": mode,
                "persona": persona,
                "provider": "ollama",
                "auto_routed": request.auto_route and request.persona in ("auto", ""),
            }
        }
    except Exception as e:
        print(f"Chat error: {e}")
        import traceback
        traceback.print_exc()
        return JSONResponse({
            "response": "I'm having trouble right now. Please try again.",
            "actions": [{"label": "Retry", "to": "#", "primary": True}]
        }, status_code=500)


@app.post("/api/openclaw/chat/stream")
async def openclaw_chat_stream(request: OpenClawChatRequest):
    """SSE streaming chat endpoint."""
    async def event_generator():
        try:
            user_message = request.message.strip()

            # Auto-route unless user manually picked a persona
            if request.auto_route and request.persona in ("auto", ""):
                detected_persona, detected_mode = detect_persona_and_mode(user_message)
                persona = detected_persona
                mode = detected_mode
            else:
                mode = request.mode if request.mode in ("fast", "deep", "report") else "fast"
                persona = request.persona if request.persona in ("concierge", "analyst") else "concierge"

            if not user_message:
                yield f"data: {json.dumps({'error': 'Message required'})}\n\n"
                yield "data: [DONE]\n\n"
                return

            # Emit routing metadata so frontend can show the badge
            yield f"data: {json.dumps({'meta': {'persona': persona, 'mode': mode, 'auto_routed': request.auto_route and request.persona in ('auto', '')}})}\n\n"

            system_prompt = _build_system_prompt(persona, mode)
            messages = [{"role": "system", "content": system_prompt}]
            for msg in request.conversation_history[-6:]:
                messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})
            messages.append({"role": "user", "content": user_message})

            if persona == "analyst":
                # Buffer full response to detect tool calls
                full_response = ""
                async with httpx.AsyncClient() as client:
                    async with client.stream(
                        "POST",
                        f"{OLLAMA_HOST}/api/chat",
                        json={
                            "model": OLLAMA_MODEL,
                            "messages": messages,
                            "stream": True,
                            "options": {"temperature": 0.7, "num_predict": 1024, "num_ctx": 8192},
                        },
                        timeout=120.0
                    ) as resp:
                        async for line in resp.aiter_lines():
                            if line:
                                try:
                                    data = json.loads(line)
                                    chunk = data.get("message", {}).get("content", "")
                                    if chunk:
                                        full_response += chunk
                                except json.JSONDecodeError:
                                    continue

                tool_calls = _extract_tool_calls(full_response)
                if tool_calls:
                    yield f"data: {json.dumps({'token': '🔍 Searching database...\n\n'})}\n\n"
                    await asyncio.sleep(0.1)

                    final = await _run_tool_loop(messages, mode, persona)
                    for word in final.split():
                        yield f"data: {json.dumps({'token': word + ' '})}\n\n"
                        await asyncio.sleep(0.02)
                else:
                    for chunk in full_response:
                        yield f"data: {json.dumps({'token': chunk})}\n\n"
            else:
                async with httpx.AsyncClient() as client:
                    async with client.stream(
                        "POST",
                        f"{OLLAMA_HOST}/api/chat",
                        json={
                            "model": OLLAMA_MODEL,
                            "messages": messages,
                            "stream": True,
                            "options": {"temperature": 0.7, "num_predict": 1024, "num_ctx": 8192},
                        },
                        timeout=120.0
                    ) as resp:
                        async for line in resp.aiter_lines():
                            if line:
                                try:
                                    data = json.loads(line)
                                    chunk = data.get("message", {}).get("content", "")
                                    if chunk:
                                        yield f"data: {json.dumps({'token': chunk})}\n\n"
                                except json.JSONDecodeError:
                                    continue

            yield "data: [DONE]\n\n"
        except Exception as e:
            print(f"Stream error: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            yield "data: [DONE]\n\n"

    from fastapi.responses import StreamingResponse
    return StreamingResponse(event_generator(), media_type="text/event-stream")


# ============================================================================
# BOARDROOM CHAT — Shared room chat with command routing
# ============================================================================

# In-memory room chat store (room_id -> list of messages)
_ROOM_CHATS: Dict[str, List[dict]] = {}
_ROOM_CHAT_MAX = 200


class RoomChatMessage(BaseModel):
    role: str = "user"  # user | agent | system
    content: str = ""
    agent_id: str = ""  # which agent sent this (if agent role)
    agent_name: str = ""  # display name
    timestamp: str = ""
    metadata: dict = {}


class SendRoomChatRequest(BaseModel):
    message: str = ""
    user_name: str = "Operator"
    property_context: dict = {}  # optional deal context


def _route_boardroom_command(message: str, room_id: str, context: dict) -> dict:
    """
    Parse boardroom commands and route to appropriate backend actions.
    Returns a response message dict.
    """
    lower = message.lower().strip()
    cmd = lower.rstrip(".!?")

    # --- Buyer Intelligence ---
    if any(k in cmd for k in ["buyer intelligence", "find buyers", "rank buyers", "who are the buyers", "buyer matches"]):
        try:
            city = context.get("city", "Mississauga")
            prop_type = context.get("property_type", "Office")
            bi_req = BuyerIntelligenceRequest(
                property_type=prop_type,
                city=city,
                target_count=10,
            )
            result = buyer_intelligence(bi_req)
            top = result.get("ranked_buyers", [])[:5]
            lines = [f"Found {len(result.get('ranked_buyers', []))} ranked buyers. Top matches:"]
            for b in top:
                lines.append(f"• {b['name']} — Score {b['score']}. {b.get('buyer_reason_signal', '')[:100]}...")
            return {
                "role": "agent",
                "agent_id": "buyer_intel",
                "agent_name": "Buyer Intelligence",
                "content": "\n".join(lines),
            }
        except Exception as e:
            return {"role": "agent", "agent_id": "buyer_intel", "agent_name": "Buyer Intelligence", "content": f"Error running buyer intelligence: {e}"}

    # --- Feature Sheet ---
    if any(k in cmd for k in ["feature sheet", "generate sheet", "property sheet", "create feature sheet"]):
        try:
            fs_req = PropertyFeatureSheetRequest(
                property_type=context.get("property_type", "Office"),
                address=context.get("address", ""),
                city=context.get("city", "Mississauga"),
                price=context.get("price", 0),
                cap_rate=context.get("cap_rate", 0),
                net_income=context.get("net_income", 0),
                size_sqft=context.get("size_sqft", 0),
            )
            sheet_id = _generate_feature_sheet_id(fs_req)
            _build_feature_sheet_html(fs_req, sheet_id)
            return {
                "role": "agent",
                "agent_id": "feature_sheet",
                "agent_name": "Feature Sheet Agent",
                "content": f"Feature sheet generated. ID: {sheet_id}. You can view it at /feature-sheet/{sheet_id}",
                "metadata": {"sheet_id": sheet_id, "action": "feature_sheet_generated"},
            }
        except Exception as e:
            return {"role": "agent", "agent_id": "feature_sheet", "agent_name": "Feature Sheet Agent", "content": f"Error generating feature sheet: {e}"}

    # --- Outreach Pack ---
    if any(k in cmd for k in ["outreach pack", "build outreach", "generate outreach", "run outreach"]):
        try:
            op_req = OutreachPackRequest(
                property_type=context.get("property_type", "Office"),
                address=context.get("address", ""),
                city=context.get("city", "Mississauga"),
                price=context.get("price", 0),
                cap_rate=context.get("cap_rate", 0),
                net_income=context.get("net_income", 0),
                size_sqft=context.get("size_sqft", 0),
            )
            # We can't call create_outreach_pack directly because it's a FastAPI endpoint handler.
            # Instead, replicate the core logic quickly.
            bi_req = BuyerIntelligenceRequest(
                property_type=op_req.property_type,
                city=op_req.city,
                target_count=10,
            )
            bi_result = buyer_intelligence(bi_req)
            buyers = bi_result.get("ranked_buyers", [])
            deal_context = {
                "property_type": op_req.property_type,
                "city": op_req.city,
                "price": op_req.price,
                "cap_rate": op_req.cap_rate,
            }
            payloads = _build_buyer_outreach_payload(buyers, deal_context)
            bucket_counts = {}
            for p in payloads:
                bucket_counts[p["bucket"]] = bucket_counts.get(p["bucket"], 0) + 1
            return {
                "role": "agent",
                "agent_id": "outreach_orchestrator",
                "agent_name": "Deal Coordinator",
                "content": f"Outreach pack ready. {len(payloads)} buyer payloads: {bucket_counts.get('Call Now', 0)} call now, {bucket_counts.get('Send Teaser', 0)} send teaser, {bucket_counts.get('Research First', 0)} research, {bucket_counts.get('Hold', 0)} hold.",
                "metadata": {"payload_count": len(payloads), "bucket_counts": bucket_counts, "action": "outreach_pack_generated"},
            }
        except Exception as e:
            return {"role": "agent", "agent_id": "outreach_orchestrator", "agent_name": "Deal Coordinator", "content": f"Error building outreach pack: {e}"}

    # --- Agent Status ---
    if any(k in cmd for k in ["agent status", "who is online", "agent list", "active agents", "what are you working on"]):
        agents = list(_AGENT_REGISTRY.values())
        if not agents:
            return {"role": "agent", "agent_id": "coordinator", "agent_name": "Deal Coordinator", "content": "No active agents right now. The floor is clear."}
        lines = [f"{len(agents)} agent(s) on the board:"]
        for a in agents:
            lines.append(f"• {a.get('agent_name', a.get('agent_id', 'Unknown'))} — {a.get('status', 'online')} — {a.get('task', 'Idle')}")
        return {"role": "agent", "agent_id": "coordinator", "agent_name": "Deal Coordinator", "content": "\n".join(lines)}

    # --- Help / Fallback ---
    help_text = """I'm the Deal Coordinator. Here are commands I understand:

• "Run buyer intelligence" — Rank buyers for this deal
• "Generate feature sheet" — Create a property feature sheet
• "Build outreach pack" — Full outreach pack with buyer payloads
• "Agent status" — Who's online and what they're doing
• "Why is [buyer] flagged?" — Explain a buyer's reason signal

You can also chat with individual agents by clicking them in the agent grid."""

    return {"role": "agent", "agent_id": "coordinator", "agent_name": "Deal Coordinator", "content": help_text}


@app.get("/api/room-chat/{room_id}")
def get_room_chat(room_id: str):
    """Get chat history for a room."""
    messages = _ROOM_CHATS.get(room_id, [])
    return {"room_id": room_id, "messages": messages, "count": len(messages)}


@app.post("/api/room-chat/{room_id}")
async def send_room_chat(room_id: str, request: SendRoomChatRequest):
    """Send a message to the boardroom chat. Routes commands to agents."""
    if room_id not in _ROOM_CHATS:
        _ROOM_CHATS[room_id] = []

    # Add user message
    user_msg = {
        "role": "user",
        "content": request.message,
        "agent_id": "",
        "agent_name": request.user_name,
        "timestamp": datetime.utcnow().isoformat(),
        "metadata": {},
    }
    _ROOM_CHATS[room_id].append(user_msg)

    # Route command
    response = _route_boardroom_command(request.message, room_id, request.property_context)
    response["timestamp"] = datetime.utcnow().isoformat()
    _ROOM_CHATS[room_id].append(response)

    # Trim history
    if len(_ROOM_CHATS[room_id]) > _ROOM_CHAT_MAX:
        _ROOM_CHATS[room_id] = _ROOM_CHATS[room_id][-_ROOM_CHAT_MAX:]

    # Emit agent event for real-time listeners
    _emit_agent_event({
        "type": "room.chat_message",
        "room_id": room_id,
        "agent_id": response.get("agent_id", ""),
        "agent_name": response.get("agent_name", ""),
        "content": response["content"],
        "timestamp": response["timestamp"],
    })

    return {"room_id": room_id, "user_message": user_msg, "response": response}


@app.delete("/api/room-chat/{room_id}")
def clear_room_chat(room_id: str):
    """Clear chat history for a room."""
    _ROOM_CHATS[room_id] = []
    return {"room_id": room_id, "status": "cleared"}


# ─────────────────────────────────────────────────────────────
# Pixel Agents Endpoints
# ─────────────────────────────────────────────────────────────

PIXEL_AGENTS_REGISTRY = [
    {
        "id": "kimi",
        "name": "Kimi",
        "role": "Analyst",
        "description": "Database-aware CRE research agent. Queries hot money, buyers, lenders, transactions, and the vault.",
        "status": "online",
        "mode": "analyst",
        "capabilities": ["chat", "db_lookup", "deal_analysis", "hot_money", "buyer_search", "lender_search", "transaction_search", "vault_search"],
        "sprite": "/pablo-assets/characters/frames/char_0_avatar.png",
        "color": "#8b5cf6",
    },
    {
        "id": "concierge",
        "name": "Concierge",
        "role": "Website Guide",
        "description": "Handles public questions, site navigation, and lead intake. Lightweight, no tools.",
        "status": "online",
        "mode": "concierge",
        "capabilities": ["chat", "faq", "booking", "navigation_help"],
        "sprite": "/pablo-assets/characters/frames/char_1_avatar.png",
        "color": "#10b981",
    },
    {
        "id": "scout",
        "name": "Scout",
        "role": "Researcher",
        "description": "Searches markets, filters opportunities, and maintains watchlists.",
        "status": "online",
        "mode": "analyst",
        "capabilities": ["chat", "market_search", "filter", "watchlist", "alert"],
        "sprite": "/pablo-assets/characters/frames/char_2_avatar.png",
        "color": "#f59e0b",
    },
    {
        "id": "scribe",
        "name": "Scribe",
        "role": "Report Writer",
        "description": "Generates markdown exports, deal memos, and summaries.",
        "status": "online",
        "mode": "analyst",
        "capabilities": ["chat", "markdown_export", "deal_memo", "summary", "pdf"],
        "sprite": "/pablo-assets/characters/frames/char_3_avatar.png",
        "color": "#06b6d4",
    },
    {
        "id": "skeptic",
        "name": "Skeptic",
        "role": "Fact Checker",
        "description": "Validates claims, verifies sources, and flags inconsistencies.",
        "status": "online",
        "mode": "analyst",
        "capabilities": ["chat", "validation", "source_check", "flagging"],
        "sprite": "/pablo-assets/characters/frames/char_4_avatar.png",
        "color": "#ef4444",
    },
    {
        "id": "spark",
        "name": "Spark",
        "role": "Ideator",
        "description": "Generates improvements, optimizations, and strategic ideas.",
        "status": "online",
        "mode": "concierge",
        "capabilities": ["chat", "brainstorm", "optimization", "strategy"],
        "sprite": "/pablo-assets/characters/frames/char_5_avatar.png",
        "color": "#ec4899",
    },
]


@app.get("/api/pixel-agents")
def get_pixel_agents():
    """Return the pixel agent fleet registry."""
    return {"agents": PIXEL_AGENTS_REGISTRY}


@app.get("/api/pixel-agents/{agent_id}")
def get_pixel_agent(agent_id: str):
    """Return a single pixel agent definition."""
    agent = next((a for a in PIXEL_AGENTS_REGISTRY if a["id"] == agent_id), None)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@app.post("/api/pixel-agents/{agent_id}/chat")
async def pixel_agent_chat(agent_id: str, body: dict):
    """Run a chat action through a pixel agent.

    Maps the agent to its persona and forwards to the existing
    OpenClaw chat pipeline. Returns a JSON response (non-streaming).
    """
    agent = next((a for a in PIXEL_AGENTS_REGISTRY if a["id"] == agent_id), None)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    message = body.get("message", "")
    mode = body.get("mode", "fast")
    conversation_history = body.get("conversation_history", [])
    auto_route = body.get("auto_route", True)
    requested_persona = body.get("persona", "auto")

    # Use agent default unless auto-routing is requested
    if auto_route and requested_persona in ("auto", ""):
        persona, mode = detect_persona_and_mode(message)
    else:
        persona = requested_persona if requested_persona in ("concierge", "analyst") else agent.get("mode", "concierge")
        mode = mode if mode in ("fast", "deep", "report") else "fast"

    # Build request matching OpenClawChatRequest shape
    from pydantic import BaseModel

    class _ChatReq(BaseModel):
        message: str
        mode: str = "fast"
        persona: str = "concierge"
        conversation_history: list = []
        context: dict = None

    req = _ChatReq(
        message=message,
        mode=mode,
        persona=persona,
        conversation_history=conversation_history,
        context=body.get("context"),
    )

    # Reuse the non-streaming chat handler
    response = await openclaw_chat(req)
    return {
        "agent_id": agent_id,
        "agent_name": agent["name"],
        "persona": persona,
        "response": response.get("response", ""),
        "actions": response.get("actions", []),
        "metadata": {**response.get("metadata", {}), "auto_routed": auto_route and requested_persona in ("auto", "")},
    }


# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 BigDataClaw NERVE API Server")
    print("=" * 60)
    print("\n📡 Endpoints:")
    print("   GET  /api/health                - Health check")
    print("   GET  /api/info                  - System info")
    print("   GET  /api/recruiters            - List recruiters (paginated)")
    print("   GET  /api/recruiters/stats      - Recruiter statistics")
    print("   GET  /api/brokerages            - List brokerages")
    print("   GET  /api/brokerages/stats      - Brokerage statistics")
    print("   GET  /api/dbeaver/brokerages    - DBeaver brokerages (3,884)")
    print("   GET  /api/dbeaver/stats         - DBeaver statistics")
    print("   GET  /api/lenders               - List lenders (paginated)")
    print("   GET  /api/lenders/stats         - Lender statistics")
    print("\n🤖 Agent Workspace Endpoints:")
    print("   GET  /api/agents/workspaces          - List agent workspaces")
    print("   GET  /api/agents/workspaces/{id}     - Get agent workspace")
    print("   GET  /api/agents/workspaces/{id}/tasks      - Get agent tasks")
    print("   POST /api/agents/workspaces/{id}/tasks      - Create task")
    print("   GET  /api/agents/workspaces/{id}/memory     - Get agent memory")
    print("   GET  /api/agents/workspaces/{id}/conversations  - Get conversations")
    print("   GET  /api/agents/commanders          - List commanders")
    print("   GET  /api/agents/commanders/{id}/dashboard  - Commander dashboard")
    print("\n📝 Obsidian Integration (READ ONLY):")
    print("   GET  /api/obsidian/status        - Vault connection status")
    print("   GET  /api/obsidian/files         - List files with filters")
    print("   GET  /api/obsidian/files/{path}  - Get file content (read)")
    print("   POST /api/obsidian/search        - Search vault (read)")
    print("   GET  /api/obsidian/folders       - List folders (read)")
    print("\n🧠 Gemma 4 CEO Assistant:")
    print("   GET  /api/gemma4/status              - Assistant status")
    print("   POST /api/gemma4/chat                - Chat with Gemma 4")
    print("   POST /api/gemma4/analyze-property    - Property analysis with satellite")
    print("   GET  /api/gemma4/satellite           - Satellite imagery")
    print("   POST /api/gemma4/upload-document     - Document upload & analysis")
    print("\n🎤 Voice Interface:")
    print("   POST /api/gemma4/voice/start         - Start voice session")
    print("   POST /api/gemma4/voice/{id}/audio    - Send audio chunk")
    print("   POST /api/gemma4/voice/{id}/text     - Send text command")
    print("   POST /api/gemma4/voice/{id}/end      - End voice session")
    print("\n📰 Daily Briefing:")
    print("   GET  /api/gemma4/briefing/today      - Generate today's briefing")
    print("   GET  /api/gemma4/briefing/markdown   - Get briefing as markdown")
    print("   POST /api/gemma4/briefing/schedule   - Schedule automated briefings")
    print("\n   ⚠️  WRITE OPERATIONS DISABLED")
    print("   Use separate BDAIV2 Writer project for vault modifications")
    uvicorn.run(app, host="0.0.0.0", port=8000)
# ============================================================================
# BUYER INTELLIGENCE REPORT — Property-to-Buyer Matching Engine
# ============================================================================

class BuyerIntelligenceRequest(BaseModel):
    property_type: str = ""           # Office, Industrial, Retail, Multifamily, etc.
    address: str = ""
    city: str = ""
    province: str = "ON"
    size_sqft: int = 0
    price: int = 0
    net_income: int = 0
    cap_rate: float = 0.0
    description: str = ""
    target_count: int = 25            # not limited to 10


def _generate_quick_links(name: str, domain: str = "", city: str = "", property: str = "") -> dict:
    """Generate outreach quick links for a company or person."""
    q = name.replace(" ", "+")
    city_q = city.replace(" ", "+") if city else ""
    # Recent deal: exact property address search if available, else name + city
    if property:
        prop_q = property.replace(" ", "+").replace("\\n", " ")
        recent_deal_url = f"https://www.google.com/search?q={prop_q}+{city_q}+real+estate" if city_q else f"https://www.google.com/search?q={prop_q}+real+estate"
    else:
        recent_deal_url = f"https://www.google.com/search?q={q}+{city_q}+recent+deal+property" if city_q else f"https://www.google.com/search?q={q}+recent+deal+property"
    return {
        "google": f"https://www.google.com/search?q={q}",
        "contact_page": f"https://www.google.com/search?q={q}+contact",
        "linkedin": f"https://www.google.com/search?q={q}+linkedin",
        "linkedin_president": f"https://www.google.com/search?q={q}+President+OR+CEO+linkedin",
        "facebook": f"https://www.google.com/search?q={q}+facebook",
        "instagram": f"https://www.google.com/search?q={q}+instagram",
        "twitter": f"https://www.google.com/search?q={q}+twitter+OR+x.com",
        "news": f"https://www.google.com/search?q={q}+real+estate&tbm=nws",
        "key_people": f"https://www.google.com/search?q={q}+CEO+OR+President+real+estate",
        "website": f"https://{domain}" if domain else "",
        "recent_deal": recent_deal_url,
        "cre_google": f"https://www.google.com/search?q={q}+commercial+real+estate",
        "cre_listings": f"https://www.google.com/search?q={q}+properties+for+sale+lease",
        "google_maps": f"https://www.google.com/maps/search/{q}+{city_q}" if city_q else "",
    }


def _rv(row: sqlite3.Row, key: str, default=None):
    """Safe value extractor for sqlite3.Row (does not support .get())."""
    try:
        val = row[key]
        return default if val is None else val
    except (KeyError, IndexError):
        return default


def _score_buyer_v1(row: sqlite3.Row, req: BuyerIntelligenceRequest, enriched: dict = None) -> dict:
    """
    V1 Buyer Scoring Engine — 7 factors, 0–100 scale.
    Returns {"total": float, "breakdown": dict}
    """
    score = 0.0
    breakdown = {}
    cash = _rv(row, "cash_amount", 0)
    price = req.price
    days = _rv(row, "days_ago")
    row_asset = (_rv(row, "asset_class") or _rv(row, "property_type") or "").lower()
    req_asset = req.property_type.lower()
    row_loc = (_rv(row, "location") or _rv(row, "city") or "").lower()
    req_loc = req.city.lower()

    # 1. Asset Match (max 20)
    asset_score = 0
    if req_asset and req_asset in row_asset:
        asset_score = 20
    elif row_asset and any(word in row_asset for word in req_asset.split()):
        asset_score = 12
    elif row_asset == "unknown":
        asset_score = 5
    else:
        asset_score = 2
    score += asset_score
    breakdown["asset_match"] = asset_score

    # 2. Location Match (max 15)
    loc_score = 0
    if req_loc and req_loc in row_loc:
        loc_score = 15
    elif req_loc and any(word in row_loc for word in req_loc.split()):
        loc_score = 8
    elif req.province.lower() and req.province.lower() in row_loc:
        loc_score = 5
    else:
        loc_score = 2
    score += loc_score
    breakdown["location_match"] = loc_score

    # 3. Size / Price Fit (max 15)
    price_score = 0
    if cash and price:
        ratio = cash / price if price > 0 else 0
        if ratio >= 1.5:
            price_score = 15
        elif ratio >= 0.8:
            price_score = 12
        elif ratio >= 0.5:
            price_score = 9
        elif ratio >= 0.2:
            price_score = 5
        else:
            price_score = 2
    elif cash and cash > 5000000:
        price_score = 10
    elif cash and cash > 1000000:
        price_score = 6
    elif cash and cash > 100000:
        price_score = 3
    else:
        price_score = 1
    score += price_score
    breakdown["size_price_fit"] = price_score

    # 4. Recent Activity (max 15)
    activity_score = 0
    if days is not None:
        if days <= 30:
            activity_score = 15
        elif days <= 90:
            activity_score = 12
        elif days <= 180:
            activity_score = 8
        elif days <= 365:
            activity_score = 5
        else:
            activity_score = 2
    else:
        activity_score = 3
    score += activity_score
    breakdown["recent_activity"] = activity_score

    # 5. Capital Signal (max 15)
    capital_score = 0
    if cash and cash >= price * 1.5:
        capital_score = 15
    elif cash and cash >= price:
        capital_score = 12
    elif cash and cash >= price * 0.5:
        capital_score = 9
    elif cash and cash > 5000000:
        capital_score = 7
    elif cash and cash > 1000000:
        capital_score = 4
    else:
        capital_score = 2
    score += capital_score
    breakdown["capital_signal"] = capital_score

    # 6. Strategy Fit (max 10)
    strategy_score = 0
    if enriched:
        profile = enriched.get("buyer_seller_intel", {})
        buyer_prof = (profile.get("buyer_profile") or "").lower()
        deal_rationale = (profile.get("deal_rationale") or "").lower()
        if any(k in buyer_prof for k in ["investor", "developer", "acquisition", "expand"]):
            strategy_score += 5
        if any(k in deal_rationale for k in ["strategic", "portfolio", "expand", "acquisition", "redevelop"]):
            strategy_score += 5
    if strategy_score == 0:
        strategy_score = 3
    score += strategy_score
    breakdown["strategy_fit"] = strategy_score

    # 7. Contactability (max 10)
    contact_score = 0
    has_web = bool(_rv(row, "website") or _rv(row, "domain"))
    has_li = bool(_rv(row, "linkedin_url") or _rv(row, "linkedin"))
    has_email = bool(_rv(row, "email"))
    has_phone = bool(_rv(row, "phone"))
    if has_web:
        contact_score += 3
    if has_li:
        contact_score += 3
    if has_email:
        contact_score += 2
    if has_phone:
        contact_score += 2
    if contact_score == 0:
        contact_score = 2
    score += contact_score
    breakdown["contactability"] = contact_score

    return {"total": round(min(score, 100), 1), "breakdown": breakdown}


def _build_buyer_reason_signal(row: sqlite3.Row, scored: dict, enriched: dict = None) -> dict:
    """
    Synthesize a signal-based 'Why This Buyer' narrative from scoring data.
    Returns {"buyer_reason_signal": str, "reason_signals": dict}
    """
    breakdown = scored.get("breakdown", {})
    cash = _rv(row, "cash_amount", 0)
    days = _rv(row, "days_ago")
    asset = _rv(row, "asset_class") or _rv(row, "property_type") or ""
    location = _rv(row, "location") or _rv(row, "city") or _rv(row, "address") or ""
    entity = _rv(row, "entity") or _rv(row, "company_name") or _rv(row, "buyer_name") or ""
    sale_prop = _rv(row, "property") or ""

    signals = []
    reason_struct = {
        "capital_event": None,
        "asset_match": None,
        "geographic_match": None,
        "activity_signal": None,
    }

    # Capital signal
    capital_score = breakdown.get("capital_signal", 0)
    price_score = breakdown.get("size_price_fit", 0)
    if capital_score >= 12 and cash:
        cash_m = cash / 1_000_000
        signals.append(f"{entity} has ${cash_m:.1f}M in deployable capital — strong capacity match for this deal size.")
        reason_struct["capital_event"] = f"${cash_m:.1f}M deployable capital"
    elif cash and cash > 5_000_000:
        cash_m = cash / 1_000_000
        signals.append(f"Recorded ${cash_m:.1f}M cash position indicates acquisition capacity.")
        reason_struct["capital_event"] = f"${cash_m:.1f}M cash position"

    # Activity / recency signal
    activity_score = breakdown.get("recent_activity", 0)
    if activity_score >= 12 and days is not None and days <= 90:
        if sale_prop:
            signals.append(f"Recently sold {sale_prop} {days} days ago — likely redeploying capital now.")
            reason_struct["activity_signal"] = f"Sold {sale_prop} {days}d ago"
        else:
            signals.append(f"Active {days} days ago — fresh capital event suggests redeployment window.")
            reason_struct["activity_signal"] = f"Active {days}d ago"
    elif activity_score >= 8 and days is not None and days <= 180:
        signals.append(f"Market activity within last {days} days — capital may be seeking next placement.")
        reason_struct["activity_signal"] = f"Active {days}d ago"

    # Asset match signal
    asset_score = breakdown.get("asset_match", 0)
    if asset_score >= 15 and asset:
        signals.append(f"Proven {asset} investor — direct asset-class alignment with subject property.")
        reason_struct["asset_match"] = f"{asset} focus"
    elif asset_score >= 8 and asset:
        signals.append(f"Related asset experience in {asset} — transferable execution capability.")
        reason_struct["asset_match"] = f"{asset} experience"

    # Geographic match signal
    loc_score = breakdown.get("location_match", 0)
    if loc_score >= 12 and location:
        signals.append(f"Established presence in {location} — local market knowledge reduces execution risk.")
        reason_struct["geographic_match"] = f"Active in {location}"
    elif loc_score >= 5 and location:
        signals.append(f"Geographic proximity to {location} — familiar submarket.")
        reason_struct["geographic_match"] = f"Near {location}"

    # Strategy fit from enrichment
    strategy_score = breakdown.get("strategy_fit", 0)
    if strategy_score >= 8 and enriched:
        profile = enriched.get("buyer_seller_intel", {})
        rationale = profile.get("deal_rationale") or ""
        if rationale:
            signals.append(f"Strategic profile indicates {rationale.lower()}.")

    # Fallback: never return empty
    if not signals:
        total = scored.get("total", 0)
        if total >= 70:
            signals.append(f"High composite fit score ({total}) across multiple factors — qualified buyer profile.")
        elif total >= 50:
            signals.append(f"Moderate fit score ({total}) with identifiable alignment — worth verification.")
        else:
            signals.append(f"Initial match score {total} — limited signal clarity, verify before outreach.")
        reason_struct["activity_signal"] = f"Composite score {total}"

    # Trim to 1–3 strongest signals for conciseness
    selected = signals[:3]
    buyer_reason_signal = " ".join(selected)

    return {
        "buyer_reason_signal": buyer_reason_signal,
        "reason_signals": reason_struct,
    }


def _score_lender_match(row: sqlite3.Row, req: BuyerIntelligenceRequest) -> float:
    """Score lender relevance."""
    score = 0.0
    specs = (_rv(row, "asset_specializations") or "").lower()
    req_type = req.property_type.lower()

    if req_type and req_type in specs:
        score += 40
    elif any(word in specs for word in [req_type, "commercial", "all asset types", "mixed-use", "development"]):
        score += 25
    else:
        # All lenders can potentially finance anything — small base score
        score += 10

    # Location
    lender_city = (_rv(row, "city") or "").lower()
    if req.city.lower() and req.city.lower() in lender_city:
        score += 20
    elif req.province.lower() and req.province.lower() in lender_city:
        score += 10

    # Loan size capability hint
    loan = _rv(row, "loan_principal", 0)
    if loan and req.price:
        if loan >= req.price * 0.6:
            score += 20
        elif loan >= req.price * 0.3:
            score += 10

    # Base score for being a lender
    if _rv(row, "name"):
        score += 5

    return score


def _score_agent_match(row: sqlite3.Row, req: BuyerIntelligenceRequest) -> float:
    """Score commercial agent/broker relevance."""
    score = 0.0

    # Asset class match from broker's transactions or specialization
    asset = (_rv(row, "asset_class") or "").lower()
    req_type = req.property_type.lower()
    if req_type and req_type in asset:
        score += 30

    # Location match
    agent_city = (_rv(row, "city") or _rv(row, "region") or "").lower()
    if req.city.lower() and req.city.lower() in agent_city:
        score += 30

    # Recent deal volume/size
    recent_price = _rv(row, "sale_price", 0)
    if recent_price and req.price:
        if recent_price >= req.price * 0.5:
            score += 20

    # Reachability bonus
    if _rv(row, "email") or _rv(row, "phone"):
        score += 10

    return score


@app.post("/api/buyer-intelligence")
def buyer_intelligence(request: BuyerIntelligenceRequest):
    """
    V1 Buyer Intelligence & Outreach Pack.
    Turns property details into a ranked, actionable list of who to call,
    why they'll buy, and how to reach them — with quick links and tiers.
    """
    db_path = Path(os.getenv("BIGDATACLAW_DB", "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/bigdataclaw.db"))
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row

    try:
        cursor = conn.cursor()
        req_asset = request.property_type.lower()
        req_city = request.city.lower()
        req_province = request.province.lower()

        # ---------- 1. HOT MONEY LEADS (ranked buyers) ----------
        hot_leads = []
        try:
            cursor.execute("""
                SELECT id, entity, cash_amount, sale_date, location, property,
                       property_type, asset_class, address, days_ago,
                       buyer_name, broker_name, lender_name, listing_url,
                       loan_principal, interest_rate, enriched_data
                FROM hot_money_leads
            """)
            for row in cursor.fetchall():
                enriched = {}
                try:
                    enriched = json.loads(row["enriched_data"] or "{}")
                except Exception:
                    pass
                scored = _score_buyer_v1(row, request, enriched)
                if scored["total"] >= 25:
                    reason_data = _build_buyer_reason_signal(row, scored, enriched)
                    hot_leads.append({
                        "type": "hot_money_buyer",
                        "name": row["entity"] or row["buyer_name"] or "Unknown",
                        "cash_amount": row["cash_amount"],
                        "sale_date": row["sale_date"],
                        "location": row["location"] or row["address"],
                        "property": row["property"],
                        "asset_class": row["asset_class"],
                        "days_ago": row["days_ago"],
                        "lender_name": row["lender_name"],
                        "broker_name": row["broker_name"],
                        "listing_url": row["listing_url"],
                        "interest_rate": row["interest_rate"],
                        "enriched": enriched,
                        "score": scored["total"],
                        "score_breakdown": scored["breakdown"],
                        "buyer_reason_signal": reason_data["buyer_reason_signal"],
                        "reason_signals": reason_data["reason_signals"],
                        "quick_links": _generate_quick_links(
                            row["entity"] or row["buyer_name"] or "",
                            "",
                            row["location"] or "",
                            row["property"] or row["address"] or ""
                        ),
                    })
        except Exception as e:
            print(f"[buyer-intelligence] hot_money query error: {e}")

        # ---------- 2. REGISTERED BUYERS ----------
        registered_buyers = []
        try:
            cursor.execute("""
                SELECT id, company_name, contact_name, contact_title,
                       email, phone, website, linkedin_url, asset_class
                FROM buyers
            """)
            for row in cursor.fetchall():
                scored = _score_buyer_v1(row, request)
                if scored["total"] >= 25:
                    domain = ""
                    if row["website"]:
                        domain = row["website"].replace("https://", "").replace("http://", "").split("/")[0]
                    reason_data = _build_buyer_reason_signal(row, scored)
                    registered_buyers.append({
                        "type": "registered_buyer",
                        "name": row["company_name"] or row["contact_name"] or "Unknown",
                        "contact": row["contact_name"],
                        "title": row["contact_title"],
                        "email": row["email"],
                        "phone": row["phone"],
                        "website": row["website"],
                        "linkedin": row["linkedin_url"],
                        "asset_class": row["asset_class"],
                        "score": scored["total"],
                        "score_breakdown": scored["breakdown"],
                        "buyer_reason_signal": reason_data["buyer_reason_signal"],
                        "reason_signals": reason_data["reason_signals"],
                        "quick_links": _generate_quick_links(
                            row["company_name"] or row["contact_name"] or "",
                            domain,
                            ""
                        ),
                    })
        except Exception as e:
            print(f"[buyer-intelligence] buyers query error: {e}")

        # ---------- 3. SELLERS WITH CAPITAL (1031 / reinvestment) ----------
        sellers_with_capital = []
        try:
            cursor.execute("""
                SELECT id, company_name, contact_name, contact_title,
                       email, phone, website, linkedin_url, city
                FROM sellers
            """)
            for row in cursor.fetchall():
                score = 0.0
                seller_city = (row["city"] or "").lower()
                if req_city and req_city in seller_city:
                    score += 25
                if req_province and req_province in seller_city:
                    score += 10
                if row["email"] or row["phone"]:
                    score += 10
                if row["website"] or row["linkedin_url"]:
                    score += 5
                # Base score for being a seller
                score += 5

                if score >= 15:
                    domain = ""
                    if row["website"]:
                        domain = row["website"].replace("https://", "").replace("http://", "").split("/")[0]
                    sellers_with_capital.append({
                        "type": "seller_with_capital",
                        "name": row["company_name"] or row["contact_name"] or "Unknown",
                        "contact": row["contact_name"],
                        "title": row["contact_title"],
                        "email": row["email"],
                        "phone": row["phone"],
                        "website": row["website"],
                        "linkedin": row["linkedin_url"],
                        "city": row["city"],
                        "score": round(score, 1),
                        "redeploy_probability": "HIGH" if score >= 35 else "MEDIUM" if score >= 25 else "LOW",
                        "notes": "Recently sold; potential 1031 exchange or portfolio reinvestment candidate. Fresh capital.",
                        "quick_links": _generate_quick_links(
                            row["company_name"] or row["contact_name"] or "",
                            domain,
                            row["city"] or ""
                        ),
                    })
        except Exception as e:
            print(f"[buyer-intelligence] sellers query error: {e}")

        # ---------- 4. LENDERS ----------
        matched_lenders = []
        try:
            cursor.execute("""
                SELECT id, name, domain, linkedin, city, lender_type, asset_specializations
                FROM lenders
            """)
            for row in cursor.fetchall():
                score = _score_lender_match(row, request)
                if score >= 5:
                    matched_lenders.append({
                        "type": "lender",
                        "name": row["name"],
                        "lender_type": row["lender_type"],
                        "asset_specializations": row["asset_specializations"],
                        "city": row["city"],
                        "domain": row["domain"],
                        "linkedin": row["linkedin"],
                        "score": round(score, 1),
                        "quick_links": _generate_quick_links(
                            row["name"] or "",
                            row["domain"] or "",
                            row["city"] or ""
                        ),
                    })
        except Exception as e:
            print(f"[buyer-intelligence] lenders query error: {e}")

        # ---------- 5. COMMERCIAL AGENTS / BROKERS ----------
        matched_agents = []
        try:
            cursor.execute("""
                SELECT b.id, b.full_name, b.role, b.email, b.phone,
                       br.name AS brokerage_name, br.city, br.region
                FROM dbeaver_brokers b
                LEFT JOIN dbeaver_brokerages br ON b.brokerage_id = br.id
            """)
            for row in cursor.fetchall():
                score = _score_agent_match(row, request)
                if score >= 5:
                    matched_agents.append({
                        "type": "commercial_agent",
                        "name": row["full_name"],
                        "role": row["role"],
                        "email": row["email"],
                        "phone": row["phone"],
                        "brokerage": row["brokerage_name"],
                        "city": row["city"],
                        "region": row["region"],
                        "score": round(score, 1),
                        "quick_links": _generate_quick_links(
                            row["full_name"] or "",
                            "",
                            row["city"] or ""
                        ),
                    })
        except Exception as e:
            print(f"[buyer-intelligence] agents query error: {e}")

        # ---------- 6. SIMILAR RECENT TRANSACTIONS ----------
        similar_deals = []
        try:
            price_min = int(request.price * 0.3) if request.price else 0
            price_max = int(request.price * 3.0) if request.price else 999999999
            cursor.execute("""
                SELECT address, city, region, sale_date, sale_price,
                       asset_class, site_description, acreage, consideration
                FROM transactions_full
                WHERE asset_class IS NOT NULL
                  AND sale_price BETWEEN ? AND ?
                ORDER BY sale_date DESC
                LIMIT 50
            """, (price_min, price_max))
            for row in cursor.fetchall():
                deal_city = (row["city"] or row["region"] or "").lower()
                score = 0.0
                if req_city and req_city in deal_city:
                    score += 30
                row_asset = (row["asset_class"] or "").lower()
                if req_asset and req_asset in row_asset:
                    score += 20
                if request.price and row["sale_price"]:
                    ratio = row["sale_price"] / request.price if request.price > 0 else 0
                    if 0.5 <= ratio <= 2.0:
                        score += 20
                    elif 0.2 <= ratio <= 5.0:
                        score += 10

                if score >= 20:
                    similar_deals.append({
                        "type": "comparable_deal",
                        "address": row["address"],
                        "city": row["city"],
                        "region": row["region"],
                        "sale_date": row["sale_date"],
                        "sale_price": row["sale_price"],
                        "asset_class": row["asset_class"],
                        "description": row["site_description"],
                        "acreage": row["acreage"],
                        "consideration": row["consideration"],
                        "score": round(score, 1),
                    })
        except Exception as e:
            print(f"[buyer-intelligence] transactions query error: {e}")

        # ---------- RANK & COMBINE ----------
        all_buyers = hot_leads + registered_buyers
        all_buyers.sort(key=lambda x: x["score"], reverse=True)

        sellers_with_capital.sort(key=lambda x: x["score"], reverse=True)
        matched_lenders.sort(key=lambda x: x["score"], reverse=True)
        matched_agents.sort(key=lambda x: x["score"], reverse=True)
        similar_deals.sort(key=lambda x: x["score"], reverse=True)

        # Build tiered outreach list
        def _tier(score):
            if score >= 75:
                return "Tier 1 (Call NOW)"
            elif score >= 55:
                return "Tier 2 (Email + Feature Sheet)"
            else:
                return "Tier 3 (Broker Network / Research)"

        priority_outreach = []
        for b in all_buyers[:50]:
            priority_outreach.append({
                "name": b["name"],
                "score": b["score"],
                "tier": _tier(b["score"]),
                "type": b["type"],
            })
        for s in sellers_with_capital[:30]:
            priority_outreach.append({
                "name": s["name"],
                "score": s["score"],
                "tier": _tier(s["score"]),
                "type": s["type"],
            })
        priority_outreach.sort(key=lambda x: x["score"], reverse=True)

        # Build summary stats
        total_buyer_capacity = sum(b.get("cash_amount", 0) or 0 for b in hot_leads)

        return {
            "subject_property": {
                "property_type": request.property_type,
                "address": request.address,
                "city": request.city,
                "province": request.province,
                "size_sqft": request.size_sqft,
                "price": request.price,
                "net_income": request.net_income,
                "cap_rate": request.cap_rate,
                "description": request.description,
            },
            "summary": {
                "hot_money_buyers_found": len(hot_leads),
                "registered_buyers_found": len(registered_buyers),
                "sellers_with_capital_found": len(sellers_with_capital),
                "lenders_found": len(matched_lenders),
                "agents_found": len(matched_agents),
                "comparable_deals_found": len(similar_deals),
                "estimated_total_buyer_capacity": total_buyer_capacity,
            },
            "ranked_buyers": all_buyers[:request.target_count],
            "sellers_with_capital": sellers_with_capital[:request.target_count],
            "capable_lenders": matched_lenders[:request.target_count],
            "active_agents": matched_agents[:request.target_count],
            "comparable_deals": similar_deals[:20],
            "priority_outreach_list": priority_outreach[:30],
            "upsells": {
                "feature_sheet": {
                    "available": True,
                    "description": "Generate a branded property feature sheet webpage to share with selected buyers",
                    "endpoint": "/api/property-feature-sheet",
                },
                "teaser_email": {
                    "available": True,
                    "description": "Generate a teaser email with property highlights for blast distribution",
                    "endpoint": "/api/buyer-intelligence/teaser",
                },
                "outreach_package": {
                    "available": True,
                    "description": "Export this report as a PDF with all quick links and contact info",
                    "endpoint": "/api/buyer-intelligence/export",
                },
            },
        }
    finally:
        conn.close()


# ============================================================================
# PROPERTY FEATURE SHEET GENERATOR
# ============================================================================

import hashlib
from datetime import datetime

# In-memory store for V1 (persists until server restart)
# For production, migrate to SQLite table _feature_sheets
_FEATURE_SHEET_STORE = {}


class PropertyFeatureSheetRequest(BaseModel):
    property_type: str = ""
    address: str = ""
    city: str = ""
    province: str = "ON"
    size_sqft: int = 0
    price: int = 0
    net_income: int = 0
    cap_rate: float = 0.0
    occupancy: str = ""
    notes: str = ""
    # Broker info (optional, for contact card)
    broker_name: str = ""
    broker_company: str = "Mission Control Realty"
    broker_phone: str = ""
    broker_email: str = ""
    broker_photo: str = ""  # URL


def _generate_feature_sheet_id(req: PropertyFeatureSheetRequest) -> str:
    """Deterministic ID based on property + timestamp hash."""
    raw = f"{req.address}|{req.city}|{req.price}|{req.size_sqft}|{datetime.utcnow().isoformat()}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


def _fmt_currency(n: int) -> str:
    if n >= 1_000_000_000:
        return f"${n/1_000_000_000:.1f}B"
    if n >= 1_000_000:
        return f"${n/1_000_000:.1f}M"
    if n >= 1_000:
        return f"${n/1_000:,.0f}K"
    return f"${n:,.0f}"


def _fmt_number(n: int) -> str:
    if n >= 1_000_000:
        return f"{n/1_000_000:.1f}M"
    if n >= 1_000:
        return f"{n/1_000:,.0f}K"
    return f"{n:,.0f}"


def _build_feature_sheet_html(req: PropertyFeatureSheetRequest, sheet_id: str) -> str:
    """Build a standalone, shareable feature sheet HTML page."""
    price_psf = req.price / req.size_sqft if req.size_sqft else 0
    headline = f"{req.property_type or 'Commercial'} Investment — {req.city or 'Ontario'}"
    subhead = req.address or f"{req.city}, {req.province}"
    created = datetime.utcnow().strftime("%B %d, %Y")

    # Investment highlights derived from property data
    highlights = []
    if req.cap_rate and req.cap_rate >= 5.0:
        highlights.append(f"<strong>Strong {req.cap_rate}% Cap Rate</strong> — Above-market yield opportunity")
    elif req.cap_rate:
        highlights.append(f"<strong>{req.cap_rate}% Cap Rate</strong> — Stable income stream")
    if req.occupancy and req.occupancy.lower() in ["stabilized", "100%", "fully leased"]:
        highlights.append("<strong>Stabilized Asset</strong> — Fully leased with in-place cash flow")
    if req.size_sqft >= 50000:
        highlights.append(f"<strong>Scale</strong> — {_fmt_number(req.size_sqft)} SF institutional-grade footprint")
    if req.notes:
        # Extract first sentence as a highlight if it sounds like an investment thesis
        first_sent = req.notes.split(".")[0]
        if len(first_sent) > 10 and len(first_sent) < 120:
            highlights.append(f"<strong>Value Proposition</strong> — {first_sent}")
    if not highlights:
        highlights = [
            "<strong>Premium Location</strong> — Situated in a high-growth commercial corridor",
            "<strong>Income-Producing</strong> — Established tenant base with consistent NOI",
        ]

    highlights_html = "\n".join(f'<li>{h}</li>' for h in highlights[:4])

    broker_card = ""
    if req.broker_name or req.broker_company:
        broker_card = f"""
        <div class="broker-card">
            <div class="broker-photo">
                {f'<img src="{req.broker_photo}" alt="Broker">' if req.broker_photo else '<div class="broker-initials">' + (req.broker_name[:2].upper() if req.broker_name else 'MC') + '</div>'}
            </div>
            <div class="broker-info">
                <h3>{req.broker_name or 'Your Broker'}</h3>
                <p class="broker-company">{req.broker_company}</p>
                <div class="broker-contact">
                    {f'<a href="tel:{req.broker_phone}">{req.broker_phone}</a>' if req.broker_phone else ''}
                    {f'<a href="mailto:{req.broker_email}">{req.broker_email}</a>' if req.broker_email else ''}
                </div>
            </div>
        </div>
        """

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{headline} | Feature Sheet</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root {{
            --bg: #0f172a;
            --bg-card: #1e293b;
            --bg-elevated: #334155;
            --text: #f8fafc;
            --text-muted: #94a3b8;
            --accent: #0ea5e9;
            --accent-glow: rgba(14,165,233,0.15);
            --success: #22c55e;
            --border: rgba(148,163,184,0.15);
            --radius: 16px;
            --radius-sm: 10px;
        }}
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: var(--bg);
            color: var(--text);
            line-height: 1.6;
            min-height: 100vh;
        }}
        .container {{
            max-width: 900px;
            margin: 0 auto;
            padding: 40px 24px;
        }}
        .sheet-header {{
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 32px;
            border-bottom: 1px solid var(--border);
        }}
        .badge {{
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 14px;
            background: var(--accent-glow);
            border: 1px solid rgba(14,165,233,0.25);
            border-radius: 100px;
            font-size: 12px;
            font-weight: 600;
            color: var(--accent);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 16px;
        }}
        .sheet-header h1 {{
            font-size: 32px;
            font-weight: 800;
            line-height: 1.15;
            margin-bottom: 8px;
            letter-spacing: -0.02em;
        }}
        .sheet-header .subhead {{
            font-size: 17px;
            color: var(--text-muted);
            font-weight: 500;
        }}
        .hero-metrics {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 16px;
            margin-bottom: 40px;
        }}
        .metric {{
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            padding: 20px;
            text-align: center;
            transition: transform 0.15s, border-color 0.15s;
        }}
        .metric:hover {{
            transform: translateY(-2px);
            border-color: rgba(14,165,233,0.3);
        }}
        .metric-value {{
            font-size: 22px;
            font-weight: 700;
            color: var(--text);
            margin-bottom: 4px;
        }}
        .metric-label {{
            font-size: 12px;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.06em;
            font-weight: 600;
        }}
        .section {{
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 28px;
            margin-bottom: 24px;
        }}
        .section h2 {{
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 10px;
        }}
        .section h2 .icon {{
            width: 28px;
            height: 28px;
            background: var(--accent-glow);
            border-radius: 8px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
        }}
        .highlights {{
            list-style: none;
        }}
        .highlights li {{
            padding: 12px 0;
            border-bottom: 1px solid var(--border);
            font-size: 15px;
            line-height: 1.55;
        }}
        .highlights li:last-child {{ border-bottom: none; }}
        .highlights li::before {{
            content: "✓";
            color: var(--success);
            font-weight: 700;
            margin-right: 12px;
        }}
        .gallery {{
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
        }}
        .gallery .photo-placeholder {{
            aspect-ratio: 16/10;
            background: linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg) 100%);
            border-radius: var(--radius-sm);
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-muted);
            font-size: 13px;
            border: 1px dashed var(--border);
        }}
        .gallery .photo-placeholder.main {{
            grid-column: 1 / -1;
            aspect-ratio: 21/9;
        }}
        .cta-bar {{
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            justify-content: center;
            margin: 32px 0;
        }}
        .btn {{
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 14px 28px;
            border-radius: var(--radius-sm);
            font-size: 15px;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.15s;
            cursor: pointer;
            border: none;
        }}
        .btn-primary {{
            background: var(--accent);
            color: #fff;
        }}
        .btn-primary:hover {{ background: #0284c7; }}
        .btn-secondary {{
            background: var(--bg-elevated);
            color: var(--text);
            border: 1px solid var(--border);
        }}
        .btn-secondary:hover {{ background: #475569; }}
        .broker-card {{
            display: flex;
            align-items: center;
            gap: 20px;
            background: linear-gradient(135deg, rgba(14,165,233,0.08) 0%, transparent 100%);
            border: 1px solid rgba(14,165,233,0.15);
            border-radius: var(--radius);
            padding: 24px;
        }}
        .broker-photo {{
            width: 72px;
            height: 72px;
            border-radius: 50%;
            overflow: hidden;
            flex-shrink: 0;
            background: var(--bg-elevated);
            display: flex;
            align-items: center;
            justify-content: center;
        }}
        .broker-photo img {{ width: 100%; height: 100%; object-fit: cover; }}
        .broker-initials {{
            font-size: 24px;
            font-weight: 700;
            color: var(--accent);
        }}
        .broker-info h3 {{
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 2px;
        }}
        .broker-company {{
            font-size: 14px;
            color: var(--text-muted);
            margin-bottom: 10px;
        }}
        .broker-contact {{
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
        }}
        .broker-contact a {{
            color: var(--accent);
            text-decoration: none;
            font-size: 14px;
            font-weight: 500;
        }}
        .broker-contact a:hover {{ text-decoration: underline; }}
        .footer {{
            text-align: center;
            padding: 32px;
            color: var(--text-muted);
            font-size: 12px;
            border-top: 1px solid var(--border);
            margin-top: 8px;
        }}
        .footer-brand {{
            font-weight: 700;
            color: var(--text);
            margin-bottom: 4px;
        }}
        @media print {{
            body {{ background: #fff; color: #111; }}
            .container {{ max-width: 100%; padding: 20px; }}
            .metric, .section {{ border: 1px solid #ddd; background: #fafafa; }}
            .btn {{ display: none; }}
            .footer {{ border-color: #ddd; }}
        }}
        @media (max-width: 600px) {{
            .sheet-header h1 {{ font-size: 24px; }}
            .hero-metrics {{ grid-template-columns: repeat(2, 1fr); }}
            .gallery {{ grid-template-columns: 1fr; }}
            .broker-card {{ flex-direction: column; text-align: center; }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="sheet-header">
            <div class="badge">Exclusive Offering</div>
            <h1>{headline}</h1>
            <p class="subhead">{subhead}</p>
        </div>

        <div class="hero-metrics">
            <div class="metric">
                <div class="metric-value">{_fmt_currency(req.price)}</div>
                <div class="metric-label">Asking Price</div>
            </div>
            <div class="metric">
                <div class="metric-value">{req.cap_rate}%</div>
                <div class="metric-label">Cap Rate</div>
            </div>
            <div class="metric">
                <div class="metric-value">{_fmt_currency(req.net_income)}</div>
                <div class="metric-label">NOI</div>
            </div>
            <div class="metric">
                <div class="metric-value">{_fmt_number(req.size_sqft)} SF</div>
                <div class="metric-label">Building Size</div>
            </div>
            <div class="metric">
                <div class="metric-value">${price_psf:.0f}</div>
                <div class="metric-label">Price / SF</div>
            </div>
            <div class="metric">
                <div class="metric-value">{req.occupancy or 'N/A'}</div>
                <div class="metric-label">Occupancy</div>
            </div>
        </div>

        <div class="section">
            <h2><span class="icon">✦</span> Investment Highlights</h2>
            <ul class="highlights">
                {highlights_html}
            </ul>
        </div>

        <div class="section">
            <h2><span class="icon">📍</span> Location & Property</h2>
            <p style="color: var(--text-muted); font-size: 15px; line-height: 1.7;">
                {req.notes or 'Prime commercial real estate opportunity in a growing market corridor.'}
            </p>
        </div>

        <div class="section">
            <h2><span class="icon">🏢</span> Property Gallery</h2>
            <div class="gallery">
                <div class="photo-placeholder main">Main Exterior Photo</div>
                <div class="photo-placeholder">Interior / Lobby</div>
                <div class="photo-placeholder">Aerial / Site Plan</div>
                <div class="photo-placeholder">Floor Plan</div>
                <div class="photo-placeholder">Neighbourhood</div>
            </div>
            <p style="text-align: center; color: var(--text-muted); font-size: 12px; margin-top: 12px;">
                Professional photography and drone imagery available upon request.
            </p>
        </div>

        <div class="cta-bar">
            <a href="mailto:{req.broker_email or ''}?subject=RE: {headline}" class="btn btn-primary">📋 Request OM Package</a>
            <a href="mailto:{req.broker_email or ''}?subject=Site Visit: {headline}" class="btn btn-secondary">📅 Book a Tour</a>
            <a href="tel:{req.broker_phone or ''}" class="btn btn-secondary">📞 Call Broker</a>
        </div>

        {broker_card}

        <div class="footer">
            <div class="footer-brand">Mission Control</div>
            <p>Generated {created} · Sheet ID: {sheet_id}</p>
            <p style="margin-top: 4px; opacity: 0.7;">This feature sheet is for informational purposes only and does not constitute an offer.</p>
        </div>
    </div>
</body>
</html>"""
    return html


@app.post("/api/property-feature-sheet")
def create_property_feature_sheet(request: PropertyFeatureSheetRequest):
    """
    Generate a shareable property feature sheet webpage.
    Returns a unique URL that can be sent directly to buyers.
    """
    sheet_id = _generate_feature_sheet_id(request)
    html = _build_feature_sheet_html(request, sheet_id)

    _FEATURE_SHEET_STORE[sheet_id] = {
        "id": sheet_id,
        "created_at": datetime.utcnow().isoformat(),
        "property": request.model_dump(),
        "html": html,
    }

    # Also persist to SQLite for durability across restarts
    try:
        db_path = Path(os.getenv("BIGDATACLAW_DB", "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/bigdataclaw.db"))
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS feature_sheets (
                id TEXT PRIMARY KEY,
                created_at TEXT,
                property_json TEXT,
                html_content TEXT
            )
        """)
        cursor.execute("""
            INSERT OR REPLACE INTO feature_sheets (id, created_at, property_json, html_content)
            VALUES (?, ?, ?, ?)
        """, (sheet_id, datetime.utcnow().isoformat(), json.dumps(request.model_dump()), html))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[feature-sheet] DB persist warning: {e}")

    # Build absolute URL for sharing
    host = os.getenv("PUBLIC_HOST", "")
    if host:
        share_url = f"{host}/feature-sheet/{sheet_id}"
    else:
        share_url = f"/feature-sheet/{sheet_id}"

    return {
        "id": sheet_id,
        "url": share_url,
        "status": "ready",
        "created_at": _FEATURE_SHEET_STORE[sheet_id]["created_at"],
    }


@app.get("/feature-sheet/{sheet_id}")
def get_feature_sheet(sheet_id: str):
    """Serve a generated feature sheet as a standalone HTML page."""
    # 1. Check in-memory cache
    data = _FEATURE_SHEET_STORE.get(sheet_id)

    # 2. Fallback to SQLite
    if not data:
        try:
            db_path = Path(os.getenv("BIGDATACLAW_DB", "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/bigdataclaw.db"))
            conn = sqlite3.connect(str(db_path))
            cursor = conn.cursor()
            cursor.execute("SELECT html_content FROM feature_sheets WHERE id = ?", (sheet_id,))
            row = cursor.fetchone()
            conn.close()
            if row and row[0]:
                data = {"html": row[0]}
            else:
                raise HTTPException(status_code=404, detail="Feature sheet not found")
        except HTTPException:
            raise
        except Exception as e:
            print(f"[feature-sheet] DB fetch error: {e}")
            raise HTTPException(status_code=404, detail="Feature sheet not found")

    return HTMLResponse(content=data.get("html", "<h1>Feature Sheet Unavailable</h1>"), status_code=200)


# ============================================================================
# VOICE AGENT — Lightweight rules-based responder (no heavy AI)
# ============================================================================

class VoiceAgentRequest(BaseModel):
    message: str = ""
    history: List[Dict[str, Any]] = []

@app.post("/api/voice/agent")
def voice_agent(request: VoiceAgentRequest):
    """Fast rules-based voice agent — no ollama, no heavy processing."""
    text = request.message.lower().strip()
    response = ""
    actions = []

    # Navigation
    if any(k in text for k in ["hot money", "hotmoney"]):
        response = "Opening Hot Money Radar."
        actions.append({"type": "navigate", "route": "/hotmoney"})
    elif any(k in text for k in ["buyer intelligence", "buyer intel", "find buyer", "active buyer", "find active buyers"]):
        response = "Opening Buyer Intelligence."
        actions.append({"type": "navigate", "route": "/buyer-intelligence"})
    elif any(k in text for k in ["facebook intel", "facebook intelligence", "facebook leads", "new hot leads", "classify facebook"]):
        response = "Opening Facebook Intelligence."
        actions.append({"type": "navigate", "route": "/facebook-intelligence"})
    elif any(k in text for k in ["execution history", "what happened", "recent actions"]):
        response = "Opening Execution History."
        actions.append({"type": "navigate", "route": "/execution-history"})
    elif any(k in text for k in ["opportunities", "deals", "off market"]):
        response = "Opening Opportunities."
        actions.append({"type": "navigate", "route": "/opportunities"})
    elif any(k in text for k in ["network", "recruit agents", "commercial agents", "lenders", "builders"]):
        response = "Opening Network directory."
        actions.append({"type": "navigate", "route": "/network/recruiters"})
    elif any(k in text for k in ["mission control", "home", "dashboard"]):
        response = "Returning to Mission Control."
        actions.append({"type": "navigate", "route": "/"})

    # Stats / queries
    elif any(k in text for k in ["how many recruiter", "recruiter count", "agent count"]):
        response = "We have 96,265 recruiters in the network."
    elif any(k in text for k in ["how many buyer", "buyer count"]):
        response = "We have over 5,000 registered buyers and hot money leads tracked."
    elif any(k in text for k in ["how many hot money", "hot money count"]):
        response = "Hot Money Radar is tracking active sellers with fresh capital."
    elif any(k in text for k in ["how many facebook", "facebook count", "facebook leads count"]):
        try:
            conn = sqlite3.connect(str(_get_db_path()))
            c = conn.cursor()
            c.execute("SELECT COUNT(*) FROM facebook_leads")
            count = c.fetchone()[0]
            conn.close()
            response = f"Facebook Intelligence has {count} leads ingested."
        except:
            response = "Facebook Intelligence is active and ingesting leads."

    # Greetings
    elif any(k in text for k in ["hello", "hi", "hey", "good morning", "good evening"]):
        response = "Hello. I am Kimi, your Mission Control Voice Agent. I can navigate pages, show stats, and guide you through deals. What would you like to do?"
    elif any(k in text for k in ["who are you", "introduce yourself", "what are you"]):
        response = "I am Kimi, the Mission Control Voice Agent. I can speak, listen, query your real estate database, and navigate the dashboard on command."
    elif any(k in text for k in ["what can you do", "help", "commands"]):
        response = "You can ask me to navigate to any page, check stats like recruiter or buyer counts, or open Hot Money, Facebook Intel, or Buyer Intelligence. Try saying 'Show hot money' or 'Find active buyers'."

    # Time / date
    elif "time" in text:
        response = f"It is {datetime.now().strftime('%I:%M %p')}."
    elif any(k in text for k in ["date", "day today", "today"]):
        response = f"Today is {datetime.now().strftime('%A, %B %d, %Y')}."

    # Outreach / execution
    elif any(k in text for k in ["generate outreach", "outreach for buyer", "build outreach", "build an outreach", "outreach pack"]):
        response = "I can help with outreach. Navigate to Buyer Intelligence to generate feature sheets, teaser emails, and full outreach packs."
        actions.append({"type": "navigate", "route": "/buyer-intelligence"})
    elif any(k in text for k in ["strongest signal", "what signals", "deal source"]):
        response = "Check Hot Money Radar for capital signals and Facebook Intelligence for sourcing signals."
        actions.append({"type": "navigate", "route": "/hotmoney"})

    # Fallback
    else:
        response = f"I heard: '{request.message}'. I can navigate pages, show stats, or guide you to Hot Money, Buyer Intelligence, or Facebook Intel. Try saying 'Show hot money' or 'Find active buyers'."

    return {"response": response, "actions": actions}


# ============================================================================
# MAIN
# ============================================================================


# ============================================================================
# FACEBOOK INTELLIGENCE + LEAD CAPTURE LAYER
# ============================================================================

class FacebookClassifyRequest(BaseModel):
    post_text: str = ""
    post_url: str = ""  # optional link to the post
    group_name: str = ""  # which group it came from
    source: str = "facebook"  # facebook, marketplace, etc.


class FacebookLeadIngestRequest(BaseModel):
    name: str = ""
    company: str = ""
    location: str = ""
    asset_type: str = ""
    intent: str = ""  # buyer | seller | broker | noise
    urgency: str = ""  # high | medium | low
    signal_tags: List[str] = []
    post_text: str = ""
    facebook_profile: str = ""
    contact_available: bool = False
    contact_method: str = ""  # dm, comment, messenger, phone
    estimated_value: str = ""  # e.g. "$2M-$5M"
    notes: str = ""
    source: str = "facebook"
    group_name: str = ""
    post_url: str = ""
    user_id: str = ""


class FacebookLeadRouteRequest(BaseModel):
    lead_id: int = 0
    route_to: str = ""  # buyer_pipeline | deal_pipeline
    notes: str = ""
    user_id: str = ""


class FacebookActionRequest(BaseModel):
    lead_id: int = 0
    action: str = ""  # dm_sent, dm_replied, connected, qualified, archived
    channel: str = "facebook"
    notes: str = ""
    user_id: str = ""


# --- Signal Classification Engine ---

_FB_SELLER_SIGNALS = [
    "motivated seller", "must sell", "urgent sale", "vacant", "fixer upper",
    "portfolio sale", "fire sale", "distressed", "below market", "quick close",
    "cash only", "as-is", "handyman special", "estate sale", "liquidation",
    "offloading", "selling fast", "need gone", "price reduced", "reduced price",
    "assigning", "assignment", "wholesale", "wholesaling", "flip", "flipping",
    "tired landlord", "burnt out", "retiring", "moving", "relocating",
]

_FB_BUYER_SIGNALS = [
    "cash buyer", "looking to buy", "seeking", "in search of", "iso",
    "want to buy", "buying", "acquiring", "looking for", "interested in buying",
    "cash ready", "pre-approved", "proof of funds", "pof", "quick close",
    "can close fast", "closing quickly", "buying multifamily", "buying commercial",
]

_FB_BROKER_SIGNALS = [
    "representing", "listing agent", "broker", "realtor", "have a client",
    "buyer rep", "seller rep", "commercial broker", "investment sales",
]

_FB_URGENCY_SIGNALS = {
    "high": ["must sell", "urgent", "fire sale", "asap", "this week", "need gone", "cash only", "quick close", "motivated", "distressed"],
    "medium": ["selling", "looking to buy", "interested", "serious", "ready"],
    "low": ["curious", "thinking about", "maybe", "considering", "someday"],
}

_FB_ASSET_TYPE_MAP = {
    "multifamily": ["multifamily", "multi-family", "apartment", "rental", "plex", "triplex", "fourplex", "duplex"],
    "office": ["office", "commercial office", "class a", "class b"],
    "industrial": ["industrial", "warehouse", "distribution", "logistics", "manufacturing"],
    "retail": ["retail", "strip mall", "plaza", "shopping center", "storefront"],
    "hotel": ["hotel", "motel", "hospitality"],
    "land": ["land", "development site", "acre", "vacant land"],
    "mixed-use": ["mixed use", "mixed-use", "live work"],
}

_FB_LOCATION_HINTS = [
    "toronto", "mississauga", "brampton", "vaughan", "markham", "richmond hill",
    "oakville", "burlington", "hamilton", "kitchener", "waterloo", "london",
    "ottawa", "calgary", "edmonton", "vancouver", "montreal", "winnipeg",
    "ontario", "alberta", "bc", "british columbia", "gta", "greater toronto",
]


def _classify_facebook_post(text: str) -> dict:
    """Classify a Facebook post into structured lead data."""
    text_lower = text.lower()
    words = set(re.findall(r'\b\w+\b', text_lower))

    # Intent classification
    seller_score = sum(1 for s in _FB_SELLER_SIGNALS if s in text_lower)
    buyer_score = sum(1 for s in _FB_BUYER_SIGNALS if s in text_lower)
    broker_score = sum(1 for s in _FB_BROKER_SIGNALS if s in text_lower)

    if seller_score > buyer_score and seller_score > broker_score:
        intent = "seller"
    elif buyer_score > seller_score and buyer_score > broker_score:
        intent = "buyer"
    elif broker_score >= 1:
        intent = "broker"
    else:
        intent = "noise"

    # Urgency
    urgency = "low"
    for level, signals in _FB_URGENCY_SIGNALS.items():
        if any(s in text_lower for s in signals):
            urgency = level
            break

    # Signal tags
    signal_tags = []
    all_signals = _FB_SELLER_SIGNALS + _FB_BUYER_SIGNALS + _FB_BROKER_SIGNALS
    for signal in all_signals:
        if signal in text_lower:
            signal_tags.append(signal)
    signal_tags = list(dict.fromkeys(signal_tags))[:10]  # dedupe, max 10

    # Asset type detection
    asset_type = ""
    for atype, keywords in _FB_ASSET_TYPE_MAP.items():
        if any(kw in text_lower for kw in keywords):
            asset_type = atype
            break

    # Location detection
    location = ""
    for loc in _FB_LOCATION_HINTS:
        if loc in text_lower:
            location = loc.title()
            break

    # Contact availability heuristic
    contact_available = any(kw in text_lower for kw in ["dm me", "message me", "comment", "reach out", "contact", "call", "text", "email"])

    # Extract name heuristic (first capitalized word sequence before common terms)
    name = ""
    name_match = re.search(r'^([A-Z][a-zA-Z\s]{2,30})(?:\s+-\s+|\s*[:|•]|\n)', text.strip())
    if name_match:
        name = name_match.group(1).strip()

    # Estimated value heuristic
    value_patterns = [
        r'\$([\d,]+(?:\.\d+)?)\s*([mMkK]|million|thousand)\b',
        r'\$([\d,]+(?:\.\d+)?)\b',
        r'([\d,]+)\s*([mMkK]|million|thousand)\s*(?:dollars|usd)?\b',
    ]
    estimated_value = ""
    for pattern in value_patterns:
        m = re.search(pattern, text_lower)
        if m:
            num = m.group(1).replace(',', '')
            suffix = m.group(2) if len(m.groups()) > 1 and m.group(2) else ''
            if suffix.lower() in ['m', 'million']:
                estimated_value = f"${num}M"
            elif suffix.lower() in ['k', 'thousand']:
                estimated_value = f"${int(float(num))}K"
            else:
                val = float(num)
                if val >= 1_000_000:
                    estimated_value = f"${val/1_000_000:.1f}M"
                elif val >= 1000:
                    estimated_value = f"${val/1000:.0f}K"
                else:
                    estimated_value = f"${num}"
            break

    return {
        "intent": intent,
        "urgency": urgency,
        "signal_tags": signal_tags,
        "asset_type": asset_type,
        "location": location,
        "contact_available": contact_available,
        "name": name,
        "estimated_value": estimated_value,
        "confidence": max(seller_score, buyer_score, broker_score),
    }


def _score_facebook_lead(classification: dict) -> str:
    """Score a classified Facebook lead as HOT / WARM / COLD."""
    score = 0
    # Intent clarity
    if classification["intent"] in ("buyer", "seller"):
        score += 30
    elif classification["intent"] == "broker":
        score += 20

    # Urgency
    urgency_scores = {"high": 35, "medium": 20, "low": 5}
    score += urgency_scores.get(classification["urgency"], 0)

    # Signal density
    score += min(len(classification.get("signal_tags", [])), 5) * 5

    # Contact available
    if classification.get("contact_available"):
        score += 10

    # Asset type known
    if classification.get("asset_type"):
        score += 10

    # Location known
    if classification.get("location"):
        score += 10

    if score >= 70:
        return "HOT"
    elif score >= 40:
        return "WARM"
    return "COLD"


def _generate_facebook_dm(lead: dict, template_type: str = "initial") -> str:
    """Generate a Facebook DM personalized to the lead."""
    name = lead.get("name", "there")
    intent = lead.get("intent", "")
    asset_type = lead.get("asset_type", "")
    location = lead.get("location", "")
    signal_tags = lead.get("signal_tags", [])
    post_text = lead.get("post_text", "")

    # Extract a snippet from their post (first 80 chars)
    snippet = post_text[:80].strip() + "..." if len(post_text) > 80 else post_text

    if template_type == "initial":
        if intent == "seller":
            if asset_type:
                return f"Hey {name}, saw your post about the {asset_type} — looks like something we work with quite a bit. Happy to connect and share some insight if helpful."
            else:
                return f"Hey {name}, saw your post about your property — looks like something we work with quite a bit. Happy to connect and share some insight if helpful."
        elif intent == "buyer":
            if location:
                return f"Hey {name}, saw you're looking in {location} — we come across off-market deals there pretty regularly. Happy to share what we're seeing if useful."
            else:
                return f"Hey {name}, saw your post — we come across off-market deals pretty regularly. Happy to share what we're seeing if useful."
        else:
            return f"Hey {name}, saw your post — looks like we're active in similar circles. Would love to connect."

    elif template_type == "followup":
        if intent == "seller":
            return f"Hey {name}, just following up — still interested in learning more about your situation. No pressure, just here if helpful."
        elif intent == "buyer":
            return f"Hey {name}, wanted to follow up — any specific criteria you're targeting right now? We might have something coming up."
        else:
            return f"Hey {name}, just circling back. Would love to connect when you have a moment."

    elif template_type == "qualify":
        if intent == "seller":
            return f"Hey {name}, thanks for connecting. Quick question — are you looking for a quick close or maximizing price? Helps me understand how to best help."
        elif intent == "buyer":
            return f"Hey {name}, thanks for connecting. What asset class and size range are you most active in? We see a lot across Ontario."
        else:
            return f"Hey {name}, thanks for connecting. What kind of deals are you seeing most of right now?"

    return f"Hey {name}, saw your post — would love to connect."


def _ensure_facebook_tables(cursor):
    """Create Facebook leads and action log tables if they don't exist."""
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS facebook_leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at TEXT,
            updated_at TEXT,
            source TEXT DEFAULT 'facebook',
            group_name TEXT,
            post_url TEXT,
            name TEXT,
            company TEXT,
            location TEXT,
            asset_type TEXT,
            intent TEXT,
            urgency TEXT,
            score_tier TEXT,
            signal_tags TEXT,
            post_text TEXT,
            facebook_profile TEXT,
            contact_available INTEGER DEFAULT 0,
            contact_method TEXT,
            estimated_value TEXT,
            notes TEXT,
            status TEXT DEFAULT 'new',
            routed_to TEXT,
            routed_at TEXT,
            dm_sent INTEGER DEFAULT 0,
            dm_sent_at TEXT,
            dm_replied INTEGER DEFAULT 0,
            dm_replied_at TEXT,
            connected INTEGER DEFAULT 0,
            connected_at TEXT,
            qualified INTEGER DEFAULT 0,
            qualified_at TEXT,
            archived INTEGER DEFAULT 0,
            archived_at TEXT,
            user_id TEXT
        )
    """)
    # Migrate: add timestamp columns if missing
    cursor.execute("PRAGMA table_info(facebook_leads)")
    existing_cols = [r[1] for r in cursor.fetchall()]
    for col in ['dm_sent_at', 'dm_replied_at', 'connected_at', 'qualified_at', 'archived_at']:
        if col not in existing_cols:
            cursor.execute(f"ALTER TABLE facebook_leads ADD COLUMN {col} TEXT")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS facebook_actions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at TEXT,
            lead_id INTEGER,
            action TEXT,
            channel TEXT,
            notes TEXT,
            user_id TEXT
        )
    """)


@app.post("/api/facebook/classify")
def facebook_classify(request: FacebookClassifyRequest):
    """Classify a raw Facebook post into structured lead data."""
    try:
        classification = _classify_facebook_post(request.post_text)
        tier = _score_facebook_lead(classification)

        # Extract profile URL heuristic
        profile_url = ""
        url_match = re.search(r'https?://(?:www\.)?facebook\.com/[^\s]+', request.post_text)
        if url_match:
            profile_url = url_match.group(0)

        return {
            "classification": classification,
            "tier": tier,
            "profile_url": profile_url,
            "source": request.source,
            "group_name": request.group_name,
            "post_url": request.post_url,
            "ready_to_ingest": classification["intent"] in ("buyer", "seller", "broker") and classification["confidence"] >= 1,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/facebook/lead")
def facebook_ingest_lead(request: FacebookLeadIngestRequest):
    """Ingest a classified Facebook lead into the database."""
    try:
        db_path = _get_db_path()
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        _ensure_facebook_tables(cursor)

        # Auto-classify and score if not fully specified
        classification = _classify_facebook_post(request.post_text)
        intent = request.intent or classification["intent"]
        urgency = request.urgency if request.urgency else classification["urgency"]
        asset_type = request.asset_type or classification["asset_type"]
        location = request.location or classification["location"]
        contact_available = request.contact_available if request.contact_available else classification["contact_available"]
        estimated_value = request.estimated_value or classification["estimated_value"]
        name = request.name or classification["name"]

        tags = request.signal_tags or classification["signal_tags"]
        tier = _score_facebook_lead({
            "intent": intent, "urgency": urgency, "signal_tags": tags,
            "contact_available": contact_available, "asset_type": asset_type, "location": location
        })

        now = datetime.utcnow().isoformat()
        cursor.execute("""
            INSERT INTO facebook_leads (
                created_at, updated_at, source, group_name, post_url,
                name, company, location, asset_type, intent, urgency, score_tier,
                signal_tags, post_text, facebook_profile, contact_available,
                contact_method, estimated_value, notes, status, user_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            now, now, request.source, request.group_name, request.post_url,
            name, request.company, location, asset_type, intent, urgency, tier,
            json.dumps(tags), request.post_text, request.facebook_profile,
            1 if contact_available else 0, request.contact_method,
            estimated_value, request.notes, "new", request.user_id
        ))
        lead_id = cursor.lastrowid
        conn.commit()
        conn.close()

        return {
            "status": "ingested",
            "lead_id": lead_id,
            "tier": tier,
            "intent": intent,
            "urgency": urgency,
            "asset_type": asset_type,
            "location": location,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/facebook/leads")
def facebook_list_leads(
    intent: Optional[str] = Query(None),
    tier: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    asset_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(100),
    offset: int = Query(0),
):
    """List Facebook leads with optional filters."""
    try:
        db_path = _get_db_path()
        conn = sqlite3.connect(str(db_path))
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        _ensure_facebook_tables(cursor)

        where_parts = ["1=1"]
        params = []
        if intent:
            where_parts.append("intent = ?")
            params.append(intent)
        if tier:
            where_parts.append("score_tier = ?")
            params.append(tier)
        if status:
            where_parts.append("status = ?")
            params.append(status)
        if asset_type:
            where_parts.append("asset_type = ?")
            params.append(asset_type)
        if search:
            where_parts.append("(name LIKE ? OR post_text LIKE ? OR location LIKE ?)")
            params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])

        where_sql = " AND ".join(where_parts)

        cursor.execute(f"""
            SELECT * FROM facebook_leads WHERE {where_sql}
            ORDER BY 
                CASE score_tier WHEN 'HOT' THEN 1 WHEN 'WARM' THEN 2 ELSE 3 END,
                CASE urgency WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
                created_at DESC
            LIMIT ? OFFSET ?
        """, params + [limit, offset])
        rows = cursor.fetchall()

        # Count total
        cursor.execute(f"SELECT COUNT(*) FROM facebook_leads WHERE {where_sql}", params)
        total = cursor.fetchone()[0]

        conn.close()

        leads = []
        for r in rows:
            d = dict(r)
            try:
                d["signal_tags"] = json.loads(d.get("signal_tags", "[]"))
            except:
                d["signal_tags"] = []
            d["contact_available"] = bool(d.get("contact_available"))
            leads.append(d)

        # Summary stats
        stats = {"total": total, "hot": 0, "warm": 0, "cold": 0, "buyer": 0, "seller": 0, "broker": 0, "new": 0, "contacted": 0, "qualified": 0}
        for l in leads:
            t = l.get("score_tier", "")
            if t in stats:
                stats[t.lower()] = stats.get(t.lower(), 0) + 1
            i = l.get("intent", "")
            if i in stats:
                stats[i] = stats.get(i, 0) + 1
            s = l.get("status", "")
            if s in stats:
                stats[s] = stats.get(s, 0) + 1

        return {"leads": leads, "total": total, "stats": stats, "limit": limit, "offset": offset}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/facebook/lead/{lead_id}")
def facebook_get_lead(lead_id: int):
    """Get a single Facebook lead with its action history."""
    try:
        db_path = _get_db_path()
        conn = sqlite3.connect(str(db_path))
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        _ensure_facebook_tables(cursor)

        cursor.execute("SELECT * FROM facebook_leads WHERE id = ?", (lead_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Lead not found")

        lead = dict(row)
        try:
            lead["signal_tags"] = json.loads(lead.get("signal_tags", "[]"))
        except:
            lead["signal_tags"] = []
        lead["contact_available"] = bool(lead.get("contact_available"))

        # Compute speed metrics
        created_at = lead.get("created_at")
        dm_sent_at = lead.get("dm_sent_at")
        dm_replied_at = lead.get("dm_replied_at")
        lead["speed_to_dm_minutes"] = None
        lead["first_response_minutes"] = None
        if created_at and dm_sent_at:
            try:
                created_dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                sent_dt = datetime.fromisoformat(dm_sent_at.replace('Z', '+00:00'))
                lead["speed_to_dm_minutes"] = round((sent_dt - created_dt).total_seconds() / 60, 1)
            except Exception:
                pass
        if dm_sent_at and dm_replied_at:
            try:
                sent_dt = datetime.fromisoformat(dm_sent_at.replace('Z', '+00:00'))
                replied_dt = datetime.fromisoformat(dm_replied_at.replace('Z', '+00:00'))
                lead["first_response_minutes"] = round((replied_dt - sent_dt).total_seconds() / 60, 1)
            except Exception:
                pass

        cursor.execute("SELECT * FROM facebook_actions WHERE lead_id = ? ORDER BY created_at DESC", (lead_id,))
        actions = [dict(r) for r in cursor.fetchall()]
        lead["actions"] = actions

        conn.close()
        return lead
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/facebook/lead/{lead_id}/route")
def facebook_route_lead(lead_id: int, request: FacebookLeadRouteRequest):
    """Route a Facebook lead into the buyer or deal pipeline."""
    try:
        db_path = _get_db_path()
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        _ensure_facebook_tables(cursor)

        cursor.execute("SELECT * FROM facebook_leads WHERE id = ?", (lead_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Lead not found")

        now = datetime.utcnow().isoformat()
        route_to = request.route_to

        # Update lead status
        cursor.execute("""
            UPDATE facebook_leads
            SET routed_to = ?, routed_at = ?, status = ?, updated_at = ?
            WHERE id = ?
        """, (route_to, now, "routed", now, lead_id))

        # Log action
        cursor.execute("""
            INSERT INTO facebook_actions (created_at, lead_id, action, channel, notes, user_id)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (now, lead_id, f"routed_to_{route_to}", "system", request.notes, request.user_id))

        conn.commit()
        conn.close()

        return {
            "status": "routed",
            "lead_id": lead_id,
            "route_to": route_to,
            "routed_at": now,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/facebook/lead/{lead_id}/status")
def facebook_update_lead_status(lead_id: int, request: FacebookActionRequest):
    """Update a lead's status (dm_sent, dm_replied, connected, qualified, archived)."""
    try:
        db_path = _get_db_path()
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        _ensure_facebook_tables(cursor)

        cursor.execute("SELECT * FROM facebook_leads WHERE id = ?", (lead_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Lead not found")

        now = datetime.utcnow().isoformat()

        # Map action to column update + timestamp tracking
        action_col_map = {
            "dm_sent": ("dm_sent", "dm_sent_at"),
            "dm_replied": ("dm_replied", "dm_replied_at"),
            "connected": ("connected", "connected_at"),
            "qualified": ("qualified", "qualified_at"),
            "archived": ("archived", "archived_at"),
        }

        if request.action in action_col_map:
            col, ts_col = action_col_map[request.action]
            cursor.execute(f"UPDATE facebook_leads SET {col} = 1, {ts_col} = ?, updated_at = ?, status = ? WHERE id = ?",
                           (now, now, request.action, lead_id))
        else:
            cursor.execute("UPDATE facebook_leads SET status = ?, updated_at = ? WHERE id = ?",
                           (request.action, now, lead_id))

        # Log action
        cursor.execute("""
            INSERT INTO facebook_actions (created_at, lead_id, action, channel, notes, user_id)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (now, lead_id, request.action, request.channel, request.notes, request.user_id))

        conn.commit()
        conn.close()

        return {"status": "updated", "lead_id": lead_id, "action": request.action}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/facebook/templates")
def facebook_dm_templates(
    lead_id: Optional[int] = Query(None),
    template_type: Optional[str] = Query("initial"),
):
    """Get DM templates for a Facebook lead."""
    try:
        lead = {}
        if lead_id:
            db_path = _get_db_path()
            conn = sqlite3.connect(str(db_path))
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            _ensure_facebook_tables(cursor)
            cursor.execute("SELECT * FROM facebook_leads WHERE id = ?", (lead_id,))
            row = cursor.fetchone()
            if row:
                lead = dict(row)
                try:
                    lead["signal_tags"] = json.loads(lead.get("signal_tags", "[]"))
                except:
                    lead["signal_tags"] = []
                lead["contact_available"] = bool(lead.get("contact_available"))
            conn.close()

        types = ["initial", "followup", "qualify"] if template_type == "all" else [template_type]
        templates = {}
        for t in types:
            templates[t] = _generate_facebook_dm(lead, t)

        return {
            "lead_id": lead_id,
            "templates": templates,
            "rules": [
                "Every message must reference their post",
                "No generic copy-paste",
                "Respect platform limits (don't spam)",
                "Soft and contextual — not salesy",
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/facebook/stats")
def facebook_stats():
    """Get high-level stats for the Facebook intelligence dashboard."""
    try:
        db_path = _get_db_path()
        conn = sqlite3.connect(str(db_path))
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        _ensure_facebook_tables(cursor)

        cursor.execute("""
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN score_tier = 'HOT' THEN 1 ELSE 0 END) as hot,
                SUM(CASE WHEN score_tier = 'WARM' THEN 1 ELSE 0 END) as warm,
                SUM(CASE WHEN score_tier = 'COLD' THEN 1 ELSE 0 END) as cold,
                SUM(CASE WHEN intent = 'buyer' THEN 1 ELSE 0 END) as buyers,
                SUM(CASE WHEN intent = 'seller' THEN 1 ELSE 0 END) as sellers,
                SUM(CASE WHEN intent = 'broker' THEN 1 ELSE 0 END) as brokers,
                SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_count,
                SUM(CASE WHEN dm_sent = 1 THEN 1 ELSE 0 END) as dms_sent,
                SUM(CASE WHEN dm_replied = 1 THEN 1 ELSE 0 END) as dms_replied,
                SUM(CASE WHEN connected = 1 THEN 1 ELSE 0 END) as connected_count,
                SUM(CASE WHEN qualified = 1 THEN 1 ELSE 0 END) as qualified_count
            FROM facebook_leads
        """)
        row = cursor.fetchone()
        stats = dict(row) if row else {}

        # Recent activity
        cursor.execute("""
            SELECT * FROM facebook_actions ORDER BY created_at DESC LIMIT 20
        """)
        recent_actions = [dict(r) for r in cursor.fetchall()]

        # Speed metrics: average time from ingest to DM, and DM to reply
        cursor.execute("""
            SELECT AVG(
                (julianday(dm_sent_at) - julianday(created_at)) * 24 * 60
            ) as avg_speed_to_dm_minutes
            FROM facebook_leads
            WHERE dm_sent_at IS NOT NULL AND created_at IS NOT NULL
        """)
        speed_row = cursor.fetchone()
        avg_speed_to_dm = round(speed_row[0], 1) if speed_row and speed_row[0] else None

        cursor.execute("""
            SELECT AVG(
                (julianday(dm_replied_at) - julianday(dm_sent_at)) * 24 * 60
            ) as avg_first_response_minutes
            FROM facebook_leads
            WHERE dm_replied_at IS NOT NULL AND dm_sent_at IS NOT NULL
        """)
        resp_row = cursor.fetchone()
        avg_first_response = round(resp_row[0], 1) if resp_row and resp_row[0] else None

        # Source breakdown
        cursor.execute("""
            SELECT source, COUNT(*) as count FROM facebook_leads GROUP BY source
        """)
        source_breakdown = {r[0]: r[1] for r in cursor.fetchall()}

        conn.close()

        return {
            "stats": stats,
            "recent_actions": recent_actions,
            "speed_metrics": {
                "avg_speed_to_dm_minutes": avg_speed_to_dm,
                "avg_first_response_minutes": avg_first_response,
            },
            "source_breakdown": source_breakdown,
            "conversion_funnel": {
                "ingested": stats.get("total", 0),
                "dm_sent": stats.get("dms_sent", 0),
                "dm_replied": stats.get("dms_replied", 0),
                "connected": stats.get("connected_count", 0),
                "qualified": stats.get("qualified_count", 0),
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# MAIN
# ============================================================================
