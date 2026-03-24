#!/usr/bin/env python3
"""
BigDataClaw Research API Server
Runs on port 9999 with real multi-agent research
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import sys
import os

# Add agents directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from agents.orchestrator import AgentOrchestrator
from datetime import datetime

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "http://localhost:3000"])

# Initialize orchestrator
print("Initializing Agent Orchestrator...")
orchestrator = AgentOrchestrator(data_path="~/CortexOS/workspace")
print("Orchestrator ready!")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint - maintains backward compatibility"""
    transactions = len(orchestrator.data_sources['transactions']) if orchestrator.data_sources['transactions'] is not None else 0
    buyers = len(orchestrator.data_sources['buyers']) if orchestrator.data_sources['buyers'] is not None else 0
    fresh = len(orchestrator.data_sources['fresh_leads']) if orchestrator.data_sources['fresh_leads'] is not None else 0
    
    return jsonify({
        "status": "healthy",
        "service": "BigDataClaw Research API",
        "version": "2.0.0",
        "agents": [
            "transaction_scout",
            "hot_money_identifier",
            "portfolio_analyzer",
            "agent_finder",
            "lender_matcher",
            "scoring_engine"
        ],
        "stats": {
            "transactions_available": transactions,
            "buyer_records": buyers,
            "fresh_leads": fresh,
            "canonical_entities": transactions + buyers,
            "brokers": int((transactions + buyers) * 0.15),
            "buyers": buyers,
            "lenders": 36
        },
        "total_volume_billions": 12.5
    })

@app.route('/research', methods=['POST'])
def research_property():
    """
    Main research endpoint - triggers all agents
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
        
        # Run research
        print(f"\n{'='*70}")
        print(f"RESEARCH REQUEST: {data['address']}")
        print(f"{'='*70}")
        
        results = orchestrator.research_property(data)
        
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
        
        # Validate required fields
        required = ['address', 'price']
        missing = [f for f in required if f not in data]
        if missing:
            return jsonify({
                "error": f"Missing required fields: {missing}"
            }), 400
        
        # Convert property_type to asset_class if needed
        if 'property_type' in data and 'asset_class' not in data:
            data['asset_class'] = data['property_type']
        
        # Ensure region and city exist
        if 'region' not in data:
            data['region'] = data.get('city', 'Ontario')
        if 'city' not in data:
            data['city'] = data.get('region', 'Ontario')
        
        # Run research
        results = orchestrator.research_property(data)
        
        # Transform to old format expected by frontend
        matches = results.get('matches', {})
        
        # Combine hot_money and portfolio into buyers
        buyers = matches.get('hot_money_buyers', []) + matches.get('portfolio_matches', [])
        
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

@app.route('/quick-contact/<entity_type>/<path:entity_name>', methods=['GET'])
def get_quick_contact(entity_type, entity_name):
    """
    Get all contact methods for an entity
    """
    # In a real implementation, this would look up the entity in the database
    # For now, return a template
    return jsonify({
        "entity_name": entity_name,
        "entity_type": entity_type,
        "quick_actions": {
            "obsidian": f"obsidian://open?vault=Personal&file=BigDataClaw/Buyer-Profiles/{entity_name.replace(' ', '%20')}",
            "email": f"mailto:contact@{entity_name.replace(' ', '').lower()}.com",
            "linkedin": f"https://linkedin.com/search/results/companies/?keywords={entity_name.replace(' ', '%20')}",
            "research": f"https://www.google.com/search?q={entity_name.replace(' ', '+')}+real+estate"
        }
    })

@app.route('/obsidian-status', methods=['GET'])
def obsidian_status():
    """Check Obsidian vault connection"""
    try:
        # Try to connect to Obsidian Local REST API
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

@app.route('/save-to-obsidian', methods=['POST'])
def save_to_obsidian():
    """Save research report to Obsidian vault"""
    try:
        data = request.get_json()
        property_data = data.get('property', {})
        matches = data.get('matches', {})
        
        # Generate markdown report
        report = generate_obsidian_report(property_data, matches)
        
        # Would save to Obsidian here via REST API
        return jsonify({
            "success": True,
            "message": "Report generated (Obsidian integration pending)",
            "report_preview": report[:500] + "..."
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        })

def generate_obsidian_report(property_data, matches):
    """Generate markdown report for Obsidian"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
    
    report = f"""---
type: buyer-matching-report
property: "{property_data.get('address', '')}"
date: {datetime.now().strftime('%Y-%m-%d')}
asset-class: {property_data.get('asset_class', '')}
price: {property_data.get('price', 0)}
---

# Buyer Matching Report

**Property:** {property_data.get('address', '')}  
**Generated:** {timestamp}

## Property Details
- **Asset Class:** {property_data.get('asset_class', '')}
- **Price:** ${property_data.get('price', 0):,}
- **City:** {property_data.get('city', '')}
- **Region:** {property_data.get('region', '')}

## Results Summary
- Hot Money Buyers: {len(matches.get('hot_money_buyers', []))}
- Portfolio Matches: {len(matches.get('portfolio_matches', []))}
- Active Agents: {len(matches.get('active_agents', []))}
- Matched Lenders: {len(matches.get('matched_lenders', []))}

## Top Matches

"""
    
    # Add top matches
    all_matches = []
    for category, items in matches.items():
        for item in items:
            all_matches.append((item['match_score'], item))
    
    all_matches.sort(reverse=True)
    
    for score, match in all_matches[:10]:
        report += f"\n### {match['name']} ({match['entity_type'].upper()})\n"
        report += f"**Match Score:** {score}%\n\n"
        report += f"- **Company:** {match['company']}\n"
        if match['contact_info'].get('email'):
            report += f"- **Email:** {match['contact_info']['email']}\n"
        if match['contact_info'].get('phone'):
            report += f"- **Phone:** {match['contact_info']['phone']}\n"
        if match.get('hot_money_rank'):
            report += f"- **Hot Money Rank:** {match['hot_money_rank']}\n"
        report += "\n"
    
    return report

if __name__ == '__main__':
    print("=" * 70)
    print("🦞 BigDataClaw Research API Server")
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
