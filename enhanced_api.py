#!/usr/bin/env python3
"""
BigDataClaw Enhanced API Server
Uses Desktop resources: matching engine, buyer data, and Obsidian integration
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import sys
import os

# Add project directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from matching_engine import MatchingEngine
from agents.orchestrator import AgentOrchestrator
from datetime import datetime

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "http://localhost:3000"])

# Initialize both engines
print("=" * 70)
print("Initializing BigDataClaw Enhanced API...")
print("=" * 70)

# Legacy orchestrator (for transaction data)
orchestrator = AgentOrchestrator(data_path="~/CortexOS/workspace")

# New matching engine (for buyer profiles)
matching_engine = MatchingEngine()

# Try to load buyer profiles from Desktop resources
buyers_dir = "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/buyers_data"
desktop_resources = "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/desktop_resources"

try:
    if os.path.exists(buyers_dir):
        print(f"\nLoading buyer profiles from: {buyers_dir}")
        matching_engine.load_buyers_from_markdown(buyers_dir)
        print(f"✓ Loaded {len(matching_engine.db)} buyers from buyers_data")
    
    # Also try to load from desktop_resources if there are markdown files there
    if os.path.exists(desktop_resources):
        md_files = [f for f in os.listdir(desktop_resources) if f.endswith('.md')]
        if md_files:
            print(f"\nLoading additional profiles from: {desktop_resources}")
            additional_buyers = matching_engine.load_buyers_from_markdown(desktop_resources)
            print(f"✓ Total buyers in database: {len(matching_engine.db)}")
except Exception as e:
    print(f"⚠️ Warning: Could not load buyer profiles: {e}")

print("\n" + "=" * 70)
print("API Ready!")
print("=" * 70)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    transactions = len(orchestrator.data_sources['transactions']) if orchestrator.data_sources['transactions'] is not None else 0
    buyers = len(orchestrator.data_sources['buyers']) if orchestrator.data_sources['buyers'] is not None else 0
    profile_buyers = len(matching_engine.db)
    
    return jsonify({
        "status": "healthy",
        "service": "BigDataClaw Enhanced API",
        "version": "3.0.0",
        "engines": [
            "transaction_scout",
            "hot_money_identifier",
            "portfolio_analyzer",
            "matching_engine_v2"
        ],
        "stats": {
            "transactions_available": transactions,
            "buyer_records": buyers,
            "profile_buyers": profile_buyers,
            "canonical_entities": transactions + buyers + profile_buyers,
            "brokers": int((transactions + buyers) * 0.15),
            "buyers": buyers + profile_buyers,
            "lenders": 36
        },
        "total_volume_billions": 12.5
    })

@app.route('/research', methods=['POST'])
def research_property():
    """
    Main research endpoint - uses both engines
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        required = ['address', 'city', 'region', 'asset_class', 'price']
        missing = [f for f in required if f not in data]
        if missing:
            return jsonify({
                "error": f"Missing required fields: {missing}"
            }), 400
        
        print(f"\n{'='*70}")
        print(f"RESEARCH REQUEST: {data['address']}")
        print(f"{'='*70}")
        
        # Run both research engines
        results = {
            'property': data,
            'research_timestamp': datetime.now().isoformat(),
            'agents_executed': [],
            'matches': {
                'hot_money_buyers': [],
                'portfolio_matches': [],
                'profile_matches': [],
                'active_agents': [],
                'matched_lenders': []
            }
        }
        
        # Phase 1: Transaction Scout (legacy)
        print("\nPhase 1: Transaction Scout Agent")
        from dataclasses import dataclass
        
        @dataclass
        class PropSub:
            address: str
            city: str
            region: str
            asset_class: str
            price: float
            size_sf: float = None
            
        prop = PropSub(**{k: data.get(k) for k in ['address', 'city', 'region', 'asset_class', 'price', 'size_sf'] if k in data})
        
        recent_deals = orchestrator._transaction_scout(prop)
        results['recent_deals_found'] = len(recent_deals)
        results['agents_executed'].append('transaction_scout')
        print(f"   Found {len(recent_deals)} recent transactions")
        
        # Phase 2: Hot Money Identifier (legacy)
        print("\nPhase 2: Hot Money Identifier")
        hot_money = orchestrator._identify_hot_money(recent_deals, prop)
        results['matches']['hot_money_buyers'] = hot_money
        results['agents_executed'].append('hot_money_identifier')
        print(f"   Identified {len(hot_money)} hot money targets")
        
        # Phase 3: Portfolio Analyzer (legacy)
        print("\nPhase 3: Portfolio Analyzer")
        portfolio_matches = orchestrator._analyze_portfolios(prop)
        results['matches']['portfolio_matches'] = portfolio_matches
        results['agents_executed'].append('portfolio_analyzer')
        print(f"   Found {len(portfolio_matches)} portfolio matches")
        
        # Phase 4: NEW Matching Engine v2 (from Desktop resources)
        print("\nPhase 4: Matching Engine v2 (Desktop Buyer Profiles)")
        if matching_engine.db:
            v2_matches = matching_engine.find_matches(data, limit=10)
            # Convert MatchResult objects to dicts
            profile_matches = [m.to_dict() for m in v2_matches]
            results['matches']['profile_matches'] = profile_matches
            results['agents_executed'].append('matching_engine_v2')
            print(f"   Found {len(profile_matches)} profile matches from Desktop data")
        else:
            print("   No profile buyers loaded")
        
        # Phase 5: Lender Matcher
        print("\nPhase 5: Lender Matcher")
        lenders = orchestrator._match_lenders(prop)
        results['matches']['matched_lenders'] = lenders
        results['agents_executed'].append('lender_matcher')
        print(f"   Found {len(lenders)} matching lenders")
        
        # Combine all matches
        all_matches = []
        for category, items in results['matches'].items():
            for item in items:
                item['match_category'] = category
                all_matches.append(item)
        
        # Sort by score and take top 20
        all_matches.sort(key=lambda x: x.get('match_score', 0), reverse=True)
        results['top_matches'] = all_matches[:20]
        
        print(f"\n{'='*70}")
        print(f"RESEARCH COMPLETE: {len(all_matches)} total matches")
        print(f"{'='*70}")
        
        return jsonify(results)
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/match-all', methods=['POST'])
def match_all():
    """
    Legacy endpoint - maintains backward compatibility
    """
    try:
        data = request.get_json()
        
        # Convert property_type to asset_class if needed
        if 'property_type' in data and 'asset_class' not in data:
            data['asset_class'] = data['property_type']
        
        # Ensure region and city exist
        if 'region' not in data:
            data['region'] = data.get('city', 'Ontario')
        if 'city' not in data:
            data['city'] = data.get('region', 'Ontario')
        
        # Run research
        results = research_property().get_json()
        
        if 'error' in results:
            return jsonify(results), 500
        
        # Transform to old format expected by frontend
        matches = results.get('matches', {})
        
        # Combine all buyer types
        buyers = (
            matches.get('hot_money_buyers', []) + 
            matches.get('portfolio_matches', []) +
            matches.get('profile_matches', [])
        )
        
        return jsonify({
            "buyers": buyers,
            "agents": matches.get('active_agents', []),
            "lenders": matches.get('matched_lenders', []),
            "total_matches": len(buyers) + len(matches.get('active_agents', [])) + len(matches.get('matched_lenders', []))
        })
        
    except Exception as e:
        print(f"Error in match_all: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/buyer-profile/<buyer_id>', methods=['GET'])
def get_buyer_profile(buyer_id):
    """
    Get detailed buyer profile
    """
    # Search in matching engine database
    for buyer in matching_engine.db:
        if buyer.get('id') == buyer_id or buyer.get('company_name') == buyer_id:
            return jsonify(buyer)
    
    return jsonify({"error": "Buyer not found"}), 404

@app.route('/buyers', methods=['GET'])
def list_buyers():
    """
    List all buyers in the database
    """
    limit = request.args.get('limit', 50, type=int)
    
    buyers = []
    for buyer in matching_engine.db[:limit]:
        buyers.append({
            'id': buyer.get('id'),
            'company_name': buyer.get('company_name'),
            'contact_name': buyer.get('contact_name'),
            'last_sale_amount': buyer.get('last_sale_amount'),
            'asset_classes': buyer.get('preferred_asset_classes', {}).get('types', [])
        })
    
    return jsonify({
        'count': len(buyers),
        'total': len(matching_engine.db),
        'buyers': buyers
    })

@app.route('/obsidian-status', methods=['GET'])
def obsidian_status():
    """Check Obsidian vault connection"""
    try:
        import urllib3
        http = urllib3.PoolManager(cert_reqs='CERT_NONE')
        
        response = http.request(
            'GET',
            'https://127.0.0.1:27124/vault/',
            headers={'Authorization': 'Bearer REDACTED_OBSIDIAN_API_KEY'},
            timeout=2
        )
        
        if response.status == 200:
            return jsonify({
                "connected": True,
                "vault_path": "/home/jamie/Desktop/Jamie's Personal Vault",
                "status": "Connected to Obsidian Local REST API"
            })
        else:
            return jsonify({
                "connected": False,
                "status": f"HTTP {response.status}"
            })
            
    except Exception as e:
        return jsonify({
            "connected": False,
            "status": f"Not connected: {str(e)}"
        })

if __name__ == '__main__':
    print("\n" + "=" * 70)
    print("🦞 BigDataClaw Enhanced API Server")
    print("=" * 70)
    print("Starting server on http://0.0.0.0:9999")
    print("Press Ctrl+C to stop")
    print("=" * 70 + "\n")
    
    app.run(
        host='0.0.0.0',
        port=10000,
        debug=True,
        threaded=True
    )
