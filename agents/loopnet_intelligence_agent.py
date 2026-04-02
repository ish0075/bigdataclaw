#!/usr/bin/env python3
"""
LoopNet Intelligence Agent v1.0
Extracts property history, active listings, and agent data from LoopNet
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class LoopNetPropertyData:
    """Property data from LoopNet"""
    address: str
    city: str
    
    # Historical data
    previously_listed: bool = False
    last_listing_date: Optional[str] = None
    last_asking_price: Optional[float] = None
    previous_prices: List[Dict] = field(default_factory=list)
    
    # Current status
    currently_listed: bool = False
    current_price: Optional[float] = None
    current_listing_agent: str = ""
    current_listing_brokerage: str = ""
    days_on_market: int = 0
    listing_url: str = ""
    
    # Property details
    property_type: str = ""
    size_sf: Optional[float] = None
    cap_rate: Optional[float] = None
    
    # Agent info for database
    listing_agent_name: str = ""
    listing_agent_phone: str = ""
    listing_agent_email: str = ""
    listing_agent_company: str = ""
    agent_asset_specialty: str = ""


@dataclass
class CommercialAgent:
    """Agent profile for your database"""
    name: str
    company: str
    phone: str = ""
    email: str = ""
    linkedin: str = ""
    
    # Specialties (from LoopNet listings)
    asset_classes: List[str] = field(default_factory=list)
    markets: List[str] = field(default_factory=list)
    
    # Activity tracking
    active_listings_count: int = 0
    total_listings_history: int = 0
    last_seen_on_loopnet: str = ""
    
    # Collaboration potential
    collaboration_score: int = 0  # 0-100
    notes: str = ""


class LoopNetIntelligenceAgent:
    """
    Extracts LoopNet intelligence for:
    1. Property history enrichment
    2. Active listing detection
    3. Agent database building
    """
    
    def __init__(self):
        print("╔════════════════════════════════════════════════════════════════╗")
        print("║  🔗 LOOPNET INTELLIGENCE AGENT v1.0                            ║")
        print("║     Property History | Active Listings | Agent Database        ║")
        print("╚════════════════════════════════════════════════════════════════╝")
        
        self.agent_database: Dict[str, CommercialAgent] = {}
    
    def generate_loopnet_links(self, address: str, city: str, 
                               property_type: str = "") -> Dict[str, str]:
        """
        Generate all LoopNet-related links for a property
        """
        # Clean inputs for URL
        clean_address = address.replace(' ', '-').replace(',', '').replace('.', '')
        clean_city = city.lower().replace(' ', '-')
        
        links = {
            # Property history and current listing
            'loopnet_property_search': f"https://www.loopnet.com/search/commercial-real-estate/canada/{clean_city}/{clean_address}",
            
            # Direct search (if address doesn't work)
            'loopnet_address_search': f"https://www.loopnet.com/search?q={address.replace(' ', '+')}+{city}",
            
            # City-wide search for this property type
            'loopnet_city_search': f"https://www.loopnet.com/search/commercial-real-estate/canada/{clean_city}/{property_type}/",
            
            # Similar properties (comps)
            'loopnet_comps': f"https://www.loopnet.com/search/commercial-real-estate/canada/{clean_city}/{property_type}/?sort=price&order=desc",
            
            # Recently sold (if available)
            'loopnet_sold': f"https://www.loopnet.com/search/commercial-real-estate/canada/{clean_city}/{property_type}/?saleType=sale",
            
            # Agent search for this market
            'loopnet_agents': f"https://www.loopnet.com/commercial-real-estate/brokers/canada/{clean_city}/",
        }
        
        return links
    
    def extract_property_intelligence(self, address: str, city: str, 
                                     asset_class: str) -> LoopNetPropertyData:
        """
        Template for extracting LoopNet intelligence
        (In production, this would scrape or use API)
        """
        print(f"\n{'='*70}")
        print(f"🔍 LOOPNET INTELLIGENCE FOR: {address}, {city}")
        print(f"{'='*70}")
        
        # This is a template - in production would scrape LoopNet
        intelligence = LoopNetPropertyData(
            address=address,
            city=city,
            property_type=asset_class
        )
        
        # Generate all relevant links
        links = self.generate_loopnet_links(address, city, asset_class)
        intelligence.listing_url = links['loopnet_property_search']
        
        print("🔗 LoopNet Links Generated:")
        for name, url in links.items():
            print(f"  • {name}: {url[:70]}...")
        
        return intelligence
    
    def analyze_agent_from_listing(self, agent_name: str, company: str, 
                                  asset_class: str, market: str) -> CommercialAgent:
        """
        Add or update agent in your collaboration database
        """
        # Create unique key
        agent_key = f"{agent_name}_{company}".lower().replace(' ', '_')
        
        if agent_key in self.agent_database:
            # Update existing agent
            agent = self.agent_database[agent_key]
            
            # Add asset class if new
            if asset_class.lower() not in [a.lower() for a in agent.asset_classes]:
                agent.asset_classes.append(asset_class)
                print(f"  ✓ Added {asset_class} to {agent_name}'s specialties")
            
            # Add market if new
            if market.lower() not in [m.lower() for m in agent.markets]:
                agent.markets.append(market)
            
            # Update activity
            agent.total_listings_history += 1
            agent.last_seen_on_loopnet = datetime.now().strftime('%Y-%m-%d')
            agent.active_listings_count += 1
            
        else:
            # Create new agent profile
            agent = CommercialAgent(
                name=agent_name,
                company=company,
                asset_classes=[asset_class],
                markets=[market],
                active_listings_count=1,
                total_listings_history=1,
                last_seen_on_loopnet=datetime.now().strftime('%Y-%m-%d'),
                collaboration_score=self._calculate_collaboration_score(asset_class, market)
            )
            
            self.agent_database[agent_key] = agent
            print(f"  ✓ New agent added to database: {agent_name} ({company})")
            print(f"    Specialty: {asset_class}")
            print(f"    Market: {market}")
        
        return agent
    
    def _calculate_collaboration_score(self, asset_class: str, market: str) -> int:
        """Calculate how valuable this agent is for collaboration"""
        score = 50  # Base score
        
        # Bonus for Toronto/Ottawa/Vancouver markets
        if market.lower() in ['toronto', 'ottawa', 'vancouver', 'calgary']:
            score += 20
        
        # Bonus for high-volume asset classes
        if asset_class.lower() in ['industrial', 'multifamily', 'retail']:
            score += 15
        
        return min(100, score)
    
    def check_property_status(self, address: str, city: str, asset_class: str) -> Dict:
        """
        Check if property is on LoopNet and gather intelligence
        """
        print(f"\n{'='*70}")
        print(f"🔍 CHECKING LOOPNET FOR: {address}, {city}")
        print(f"{'='*70}")
        
        # Generate search links
        links = self.generate_loopnet_links(address, city, asset_class)
        
        result = {
            'address': address,
            'city': city,
            'asset_class': asset_class,
            'loopnet_search_url': links['loopnet_property_search'],
            'instructions': "",
            'potential_agents_to_add': [],
            'links': links
        }
        
        # Instructions for manual check (until scraper is built)
        result['instructions'] = f"""
HOW TO CHECK LOOPNET:

1. OPEN: {links['loopnet_property_search']}

2. CHECK IF PROPERTY IS LISTED:
   ☐ Search results show this exact address
   ☐ If YES - Note the listing agent (add to database)
   ☐ If YES - Note asking price (compare to your valuation)
   ☐ If YES - Note days on market (pricing intelligence)
   ☐ If NO - Check 'loopnet_address_search' link for variations

3. IF LISTED - GATHER INTEL:
   ☐ Listing agent name & company
   ☐ Asking price
   ☐ Days on market
   ☐ Property details (size, cap rate, etc.)
   ☐ Agent contact info (if available)

4. ADD AGENT TO DATABASE:
   Tell me: "Add LoopNet agent: [Name], [Company], [Asset Class], [Market]"
   I'll add them to your collaboration database.

5. CHECK COMPS:
   Open: {links['loopnet_comps']}
   ☐ See similar properties priced in market
   ☐ Validate your valuation
   ☐ Identify competing listings

6. CHECK AGENTS IN MARKET:
   Open: {links['loopnet_agents']}
   ☐ See top agents in {city}
   ☐ Add relevant ones to your database
   ☐ Potential collaborators for your listings
"""
        
        return result
    
    def get_agent_database(self) -> List[CommercialAgent]:
        """Return all agents in collaboration database"""
        return list(self.agent_database.values())
    
    def format_agent_for_display(self, agent: CommercialAgent) -> str:
        """Format agent profile for display"""
        return f"""
┌─ {agent.name} ({agent.company})
│  Specialties: {', '.join(agent.asset_classes)}
│  Markets: {', '.join(agent.markets)}
│  Active Listings: {agent.active_listings_count}
│  Collaboration Score: {agent.collaboration_score}/100
│  Last Seen: {agent.last_seen_on_loopnet}
│  Contact: {agent.phone or 'TBD'} | {agent.email or 'TBD'}
└─
"""


# Singleton
loopnet_agent = None

def get_loopnet_intelligence_agent() -> LoopNetIntelligenceAgent:
    """Get or create singleton"""
    global loopnet_agent
    if loopnet_agent is None:
        loopnet_agent = LoopNetIntelligenceAgent()
    return loopnet_agent


if __name__ == "__main__":
    # Demo
    print("\n" + "="*70)
    print("LOOPNET INTELLIGENCE AGENT - DEMO")
    print("="*70)
    
    agent = get_loopnet_intelligence_agent()
    
    # Check a property
    result = agent.check_property_status(
        "1500 Michael Drive",
        "Welland",
        "industrial"
    )
    
    print(result['instructions'])
    
    # Add a sample agent from LoopNet
    print("\n" + "="*70)
    print("ADDING AGENT FROM LOOPNET LISTING")
    print("="*70)
    
    new_agent = agent.analyze_agent_from_listing(
        "John Smith",
        "Colliers International",
        "industrial",
        "Welland"
    )
    
    print(agent.format_agent_for_display(new_agent))
