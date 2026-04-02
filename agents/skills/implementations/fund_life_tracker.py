#!/usr/bin/env python3
"""
Fund Life Tracker Skill
Identifies fund exit windows based on acquisition dates and typical hold periods
Critical for identifying motivated sellers like KingSett (Fund IV 2021 = exit 2024-2026)
"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import re

from agents.skills.registry import SkillExecutor, SkillMetadata


class FundLifeTrackerSkill(SkillExecutor):
    """
    Tracks private equity and institutional fund life cycles
    
    Key Insight: Most funds have 5-7 year hold periods
    Acquisition date + 5-7 years = Exit window = HIGH MOTIVATION
    
    Example: KingSett Bayshore
    - Acquired: June 2021
    - Fund: Likely Fund IV (2018-2020 vintage)
    - Exit Window: 2024-2026
    - Current Status: EXIT MODE NOW
    """
    
    def _define_metadata(self) -> SkillMetadata:
        return SkillMetadata(
            name="fund_life_tracker",
            description="Tracks fund life cycles and predicts exit windows for motivated seller identification",
            agent="hot_money_identifier",
            version="1.0.0",
            author="BigDataClaw",
            priority="P0",
            status="active",
            dependencies=[],
            input_schema={
                "required": ["buyer_name", "acquisition_date"],
                "optional": ["fund_name", "fund_size", "asset_class", "typical_hold_years"]
            },
            output_schema={
                "fund_life_analysis": "dict",
                "exit_window": "dict",
                "motivation_score": "float",
                "recommended_action": "str"
            },
            enabled=True
        )
    
    # Fund life database (expandable)
    FUND_PROFILES = {
        # KingSett Capital
        'kingsett': {
            'fund_life_years': (5, 7),
            'typical_structure': 'Closed-end PE fund',
            'vintage_pattern': r'Fund (\w+)',
            'known_funds': {
                'Fund IV': {'vintage': 2018, 'size_b': 1.2},
                'Fund V': {'vintage': 2021, 'size_b': 1.5},
            }
        },
        # CPP Investments
        'cppib': {
            'fund_life_years': (7, 10),
            'typical_structure': 'Open-ended',
            'rebalancing_cycle': 5,  # Years
        },
        # OMERS
        'omers': {
            'fund_life_years': (7, 10),
            'typical_structure': 'Pension direct',
            'rebalancing_cycle': 7,
        },
        # Ontario Teachers (Cadillac Fairview)
        'otpp': {
            'fund_life_years': (10, 15),
            'typical_structure': 'Long-term hold',
            'rebalancing_cycle': 10,
        },
        # OPB
        'opb': {
            'fund_life_years': (10, 15),
            'typical_structure': 'Pension direct',
            'rebalancing_cycle': 12,
        },
        # Primaris REIT
        'primaris': {
            'fund_life_years': (0, 0),  # REITs don't have fund life
            'typical_structure': 'Public REIT',
            'hold_period': 'perpetual',
        },
        # RioCan
        'riocan': {
            'fund_life_years': (0, 0),
            'typical_structure': 'Public REIT',
            'hold_period': 'perpetual',
        },
    }
    
    # Asset class typical hold periods
    ASSET_HOLD_PERIODS = {
        'multifamily': (7, 10),
        'retail': (5, 7),
        'industrial': (5, 8),
        'office': (7, 10),
        'hospitality': (5, 7),
        'senior_living': (10, 15),
        'land': (3, 5),  # Development hold
        'mixed_use': (7, 10),
    }
    
    def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Execute fund life analysis
        
        Args:
            buyer_name: Name of buyer/fund
            acquisition_date: Date of acquisition (ISO format or string)
            fund_name: Optional fund name
            fund_size: Optional fund size
            asset_class: Optional asset class
            typical_hold_years: Optional override
            
        Returns:
            Fund life analysis with exit window and motivation score
        """
        buyer_name = kwargs.get('buyer_name', '').lower()
        acquisition_date_str = kwargs.get('acquisition_date', '')
        fund_name = kwargs.get('fund_name', '')
        asset_class = kwargs.get('asset_class', '').lower()
        typical_hold = kwargs.get('typical_hold_years')
        
        # Parse acquisition date
        acquisition_date = self._parse_date(acquisition_date_str)
        if not acquisition_date:
            return {
                'error': f'Invalid acquisition date: {acquisition_date_str}',
                'fund_life_analysis': None
            }
        
        # Determine hold period
        hold_period = self._determine_hold_period(
            buyer_name, fund_name, asset_class, typical_hold
        )
        
        # Calculate fund life timeline
        timeline = self._calculate_timeline(acquisition_date, hold_period)
        
        # Calculate motivation score
        motivation = self._calculate_motivation_score(timeline)
        
        # Determine recommended action
        action = self._recommend_action(motivation, timeline)
        
        return {
            'fund_life_analysis': {
                'buyer': buyer_name,
                'acquisition_date': acquisition_date.isoformat(),
                'fund_name': fund_name,
                'hold_period_years': hold_period,
                'asset_class': asset_class,
            },
            'exit_window': {
                'earliest_exit': timeline['earliest_exit'].isoformat(),
                'latest_exit': timeline['latest_exit'].isoformat(),
                'optimal_exit': timeline['optimal_exit'].isoformat(),
                'years_until_exit': timeline['years_until_exit'],
                'exit_status': timeline['exit_status'],
            },
            'motivation_score': motivation['score'],
            'motivation_factors': motivation['factors'],
            'recommended_action': action,
            'opportunity_rating': motivation['rating'],
        }
    
    def _parse_date(self, date_str: str) -> Optional[datetime]:
        """Parse various date formats"""
        formats = [
            '%Y-%m-%d',
            '%Y-%m',
            '%Y',
            '%m/%d/%Y',
            '%d/%m/%Y',
            '%B %Y',
            '%b %Y',
        ]
        
        for fmt in formats:
            try:
                return datetime.strptime(date_str.strip(), fmt)
            except ValueError:
                continue
        
        return None
    
    def _determine_hold_period(self, buyer_name: str, fund_name: str,
                               asset_class: str, override: Optional[tuple]) -> tuple:
        """Determine expected hold period"""
        
        if override:
            return override
        
        # Check buyer profile
        for key, profile in self.FUND_PROFILES.items():
            if key in buyer_name:
                return profile['fund_life_years']
        
        # Check asset class
        if asset_class in self.ASSET_HOLD_PERIODS:
            return self.ASSET_HOLD_PERIODS[asset_class]
        
        # Default
        return (5, 7)
    
    def _calculate_timeline(self, acquisition_date: datetime, 
                           hold_period: tuple) -> Dict[str, Any]:
        """Calculate exit timeline"""
        now = datetime.now()
        
        min_hold, max_hold = hold_period
        
        earliest_exit = acquisition_date + timedelta(days=min_hold*365)
        latest_exit = acquisition_date + timedelta(days=max_hold*365)
        optimal_exit = acquisition_date + timedelta(days=((min_hold+max_hold)/2)*365)
        
        # Calculate years until exit
        if now < earliest_exit:
            years_until = (earliest_exit - now).days / 365
            status = 'pre_exit'
        elif now > latest_exit:
            years_until = 0
            status = 'overdue'
        else:
            years_until = 0
            status = 'exit_window'
        
        return {
            'earliest_exit': earliest_exit,
            'latest_exit': latest_exit,
            'optimal_exit': optimal_exit,
            'years_until_exit': round(years_until, 1),
            'exit_status': status,
        }
    
    def _calculate_motivation_score(self, timeline: Dict) -> Dict[str, Any]:
        """Calculate motivation score (0-100)"""
        status = timeline['exit_status']
        years = timeline['years_until_exit']
        
        score = 0
        factors = []
        rating = 'low'
        
        if status == 'exit_window':
            score = 90
            factors.append('Currently in exit window')
            rating = 'critical'
        elif status == 'overdue':
            score = 100
            factors.append('Exit window has passed - high urgency')
            rating = 'critical'
        elif status == 'pre_exit':
            if years <= 1:
                score = 75
                factors.append('Exit window approaching within 1 year')
                rating = 'high'
            elif years <= 2:
                score = 60
                factors.append('Exit window in 1-2 years')
                rating = 'medium-high'
            elif years <= 3:
                score = 40
                factors.append('Exit window in 2-3 years')
                rating = 'medium'
            else:
                score = 20
                factors.append(f'Exit window in {years:.1f} years')
                rating = 'low'
        
        return {
            'score': score,
            'factors': factors,
            'rating': rating,
        }
    
    def _recommend_action(self, motivation: Dict, timeline: Dict) -> str:
        """Recommend action based on motivation"""
        score = motivation['score']
        status = timeline['exit_status']
        
        if score >= 90 or status in ['exit_window', 'overdue']:
            return 'IMMEDIATE_OUTREACH'
        elif score >= 70:
            return 'PRIORITY_OUTREACH'
        elif score >= 50:
            return 'CULTIVATE'
        else:
            return 'MONITOR'
    
    def analyze_portfolio(self, holdings: List[Dict]) -> Dict[str, Any]:
        """
        Analyze entire portfolio for exit windows
        
        Args:
            holdings: List of {'property', 'acquisition_date', 'value'}
            
        Returns:
            Portfolio-level analysis
        """
        analyses = []
        
        for holding in holdings:
            result = self.execute(
                buyer_name=holding.get('buyer', 'unknown'),
                acquisition_date=holding.get('acquisition_date'),
                asset_class=holding.get('asset_class')
            )
            if result.get('fund_life_analysis'):
                analyses.append({
                    'property': holding.get('property'),
                    'analysis': result
                })
        
        # Find properties in exit window
        exit_window_props = [
            a for a in analyses 
            if a['analysis']['exit_window']['exit_status'] == 'exit_window'
        ]
        
        # Calculate portfolio pressure
        total_value = sum(h.get('value', 0) for h in holdings)
        exit_window_value = sum(
            h.get('value', 0) 
            for h, a in zip(holdings, analyses)
            if a['analysis']['exit_window']['exit_status'] == 'exit_window'
        )
        
        return {
            'total_properties': len(holdings),
            'in_exit_window': len(exit_window_props),
            'exit_window_properties': exit_window_props,
            'total_portfolio_value': total_value,
            'exit_window_value': exit_window_value,
            'portfolio_pressure_pct': (exit_window_value / total_value * 100) if total_value > 0 else 0,
        }


# Convenience function for direct usage
def analyze_fund_life(buyer_name: str, acquisition_date: str, **kwargs) -> Dict[str, Any]:
    """
    Quick analysis of fund life for a specific buyer
    
    Example:
        >>> analyze_fund_life('KingSett Capital', '2021-06-01', asset_class='retail')
        {
            'exit_window': {'exit_status': 'exit_window', ...},
            'motivation_score': 90,
            'recommended_action': 'IMMEDIATE_OUTREACH'
        }
    """
    skill = FundLifeTrackerSkill()
    return skill.execute(
        buyer_name=buyer_name,
        acquisition_date=acquisition_date,
        **kwargs
    )


if __name__ == "__main__":
    # Test examples
    print("="*80)
    print("FUND LIFE TRACKER SKILL - TEST SUITE")
    print("="*80)
    
    test_cases = [
        {
            'name': 'KingSett Bayshore',
            'buyer': 'KingSett Capital',
            'date': '2021-06-01',
            'asset': 'retail',
            'expected': 'exit_window'
        },
        {
            'name': 'OPB Erin Mills',
            'buyer': 'Ontario Pension Board',
            'date': '2010-12-16',
            'asset': 'retail',
            'expected': 'overdue'
        },
        {
            'name': 'Primaris Conestoga',
            'buyer': 'Primaris REIT',
            'date': '2023-07-01',
            'asset': 'retail',
            'expected': 'pre_exit'
        },
        {
            'name': 'Future Acquisition',
            'buyer': 'KingSett Capital',
            'date': '2025-01-01',
            'asset': 'industrial',
            'expected': 'pre_exit'
        }
    ]
    
    for test in test_cases:
        print(f"\n🏢 {test['name']}")
        print("-"*80)
        
        result = analyze_fund_life(
            buyer_name=test['buyer'],
            acquisition_date=test['date'],
            asset_class=test['asset']
        )
        
        if 'error' in result:
            print(f"  ✗ Error: {result['error']}")
            continue
        
        exit_window = result['exit_window']
        motivation = result['motivation_score']
        action = result['recommended_action']
        
        print(f"  Buyer: {test['buyer']}")
        print(f"  Acquired: {test['date']}")
        print(f"  Exit Status: {exit_window['exit_status']} (expected: {test['expected']})")
        print(f"  Years Until Exit: {exit_window['years_until_exit']}")
        print(f"  Motivation Score: {motivation}/100")
        print(f"  Recommended Action: {action}")
        
        # Verify
        if exit_window['exit_status'] == test['expected']:
            print(f"  ✓ PASS")
        else:
            print(f"  ✗ FAIL (got {exit_window['exit_status']}, expected {test['expected']})")
    
    print("\n" + "="*80)
    print("TEST COMPLETE")
    print("="*80)
