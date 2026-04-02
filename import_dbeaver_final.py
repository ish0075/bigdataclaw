#!/usr/bin/env python3
"""
Import DBeaver FINAL exports into SQLite database
- realtor_brokerages_final.csv: 3,917 brokerages
- realtor_brokers_final.csv: 18,674 brokers  
- realtor_salespersons_final.csv: 77,615 salespersons
"""

import csv
import sqlite3
import json
from pathlib import Path
from datetime import datetime

DB_PATH = 'bigdataclaw.db'
DB_EXPORT_DIR = 'dbeaver_final_exports'

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def import_brokerages():
    """Import brokerages from realtor_brokerages_final.csv"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Create brokerages table if not exists
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS dbeaver_brokerages (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            city TEXT,
            region TEXT,
            website TEXT,
            phone TEXT,
            broker_of_record TEXT,
            created_at TIMESTAMP,
            updated_at TIMESTAMP
        )
    ''')
    
    # Clear existing data
    cursor.execute('DELETE FROM dbeaver_brokerages')
    
    csv_path = Path(DB_EXPORT_DIR) / 'realtor_brokerages_final.csv'
    count = 0
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        
        for row in reader:
            if len(row) >= 9:
                try:
                    cursor.execute('''
                        INSERT INTO dbeaver_brokerages 
                        (id, name, city, region, website, phone, broker_of_record, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        int(row[0]), row[1], row[2] or None, row[3] or None, 
                        row[4] or None, row[5] or None, row[6] or None, row[7], row[8]
                    ))
                    count += 1
                except Exception as e:
                    pass  # Skip problematic rows
    
    conn.commit()
    conn.close()
    print(f"✅ Imported {count} brokerages")
    return count

def import_brokers():
    """Import brokers from realtor_brokers_final.csv"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS dbeaver_brokers (
            id INTEGER PRIMARY KEY,
            first_name TEXT,
            last_name TEXT,
            full_name TEXT NOT NULL,
            role TEXT,
            email TEXT,
            is_active INTEGER,
            is_broker INTEGER,
            is_salesperson INTEGER,
            phone TEXT,
            brokerage_id INTEGER,
            created_at TIMESTAMP,
            updated_at TIMESTAMP
        )
    ''')
    
    cursor.execute('DELETE FROM dbeaver_brokers')
    
    csv_path = Path(DB_EXPORT_DIR) / 'realtor_brokers_final.csv'
    count = 0
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        
        for row in reader:
            if len(row) >= 12:
                try:
                    cursor.execute('''
                        INSERT INTO dbeaver_brokers 
                        (id, first_name, last_name, full_name, role, email, is_active, is_broker, is_salesperson, phone, brokerage_id, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        int(row[0]), row[1], row[2], row[3], row[4], row[5] or None,
                        int(row[6]) if row[6] else 0, int(row[7]) if row[7] else 0, 
                        int(row[8]) if row[8] else 0, row[9] or None,
                        int(row[10]) if row[10] else None, row[11], row[12] if len(row) > 12 else row[11]
                    ))
                    count += 1
                except Exception as e:
                    pass
    
    conn.commit()
    conn.close()
    print(f"✅ Imported {count} brokers")
    return count

def import_salespersons():
    """Import salespersons from realtor_salespersons_final.csv"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS dbeaver_salespersons (
            id INTEGER PRIMARY KEY,
            first_name TEXT,
            last_name TEXT,
            full_name TEXT NOT NULL,
            role TEXT,
            email TEXT,
            is_active INTEGER,
            is_broker INTEGER,
            is_salesperson INTEGER,
            phone TEXT,
            brokerage_id INTEGER,
            created_at TIMESTAMP,
            updated_at TIMESTAMP
        )
    ''')
    
    cursor.execute('DELETE FROM dbeaver_salespersons')
    
    csv_path = Path(DB_EXPORT_DIR) / 'realtor_salespersons_final.csv'
    count = 0
    batch = []
    batch_size = 1000
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        
        for row in reader:
            if len(row) >= 12:
                try:
                    batch.append((
                        int(row[0]), row[1], row[2], row[3], row[4], row[5] or None,
                        int(row[6]) if row[6] else 0, int(row[7]) if row[7] else 0, 
                        int(row[8]) if row[8] else 0, row[9] or None,
                        int(row[10]) if row[10] else None, row[11], row[12] if len(row) > 12 else row[11]
                    ))
                    
                    if len(batch) >= batch_size:
                        cursor.executemany('''
                            INSERT INTO dbeaver_salespersons 
                            (id, first_name, last_name, full_name, role, email, is_active, is_broker, is_salesperson, phone, brokerage_id, created_at, updated_at)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ''', batch)
                        count += len(batch)
                        batch = []
                        if count % 10000 == 0:
                            print(f"  ... {count} salespersons imported")
                except Exception as e:
                    pass
    
    # Insert remaining batch
    if batch:
        cursor.executemany('''
            INSERT INTO dbeaver_salespersons 
            (id, first_name, last_name, full_name, role, email, is_active, is_broker, is_salesperson, phone, brokerage_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', batch)
        count += len(batch)
    
    conn.commit()
    conn.close()
    print(f"✅ Imported {count} salespersons")
    return count

def create_indexes():
    """Create indexes for better performance"""
    conn = get_db()
    cursor = conn.cursor()
    
    indexes = [
        'CREATE INDEX IF NOT EXISTS idx_brokerages_name ON dbeaver_brokerages(name)',
        'CREATE INDEX IF NOT EXISTS idx_brokerages_city ON dbeaver_brokerages(city)',
        'CREATE INDEX IF NOT EXISTS idx_brokers_name ON dbeaver_brokers(full_name)',
        'CREATE INDEX IF NOT EXISTS idx_brokers_brokerage ON dbeaver_brokers(brokerage_id)',
        'CREATE INDEX IF NOT EXISTS idx_salespersons_name ON dbeaver_salespersons(full_name)',
        'CREATE INDEX IF NOT EXISTS idx_salespersons_brokerage ON dbeaver_salespersons(brokerage_id)',
    ]
    
    for idx in indexes:
        try:
            cursor.execute(idx)
        except:
            pass
    
    conn.commit()
    conn.close()
    print("✅ Created indexes")

def generate_numbered_entity_mappings():
    """Generate mappings for numbered Ontario entities"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT name, website, city, COUNT(*) as office_count
        FROM dbeaver_brokerages
        WHERE name LIKE '%Ontario Inc.%' 
           OR name LIKE '%Ontario Limited%'
           OR name LIKE '%Ontario Ltd.%'
           OR name LIKE '%Ontario Incorporated%'
           OR name LIKE '%Ontario Corporation%'
           OR name LIKE '%Ontario Ltd%'
        GROUP BY name
        ORDER BY office_count DESC
    ''')
    
    numbered_entities = cursor.fetchall()
    conn.close()
    
    mappings = {}
    website_hints = {
        'rightathomerealty.com': 'Right at Home Realty',
        'davenportrealty.ca': 'Davenport Realty',
        'kwcomplete.com': 'Keller Williams Complete',
        'kw.com': 'Keller Williams',
        'royallepage.ca': 'Royal LePage',
        'century21.ca': 'Century 21',
        'remax': 'RE/MAX',
        'exitrealty': 'EXIT Realty',
        'engelvoelkers.com': 'Engel & Völkers',
        'coldwellbanker.ca': 'Coldwell Banker',
        'zuminrealestate.ca': 'Zumin Real Estate',
        'savemax': 'Save Max Realty',
        'homelifelandmark.com': 'HomeLife Landmark',
        'stormrealty.ca': 'Storm Realty',
        'teamblueforce.ca': 'Team Blue Force Realty',
        'teamrajpal.com': 'Team Rajpal Realty',
        'barbarabeers.com': 'Barbara Beers Realty',
        'assist2sell.com': 'Assist-2-Sell',
        'watersidegroup.ca': 'Waterside Group',
        'greenapplerealty.ca': 'Green Apple Realty',
        'ontariowiderealty.ca': 'Ontario Wide Realty',
        'boardwalkottawa.com': 'Boardwalk Ottawa Realty',
        'gordongroup.net': 'Gordon Group Realty',
        'steveaugustine.com': 'Steve Augustine Realty',
        'ffaf.ca': 'FFAF Realty',
        'zolo': 'Zolo Realty',
        'ipro': 'iPro Realty',
        'exp': 'eXp Realty',
    }
    
    for entity in numbered_entities:
        name, website, city, office_count = entity
        clean_name = name
        
        # Try to identify by website
        if website:
            for hint, brand in website_hints.items():
                if hint.lower() in website.lower():
                    clean_name = brand
                    break
        
        mappings[name] = {
            'clean_name': clean_name,
            'website': website,
            'city': city,
            'office_count': office_count
        }
    
    # Save mappings
    with open('numbered_entity_mappings.json', 'w') as f:
        json.dump(mappings, f, indent=2)
    
    print(f"✅ Generated mappings for {len(mappings)} numbered entities")
    print(f"   Saved to numbered_entity_mappings.json")
    
    return mappings

def main():
    print("=" * 60)
    print("Importing DBeaver FINAL Exports")
    print("=" * 60)
    print()
    
    start_time = datetime.now()
    
    # Import data
    brokerage_count = import_brokerages()
    broker_count = import_brokers()
    salesperson_count = import_salespersons()
    
    # Create indexes
    create_indexes()
    
    # Generate mappings
    generate_numbered_entity_mappings()
    
    # Summary
    duration = (datetime.now() - start_time).total_seconds()
    print()
    print("=" * 60)
    print("Import Complete!")
    print("=" * 60)
    print(f"Brokerages:   {brokerage_count:,}")
    print(f"Brokers:      {broker_count:,}")
    print(f"Salespersons: {salesperson_count:,}")
    print(f"Duration:     {duration:.1f} seconds")
    print("=" * 60)

if __name__ == '__main__':
    main()
