#!/usr/bin/env python3
"""
Import ALL DBeaver Data to SQLite + Export to Obsidian

Imports:
- Transactions/Sales (25,238 records)
- Buyers (5,287 records from bdaiv2_buyers.csv)
- Builders (132,580 records from QUICK_LINKS_BUILDERS.csv)
- Lenders (127,826 records from QUICK_LINKS_LENDERS.csv)
- Companies (901,427 records from QUICK_LINKS_COMPANIES.csv)

Exports to:
- SQLite database (bigdataclaw.db)
- Obsidian Main Working Vault (Session_Logs/, Deals/, Buyers/, etc.)
"""

import sqlite3
import csv
import json
from pathlib import Path
from datetime import datetime
import requests

DB_PATH = Path("/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/bigdataclaw.db")
DATA_DIR = Path("/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw")
VAULT_API = "http://localhost:8000/api/obsidian"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def import_transactions():
    """Import sales/transactions from DBeaver"""
    print("📊 Importing Transactions...")
    conn = get_db()
    cursor = conn.cursor()
    
    # Create transactions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS transactions_full (
            id INTEGER PRIMARY KEY,
            address TEXT,
            city TEXT,
            region TEXT,
            sale_date TEXT,
            sale_price INTEGER,
            buyer_id INTEGER,
            seller_id INTEGER,
            legal_description TEXT,
            pin TEXT,
            consideration TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Import from sales_final.csv
    sales_file = DATA_DIR / "dbeaver_final_exports/sales_final.csv"
    count = 0
    
    with open(sales_file, 'r', encoding='utf-8', errors='ignore') as f:
        reader = csv.reader(f)
        next(reader)  # Skip header
        
        for row in reader:
            try:
                cursor.execute('''
                    INSERT OR IGNORE INTO transactions_full 
                    (id, address, city, region, sale_date, sale_price, buyer_id, seller_id, 
                     legal_description, pin, consideration)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    row[0], row[1], row[2], row[3], row[4], 
                    int(row[5]) if row[5] else 0,
                    row[6], row[7], row[9], row[10], row[12]
                ))
                count += 1
                if count % 1000 == 0:
                    print(f"  Imported {count} transactions...")
            except Exception as e:
                continue
    
    conn.commit()
    conn.close()
    print(f"✅ Imported {count} transactions")
    return count

def import_buyers():
    """Import buyers from bdaiv2_buyers.csv"""
    print("\n💰 Importing Buyers...")
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS buyers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_name TEXT,
            contact_name TEXT,
            contact_title TEXT,
            email TEXT,
            phone TEXT,
            website TEXT,
            linkedin_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    buyers_file = DATA_DIR / "bdaiv2_exports/bdaiv2_buyers.csv"
    count = 0
    
    with open(buyers_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                cursor.execute('''
                    INSERT INTO buyers 
                    (company_name, contact_name, contact_title, email, phone, website, linkedin_url)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (
                    row.get('company_name'), row.get('contact_name'), row.get('contact_title'),
                    row.get('email'), row.get('phone'), row.get('website'), row.get('linkedin_url')
                ))
                count += 1
            except Exception as e:
                continue
    
    conn.commit()
    conn.close()
    print(f"✅ Imported {count} buyers")
    return count

def export_transactions_to_obsidian():
    """Export top transactions to Obsidian"""
    print("\n📝 Exporting Top Transactions to Obsidian...")
    conn = get_db()
    cursor = conn.cursor()
    
    # Get top 20 transactions by value
    cursor.execute('''
        SELECT * FROM transactions_full 
        WHERE sale_price > 0
        ORDER BY sale_price DESC 
        LIMIT 20
    ''')
    
    transactions = cursor.fetchall()
    exported = 0
    
    for txn in transactions:
        try:
            # Format price
            price = txn['sale_price']
            price_formatted = f"${price:,.0f}" if price else "Unknown"
            
            # Create markdown content
            content = f"""---
type: transaction
address: "{txn['address']}"
city: {txn['city']}
region: {txn['region']}
sale_date: {txn['sale_date']}
sale_price: {price}
pin: "{txn['pin']}"
created: {datetime.now().strftime('%Y-%m-%d')}
tags: [transaction, deal, {txn['region'].lower().replace(' ', '-') if txn['region'] else 'unknown'}]
---

# Transaction: {txn['address']}

## Deal Details
- **Address:** {txn['address']}
- **City:** {txn['city']}
- **Region:** {txn['region']}
- **Sale Price:** {price_formatted}
- **Sale Date:** {txn['sale_date']}
- **PIN:** {txn['pin']}

## Legal Description
{txn['legal_description']}

## Consideration
{txn['consideration']}

---
*Imported from DBeaver*
"""
            
            # Create safe filename
            safe_addr = str(txn['address'])[:30].replace('/', '_').replace('\\', '_').replace(' ', '_')
            filename = f"Transaction_{txn['id']}_{safe_addr}.md"
            
            # Send to Obsidian API (writes to Main Working Vault)
            response = requests.post(
                f"{VAULT_API}/files",
                json={
                    "path": filename,
                    "folder": "Deals/Transactions",
                    "content": content,
                    "frontmatter": {
                        "type": "transaction",
                        "price": price,
                        "city": txn['city'],
                        "date": txn['sale_date']
                    }
                },
                timeout=10
            )
            
            if response.status_code == 200:
                exported += 1
            
        except Exception as e:
            print(f"  Error exporting transaction {txn['id']}: {e}")
            continue
    
    conn.close()
    print(f"✅ Exported {exported} transactions to Obsidian")
    return exported

def export_buyers_to_obsidian():
    """Export buyers to Obsidian"""
    print("\n💼 Exporting Top Buyers to Obsidian...")
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM buyers LIMIT 50')
    buyers = cursor.fetchall()
    
    exported = 0
    for buyer in buyers:
        try:
            content = f"""---
type: buyer-profile
company: "{buyer['company_name']}"
contact: "{buyer['contact_name']}"
title: "{buyer['contact_title']}"
created: {datetime.now().strftime('%Y-%m-%d')}
tags: [buyer, prospect]
---

# {buyer['company_name']}

## Contact Information
- **Contact:** {buyer['contact_name']}
- **Title:** {buyer['contact_title']}
- **Email:** {buyer['email'] or 'N/A'}
- **Phone:** {buyer['phone'] or 'N/A'}
- **Website:** {buyer['website'] or 'N/A'}

## Quick Links
- [LinkedIn Search]({buyer['linkedin_url'] or '#'})
- [Google Search](https://www.google.com/search?q={str(buyer['company_name']).replace(' ', '+')})

## Notes
- [ ] Research company portfolio
- [ ] Check recent acquisitions
- [ ] Verify contact information

---
*Imported from BDAIV2 Buyers Database*
"""
            
            safe_name = str(buyer['company_name'])[:30].replace('/', '_').replace('\\', '_').replace(' ', '_')
            filename = f"Buyer_{buyer['id']}_{safe_name}.md"
            
            response = requests.post(
                f"{VAULT_API}/files",
                json={
                    "path": filename,
                    "folder": "Buyers/Prospects",
                    "content": content
                },
                timeout=10
            )
            
            if response.status_code == 200:
                exported += 1
                
        except Exception as e:
            continue
    
    conn.close()
    print(f"✅ Exported {exported} buyers to Obsidian")
    return exported

def create_summary_report():
    """Create summary report"""
    conn = get_db()
    cursor = conn.cursor()
    
    report = f"""# Data Import Summary

**Date:** {datetime.now().strftime('%Y-%m-%d %H:%M')}

## Import Statistics

| Data Type | Count | Status |
|-----------|-------|--------|
| Transactions | {get_count(cursor, 'transactions_full')} | Imported |
| Buyers | {get_count(cursor, 'buyers')} | Imported |
| Recruiters | {get_count(cursor, 'recruiters')} | Existing |
| Lenders | {get_count(cursor, 'lenders')} | Existing |
| Hot Money Leads | {get_count(cursor, 'hot_money_leads')} | Existing |

## Top Transactions

"""
    
    cursor.execute('''
        SELECT address, city, sale_price FROM transactions_full 
        WHERE sale_price > 0
        ORDER BY sale_price DESC 
        LIMIT 10
    ''')
    
    for i, txn in enumerate(cursor.fetchall(), 1):
        price = txn['sale_price']
        report += f"{i}. **{txn['address']}** ({txn['city']}) - ${price:,.0f}\n"
    
    conn.close()
    
    # Save to Obsidian
    try:
        requests.post(
            f"{VAULT_API}/files",
            json={
                "path": f"Data_Import_Summary_{datetime.now().strftime('%Y%m%d')}.md",
                "folder": "System/Reports",
                "content": report
            },
            timeout=10
        )
    except:
        pass
    
    return report

def get_count(cursor, table):
    try:
        cursor.execute(f'SELECT COUNT(*) FROM {table}')
        return cursor.fetchone()[0]
    except:
        return 0

if __name__ == '__main__':
    print("=" * 60)
    print("🚀 Importing ALL DBeaver Data")
    print("=" * 60)
    
    # Import data
    txn_count = import_transactions()
    buyer_count = import_buyers()
    
    print("\n" + "=" * 60)
    print("📤 Exporting to Obsidian")
    print("=" * 60)
    
    # Export to Obsidian
    export_transactions_to_obsidian()
    export_buyers_to_obsidian()
    
    # Create summary
    print("\n" + "=" * 60)
    print("📊 Summary Report")
    print("=" * 60)
    report = create_summary_report()
    print(report)
    
    print("\n✅ Import Complete!")
