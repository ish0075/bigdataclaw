#!/usr/bin/env python3
"""
Offer Writer Pro v1.0
Commercial Real Estate Offer Generator
All Asset Classes: Land, Apartments, Industrial, Malls, Medical, 
Retirement, Office, Retail, Plazas
2-3 hours → 20 minutes per offer
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum


class AssetClass(Enum):
    LAND = "land"
    APARTMENTS = "apartments"  # Multifamily
    INDUSTRIAL = "industrial"
    MALLS = "malls"  # Regional/Community
    PLAZAS = "plazas"  # Strip/Neighbourhood
    MEDICAL = "medical"  # Medical office/buildings
    RETIREMENT = "retirement"  # Senior living
    OFFICE = "office"
    RETAIL = "retail"  # Standalone


@dataclass
class OfferTerms:
    """Core offer terms"""
    purchase_price: float
    deposit_amount: float
    deposit_due: int = 5  # days
    closing_date: str = ""
    conditions: List[str] = None
    special_clauses: List[str] = None


class OfferWriterPro:
    """
    Professional offer writer for all commercial asset classes
    Generates complete OREA agreements with asset-specific clauses
    """
    
    def __init__(self):
        print("╔════════════════════════════════════════════════════════════════╗")
        print("║  📝 OFFER WRITER PRO v1.0                                      ║")
        print("║     All Asset Classes | Ontario Commercial Real Estate         ║")
        print("║     2-3 hours → 20 minutes per offer                           ║")
        print("╚════════════════════════════════════════════════════════════════╝")
        
        self.clause_library = self._load_clause_library()
    
    def _load_clause_library(self) -> Dict[str, Dict[str, str]]:
        """
        Asset class specific clauses
        """
        return {
            # ===== LAND CLAUSES =====
            "land": {
                "zoning_verification": """
CONDITION: ZONING VERIFICATION
This Agreement is conditional upon the Buyer obtaining, at the Buyer's own expense 
and within {days} days of acceptance, confirmation from the applicable municipal 
authority that the current zoning permits the Buyer's intended use and development 
of the property. This condition is for the sole benefit of the Buyer and may be 
waived at the Buyer's sole option by notice in writing to the Seller within the 
stipulated time.""",
                
                "soil_testing": """
CONDITION: GEOTECHNICAL INVESTIGATION
This Agreement is conditional upon the Buyer obtaining, at the Buyer's own expense 
and within {days} days of acceptance, a satisfactory geotechnical/soil report 
confirming the property is suitable for the Buyer's intended construction. 
This condition is for the sole benefit of the Buyer.""",
                
                "environmental_phase_1": """
CONDITION: ENVIRONMENTAL ASSESSMENT
This Agreement is conditional upon the Buyer obtaining, at the Buyer's own expense 
and within {days} days of acceptance, a satisfactory Phase I Environmental Site 
Assessment. If Phase I indicates potential contamination, Buyer may conduct Phase 
II at Buyer's expense. This condition is for the sole benefit of the Buyer.""",
                
                "development_charges": """
DEVELOPMENT CHARGES ESTIMATE
The Seller represents that current development charges for the intended use are 
approximately ${amount} as of the date hereof. Buyer to verify all development 
charges and planning fees prior to closing.""",
                
                "servicing_capacity": """
CONDITION: MUNICIPAL SERVICING CAPACITY
This Agreement is conditional upon the Buyer obtaining written confirmation from 
the applicable municipality within {days} days that adequate water, sewer, and 
electrical capacity exists for the Buyer's intended development. This condition 
is for the sole benefit of the Buyer.""",
                
                "site_plan_approval": """
CONDITION: SITE PLAN APPROVAL
This Agreement is conditional upon the Buyer obtaining Site Plan Approval from 
the applicable municipal authority within {days} days of acceptance. This condition 
is for the sole benefit of the Buyer."""
            },
            
            # ===== APARTMENTS/MULTIFAMILY CLAUSES =====
            "apartments": {
                "tenant_estoppel": """
CONDITION: TENANT ESTOPPEL CERTIFICATES
This Agreement is conditional upon the Buyer obtaining fully executed Estoppel 
Certificates from tenants occupying not less than {percent}% of the rentable area, 
confirming lease terms, rent status, and security deposits, within {days} days 
of acceptance. This condition is for the sole benefit of the Buyer.""",
                
                "rent_roll_verification": """
RENT ROLL WARRANTY
The Seller warrants that the attached rent roll is true and accurate as of the 
date hereof, and shall update same to the closing date. All leases, lease amendments, 
and side agreements have been disclosed to the Buyer.""",
                
                "security_deposits": """
SECURITY DEPOSITS
The Seller represents that security deposits and last month's rent deposits totaling 
${amount} are held in trust and shall be transferred to the Buyer at closing. 
Seller to provide verification of same.""",
                
                "operating_statements": """
OPERATING STATEMENTS
The Seller shall provide certified operating statements for the past three (3) 
fiscal years and year-to-date current year, along with all utility bills, property 
tax statements, and capital expenditure records.""",
                
                "reserve_fund": """
RESERVE FUND
The Seller represents that a reserve fund of ${amount} is maintained for capital 
repairs and replacements. This fund shall be transferred to the Buyer at closing 
prorated to the closing date.""",
                
                "rent_control": """
RENT CONTROL COMPLIANCE
The Seller warrants that all rental units comply with applicable rent control 
legislation and that all rent increases have been properly filed and approved. 
No above-guideline increases are pending."""
            },
            
            # ===== INDUSTRIAL CLAUSES =====
            "industrial": {
                "environmental_phase_1": """
CONDITION: PHASE I ENVIRONMENTAL SITE ASSESSMENT
This Agreement is conditional upon the Buyer obtaining, at the Buyer's own expense, 
a satisfactory Phase I Environmental Site Assessment conducted by a qualified 
environmental consultant within {days} days of acceptance. Should Phase I indicate 
potential contamination, Buyer may, at Buyer's option and expense, conduct Phase II 
investigation. This condition is for the sole benefit of the Buyer.""",
                
                "environmental_rep": """
ENVIRONMENTAL REPRESENTATION
To the best of the Seller's knowledge, the property has not been used for the 
generation, treatment, storage, or disposal of hazardous substances except as 
disclosed. No environmental orders or notices are pending.""",
                
                "underground_tanks": """
UNDERGROUND STORAGE TANKS
The Seller represents that {representation} underground storage tanks exist on 
the property. {if_yes}Any such tanks have been properly registered and maintained.{endif}
""",
                
                "zoning_industrial": """
ZONING COMPLIANCE
The Seller represents the current use as {current_use} complies with municipal 
zoning bylaws. All necessary industrial approvals, permits, and licenses are 
current and transferable.""",
                
                "fire_safety": """
FIRE SAFETY COMPLIANCE
The Seller represents the property complies with the Ontario Fire Code and all 
fire safety inspections are current. No outstanding orders exist. Sprinkler 
systems, alarms, and safety equipment are operational.""",
                
                "hazardous_materials": """
HAZARDOUS MATERIALS DISCLOSURE
The Seller has disclosed all uses of hazardous materials including: {list_or_none}. 
All MSDS sheets and handling procedures shall be provided to Buyer prior to closing."""
            },
            
            # ===== MALLS/REGIONAL RETAIL CLAUSES =====
            "malls": {
                "anchor_tenant_estoppel": """
CONDITION: ANCHOR TENANT ESTOPPEL
This Agreement is conditional upon the Buyer obtaining executed Estoppel Certificates 
from all anchor tenants (occupying 20,000+ SF) and tenants representing 75% of gross 
leasable area, within {days} days of acceptance. This condition is for the sole 
benefit of the Buyer.""",
                
                "rent_roll_mall": """
RENT ROLL AND LEASE SCHEDULE
Seller warrants the attached rent roll and lease schedule accurately reflects: 
(a) all tenants and lease terms; (b) base rent, percentage rent, and CAM charges; 
(c) co-tenancy and exclusivity provisions; (d) renewal and termination options. 
All lease amendments and side letters disclosed.""",
                
                "cam_reconciliation": """
CAM RECONCILIATION
Seller shall provide audited CAM reconciliations for the past three (3) years. 
All CAM costs shall be prorated to closing date. Any CAM deficits or surpluses 
shall be adjusted at closing.""",
                
                "co_tenancy": """
CO-TENANCY AND EXCLUSIVITY
Seller has disclosed all co-tenancy provisions, go-dark provisions, and exclusivity 
clauses in major tenant leases. No defaults exist under such provisions.""",
                
                "tenant_sales": """
TENANT SALES REPORTS
For all tenants with percentage rent clauses, Seller shall provide certified sales 
reports for the past 24 months. Seller represents all reported sales are accurate.""",
                
                "dark_anchor": """
DARK ANCHOR DISCLOSURE
{disclosure_text} The Seller discloses that {anchor_name} occupying {sf} SF 
has {status}. Remaining lease term: {term}. Current rent: ${rent}/month.""",
                
                "common_area": """
COMMON AREA MAINTENANCE
Seller represents common areas are properly maintained per lease requirements. 
Common area maintenance budget for current year: ${budget}. No special assessments 
pending beyond regular CAM charges."""
            },
            
            # ===== PLAZAS/NEIGHBOURHOOD RETAIL CLAUSES =====
            "plazas": {
                "rent_roll_plaza": """
RENT ROLL VERIFICATION
Seller warrants the attached rent roll accurately reflects all tenants, lease terms, 
base rents, additional rents (TMI/CAM), and all lease amendments. No undisclosed 
oral agreements exist.""",
                
                "lease_review": """
CONDITION: LEASE REVIEW
This Agreement is conditional upon the Buyer reviewing and accepting all tenant 
leases, lease amendments, and side agreements within {days} days of acceptance. 
This condition is for the sole benefit of the Buyer.""",
                
                "percentage_rent": """
PERCENTAGE RENT DISCLOSURE
{has_or_not} The following tenants have percentage rent clauses: {list_or_none}. 
{has}Seller shall provide certified sales reports for all percentage rent tenants 
for the past 24 months.{endif}""",
                
                "cam_tmi": """
CAM/TMI RECONCILIATION
Seller shall provide detailed CAM/TMI reconciliations for the past two years and 
year-to-date. All property taxes, insurance, and maintenance costs disclosed.""",
                
                "parking": """
PARKING COMPLIANCE
Seller represents the property complies with municipal parking requirements. 
Parking ratio: {ratio} spaces per 1,000 SF. No parking variances or shared 
parking agreements undisclosed.""",
                
                "signage": """
SIGNAGE CRITERIA
Seller has provided the signage criteria manual and tenant sign approval procedures. 
All existing tenant signage complies with plaza standards and municipal bylaws."""
            },
            
            # ===== MEDICAL OFFICE/BUILDINGS CLAUSES =====
            "medical": {
                "medical_use_compliance": """
MEDICAL USE COMPLIANCE
Seller represents the property is zoned for medical use and all necessary permits 
for medical/dental/clinical use are in place and transferable.""",
                
                "health_care_regulations": """
HEALTH CARE REGULATIONS
The property complies with all applicable health care regulations, infection control 
requirements, and accessibility standards for medical facilities. No outstanding 
compliance orders exist.""",
                
                "medical_equipment": """
MEDICAL EQUIPMENT
{included_or_not} The following medical equipment is included in the purchase: {list}. 
All equipment is owned free and clear. Equipment maintenance records provided.""",
                
                "waste_disposal": """
BIOMEDICAL WASTE DISPOSAL
Seller represents all biomedical waste disposal procedures comply with Ministry of 
Health regulations. Waste disposal contracts transferable to Buyer.""",
                
                "parking_medical": """
MEDICAL PARKING REQUIREMENTS
Seller represents parking complies with medical facility requirements including 
accessible parking, patient drop-off, and ambulance access. Patient parking ratio: 
{ratio} spaces per 1,000 SF."""
            },
            
            # ===== RETIREMENT/SENIOR LIVING CLAUSES =====
            "retirement": {
                "licenses_permits": """
CONDITION: LICENSES AND PERMITS
This Agreement is conditional upon the Buyer confirming all retirement home licenses, 
care permits, and operational approvals are current and transferable, within {days} 
days of acceptance. This condition is for the sole benefit of the Buyer.""",
                
                "resident_occupancy": """
RESIDENT OCCUPANCY
Seller represents current resident occupancy of {occupancy} residents as of the 
date hereof. Waitlist of {waitlist} persons. All resident agreements provided. 
No undisclosed resident complaints or disputes.""",
                
                "care_agreements": """
CARE SERVICE AGREEMENTS
All care service agreements, meal plans, and amenity contracts disclosed. No 
above-standard care commitments undisclosed. Staffing ratios comply with regulations.""",
                
                "regulatory_compliance": """
RETIREMENT HOME COMPLIANCE
Seller represents full compliance with the Retirement Homes Act and all regulations. 
No outstanding orders from the Retirement Homes Regulatory Authority (RHRA). 
Last inspection: {date} - {result}.""",
                
                "staff_agreements": """
STAFF EMPLOYMENT
Seller discloses number of staff: {staff_count}. Union status: {union_status}. 
Key employment contracts provided. Buyer not obligated to retain existing staff.""",
                
                "resident_deposits": """
RESIDENT DEPOSITS
Seller holds resident deposits and pre-paid fees totaling ${amount}. These funds 
shall be transferred to Buyer at closing with corresponding liability obligations."""
            },
            
            # ===== OFFICE CLAUSES =====
            "office": {
                "tenant_estoppel_office": """
CONDITION: TENANT ESTOPPEL CERTIFICATES
This Agreement is conditional upon the Buyer obtaining executed Estoppel Certificates 
from tenants representing not less than {percent}% of the net rentable area, within 
{days} days of acceptance. This condition is for the sole benefit of the Buyer.""",
                
                "lease_review_office": """
LEASE DOCUMENTATION
Seller shall provide complete copies of all leases, lease amendments, work letters, 
guaranties, and side agreements. Rent roll certified as accurate as of date hereof.""",
                
                "operating_expenses": """
OPERATING EXPENSE PASS-THROUGHS
Seller shall provide detailed operating expense history for past 3 years including 
CAM reconciliations, tax escalations, and utility allocations. All operating expenses 
disclosed.""",
                
                "fit_out_allowances": """
TENANT IMPROVEMENT ALLOWANCES
Seller discloses outstanding tenant improvement allowances totaling ${amount}. 
Outstanding work to be completed: {description}.""",
                
                "parking_office": """
PARKING RATIO
Current parking ratio: {ratio} spaces per 1,000 SF. Seller represents this meets 
or exceeds municipal requirements. Parking lease commitments disclosed.""",
                
                "hvac": """
HVAC SYSTEMS
Age and condition of HVAC systems disclosed. Last major service: {date}. 
Remaining useful life: {years} years. No known deficiencies.""",
                
                "fiber_internet": """
CONNECTIVITY
Building has fiber connectivity from: {providers}. Bandwidth capacity: {capacity}. 
No restrictions on telecommunications providers."""
            },
            
            # ===== RETAIL (STANDALONE) CLAUSES =====
            "retail": {
                "environmental_retail": """
ENVIRONMENTAL ASSESSMENT
{phase1_required} This Agreement is conditional upon Buyer obtaining a Phase I 
Environmental Site Assessment within {days} days. {endif}Seller discloses prior 
uses including: {prior_uses}. No known contamination.""",
                
                "drive_through": """
DRIVE-THROUGH COMPLIANCE
{has_or_not} The property has a drive-through approved for {lanes} lanes. 
{has}All municipal approvals and stacking requirements met. No drive-through 
violations.{endif}""",
                
                "hours_of_operation": """
HOURS AND USE RESTRICTIONS
Current approved hours of operation: {hours}. No undisclosed use restrictions, 
nuisance provisions, or municipal orders affecting operations.""",
                
                "pylon_signage": """
PYLON SIGNAGE
{has_or_not} Pylon signage rights exist. {has}Pylon dimensions: {dimensions}. 
Municipal sign permit: {permit_status}.{endif}""",
                
                "accessibility": """
ACCESSIBILITY COMPLIANCE
Seller represents the property complies with the Accessibility for Ontarians with 
Disabilities Act (AODA) and all applicable accessibility standards. No outstanding 
compliance orders."""
            }
        }
    
    def write_offer(self, 
                   property_data: Dict, 
                   buyer_data: Dict, 
                   offer_terms: Dict,
                   asset_class: str) -> Dict[str, str]:
        """
        Generate complete offer package
        2-3 hours of work → 20 minutes
        """
        print(f"\n{'='*70}")
        print(f"📝 WRITING OFFER - {asset_class.upper()}")
        print(f"{'='*70}")
        print(f"  Property: {property_data.get('address')}")
        print(f"  Buyer: {buyer_data.get('name')}")
        print(f"  Price: ${offer_terms.get('purchase_price', 0):,.0f}")
        print(f"{'='*70}\n")
        
        package = {
            'purchase_agreement': self._generate_purchase_agreement(
                property_data, buyer_data, offer_terms, asset_class
            ),
            'schedule_a': self._generate_schedule_a(
                property_data, offer_terms, asset_class
            ),
            'cover_letter': self._generate_cover_letter(
                property_data, buyer_data, offer_terms, asset_class
            ),
            'deposit_instructions': self._generate_deposit_instructions(
                offer_terms
            ),
            'offer_summary': self._generate_offer_summary(
                property_data, buyer_data, offer_terms, asset_class
            )
        }
        
        print(f"✅ Offer package generated in 2 minutes")
        print(f"✅ Documents ready:")
        for doc_name in package.keys():
            print(f"   • {doc_name.replace('_', ' ').title()}")
        
        return package
    
    def _generate_purchase_agreement(self, property_data: Dict, buyer_data: Dict, 
                                    offer_terms: Dict, asset_class: str) -> str:
        """Generate OREA Agreement of Purchase and Sale - Commercial"""
        
        closing_date = offer_terms.get('closing_date', 
            (datetime.now() + timedelta(days=90)).strftime('%B %d, %Y'))
        
        return f"""
╔═══════════════════════════════════════════════════════════════════════════╗
║  AGREEMENT OF PURCHASE AND SALE                                            ║
║  OREA Form 500 - Commercial                                                ║
║  {asset_class.upper()} PROPERTY                                              ║
╚═══════════════════════════════════════════════════════════════════════════╝

THIS AGREEMENT made as of the {datetime.now().strftime('%dth day of %B, %Y')}

SELLER(S):
Name:           {property_data.get('seller_name', '[SELLER NAME]')}
Company:        {property_data.get('seller_company', '[SELLER COMPANY]')}
Address:        {property_data.get('seller_address', '[SELLER ADDRESS]')}

BUYER(S):
Name:           {buyer_data.get('name', '[BUYER NAME]')}
Company:        {buyer_data.get('company', '[BUYER COMPANY]')}
Address:        {buyer_data.get('address', '[BUYER ADDRESS]')}

PROPERTY:
Address:        {property_data.get('address')}
City:           {property_data.get('city')}
Province:       Ontario
Legal Description: {property_data.get('legal_description', '[SEE SCHEDULE A]')}

PURCHASE PRICE: ${offer_terms.get('purchase_price', 0):,.2f}

DEPOSIT:
Amount:         ${offer_terms.get('deposit_amount', offer_terms.get('purchase_price', 0) * 0.05):,.2f}
Due Date:       Within {offer_terms.get('deposit_due', 5)} days of acceptance
Held By:        Listing Brokerage in trust

IRREVOCABILITY:
This offer is irrevocable by the Buyer until {offer_terms.get('irrevocable_until', 
(datetime.now() + timedelta(days=2)).strftime('%B %d, %Y at 11:59 PM'))}

COMPLETION DATE (Closing): {closing_date}

TITLE SEARCH: To be completed by Buyer's lawyer within 21 days of acceptance.

REQUISITIONS: Any title objections must be delivered to Seller's lawyer not 
later than 5 days prior to closing.

DOCUMENTS TO BE DELIVERED BY SELLER:
□ Deed/Transfer
□ Statement of Adjustments
□ Tax bills and proof of payment
□ Utility bills and proof of payment
□ Keys and access devices
□ All leases and tenant information
□ Operating manuals and warranties
{self._get_additional_documents(asset_class)}

HIRING OF PROFESSIONALS: Buyer acknowledges being advised to hire independent 
professionals including lawyer, accountant, and inspectors.

ENTIRE AGREEMENT: This Agreement constitutes the entire agreement between the 
parties. No representations, warranties, or conditions unless set forth herein.

TIME IS OF THE ESSENCE: Time shall be of the essence in all respects.

SIGNED by the Buyer(s):

_______________________________ Date: _______________ 
{buyer_data.get('name', '[BUYER NAME]')}

SIGNED by the Seller(s):

_______________________________ Date: _______________
{property_data.get('seller_name', '[SELLER NAME]')}
"""
    
    def _generate_schedule_a(self, property_data: Dict, offer_terms: Dict, 
                            asset_class: str) -> str:
        """Generate Schedule A with asset class specific clauses"""
        
        clauses = self._select_clauses(asset_class, offer_terms)
        
        schedule = f"""
╔═══════════════════════════════════════════════════════════════════════════╗
║  SCHEDULE "A"                                                              ║
║  To be attached to and form part of Agreement of Purchase and Sale        ║
║  {asset_class.upper()} PROPERTY - {property_data.get('address')}          ║
╚═══════════════════════════════════════════════════════════════════════════╝

The following terms and conditions are attached to and form part of the 
Agreement of Purchase and Sale:

PURCHASE PRICE: ${offer_terms.get('purchase_price', 0):,.2f}

DEPOSIT: ${offer_terms.get('deposit_amount', 0):,.2f} (held in trust by Listing Brokerage)

CHATTELS INCLUDED: {offer_terms.get('chattels', 'None. See attached inventory if applicable.')}

FIXTURES EXCLUDED: {offer_terms.get('excluded_fixtures', 'None unless specified by Seller.')}

RENTAL ITEMS: {offer_terms.get('rental_items', 'None disclosed.')}

CLOSING ADJUSTMENTS:
• Property taxes to be adjusted pro-rata as of closing date
• Utilities to be read and adjusted as of closing date
• Rent and security deposits to be assigned and adjusted
• Pre-paid expenses to be credited to Buyer

CONDITIONS:
"""
        
        for i, (title, text) in enumerate(clauses, 1):
            schedule += f"\n{i}. {title}\n{text}\n"
        
        schedule += """

ADDITIONAL TERMS:
"""
        for term in offer_terms.get('additional_terms', []):
            schedule += f"• {term}\n"
        
        schedule += """

SIGNED by the parties as of the date first written above.

_______________________________ 
BUYER

_______________________________
SELLER
"""
        return schedule
    
    def _select_clauses(self, asset_class: str, offer_terms: Dict) -> List[tuple]:
        """Select appropriate clauses for asset class"""
        clauses = []
        library = self.clause_library.get(asset_class, {})
        
        # Always include these for commercial
        clauses.append(("FINANCING", library.get('financing', self._get_default_financing()).format(days='21')))
        clauses.append(("INSPECTION", library.get('inspection', self._get_default_inspection()).format(days='14')))
        
        # Asset class specific
        if asset_class == 'land':
            clauses.append(("ZONING VERIFICATION", library['zoning_verification'].format(days='30')))
            clauses.append(("ENVIRONMENTAL ASSESSMENT", library['environmental_phase_1'].format(days='30')))
            clauses.append(("GEOTECHNICAL INVESTIGATION", library['soil_testing'].format(days='30')))
            
        elif asset_class == 'apartments':
            clauses.append(("TENANT ESTOPPEL", library['tenant_estoppel'].format(percent='75', days='30')))
            clauses.append(("RENT ROLL WARRANTY", library['rent_roll_verification']))
            clauses.append(("OPERATING STATEMENTS", library['operating_statements']))
            
        elif asset_class == 'industrial':
            clauses.append(("ENVIRONMENTAL ASSESSMENT", library['environmental_phase_1'].format(days='30')))
            clauses.append(("ENVIRONMENTAL REPRESENTATION", library['environmental_rep']))
            clauses.append(("ZONING COMPLIANCE", library.get('zoning_industrial', '')))
            
        elif asset_class in ['malls', 'plazas']:
            clauses.append(("TENANT ESTOPPEL", library.get('tenant_estoppel', library.get('rent_roll_plaza', '')).format(percent='75', days='30') if 'tenant_estoppel' in library else ''))
            clauses.append(("RENT ROLL", library.get('rent_roll_mall', library.get('rent_roll_plaza', ''))))
            clauses.append(("CAM RECONCILIATION", library.get('cam_reconciliation', library.get('cam_tmi', ''))))
            
        elif asset_class == 'medical':
            clauses.append(("MEDICAL USE COMPLIANCE", library['medical_use_compliance']))
            clauses.append(("HEALTH CARE REGULATIONS", library['health_care_regulations']))
            
        elif asset_class == 'retirement':
            clauses.append(("LICENSES AND PERMITS", library['licenses_permits'].format(days='21')))
            clauses.append(("RESIDENT OCCUPANCY", library['resident_occupancy'].format(occupancy='[TO BE FILLED]', waitlist='[TO BE FILLED]')))
            clauses.append(("REGULATORY COMPLIANCE", library['regulatory_compliance'].format(date='[DATE]', result='[RESULT]')))
            
        elif asset_class == 'office':
            clauses.append(("TENANT ESTOPPEL", library['tenant_estoppel_office'].format(percent='75', days='21')))
            clauses.append(("OPERATING EXPENSES", library['operating_expenses']))
            
        elif asset_class == 'retail':
            clauses.append(("ACCESSIBILITY COMPLIANCE", library['accessibility']))
            
        return [(t, c) for t, c in clauses if c]
    
    def _get_default_financing(self) -> str:
        return """
This Agreement is conditional upon the Buyer arranging satisfactory financing 
for the purchase of the property within {days} days of acceptance of this offer. 
This condition is for the sole benefit of the Buyer and may be waived at the 
Buyer's sole option by notice in writing to the Seller within the stipulated time."""
    
    def _get_default_inspection(self) -> str:
        return """
This Agreement is conditional upon the inspection of the property by a qualified 
inspector at the Buyer's own expense within {days} days of acceptance. 
This condition is for the sole benefit of the Buyer."""
    
    def _get_additional_documents(self, asset_class: str) -> str:
        docs = {
            'land': "□ Geotechnical report\n□ Environmental Phase I",
            'apartments': "□ Rent roll\n□ Lease agreements\n□ Operating statements",
            'industrial': "□ Environmental reports\n□ Fire safety certificates",
            'malls': "□ Tenant estoppels\n□ CAM reconciliations",
            'retirement': "□ RHRA licenses\n□ Resident agreements"
        }
        return docs.get(asset_class, "")
    
    def _generate_cover_letter(self, property_data: Dict, buyer_data: Dict, 
                              offer_terms: Dict, asset_class: str) -> str:
        """Generate cover letter to listing agent"""
        return f"""
[YOUR LETTERHEAD]

Date: {datetime.now().strftime('%B %d, %Y')}

LISTING AGENT:
{property_data.get('listing_agent', '[LISTING AGENT NAME]')}
{property_data.get('listing_brokerage', '[LISTING BROKERAGE]')}

RE: OFFER TO PURCHASE - {property_data.get('address')}, {property_data.get('city')}

Dear {property_data.get('listing_agent', 'Listing Agent')},

Please find enclosed our client's offer to purchase the above-noted {asset_class} 
property for ${offer_terms.get('purchase_price', 0):,.0f}.

{buyer_data.get('company', 'Our client')} is a {buyer_data.get('description', 'sophisticated investor')} 
with significant experience in {asset_class} properties. They have been actively 
seeking opportunities in the {property_data.get('city')} market and are impressed 
with the potential of this property.

KEY OFFER TERMS:
• Purchase Price: ${offer_terms.get('purchase_price', 0):,.0f}
• Deposit: ${offer_terms.get('deposit_amount', 0):,.0f} (upon acceptance)
• Closing: {offer_terms.get('closing_date', '[DATE]')}
• Conditions: {', '.join(offer_terms.get('conditions', ['Financing', 'Inspection']))}

{buyer_data.get('company', 'Our client')} is well-capitalized and prepared to move 
quickly. We have included standard conditions to allow for due diligence, but our 
client is motivated to close this transaction efficiently.

We would welcome the opportunity to discuss this offer with you and the Seller. 
Please do not hesitate to contact me at [YOUR PHONE] or [YOUR EMAIL].

Thank you for your consideration.

Sincerely,

Jamie [LAST NAME]
Keller Williams Commercial
[YOUR PHONE]
[YOUR EMAIL]

Encl: Agreement of Purchase and Sale
      Schedule A
"""
    
    def _generate_deposit_instructions(self, offer_terms: Dict) -> str:
        """Generate deposit instructions"""
        return f"""
DEPOSIT INSTRUCTIONS

OFFER: ${offer_terms.get('purchase_price', 0):,.2f}
DEPOSIT AMOUNT: ${offer_terms.get('deposit_amount', 0):,.2f}

DEPOSIT TO BE DELIVERED TO:
Keller Williams Commercial
Attention: Jamie [LAST NAME]
[OFFICE ADDRESS]

ACCEPTABLE FORMS OF DEPOSIT:
□ Certified cheque payable to "Keller Williams Commercial in Trust"
□ Bank draft payable to "Keller Williams Commercial in Trust"
□ Wire transfer (contact for wire instructions)
□ Electronic transfer (confirm acceptable)

TIMING: Deposit due within {offer_terms.get('deposit_due', 5)} days of acceptance of offer

RECEIPT:
Upon receipt of deposit, a receipt will be issued to the Buyer acknowledging 
the holding of funds in trust pending closing or return as per the Agreement.

QUESTIONS: Contact Jamie [LAST NAME] at [YOUR PHONE]
"""
    
    def _generate_offer_summary(self, property_data: Dict, buyer_data: Dict,
                                offer_terms: Dict, asset_class: str) -> str:
        """Generate quick summary for your records"""
        return f"""
╔═══════════════════════════════════════════════════════════════════════════╗
║  OFFER SUMMARY FOR YOUR RECORDS                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝

PROPERTY:
{property_data.get('address')}, {property_data.get('city')}
Type: {asset_class.upper()}

BUYER:
{buyer_data.get('name')}
{buyer_data.get('company')}
{buyer_data.get('phone')}

OFFER TERMS:
Price:              ${offer_terms.get('purchase_price', 0):,.0f}
Deposit:            ${offer_terms.get('deposit_amount', 0):,.0f} ({offer_terms.get('deposit_due', 5)} days)
Closing:            {offer_terms.get('closing_date', '[DATE]')}
Irrevocable Until:  {offer_terms.get('irrevocable_until', '[DATE]')}

CONDITIONS:
{chr(10).join(['• ' + c for c in offer_terms.get('conditions', ['Financing', 'Inspection'])])}

NEXT STEPS:
□ Review with buyer before submission
□ Obtain buyer signatures
□ Submit to listing agent
□ Follow up within 24 hours
□ Prepare for potential counter offer

OFFER SUBMITTED: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}
"""


# Singleton
writer = None

def get_offer_writer() -> OfferWriterPro:
    """Get or create singleton"""
    global writer
    if writer is None:
        writer = OfferWriterPro()
    return writer


if __name__ == "__main__":
    # Demo
    print("\n" + "="*70)
    print("OFFER WRITER PRO - DEMO")
    print("="*70)
    
    writer = get_offer_writer()
    
    # Test with industrial property
    property_data = {
        'address': '1500 Michael Drive',
        'city': 'Welland',
        'seller_name': 'ABC Holdings Ltd.'
    }
    
    buyer_data = {
        'name': 'John Smith',
        'company': 'KingSett Capital',
        'description': 'leading private equity real estate firm'
    }
    
    offer_terms = {
        'purchase_price': 4800000,  # $4.8M (below asking)
        'deposit_amount': 240000,   # 5%
        'deposit_due': 5,
        'closing_date': 'June 30, 2026',
        'conditions': ['Financing', 'Environmental Assessment', 'Inspection'],
        'irrevocable_until': 'March 27, 2026 at 11:59 PM'
    }
    
    package = writer.write_offer(property_data, buyer_data, offer_terms, 'industrial')
    
    print("\n" + "="*70)
    print("SAMPLE: Cover Letter (First 800 chars)")
    print("="*70)
    print(package['cover_letter'][:800])
