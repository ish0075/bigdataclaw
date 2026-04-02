#!/usr/bin/env python3
"""
Sync Seaway Mall Development buyers to ContextKeep
Creates semantic memories for all buyer contacts
"""

import asyncio
import sys
import os
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from contextkeep_integration import ContextKeepSync

# Seaway Mall buyer data
SEAWAY_BUYERS = [
    {
        "name": "Glen Alizadeh",
        "company": "Performance Auto Group",
        "phone": "905-452-1305",
        "location": "St. Catharines, ON",
        "cash_capacity": 16250000,
        "recent_deal": "Feb 5, 2026 - $16.25M CASH",
        "interest": "Rear Parcel ($8.7M), Main Development ($31-32M)",
        "priority": "CALL TODAY - Local cash buyer",
        "notes": "15 minutes from site. Proven all-cash buyer."
    },
    {
        "name": "Christopher Zeppa",
        "company": "City Park Homes",
        "phone": "905-552-5200",
        "location": "GTA/Ontario",
        "cash_capacity": 13250000,
        "recent_deal": "Feb 6, 2026 - $13.25M land (18 acres)",
        "interest": "Rear Parcel ($8.7M)",
        "priority": "CALL TODAY - Land developer",
        "notes": "Land developer specialist. May need partner for larger deal."
    },
    {
        "name": "Michael Rockall",
        "company": "Larkin Investments / Peak Multifamily",
        "phone": "905-452-1305",
        "location": "Woodbridge, ON",
        "cash_capacity": 66660000,
        "recent_deal": "Feb 2026 - $66.66M (2 deals)",
        "interest": "Main Development ($31-32M)",
        "priority": "CALL TODAY - Sophisticated operator",
        "notes": "Has $31.5M financing facility. Understands leverage."
    },
    {
        "name": "Karen Basian",
        "company": "3NP Realty Welland Inc",
        "email": "karen.basian@3np.ca",
        "phone": "416-988-0569",
        "location": "Welland, ON",
        "cash_capacity": 280200000,
        "recent_deal": "Sep 26, 2025 - $70.05M",
        "interest": "Main Development ($31-32M)",
        "priority": "CALL TODAY - Already in Welland",
        "notes": "$280M already invested in Welland! Perfect fit."
    },
    {
        "name": "Shawn Keeper",
        "company": "Dunsire Homes Inc",
        "email": "shawn.keeper@dunsire.com",
        "phone": "888-519-2346",
        "location": "Fort Erie, ON",
        "cash_capacity": 93600000,
        "recent_deal": "Apr 29, 2025 - $15.6M",
        "interest": "Rear Parcel ($8.7M), Townhome blocks",
        "priority": "THIS WEEK - Niagara builder",
        "notes": "$93M Niagara portfolio. Local builder."
    },
    {
        "name": "Julian Schonfeldt",
        "company": "CAPREIT Apartments Inc",
        "email": "julian@capreit.ca",
        "location": "Toronto/London/Ottawa",
        "cash_capacity": 625000000,
        "recent_deal": "$625M total acquisitions",
        "interest": "Main Development ($31-32M)",
        "priority": "THIS WEEK - TSX REIT",
        "notes": "Public REIT (CAR.UN). Institutional capacity."
    },
    {
        "name": "Brad Trussler",
        "company": "Mattamy Homes (Northwoods) Ltd",
        "email": "brad.trussler@mattamyhomes.com",
        "location": "Kanata, ON",
        "cash_capacity": 300000000,
        "recent_deal": "Jun 2025 - $100M",
        "interest": "Main Development ($31-32M), High-rise towers",
        "priority": "THIS WEEK - Canada's #1 builder",
        "notes": "Can handle 900-unit high-rise development. JV possible."
    },
    {
        "name": "Jason Roque",
        "company": "Equiton Residential Income Fund",
        "email": "jroque@equiton.com",
        "location": "York, ON",
        "cash_capacity": 361670000,
        "recent_deal": "$361M total fund",
        "interest": "Main Development ($31-32M)",
        "priority": "THIS WEEK - Development REIT",
        "notes": "$361M development fund. JV structure available."
    },
    {
        "name": "Wayne Walton",
        "company": "Sun Life Assurance Company",
        "email": "wayne.walton@sunlife.ca",
        "location": "Halton Hills, ON",
        "cash_capacity": 1144000000,
        "recent_deal": "$1.144B total land",
        "interest": "High-rise towers ($60-100M each)",
        "priority": "THIS WEEK - Institutional",
        "notes": "$1.1B in Ontario land. Institutional capital."
    }
]


def sync_buyers_to_contextkeep():
    """Sync all Seaway Mall buyers to ContextKeep memory"""
    
    print("\n" + "="*60)
    print("SYNCING SEAWAY MALL BUYERS TO CONTEXTKEEP")
    print("="*60)
    
    try:
        ck = ContextKeepSync()
        connected, msg = ck.connect()
        
        if not connected:
            print(f"\n✗ Cannot connect to ContextKeep: {msg}")
            print("  → Is ContextKeep MCP server running?")
            print("  → Check: curl http://127.0.0.1:8080/health")
            return
        
        print(f"\n✓ Connected to ContextKeep: {msg}")
        print(f"\nSyncing {len(SEAWAY_BUYERS)} buyers...")
        
        success_count = 0
        
        for buyer in SEAWAY_BUYERS:
            # Create rich content for semantic search
            content = f"""Seaway Mall Development Buyer - {buyer['name']}

Company: {buyer['company']}
Contact: {buyer.get('phone', '')} / {buyer.get('email', 'N/A')}
Location: {buyer['location']}
Cash Capacity: ${buyer['cash_capacity']:,.0f}
Recent Deal: {buyer['recent_deal']}

Interest:
{buyer['interest']}

Priority: {buyer['priority']}
Notes: {buyer['notes']}

Deal Terms:
- Rear Parcel: $8.7M (80 stacked townhomes)
- Main Development: $31-32.4M (230-240 lots at $135k)
- Total Cash Needed: $11M for main, $3M for rear
- VTB Available: Prime + 2% for 3 years
"""
            
            # Create memory
            memory_id = ck.add_memory(
                content=content,
                tags=[
                    "seaway-mall",
                    "buyer",
                    "development",
                    "welland",
                    "niagara",
                    buyer['priority'].split()[0].lower()
                ],
                metadata={
                    "buyer_name": buyer['name'],
                    "company": buyer['company'],
                    "cash_capacity": buyer['cash_capacity'],
                    "location": buyer['location'],
                    "project": "Seaway Mall",
                    "synced_at": datetime.now().isoformat()
                },
                source_file=f"Seaway-Mall/Buyers/{buyer['name'].replace(' ', '_')}.md"
            )
            
            if memory_id:
                print(f"  ✓ {buyer['name']} ({buyer['company'][:30]}...)")
                success_count += 1
            else:
                print(f"  ✗ {buyer['name']} - Failed")
        
        print(f"\n{'='*60}")
        print(f"SYNC COMPLETE: {success_count}/{len(SEAWAY_BUYERS)} buyers added")
        print(f"{'='*60}")
        
        # Show memory statistics
        print("\nQuerying memories...")
        memories = ck.list_all_memories(tags=["seaway-mall"], limit=100)
        print(f"Total Seaway Mall memories: {len(memories)}")
        
        # Test semantic search
        print("\nTesting semantic search...")
        results = ck.query_memories(
            query="cash buyer in Niagara interested in $8 million development",
            top_k=3,
            tags=["seaway-mall"]
        )
        
        if results:
            print("Top matches:")
            for i, r in enumerate(results, 1):
                company = r.memory.metadata.get('company', 'Unknown')
                print(f"  {i}. {company} (relevance: {r.relevance_score:.2%})")
        
        ck.close()
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()


def query_seaway_buyers():
    """Interactive query for Seaway Mall buyers"""
    
    print("\n" + "="*60)
    print("QUERY SEAWAY MALL BUYERS")
    print("="*60)
    
    try:
        ck = ContextKeepSync()
        connected, msg = ck.connect()
        
        if not connected:
            print(f"\n✗ Cannot connect: {msg}")
            return
        
        # Show available queries
        queries = [
            ("Cash buyers over $10M", "cash buyer with $10 million capacity"),
            ("Local Niagara buyers", "buyer in Niagara region Welland St Catharines"),
            ("REITs and institutional", "REIT institutional fund public company"),
            ("Land developers", "land developer builder construction"),
            ("Rear parcel prospects", "buyer for $8 million stacked townhomes rear parcel"),
            ("Main development prospects", "buyer $30 million serviced lots development")
        ]
        
        print("\nExample queries:")
        for i, (name, query) in enumerate(queries, 1):
            print(f"  {i}. {name}")
            print(f"     → '{query}'")
        
        print("\n" + "="*60)
        
        # Run example query
        print("\nRunning: 'cash buyer Niagara $10 million'")
        results = ck.query_memories(
            query="cash buyer Niagara $10 million",
            top_k=5,
            tags=["seaway-mall"]
        )
        
        print(f"\nFound {len(results)} matches:")
        for i, r in enumerate(results, 1):
            name = r.memory.metadata.get('buyer_name', 'Unknown')
            company = r.memory.metadata.get('company', 'Unknown')
            capacity = r.memory.metadata.get('cash_capacity', 0)
            print(f"\n{i}. {name} - {company}")
            print(f"   Relevance: {r.relevance_score:.1%}")
            print(f"   Capacity: ${capacity:,.0f}")
        
        ck.close()
        
    except Exception as e:
        print(f"\n✗ Error: {e}")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Sync Seaway Mall buyers to ContextKeep')
    parser.add_argument('--sync', action='store_true', help='Sync buyers to memory')
    parser.add_argument('--query', action='store_true', help='Query buyers')
    parser.add_argument('--all', action='store_true', help='Run both sync and query')
    
    args = parser.parse_args()
    
    if args.all or (not args.sync and not args.query):
        sync_buyers_to_contextkeep()
        query_seaway_buyers()
    elif args.sync:
        sync_buyers_to_contextkeep()
    elif args.query:
        query_seaway_buyers()
