#!/usr/bin/env python3
"""
Deal Package Generator
Generates comprehensive deal packages with all stakeholder information
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
import json


@dataclass
class DealPackage:
    """Complete deal package for a property submission"""
    tracking_id: str
    generated_at: datetime = field(default_factory=datetime.now)
    
    # Property Information
    property_summary: Dict = field(default_factory=dict)
    property_metrics: Dict = field(default_factory=dict)
    
    # Target Buyers (Top 5 with full research)
    target_buyers: List[Dict] = field(default_factory=list)
    
    # Deal Team
    lead_agent: Dict = field(default_factory=dict)
    collaborating_agents: List[Dict] = field(default_factory=list)
    
    # Lenders
    suggested_lenders: List[Dict] = field(default_factory=list)
    
    # Market Intelligence
    comparable_sales: List[Dict] = field(default_factory=list)
    market_analysis: Dict = field(default_factory=dict)
    recent_sellers: List[Dict] = field(default_factory=list)
    
    # Additional Intelligence
    distress_signals: List[Dict] = field(default_factory=list)
    fund_exit_opportunities: List[Dict] = field(default_factory=list)


class DealPackageGenerator:
    """
    Generates comprehensive deal packages
    Formats all intelligence for easy consumption by listing agents
    """
    
    def __init__(self):
        print("📦 Deal Package Generator initialized")
    
    def generate_package(self, submission_data: Dict) -> DealPackage:
        """Generate complete deal package"""
        print(f"\n{'='*80}")
        print("📦 GENERATING DEAL PACKAGE")
        print(f"{'='*80}")
        
        package = DealPackage(
            tracking_id=submission_data.get('tracking_id', ''),
            property_summary=self._extract_property_summary(submission_data),
            property_metrics=submission_data.get('metrics', {}),
            target_buyers=submission_data.get('buyers', [])[:5],
            lead_agent=submission_data.get('listing_agent', {}),
            collaborating_agents=submission_data.get('agents', []),
            suggested_lenders=submission_data.get('lenders', []),
            comparable_sales=submission_data.get('comparables', []),
            market_analysis=submission_data.get('market_stats', {})
        )
        
        print(f"  ✓ Package generated: {package.tracking_id}")
        print(f"  ✓ {len(package.target_buyers)} target buyers")
        print(f"  ✓ {len(package.collaborating_agents)} deal team agents")
        print(f"  ✓ {len(package.suggested_lenders)} suggested lenders")
        
        return package
    
    def generate_markdown_output(self, package: DealPackage) -> str:
        """Generate beautiful markdown output for Obsidian"""
        
        md = f"""# 🏢 Deal Package: {package.property_summary.get('address', '')}

> **Tracking ID:** `{package.tracking_id}`  
> **Generated:** {package.generated_at.strftime('%Y-%m-%d %H:%M')}  
> **Status:** ✅ Analysis Complete

---

## 📋 Property Summary

| Field | Value |
|-------|-------|
| **Address** | {package.property_summary.get('address', 'N/A')} |
| **City** | {package.property_summary.get('city', 'N/A')} |
| **Asset Class** | {package.property_summary.get('asset_class', 'N/A').title()} |
| **Asking Price** | ${package.property_summary.get('asking_price', 0):,.0f} |
| **Size** | {package.property_summary.get('size_sf', 'N/A'):,} SF | {package.property_summary.get('lot_acres', 'N/A')} acres |
| **Occupancy** | {package.property_summary.get('occupancy', 'N/A')}% |
| **NOI** | ${package.property_summary.get('noi', 0):,.0f} |

### 📊 Key Metrics

```yaml
"""
        
        # Add metrics
        metrics = package.property_metrics
        if isinstance(metrics, dict):
            if metrics.get('cap_rate'):
                md += f"Cap Rate: {metrics['cap_rate']:.2f}%\n"
            if metrics.get('price_per_sf'):
                md += f"Price/SF: ${metrics['price_per_sf']:.2f}\n"
            if metrics.get('price_per_acre'):
                md += f"Price/Acre: ${metrics['price_per_acre']:,.2f}\n"
            if metrics.get('price_per_unit'):
                md += f"Price/Unit: ${metrics['price_per_unit']:,.2f}\n"
        
        md += f"```\n\n"
        
        # Target Buyers Section
        md += """---

## 🎯 Target Buyers (Top 5)

"""
        
        for i, buyer in enumerate(package.target_buyers, 1):
            md += self._format_buyer_section(buyer, i)
        
        # Deal Team Section
        md += """---

## 🤝 Deal Team

"""
        
        if package.lead_agent and package.lead_agent.get('name'):
            md += f"""### Lead Listing Agent

| Name | Company | Contact |
|------|---------|---------|
| {package.lead_agent.get('name', 'N/A')} | {package.lead_agent.get('company', 'N/A')} | 📧 {package.lead_agent.get('email', 'N/A')}<br>📞 {package.lead_agent.get('phone', 'N/A')} |

"""
        
        if package.collaborating_agents:
            md += """### Suggested Collaborating Agents

"""
            for agent in package.collaborating_agents[:5]:
                name = agent.get('name', 'Unknown')
                company = agent.get('company', 'Unknown')
                email = agent.get('email', agent.get('contact', {}).get('email', 'N/A'))
                phone = agent.get('phone', agent.get('contact', {}).get('phone', 'N/A'))
                specialty = agent.get('specialty', agent.get('specialties', ['General Commercial'])[0] if agent.get('specialties') else 'General Commercial')
                
                md += f"""#### {name} ({company})

- **Specialty:** {specialty}
- **Expertise:** {', '.join(agent.get('expertise', []))}
- **Recent Activity:** {agent.get('recent_deals_count', 0)} deals
- **Contact:** 📧 {email} | 📞 {phone}
"""
                if agent.get('quick_links'):
                    md += f"- **Links:** [LinkedIn]({agent['quick_links'].get('linkedin', '#')}) | [Listings]({agent['quick_links'].get('listings', '#')})\n"
                md += "\n"
        
        # Lenders Section
        md += """---

## 🏦 Suggested Lenders

"""
        
        for lender in package.suggested_lenders[:3]:
            md += f"""### {lender.get('name', 'Unknown')}

| Type | Loan Range | Contact |
|------|------------|---------|
| {lender.get('type', 'Unknown')} | ${lender.get('min_loan', 0)/1e6:.1f}M - ${lender.get('max_loan', 0)/1e6:.0f}M | {lender.get('contact', {}).get('name', 'N/A')}<br>📞 {lender.get('contact', {}).get('phone', 'N/A')} |

**Asset Classes:** {', '.join(lender.get('asset_classes', []))}

"""
        
        # Market Analysis Section
        md += """---

## 📈 Market Intelligence

"""
        
        if package.market_analysis:
            md += f"""### Market Statistics

| Metric | Value |
|--------|-------|
| Market Cap Rate | {package.market_analysis.get('avg_cap_rate', 'N/A')}% |
| Avg Price/SF | ${package.market_analysis.get('avg_price_per_sf', 0):.2f} |
| Transaction Volume | {package.market_analysis.get('transaction_volume', 'N/A')} |
| Market Trend | {package.market_analysis.get('trend', 'Stable')} |

"""
        
        if package.comparable_sales:
            md += """### Comparable Sales

"""
            for comp in package.comparable_sales[:5]:
                md += f"""- **{comp.get('address', 'Unknown')}**
  - Sold: ${comp.get('sale_price', 0):,.0f} ({comp.get('sale_date', 'N/A')})
  - Size: {comp.get('size_sf', 'N/A'):,} SF
  - Cap Rate: {comp.get('cap_rate', 'N/A')}%

"""
        
        # Action Items
        md += """---

## ✅ Recommended Actions

1. **Immediate Outreach** - Contact top 3 buyers within 48 hours
2. **Brokerage Coordination** - Schedule call with deal team
3. **Lender Pre-qualification** - Share package with preferred lenders
4. **Marketing Materials** - Prepare executive summary for distribution

---

*Generated by BigDataClaw Multi-Agent System*
"""
        
        return md
    
    def _format_buyer_section(self, buyer: Dict, rank: int) -> str:
        """Format a buyer section"""
        score = buyer.get('match_score', 0)
        
        # Determine priority badge
        if score >= 90:
            badge = "🔥 URGENT"
        elif score >= 75:
            badge = "⚡ HIGH"
        elif score >= 60:
            badge = "📌 MEDIUM"
        else:
            badge = "📋 STANDARD"
        
        md = f"""### #{rank} {buyer.get('company', 'Unknown')} {badge}

| Match Score | Type | Contact |
|-------------|------|---------|
| **{score}/100** | {buyer.get('type', 'Strategic')} | 📧 {buyer.get('contact_info', {}).get('email', 'Research needed')}<br>📞 {buyer.get('contact_info', {}).get('phone', 'N/A')} |

**📝 Why This Buyer:**

{buyer.get('justification', 'Strategic fit')}

"""
        
        # Add talking points if available
        if buyer.get('talking_points'):
            md += """**💡 Talking Points:**

"""
            for point in buyer['talking_points'][:3]:
                md += f"- {point}\n"
            md += "\n"
        
        # Add recent activity
        if buyer.get('recent_activity'):
            md += """**📈 Recent Activity:**

"""
            for activity in buyer['recent_activity'][:2]:
                if activity.get('amount'):
                    md += f"- {activity.get('type', 'Deal').title()}: ${activity['amount']:,.0f} ({activity.get('date', 'Recent')})\n"
                else:
                    md += f"- {activity.get('type', 'Deal').title()}: {activity.get('date', 'Recent')}\n"
            md += "\n"
        
        # Add research if available
        if buyer.get('research'):
            research = buyer['research']
            if research.get('confidence_score', 0) > 0:
                md += f"""**🔍 Research Confidence:** {research['confidence_score']:.0f}/100

"""
                md += f"{research.get('executive_summary', '')[:300]}...\n\n"
        
        # Add quick links
        if buyer.get('quick_links'):
            links = buyer['quick_links']
            md += f"""**🔗 Quick Links:** [LinkedIn]({links.get('linkedin', '#')}) | [Website]({links.get('website', '#')}) | [Recent Deals]({links.get('recent_deals', '#')})

"""
        
        md += "---\n\n"
        return md
    
    def _extract_property_summary(self, data: Dict) -> Dict:
        """Extract property summary from submission data"""
        prop = data.get('property', {})
        return {
            'address': prop.get('address', ''),
            'city': prop.get('city', ''),
            'asset_class': prop.get('asset_class', ''),
            'asking_price': prop.get('asking_price', 0),
            'size_sf': prop.get('size_sf'),
            'lot_acres': prop.get('lot_acres'),
            'occupancy': prop.get('occupancy'),
            'noi': prop.get('noi')
        }
    
    def generate_json_output(self, package: DealPackage) -> Dict:
        """Generate JSON output for API consumption"""
        return {
            'tracking_id': package.tracking_id,
            'generated_at': package.generated_at.isoformat(),
            'property': package.property_summary,
            'metrics': package.property_metrics,
            'buyers': package.target_buyers,
            'deal_team': {
                'lead': package.lead_agent,
                'collaborators': package.collaborating_agents
            },
            'lenders': package.suggested_lenders,
            'market': {
                'analysis': package.market_analysis,
                'comparables': package.comparable_sales
            }
        }


# Singleton
_generator = None

def get_deal_package_generator() -> DealPackageGenerator:
    """Get or create singleton"""
    global _generator
    if _generator is None:
        _generator = DealPackageGenerator()
    return _generator


if __name__ == "__main__":
    # Demo
    print("="*80)
    print("DEAL PACKAGE GENERATOR - DEMO")
    print("="*80)
    
    generator = get_deal_package_generator()
    
    # Mock submission data
    submission_data = {
        'tracking_id': 'Ottawa_20260114_1',
        'property': {
            'address': '100 Bayshore Drive',
            'city': 'Ottawa',
            'asset_class': 'retail',
            'asking_price': 300000000,
            'size_sf': 880000,
            'occupancy': 75,
            'noi': 15400000
        },
        'metrics': {
            'cap_rate': 5.13,
            'price_per_sf': 340.91,
            'price_per_acre': None
        },
        'buyers': [
            {
                'company': 'KingSett Capital',
                'match_score': 92,
                'type': 'Private Equity',
                'justification': 'Active retail investor | Has presence in Ottawa market | $800M dry powder | EXIT_WINDOW active',
                'research': {
                    'match_dimensions': [
                        {'dimension': 'Asset Class', 'score': 85, 'indicators': ['Target asset class', '2 recent retail acquisitions']},
                        {'dimension': 'Geography', 'score': 80, 'indicators': ['Ottawa in expansion phase']},
                        {'dimension': 'Fund Lifecycle', 'score': 95, 'indicators': ['EXIT WINDOW ACTIVE']}
                    ]
                },
                'contact_info': {'email': 'acquisitions@kingsett.com', 'phone': '416-687-6700'},
                'quick_links': {
                    'linkedin': 'https://www.linkedin.com/company/kingsett-capital',
                    'website': 'https://www.kingsett.ca',
                    'recent_deals': 'https://www.kingsett.ca/news'
                }
            }
        ],
        'listing_agent': {
            'name': 'John Smith',
            'company': 'Colliers',
            'email': 'john.smith@colliers.com',
            'phone': '613-555-0000'
        },
        'agents': [
            {
                'name': 'Jennifer Walsh',
                'company': 'Avison Young',
                'specialty': 'Ottawa Retail',
                'expertise': ['Market Analysis', 'Retail Investment'],
                'email': 'j.walsh@avisonyoung.com',
                'phone': '613-555-0400'
            }
        ],
        'lenders': [
            {
                'name': 'KingSett Mortgage',
                'type': 'Private Lender',
                'min_loan': 10000000,
                'max_loan': 300000000,
                'asset_classes': ['retail', 'multifamily', 'industrial'],
                'contact': {'name': 'Scott Coates', 'phone': '416-687-6702'}
            }
        ],
        'market_stats': {
            'avg_cap_rate': 5.5,
            'avg_price_per_sf': 320.00,
            'trend': 'Stable'
        }
    }
    
    package = generator.generate_package(submission_data)
    md_output = generator.generate_markdown_output(package)
    
    print("\n" + "="*80)
    print("MARKDOWN OUTPUT PREVIEW:")
    print("="*80)
    print(md_output[:2000])
    print("\n[... output truncated ...]")
