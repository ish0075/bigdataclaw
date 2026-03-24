#!/usr/bin/env python3
"""
Obsidian Integration for BigDataClaw
Based on Desktop/bigdata claw/obsidian-bridge.sh
Creates and manages buyer profiles in Obsidian vault
"""

import requests
import urllib3
from datetime import datetime
from typing import Optional, Dict, List
import os
import json

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Configuration
DEFAULT_API_KEY = "REDACTED_OBSIDIAN_API_KEY"
DEFAULT_BASE_URL = "https://127.0.0.1:27124"
VAULT_PATH = "/BigDataClaw/Buyer-Profiles"


class ObsidianIntegration:
    """Integration with Obsidian vault for buyer profile management"""
    
    def __init__(self, api_key: str = DEFAULT_API_KEY, base_url: str = DEFAULT_BASE_URL):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {'Authorization': f'Bearer {api_key}'}
    
    def _request(self, method: str, path: str, **kwargs) -> requests.Response:
        """Make request to Obsidian API"""
        url = f"{self.base_url}{path}"
        headers = {**self.headers, **kwargs.pop('headers', {})}
        return requests.request(method, url, headers=headers, verify=False, timeout=10, **kwargs)
    
    def test_connection(self) -> tuple[bool, str]:
        """Test connection to Obsidian"""
        try:
            resp = self._request('GET', '/vault/')
            if resp.status_code == 200:
                data = resp.json()
                return True, f"Connected! {len(data.get('files', []))} items in vault."
            return False, f"HTTP {resp.status_code}"
        except Exception as e:
            return False, str(e)
    
    def create_buyer_profile(self, buyer: Dict, match_result: Optional[Dict] = None) -> bool:
        """
        Create a buyer profile note in Obsidian
        Based on Desktop/bigdata claw sample buyer profiles
        """
        company_name = buyer.get('company_name', 'Unknown')
        safe_name = company_name.replace(' ', '_').replace('/', '_')[:50]
        
        # Build content based on Desktop format
        content = self._generate_profile_content(buyer, match_result)
        
        path = f"{VAULT_PATH}/{safe_name}.md"
        
        try:
            resp = self._request('PUT', f'/vault/{path}', 
                               data=content,
                               headers={'Content-Type': 'text/markdown'})
            return resp.status_code in (200, 204)
        except Exception as e:
            print(f"Error creating profile: {e}")
            return False
    
    def _generate_profile_content(self, buyer: Dict, match_result: Optional[Dict]) -> str:
        """Generate markdown content for buyer profile"""
        
        company = buyer.get('company_name', 'Unknown')
        contact = buyer.get('contact_name', '')
        title = buyer.get('contact_title', '')
        
        # Deal intelligence
        last_sale = buyer.get('last_sale_amount', 0)
        last_sale_date = buyer.get('last_sale_date', '')
        
        # Asset classes
        asset_classes = buyer.get('preferred_asset_classes', {}).get('types', [])
        asset_class_str = ', '.join(asset_classes) if asset_classes else 'Various'
        
        # Geographic focus
        cities = buyer.get('geographic_focus', {}).get('cities', [])
        regions = buyer.get('geographic_focus', {}).get('regions', [])
        locations = cities + regions
        location_str = ', '.join(locations[:3]) if locations else 'Ontario'
        
        # Deal size range
        min_deal = buyer.get('typical_deal_size_min', 0)
        max_deal = buyer.get('typical_deal_size_max', 0)
        
        # Quick actions
        email = buyer.get('email', '')
        phone = buyer.get('company_phone', '')
        linkedin = buyer.get('linkedin_url', '')
        website = buyer.get('company_website', '')
        
        # Match info
        match_score = match_result.get('match_score', 0) if match_result else 0
        match_reasons = match_result.get('match_reasons', []) if match_result else []
        
        content = f"""---
type: buyer-profile
company: "{company}"
contact: "{contact}"
title: "{title}"
match_score: {match_score}
asset_classes: {json.dumps(asset_classes)}
locations: {json.dumps(locations[:3])}
last_updated: {datetime.now().strftime('%Y-%m-%d')}
---

# {company}

## 💰 Deal Intelligence
"""
        
        if last_sale:
            content += f"- **Recent Deal:** ${last_sale:,.0f}\n"
        if last_sale_date:
            content += f"- **Last Transaction:** {last_sale_date}\n"
        if min_deal and max_deal:
            content += f"- **Typical Deal Size:** ${min_deal:,.0f} - ${max_deal:,.0f}\n"
        
        content += f"""- **Asset Class:** {asset_class_str}
- **Geographic Focus:** {location_str}

## 📞 Contact Information
"""
        
        if email:
            content += f"- **Email:** [{email}](mailto:{email})\n"
        if phone:
            content += f"- **Phone:** [{phone}](tel:{phone.replace(' ', '')})\n"
        if linkedin:
            content += f"- **LinkedIn:** [Profile]({linkedin})\n"
        if website:
            content += f"- **Website:** [{website}]({website})\n"
        
        # Quick Actions
        content += "\n## ⚡ Quick Actions\n"
        if email:
            content += f"- [✉️ Send Email](mailto:{email}?subject=Investment%20Opportunity)\n"
        if linkedin:
            content += f"- [💼 LinkedIn Message]({linkedin})\n"
        if phone:
            content += f"- [📞 Call Now](tel:{phone.replace(' ', '')})\n"
        
        # Match Analysis
        if match_score > 0:
            content += f"\n## 🎯 Match Analysis\n"
            content += f"**Match Score:** {match_score}%\n\n"
            if match_reasons:
                content += "**Why They Match:**\n"
                for reason in match_reasons:
                    content += f"- {reason}\n"
        
        # Connection Log
        content += """\n## 📝 Connection Log
| Date | Platform | Action | Response | Next Step |
|------|----------|--------|----------|-----------|
| | | | | |

---
#buyer #hot-money #prospect
"""
        
        return content
    
    def create_daily_note(self, date: Optional[str] = None) -> bool:
        """Create a daily activity note"""
        if date is None:
            date = datetime.now().strftime('%Y-%m-%d')
        
        content = f"""# Daily Activity - {date}

## 🎯 Priority Actions
- [ ] 
- [ ] 
- [ ] 

## 📞 Calls Made
| Time | Contact | Result | Next Action |
|------|---------|--------|-------------|
| | | | |

## 🔥 Hot Money Updates

## 📧 Emails Sent

## 📝 Notes

---
*Generated by BigDataClaw AI*
"""
        
        path = f"/BigDataClaw/Daily/{date}.md"
        
        try:
            resp = self._request('PUT', f'/vault/{path}',
                               data=content,
                               headers={'Content-Type': 'text/markdown'})
            return resp.status_code in (200, 204)
        except Exception as e:
            print(f"Error creating daily note: {e}")
            return False
    
    def search_vault(self, query: str) -> List[Dict]:
        """Search Obsidian vault"""
        try:
            resp = self._request('POST', '/search/',
                               headers={'Content-Type': 'application/json'},
                               json={'query': query})
            if resp.status_code == 200:
                return resp.json()
            return []
        except Exception as e:
            print(f"Error searching vault: {e}")
            return []
    
    def ensure_folder_structure(self):
        """Create necessary folders in Obsidian"""
        folders = [
            '/BigDataClaw',
            '/BigDataClaw/Buyer-Profiles',
            '/BigDataClaw/Daily',
            '/BigDataClaw/Reports',
            '/BigDataClaw/Listings'
        ]
        
        for folder in folders:
            try:
                self._request('PUT', f'/vault/{folder}/')
            except:
                pass  # Folder might already exist


def sync_matches_to_obsidian(matches: List[Dict], obsidian: Optional[ObsidianIntegration] = None):
    """
    Sync research matches to Obsidian vault
    
    Args:
        matches: List of match results from research API
        obsidian: ObsidianIntegration instance (creates default if None)
    """
    if obsidian is None:
        obsidian = ObsidianIntegration()
    
    # Test connection first
    connected, msg = obsidian.test_connection()
    if not connected:
        print(f"⚠️ Cannot sync to Obsidian: {msg}")
        return False
    
    print(f"✓ {msg}")
    
    # Ensure folders exist
    obsidian.ensure_folder_structure()
    
    # Create profiles for each buyer match
    success_count = 0
    for match in matches:
        if match.get('entity_type') in ['buyer', 'hot_money']:
            # Convert match back to buyer format
            buyer = {
                'company_name': match.get('name', ''),
                'contact_name': match.get('contact_name', ''),
                'contact_title': match.get('contact_info', {}).get('title', ''),
                'email': match.get('contact_info', {}).get('email', ''),
                'company_phone': match.get('contact_info', {}).get('phone', ''),
                'linkedin_url': match.get('contact_info', {}).get('linkedin', ''),
                'last_sale_amount': match.get('capital_available', 0),
                'match_score': match.get('match_score', 0)
            }
            
            if obsidian.create_buyer_profile(buyer, match):
                success_count += 1
                print(f"  ✓ Created profile: {buyer['company_name']}")
    
    print(f"\n✓ Synced {success_count} buyer profiles to Obsidian")
    return True


if __name__ == '__main__':
    # Test the integration
    obsidian = ObsidianIntegration()
    
    print("Testing Obsidian Integration...")
    connected, msg = obsidian.test_connection()
    print(f"Status: {msg}")
    
    if connected:
        # Create test buyer profile
        test_buyer = {
            'company_name': 'Test Buyer Corp',
            'contact_name': 'John Smith',
            'contact_title': 'VP Acquisitions',
            'email': 'john@testbuyer.com',
            'company_phone': '416-555-0100',
            'linkedin_url': 'https://linkedin.com/in/johnsmith',
            'last_sale_amount': 5000000,
            'last_sale_date': '2025-02-15',
            'typical_deal_size_min': 2000000,
            'typical_deal_size_max': 10000000,
            'preferred_asset_classes': {'types': ['industrial', 'retail']},
            'geographic_focus': {'cities': ['Toronto', 'Hamilton'], 'regions': ['GTA']}
        }
        
        test_match = {
            'match_score': 85,
            'match_reasons': [
                'Price fits buyer typical range ($2M-$10M)',
                'Active in Hamilton market',
                '🔥 HOT MONEY: Closed $5M 15 days ago'
            ]
        }
        
        print("\nCreating test buyer profile...")
        if obsidian.create_buyer_profile(test_buyer, test_match):
            print("✓ Profile created successfully!")
        else:
            print("✗ Failed to create profile")
