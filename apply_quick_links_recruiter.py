#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════════════════╗
║           QUICK LINKS FOR RECRUITER DATABASE                                 ║
║                                                                              ║
║  Adds Quick Links to the 28,505 realtors in the recruiter database          ║
║  with enhanced fields for the Residential Recruiter dashboard               ║
╚══════════════════════════════════════════════════════════════════════════════╝

Input: realtor_exports/realtors_for_recruiter.csv (28,505 records)
Output: QUICK_LINKS_RECRUITER_DATABASE.csv + recruiter_db_with_quicklinks.json

Features:
✓ Google/LinkedIn/Facebook search links for every agent
✓ Brokerage research links
✓ Pre-formatted HTML for dashboard display
✓ JSON export for direct import into Recruiter app
"""

import csv
import json
from urllib.parse import quote_plus
from datetime import datetime


class RecruiterQuickLinksGenerator:
    """Generate Quick Links specifically for Recruiter Database"""
    
    BASE_GOOGLE = "https://www.google.com/search"
    
    def __init__(self):
        pass
    
    def generate_agent_quick_links(self, name, brokerage, email, job_title):
        """Generate Quick Links for a real estate agent"""
        links = {}
        
        # ═══════════════════════════════════════════════════════════
        # AGENT PERSONAL SEARCHES
        # ═══════════════════════════════════════════════════════════
        
        # Google searches for agent
        links['google'] = f"{self.BASE_GOOGLE}?q={quote_plus(name + ' real estate')}"
        links['google_reviews'] = f"{self.BASE_GOOGLE}?q={quote_plus(name + ' reviews')}"
        
        # LinkedIn
        links['linkedin'] = f"{self.BASE_GOOGLE}?q={quote_plus(name + ' linkedin')}"
        links['linkedin_email'] = f"{self.BASE_GOOGLE}?q={quote_plus(email + ' linkedin')}" if email else ''
        
        # Social media
        links['facebook'] = f"{self.BASE_GOOGLE}?q={quote_plus(name + ' facebook')}"
        links['instagram'] = f"{self.BASE_GOOGLE}?q={quote_plus(name + ' instagram')}"
        links['twitter'] = f"{self.BASE_GOOGLE}?q={quote_plus(name + ' twitter OR x.com')}"
        
        # Realtor.ca
        links['realtor_ca'] = f"{self.BASE_GOOGLE}?q={quote_plus(name + ' realtor.ca')}"
        
        # ═══════════════════════════════════════════════════════════
        # BROKERAGE SEARCHES
        # ═══════════════════════════════════════════════════════════
        
        if brokerage:
            links['brokerage_google'] = f"{self.BASE_GOOGLE}?q={quote_plus(brokerage)}"
            links['brokerage_linkedin'] = f"{self.BASE_GOOGLE}?q={quote_plus(brokerage + ' linkedin')}"
            links['brokerage_website'] = f"{self.BASE_GOOGLE}?q={quote_plus(brokerage + ' website')}"
            links['brokerage_reviews'] = f"{self.BASE_GOOGLE}?q={quote_plus(brokerage + ' reviews')}"
        
        # ═══════════════════════════════════════════════════════════
        # EXP REALTY SPECIFIC (for recruitment comparison)
        # ═══════════════════════════════════════════════════════════
        
        links['exp_realty'] = f"{self.BASE_GOOGLE}?q=EXP+Realty+Canada"
        links['exp_vs_traditional'] = f"{self.BASE_GOOGLE}?q=EXP+Realty+vs+traditional+brokerage"
        links['exp_commission'] = f"{self.BASE_GOOGLE}?q=EXP+Realty+commission+split+Canada"
        
        return links
    
    def format_recruiter_markdown(self, name, brokerage, email, job_title, links):
        """Format Quick Links as Markdown for Obsidian/notes"""
        lines = []
        
        lines.append("### 🔍 AGENT RESEARCH LINKS")
        lines.append("")
        lines.append(f"**{name}**")
        
        if job_title:
            lines.append(f"*{job_title}*")
        
        if brokerage:
            lines.append(f"🏢 {brokerage}")
        
        if email:
            lines.append(f"📧 [{email}](mailto:{email})")
        
        lines.append("")
        lines.append("**Agent Search:**")
        lines.append(f"| Google | [Search]({links.get('google', '#')}) |")
        lines.append(f"| Reviews | [Find]({links.get('google_reviews', '#')}) |")
        lines.append(f"| LinkedIn | [Profile]({links.get('linkedin', '#')}) |")
        if email and links.get('linkedin_email'):
            lines.append(f"| LinkedIn (Email) | [Search]({links['linkedin_email']}) |")
        lines.append(f"| Facebook | [Page]({links.get('facebook', '#')}) |")
        lines.append(f"| Instagram | [Profile]({links.get('instagram', '#')}) |")
        lines.append(f"| Twitter/X | [Profile]({links.get('twitter', '#')}) |")
        lines.append(f"| Realtor.ca | [Search]({links.get('realtor_ca', '#')}) |")
        
        if brokerage:
            lines.append("")
            lines.append(f"**🏢 Brokerage: {brokerage}**")
            lines.append(f"| Google | [Search]({links.get('brokerage_google', '#')}) |")
            lines.append(f"| LinkedIn | [Search]({links.get('brokerage_linkedin', '#')}) |")
            lines.append(f"| Website | [Find]({links.get('brokerage_website', '#')}) |")
            lines.append(f"| Reviews | [Search]({links.get('brokerage_reviews', '#')}) |")
        
        lines.append("")
        lines.append("**📚 EXP Realty Resources:**")
        lines.append(f"| EXP Realty | [Info]({links.get('exp_realty', '#')}) |")
        lines.append(f"| vs Traditional | [Compare]({links.get('exp_vs_traditional', '#')}) |")
        lines.append(f"| Commission | [Details]({links.get('exp_commission', '#')}) |")
        
        return "\n".join(lines)
    
    def format_recruiter_html(self, name, brokerage, email, job_title, links):
        """Format Quick Links as HTML for dashboard display"""
        html_parts = []
        
        html_parts.append("<div class='recruiter-quick-links'>")
        html_parts.append(f"  <h4>🔍 Quick Research</h4>")
        
        html_parts.append("  <div class='ql-grid'>")
        html_parts.append(f"    <a href='{links.get('google', '#')}' target='_blank' class='ql-btn google'>Google</a>")
        html_parts.append(f"    <a href='{links.get('linkedin', '#')}' target='_blank' class='ql-btn linkedin'>LinkedIn</a>")
        html_parts.append(f"    <a href='{links.get('facebook', '#')}' target='_blank' class='ql-btn facebook'>Facebook</a>")
        html_parts.append(f"    <a href='{links.get('realtor_ca', '#')}' target='_blank' class='ql-btn realtor'>Realtor.ca</a>")
        html_parts.append("  </div>")
        
        if brokerage:
            html_parts.append(f"  <h5>🏢 {brokerage}</h5>")
            html_parts.append("  <div class='ql-grid'>")
            html_parts.append(f"    <a href='{links.get('brokerage_google', '#')}' target='_blank' class='ql-btn'>Search Brokerage</a>")
            html_parts.append(f"    <a href='{links.get('brokerage_reviews', '#')}' target='_blank' class='ql-btn'>Brokerage Reviews</a>")
            html_parts.append("  </div>")
        
        html_parts.append("  <h5>📚 EXP Resources</h5>")
        html_parts.append("  <div class='ql-grid'>")
        html_parts.append(f"    <a href='{links.get('exp_realty', '#')}' target='_blank' class='ql-btn exp'>EXP Realty</a>")
        html_parts.append(f"    <a href='{links.get('exp_commission', '#')}' target='_blank' class='ql-btn exp'>Commission Info</a>")
        html_parts.append("  </div>")
        
        html_parts.append("</div>")
        
        return "\n".join(html_parts)


def process_recruiter_database():
    """Process the recruiter database and add Quick Links"""
    print("="*70)
    print("🎯 PROCESSING RECRUITER DATABASE")
    print("="*70)
    
    generator = RecruiterQuickLinksGenerator()
    
    input_file = "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/realtor_exports/realtors_for_recruiter.csv"
    csv_output = "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/QUICK_LINKS_RECRUITER_DATABASE.csv"
    json_output = "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/recruiter_db_with_quicklinks.json"
    
    recruiters_with_links = []
    json_data = []
    
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for i, row in enumerate(reader, 1):
            name = row.get('name', '')
            brokerage = row.get('brokerage', '')
            email = row.get('email', '')
            job_title = row.get('job_title', '')
            linkedin = row.get('linkedin', '')
            status = row.get('status', 'new')
            tags = row.get('tags', '')
            date_added = row.get('dateAdded', '')
            
            if not name:
                continue
            
            # Generate Quick Links
            links = generator.generate_agent_quick_links(name, brokerage, email, job_title)
            
            # Format outputs
            markdown = generator.format_recruiter_markdown(name, brokerage, email, job_title, links)
            html = generator.format_recruiter_html(name, brokerage, email, job_title, links)
            
            # CSV row
            csv_row = {
                'name': name,
                'brokerage': brokerage,
                'email': email,
                'job_title': job_title,
                'linkedin': linkedin,
                'status': status,
                'tags': tags,
                'date_added': date_added,
                # Quick Links
                'ql_google': links.get('google', ''),
                'ql_reviews': links.get('google_reviews', ''),
                'ql_linkedin': links.get('linkedin', ''),
                'ql_linkedin_email': links.get('linkedin_email', ''),
                'ql_facebook': links.get('facebook', ''),
                'ql_instagram': links.get('instagram', ''),
                'ql_twitter': links.get('twitter', ''),
                'ql_realtor_ca': links.get('realtor_ca', ''),
                'ql_brokerage_google': links.get('brokerage_google', ''),
                'ql_brokerage_linkedin': links.get('brokerage_linkedin', ''),
                'ql_brokerage_website': links.get('brokerage_website', ''),
                'ql_brokerage_reviews': links.get('brokerage_reviews', ''),
                'ql_exp_realty': links.get('exp_realty', ''),
                'ql_markdown': markdown,
                'ql_html': html
            }
            
            recruiters_with_links.append(csv_row)
            
            # JSON data
            json_row = {
                'id': i,
                'name': name,
                'brokerage': brokerage,
                'email': email,
                'jobTitle': job_title,
                'linkedin': linkedin or None,
                'status': status,
                'tags': tags.split(',') if tags else [],
                'dateAdded': date_added,
                'quickLinks': {
                    'google': links.get('google', ''),
                    'reviews': links.get('google_reviews', ''),
                    'linkedin': links.get('linkedin', ''),
                    'facebook': links.get('facebook', ''),
                    'instagram': links.get('instagram', ''),
                    'twitter': links.get('twitter', ''),
                    'realtorCa': links.get('realtor_ca', ''),
                },
                'brokerageLinks': {
                    'google': links.get('brokerage_google', ''),
                    'linkedin': links.get('brokerage_linkedin', ''),
                    'website': links.get('brokerage_website', ''),
                    'reviews': links.get('brokerage_reviews', ''),
                } if brokerage else None,
                'expResources': {
                    'expRealty': links.get('exp_realty', ''),
                    'vsTraditional': links.get('exp_vs_traditional', ''),
                    'commission': links.get('exp_commission', ''),
                },
                'markdown': markdown,
                'html': html
            }
            
            json_data.append(json_row)
            
            if i % 1000 == 0:
                print(f"  Processed {i:,} recruiters...")
    
    # Save CSV
    fieldnames = ['name', 'brokerage', 'email', 'job_title', 'linkedin', 'status', 'tags', 'date_added',
                  'ql_google', 'ql_reviews', 'ql_linkedin', 'ql_linkedin_email', 'ql_facebook',
                  'ql_instagram', 'ql_twitter', 'ql_realtor_ca', 'ql_brokerage_google',
                  'ql_brokerage_linkedin', 'ql_brokerage_website', 'ql_brokerage_reviews',
                  'ql_exp_realty', 'ql_markdown', 'ql_html']
    
    with open(csv_output, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(recruiters_with_links)
    
    # Save JSON
    with open(json_output, 'w', encoding='utf-8') as f:
        json.dump({
            'meta': {
                'generated': datetime.now().isoformat(),
                'count': len(json_data),
                'version': '2.0'
            },
            'recruiters': json_data
        }, f, indent=2)
    
    print(f"\n✅ RECRUITER DATABASE: {len(recruiters_with_links):,} agents processed")
    print(f"   CSV: {csv_output}")
    print(f"   JSON: {json_output}")
    
    return recruiters_with_links, json_data


def generate_recruiter_summary(count):
    """Generate summary report"""
    print("\n" + "="*70)
    print("📊 RECRUITER DATABASE QUICK LINKS SUMMARY")
    print("="*70)
    
    summary = f"""
Total Recruiters: {count:,}

Quick Links Added Per Agent:
  • Google Search
  • Google Reviews
  • LinkedIn Profile
  • LinkedIn (by Email)
  • Facebook
  • Instagram
  • Twitter/X
  • Realtor.ca
  • Brokerage Google Search
  • Brokerage LinkedIn
  • Brokerage Website Finder
  • Brokerage Reviews
  • EXP Realty Info
  • EXP vs Traditional Comparison
  • EXP Commission Info

Output Files:
  1. QUICK_LINKS_RECRUITER_DATABASE.csv - Full data with all links
  2. recruiter_db_with_quicklinks.json - Ready for app import

Use Case:
  - Research agents before outreach
  - Compare their current brokerage
  - Show EXP benefits with one-click resources
"""
    
    print(summary)
    
    # Save summary
    summary_file = "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/QUICK_LINKS_RECRUITER_SUMMARY.txt"
    with open(summary_file, 'w') as f:
        f.write("="*70 + "\n")
        f.write("RECRUITER DATABASE QUICK LINKS GENERATION\n")
        f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write("="*70 + "\n\n")
        f.write(summary)
    
    print(f"📁 Summary saved to: {summary_file}")


if __name__ == "__main__":
    print("\n" + "="*70)
    print("🚀 RECRUITER DATABASE QUICK LINKS GENERATOR")
    print("="*70)
    print("\nAdding Quick Links to 28,505 realtors for recruitment...")
    
    recruiters, json_data = process_recruiter_database()
    generate_recruiter_summary(len(recruiters))
    
    print("\n" + "="*70)
    print("✅ RECRUITER DATABASE QUICK LINKS COMPLETE!")
    print("="*70)
    print("\nEach recruiter now has:")
    print("  • Personal research links (Google, LinkedIn, Social)")
    print("  • Brokerage research links")
    print("  • Realtor.ca profile search")
    print("  • EXP Realty comparison resources")
    print("  • Pre-formatted HTML for dashboard")
    print("\nReady to import into Residential Recruiter dashboard!")
