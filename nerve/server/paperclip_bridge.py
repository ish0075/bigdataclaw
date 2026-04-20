#!/usr/bin/env python3
"""
Paperclip Bridge for Mission Control NERVE
Proxies FastAPI requests to Paperclip Express API and handles mission→company lifecycle.
"""

import os
import uuid
import httpx
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel

# Paperclip base URL
PAPERCLIP_BASE_URL = os.getenv("PAPERCLIP_BASE_URL", "http://127.0.0.1:3100")
PAPERCLIP_API_URL = f"{PAPERCLIP_BASE_URL}/api"

# In-memory mapping: mission_id -> paperclip_company_id
mission_company_map: Dict[str, str] = {}

router = APIRouter(prefix="/api/paperclip", tags=["Paperclip Bridge"])

# ============================================================================
# HTTP CLIENT
# ============================================================================

async def paperclip_request(method: str, path: str, json_data: Optional[Dict] = None):
    """Proxy a request to the Paperclip Express API."""
    url = f"{PAPERCLIP_API_URL}{path}"
    async with httpx.AsyncClient() as client:
        try:
            response = await client.request(method, url, json=json_data, timeout=30.0)
            return response.json(), response.status_code
        except httpx.ConnectError:
            raise HTTPException(status_code=503, detail="Paperclip server not available")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# PROXY ROUTES
# ============================================================================

@router.get("/health")
async def paperclip_health():
    """Check Paperclip server health."""
    data, status = await paperclip_request("GET", "/health")
    return JSONResponse(content=data, status_code=status)


@router.get("/companies")
async def list_companies():
    """List all Paperclip companies."""
    data, status = await paperclip_request("GET", "/companies")
    return JSONResponse(content=data, status_code=status)


@router.post("/companies")
async def create_company(payload: Request):
    """Create a new Paperclip company."""
    body = await payload.json()
    data, status = await paperclip_request("POST", "/companies", body)
    return JSONResponse(content=data, status_code=status)


@router.get("/companies/{company_id}")
async def get_company(company_id: str):
    """Get a Paperclip company."""
    data, status = await paperclip_request("GET", f"/companies/{company_id}")
    return JSONResponse(content=data, status_code=status)


@router.get("/companies/{company_id}/agents")
async def list_agents(company_id: str):
    """List agents in a company."""
    data, status = await paperclip_request("GET", f"/companies/{company_id}/agents")
    return JSONResponse(content=data, status_code=status)


@router.post("/companies/{company_id}/agents")
async def create_agent(company_id: str, payload: Request):
    """Hire an agent in a company."""
    body = await payload.json()
    data, status = await paperclip_request("POST", f"/companies/{company_id}/agents", body)
    return JSONResponse(content=data, status_code=status)


@router.get("/companies/{company_id}/goals")
async def list_goals(company_id: str):
    """List goals in a company."""
    data, status = await paperclip_request("GET", f"/companies/{company_id}/goals")
    return JSONResponse(content=data, status_code=status)


@router.post("/companies/{company_id}/goals")
async def create_goal(company_id: str, payload: Request):
    """Create a goal in a company."""
    body = await payload.json()
    data, status = await paperclip_request("POST", f"/companies/{company_id}/goals", body)
    return JSONResponse(content=data, status_code=status)


@router.get("/companies/{company_id}/issues")
async def list_issues(company_id: str):
    """List issues/tasks in a company."""
    data, status = await paperclip_request("GET", f"/companies/{company_id}/issues")
    return JSONResponse(content=data, status_code=status)


@router.post("/companies/{company_id}/issues")
async def create_issue(company_id: str, payload: Request):
    """Create an issue/task in a company."""
    body = await payload.json()
    data, status = await paperclip_request("POST", f"/companies/{company_id}/issues", body)
    return JSONResponse(content=data, status_code=status)


@router.get("/companies/{company_id}/costs")
async def get_costs(company_id: str):
    """Get cost data for a company."""
    data, status = await paperclip_request("GET", f"/companies/{company_id}/costs")
    return JSONResponse(content=data, status_code=status)


@router.get("/companies/{company_id}/org-chart.svg")
async def get_org_chart(company_id: str):
    """Get the SVG org chart for a company."""
    url = f"{PAPERCLIP_API_URL}/companies/{company_id}/agents/org-chart.svg?style=modern"
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, timeout=30.0)
            return StreamingResponse(
                iter([response.content]),
                media_type="image/svg+xml",
                status_code=response.status_code
            )
        except httpx.ConnectError:
            raise HTTPException(status_code=503, detail="Paperclip server not available")


@router.get("/companies/{company_id}/dashboard")
async def get_dashboard(company_id: str):
    """Get dashboard stats for a company."""
    data, status = await paperclip_request("GET", f"/companies/{company_id}/dashboard")
    return JSONResponse(content=data, status_code=status)


# ============================================================================
# LIFECYCLE HELPERS (called from mission creation)
# ============================================================================

class PropertyMissionData(BaseModel):
    address: str
    city: str
    region: str
    asset_class: str
    price: float
    size_sf: Optional[float] = None
    property_type: Optional[str] = None


async def spawn_paperclip_company_for_mission(
    mission_id: str,
    property_data: Dict[str, Any],
    research_depth: str = "standard"
) -> Optional[str]:
    """
    Automatically create a Paperclip company + agents + goal + issues
    when a NERVE mission is created.
    Returns the Paperclip company_id or None if Paperclip is unavailable.
    """
    address = property_data.get("address", "Unnamed Property")
    city = property_data.get("city", "")
    region = property_data.get("region", "")
    asset_class = property_data.get("asset_class", "")
    price = property_data.get("price", 0)
    size_sf = property_data.get("size_sf")
    prop_type = property_data.get("property_type", "")

    company_name = f"{address} Mission Company"
    mission_statement = (
        f"Find buyers and builders for a {asset_class} development "
        f"in {region}. Target: {address}, {city}. "
        f"Budget: ${price:,.0f}. "
        f"Units/size: {size_sf or 'N/A'}."
    )

    try:
        # 1. Create company
        company_payload = {
            "name": company_name,
            "mission": mission_statement,
        }
        company_resp, status = await paperclip_request("POST", "/companies", company_payload)
        if status >= 400:
            print(f"[Paperclip Bridge] Failed to create company: {company_resp}")
            return None

        company_id = company_resp.get("id")
        if not company_id:
            print("[Paperclip Bridge] No company ID returned")
            return None

        # Store mapping
        mission_company_map[mission_id] = company_id

        # 2. Create top-level goal
        goal_payload = {
            "title": f"Find buyers and builders for {asset_class} in {region}",
            "description": f"Research and outreach mission for {address}, {city}. Research depth: {research_depth}",
            "status": "active",
        }
        await paperclip_request("POST", f"/companies/{company_id}/goals", goal_payload)

        # 3. Hire default agents
        default_agents = [
            {
                "name": "CEO Strategy",
                "role": "ceo",
                "adapterType": "process",
                "instructions": f"You are the CEO of the mission company. Align the team toward finding buyers and builders for the {asset_class} project in {region}. Set priorities, review progress, and ensure goals are met.",
            },
            {
                "name": "Buyer Scout",
                "role": "researcher",
                "adapterType": "nerve_gateway",
                "instructions": f"You are a buyer scout. Find qualified buyers for a {asset_class} development in {region} with a ${price:,.0f} price point. Use the NERVE gateway adapter to query hot money leads, buyer portfolios, and lender data.",
            },
            {
                "name": "Builder Scout",
                "role": "researcher",
                "adapterType": "nerve_gateway",
                "instructions": f"You are a builder/developer scout. Find construction partners and developers experienced with {asset_class} projects in {region}. Use the NERVE gateway adapter to query the builder directory and property research data.",
            },
        ]

        for agent in default_agents:
            agent_payload = {
                "name": agent["name"],
                "role": agent["role"],
                "adapterType": agent["adapterType"],
                "instructions": agent["instructions"],
                "autoApprove": True,
                "adapterConfig": {
                    "url": "http://127.0.0.1:8000",
                    "timeoutSec": 60,
                } if agent["adapterType"] == "nerve_gateway" else {},
            }
            await paperclip_request("POST", f"/companies/{company_id}/agents", agent_payload)

        # 4. Create initial issues mapped to mission phases
        phases = [
            ("Transaction Scout", "Find recent transactions in target market"),
            ("Hot Money Identifier", "Analyze sellers with fresh capital"),
            ("Portfolio Analyzer", "Match asset class portfolios"),
            ("Agent Finder", "Find active brokers in market"),
            ("Lender Matcher", "Match financing sources"),
            ("Results Compilation", "Compile final report"),
        ]
        for idx, (title, desc) in enumerate(phases, 1):
            issue_payload = {
                "title": f"Phase {idx}: {title}",
                "body": desc,
                "status": "backlog",
            }
            await paperclip_request("POST", f"/companies/{company_id}/issues", issue_payload)

        print(f"[Paperclip Bridge] Spawned company {company_id} for mission {mission_id}")
        return company_id

    except Exception as e:
        print(f"[Paperclip Bridge] Exception spawning company: {e}")
        return None


async def get_company_for_mission(mission_id: str) -> Optional[str]:
    """Return the Paperclip company ID associated with a NERVE mission."""
    return mission_company_map.get(mission_id)


@router.post("/hot-money-missions")
async def create_hot_money_mission(payload: Request):
    """Create a Paperclip company to analyze a specific hot money lead."""
    body = await payload.json()
    lead = body.get("lead", {})
    
    entity = lead.get("entity", "Unknown Entity")
    cash = lead.get("cash_amount", 0)
    address = lead.get("address", "")
    asset_class = lead.get("asset_class", "")
    
    company_name = f"{entity} Hot Money Analysis"
    mission_statement = (
        f"Analyze hot money lead: {entity} with ${cash:,.0f} in cash. "
        f"Property: {address} ({asset_class}). Identify opportunities and next steps."
    )
    
    try:
        # 1. Create company
        company_payload = {
            "name": company_name,
            "mission": mission_statement,
        }
        company_resp, status = await paperclip_request("POST", "/companies", company_payload)
        if status >= 400:
            return JSONResponse(content={"error": company_resp}, status_code=status)
        
        company_id = company_resp.get("id")
        
        # 2. Create goal
        goal_payload = {
            "title": f"Analyze {entity} hot money opportunity",
            "description": f"Lead has ${cash:,.0f} cash. Property type: {asset_class}. Research buyer history and outreach strategy.",
            "status": "active",
        }
        await paperclip_request("POST", f"/companies/{company_id}/goals", goal_payload)
        
        # 3. Hire agents
        agents = [
            {
                "name": "Capital Analyst",
                "role": "researcher",
                "adapterType": "nerve_gateway",
                "instructions": f"You are a capital analyst. Research {entity} and analyze their ${cash:,.0f} transaction. Use NERVE data to find related deals, portfolio history, and contact information.",
                "autoApprove": True,
            },
            {
                "name": "Outreach Strategist",
                "role": "cmo",
                "adapterType": "process",
                "instructions": f"You are an outreach strategist. Based on the capital analyst's findings, draft a personalized outreach plan for {entity}.",
                "autoApprove": True,
            },
        ]
        for agent in agents:
            agent["adapterConfig"] = {
                "url": "http://127.0.0.1:8000",
                "timeoutSec": 60,
            } if agent["adapterType"] == "nerve_gateway" else {}
            await paperclip_request("POST", f"/companies/{company_id}/agents", agent)
        
        # 4. Create issue
        issue_payload = {
            "title": f"Research {entity}",
            "body": f"Analyze ${cash:,.0f} hot money lead. Property: {address}",
            "status": "backlog",
        }
        await paperclip_request("POST", f"/companies/{company_id}/issues", issue_payload)
        
        return JSONResponse(content={"company_id": company_id, "name": company_name})
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
