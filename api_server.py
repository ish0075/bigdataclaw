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
        # Use FTS for search
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
            # Fallback to LIKE
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
            lender['quick_links'] = json.loads(lender['quick_links'])
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
    cursor.execute('''
        SELECT 
            SUM(is_commercial_lender) as commercial,
            SUM(is_land_lender) as land,
            SUM(is_construction_lender) as construction
        FROM lenders
    ''')
    row = cursor.fetchone()
    by_specialization = {
        'commercial': row[0],
        'land': row[1],
        'construction': row[2]
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
    cursor.execute(f'''
        SELECT b.*, COUNT(s.id) as agent_count
        FROM dbeaver_brokerages b
        LEFT JOIN dbeaver_salespersons s ON s.brokerage_id = b.id
        {where_clause}
        GROUP BY b.id
        ORDER BY b.name
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
    
    conn.close()
    return lead

@app.post("/api/hotmoney")
async def create_hotmoney_lead(lead: HotMoneyLead):
    """Create a new hot money lead"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO hot_money_leads 
        (entity, cash_amount, sale_date, location, property, match_score, property_type, asset_class, address, days_ago, notes, contacts)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        lead.entity, lead.cash_amount, lead.sale_date, lead.location, 
        lead.property, lead.match_score, lead.property_type, lead.asset_class,
        lead.address, lead.days_ago, lead.notes, json.dumps(lead.contacts or [])
    ))
    
    lead_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return {"id": lead_id, "message": "Lead created successfully"}

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
    print("\n🌐 Starting server on http://0.0.0.0:8000")
    print("=" * 60)
    
    uvicorn.run(app, host="0.0.0.0", port=8000)
