#!/usr/bin/env python3
"""
Import all 127K+ lenders from CSV to SQLite with full quick links.
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
    
    if any(word in name_upper for word in ['BANK', 'BANQUE', 'BANCORP', 'BANCORPORATION', 'BANCO']):
        return 'Bank'
    elif any(word in name_upper for word in ['INSURANCE', 'ASSURANCE', 'ASSURANCES', 'ASSURANCE-VIE', 'MUTUAL LIFE', 'LIFE INSURANCE']):
        return 'Insurance'
    elif any(word in name_upper for word in ['MORTGAGE', 'HYPOTHEQUE', 'HYPOTHECARY', 'TRUST COMPANY']):
        return 'Mortgage Lender'
    elif any(word in name_upper for word in ['CREDIT UNION', 'CAISSE', 'CREDIT', 'UNION', 'FINANCIAL', 'FINANCE', 'CAPITAL', 'INVESTMENT', 'INVESTMENTS', 'VENTURES', 'EQUITY', 'FUND', 'FUNDS', 'LENDING', 'LENDER', 'LOAN']):
        return 'Private Lender'
    else:
        return 'Other'

def extract_location(name):
    """Extract city/province from lender name if present."""
    provinces = ['Ontario', 'British Columbia', 'Alberta', 'Quebec', 'Manitoba', 
                 'Saskatchewan', 'Nova Scotia', 'New Brunswick', 'Newfoundland', 
                 'PEI', 'Prince Edward Island', 'Yukon', 'Northwest Territories', 'Nunavut']
    
    province_abbr = {
        'BC': 'British Columbia',
        'AB': 'Alberta', 
        'SK': 'Saskatchewan',
        'MB': 'Manitoba',
        'ON': 'Ontario',
        'QC': 'Quebec',
        'NB': 'New Brunswick',
        'NS': 'Nova Scotia',
        'NL': 'Newfoundland',
        'PE': 'Prince Edward Island',
    }
    
    city = None
    province = None
    
    # Check for province abbreviations in name
    for abbr, full in province_abbr.items():
        if f' {abbr} ' in name or name.endswith(f' {abbr}'):
            province = full
            break
    
    # Check for full province names
    if not province:
        for prov in provinces:
            if prov in name:
                province = prov
                break
    
    return city, province

def import_lenders():
    csv_path = 'QUICK_LINKS_LENDERS.csv'
    db_path = 'bigdataclaw.db'
    
    print(f"Starting import from {csv_path}...")
    print(f"Target database: {db_path}")
    
    # Count total lines
    with open(csv_path, 'r', encoding='utf-8', errors='ignore') as f:
        total = sum(1 for _ in f) - 1
    print(f"Total lenders to import: {total:,}")
    
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
    
    batch_size = 5000
    imported = 0
    batch = []
    
    with open(csv_path, 'r', encoding='utf-8', errors='ignore') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            name = row.get('name', '').strip()
            if not name:
                continue
            
            domain = row.get('domain', '').strip()
            lender_type = classify_lender_type(name)
            city, province = extract_location(name)
            
            # Build quick links JSON from all ql_ fields
            quick_links = {
                'google': row.get('ql_google', ''),
                'contact': row.get('ql_contact_page', ''),
                'linkedin': row.get('ql_linkedin', ''),
                'linkedin_president': row.get('ql_linkedin_president', ''),
                'facebook': row.get('ql_facebook', ''),
                'instagram': row.get('ql_instagram', ''),
                'twitter': row.get('ql_twitter', ''),
                'website': row.get('ql_website', f"https://{domain}" if domain else ''),
                'markdown': row.get('ql_markdown', ''),
                'html': row.get('ql_html', '')
            }
            
            # Clean up empty values
            quick_links = {k: v for k, v in quick_links.items() if v}
            
            batch.append((
                name,
                domain,
                lender_type,
                'Commercial',  # Default asset class
                0,  # is_land_lender
                0,  # is_construction_lender  
                1,  # is_commercial_lender
                None,  # phone
                row.get('linkedin', '').strip(),  # email/linkedin
                city,
                province,
                json.dumps(quick_links)
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
                print(f"  Imported {imported:,} / {total:,} ({imported/total*100:.1f}%)")
                batch = []
        
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
    
    conn.close()
    print(f"\n✅ Import complete! {total_lenders:,} lenders now available.")

if __name__ == "__main__":
    import_lenders()
