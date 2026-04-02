#!/usr/bin/env python3
"""
Buyer Research Skill
Deep research into why specific buyers were selected
Analyzes acquisition history, portfolio strategy, fund status, and market positioning
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta
import json


@dataclass
class BuyerProfile:
    """Comprehensive buyer profile"""
    name: str
    company: str
    type: str  # REIT, Pension Fund, PE, etc.
    aum: Optional[float] = None  # Assets under management
    
    # Acquisition Criteria
    target_asset_classes: List[str] = None
    target_geographies: List[str] = None
    min_deal_size: float = 0
    max_deal_size: float = float('inf')
    target_returns: Dict = None  # IRR, CoC, etc.
    
    # Current Status
    fund_life_status: str = ""  # FRESH, MID, EXIT_WINDOW, OVERDUE
    dry_powder: Optional[float] = None  # Available capital
    recent_acquisitions: List[Dict] = None
    
    # Strategic Indicators
    portfolio_gaps: List[str] = None  # What they're missing
    expansion_markets: List[str] = None
    thematic_focus: List[str] = None  # ESG, affordable housing, etc.


class BuyerResearchSkill:
    """
    Deep research skill for understanding buyer rationale
    Explains WHY each buyer was matched to a specific property
    """
    
    def __init__(self):
        self.research_cache: Dict[str, Dict] = {}
        print("🔍 Buyer Research Skill initialized")
    
    def research_buyer_rationale(self, buyer_name: str, property_data: Dict) -> Dict:
        """
        Deep research into why this buyer matches this property
        
        Returns comprehensive justification including:
        - Strategic fit analysis
        - Portfolio gap analysis
        - Fund lifecycle positioning
        - Recent activity patterns
        - Competitive landscape
        """
        print(f"\n{'='*80}")
        print(f"🔍 RESEARCHING BUYER: {buyer_name}")
        print(f"{'='*80}")
        print(f"  Property: {property_data.get('address')}")
        print(f"  Asset Class: {property_data.get('asset_class')}")
        print(f"  Price: ${property_data.get('price', 0):,.0f}")
        
        rationale = {
            'buyer': buyer_name,
            'property': property_data.get('address'),
            'research_timestamp': datetime.now().isoformat(),
            'match_dimensions': [],
            'confidence_score': 0,
            'detailed_analysis': {}
        }
        
        # Dimension 1: Asset Class Fit
        asset_fit = self._analyze_asset_class_fit(buyer_name, property_data)
        rationale['match_dimensions'].append(asset_fit)
        rationale['detailed_analysis']['asset_class'] = asset_fit
        
        # Dimension 2: Geographic Strategy
        geo_fit = self._analyze_geographic_fit(buyer_name, property_data)
        rationale['match_dimensions'].append(geo_fit)
        rationale['detailed_analysis']['geography'] = geo_fit
        
        # Dimension 3: Deal Size Alignment
        size_fit = self._analyze_deal_size_fit(buyer_name, property_data)
        rationale['match_dimensions'].append(size_fit)
        rationale['detailed_analysis']['deal_size'] = size_fit
        
        # Dimension 4: Fund Lifecycle Timing
        fund_fit = self._analyze_fund_lifecycle_fit(buyer_name)
        rationale['match_dimensions'].append(fund_fit)
        rationale['detailed_analysis']['fund_lifecycle'] = fund_fit
        
        # Dimension 5: Strategic Portfolio Needs
        portfolio_fit = self._analyze_portfolio_needs(buyer_name, property_data)
        rationale['match_dimensions'].append(portfolio_fit)
        rationale['detailed_analysis']['portfolio_strategy'] = portfolio_fit
        
        # Calculate overall confidence
        scores = [d['score'] for d in rationale['match_dimensions']]
        rationale['confidence_score'] = sum(scores) / len(scores) if scores else 0
        
        # Generate executive summary
        rationale['executive_summary'] = self._generate_executive_summary(
            buyer_name, property_data, rationale['match_dimensions']
        )
        
        print(f"\n  ✅ Research Complete")
        print(f"  📊 Confidence Score: {rationale['confidence_score']:.0f}/100")
        print(f"  📄 {rationale['executive_summary'][:100]}...")
        
        return rationale
    
    def _analyze_asset_class_fit(self, buyer_name: str, property_data: Dict) -> Dict:
        """Analyze buyer's history and focus on this asset class"""
        asset_class = property_data.get('asset_class', '').lower()
        
        # Query buyer database for asset class activity
        buyer_profile = self._get_buyer_profile(buyer_name)
        
        score = 0
        indicators = []
        evidence = []
        
        # Check if asset class in target list
        if buyer_profile and buyer_profile.target_asset_classes:
            if asset_class in [a.lower() for a in buyer_profile.target_asset_classes]:
                score += 30
                indicators.append("Target asset class")
                evidence.append(f"{buyer_name} lists {asset_class} as priority sector")
        
        # Check recent acquisitions in this asset class
        if buyer_profile and buyer_profile.recent_acquisitions:
            recent_asset_deals = [
                d for d in buyer_profile.recent_acquisitions
                if d.get('asset_class', '').lower() == asset_class
            ]
            if recent_asset_deals:
                score += min(25, len(recent_asset_deals) * 5)
                indicators.append(f"{len(recent_asset_deals)} recent {asset_class} acquisitions")
                for deal in recent_asset_deals[:3]:
                    evidence.append(f"Acquired {deal.get('property', 'asset')} in {deal.get('year', 'recent year')}")
        
        # Check for stated expansion in this asset class
        if buyer_profile and buyer_profile.portfolio_gaps:
            if asset_class in [g.lower() for g in buyer_profile.portfolio_gaps]:
                score += 20
                indicators.append("Identified portfolio gap")
                evidence.append(f"{buyer_name} has indicated interest in {asset_class} to fill portfolio gaps")
        
        return {
            'dimension': 'Asset Class Alignment',
            'score': min(100, score),
            'indicators': indicators,
            'evidence': evidence[:3],  # Top 3 pieces of evidence
            'recommendation': self._generate_asset_recommendation(score, buyer_name, asset_class)
        }
    
    def _analyze_geographic_fit(self, buyer_name: str, property_data: Dict) -> Dict:
        """Analyze buyer's geographic strategy"""
        city = property_data.get('city', '')
        region = property_data.get('region', 'ON')
        
        buyer_profile = self._get_buyer_profile(buyer_name)
        
        score = 0
        indicators = []
        evidence = []
        
        # Check explicit target geographies
        if buyer_profile and buyer_profile.target_geographies:
            if city in buyer_profile.target_geographies:
                score += 30
                indicators.append(f"{city} is target market")
            elif region in buyer_profile.target_geographies:
                score += 20
                indicators.append(f"{region} is target province")
        
        # Check expansion markets
        if buyer_profile and buyer_profile.expansion_markets:
            if city in buyer_profile.expansion_markets:
                score += 25
                indicators.append(f"{city} in expansion phase")
                evidence.append(f"{buyer_name} actively expanding in {city} market")
        
        # Check existing presence
        if buyer_profile and buyer_profile.recent_acquisitions:
            city_deals = [d for d in buyer_profile.recent_acquisitions if d.get('city') == city]
            if city_deals:
                score += min(25, len(city_deals) * 8)
                indicators.append(f"{len(city_deals)} deals in {city}")
                evidence.append(f"Recent activity: {len(city_deals)} acquisitions in {city}")
        
        return {
            'dimension': 'Geographic Strategy',
            'score': min(100, score),
            'indicators': indicators,
            'evidence': evidence[:3],
            'recommendation': self._generate_geo_recommendation(score, buyer_name, city)
        }
    
    def _analyze_deal_size_fit(self, buyer_name: str, property_data: Dict) -> Dict:
        """Analyze if deal size fits buyer's criteria"""
        price = property_data.get('price', 0) or property_data.get('asking_price', 0)
        
        buyer_profile = self._get_buyer_profile(buyer_name)
        
        score = 0
        indicators = []
        evidence = []
        
        if buyer_profile:
            # Check if price within range
            if buyer_profile.min_deal_size <= price <= buyer_profile.max_deal_size:
                score += 40
                indicators.append(f"${price/1e6:.1f}M within target range")
                evidence.append(f"Target range: ${buyer_profile.min_deal_size/1e6:.0f}M - ${buyer_profile.max_deal_size/1e6:.0f}M")
                
                # Calculate sweet spot bonus
                mid_point = (buyer_profile.min_deal_size + buyer_profile.max_deal_size) / 2
                deviation = abs(price - mid_point) / mid_point
                if deviation < 0.2:  # Within 20% of midpoint
                    score += 15
                    indicators.append("In sweet spot range")
            else:
                # Partial credit if close
                if price < buyer_profile.min_deal_size:
                    ratio = price / buyer_profile.min_deal_size
                    if ratio > 0.7:  # Within 30%
                        score += 20
                        indicators.append("Slightly below typical range")
                elif price > buyer_profile.max_deal_size:
                    ratio = buyer_profile.max_deal_size / price
                    if ratio > 0.7:
                        score += 15
                        indicators.append("Above typical range (may be JV candidate)")
        
        # Check dry powder sufficiency
        if buyer_profile and buyer_profile.dry_powder:
            if buyer_profile.dry_powder >= price * 0.3:  # Can cover 30% equity
                score += 25
                indicators.append("Sufficient dry powder")
                evidence.append(f"Available capital: ${buyer_profile.dry_powder/1e6:.0f}M")
        
        return {
            'dimension': 'Deal Size Alignment',
            'score': min(100, score),
            'indicators': indicators,
            'evidence': evidence[:3],
            'recommendation': self._generate_size_recommendation(score, buyer_name, price)
        }
    
    def _analyze_fund_lifecycle_fit(self, buyer_name: str) -> Dict:
        """Analyze fund lifecycle timing"""
        buyer_profile = self._get_buyer_profile(buyer_name)
        
        score = 0
        indicators = []
        evidence = []
        urgency = "normal"
        
        if buyer_profile and buyer_profile.fund_life_status:
            status = buyer_profile.fund_life_status
            
            if status == "FRESH":
                score = 70
                indicators.append("Recently raised capital")
                evidence.append(f"{buyer_name} in deployment phase")
                urgency = "high"
            elif status == "MID":
                score = 60
                indicators.append("Active investment period")
                urgency = "medium"
            elif status == "EXIT_WINDOW":
                score = 85
                indicators.append("🔥 EXIT WINDOW ACTIVE")
                evidence.append(f"{buyer_name} approaching fund exit window")
                urgency = "critical"
            elif status == "OVERDUE":
                score = 95
                indicators.append("🔥🔥 REQUIRES IMMEDIATE EXIT")
                evidence.append(f"{buyer_name} past fund life - MUST BUY to balance exits")
                urgency = "critical"
        
        # Check recent acquisition velocity
        if buyer_profile and buyer_profile.recent_acquisitions:
            recent_count = len([d for d in buyer_profile.recent_acquisitions 
                              if d.get('year', 0) >= datetime.now().year - 1])
            if recent_count >= 3:
                score += 10
                indicators.append(f"{recent_count} acquisitions in past 12 months")
                urgency = "high" if urgency != "critical" else urgency
        
        return {
            'dimension': 'Fund Lifecycle Timing',
            'score': min(100, score),
            'indicators': indicators,
            'evidence': evidence[:3],
            'urgency': urgency,
            'recommendation': self._generate_fund_recommendation(score, buyer_name, urgency)
        }
    
    def _analyze_portfolio_needs(self, buyer_name: str, property_data: Dict) -> Dict:
        """Analyze strategic portfolio needs"""
        asset_class = property_data.get('asset_class', '').lower()
        city = property_data.get('city', '')
        
        buyer_profile = self._get_buyer_profile(buyer_name)
        
        score = 0
        indicators = []
        evidence = []
        
        # Check thematic alignment
        if buyer_profile and buyer_profile.thematic_focus:
            themes = buyer_profile.thematic_focus
            
            # ESG alignment
            if 'esg' in [t.lower() for t in themes]:
                # Check if property has ESG features
                if property_data.get('green_certified') or property_data.get('esg_compliant'):
                    score += 20
                    indicators.append("ESG investment mandate match")
            
            # Affordable housing
            if 'affordable_housing' in [t.lower() for t in themes]:
                if asset_class == 'multifamily':
                    score += 15
                    indicators.append("Affordable housing focus")
            
            # Logistics/Industrial
            if 'logistics' in [t.lower() for t in themes] and asset_class == 'industrial':
                score += 25
                indicators.append("Logistics strategy match")
        
        # Check portfolio concentration
        if buyer_profile and buyer_profile.recent_acquisitions:
            # If they have deals in this city, they like it
            city_deals = [d for d in buyer_profile.recent_acquisitions if d.get('city') == city]
            if len(city_deals) >= 2:
                score += 20
                indicators.append(f"Building concentration in {city}")
                evidence.append(f"{len(city_deals)} properties in {city} - likely want more")
        
        return {
            'dimension': 'Strategic Portfolio Needs',
            'score': min(100, score),
            'indicators': indicators,
            'evidence': evidence[:3],
            'recommendation': self._generate_portfolio_recommendation(score, buyer_name)
        }
    
    def _get_buyer_profile(self, buyer_name: str) -> Optional[BuyerProfile]:
        """Get buyer profile from database"""
        # This would query your buyer database
        # Return mock profiles for demonstration
        
        profiles = {
            'kingsett': BuyerProfile(
                name="KingSett Capital",
                company="KingSett Capital",
                type="Private Equity",
                aum=14000000000,  # $14B AUM
                target_asset_classes=['multifamily', 'retail', 'industrial', 'office'],
                target_geographies=['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa'],
                min_deal_size=20000000,
                max_deal_size=500000000,
                fund_life_status="EXIT_WINDOW",
                dry_powder=800000000,  # $800M dry powder
                recent_acquisitions=[
                    {'property': 'Portfolio Acquisition', 'city': 'Toronto', 'year': 2024, 'asset_class': 'multifamily'},
                    {'property': 'Industrial Complex', 'city': 'Calgary', 'year': 2024, 'asset_class': 'industrial'}
                ],
                portfolio_gaps=['retail'],
                expansion_markets=['Ottawa', 'Waterloo']
            ),
            'rio_can': BuyerProfile(
                name="RioCan REIT",
                company="RioCan REIT",
                type="REIT",
                aum=15000000000,
                target_asset_classes=['retail', 'mixed_use'],
                target_geographies=['Toronto', 'Ottawa', 'Montreal'],
                min_deal_size=10000000,
                max_deal_size=300000000,
                fund_life_status="N/A",
                recent_acquisitions=[
                    {'property': 'Urban Retail Center', 'city': 'Toronto', 'year': 2024, 'asset_class': 'retail'}
                ],
                thematic_focus=['mixed_use_development', 'urban_intensification']
            ),
            'cpp_investments': BuyerProfile(
                name="CPP Investments",
                company="CPP Investments",
                type="Pension Fund",
                aum=600000000000,  # $600B
                target_asset_classes=['office', 'retail', 'multifamily', 'industrial'],
                target_geographies=['Toronto', 'Vancouver', 'Calgary'],
                min_deal_size=50000000,
                max_deal_size=2000000000,
                fund_life_status="N/A",
                thematic_focus=['core_plus', 'core']
            )
        }
        
        # Normalize buyer name for lookup
        normalized = buyer_name.lower().replace(' ', '_').replace('.', '')
        return profiles.get(normalized)
    
    def _generate_executive_summary(self, buyer_name: str, 
                                   property_data: Dict,
                                   dimensions: List[Dict]) -> str:
        """Generate executive summary of match rationale"""
        asset_class = property_data.get('asset_class', 'commercial')
        price = property_data.get('price', 0)
        city = property_data.get('city', '')
        
        # Find strongest dimensions
        strong_dimensions = [d for d in dimensions if d['score'] >= 70]
        
        summary_parts = [f"{buyer_name} is a"]
        
        # Add fund status indicator
        fund_dim = next((d for d in dimensions if d['dimension'] == 'Fund Lifecycle Timing'), None)
        if fund_dim and fund_dim.get('urgency') == 'critical':
            summary_parts.append("🔥 HIGH-URGENCY")
        elif fund_dim and fund_dim.get('urgency') == 'high':
            summary_parts.append("⏰ ACTIVE")
        
        summary_parts.append(f"strategic match for this {asset_class} asset in {city}")
        
        if price:
            summary_parts.append(f"at ${price/1e6:.1f}M.")
        
        # Add key strengths
        if strong_dimensions:
            summary_parts.append("\n\nKey Match Factors:")
            for dim in strong_dimensions[:3]:
                summary_parts.append(f"\n• {dim['dimension']}: {', '.join(dim['indicators'][:2])}")
        
        return " ".join(summary_parts)
    
    def _generate_asset_recommendation(self, score: int, buyer_name: str, 
                                      asset_class: str) -> str:
        """Generate recommendation text for asset class fit"""
        if score >= 80:
            return f"STRONG MATCH: {buyer_name} has clear {asset_class} acquisition mandate"
        elif score >= 60:
            return f"GOOD FIT: {buyer_name} active in {asset_class}, has acquisition criteria"
        elif score >= 40:
            return f"POTENTIAL: {buyer_name} may consider {asset_class} opportunistically"
        else:
            return f"WEAK: Limited evidence of {asset_class} interest"
    
    def _generate_geo_recommendation(self, score: int, buyer_name: str, 
                                    city: str) -> str:
        """Generate recommendation text for geographic fit"""
        if score >= 80:
            return f"STRONG: {buyer_name} actively expanding in {city}"
        elif score >= 60:
            return f"GOOD: {city} in target market list, existing presence"
        elif score >= 40:
            return f"POSSIBLE: {city} near their core markets"
        else:
            return f"UNCERTAIN: Limited evidence of {city} interest"
    
    def _generate_size_recommendation(self, score: int, buyer_name: str,
                                     price: float) -> str:
        """Generate recommendation text for deal size"""
        if score >= 80:
            return f"OPTIMAL: ${price/1e6:.1f}M fits sweet spot"
        elif score >= 60:
            return f"ACCEPTABLE: ${price/1e6:.1f}M within range"
        elif score >= 40:
            return f"MARGINAL: Size may require approval"
        else:
            return f"MISMATCH: Size outside typical range"
    
    def _generate_fund_recommendation(self, score: int, buyer_name: str,
                                     urgency: str) -> str:
        """Generate recommendation text for fund lifecycle"""
        if urgency == "critical":
            return f"🔥 URGENT: Contact immediately - fund exit requirements"
        elif urgency == "high":
            return f"⏰ HIGH PRIORITY: Active deployment phase"
        elif score >= 60:
            return f"STANDARD: Normal investment timeline"
        else:
            return f"MONITOR: Not currently active"
    
    def _generate_portfolio_recommendation(self, score: int, buyer_name: str) -> str:
        """Generate recommendation text for portfolio needs"""
        if score >= 75:
            return f"STRATEGIC: Fills clear portfolio gap"
        elif score >= 50:
            return f"POSITIVE: Aligns with investment themes"
        else:
            return f"NEUTRAL: No specific strategic driver"


# Singleton
_research_skill = None

def get_buyer_research_skill() -> BuyerResearchSkill:
    """Get or create singleton"""
    global _research_skill
    if _research_skill is None:
        _research_skill = BuyerResearchSkill()
    return _research_skill


if __name__ == "__main__":
    # Demo
    print("="*80)
    print("BUYER RESEARCH SKILL - DEMO")
    print("="*80)
    
    skill = get_buyer_research_skill()
    
    # Research a buyer for Bayshore Mall
    property_data = {
        'address': '100 Bayshore Drive',
        'city': 'Ottawa',
        'region': 'ON',
        'asset_class': 'retail',
        'price': 300000000
    }
    
    result = skill.research_buyer_rationale('KingSett Capital', property_data)
    
    print(f"\n{'='*80}")
    print("EXECUTIVE SUMMARY:")
    print(f"{'='*80}")
    print(result['executive_summary'])
