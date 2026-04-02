#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════════════════╗
║           ENHANCED QUICK LINKS GENERATOR - WITH BUILDERS                     ║
║      Added: LOOPNET property search | LIVABL builder search                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

NEW FEATURES:
- BUILDERS category (filtered from companies with Develop/Construction/Builder)
- LOOPNET property search links for all properties
- LIVABL builder search links for developers
- ENHANCED property-specific Quick Links

TOTAL CONTACT TYPES:
✓ Companies (Buyers/Sellers)
✓ Builders (Development/Construction companies)
✓ Agents/Brokers (Realtors)
✓ Lenders
✓ Brokerage Firms
"""

import csv
import json
from pathlib import Path
from urllib.parse import quote_plus
from datetime import datetime
import re

class EnhancedQuickLinksGenerator:
    """Generate Quick Links with LOOPNET, LIVABL, and Builder support"""
    
    def __init__(self):
        self.base_google = "https://www.google.com/search"
        self.base_loopnet = "https://www.loopnet.com/search/commercial-real-estate"
        self.base_livabl = "https://livabl.com"
    
    def is_builder(self, company_name):
        """Check if company name indicates a builder/developer"""
        if not company_name:
            return False
        
        builder_keywords = [
            'develop', 'development', 'developer',
            'construction', 'constructor', 'builder', 'building',
            'homes', 'properties', 'realty', 'condo', 'residential',
            'custom homes', 'home builder', 'land development'
        ]
        
        name_lower = company_name.lower()
        return any(keyword in name_lower for keyword in builder_keywords)
    
    def generate_quick_links(
        self,
        name,
        phone=None,
        email=None,
        website=None,
        address=None,
        contact_type="Company"
    ):
        """Generate Quick Links for any entity with ENHANCED features"""
        links = {}
        
        # Build search query
        search_query = name
        if phone:
            search_query = f"{phone} {name}"
        
        # ═══════════════════════════════════════════════════════════
        # GOOGLE SEARCHES
        # ═══════════════════════════════════════════════════════════
        links['google'] = f"{self.base_google}?q={quote_plus(search_query)}"
        links['contact_page'] = f"{self.base_google}?q={quote_plus(name + ' contact')}"
        links['linkedin'] = f"{self.base_google}?q={quote_plus(name + ' linkedin')}"
        links['linkedin_president'] = f"{self.base_google}?q={quote_plus(name + ' President OR CEO linkedin')}"
        links['facebook'] = f"{self.base_google}?q={quote_plus(name + ' facebook')}"
        links['instagram'] = f"{self.base_google}?q={quote_plus(name + ' instagram')}"
        links['twitter'] = f"{self.base_google}?q={quote_plus(name + ' twitter OR x.com')}"
        
        # ═══════════════════════════════════════════════════════════
        # PROPERTY/COMMERCIAL REAL ESTATE SEARCHES
        # ═══════════════════════════════════════════════════════════
        
        # LOOPNET - Commercial property search
        links['loopnet'] = f"https://www.loopnet.com/search?q={quote_plus(name)}"
        links['loopnet_properties'] = f"{self.base_google}?q={quote_plus(name + ' site:loopnet.com')}"
        
        # Commercial real estate general search
        links['cre_google'] = f"{self.base_google}?q={quote_plus(name + ' commercial real estate')}"
        links['cre_listings'] = f"{self.base_google}?q={quote_plus(name + ' properties for sale lease')}"
        
        # ═══════════════════════════════════════════════════════════
        # BUILDER/DEVELOPER SPECIFIC SEARCHES
        # ═══════════════════════════════════════════════════════════
        
        if self.is_builder(name):
            # LIVABL - New construction platform
            links['livabl'] = f"https://livabl.com/builders/{quote_plus(name.replace(' ', '-').lower())}"
            links['livabl_search'] = f"https://livabl.com/search?q={quote_plus(name)}"
            
            # Builder-specific searches
            links['new_homes'] = f"{self.base_google}?q={quote_plus(name + ' new homes new construction')}"
            links['builder_reviews'] = f"{self.base_google}?q={quote_plus(name + ' builder reviews')}"
            links['tarion'] = f"{self.base_google}?q={quote_plus(name + ' tarion warranty')}"
            links['hCRA'] = f"{self.base_google}?q={quote_plus(name + ' HCRA Ontario builder')}"
            links['past_projects'] = f"{self.base_google}?q={quote_plus(name + ' past projects developments')}"
        
        # ═══════════════════════════════════════════════════════════
        # WEBSITE & EMAIL
        # ═══════════════════════════════════════════════════════════
        
        if website:
            links['website'] = website if website.startswith('http') else f"https://{website}"
        
        if email:
            links['email_search'] = f"{self.base_google}?q={quote_plus(email)}"
            links['email_linkedin'] = f"{self.base_google}?q={quote_plus(email + ' linkedin')}"
        
        return links
    
    def generate_property_quick_links(self, property_address, city=None, property_type=None):
        """Generate Quick Links specifically for a property"""
        links = {}
        
        query = property_address
        if city:
            query = f"{property_address}, {city}"
        
        # LOOPNET - Primary commercial property search
        links['loopnet'] = f"https://www.loopnet.com/search?q={quote_plus(query)}"
        links['loopnet_sale'] = f"https://www.loopnet.com/search/commercial-real-estate/{quote_plus(city.lower()) if city else 'canada'}/retail/for-sale"
        links['loopnet_lease'] = f"https://www.loopnet.com/search/commercial-real-estate/{quote_plus(city.lower()) if city else 'canada'}/retail/for-lease"
        
        # Google Maps
        links['google_maps'] = f"https://www.google.com/maps/search/{quote_plus(query)}"
        
        # Google property search
        links['google_property'] = f"{self.base_google}?q={quote_plus(query + ' property real estate')}"
        
        # Realtor.ca (for Canada)
        links['realtor_ca'] = f"https://www.realtor.ca/map#ZoomLevel=15&Centre={quote_plus(query)}"
        
        # Zolo (Canadian listings)
        links['zolo'] = f"https://www.zolo.ca/{quote_plus(city.lower()) if city else 'canada'}-real-estate"
        
        # Property-specific searches
        links['property_records'] = f"{self.base_google}?q={quote_plus(query + ' property records ownership')}"
        links['mpac'] = f"{self.base_google}?q={quote_plus(query + ' MPAC assessment')}"
        
        # News/articles about the property
        links['property_news'] = f"{self.base_google}?q={quote_plus(query + ' news article')}"
        
        return links
    
    def format_markdown(self, name, links, phone=None, email=None, address=None, 
                        title=None, website=None, contact_type="Company"):
        """Format Quick Links as Markdown with enhanced sections"""
        lines = []
        
        lines.append("### 🔍 QUICK LINKS")
        lines.append("")
        lines.append(f"**{name}**")
        
        if title:
            lines.append(f"*{title}*")
        
        lines.append("")
        
        # Contact info
        if address:
            lines.append(f"📍 {address}")
        if phone:
            lines.append(f"📞 {phone}")
        if email:
            lines.append(f"📧 [{email}](mailto:{email})")
        if website and 'website' in links:
            lines.append(f"🌐 [Website]({links['website']})")
        
        lines.append("")
        
        # Standard Search Links
        lines.append("**General Search:**")
        lines.append(f"| Google | [Search]({links.get('google', '#')}) |")
        lines.append(f"| Contact | [Find]({links.get('contact_page', '#')}) |")
        lines.append(f"| LinkedIn | [Profile]({links.get('linkedin', '#')}) |")
        lines.append(f"| President/CEO | [Search]({links.get('linkedin_president', '#')}) |")
        lines.append(f"| Facebook | [Page]({links.get('facebook', '#')}) |")
        lines.append(f"| Instagram | [Profile]({links.get('instagram', '#')}) |")
        lines.append(f"| Twitter/X | [Profile]({links.get('twitter', '#')}) |")
        
        # Commercial Real Estate Section
        lines.append("")
        lines.append("**🏢 Commercial Real Estate:**")
        lines.append(f"| LOOPNET | [Search]({links.get('loopnet', '#')}) |")
        lines.append(f"| LOOPNET Properties | [Find]({links.get('loopnet_properties', '#')}) |")
        lines.append(f"| CRE Search | [Google]({links.get('cre_google', '#')}) |")
        lines.append(f"| Listings | [Search]({links.get('cre_listings', '#')}) |")
        
        # Builder Section (if applicable)
        if self.is_builder(name):
            lines.append("")
            lines.append("**🏗️ BUILDER/DEVELOPER:**")
            lines.append(f"| LIVABL | [Profile]({links.get('livabl', '#')}) |")
            lines.append(f"| LIVABL Search | [Search]({links.get('livabl_search', '#')}) |")
            lines.append(f"| New Homes | [Search]({links.get('new_homes', '#')}) |")
            lines.append(f"| Reviews | [Find]({links.get('builder_reviews', '#')}) |")
            lines.append(f"| Tarion | [Search]({links.get('tarion', '#')}) |")
            lines.append(f"| HCRA | [Search]({links.get('hCRA', '#')}) |")
            lines.append(f"| Past Projects | [Search]({links.get('past_projects', '#')}) |")
        
        # Email search
        if email and 'email_linkedin' in links:
            lines.append("")
            lines.append(f"**Contact LinkedIn:** [Search by Email]({links['email_linkedin']})")
        
        return "\n".join(lines)
    
    def format_property_markdown(self, address, city, links, property_type=None):
        """Format Quick Links specifically for a property"""
        lines = []
        
        lines.append("### 🏢 PROPERTY QUICK LINKS")
        lines.append("")
        lines.append(f"**{address}**")
        if city:
            lines.append(f"*{city}*")
        if property_type:
            lines.append(f"Type: {property_type}")
        
        lines.append("")
        
        # LOOPNET Section
        lines.append("**📊 LOOPNET (Commercial):**")
        lines.append(f"| LOOPNET Search | [View]({links.get('loopnet', '#')}) |")
        lines.append(f"| For Sale | [Search]({links.get('loopnet_sale', '#')}) |")
        lines.append(f"| For Lease | [Search]({links.get('loopnet_lease', '#')}) |")
        
        # Other Property Searches
        lines.append("")
        lines.append("**🏠 Property Research:**")
        lines.append(f"| Google Maps | [View]({links.get('google_maps', '#')}) |")
        lines.append(f"| Google Search | [Search]({links.get('google_property', '#')}) |")
        lines.append(f"| Realtor.ca | [Search]({links.get('realtor_ca', '#')}) |")
        lines.append(f"| Zolo | [Search]({links.get('zolo', '#')}) |")
        lines.append(f"| Property Records | [Search]({links.get('property_records', '#')}) |")
        lines.append(f"| MPAC Assessment | [Search]({links.get('mpac', '#')}) |")
        lines.append(f"| News/Articles | [Search]({links.get('property_news', '#')}) |")
        
        return "\n".join(lines)


def process_companies_with_builders():
    """Process companies and separate builders"""
    print("\n" + "="*70)
    print("🏢 PROCESSING COMPANIES (with BUILDER detection)")
    print("="*70)
    
    generator = EnhancedQuickLinksGenerator()
    
    input_file = "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/dbeaver_final_exports/companys_final.csv"
    companies_output = "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/QUICK_LINKS_COMPANIES_V2.csv"
    builders_output = "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/QUICK_LINKS_BUILDERS.csv"
    
    companies_list = []
    builders_list = []
    
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        headers = next(reader)
        
        # Add Quick Links columns
        new_headers = headers + [
            'ql_google', 'ql_contact_page', 'ql_linkedin', 'ql_linkedin_president',
            'ql_facebook', 'ql_instagram', 'ql_twitter', 'ql_website',
            'ql_loopnet', 'ql_loopnet_properties', 'ql_cre_google', 'ql_cre_listings',
            'ql_livabl', 'ql_livabl_search', 'ql_new_homes', 'ql_builder_reviews',
            'ql_tarion', 'ql_hCRA', 'ql_past_projects',
            'is_builder', 'ql_markdown', 'ql_html'
        ]
        
        for i, row in enumerate(reader, 1):
            if len(row) < 2:
                continue
            
            company_name = row[1] if len(row) > 1 else ''
            domain = row[2] if len(row) > 2 else ''
            address = row[3] if len(row) > 3 else ''
            phone = row[6] if len(row) > 6 else ''
            
            if not company_name:
                continue
            
            # Check if builder
            is_builder = generator.is_builder(company_name)
            
            # Generate Quick Links
            links = generator.generate_quick_links(
                name=company_name,
                phone=phone,
                website=domain,
                address=address
            )
            
            # Generate Markdown
            markdown = generator.format_markdown(
                name=company_name,
                links=links,
                phone=phone,
                address=address,
                website=domain,
                contact_type="Builder" if is_builder else "Company"
            )
            
            # Build row with all links
            new_row = row + [
                links.get('google', ''),
                links.get('contact_page', ''),
                links.get('linkedin', ''),
                links.get('linkedin_president', ''),
                links.get('facebook', ''),
                links.get('instagram', ''),
                links.get('twitter', ''),
                links.get('website', ''),
                links.get('loopnet', ''),
                links.get('loopnet_properties', ''),
                links.get('cre_google', ''),
                links.get('cre_listings', ''),
                links.get('livabl', ''),
                links.get('livabl_search', ''),
                links.get('new_homes', ''),
                links.get('builder_reviews', ''),
                links.get('tarion', ''),
                links.get('hCRA', ''),
                links.get('past_projects', ''),
                '1' if is_builder else '0',
                markdown,
                ''  # HTML placeholder
            ]
            
            if is_builder:
                builders_list.append(new_row)
            else:
                companies_list.append(new_row)
            
            if i % 1000 == 0:
                print(f"  Processed {i} companies... (Builders: {len(builders_list)})")
    
    # Save companies
    with open(companies_output, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(new_headers)
        writer.writerows(companies_list)
    
    # Save builders
    with open(builders_output, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(new_headers)
        writer.writerows(builders_list)
    
    print(f"✅ COMPANIES: {len(companies_list)} processed")
    print(f"✅ BUILDERS: {len(builders_list)} identified and separated")
    print(f"   Companies: {companies_output}")
    print(f"   Builders: {builders_output}")
    
    return companies_list, builders_list


def process_realtors_v2():
    """Process all realtors with enhanced Quick Links"""
    print("\n" + "="*70)
    print("👔 PROCESSING REALTORS (Enhanced v2)")
    print("="*70)
    
    generator = EnhancedQuickLinksGenerator()
    
    # Process both brokers and salespersons
    all_realtors = []
    
    files = [
        ('broker', "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/dbeaver_final_exports/realtor_brokers_final.csv"),
        ('salesperson', "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/dbeaver_final_exports/realtor_salespersons_final.csv")
    ]
    
    for rtype, filepath in files:
        with open(filepath, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            next(reader)  # Skip header
            
            for row in reader:
                if len(row) < 6:
                    continue
                
                full_name = row[3] if len(row) > 3 else ''
                email = row[5] if len(row) > 5 else ''
                
                if not full_name:
                    continue
                
                links = generator.generate_quick_links(
                    name=full_name,
                    email=email
                )
                
                markdown = generator.format_markdown(
                    name=full_name,
                    links=links,
                    email=email,
                    title=f"Real Estate {rtype.title()}",
                    contact_type="Realtor"
                )
                
                new_row = [rtype] + list(row) + [
                    links.get('google', ''),
                    links.get('contact_page', ''),
                    links.get('linkedin', ''),
                    links.get('linkedin_president', ''),
                    links.get('facebook', ''),
                    links.get('instagram', ''),
                    links.get('twitter', ''),
                    links.get('website', ''),
                    links.get('loopnet', ''),
                    links.get('loopnet_properties', ''),
                    links.get('cre_google', ''),
                    links.get('cre_listings', ''),
                    '', '', '', '', '', '', '',  # Builder fields empty
                    '0',  # Not a builder
                    markdown,
                    ''
                ]
                
                all_realtors.append(new_row)
        
        print(f"  Processed {len([r for r in all_realtors if r[0] == rtype])} {rtype}s")
    
    # Save
    realtors_output = "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/QUICK_LINKS_ALL_REALTORS_V2.csv"
    headers = ['type', 'id', 'first_name', 'last_name', 'full_name', 'job_title', 'email',
               'verified', 'acceptall', 'unknown', 'alternative_emails', 'linkedin',
               'broker_id', 'updated', 'added',
               'ql_google', 'ql_contact_page', 'ql_linkedin', 'ql_linkedin_president',
               'ql_facebook', 'ql_instagram', 'ql_twitter', 'ql_website',
               'ql_loopnet', 'ql_loopnet_properties', 'ql_cre_google', 'ql_cre_listings',
               'ql_livabl', 'ql_livabl_search', 'ql_new_homes', 'ql_builder_reviews',
               'ql_tarion', 'ql_hCRA', 'ql_past_projects',
               'is_builder', 'ql_markdown', 'ql_html']
    
    with open(realtors_output, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(all_realtors)
    
    print(f"✅ TOTAL REALTORS: {len(all_realtors)} processed")
    print(f"   Output: {realtors_output}")
    
    return all_realtors


def process_lenders_v2():
    """Process lenders with enhanced Quick Links"""
    print("\n" + "="*70)
    print("🏦 PROCESSING LENDERS (Enhanced v2)")
    print("="*70)
    
    generator = EnhancedQuickLinksGenerator()
    
    lenders_file = "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/dbeaver_final_exports/lenders_final.csv"
    lenders_output = "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/QUICK_LINKS_LENDERS_V2.csv"
    
    lenders_list = []
    
    with open(lenders_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        next(reader)
        
        for row in reader:
            if len(row) < 2:
                continue
            
            lender_name = row[1] if len(row) > 1 else ''
            domain = row[2] if len(row) > 2 else ''
            
            if not lender_name:
                continue
            
            links = generator.generate_quick_links(
                name=lender_name,
                website=domain
            )
            
            markdown = generator.format_markdown(
                name=lender_name,
                links=links,
                website=domain,
                title="Lender",
                contact_type="Lender"
            )
            
            new_row = list(row) + [
                links.get('google', ''),
                links.get('contact_page', ''),
                links.get('linkedin', ''),
                links.get('linkedin_president', ''),
                links.get('facebook', ''),
                links.get('instagram', ''),
                links.get('twitter', ''),
                links.get('website', ''),
                links.get('loopnet', ''),
                links.get('loopnet_properties', ''),
                links.get('cre_google', ''),
                links.get('cre_listings', ''),
                '', '', '', '', '', '', '',
                '0',
                markdown,
                ''
            ]
            
            lenders_list.append(new_row)
    
    # Save
    headers = ['id', 'name', 'domain', 'linkedin', 'updated', 'added',
               'ql_google', 'ql_contact_page', 'ql_linkedin', 'ql_linkedin_president',
               'ql_facebook', 'ql_instagram', 'ql_twitter', 'ql_website',
               'ql_loopnet', 'ql_loopnet_properties', 'ql_cre_google', 'ql_cre_listings',
               'ql_livabl', 'ql_livabl_search', 'ql_new_homes', 'ql_builder_reviews',
               'ql_tarion', 'ql_hCRA', 'ql_past_projects',
               'is_builder', 'ql_markdown', 'ql_html']
    
    with open(lenders_output, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(lenders_list)
    
    print(f"✅ LENDERS: {len(lenders_list)} processed")
    print(f"   Output: {lenders_output}")
    
    return lenders_list


def generate_summary_report_v2(companies, builders, realtors, lenders):
    """Generate enhanced summary"""
    print("\n" + "="*70)
    print("📊 ENHANCED QUICK LINKS SUMMARY REPORT")
    print("="*70)
    
    summary = {
        'Companies (Non-Builder)': len(companies),
        'Builders (Development/Construction)': len(builders),
        'Realtors (Brokers + Salespersons)': len(realtors),
        'Lenders': len(lenders),
    }
    
    total = sum(summary.values())
    
    for category, count in summary.items():
        print(f"  {category:40}: {count:>6,}")
    
    print(f"\n  {'TOTAL CONTACTS WITH QUICK LINKS':40}: {total:>6,}")
    
    print("\n  NEW FEATURES:")
    print("  ✓ LOOPNET property search links")
    print("  ✓ LIVABL builder profile search")
    print("  ✓ Builder/Development company detection")
    print("  ✓ HCRA & Tarion builder lookups")
    print("  ✓ Commercial real estate search links")
    
    # Save summary
    summary_file = "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/QUICK_LINKS_SUMMARY_V2.txt"
    with open(summary_file, 'w') as f:
        f.write("="*70 + "\n")
        f.write("BIGDATACLAW ENHANCED QUICK LINKS GENERATION SUMMARY\n")
        f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write("="*70 + "\n\n")
        
        for category, count in summary.items():
            f.write(f"{category:40}: {count:>6,}\n")
        
        f.write(f"\n{'TOTAL':40}: {total:>6,}\n")
        f.write("\n" + "="*70 + "\n")
        f.write("ENHANCED OUTPUT FILES:\n")
        f.write("="*70 + "\n")
        f.write("1. QUICK_LINKS_COMPANIES_V2.csv (Non-builders)\n")
        f.write("2. QUICK_LINKS_BUILDERS.csv (Development/Construction)\n")
        f.write("3. QUICK_LINKS_ALL_REALTORS_V2.csv\n")
        f.write("4. QUICK_LINKS_LENDERS_V2.csv\n")
        f.write("\n" + "="*70 + "\n")
        f.write("NEW QUICK LINK TYPES:\n")
        f.write("="*70 + "\n")
        f.write("• LOOPNET - Commercial property search\n")
        f.write("• LOOPNET Properties - Property listings\n")
        f.write("• CRE Google - Commercial real estate search\n")
        f.write("• LIVABL - New construction builder profiles\n")
        f.write("• LIVABL Search - Builder search\n")
        f.write("• Tarion - Builder warranty lookup\n")
        f.write("• HCRA - Ontario builder registry\n")
        f.write("• Past Projects - Development history\n")
    
    print(f"\n📁 Summary saved to: {summary_file}")


if __name__ == "__main__":
    print("="*70)
    print("🚀 ENHANCED QUICK LINKS GENERATOR v2")
    print("   + LOOPNET | + LIVABL | + BUILDERS")
    print("="*70)
    print("\nGenerating enhanced Quick Links for all contacts...")
    print("NEW: Builder detection, LOOPNET property search, LIVABL profiles")
    
    # Process all contact types
    companies, builders = process_companies_with_builders()
    realtors = process_realtors_v2()
    lenders = process_lenders_v2()
    
    # Generate summary
    generate_summary_report_v2(companies, builders, realtors, lenders)
    
    print("\n" + "="*70)
    print("✅ ALL ENHANCED QUICK LINKS GENERATED!")
    print("="*70)
    print("\nEach contact now has:")
    print("  • GOOGLE search link")
    print("  • CONTACT PAGE search")
    print("  • LINKEDIN profile search")
    print("  • LINKEDIN PRESIDENT/CEO search")
    print("  • FACEBOOK, INSTAGRAM, TWITTER/X search")
    print("  • 🆕 LOOPNET commercial property search")
    print("  • 🆕 LOOPNET properties listing search")
    print("  • 🆕 CRE (Commercial Real Estate) search")
    print("  • 🆕 LIVABL builder profile (for builders)")
    print("  • 🆕 Tarion warranty lookup (for builders)")
    print("  • 🆕 HCRA Ontario builder registry (for builders)")
