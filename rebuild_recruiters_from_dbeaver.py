#!/usr/bin/env python3
"""
Rebuild recruiter database from DBeaver exports with actual cities/regions.
Joins realtor_salespersons + realtor_brokers with realtor_brokerages.
"""

import csv
import json
import sqlite3
from pathlib import Path
from urllib.parse import quote_plus
from datetime import datetime

DB_PATH = Path('bigdataclaw.db')

def generate_quick_links(name, brokerage, email, job_title):
    """Generate Quick Links for a real estate agent"""
    links = {}
    base = "https://www.google.com/search"
    
    links['google'] = f"{base}?q={quote_plus(name + ' real estate')}"
    links['reviews'] = f"{base}?q={quote_plus(name + ' reviews')}"
    links['linkedin'] = f"{base}?q={quote_plus(name + ' linkedin')}"
    links['facebook'] = f"{base}?q={quote_plus(name + ' facebook')}"
    links['instagram'] = f"{base}?q={quote_plus(name + ' instagram')}"
    links['twitter'] = f"{base}?q={quote_plus(name + ' twitter OR x.com')}"
    links['realtorCa'] = f"{base}?q={quote_plus(name + ' site:realtor.ca')}"
    
    brokerage_links = {}
    if brokerage:
        brokerage_links['google'] = f"{base}?q={quote_plus(brokerage)}"
        brokerage_links['linkedin'] = f"{base}?q={quote_plus(brokerage + ' linkedin')}"
        brokerage_links['website'] = f"{base}?q={quote_plus(brokerage + ' website')}"
        brokerage_links['reviews'] = f"{base}?q={quote_plus(brokerage + ' reviews')}"
    
    exp_resources = {
        'expRealty': f"{base}?q=EXP+Realty+Canada",
        'vsTraditional': f"{base}?q=EXP+Realty+vs+traditional+brokerage",
        'commission': f"{base}?q=EXP+Realty+commission+split+Canada"
    }
    
    return {
        'quickLinks': links,
        'brokerageLinks': brokerage_links,
        'expResources': exp_resources
    }

def load_brokerages():
    """Load brokerages with city/region data"""
    brokerages = {}
    with open('dbeaver_final_exports/realtor_brokerages_final.csv', 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        for row in reader:
            if len(row) >= 4:
                brokerages[row[0]] = {
                    'name': row[1],
                    'city': row[2],
                    'region': row[3],
                    'website': row[4] if len(row) > 4 else ''
                }
    print(f"Loaded {len(brokerages)} brokerages")
    return brokerages

def load_agents(brokerages):
    """Load salespersons and brokers, join with brokerages"""
    agents = []
    agent_id = 1
    
    files = [
        ('dbeaver_final_exports/realtor_brokers_final.csv', 'Broker'),
        ('dbeaver_final_exports/realtor_salespersons_final.csv', 'Salesperson')
    ]
    
    for filepath, default_title in files:
        count = 0
        with open(filepath, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            for row in reader:
                if len(row) < 11:
                    continue
                
                broker_id = row[10]
                brokerage_info = brokerages.get(broker_id, {})
                brokerage_name = brokerage_info.get('name', '')
                city = brokerage_info.get('city', 'Ontario')
                region = brokerage_info.get('region', 'Ontario')
                
                name = row[3]
                email = row[5]
                job_title = row[4] if row[4] else default_title
                
                links = generate_quick_links(name, brokerage_name, email, job_title)
                
                agent = {
                    'id': agent_id,
                    'name': name,
                    'brokerage': brokerage_name,
                    'email': email,
                    'jobTitle': job_title,
                    'linkedin': None,
                    'status': 'new',
                    'tags': ['verified'],
                    'dateAdded': datetime.now().strftime('%Y-%m-%d'),
                    'city': city,
                    'region': region,
                    **links
                }
                
                agents.append(agent)
                agent_id += 1
                count += 1
        
        print(f"Loaded {count} agents from {filepath}")
    
    print(f"Total agents: {len(agents)}")
    return agents

def generate_html_markdown(agent):
    """Generate HTML and markdown for an agent"""
    ql = agent['quickLinks']
    bl = agent.get('brokerageLinks', {})
    el = agent.get('expResources', {})
    
    markdown = f"""### 🔍 AGENT RESEARCH LINKS

**{agent['name']}**
*{agent['jobTitle']}*
🏢 {agent['brokerage']}
📧 [{agent['email']}](mailto:{agent['email']})

**Agent Search:**
| Google | [Search]({ql.get('google', '')}) |
| Reviews | [Find]({ql.get('reviews', '')}) |
| LinkedIn | [Profile]({ql.get('linkedin', '')}) |
| Facebook | [Page]({ql.get('facebook', '')}) |
| Instagram | [Profile]({ql.get('instagram', '')}) |
| Twitter/X | [Profile]({ql.get('twitter', '')}) |
| Realtor.ca | [Search]({ql.get('realtorCa', '')}) |

**🏢 Brokerage: {agent['brokerage']}**
| Google | [Search]({bl.get('google', '')}) |
| LinkedIn | [Search]({bl.get('linkedin', '')}) |
| Website | [Find]({bl.get('website', '')}) |
| Reviews | [Search]({bl.get('reviews', '')}) |

**📚 EXP Realty Resources:**
| EXP Realty | [Info]({el.get('expRealty', '')}) |
| vs Traditional | [Compare]({el.get('vsTraditional', '')}) |
| Commission | [Details]({el.get('commission', '')}) |
"""
    
    html = f"""<div class='recruiter-quick-links'>
  <h4>🔍 Quick Research</h4>
  <div class='ql-grid'>
    <a href='{ql.get('google', '')}' target='_blank' class='ql-btn google'>Google</a>
    <a href='{ql.get('linkedin', '')}' target='_blank' class='ql-btn linkedin'>LinkedIn</a>
    <a href='{ql.get('facebook', '')}' target='_blank' class='ql-btn facebook'>Facebook</a>
    <a href='{ql.get('realtorCa', '')}' target='_blank' class='ql-btn realtor'>Realtor.ca</a>
  </div>
  <h5>🏢 {agent['brokerage']}</h5>
  <div class='ql-grid'>
    <a href='{bl.get('google', '')}' target='_blank' class='ql-btn'>Search Brokerage</a>
    <a href='{bl.get('reviews', '')}' target='_blank' class='ql-btn'>Brokerage Reviews</a>
  </div>
  <h5>📚 EXP Resources</h5>
  <div class='ql-grid'>
    <a href='{el.get('expRealty', '')}' target='_blank' class='ql-btn exp'>EXP Realty</a>
    <a href='{el.get('commission', '')}' target='_blank' class='ql-btn exp'>Commission Info</a>
  </div>
</div>"""
    
    return markdown, html

def build_json_outputs(agents):
    """Build JSON outputs for frontend and backend"""
    print("\nBuilding JSON outputs...")
    
    # Add markdown/html to each agent
    for agent in agents:
        md, html = generate_html_markdown(agent)
        agent['markdown'] = md
        agent['html'] = html
    
    # recruiters_full.json - flat array for frontend
    with open('nerve/public/data/recruiters_full.json', 'w', encoding='utf-8') as f:
        json.dump(agents, f)
    print(f"✅ Saved nerve/public/data/recruiters_full.json ({len(agents)} agents)")
    
    # recruiter_db_with_quicklinks.json - wrapped object for backend
    db_output = {'recruiters': agents}
    with open('recruiter_db_with_quicklinks.json', 'w', encoding='utf-8') as f:
        json.dump(db_output, f)
    print(f"✅ Saved recruiter_db_with_quicklinks.json ({len(agents)} agents)")
    
    # Sample JSON
    sample = agents[:500]
    with open('nerve/public/data/recruiters_sample.json', 'w', encoding='utf-8') as f:
        json.dump(sample, f)
    print(f"✅ Saved nerve/public/data/recruiters_sample.json ({len(sample)} agents)")
    
    # Meta JSON
    cities = {}
    brokerages_set = set()
    for agent in agents:
        c = agent.get('city', 'Unknown')
        cities[c] = cities.get(c, 0) + 1
        if agent.get('brokerage'):
            brokerages_set.add(agent['brokerage'])
    
    meta = {
        'total': len(agents),
        'sample': len(sample),
        'cities': sorted(cities.keys()),
        'brokerages': sorted(list(brokerages_set))[:100],  # Top 100 for meta
        'generated_at': datetime.now().isoformat()
    }
    with open('nerve/public/data/recruiters_meta.json', 'w', encoding='utf-8') as f:
        json.dump(meta, f)
    print(f"✅ Saved nerve/public/data/recruiters_meta.json")
    
    return agents

def rebuild_sqlite(agents):
    """Rebuild SQLite database with proper city data"""
    print("\nRebuilding SQLite database...")
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Clear existing
    cursor.execute('DELETE FROM recruiters')
    cursor.execute('DELETE FROM recruiters_fts')
    
    for i, agent in enumerate(agents):
        cursor.execute('''
            INSERT INTO recruiters (id, name, email, brokerage, city, province, job_title, linkedin, status, quick_links)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            agent['id'],
            agent['name'],
            agent.get('email', ''),
            agent.get('brokerage', ''),
            agent.get('city', 'Ontario'),
            agent.get('region', 'ON'),
            agent.get('jobTitle', ''),
            agent.get('linkedin', ''),
            agent.get('status', 'new'),
            json.dumps(agent.get('quickLinks', {}))
        ))
        
        cursor.execute('''
            INSERT INTO recruiters_fts (rowid, name, brokerage, city)
            VALUES (?, ?, ?, ?)
        ''', (
            agent['id'],
            agent['name'],
            agent.get('brokerage', ''),
            agent.get('city', 'Ontario')
        ))
        
        if (i + 1) % 1000 == 0:
            print(f"   Processed {i + 1}...")
    
    conn.commit()
    conn.close()
    print(f"✅ Rebuilt SQLite database with {len(agents)} recruiters")

def print_stats(agents):
    """Print statistics about the rebuilt data"""
    cities = {}
    brokerages = {}
    for agent in agents:
        c = agent.get('city', 'Unknown')
        cities[c] = cities.get(c, 0) + 1
        b = agent.get('brokerage', 'Unknown')
        brokerages[b] = brokerages.get(b, 0) + 1
    
    print(f"\n📊 STATS:")
    print(f"   Total agents: {len(agents):,}")
    print(f"   Unique cities: {len(cities)}")
    print(f"   Unique brokerages: {len(brokerages)}")
    print(f"\n🏙️  Top 20 Cities:")
    for city, count in sorted(cities.items(), key=lambda x: -x[1])[:20]:
        print(f"      {city}: {count}")
    print(f"\n🏢 Top 10 Brokerages:")
    for brokerage, count in sorted(brokerages.items(), key=lambda x: -x[1])[:10]:
        print(f"      {brokerage}: {count}")

def main():
    print("=" * 60)
    print("🔄 REBUILDING RECRUITER DATABASE FROM DBeaver EXPORTS")
    print("=" * 60)
    
    brokerages = load_brokerages()
    agents = load_agents(brokerages)
    agents = build_json_outputs(agents)
    rebuild_sqlite(agents)
    print_stats(agents)
    
    print("\n" + "=" * 60)
    print("✅ REBUILD COMPLETE!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Restart api_server.py if running")
    print("2. Rebuild and redeploy the frontend")

if __name__ == '__main__':
    main()
