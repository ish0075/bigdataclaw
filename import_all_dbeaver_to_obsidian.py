#!/usr/bin/env python3
"""
Complete DBeaver Data Import to Obsidian Main Working Vault
Imports: Companies, Brokerages, Brokers, Salespersons, Lenders, Company Contacts
Target: /home/jamie/Desktop/Jamie's Personal Vault (Main Working Vault)
"""

import csv
import json
import sqlite3
import os
from datetime import datetime
from pathlib import Path

# Configuration
VAULT_PATH = "/home/jamie/Desktop/Jamie's Personal Vault"
DB_PATH = "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/bigdataclaw.db"
EXPORT_DIR = "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/dbeaver_final_exports"

# Import limits (manageable chunks for Obsidian)
LIMITS = {
    'companies': 1000,          # Top 1000 companies
    'brokerages': None,         # All brokerages (3,918)
    'brokers': 2000,            # Top 2000 brokers
    'salespersons': 5000,       # Top 5000 salespersons
    'lenders': None,            # All lenders (5,114)
    'company_contacts': 2000,   # Top 2000 contacts
}

class ObsidianImporter:
    def __init__(self):
        self.db = sqlite3.connect(DB_PATH)
        self.db.row_factory = sqlite3.Row
        self.cursor = self.db.cursor()
        self.stats = {
            'companies': 0,
            'brokerages': 0,
            'brokers': 0,
            'salespersons': 0,
            'lenders_exported': 0,
            'company_contacts': 0
        }
        
    def sanitize_filename(self, name, max_length=50):
        """Create safe filename from name"""
        if not name:
            return "unnamed"
        name = str(name).strip()
        invalid_chars = '<>:"/\\|?*'
        for char in invalid_chars:
            name = name.replace(char, '_')
        name = name.replace(' ', '_')
        if len(name) > max_length:
            name = name[:max_length]
        return name if name else "unnamed"
    
    def create_frontmatter(self, data):
        """Create YAML frontmatter for Obsidian"""
        frontmatter = ["---"]
        for key, value in data.items():
            if value is None:
                continue
            if isinstance(value, list):
                frontmatter.append(f"{key}:")
                for item in value:
                    frontmatter.append(f"  - {item}")
            elif isinstance(value, bool):
                frontmatter.append(f"{key}: {str(value).lower()}")
            elif isinstance(value, (int, float)):
                frontmatter.append(f"{key}: {value}")
            else:
                escaped = str(value).replace('"', '\\"')
                frontmatter.append(f'{key}: "{escaped}"')
        frontmatter.append("---")
        return "\n".join(frontmatter)
    
    def write_obsidian_file(self, folder, filename, content):
        """Write markdown file to Obsidian vault"""
        folder_path = Path(VAULT_PATH) / folder
        folder_path.mkdir(parents=True, exist_ok=True)
        file_path = folder_path / f"{filename}.md"
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        except Exception as e:
            print(f"Error writing {file_path}: {e}")
            return False
    
    def import_companies(self):
        """Import top companies from builders CSV"""
        print("\n🏢 IMPORTING COMPANIES (Builders)...")
        
        # Use QUICK_LINKS_BUILDERS for enriched builder data
        builders_path = Path("/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/QUICK_LINKS_BUILDERS.csv")
        
        if not builders_path.exists():
            print(f"  ⚠️ Builders file not found: {builders_path}")
            return 0
        
        count = 0
        with open(builders_path, 'r', encoding='utf-8', errors='ignore') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if count >= LIMITS['companies']:
                    break
                
                company_name = row.get('builder_name', row.get('company_name', '')).strip()
                if not company_name:
                    continue
                
                # Create Obsidian note
                safe_name = self.sanitize_filename(company_name)
                filename = f"Company_{count+1:04d}_{safe_name}"
                
                frontmatter_data = {
                    'type': 'company',
                    'company_name': company_name,
                    'address': row.get('address', ''),
                    'city': row.get('city', ''),
                    'province': row.get('province', ''),
                    'postal_code': row.get('postal_code', ''),
                    'phone': row.get('phone', ''),
                    'website': row.get('ql_website', ''),
                    'is_builder': True,
                    'imported_at': datetime.now().isoformat(),
                    'source': 'quick_links_builders'
                }
                
                content_lines = [
                    self.create_frontmatter(frontmatter_data),
                    "",
                    f"# {company_name}",
                    "",
                    "## Company Information",
                    f"- **Type:** Builder/Developer",
                    f"- **Address:** {row.get('address', 'N/A')}",
                    f"- **City:** {row.get('city', 'N/A')}",
                    f"- **Province:** {row.get('province', 'N/A')}",
                    f"- **Postal Code:** {row.get('postal_code', 'N/A')}",
                    f"- **Phone:** {row.get('phone', 'N/A')}",
                    "",
                    "## 🔍 Quick Links",
                    ""
                ]
                
                # Add available quick links
                quick_links = [
                    ('Google Search', row.get('ql_google', '')),
                    ('Website', row.get('ql_website', '')),
                    ('LinkedIn', row.get('ql_linkedin', '')),
                    ('Contact Page', row.get('ql_contact_page', '')),
                    ('LoopNet', row.get('ql_loopnet', '')),
                    ('Past Projects', row.get('ql_past_projects', '')),
                    ('Tarion', row.get('ql_tarion', '')),
                    ('HCRA', row.get('ql_hCRA', '')),
                ]
                
                for label, url in quick_links:
                    if url and url.strip():
                        content_lines.append(f"- [{label}]({url})")
                
                content_lines.extend([
                    "",
                    "## Notes",
                    "",
                    "_Add notes about this company here..._"
                ])
                
                content = "\n".join(content_lines)
                
                if self.write_obsidian_file("Companies/Firms", filename, content):
                    count += 1
                    if count % 100 == 0:
                        print(f"  ✓ Imported {count} companies...")
        
        self.stats['companies'] = count
        print(f"  ✅ Imported {count} companies to Companies/Firms/")
        return count
    
    def import_brokerages(self):
        """Import all brokerages from database"""
        print("\n🏛️ IMPORTING BROKERAGES...")
        
        query = """
            SELECT 
                id as brokerage_id,
                name as legal_name,
                name as trade_name,
                city,
                region as province,
                website,
                phone,
                broker_of_record,
                created_at,
                updated_at
            FROM dbeaver_brokerages
            ORDER BY name
        """
        
        if LIMITS['brokerages']:
            query += f" LIMIT {LIMITS['brokerages']}"
        
        count = 0
        for row in self.cursor.execute(query):
            brokerage_id = row['brokerage_id']
            legal_name = row['legal_name'] or row['trade_name'] or f"Brokerage_{brokerage_id}"
            trade_name = row['trade_name'] or legal_name
            
            safe_name = self.sanitize_filename(trade_name or legal_name)
            filename = f"Brokerage_{brokerage_id:05d}_{safe_name}"
            
            frontmatter_data = {
                'type': 'brokerage',
                'brokerage_id': brokerage_id,
                'legal_name': legal_name,
                'trade_name': trade_name,
                'city': row['city'],
                'province': row['province'],
                'phone': row['phone'],
                'website': row['website'],
                'broker_of_record': row['broker_of_record'],
                'imported_at': datetime.now().isoformat(),
                'source': 'dbeaver_brokerages'
            }
            
            content = f"""{self.create_frontmatter(frontmatter_data)}

# {trade_name}

## Brokerage Information
| Field | Value |
|-------|-------|
| **Legal Name** | {legal_name} |
| **Trade Name** | {trade_name} |
| **City** | {row['city'] or 'N/A'} |
| **Province** | {row['province'] or 'N/A'} |
| **Phone** | {row['phone'] or 'N/A'} |
| **Website** | {row['website'] or 'N/A'} |

## Leadership
- **Broker of Record:** {row['broker_of_record'] or 'N/A'}

## 🔗 Related
- [[Companies]]
- [[Recruiters]]

## Notes
_Add notes about this brokerage here..._
"""
            
            if self.write_obsidian_file("Companies/Brokerages", filename, content):
                count += 1
                if count % 500 == 0:
                    print(f"  ✓ Imported {count} brokerages...")
        
        self.stats['brokerages'] = count
        print(f"  ✅ Imported {count} brokerages to Companies/Brokerages/")
        return count
    
    def import_brokers(self):
        """Import top brokers"""
        print("\n👔 IMPORTING BROKERS...")
        
        query = """
            SELECT 
                id as broker_id,
                first_name,
                last_name,
                full_name,
                email,
                phone,
                brokerage_id,
                is_active,
                role
            FROM dbeaver_brokers
            ORDER BY id
        """
        
        if LIMITS['brokers']:
            query += f" LIMIT {LIMITS['brokers']}"
        
        count = 0
        for row in self.cursor.execute(query):
            broker_id = row['broker_id']
            full_name = row['full_name'] or f"{row['first_name'] or ''} {row['last_name'] or ''}".strip()
            if not full_name:
                full_name = f"Broker_{broker_id}"
            
            safe_name = self.sanitize_filename(full_name)
            filename = f"Broker_{broker_id:06d}_{safe_name}"
            
            frontmatter_data = {
                'type': 'broker',
                'broker_id': broker_id,
                'first_name': row['first_name'],
                'last_name': row['last_name'],
                'full_name': full_name,
                'email': row['email'],
                'phone': row['phone'],
                'role': row['role'],
                'brokerage_id': row['brokerage_id'],
                'is_active': bool(row['is_active']),
                'imported_at': datetime.now().isoformat(),
                'source': 'dbeaver_brokers'
            }
            
            content = f"""{self.create_frontmatter(frontmatter_data)}

# {full_name}

## Contact Information
| Field | Value |
|-------|-------|
| **Name** | {full_name} |
| **Email** | {row['email'] or 'N/A'} |
| **Phone** | {row['phone'] or 'N/A'} |
| **Role:** | {row['role'] or 'N/A'} |

## Brokerage
- **Brokerage ID:** {row['brokerage_id']}
- **Status:** {'🟢 Active' if row['is_active'] else '🔴 Inactive'}

## 🔗 Related
- [[Companies/Brokerages]]
- [[Recruiters]]

## Notes
_Add notes about this broker here..._
"""
            
            if self.write_obsidian_file("People/Brokers", filename, content):
                count += 1
                if count % 500 == 0:
                    print(f"  ✓ Imported {count} brokers...")
        
        self.stats['brokers'] = count
        print(f"  ✅ Imported {count} brokers to People/Brokers/")
        return count
    
    def import_salespersons(self):
        """Import top salespersons"""
        print("\n👤 IMPORTING SALESPERSONS...")
        
        query = """
            SELECT 
                id as salesperson_id,
                first_name,
                last_name,
                full_name,
                email,
                phone,
                brokerage_id,
                is_active,
                role
            FROM dbeaver_salespersons
            ORDER BY id
        """
        
        if LIMITS['salespersons']:
            query += f" LIMIT {LIMITS['salespersons']}"
        
        count = 0
        for row in self.cursor.execute(query):
            salesperson_id = row['salesperson_id']
            full_name = row['full_name'] or f"{row['first_name'] or ''} {row['last_name'] or ''}".strip()
            if not full_name:
                full_name = f"Salesperson_{salesperson_id}"
            
            safe_name = self.sanitize_filename(full_name)
            filename = f"Salesperson_{salesperson_id:06d}_{safe_name}"
            
            frontmatter_data = {
                'type': 'salesperson',
                'salesperson_id': salesperson_id,
                'first_name': row['first_name'],
                'last_name': row['last_name'],
                'full_name': full_name,
                'email': row['email'],
                'phone': row['phone'],
                'role': row['role'],
                'brokerage_id': row['brokerage_id'],
                'is_active': bool(row['is_active']),
                'imported_at': datetime.now().isoformat(),
                'source': 'dbeaver_salespersons'
            }
            
            content = f"""{self.create_frontmatter(frontmatter_data)}

# {full_name}

## Contact Information
| Field | Value |
|-------|-------|
| **Name** | {full_name} |
| **Email** | {row['email'] or 'N/A'} |
| **Phone** | {row['phone'] or 'N/A'} |
| **Role:** | {row['role'] or 'N/A'} |

## Brokerage
- **Brokerage ID:** {row['brokerage_id']}
- **Status:** {'🟢 Active' if row['is_active'] else '🔴 Inactive'}

## 🔗 Related
- [[Companies/Brokerages]]
- [[Recruiters]]

## Notes
_Add notes about this salesperson here..._
"""
            
            if self.write_obsidian_file("People/Salespersons", filename, content):
                count += 1
                if count % 1000 == 0:
                    print(f"  ✓ Imported {count} salespersons...")
        
        self.stats['salespersons'] = count
        print(f"  ✅ Imported {count} salespersons to People/Salespersons/")
        return count
    
    def import_lenders(self):
        """Import all lenders from database to Obsidian"""
        print("\n🏦 IMPORTING LENDERS...")
        
        query = """
            SELECT 
                id,
                name,
                domain,
                lender_type,
                asset_specializations,
                is_land_lender,
                is_construction_lender,
                is_commercial_lender,
                phone,
                email,
                city,
                province,
                quick_links
            FROM lenders
            ORDER BY name
        """
        
        count = 0
        for row in self.cursor.execute(query):
            lender_id = row['id']
            name = row['name'] or f"Lender_{lender_id}"
            
            safe_name = self.sanitize_filename(name)
            filename = f"Lender_{lender_id:04d}_{safe_name}"
            
            # Parse quick links if available
            quick_links = {}
            if row['quick_links']:
                try:
                    quick_links = json.loads(row['quick_links'])
                except:
                    pass
            
            # Build specialties list
            specialties = []
            if row['asset_specializations']:
                specialties = row['asset_specializations'].split(',')
            if row['is_land_lender']:
                specialties.append('Land Lending')
            if row['is_construction_lender']:
                specialties.append('Construction Lending')
            if row['is_commercial_lender']:
                specialties.append('Commercial Lending')
            
            frontmatter_data = {
                'type': 'lender',
                'lender_id': lender_id,
                'name': name,
                'lender_type': row['lender_type'],
                'asset_specializations': specialties,
                'domain': row['domain'],
                'email': row['email'],
                'phone': row['phone'],
                'city': row['city'],
                'province': row['province'],
                'is_land_lender': bool(row['is_land_lender']),
                'is_construction_lender': bool(row['is_construction_lender']),
                'is_commercial_lender': bool(row['is_commercial_lender']),
                'imported_at': datetime.now().isoformat(),
                'source': 'lenders_table'
            }
            
            content_lines = [
                self.create_frontmatter(frontmatter_data),
                "",
                f"# {name}",
                "",
                "## Lender Information",
                f"- **Type:** {row['lender_type'] or 'N/A'}",
                f"- **Domain:** {row['domain'] or 'N/A'}",
                "",
                "## Specializations",
            ]
            
            for spec in specialties:
                content_lines.append(f"- {spec.strip()}")
            
            content_lines.extend([
                "",
                "## Contact",
                f"- **Email:** {row['email'] or 'N/A'}",
                f"- **Phone:** {row['phone'] or 'N/A'}",
                f"- **City:** {row['city'] or 'N/A'}",
                f"- **Province:** {row['province'] or 'N/A'}",
                ""
            ])
            
            # Add quick links if available
            if quick_links:
                content_lines.extend([
                    "## 🔍 Quick Links",
                    ""
                ])
                for key, url in quick_links.items():
                    if url:
                        label = key.replace('_', ' ').title()
                        content_lines.append(f"- [{label}]({url})")
                content_lines.append("")
            
            content_lines.extend([
                "## 🔗 Related",
                "- [[Lenders]]",
                "",
                "## Notes",
                "",
                "_Add notes about this lender here..._"
            ])
            
            content = "\n".join(content_lines)
            
            if self.write_obsidian_file("Companies/Lenders", filename, content):
                count += 1
                if count % 200 == 0:
                    print(f"  ✓ Exported {count} lenders...")
        
        self.stats['lenders_exported'] = count
        print(f"  ✅ Exported {count} lenders to Companies/Lenders/")
        return count
    
    def create_index_files(self):
        """Create index/overview files for each category"""
        print("\n📚 CREATING INDEX FILES...")
        
        indexes = {
            "Companies/🏢 Companies Index.md": {
                "title": "Companies Index",
                "description": "Real estate companies, brokerages, and lenders",
                "folders": ["Firms", "Brokerages", "Lenders"]
            },
            "People/👥 People Index.md": {
                "title": "People Index",
                "description": "Brokers, salespersons, and contacts",
                "folders": ["Brokers", "Salespersons"]
            },
            "Deals/ Deals Index.md": {
                "title": "Deals Index",
                "description": "Property transactions and deals",
                "folders": ["Transactions"]
            },
            "Buyers/🏢 Buyers Index.md": {
                "title": "Buyers Index",
                "description": "Buyer prospects and companies",
                "folders": ["Prospects"]
            }
        }
        
        for filepath, data in indexes.items():
            folder_list = "\n".join([f"- [[{f}/]]" for f in data['folders']])
            content = f"""---
type: index
title: "{data['title']}"
created: {datetime.now().isoformat()}
---

# {data['title']}

{data['description']}

## Folders
{folder_list}

## Statistics
- **Companies:** {self.stats['companies']} firms imported
- **Brokerages:** {self.stats['brokerages']} brokerages imported
- **Brokers:** {self.stats['brokers']} brokers imported
- **Salespersons:** {self.stats['salespersons']} salespersons imported
- **Lenders:** {self.stats['lenders_exported']} lenders exported

---
*Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M')}*
"""
            full_path = Path(VAULT_PATH) / filepath
            full_path.parent.mkdir(parents=True, exist_ok=True)
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  ✓ Created {filepath}")
    
    def print_summary(self):
        """Print import summary"""
        print("\n" + "="*60)
        print("📊 IMPORT SUMMARY")
        print("="*60)
        total = sum(self.stats.values())
        print(f"  🏢 Companies:       {self.stats['companies']:,}")
        print(f"  🏛️ Brokerages:      {self.stats['brokerages']:,}")
        print(f"  👔 Brokers:         {self.stats['brokers']:,}")
        print(f"  👤 Salespersons:    {self.stats['salespersons']:,}")
        print(f"  🏦 Lenders:         {self.stats['lenders_exported']:,}")
        print("-"*60)
        print(f"  📁 TOTAL:           {total:,} entities")
        print("="*60)
        print(f"\n📂 All files exported to: {VAULT_PATH}")
    
    def run(self):
        """Run complete import"""
        print("🚀 STARTING COMPLETE DBEAVER IMPORT TO OBSIDIAN")
        print(f"   Target: {VAULT_PATH}")
        print(f"   Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        self.import_companies()
        self.import_brokerages()
        self.import_brokers()
        self.import_salespersons()
        self.import_lenders()
        self.create_index_files()
        
        self.print_summary()
        
        self.db.close()
        print("\n✅ IMPORT COMPLETE!")

if __name__ == "__main__":
    importer = ObsidianImporter()
    importer.run()
