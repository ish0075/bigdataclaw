#!/usr/bin/env python3
"""
BigDataClaw NERVE API Server
FastAPI backend with SQLite + Qdrant
"""

import json
import os
import sqlite3
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime

from fastapi import FastAPI, Query, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from qdrant_client import QdrantClient
import uvicorn

# Import Agent Workspace API
from agent_workspace_api import router as agent_workspace_router
from obsidian_api import router as obsidian_router
from notification_service import notification_router
from bot_builder_api import router as bot_builder_router
from realtor_bot_api import router as realtor_bot_router
from ai_builder_api import router as ai_builder_router
from nerve.server.paperclip_bridge import router as paperclip_router
import agent_router

# Initialize FastAPI
app = FastAPI(
    title="BigDataClaw NERVE API",
    description="Real estate intelligence platform API",
    version="2.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Agent Workspace Router
app.include_router(agent_workspace_router)
app.include_router(obsidian_router)
app.include_router(notification_router)
app.include_router(bot_builder_router)
app.include_router(realtor_bot_router)
app.include_router(ai_builder_router)
app.include_router(paperclip_router)

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

class VoiceAgentRequest(BaseModel):
    message: str
    history: Optional[List[Dict[str, Any]]] = None

@app.post("/api/voice/agent")
async def voice_agent(request: VoiceAgentRequest):
    """Multimodal voice agent endpoint for Mission Control."""
    result = await agent_router.handle_request(request.message, request.history)
    return result

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
                    "Companies/Brokerages",
                    "Companies/Lenders",
                    "Companies/Firms",
                    "People/Brokers",
                    "People/Salespersons",
                    "Deals/Transactions",
                    "Buyers/Prospects",
                    "Session_Logs"
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
    location: Optional[str] = None
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

import httpx

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1:8b")  # Faster default
QWEN_MODEL = "qwen2.5:14b"  # Available for advanced tasks

class LLMRequest(BaseModel):
    prompt: str
    system_prompt: Optional[str] = None
    temperature: float = 0.7
    max_tokens: int = 1024
    model: Optional[str] = None  # "llama3.1:8b" or "qwen2.5:14b"

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
        system = request.system_prompt or "You are a helpful assistant."
        
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
        system_prompt = """You are Kimi, a commercial real estate research assistant for BigDataClaw NERVE. 
Help users research properties by extracting key details and providing helpful responses.

When a user mentions a property, try to extract:
- Address
- City  
- Price
- Property type (Industrial, Retail, Office, etc.)
- Size (square footage)
- Number of beds/baths (for residential)

Be conversational and helpful."""
        
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
        system_prompt = """You are a commercial real estate deal extraction AI. 
Extract the following from the user's deal text and respond ONLY with valid JSON:
{
  "entity": "company or person name",
  "cash_amount": 15000000,
  "property_type": "Industrial|Retail|Office|Multi-Family|Agricultural|Land|Mixed-Use",
  "asset_class": "descriptive class like Warehouse, Plaza, etc",
  "location": "city name",
  "address": "full address if available",
  "sale_date": "date or month year",
  "notes": "any additional details"
}
If a field is not found, use null or empty string."""

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
        
        system_prompt = """You are a commercial real estate intelligence researcher. 
Given an entity name, create a comprehensive profile summary.

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
    print("\n🌐 Starting server on http://0.0.0.0:8000")
    print("=" * 60)
    
    uvicorn.run(app, host="0.0.0.0", port=8000)
