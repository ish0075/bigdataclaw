#!/usr/bin/env python3
"""
Save Quick Links Data to ContextKeep
Persists all Quick Links databases to ContextKeep for semantic search
"""

import csv
import json
from datetime import datetime
from pathlib import Path


def create_memory_entry(title, content, tags, category):
    """Create a ContextKeep-compatible memory entry"""
    return {
        "title": title,
        "content": content,
        "tags": tags,
        "category": category,
        "created_at": datetime.now().isoformat(),
        "metadata": {
            "type": "quick_links_database",
            "version": "2.1"
        }
    }


def save_builders_to_contextkeep():
    """Save builders database to ContextKeep format"""
    print("🏗️ Processing Builders...")
    
    input_file = "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/QUICK_LINKS_BUILDERS.csv"
    memories = []
    
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        next(reader)  # Skip header
        
        count = 0
        for row in reader:
            if len(row) < 5:
                continue
            
            name = row[1]
            address = row[2]
            city = row[3]
            province = row[4]
            phone = row[6] if len(row) > 6 else ''
            
            # Build content with Quick Links
            content = f"""# {name}

**Type:** Builder/Developer
**Address:** {address}, {city}, {province}
**Phone:** {phone}

## Quick Links
- Google: {row[12] if len(row) > 12 else ''}
- LinkedIn: {row[14] if len(row) > 14 else ''}
- LIVABL: {row[24] if len(row) > 24 else ''}
- Tarion: {row[28] if len(row) > 28 else ''}
- HCRA: {row[29] if len(row) > 29 else ''}
- LOOPNET: {row[20] if len(row) > 20 else ''}

## Contact
- WhatsApp: https://wa.me/{phone.replace('-', '').replace(' ', '') if phone else ''}
"""
            
            memory = create_memory_entry(
                title=f"Builder: {name}",
                content=content,
                tags=["builder", "developer", "quick-links", city.lower().replace(' ', '-')],
                category="builders"
            )
            memories.append(memory)
            count += 1
            
            if count % 1000 == 0:
                print(f"  Processed {count} builders...")
    
    return memories


def save_investment_companies_to_contextkeep():
    """Save investment companies to ContextKeep format"""
    print("💰 Processing Investment Companies...")
    
    input_file = "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/COMPANIES_BY_CATEGORY/INVESTMENT.csv"
    memories = []
    
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            
            count = 0
            for row in reader:
                name = row.get('name', '')
                city = row.get('city', '')
                
                content = f"""# {name}

**Type:** Investment Company
**Category:** Investment/Investor
**Location:** {city}

## Quick Links
- Google: {row.get('ql_google', '')}
- LinkedIn: {row.get('ql_linkedin', '')}
- Facebook: {row.get('ql_facebook', '')}
"""
                
                memory = create_memory_entry(
                    title=f"Investment: {name}",
                    content=content,
                    tags=["investment", "investor", "capital", "quick-links"],
                    category="investment"
                )
                memories.append(memory)
                count += 1
                
                if count % 500 == 0:
                    print(f"  Processed {count} investment companies...")
    except FileNotFoundError:
        print(f"  ⚠️ File not found: {input_file}")
    
    return memories


def save_reits_to_contextkeep():
    """Save REITs to ContextKeep format"""
    print("🏢 Processing REITs...")
    
    input_file = "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/COMPANIES_BY_CATEGORY/REITS.csv"
    memories = []
    
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            
            for row in reader:
                name = row.get('name', '')
                
                content = f"""# {name}

**Type:** REIT (Real Estate Investment Trust)
**Category:** reit

## Quick Links
- Google: {row.get('ql_google', '')}
- LinkedIn: {row.get('ql_linkedin', '')}
"""
                
                memory = create_memory_entry(
                    title=f"REIT: {name}",
                    content=content,
                    tags=["reit", "investment-trust", "real-estate", "quick-links"],
                    category="reits"
                )
                memories.append(memory)
    except FileNotFoundError:
        print(f"  ⚠️ File not found: {input_file}")
    
    return memories


def save_private_equity_to_contextkeep():
    """Save Private Equity firms to ContextKeep format"""
    print("📈 Processing Private Equity...")
    
    input_file = "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/COMPANIES_BY_CATEGORY/PRIVATE_EQUITY.csv"
    memories = []
    
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            
            for row in reader:
                name = row.get('name', '')
                
                content = f"""# {name}

**Type:** Private Equity
**Category:** private_equity

## Quick Links
- Google: {row.get('ql_google', '')}
- LinkedIn: {row.get('ql_linkedin', '')}
"""
                
                memory = create_memory_entry(
                    title=f"Private Equity: {name}",
                    content=content,
                    tags=["private-equity", "pe", "investment", "quick-links"],
                    category="private_equity"
                )
                memories.append(memory)
    except FileNotFoundError:
        print(f"  ⚠️ File not found: {input_file}")
    
    return memories


def save_recruiters_to_contextkeep():
    """Save recruiter database to ContextKeep format"""
    print("👔 Processing Recruiters...")
    
    input_file = "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/recruiter_db_with_quicklinks.json"
    memories = []
    
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            recruiters = data.get('recruiters', [])
            
            count = 0
            for agent in recruiters:
                name = agent.get('name', '')
                brokerage = agent.get('brokerage', '')
                email = agent.get('email', '')
                
                quick_links = agent.get('quickLinks', {})
                exp_resources = agent.get('expResources', {})
                
                content = f"""# {name}

**Type:** Real Estate Agent (Recruiting Target)
**Brokerage:** {brokerage}
**Email:** {email}

## Quick Links
- Google: {quick_links.get('google', '')}
- LinkedIn: {quick_links.get('linkedin', '')}
- Realtor.ca: {quick_links.get('realtorCa', '')}
- Facebook: {quick_links.get('facebook', '')}

## EXP Resources
- EXP Info: {exp_resources.get('expRealty', '')}
- Commission: {exp_resources.get('commission', '')}

## Outreach
Status: {agent.get('status', 'new')}
"""
                
                memory = create_memory_entry(
                    title=f"Agent: {name}",
                    content=content,
                    tags=["agent", "recruiter", "real-estate", "exp-outreach", brokerage.replace(' ', '-')],
                    category="recruiters"
                )
                memories.append(memory)
                count += 1
                
                if count % 1000 == 0:
                    print(f"  Processed {count} agents...")
    except FileNotFoundError:
        print(f"  ⚠️ File not found: {input_file}")
    
    return memories


def main():
    """Main function to save all Quick Links to ContextKeep"""
    print("="*70)
    print("💾 SAVING QUICK LINKS TO CONTEXTKEEP FORMAT")
    print("="*70)
    print()
    
    all_memories = []
    
    # Process each category
    all_memories.extend(save_builders_to_contextkeep())
    all_memories.extend(save_investment_companies_to_contextkeep())
    all_memories.extend(save_reits_to_contextkeep())
    all_memories.extend(save_private_equity_to_contextkeep())
    all_memories.extend(save_recruiters_to_contextkeep())
    
    # Save to JSON file for ContextKeep import
    output_file = "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/CONTEXTKEEP_QUICKLINKS_EXPORT.json"
    
    export_data = {
        "metadata": {
            "exported_at": datetime.now().isoformat(),
            "version": "2.1",
            "total_memories": len(all_memories),
            "categories": ["builders", "investment", "reits", "private_equity", "recruiters"]
        },
        "memories": all_memories
    }
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(export_data, f, indent=2)
    
    print()
    print("="*70)
    print("✅ EXPORT COMPLETE!")
    print("="*70)
    print(f"\nTotal memories: {len(all_memories):,}")
    print(f"Output file: {output_file}")
    print()
    print("To import to ContextKeep:")
    print("  1. Open ContextKeep interface")
    print("  2. Use import function")
    print("  3. Select: CONTEXTKEEP_QUICKLINKS_EXPORT.json")
    print()
    print("Categories exported:")
    print("  🏗️ Builders")
    print("  💰 Investment Companies")
    print("  🏢 REITs")
    print("  📈 Private Equity")
    print("  👔 Recruiters (Agents)")


if __name__ == "__main__":
    main()
