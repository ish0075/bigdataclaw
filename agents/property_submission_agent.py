#!/usr/bin/env python3
"""
Property Submission Agent
Handles incoming commercial property submissions from listing agents
Coordinates full deal team assembly and buyer matching
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import json

from agents.buyer_database import get_buyer_database


class PropertyStatus(Enum):
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    ANALYSIS_COMPLETE = "analysis_complete"
    BUYERS_MATCHED = "buyers_matched"
    AGENTS_ASSIGNED = "agents_assigned"
    LENDERS_MATCHED = "lenders_matched"
    PACKAGE_COMPLETE = "package_complete"
    OUTREACH_INITIATED = "outreach_initiated"


@dataclass
class PropertySubmission:
    """Commercial property submission from listing agent"""
    # Property Details
    address: str
    city: str
    province: str = "ON"
    asset_class: str = ""  # multifamily, retail, industrial, office, etc.
    property_type: str = ""  # high-rise, mall, warehouse, etc.
    
    # Financials
    asking_price: Optional[float] = None
    noi: Optional[float] = None
    cap_rate: Optional[float] = None
    
    # Physical
    size_sf: Optional[float] = None
    lot_size_acres: Optional[float] = None
    year_built: Optional[int] = None
    stories: Optional[int] = None
    
    # Tenancy
    occupancy: Optional[float] = None
    walt: Optional[float] = None  # Weighted Average Lease Term
    anchor_tenants: List[str] = field(default_factory=list)
    tenant_roster: List[Dict] = field(default_factory=list)
    
    # Submission Metadata
    listing_agent_name: str = ""
    listing_agent_company: str = ""
    listing_agent_email: str = ""
    listing_agent_phone: str = ""
    submission_date: datetime = field(default_factory=datetime.now)
    
    # Analysis Results (populated by system)
    status: PropertyStatus = PropertyStatus.SUBMITTED
    calculated_metrics: Dict = field(default_factory=dict)
    matched_buyers: List[Dict] = field(default_factory=list)
    matched_agents: List[Dict] = field(default_factory=list)
    matched_lenders: List[Dict] = field(default_factory=list)
    comparable_sales: List[Dict] = field(default_factory=list)
    market_analysis: Dict = field(default_factory=dict)
    
    def to_dict(self) -> Dict:
        return {
            'address': self.address,
            'city': self.city,
            'province': self.province,
            'asset_class': self.asset_class,
            'property_type': self.property_type,
            'asking_price': self.asking_price,
            'noi': self.noi,
            'cap_rate': self.cap_rate,
            'size_sf': self.size_sf,
            'occupancy': self.occupancy,
            'listing_agent': {
                'name': self.listing_agent_name,
                'company': self.listing_agent_company,
                'email': self.listing_agent_email,
                'phone': self.listing_agent_phone
            },
            'status': self.status.value,
            'buyer_count': len(self.matched_buyers),
            'agent_count': len(self.matched_agents),
            'lender_count': len(self.matched_lenders)
        }


class PropertySubmissionAgent:
    """
    Central hub for commercial property submissions
    Coordinates deal team assembly and comprehensive matching
    """
    
    def __init__(self, orchestrator=None):
        self.submissions: Dict[str, PropertySubmission] = {}
        self.orchestrator = orchestrator
        print("🏛️ Property Submission Agent initialized")
    
    def submit_property(self, property_data: Dict) -> PropertySubmission:
        """
        Accept new property submission from listing agent
        
        Args:
            property_data: Dict with property details
            
        Returns:
            PropertySubmission object with tracking ID
        """
        # Create submission object
        submission = PropertySubmission(
            address=property_data.get('address', ''),
            city=property_data.get('city', ''),
            province=property_data.get('province', 'ON'),
            asset_class=property_data.get('asset_class', '').lower(),
            property_type=property_data.get('property_type', ''),
            asking_price=property_data.get('asking_price'),
            noi=property_data.get('noi'),
            cap_rate=property_data.get('cap_rate'),
            size_sf=property_data.get('size_sf'),
            lot_size_acres=property_data.get('lot_size_acres'),
            year_built=property_data.get('year_built'),
            occupancy=property_data.get('occupancy'),
            walt=property_data.get('walt'),
            anchor_tenants=property_data.get('anchor_tenants', []),
            tenant_roster=property_data.get('tenant_roster', []),
            listing_agent_name=property_data.get('listing_agent_name', ''),
            listing_agent_company=property_data.get('listing_agent_company', ''),
            listing_agent_email=property_data.get('listing_agent_email', ''),
            listing_agent_phone=property_data.get('listing_agent_phone', '')
        )
        
        # Generate tracking ID
        tracking_id = f"{submission.city}_{datetime.now().strftime('%Y%m%d')}_{len(self.submissions)+1}"
        self.submissions[tracking_id] = submission
        
        print(f"\n{'='*80}")
        print(f"📥 NEW PROPERTY SUBMISSION: {tracking_id}")
        print(f"{'='*80}")
        print(f"  Address: {submission.address}")
        print(f"  City: {submission.city}")
        print(f"  Asset Class: {submission.asset_class}")
        print(f"  Asking Price: ${submission.asking_price:,.0f}" if submission.asking_price else "  Asking Price: TBD")
        print(f"  Listing Agent: {submission.listing_agent_name} ({submission.listing_agent_company})")
        
        return submission, tracking_id
    
    def process_submission(self, tracking_id: str) -> Dict[str, Any]:
        """
        Full processing pipeline for a property submission
        
        This is the MAIN WORKFLOW that coordinates all agents and skills
        """
        if tracking_id not in self.submissions:
            return {'error': f'Submission {tracking_id} not found'}
        
        submission = self.submissions[tracking_id]
        submission.status = PropertyStatus.UNDER_REVIEW
        
        print(f"\n{'='*80}")
        print(f"🔍 PROCESSING SUBMISSION: {tracking_id}")
        print(f"{'='*80}")
        
        results = {
            'tracking_id': tracking_id,
            'property': submission.to_dict(),
            'processing_phases': []
        }
        
        # Phase 1: Property Analysis & Metrics Calculation
        phase1 = self._phase1_property_analysis(submission)
        results['processing_phases'].append(phase1)
        
        # Phase 2: Buyer Matching (Top 5 with justification)
        phase2 = self._phase2_buyer_matching(submission)
        results['processing_phases'].append(phase2)
        submission.matched_buyers = phase2.get('buyers', [])
        
        # Phase 3: Deal Team Assembly (Expert Agents)
        phase3 = self._phase3_deal_team_assembly(submission)
        results['processing_phases'].append(phase3)
        submission.matched_agents = phase3.get('agents', [])
        
        # Phase 4: Lender Matching
        phase4 = self._phase4_lender_matching(submission)
        results['processing_phases'].append(phase4)
        submission.matched_lenders = phase4.get('lenders', [])
        
        # Phase 5: Recent Seller Intelligence
        phase5 = self._phase5_recent_seller_intelligence(submission)
        results['processing_phases'].append(phase5)
        
        # Phase 6: Comparable Sales & Market Analysis
        phase6 = self._phase6_market_analysis(submission)
        results['processing_phases'].append(phase6)
        submission.comparable_sales = phase6.get('comparables', [])
        submission.market_analysis = phase6.get('market_stats', {})
        
        # Phase 7: Contact Enrichment & Quick Links
        phase7 = self._phase7_contact_enrichment(submission)
        results['processing_phases'].append(phase7)
        
        # Phase 8: Generate Deal Package
        phase8 = self._phase8_generate_deal_package(submission)
        results['processing_phases'].append(phase8)
        
        submission.status = PropertyStatus.PACKAGE_COMPLETE
        
        print(f"\n{'='*80}")
        print(f"✅ PROCESSING COMPLETE: {tracking_id}")
        print(f"{'='*80}")
        print(f"  Matched Buyers: {len(submission.matched_buyers)}")
        print(f"  Deal Team Agents: {len(submission.matched_agents)}")
        print(f"  Lenders: {len(submission.matched_lenders)}")
        print(f"  Status: {submission.status.value}")
        
        return results
    
    def _phase1_property_analysis(self, submission: PropertySubmission) -> Dict:
        """Phase 1: Calculate all property metrics"""
        print(f"\n📊 Phase 1: Property Analysis")
        print("-"*80)
        
        # Import Obsidian Agent for calculations
        try:
            from agents.obsidian_agent import get_obsidian_agent
            obsidian = get_obsidian_agent()
            
            # Calculate metrics
            metrics = obsidian.calculate_metrics(
                price=submission.asking_price or 0,
                size_sf=submission.size_sf,
                lot_acres=submission.lot_size_acres,
                unit_count=submission.tenant_roster[0].get('unit_count') if submission.tenant_roster else None,
                noi=submission.noi,
                asset_class=submission.asset_class
            )
            
            submission.calculated_metrics = metrics.to_dict()
            
            print(f"  ✓ Cap Rate: {metrics.cap_rate:.2f}%" if metrics.cap_rate else "  • Cap Rate: N/A")
            print(f"  ✓ Price/SF: ${metrics.price_per_sf:.2f}" if metrics.price_per_sf else "  • Price/SF: N/A")
            print(f"  ✓ Price/Acre: ${metrics.price_per_acre:,.2f}" if metrics.price_per_acre else "")
            
            return {
                'phase': 'property_analysis',
                'status': 'complete',
                'metrics': submission.calculated_metrics
            }
        except Exception as e:
            print(f"  ⚠ Error: {e}")
            return {'phase': 'property_analysis', 'status': 'error', 'error': str(e)}
    
    def _phase2_buyer_matching(self, submission: PropertySubmission) -> Dict:
        """Phase 2: Match top 5 buyers with detailed justification"""
        print(f"\n🎯 Phase 2: Buyer Matching (Top 5)")
        print("-"*80)
        
        buyers = []
        
        # First: Query Hot Money Buyer Database
        try:
            buyer_db = get_buyer_database()
            hot_money_buyers = buyer_db.find_matches(
                asset_class=submission.asset_class,
                city=submission.city,
                min_deal_size=(submission.asking_price or 0) * 0.3 if submission.asking_price else None,
                max_deal_size=(submission.asking_price or 0) * 2 if submission.asking_price else None,
                limit=5
            )
            
            for buyer_record in hot_money_buyers:
                buyers.append({
                    'name': buyer_record.name,
                    'company': buyer_record.company,
                    'match_score': buyer_record.match_score,
                    'type': 'Hot Money',
                    'contact_info': {
                        'email': buyer_record.email,
                        'phone': buyer_record.phone,
                        'linkedin': buyer_record.linkedin
                    },
                    'justification': buyer_record.why_matched or f"Recent ${buyer_record.recent_deal_amount:,.0f} deal | {buyer_record.priority}",
                    'recent_activity': [{
                        'type': 'acquisition',
                        'amount': buyer_record.recent_deal_amount,
                        'date': buyer_record.recent_deal_date,
                        'asset_class': buyer_record.recent_deal_type
                    }] if buyer_record.recent_deal_amount > 0 else [],
                    'talking_points': buyer_record.talking_points,
                    'source': buyer_record.source_type
                })
            
            print(f"  ✓ Found {len(hot_money_buyers)} hot money buyers from database")
        except Exception as e:
            print(f"  ⚠ Buyer database error: {e}")
        
        # Second: Get from orchestrator (recent sellers with capital)
        if self.orchestrator:
            try:
                property_data = {
                    'address': submission.address,
                    'city': submission.city,
                    'region': submission.province,
                    'asset_class': submission.asset_class,
                    'price': submission.asking_price or 0,
                    'size_sf': submission.size_sf
                }
                
                results = self.orchestrator.research_property(property_data)
                
                # Extract buyers from results
                if 'matches' in results:
                    for buyer in results['matches'].get('hot_money_buyers', [])[:3]:
                        buyers.append({
                            'name': buyer.get('name', 'Unknown'),
                            'company': buyer.get('company', 'Unknown'),
                            'match_score': buyer.get('match_score', 0),
                            'match_breakdown': buyer.get('match_breakdown', {}),
                            'contact_info': buyer.get('contact_info', {}),
                            'justification': self._generate_buyer_justification(buyer, submission),
                            'recent_activity': buyer.get('recent_activity', []),
                            'portfolio_info': buyer.get('portfolio_info', {}),
                            'hot_money_rank': buyer.get('hot_money_rank'),
                            'type': 'Recent Seller'
                        })
            except Exception as e:
                print(f"  ⚠ Orchestrator error: {e}")
        
        # Sort by score and deduplicate
        buyers.sort(key=lambda x: x.get('match_score', 0), reverse=True)
        
        # Remove duplicates by company name
        seen_companies = set()
        unique_buyers = []
        for buyer in buyers:
            company = buyer.get('company', '').lower()
            if company and company not in seen_companies:
                seen_companies.add(company)
                unique_buyers.append(buyer)
            elif not company:
                unique_buyers.append(buyer)
        
        buyers = unique_buyers[:5]
        
        print(f"  ✓ Matched {len(buyers)} qualified buyers")
        for i, buyer in enumerate(buyers, 1):
            company = buyer.get('company', 'Unknown')
            score = buyer.get('match_score', 0)
            btype = buyer.get('type', '')
            print(f"    {i}. {company} - Score: {score} [{btype}]")
        
        return {'phase': 'buyer_matching', 'status': 'complete', 'buyers': buyers}
    
    def _generate_buyer_justification(self, buyer: Dict, submission: PropertySubmission) -> str:
        """Generate detailed justification for why this buyer was selected"""
        justifications = []
        
        # Asset class fit
        if buyer.get('portfolio_info', {}).get('asset_class_match'):
            justifications.append(f"Active {submission.asset_class} investor")
        
        # Geographic fit
        if buyer.get('portfolio_info', {}).get('geographic_match'):
            justifications.append(f"Has presence in {submission.city} market")
        
        # Deal size fit
        if buyer.get('portfolio_info', {}).get('deal_size_match'):
            price_range = ""
            if submission.asking_price:
                if submission.asking_price < 5000000:
                    price_range = "under $5M"
                elif submission.asking_price < 20000000:
                    price_range = "$5M-$20M"
                elif submission.asking_price < 50000000:
                    price_range = "$20M-$50M"
                else:
                    price_range = "$50M+"
            justifications.append(f"Targets {price_range} deals")
        
        # Recent activity
        if buyer.get('recent_activity'):
            recent = buyer['recent_activity'][0]
            justifications.append(f"Recently acquired {recent.get('property', 'similar asset')}")
        
        # Hot money
        if buyer.get('hot_money_rank') == 'A':
            justifications.append("🔥 Hot money - actively deploying capital")
        
        return " | ".join(justifications) if justifications else "Strategic fit"
    
    def _query_buyer_database(self, submission: PropertySubmission) -> List[Dict]:
        """Query buyer database for matches"""
        # This would connect to your buyer database
        # Return top 5 matches based on asset class, geography, price
        return []
    
    def _phase3_deal_team_assembly(self, submission: PropertySubmission) -> Dict:
        """Phase 3: Assemble expert deal team agents"""
        print(f"\n🤝 Phase 3: Deal Team Assembly")
        print("-"*80)
        
        agents = []
        
        # Find agents specializing in this asset class
        asset_class_agents = self._find_specialist_agents(submission.asset_class, submission.city)
        agents.extend(asset_class_agents)
        
        # Find agents with recent sales in price range
        price_range_agents = self._find_price_range_agents(
            submission.asking_price,
            submission.city,
            submission.asset_class
        )
        agents.extend(price_range_agents)
        
        # Find buyer agents (represent buyers in this space)
        buyer_agents = self._find_buyer_agents(submission.asset_class, submission.city)
        agents.extend(buyer_agents)
        
        print(f"  ✓ Assembled {len(agents)} deal team agents")
        for agent in agents[:5]:
            print(f"    • {agent.get('name')} ({agent.get('company')}) - {agent.get('specialty', 'Generalist')}")
        
        return {'phase': 'deal_team_assembly', 'status': 'complete', 'agents': agents}
    
    def _find_specialist_agents(self, asset_class: str, city: str) -> List[Dict]:
        """Find agents specializing in this asset class"""
        # Query agent database for specialists
        specialists = []
        
        # Map asset classes to specialties
        specialty_map = {
            'multifamily': ['Multifamily Investment', 'Residential Investment'],
            'retail': ['Retail Investment', 'Shopping Centers'],
            'industrial': ['Industrial Investment', 'Logistics'],
            'office': ['Office Investment', 'Commercial Investment'],
            'land': ['Land Development', 'Investment Land'],
            'hospitality': ['Hospitality Investment', 'Hotels']
        }
        
        specialties = specialty_map.get(asset_class.lower(), ['Commercial Investment'])
        
        # This would query your agent database
        # Return agents with matching specialties in the market
        
        return specialists
    
    def _find_price_range_agents(self, price: Optional[float], city: str, asset_class: str) -> List[Dict]:
        """Find agents who've recently sold similar properties in this price range"""
        agents = []
        
        if not price:
            return agents
        
        # Determine price tier
        if price < 5000000:
            tier = "under_5m"
        elif price < 20000000:
            tier = "5m_to_20m"
        elif price < 50000000:
            tier = "20m_to_50m"
        else:
            tier = "over_50m"
        
        # Query for agents with recent sales in this tier
        # This would check transaction database
        
        return agents
    
    def _find_buyer_agents(self, asset_class: str, city: str) -> List[Dict]:
        """Find buyer agents (represent buyers, not sellers)"""
        # Query for agents who represent buyers in this space
        return []
    
    def _phase4_lender_matching(self, submission: PropertySubmission) -> Dict:
        """Phase 4: Match appropriate lenders"""
        print(f"\n🏦 Phase 4: Lender Matching")
        print("-"*80)
        
        lenders = []
        
        if not submission.asking_price:
            return {'phase': 'lender_matching', 'status': 'skipped', 'reason': 'No price provided'}
        
        # Calculate typical loan amount (60-75% LTV)
        loan_amount = submission.asking_price * 0.65  # 65% LTV assumption
        
        # Match lenders by asset class and loan size
        lenders = self._match_lenders(
            asset_class=submission.asset_class,
            loan_amount=loan_amount,
            city=submission.city
        )
        
        print(f"  ✓ Matched {len(lenders)} potential lenders")
        for lender in lenders[:3]:
            print(f"    • {lender.get('name')} - {lender.get('type')}")
        
        return {'phase': 'lender_matching', 'status': 'complete', 'lenders': lenders}
    
    def _match_lenders(self, asset_class: str, loan_amount: float, city: str) -> List[Dict]:
        """Match lenders based on criteria"""
        lenders = []
        
        # Define lender profiles
        lender_database = [
            {
                'name': 'RBC Commercial Banking',
                'type': 'Big 6 Bank',
                'min_loan': 5000000,
                'max_loan': 500000000,
                'asset_classes': ['multifamily', 'retail', 'industrial', 'office'],
                'contact': {'name': 'Commercial Team', 'phone': '1-800-RBC-1234'}
            },
            {
                'name': 'KingSett Mortgage',
                'type': 'Private Lender',
                'min_loan': 10000000,
                'max_loan': 300000000,
                'asset_classes': ['multifamily', 'retail', 'industrial', 'office'],
                'contact': {'name': 'Scott Coates', 'phone': '416-687-6702'}
            },
            {
                'name': 'Manulife Real Estate',
                'type': 'Life Company',
                'min_loan': 20000000,
                'max_loan': 500000000,
                'asset_classes': ['multifamily', 'office', 'retail'],
                'contact': {'name': 'Origination Team', 'phone': '416-000-0000'}
            },
            {
                'name': 'Firm Capital',
                'type': 'Private Lender',
                'min_loan': 2000000,
                'max_loan': 50000000,
                'asset_classes': ['multifamily', 'retail', 'industrial'],
                'contact': {'name': 'Lending Team', 'phone': '416-000-0000'}
            }
        ]
        
        for lender in lender_database:
            # Check loan amount fit
            if lender['min_loan'] <= loan_amount <= lender['max_loan']:
                # Check asset class fit
                if asset_class.lower() in [a.lower() for a in lender['asset_classes']]:
                    lenders.append(lender)
        
        return lenders
    
    def _phase5_recent_seller_intelligence(self, submission: PropertySubmission) -> Dict:
        """Phase 5: Find recent sellers of similar properties"""
        print(f"\n📈 Phase 5: Recent Seller Intelligence")
        print("-"*80)
        
        recent_sellers = []
        
        # Query transaction database for recent sales
        # of similar properties in same market
        
        # This helps identify:
        # - Who's been selling (might want to buy again)
        # - Market trends
        # - Pricing benchmarks
        
        print(f"  ✓ Found {len(recent_sellers)} recent comparable sales")
        
        return {'phase': 'recent_seller_intelligence', 'status': 'complete', 'recent_sellers': recent_sellers}
    
    def _phase6_market_analysis(self, submission: PropertySubmission) -> Dict:
        """Phase 6: Market analysis and comparables"""
        print(f"\n📊 Phase 6: Market Analysis")
        print("-"*80)
        
        try:
            from agents.obsidian_agent import get_obsidian_agent
            obsidian = get_obsidian_agent()
            
            # Get comparables
            comparables = obsidian.get_comparable_properties({
                'asset_class': submission.asset_class,
                'region': submission.province,
                'price': submission.asking_price or 0,
                'size_sf': submission.size_sf
            })
            
            # Get market stats
            market_stats = obsidian.get_market_statistics(
                submission.city,
                submission.asset_class
            )
            
            print(f"  ✓ Found {len(comparables)} comparable sales")
            if 'avg_cap_rate' in market_stats:
                print(f"  ✓ Market avg cap rate: {market_stats['avg_cap_rate']:.2f}%")
            
            return {
                'phase': 'market_analysis',
                'status': 'complete',
                'comparables': comparables,
                'market_stats': market_stats
            }
        except Exception as e:
            print(f"  ⚠ Error: {e}")
            return {'phase': 'market_analysis', 'status': 'error', 'error': str(e)}
    
    def _phase7_contact_enrichment(self, submission: PropertySubmission) -> Dict:
        """Phase 7: Enrich all contacts with quick links"""
        print(f"\n📇 Phase 7: Contact Enrichment")
        print("-"*80)
        
        # Enrich buyers
        for buyer in submission.matched_buyers:
            buyer['quick_links'] = self._generate_quick_links(buyer, 'buyer')
        
        # Enrich agents
        for agent in submission.matched_agents:
            agent['quick_links'] = self._generate_quick_links(agent, 'agent')
        
        # Enrich lenders
        for lender in submission.matched_lenders:
            lender['quick_links'] = self._generate_quick_links(lender, 'lender')
        
        print(f"  ✓ Enriched {len(submission.matched_buyers)} buyers")
        print(f"  ✓ Enriched {len(submission.matched_agents)} agents")
        print(f"  ✓ Enriched {len(submission.matched_lenders)} lenders")
        
        return {'phase': 'contact_enrichment', 'status': 'complete'}
    
    def _generate_quick_links(self, entity: Dict, entity_type: str) -> Dict[str, str]:
        """Generate quick links for an entity"""
        links = {}
        
        name = entity.get('name', '')
        company = entity.get('company', entity.get('name', ''))
        
        # LinkedIn search
        links['linkedin'] = f"https://www.linkedin.com/search/results/people/?keywords={company.replace(' ', '%20')}"
        
        # Google search
        links['google'] = f"https://www.google.com/search?q={company.replace(' ', '+')}"
        
        if entity_type == 'buyer':
            # Company website
            links['website'] = f"https://www.google.com/search?q={company.replace(' ', '+')}+official+website"
            # Recent deals
            links['recent_deals'] = f"https://www.google.com/search?q={company.replace(' ', '+')}+real+estate+acquisitions+2024+2025"
            
        elif entity_type == 'agent':
            # Brokerage website
            links['brokerage'] = f"https://www.google.com/search?q={company.replace(' ', '+')}+brokerage"
            # Current listings
            links['listings'] = f"https://www.google.com/search?q={name.replace(' ', '+')}+listings"
            
        elif entity_type == 'lender':
            # Lending criteria
            links['lending'] = f"https://www.google.com/search?q={company.replace(' ', '+')}+commercial+real+estate+lending"
        
        return links
    
    def _phase8_generate_deal_package(self, submission: PropertySubmission) -> Dict:
        """Phase 8: Generate complete deal package"""
        print(f"\n📦 Phase 8: Generating Deal Package")
        print("-"*80)
        
        package = {
            'property_summary': {
                'address': submission.address,
                'city': submission.city,
                'asset_class': submission.asset_class,
                'asking_price': submission.asking_price,
                'metrics': submission.calculated_metrics
            },
            'target_buyers': submission.matched_buyers[:5],
            'deal_team': submission.matched_agents[:5],
            'lenders': submission.matched_lenders[:3],
            'comparables': submission.comparable_sales[:5],
            'market_data': submission.market_analysis,
            'listing_agent': {
                'name': submission.listing_agent_name,
                'company': submission.listing_agent_company,
                'email': submission.listing_agent_email,
                'phone': submission.listing_agent_phone
            },
            'generated_at': datetime.now().isoformat()
        }
        
        print(f"  ✓ Deal package generated")
        print(f"  ✓ Ready for outreach")
        
        return {'phase': 'deal_package', 'status': 'complete', 'package': package}
    
    def get_deal_package(self, tracking_id: str) -> Optional[Dict]:
        """Get complete deal package for a submission"""
        if tracking_id not in self.submissions:
            return None
        
        submission = self.submissions[tracking_id]
        
        return {
            'tracking_id': tracking_id,
            'status': submission.status.value,
            'property': submission.to_dict(),
            'buyers': submission.matched_buyers,
            'agents': submission.matched_agents,
            'lenders': submission.matched_lenders,
            'comparables': submission.comparable_sales,
            'market_stats': submission.market_analysis
        }


# Singleton instance
_submission_agent = None

def get_submission_agent() -> PropertySubmissionAgent:
    """Get or create singleton submission agent"""
    global _submission_agent
    if _submission_agent is None:
        _submission_agent = PropertySubmissionAgent()
    return _submission_agent


if __name__ == "__main__":
    # Demo
    print("="*80)
    print("PROPERTY SUBMISSION AGENT - DEMO")
    print("="*80)
    
    agent = get_submission_agent()
    
    # Submit a property
    property_data = {
        'address': '100 Bayshore Dr',
        'city': 'Ottawa',
        'province': 'ON',
        'asset_class': 'retail',
        'property_type': 'regional_mall',
        'asking_price': 300000000,
        'size_sf': 880000,
        'noi': 15400000,
        'occupancy': 75,
        'listing_agent_name': 'John Smith',
        'listing_agent_company': 'Colliers',
        'listing_agent_email': 'john.smith@colliers.com',
        'listing_agent_phone': '613-555-0000'
    }
    
    submission, tracking_id = agent.submit_property(property_data)
    
    print(f"\n{'='*80}")
    print(f"Demo complete! Tracking ID: {tracking_id}")
    print(f"{'='*80}")
