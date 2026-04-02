#!/usr/bin/env python3
"""
BigDataClaw Agent Orchestrator
Coordinates all research agents for property matching
Includes Obsidian Real Estate Expert for property intelligence
"""

import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import json
from dataclasses import dataclass

# Import Obsidian Real Estate Expert
try:
    from agents.obsidian_agent import get_obsidian_agent, ObsidianRealEstateExpert
except ImportError:
    ObsidianRealEstateExpert = None

@dataclass
class PropertySubmission:
    address: str
    city: str
    region: str
    asset_class: str
    price: float
    size_sf: Optional[float] = None
    property_type: Optional[str] = None

@dataclass
class MatchResult:
    entity_type: str  # 'buyer', 'agent', 'lender'
    name: str
    company: str
    match_score: int
    match_breakdown: Dict[str, int]
    contact_info: Dict[str, str]
    quick_actions: Dict[str, str]
    recent_activity: List[Dict]
    portfolio_info: Optional[Dict] = None
    hot_money_rank: Optional[str] = None  # 'A', 'B', 'C'

class AgentOrchestrator:
    """
    Main orchestrator that coordinates research agents
    Phase 0: Obsidian Expert (property intelligence & calculations)
    Phases 1-6: Specialized research agents
    """
    
    def __init__(self, data_path: str = "~/CortexOS/workspace"):
        self.data_path = data_path
        self.data_sources = {
            'transactions': None,
            'buyers': None,
            'fresh_leads': None
        }
        # Initialize Obsidian Real Estate Expert
        self.obsidian_expert = None
        if ObsidianRealEstateExpert:
            try:
                self.obsidian_expert = get_obsidian_agent()
                print("✓ Obsidian Real Estate Expert initialized")
            except Exception as e:
                print(f"⚠ Obsidian Expert not available: {e}")
        self._load_data()
    
    def _load_data(self):
        """Load all CSV data sources"""
        try:
            import os
            base = os.path.expanduser(self.data_path)
            
            # Load transaction data
            tx_path = os.path.join(base, 'data_export.csv')
            if os.path.exists(tx_path):
                self.data_sources['transactions'] = pd.read_csv(tx_path)
                print(f"Loaded {len(self.data_sources['transactions'])} transactions")
            
            # Load buyer database
            buyer_path = os.path.join(base, 'new_data.csv')
            if os.path.exists(buyer_path):
                self.data_sources['buyers'] = pd.read_csv(buyer_path)
                print(f"Loaded {len(self.data_sources['buyers'])} buyer records")
            
            # Load fresh leads
            fresh_path = os.path.join(base, 'fresh_data.csv')
            if os.path.exists(fresh_path):
                self.data_sources['fresh_leads'] = pd.read_csv(fresh_path)
                print(f"Loaded {len(self.data_sources['fresh_leads'])} fresh leads")
                
        except Exception as e:
            print(f"Error loading data: {e}")
    
    def research_property(self, property_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main entry point - orchestrates all agents
        Phase 0: Obsidian Expert Analysis
        Phases 1-6: Specialized research agents
        """
        prop = PropertySubmission(**property_data)
        print(f"\n{'='*60}")
        print(f"BigDataClaw Property Research")
        print(f"{'='*60}")
        print(f"Property: {prop.address}")
        print(f"Asset Class: {prop.asset_class}")
        print(f"Price: ${prop.price:,.0f}")
        print(f"Region: {prop.region}")
        
        results = {
            'property': property_data,
            'research_timestamp': datetime.now().isoformat(),
            'agents_executed': [],
            'matches': {
                'hot_money_buyers': [],
                'portfolio_matches': [],
                'active_agents': [],
                'matched_lenders': []
            }
        }
        
        # Phase 0: Obsidian Real Estate Expert
        if self.obsidian_expert:
            print("\n🏛️ Phase 0: Obsidian Expert Analysis")
            try:
                obsidian_results = self.obsidian_expert.coordinate_data_gathering(
                    property_data,
                    agents_to_call=['transaction_scout']  # Lightweight for now
                )
                results['obsidian_analysis'] = obsidian_results
                results['agents_executed'].append('obsidian_expert')
                
                # Add calculated metrics if available
                if 'calculated_metrics' in obsidian_results.get('results', {}):
                    metrics = obsidian_results['results']['calculated_metrics']
                    results['calculated_metrics'] = metrics
                    
                    # Print key metrics
                    if metrics.get('cap_rate'):
                        print(f"  📊 Cap Rate: {metrics['cap_rate']:.2f}%")
                    if metrics.get('price_per_sf'):
                        print(f"  📊 Price/SF: ${metrics['price_per_sf']:.2f}")
                    if metrics.get('price_per_acre'):
                        print(f"  📊 Price/Acre: ${metrics['price_per_acre']:,.2f}")
                    if metrics.get('price_per_lot'):
                        print(f"  📊 Price/Lot: ${metrics['price_per_lot']:,.2f}")
                
                # Add comparables
                if 'comparable_properties' in obsidian_results.get('results', {}):
                    comparables = obsidian_results['results']['comparable_properties']
                    results['comparable_properties'] = comparables
                    print(f"  📋 Found {len(comparables)} comparable properties")
                
                # Add market stats
                if 'market_statistics' in obsidian_results.get('results', {}):
                    stats = obsidian_results['results']['market_statistics']
                    results['market_statistics'] = stats
                    if 'avg_cap_rate' in stats:
                        print(f"  📈 Market Avg Cap Rate: {stats['avg_cap_rate']:.2f}%")
                
            except Exception as e:
                print(f"  ⚠ Obsidian analysis error: {e}")
        
        # Phase 1: Transaction Scout
        print("\nPhase 1: Transaction Scout Agent")
        recent_deals = self._transaction_scout(prop)
        results['agents_executed'].append('transaction_scout')
        results['recent_deals_found'] = len(recent_deals)
        print(f"  Found {len(recent_deals)} recent transactions")
        
        # Phase 2: Hot Money Identifier
        print("\nPhase 2: Hot Money Identifier")
        hot_money = self._identify_hot_money(recent_deals, prop)
        results['matches']['hot_money_buyers'] = hot_money
        results['agents_executed'].append('hot_money_identifier')
        print(f"  Identified {len(hot_money)} hot money targets")
        
        # Phase 3: Portfolio Analyzer
        print("\nPhase 3: Portfolio Analyzer")
        portfolio_matches = self._analyze_portfolios(prop)
        results['matches']['portfolio_matches'] = portfolio_matches
        results['agents_executed'].append('portfolio_analyzer')
        print(f"  Found {len(portfolio_matches)} portfolio matches")
        
        # Phase 4: Agent Finder
        print("\nPhase 4: Agent Finder")
        agents = self._find_active_agents(recent_deals, prop)
        results['matches']['active_agents'] = agents
        results['agents_executed'].append('agent_finder')
        print(f"  Found {len(agents)} active agents")
        
        # Phase 5: Lender Matcher
        print("\nPhase 5: Lender Matcher")
        lenders = self._match_lenders(prop)
        results['matches']['matched_lenders'] = lenders
        results['agents_executed'].append('lender_matcher')
        print(f"  Found {len(lenders)} matching lenders")
        
        # Phase 6: Score & Rank All
        print("\nPhase 6: Scoring Engine")
        all_matches = self._score_all_matches(results['matches'], prop)
        results['top_matches'] = sorted(
            all_matches, 
            key=lambda x: x['match_score'], 
            reverse=True
        )[:20]
        print(f"  Scored {len(all_matches)} total matches")
        if results['top_matches']:
            print(f"  Top match score: {results['top_matches'][0]['match_score']}")
        
        return results
    
    def _transaction_scout(self, prop: PropertySubmission) -> pd.DataFrame:
        """Find recent transactions (0-90 days) in same asset class/region"""
        df = self.data_sources['transactions']
        if df is None or df.empty:
            return pd.DataFrame()
        
        # Parse dates
        df['sales.date'] = pd.to_datetime(df['sales.date'], errors='coerce')
        
        # Calculate date range (365 days ago - expanded for data availability)
        cutoff_date = datetime.now() - timedelta(days=365)
        
        # Filter by date
        recent = df[df['sales.date'] >= cutoff_date].copy()
        
        # Filter by region (exact match or province)
        region_mask = (
            (recent['sales.region'].str.contains(prop.region, case=False, na=False)) |
            (recent['sales.city'].str.contains(prop.city, case=False, na=False)) |
            (recent['companys.province'].str.contains('Ontario', case=False, na=False))
        )
        recent = recent[region_mask]
        
        # Filter by price range (0.5x to 2x target)
        price_mask = (
            (recent['sales.price'] >= prop.price * 0.5) & 
            (recent['sales.price'] <= prop.price * 2)
        )
        recent = recent[price_mask]
        
        return recent
    
    def _identify_hot_money(self, recent_deals: pd.DataFrame, prop: PropertySubmission) -> List[Dict]:
        """Identify sellers who have capital from recent sales"""
        if recent_deals.empty:
            return []
        
        # Group by seller (contact_type = 'Seller')
        sellers = recent_deals[recent_deals['contact_type'] == 'Seller'].copy()
        
        hot_money = []
        for _, row in sellers.iterrows():
            # Calculate days since sale
            sale_date = pd.to_datetime(row['sales.date'])
            days_ago = (datetime.now() - sale_date).days
            sale_price = row['sales.price'] if pd.notna(row['sales.price']) else 0
            
            # Calculate hot money score
            score = 0
            # Capital availability (0-30 pts)
            if sale_price >= prop.price * 0.8:
                score += 30
            elif sale_price >= prop.price * 0.5:
                score += 20
            elif sale_price > 0:
                score += 10
            
            # Recency (0-20 pts)
            if days_ago <= 30:
                score += 20
            elif days_ago <= 60:
                score += 15
            else:
                score += 10
            
            # Contact quality (0-10 pts)
            if pd.notna(row['email']) and '@' in str(row['email']):
                score += 4
            if pd.notna(row['linkedin']) and 'linkedin' in str(row['linkedin']):
                score += 3
            if pd.notna(row['companys.phone']):
                score += 2
            if row.get('verified') == 1:
                score += 1
            
            # Determine rank
            if score >= 45:
                rank = 'A'
            elif score >= 35:
                rank = 'B'
            else:
                rank = 'C'
            
            hot_money.append({
                'entity_type': 'buyer',
                'name': row['companys.company_name'] if pd.notna(row['companys.company_name']) else row['full_name'],
                'company': row['companys.company_name'] if pd.notna(row['companys.company_name']) else '',
                'contact_name': row['full_name'] if pd.notna(row['full_name']) else '',
                'match_score': min(100, score + 20),
                'match_breakdown': {
                    'capital_score': min(30, int(sale_price / prop.price * 15)) if prop.price > 0 else 0,
                    'recency_score': 20 if days_ago <= 30 else 15 if days_ago <= 60 else 10,
                    'contact_quality': sum([
                        4 if pd.notna(row['email']) else 0,
                        3 if pd.notna(row['linkedin']) else 0,
                        2 if pd.notna(row['companys.phone']) else 0,
                        1 if row.get('verified') == 1 else 0
                    ])
                },
                'contact_info': {
                    'email': row['email'] if pd.notna(row['email']) else '',
                    'phone': row['companys.phone'] if pd.notna(row['companys.phone']) else '',
                    'linkedin': row['linkedin'] if pd.notna(row['linkedin']) else '',
                    'title': row.get('job_title', '') if pd.notna(row.get('job_title', '')) else ''
                },
                'quick_actions': {
                    'email': f"mailto:{row['email']}?subject=Investment Opportunity - {prop.city}" if pd.notna(row['email']) else '',
                    'linkedin': row['linkedin'] if pd.notna(row['linkedin']) else '',
                    'phone': f"tel:{row['companys.phone']}" if pd.notna(row['companys.phone']) else ''
                },
                'recent_activity': [{
                    'type': 'sale',
                    'date': row['sales.date'].strftime('%Y-%m-%d') if pd.notna(row['sales.date']) else '',
                    'amount': sale_price,
                    'property': row['sales.address'] if pd.notna(row['sales.address']) else '',
                    'days_ago': days_ago
                }],
                'hot_money_rank': rank,
                'capital_available': sale_price,
                'days_since_sale': days_ago
            })
        
        # Sort by score descending
        hot_money.sort(key=lambda x: x['match_score'], reverse=True)
        return hot_money[:10]
    
    def _analyze_portfolios(self, prop: PropertySubmission) -> List[Dict]:
        """Find entities with existing portfolios in this asset class - SIMPLIFIED"""
        df = self.data_sources['buyers']
        if df is None or df.empty:
            return []
        
        # Count properties per company
        company_counts = df['companys.company_name'].value_counts()
        
        portfolio_matches = []
        
        for company, prop_count in company_counts.head(20).items():
            if pd.isna(company) or prop_count < 2:
                continue
            
            # Get all records for this company
            company_deals = df[df['companys.company_name'] == company]
            
            if len(company_deals) == 0:
                continue
            
            # Get latest record for contact info
            latest = company_deals.iloc[0]
            
            # Calculate total value
            total_value = company_deals['sales.price'].sum()
            avg_deal = total_value / prop_count if prop_count > 0 else 0
            
            # Calculate score
            score = 0
            if prop_count >= 10:
                score += 25
            elif prop_count >= 5:
                score += 20
            elif prop_count >= 3:
                score += 15
            else:
                score += 10
            
            # Deal size alignment
            if avg_deal * 0.8 <= prop.price <= avg_deal * 1.5:
                score += 20
            elif avg_deal * 0.5 <= prop.price <= avg_deal * 2:
                score += 15
            else:
                score += 5
            
            # Contact quality
            email = latest['email'] if pd.notna(latest.get('email')) else ''
            linkedin = latest['linkedin'] if pd.notna(latest.get('linkedin')) else ''
            phone = latest['companys.phone'] if pd.notna(latest.get('companys.phone')) else ''
            full_name = latest['full_name'] if pd.notna(latest.get('full_name')) else ''
            
            contact_score = sum([
                4 if email and '@' in str(email) else 0,
                3 if linkedin else 0,
                2 if phone else 0
            ])
            score += contact_score
            
            portfolio_matches.append({
                'entity_type': 'buyer',
                'name': str(company),
                'company': str(company),
                'contact_name': str(full_name),
                'match_score': min(100, score),
                'match_breakdown': {
                    'portfolio_size': 25 if prop_count >= 10 else 20 if prop_count >= 5 else 15,
                    'deal_size_alignment': 20 if avg_deal * 0.8 <= prop.price <= avg_deal * 1.5 else 15,
                    'contact_quality': contact_score
                },
                'contact_info': {
                    'email': str(email),
                    'phone': str(phone),
                    'linkedin': str(linkedin),
                    'title': ''
                },
                'quick_actions': {
                    'email': f"mailto:{email}?subject=Investment Opportunity - {prop.city}" if email else '',
                    'linkedin': str(linkedin),
                    'phone': f"tel:{phone}" if phone else ''
                },
                'portfolio_info': {
                    'property_count': int(prop_count),
                    'total_value': float(total_value),
                    'avg_deal_size': float(avg_deal),
                    'region': prop.region
                },
                'recent_activity': []
            })
        
        portfolio_matches.sort(key=lambda x: x['match_score'], reverse=True)
        return portfolio_matches[:10]
    
    def _find_active_agents(self, recent_deals: pd.DataFrame, prop: PropertySubmission) -> List[Dict]:
        """Find brokers/agents who closed deals recently"""
        if recent_deals.empty:
            return []
        
        # Get unique companies that appear as intermediaries
        companies = pd.concat([
            recent_deals[recent_deals['contact_type'] == 'Buyer']['companys.company_name'],
            recent_deals[recent_deals['contact_type'] == 'Seller']['companys.company_name']
        ]).dropna().unique()
        
        agents = []
        seen = set()
        
        for company in companies[:10]:
            if company in seen or not company:
                continue
            seen.add(company)
            
            # Get most recent deal for this company
            company_deals = recent_deals[
                recent_deals['companys.company_name'] == company
            ].sort_values('sales.date', ascending=False)
            
            if company_deals.empty:
                continue
            
            latest = company_deals.iloc[0]
            deal_count = len(company_deals)
            
            agents.append({
                'entity_type': 'agent',
                'name': company,
                'company': company,
                'contact_name': latest['full_name'] if pd.notna(latest['full_name']) else '',
                'match_score': min(100, 50 + deal_count * 5),
                'match_breakdown': {
                    'recent_activity': deal_count * 5,
                    'market_presence': 30,
                    'contact_quality': 10 if pd.notna(latest['email']) else 5
                },
                'contact_info': {
                    'email': latest['email'] if pd.notna(latest['email']) else '',
                    'phone': latest['companys.phone'] if pd.notna(latest['companys.phone']) else '',
                    'linkedin': latest['linkedin'] if pd.notna(latest['linkedin']) else '',
                    'title': latest.get('job_title', '') if pd.notna(latest.get('job_title', '')) else ''
                },
                'quick_actions': {
                    'email': f"mailto:{latest['email']}?subject=Listing Opportunity - {prop.city}" if pd.notna(latest['email']) else '',
                    'linkedin': latest['linkedin'] if pd.notna(latest['linkedin']) else '',
                    'phone': f"tel:{latest['companys.phone']}" if pd.notna(latest['companys.phone']) else ''
                },
                'recent_activity': [{
                    'type': 'transaction',
                    'date': d['sales.date'].strftime('%Y-%m-%d') if pd.notna(d['sales.date']) else '',
                    'role': d['contact_type'],
                    'amount': d['sales.price'] if pd.notna(d['sales.price']) else 0,
                    'property': d['sales.address'] if pd.notna(d['sales.address']) else ''
                } for _, d in company_deals.head(3).iterrows()],
                'deals_in_last_90d': deal_count
            })
        
        agents.sort(key=lambda x: x['match_score'], reverse=True)
        return agents
    
    def _match_lenders(self, prop: PropertySubmission) -> List[Dict]:
        """Match lenders based on asset class and loan size"""
        lenders_db = [
            {
                'name': 'RBC Commercial Banking',
                'company': 'Royal Bank of Canada',
                'loan_types': ['Acquisition', 'Refinance', 'Construction'],
                'asset_classes': ['industrial', 'office', 'retail', 'multifamily'],
                'min_loan': 2000000,
                'max_loan': 100000000,
                'typical_ltv': '60-75%',
                'contact_name': 'Commercial Lending Team',
                'email': 'commercial.realEstate@rbc.com',
                'phone': '1-800-769-2520',
                'linkedin': 'https://linkedin.com/company/rbc'
            },
            {
                'name': 'TD Commercial Real Estate',
                'company': 'TD Bank',
                'loan_types': ['Term Loans', 'Lines of Credit', 'Construction'],
                'asset_classes': ['industrial', 'office', 'retail', 'hotel'],
                'min_loan': 5000000,
                'max_loan': 150000000,
                'typical_ltv': '55-70%',
                'contact_name': 'CRE Lending',
                'email': 'cre.lending@td.com',
                'phone': '416-982-8222',
                'linkedin': 'https://linkedin.com/company/tdbank'
            },
            {
                'name': 'Scotiabank Commercial',
                'company': 'Bank of Nova Scotia',
                'loan_types': ['Acquisition', 'Development', 'Bridge'],
                'asset_classes': ['industrial', 'office', 'retail', 'land'],
                'min_loan': 3000000,
                'max_loan': 75000000,
                'typical_ltv': '60-70%',
                'contact_name': 'Real Estate Finance',
                'email': 'realestate@scotiabank.com',
                'phone': '416-866-0000',
                'linkedin': 'https://linkedin.com/company/scotiabank'
            },
            {
                'name': 'CMHC (MLI Select)',
                'company': 'Canada Mortgage and Housing',
                'loan_types': ['Multi-Family', 'Affordable Housing'],
                'asset_classes': ['multifamily'],
                'min_loan': 1000000,
                'max_loan': 50000000,
                'typical_ltv': 'Up to 95%',
                'contact_name': 'MLI Select Team',
                'email': 'mli.select@cmhc.ca',
                'phone': '1-800-668-2642',
                'linkedin': 'https://linkedin.com/company/cmhc'
            }
        ]
        
        matched = []
        target_loan = prop.price * 0.65
        
        for lender in lenders_db:
            asset_match = prop.asset_class.lower() in [a.lower() for a in lender['asset_classes']]
            size_fit = lender['min_loan'] <= target_loan <= lender['max_loan']
            
            if not asset_match and not size_fit:
                continue
            
            score = 0
            if asset_match:
                score += 40
            if size_fit:
                score += 40
            else:
                if target_loan >= lender['min_loan'] * 0.8:
                    score += 20
            
            if lender.get('email'):
                score += 10
            
            matched.append({
                'entity_type': 'lender',
                'name': lender['name'],
                'company': lender['company'],
                'contact_name': lender['contact_name'],
                'match_score': min(100, score),
                'match_breakdown': {
                    'asset_class_fit': 40 if asset_match else 0,
                    'loan_size_fit': 40 if size_fit else 20,
                    'contact_quality': 10 if lender.get('email') else 0
                },
                'contact_info': {
                    'email': lender['email'],
                    'phone': lender['phone'],
                    'linkedin': lender['linkedin'],
                    'title': 'Commercial Lending'
                },
                'quick_actions': {
                    'email': f"mailto:{lender['email']}?subject=Financing Opportunity - {prop.city}",
                    'linkedin': lender['linkedin'],
                    'phone': f"tel:{lender['phone']}"
                },
                'lending_criteria': {
                    'min_loan': lender['min_loan'],
                    'max_loan': lender['max_loan'],
                    'typical_ltv': lender['typical_ltv'],
                    'loan_types': lender['loan_types']
                }
            })
        
        matched.sort(key=lambda x: x['match_score'], reverse=True)
        return matched
    
    def _score_all_matches(self, matches: Dict[str, List[Dict]], prop: PropertySubmission) -> List[Dict]:
        """Combine all matches and normalize scores"""
        all_matches = []
        
        for category, items in matches.items():
            for item in items:
                item['match_category'] = category
                all_matches.append(item)
        
        return all_matches


if __name__ == "__main__":
    orchestrator = AgentOrchestrator()
    
    test_property = {
        "address": "1500 Michael Drive, Welland",
        "city": "Welland",
        "region": "Niagara",
        "asset_class": "industrial",
        "price": 5000000,
        "size_sf": 80000,
        "property_type": "warehouse"
    }
    
    results = orchestrator.research_property(test_property)
    
    print("\n" + "="*70)
    print("RESEARCH COMPLETE")
    print("="*70)
    print(f"\nTop 5 Matches:")
    for i, match in enumerate(results['top_matches'][:5], 1):
        print(f"\n{i}. {match['name']} ({match['entity_type'].upper()})")
        print(f"   Score: {match['match_score']}%")
        print(f"   Email: {match['contact_info'].get('email', 'N/A')}")
        if match.get('hot_money_rank'):
            print(f"   Hot Money Rank: {match['hot_money_rank']}")
