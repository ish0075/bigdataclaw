"""
Hushed Virtual Number Manager
Integrates with Hushed API for purchasing and managing virtual phone numbers
"""

import requests
import sqlite3
from typing import Optional, List, Dict
from datetime import datetime, timedelta
import os

class HushedManager:
    """Manage virtual numbers via Hushed API"""
    
    API_BASE = "https://api.hushed.com/v1"
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv('HUSHED_API_KEY')
        self.headers = {"Authorization": f"Bearer {self.api_key}"} if self.api_key else {}
        self.db_path = '/home/jamie/Desktop/Jamie\'s Personal Vault/bigdataclaw/bigdataclaw.db'
    
    def _get_db(self):
        """Get database connection"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def purchase_number(self, area_code: str, agent_id: str) -> Dict:
        """
        Purchase a virtual number for an agent
        
        Args:
            area_code: Area code to purchase (e.g., "289", "905")
            agent_id: Agent ID to associate with number
            
        Returns:
            Dict with number details
        """
        if not self.api_key:
            # Demo mode - return simulated response
            return self._demo_purchase(area_code, agent_id)
        
        try:
            response = requests.post(
                f"{self.API_BASE}/numbers",
                headers=self.headers,
                json={
                    "area_code": area_code,
                    "country": "CA",
                    "plan": "monthly"
                },
                timeout=30
            )
            response.raise_for_status()
            data = response.json()
            
            # Store in database
            conn = self._get_db()
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO virtual_numbers 
                (agent_id, number, provider, provider_id, area_code, expires_at, monthly_cost, status)
                VALUES (?, ?, 'hushed', ?, ?, datetime('now', '+1 month'), 3.99, 'active')
            """, (
                agent_id, 
                data.get('number'),
                data.get('id'),
                area_code
            ))
            conn.commit()
            conn.close()
            
            return {
                "success": True,
                "number": data.get('number'),
                "provider_id": data.get('id'),
                "expires_at": (datetime.now() + timedelta(days=30)).isoformat(),
                "monthly_cost": 3.99
            }
            
        except requests.RequestException as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to purchase number. Check API credentials."
            }
    
    def _demo_purchase(self, area_code: str, agent_id: str) -> Dict:
        """Simulate number purchase for demo mode"""
        import random
        
        # Generate a fake number
        number = f"+1{area_code}{random.randint(1000000, 9999999)}"
        provider_id = f"DEMO-{random.randint(10000, 99999)}"
        
        # Store in database
        conn = self._get_db()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO virtual_numbers 
            (agent_id, number, provider, provider_id, area_code, expires_at, monthly_cost, status)
            VALUES (?, ?, 'hushed', ?, ?, datetime('now', '+1 month'), 3.99, 'active')
        """, (agent_id, number, provider_id, area_code))
        conn.commit()
        conn.close()
        
        return {
            "success": True,
            "number": number,
            "provider_id": provider_id,
            "demo_mode": True,
            "expires_at": (datetime.now() + timedelta(days=30)).isoformat(),
            "monthly_cost": 3.99
        }
    
    def get_agent_number(self, agent_id: str) -> Optional[Dict]:
        """Get active virtual number for agent"""
        conn = self._get_db()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM virtual_numbers 
            WHERE agent_id = ? 
            AND expires_at > datetime('now')
            AND status = 'active'
            ORDER BY created_at DESC LIMIT 1
        """, (agent_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return dict(row)
        return None
    
    def list_available_area_codes(self, province: str = "ON") -> List[Dict]:
        """List available area codes for Canadian provinces"""
        # Common Ontario area codes
        ontario_codes = [
            {"code": "289", "region": "Niagara/Hamilton", "available": True},
            {"code": "365", "region": "Ontario", "available": True},
            {"code": "416", "region": "Toronto", "available": True},
            {"code": "437", "region": "Toronto", "available": True},
            {"code": "519", "region": "Southwestern Ontario", "available": True},
            {"code": "548", "region": "Southwestern Ontario", "available": True},
            {"code": "613", "region": "Eastern Ontario", "available": True},
            {"code": "647", "region": "Toronto", "available": True},
            {"code": "705", "region": "Central Ontario", "available": True},
            {"code": "807", "region": "Northwestern Ontario", "available": True},
            {"code": "905", "region": "Greater Toronto Area", "available": True}
        ]
        return ontario_codes
    
    def get_number_details(self, number_id: int) -> Optional[Dict]:
        """Get details for a specific number"""
        conn = self._get_db()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT vn.*, ra.name as agent_name, ra.email as agent_email
            FROM virtual_numbers vn
            LEFT JOIN referral_agents ra ON vn.agent_id = ra.agent_id
            WHERE vn.id = ?
        """, (number_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return dict(row)
        return None
    
    def release_number(self, number_id: int) -> Dict:
        """Release a virtual number"""
        conn = self._get_db()
        cursor = conn.cursor()
        
        # Get number details first
        cursor.execute("SELECT * FROM virtual_numbers WHERE id = ?", (number_id,))
        row = cursor.fetchone()
        
        if not row:
            conn.close()
            return {"success": False, "error": "Number not found"}
        
        # Update status to released
        cursor.execute("""
            UPDATE virtual_numbers 
            SET status = 'released', expires_at = datetime('now')
            WHERE id = ?
        """, (number_id,))
        
        conn.commit()
        conn.close()
        
        return {
            "success": True,
            "message": f"Number {row['number']} released successfully"
        }
    
    def list_all_numbers(self, status: Optional[str] = None) -> List[Dict]:
        """List all virtual numbers with optional filter"""
        conn = self._get_db()
        cursor = conn.cursor()
        
        if status:
            cursor.execute("""
                SELECT vn.*, ra.name as agent_name, ra.email as agent_email
                FROM virtual_numbers vn
                LEFT JOIN referral_agents ra ON vn.agent_id = ra.agent_id
                WHERE vn.status = ?
                ORDER BY vn.created_at DESC
            """, (status,))
        else:
            cursor.execute("""
                SELECT vn.*, ra.name as agent_name, ra.email as agent_email
                FROM virtual_numbers vn
                LEFT JOIN referral_agents ra ON vn.agent_id = ra.agent_id
                ORDER BY vn.created_at DESC
            """)
        
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]
    
    def get_stats(self) -> Dict:
        """Get virtual number statistics"""
        conn = self._get_db()
        cursor = conn.cursor()
        
        # Total numbers
        cursor.execute("SELECT COUNT(*) FROM virtual_numbers")
        total = cursor.fetchone()[0]
        
        # Active numbers
        cursor.execute("""
            SELECT COUNT(*) FROM virtual_numbers 
            WHERE status = 'active' AND expires_at > datetime('now')
        """)
        active = cursor.fetchone()[0]
        
        # Monthly cost
        cursor.execute("""
            SELECT SUM(monthly_cost) FROM virtual_numbers 
            WHERE status = 'active' AND expires_at > datetime('now')
        """)
        monthly_cost = cursor.fetchone()[0] or 0
        
        # Numbers expiring soon (next 7 days)
        cursor.execute("""
            SELECT COUNT(*) FROM virtual_numbers 
            WHERE status = 'active' 
            AND expires_at BETWEEN datetime('now') AND datetime('now', '+7 days')
        """)
        expiring_soon = cursor.fetchone()[0]
        
        conn.close()
        
        return {
            "total_numbers": total,
            "active_numbers": active,
            "monthly_cost": round(monthly_cost, 2),
            "expiring_soon": expiring_soon
        }


# Commission Calculator
class CommissionCalculator:
    """Calculate commission splits for referral deals"""
    
    TIERS = {
        'standard': {'platform': 0.25, 'agent': 0.75, 'min_deals': 0},
        'volume': {'platform': 0.20, 'agent': 0.80, 'min_deals': 10},
        'vip': {'platform': 0.15, 'agent': 0.85, 'min_deals': 25}
    }
    
    def __init__(self):
        self.db_path = '/home/jamie/Desktop/Jamie\'s Personal Vault/bigdataclaw/bigdataclaw.db'
    
    def _get_db(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def get_agent_tier(self, agent_id: str) -> str:
        """Determine agent tier based on closed deals"""
        conn = self._get_db()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT COUNT(*) FROM referral_deals 
            WHERE agent_id = ? AND status = 'closed'
        """, (agent_id,))
        deal_count = cursor.fetchone()[0]
        conn.close()
        
        if deal_count >= 25:
            return 'vip'
        elif deal_count >= 10:
            return 'volume'
        return 'standard'
    
    def calculate(self, deal_value: float, agent_id: str) -> Dict:
        """
        Calculate commission split for a deal
        
        Args:
            deal_value: Total commission from the deal
            agent_id: Agent to calculate for
            
        Returns:
            Dict with breakdown
        """
        tier = self.get_agent_tier(agent_id)
        split = self.TIERS[tier]
        
        platform_fee = deal_value * split['platform']
        agent_payout = deal_value * split['agent']
        
        return {
            "deal_value": deal_value,
            "tier": tier,
            "platform_rate": split['platform'],
            "agent_rate": split['agent'],
            "platform_fee": round(platform_fee, 2),
            "agent_payout": round(agent_payout, 2),
            "deals_to_next_tier": max(0, split.get('min_deals', 0) - self._get_deal_count(agent_id))
        }
    
    def _get_deal_count(self, agent_id: str) -> int:
        """Get number of closed deals for agent"""
        conn = self._get_db()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT COUNT(*) FROM referral_deals 
            WHERE agent_id = ? AND status = 'closed'
        """, (agent_id,))
        count = cursor.fetchone()[0]
        conn.close()
        return count
    
    def project_annual_revenue(self, agent_id: str, avg_deal_value: float = 10000, 
                               deals_per_year: int = 12) -> Dict:
        """Project annual revenue for an agent"""
        tier = self.get_agent_tier(agent_id)
        split = self.TIERS[tier]
        
        annual_deal_value = avg_deal_value * deals_per_year
        platform_revenue = annual_deal_value * split['platform']
        agent_revenue = annual_deal_value * split['agent']
        
        return {
            "tier": tier,
            "projected_deals": deals_per_year,
            "avg_deal_value": avg_deal_value,
            "annual_deal_value": annual_deal_value,
            "platform_revenue": round(platform_revenue, 2),
            "agent_revenue": round(agent_revenue, 2),
            "monthly_agent_income": round(agent_revenue / 12, 2)
        }
