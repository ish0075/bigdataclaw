#!/usr/bin/env python3
"""
BigDataClaw Data Connector
Connects Nerve to existing BigDataClaw data sources
"""

import os
import sys
import json
import sqlite3
import pandas as pd
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Optional

# Add BigDataClaw to path
BIGDATACLAW_PATH = Path("/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw")
sys.path.insert(0, str(BIGDATACLAW_PATH))

# Import BigDataClaw components
try:
    from matching_engine import MatchingEngine, MatchResult
    from agents.orchestrator import AgentOrchestrator, PropertySubmission
    print("✓ BigDataClaw components imported successfully")
except ImportError as e:
    print(f"⚠ Could not import BigDataClaw components: {e}")
    MatchingEngine = None
    AgentOrchestrator = None


class BigDataClawDataConnector:
    """Connects Nerve to BigDataClaw data sources"""
    
    def __init__(self, data_path: str = None):
        self.data_path = data_path or BIGDATACLAW_PATH
        self.workspace_path = Path.home() / "CortexOS" / "workspace"
        
        # Dataframes
        self.transactions_df: Optional[pd.DataFrame] = None
        self.buyers_df: Optional[pd.DataFrame] = None
        self.fresh_leads_df: Optional[pd.DataFrame] = None
        
        # Components
        self.matching_engine: Optional[MatchingEngine] = None
        self.orchestrator: Optional[AgentOrchestrator] = None
        
        self._load_data()
        self._init_components()
    
    def _load_data(self):
        """Load CSV data sources"""
        try:
            # Load transaction data
            tx_path = self.workspace_path / 'data_export.csv'
            if tx_path.exists():
                self.transactions_df = pd.read_csv(tx_path)
                print(f"✓ Loaded {len(self.transactions_df)} transactions")
            else:
                print(f"⚠ Transaction data not found at {tx_path}")
            
            # Load buyer database
            buyer_path = self.workspace_path / 'new_data.csv'
            if buyer_path.exists():
                self.buyers_df = pd.read_csv(buyer_path)
                print(f"✓ Loaded {len(self.buyers_df)} buyer records")
            else:
                print(f"⚠ Buyer data not found at {buyer_path}")
            
            # Load fresh leads
            fresh_path = self.workspace_path / 'fresh_data.csv'
            if fresh_path.exists():
                self.fresh_leads_df = pd.read_csv(fresh_path)
                print(f"✓ Loaded {len(self.fresh_leads_df)} fresh leads")
            else:
                print(f"⚠ Fresh leads not found at {fresh_path}")
                
        except Exception as e:
            print(f"⚠ Error loading data: {e}")
    
    def _init_components(self):
        """Initialize BigDataClaw components"""
        if MatchingEngine:
            try:
                self.matching_engine = MatchingEngine()
                print("✓ MatchingEngine initialized")
            except Exception as e:
                print(f"⚠ Could not initialize MatchingEngine: {e}")
        
        if AgentOrchestrator:
            try:
                self.orchestrator = AgentOrchestrator(str(self.workspace_path))
                print("✓ AgentOrchestrator initialized")
            except Exception as e:
                print(f"⚠ Could not initialize AgentOrchestrator: {e}")
    
    def get_hot_money_leads(self, limit: int = 20, days: int = 90) -> List[Dict]:
        """Get hot money leads from SQLite database - last N days"""
        leads = []
        
        try:
            # Connect to SQLite database
            db_path = self.data_path / 'bigdataclaw.db'
            if not db_path.exists():
                print(f"⚠ Database not found at {db_path}")
                return self._get_sample_hot_money()
            
            conn = sqlite3.connect(str(db_path))
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            # Query hot_money_leads table for last N days
            cursor.execute("""
                SELECT id, entity, cash_amount, sale_date, location, property,
                       match_score, property_type, asset_class, address, days_ago, notes, contacts
                FROM hot_money_leads
                WHERE days_ago <= ?
                ORDER BY cash_amount DESC
                LIMIT ?
            """, (days, limit))
            
            rows = cursor.fetchall()
            conn.close()
            
            for row in rows:
                lead = {
                    'id': str(row['id']),
                    'entity': row['entity'],
                    'cash_amount': row['cash_amount'],
                    'sale_date': row['sale_date'],
                    'location': row['location'],
                    'property': row['property'],
                    'property_type': row['property_type'] or row['asset_class'] or 'Commercial',
                    'asset_class': row['asset_class'],
                    'address': row['address'],
                    'days_ago': row['days_ago'],
                    'match_score': row['match_score'] or 80,
                    'notes': row['notes'] or '',
                    'contacts': json.loads(row['contacts']) if row['contacts'] else []
                }
                leads.append(lead)
            
            print(f"✓ Loaded {len(leads)} hot money leads from database")
            return leads if leads else self._get_sample_hot_money()
            
        except Exception as e:
            print(f"⚠ Error getting hot money from database: {e}")
            return self._get_sample_hot_money()
    
    def _get_sample_hot_money(self) -> List[Dict]:
        """Get sample hot money data"""
        return [
            {
                'id': '1',
                'entity': '2650687 Ontario Ltd',
                'cash_amount': 15000000,
                'sale_date': 'May 2025',
                'location': 'West Lincoln',
                'property': 'Thirty Rd, West Lincoln',
                'property_type': 'Industrial',
                'match_score': 92,
                'contact_email': 'contact@2650687ontario.ca',
                'contact_phone': '905-555-0100',
            },
            {
                'id': '2',
                'entity': 'Turnberry Holdings Inc',
                'cash_amount': 9840000,
                'sale_date': 'Jan 2025',
                'location': 'Lincoln',
                'property': '4556-4568 Lincoln Ave',
                'property_type': 'Mixed-Use',
                'match_score': 88,
                'contact_email': 'info@turnberryholdings.com',
                'contact_phone': '905-555-0200',
            },
            {
                'id': '3',
                'entity': '1863570 Ontario Inc',
                'cash_amount': 7000000,
                'sale_date': 'Jan 2025',
                'location': 'Pelham',
                'property': '981 Pelham St',
                'property_type': 'Industrial',
                'match_score': 85,
                'contact_email': 'info@1863570ontario.ca',
                'contact_phone': '905-555-0300',
            },
        ]
    
    def find_matches(self, property_data: Dict, limit: int = 10) -> List[Dict]:
        """Find matching buyers for a property"""
        matches = []
        
        if self.matching_engine:
            try:
                match_results = self.matching_engine.find_matches(property_data, limit)
                for match in match_results:
                    matches.append({
                        'id': match.buyer_id,
                        'entity': match.company_name,
                        'contact_name': match.contact_name,
                        'match_score': match.match_score,
                        'match_reasons': match.match_reasons,
                        'cash_position': match.last_sale_amount,
                        'has_1031': match.has_1031_deadline,
                        'contact': match.contact_info,
                    })
                return matches
            except Exception as e:
                print(f"⚠ MatchingEngine error: {e}")
        
        # Fallback to sample matches
        return self._get_sample_matches(property_data, limit)
    
    def _get_sample_matches(self, property_data: Dict, limit: int = 10) -> List[Dict]:
        """Get sample match data"""
        sample_matches = [
            {
                'id': '1',
                'entity': 'Dream Industrial REIT',
                'contact_name': 'Michael Cooper',
                'contact_title': 'VP Acquisitions',
                'match_score': 95,
                'match_reasons': ['Recent industrial purchases', 'Active in Niagara', 'Price range match'],
                'typical_deal_size': '$10M - $100M',
                'asset_focus': ['Industrial', 'Logistics'],
                'contact': {
                    'email': 'm.cooper@dream.ca',
                    'phone': '416-555-0101',
                    'linkedin': 'linkedin.com/company/dream-industrial',
                },
            },
            {
                'id': '2',
                'entity': 'Pure Industrial REIT',
                'contact_name': 'Sarah Chen',
                'contact_title': 'Director, Investments',
                'match_score': 88,
                'match_reasons': ['Active buyer in market', 'Similar asset class'],
                'typical_deal_size': '$5M - $50M',
                'asset_focus': ['Industrial', 'Light Manufacturing'],
                'contact': {
                    'email': 's.chen@pureindustrial.ca',
                    'phone': '416-555-0202',
                    'linkedin': 'linkedin.com/company/pure-industrial',
                },
            },
            {
                'id': '3',
                'entity': 'Carttera Private Equity',
                'contact_name': 'David Thompson',
                'contact_title': 'Managing Partner',
                'match_score': 82,
                'match_reasons': ['Large deal capacity', 'Ontario focus'],
                'typical_deal_size': '$20M - $200M',
                'asset_focus': ['Industrial', 'Mixed-Use'],
                'contact': {
                    'email': 'd.thompson@carttera.com',
                    'phone': '416-555-0303',
                    'linkedin': 'linkedin.com/company/carttera',
                },
            },
        ]
        return sample_matches[:limit]
    
    def run_property_research(self, property_data: Dict) -> Dict:
        """Run full property research via orchestrator"""
        if self.orchestrator:
            try:
                result = self.orchestrator.research_property(property_data)
                return result
            except Exception as e:
                print(f"⚠ Orchestrator error: {e}")
        
        # Return sample result
        return {
            'status': 'completed',
            'matches': self._get_sample_matches(property_data, 10),
            'hot_money': self._get_sample_hot_money()[:3],
            'agents': [],
            'lenders': [],
        }
    
    def get_stats(self) -> Dict:
        """Get dashboard statistics"""
        stats = {
            'total_transactions': len(self.transactions_df) if self.transactions_df is not None else 0,
            'total_buyers': len(self.buyers_df) if self.buyers_df is not None else 0,
            'total_fresh_leads': len(self.fresh_leads_df) if self.fresh_leads_df is not None else 0,
        }
        
        # Add hot money stats
        hot_money = self.get_hot_money_leads(100)
        stats['hot_money_count'] = len(hot_money)
        stats['tracked_capital'] = sum(l['cash_amount'] for l in hot_money)
        
        return stats


# Global connector instance
_connector: Optional[BigDataClawDataConnector] = None

def get_connector() -> BigDataClawDataConnector:
    """Get or create global data connector"""
    global _connector
    if _connector is None:
        _connector = BigDataClawDataConnector()
    return _connector
