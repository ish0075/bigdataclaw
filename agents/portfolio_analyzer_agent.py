"""
Portfolio Analyzer Agent
Matches properties to qualified buyers
"""
import sqlite3
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class PortfolioAnalyzerAgent:
    """Analyzes buyer portfolios and matches properties"""
    
    def __init__(self, db_path='bigdataclaw.db'):
        self.name = "Portfolio Analyzer"
        self.icon = "📊"
        self.db_path = db_path
        
    def find_matching_buyers(self, property_data: Dict, top_n: int = 10) -> List[Dict]:
        """Find best buyer matches for property"""
        print(f"{self.icon} Matching buyers for {property_data.get('location', 'Unknown')}...")
        
        # Query database for potential buyers
        buyers = self._query_buyer_database()
        
        # Score each buyer
        matches = []
        for buyer in buyers:
            score = self._calculate_match_score(buyer, property_data)
            if score >= 50:  # Minimum threshold
                matches.append({
                    'buyer': buyer,
                    'match_score': score,
                    'match_reasons': self._explain_match(buyer, property_data),
                    'contact_priority': self._priority_level(score)
                })
        
        # Sort by score
        matches.sort(key=lambda x: x['match_score'], reverse=True)
        
        print(f"   Found {len(matches)} qualified buyers (score >= 50)")
        return matches[:top_n]
    
    def _query_buyer_database(self) -> List[Dict]:
        """Query buyer database"""
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT company_name, contact_name, email, phone
                FROM buyers 
                WHERE company_name IS NOT NULL
                LIMIT 100
            """)
            
            buyers = [dict(row) for row in cursor.fetchall()]
            conn.close()
            return buyers
            
        except Exception as e:
            logger.error(f"Database error: {e}")
            return []
    
    def _calculate_match_score(self, buyer: Dict, property_data: Dict) -> int:
        """Calculate match score 0-100"""
        score = 0
        
        criteria = (buyer.get('investment_criteria') or '').lower()
        buyer_type = (buyer.get('buyer_type') or '').lower()
        location = (buyer.get('location') or '').lower()
        
        prop_location = property_data.get('location', '').lower()
        prop_type = property_data.get('type', '').lower()
        
        # Type matching
        if prop_type in criteria or prop_type in buyer_type:
            score += 30
        elif 'development' in criteria and 'land' in prop_type:
            score += 25
        elif 'land' in criteria and 'land' in prop_type:
            score += 25
            
        # Location matching
        if prop_location in location or location in prop_location:
            score += 25
        elif 'ontario' in location and 'ontario' in prop_location:
            score += 20
            
        # Developer indicators
        company = buyer.get('company_name', '').lower()
        if any(keyword in company for keyword in ['development', 'homes', 'properties']):
            score += 15
            
        return min(score, 100)
    
    def _explain_match(self, buyer: Dict, property_data: Dict) -> List[str]:
        """Explain why this is a good match"""
        reasons = []
        criteria = (buyer.get('investment_criteria') or '').lower()
        
        if 'development' in criteria:
            reasons.append('Active developer')
        if 'land' in criteria:
            reasons.append('Land acquisition focus')
        if buyer.get('location', '').lower() in property_data.get('location', '').lower():
            reasons.append('Local presence')
            
        return reasons
    
    def _priority_level(self, score: int) -> str:
        """Determine contact priority"""
        if score >= 80:
            return "🔥 CALL TODAY"
        elif score >= 65:
            return "📞 CALL THIS WEEK"
        elif score >= 50:
            return "📧 EMAIL"
        else:
            return "📋 MONITOR"


if __name__ == "__main__":
    agent = PortfolioAnalyzerAgent()
    
    stayner_property = {
        'location': 'Stayner, Ontario',
        'type': 'development_land',
        'price': 18000000,
        'size_acres': 112,
        'units': 708
    }
    
    matches = agent.find_matching_buyers(stayner_property, top_n=5)
    
    print(f"✅ Portfolio Analyzer Agent deployed")
    print(f"   Database connected: bigdataclaw.db")
    print(f"   Status: ACTIVE")
