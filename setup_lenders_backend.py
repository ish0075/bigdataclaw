#!/usr/bin/env python3
"""
Setup Lenders Backend for BigDataClaw
Imports 127K+ lenders to SQLite and creates API endpoints
"""

import sqlite3
import csv
import json
import re
from pathlib import Path
from datetime import datetime

DB_PATH = Path('bigdataclaw.db')
LENDERS_CSV = Path('QUICK_LINKS_LENDERS.csv')  # Use V1 with 127K records

def categorize_lender(name, domain):
    """Categorize lender by name and domain"""
    name_lower = name.lower()
    domain_lower = (domain or '').lower()
    
    # Bank keywords
    bank_keywords = ['bank', 'credit union', 'caisse', 'rbc', 'td', 'bmo', 'cibc', 'scotiabank']
    # Insurance keywords
    insurance_keywords = ['insurance', 'life', 'sun life', 'manulife', 'canada life']
    # Mortgage keywords
    mortgage_keywords = ['mortgage', 'lending', 'financial', 'capital', 'trust']
    # Private/Alternative keywords
    private_keywords = ['private', 'alternative', 'mic', 'investment corp']
    
    if any(kw in name_lower for kw in bank_keywords):
        return 'Bank'
    elif any(kw in name_lower for kw in insurance_keywords):
        return 'Insurance'
    elif any(kw in name_lower for kw in mortgage_keywords):
        return 'Mortgage Lender'
    elif any(kw in name_lower for kw in private_keywords):
        return 'Private Lender'
    else:
        return 'Other'

def determine_specializations(name, domain):
    """Determine asset specializations based on name/domain"""
    name_lower = name.lower()
    specs = []
    
    # Most lenders do commercial
    specs.append('Commercial')
    
    # Check for specific types
    if any(kw in name_lower for kw in ['construction', 'development', 'builder']):
        specs.append('Construction')
    if any(kw in name_lower for kw in ['land', 'development']):
        specs.append('Land')
    if any(kw in name_lower for kw in ['residential', 'home', 'mortgage']):
        specs.append('Residential')
    if any(kw in name_lower for kw in ['industrial']):
        specs.append('Industrial')
    if any(kw in name_lower for kw in ['retail']):
        specs.append('Retail')
    
    return specs

def create_lenders_table():
    """Create lenders table in SQLite"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Drop existing table if exists
    cursor.execute('DROP TABLE IF EXISTS lenders')
    cursor.execute('DROP TABLE IF EXISTS lenders_fts')
    
    # Create lenders table
    cursor.execute('''
        CREATE TABLE lenders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            domain TEXT,
            lender_type TEXT,
            asset_specializations TEXT,
            is_land_lender INTEGER DEFAULT 0,
            is_construction_lender INTEGER DEFAULT 0,
            is_commercial_lender INTEGER DEFAULT 1,
            phone TEXT,
            email TEXT,
            city TEXT,
            province TEXT,
            quick_links TEXT,  -- JSON
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create indexes
    cursor.execute('CREATE INDEX idx_lenders_name ON lenders(name)')
    cursor.execute('CREATE INDEX idx_lenders_type ON lenders(lender_type)')
    cursor.execute('CREATE INDEX idx_lenders_city ON lenders(city)')
    cursor.execute('CREATE INDEX idx_lenders_commercial ON lenders(is_commercial_lender)')
    
    # Create FTS for search
    cursor.execute('''
        CREATE VIRTUAL TABLE lenders_fts USING fts5(
            name, lender_type, asset_specializations,
            content='lenders', content_rowid='id'
        )
    ''')
    
    conn.commit()
    conn.close()
    print("✅ Lenders table created")

def import_lenders():
    """Import lenders from CSV"""
    print(f"\n🔄 Importing lenders from {LENDERS_CSV}...")
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    count = 0
    skipped = 0
    
    with open(LENDERS_CSV, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            try:
                name = row.get('name', '').strip()
                if not name:
                    skipped += 1
                    continue
                
                domain = row.get('domain', '')
                
                # Auto-categorize
                lender_type = categorize_lender(name, domain)
                specs = determine_specializations(name, domain)
                
                # Build quick links
                quick_links = {
                    'google': row.get('ql_google', f'https://www.google.com/search?q={name}'),
                    'contact': row.get('ql_contact_page', ''),
                    'linkedin': row.get('ql_linkedin', ''),
                    'linkedin_president': row.get('ql_linkedin_president', ''),
                    'facebook': row.get('ql_facebook', ''),
                    'instagram': row.get('ql_instagram', ''),
                    'twitter': row.get('ql_twitter', ''),
                    'website': row.get('ql_website', f'https://{domain}' if domain else ''),
                }
                
                # Check specializations
                is_land = 1 if 'Land' in specs else 0
                is_construction = 1 if 'Construction' in specs else 0
                
                # Insert lender
                cursor.execute('''
                    INSERT INTO lenders 
                    (name, domain, lender_type, asset_specializations, 
                     is_land_lender, is_construction_lender, is_commercial_lender,
                     quick_links)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    name,
                    domain,
                    lender_type,
                    '|'.join(specs),
                    is_land,
                    is_construction,
                    1,  # Most are commercial
                    json.dumps(quick_links)
                ))
                
                # Get the inserted ID
                lender_id = cursor.lastrowid
                
                # Insert into FTS
                cursor.execute('''
                    INSERT INTO lenders_fts (rowid, name, lender_type, asset_specializations)
                    VALUES (?, ?, ?, ?)
                ''', (lender_id, name, lender_type, '|'.join(specs)))
                
                count += 1
                
                if count % 5000 == 0:
                    conn.commit()
                    print(f"   Processed {count} lenders...")
                    
            except Exception as e:
                skipped += 1
                if skipped < 3:
                    print(f"   ⚠️  Error: {e}")
    
    conn.commit()
    conn.close()
    
    print(f"✅ Imported {count} lenders")
    print(f"⚠️  Skipped {skipped} rows")
    return count

def verify_import():
    """Verify the import"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Count total
    cursor.execute('SELECT COUNT(*) FROM lenders')
    total = cursor.fetchone()[0]
    print(f"\n📊 Total lenders in DB: {total:,}")
    
    # Count by type
    cursor.execute('''
        SELECT lender_type, COUNT(*) as cnt 
        FROM lenders 
        GROUP BY lender_type 
        ORDER BY cnt DESC 
        LIMIT 10
    ''')
    print("\n🏢 Lender Types:")
    for row in cursor.fetchall():
        print(f"   {row[0]}: {row[1]:,}")
    
    # Count by specialization
    cursor.execute('''
        SELECT 
            SUM(is_commercial_lender) as commercial,
            SUM(is_land_lender) as land,
            SUM(is_construction_lender) as construction
        FROM lenders
    ''')
    row = cursor.fetchone()
    print(f"\n🏗️  By Specialization:")
    print(f"   Commercial: {row[0]:,}")
    print(f"   Land: {row[1]:,}")
    print(f"   Construction: {row[2]:,}")
    
    # Test search
    cursor.execute('''
        SELECT l.name, l.lender_type 
        FROM lenders l
        JOIN lenders_fts fts ON l.id = fts.rowid
        WHERE lenders_fts MATCH 'RBC'
        LIMIT 5
    ''')
    print("\n🔍 Sample FTS Search 'RBC':")
    for row in cursor.fetchall():
        print(f"   {row[0]} ({row[1]})")
    
    conn.close()

def main():
    """Main setup function"""
    print("=" * 60)
    print("🏦 LENDERS BACKEND SETUP")
    print("=" * 60)
    
    if not LENDERS_CSV.exists():
        print(f"\n❌ Lenders CSV not found: {LENDERS_CSV}")
        return
    
    # Create tables
    create_lenders_table()
    
    # Import data
    count = import_lenders()
    
    # Verify
    verify_import()
    
    print("\n" + "=" * 60)
    print("✅ SETUP COMPLETE!")
    print("=" * 60)
    print(f"\nDatabase: {DB_PATH}")
    print(f"Total lenders: {count:,}")
    print("\nNext: Add lender endpoints to api_server.py")

if __name__ == '__main__':
    main()
