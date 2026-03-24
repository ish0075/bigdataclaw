#!/usr/bin/env python3
"""
BigDataClaw API Server
Runs on port 9999 to serve the frontend
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import random

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "http://localhost:3000"])

# Sample data for demo purposes
SAMPLE_BUYERS = [
    {
        "id": 1,
        "name": "Dream Industrial REIT",
        "company": "Dream Unlimited Corp",
        "type": "buyer",
        "match_score": 95,
        "typical_deal_size": "$10M - $100M",
        "asset_focus": ["Industrial", "Warehouse", "Logistics"],
        "contact": {
            "name": "Michael Cooper",
            "title": "VP Acquisitions",
            "email": "m.cooper@dream.ca",
            "phone": "416-555-0101"
        },
        "linkedin": "https://linkedin.com/company/dream-industrial-reit",
        "website": "https://www.dreamindustrialreit.ca",
        "recent_deals": ["Mississauga Distribution Centre - $45M", "Hamilton Logistics Hub - $28M"]
    },
    {
        "id": 2,
        "name": "Pure Industrial REIT",
        "company": "Pure Industrial",
        "type": "buyer",
        "match_score": 88,
        "typical_deal_size": "$5M - $50M",
        "asset_focus": ["Industrial", "Light Manufacturing"],
        "contact": {
            "name": "Sarah Chen",
            "title": "Director, Investments",
            "email": "s.chen@pureindustrial.ca",
            "phone": "416-555-0202"
        },
        "linkedin": "https://linkedin.com/company/pure-industrial",
        "recent_deals": ["Niagara Distribution Facility - $18M"]
    },
    {
        "id": 3,
        "name": "Carttera Private Equity",
        "company": "Carttera Management",
        "type": "buyer",
        "match_score": 82,
        "typical_deal_size": "$20M - $200M",
        "asset_focus": ["Industrial", "Office", "Mixed-Use"],
        "contact": {
            "name": "David Thompson",
            "title": "Managing Partner",
            "email": "d.thompson@carttera.com",
            "phone": "416-555-0303"
        },
        "linkedin": "https://linkedin.com/company/carttera",
        "recent_deals": ["Toronto Industrial Portfolio - $150M", "GTA Logistics Complex - $75M"]
    },
    {
        "id": 4,
        "name": "RioCan REIT",
        "company": "RioCan Real Estate",
        "type": "buyer",
        "match_score": 75,
        "typical_deal_size": "$15M - $500M",
        "asset_focus": ["Retail", "Mixed-Use", "Industrial"],
        "contact": {
            "name": "Jennifer Walsh",
            "title": "SVP, Investments",
            "email": "j.walsh@riocan.com",
            "phone": "416-555-0404"
        },
        "linkedin": "https://linkedin.com/company/riocan",
        "website": "https://www.riocan.com",
        "recent_deals": ["Power Centre Acquisition - $120M"]
    },
    {
        "id": 5,
        "name": "Pension Fund Consortium",
        "company": "CPP/OMERS/OTPP",
        "type": "buyer",
        "match_score": 70,
        "typical_deal_size": "$50M+",
        "asset_focus": ["Industrial", "Office", "Multi-Family"],
        "contact": {
            "name": "Robert Ellis",
            "title": "Head of Real Estate",
            "email": "r.ellis@cppib.com",
            "phone": "416-555-0505"
        },
        "recent_deals": ["National Industrial Portfolio - $800M"]
    }
]

SAMPLE_AGENTS = [
    {
        "id": 101,
        "name": "Dave McGahan",
        "company": "CLV Group",
        "type": "agent",
        "match_score": 92,
        "specialization": ["Industrial", "Investment Sales"],
        "markets": ["Niagara", "Hamilton", "St. Catharines"],
        "contact": {
            "name": "Dave McGahan",
            "title": "Senior Vice President",
            "email": "dave.mcgahan@clvgroup.com",
            "phone": "905-555-1001"
        },
        "linkedin": "https://linkedin.com/in/davemcgahan",
        "recent_deals": ["1500 Michael Drive - $2.5M", "Industrial Portfolio - $18M"]
    },
    {
        "id": 102,
        "name": "Colliers International",
        "company": "Colliers",
        "type": "agent",
        "match_score": 85,
        "specialization": ["Industrial", "Capital Markets"],
        "markets": ["GTA", "Niagara", "Hamilton"],
        "contact": {
            "name": "Industrial Team",
            "title": "Investment Specialists",
            "email": "industrial@colliers.com",
            "phone": "416-555-1002"
        },
        "linkedin": "https://linkedin.com/company/colliers",
        "recent_deals": ["Distribution Centre Sale - $45M"]
    },
    {
        "id": 103,
        "name": "CBRE Limited",
        "company": "CBRE",
        "type": "agent",
        "match_score": 80,
        "specialization": ["Industrial", "Logistics"],
        "markets": ["Ontario-wide"],
        "contact": {
            "name": "CBRE Industrial",
            "title": "Advisory Team",
            "email": "industrial@cbre.ca",
            "phone": "416-555-1003"
        },
        "linkedin": "https://linkedin.com/company/cbre",
        "recent_deals": ["Major Logistics Portfolio - $200M+"]
    }
]

SAMPLE_LENDERS = [
    {
        "id": 201,
        "name": "RBC Commercial Banking",
        "company": "Royal Bank of Canada",
        "type": "lender",
        "match_score": 90,
        "loan_types": ["Acquisition", "Refinance", "Construction"],
        "typical_loan_size": "$5M - $100M",
        "contact": {
            "name": "Commercial Lending Team",
            "title": "VP, Real Estate Finance",
            "email": "commercial.realEstate@rbc.com",
            "phone": "416-555-2001"
        },
        "linkedin": "https://linkedin.com/company/rbc",
        "recent_deals": ["Industrial Acquisition Financing - $35M"]
    },
    {
        "id": 202,
        "name": "TD Commercial Real Estate",
        "company": "TD Bank",
        "type": "lender",
        "match_score": 85,
        "loan_types": ["Term Loans", "Lines of Credit", "Construction"],
        "typical_loan_size": "$10M - $150M",
        "contact": {
            "name": "CRE Lending",
            "title": "Director, Real Estate",
            "email": "cre.lending@td.com",
            "phone": "416-555-2002"
        },
        "linkedin": "https://linkedin.com/company/tdbank",
        "recent_deals": ["Portfolio Refinance - $80M"]
    },
    {
        "id": 203,
        "name": "CMHC (MLI Select)",
        "company": "Canada Mortgage and Housing",
        "type": "lender",
        "match_score": 65,
        "loan_types": ["Multi-Family", "Affordable Housing"],
        "typical_loan_size": "$5M - $50M",
        "contact": {
            "name": "MLI Select Team",
            "title": "Program Specialists",
            "email": "mli.select@cmhc.ca",
            "phone": "1-800-555-2003"
        },
        "linkedin": "https://linkedin.com/company/cmhc",
        "recent_deals": ["Apartment Complex Financing - $25M"]
    }
]

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "BigDataClaw API",
        "version": "1.0.0",
        "stats": {
            "canonical_entities": 245,
            "brokers": 89,
            "buyers": 120,
            "lenders": 36
        },
        "total_volume_billions": 12.5
    })

@app.route('/match-all', methods=['POST'])
def match_all():
    """Match property to buyers, agents, and lenders"""
    data = request.get_json()
    
    address = data.get('address', '')
    property_type = data.get('property_type', 'industrial')
    price = data.get('price', 5000000)
    size_sf = data.get('size_sf', 80000)
    city = data.get('city', '')
    
    # Filter and score matches based on property criteria
    buyers = filter_matches(SAMPLE_BUYERS, property_type, price, city)
    agents = filter_matches(SAMPLE_AGENTS, property_type, price, city)
    lenders = filter_matches(SAMPLE_LENDERS, property_type, price, city)
    
    # Add some randomness to make it feel dynamic
    for match_list in [buyers, agents, lenders]:
        for match in match_list:
            match['match_score'] = min(100, max(50, match['match_score'] + random.randint(-5, 5)))
    
    return jsonify({
        "status": "success",
        "property": {
            "address": address,
            "type": property_type,
            "price": price,
            "size_sf": size_sf,
            "city": city
        },
        "buyers": buyers,
        "agents": agents,
        "lenders": lenders,
        "total_matches": len(buyers) + len(agents) + len(lenders)
    })

@app.route('/obsidian-status', methods=['GET'])
def obsidian_status():
    """Check Obsidian vault connection"""
    return jsonify({
        "connected": False,
        "vault_path": "/home/jamie/Obsidian/BigDataClaw",
        "status": "Vault not configured"
    })

@app.route('/save-to-obsidian', methods=['POST'])
def save_to_obsidian():
    """Save report to Obsidian vault"""
    return jsonify({
        "success": False,
        "error": "Obsidian integration not yet configured"
    })

def filter_matches(matches, property_type, price, city):
    """Filter matches based on property criteria"""
    filtered = []
    
    for match in matches:
        score = match['match_score']
        
        # Adjust score based on price alignment
        if match['type'] == 'buyer' and 'typical_deal_size' in match:
            if price >= 10000000:  # $10M+
                if '50M' in match['typical_deal_size'] or '100M' in match['typical_deal_size']:
                    score += 5
            elif price >= 5000000:  # $5M+
                if '5M' in match['typical_deal_size']:
                    score += 5
        
        # Adjust for property type alignment
        if match['type'] == 'buyer' and 'asset_focus' in match:
            if any(pt.lower() in ' '.join(match['asset_focus']).lower() for pt in [property_type, 'industrial']):
                score += 3
        
        match['match_score'] = min(100, score)
        filtered.append(match)
    
    # Sort by match score
    filtered.sort(key=lambda x: x['match_score'], reverse=True)
    return filtered

if __name__ == '__main__':
    print("=" * 70)
    print("🦞 BigDataClaw API Server")
    print("=" * 70)
    print("Starting server on http://0.0.0.0:9999")
    print("Press Ctrl+C to stop")
    print("=" * 70)
    
    app.run(
        host='0.0.0.0',
        port=9999,
        debug=True,
        threaded=True
    )
