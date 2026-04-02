#!/usr/bin/env python3
"""
Distress Scanner Skill
Identifies distress signals in commercial real estate properties
Critical for motivated seller identification

Signals Detected:
- Dark anchor vacancies (HBC, Sears, etc.)
- CMBS maturity dates
- Partnership buyouts
- Court filings (CCAA, receivership)
- High vacancy rates
- Tenant bankruptcies
"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from enum import Enum

from agents.skills.registry import SkillExecutor, SkillMetadata


class DistressLevel(Enum):
    NONE = 0
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4


class DistressScannerSkill(SkillExecutor):
    """
    Scans properties for distress signals
    
    Example: Bayshore Mall
    - Signal: HBC bankruptcy (180K sf dark)
    - Impact: $3.1M annual rent loss
    - Distress Level: CRITICAL
    - Action: Immediate outreach to KingSett
    """
    
    def _define_metadata(self) -> SkillMetadata:
        return SkillMetadata(
            name="distress_scanner",
            description="Identifies distress signals like dark anchors, bankruptcies, CMBS maturities",
            agent="hot_money_identifier",
            version="1.0.0",
            author="BigDataClaw",
            priority="P0",
            status="active",
            dependencies=[],
            input_schema={
                "required": ["property_address", "city"],
                "optional": ["tenant_list", "occupancy_rate", "cmbs_loan", "ownership_structure"]
            },
            output_schema={
                "distress_signals": "list",
                "distress_level": "str",
                "distress_score": "int",
                "motivation_factors": "list",
                "recommended_discount": "float"
            },
            enabled=True
        )
    
    # Distress signal database
    DARK_ANCHOR_DATABASE = {
        'hudsons_bay': {
            'name': "Hudson's Bay Company",
            'bankruptcy_date': '2025-03-07',
            'affected_properties': [
                'Bayshore Shopping Centre, Ottawa',
                'Erin Mills Town Centre, Mississauga',
                'Conestoga Mall, Waterloo',
                'Place d\'Orleans, Ottawa',
                'St. Laurent Shopping Centre, Ottawa',
            ],
            'typical_space_sf': 130000,
            'estimated_rent_loss_per_property': 2200000,
        },
        'sears': {
            'name': 'Sears Canada',
            'bankruptcy_date': '2017-06-22',
            'status': 'mostly_redeveloped',
        },
        'target_canada': {
            'name': 'Target Canada',
            'bankruptcy_date': '2015-04-12',
            'status': 'redeveloped',
        },
    }
    
    # CMBS maturity wall data
    CMBS_MATURITY_WALL = {
        '2025': 59.3e9,  # $59.3 billion
        '2026': 76.6e9,  # $76.6 billion
        '2027': 55.1e9,  # $55.1 billion
    }
    
    def execute(self, **kwargs) -> Dict[str, Any]:
        """
        Execute distress scan on a property
        
        Args:
            property_address: Property address
            city: City name
            tenant_list: List of tenants with details
            occupancy_rate: Current occupancy %
            cmbs_loan: CMBS loan details
            ownership_structure: Ownership details
            news_mentions: Recent news about property
            
        Returns:
            Distress analysis with signals and recommendations
        """
        address = kwargs.get('property_address', '')
        city = kwargs.get('city', '')
        tenant_list = kwargs.get('tenant_list', [])
        occupancy = kwargs.get('occupancy_rate')
        cmbs_loan = kwargs.get('cmbs_loan', {})
        ownership = kwargs.get('ownership_structure', {})
        
        signals = []
        
        # Check for dark anchors
        anchor_signal = self._check_dark_anchors(address, city, tenant_list)
        if anchor_signal:
            signals.append(anchor_signal)
        
        # Check vacancy rate
        vacancy_signal = self._check_vacancy(occupancy, address)
        if vacancy_signal:
            signals.append(vacancy_signal)
        
        # Check CMBS maturity
        cmbs_signal = self._check_cmbs_maturity(cmbs_loan)
        if cmbs_signal:
            signals.append(cmbs_signal)
        
        # Check ownership structure
        ownership_signal = self._check_ownership_structure(ownership)
        if ownership_signal:
            signals.append(ownership_signal)
        
        # Calculate overall distress level
        distress_level, score = self._calculate_distress_level(signals)
        
        # Calculate recommended discount
        discount = self._calculate_discount(signals, score)
        
        return {
            'property': f"{address}, {city}",
            'scan_timestamp': datetime.now().isoformat(),
            'distress_signals': signals,
            'distress_level': distress_level.name,
            'distress_score': score,
            'signal_count': len(signals),
            'motivation_factors': [s['description'] for s in signals],
            'recommended_discount_pct': discount,
            'recommended_action': self._recommend_action(distress_level),
            'priority': 'URGENT' if distress_level in [DistressLevel.HIGH, DistressLevel.CRITICAL] else 'NORMAL'
        }
    
    def _check_dark_anchors(self, address: str, city: str, 
                           tenant_list: List[Dict]) -> Optional[Dict]:
        """Check for dark anchor tenants"""
        
        # Check against known dark anchors
        full_address = f"{address}, {city}".lower()
        
        for anchor_key, anchor_data in self.DARK_ANCHOR_DATABASE.items():
            for affected in anchor_data.get('affected_properties', []):
                if affected.lower() in full_address or full_address in affected.lower():
                    return {
                        'type': 'dark_anchor',
                        'severity': 'critical',
                        'tenant': anchor_data['name'],
                        'description': f"{anchor_data['name']} bankruptcy - major anchor vacant",
                        'financial_impact': {
                            'rent_loss_annual': anchor_data.get('estimated_rent_loss_per_property', 0),
                            'space_sf': anchor_data.get('typical_space_sf', 0),
                        },
                        'redevelopment_cost_estimate': 13500000,  # KingSett estimate
                        'action_required': 'immediate'
                    }
        
        # Check tenant list for bankruptcies
        if tenant_list:
            for tenant in tenant_list:
                tenant_name = tenant.get('name', '').lower()
                if tenant.get('status') == 'bankrupt' or tenant.get('vacant') == True:
                    if tenant.get('is_anchor', False):
                        return {
                            'type': 'dark_anchor',
                            'severity': 'high',
                            'tenant': tenant.get('name'),
                            'description': f"Anchor tenant {tenant.get('name')} vacant/bankrupt",
                            'financial_impact': {
                                'rent_loss_annual': tenant.get('annual_rent', 0),
                                'space_sf': tenant.get('space_sf', 0),
                            }
                        }
        
        return None
    
    def _check_vacancy(self, occupancy: Optional[float], address: str) -> Optional[Dict]:
        """Check for high vacancy rates"""
        
        if occupancy is None:
            return None
        
        vacancy = 100 - occupancy
        
        if vacancy >= 20:
            return {
                'type': 'high_vacancy',
                'severity': 'high',
                'description': f"Critical vacancy rate: {vacancy:.1f}%",
                'metrics': {
                    'occupancy': occupancy,
                    'vacancy': vacancy
                },
                'threshold_breached': '20%+'
            }
        elif vacancy >= 15:
            return {
                'type': 'elevated_vacancy',
                'severity': 'medium',
                'description': f"Elevated vacancy rate: {vacancy:.1f}%",
                'metrics': {
                    'occupancy': occupancy,
                    'vacancy': vacancy
                },
                'threshold_breached': '15-20%'
            }
        elif vacancy >= 10:
            return {
                'type': 'moderate_vacancy',
                'severity': 'low',
                'description': f"Moderate vacancy rate: {vacancy:.1f}%",
                'metrics': {
                    'occupancy': occupancy,
                    'vacancy': vacancy
                }
            }
        
        return None
    
    def _check_cmbs_maturity(self, cmbs_loan: Dict) -> Optional[Dict]:
        """Check for CMBS maturity pressure"""
        
        if not cmbs_loan:
            return None
        
        maturity_date = cmbs_loan.get('maturity_date')
        if not maturity_date:
            return None
        
        # Parse maturity date
        try:
            if isinstance(maturity_date, str):
                mat_date = datetime.strptime(maturity_date, '%Y-%m-%d')
            else:
                mat_date = maturity_date
        except:
            return None
        
        now = datetime.now()
        months_to_maturity = (mat_date - now).days / 30
        
        if months_to_maturity <= 0:
            return {
                'type': 'cmbs_matured',
                'severity': 'critical',
                'description': f"CMBS loan matured {abs(months_to_maturity):.0f} months ago",
                'financial_impact': {
                    'loan_amount': cmbs_loan.get('amount', 0),
                    'months_overdue': abs(months_to_maturity)
                },
                'action_required': 'immediate'
            }
        elif months_to_maturity <= 6:
            return {
                'type': 'cmbs_maturity_imminent',
                'severity': 'high',
                'description': f"CMBS maturity within {months_to_maturity:.0f} months",
                'financial_impact': {
                    'loan_amount': cmbs_loan.get('amount', 0),
                    'months_remaining': months_to_maturity
                }
            }
        elif months_to_maturity <= 12:
            return {
                'type': 'cmbs_maturity_approaching',
                'severity': 'medium',
                'description': f"CMBS maturity within {months_to_maturity:.0f} months",
                'financial_impact': {
                    'loan_amount': cmbs_loan.get('amount', 0),
                    'months_remaining': months_to_maturity
                }
            }
        
        return None
    
    def _check_ownership_structure(self, ownership: Dict) -> Optional[Dict]:
        """Check for ownership distress signals"""
        
        signals = []
        
        # Partnership buyout
        if ownership.get('partnership_buyout') == True:
            signals.append({
                'type': 'partnership_buyout',
                'severity': 'medium',
                'description': 'Recent partnership buyout - potential misalignment',
            })
        
        # Fund exit pressure
        if ownership.get('fund_exit_window'):
            signals.append({
                'type': 'fund_exit_pressure',
                'severity': 'high',
                'description': f"Fund exit window: {ownership['fund_exit_window']}",
            })
        
        # Co-owner dynamics
        if ownership.get('co_owner_resistance') == True:
            signals.append({
                'type': 'co_owner_conflict',
                'severity': 'medium',
                'description': 'Co-owner resisting additional capital',
            })
        
        if signals:
            return {
                'type': 'ownership_distress',
                'severity': max(s['severity'] for s in signals),
                'description': f"{len(signals)} ownership distress signals detected",
                'details': signals
            }
        
        return None
    
    def _calculate_distress_level(self, signals: List[Dict]) -> tuple[DistressLevel, int]:
        """Calculate overall distress level and score"""
        
        if not signals:
            return DistressLevel.NONE, 0
        
        # Count by severity
        critical = sum(1 for s in signals if s.get('severity') == 'critical')
        high = sum(1 for s in signals if s.get('severity') == 'high')
        medium = sum(1 for s in signals if s.get('severity') == 'medium')
        low = sum(1 for s in signals if s.get('severity') == 'low')
        
        # Calculate score (0-100)
        score = (critical * 40) + (high * 25) + (medium * 10) + (low * 5)
        score = min(100, score)
        
        # Determine level
        if critical >= 1 or score >= 80:
            return DistressLevel.CRITICAL, score
        elif high >= 1 or score >= 60:
            return DistressLevel.HIGH, score
        elif medium >= 1 or score >= 30:
            return DistressLevel.MEDIUM, score
        elif low >= 1:
            return DistressLevel.LOW, score
        else:
            return DistressLevel.NONE, 0
    
    def _calculate_discount(self, signals: List[Dict], score: int) -> float:
        """Calculate recommended purchase discount"""
        
        base_discount = 0
        
        # Dark anchor adjustment
        for signal in signals:
            if signal['type'] == 'dark_anchor':
                impact = signal.get('financial_impact', {})
                rent_loss = impact.get('rent_loss_annual', 0)
                reno_cost = signal.get('redevelopment_cost_estimate', 0)
                
                # Discount based on rent loss and capex
                base_discount += 15  # Base dark anchor discount
                
                if reno_cost > 10e6:
                    base_discount += 10  # Major capex burden
        
        # CMBS adjustment
        for signal in signals:
            if 'cmbs' in signal['type']:
                if signal['severity'] == 'critical':
                    base_discount += 20
                elif signal['severity'] == 'high':
                    base_discount += 10
        
        # Score-based adjustment
        if score >= 80:
            base_discount += 10
        elif score >= 60:
            base_discount += 5
        
        return min(50, base_discount)  # Cap at 50%
    
    def _recommend_action(self, level: DistressLevel) -> str:
        """Recommend action based on distress level"""
        
        actions = {
            DistressLevel.CRITICAL: 'IMMEDIATE_OUTREACH_OFFER',
            DistressLevel.HIGH: 'PRIORITY_OUTREACH',
            DistressLevel.MEDIUM: 'CULTIVATE_ACTIVE',
            DistressLevel.LOW: 'MONITOR',
            DistressLevel.NONE: 'STANDARD_PROCESS'
        }
        
        return actions.get(level, 'STANDARD_PROCESS')


# Convenience function
def scan_property_distress(address: str, city: str, **kwargs) -> Dict[str, Any]:
    """
    Quick distress scan for a property
    
    Example:
        >>> scan_property_distress('100 Bayshore Dr', 'Ottawa')
        {
            'distress_level': 'CRITICAL',
            'distress_score': 95,
            'signals': [...],
            'recommended_discount_pct': 35
        }
    """
    skill = DistressScannerSkill()
    return skill.execute(property_address=address, city=city, **kwargs)


if __name__ == "__main__":
    # Test suite
    print("="*80)
    print("DISTRESS SCANNER SKILL - TEST SUITE")
    print("="*80)
    
    test_cases = [
        {
            'name': 'Bayshore Mall (HBC Crisis)',
            'address': '100 Bayshore Dr',
            'city': 'Ottawa',
            'kwargs': {
                'tenant_list': [
                    {'name': "Hudson's Bay", 'status': 'bankrupt', 'is_anchor': True, 
                     'annual_rent': 2230000, 'space_sf': 180696}
                ],
                'occupancy_rate': 75,
                'ownership_structure': {'fund_exit_window': '2024-2026'}
            },
            'expected_level': 'CRITICAL'
        },
        {
            'name': 'Centre on Barton (Stabilized)',
            'address': '1089 Barton St E',
            'city': 'Hamilton',
            'kwargs': {
                'occupancy_rate': 96,
            },
            'expected_level': 'NONE'
        },
        {
            'name': 'Generic Mall (CMBS Pressure)',
            'address': '123 Main St',
            'city': 'Toronto',
            'kwargs': {
                'occupancy_rate': 88,
                'cmbs_loan': {'amount': 50000000, 'maturity_date': '2026-03-01'}
            },
            'expected_level': 'HIGH'
        }
    ]
    
    for test in test_cases:
        print(f"\n🏢 {test['name']}")
        print("-"*80)
        
        result = scan_property_distress(
            test['address'],
            test['city'],
            **test['kwargs']
        )
        
        print(f"  Distress Level: {result['distress_level']}")
        print(f"  Distress Score: {result['distress_score']}/100")
        print(f"  Signals Found: {result['signal_count']}")
        print(f"  Recommended Discount: {result['recommended_discount_pct']}%")
        print(f"  Action: {result['recommended_action']}")
        
        if result['distress_signals']:
            print(f"  Signals:")
            for sig in result['distress_signals']:
                print(f"    - {sig['type']}: {sig['description']}")
        
        # Verify
        if result['distress_level'] == test['expected_level']:
            print(f"  ✓ PASS")
        else:
            print(f"  ✗ FAIL (got {result['distress_level']}, expected {test['expected_level']})")
    
    print("\n" + "="*80)
    print("TEST COMPLETE")
    print("="*80)
