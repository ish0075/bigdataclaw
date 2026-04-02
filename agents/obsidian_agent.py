#!/usr/bin/env python3
"""
Obsidian Agent - Seasoned Real Estate Database Expert
Central intelligence hub for property data, calculations, and agent coordination
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
import re
import json
import os

# Import existing integrations
try:
    from obsidian_integration import ObsidianIntegration
except ImportError:
    ObsidianIntegration = None


@dataclass
class PropertyMetrics:
    """Calculated property metrics"""
    cap_rate: Optional[float] = None
    price_per_sf: Optional[float] = None
    price_per_acre: Optional[float] = None
    price_per_lot: Optional[float] = None
    price_per_unit: Optional[float] = None
    grm: Optional[float] = None  # Gross Rent Multiplier
    noi: Optional[float] = None
    going_in_yield: Optional[float] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'cap_rate': self.cap_rate,
            'price_per_sf': self.price_per_sf,
            'price_per_acre': self.price_per_acre,
            'price_per_lot': self.price_per_lot,
            'price_per_unit': self.price_per_unit,
            'grm': self.grm,
            'noi': self.noi,
            'going_in_yield': self.going_in_yield
        }


@dataclass
class PropertyKnowledge:
    """Complete property knowledge base entry"""
    property_id: str
    address: str
    city: str
    region: str
    asset_class: str
    property_type: str
    price: float
    size_sf: Optional[float] = None
    lot_size_acres: Optional[float] = None
    lot_count: Optional[int] = None
    unit_count: Optional[int] = None
    noi: Optional[float] = None
    occupancy: Optional[float] = None
    year_built: Optional[int] = None
    condition: Optional[str] = None
    metrics: Optional[PropertyMetrics] = None
    comparable_sales: List[Dict] = None
    buyer_history: List[Dict] = None
    agent_contacts: List[Dict] = None
    last_updated: datetime = None
    data_sources: List[str] = None
    
    def __post_init__(self):
        if self.comparable_sales is None:
            self.comparable_sales = []
        if self.buyer_history is None:
            self.buyer_history = []
        if self.agent_contacts is None:
            self.agent_contacts = []
        if self.last_updated is None:
            self.last_updated = datetime.now()
        if self.data_sources is None:
            self.data_sources = []


class ObsidianRealEstateExpert:
    """
    Seasoned Real Estate Database Expert Agent
    
    Specializations:
    - All commercial asset classes (8 categories)
    - Financial metric calculations (cap rate, $/sf, $/acre, etc.)
    - Property database intelligence
    - Agent coordination for data gathering
    - Obsidian vault integration
    
    Knowns:
    - Every property in the database
    - Every buyer and their criteria
    - Every transaction history
    - Every agent and broker
    """
    
    def __init__(self, data_path: str = "~/CortexOS/workspace", 
                 vault_path: str = "~/Obsidian Vault"):
        self.data_path = os.path.expanduser(data_path)
        self.vault_path = os.path.expanduser(vault_path)
        
        # Knowledge bases
        self.property_db: Dict[str, PropertyKnowledge] = {}
        self.buyer_db: Dict[str, Dict] = {}
        self.transaction_db: pd.DataFrame = None
        self.agent_db: Dict[str, Dict] = {}
        
        # Asset class expertise
        self.asset_classes = {
            'multifamily': {
                'metrics': ['price_per_unit', 'cap_rate', 'grm'],
                'key_drivers': ['location', 'unit_mix', 'rent_growth'],
                'typical_buyers': ['CAPREIT', 'Boardwalk', 'Pension Funds']
            },
            'retail': {
                'metrics': ['price_per_sf', 'cap_rate', 'sales_per_sf'],
                'key_drivers': ['anchor_tenants', 'traffic', 'demographics'],
                'typical_buyers': ['RioCan', 'SmartCentres', 'Primaris']
            },
            'industrial': {
                'metrics': ['price_per_sf', 'cap_rate', 'clear_height'],
                'key_drivers': ['logistics_access', 'ceiling_height', 'loading'],
                'typical_buyers': ['Dream Industrial', 'Pure Industrial', 'CPPIB']
            },
            'office': {
                'metrics': ['price_per_sf', 'cap_rate', 'tenant_quality'],
                'key_drivers': ['class', 'transit', 'tenant_credit'],
                'typical_buyers': ['Allied', 'Dream Office', 'Pension Funds']
            },
            'hospitality': {
                'metrics': ['price_per_key', 'revpar', 'noi_per_key'],
                'key_drivers': ['brand', 'location', 'occupancy'],
                'typical_buyers': ['Hospitality REITs', 'Private Equity']
            },
            'senior_living': {
                'metrics': ['price_per_bed', 'occupancy_cost', 'govt_funding'],
                'key_drivers': ['operator', 'care_level', 'demographics'],
                'typical_buyers': ['Chartwell', 'Sienna', 'Healthcare REITs']
            },
            'land': {
                'metrics': ['price_per_acre', 'price_per_lot', 'price_per_sf_buildable'],
                'key_drivers': ['zoning', 'approvals', 'infrastructure'],
                'typical_buyers': ['Mattamy', 'Great Gulf', 'Land Developers']
            },
            'mixed_use': {
                'metrics': ['price_per_sf', 'residential_component', 'retail_component'],
                'key_drivers': ['integration', 'parking', 'phasing'],
                'typical_buyers': ['Urban Developers', 'Pension Funds']
            }
        }
        
        # Obsidian integration
        self.obsidian = None
        if ObsidianIntegration:
            try:
                self.obsidian = ObsidianIntegration()
            except Exception as e:
                print(f"Obsidian integration not available: {e}")
        
        # Load all data
        self._load_knowledge_base()
    
    def _load_knowledge_base(self):
        """Load all property, buyer, and transaction data"""
        print("🏛️ Obsidian Agent: Loading knowledge base...")
        
        # Load transactions
        tx_path = os.path.join(self.data_path, 'data_export.csv')
        if os.path.exists(tx_path):
            self.transaction_db = pd.read_csv(tx_path)
            print(f"  ✓ Loaded {len(self.transaction_db)} transactions")
            self._build_property_database()
        
        # Load buyers
        buyer_path = os.path.join(self.data_path, 'new_data.csv')
        if os.path.exists(buyer_path):
            buyer_df = pd.read_csv(buyer_path)
            for _, row in buyer_df.iterrows():
                self.buyer_db[row.get('company_name', 'Unknown')] = row.to_dict()
            print(f"  ✓ Loaded {len(self.buyer_db)} buyer profiles")
        
        print(f"🏛️ Knowledge base ready: {len(self.property_db)} properties indexed")
    
    def _build_property_database(self):
        """Build comprehensive property knowledge base from transactions"""
        if self.transaction_db is None:
            return
        
        for _, row in self.transaction_db.iterrows():
            prop_id = f"{row.get('address', 'Unknown')}_{row.get('city', 'Unknown')}"
            
            # Calculate metrics
            metrics = self.calculate_metrics(
                price=row.get('sale_price', 0),
                size_sf=row.get('size_sf'),
                lot_acres=row.get('lot_size_acres'),
                lot_count=row.get('lot_count'),
                unit_count=row.get('unit_count'),
                noi=row.get('noi'),
                asset_class=row.get('asset_class', 'unknown')
            )
            
            prop = PropertyKnowledge(
                property_id=prop_id,
                address=row.get('address', ''),
                city=row.get('city', ''),
                region=row.get('region', ''),
                asset_class=row.get('asset_class', 'unknown'),
                property_type=row.get('property_type', ''),
                price=row.get('sale_price', 0),
                size_sf=row.get('size_sf'),
                lot_size_acres=row.get('lot_size_acres'),
                lot_count=row.get('lot_count'),
                unit_count=row.get('unit_count'),
                noi=row.get('noi'),
                occupancy=row.get('occupancy_percent'),
                year_built=row.get('year_built'),
                condition=row.get('condition'),
                metrics=metrics,
                data_sources=['transaction_db']
            )
            
            self.property_db[prop_id] = prop
    
    def calculate_metrics(self, price: float, size_sf: Optional[float] = None,
                         lot_acres: Optional[float] = None, 
                         lot_count: Optional[int] = None,
                         unit_count: Optional[int] = None,
                         noi: Optional[float] = None,
                         asset_class: str = 'unknown') -> PropertyMetrics:
        """
        Calculate all relevant property metrics based on asset class
        
        Returns:
            PropertyMetrics: Complete metrics object
        """
        metrics = PropertyMetrics()
        
        # Cap Rate (universal metric)
        if noi and price > 0:
            metrics.cap_rate = (noi / price) * 100
            metrics.noi = noi
        
        # Price per Square Foot (most asset classes)
        if size_sf and size_sf > 0 and price > 0:
            metrics.price_per_sf = price / size_sf
        
        # Price per Acre (land, industrial, some retail)
        if lot_acres and lot_acres > 0 and price > 0:
            metrics.price_per_acre = price / lot_acres
        
        # Price per Lot (land subdivisions)
        if lot_count and lot_count > 0 and price > 0:
            metrics.price_per_lot = price / lot_count
        
        # Price per Unit (multifamily, hospitality, senior living)
        if unit_count and unit_count > 0 and price > 0:
            metrics.price_per_unit = price / unit_count
        
        # GRM (Gross Rent Multiplier) for income properties
        if noi and metrics.cap_rate and metrics.cap_rate > 0:
            # Estimate gross rent from NOI (assuming 35-40% expense ratio)
            estimated_expense_ratio = 0.37  # industry average
            estimated_gross_rent = noi / (1 - estimated_expense_ratio)
            if estimated_gross_rent > 0:
                metrics.grm = price / estimated_gross_rent
        
        # Going-in Yield (for value-add properties)
        if metrics.cap_rate:
            metrics.going_in_yield = metrics.cap_rate
        
        return metrics
    
    def query_property(self, address: str = None, city: str = None, 
                      asset_class: str = None) -> List[PropertyKnowledge]:
        """
        Query the property knowledge base
        
        Args:
            address: Property address (partial match)
            city: City name
            asset_class: Asset class filter
            
        Returns:
            List of matching PropertyKnowledge objects
        """
        results = []
        
        for prop_id, prop in self.property_db.items():
            match = True
            
            if address and address.lower() not in prop.address.lower():
                match = False
            if city and city.lower() not in prop.city.lower():
                match = False
            if asset_class and asset_class.lower() != prop.asset_class.lower():
                match = False
            
            if match:
                results.append(prop)
        
        # Sort by most recent
        results.sort(key=lambda x: x.last_updated, reverse=True)
        return results
    
    def get_property_metrics(self, address: str, city: str) -> Optional[PropertyMetrics]:
        """Get calculated metrics for a specific property"""
        prop_id = f"{address}_{city}"
        
        # Exact match
        if prop_id in self.property_db:
            return self.property_db[prop_id].metrics
        
        # Partial match
        for pid, prop in self.property_db.items():
            if address.lower() in prop.address.lower() and city.lower() in prop.city.lower():
                return prop.metrics
        
        return None
    
    def get_comparable_properties(self, property_data: Dict, 
                                  radius: str = 'same_region') -> List[PropertyKnowledge]:
        """
        Find comparable properties based on asset class, size, and location
        
        Args:
            property_data: Dict with property details
            radius: 'same_city', 'same_region', 'same_province', 'national'
            
        Returns:
            List of comparable PropertyKnowledge objects
        """
        asset_class = property_data.get('asset_class', '').lower()
        city = property_data.get('city', '').lower()
        region = property_data.get('region', '').lower()
        price = property_data.get('price', 0)
        size_sf = property_data.get('size_sf')
        
        comparables = []
        
        for prop in self.property_db.values():
            # Must match asset class
            if prop.asset_class.lower() != asset_class:
                continue
            
            # Location filter
            if radius == 'same_city' and city not in prop.city.lower():
                continue
            if radius == 'same_region' and region not in prop.region.lower():
                continue
            
            # Size similarity (±50%)
            if size_sf and prop.size_sf:
                if not (0.5 <= prop.size_sf / size_sf <= 2.0):
                    continue
            
            # Price similarity (±50%)
            if price > 0 and prop.price > 0:
                if not (0.5 <= prop.price / price <= 2.0):
                    continue
            
            comparables.append(prop)
        
        # Sort by most similar (closest price)
        if price > 0:
            comparables.sort(key=lambda x: abs(x.price - price) if x.price else float('inf'))
        
        return comparables[:10]  # Top 10
    
    def get_market_statistics(self, region: str, asset_class: str) -> Dict[str, Any]:
        """
        Calculate market statistics for a region and asset class
        
        Returns:
            Dict with market metrics
        """
        properties = [
            p for p in self.property_db.values()
            if region.lower() in p.region.lower() 
            and p.asset_class.lower() == asset_class.lower()
        ]
        
        if not properties:
            return {'error': 'No data available'}
        
        # Collect metrics
        cap_rates = [p.metrics.cap_rate for p in properties if p.metrics and p.metrics.cap_rate]
        prices_sf = [p.metrics.price_per_sf for p in properties if p.metrics and p.metrics.price_per_sf]
        prices_acre = [p.metrics.price_per_acre for p in properties if p.metrics and p.metrics.price_per_acre]
        
        stats = {
            'property_count': len(properties),
            'avg_price': np.mean([p.price for p in properties]),
            'median_price': np.median([p.price for p in properties]),
            'price_range': (min(p.price for p in properties), max(p.price for p in properties)),
        }
        
        if cap_rates:
            stats['avg_cap_rate'] = np.mean(cap_rates)
            stats['median_cap_rate'] = np.median(cap_rates)
            stats['cap_rate_range'] = (min(cap_rates), max(cap_rates))
        
        if prices_sf:
            stats['avg_price_per_sf'] = np.mean(prices_sf)
            stats['median_price_per_sf'] = np.median(prices_sf)
        
        if prices_acre:
            stats['avg_price_per_acre'] = np.mean(prices_acre)
            stats['median_price_per_acre'] = np.median(prices_acre)
        
        return stats
    
    def coordinate_data_gathering(self, property_data: Dict, 
                                  agents_to_call: List[str] = None) -> Dict[str, Any]:
        """
        Coordinate with other agents to gather comprehensive property data
        
        Args:
            property_data: Initial property information
            agents_to_call: List of agent names to invoke (default: all)
            
        Returns:
            Dict with consolidated data from all agents
        """
        if agents_to_call is None:
            agents_to_call = ['transaction_scout', 'hot_money', 'portfolio', 'agent_finder', 'lender']
        
        print(f"\n🎯 Obsidian Agent: Coordinating data gathering for {property_data.get('address')}")
        
        gathered_data = {
            'property_input': property_data,
            'timestamp': datetime.now().isoformat(),
            'coordinating_agents': agents_to_call,
            'results': {}
        }
        
        # Check local knowledge base first
        existing = self.query_property(
            address=property_data.get('address'),
            city=property_data.get('city'),
            asset_class=property_data.get('asset_class')
        )
        
        if existing:
            print(f"  ✓ Found {len(existing)} existing properties in knowledge base")
            gathered_data['results']['local_knowledge'] = {
                'existing_properties': [p.__dict__ for p in existing[:5]],
                'comparable_properties': self.get_comparable_properties(property_data)
            }
        
        # Calculate metrics if financial data available
        if property_data.get('price'):
            metrics = self.calculate_metrics(
                price=property_data['price'],
                size_sf=property_data.get('size_sf'),
                lot_acres=property_data.get('lot_size_acres'),
                lot_count=property_data.get('lot_count'),
                unit_count=property_data.get('unit_count'),
                noi=property_data.get('noi'),
                asset_class=property_data.get('asset_class', 'unknown')
            )
            gathered_data['results']['calculated_metrics'] = metrics.to_dict()
            print(f"  ✓ Calculated metrics: Cap Rate {metrics.cap_rate:.2f}%" if metrics.cap_rate else "  ✓ Calculated metrics")
        
        # Market statistics
        if property_data.get('region') and property_data.get('asset_class'):
            market_stats = self.get_market_statistics(
                property_data['region'],
                property_data['asset_class']
            )
            gathered_data['results']['market_statistics'] = market_stats
            print(f"  ✓ Generated market statistics for {property_data['region']}")
        
        # Asset class guidance
        asset_class = property_data.get('asset_class', '').lower()
        if asset_class in self.asset_classes:
            gathered_data['results']['asset_class_guidance'] = self.asset_classes[asset_class]
            print(f"  ✓ Loaded asset class guidance for {asset_class}")
        
        return gathered_data
    
    def create_property_note(self, property_data: Dict, 
                            research_results: Dict = None) -> str:
        """
        Create a comprehensive Obsidian note for a property
        
        Returns:
            Path to created note
        """
        if not self.obsidian:
            print("Obsidian integration not available")
            return None
        
        address = property_data.get('address', 'Unknown Property')
        city = property_data.get('city', 'Unknown City')
        
        # Generate note content
        content = self._generate_property_note_content(property_data, research_results)
        
        # Save to Obsidian
        safe_name = f"{address.replace(' ', '_').replace('/', '_')}_{city}"[:60]
        path = f"/BigDataClaw/Properties/{safe_name}.md"
        
        try:
            # This would use obsidian_integration to save
            # For now, return the content
            return content
        except Exception as e:
            print(f"Error creating note: {e}")
            return None
    
    def _generate_property_note_content(self, property_data: Dict, 
                                       research_results: Dict = None) -> str:
        """Generate comprehensive markdown content for property note"""
        
        address = property_data.get('address', '')
        city = property_data.get('city', '')
        price = property_data.get('price', 0)
        
        # Get metrics
        metrics = None
        if research_results and 'calculated_metrics' in research_results.get('results', {}):
            m = research_results['results']['calculated_metrics']
            metrics = PropertyMetrics(**m)
        elif price:
            metrics = self.calculate_metrics(
                price=price,
                size_sf=property_data.get('size_sf'),
                lot_acres=property_data.get('lot_size_acres'),
                asset_class=property_data.get('asset_class', 'unknown')
            )
        
        # Build frontmatter
        frontmatter = f"""---
date: {datetime.now().strftime('%Y-%m-%d')}
address: "{address}"
city: {city}
region: {property_data.get('region', '')}
asset-class: {property_data.get('asset_class', '')}
property-type: {property_data.get('property_type', '')}
price: {price}
"""
        
        if metrics:
            if metrics.cap_rate:
                frontmatter += f"cap-rate: {metrics.cap_rate:.2f}\n"
            if metrics.price_per_sf:
                frontmatter += f"price-per-sf: {metrics.price_per_sf:.2f}\n"
            if metrics.price_per_acre:
                frontmatter += f"price-per-acre: {metrics.price_per_acre:.2f}\n"
            if metrics.price_per_lot:
                frontmatter += f"price-per-lot: {metrics.price_per_lot:.2f}\n"
            if metrics.price_per_unit:
                frontmatter += f"price-per-unit: {metrics.price_per_unit:.2f}\n"
        
        frontmatter += "status: research\n"
        frontmatter += "tags:\n"
        frontmatter += f"  - asset/{property_data.get('asset_class', 'unknown')}\n"
        frontmatter += f"  - region/{property_data.get('region', 'unknown').lower()}\n"
        frontmatter += f"  - status/research\n"
        frontmatter += "---\n\n"
        
        # Body content
        body = f"# {address}\n\n"
        body += f"## Property Overview\n\n"
        body += f"| Attribute | Value |\n"
        body += f"|-----------|-------|\n"
        body += f"| **Address** | {address} |\n"
        body += f"| **City** | {city} |\n"
        body += f"| **Region** | {property_data.get('region', 'N/A')} |\n"
        body += f"| **Asset Class** | {property_data.get('asset_class', 'N/A')} |\n"
        body += f"| **Property Type** | {property_data.get('property_type', 'N/A')} |\n"
        body += f"| **Price** | ${price:,.0f} |\n"
        
        if metrics:
            body += f"\n## Financial Metrics\n\n"
            body += f"| Metric | Value |\n"
            body += f"|--------|-------|\n"
            if metrics.cap_rate:
                body += f"| **Cap Rate** | {metrics.cap_rate:.2f}% |\n"
            if metrics.price_per_sf:
                body += f"| **Price/SF** | ${metrics.price_per_sf:.2f} |\n"
            if metrics.price_per_acre:
                body += f"| **Price/Acre** | ${metrics.price_per_acre:,.2f} |\n"
            if metrics.price_per_lot:
                body += f"| **Price/Lot** | ${metrics.price_per_lot:,.2f} |\n"
            if metrics.price_per_unit:
                body += f"| **Price/Unit** | ${metrics.price_per_unit:,.2f} |\n"
            if metrics.grm:
                body += f"| **GRM** | {metrics.grm:.2f}x |\n"
        
        body += f"\n## Research Notes\n\n"
        body += f"*Generated by Obsidian Agent on {datetime.now().strftime('%Y-%m-%d %H:%M')}*\n\n"
        body += "### Next Steps\n\n"
        body += "- [ ] Gather additional property details\n"
        body += "- [ ] Identify comparable sales\n"
        body += "- [ ] Match with potential buyers\n"
        body += "- [ ] Contact listing agent\n"
        
        return frontmatter + body
    
    def answer_question(self, question: str, context: Dict = None) -> str:
        """
        Answer natural language questions about properties
        
        Examples:
        - "What's the cap rate for Bayshore Mall?"
        - "Show me all retail properties in Ottawa"
        - "What should I offer for a 100,000 sf warehouse in Mississauga?"
        """
        question_lower = question.lower()
        
        # Parse question type
        if 'cap rate' in question_lower:
            return self._answer_cap_rate_question(question, context)
        elif 'price per' in question_lower or '$/sf' in question_lower:
            return self._answer_price_metric_question(question, context)
        elif 'show me' in question_lower or 'list' in question_lower:
            return self._answer_listing_question(question, context)
        elif 'offer' in question_lower or 'should i pay' in question_lower:
            return self._answer_valuation_question(question, context)
        else:
            return self._answer_general_question(question, context)
    
    def _answer_cap_rate_question(self, question: str, context: Dict) -> str:
        """Answer cap rate specific questions"""
        # Try to extract property from context or question
        if context and 'property' in context:
            prop = context['property']
            metrics = self.get_property_metrics(prop.get('address'), prop.get('city'))
            if metrics and metrics.cap_rate:
                return f"The cap rate for {prop.get('address')} is {metrics.cap_rate:.2f}%"
        
        # Generic market cap rate
        if context and 'asset_class' in context and 'region' in context:
            stats = self.get_market_statistics(context['region'], context['asset_class'])
            if 'avg_cap_rate' in stats:
                return f"Average cap rate for {context['asset_class']} in {context['region']} is {stats['avg_cap_rate']:.2f}%"
        
        return "I need more information to determine the cap rate. Please provide the property address or asset class and region."
    
    def _answer_price_metric_question(self, question: str, context: Dict) -> str:
        """Answer price per sf/acre/lot questions"""
        # Implementation similar to cap rate
        return "Price metric analysis requires property details. Please provide the property information."
    
    def _answer_listing_question(self, question: str, context: Dict) -> str:
        """Answer listing/show me questions"""
        # Parse asset class and location from question
        # This would use NLP in a full implementation
        return "I can help you find properties. Please specify the asset class and region you're interested in."
    
    def _answer_valuation_question(self, question: str, context: Dict) -> str:
        """Answer valuation/offer questions"""
        return "To provide a valuation recommendation, I need the property address, size, and current financials."
    
    def _answer_general_question(self, question: str, context: Dict) -> str:
        """Answer general property questions"""
        return f"I'm the Obsidian Real Estate Expert. I can help you with:\n- Property metrics (cap rate, $/sf, $/acre)\n- Comparable sales analysis\n- Market statistics\n- Buyer matching\n\nWhat specific property are you researching?"


# Singleton instance for global access
_obsidian_agent = None

def get_obsidian_agent() -> ObsidianRealEstateExpert:
    """Get or create singleton Obsidian Agent instance"""
    global _obsidian_agent
    if _obsidian_agent is None:
        _obsidian_agent = ObsidianRealEstateExpert()
    return _obsidian_agent


if __name__ == "__main__":
    # Test the agent
    agent = ObsidianRealEstateExpert()
    
    # Test query
    print("\n" + "="*60)
    print("OBSIDIAN AGENT TEST")
    print("="*60)
    
    # Test Bayshore Mall
    test_property = {
        'address': '100 Bayshore Dr',
        'city': 'Ottawa',
        'region': 'Ottawa',
        'asset_class': 'retail',
        'property_type': 'regional_mall',
        'price': 300000000,
        'size_sf': 880000,
        'noi': 15400000
    }
    
    print(f"\n🎯 Researching: {test_property['address']}")
    results = agent.coordinate_data_gathering(test_property)
    
    if 'calculated_metrics' in results['results']:
        m = results['results']['calculated_metrics']
        print(f"\n📊 Calculated Metrics:")
        print(f"  Cap Rate: {m.get('cap_rate', 'N/A')}")
        print(f"  Price/SF: ${m.get('price_per_sf', 'N/A')}")
    
    # Test question answering
    print(f"\n❓ Q: What's the cap rate for Bayshore Mall?")
    answer = agent.answer_question("What's the cap rate for Bayshore Mall?", 
                                   {'property': test_property})
    print(f"💬 A: {answer}")
    
    print("\n" + "="*60)
    print("TEST COMPLETE")
    print("="*60)
