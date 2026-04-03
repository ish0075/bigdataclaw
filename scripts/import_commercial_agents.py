#!/usr/bin/env python3
"""
Import Commercial Agents from DBeaver exports
Links broker_agents with sales data for transaction history
"""

import csv
import json
from pathlib import Path
from urllib.parse import quote_plus
from datetime import datetime

def generate_quick_links(name, company):
    """Generate commercial-focused Quick Links"""
    encoded_name = quote_plus(name)
    encoded_company = quote_plus(company) if company else ''
    
    return {
        'google': f"https://www.google.com/search?q={encoded_name}+commercial+real+estate",
        'linkedin': f"https://www.google.com/search?q={encoded_name}+commercial+realtor+linked+in",
        'linkedin_direct': f"https://www.linkedin.com/search/results/people/?keywords={encoded_name}%20commercial",
        'loopnet': f"https://www.loopnet.com/search?q={encoded_name}",
        'costar': f"https://www.google.com/search?q={encoded_name}+CoStar",
        'company': f"https://www.google.com/search?q={encoded_company}+commercial+real+estate" if company else None,
        'email_finder': f"https://www.google.com/search?q={encoded_name}+email+contact",
    }

def load_broker_agents():
    """Load commercial agents from broker_agents_final.csv"""
    agents = []
    
    with open('dbeaver_final_exports/broker_agents_final.csv', 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        for row in reader:
            if len(row) < 11:
                continue
                
            agent_id = row[0]
            first_name = row[1]
            last_name = row[2]
            full_name = row[3]
            email = row[5] if row[5] else None
            verified = row[6] == '1'
            
            # Company lookup from email domain
            company = None
            if email:
                domain = email.split('@')[1] if '@' in email else ''
                domain_lower = domain.lower()
                if 'cbre' in domain_lower:
                    company = 'CBRE'
                elif 'colliers' in domain_lower:
                    company = 'Colliers'
                elif 'jll' in domain_lower:
                    company = 'JLL'
                elif 'cushman' in domain_lower:
                    company = 'Cushman & Wakefield'
                elif 'avisonyoung' in domain_lower:
                    company = 'Avison Young'
                elif 'coldwell' in domain_lower or 'pacific' in domain_lower:
                    company = 'Coldwell Banker Commercial'
                elif 'savills' in domain_lower:
                    company = 'Savills'
                elif 'bentall' in domain_lower:
                    company = 'BentallGreenOak'
                elif 'gwl' in domain_lower or 'gcre' in domain_lower:
                    company = 'GWL Realty Advisors'
                elif 'clv' in domain_lower:
                    company = 'CLV Group'
                elif 'century21' in domain_lower:
                    company = 'Century 21 Commercial'
            
            links = generate_quick_links(full_name, company)
            
            agent = {
                'id': int(agent_id),
                'name': full_name,
                'firstName': first_name,
                'lastName': last_name,
                'email': email,
                'company': company,
                'verified': verified,
                'status': 'new',
                'dateAdded': datetime.now().strftime('%Y-%m-%d'),
                'quickLinks': links,
                'tags': ['commercial', 'verified'] if verified else ['commercial'],
                'dealCount': 0,
                'specialties': [],
            }
            
            agents.append(agent)
    
    return agents

def build_json_files(agents):
    """Build JSON files for frontend"""
    print(f"\nProcessing {len(agents)} commercial agents...")
    
    # Full dataset
    with open('nerve/public/data/commercial_agents_full.json', 'w', encoding='utf-8') as f:
        json.dump(agents, f)
    print(f"✅ Saved commercial_agents_full.json ({len(agents)} agents)")
    
    # Sample for testing
    sample = agents[:500]
    with open('nerve/public/data/commercial_agents_sample.json', 'w', encoding='utf-8') as f:
        json.dump(sample, f)
    print(f"✅ Saved commercial_agents_sample.json ({len(sample)} agents)")
    
    # Metadata
    companies = {}
    for agent in agents:
        company = agent.get('company') or 'Unknown'
        companies[company] = companies.get(company, 0) + 1
    
    meta = {
        'total': len(agents),
        'sample': len(sample),
        'companies': dict(sorted(companies.items(), key=lambda x: -x[1])[:20]),
        'withEmail': sum(1 for a in agents if a['email']),
        'generatedAt': datetime.now().isoformat()
    }
    
    with open('nerve/public/data/commercial_agents_meta.json', 'w', encoding='utf-8') as f:
        json.dump(meta, f)
    print(f"✅ Saved commercial_agents_meta.json")
    
    return meta

def print_stats(agents, meta):
    """Print summary statistics"""
    print(f"\n📊 Commercial Agent Stats:")
    print(f"   Total: {len(agents):,}")
    print(f"   With email: {meta['withEmail']:,}")
    print(f"\n🏢 Top Companies:")
    for company, count in list(meta['companies'].items())[:10]:
        print(f"      {company}: {count}")

def main():
    print("=" * 60)
    print("🏢 COMMERCIAL AGENT IMPORT")
    print("=" * 60)
    
    # Load data
    agents = load_broker_agents()
    
    # Build outputs
    meta = build_json_files(agents)
    
    # Stats
    print_stats(agents, meta)
    
    print("\n" + "=" * 60)
    print("✅ COMMERCIAL AGENT IMPORT COMPLETE!")
    print("=" * 60)

if __name__ == '__main__':
    main()
