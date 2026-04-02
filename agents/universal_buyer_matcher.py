#!/usr/bin/env python3
"""
Universal Buyer Matcher v4.0
Pre-positioned buyer database for instant activation
Every asset class → Pre-matched buyers → 60-second outreach
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import json


class BuyerTier(Enum):
    A_TIER = "A"      # Call within 1 hour
    B_TIER = "B"      # Email blast + follow-up
    C_TIER = "C"      # Newsletter + weekly touches
    DISTRESS = "DISTRESS"  # Special situation buyers


class AssetClass(Enum):
    INDUSTRIAL = "industrial"
    MULTIFAMILY = "multifamily"
    RETAIL = "retail"
    OFFICE = "office"
    HOSPITALITY = "hospitality"
    LAND = "land"
    SENIOR_LIVING = "senior_living"
    MIXED_USE = "mixed_use"


@dataclass
class PreloadedBuyer:
    """Pre-positioned buyer profile"""
    name: str
    company: str
    tier: BuyerTier
    asset_classes: List[str]
    markets: List[str]
    deal_size_min: float
    deal_size_max: float
    
    # Contact
    phone: str = ""
    email: str = ""
    linkedin: str = ""
    
    # Intelligence
    dry_powder: Optional[float] = None
    fund_status: str = ""  # "EXIT_WINDOW", "FRESH", "MID"
    recent_deals: List[Dict] = field(default_factory=list)
    motivation_score: int = 0  # 0-100
    
    # Triggers
    trigger_words: List[str] = field(default_factory=list)
    
    # Talking points
    talking_points: List[str] = field(default_factory=list)
    
    def get_quick_actions(self) -> Dict[str, str]:
        """Generate quick action links"""
        return {
            'call': f"tel:{self.phone}" if self.phone else "",
            'email': f"mailto:{self.email}?subject=Off-Market Opportunity" if self.email else "",
            'linkedin': self.linkedin,
            'search': f"https://www.google.com/search?q={self.company.replace(' ', '+')}+acquisitions+2024+2025"
        }


class UniversalBuyerMatcher:
    """
    Instant buyer activation system
    Property hits desk → Buyers identified in 60 seconds
    """
    
    def __init__(self):
        print("╔════════════════════════════════════════════════════════════════╗")
        print("║  🏢 UNIVERSAL BUYER MATCHER v4.0                               ║")
        print("║     Pre-Positioned Buyer Database                             ║")
        print("╚════════════════════════════════════════════════════════════════╝")
        
        self.buyer_database: Dict[str, List[PreloadedBuyer]] = {
            'industrial': [],
            'multifamily': [],
            'retail': [],
            'office': [],
            'hospitality': [],
            'land': [],
            'senior_living': [],
            'mixed_use': []
        }
        
        self._initialize_buyer_database()
        print(f"\n✅ Database loaded: {sum(len(v) for v in self.buyer_database.values())} buyers")
    
    def _initialize_buyer_database(self):
        """Initialize pre-positioned buyer database"""
        
        # ========== INDUSTRIAL BUYERS ==========
        self.buyer_database['industrial'] = [
            PreloadedBuyer(
                name="Acquisition Team",
                company="KingSett Capital",
                tier=BuyerTier.A_TIER,
                asset_classes=['industrial', 'logistics', 'warehouse'],
                markets=['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa'],
                deal_size_min=20000000,
                deal_size_max=500000000,
                phone="416-687-6700",
                email="acquisitions@kingsett.ca",
                dry_powder=800000000,
                fund_status="EXIT_WINDOW",
                motivation_score=95,
                trigger_words=['logistics', 'last-mile', 'truck court', 'clear height 32', 'ESG certified'],
                talking_points=[
                    "$800M dry powder - actively deploying",
                    "EXIT WINDOW ACTIVE - must invest by Q3 2026",
                    "Last-mile logistics focus",
                    "Will pay premium for ESG certified assets"
                ]
            ),
            PreloadedBuyer(
                name="Real Estate Investments",
                company="CPP Investments",
                tier=BuyerTier.A_TIER,
                asset_classes=['industrial', 'logistics', 'data center'],
                markets=['Toronto', 'Vancouver', 'Calgary'],
                deal_size_min=50000000,
                deal_size_max=2000000000,
                phone="416-000-0000",
                dry_powder=15000000000,  # $15B allocated to real estate
                fund_status="PERPETUAL",
                motivation_score=85,
                trigger_words=['core', 'core-plus', 'inflation hedge', 'long-term'],
                talking_points=[
                    "$600B total AUM - $15B real estate allocation",
                    "30-50 year investment horizon",
                    "Prefers stabilized, income-producing assets",
                    "Joint venture structures common"
                ]
            ),
            PreloadedBuyer(
                name="Investment Team",
                company="Granite REIT",
                tier=BuyerTier.A_TIER,
                asset_classes=['industrial', 'logistics', 'warehouse'],
                markets=['Toronto', 'GTA', 'Montreal', 'Calgary'],
                deal_size_min=10000000,
                deal_size_max=300000000,
                phone="416-000-0000",
                fund_status="REIT_GROWTH",
                motivation_score=90,
                trigger_words=['logistics', 'modern warehouse', 'infil location'],
                talking_points=[
                    "Must show quarterly acquisition growth",
                    "Modern logistics focus - 32'+ clear height",
                    "Infil locations near major highways",
                    "ESG initiatives - LEED preferred"
                ]
            ),
            PreloadedBuyer(
                name="Crestpoint Real Estate",
                company="Crestpoint Real Estate Investments",
                tier=BuyerTier.A_TIER,
                asset_classes=['industrial', 'office', 'retail'],
                markets=['Toronto', 'GTA', 'Waterloo', 'Ottawa'],
                deal_size_min=10000000,
                deal_size_max=200000000,
                phone="416-000-0000",
                fund_status="ACTIVE_DEPLOYMENT",
                motivation_score=88,
                trigger_words=['value-add', 'GTA', 'development potential'],
                talking_points=[
                    "2019-2020 vintage funds in deployment",
                    "GTA focus with value-add strategy",
                    "Active in suburban office → industrial conversion",
                    "Fast decision-making process"
                ]
            ),
            PreloadedBuyer(
                name="Pure Industrial REIT",
                company="Pure Industrial Real Estate Trust",
                tier=BuyerTier.B_TIER,
                asset_classes=['industrial'],
                markets=['Toronto', 'Vancouver', 'Calgary'],
                deal_size_min=5000000,
                deal_size_max=100000000,
                phone="416-000-0000",
                motivation_score=75,
                trigger_words=['bay street', 'institutional quality'],
                talking_points=[
                    "Public REIT - Bay Street player",
                    "Prefers institutional-quality assets",
                    "Long-term hold strategy"
                ]
            )
        ]
        
        # ========== MULTIFAMILY BUYERS ==========
        self.buyer_database['multifamily'] = [
            PreloadedBuyer(
                name="Mark Kenney",
                company="CAPREIT",
                tier=BuyerTier.A_TIER,
                asset_classes=['multifamily', 'residential'],
                markets=['Toronto', 'Vancouver', 'Montreal', 'Ottawa', 'Calgary'],
                deal_size_min=20000000,
                deal_size_max=500000000,
                phone="416-000-0000",
                dry_powder=500000000,
                fund_status="ACTIVE_DEPLOYMENT",
                motivation_score=92,
                trigger_words=['stabilized', 'rent roll', 'below market rents', 'renovation potential'],
                talking_points=[
                    "$15B AUM - must deploy $500M annually",
                    "Value-add through renovation programs",
                    "Below-market rent = instant upside",
                    "Transit-oriented locations preferred"
                ]
            ),
            PreloadedBuyer(
                name="Minto Group",
                company="Minto Group",
                tier=BuyerTier.A_TIER,
                asset_classes=['multifamily', 'mixed-use'],
                markets=['Toronto', 'Ottawa', 'Calgary'],
                deal_size_min=15000000,
                deal_size_max=300000000,
                phone="613-000-0000",
                motivation_score=88,
                trigger_words=['Toronto', 'Ottawa', 'rent control strategies'],
                talking_points=[
                    "Multi-generational family developer",
                    "Expert in rent control navigation",
                    "Development + acquisition strategy",
                    "Long-term hold philosophy"
                ]
            ),
            PreloadedBuyer(
                name="Boardwalk REIT",
                company="Boardwalk REIT",
                tier=BuyerTier.A_TIER,
                asset_classes=['multifamily'],
                markets=['Edmonton', 'Calgary', 'Saskatchewan', 'Ontario'],
                deal_size_min=10000000,
                deal_size_max=200000000,
                phone="780-000-0000",
                motivation_score=85,
                trigger_words=['value-add', 'Western Canada', 'counter-cyclical'],
                talking_points=[
                    "Value-add specialist",
                    "Counter-cyclical acquisition strategy",
                    "Western Canada focus expanding to Ontario",
                    "Renovation expertise"
                ]
            ),
            PreloadedBuyer(
                name="Starlight Investments",
                company="Starlight Investments",
                tier=BuyerTier.A_TIER,
                asset_classes=['multifamily', 'industrial', 'retail'],
                markets=['Toronto', 'GTA', 'Vancouver', 'Montreal'],
                deal_size_min=20000000,
                deal_size_max=500000000,
                phone="416-000-0000",
                dry_powder=1000000000,
                fund_status="AGGRESSIVE_GROWTH",
                motivation_score=95,
                trigger_words=['aggressive growth', 'scale', 'portfolio'],
                talking_points=[
                    "$20B AUM - aggressive growth mode",
                    "Portfolio acquisitions preferred",
                    "Speed to close is competitive advantage",
                    "Will pay market price for scale"
                ]
            ),
            PreloadedBuyer(
                name="Mainstreet Equity",
                company="Mainstreet Equity Corp",
                tier=BuyerTier.A_TIER,
                asset_classes=['multifamily'],
                markets=['Western Canada', 'Toronto'],
                deal_size_min=10000000,
                deal_size_max=150000000,
                phone="403-000-0000",
                motivation_score=82,
                trigger_words=['Western Canada', 'counter-cyclical'],
                talking_points=[
                    "Counter-cyclical buyer",
                    "Western Canada specialist",
                    "Value-add through repositioning",
                    "Mid-market focus"
                ]
            )
        ]
        
        # ========== RETAIL BUYERS ==========
        self.buyer_database['retail'] = [
            PreloadedBuyer(
                name="RioCan REIT",
                company="RioCan REIT",
                tier=BuyerTier.A_TIER,
                asset_classes=['retail', 'mixed-use', 'grocery-anchored'],
                markets=['Toronto', 'Ottawa', 'Montreal', 'Calgary'],
                deal_size_min=20000000,
                deal_size_max=500000000,
                phone="416-000-0000",
                motivation_score=80,
                trigger_words=['urban intensification', 'redevelopment', 'mixed-use', 'grocery-anchored'],
                talking_points=[
                    "Urban intensification strategy",
                    "Redevelopment plays preferred",
                    "Grocery-anchored resilience focus",
                    "Joint ventures for mixed-use"
                ]
            ),
            PreloadedBuyer(
                name="Choice Properties",
                company="Choice Properties REIT",
                tier=BuyerTier.A_TIER,
                asset_classes=['retail', 'grocery-anchored'],
                markets=['Ontario', 'Quebec', 'Western Canada'],
                deal_size_min=15000000,
                deal_size_max=300000000,
                phone="416-000-0000",
                motivation_score=85,
                trigger_words=['grocery-anchored', 'Loblaw', 'credit tenant'],
                talking_points=[
                    "Loblaw relationship - insider access",
                    "Grocery-anchored resilience",
                    "National portfolio",
                    "Long-term lease structures"
                ]
            ),
            PreloadedBuyer(
                name="KingSett Capital",
                company="KingSett Capital - Retail",
                tier=BuyerTier.A_TIER,
                asset_classes=['retail', 'distressed', 'value-add'],
                markets=['Toronto', 'Ottawa', 'GTA'],
                deal_size_min=20000000,
                deal_size_max=400000000,
                phone="416-687-6700",
                dry_powder=800000000,
                fund_status="EXIT_WINDOW",
                motivation_score=95,
                trigger_words=['dark anchor', 'HBC vacant', 'value-add', 'redevelopment'],
                talking_points=[
                    "Dark anchor specialists - HBC crisis experts",
                    "Value-add retail plays",
                    "Redevelopment to mixed-use",
                    "EXIT WINDOW - must deploy urgently"
                ]
            ),
            PreloadedBuyer(
                name="Slate Office/Retail",
                company="Slate Asset Management",
                tier=BuyerTier.B_TIER,
                asset_classes=['retail', 'office', 'distressed'],
                markets=['Toronto', 'Montreal'],
                deal_size_min=10000000,
                deal_size_max=200000000,
                phone="416-000-0000",
                motivation_score=78,
                trigger_words=['distressed', 'value-add', 'turnaround'],
                talking_points=[
                    "Distressed retail specialists",
                    "Turnaround expertise",
                    "Contrarian investment thesis",
                    "Active asset management"
                ]
            ),
            PreloadedBuyer(
                name="Primaris REIT",
                company="Primaris REIT",
                tier=BuyerTier.B_TIER,
                asset_classes=['retail', 'enclosed malls'],
                markets=['Canada'],
                deal_size_min=20000000,
                deal_size_max=300000000,
                phone="416-000-0000",
                motivation_score=70,
                trigger_words=['enclosed mall', 'grocery-anchored', 'dominant retail'],
                talking_points=[
                    "Enclosed mall specialists",
                    "Grocery-anchored only",
                    "Dominant market position required"
                ]
            )
        ]
        
        # ========== OFFICE BUYERS ==========
        self.buyer_database['office'] = [
            PreloadedBuyer(
                name="Allied Properties",
                company="Allied Properties REIT",
                tier=BuyerTier.A_TIER,
                asset_classes=['office', 'creative office', 'urban'],
                markets=['Toronto', 'Montreal', 'Vancouver', 'Kitchener-Waterloo'],
                deal_size_min=20000000,
                deal_size_max=400000000,
                phone="416-000-0000",
                motivation_score=75,
                trigger_words=['creative office', 'urban', 'TTC', 'tech tenants'],
                talking_points=[
                    "Creative office focus",
                    "Urban locations only - King St, Liberty Village",
                    "Tech tenant preference",
                    "TTC accessibility critical"
                ]
            ),
            PreloadedBuyer(
                name="Dream Office REIT",
                company="Dream Office REIT",
                tier=BuyerTier.A_TIER,
                asset_classes=['office', 'Toronto downtown'],
                markets=['Toronto', 'Calgary'],
                deal_size_min=15000000,
                deal_size_max=300000000,
                phone="416-000-0000",
                motivation_score=70,
                trigger_words=['Toronto downtown', 'selective', 'core'],
                talking_points=[
                    "Highly selective deployment",
                    "Toronto downtown focus",
                    "Core assets only",
                    "Value-add through repositioning"
                ]
            ),
            PreloadedBuyer(
                name="QuadReal",
                company="QuadReal Property Group",
                tier=BuyerTier.A_TIER,
                asset_classes=['office', 'multifamily', 'industrial'],
                markets=['Vancouver', 'Toronto', 'Montreal'],
                deal_size_min=50000000,
                deal_size_max=1000000000,
                phone="604-000-0000",
                motivation_score=72,
                trigger_words=['long-term hold', 'major metros', 'institutional'],
                talking_points=[
                    "BCIMC real estate arm",
                    "30+ year hold periods",
                    "Major metros only",
                    "Institutional grade only"
                ]
            ),
            PreloadedBuyer(
                name="Oxford Properties",
                company="Oxford Properties (OMERS)",
                tier=BuyerTier.A_TIER,
                asset_classes=['office', 'retail', 'mixed-use'],
                markets=['Toronto', 'Vancouver', 'Calgary', 'Montreal'],
                deal_size_min=100000000,
                deal_size_max=2000000000,
                phone="416-000-0000",
                motivation_score=68,
                trigger_words=['landmark', 'trophy', 'downtown core'],
                talking_points=[
                    "Trophy assets only",
                    "Landmark developments",
                    "Downtown core locations",
                    "Major deals $100M+"
                ]
            )
        ]
        
        # ========== LAND BUYERS ==========
        self.buyer_database['land'] = [
            PreloadedBuyer(
                name="Tridel",
                company="Tridel",
                tier=BuyerTier.A_TIER,
                asset_classes=['land', 'condo development', 'mixed-use'],
                markets=['Toronto', 'GTA', 'Ottawa'],
                deal_size_min=10000000,
                deal_size_max=300000000,
                phone="416-000-0000",
                motivation_score=90,
                trigger_words=['condo land', 'spa approved', 'zoning in place', 'infill'],
                talking_points=[
                    "Toronto condo market leader",
                    "Premium prices for SPA approved sites",
                    "Infill locations only",
                    "Transit corridor focus"
                ]
            ),
            PreloadedBuyer(
                name="Menkes Developments",
                company="Menkes Developments",
                tier=BuyerTier.A_TIER,
                asset_classes=['land', 'mixed-use', 'condo'],
                markets=['Toronto', 'GTA', 'Waterloo'],
                deal_size_min=15000000,
                deal_size_max=400000000,
                phone="416-000-0000",
                motivation_score=88,
                trigger_words=['assembly', 'GTA infill', 'mixed-use', 'development'],
                talking_points=[
                    "GTA infill specialists",
                    "Assembly plays",
                    "Mixed-use development focus",
                    "Long-term land banking"
                ]
            ),
            PreloadedBuyer(
                name="City Park Homes",
                company="City Park Homes",
                tier=BuyerTier.A_TIER,
                asset_classes=['land', 'low-rise', 'townhouse'],
                markets=['Toronto', 'Thorold', 'GTA', 'Hamilton'],
                deal_size_min=2000000,
                deal_size_max=50000000,
                phone="905-552-5200",
                motivation_score=85,
                trigger_words=['low-rise', 'Thorold', 'townhouse', 'land'],
                talking_points=[
                    "Low-rise specialist",
                    "Just spent $13.25M cash on 18 acres",
                    "Thorold/GTA focus",
                    "SPA approved sites preferred"
                ]
            ),
            PreloadedBuyer(
                name="SmartCentres REIT",
                company="SmartCentres REIT",
                tier=BuyerTier.A_TIER,
                asset_classes=['land', 'retail-anchored', 'mixed-use'],
                markets=['Canada'],
                deal_size_min=10000000,
                deal_size_max=300000000,
                phone="416-000-0000",
                motivation_score=82,
                trigger_words=['retail-anchored', 'Walmart shadow', 'mixed-use'],
                talking_points=[
                    "Retail-anchored mixed-use",
                    "Walmart shadow anchor plays",
                    "National portfolio",
                    "Development partnerships"
                ]
            ),
            PreloadedBuyer(
                name="First Gulf",
                company="First Gulf Corporation",
                tier=BuyerTier.A_TIER,
                asset_classes=['land', 'industrial', 'logistics'],
                markets=['Toronto', 'GTA', 'Hamilton', 'Ottawa'],
                deal_size_min=10000000,
                deal_size_max=200000000,
                phone="416-000-0000",
                motivation_score=85,
                trigger_words=['industrial land', 'last-mile', 'logistics', 'truck accessible'],
                talking_points=[
                    "Industrial land specialists",
                    "Last-mile logistics focus",
                    "Truck-accessible sites",
                    "Major employer relationships"
                ]
            ),
            PreloadedBuyer(
                name="Mattamy Homes",
                company="Mattamy Homes",
                tier=BuyerTier.A_TIER,
                asset_classes=['land', 'master-planned', 'community'],
                markets=['Toronto', 'GTA', 'Ottawa', 'Calgary'],
                deal_size_min=15000000,
                deal_size_max=400000000,
                phone="905-000-0000",
                motivation_score=80,
                trigger_words=['master-planned', 'community', 'greenfield'],
                talking_points=[
                    "Master-planned communities",
                    "Greenfield development",
                    "Scale plays 100+ acres",
                    "Full community infrastructure"
                ]
            )
        ]
        
        print(f"  • Industrial: {len(self.buyer_database['industrial'])} buyers")
        print(f"  • Multifamily: {len(self.buyer_database['multifamily'])} buyers")
        print(f"  • Retail: {len(self.buyer_database['retail'])} buyers")
        print(f"  • Office: {len(self.buyer_database['office'])} buyers")
        print(f"  • Land: {len(self.buyer_database['land'])} buyers")
    
    def find_instant_buyers(self, property_data: Dict) -> Dict[str, List[Dict]]:
        """
        60-second buyer matching
        Returns tiered buyer lists ready for immediate outreach
        """
        asset_class = property_data.get('asset_class', '').lower()
        price = property_data.get('asking_price', 0)
        city = property_data.get('city', '')
        
        print(f"\n{'='*70}")
        print(f"⚡ INSTANT BUYER MATCHING")
        print(f"{'='*70}")
        print(f"  Asset Class: {asset_class.upper()}")
        print(f"  Price: ${price:,.0f}")
        print(f"  Location: {city}")
        print(f"{'='*70}")
        
        # Get buyers for this asset class
        buyers = self.buyer_database.get(asset_class, [])
        
        if not buyers:
            print(f"  ⚠ No pre-loaded buyers for {asset_class}")
            print(f"  → Checking mixed-use or nearest category...")
            buyers = self.buyer_database.get('mixed_use', [])
        
        # Score and tier buyers
        a_tier = []
        b_tier = []
        c_tier = []
        
        for buyer in buyers:
            score = self._calculate_match_score(buyer, property_data)
            buyer_data = {
                'name': buyer.name,
                'company': buyer.company,
                'tier': buyer.tier.value,
                'match_score': score,
                'phone': buyer.phone,
                'email': buyer.email,
                'talking_points': buyer.talking_points,
                'triggers': buyer.trigger_words,
                'quick_actions': buyer.get_quick_actions(),
                'motivation': buyer.motivation_score
            }
            
            if buyer.tier == BuyerTier.A_TIER and score >= 70:
                a_tier.append(buyer_data)
            elif buyer.tier == BuyerTier.B_TIER and score >= 60:
                b_tier.append(buyer_data)
            else:
                c_tier.append(buyer_data)
        
        # Sort by match score
        a_tier.sort(key=lambda x: x['match_score'], reverse=True)
        b_tier.sort(key=lambda x: x['match_score'], reverse=True)
        
        results = {
            'a_tier_call_now': a_tier[:5],
            'b_tier_email_blast': b_tier[:5],
            'c_tier_newsletter': c_tier[:3],
            'outreach_script': self._generate_outreach_script(property_data, a_tier[:3]),
            'email_template': self._generate_email_template(property_data, b_tier[:5])
        }
        
        self._print_results(results)
        return results
    
    def _calculate_match_score(self, buyer: PreloadedBuyer, property_data: Dict) -> int:
        """Calculate match score 0-100"""
        score = 0
        price = property_data.get('asking_price', 0)
        city = property_data.get('city', '')
        
        # Price range fit (40 points)
        if buyer.deal_size_min <= price <= buyer.deal_size_max:
            score += 40
        elif price * 0.8 <= buyer.deal_size_max:
            score += 25  # Close enough
        
        # Geographic fit (30 points)
        for market in buyer.markets:
            if city.lower() in market.lower() or market.lower() in city.lower():
                score += 30
                break
        
        # Motivation score (20 points)
        score += min(20, buyer.motivation_score // 5)
        
        # Fund status bonus (10 points)
        if buyer.fund_status in ['EXIT_WINDOW', 'AGGRESSIVE_GROWTH']:
            score += 10
        
        return min(100, score)
    
    def _generate_outreach_script(self, property_data: Dict, a_tier: List[Dict]) -> str:
        """Generate phone script for A-tier buyers"""
        address = property_data.get('address', '')
        city = property_data.get('city', '')
        price = property_data.get('asking_price', 0)
        asset_class = property_data.get('asset_class', 'commercial')
        
        script = f"""
╔══════════════════════════════════════════════════════════════════════╗
║ 📞 A-TIER OUTREACH SCRIPT (Call Within 1 Hour)                       ║
╚══════════════════════════════════════════════════════════════════════╝

OPENING:
"Hi [NAME], this is [YOUR NAME] from [YOUR COMPANY]. I know you're 
actively looking for {asset_class} opportunities, and I have something 
that just crossed my desk that fits your criteria perfectly.

THE PITCH:
"It's a {asset_class} property in {city} - {address}. 
Asking ${price:,.0f}. Based on your recent activity with [COMPANY],
this seems right in your wheelhouse.

THE CLOSE:
"I wanted to reach out to you first before I blasted it to my list. 
Can I send you the teaser package right now? What's your best email?"

OBJECTION HANDLING:
• "Can you send me details?" → "Absolutely, what's your email? I'll 
   send the executive summary in the next 5 minutes."

• "I'm busy right now" → "I understand - this one won't last. Can I 
   send you a 3-bullet summary? Takes 30 seconds to review."

• "What's the cap rate?" → "[CAP RATE]% - market rate for this quality. 
   The real story is [UNIQUE VALUE PROPOSITION]."

TOP TARGETS TO CALL:
"""
        for buyer in a_tier:
            script += f"""
┌─ {buyer['company']}
│  Contact: {buyer['name']} | {buyer['phone']}
│  Match Score: {buyer['match_score']}/100
│  Talking Points:
"""
            for point in buyer['talking_points'][:3]:
                script += f"│    • {point}\n"
            script += f"│  [CALL NOW] [EMAIL] [LINKEDIN]\n└\n"
        
        return script
    
    def _generate_email_template(self, property_data: Dict, b_tier: List[Dict]) -> str:
        """Generate email blast template for B-tier buyers"""
        address = property_data.get('address', '')
        city = property_data.get('city', '')
        price = property_data.get('asking_price', 0)
        asset_class = property_data.get('asset_class', 'commercial')
        size = property_data.get('size_sf', property_data.get('lot_acres', 0))
        size_label = 'SF' if property_data.get('size_sf') else 'acres'
        
        template = f"""
╔══════════════════════════════════════════════════════════════════════╗
║ 📧 B-TIER EMAIL BLAST TEMPLATE                                       ║
╚══════════════════════════════════════════════════════════════════════╝

SUBJECT: Off-Market {asset_class.title()} - {city} - ${price/1e6:.1f}M

BODY:
Hi [NAME],

Hope you're doing well. I just took on an off-market {asset_class} 
opportunity in {city} that aligns with your investment criteria:

📍 {address}, {city}
💰 Asking: ${price:,.0f}
📏 Size: {size:,.0f} {size_label}
📊 [Additional key metric - cap rate, NOI, etc.]

Why this might interest {buyer['company'] if b_tier else '[COMPANY]'}:
• [Key selling point 1 - location, tenancy, etc.]
• [Key selling point 2 - value-add opportunity, below market, etc.]
• [Key selling point 3 - timing, seller motivation, etc.]

I'm reaching out to a select group first. Can we schedule a 15-minute 
call this week to discuss?

Best,
[YOUR NAME]
[YOUR PHONE]

---
RECIPIENTS ({len(b_tier)} buyers):
"""
        for buyer in b_tier:
            template += f"  • {buyer['company']} - {buyer['email']}\n"
        
        return template
    
    def _print_results(self, results: Dict):
        """Print formatted results"""
        print("\n" + "="*70)
        print("🎯 INSTANT ACTIVATION COMPLETE")
        print("="*70)
        
        print(f"\n🔥 A-TIER: Call Within 1 Hour ({len(results['a_tier_call_now'])} buyers)")
        print("-"*70)
        for buyer in results['a_tier_call_now']:
            print(f"  {buyer['company']}")
            print(f"    Score: {buyer['match_score']}/100 | 📞 {buyer['phone']}")
            print(f"    Motivation: {buyer['motivation']}/100")
            print()
        
        print(f"\n⚡ B-TIER: Email Blast ({len(results['b_tier_email_blast'])} buyers)")
        print("-"*70)
        for buyer in results['b_tier_email_blast']:
            print(f"  {buyer['company']} - Score: {buyer['match_score']}/100")
        
        print("\n" + "="*70)
        print("⚡ NEXT STEPS:")
        print("="*70)
        print("  1. Call A-tier buyers NOW (script provided above)")
        print("  2. Send email blast to B-tier (template provided)")
        print("  3. Add to newsletter queue for C-tier")
        print("  4. Log all outreach in CRM")
        print("="*70)
    
    def get_buyer_by_company(self, company_name: str) -> Optional[PreloadedBuyer]:
        """Get specific buyer details"""
        for asset_class, buyers in self.buyer_database.items():
            for buyer in buyers:
                if company_name.lower() in buyer.company.lower():
                    return buyer
        return None


# Singleton
_matcher = None

def get_universal_buyer_matcher() -> UniversalBuyerMatcher:
    """Get or create singleton matcher"""
    global _matcher
    if _matcher is None:
        _matcher = UniversalBuyerMatcher()
    return _matcher


if __name__ == "__main__":
    # Demo - Test with various properties
    print("\n" + "="*80)
    print("UNIVERSAL BUYER MATCHER - TOMORROW'S TESTING SYSTEM")
    print("="*80)
    
    matcher = get_universal_buyer_matcher()
    
    # Test Case 1: Industrial
    print("\n\n" + "🔥 TEST CASE 1: INDUSTRIAL")
    matcher.find_instant_buyers({
        'address': '1500 Michael Drive',
        'city': 'Welland',
        'province': 'ON',
        'asset_class': 'industrial',
        'asking_price': 5000000,
        'size_sf': 80000
    })
    
    # Test Case 2: Retail
    print("\n\n" + "🔥 TEST CASE 2: RETAIL")
    matcher.find_instant_buyers({
        'address': '100 Bayshore Drive',
        'city': 'Ottawa',
        'province': 'ON',
        'asset_class': 'retail',
        'asking_price': 300000000,
        'size_sf': 880000
    })
    
    # Test Case 3: Multifamily
    print("\n\n" + "🔥 TEST CASE 3: MULTIFAMILY")
    matcher.find_instant_buyers({
        'address': '123 Main Street',
        'city': 'Toronto',
        'province': 'ON',
        'asset_class': 'multifamily',
        'asking_price': 25000000,
        'size_sf': 50000
    })
    
    # Test Case 4: Land
    print("\n\n" + "🔥 TEST CASE 4: LAND")
    matcher.find_instant_buyers({
        'address': '75 Ormond St S',
        'city': 'Thorold',
        'province': 'ON',
        'asset_class': 'land',
        'asking_price': 4820000,
        'lot_acres': 1.7
    })
