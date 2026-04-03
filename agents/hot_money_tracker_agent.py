"""
Hot Money Tracker Agent
Detects motivated sellers with fresh capital
"""
import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class HotMoneyTrackerAgent:
    """Identifies hot money opportunities"""
    
    def __init__(self):
        self.name = "Hot Money Tracker"
        self.icon = "💰"
        self.capital_threshold = 10000000  # $10M+
        self.motivation_indicators = [
            'estate sale', 'relocation', 'partnership dissolution',
            '1031 exchange', 'motivated', 'must sell', 'urgent',
            'divorce', 'retirement', 'downsizing'
        ]
        
    async def analyze_seller(self, seller_name: str, property_data: Dict) -> Dict:
        """Analyze seller's financial position and motivation"""
        logger.info(f"{self.icon} Analyzing {seller_name}...")
        
        # Calculate motivation score
        motivation_score = self._score_motivation(property_data)
        
        # Check for hot money alert
        is_hot_money = motivation_score >= 70
        
        result = {
            'seller': seller_name,
            'motivation_score': motivation_score,
            'motivation_factors': self._identify_factors(property_data),
            'hot_money_alert': is_hot_money,
            'alert_level': 'HIGH' if is_hot_money else 'MEDIUM' if motivation_score > 50 else 'LOW',
            'recommended_action': self._recommend_action(is_hot_money, motivation_score)
        }
        
        if is_hot_money:
            print(f"🚨 HOT MONEY ALERT: {seller_name} - Score: {motivation_score}/100")
            
        return result
    
    def _score_motivation(self, property_data: Dict) -> int:
        """Score seller motivation 0-100"""
        score = 0
        notes = property_data.get('notes', '').lower()
        
        # Check motivation keywords
        for indicator in self.motivation_indicators:
            if indicator in notes:
                score += 25
                
        # Price reduction is strong indicator
        price_reduction = property_data.get('price_reduction_percent', 0)
        if price_reduction > 30:
            score += 35
        elif price_reduction > 20:
            score += 25
        elif price_reduction > 10:
            score += 15
            
        # Days on market
        dom = property_data.get('days_on_market', 0)
        if dom > 180:
            score += 20
        elif dom > 120:
            score += 15
        elif dom > 90:
            score += 10
            
        return min(score, 100)
    
    def _identify_factors(self, property_data: Dict) -> List[str]:
        """Identify specific motivation factors"""
        factors = []
        notes = property_data.get('notes', '').lower()
        
        for indicator in self.motivation_indicators:
            if indicator in notes:
                factors.append(indicator.title())
                
        if property_data.get('price_reduction_percent', 0) > 20:
            factors.append('Significant Price Reduction')
            
        return factors
    
    def _recommend_action(self, is_hot_money: bool, motivation: int) -> str:
        """Recommend next action"""
        if is_hot_money:
            return "URGENT: Contact immediately with strong offer"
        elif motivation > 70:
            return "HIGH: Contact within 24 hours"
        elif motivation > 50:
            return "MEDIUM: Add to follow-up list"
        else:
            return "LOW: Monitor for changes"


if __name__ == "__main__":
    import asyncio
    
    agent = HotMoneyTrackerAgent()
    
    # Test with Stayner-like data
    test_property = {
        'price_reduction_percent': 28,
        'days_on_market': 120,
        'notes': 'Highly motivated seller, priced to sell, VTB available'
    }
    
    result = asyncio.run(agent.analyze_seller('Stayner Seller LLC', test_property))
    print(f"✅ Hot Money Tracker Agent deployed")
    print(f"   Motivation Score: {result['motivation_score']}/100")
    print(f"   Alert Level: {result['alert_level']}")
    print(f"   Status: ACTIVE")
