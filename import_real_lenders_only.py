#!/usr/bin/env python3
"""
Import ONLY actual lenders from CSV to SQLite.
Filters out real estate holding companies and numbered corps.
"""
import sqlite3
import csv
import json
import re

def is_lender_related(name):
    """Check if name contains lender-related keywords."""
    lender_keywords = [
        'BANK', 'BANQUE', 'MORTGAGE', 'CREDIT', 'FINANCIAL', 'FINANCE',
        'CAPITAL', 'TRUST', 'INSURANCE', 'LENDING', 'LENDER', 'LOAN',
        'INVESTMENT', 'FUND', 'EQUITY', 'VENTURES', 'REALTY',
        'CAISSE', 'UNION'
    ]
    name_upper = name.upper()
    return any(kw in name_upper for kw in lender_keywords)

def classify_lender_type(name):
    """Classify actual lender types."""
    name_upper = name.upper()
    
    if any(word in name_upper for word in ['BANK', 'BANQUE', 'BANCORP']):
        return 'Bank'
    elif any(word in name_upper for word in ['INSURANCE', 'ASSURANCE']):
        return 'Insurance'
    elif any(word in name_upper for word in ['MORTGAGE', 'TRUST']):
        return 'Mortgage Lender'
    elif any(word in name_upper for word in ['CREDIT UNION', 'CAISSE']):
        return 'Credit Union'
    elif any(word in name_upper for word in ['FINANCIAL', 'FINANCE', 'CAPITAL', 'INVESTMENT', 'EQUITY', 'VENTURES', 'FUND']):
        return 'Private Lender'
    else:
        return 'Other'

def import_lenders():
    csv_path = 'QUICK_LINKS_LENDERS.csv'
    db_path = 'bigdataclaw.db'
    
    print(f"Importing REAL LENDERS ONLY from {csv_path}...")
    print("Filtering out real estate holding companies and numbered corps...\n")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Clear existing lenders
    cursor.execute("DELETE FROM lenders")
    cursor.execute("DELETE FROM sqlite_sequence WHERE name='lenders'")
    print("Cleared existing lenders table")
    
    # Recreate FTS5
    cursor.execute("DROP TABLE IF EXISTS lenders_fts")
    cursor.execute('''
        CREATE VIRTUAL TABLE IF NOT EXISTS lenders_fts USING fts5(
            name,
            content='lenders',
            content_rowid='id'
        )
    ''')
    conn.commit()
    
    imported = 0
    skipped = 0
    batch = []
    
    with open(csv_path, 'r', encoding='utf-8', errors='ignore', newline='') as f:
        reader = csv.reader(f, quotechar='"', delimiter=',', quoting=csv.QUOTE_ALL)
        header = next(reader)
        col_map = {name: i for i, name in enumerate(header)}
        
        for row in reader:
            if len(row) < 5:
                continue
            
            try:
                name = row[col_map.get('name', 1)].strip()
                if not name or len(name) < 3:
                    continue
                
                # FILTER: Skip numbered companies (1001234 Ontario Inc)
                if re.match(r'^\d{5,}', name):
                    skipped += 1
                    continue
                
                # FILTER: Skip generic Ontario/BC/Alberta Inc/Ltd (unless lender-related)
                if re.search(r'\d{4,}\s+(Ontario|BC|Alberta|Manitoba|Canada)', name):
                    skipped += 1
                    continue
                
                # FILTER: Only keep lender-related names
                if not is_lender_related(name):
                    skipped += 1
                    continue
                
                domain = row[col_map.get('domain', 2)].strip() if col_map.get('domain') else ''
                linkedin = row[col_map.get('linkedin', 3)].strip() if col_map.get('linkedin') else ''
                
                lender_type = classify_lender_type(name)
                
                # Build quick links
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
                
                if 'website' not in quick_links and domain:
                    quick_links['website'] = f"https://{domain}"
                
                batch.append((
                    name,
                    domain,
                    lender_type,
                    'Commercial',
                    0, 0, 1,  # land, construction, commercial flags
                    None,  # phone
                    linkedin if linkedin else None,
                    None, None,  # city, province
                    json.dumps(quick_links) if quick_links else '{}'
                ))
                
                if len(batch) >= 500:
                    cursor.executemany('''
                        INSERT INTO lenders 
                        (name, domain, lender_type, asset_specializations, 
                         is_land_lender, is_construction_lender, is_commercial_lender,
                         phone, email, city, province, quick_links)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', batch)
                    conn.commit()
                    imported += len(batch)
                    if imported % 1000 == 0:
                        print(f"  Imported {imported} real lenders...")
                    batch = []
                    
            except Exception as e:
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
    
    print(f"\n✅ Imported {imported} REAL LENDERS")
    print(f"🗑️  Filtered out {skipped} non-lenders (holding companies, etc.)")
    
    # Rebuild FTS5
    cursor.execute("INSERT INTO lenders_fts(lenders_fts) VALUES('rebuild')")
    cursor.execute('INSERT INTO lenders_fts(rowid, name) SELECT id, name FROM lenders')
    conn.commit()
    
    # Stats
    print("\n📊 REAL LENDER Statistics:")
    cursor.execute("SELECT COUNT(*) FROM lenders")
    total = cursor.fetchone()[0]
    print(f"  Total verified lenders: {total}")
    
    cursor.execute("SELECT lender_type, COUNT(*) FROM lenders GROUP BY lender_type ORDER BY COUNT(*) DESC")
    for row in cursor.fetchall():
        print(f"  - {row[0]}: {row[1]}")
    
    # Sample of what we kept
    print("\n✅ Sample of ACTUAL LENDERS imported:")
    cursor.execute("SELECT name, lender_type FROM lenders ORDER BY RANDOM() LIMIT 15")
    for row in cursor.fetchall():
        print(f"  • {row[0]} ({row[1]})")
    
    conn.close()
    print(f"\n✅ Done! {total} verified lenders ready to use.")

if __name__ == "__main__":
    import_lenders()
