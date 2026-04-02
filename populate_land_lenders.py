#!/usr/bin/env python3
"""
Populate land lender classifications based on lender names and types.
"""
import sqlite3
import json

def classify_land_lenders():
    db_path = 'bigdataclaw.db'
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("Analyzing lenders for land financing specialization...\n")
    
    # Land lender keywords in names
    land_keywords = [
        'land', 'landes', 'acre', 'acreage', 'lot', 'lots', 'parcel', 'parcels',
        'raw land', 'vacant land', 'development land', 'land development',
        'rural', 'farm', 'farming', 'agricultural', 'agriculture'
    ]
    
    # Construction lenders often do land loans (land → construction sequence)
    construction_keywords = [
        'construction', 'builder', 'building', 'develop', 'development',
        'project', 'projects'
    ]
    
    # Credit unions commonly do land loans
    # Trust companies often handle land trusts
    
    land_lender_count = 0
    construction_lender_count = 0
    
    # Get all lenders
    cursor.execute("SELECT id, name, lender_type, asset_specializations FROM lenders")
    lenders = cursor.fetchall()
    
    for lender_id, name, lender_type, current_specs in lenders:
        name_lower = name.lower()
        is_land = False
        is_construction = False
        specs = []
        
        # Check for land keywords
        for kw in land_keywords:
            if kw in name_lower:
                is_land = True
                break
        
        # Check for construction keywords
        for kw in construction_keywords:
            if kw in name_lower:
                is_construction = True
                break
        
        # Classify by type
        if lender_type == 'Credit Union':
            # Credit unions commonly finance land
            is_land = True
            
        if lender_type == 'Mortgage Lender' and 'construction' in name_lower:
            is_land = True
            is_construction = True
            
        if lender_type == 'Private Lender':
            # Many private lenders do land + construction
            if any(x in name_lower for x in ['construction', 'development', 'capital', 'investment', 'fund']):
                is_land = True
                is_construction = True
        
        # Build specializations
        specs.append('Commercial')  # All do commercial
        
        if is_land:
            specs.append('Land')
            land_lender_count += 1
            
        if is_construction:
            specs.append('Construction')
            construction_lender_count += 1
        
        # Update database
        specs_str = ', '.join(specs)
        cursor.execute('''
            UPDATE lenders 
            SET is_land_lender = ?,
                is_construction_lender = ?,
                asset_specializations = ?
            WHERE id = ?
        ''', (1 if is_land else 0, 1 if is_construction else 0, specs_str, lender_id))
    
    conn.commit()
    
    print(f"✅ Updated {land_lender_count} land lenders")
    print(f"✅ Updated {construction_lender_count} construction lenders")
    
    # Show breakdown
    print("\n📊 Asset Specialization Breakdown:")
    cursor.execute('''
        SELECT asset_specializations, COUNT(*) as count 
        FROM lenders 
        GROUP BY asset_specializations 
        ORDER BY count DESC
    ''')
    for row in cursor.fetchall():
        print(f"  {row[0]}: {row[1]}")
    
    print("\n🏞️  Sample Land Lenders:")
    cursor.execute('''
        SELECT name, lender_type 
        FROM lenders 
        WHERE is_land_lender = 1 
        ORDER BY RANDOM() 
        LIMIT 15
    ''')
    for row in cursor.fetchall():
        print(f"  • {row[0]} ({row[1]})")
    
    conn.close()
    print("\n✅ Land lender population complete!")

if __name__ == "__main__":
    classify_land_lenders()
