#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════════════════╗
║           PROPERTY ENRICHMENT ENGINE - ZERO COST                             ║
║                                                                              ║
║  Enriches property data using:                                              ║
║  • Local LLM (Ollama) for text parsing                                       ║
║  • Cross-reference with existing database                                    ║
║  • Pattern matching and inference                                            ║
║  • Web scraping (optional)                                                   ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

import json
import re
import os
from typing import Dict, Optional, List
from dataclasses import dataclass
from fuzzywuzzy import fuzz
import sqlite3


@dataclass
class PropertyData:
    """Property data structure"""
    address: str
    city: str = ""
    province: str = ""
    postal_code: str = ""
    
    # Physical attributes
    asset_class: str = ""  # Retail, Industrial, Office, Multifamily, etc.
    building_size_sqft: int = 0
    land_size_acres: float = 0.0
    stories: int = 0
    year_built: int = 0
    
    # Financial
    asking_price: float = 0.0
    assessed_value: float = 0.0
    cap_rate: float = 0.0
    noi: float = 0.0
    
    # Zoning & Legal
    zoning: str = ""
    zoning_description: str = ""
    
    # Occupancy
    occupancy_rate: float = 0.0
    num_tenants: int = 0
    major_tenants: List[str] = None
    
    # Features
    parking_spaces: int = 0
    loading_docks: int = 0
    ceiling_height_ft: float = 0.0
    
    # Metadata
    confidence: str = "low"  # low, medium, high
    data_sources: List[str] = None
    
    def __post_init__(self):
        if self.major_tenants is None:
            self.major_tenants = []
        if self.data_sources is None:
            self.data_sources = []


class LocalLLMExtractor:
    """Extract property data using local LLM"""
    
    def __init__(self, model="llama3.2:3b-instruct-fp16"):
        self.model = model
        self._check_ollama()
    
    def _check_ollama(self):
        """Check if Ollama is running"""
        try:
            import ollama
            # Test connection
            ollama.list()
            print("✅ Connected to Ollama")
        except Exception as e:
            print(f"⚠️  Ollama not available: {e}")
            print("💡 Start Ollama with: ollama serve")
    
    def extract_from_description(self, description: str) -> Dict:
        """Extract structured data from property description"""
        try:
            import ollama
            
            prompt = f"Extract property details from this text. Return ONLY a JSON object with these fields:\n" \
                     f"- asset_class (Retail/Industrial/Office/Multifamily/Hotel/Land)\n" \
                     f"- building_size_sqft (number)\n" \
                     f"- land_size_acres (number)\n" \
                     f"- stories (number)\n" \
                     f"- year_built (number)\n" \
                     f"- zoning (zoning code if mentioned)\n" \
                     f"- cap_rate (number with %)\n" \
                     f"- asking_price (number)\n" \
                     f"- major_tenants (array of strings)\n" \
                     f"- occupancy_rate (number with %)\n\n" \
                     f"Text: {description}\n\n" \
                     f"JSON:"
            
            response = ollama.generate(
                model=self.model,
                prompt=prompt,
                options={"temperature": 0.1}
            )
            
            # Extract JSON from response
            text = response['response']
            # Find JSON block
            json_match = re.search(r'\{.*\}', text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            
            return {}
        
        except Exception as e:
            print(f"  ⚠️  LLM extraction failed: {e}")
            return {}


class PropertyInferenceEngine:
    """Infer property details from patterns and cross-referencing"""
    
    # Asset class detection patterns
    ASSET_PATTERNS = {
        'Retail': [
            'retail', 'shopping', 'mall', 'plaza', 'store', 'shop',
            'strip mall', 'big box', 'power centre', 'community centre'
        ],
        'Industrial': [
            'industrial', 'warehouse', 'distribution', 'manufacturing',
            'flex', 'logistics', 'distribution center', 'plant'
        ],
        'Office': [
            'office', 'medical office', 'professional', 'business park',
            'corporate', 'class a', 'class b'
        ],
        'Multifamily': [
            'apartment', 'multifamily', 'residential', 'rental',
            'suite', 'unit', 'dwelling'
        ],
        'Hotel': [
            'hotel', 'motel', 'inn', 'hospitality', 'resort',
            'lodging', 'accommodation'
        ],
        'Land': [
            'land', 'development site', 'assembly', 'acreage',
            'parcel', 'lot', 'raw land'
        ]
    }
    
    # Size inference from address patterns
    SIZE_PATTERNS = {
        r'\b(\d{1,3}(?:,\d{3})+)\s*(?:sq\s*ft|sf|square\s*feet?)\b': 'building_size',
        r'\b(\d+(?:\.\d+)?)\s*acres?\b': 'land_size',
        r'\b(\d+)\s*units?\b': 'units',
    }
    
    def infer_asset_class(self, address: str, description: str = "") -> tuple:
        """Infer asset class from address and description"""
        text = f"{address} {description}".lower()
        
        scores = {}
        for asset_class, keywords in self.ASSET_PATTERNS.items():
            score = sum(1 for kw in keywords if kw in text)
            if score > 0:
                scores[asset_class] = score
        
        if scores:
            best_match = max(scores, key=scores.get)
            confidence = "high" if scores[best_match] >= 2 else "medium"
            return best_match, confidence
        
        # Infer from street type
        if any(x in address.lower() for x in ['industrial', 'commerce', 'way']):
            return "Industrial", "medium"
        elif any(x in address.lower() for x in ['mall', 'plaza', 'market']):
            return "Retail", "high"
        elif any(x in address.lower() for x in ['apartments', 'residence']):
            return "Multifamily", "high"
        
        return "Unknown", "low"
    
    def extract_size_from_text(self, text: str) -> Dict:
        """Extract size information from text"""
        sizes = {}
        
        for pattern, size_type in self.SIZE_PATTERNS.items():
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                # Take the first/largest match
                value = max(matches, key=lambda x: float(str(x).replace(',', '')))
                sizes[size_type] = value
        
        return sizes
    
    def infer_building_size(self, address: str, asset_class: str, 
                           sale_price: float = 0) -> tuple:
        """Infer building size from patterns or sale price"""
        
        # Size patterns by address keywords
        size_hints = {
            'plaza': (15000, 50000),
            'mall': (100000, 500000),
            'big box': (50000, 150000),
            'strip': (8000, 30000),
            'distribution': (50000, 300000),
            'warehouse': (20000, 200000),
            'medical': (5000, 25000),
            'office building': (20000, 150000),
        }
        
        for keyword, (min_sqft, max_sqft) in size_hints.items():
            if keyword in address.lower():
                return (min_sqft + max_sqft) // 2, "medium"
        
        # Infer from sale price if available
        if sale_price > 0:
            # Price per sqft by asset class
            price_per_sqft = {
                'Retail': 250,
                'Industrial': 150,
                'Office': 300,
                'Multifamily': 200,
                'Hotel': 200000,  # per key
            }
            
            if asset_class in price_per_sqft:
                estimated_size = int(sale_price / price_per_sqft[asset_class])
                return estimated_size, "low"
        
        return 0, "low"


class DatabaseCrossReference:
    """Cross-reference with existing transaction database"""
    
    def __init__(self, db_path=None):
        self.db_path = db_path
        self._load_sales_data()
    
    def _load_sales_data(self):
        """Load sales data from CSV if available"""
        sales_file = "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/dbeaver_final_exports/sales_final.csv"
        
        self.sales = []
        try:
            import csv
            with open(sales_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    self.sales.append({
                        'address': row.get('address', ''),
                        'city': row.get('city', ''),
                        'price': float(row.get('price', 0) or 0),
                        'date': row.get('sale_date', ''),
                        'buyer': row.get('buyer_name', ''),
                        'seller': row.get('seller_name', '')
                    })
            print(f"✅ Loaded {len(self.sales):,} sales records")
        except Exception as e:
            print(f"⚠️  Could not load sales data: {e}")
    
    def find_comparable_sales(self, address: str, city: str = "") -> List[Dict]:
        """Find comparable sales by fuzzy matching"""
        matches = []
        
        for sale in self.sales:
            # Fuzzy match on address
            score = fuzz.partial_ratio(address.lower(), sale['address'].lower())
            
            # Boost score if city matches
            if city and city.lower() in sale['city'].lower():
                score += 20
            
            if score > 70:
                matches.append({
                    **sale,
                    'match_score': score
                })
        
        # Sort by match score
        matches.sort(key=lambda x: x['match_score'], reverse=True)
        return matches[:5]  # Top 5 matches
    
    def infer_from_buyer(self, buyer_name: str) -> Dict:
        """Infer property type from buyer's profile"""
        buyer_lower = buyer_name.lower()
        
        inferences = {}
        
        if any(x in buyer_lower for x in ['apartment', 'residential', 'multifamily']):
            inferences['asset_class'] = 'Multifamily'
        elif any(x in buyer_lower for x in ['industrial', 'logistics', 'warehouse']):
            inferences['asset_class'] = 'Industrial'
        elif any(x in buyer_lower for x in ['retail', 'shopping', 'plaza']):
            inferences['asset_class'] = 'Retail'
        elif any(x in buyer_lower for x in ['office', 'commercial']):
            inferences['asset_class'] = 'Office'
        elif any(x in buyer_lower for x in ['reit', 'trust']):
            inferences['investment_grade'] = True
        
        return inferences


class PropertyEnricher:
    """Main enrichment orchestrator"""
    
    def __init__(self):
        self.llm = LocalLLMExtractor()
        self.inference = PropertyInferenceEngine()
        self.dbreference = DatabaseCrossReference()
    
    def enrich(self, address: str, description: str = "", 
               existing_data: Dict = None) -> PropertyData:
        """Enrich a single property"""
        
        print(f"\n🏢 Enriching: {address}")
        
        # Initialize with existing data
        if existing_data:
            prop = PropertyData(
                address=address,
                city=existing_data.get('city', ''),
                province=existing_data.get('province', ''),
            )
        else:
            prop = PropertyData(address=address)
        
        sources = []
        
        # 1. Extract from description using LLM
        if description:
            print("  🧠 Parsing with LLM...")
            llm_data = self.llm.extract_from_description(description)
            if llm_data:
                prop.asset_class = llm_data.get('asset_class', '')
                prop.building_size_sqft = int(llm_data.get('building_size_sqft', 0) or 0)
                prop.land_size_acres = float(llm_data.get('land_size_acres', 0) or 0)
                prop.stories = int(llm_data.get('stories', 0) or 0)
                prop.year_built = int(llm_data.get('year_built', 0) or 0)
                prop.zoning = llm_data.get('zoning', '')
                prop.major_tenants = llm_data.get('major_tenants', [])
                sources.append("LLM")
        
        # 2. Infer from patterns
        if not prop.asset_class:
            print("  🔍 Inferring asset class...")
            asset_class, confidence = self.inference.infer_asset_class(address, description)
            prop.asset_class = asset_class
            prop.confidence = confidence
        
        # Extract sizes from text
        if description:
            sizes = self.inference.extract_size_from_text(description)
            if 'building_size' in sizes and not prop.building_size_sqft:
                prop.building_size_sqft = int(str(sizes['building_size']).replace(',', ''))
            if 'land_size' in sizes and not prop.land_size_acres:
                prop.land_size_acres = float(sizes['land_size'])
        
        # 3. Cross-reference with sales database
        print("  📊 Cross-referencing database...")
        comparables = self.dbreference.find_comparable_sales(address, prop.city)
        
        if comparables:
            # Use comparable sales to estimate value
            avg_price = sum(s['price'] for s in comparables) / len(comparables)
            prop.assessed_value = avg_price
            
            # Infer from buyer types
            for sale in comparables[:2]:
                buyer_inference = self.dbreference.infer_from_buyer(sale['buyer'])
                if 'asset_class' in buyer_inference and not prop.asset_class:
                    prop.asset_class = buyer_inference['asset_class']
            
            sources.append("Sales_DB")
        
        # 4. Infer missing building size
        if not prop.building_size_sqft and prop.asset_class:
            print("  📐 Estimating size...")
            size, confidence = self.inference.infer_building_size(
                address, prop.asset_class, prop.assessed_value
            )
            if size > 0:
                prop.building_size_sqft = size
                if confidence == "low":
                    prop.confidence = "low"
                sources.append("Inference")
        
        prop.data_sources = sources
        
        print(f"  ✅ Enriched: {prop.asset_class}, {prop.building_size_sqft:,} sq ft")
        
        return prop
    
    def to_dict(self, prop: PropertyData) -> Dict:
        """Convert PropertyData to dictionary"""
        return {
            'address': prop.address,
            'city': prop.city,
            'province': prop.province,
            'asset_class': prop.asset_class,
            'building_size_sqft': prop.building_size_sqft,
            'land_size_acres': prop.land_size_acres,
            'stories': prop.stories,
            'year_built': prop.year_built,
            'zoning': prop.zoning,
            'assessed_value': prop.assessed_value,
            'occupancy_rate': prop.occupancy_rate,
            'major_tenants': prop.major_tenants,
            'confidence': prop.confidence,
            'data_sources': prop.data_sources
        }


# Quick test function
def test_enrichment():
    """Test the enrichment engine"""
    print("="*70)
    print("🧪 TESTING PROPERTY ENRICHMENT ENGINE")
    print("="*70)
    
    enricher = PropertyEnricher()
    
    test_cases = [
        {
            'address': '800 Niagara St, Niagara-on-the-Lake, ON',
            'description': 'Seaway Mall is a 450,000 sq ft community shopping centre anchored by Walmart. Built in 1975, zoned C2 commercial with 2000 parking spaces.'
        },
        {
            'address': '281 Chippawa Rd, Port Colborne, ON',
            'description': 'Industrial warehouse building with 50,000 sq ft on 3.5 acres. 18 ft ceilings, 2 loading docks, zoned M2.'
        },
        {
            'address': '100 King St W, Toronto, ON',
            'description': ''  # No description - will use inference only
        }
    ]
    
    for test in test_cases:
        result = enricher.enrich(test['address'], test['description'])
        data = enricher.to_dict(result)
        
        print("\n📋 RESULT:")
        print(json.dumps(data, indent=2))
        print("-"*70)


if __name__ == "__main__":
    test_enrichment()
