#!/usr/bin/env python3
"""
Fix Hot Money Data Parsing Issues
Corrects entity names and prices from notes field
"""

import sqlite3
import re
from pathlib import Path

DB_PATH = Path('bigdataclaw.db')

def extract_transferor_from_notes(notes):
    """Extract the seller (transferor) from notes"""
    if not notes:
        return None
    
    # Look for Transferor(s) pattern
    patterns = [
        r'Transferor\(s\)\s*\n?\s*([^\n]+(?:Ltd|Inc|Corp|Limited|\.))',
        r'Transferor:\s*([^\n]+(?:Ltd|Inc|Corp|Limited|\.))',
        r'Transferor\(s\):\s*\n?\s*([A-Za-z][A-Za-z\s\-\(\)]+(?:Ltd|Inc|Corp|Limited))',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, notes, re.IGNORECASE)
        if match:
            entity = match.group(1).strip()
            # Clean up common issues
            entity = re.sub(r'\s+', ' ', entity)  # Multiple spaces
            entity = entity.replace('  ', ' ')
            return entity
    
    return None

def extract_price_from_notes(notes):
    """Extract consideration/price from notes"""
    if not notes:
        return None
    
    # Look for consideration patterns
    patterns = [
        r'Consideration\s*\n?\s*cash:\s*\$?([0-9,]+)',
        r'cash:\s*\$?([0-9,]+)',
        r'\$([0-9,]+)\s+(?:cash|consideration)',
        r'(?:sold|price|consideration).*?\$?([0-9,]+)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, notes, re.IGNORECASE)
        if match:
            # Remove commas and convert to int
            price_str = match.group(1).replace(',', '')
            try:
                return int(price_str)
            except ValueError:
                continue
    
    return None

def fix_hotmoney_records():
    """Fix hot money records with missing or incorrect data"""
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    print("🔍 Scanning hot_money_leads for data issues...")
    print()
    
    # Find records with potential issues
    cursor.execute('''
        SELECT id, entity, cash_amount, notes, address, sale_date
        FROM hot_money_leads
        WHERE entity IS NULL 
           OR entity = ''
           OR cash_amount IS NULL
           OR cash_amount = 0
           OR entity LIKE '%Holdings Ltd%'
           OR entity LIKE '%Inc%'
           OR entity LIKE '%Ltd%'
    ''')
    
    records = cursor.fetchall()
    fixed_count = 0
    
    print(f"Found {len(records)} records to check")
    print()
    
    for record in records:
        record_id = record['id']
        current_entity = record['entity']
        current_cash = record['cash_amount']
        notes = record['notes'] or ''
        
        updates = []
        params = []
        
        # Try to extract correct entity from notes
        extracted_entity = extract_transferor_from_notes(notes)
        if extracted_entity and extracted_entity != current_entity:
            # Check if current entity is just a partial match
            if not current_entity or len(extracted_entity) > len(current_entity) or current_entity in extracted_entity:
                updates.append("entity = ?")
                params.append(extracted_entity)
                print(f"  Record {record_id}:")
                print(f"    Entity: '{current_entity}' → '{extracted_entity}'")
        
        # Try to extract price from notes
        extracted_price = extract_price_from_notes(notes)
        if extracted_price and (not current_cash or current_cash == 0):
            updates.append("cash_amount = ?")
            params.append(extracted_price)
            print(f"    Price: ${current_cash} → ${extracted_price:,}")
        
        # Update if we have changes
        if updates:
            params.append(record_id)
            sql = f"UPDATE hot_money_leads SET {', '.join(updates)} WHERE id = ?"
            cursor.execute(sql, params)
            fixed_count += 1
            print()
    
    conn.commit()
    conn.close()
    
    print(f"✅ Fixed {fixed_count} records")
    print()
    
    # Show summary of fixes
    if fixed_count > 0:
        print("📊 Summary:")
        print("  - Entity names corrected from notes")
        print("  - Prices extracted from consideration fields")
        print("  - Records now display correctly in Hot Money Radar")

if __name__ == '__main__':
    fix_hotmoney_records()
