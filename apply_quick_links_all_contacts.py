#!/usr/bin/env python3
"""
APPLY QUICK LINKS TO ALL CONTACTS
Companies, Buyers, Sellers, Agents, Brokers, Lenders
"""

import csv
import json
from pathlib import Path
from urllib.parse import quote_plus
from datetime import datetime

class UniversalQuickLinksGenerator:
    """Generate Quick Links for any type of contact/company"""
    
    def __init__(self):
        self.base_google = "https://www.google.com/search"
    
    def generate_quick_links(self, name, phone=None, email=None, website=None, contact_type="Company"):
        """Generate Quick Links for any entity"""
        links = {}
        
        # Base search query
        search_query = name
        if phone:
            search_query = f"{phone} {name}"
        
        # GOOGLE - Main search
        links['google'] = f"{self.base_google}?q={quote_plus(search_query)}"
        
        # CONTACT PAGE
        links['contact_page'] = f"{self.base_google}?q={quote_plus(name + ' contact')}"
        
        # LINKEDIN - Company/Profile search
        links['linkedin'] = f"{self.base_google}?q={quote_plus(name + ' linkedin')}"
        
        # LINKEDIN PRESIDENT/CEO
        links['linkedin_president'] = f"{self.base_google}?q={quote_plus(name + ' President OR CEO linkedin')}"
        
        # FACEBOOK
        links['facebook'] = f"{self.base_google}?q={quote_plus(name + ' facebook')}"
        
        # INSTAGRAM
        links['instagram'] = f"{self.base_google}?q={quote_plus(name + ' instagram')}"
        
        # TWITTER/X
        links['twitter'] = f"{self.base_google}?q={quote_plus(name + ' twitter OR x.com')}"
        
        # WEBSITE (if provided)
        if website:
            links['website'] = website if website.startswith('http') else f"https://{website}"
        
        # EMAIL SEARCH (if provided)
        if email:
            links['email_search'] = f"{self.base_google}?q={quote_plus(email)}"
            links['email_linkedin'] = f"{self.base_google}?q={quote_plus(email + ' linkedin')}"
        
        return links
    
    def format_quick_links_html(self, name, links, phone=None, email=None, address=None, website=None):
        """Format Quick Links in HTML (bigstats.io style)"""
        html_parts = []
        
        html_parts.append(f"<div class='quick-links-section'>")
        html_parts.append(f"<h3>🔍 QUICK LINKS</h3>")
        
        # Company/Name header
        html_parts.append(f"<div class='entity-name'><strong>{name}</strong></div>")
        
        if address:
            html_parts.append(f"<div class='address'>{address}</div>")
        
        if phone:
            html_parts.append(f"<div class='phone'>📞 {phone}</div>")
        
        html_parts.append("<div class='links-grid'>")
        
        # GOOGLE - CONTACT PAGE
        html_parts.append(f"<a href='{links.get('google', '#')}' target='_blank' class='ql-link google'>GOOGLE</a>")
        html_parts.append(f"<a href='{links.get('contact_page', '#')}' target='_blank' class='ql-link'>CONTACT PAGE</a>")
        
        # LINKEDIN - PRESIDENT
        html_parts.append(f"<a href='{links.get('linkedin', '#')}' target='_blank' class='ql-link linkedin'>LINKEDIN</a>")
        html_parts.append(f"<a href='{links.get('linkedin_president', '#')}' target='_blank' class='ql-link'>PRESIDENT/CEO</a>")
        
        # SOCIAL MEDIA
        html_parts.append(f"<a href='{links.get('facebook', '#')}' target='_blank' class='ql-link facebook'>FACEBOOK</a>")
        html_parts.append(f"<a href='{links.get('instagram', '#')}' target='_blank' class='ql-link instagram'>INSTAGRAM</a>")
        html_parts.append(f"<a href='{links.get('twitter', '#')}' target='_blank' class='ql-link twitter'>TWITTER/X</a>")
        
        if 'website' in links:
            html_parts.append(f"<a href='{links['website']}' target='_blank' class='ql-link website'>🌐 WEBSITE</a>")
        
        html_parts.append("</div>")  # Close links-grid
        
        # Contact person section
        if email:
            html_parts.append("<div class='contact-person'>")
            html_parts.append(f"<strong>Contact:</strong><br>")
            html_parts.append(f"<a href='mailto:{email}' class='email-link'>📧 {email}</a><br>")
            html_parts.append(f"<a href='{links.get('email_linkedin', '#')}' target='_blank' class='linkedin-search'>LINKEDIN 🔍</a>")
            html_parts.append("</div>")
        
        html_parts.append("</div>")  # Close quick-links-section
        
        return "\n".join(html_parts)
    
    def format_quick_links_markdown(self, name, links, phone=None, email=None, address=None, title=None, website=None):
        """Format Quick Links in Markdown for Obsidian"""
        lines = []
        
        lines.append("### 🔍 QUICK LINKS")
        lines.append("")
        lines.append(f"**{name}**")
        
        if title:
            lines.append(f"*{title}*")
        
        if address:
            lines.append(f"📍 {address}")
        
        if phone:
            lines.append(f"📞 {phone}")
        
        lines.append("")
        lines.append("**Search Links:**")
        lines.append(f"- [🌐 GOOGLE]({links.get('google', '#')})")
        lines.append(f"- [📋 CONTACT PAGE]({links.get('contact_page', '#')})")
        lines.append(f"- [💼 LINKEDIN]({links.get('linkedin', '#')})")
        lines.append(f"- [👔 LINKEDIN PRESIDENT/CEO]({links.get('linkedin_president', '#')})")
        lines.append(f"- [📘 FACEBOOK]({links.get('facebook', '#')})")
        lines.append(f"- [📸 INSTAGRAM]({links.get('instagram', '#')})")
        lines.append(f"- [🐦 TWITTER/X]({links.get('twitter', '#')})")
        
        if 'website' in links and links['website']:
            lines.append(f"- [🌐 WEBSITE]({links['website']})")
        
        if email:
            lines.append("")
            lines.append(f"**Direct Contact:**")
            lines.append(f"- Email: [{email}](mailto:{email})")
            lines.append(f"- [🔍 LINKEDIN SEARCH BY EMAIL]({links.get('email_linkedin', '#')})")
        
        return "\n".join(lines)


def process_companies():
    """Process all companies from DBeaver export"""
    print("\n" + "="*70)
    print("🏢 PROCESSING COMPANIES (Buyers & Sellers)")
    print("="*70)
    
    generator = UniversalQuickLinksGenerator()
    
    input_file = "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/dbeaver_final_exports/companys_final.csv"
    output_file = "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/QUICK_LINKS_COMPANIES.csv"
    
    companies_with_links = []
    
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        headers = next(reader)
        
        # Add Quick Links columns
        new_headers = headers + [
            'ql_google', 'ql_contact_page', 'ql_linkedin', 'ql_linkedin_president',
            'ql_facebook', 'ql_instagram', 'ql_twitter', 'ql_website',
            'ql_markdown', 'ql_html'
        ]
        
        for i, row in enumerate(reader, 1):
            if len(row) < 2:
                continue
            
            company_name = row[1] if len(row) > 1 else ''
            domain = row[2] if len(row) > 2 else ''
            
            if not company_name:
                continue
            
            # Generate Quick Links
            links = generator.generate_quick_links(
                name=company_name,
                website=domain
            )
            
            # Generate formatted outputs
            markdown = generator.format_quick_links_markdown(
                name=company_name,
                links=links,
                website=domain
            )
            
            html = generator.format_quick_links_html(
                name=company_name,
                links=links,
                website=domain
            )
            
            # Add to row
            new_row = row + [
                links.get('google', ''),
                links.get('contact_page', ''),
                links.get('linkedin', ''),
                links.get('linkedin_president', ''),
                links.get('facebook', ''),
                links.get('instagram', ''),
                links.get('twitter', ''),
                links.get('website', ''),
                markdown,
                html
            ]
            
            companies_with_links.append(new_row)
            
            if i % 1000 == 0:
                print(f"  Processed {i} companies...")
    
    # Save
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(new_headers)
        writer.writerows(companies_with_links)
    
    print(f"✅ COMPANIES: {len(companies_with_links)} processed")
    print(f"   Output: {output_file}")
    
    return companies_with_links


def process_realtors():
    """Process all realtors (brokers and salespersons)"""
    print("\n" + "="*70)
    print("👔 PROCESSING REALTORS (Brokers & Salespersons)")
    print("="*70)
    
    generator = UniversalQuickLinksGenerator()
    
    # Process brokers
    brokers_file = "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/dbeaver_final_exports/realtor_brokers_final.csv"
    brokers_output = "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/QUICK_LINKS_REALTOR_BROKERS.csv"
    
    all_realtors = []
    
    # Read brokers
    with open(brokers_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        headers = ['id', 'first_name', 'last_name', 'full_name', 'job_title', 'email', 
                   'verified', 'acceptall', 'unknown', 'alternative_emails', 'linkedin', 
                   'broker_id', 'updated', 'added']
        
        new_headers = headers + [
            'ql_google', 'ql_contact_page', 'ql_linkedin', 'ql_linkedin_president',
            'ql_facebook', 'ql_instagram', 'ql_twitter', 'ql_website',
            'ql_markdown', 'ql_html'
        ]
        
        next(reader)  # Skip header
        
        for row in reader:
            if len(row) < 6:
                continue
            
            full_name = row[3] if len(row) > 3 else ''
            email = row[5] if len(row) > 5 else ''
            linkedin = row[10] if len(row) > 10 else ''
            
            if not full_name:
                continue
            
            # Generate Quick Links
            links = generator.generate_quick_links(
                name=full_name,
                email=email
            )
            
            markdown = generator.format_quick_links_markdown(
                name=full_name,
                links=links,
                email=email,
                title="Real Estate Broker"
            )
            
            html = generator.format_quick_links_html(
                name=full_name,
                links=links,
                email=email
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
                markdown,
                html
            ]
            
            all_realtors.append(('broker', new_row))
    
    print(f"  Processed {len([r for r in all_realtors if r[0] == 'broker'])} brokers")
    
    # Process salespersons
    salespersons_file = "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/dbeaver_final_exports/realtor_salespersons_final.csv"
    
    with open(salespersons_file, 'r', encoding='utf-8') as f:
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
            
            markdown = generator.format_quick_links_markdown(
                name=full_name,
                links=links,
                email=email,
                title="Real Estate Salesperson"
            )
            
            html = generator.format_quick_links_html(
                name=full_name,
                links=links,
                email=email
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
                markdown,
                html
            ]
            
            all_realtors.append(('salesperson', new_row))
    
    print(f"  Processed {len([r for r in all_realtors if r[0] == 'salesperson'])} salespersons")
    
    # Save combined
    realtors_output = "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/QUICK_LINKS_ALL_REALTORS.csv"
    
    with open(realtors_output, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['type'] + new_headers)
        for rtype, row in all_realtors:
            writer.writerow([rtype] + row)
    
    print(f"✅ TOTAL REALTORS: {len(all_realtors)} processed")
    print(f"   Output: {realtors_output}")
    
    return all_realtors


def process_lenders():
    """Process all lenders"""
    print("\n" + "="*70)
    print("🏦 PROCESSING LENDERS")
    print("="*70)
    
    generator = UniversalQuickLinksGenerator()
    
    # Process lenders
    lenders_file = "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/dbeaver_final_exports/lenders_final.csv"
    lenders_output = "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/QUICK_LINKS_LENDERS.csv"
    
    lenders_with_links = []
    
    with open(lenders_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        next(reader)  # Skip header
        
        for i, row in enumerate(reader, 1):
            if len(row) < 2:
                continue
            
            lender_name = row[1] if len(row) > 1 else ''
            
            if not lender_name:
                continue
            
            links = generator.generate_quick_links(name=lender_name)
            
            markdown = generator.format_quick_links_markdown(
                name=lender_name,
                links=links,
                title="Lender"
            )
            
            html = generator.format_quick_links_html(
                name=lender_name,
                links=links
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
                markdown,
                html
            ]
            
            lenders_with_links.append(new_row)
    
    # Save
    headers = ['id', 'name', 'domain', 'linkedin', 'updated', 'added',
               'ql_google', 'ql_contact_page', 'ql_linkedin', 'ql_linkedin_president',
               'ql_facebook', 'ql_instagram', 'ql_twitter', 'ql_website',
               'ql_markdown', 'ql_html']
    
    with open(lenders_output, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(lenders_with_links)
    
    print(f"✅ LENDERS: {len(lenders_with_links)} processed")
    print(f"   Output: {lenders_output}")
    
    return lenders_with_links


def process_brokerages():
    """Process all brokerage firms"""
    print("\n" + "="*70)
    print("🏛️ PROCESSING BROKERAGE FIRMS")
    print("="*70)
    
    generator = UniversalQuickLinksGenerator()
    
    brokers_file = "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/dbeaver_final_exports/brokers_final.csv"
    brokers_output = "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/QUICK_LINKS_BROKERAGES.csv"
    
    brokerages_with_links = []
    
    with open(brokers_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        next(reader)  # Skip header
        
        for row in reader:
            if len(row) < 2:
                continue
            
            brokerage_name = row[1] if len(row) > 1 else ''
            domain = row[2] if len(row) > 2 else ''
            
            if not brokerage_name:
                continue
            
            links = generator.generate_quick_links(
                name=brokerage_name,
                website=domain
            )
            
            markdown = generator.format_quick_links_markdown(
                name=brokerage_name,
                links=links,
                website=domain,
                title="Brokerage Firm"
            )
            
            html = generator.format_quick_links_html(
                name=brokerage_name,
                links=links,
                website=domain
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
                markdown,
                html
            ]
            
            brokerages_with_links.append(new_row)
    
    # Save
    headers = ['id', 'name', 'domain', 'linkedin', 'updated', 'added',
               'ql_google', 'ql_contact_page', 'ql_linkedin', 'ql_linkedin_president',
               'ql_facebook', 'ql_instagram', 'ql_twitter', 'ql_website',
               'ql_markdown', 'ql_html']
    
    with open(brokers_output, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(brokerages_with_links)
    
    print(f"✅ BROKERAGES: {len(brokerages_with_links)} processed")
    print(f"   Output: {brokers_output}")
    
    return brokerages_with_links


def generate_summary_report():
    """Generate summary of all Quick Links created"""
    print("\n" + "="*70)
    print("📊 QUICK LINKS SUMMARY REPORT")
    print("="*70)
    
    summary = {
        'Companies (Buyers/Sellers)': len(list(csv.reader(open("/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/QUICK_LINKS_COMPANIES.csv")))) - 1,
        'Realtor Brokers': len([r for r in csv.reader(open("/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/QUICK_LINKS_ALL_REALTORS.csv")) if len(r) > 0 and r[0] == 'broker']) - 1,
        'Realtor Salespersons': len([r for r in csv.reader(open("/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/QUICK_LINKS_ALL_REALTORS.csv")) if len(r) > 0 and r[0] == 'salesperson']) - 1,
        'Lenders': len(list(csv.reader(open("/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/QUICK_LINKS_LENDERS.csv")))) - 1,
        'Brokerage Firms': len(list(csv.reader(open("/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/QUICK_LINKS_BROKERAGES.csv")))) - 1,
    }
    
    total = sum(summary.values())
    
    for category, count in summary.items():
        print(f"  {category:30}: {count:>6,}")
    
    print(f"\n  {'TOTAL CONTACTS WITH QUICK LINKS':30}: {total:>6,}")
    
    # Save summary
    summary_file = "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/QUICK_LINKS_SUMMARY.txt"
    with open(summary_file, 'w') as f:
        f.write("="*70 + "\n")
        f.write("BIGDATACLAW QUICK LINKS GENERATION SUMMARY\n")
        f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write("="*70 + "\n\n")
        
        for category, count in summary.items():
            f.write(f"{category:30}: {count:>6,}\n")
        
        f.write(f"\n{'TOTAL':30}: {total:>6,}\n")
        f.write("\n" + "="*70 + "\n")
        f.write("OUTPUT FILES:\n")
        f.write("="*70 + "\n")
        f.write("1. QUICK_LINKS_COMPANIES.csv\n")
        f.write("2. QUICK_LINKS_ALL_REALTORS.csv\n")
        f.write("3. QUICK_LINKS_LENDERS.csv\n")
        f.write("4. QUICK_LINKS_BROKERAGES.csv\n")
    
    print(f"\n📁 Summary saved to: {summary_file}")


if __name__ == "__main__":
    print("="*70)
    print("🚀 BIGDATACLAW UNIVERSAL QUICK LINKS GENERATOR")
    print("="*70)
    print("\nGenerating Google/LinkedIn/Facebook search links for ALL contacts...")
    print("This includes: Companies, Buyers, Sellers, Agents, Brokers, Lenders")
    
    # Process all contact types
    companies = process_companies()
    realtors = process_realtors()
    lenders = process_lenders()
    brokerages = process_brokerages()
    
    # Generate summary
    generate_summary_report()
    
    print("\n" + "="*70)
    print("✅ ALL QUICK LINKS GENERATED SUCCESSFULLY!")
    print("="*70)
    print("\nEach contact now has:")
    print("  • GOOGLE search link")
    print("  • CONTACT PAGE search")
    print("  • LINKEDIN profile search")
    print("  • LINKEDIN PRESIDENT/CEO search")
    print("  • FACEBOOK search")
    print("  • INSTAGRAM search")
    print("  • TWITTER/X search")
    print("  • Pre-formatted Markdown for Obsidian")
    print("  • Pre-formatted HTML for web display")
