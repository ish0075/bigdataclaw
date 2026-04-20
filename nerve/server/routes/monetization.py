"""
Monetization Routes
API endpoints for referral agents, virtual numbers, and commission tracking
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import sqlite3
import os
import sys

# Add parent to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.hushed_manager import HushedManager, CommissionCalculator

router = APIRouter(prefix="/api/v1/monetization", tags=["monetization"])

# Database path
DB_PATH = '/home/jamie/Desktop/Jamie\'s Personal Vault/bigdataclaw/bigdataclaw.db'

def get_db():
    """Get database connection"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# Pydantic Models
class ReferralAgentCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    license_number: Optional[str] = None
    brokerage: Optional[str] = None
    territory: List[str]

class ReferralAgentUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    license_number: Optional[str] = None
    brokerage: Optional[str] = None
    territory: Optional[List[str]] = None
    status: Optional[str] = None
    commission_rate: Optional[float] = None

class VirtualNumberPurchase(BaseModel):
    area_code: str
    agent_id: str

class DealCreate(BaseModel):
    agent_id: str
    property_address: str
    property_type: str
    client_name: str
    client_phone: Optional[str] = None
    client_email: Optional[str] = None
    deal_value: float
    lead_id: Optional[int] = None

class CommissionCalculationRequest(BaseModel):
    deal_value: float
    agent_id: str

# Referral Agent Routes
@router.get("/agents", response_model=List[dict])
async def list_agents(status: Optional[str] = None):
    """List all referral agents"""
    conn = get_db()
    cursor = conn.cursor()
    
    if status:
        cursor.execute("""
            SELECT * FROM referral_agents 
            WHERE status = ?
            ORDER BY created_at DESC
        """, (status,))
    else:
        cursor.execute("SELECT * FROM referral_agents ORDER BY created_at DESC")
    
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]

@router.get("/agents/{agent_id}")
async def get_agent(agent_id: str):
    """Get referral agent details"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM referral_agents WHERE agent_id = ?", (agent_id,))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    agent = dict(row)
    
    # Add deal statistics
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT 
            COUNT(*) as total_deals,
            SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_deals,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_deals,
            SUM(agent_payout) as total_earned
        FROM referral_deals 
        WHERE agent_id = ?
    """, (agent_id,))
    stats = cursor.fetchone()
    conn.close()
    
    agent['stats'] = dict(stats) if stats else {
        'total_deals': 0, 'closed_deals': 0, 
        'pending_deals': 0, 'total_earned': 0
    }
    
    return agent

@router.post("/agents")
async def create_agent(agent: ReferralAgentCreate):
    """Create new referral agent"""
    import uuid
    
    agent_id = f"REF-{uuid.uuid4().hex[:8].upper()}"
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO referral_agents 
            (agent_id, name, email, phone, license_number, brokerage, territory, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
        """, (
            agent_id, agent.name, agent.email, agent.phone,
            agent.license_number, agent.brokerage, str(agent.territory)
        ))
        conn.commit()
        
        # Get created agent
        cursor.execute("SELECT * FROM referral_agents WHERE agent_id = ?", (agent_id,))
        row = cursor.fetchone()
        conn.close()
        
        return {
            "success": True,
            "agent": dict(row),
            "message": "Agent created successfully. Awaiting contract signature."
        }
        
    except sqlite3.IntegrityError as e:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Agent with this email already exists: {e}")

@router.put("/agents/{agent_id}")
async def update_agent(agent_id: str, updates: ReferralAgentUpdate):
    """Update referral agent"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Check if agent exists
    cursor.execute("SELECT * FROM referral_agents WHERE agent_id = ?", (agent_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Build update query
    update_fields = []
    values = []
    
    if updates.name:
        update_fields.append("name = ?")
        values.append(updates.name)
    if updates.email:
        update_fields.append("email = ?")
        values.append(updates.email)
    if updates.phone:
        update_fields.append("phone = ?")
        values.append(updates.phone)
    if updates.license_number:
        update_fields.append("license_number = ?")
        values.append(updates.license_number)
    if updates.brokerage:
        update_fields.append("brokerage = ?")
        values.append(updates.brokerage)
    if updates.territory:
        update_fields.append("territory = ?")
        values.append(str(updates.territory))
    if updates.status:
        update_fields.append("status = ?")
        values.append(updates.status)
    if updates.commission_rate:
        update_fields.append("commission_rate = ?")
        values.append(updates.commission_rate)
    
    if not update_fields:
        conn.close()
        raise HTTPException(status_code=400, detail="No fields to update")
    
    update_fields.append("updated_at = datetime('now')")
    values.append(agent_id)
    
    cursor.execute(f"""
        UPDATE referral_agents 
        SET {', '.join(update_fields)}
        WHERE agent_id = ?
    """, values)
    
    conn.commit()
    
    # Get updated agent
    cursor.execute("SELECT * FROM referral_agents WHERE agent_id = ?", (agent_id,))
    row = cursor.fetchone()
    conn.close()
    
    return {"success": True, "agent": dict(row)}

# Virtual Number Routes
@router.get("/virtual-numbers/area-codes")
async def list_area_codes():
    """List available area codes"""
    manager = HushedManager()
    return manager.list_available_area_codes()

@router.post("/virtual-numbers/purchase")
async def purchase_number(purchase: VirtualNumberPurchase):
    """Purchase a virtual number"""
    manager = HushedManager()
    result = manager.purchase_number(purchase.area_code, purchase.agent_id)
    
    if not result.get('success'):
        raise HTTPException(status_code=400, detail=result.get('error', 'Purchase failed'))
    
    return result

@router.get("/virtual-numbers")
async def list_numbers(status: Optional[str] = None):
    """List all virtual numbers"""
    manager = HushedManager()
    return manager.list_all_numbers(status)

@router.get("/virtual-numbers/stats")
async def get_number_stats():
    """Get virtual number statistics"""
    manager = HushedManager()
    return manager.get_stats()

@router.delete("/virtual-numbers/{number_id}")
async def release_number(number_id: int):
    """Release a virtual number"""
    manager = HushedManager()
    result = manager.release_number(number_id)
    
    if not result.get('success'):
        raise HTTPException(status_code=400, detail=result.get('error'))
    
    return result

# Deal Routes
@router.get("/deals")
async def list_deals(agent_id: Optional[str] = None, status: Optional[str] = None):
    """List referral deals"""
    conn = get_db()
    cursor = conn.cursor()
    
    query = """
        SELECT rd.*, ra.name as agent_name, ra.email as agent_email
        FROM referral_deals rd
        LEFT JOIN referral_agents ra ON rd.agent_id = ra.agent_id
        WHERE 1=1
    """
    params = []
    
    if agent_id:
        query += " AND rd.agent_id = ?"
        params.append(agent_id)
    
    if status:
        query += " AND rd.status = ?"
        params.append(status)
    
    query += " ORDER BY rd.created_at DESC"
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]

@router.post("/deals")
async def create_deal(deal: DealCreate):
    """Create new referral deal"""
    import uuid
    
    deal_number = f"DEAL-{uuid.uuid4().hex[:8].upper()}"
    
    # Calculate commission
    calc = CommissionCalculator()
    commission = calc.calculate(deal.deal_value, deal.agent_id)
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO referral_deals 
        (deal_number, agent_id, lead_id, property_address, property_type, 
         client_name, client_phone, client_email, deal_value, 
         platform_fee, agent_payout, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    """, (
        deal_number, deal.agent_id, deal.lead_id, deal.property_address,
        deal.property_type, deal.client_name, deal.client_phone, deal.client_email,
        deal.deal_value, commission['platform_fee'], commission['agent_payout']
    ))
    
    conn.commit()
    
    # Get created deal
    cursor.execute("SELECT * FROM referral_deals WHERE deal_number = ?", (deal_number,))
    row = cursor.fetchone()
    conn.close()
    
    return {
        "success": True,
        "deal": dict(row),
        "commission_breakdown": commission
    }

@router.put("/deals/{deal_id}/close")
async def close_deal(deal_id: int):
    """Mark deal as closed"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        UPDATE referral_deals 
        SET status = 'closed', closed_at = datetime('now')
        WHERE id = ?
    """, (deal_id,))
    
    conn.commit()
    conn.close()
    
    return {"success": True, "message": "Deal marked as closed"}

# Commission Routes
@router.post("/commission/calculate")
async def calculate_commission(calc: CommissionCalculationRequest):
    """Calculate commission for a deal"""
    calculator = CommissionCalculator()
    result = calculator.calculate(calc.deal_value, calc.agent_id)
    return result

@router.get("/commission/project/{agent_id}")
async def project_revenue(agent_id: str, avg_deal_value: float = 10000, deals_per_year: int = 12):
    """Project annual revenue for agent"""
    calculator = CommissionCalculator()
    result = calculator.project_annual_revenue(agent_id, avg_deal_value, deals_per_year)
    return result

@router.get("/dashboard")
async def get_dashboard():
    """Get monetization dashboard data"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Agent stats
    cursor.execute("SELECT COUNT(*) FROM referral_agents WHERE status = 'active'")
    active_agents = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM referral_agents WHERE status = 'pending'")
    pending_agents = cursor.fetchone()[0]
    
    # Deal stats
    cursor.execute("""
        SELECT 
            COUNT(*) as total_deals,
            SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_deals,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_deals,
            SUM(platform_fee) as total_platform_revenue,
            SUM(agent_payout) as total_agent_payouts
        FROM referral_deals
    """)
    deal_stats = cursor.fetchone()
    
    # Monthly revenue (last 6 months)
    cursor.execute("""
        SELECT 
            strftime('%Y-%m', created_at) as month,
            SUM(platform_fee) as revenue
        FROM referral_deals
        WHERE created_at >= datetime('now', '-6 months')
        GROUP BY month
        ORDER BY month DESC
    """)
    monthly_revenue = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    
    # Virtual number stats
    hushed = HushedManager()
    number_stats = hushed.get_stats()
    
    return {
        "agents": {
            "active": active_agents,
            "pending": pending_agents,
            "total": active_agents + pending_agents
        },
        "deals": {
            "total": deal_stats[0] or 0,
            "closed": deal_stats[1] or 0,
            "pending": deal_stats[2] or 0,
            "total_platform_revenue": round(deal_stats[3] or 0, 2),
            "total_agent_payouts": round(deal_stats[4] or 0, 2)
        },
        "virtual_numbers": number_stats,
        "monthly_revenue": monthly_revenue
    }
