#!/usr/bin/env python3
"""
Setup Hot Money Leads table in SQLite database
"""

import sqlite3
import json
from pathlib import Path

DB_PATH = 'bigdataclaw.db'

def setup_hotmoney_table():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create hot_money_leads table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS hot_money_leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            entity TEXT NOT NULL,
            cash_amount INTEGER NOT NULL,
            sale_date TEXT,
            location TEXT,
            property TEXT,
            match_score INTEGER DEFAULT 0,
            property_type TEXT,
            asset_class TEXT,
            address TEXT,
            days_ago INTEGER DEFAULT 0,
            notes TEXT,
            contacts TEXT,  -- JSON array
            enriched_data TEXT,  -- JSON object with LLM enrichment
            enrichment_status TEXT DEFAULT '',  -- pending/running/complete/failed
            enrichment_timestamp TIMESTAMP,
            obsidian_path TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create indexes
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_hotmoney_entity ON hot_money_leads(entity)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_hotmoney_location ON hot_money_leads(location)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_hotmoney_cash ON hot_money_leads(cash_amount)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_hotmoney_property_type ON hot_money_leads(property_type)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_hotmoney_enrichment ON hot_money_leads(enrichment_status)')
    
    # Insert sample data if table is empty
    cursor.execute('SELECT COUNT(*) FROM hot_money_leads')
    if cursor.fetchone()[0] == 0:
        sample_data = [
            ('2650687 Ontario Ltd', 15000000, 'May 2025', 'West Lincoln', 'Thirty Rd, West Lincoln', 92, 'Industrial', 'Industrial Warehouse', '1230 Thirty Rd, West Lincoln, ON L0R 2A0', 15, '', json.dumps([])),
            ('Turnberry Holdings Inc', 9840000, 'Jan 2025', 'Lincoln', '4556-4568 Lincoln Ave', 88, 'Mixed-Use', 'Retail/Office Mixed-Use', '4556-4568 Lincoln Ave, Beamsville, ON L0R 1B0', 45, '', json.dumps([])),
            ('1863570 Ontario Inc', 7000000, 'Jan 2025', 'Pelham', '981 Pelham St', 85, 'Industrial', 'Distribution Center', '981 Pelham St, Pelham, ON L0S 1E0', 60, '', json.dumps([])),
            ('Landtract Ltd', 5600000, 'Feb 2025', 'Grimsby', 'Winston Rd / Kelson Ave N', 82, 'Land', 'Development Land', 'Winston Rd & Kelson Ave N, Grimsby, ON L3M', 30, '', json.dumps([])),
            ('TM Vines Inc', 4200000, 'Oct 2025', 'Niagara-on-the-Lake', '1895 Concession 4 Rd', 90, 'Agricultural', 'Vineyard/Farmland', '1895 Concession 4 Rd, Niagara-on-the-Lake, ON L0S 1J0', 5, '', json.dumps([])),
            ('2258324 Ontario Ltd', 3880000, 'Sep 2025', 'Pelham', '325 Church St', 87, 'Industrial', 'Manufacturing Facility', '325 Church St, Pelham, ON L0S 1E0', 12, '', json.dumps([])),
        ]
        
        cursor.executemany('''
            INSERT INTO hot_money_leads 
            (entity, cash_amount, sale_date, location, property, match_score, property_type, asset_class, address, days_ago, notes, contacts)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', sample_data)
        
        print(f"✅ Inserted {len(sample_data)} sample hot money leads")
    
    conn.commit()
    conn.close()
    print("✅ Hot Money Leads table created successfully")

if __name__ == '__main__':
    setup_hotmoney_table()
