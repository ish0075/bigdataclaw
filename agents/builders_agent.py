#!/usr/bin/env python3
"""
Builders Agent Bot v1.0
Handles land-to-builder matching, builder database queries, and quick links
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
import json


@dataclass
class LandSite:
    """Land listing for sale"""
    address: str
    city: str
    province: str = "ON"
    size_acres: float = 0
    size_sf: Optional[float] = None
    zoning: str = ""  # residential, commercial, mixed, industrial
    approved_units: Optional[int] = None
    approved_use: str = ""  # singles, towns, condos, mixed
    asking_price: float = 0
    spa_approved: bool = False
    servicing_status: str = ""  # unserviced, partial, full
    seller_name: str = ""
    notes: str = ""


@dataclass
class Builder:
    """Builder profile"""
    name: str
    tier: str = ""  # 1, 2, 3
    asset_classes: List[str] = field(default_factory=list)
    markets: List[str] = field(default_factory=list)
    price_range_min: int = 0
    price_range_max: int = 0
    capacity: str = ""  # high, medium, low
    active_projects: int = 0
    contacts: List[str] = field(default_factory=list)
    phone: str = ""
    email: str = ""
    livabl_url: str = ""
    notes: str = ""


class BuildersAgent:
    """
    Specialized agent for land-to-builder matching
    """
    
    def __init__(self):
        print("╔════════════════════════════════════════════════════════════════╗")
        print("║  🤖 BUILDERS AGENT BOT v1.0                                    ║")
        print("║     Land → Builder Matching Engine                             ║")
        print("╚════════════════════════════════════════════════════════════════╝")
        
        self.builders: Dict[str, Builder] = {}
        self.land_sites: Dict[str, LandSite] = {}
        self._load_builders()
        print(f"\n✅ Loaded {len(self.builders)} builders")
    
    def _load_builders(self):
        """Load VIP builder database"""
        vip_builders = {
            "Mountainview Building Group": Builder(
                name="Mountainview Building Group",
                tier="1",
                asset_classes=["townhouse", "single_family", "low_rise_condo", "mixed_use"],
                markets=["Thorold", "Welland", "Niagara Falls", "Pelham", "Fonthill", "Fort Erie"],
                price_range_min=499000,
                price_range_max=946000,
                capacity="high",
                active_projects=15,
                contacts=["Mark Basciano", "Nick Colamartini"],
                phone="905-688-3100",
                email="properties@mountainview.com",
                livabl_url="https://www.livabl.com/land-developer/mountainview-building-group",
                notes="HQ in Thorold. 50+ projects, 15 active. SOLD OUT Elements condo in St. Catharines."
            ),
            "Pinewood Niagara Builders": Builder(
                name="Pinewood Niagara Builders",
                tier="1",
                asset_classes=["condo", "townhouse"],
                markets=["Niagara Falls", "St. Catharines"],
                price_range_min=500000,
                price_range_max=800000,
                capacity="high",
                active_projects=5,
                contacts=["Robert Cicalo", "Joe Cicalo"],
                phone="905-262-2222",
                email="clientcare@pinewoodniagarabuilders.ca",
                livabl_url="https://www.livabl.com/builder/pinewood-niagara-builders",
                notes="JV with Mountainview on Splendour. Coveteur Condos, Arbour Vale, Pine Mansions."
            ),
            "Zeina Homes": Builder(
                name="Zeina Homes",
                tier="2",
                asset_classes=["custom_homes", "single_family"],
                markets=["St. Catharines", "Niagara Falls", "Fonthill", "Thorold", "Welland"],
                price_range_min=600000,
                price_range_max=1200000,
                capacity="medium",
                active_projects=3,
                contacts=["Zeina Kassouf"],
                phone="905-381-4663",
                email="",
                livabl_url="https://www.livabl.com/search?q=Zeina+Homes",
                notes="3rd generation builder. Model home at 60 Philmori Blvd Fonthill. Land positions."
            ),
            "Parkside Custom Homes": Builder(
                name="Parkside Custom Homes",
                tier="2",
                asset_classes=["townhouse", "custom_homes"],
                markets=["Fonthill"],
                price_range_min=550000,
                price_range_max=900000,
                capacity="medium",
                active_projects=2,
                contacts=["Sam Biasutto"],
                phone="",
                email="",
                livabl_url="https://www.livabl.com/search?q=Parkside+Custom+Homes",
                notes="Saffron Estates townhome lots in Fonthill."
            ),
            "Elite Developments": Builder(
                name="Elite Developments",
                tier="2",
                asset_classes=["condo", "high_rise"],
                markets=["St. Catharines"],
                price_range_min=400000,
                price_range_max=700000,
                capacity="high",
                active_projects=2,
                contacts=["Elie Ghossain", "Fady Ghossain"],
                phone="",
                email="",
                livabl_url="https://www.livabl.com/builder/elite-developments",
                notes="88 James - tallest residential in St. Catharines. High-rise specialist."
            ),
            "Silvergate Homes": Builder(
                name="Silvergate Homes",
                tier="2",
                asset_classes=["condo", "townhouse"],
                markets=["St. Catharines"],
                price_range_min=450000,
                price_range_max=750000,
                capacity="medium",
                active_projects=2,
                contacts=["John Heaslip"],
                phone="",
                email="",
                livabl_url="https://www.livabl.com/builder/silvergate-homes",
                notes="Merritton Mills project in St. Catharines."
            ),
            "Lally Homes": Builder(
                name="Lally Homes",
                tier="2",
                asset_classes=["single_family", "custom_homes"],
                markets=["Niagara Falls", "Welland", "Fonthill", "St. Catharines"],
                price_range_min=500000,
                price_range_max=900000,
                capacity="medium",
                active_projects=3,
                contacts=["Mike Lally"],
                phone="",
                email="",
                livabl_url="https://www.livabl.com/search?q=Lally+Homes+Niagara",
                notes="Coverage across Niagara region."
            ),
            "Niagara Innovative Living": Builder(
                name="Niagara Innovative Living",
                tier="2",
                asset_classes=["condo"],
                markets=["Fonthill", "St. Catharines"],
                price_range_min=450000,
                price_range_max=700000,
                capacity="medium",
                active_projects=2,
                contacts=[],
                phone="",
                email="",
                livabl_url="https://www.livabl.com/builder/niagara-innovative-living",
                notes="105 Welland Road (Fonthill), Vine Street Condominium (St. Catharines)."
            ),
            "Sphere Developments": Builder(
                name="Sphere Developments",
                tier="2",
                asset_classes=["townhouse"],
                markets=["Port Dalhousie", "St. Catharines"],
                price_range_min=500000,
                price_range_max=800000,
                capacity="low",
                active_projects=1,
                contacts=[],
                phone="",
                email="",
                livabl_url="https://www.livabl.com/st-catharines-on/lot-16",
                notes="Lot 16 Urban Towns in Port Dalhousie."
            ),
            "Valour Group": Builder(
                name="Valour Group",
                tier="2",
                asset_classes=["condo"],
                markets=["Port Dalhousie"],
                price_range_min=600000,
                price_range_max=1000000,
                capacity="medium",
                active_projects=1,
                contacts=[],
                phone="",
                email="",
                livabl_url="https://www.livabl.com/builder/valour-group",
                notes="The Harbour Club - waterfront condo in Port Dalhousie."
            ),
            "Alfred Beam Excavating": Builder(
                name="Alfred Beam Excavating",
                tier="3",
                asset_classes=["land_development"],
                markets=["Fonthill", "Thorold", "Welland"],
                price_range_min=0,
                price_range_max=0,
                capacity="high",
                active_projects=3,
                contacts=["Alfred Beam"],
                phone="",
                email="",
                livabl_url="https://www.livabl.com/search?q=Alfred+Beam",
                notes="Land development partner. Projects: Saffron Meadows, Merritt Meadows, Drapers Creek."
            ),
            "Rankin Construction": Builder(
                name="Rankin Construction",
                tier="3",
                asset_classes=["infrastructure", "land_development"],
                markets=["Niagara"],
                price_range_min=0,
                price_range_max=0,
                capacity="high",
                active_projects=2,
                contacts=["Mike Rankin"],
                phone="",
                email="",
                livabl_url="https://www.livabl.com/builder/rankin-construction",
                notes="Major infrastructure. JV partner with Alfred Beam."
            )
        }
        
        self.builders = vip_builders
    
    def add_land_site(self, land_data: Dict) -> str:
        """Add a new land site for matching"""
        site_id = f"LAND_{datetime.now().strftime('%Y%m%d')}_{len(self.land_sites)+1}"
        
        land = LandSite(
            address=land_data.get('address', ''),
            city=land_data.get('city', ''),
            province=land_data.get('province', 'ON'),
            size_acres=land_data.get('size_acres', 0),
            size_sf=land_data.get('size_sf'),
            zoning=land_data.get('zoning', ''),
            approved_units=land_data.get('approved_units'),
            approved_use=land_data.get('approved_use', ''),
            asking_price=land_data.get('asking_price', 0),
            spa_approved=land_data.get('spa_approved', False),
            servicing_status=land_data.get('servicing_status', ''),
            seller_name=land_data.get('seller_name', ''),
            notes=land_data.get('notes', '')
        )
        
        self.land_sites[site_id] = land
        print(f"✅ Land site added: {site_id}")
        return site_id
    
    def match_builders_to_land(self, land_id: str) -> List[Dict]:
        """Find best builder matches for a land site"""
        if land_id not in self.land_sites:
            return []
        
        land = self.land_sites[land_id]
        matches = []
        
        for builder in self.builders.values():
            score = 0
            reasons = []
            
            # Location match (40 points)
            if land.city in builder.markets:
                score += 40
                reasons.append(f"Active in {land.city}")
            elif any(m.lower() in land.city.lower() for m in builder.markets):
                score += 30
                reasons.append(f"Active in nearby market")
            
            # Asset class match (30 points)
            land_use = land.approved_use.lower()
            builder_assets = [a.lower() for a in builder.asset_classes]
            
            if 'town' in land_use and 'townhouse' in builder_assets:
                score += 30
                reasons.append("Townhouse specialist")
            elif 'single' in land_use and 'single_family' in builder_assets:
                score += 30
                reasons.append("Single family specialist")
            elif 'condo' in land_use and 'condo' in builder_assets:
                score += 30
                reasons.append("Condo specialist")
            elif 'mixed' in land_use and 'mixed_use' in builder_assets:
                score += 30
                reasons.append("Mixed-use experience")
            elif land.zoning.lower() in ['residential', 'commercial']:
                score += 20
                reasons.append("General residential experience")
            
            # Capacity (20 points)
            if builder.capacity == 'high':
                score += 20
                reasons.append("High capacity (15+ active projects)")
            elif builder.capacity == 'medium':
                score += 15
                reasons.append("Medium capacity")
            
            # Tier bonus (10 points)
            if builder.tier == '1':
                score += 10
            elif builder.tier == '2':
                score += 5
            
            if score >= 50:
                matches.append({
                    'builder': builder.name,
                    'score': min(100, score),
                    'tier': builder.tier,
                    'reasons': reasons,
                    'phone': builder.phone,
                    'email': builder.email,
                    'contacts': builder.contacts,
                    'livabl_url': builder.livabl_url,
                    'quick_links': self._generate_quick_links(builder),
                    'capacity': builder.capacity,
                    'markets': builder.markets,
                    'asset_classes': builder.asset_classes
                })
        
        # Sort by score
        matches.sort(key=lambda x: x['score'], reverse=True)
        return matches
    
    def _generate_quick_links(self, builder: Builder) -> Dict[str, str]:
        """Generate quick links for a builder"""
        name_encoded = builder.name.replace(' ', '%20')
        name_plus = builder.name.replace(' ', '+')
        
        return {
            'livabl_profile': builder.livabl_url if builder.livabl_url else f"https://www.livabl.com/search?q={name_plus}",
            'livabl_projects': f"https://www.livabl.com/search?q={name_plus}+projects",
            'linkedin_company': f"https://www.linkedin.com/search/results/companies/?keywords={name_encoded}",
            'linkedin_people': f"https://www.linkedin.com/search/results/people/?keywords={name_encoded}",
            'google_website': f"https://www.google.com/search?q={name_plus}+official+website",
            'google_news': f"https://www.google.com/search?q={name_plus}+news+2024+2025",
            'email': f"mailto:{builder.email}" if builder.email else ""
        }
    
    def generate_land_report(self, land_id: str) -> str:
        """Generate full builder match report for a land site"""
        if land_id not in self.land_sites:
            return f"Land site {land_id} not found"
        
        land = self.land_sites[land_id]
        matches = self.match_builders_to_land(land_id)
        
        report = f"""
╔═══════════════════════════════════════════════════════════════════════════╗
║  🏗️ LAND SITE: {land.address[:40]:<45} ║
║  📍 {land.city}, {land.province}                                                  ║
╚═══════════════════════════════════════════════════════════════════════════╝

📊 SITE DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Size: {land.size_acres} acres
  Zoning: {land.zoning}
  Approved Use: {land.approved_use}
  Approved Units: {land.approved_units if land.approved_units else 'N/A'}
  SPA Approved: {'✅ YES' if land.spa_approved else '❌ No'}
  Asking Price: ${land.asking_price:,.0f}

🎯 TOP BUILDER MATCHES ({len(matches)} found)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
        
        for i, match in enumerate(matches[:10], 1):
            badge = "🔥" if match['score'] >= 90 else "⚡" if match['score'] >= 75 else "📌"
            report += f"""
{badge} #{i} {match['builder']} (Score: {match['score']}/100)
   Tier: {match['tier']} | Capacity: {match['capacity'].upper()}
   📞 {match['phone'] if match['phone'] else 'N/A'}
   📧 {match['email'] if match['email'] else 'N/A'}
   👥 Contacts: {', '.join(match['contacts']) if match['contacts'] else 'N/A'}
   
   ✅ Why They Match:
   {chr(10).join(['   • ' + r for r in match['reasons']])}
   
   🔗 Quick Links:
   • [livabl Profile]({match['quick_links']['livabl_profile']})
   • [LinkedIn Company]({match['quick_links']['linkedin_company']})
   • [LinkedIn People]({match['quick_links']['linkedin_people']})
   • [Company Website]({match['quick_links']['google_website']})
   • [Recent News]({match['quick_links']['google_news']})
   
"""
        
        report += """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 NEXT STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Call 🔥 Tier 1 builders TODAY (score 90+)
2. Call ⚡ Tier 2 builders THIS WEEK (score 75-89)
3. Research additional builders on livabl.com
4. Send attention_builders.pdf to top 5 matches
5. Follow up within 48 hours

💡 TALKING POINTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Opening: "Hi, this is Jamie Isherwood. I have a {zoning} site in {city}
with {approved_use} approval for {approved_units} units. Given your
experience with {asset_class}, I thought this would be a perfect fit."

SPA Angle: "{spa_benefit}"

Location Angle: "{location_benefit}"
""".format(
            zoning=land.zoning,
            city=land.city,
            approved_use=land.approved_use,
            approved_units=land.approved_units if land.approved_units else 'multiple',
            asset_class='similar projects' if matches else 'this type of development',
            spa_benefit='SPA already approved - saves 18-24 months vs raw land' if land.spa_approved else 'Ready for immediate development',
            location_benefit=f'In {land.city} where you\'re already active' if matches and land.city in matches[0]['markets'] else 'In growing Niagara region'
        )
        
        return report
    
    def find_builders_by_asset_class(self, asset_class: str, city: str = "") -> List[Builder]:
        """Find all builders that build a specific asset class"""
        results = []
        asset_lower = asset_class.lower()
        
        for builder in self.builders.values():
            builder_assets = [a.lower() for a in builder.asset_classes]
            
            # Check asset class match
            if any(asset_lower in ba for ba in builder_assets):
                # If city specified, check location
                if city:
                    if city.lower() in [m.lower() for m in builder.markets]:
                        results.append(builder)
                else:
                    results.append(builder)
        
        return results
    
    def get_builder_quick_links(self, builder_name: str) -> Dict[str, str]:
        """Get quick links for a specific builder"""
        if builder_name in self.builders:
            return self._generate_quick_links(self.builders[builder_name])
        return {}
    
    def list_all_builders(self) -> str:
        """List all builders in database"""
        output = "\n📋 ALL BUILDERS IN DATABASE\n"
        output += "="*70 + "\n\n"
        
        # Group by tier
        tiers = {"1": [], "2": [], "3": []}
        for builder in self.builders.values():
            if builder.tier in tiers:
                tiers[builder.tier].append(builder)
        
        for tier_num in ["1", "2", "3"]:
            if tiers[tier_num]:
                output += f"\n🔥 TIER {tier_num} BUILDERS:\n"
                output += "-"*70 + "\n"
                for b in tiers[tier_num]:
                    output += f"• {b.name}\n"
                    output += f"  Builds: {', '.join(b.asset_classes)}\n"
                    output += f"  Markets: {', '.join(b.markets[:3])}\n"
                    output += f"  Contact: {b.phone if b.phone else 'N/A'}\n\n"
        
        return output


# Singleton
builders_agent = None

def get_builders_agent() -> BuildersAgent:
    """Get or create singleton"""
    global builders_agent
    if builders_agent is None:
        builders_agent = BuildersAgent()
    return builders_agent


if __name__ == "__main__":
    # Demo
    print("="*70)
    print("BUILDERS AGENT BOT - DEMO")
    print("="*70)
    
    agent = get_builders_agent()
    
    # Add a land site
    land_id = agent.add_land_site({
        'address': '75 Ormond St S',
        'city': 'Thorold',
        'size_acres': 1.7,
        'zoning': 'Residential',
        'approved_use': 'townhouse',
        'approved_units': 85,
        'spa_approved': True,
        'asking_price': 4820000
    })
    
    # Generate report
    report = agent.generate_land_report(land_id)
    print(report[:3000])
    print("\n[... report continues ...]")
