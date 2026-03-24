#!/usr/bin/env python3
"""
Property Matcher - Core Matching Engine
Based on Desktop/bigdata claw/buyermatching.md
Matches property listings with qualified buyers based on multiple criteria.
"""

from typing import List, Tuple, Dict, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
import json
import re

@dataclass
class MatchResult:
    buyer_id: str
    company_name: str
    contact_name: str
    match_score: int
    match_reasons: List[str]
    last_sale_amount: float
    last_sale_date: Optional[datetime]
    has_1031_deadline: bool
    exchange_deadline: Optional[datetime] = None
    contact_info: Dict = None
    quick_actions: Dict = None
    
    def to_dict(self):
        result = asdict(self)
        # Convert datetime to string for JSON serialization
        if self.last_sale_date:
            result['last_sale_date'] = self.last_sale_date.isoformat()
        if self.exchange_deadline:
            result['exchange_deadline'] = self.exchange_deadline.isoformat()
        return result


class MatchingEngine:
    """Core matching algorithm for buyer-listing pairing."""
    
    def __init__(self, buyers_db=None):
        self.db = buyers_db or []
        
    def find_matches(self, listing: dict, limit: int = 10) -> List[MatchResult]:
        """
        Find top N matching buyers for a listing.
        
        Args:
            listing: Dict with address, city, price, property_type, etc.
            limit: Number of matches to return
            
        Returns:
            List of MatchResult objects sorted by score
        """
        buyers = self._get_active_buyers()
        scored_matches = []
        
        for buyer in buyers:
            score, reasons = self._calculate_match_score(listing, buyer)
            
            if score >= 30:  # Minimum threshold
                # Parse last_sale_date
                last_sale_date = None
                if buyer.get('last_sale_date'):
                    try:
                        if isinstance(buyer['last_sale_date'], str):
                            last_sale_date = datetime.fromisoformat(buyer['last_sale_date'].replace('Z', '+00:00'))
                        else:
                            last_sale_date = buyer['last_sale_date']
                    except:
                        pass
                
                match = MatchResult(
                    buyer_id=buyer.get('id', ''),
                    company_name=buyer.get('company_name', ''),
                    contact_name=buyer.get('contact_name', ''),
                    match_score=score,
                    match_reasons=reasons,
                    last_sale_amount=buyer.get('last_sale_amount', 0),
                    last_sale_date=last_sale_date,
                    has_1031_deadline=buyer.get('has_1031_deadline', False),
                    exchange_deadline=buyer.get('exchange_deadline'),
                    contact_info={
                        'email': buyer.get('email', ''),
                        'phone': buyer.get('company_phone', ''),
                        'linkedin': buyer.get('linkedin_url', ''),
                        'website': buyer.get('company_website', ''),
                        'title': buyer.get('contact_title', '')
                    },
                    quick_actions=self._generate_quick_actions(buyer, listing)
                )
                scored_matches.append(match)
        
        # Sort by score descending, take top N
        scored_matches.sort(key=lambda x: x.match_score, reverse=True)
        return scored_matches[:limit]
    
    def _calculate_match_score(self, listing: dict, buyer: dict) -> Tuple[int, List[str]]:
        """
        Calculate match score (0-100) and generate reasons.
        
        Scoring weights:
        - Price match: 30 points
        - Geographic match: 25 points
        - Asset class match: 20 points
        - Hot money status: 15 points
        - 1031 urgency: 10 points
        """
        score = 0
        reasons = []
        
        # 1. Price Match (30 points)
        min_price = buyer.get('typical_deal_size_min', 0)
        max_price = buyer.get('typical_deal_size_max', float('inf'))
        listing_price = listing.get('price', 0) or listing.get('asking_price', 0)
        
        if min_price <= listing_price <= max_price:
            score += 30
            reasons.append(f"Price fits buyer's typical range ({self._fmt_money(min_price)}-{self._fmt_money(max_price)})")
        elif listing_price * 0.5 <= max_price:
            score += 15
            reasons.append("Price within stretch range")
        
        # 2. Geographic Match (25 points)
        listing_city = listing.get('city', '')
        listing_region = listing.get('region', '')
        buyer_cities = buyer.get('geographic_focus', {}).get('cities', [])
        buyer_regions = buyer.get('geographic_focus', {}).get('regions', [])
        
        if listing_city in buyer_cities:
            score += 25
            reasons.append(f"Active in {listing_city} market")
        elif listing_region in buyer_regions:
            score += 20
            reasons.append(f"Active in {listing_region} region")
        elif any(city.lower() in listing_city.lower() or listing_city.lower() in city.lower() 
                 for city in buyer_cities if city):
            score += 15
            reasons.append(f"Similar market presence")
        
        # 3. Asset Class Match (20 points)
        listing_type = listing.get('asset_class', '') or listing.get('property_type', '')
        buyer_types = buyer.get('preferred_asset_classes', {}).get('types', [])
        
        if listing_type and buyer_types:
            if listing_type.lower() in [t.lower() for t in buyer_types]:
                score += 20
                reasons.append(f"Targets {listing_type} properties")
            elif any(t.lower() in listing_type.lower() for t in buyer_types if t):
                score += 10
                reasons.append(f"Related asset class interest")
        
        # 4. Hot Money Status (15 points) - CRITICAL
        last_sale = buyer.get('last_sale_date')
        if last_sale:
            try:
                if isinstance(last_sale, str):
                    last_sale_date = datetime.fromisoformat(last_sale.replace('Z', '+00:00'))
                else:
                    last_sale_date = last_sale
                    
                days_since = (datetime.now() - last_sale_date).days
                last_amount = buyer.get('last_sale_amount', 0)
                
                if days_since <= 30:
                    score += 15
                    reasons.append(f"🔥 HOT MONEY: Closed {self._fmt_money(last_amount)} {days_since} days ago")
                elif days_since <= 90:
                    score += 10
                    reasons.append(f"Recent sale: {self._fmt_money(last_amount)} ({days_since} days ago)")
                elif days_since <= 180:
                    score += 5
                    reasons.append(f"Sale activity: {self._fmt_money(last_amount)} ({days_since} days ago)")
            except:
                pass
        
        # 5. 1031 Urgency (10 points)
        if buyer.get('has_1031_deadline') and buyer.get('exchange_deadline'):
            try:
                if isinstance(buyer['exchange_deadline'], str):
                    deadline = datetime.fromisoformat(buyer['exchange_deadline'].replace('Z', '+00:00'))
                else:
                    deadline = buyer['exchange_deadline']
                    
                days_to_deadline = (deadline - datetime.now()).days
                if days_to_deadline <= 60:
                    score += 10
                    reasons.append(f"⏰ URGENT: 1031 deadline in {days_to_deadline} days")
                elif days_to_deadline <= 120:
                    score += 5
                    reasons.append(f"1031 deadline approaching ({days_to_deadline} days)")
            except:
                pass
        
        # Portfolio size bonus (up to 10 points)
        portfolio_size = buyer.get('portfolio_size', 0)
        if portfolio_size >= 10:
            score += 10
            reasons.append(f"Large portfolio ({portfolio_size} properties)")
        elif portfolio_size >= 5:
            score += 7
            reasons.append(f"Growing portfolio ({portfolio_size} properties)")
        elif portfolio_size >= 2:
            score += 5
            reasons.append(f"Multi-property owner")
        
        return min(score, 100), reasons
    
    def _get_active_buyers(self) -> List[dict]:
        """Fetch all active buyers from database."""
        return [b for b in self.db if b.get('is_active', True)]
    
    def _fmt_money(self, amount: float) -> str:
        """Format money for display."""
        if not amount:
            return "$0"
        if amount >= 1000000:
            return f"${amount/1000000:.1f}M"
        return f"${amount/1000:.0f}K"
    
    def _generate_quick_actions(self, buyer: dict, listing: dict) -> dict:
        """Generate quick action links for contacting buyer."""
        email = buyer.get('email', '')
        phone = buyer.get('company_phone', '')
        linkedin = buyer.get('linkedin_url', '')
        company = buyer.get('company_name', '')
        city = listing.get('city', 'Your City')
        
        actions = {}
        
        if email:
            subject = f"Investment Opportunity - {listing.get('asset_class', 'Commercial')} in {city}"
            actions['email'] = f"mailto:{email}?subject={subject.replace(' ', '%20')}"
        
        if phone:
            # Clean phone number
            clean_phone = re.sub(r'[^\d+]', '', phone)
            actions['phone'] = f"tel:{clean_phone}"
        
        if linkedin:
            actions['linkedin'] = linkedin
            # Generate message link if it's a company page
            if 'company' in linkedin:
                actions['linkedin_message'] = linkedin
        
        # Obsidian note link
        safe_name = company.replace(' ', '_').replace('/', '_')[:50]
        actions['obsidian'] = f"obsidian://open?vault=Personal&file=BigDataClaw/Buyer-Profiles/{safe_name}"
        
        # Research link
        actions['research'] = f"https://www.google.com/search?q={company.replace(' ', '+')}+real+estate"
        
        return actions
    
    def load_buyers_from_markdown(self, markdown_dir: str):
        """Load buyer profiles from markdown files."""
        import os
        import glob
        
        buyers = []
        
        # Find all markdown files
        pattern = os.path.join(markdown_dir, '**/*.md')
        files = glob.glob(pattern, recursive=True)
        
        for filepath in files:
            try:
                with open(filepath, 'r') as f:
                    content = f.read()
                
                buyer = self._parse_buyer_markdown(content, filepath)
                if buyer:
                    buyers.append(buyer)
            except Exception as e:
                print(f"Error parsing {filepath}: {e}")
        
        self.db = buyers
        print(f"Loaded {len(buyers)} buyers from markdown files")
        return buyers
    
    def _parse_buyer_markdown(self, content: str, filepath: str) -> Optional[dict]:
        """Parse a buyer markdown file into a dict."""
        buyer = {
            'id': filepath.split('/')[-1].replace('.md', ''),
            'data_source': 'markdown_profile',
            'is_active': True
        }
        
        # Extract frontmatter
        if content.startswith('---'):
            parts = content.split('---', 2)
            if len(parts) >= 3:
                frontmatter = parts[1]
                body = parts[2]
                
                # Parse frontmatter
                for line in frontmatter.strip().split('\n'):
                    if ':' in line:
                        key, value = line.split(':', 1)
                        key = key.strip()
                        value = value.strip()
                        
                        if key == 'type':
                            buyer['buyer_type'] = value
                        elif key == 'category':
                            buyer['category'] = value
                        elif key == 'match_score':
                            try:
                                buyer['match_score'] = int(value)
                            except:
                                pass
                        elif key == 'priority':
                            buyer['priority'] = value
                        elif key == 'asset_class':
                            buyer['preferred_asset_classes'] = {'types': [value]}
        
        # Extract from body
        lines = content.split('\n')
        in_deal_intel = False
        
        for i, line in enumerate(lines):
            # Company name from heading
            if line.startswith('# ') and not line.startswith('##'):
                buyer['company_name'] = line.replace('# ', '').strip()
            
            # Contact name
            if 'contact_name' not in buyer and ('Contact' in line or 'President' in line or 'CEO' in line):
                # Try to extract name from next lines
                for j in range(i+1, min(i+5, len(lines))):
                    if lines[j].strip() and not lines[j].startswith('#'):
                        buyer['contact_name'] = lines[j].strip().split(':')[-1].strip()
                        break
            
            # Deal intelligence
            if 'Deal Intelligence' in line:
                in_deal_intel = True
            
            if in_deal_intel:
                if 'Recent Deal:' in line or 'recent deal' in line.lower():
                    # Extract amount
                    match = re.search(r'\$([\d,]+(?:\.\d+)?)([MK]?)', line, re.IGNORECASE)
                    if match:
                        amount_str = match.group(1).replace(',', '')
                        amount = float(amount_str)
                        multiplier = match.group(2)
                        if multiplier.upper() == 'M':
                            amount *= 1000000
                        elif multiplier.upper() == 'K':
                            amount *= 1000
                        buyer['last_sale_amount'] = amount
                        
                        # Set deal size range based on recent deal
                        buyer['typical_deal_size_min'] = amount * 0.5
                        buyer['typical_deal_size_max'] = amount * 2
                
                if 'Property:' in line:
                    buyer['recent_property'] = line.split(':', 1)[1].strip()
                
                if 'Location:' in line:
                    location = line.split(':', 1)[1].strip()
                    buyer['geographic_focus'] = {'cities': [location], 'regions': []}
                    
                if 'Asset Class:' in line:
                    asset = line.split(':', 1)[1].strip()
                    if 'preferred_asset_classes' not in buyer:
                        buyer['preferred_asset_classes'] = {'types': []}
                    buyer['preferred_asset_classes']['types'].append(asset)
            
            # LinkedIn
            if 'linkedin' in line.lower() or 'linkedin.com' in line.lower():
                match = re.search(r'https?://[^\s\)]+', line)
                if match:
                    buyer['linkedin_url'] = match.group(0)
        
        # Set default values if missing
        if 'company_name' not in buyer:
            buyer['company_name'] = buyer['id']
        
        if 'contact_name' not in buyer:
            buyer['contact_name'] = ''
        
        if 'typical_deal_size_min' not in buyer:
            buyer['typical_deal_size_min'] = 0
            buyer['typical_deal_size_max'] = float('inf')
        
        if 'geographic_focus' not in buyer:
            buyer['geographic_focus'] = {'cities': [], 'regions': []}
        
        if 'preferred_asset_classes' not in buyer:
            buyer['preferred_asset_classes'] = {'types': []}
        
        return buyer


# Example usage
if __name__ == '__main__':
    engine = MatchingEngine()
    
    # Try to load from markdown files
    buyers_dir = '/home/jamie/Desktop/Jamie\'s Personal Vault/bigdataclaw/buyers_data'
    if os.path.exists(buyers_dir):
        engine.load_buyers_from_markdown(buyers_dir)
    
    # Example listing
    listing = {
        'address': '2475 Main St W',
        'city': 'Hamilton',
        'region': 'Niagara',
        'price': 2850000,
        'asset_class': 'industrial',
        'units': 12
    }
    
    matches = engine.find_matches(listing, limit=5)
    
    print(f"\nTop {len(matches)} Matches for {listing['address']}:")
    print("=" * 70)
    
    for match in matches:
        print(f"\n{match.company_name}: {match.match_score}%")
        for reason in match.match_reasons:
            print(f"  - {reason}")
        if match.quick_actions:
            print(f"  Actions: {', '.join(match.quick_actions.keys())}")
