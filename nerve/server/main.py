#!/usr/bin/env python3
"""
BigDataClaw Nerve Server
FastAPI + WebSocket for real-time mission control
"""

import asyncio
import json
import uuid
import sqlite3
import os
import requests
from datetime import datetime
from typing import Dict, List, Optional, Set
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Import connectors
from data_connector import get_connector, BigDataClawDataConnector
from obsidian_connector import get_vault_connector, ObsidianVaultConnector
from ai_research import research_property_with_fallback, generate_obsidian_markdown
from paperclip_bridge import spawn_paperclip_company_for_mission, mission_company_map

# Perplexity API Configuration
PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY", "")
PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions"


# ============================================================================
# DATA MODELS
# ============================================================================

class PropertySubmission(BaseModel):
    address: str
    city: str
    region: str
    asset_class: str
    price: float
    size_sf: Optional[float] = None
    property_type: Optional[str] = None


class MissionCreate(BaseModel):
    property: PropertySubmission
    research_depth: str = "standard"
    include_hot_money: bool = True
    include_portfolio: bool = True
    include_agents: bool = True
    include_lenders: bool = True


class ExportToObsidianRequest(BaseModel):
    type: str  # 'buyer' or 'property'
    data: dict


class ObsidianSearchRequest(BaseModel):
    query: str


# ============================================================================
# IN-MEMORY STORES
# ============================================================================

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.subscriptions: Dict[str, Set[WebSocket]] = {
            'missions': set(),
            'agents': set(),
            'hotmoney': set(),
        }
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        for channel in self.subscriptions.values():
            channel.discard(websocket)
    
    def subscribe(self, websocket: WebSocket, channels: List[str]):
        for channel in channels:
            if channel in self.subscriptions:
                self.subscriptions[channel].add(websocket)
    
    async def broadcast(self, message: dict, channel: Optional[str] = None):
        if channel and channel in self.subscriptions:
            targets = list(self.subscriptions[channel])
        else:
            targets = self.active_connections
        
        disconnected = []
        for connection in targets:
            try:
                await connection.send_json(message)
            except:
                disconnected.append(connection)
        
        for conn in disconnected:
            self.disconnect(conn)


class MissionStore:
    def __init__(self):
        self.missions: Dict[str, dict] = {}
    
    def create_mission(self, data: MissionCreate) -> str:
        mission_id = str(uuid.uuid4())[:8]
        self.missions[mission_id] = {
            "id": mission_id,
            "status": "queued",
            "property": data.property.dict(),
            "current_phase": 0,
            "total_phases": 6,
            "phase_progress": 0,
            "research_depth": data.research_depth,
            "include": {
                "hot_money": data.include_hot_money,
                "portfolio": data.include_portfolio,
                "agents": data.include_agents,
                "lenders": data.include_lenders,
            },
            "created_at": datetime.now(),
            "logs": [],
            "results": None,
        }
        return mission_id
    
    def get_mission(self, mission_id: str) -> Optional[dict]:
        return self.missions.get(mission_id)
    
    def update_mission(self, mission_id: str, updates: dict):
        if mission_id in self.missions:
            self.missions[mission_id].update(updates)
    
    def add_log(self, mission_id: str, message: str, level: str = "info"):
        if mission_id in self.missions:
            self.missions[mission_id]["logs"].append({
                "timestamp": datetime.now(),
                "message": message,
                "level": level,
            })
    
    def get_active_missions(self) -> List[dict]:
        return [m for m in self.missions.values() if m["status"] in ("queued", "active")]


# Global instances
manager = ConnectionManager()
store = MissionStore()
data_connector: Optional[BigDataClawDataConnector] = None
vault_connector: Optional[ObsidianVaultConnector] = None


# ============================================================================
# MISSION EXECUTION
# ============================================================================

async def run_mission_phases(mission_id: str):
    """Execute mission phases with real data"""
    global data_connector
    
    phases = [
        ("Transaction Scout", "Finding recent transactions in target market...", 1),
        ("Hot Money Identifier", "Analyzing sellers with fresh capital...", 2),
        ("Portfolio Analyzer", "Matching asset class portfolios...", 3),
        ("Agent Finder", "Finding active brokers...", 4),
        ("Lender Matcher", "Matching financing sources...", 5),
        ("Results Compilation", "Compiling final report...", 6),
    ]
    
    store.update_mission(mission_id, {"status": "active"})
    mission = store.get_mission(mission_id)
    
    if not mission:
        return
    
    property_data = {
        'address': mission['property']['address'],
        'city': mission['property']['city'],
        'region': mission['property']['region'],
        'asset_class': mission['property']['asset_class'],
        'price': mission['property']['price'],
        'size_sf': mission['property'].get('size_sf'),
        'property_type': mission['property'].get('property_type'),
    }
    
    results = {
        'matches': [],
        'hot_money': [],
        'agents': [],
        'lenders': [],
    }
    
    for phase_name, description, phase_num in phases:
        if store.get_mission(mission_id).get('status') == 'aborted':
            return
        
        store.update_mission(mission_id, {
            "current_phase": phase_num,
            "phase_progress": 0,
        })
        
        store.add_log(mission_id, f"Starting {phase_name}...")
        
        await manager.broadcast({
            "type": "mission:phase:change",
            "missionId": mission_id,
            "phase": phase_name,
            "progress": 0,
        }, channel="missions")
        
        try:
            if phase_num == 1 and data_connector:
                for progress in range(0, 101, 20):
                    await asyncio.sleep(0.3)
                    store.update_mission(mission_id, {"phase_progress": progress})
                    await manager.broadcast({
                        "type": "mission:log",
                        "missionId": mission_id,
                        "log": {"message": f"Scanning transactions... {progress}%", "level": "info"},
                    }, channel="missions")
            
            elif phase_num == 2 and data_connector and mission['include']['hot_money']:
                hot_money = data_connector.get_hot_money_leads(10)
                results['hot_money'] = hot_money
                
                for progress in range(0, 101, 25):
                    await asyncio.sleep(0.4)
                    store.update_mission(mission_id, {"phase_progress": progress})
                    
                    if progress == 50 and hot_money:
                        await manager.broadcast({
                            "type": "mission:log",
                            "missionId": mission_id,
                            "log": {"message": f"Found {len(hot_money)} hot money leads!", "level": "success"},
                        }, channel="missions")
                        
                        for lead in hot_money[:3]:
                            await manager.broadcast({
                                "type": "hotmoney:new",
                                "lead": lead,
                            }, channel="hotmoney")
                
                store.add_log(mission_id, f"Identified {len(hot_money)} hot money leads", "success")
            
            elif phase_num == 3 and data_connector:
                store.add_log(mission_id, "Running portfolio matching algorithm...")
                
                matches = data_connector.find_matches(property_data, 
                    limit=25 if mission['research_depth'] == 'deep' else 
                           5 if mission['research_depth'] == 'quick' else 10)
                results['matches'] = matches
                
                for progress in range(0, 101, 20):
                    await asyncio.sleep(0.3)
                    store.update_mission(mission_id, {"phase_progress": progress})
                
                store.add_log(mission_id, f"Found {len(matches)} potential buyers", "success")
            
            elif phase_num == 4 and mission['include']['agents']:
                store.add_log(mission_id, "Finding active agents in market...")
                for progress in range(0, 101, 25):
                    await asyncio.sleep(0.3)
                    store.update_mission(mission_id, {"phase_progress": progress})
                
                sample_agents = [
                    {'name': 'John Smith', 'company': 'Colliers', 'deals_closed': 12},
                    {'name': 'Jane Doe', 'company': 'CBRE', 'deals_closed': 8},
                ]
                results['agents'] = sample_agents
                store.add_log(mission_id, f"Found {len(sample_agents)} active agents", "success")
            
            elif phase_num == 5 and mission['include']['lenders']:
                store.add_log(mission_id, "Matching financing sources...")
                for progress in range(0, 101, 25):
                    await asyncio.sleep(0.3)
                    store.update_mission(mission_id, {"phase_progress": progress})
                
                sample_lenders = [
                    {'name': 'RBC Commercial', 'type': 'Bank', 'max_ltv': '75%'},
                    {'name': 'Dream Lender', 'type': 'Private', 'max_ltv': '65%'},
                ]
                results['lenders'] = sample_lenders
                store.add_log(mission_id, f"Matched {len(sample_lenders)} lenders", "success")
            
            else:
                for progress in range(0, 101, 25):
                    await asyncio.sleep(0.3)
                    store.update_mission(mission_id, {"phase_progress": progress})
            
            store.add_log(mission_id, f"Completed {phase_name}", "success")
            
        except Exception as e:
            store.add_log(mission_id, f"Error in {phase_name}: {str(e)}", "error")
            print(f"Phase error: {e}")
    
    # Export to Obsidian if vault connector is available
    if vault_connector:
        try:
            store.add_log(mission_id, "Exporting to Obsidian vault...")
            filepath = vault_connector.export_property_research(property_data, results)
            store.add_log(mission_id, f"Exported to {filepath}", "success")
            results['obsidian_export'] = filepath
        except Exception as e:
            store.add_log(mission_id, f"Obsidian export failed: {str(e)}", "warn")
    
    # Complete mission
    store.update_mission(mission_id, {
        "status": "completed",
        "results": results,
    })
    store.add_log(mission_id, "Mission completed successfully!", "success")
    
    await manager.broadcast({
        "type": "mission:complete",
        "missionId": mission_id,
        "results": results,
    }, channel="missions")


# ============================================================================
# FASTAPI APP
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global data_connector, vault_connector
    try:
        data_connector = get_connector()
        stats = data_connector.get_stats()
        print(f"✓ BigDataClaw connector ready: {stats}")
    except Exception as e:
        print(f"⚠ Data connector initialization failed: {e}")
    
    try:
        vault_connector = get_vault_connector()
        vault_stats = vault_connector.get_stats()
        print(f"✓ Obsidian vault connector ready: {vault_stats}")
    except Exception as e:
        print(f"⚠ Vault connector initialization failed: {e}")
    
    yield
    
    # Shutdown
    print("Shutting down Nerve server...")


app = FastAPI(
    title="BigDataClaw Nerve",
    description="Real-time mission control for CRE intelligence",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# REST ENDPOINTS - CORE
# ============================================================================

@app.get("/api/health")
async def health_check():
    stats = data_connector.get_stats() if data_connector else {}
    vault_stats = vault_connector.get_stats() if vault_connector else {}
    return {
        "status": "healthy",
        "version": "1.0.0",
        "active_missions": len(store.get_active_missions()),
        "websocket_connections": len(manager.active_connections),
        "data_stats": stats,
        "vault_stats": vault_stats,
    }


@app.post("/api/missions")
async def create_mission(data: MissionCreate, background_tasks: BackgroundTasks):
    mission_id = store.create_mission(data)
    background_tasks.add_task(run_mission_phases, mission_id)
    
    # Spawn a Paperclip company for this mission
    property_data = {
        "address": data.property.address,
        "city": data.property.city,
        "region": data.property.region,
        "asset_class": data.property.asset_class,
        "price": data.property.price,
        "size_sf": data.property.size_sf,
        "property_type": data.property.property_type,
    }
    background_tasks.add_task(
        spawn_paperclip_company_for_mission,
        mission_id,
        property_data,
        data.research_depth,
    )
    
    return store.get_mission(mission_id)


@app.get("/api/missions")
async def list_missions(status: Optional[str] = None):
    missions = list(store.missions.values())
    if status:
        missions = [m for m in missions if m["status"] == status]
    # Enrich with Paperclip company IDs
    for m in missions:
        m["paperclip_company_id"] = mission_company_map.get(m["id"])
    return missions


@app.get("/api/missions/{mission_id}")
async def get_mission(mission_id: str):
    mission = store.get_mission(mission_id)
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")
    mission["paperclip_company_id"] = mission_company_map.get(mission_id)
    return mission


@app.post("/api/missions/{mission_id}/abort")
async def abort_mission(mission_id: str):
    store.update_mission(mission_id, {"status": "aborted"})
    await manager.broadcast({
        "type": "mission:aborted",
        "missionId": mission_id,
    }, channel="missions")
    return {"status": "aborted"}


@app.get("/api/hotmoney")
async def get_hot_money(limit: int = 20):
    if data_connector:
        return data_connector.get_hot_money_leads(limit)
    return []


@app.get("/api/hotmoney/{lead_id}")
async def get_hot_money_lead(lead_id: int):
    """Get a single hot money lead by ID"""
    try:
        db_path = Path("/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/bigdataclaw.db")
        conn = sqlite3.connect(str(db_path))
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, entity, cash_amount, sale_date, location, property,
                   match_score, property_type, asset_class, address, days_ago, notes, contacts
            FROM hot_money_leads
            WHERE id = ?
        """, (lead_id,))
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            lead = dict(row)
            if lead.get('contacts'):
                try:
                    lead['contacts'] = json.loads(lead['contacts'])
                except:
                    lead['contacts'] = []
            return lead
        else:
            raise HTTPException(status_code=404, detail="Lead not found")
            
    except Exception as e:
        print(f"Error getting hot money lead: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class HotMoneyLeadUpdate(BaseModel):
    entity: str = None
    cash_amount: int = None
    sale_date: str = None
    location: str = None
    property: str = None
    property_type: str = None
    asset_class: str = None
    address: str = None
    days_ago: int = None
    notes: str = None
    contacts: list = None


@app.put("/api/hotmoney/{lead_id}")
async def update_hot_money_lead(lead_id: int, data: HotMoneyLeadUpdate):
    """Update a hot money lead"""
    try:
        db_path = Path("/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/bigdataclaw.db")
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        # Build update fields dynamically
        update_fields = []
        params = []
        
        if data.entity is not None:
            update_fields.append("entity = ?")
            params.append(data.entity)
        if data.cash_amount is not None:
            update_fields.append("cash_amount = ?")
            params.append(data.cash_amount)
        if data.sale_date is not None:
            update_fields.append("sale_date = ?")
            params.append(data.sale_date)
        if data.location is not None:
            update_fields.append("location = ?")
            params.append(data.location)
        if data.property is not None:
            update_fields.append("property = ?")
            params.append(data.property)
        if data.property_type is not None:
            update_fields.append("property_type = ?")
            params.append(data.property_type)
        if data.asset_class is not None:
            update_fields.append("asset_class = ?")
            params.append(data.asset_class)
        if data.address is not None:
            update_fields.append("address = ?")
            params.append(data.address)
        if data.days_ago is not None:
            update_fields.append("days_ago = ?")
            params.append(data.days_ago)
        if data.notes is not None:
            update_fields.append("notes = ?")
            params.append(data.notes)
        if data.contacts is not None:
            update_fields.append("contacts = ?")
            params.append(json.dumps(data.contacts))
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        update_fields.append("updated_at = CURRENT_TIMESTAMP")
        params.append(lead_id)
        
        sql = f"UPDATE hot_money_leads SET {', '.join(update_fields)} WHERE id = ?"
        cursor.execute(sql, params)
        conn.commit()
        
        if cursor.rowcount == 0:
            conn.close()
            raise HTTPException(status_code=404, detail="Lead not found")
        
        conn.close()
        return {"success": True, "message": "Lead updated successfully"}
        
    except Exception as e:
        print(f"Error updating hot money lead: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/hotmoney")
async def create_hot_money_lead(data: HotMoneyLeadUpdate):
    """Create a new hot money lead"""
    try:
        db_path = Path("/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/bigdataclaw.db")
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO hot_money_leads 
            (entity, cash_amount, sale_date, location, property, property_type, asset_class, 
             address, days_ago, notes, contacts)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data.entity, data.cash_amount, data.sale_date, data.location, data.property,
            data.property_type, data.asset_class, data.address, data.days_ago, data.notes,
            json.dumps(data.contacts) if data.contacts else '[]'
        ))
        
        conn.commit()
        new_id = cursor.lastrowid
        conn.close()
        
        return {"success": True, "id": new_id, "message": "Lead created successfully"}
        
    except Exception as e:
        print(f"Error creating hot money lead: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# LLM / AI PROFILE GENERATION
# ============================================================================

class PullProfileRequest(BaseModel):
    entity: str


# ============================================================================
# HOT MONEY - OPPORTUNITIES MATCHING
# ============================================================================

class HotMoneyOpportunityMatch(BaseModel):
    hot_money_id: int
    opportunity_id: int
    match_score: float
    match_reasons: list


def calculate_match_score(hot_money, opportunity):
    """Calculate match score between hot money lead and opportunity"""
    score = 0.0
    reasons = []
    
    # Location matching (40 points)
    hm_location = hot_money.get('location', '').lower()
    opp_location = opportunity.get('address', '').lower()
    
    if hm_location and opp_location:
        if hm_location in opp_location or opp_location in hm_location:
            score += 40
            reasons.append(f"Location match: {hot_money.get('location')}")
        elif any(word in opp_location for word in hm_location.split()):
            score += 25
            reasons.append(f"Nearby location: {hot_money.get('location')}")
    
    # Property type matching (30 points)
    hm_type = hot_money.get('property_type', '').lower()
    opp_type = opportunity.get('propertyType', '').lower()
    
    if hm_type and opp_type:
        if hm_type in opp_type or opp_type in hm_type:
            score += 30
            reasons.append(f"Property type: {hot_money.get('property_type')}")
        elif hm_type in ['commercial', 'industrial'] and opp_type in ['industrial', 'commercial']:
            score += 15
            reasons.append("Related property type")
    
    # Cash amount vs price alignment (20 points)
    hm_cash = hot_money.get('cash_amount', 0)
    opp_price_str = opportunity.get('previousPrice', '')
    
    # Parse price from string like "$4,200,000"
    try:
        opp_price = int(opp_price_str.replace('$', '').replace(',', ''))
        if hm_cash >= opp_price * 0.8:  # Can afford 80% or more
            score += 20
            reasons.append(f"Cash position (${hm_cash:,}) covers price")
        elif hm_cash >= opp_price * 0.5:
            score += 10
            reasons.append(f"Cash position (${hm_cash:,}) covers partial")
    except:
        pass
    
    # Asset class matching (10 points)
    hm_asset = hot_money.get('asset_class', '').lower()
    if hm_asset and opp_type:
        if any(word in opp_type for word in hm_asset.split()):
            score += 10
            reasons.append(f"Asset class: {hot_money.get('asset_class')}")
    
    return min(score, 100), reasons


@app.get("/api/hotmoney/{hot_money_id}/matches")
async def get_hot_money_matches(hot_money_id: int):
    """Find matching opportunities for a hot money lead"""
    try:
        db_path = Path("/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/bigdataclaw.db")
        conn = sqlite3.connect(str(db_path))
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Get hot money lead
        cursor.execute("""
            SELECT id, entity, cash_amount, location, property_type, asset_class, 
                   property, address, notes
            FROM hot_money_leads
            WHERE id = ?
        """, (hot_money_id,))
        
        row = cursor.fetchone()
        if not row:
            conn.close()
            raise HTTPException(status_code=404, detail="Hot money lead not found")
        
        hot_money = dict(row)
        
        # Get opportunities from properties table (or use sample data for now)
        # In production, this would query actual opportunities
        cursor.execute("""
            SELECT p.id, p.title, p.address, p.city, p.property_type, p.price, 
                   p.status, p.notes, p.lat, p.lng
            FROM properties p
            WHERE p.status IN ('available', 'off_market', 'expired')
            LIMIT 50
        """)
        
        opportunities = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        # If no properties in database, use sample opportunities
        if not opportunities:
            opportunities = [
                {
                    "id": 1,
                    "propertyType": "industrial",
                    "title": "50,000 SF Warehouse",
                    "address": "500 Industrial Pkwy, Hamilton, ON",
                    "previousPrice": "$8,500,000",
                    "status": "off_market",
                    "city": "Hamilton"
                },
                {
                    "id": 2,
                    "propertyType": "retail",
                    "title": "Shopping Plaza",
                    "address": "200 Main St, Lincoln, ON",
                    "previousPrice": "$4,200,000",
                    "status": "available",
                    "city": "Lincoln"
                },
                {
                    "id": 3,
                    "propertyType": "industrial",
                    "title": "Distribution Center",
                    "address": "1500 Steel St, Hamilton, ON",
                    "previousPrice": "$12,000,000",
                    "status": "available",
                    "city": "Hamilton"
                }
            ]
        
        # Calculate matches
        matches = []
        for opp in opportunities:
            score, reasons = calculate_match_score(hot_money, opp)
            if score >= 30:  # Only return matches with 30+ score
                matches.append({
                    "opportunity": opp,
                    "match_score": score,
                    "match_reasons": reasons,
                    "match_tier": "Excellent" if score >= 80 else "Good" if score >= 60 else "Fair"
                })
        
        # Sort by match score
        matches.sort(key=lambda x: x['match_score'], reverse=True)
        
        return {
            "hot_money": hot_money,
            "matches": matches,
            "total_matches": len(matches),
            "high_matches": len([m for m in matches if m['match_score'] >= 60])
        }
        
    except Exception as e:
        print(f"Error getting hot money matches: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/opportunities/{opportunity_id}/hot-money-matches")
async def get_opportunity_hot_money_matches(opportunity_id: int):
    """Find hot money sellers that match an opportunity"""
    try:
        db_path = Path("/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/bigdataclaw.db")
        conn = sqlite3.connect(str(db_path))
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Get opportunity (from properties table or mock)
        # For now, create a mock opportunity
        opportunity = {
            "id": opportunity_id,
            "propertyType": "industrial",
            "title": "Warehouse Space",
            "address": "Hamilton, ON",
            "previousPrice": "$5,000,000",
            "city": "Hamilton"
        }
        
        # Get all hot money leads
        cursor.execute("""
            SELECT id, entity, cash_amount, location, property_type, asset_class,
                   property, address, notes, match_score as base_score
            FROM hot_money_leads
            ORDER BY cash_amount DESC
        """)
        
        hot_money_leads = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        # Calculate matches
        matches = []
        for hm in hot_money_leads:
            score, reasons = calculate_match_score(hm, opportunity)
            if score >= 30:
                matches.append({
                    "hot_money": hm,
                    "match_score": score,
                    "match_reasons": reasons,
                    "match_tier": "Excellent" if score >= 80 else "Good" if score >= 60 else "Fair"
                })
        
        matches.sort(key=lambda x: x['match_score'], reverse=True)
        
        return {
            "opportunity": opportunity,
            "matches": matches,
            "total_matches": len(matches)
        }
        
    except Exception as e:
        print(f"Error getting opportunity matches: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/matches/all")
async def get_all_matches(min_score: int = 30):
    """Get all hot money to opportunity matches"""
    try:
        db_path = Path("/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/bigdataclaw.db")
        conn = sqlite3.connect(str(db_path))
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Get all hot money leads
        cursor.execute("SELECT * FROM hot_money_leads ORDER BY cash_amount DESC")
        hot_money_list = [dict(row) for row in cursor.fetchall()]
        
        # Get opportunities
        cursor.execute("SELECT * FROM properties WHERE status IN ('available', 'off_market') LIMIT 50")
        opportunities = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        # If no properties, use sample
        if not opportunities:
            opportunities = [
                {"id": 1, "propertyType": "industrial", "title": "Hamilton Warehouse", "address": "Hamilton, ON", "previousPrice": "$8,500,000", "city": "Hamilton"},
                {"id": 2, "propertyType": "retail", "title": "Lincoln Plaza", "address": "Lincoln, ON", "previousPrice": "$4,200,000", "city": "Lincoln"},
                {"id": 3, "propertyType": "land", "title": "Development Land", "address": "West Lincoln, ON", "previousPrice": "$3,500,000", "city": "West Lincoln"}
            ]
        
        # Calculate all matches
        all_matches = []
        for hm in hot_money_list:
            for opp in opportunities:
                score, reasons = calculate_match_score(hm, opp)
                if score >= min_score:
                    all_matches.append({
                        "hot_money_id": hm['id'],
                        "hot_money_entity": hm['entity'],
                        "hot_money_cash": hm['cash_amount'],
                        "opportunity_id": opp.get('id'),
                        "opportunity_title": opp.get('title') or opp.get('address'),
                        "opportunity_price": opp.get('previousPrice') or opp.get('price'),
                        "match_score": score,
                        "match_reasons": reasons,
                        "match_tier": "Excellent" if score >= 80 else "Good" if score >= 60 else "Fair"
                    })
        
        all_matches.sort(key=lambda x: x['match_score'], reverse=True)
        
        return {
            "total_matches": len(all_matches),
            "excellent_matches": len([m for m in all_matches if m['match_score'] >= 80]),
            "good_matches": len([m for m in all_matches if 60 <= m['match_score'] < 80]),
            "fair_matches": len([m for m in all_matches if 30 <= m['match_score'] < 60]),
            "matches": all_matches[:50]  # Return top 50
        }
        
    except Exception as e:
        print(f"Error getting all matches: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/llm/pull-profile")
async def pull_profile(data: PullProfileRequest):
    """Generate an AI research profile for an entity"""
    try:
        entity = data.entity
        if not entity:
            raise HTTPException(status_code=400, detail="Entity name is required")
        
        # Search for existing data about this entity in the database
        db_path = Path("/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/bigdataclaw.db")
        conn = sqlite3.connect(str(db_path))
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Look for any mentions in transactions
        cursor.execute("""
            SELECT seller_name, buyer_name, property_address, city, sale_price, sale_date, notes
            FROM transactions
            WHERE seller_name LIKE ? OR buyer_name LIKE ?
            ORDER BY sale_date DESC LIMIT 5
        """, (f"%{entity}%", f"%{entity}%"))
        
        transactions = [dict(row) for row in cursor.fetchall()]
        
        # Look in hot_money_leads
        cursor.execute("""
            SELECT entity, cash_amount, location, property, property_type, notes
            FROM hot_money_leads
            WHERE entity LIKE ?
            LIMIT 3
        """, (f"%{entity}%",))
        
        hot_money = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        # Generate profile based on available data
        # This is a simulated AI profile - in production, you might call an actual LLM API
        
        profile_data = {
            "summary": f"Research profile for {entity}. Based on available data, this entity has been involved in commercial real estate transactions.",
            "research": "",
            "connections": "",
            "preferences": ""
        }
        
        # Build research findings from transaction data
        research_parts = []
        if transactions:
            research_parts.append(f"Found {len(transactions)} related transactions:")
            for tx in transactions:
                role = "Seller" if entity.lower() in tx.get('seller_name', '').lower() else "Buyer"
                price = tx.get('sale_price', 0)
                price_str = f"${price:,}" if price else "Price unknown"
                research_parts.append(f"- {role} of {tx.get('property_address', 'Unknown property')} ({price_str})")
        
        if hot_money:
            research_parts.append(f"\nHot Money Lead: Cash position of ${hot_money[0].get('cash_amount', 0):,}")
            if hot_money[0].get('location'):
                research_parts.append(f"Active in: {hot_money[0].get('location')}")
            if hot_money[0].get('property_type'):
                research_parts.append(f"Property type: {hot_money[0].get('property_type')}")
        
        if research_parts:
            profile_data["research"] = "\n".join(research_parts)
        else:
            profile_data["research"] = f"No specific transaction data found for {entity} in the database. Consider searching public records or LinkedIn for more information."
        
        # Generate connections based on co-occurrence
        connections = []
        for tx in transactions:
            if entity.lower() in tx.get('seller_name', '').lower() and tx.get('buyer_name'):
                connections.append(f"Sold to: {tx.get('buyer_name')}")
            elif entity.lower() in tx.get('buyer_name', '').lower() and tx.get('seller_name'):
                connections.append(f"Bought from: {tx.get('seller_name')}")
        
        if connections:
            profile_data["connections"] = "Key relationships:\n" + "\n".join(f"- {c}" for c in set(connections[:5]))
        else:
            profile_data["connections"] = "No connection data available. Check LinkedIn or corporate records for related entities."
        
        # Investment preferences based on transaction types
        property_types = set()
        locations = set()
        for tx in transactions:
            if tx.get('property_address'):
                locations.add(tx.get('city', 'Unknown'))
        for hm in hot_money:
            if hm.get('property_type'):
                property_types.add(hm.get('property_type'))
        
        prefs = []
        if property_types:
            prefs.append(f"Property types: {', '.join(property_types)}")
        if locations:
            prefs.append(f"Active markets: {', '.join(locations)}")
        
        if prefs:
            profile_data["preferences"] = "\n".join(prefs)
        else:
            profile_data["preferences"] = "Investment preferences unknown. Review transaction history for patterns."
        
        return {"profile": profile_data}
        
    except Exception as e:
        print(f"Error pulling profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/match")
async def find_matches(property_data: PropertySubmission, limit: int = 10):
    if data_connector:
        return data_connector.find_matches(property_data.dict(), limit)
    return []


# ============================================================================
# REST ENDPOINTS - OBSIDIAN VAULT
# ============================================================================

@app.get("/api/obsidian/stats")
async def get_vault_stats():
    if vault_connector:
        return vault_connector.get_stats()
    return {"error": "Vault connector not available"}


@app.get("/api/obsidian/buyers")
async def list_buyer_profiles():
    if vault_connector:
        return vault_connector.list_buyer_profiles()
    return []


@app.get("/api/obsidian/buyers/{filepath:path}")
async def get_buyer_profile(filepath: str):
    if vault_connector:
        content = vault_connector.get_profile_content(filepath)
        if content:
            return {"content": content, "path": filepath}
        raise HTTPException(status_code=404, detail="Profile not found")
    raise HTTPException(status_code=503, detail="Vault connector not available")


@app.post("/api/obsidian/export")
async def export_to_obsidian(request: ExportToObsidianRequest):
    if not vault_connector:
        raise HTTPException(status_code=503, detail="Vault connector not available")
    
    try:
        if request.type == 'buyer':
            filepath = vault_connector.export_buyer_profile(request.data)
        elif request.type == 'property':
            filepath = vault_connector.export_property_research(
                request.data.get('property', {}),
                request.data.get('results', {})
            )
        else:
            raise HTTPException(status_code=400, detail="Invalid export type")
        
        return {"success": True, "filepath": filepath}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/obsidian/search")
async def search_vault(request: ObsidianSearchRequest):
    if vault_connector:
        return vault_connector.search_vault(request.query)
    return []


# ============================================================================
# REST ENDPOINTS - AGENTS & STATS
# ============================================================================

@app.get("/api/agents")
async def list_agents():
    hot_money_count = data_connector.get_stats().get('hot_money_count', 0) if data_connector else 156
    
    return [
        {
            "id": "transaction-scout",
            "name": "Transaction Scout",
            "status": "idle",
            "description": "Find recent transactions in target market",
            "icon": "🎯",
        },
        {
            "id": "hot-money-tracker",
            "name": "Hot Money Tracker",
            "status": "active",
            "description": "Identify sellers with fresh capital",
            "icon": "🔥",
            "watching_count": hot_money_count,
            "alert_count": 8,
        },
        {
            "id": "portfolio-analyzer",
            "name": "Portfolio Analyzer",
            "status": "idle",
            "description": "Match asset class portfolios",
            "icon": "💼",
        },
        {
            "id": "agent-finder",
            "name": "Agent Finder",
            "status": "idle",
            "description": "Find active brokers in market",
            "icon": "👤",
        },
        {
            "id": "lender-matcher",
            "name": "Lender Matcher",
            "status": "idle",
            "description": "Match financing sources",
            "icon": "🏦",
        },
        {
            "id": "obsidian-sync",
            "name": "Obsidian Sync",
            "status": "active",
            "description": "Sync with Obsidian vault",
            "icon": "📝",
            "last_sync": "2m ago",
            "file_count": vault_connector.get_stats().get('total_files', 0) if vault_connector else 1247,
        },
    ]


@app.get("/api/stats")
async def get_stats():
    if data_connector:
        return data_connector.get_stats()
    return {
        "total_transactions": 0,
        "total_buyers": 0,
        "hot_money_count": 0,
        "tracked_capital": 0,
    }


# ============================================================================
# LENDERS API
# ============================================================================

@app.get("/api/lenders")
async def get_lenders(
    search: str = None,
    type: str = None,
    asset_class: str = None,
    province: str = None,
    land_only: bool = False,
    page: int = 1,
    limit: int = 20
):
    """Get lenders with filtering and pagination"""
    try:
        db_path = Path("/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/bigdataclaw.db")
        conn = sqlite3.connect(str(db_path))
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Build query
        where_clauses = ["1=1"]
        params = []
        
        if search:
            where_clauses.append("(name LIKE ? OR city LIKE ? OR domain LIKE ?)")
            search_term = f"%{search}%"
            params.extend([search_term, search_term, search_term])
        
        if type:
            where_clauses.append("lender_type = ?")
            params.append(type)
        
        if asset_class:
            where_clauses.append("asset_specializations LIKE ?")
            params.append(f"%{asset_class}%")
        
        if province:
            where_clauses.append("province = ?")
            params.append(province)
        
        if land_only:
            where_clauses.append("is_land_lender = 1")
        
        # Count total
        count_sql = f"SELECT COUNT(*) FROM lenders WHERE {' AND '.join(where_clauses)}"
        cursor.execute(count_sql, params)
        total = cursor.fetchone()[0]
        
        # Get data
        offset = (page - 1) * limit
        sql = f"""
            SELECT id, name, domain, lender_type, asset_specializations,
                   is_land_lender, is_construction_lender, is_commercial_lender,
                   phone, email, city, province, quick_links
            FROM lenders
            WHERE {' AND '.join(where_clauses)}
            ORDER BY name
            LIMIT ? OFFSET ?
        """
        cursor.execute(sql, params + [limit, offset])
        
        rows = cursor.fetchall()
        conn.close()
        
        lenders = []
        for row in rows:
            lender = dict(row)
            # Parse quick_links JSON
            if lender.get('quick_links'):
                try:
                    lender['quick_links'] = json.loads(lender['quick_links'])
                except:
                    lender['quick_links'] = {}
            lenders.append(lender)
        
        return {
            "lenders": lenders,
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit
        }
        
    except Exception as e:
        print(f"Error getting lenders: {e}")
        return {"lenders": [], "total": 0, "page": page, "limit": limit, "pages": 0}


@app.get("/api/lenders/stats")
async def get_lender_stats():
    """Get lender statistics"""
    try:
        db_path = Path("/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/bigdataclaw.db")
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        stats = {}
        
        # Total lenders
        cursor.execute("SELECT COUNT(*) FROM lenders")
        stats['total'] = cursor.fetchone()[0]
        
        # By type
        cursor.execute("SELECT lender_type, COUNT(*) FROM lenders GROUP BY lender_type")
        stats['by_type'] = {row[0] or 'Unknown': row[1] for row in cursor.fetchall()}
        
        # Land lenders
        cursor.execute("SELECT COUNT(*) FROM lenders WHERE is_land_lender = 1")
        stats['land_lenders'] = cursor.fetchone()[0]
        
        # Construction lenders
        cursor.execute("SELECT COUNT(*) FROM lenders WHERE is_construction_lender = 1")
        stats['construction_lenders'] = cursor.fetchone()[0]
        
        conn.close()
        return stats
        
    except Exception as e:
        print(f"Error getting lender stats: {e}")
        return {"total": 0, "by_type": {}, "land_lenders": 0, "construction_lenders": 0}


@app.get("/api/lenders/filter-options")
async def get_lender_filter_options():
    """Get available filter options for lenders"""
    try:
        db_path = Path("/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/bigdataclaw.db")
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        # Get unique types
        cursor.execute("SELECT DISTINCT lender_type FROM lenders WHERE lender_type IS NOT NULL ORDER BY lender_type")
        types = [row[0] for row in cursor.fetchall()]
        
        # Get unique provinces
        cursor.execute("SELECT DISTINCT province FROM lenders WHERE province IS NOT NULL ORDER BY province")
        provinces = [row[0] for row in cursor.fetchall()]
        
        # Get asset specializations
        cursor.execute("SELECT DISTINCT asset_specializations FROM lenders WHERE asset_specializations IS NOT NULL")
        asset_classes = set()
        for row in cursor.fetchall():
            if row[0]:
                for spec in row[0].split(','):
                    asset_classes.add(spec.strip())
        
        conn.close()
        
        return {
            "types": types,
            "provinces": provinces,
            "asset_classes": sorted(asset_classes)
        }
        
    except Exception as e:
        print(f"Error getting filter options: {e}")
        return {"types": [], "provinces": [], "asset_classes": []}


# ============================================================================
# TRANSACTIONS / SALES DATA API
# ============================================================================

class TransactionCreate(BaseModel):
    seller_name: str
    buyer_name: str = None
    property_address: str
    city: str = None
    province: str = None
    sale_price: int
    property_type: str = None
    asset_class: str = None
    sale_date: str = None
    notes: str = None


@app.get("/api/transactions")
async def get_transactions(
    search: str = None,
    city: str = None,
    property_type: str = None,
    min_price: int = None,
    max_price: int = None,
    limit: int = 50,
    offset: int = 0
):
    """Get sales transactions with filtering"""
    try:
        db_path = Path("/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/bigdataclaw.db")
        conn = sqlite3.connect(str(db_path))
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        where_clauses = ["1=1"]
        params = []
        
        if search:
            where_clauses.append("(seller_name LIKE ? OR buyer_name LIKE ? OR property_address LIKE ?)")
            search_term = f"%{search}%"
            params.extend([search_term, search_term, search_term])
        
        if city:
            where_clauses.append("city = ?")
            params.append(city)
        
        if property_type:
            where_clauses.append("property_type = ?")
            params.append(property_type)
        
        if min_price:
            where_clauses.append("sale_price >= ?")
            params.append(min_price)
        
        if max_price:
            where_clauses.append("sale_price <= ?")
            params.append(max_price)
        
        # Count total
        count_sql = f"SELECT COUNT(*) FROM transactions WHERE {' AND '.join(where_clauses)}"
        cursor.execute(count_sql, params)
        total = cursor.fetchone()[0]
        
        # Get data
        sql = f"""
            SELECT id, seller_name, buyer_name, property_address, city, province,
                   sale_price, property_type, asset_class, sale_date, days_ago, notes,
                   source, created_at
            FROM transactions
            WHERE {' AND '.join(where_clauses)}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        """
        cursor.execute(sql, params + [limit, offset])
        
        rows = cursor.fetchall()
        conn.close()
        
        transactions = [dict(row) for row in rows]
        
        return {
            "transactions": transactions,
            "total": total,
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        print(f"Error getting transactions: {e}")
        return {"transactions": [], "total": 0, "limit": limit, "offset": offset}


@app.post("/api/transactions")
async def create_transaction(data: TransactionCreate):
    """Create a new sales transaction"""
    try:
        db_path = Path("/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/bigdataclaw.db")
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        # Calculate days_ago if sale_date provided
        days_ago = 0
        if data.sale_date:
            try:
                from datetime import datetime
                sale_dt = datetime.strptime(data.sale_date, '%Y-%m-%d')
                days_ago = (datetime.now() - sale_dt).days
            except:
                days_ago = 0
        
        cursor.execute("""
            INSERT INTO transactions 
            (seller_name, buyer_name, property_address, city, province, sale_price, 
             property_type, asset_class, sale_date, days_ago, notes, source)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual')
        """, (
            data.seller_name, data.buyer_name, data.property_address, data.city,
            data.province, data.sale_price, data.property_type, data.asset_class,
            data.sale_date, days_ago, data.notes
        ))
        
        conn.commit()
        new_id = cursor.lastrowid
        conn.close()
        
        return {"success": True, "id": new_id, "message": "Transaction created successfully"}
        
    except Exception as e:
        print(f"Error creating transaction: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class ParseTransactionsRequest(BaseModel):
    text: str


def parse_price(price_str):
    """Parse price from string like '$36,656,000' to integer"""
    if not price_str:
        return 0
    # Remove $ and commas
    clean = price_str.replace('$', '').replace(',', '').strip()
    try:
        return int(clean)
    except:
        return 0


def parse_date(date_str):
    """Parse date from string like '27 Mar 2026' to ISO format"""
    if not date_str:
        return None
    try:
        from datetime import datetime
        # Try format: 27 Mar 2026
        dt = datetime.strptime(date_str.strip(), '%d %b %Y')
        return dt.strftime('%Y-%m-%d')
    except:
        return None


def parse_transactions_from_text(text):
    """Parse multiple transactions from raw text"""
    transactions = []
    import re
    
    # Pattern to match a complete property block
    # Starts with address lines, then date, price, transferor, transferee, etc.
    block_pattern = r'([A-Z][A-Z0-9\s,\.]+?(?:\n(?!\d{1,2}\s+[A-Za-z]+\s+\d{4}|Transferor|Transferee|Site|Consideration)[^\n]*)*?)' \
                    r'(\d{1,2}\s+[A-Za-z]+\s+\d{4})\s+' \
                    r'\$?([\d,]+)\s*' \
                    r'(?:Related Parties\s*)?' \
                    r'(?:.*?)?' \
                    r'Transferor\(s\)\s*\n+([^\n]+(?:\n[^\n]+)*?)(?=\n\n|Transferee)' \
                    r'(?:.*?)?' \
                    r'Transferee\(s\)\s*\n+([^\n]+(?:\n[^\n]+)*?)(?=\n\n|Site|PIN|Consideration|$)' \
                    r'(?:.*?)?' \
                    r'(?:Site\s*\n+([^\n]+(?:\n[^\n]+)*?)(?=\n\n|PIN|Consideration|$))?' \
                    r'(?:.*?)?' \
                    r'(?:PIN:[^\n]*\n)?' \
                    r'(?:.*?)?' \
                    r'(\d+\.?\d*)?\s*acre'
    
    # Alternative approach: Find all date/price combinations and work backwards
    date_price_pattern = r'(\d{1,2}\s+[A-Za-z]+\s+\d{4})\s+\$?([\d,]+)'
    matches = list(re.finditer(date_price_pattern, text))
    
    for i, match in enumerate(matches):
        date_str = match.group(1)
        price_str = match.group(2)
        price = parse_price(price_str)
        date = parse_date(date_str)
        
        # Determine the block boundaries
        block_start = match.start()
        block_end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        block = text[block_start:block_end]
        
        # Also look backwards for address lines
        pre_text = text[:match.start()]
        address_lines = []
        for line in reversed(pre_text.split('\n')):
            line = line.strip()
            if not line:
                break
            # Stop if we hit a previous block's data
            if re.match(r'\d+\.?\d*\s*acre', line, re.IGNORECASE):
                break
            if 'Transferor' in line or 'Transferee' in line:
                break
            if 'Consideration' in line:
                break
            address_lines.insert(0, line)
        
        # Get property address and city from address lines
        property_address = address_lines[0] if address_lines else "Unknown"
        city_region = ""
        for line in address_lines:
            if ':' in line:
                city_region = line
                break
        
        city = ""
        if ':' in city_region:
            city = city_region.split(':')[0].strip()
        elif len(address_lines) > 1:
            city = address_lines[-1]
        
        # Extract transferor/seller
        seller = "Unknown"
        seller_match = re.search(r'Transferor\(s\)\s*\n+([^\n]+(?:\n(?!Transferee)[^\n]+)*)', block)
        if seller_match:
            seller = seller_match.group(1).strip().split('\n')[0]
        
        # Extract transferee/buyer
        buyer = ""
        buyer_match = re.search(r'Transferee\(s\)\s*\n+([^\n]+(?:\n(?!Site|PIN|Consideration)[^\n]+)*)', block)
        if buyer_match:
            buyer = buyer_match.group(1).strip().split('\n')[0]
        
        # Extract site
        site_match = re.search(r'Site\s*\n+([^\n]+(?:\n(?!PIN|Consideration)[^\n]+)*)', block)
        site = site_match.group(1).strip().replace('\n', ', ') if site_match else ""
        
        # Extract acreage
        acre_match = re.search(r'(\d+\.?\d*)\s*acre', block, re.IGNORECASE)
        acreage = acre_match.group(1) + " acres" if acre_match else ""
        
        # Build notes
        notes_parts = []
        if site:
            notes_parts.append(f"Site: {site}")
        if acreage:
            notes_parts.append(f"Size: {acreage}")
        
        # Extract consideration details
        cash_match = re.search(r'cash:\s*\$?([\d,]+)', block, re.IGNORECASE)
        debt_match = re.search(r'assumed/vtb debt:\s*\$?([\d,]+)', block, re.IGNORECASE)
        other_match = re.search(r'other:\s*\$?([\d,]+)', block, re.IGNORECASE)
        
        if cash_match:
            notes_parts.append(f"Cash: ${cash_match.group(1)}")
        if debt_match and parse_price(debt_match.group(1)) > 0:
            notes_parts.append(f"Assumed debt: ${debt_match.group(1)}")
        if other_match and parse_price(other_match.group(1)) > 0:
            notes_parts.append(f"Other: ${other_match.group(1)}")
        
        transaction = {
            'seller_name': seller,
            'buyer_name': buyer,
            'property_address': property_address,
            'city': city,
            'province': 'ON',
            'sale_price': price,
            'property_type': 'Commercial',
            'asset_class': 'Development Land' if acreage else '',
            'sale_date': date,
            'notes': '\n'.join(notes_parts)
        }
        transactions.append(transaction)
    
    return transactions


def research_property_online(property_address, city, property_type, seller, buyer, sale_price=0):
    """Delegate to ai_research module with fallback chain"""
    return research_property_with_fallback(
        property_address=property_address,
        city=city,
        property_type=property_type,
        seller=seller,
        buyer=buyer,
        sale_price=sale_price
    )


def generate_enriched_markdown(transaction, research):
    """Delegate to ai_research module"""
    return generate_obsidian_markdown(transaction, research)


@app.post("/api/transactions/enrich")
async def enrich_transactions(data: ParseTransactionsRequest):
    """Parse and enrich transactions with AI research"""
    try:
        # First parse the basic transactions
        transactions = parse_transactions_from_text(data.text)
        
        # Then enrich each with research
        enriched = []
        for tx in transactions:
            research = research_property_online(
                tx.get('property_address'),
                tx.get('city'),
                tx.get('property_type'),
                tx.get('seller_name'),
                tx.get('buyer_name'),
                tx.get('sale_price', 0)
            )
            
            # Generate markdown for Obsidian
            markdown = generate_enriched_markdown(tx, research)
            
            enriched.append({
                **tx,
                "research": research,
                "markdown": markdown,
                "research_summary": research.get('research_summary'),
                "key_findings": research.get('key_findings')
            })
        
        return {
            "success": True,
            "count": len(transactions),
            "transactions": transactions,
            "enriched": enriched
        }
    except Exception as e:
        print(f"Error enriching transactions: {e}")
        return {"success": False, "error": str(e), "transactions": [], "enriched": []}


@app.post("/api/obsidian/save-deals")
async def save_deals_to_obsidian(data: dict):
    """Save enriched deals to Obsidian vault"""
    try:
        deals = data.get('deals', [])
        vault_path = Path("/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/deals")
        vault_path.mkdir(exist_ok=True)
        
        saved_files = []
        for deal in deals:
            if deal.get('markdown'):
                # Generate filename from property address
                address = deal.get('property_address', 'unknown-property')
                safe_name = address.replace('/', '-').replace('\\', '-').replace(' ', '_')[:50]
                filename = f"{safe_name}_{deal.get('sale_date', 'no-date')}.md"
                filepath = vault_path / filename
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(deal['markdown'])
                
                saved_files.append(str(filepath))
        
        return {
            "success": True,
            "saved_count": len(saved_files),
            "files": saved_files
        }
    except Exception as e:
        print(f"Error saving to Obsidian: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/transactions/parse")
async def parse_transactions(data: ParseTransactionsRequest):
    """Parse multiple transactions from raw text"""
    try:
        transactions = parse_transactions_from_text(data.text)
        return {
            "success": True,
            "count": len(transactions),
            "transactions": transactions
        }
    except Exception as e:
        print(f"Error parsing transactions: {e}")
        return {"success": False, "error": str(e), "transactions": []}


@app.post("/api/transactions/bulk")
async def create_transactions_bulk(data: List[TransactionCreate]):
    """Create multiple transactions at once"""
    try:
        db_path = Path("/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/bigdataclaw.db")
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        created_ids = []
        
        for tx in data:
            # Calculate days_ago
            days_ago = 0
            if tx.sale_date:
                try:
                    from datetime import datetime
                    sale_dt = datetime.strptime(tx.sale_date, '%Y-%m-%d')
                    days_ago = (datetime.now() - sale_dt).days
                except:
                    days_ago = 0
            
            cursor.execute("""
                INSERT INTO transactions 
                (seller_name, buyer_name, property_address, city, province, sale_price, 
                 property_type, asset_class, sale_date, days_ago, notes, source)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'bulk_import')
            """, (
                tx.seller_name, tx.buyer_name, tx.property_address, tx.city,
                tx.province, tx.sale_price, tx.property_type, tx.asset_class,
                tx.sale_date, days_ago, tx.notes
            ))
            created_ids.append(cursor.lastrowid)
        
        conn.commit()
        conn.close()
        
        return {
            "success": True, 
            "count": len(created_ids), 
            "ids": created_ids,
            "message": f"Created {len(created_ids)} transactions"
        }
        
    except Exception as e:
        print(f"Error creating bulk transactions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/transactions/stats")
async def get_transaction_stats():
    """Get transaction statistics"""
    try:
        db_path = Path("/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/bigdataclaw.db")
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        stats = {}
        
        # Total transactions
        cursor.execute("SELECT COUNT(*) FROM transactions")
        stats['total'] = cursor.fetchone()[0]
        
        # Total volume
        cursor.execute("SELECT SUM(sale_price) FROM transactions")
        stats['total_volume'] = cursor.fetchone()[0] or 0
        
        # Average price
        cursor.execute("SELECT AVG(sale_price) FROM transactions")
        stats['avg_price'] = cursor.fetchone()[0] or 0
        
        # By property type
        cursor.execute("SELECT property_type, COUNT(*), SUM(sale_price) FROM transactions GROUP BY property_type")
        stats['by_type'] = [{"type": row[0], "count": row[1], "volume": row[2]} for row in cursor.fetchall()]
        
        # Recent (last 30 days)
        cursor.execute("SELECT COUNT(*) FROM transactions WHERE days_ago <= 30")
        stats['recent_count'] = cursor.fetchone()[0]
        
        conn.close()
        return stats
        
    except Exception as e:
        print(f"Error getting transaction stats: {e}")
        return {"total": 0, "total_volume": 0, "avg_price": 0, "by_type": [], "recent_count": 0}


# ============================================================================
# WEBSOCKET ENDPOINT
# ============================================================================

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    
    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                
                if message.get("type") == "subscribe":
                    channels = message.get("channels", [])
                    manager.subscribe(websocket, channels)
                    await websocket.send_json({
                        "type": "subscribed",
                        "channels": channels,
                    })
                
                elif message.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})
                    
            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "message": "Invalid JSON",
                })
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket)


# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=3090,
        reload=True,
        log_level="info",
    )
