#!/usr/bin/env python3
"""
Setup SQLite Backend for BigDataClaw
Migrates all data to SQLite for fast queries
"""

import json
import sqlite3
from pathlib import Path
from datetime import datetime

DB_PATH = Path('bigdataclaw.db')

def create_tables():
    """Create SQLite tables"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Recruiters table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS recruiters (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            brokerage TEXT,
            city TEXT DEFAULT 'Ontario',
            province TEXT DEFAULT 'ON',
            job_title TEXT,
            linkedin TEXT,
            status TEXT DEFAULT 'new',
            quick_links TEXT,  -- JSON
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create indexes
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_recruiters_name ON recruiters(name)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_recruiters_city ON recruiters(city)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_recruiters_brokerage ON recruiters(brokerage)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_recruiters_status ON recruiters(status)')
    
    # Full-text search
    cursor.execute('''
        CREATE VIRTUAL TABLE IF NOT EXISTS recruiters_fts USING fts5(
            name, brokerage, city,
            content='recruiters', content_rowid='id'
        )
    ''')
    
    # Properties/Opportunities table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS properties (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            address TEXT,
            city TEXT,
            price TEXT,
            property_type TEXT,
            status TEXT,
            lat REAL,
            lng REAL,
            source TEXT,
            found_date DATE,
            in_database BOOLEAN DEFAULT 0,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Opportunities tracking
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS opportunities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            property_id INTEGER,
            asset_type TEXT,
            suggested_brokers TEXT,  -- JSON
            captured BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (property_id) REFERENCES properties(id)
        )
    ''')
    
    # Interactions tracking
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS interactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            recruiter_id INTEGER,
            platform TEXT,
            contacted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (recruiter_id) REFERENCES recruiters(id)
        )
    ''')
    
    conn.commit()
    conn.close()
    print("✅ Database tables created")

def migrate_recruiters():
    """Migrate recruiters from JSON to SQLite"""
    print("\n🔄 Migrating recruiters...")
    
    # Load JSON
    with open('recruiter_db_with_quicklinks.json', 'r') as f:
        data = json.load(f)
    
    recruiters = data.get('recruiters', [])
    print(f"   Found {len(recruiters)} recruiters")
    
    # Connect to DB
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Clear existing
    cursor.execute('DELETE FROM recruiters')
    cursor.execute('DELETE FROM recruiters_fts')
    
    # Insert data
    for i, r in enumerate(recruiters):
        cursor.execute('''
            INSERT INTO recruiters (id, name, email, brokerage, city, job_title, linkedin, status, quick_links)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            r.get('id'),
            r.get('name'),
            r.get('email'),
            r.get('brokerage', ''),
            r.get('city', 'Ontario'),
            r.get('jobTitle', ''),
            r.get('linkedin', ''),
            r.get('status', 'new'),
            json.dumps(r.get('quickLinks', {}))
        ))
        
        # Insert into FTS
        cursor.execute('''
            INSERT INTO recruiters_fts (rowid, name, brokerage, city)
            VALUES (?, ?, ?, ?)
        ''', (
            r.get('id'),
            r.get('name'),
            r.get('brokerage', ''),
            r.get('city', 'Ontario')
        ))
        
        if (i + 1) % 1000 == 0:
            print(f"   Processed {i + 1}...")
    
    conn.commit()
    conn.close()
    print(f"✅ Migrated {len(recruiters)} recruiters")

def verify_migration():
    """Verify the migration"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Count recruiters
    cursor.execute('SELECT COUNT(*) FROM recruiters')
    count = cursor.fetchone()[0]
    print(f"\n📊 Total recruiters in DB: {count}")
    
    # Count by brokerage
    cursor.execute('''
        SELECT brokerage, COUNT(*) as cnt 
        FROM recruiters 
        WHERE brokerage != ''
        GROUP BY brokerage 
        ORDER BY cnt DESC 
        LIMIT 5
    ''')
    print("\n🏢 Top Brokerages:")
    for row in cursor.fetchall():
        print(f"   {row[0]}: {row[1]} agents")
    
    # Test FTS search
    cursor.execute('''
        SELECT r.name, r.brokerage 
        FROM recruiters r
        JOIN recruiters_fts fts ON r.id = fts.rowid
        WHERE recruiters_fts MATCH 'Keller'
        LIMIT 5
    ''')
    print("\n🔍 Sample FTS Search 'Keller':")
    for row in cursor.fetchall():
        print(f"   {row[0]} ({row[1]})")
    
    conn.close()

def main():
    """Main setup function"""
    print("=" * 60)
    print("🗄️  SQLite Backend Setup")
    print("=" * 60)
    
    # Remove old DB if exists
    if DB_PATH.exists():
        print(f"\n🗑️  Removing old database...")
        DB_PATH.unlink()
    
    # Create tables
    create_tables()
    
    # Migrate data
    migrate_recruiters()
    
    # Verify
    verify_migration()
    
    print("\n" + "=" * 60)
    print("✅ Setup Complete!")
    print("=" * 60)
    print(f"\nDatabase: {DB_PATH}")
    print(f"Size: {DB_PATH.stat().st_size / (1024*1024):.1f} MB")
    print("\nNext: Run api_server.py to start the API")

if __name__ == '__main__':
    main()
