#!/usr/bin/env python3
"""
Fix Hot Money Data - Targeted corrections for specific records
"""

import sqlite3
from pathlib import Path

DB_PATH = Path('bigdataclaw.db')

def fix_specific_records():
    """Fix specific records with known issues"""
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Record 12: Beedie - fix price
    cursor.execute('''
        UPDATE hot_money_leads 
        SET cash_amount = 6127740
        WHERE id = 12 AND (cash_amount IS NULL OR cash_amount = 0)
    ''')
    if cursor.rowcount > 0:
        print("✅ Record 12: Set cash_amount to $6,127,740")
    
    # Record 18: Carlisle - fix price
    cursor.execute('''
        UPDATE hot_money_leads 
        SET cash_amount = 8000000
        WHERE id = 18 AND (cash_amount IS NULL OR cash_amount = 0)
    ''')
    if cursor.rowcount > 0:
        print("✅ Record 18: Set cash_amount to $8,000,000")
    
    # Record 25: Maranatha - fix entity name
    cursor.execute('''
        UPDATE hot_money_leads 
        SET entity = 'Maranatha Christian Reformed Church of Woodbridge'
        WHERE id = 25
    ''')
    if cursor.rowcount > 0:
        print("✅ Record 25: Fixed entity name")
    
    # Now check all records and extract prices from notes where missing
    cursor.execute('''
        SELECT id, notes, cash_amount FROM hot_money_leads 
        WHERE cash_amount IS NULL OR cash_amount = 0
    ''')
    
    for row in cursor.fetchall():
        record_id, notes, current_cash = row
        if notes:
            # Look for price pattern in notes
            import re
            match = re.search(r'\$([0-9,]+)', notes)
            if match:
                price_str = match.group(1).replace(',', '')
                try:
                    price = int(price_str)
                    cursor.execute(
                        'UPDATE hot_money_leads SET cash_amount = ? WHERE id = ?',
                        (price, record_id)
                    )
                    print(f"✅ Record {record_id}: Set cash_amount to ${price:,}")
                except ValueError:
                    pass
    
    conn.commit()
    
    # Show summary
    print()
    print("📊 Current Hot Money Records:")
    print("-" * 80)
    cursor.execute('''
        SELECT id, entity, cash_amount, address, sale_date 
        FROM hot_money_leads 
        ORDER BY id DESC 
        LIMIT 10
    ''')
    
    for row in cursor.fetchall():
        entity = row[1][:40] + '...' if row[1] and len(row[1]) > 40 else (row[1] or 'N/A')
        cash = f"${row[2]:,}" if row[2] else '$undefined'
        print(f"  ID {row[0]}: {entity:<43} | {cash:<15} | {row[3]}")
    
    conn.close()
    print()
    print("🎯 Hot Money data fixed! Refresh the page to see changes.")

if __name__ == '__main__':
    fix_specific_records()
