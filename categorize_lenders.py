#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════════════════╗
║           LENDER CATEGORIZATION BY ASSET CLASS                               ║
║                                                                              ║
║  Categorizes 5,113 lenders by:                                              ║
║  • Asset class specialization (Land, Construction, Commercial, etc.)        ║
║  • Lender type (Bank, Private, MIC, Credit Union, etc.)                     ║
║  • Creates separate lists for Land Lenders specifically                     ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

import csv
import os
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Set


class LenderCategorizer:
    """Categorize lenders by asset class and type"""
    
    # Asset class specializations
    ASSET_KEYWORDS = {
        'land': {
            'keywords': [
                'land', 'development land', 'raw land', 'vacant land',
                'land assembly', 'land acquisition', 'land development',
                'development site', 'site acquisition', 'land financing',
                'development financing', 'land loan', 'land mortgage',
                'acreage', 'parcel', 'lot financing', 'land bank'
            ],
            'description': 'Land acquisition and development financing'
        },
        'construction': {
            'keywords': [
                'construction', 'construction loan', 'builder financing',
                'development financing', 'construction mortgage',
                'draw mortgage', 'progress draw', 'construction advance',
                'hard costs', 'soft costs', 'construction holdback'
            ],
            'description': 'Construction and development financing'
        },
        'commercial': {
            'keywords': [
                'commercial', 'commercial mortgage', 'commercial loan',
                'retail financing', 'office financing', 'industrial financing',
                'commercial real estate', 'cre', 'income property',
                'multi-family', 'apartment financing'
            ],
            'description': 'Commercial real estate financing'
        },
        'residential': {
            'keywords': [
                'residential', 'home loan', 'mortgage', 'residential mortgage',
                'home financing', 'purchase mortgage', 'refinance',
                'home equity', 'residential lending', 'home purchase'
            ],
            'description': 'Residential mortgage lending'
        },
        'industrial': {
            'keywords': [
                'industrial', 'warehouse financing', 'industrial mortgage',
                'manufacturing', 'distribution center', 'industrial loan',
                'industrial real estate', 'logistics financing'
            ],
            'description': 'Industrial property financing'
        },
        'retail': {
            'keywords': [
                'retail', 'shopping center', 'retail financing',
                'store financing', 'plaza financing', 'retail mortgage',
                'strip mall', 'retail property'
            ],
            'description': 'Retail property financing'
        },
        'hospitality': {
            'keywords': [
                'hotel', 'motel', 'hospitality', 'resort financing',
                'lodging', 'hospitality mortgage', 'inn', 'hospitality loan'
            ],
            'description': 'Hotel and hospitality financing'
        },
        'agricultural': {
            'keywords': [
                'agricultural', 'farm', 'agriculture', 'farmland',
                'farm financing', 'agricultural mortgage', 'rural',
                'farm loan', 'agricultural lending'
            ],
            'description': 'Agricultural and farm financing'
        }
    }
    
    # Lender type classification
    LENDER_TYPE_KEYWORDS = {
        'big_bank': {
            'keywords': ['royal bank', 'td', 'toronto dominion', 'scotiabank', 'bmo', 
                        'bank of montreal', 'cibc', 'rbc', 'bank', 'credit union'],
            'type_name': 'Major Bank'
        },
        'credit_union': {
            'keywords': ['credit union', 'caisse', 'financial', 'meridian'],
            'type_name': 'Credit Union'
        },
        'private_lender': {
            'keywords': ['capital', 'holdings', 'private', 'mortgage investment', 'mic',
                        'lending corp', 'financial corp', 'investment corp'],
            'type_name': 'Private Lender'
        },
        'trust_company': {
            'keywords': ['trust company', 'trust corp', 'trust'],
            'type_name': 'Trust Company'
        },
        'insurance': {
            'keywords': ['insurance', 'assurance', 'life'],
            'type_name': 'Insurance Company'
        },
        'individual': {
            'keywords': ['individual', 'private individual', 'named individual'],
            'type_name': 'Private Individual'
        },
        'development': {
            'keywords': ['development', 'developments', 'properties', 'property'],
            'type_name': 'Development Company'
        }
    }
    
    def categorize_by_asset_class(self, lender_name: str) -> List[str]:
        """Identify asset class specializations"""
        name_lower = lender_name.lower()
        specializations = []
        
        for asset_class, config in self.ASSET_KEYWORDS.items():
            if any(keyword in name_lower for keyword in config['keywords']):
                specializations.append(asset_class)
        
        return specializations
    
    def classify_lender_type(self, lender_name: str) -> str:
        """Classify the type of lender"""
        name_lower = lender_name.lower()
        
        for lender_type, config in self.LENDER_TYPE_KEYWORDS.items():
            if any(keyword in name_lower for keyword in config['keywords']):
                return config['type_name']
        
        return 'Other'
    
    def is_land_lender(self, lender_name: str, specializations: List[str]) -> bool:
        """Determine if this is a land lender"""
        return 'land' in specializations


def process_lenders():
    """Process all lenders and categorize them"""
    print("="*70)
    print("🏦 CATEGORIZING LENDERS BY ASSET CLASS")
    print("="*70)
    
    categorizer = LenderCategorizer()
    
    input_file = "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/dbeaver_final_exports/lenders_final.csv"
    
    # Storage for categorized lenders
    categorized = {
        'land': [],
        'construction': [],
        'commercial': [],
        'residential': [],
        'industrial': [],
        'retail': [],
        'hospitality': [],
        'agricultural': [],
        'all': []
    }
    
    stats = {
        'total': 0,
        'with_specialization': 0,
        'land_only': 0
    }
    
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        
        # Enhanced header
        new_header = header + [
            'lender_type', 'asset_specializations', 'is_land_lender',
            'is_construction_lender', 'is_commercial_lender'
        ]
        
        for row in reader:
            if len(row) < 2:
                continue
            
            lender_id = row[0]
            lender_name = row[1] if len(row) > 1 else ''
            domain = row[2] if len(row) > 2 else ''
            
            if not lender_name:
                continue
            
            stats['total'] += 1
            
            # Categorize
            specializations = categorizer.categorize_by_asset_class(lender_name)
            lender_type = categorizer.classify_lender_type(lender_name)
            is_land = categorizer.is_land_lender(lender_name, specializations)
            
            if specializations:
                stats['with_specialization'] += 1
            
            if is_land:
                stats['land_only'] += 1
            
            # Build enhanced row
            enhanced_row = row + [
                lender_type,
                '|'.join(specializations) if specializations else 'general',
                '1' if is_land else '0',
                '1' if 'construction' in specializations else '0',
                '1' if 'commercial' in specializations else '0'
            ]
            
            categorized['all'].append(enhanced_row)
            
            # Add to specialization lists
            for spec in specializations:
                if spec in categorized:
                    categorized[spec].append(enhanced_row)
            
            if stats['total'] % 500 == 0:
                print(f"  Processed {stats['total']} lenders...")
    
    # Save results
    output_dir = "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/LENDERS_BY_SPECIALIZATION"
    Path(output_dir).mkdir(exist_ok=True)
    
    # Save all categorized lenders
    all_file = os.path.join(output_dir, "ALL_LENDERS_CATEGORIZED.csv")
    with open(all_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(new_header)
        writer.writerows(categorized['all'])
    
    print(f"\n  ✅ All lenders: {len(categorized['all']):,} saved")
    
    # Save by specialization
    for spec, lenders in categorized.items():
        if spec == 'all':
            continue
        
        spec_file = os.path.join(output_dir, f"{spec.upper()}_LENDERS.csv")
        with open(spec_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(new_header)
            writer.writerows(lenders)
        
        if lenders:
            print(f"  ✅ {spec.title()} lenders: {len(lenders):,} saved")
    
    # Generate summary
    print(f"\n{'='*70}")
    print("📊 CATEGORIZATION SUMMARY")
    print(f"{'='*70}")
    print(f"  Total Lenders: {stats['total']:,}")
    print(f"  With Specialization: {stats['with_specialization']:,} ({stats['with_specialization']/stats['total']*100:.1f}%)")
    print(f"\n  By Asset Class:")
    for spec in ['land', 'construction', 'commercial', 'residential', 'industrial', 'retail', 'hospitality', 'agricultural']:
        count = len(categorized[spec])
        print(f"    {spec.replace('_', ' ').title():20}: {count:>5,}")
    
    # Save land lenders list specifically
    create_land_lender_focus_list(categorized['land'], output_dir)
    
    return categorized, stats


def create_land_lender_focus_list(land_lenders, output_dir):
    """Create a focused list of land lenders with extra details"""
    print(f"\n🏞️  CREATING LAND LENDER FOCUS LIST")
    
    # Create enhanced land lender profiles
    land_lender_profiles = []
    
    for lender in land_lenders:
        lender_id = lender[0]
        lender_name = lender[1] if len(lender) > 1 else ''
        domain = lender[2] if len(lender) > 2 else ''
        lender_type = lender[6] if len(lender) > 6 else 'Other'
        
        # Generate Quick Links for land lender
        from quick_links_universal import QuickLinksGenerator
        ql = QuickLinksGenerator()
        
        links = ql.generate_quick_links(
            name=lender_name,
            website=domain
        )
        
        profile = {
            'id': lender_id,
            'name': lender_name,
            'type': lender_type,
            'website': domain,
            'specialization': 'Land Financing',
            'quick_links': {
                'google': links.get('google', ''),
                'linkedin': links.get('linkedin', ''),
                'website': f"https://{domain}" if domain else '',
                'contact': links.get('contact_page', ''),
                'whatsapp': links.get('whatsapp_direct', '')
            },
            'search_terms': 'land financing, development land, land acquisition, land loan'
        }
        
        land_lender_profiles.append(profile)
    
    # Save as JSON
    import json
    land_focus_file = os.path.join(output_dir, "LAND_LENDERS_DETAILED.json")
    with open(land_focus_file, 'w', encoding='utf-8') as f:
        json.dump({
            'metadata': {
                'total_land_lenders': len(land_lender_profiles),
                'generated_at': datetime.now().isoformat(),
                'description': 'Land financing specialists'
            },
            'lenders': land_lender_profiles
        }, f, indent=2)
    
    print(f"  ✅ {len(land_lender_profiles):,} land lenders with detailed profiles")
    print(f"  📁 Saved: {land_focus_file}")
    
    # Create Obsidian notes for top land lenders
    create_land_lender_obsidian_notes(land_lender_profiles[:100], output_dir)  # Top 100


def create_land_lender_obsidian_notes(land_lenders, output_dir):
    """Create Obsidian notes for land lenders"""
    print(f"\n📝 Creating Obsidian notes for top land lenders...")
    
    obsidian_dir = os.path.join(output_dir, "Land_Lender_Notes")
    Path(obsidian_dir).mkdir(exist_ok=True)
    
    for lender in land_lenders:
        safe_name = lender['name'].replace(' ', '_').replace('/', '-')[:80]
        filename = f"{safe_name}.md"
        filepath = os.path.join(obsidian_dir, filename)
        
        content = f"""---
type: land-lender
company: "{lender['name']}"
specialization: "Land Financing"
lender_type: "{lender['type']}"
website: "{lender['website']}"
imported_date: {datetime.now().strftime('%Y-%m-%d')}
tags: [lender, "land-financing", "development", "real-estate"]
---

# {lender['name']}

> 🏞️ **Land Financing Specialist**
> Type: {lender['type']}

## 💰 Financing Focus
- **Primary:** Land Acquisition & Development
- **Loan Types:** Land loans, Development financing, Land assembly
- **Asset Class:** Land, Development Sites, Raw Land

## 🔍 Quick Links
| Platform | Link |
|----------|------|
| Google | [Search]({lender['quick_links']['google']}) |
| LinkedIn | [Profile]({lender['quick_links']['linkedin']}) |
| Website | [{lender['website']}]({lender['quick_links']['website']}) |
| Contact | [Find]({lender['quick_links']['contact']}) |

## 🎯 Use Cases
- Land acquisition financing
- Development site purchases
- Land assembly projects
- Raw land investment

## 📋 Outreach Notes
| Date | Contact | Result | Next Step |
|------|---------|--------|-----------|
| | | | |

## 💡 Keywords
{lender['search_terms']}

---

*Land Lender Profile*  
*Generated: {datetime.now().strftime('%Y-%m-%d')}*

#land-lender #financing #development
"""
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
    
    print(f"  ✅ Created {len(land_lenders)} Obsidian notes")
    print(f"  📁 Location: {obsidian_dir}")


if __name__ == "__main__":
    categorized, stats = process_lenders()
    
    print("\n" + "="*70)
    print("✅ LENDER CATEGORIZATION COMPLETE!")
    print("="*70)
    print("\nOutput Location: LENDERS_BY_SPECIALIZATION/")
    print("\nFiles Created:")
    print("  • ALL_LENDERS_CATEGORIZED.csv - All 5,113 with tags")
    print("  • LAND_LENDERS.csv - Land financing specialists")
    print("  • CONSTRUCTION_LENDERS.csv - Construction lenders")
    print("  • COMMERCIAL_LENDERS.csv - Commercial lenders")
    print("  • LAND_LENDERS_DETAILED.json - Detailed profiles")
    print("  • Land_Lender_Notes/ - Obsidian notes (top 100)")
