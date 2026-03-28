#!/usr/bin/env python3
"""
BigDataClaw NERVE API Server
FastAPI backend with SQLite + Qdrant
"""

import json
import sqlite3
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from qdrant_client import QdrantClient
import uvicorn

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

# Database paths
DB_PATH = Path('bigdataclaw.db')
QDRANT_HOST = "localhost"
QDRANT_PORT = 6333

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
        # Escape the search term for FTS5 by wrapping in double quotes
        escaped_search = search.replace('"', '""')
        fts_query = f'"{escaped_search}"'
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
# MAIN
# ============================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 BigDataClaw NERVE API Server")
    print("=" * 60)
    print("\n📡 Endpoints:")
    print("   GET  /api/health           - Health check")
    print("   GET  /api/info             - System info")
    print("   GET  /api/recruiters       - List recruiters (paginated)")
    print("   GET  /api/recruiters/stats - Recruiter statistics")
    print("   GET  /api/recruiters/filter-options")
    print("   POST /api/recruiters/{id}/contact")
    print("   GET  /api/recruiters/search?q=...")
    print("   GET  /api/opportunities")
    print("\n🌐 Starting server on http://0.0.0.0:8000")
    print("=" * 60)
    
    uvicorn.run(app, host="0.0.0.0", port=8000)
