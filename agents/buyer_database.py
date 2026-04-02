#!/usr/bin/env python3
"""
Buyer Database Loader
Loads buyers from Hot_Money markdown files and CSV databases
"""

import os
import re
import yaml
from typing import Dict, List, Any, Optional
from datetime import datetime
from dataclasses import dataclass


@dataclass
class BuyerRecord:
    """Standardized buyer record"""
    name: str
    company: str
    email: str = ""
    phone: str = ""
    linkedin: str = ""
    city: str = ""
    asset_class: str = ""
    
    # Deal history
    recent_deal_amount: float = 0
    recent_deal_date: str = ""
    recent_deal_type: str = ""
    
    # Matching
    match_score: int = 0
    priority: str = ""
    status: str = ""
    
    # Talking points
    talking_points: List[str] = None
    why_matched: str = ""
    
    # Source
    source_file: str = ""
    source_type: str = ""  # hot_money, portfolio, csv
    
    def to_dict(self) -> Dict:
        return {
            'name': self.name,
            'company': self.company,
            'contact': {
                'email': self.email,
                'phone': self.phone,
                'linkedin': self.linkedin
            },
            'city': self.city,
            'asset_class': self.asset_class,
            'recent_deal': {
                'amount': self.recent_deal_amount,
                'date': self.recent_deal_date,
                'type': self.recent_deal_type
            },
            'match_score': self.match_score,
            'priority': self.priority,
            'talking_points': self.talking_points or [],
            'why_matched': self.why_matched,
            'source': self.source_type
        }


class BuyerDatabase:
    """
    Unified buyer database that loads from multiple sources:
    - Hot Money markdown files
    - CSV databases
    - Portfolio companies
    """
    
    def __init__(self, base_path: str = None):
        if base_path is None:
            # Try to find buyers_data folder
            base_path = self._find_buyers_data_path()
        
        self.base_path = base_path
        self.buyers: Dict[str, BuyerRecord] = {}
        self.hot_money_path = os.path.join(base_path, 'Hot_Money') if base_path else None
        self.buyers_path = os.path.join(base_path, 'Buyers') if base_path else None
        
        print("🔍 Buyer Database initialized")
        self._load_all_buyers()
    
    def _find_buyers_data_path(self) -> Optional[str]:
        """Find the buyers_data folder"""
        # Check current directory and parents
        current = os.getcwd()
        for _ in range(5):  # Search up to 5 levels
            test_path = os.path.join(current, 'buyers_data')
            if os.path.exists(test_path):
                return test_path
            current = os.path.dirname(current)
        return None
    
    def _load_all_buyers(self):
        """Load buyers from all sources"""
        # Load Hot Money buyers
        if self.hot_money_path and os.path.exists(self.hot_money_path):
            self._load_hot_money_buyers()
        
        print(f"  ✓ Loaded {len(self.buyers)} total buyers")
    
    def _load_hot_money_buyers(self):
        """Load buyers from Hot_Money markdown files"""
        count = 0
        for filename in os.listdir(self.hot_money_path):
            if not filename.endswith('.md'):
                continue
            
            filepath = os.path.join(self.hot_money_path, filename)
            try:
                buyer = self._parse_hot_money_file(filepath)
                if buyer:
                    key = f"{buyer.name}_{buyer.company}".lower().replace(' ', '_')
                    self.buyers[key] = buyer
                    count += 1
            except Exception as e:
                print(f"  ⚠ Error parsing {filename}: {e}")
        
        print(f"  ✓ Loaded {count} hot money buyers")
    
    def _parse_hot_money_file(self, filepath: str) -> Optional[BuyerRecord]:
        """Parse a Hot_Money markdown file"""
        with open(filepath, 'r') as f:
            content = f.read()
        
        # Parse frontmatter
        frontmatter_match = re.match(r'^---\n(.*?)\n---\n(.*)$', content, re.DOTALL)
        if not frontmatter_match:
            return None
        
        frontmatter = yaml.safe_load(frontmatter_match.group(1))
        body = frontmatter_match.group(2)
        
        # Extract contact info from body
        name = frontmatter.get('name', '')
        if not name:
            # Extract from filename
            name = os.path.basename(filepath).replace('.md', '')
        
        # Parse body for additional info
        company = self._extract_from_body(body, r'\*\*Company:\*\*\s*(.+)') or ""
        email = self._extract_from_body(body, r'\*\*Email:\*\*\s*(.+)') or ""
        phone = self._extract_from_body(body, r'\*\*Phone:\*\*\s*\[?([^\]\n]+)\]?') or ""
        linkedin = self._extract_from_body(body, r'\*\*LinkedIn:\*\*\s*\[?([^\]]+)\]?') or ""
        location = self._extract_from_body(body, r'\*\*Location:\*\*\s*(.+)') or ""
        
        # Parse deal history
        deal_amount_str = self._extract_from_body(body, r'\*\*Recent Deal:\*\*\s*\$?([\d,]+\.?\d*)')
        deal_amount = 0
        if deal_amount_str:
            try:
                deal_amount = float(deal_amount_str.replace(',', ''))
            except:
                pass
        
        deal_date = self._extract_from_body(body, r'\*\*Deal Date:\*\*\s*(\d{4}-\d{2}-\d{2})') or ""
        deal_type = self._extract_from_body(body, r'\*\*Asset Class:\*\*\s*(.+)') or ""
        
        # Parse talking points
        talking_points = []
        why_matched = ""
        if '## 💡 Talking Points' in body:
            points_section = body.split('## 💡 Talking Points')[1].split('##')[0]
            for line in points_section.split('\n'):
                if line.strip().startswith('-'):
                    talking_points.append(line.strip()[1:].strip())
        
        if '## 🎯 Match Analysis' in body:
            match_section = body.split('## 🎯 Match Analysis')[1].split('##')[0]
            why_match = re.search(r'\*\*Why Matched:\*\*\s*([\s\S]+?)(?=\n\*\*|##)', match_section)
            if why_match:
                why_matched = why_match.group(1).strip()
        
        return BuyerRecord(
            name=name,
            company=company,
            email=email,
            phone=phone,
            linkedin=linkedin,
            city=location,
            asset_class=frontmatter.get('asset_class', deal_type.lower().replace(' ', '_')),
            recent_deal_amount=deal_amount,
            recent_deal_date=deal_date,
            recent_deal_type=deal_type,
            match_score=frontmatter.get('match_score', 0),
            priority=frontmatter.get('priority', ''),
            status=frontmatter.get('status', ''),
            talking_points=talking_points,
            why_matched=why_matched,
            source_file=os.path.basename(filepath),
            source_type='hot_money'
        )
    
    def _extract_from_body(self, body: str, pattern: str) -> Optional[str]:
        """Extract information from markdown body using regex"""
        match = re.search(pattern, body)
        if match:
            return match.group(1).strip()
        return None
    
    def find_matches(self, 
                     asset_class: str = None,
                     city: str = None,
                     min_deal_size: float = None,
                     max_deal_size: float = None,
                     min_score: int = 0,
                     limit: int = 10) -> List[BuyerRecord]:
        """Find buyers matching criteria"""
        matches = []
        
        for buyer in self.buyers.values():
            score = 0
            
            # Asset class match
            if asset_class and buyer.asset_class:
                if asset_class.lower() in buyer.asset_class.lower() or \
                   buyer.asset_class.lower() in asset_class.lower():
                    score += 30
            
            # City match
            if city and buyer.city:
                if city.lower() in buyer.city.lower():
                    score += 20
            
            # Deal size match
            if min_deal_size and buyer.recent_deal_amount:
                if buyer.recent_deal_amount >= min_deal_size:
                    score += 20
            if max_deal_size and buyer.recent_deal_amount:
                if buyer.recent_deal_amount <= max_deal_size:
                    score += 10
            
            # Hot money bonus
            if buyer.source_type == 'hot_money' and buyer.priority == 'call_today':
                score += 25
            
            # Use stored match score as base
            base_score = buyer.match_score if buyer.match_score else 0
            final_score = max(score, base_score * 0.8)  # Blend calculated and stored
            
            if final_score >= min_score:
                buyer.match_score = int(final_score)
                matches.append(buyer)
        
        # Sort by score
        matches.sort(key=lambda x: x.match_score, reverse=True)
        return matches[:limit]
    
    def get_buyer(self, name: str) -> Optional[BuyerRecord]:
        """Get a specific buyer by name"""
        key = name.lower().replace(' ', '_')
        # Try exact match
        if key in self.buyers:
            return self.buyers[key]
        
        # Try partial match
        for k, buyer in self.buyers.items():
            if name.lower() in buyer.name.lower():
                return buyer
        
        return None


# Singleton
_buyer_db = None

def get_buyer_database() -> BuyerDatabase:
    """Get or create singleton buyer database"""
    global _buyer_db
    if _buyer_db is None:
        _buyer_db = BuyerDatabase()
    return _buyer_db


if __name__ == "__main__":
    print("="*80)
    print("BUYER DATABASE - DEMO")
    print("="*80)
    
    db = get_buyer_database()
    
    # Find land buyers
    print("\n🎯 Land Development Buyers:")
    land_buyers = db.find_matches(asset_class='land', limit=5)
    for buyer in land_buyers:
        print(f"\n  • {buyer.name} ({buyer.company})")
        print(f"    Score: {buyer.match_score}")
        print(f"    Recent Deal: ${buyer.recent_deal_amount:,.0f}")
        print(f"    Why: {buyer.why_matched[:100]}...")
