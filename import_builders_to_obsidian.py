#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════════════════╗
║           IMPORT BUILDERS TO OBSIDIAN WITH QUICK LINKS                       ║
║                                                                              ║
║  Takes the 4,363 builders from QUICK_LINKS_BUILDERS.csv and creates/updates  ║
║  Obsidian notes in the BDAIV2 vault with full Quick Links integration       ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

import csv
import os
import re
from pathlib import Path
from datetime import datetime
from urllib.parse import quote_plus

# Configuration
VAULT_PATHS = [
    "/home/jamie/Documents/BDAIV2",
    "/home/jamie/Desktop/Jamie's Personal Vault"
]
INPUT_CSV = "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/QUICK_LINKS_BUILDERS.csv"


class ObsidianBuilderImporter:
    """Import builders to Obsidian with Quick Links"""
    
    def __init__(self, vault_path, builders_subfolder="companies/Builders"):
        self.vault_path = vault_path
        self.builders_folder = os.path.join(vault_path, builders_subfolder)
        self.ensure_folder_exists()
    
    def ensure_folder_exists(self):
        """Create Builders folder if it doesn't exist"""
        Path(self.builders_folder).mkdir(parents=True, exist_ok=True)
        print(f"✓ Builders folder ready: {self.builders_folder}")
    
    def sanitize_filename(self, name):
        """Convert company name to safe filename"""
        # Remove/replace unsafe characters
        safe = re.sub(r'[\\/*?:"<>|]', "", name)
        safe = safe.replace(" ", "_")
        safe = safe.replace("/", "-")
        safe = safe[:100]  # Limit length
        return safe
    
    def generate_obsidian_content(self, builder):
        """Generate Obsidian markdown content for a builder"""
        
        name = builder.get('name', 'Unknown')
        address = builder.get('address', '')
        city = builder.get('city', '')
        province = builder.get('province', '')
        postal = builder.get('postal_code', '')
        phone = builder.get('phone', '')
        website = builder.get('domain', '')
        
        # Build full address
        full_address = ", ".join(filter(None, [address, city, province, postal]))
        
        # Get Quick Links
        ql_google = builder.get('ql_google', '')
        ql_linkedin = builder.get('ql_linkedin', '')
        ql_linkedin_president = builder.get('ql_linkedin_president', '')
        ql_facebook = builder.get('ql_facebook', '')
        ql_instagram = builder.get('ql_instagram', '')
        ql_twitter = builder.get('ql_twitter', '')
        ql_loopnet = builder.get('ql_loopnet', '')
        ql_livabl = builder.get('ql_livabl', '')
        ql_tarion = builder.get('ql_tarion', '')
        ql_hcra = builder.get('ql_hCRA', '')
        ql_past_projects = builder.get('ql_past_projects', '')
        
        content = f"""---
type: builder-profile
company: "{name}"
category: builder-developer
address: "{full_address}"
city: "{city}"
province: "{province}"
phone: "{phone}"
website: "{website}"
quick_links_generated: true
imported_date: {datetime.now().strftime('%Y-%m-%d')}
tags: [builder, developer, "real-estate", commercial]
---

# {name}

> 🏗️ **Builder/Developer Profile**

## 📍 Contact Information

"""
        
        if full_address:
            content += f"- **Address:** {full_address}\n"
        if phone:
            content += f"- **Phone:** {phone}\n"
        if website:
            content += f"- **Website:** [{website}](https://{website})\n"
        
        content += """
## 🔍 Quick Links

### General Search
| Platform | Link |
|----------|------|
"""
        
        if ql_google:
            content += f"| Google | [Search]({ql_google}) |\n"
        if ql_linkedin:
            content += f"| LinkedIn | [Profile]({ql_linkedin}) |\n"
        if ql_linkedin_president:
            content += f"| President/CEO | [Search]({ql_linkedin_president}) |\n"
        if ql_facebook:
            content += f"| Facebook | [Page]({ql_facebook}) |\n"
        if ql_instagram:
            content += f"| Instagram | [Profile]({ql_instagram}) |\n"
        if ql_twitter:
            content += f"| Twitter/X | [Profile]({ql_twitter}) |\n"
        
        content += """
### 🏢 Commercial Real Estate
| Platform | Link |
|----------|------|
"""
        
        if ql_loopnet:
            content += f"| LOOPNET | [Search]({ql_loopnet}) |\n"
        
        content += """
### 🏗️ Builder/Development Resources
| Platform | Link |
|----------|------|
"""
        
        if ql_livabl:
            content += f"| LIVABL | [Profile]({ql_livabl}) |\n"
        if ql_tarion:
            content += f"| Tarion | [Warranty Lookup]({ql_tarion}) |\n"
        if ql_hcra:
            content += f"| HCRA | [Builder Registry]({ql_hcra}) |\n"
        if ql_past_projects:
            content += f"| Past Projects | [Search]({ql_past_projects}) |\n"
        
        content += f"""
## 📝 Research Notes

- [ ] Research company background
- [ ] Check HCRA registration status
- [ ] Review past projects
- [ ] Look for development pipeline
- [ ] Check for news/press releases

## 🎯 Outreach Status

| Date | Action | Response | Next Step |
|------|--------|----------|-----------|
| | | | |

---

*Imported from BigDataClaw Builder Database*  
*Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}*

#builder #developer #commercial-real-estate #ontario
"""
        
        return content
    
    def import_builders(self, limit=None):
        """Import builders from CSV to Obsidian"""
        print("="*70)
        print("🏗️ IMPORTING BUILDERS TO OBSIDIAN")
        print("="*70)
        
        if not os.path.exists(INPUT_CSV):
            print(f"❌ Input file not found: {INPUT_CSV}")
            return
        
        imported = 0
        skipped = 0
        errors = 0
        
        with open(INPUT_CSV, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            
            # Skip first row (it contains the first data row that was used as header)
            header = next(reader, None)
            
            for i, row in enumerate(reader, 1):
                if limit and i > limit:
                    print(f"\n⏹️  Reached limit of {limit} builders")
                    break
                
                if len(row) < 5:
                    skipped += 1
                    continue
                
                # Map columns by index
                # Columns: id, name, address, city, province, postal, phone, date1, domain, empty, date2, date3, 
                #          ql_google, ql_contact_page, ql_linkedin, ql_linkedin_president, ql_facebook, ql_instagram, 
                #          ql_twitter, ql_website, ql_loopnet, ql_loopnet_properties, ql_cre_google, ql_cre_listings,
                #          ql_livabl, ql_livabl_search, ql_new_homes, ql_builder_reviews, ql_tarion, ql_hcra, 
                #          ql_past_projects, is_builder, ql_markdown, ql_html
                
                builder = {
                    'id': row[0],
                    'name': row[1],
                    'address': row[2],
                    'city': row[3],
                    'province': row[4],
                    'postal_code': row[5],
                    'phone': row[6],
                    'domain': row[8],
                    'ql_google': row[12] if len(row) > 12 else '',
                    'ql_linkedin': row[14] if len(row) > 14 else '',
                    'ql_linkedin_president': row[15] if len(row) > 15 else '',
                    'ql_facebook': row[16] if len(row) > 16 else '',
                    'ql_instagram': row[17] if len(row) > 17 else '',
                    'ql_twitter': row[18] if len(row) > 18 else '',
                    'ql_loopnet': row[20] if len(row) > 20 else '',
                    'ql_livabl': row[24] if len(row) > 24 else '',
                    'ql_tarion': row[28] if len(row) > 28 else '',
                    'ql_hCRA': row[29] if len(row) > 29 else '',
                    'ql_past_projects': row[30] if len(row) > 30 else '',
                }
                
                name = builder['name']
                if not name:
                    skipped += 1
                    continue
                
                try:
                    # Generate filename
                    filename = self.sanitize_filename(name) + ".md"
                    filepath = os.path.join(self.builders_folder, filename)
                    
                    # Generate content
                    content = self.generate_obsidian_content(builder)
                    
                    # Write file
                    with open(filepath, 'w', encoding='utf-8') as out:
                        out.write(content)
                    
                    imported += 1
                    
                    if imported % 500 == 0:
                        print(f"  ✓ Imported {imported} builders...")
                
                except Exception as e:
                    print(f"  ❌ Error importing {name}: {e}")
                    errors += 1
        
        print(f"\n{'='*70}")
        print("📊 IMPORT SUMMARY")
        print(f"{'='*70}")
        print(f"  ✓ Imported: {imported}")
        print(f"  ⏭️  Skipped: {skipped}")
        print(f"  ❌ Errors: {errors}")
        print(f"\n  📁 Location: {self.builders_folder}")
        
        return imported


def generate_index_file(builders_folder, count):
    """Generate an index file for all builders"""
    index_content = f"""---
type: builder-index
title: "Builder/Development Company Index"
count: {count}
last_updated: {datetime.now().strftime('%Y-%m-%d')}
---

# 🏗️ Builder & Development Company Index

**Total Builders:** {count} companies  
**Last Updated:** {datetime.now().strftime('%Y-%m-%d %H:%M')}

## 📂 Categories

- [[Builders/_All_Builders|All Builders]]
- [[Builders/_Active_Developers|Active Developers]]
- [[Builders/_Land_Assemblers|Land Assemblers]]

## 🔍 Quick Search

Use these links to research builders:

| Resource | Link |
|----------|------|
| LIVABL | https://livabl.com |
| Tarion | https://www.tarion.com |
| HCRA | https://www.hcraontario.ca |
| LOOPNET | https://www.loopnet.com |

## 📋 Recently Added

See folder: `{builders_folder}`

---

*This index was auto-generated by BigDataClaw*
"""
    
    index_path = os.path.join(builders_folder, "_Index.md")
    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(index_content)
    
    print(f"  📝 Index file created: {index_path}")


if __name__ == "__main__":
    print("\n" + "="*70)
    print("🚀 BIGDATACLAW BUILDERS → OBSIDIAN IMPORTER")
    print("   Importing to ALL vaults")
    print("="*70)
    
    total_imported = 0
    
    for vault_path in VAULT_PATHS:
        vault_name = os.path.basename(vault_path)
        print(f"\n📁 Processing vault: {vault_name}")
        print("-"*70)
        
        # Determine builders subfolder based on vault structure
        if "Personal Vault" in vault_path:
            builders_subfolder = "Builders"  # Root level Builders folder
        else:
            builders_subfolder = "companies/Builders"  # BDAIV2 structure
        
        importer = ObsidianBuilderImporter(vault_path, builders_subfolder)
        
        # Import all builders
        count = importer.import_builders(limit=None)
        total_imported += count
        
        # Generate index for this vault
        generate_index_file(importer.builders_folder, count)
        
        print(f"  ✓ {count:,} builders imported to {vault_name}")
    
    print("\n" + "="*70)
    print("✅ BUILDERS IMPORT COMPLETE TO ALL VAULTS!")
    print("="*70)
    print(f"\nTotal: {total_imported:,} builder profiles across {len(VAULT_PATHS)} vaults")
    print("\nEach profile includes:")
    print("  • YAML frontmatter with company details")
    print("  • Quick Links (Google, LinkedIn, Social)")
    print("  • LOOPNET commercial search")
    print("  • LIVABL builder profile")
    print("  • Tarion & HCRA lookups")
    print("  • Research checklist")
    print("  • Outreach tracking table")
