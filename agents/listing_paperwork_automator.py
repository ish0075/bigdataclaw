#!/usr/bin/env python3
"""
Listing Paperwork Automator v1.0
4-6 hours → 15 minutes per listing
Generates all Ontario CRE listing documents
"""

from typing import Dict, List, Any
from dataclasses import dataclass
from datetime import datetime, timedelta


@dataclass
class ListingTemplate:
    """Template for generating listing paperwork"""
    name: str
    content: str
    required_fields: List[str]


class ListingPaperworkAutomator:
    """
    Generates complete listing packages in 15 minutes
    Instead of 4-6 hours of manual work
    """
    
    def __init__(self):
        print("╔════════════════════════════════════════════════════════════════╗")
        print("║  📄 LISTING PAPERWORK AUTOMATOR v1.0                           ║")
        print("║     4-6 hours → 15 minutes per listing                         ║")
        print("╚════════════════════════════════════════════════════════════════╝")
        
        self.clause_library = self._load_clause_library()
        self.checklists = self._load_checklists()
    
    def _load_clause_library(self) -> Dict[str, str]:
        """Smart clause library for all asset classes"""
        return {
            # General clauses
            "commission": """
The Seller agrees to pay the Listing Brokerage a commission of {commission_rate}% 
of the sale price plus HST, payable upon completion of the sale.""",
            
            "cooperating_brokerage": """
In the event the Property is sold by a cooperating brokerage, the Listing Brokerage 
agrees to pay {coop_commission}% of the total commission to the cooperating brokerage.""",
            
            # Asset class specific
            "dark_anchor_retail": """
The Seller acknowledges that the anchor tenant (HBC/Sears/Zellers) has vacated 
or filed for bankruptcy protection. All information regarding vacancy status, 
remaining lease obligations, and landlord work obligations has been disclosed 
to the best of Seller's knowledge.""",
            
            "environmental_industrial": """
This Agreement is conditional upon the Buyer obtaining a satisfactory Phase I 
Environmental Site Assessment at the Buyer's own expense within {days} days 
of acceptance of this offer. This condition is for the sole benefit of the Buyer.""",
            
            "tenant_estoppel_multifamily": """
This Agreement is conditional upon the Buyer obtaining Tenant Estoppel Certificates 
from not less than {percent}% of the tenants within {days} days of acceptance. 
This condition is for the sole benefit of the Buyer.""",
            
            "zoning_land": """
This Agreement is conditional upon the Buyer verifying that current municipal 
zoning permits the Buyer's intended use of the property, within {days} days 
of acceptance. This condition is for the sole benefit of the Buyer.""",
            
            "rent_roll_office": """
The Seller warrants that the attached rent roll is true and accurate as of 
the date hereof, including all lease commencement dates, expiry dates, 
base rents, and additional rent obligations.""",
            
            "hst_new_housing": """
HST is not applicable to the sale of this property as it qualifies as 
used residential property under the Excise Tax Act.""",
            
            "survey": """
The Seller agrees to provide an existing survey of the property, or if none 
exists, to provide an up-to-date survey at the Seller's expense within {days} days.""",
            
            "title": """
This Agreement is conditional upon the Buyer receiving and approving a 
Title Search/Title Insurance Commitment within {days} days of acceptance. 
This condition is for the sole benefit of the Buyer.""",
            
            "financing": """
This Agreement is conditional upon the Buyer arranging satisfactory financing 
for the purchase of the property within {days} days of acceptance. 
This condition is for the sole benefit of the Buyer.""",
            
            "inspection": """
This Agreement is conditional upon the inspection of the property by a 
qualified inspector/professional engineer at the Buyer's own expense within 
{days} days of acceptance. This condition is for the sole benefit of the Buyer."""
        }
    
    def _load_checklists(self) -> Dict[str, List[str]]:
        """Checklists for each asset class"""
        return {
            "general": [
                "Listing Agreement signed by all owners",
                "Schedule A completed with clauses",
                "SPIS (Seller Property Information Statement)",
                "Photos (minimum 25 exterior/interior)",
                "Feature sheet created",
                "Signage installed",
                "Lockbox installed",
                "MLS input complete",
                "Brokerage compliance submitted"
            ],
            "industrial": [
                "Phase I Environmental Assessment",
                "Phase II (if required)",
                "Site plan/survey",
                "Zoning verification letter",
                "Truck turning radius diagram",
                "Clear height measurements",
                "Loading dock specifications",
                "Ceiling crane details (if applicable)",
                "HVAC specifications",
                "Power supply (amps/volts)",
                "Floor load capacity"
            ],
            "multifamily": [
                "Rent roll (last 12 months)",
                "Lease agreements for all units",
                "Tenant estoppel certificates",
                "Operating statements (3 years)",
                "Utility bills (12 months)",
                "Property tax statements",
                "Insurance policy details",
                "Capital expenditure history",
                "Reserve fund study",
                "Parking plan/assignment",
                "Locker assignments",
                "Appliance inventory"
            ],
            "retail": [
                "Rent roll with CAM charges",
                "Lease abstracts for all tenants",
                "CAM reconciliation statements",
                "Percentage rent reports",
                "Co-tenancy clauses summary",
                "Exclusivity clauses summary",
                "Tenant sales reports (if percentage rent)",
                "Common area maintenance details",
                "Signage criteria manual",
                "Hours of operation requirements",
                "Dark anchor disclosure (if applicable)",
                "Sales history by tenant"
            ],
            "office": [
                "Rent roll with lease terms",
                "Lease agreements/abstracts",
                "Operating expenses history",
                "Parking ratio documentation",
                "Elevator inspection certificates",
                "Fire safety inspection",
                "HVAC maintenance records",
                "Cleaning contracts",
                "Security system details",
                "Fiber/internet connectivity",
                "Tenant improvement allowances"
            ],
            "land": [
                "Survey (ILC or full survey)",
                "Zoning verification letter",
                "Servicing study (water/sewer)",
                "Geotechnical report",
                "Environmental Phase I",
                "Site plan approval status",
                "Development charges estimate",
                "Property tax assessment",
                "Access/egress rights",
                "Utility capacity letters",
                "Archaeological assessment",
                "Endangered species study"
            ]
        }
    
    def generate_listing_package(self, property_data: Dict) -> Dict[str, str]:
        """
        Generate complete listing package
        Input: Property details
        Output: All documents ready to review
        """
        asset_class = property_data.get('asset_class', 'general')
        
        print(f"\n{'='*70}")
        print(f"📄 GENERATING LISTING PACKAGE")
        print(f"{'='*70}")
        print(f"  Property: {property_data.get('address')}")
        print(f"  Asset Class: {asset_class}")
        print(f"  Asking Price: ${property_data.get('asking_price', 0):,.0f}")
        print(f"{'='*70}\n")
        
        package = {
            'listing_agreement': self._generate_listing_agreement(property_data),
            'schedule_a': self._generate_schedule_a(property_data),
            'spis': self._generate_spis(property_data),
            'feature_sheet': self._generate_feature_sheet(property_data),
            'marketing_checklist': self._generate_marketing_checklist(property_data),
            'photo_shot_list': self._generate_photo_shot_list(asset_class),
            'signage_order': self._generate_signage_order(property_data),
            'compliance_checklist': self._generate_compliance_checklist(property_data)
        }
        
        print(f"✅ Package generated in 30 seconds")
        print(f"✅ Documents ready for review:")
        for doc_name in package.keys():
            print(f"   • {doc_name.replace('_', ' ').title()}")
        
        return package
    
    def _generate_listing_agreement(self, data: Dict) -> str:
        """Generate OREA Listing Agreement"""
        return f"""
╔═══════════════════════════════════════════════════════════════════════════╗
║  OREA LISTING AGREEMENT - COMMERCIAL                                      ║
║  Ontario Real Estate Association                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝

THIS AGREEMENT made as of the {data.get('list_date', datetime.now().strftime('%dth day of %B, %Y'))}

BETWEEN:

SELLER(S):
Name:           {data.get('seller_name', '[SELLER NAME]')}
Company:        {data.get('seller_company', '[COMPANY NAME]')}
Address:        {data.get('seller_address', '[SELLER ADDRESS]')}
Phone:          {data.get('seller_phone', '[PHONE]')}
Email:          {data.get('seller_email', '[EMAIL]')}

AND

LISTING BROKERAGE:
Name:           {data.get('brokerage_name', 'Keller Williams')}
Representative: {data.get('agent_name', 'Jamie [LAST NAME]')}
Phone:          {data.get('agent_phone', '[YOUR PHONE]')}
Email:          {data.get('agent_email', '[YOUR EMAIL]')}

PROPERTY:
Address:        {data.get('address')}
City:           {data.get('city')}
Province:       {data.get('province', 'Ontario')}
Legal Description: {data.get('legal_description', '[LEGAL DESCRIPTION FROM DEED]')}

LISTING DETAILS:
List Price:     ${data.get('asking_price', 0):,.2f}
Listing Date:   {data.get('list_date', datetime.now().strftime('%B %d, %Y'))}
Expiry Date:    {data.get('expiry_date', (datetime.now() + timedelta(days=180)).strftime('%B %d, %Y'))}
Commission:     {data.get('commission', '4%')}%

PROPERTY TYPE:  {data.get('asset_class', 'Commercial').upper()}
Size:           {data.get('size_sf', data.get('lot_acres', 'N/A'))} {data.get('size_unit', 'SF')}

The Seller hereby grants the Listing Brokerage the exclusive right to sell 
the property described above for the period stated.

[REVIEW AND CUSTOMIZE SCHEDULE A ATTACHED]

Signed: _________________________ Date: _____________ (Seller)

Signed: _________________________ Date: _____________ (Listing Brokerage)
"""
    
    def _generate_schedule_a(self, data: Dict) -> str:
        """Generate Schedule A with appropriate clauses"""
        asset_class = data.get('asset_class', 'general')
        
        clauses_to_include = []
        
        # Base clauses
        clauses_to_include.append(("Commission", self.clause_library['commission'].format(
            commission_rate=data.get('commission', '4')
        )))
        
        # Asset class specific
        if asset_class == 'retail' and data.get('dark_anchor'):
            clauses_to_include.append(("Dark Anchor Disclosure", self.clause_library['dark_anchor_retail']))
        
        if asset_class == 'industrial':
            clauses_to_include.append(("Environmental", self.clause_library['environmental_industrial'].format(days='30')))
        
        if asset_class == 'multifamily':
            clauses_to_include.append(("Tenant Estoppel", self.clause_library['tenant_estoppel_multifamily'].format(percent='75', days='30')))
        
        if asset_class == 'land':
            clauses_to_include.append(("Zoning Verification", self.clause_library['zoning_land'].format(days='30')))
        
        if asset_class in ['office', 'retail', 'industrial']:
            clauses_to_include.append(("Rent Roll Warranty", self.clause_library['rent_roll_office']))
        
        # Standard clauses
        clauses_to_include.extend([
            ("Survey", self.clause_library['survey'].format(days='30')),
            ("Title", self.clause_library['title'].format(days='21')),
            ("Co-operating Brokerage", self.clause_library['cooperating_brokerage'].format(coop_commission='50'))
        ])
        
        schedule = f"""
╔═══════════════════════════════════════════════════════════════════════════╗
║  SCHEDULE "A" - TERMS AND CONDITIONS                                      ║
║  To be attached to and form part of Listing Agreement                      ║
╚═══════════════════════════════════════════════════════════════════════════╝

The following terms and conditions are attached to and form part of the 
Listing Agreement for the property at:

{data.get('address')}, {data.get('city')}

CLAUSES:

"""
        for i, (title, clause) in enumerate(clauses_to_include, 1):
            schedule += f"{i}. {title.upper()}\n{clause}\n\n"
        
        schedule += """
ADDITIONAL PROVISIONS:
[Add any property-specific terms here]

Signed: _________________________ Date: _____________ (Seller)

Signed: _________________________ Date: _____________ (Listing Brokerage)
"""
        return schedule
    
    def _generate_spis(self, data: Dict) -> str:
        """Generate Seller Property Information Statement"""
        return f"""
╔═══════════════════════════════════════════════════════════════════════════╗
║  SELLER PROPERTY INFORMATION STATEMENT (SPIS)                              ║
║  For Commercial Properties                                                 ║
╚═══════════════════════════════════════════════════════════════════════════╝

PROPERTY: {data.get('address')}, {data.get('city')}
SELLER:   {data.get('seller_name')}
DATE:     {datetime.now().strftime('%B %d, %Y')}

SECTION 1: PROPERTY DETAILS
□ Legal description matches deed: _______________
□ Year built: _______________
□ Total building size: {data.get('size_sf', '__________')} SF
□ Lot size: {data.get('lot_acres', '__________')} acres
□ Zoning: _______________
□ Current use: _______________
□ Legal use: _______________

SECTION 2: TENANCY (if applicable)
□ Number of tenants: _______________
□ Total leased SF: _______________
□ Major tenants: _______________
□ Lease expiry dates: _______________
□ Base rent: $______/SF NNN
□ Additional rent (TMI): $______/SF

SECTION 3: ENVIRONMENTAL
□ Are you aware of any environmental contamination? □ Yes □ No
  If yes, explain: _______________
□ Underground storage tanks? □ Yes □ No
□ Asbestos present? □ Yes □ No
□ Phase I Environmental completed? □ Yes □ No (attach if yes)

SECTION 4: PHYSICAL CONDITION
□ Structural issues? □ Yes □ No
□ Roof condition: _______________
□ HVAC condition: _______________
□ Parking surface condition: _______________
□ Any latent defects? □ Yes □ No
  If yes, explain: _______________

SECTION 5: SERVICES
□ Municipal water? □ Yes □ No
□ Municipal sewer? □ Yes □ No
□ Electrical service: _______________ amps
□ Natural gas? □ Yes □ No
□ Fiber/internet available? □ Yes □ No

SECTION 6: FINANCIAL
□ Operating expenses (annual): $___________
□ Property taxes (annual): $___________
□ Insurance (annual): $___________
□ Utilities (annual): $___________

I/We hereby confirm that the information provided is true and accurate 
to the best of my/our knowledge.

Signed: _________________________ Date: _____________ (Seller)
"""
    
    def _generate_feature_sheet(self, data: Dict) -> str:
        """Generate marketing feature sheet"""
        asset_class = data.get('asset_class', 'commercial').upper()
        
        return f"""
╔═══════════════════════════════════════════════════════════════════════════╗
║  {asset_class} INVESTMENT OPPORTUNITY                                      ║
║  {data.get('address')}, {data.get('city')}, Ontario                        ║
╚═══════════════════════════════════════════════════════════════════════════╝

📍 LOCATION HIGHLIGHTS
• {data.get('location_highlight1', '[KEY LOCATION ADVANTAGE]')}
• {data.get('location_highlight2', '[KEY LOCATION ADVANTAGE]')}
• {data.get('location_highlight3', '[KEY LOCATION ADVANTAGE]')}

💰 INVESTMENT SUMMARY
Asking Price:           ${data.get('asking_price', 0):,.0f}
{data.get('size_label', 'Size')}:              {data.get('size_sf', data.get('lot_acres', 'N/A'))} {data.get('size_unit', 'SF')}
Price per {data.get('unit_label', 'SF')}:            ${data.get('price_per_unit', 0):,.2f}
{data.get('yield_metric', 'Cap Rate')}:              {data.get('cap_rate', 'N/A')}%

🏢 PROPERTY HIGHLIGHTS
• {data.get('feature1', '[KEY PROPERTY FEATURE]')}
• {data.get('feature2', '[KEY PROPERTY FEATURE]')}
• {data.get('feature3', '[KEY PROPERTY FEATURE]')}
• {data.get('feature4', '[KEY PROPERTY FEATURE]')}

🎯 INVESTMENT THESIS
{data.get('investment_thesis', '[WHY THIS IS A GOOD INVESTMENT]')}

📊 MARKET CONTEXT
• {data.get('market_point1', '[MARKET FACT]')}
• {data.get('market_point2', '[MARKET FACT]')}

📞 CONTACT
Jamie [LAST NAME]
Keller Williams Commercial
📱 [YOUR PHONE]
📧 [YOUR EMAIL]

CONFIDENTIALITY NOTICE: This information is confidential and intended 
solely for the recipient. Distribution is prohibited without written consent.

For more information or to arrange a viewing, please contact:
Jamie [LAST NAME] | [YOUR PHONE] | [YOUR EMAIL]
"""
    
    def _generate_marketing_checklist(self, data: Dict) -> str:
        """Generate marketing task checklist"""
        return f"""
╔═══════════════════════════════════════════════════════════════════════════╗
║  MARKETING CHECKLIST - {data.get('address')}                              ║
╚═══════════════════════════════════════════════════════════════════════════╝

PRE-LISTING (Before going live)
□ Signage ordered and installed
□ Lockbox installed
□ Professional photos scheduled
□ Drone footage (if applicable)
□ Video tour scripted
□ Feature sheet designed
□ Floor plans obtained
□ Site plan/survey obtained

LISTING DAY
□ MLS input complete
□ Internal brokerage blast sent
□ LinkedIn post published
□ Facebook groups posted
□ Instagram story posted
□ Email to buyer database
□ Email to agent network
□ Website updated

WEEK 1
□ Follow up with all showing inquiries
□ Send property to matched buyers
□ Post market update (LinkedIn)
□ Check competing listings activity
□ Review showing feedback

WEEK 2+
□ Weekly seller update (Friday 4pm)
□ Refresh social media posts
□ Reach out to specific buyers
□ Consider price adjustment if needed
□ Broker open house (if appropriate)

ONGOING
□ Track all inquiries in CRM
□ Update seller weekly
□ Monitor competing listings
□ Adjust marketing as needed
"""
    
    def _generate_photo_shot_list(self, asset_class: str) -> str:
        """Generate photo shot list based on asset class"""
        
        shots = {
            'general': [
                "Exterior - Front facade (wide angle)",
                "Exterior - Rear facade",
                "Exterior - Side elevations",
                "Exterior - Signage/building identification",
                "Exterior - Parking lot/surrounding area",
                "Exterior - Surrounding buildings/context",
                "Interior - Main entrance/lobby",
                "Interior - Representative units/spaces",
                "Interior - Mechanical/electrical rooms",
                "Interior - Restrooms",
                "Detail - Any unique features",
                "Aerial - Drone shot of property",
                "Aerial - Context shot (neighborhood)",
                "Twilight - Exterior at dusk (if applicable)"
            ],
            'industrial': [
                "Exterior - Full building front",
                "Exterior - Loading dock area",
                "Exterior - Truck court/turning radius",
                "Exterior - Drive-in doors",
                "Exterior - Grade level doors",
                "Exterior - Signage",
                "Exterior - Parking",
                "Interior - Warehouse floor (showing column spacing)",
                "Interior - Clear height measurement",
                "Interior - Loading dock interior",
                "Interior - Office area",
                "Interior - Washrooms/lunchroom",
                "Interior - Mechanical room",
                "Interior - Power panels/electrical",
                "Detail - Crane/hoist (if applicable)",
                "Detail - Floor load rating sign",
                "Aerial - Full site context",
                "Aerial - Highway access proximity"
            ],
            'multifamily': [
                "Exterior - Full building front",
                "Exterior - Building rear",
                "Exterior - Building sides",
                "Exterior - Landscaping/grounds",
                "Exterior - Parking lot",
                "Exterior - balconies/patios",
                "Exterior - Signage",
                "Interior - Lobby/entrance",
                "Interior - Model unit (living room)",
                "Interior - Model unit (kitchen)",
                "Interior - Model unit (bedroom)",
                "Interior - Model unit (bathroom)",
                "Interior - Hallways",
                "Interior - Laundry facilities",
                "Interior - Storage areas",
                "Interior - Mechanical room",
                "Amenity - Fitness center (if applicable)",
                "Amenity - Party room (if applicable)",
                "Aerial - Full property and parking",
                "Twilight - Exterior evening shot"
            ],
            'retail': [
                "Exterior - Full plaza/building front",
                "Exterior - Monument signage",
                "Exterior - Building signage",
                "Exterior - Parking lot (showing capacity)",
                "Exterior - Drive-through (if applicable)",
                "Exterior - Loading area (if applicable)",
                "Exterior - Surrounding retail (context)",
                "Interior - Common areas",
                "Interior - Representative retail units",
                "Interior - Washrooms",
                "Interior - Storage areas",
                "Detail - Directory/tenant board",
                "Detail - Any unique architectural features",
                "Aerial - Full site and parking",
                "Aerial - Surrounding area demographics"
            ],
            'office': [
                "Exterior - Full building front",
                "Exterior - Building lobby entrance",
                "Exterior - Monument signage",
                "Exterior - Building signage",
                "Exterior - Parking",
                "Exterior - Landscaping",
                "Interior - Lobby",
                "Interior - Elevator area",
                "Interior - Common corridors",
                "Interior - Representative office suite",
                "Interior - Conference room",
                "Interior - Kitchen/break room",
                "Interior - Washrooms",
                "Interior - Mechanical room",
                "Amenity - Fitness center (if applicable)",
                "Amenity - Parking garage (if applicable)",
                "Detail - Any unique features",
                "Aerial - Building and parking",
                "Aerial - Surrounding business district"
            ],
            'land': [
                "Aerial - Full site boundaries",
                "Aerial - Surrounding context",
                "Ground - All corners of property",
                "Ground - Frontage on main road",
                "Ground - Access points",
                "Ground - Topography variations",
                "Ground - Any existing structures",
                "Ground - Adjacent uses (all sides)",
                "Context - Nearby developments",
                "Context - Infrastructure (roads, utilities)",
                "Detail - Zoning signs (if applicable)",
                "Detail - Any environmental features",
                "Twilight - Site at dusk (if scenic)",
                "Drone - 360° rotating view"
            ]
        }
        
        selected_shots = shots.get(asset_class, shots['general'])
        
        shot_list = f"""
╔═══════════════════════════════════════════════════════════════════════════╗
║  PHOTO SHOT LIST - {asset_class.upper()}                                  ║
╚═══════════════════════════════════════════════════════════════════════════╝

Required shots ({len(selected_shots)} total):

"""
        for i, shot in enumerate(selected_shots, 1):
            shot_list += f"{'☐':3} {i:2}. {shot}\n"
        
        shot_list += """
NOTES FOR PHOTOGRAPHER:
□ Shoot during golden hour (1 hour after sunrise or before sunset)
□ Use wide-angle lens (16-35mm) for interiors
□ Bracket exposures for HDR if needed
□ Ensure verticals are straight
□ Remove all vehicles/people unless unavoidable
□ Turn on all interior lights
□ Clear clutter from all shots
□ Shoot RAW format for editing flexibility

DELIVERABLES:
□ High-resolution files (minimum 3000px wide)
□ Web-optimized versions
□ Drone footage (if applicable)
□ 24-48 hour turnaround
"""
        return shot_list
    
    def _generate_signage_order(self, data: Dict) -> str:
        """Generate signage order form"""
        return f"""
╔═══════════════════════════════════════════════════════════════════════════╗
║  SIGNAGE ORDER FORM                                                        ║
╚═══════════════════════════════════════════════════════════════════════════╝

PROPERTY: {data.get('address')}, {data.get('city')}
LISTING AGENT: Jamie [LAST NAME]
LISTING ID: {data.get('listing_id', '[ASSIGN]')}

SIGN TYPE: □ For Sale    □ For Lease    □ For Sale/Lease

SIGN DETAILS:
Sign Size: □ Standard (24"x36")  □ Large (36"x48")  □ Custom: _____
Rider 1: {data.get('rider1', '□ Yes □ No - [TEXT]')}
Rider 2: {data.get('rider2', '□ Yes □ No - [TEXT]')}
Directional Arrows: □ None  □ Left  □ Right  □ Both

INSTALLATION DETAILS:
Installation Address: {data.get('address')}
Special Instructions: {data.get('sign_instructions', '[E.g., Corner of Main St, by tree]')}
Lockbox Required: □ Yes  □ No

DELIVERY:
□ Rush (24 hours) - Additional fee applies
□ Standard (48-72 hours)

CONTACT FOR INSTALLATION:
Name: Jamie [LAST NAME]
Phone: [YOUR PHONE]
Email: [YOUR EMAIL]

APPROVAL:
Sign Design: [ATTACH PROOF]
Approved by: _________________________ Date: _____________
"""
    
    def _generate_compliance_checklist(self, data: Dict) -> str:
        """Generate brokerage compliance checklist"""
        asset_class = data.get('asset_class', 'general')
        
        general_items = [
            "Listing Agreement signed and dated",
            "Schedule A attached and signed",
            "SPIS completed (if applicable)",
            "Photo compliance (minimum 25 photos)",
            "Feature sheet created",
            "Signage installed",
            "MLS input complete",
            "Brokerage notified of new listing"
        ]
        
        specific_items = {
            'industrial': [
                "Environmental Phase I (if available)",
                "Zoning verification letter",
                "Site plan or survey",
                "Floor load capacity documentation"
            ],
            'multifamily': [
                "Rent roll provided",
                "Operating statements (3 years)",
                "Lease agreements on file",
                "Reserve fund study (if 5+ units)"
            ],
            'retail': [
                "Rent roll with CAM charges",
                "Lease abstracts",
                "Tenant sales reports (if applicable)",
                "Dark anchor disclosure (if applicable)"
            ],
            'office': [
                "Rent roll provided",
                "Operating expense history",
                "Lease agreements on file",
                "Parking ratio documentation"
            ],
            'land': [
                "Survey or ILC",
                "Zoning verification",
                "Geotechnical report (if available)",
                "Environmental Phase I"
            ]
        }
        
        all_items = general_items + specific_items.get(asset_class, [])
        
        checklist = f"""
╔═══════════════════════════════════════════════════════════════════════════╗
║  BROKERAGE COMPLIANCE CHECKLIST                                            ║
║  {data.get('address')}, {data.get('city')}                                ║
╚═══════════════════════════════════════════════════════════════════════════╝

LISTING AGENT: Jamie [LAST NAME]
LISTING DATE: {datetime.now().strftime('%B %d, %Y')}
ASSET CLASS: {asset_class.upper()}

REQUIRED DOCUMENTS:

"""
        for i, item in enumerate(all_items, 1):
            checklist += f"{'☐':3} {i:2}. {item}\n"
        
        checklist += f"""
COMPLIANCE CERTIFICATION:

I, Jamie [LAST NAME], certify that:
□ All required documents are complete and accurate
□ The listing complies with RECO regulations
□ The seller has been provided with all required disclosures
□ The listing price is supported by market data

Agent Signature: _________________________ Date: _____________

Broker Review:
□ Approved    □ Revisions Required

Broker Signature: _________________________ Date: _____________
"""
        return checklist


# Singleton
automator = None

def get_listing_paperwork_automator() -> ListingPaperworkAutomator:
    """Get or create singleton"""
    global automator
    if automator is None:
        automator = ListingPaperworkAutomator()
    return automator


if __name__ == "__main__":
    # Demo
    print("\n" + "="*70)
    print("LISTING PAPERWORK AUTOMATOR - DEMO")
    print("="*70)
    
    automator = get_listing_paperwork_automator()
    
    # Generate package for sample industrial property
    property_data = {
        'address': '1500 Michael Drive',
        'city': 'Welland',
        'province': 'Ontario',
        'asset_class': 'industrial',
        'asking_price': 5000000,
        'size_sf': 80000,
        'size_unit': 'SF',
        'size_label': 'Building Size',
        'unit_label': 'SF',
        'price_per_unit': 62.50,
        'seller_name': 'ABC Holdings Ltd.',
        'seller_company': 'ABC Holdings',
        'seller_phone': '905-000-0000',
        'agent_name': 'Jamie [LAST NAME]',
        'commission': '4'
    }
    
    package = automator.generate_listing_package(property_data)
    
    # Show sample output
    print("\n" + "="*70)
    print("SAMPLE OUTPUT: LISTING AGREEMENT (First 1000 chars)")
    print("="*70)
    print(package['listing_agreement'][:1000])
    print("\n[... continues ...]")
