#!/usr/bin/env python3
"""
Import all lenders from CSV to SQLite with full quick links.
Handles multiline CSV content properly.
"""
import sqlite3
import csv
import json
import re
from datetime import datetime
from pathlib import Path

def classify_lender_type(name):
    """Classify lender type based on name."""
    name_upper = name.upper()
    
    bank_terms = ['BANK', 'BANQUE', 'BANCORP', 'BANCORPORATION', 'BANCO', 'ROYAL', 'TD ', 'SCOTIA', 'CIBC', 'RBC', 'BMO']
    insurance_terms = ['INSURANCE', 'ASSURANCE', 'ASSURANCES', 'LIFE', 'MUTUAL', 'SUN LIFE', 'MANULIFE']
    mortgage_terms = ['MORTGAGE', 'HYPOTHEQUE', 'HYPOTHECARY', 'TRUST COMPANY', 'TRUSTCO']
    private_terms = ['CREDIT UNION', 'CAISSE', 'FINANCIAL', 'FINANCE', 'CAPITAL', 'INVESTMENT', 
                     'VENTURES', 'EQUITY', 'FUND', 'LENDING', 'LENDER', 'LOAN', 'PRIVATE']
    
    if any(term in name_upper for term in bank_terms):
        return 'Bank'
    elif any(term in name_upper for term in insurance_terms):
        return 'Insurance'
    elif any(term in name_upper for term in mortgage_terms):
        return 'Mortgage Lender'
    elif any(term in name_upper for term in private_terms):
        return 'Private Lender'
    else:
        return 'Other'

def extract_location(name):
    """Extract province from lender name if present."""
    province_abbr = {
        ' BC ': 'British Columbia',
        ' AB ': 'Alberta', 
        ' SK ': 'Saskatchewan',
        ' MB ': 'Manitoba',
        ' ON ': 'Ontario',
        ' QC ': 'Quebec',
        ' NB ': 'New Brunswick',
        ' NS ': 'Nova Scotia',
        ' NL ': 'Newfoundland',
        ' PE ': 'Prince Edward Island',
    }
    
    provinces = ['British Columbia', 'Alberta', 'Saskatchewan', 'Manitoba', 
                 'Ontario', 'Quebec', 'New Brunswick', 'Nova Scotia', 
                 'Newfoundland', 'Prince Edward Island', 'Yukon']
    
    province = None
    
    # Check for abbreviations
    for abbr, full in province_abbr.items():
        if abbr in name.upper() + ' ':
            province = full
            break
    
    # Check for full names
    if not province:
        for prov in provinces:
            if prov in name:
                province = prov
                break
    
    return province

def import_lenders():
    csv_path = 'QUICK_LINKS_LENDERS.csv'
    db_path = 'bigdataclaw.db'
    
    print(f"Starting import from {csv_path}...")
    print(f"Target database: {db_path}")
    
    # Connect to database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Clear existing lenders
    cursor.execute("DELETE FROM lenders")
    cursor.execute("DELETE FROM sqlite_sequence WHERE name='lenders'")
    print("Cleared existing lenders table")
    
    # Create FTS5 virtual table if not exists
    cursor.execute("DROP TABLE IF EXISTS lenders_fts")
    cursor.execute('''
        CREATE VIRTUAL TABLE IF NOT EXISTS lenders_fts USING fts5(
            name,
            content='lenders',
            content_rowid='id'
        )
    ''')
    conn.commit()
    
    batch_size = 1000
    imported = 0
    skipped = 0
    batch = []
    
    with open(csv_path, 'r', encoding='utf-8', errors='ignore', newline='') as f:
        # Use csv.reader with proper quote handling for multiline fields
        reader = csv.reader(f, quotechar='"', delimiter=',', quoting=csv.QUOTE_ALL)
        
        # Skip header
        header = next(reader)
        print(f"CSV columns: {len(header)}")
        
        # Map column indices
        col_map = {name: i for i, name in enumerate(header)}
        
        for row in reader:
            if len(row) < 5:
                skipped += 1
                continue
            
            try:
                name = row[col_map.get('name', 1)].strip()
                if not name or len(name) < 2:
                    skipped += 1
                    continue
                
                domain = row[col_map.get('domain', 2)].strip() if col_map.get('domain') else ''
                linkedin = row[col_map.get('linkedin', 3)].strip() if col_map.get('linkedin') else ''
                
                lender_type = classify_lender_type(name)
                province = extract_location(name)
                
                # Build quick links JSON
                quick_links = {}
                ql_fields = {
                    'google': 'ql_google',
                    'contact': 'ql_contact_page', 
                    'linkedin': 'ql_linkedin',
                    'linkedin_president': 'ql_linkedin_president',
                    'facebook': 'ql_facebook',
                    'instagram': 'ql_instagram',
                    'twitter': 'ql_twitter',
                    'website': 'ql_website',
                    'markdown': 'ql_markdown',
                    'html': 'ql_html'
                }
                
                for key, col_name in ql_fields.items():
                    idx = col_map.get(col_name)
                    if idx is not None and idx < len(row):
                        val = row[idx].strip()
                        if val:
                            quick_links[key] = val
                
                # Add website from domain if not present
                if 'website' not in quick_links and domain:
                    quick_links['website'] = f"https://{domain}"
                
                batch.append((
                    name,
                    domain,
                    lender_type,
                    'Commercial',  # Default asset class
                    0,  # is_land_lender
                    0,  # is_construction_lender  
                    1,  # is_commercial_lender
                    None,  # phone
                    linkedin if linkedin else None,  # email/linkedin
                    province,  # city (using province for now)
                    province,
                    json.dumps(quick_links) if quick_links else '{}'
                ))
                
                if len(batch) >= batch_size:
                    cursor.executemany('''
                        INSERT INTO lenders 
                        (name, domain, lender_type, asset_specializations, 
                         is_land_lender, is_construction_lender, is_commercial_lender,
                         phone, email, city, province, quick_links)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', batch)
                    conn.commit()
                    imported += len(batch)
                    if imported % 10000 == 0:
                        print(f"  Imported {imported:,}...")
                    batch = []
                    
            except Exception as e:
                skipped += 1
                continue
        
        # Insert remaining
        if batch:
            cursor.executemany('''
                INSERT INTO lenders 
                (name, domain, lender_type, asset_specializations, 
                 is_land_lender, is_construction_lender, is_commercial_lender,
                 phone, email, city, province, quick_links)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', batch)
            conn.commit()
            imported += len(batch)
    
    print(f"\n✅ Imported {imported:,} lenders")
    print(f"⚠️  Skipped {skipped:,} invalid rows")
    
    # Rebuild FTS5 index
    print("\nRebuilding FTS5 search index...")
    cursor.execute("INSERT INTO lenders_fts(lenders_fts) VALUES('rebuild')")
    cursor.execute('''
        INSERT INTO lenders_fts(rowid, name)
        SELECT id, name FROM lenders
    ''')
    conn.commit()
    print("✅ FTS5 index rebuilt")
    
    # Generate stats
    print("\n📊 Lender Statistics:")
    cursor.execute("SELECT COUNT(*) FROM lenders")
    total_lenders = cursor.fetchone()[0]
    print(f"  Total lenders: {total_lenders:,}")
    
    cursor.execute("SELECT lender_type, COUNT(*) FROM lenders GROUP BY lender_type ORDER BY COUNT(*) DESC")
    for row in cursor.fetchall():
        print(f"  - {row[0]}: {row[1]:,}")
    
    cursor.execute("SELECT province, COUNT(*) FROM lenders WHERE province IS NOT NULL GROUP BY province ORDER BY COUNT(*) DESC LIMIT 10")
    print("\n📍 Top Provinces:")
    for row in cursor.fetchall():
        print(f"  - {row[0]}: {row[1]:,}")
    
    # Check quick links coverage
    cursor.execute("SELECT COUNT(*) FROM lenders WHERE quick_links IS NOT NULL AND quick_links != '{}' AND quick_links != ''")
    with_links = cursor.fetchone()[0]
    print(f"\n🔗 Lenders with quick links: {with_links:,} ({with_links/total_lenders*100:.1f}%)")
    
    conn.close()
    print(f"\n✅ Import complete! {total_lenders:,} lenders now available.")

if __name__ == "__main__":
    import_lenders()
