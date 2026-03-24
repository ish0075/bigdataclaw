#!/usr/bin/env python3
import requests
import json

# Test the research API
url = "http://localhost:9999/research"
data = {
    "address": "1500 Michael Drive, Welland",
    "city": "Welland",
    "region": "Niagara",
    "asset_class": "industrial",
    "price": 5000000,
    "size_sf": 80000
}

try:
    resp = requests.post(url, json=data, timeout=30)
    result = resp.json()
    
    if 'error' in result:
        print(f"ERROR: {result['error']}")
    else:
        print("SUCCESS!")
        print(f"Recent deals found: {result.get('recent_deals_found', 0)}")
        print("\nMatches by category:")
        for category, items in result.get('matches', {}).items():
            print(f"  {category}: {len(items)}")
        
        print("\nTop 5 Matches:")
        for i, match in enumerate(result.get('top_matches', [])[:5], 1):
            print(f"{i}. {match['name']} ({match['entity_type']}) - {match['match_score']}%")
            
except Exception as e:
    print(f"Request failed: {e}")
