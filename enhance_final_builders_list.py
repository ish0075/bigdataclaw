#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════════════════╗
║           ENHANCE FINAL BUILDERS LIST WITH QUICK LINKS                       ║
║                                                                              ║
║  Takes the 5,914 builders from FinalBuildersList.csv in Jamie's Personal    ║
║  Vault and adds Quick Links + creates Obsidian notes                        ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

import csv
import os
import re
from pathlib import Path
from datetime import datetime
from urllib.parse import quote_plus

# Configuration
INPUT_CSV = "/home/jamie/Desktop/Jamie's Personal Vault/builders/FinalBuildersList (1) - FinalBuildersList (1).csv.csv"
OUTPUT_CSV = "/home/jamie/Desktop/Jamie's Personal Vault/builders/FinalBuildersList_WITH_QUICK_LINKS.csv"
VAULT_PATH = "/home/jamie/Desktop/Jamie's Personal Vault"
BUILDERS_FOLDER = f"{VAULT_PATH}/Builders_Enhanced"


class QuickLinksGenerator:
    """Generate Quick Links for builders"""
    
    BASE_GOOGLE = "https://www.google.com/search"
    
    def generate_quick_links(self, name, location=None, email=None):
        """Generate Quick Links for a builder"""
        links = {}
        
        search_query = name
        if location:
            search_query = f"{name} {location}"
        
        # General searches
        links['google'] = f"{self.BASE_GOOGLE}?q={quote_plus(search_query)}"
        links['google_reviews'] = f"{self.BASE_GOOGLE}?q={quote_plus(name + ' reviews')}"
        
        # LinkedIn
        links['linkedin'] = f"{self.BASE_GOOGLE}?q={quote_plus(name + ' linkedin')}"
        if email:
            links['linkedin_email'] = f"{self.BASE_GOOGLE}?q={quote_plus(email + ' linkedin')}"
        
        # Social media
        links['facebook'] = f"{self.BASE_GOOGLE}?q={quote_plus(name + ' facebook')}"
        links['instagram'] = f"{self.BASE_GOOGLE}?q={quote_plus(name + ' instagram')}"
        links['twitter'] = f"{self.BASE_GOOGLE}?q={quote_plus(name + ' twitter OR x.com')}"
        
        # Builder-specific
        links['livabl'] = f"https://livabl.com/search?q={quote_plus(name)}"
        links['new_homes'] = f"{self.BASE_GOOGLE}?q={quote_plus(name + ' new homes new construction')}"
        links['tarion'] = f"{self.BASE_GOOGLE}?q={quote_plus(name + ' tarion warranty')}"
        links['hcra'] = f"{self.BASE_GOOGLE}?q={quote_plus(name + ' HCRA Ontario builder')}"
        links['past_projects'] = f"{self.BASE_GOOGLE}?q={quote_plus(name + ' past projects developments')}"
        links['builder_reviews'] = f"{self.BASE_GOOGLE}?q={quote_plus(name + ' builder reviews')}"
        
        # Commercial
        links['loopnet'] = f"https://www.loopnet.com/search?q={quote_plus(name)}"
        
        return links
    
    def format_markdown(self, name, location, email, links):
        """Format as Markdown for Obsidian"""
        lines = []
        
        lines.append("---")
        lines.append(f'type: builder-profile')
        lines.append(f'company: "{name}"')
        lines.append(f'category: builder-developer')
        lines.append(f'location: "{location}"')
        lines.append(f'email: "{email}"')
        lines.append(f'quick_links_generated: true')
        lines.append(f'imported_date: {datetime.now().strftime("%Y-%m-%d")}')
        lines.append(f'tags: [builder, developer, "real-estate"]')
        lines.append("---")
        lines.append("")
        lines.append(f"# {name}")
        lines.append("")
        lines.append("> 🏗️ **Builder/Developer Profile**")
        lines.append("")
        
        if location:
            lines.append(f"📍 **Location:** {location}")
        if email:
            lines.append(f"📧 **Email:** [{email}](mailto:{email})")
        
        lines.append("")
        lines.append("## 🔍 Quick Links")
        lines.append("")
        lines.append("### General Search")
        lines.append("| Platform | Link |")
        lines.append("|----------|------|")
        lines.append(f"| Google | [Search]({links.get('google', '#')}) |")
        lines.append(f"| Reviews | [Find]({links.get('google_reviews', '#')}) |")
        lines.append(f"| LinkedIn | [Profile]({links.get('linkedin', '#')}) |")
        if email and 'linkedin_email' in links:
            lines.append(f"| LinkedIn (Email) | [Search]({links['linkedin_email']}) |")
        lines.append(f"| Facebook | [Page]({links.get('facebook', '#')}) |")
        lines.append(f"| Instagram | [Profile]({links.get('instagram', '#')}) |")
        lines.append(f"| Twitter/X | [Profile]({links.get('twitter', '#')}) |")
        
        lines.append("")
        lines.append("### 🏗️ Builder Resources")
        lines.append("| Platform | Link |")
        lines.append("|----------|------|")
        lines.append(f"| LIVABL | [Search]({links.get('livabl', '#')}) |")
        lines.append(f"| New Homes | [Search]({links.get('new_homes', '#')}) |")
        lines.append(f"| Tarion | [Warranty]({links.get('tarion', '#')}) |")
        lines.append(f"| HCRA | [Registry]({links.get('hcra', '#')}) |")
        lines.append(f"| Past Projects | [Search]({links.get('past_projects', '#')}) |")
        lines.append(f"| Reviews | [Find]({links.get('builder_reviews', '#')}) |")
        
        lines.append("")
        lines.append("### 🏢 Commercial Real Estate")
        lines.append("| Platform | Link |")
        lines.append("|----------|------|")
        lines.append(f"| LOOPNET | [Search]({links.get('loopnet', '#')}) |")
        
        lines.append("")
        lines.append("## 📝 Research Notes")
        lines.append("")
        lines.append("- [ ] Research company background")
        lines.append("- [ ] Check HCRA registration")
        lines.append("- [ ] Review past projects")
        lines.append("- [ ] Look for development pipeline")
        lines.append("")
        lines.append("## 🎯 Outreach Status")
        lines.append("")
        lines.append("| Date | Action | Response | Next Step |")
        lines.append("|------|--------|----------|-----------|")
        lines.append("| | | | |")
        lines.append("")
        lines.append("---")
        lines.append("")
        lines.append(f"*Enhanced by BigDataClaw* | *Generated: {datetime.now().strftime('%Y-%m-%d')}*")
        lines.append("")
        lines.append("#builder #developer #real-estate")
        
        return "\n".join(lines)


def sanitize_filename(name):
    """Convert company name to safe filename"""
    safe = re.sub(r'[\\/*?:"<>|]', "", name)
    safe = safe.replace(" ", "_")
    safe = safe.replace("/", "-")
    safe = safe[:100]
    return safe


def main():
    print("="*70)
    print("🏗️ ENHANCING FINAL BUILDERS LIST")
    print("="*70)
    print(f"\nInput: {INPUT_CSV}")
    
    ql = QuickLinksGenerator()
    
    # Create output folder
    Path(BUILDERS_FOLDER).mkdir(parents=True, exist_ok=True)
    print(f"✓ Output folder: {BUILDERS_FOLDER}")
    
    enhanced_rows = []
    obsidian_count = 0
    
    with open(INPUT_CSV, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for i, row in enumerate(reader, 1):
            name = row.get('Name', '').strip()
            location = row.get('Location', '').strip()
            email = row.get('E-mail 1 - Value', '').strip()
            
            if not name:
                continue
            
            # Generate Quick Links
            links = ql.generate_quick_links(name, location, email)
            
            # Enhanced row
            enhanced_row = {
                'name': name,
                'location': location,
                'email': email,
                'ql_google': links.get('google', ''),
                'ql_linkedin': links.get('linkedin', ''),
                'ql_facebook': links.get('facebook', ''),
                'ql_instagram': links.get('instagram', ''),
                'ql_twitter': links.get('twitter', ''),
                'ql_livabl': links.get('livabl', ''),
                'ql_tarion': links.get('tarion', ''),
                'ql_hcra': links.get('hcra', ''),
                'ql_loopnet': links.get('loopnet', ''),
                'ql_new_homes': links.get('new_homes', ''),
                'ql_past_projects': links.get('past_projects', ''),
                'ql_builder_reviews': links.get('builder_reviews', ''),
            }
            enhanced_rows.append(enhanced_row)
            
            # Create Obsidian note
            try:
                filename = sanitize_filename(name) + ".md"
                filepath = os.path.join(BUILDERS_FOLDER, filename)
                
                content = ql.format_markdown(name, location, email, links)
                
                with open(filepath, 'w', encoding='utf-8') as out:
                    out.write(content)
                
                obsidian_count += 1
                
                if obsidian_count % 1000 == 0:
                    print(f"  ✓ Processed {obsidian_count} builders...")
            
            except Exception as e:
                print(f"  ❌ Error with {name}: {e}")
    
    # Save enhanced CSV
    fieldnames = ['name', 'location', 'email', 'ql_google', 'ql_linkedin', 
                  'ql_facebook', 'ql_instagram', 'ql_twitter', 'ql_livabl',
                  'ql_tarion', 'ql_hcra', 'ql_loopnet', 'ql_new_homes',
                  'ql_past_projects', 'ql_builder_reviews']
    
    with open(OUTPUT_CSV, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(enhanced_rows)
    
    # Create index
    index_content = f"""---
type: builder-index
title: "Final Builders List - Enhanced"
count: {obsidian_count}
last_updated: {datetime.now().strftime('%Y-%m-%d')}
---

# 🏗️ Final Builders List (Enhanced with Quick Links)

**Total Builders:** {obsidian_count:,} companies  
**Last Updated:** {datetime.now().strftime('%Y-%m-%d %H:%M')}

## 📂 About This List

This is the enhanced version of the Final Builders List from Jamie's Personal Vault, 
with Quick Links added for instant research.

## 🔍 Quick Resources

| Resource | Link |
|----------|------|
| LIVABL | https://livabl.com |
| Tarion | https://www.tarion.com |
| HCRA | https://www.hcraontario.ca |
| LOOPNET | https://www.loopnet.com |

## 📋 All Builders

See individual .md files in this folder for each builder profile.

---

*Enhanced by BigDataClaw*
"""
    
    index_path = os.path.join(BUILDERS_FOLDER, "_Index.md")
    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(index_content)
    
    print(f"\n{'='*70}")
    print("📊 SUMMARY")
    print(f"{'='*70}")
    print(f"  ✓ Enhanced CSV: {len(enhanced_rows):,} builders")
    print(f"  ✓ Obsidian notes: {obsidian_count:,} files")
    print(f"  📁 Output CSV: {OUTPUT_CSV}")
    print(f"  📁 Obsidian folder: {BUILDERS_FOLDER}")
    print(f"  📝 Index: {index_path}")


if __name__ == "__main__":
    main()
    print("\n" + "="*70)
    print("✅ FINAL BUILDERS LIST ENHANCED!")
    print("="*70)
