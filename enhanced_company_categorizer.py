#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════════════════╗
║           ENHANCED COMPANY CATEGORIZER                                       ║
║                                                                              ║
║  Auto-categorizes companies based on name patterns:                         ║
║  • Builders/Developers (existing)                                           ║
║  • Investment/Investors (NEW)                                               ║
║  • REITs (NEW)                                                              ║
║  • Private Equity (NEW)                                                     ║
║  • Asset Managers (NEW)                                                     ║
║  • Family Offices (NEW)                                                     ║
║  • Pension Funds (NEW)                                                      ║
║  • Insurance Companies (NEW)                                                ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

import csv
import re
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Set


class CompanyCategorizer:
    """Categorize companies by type based on name patterns"""
    
    # Category detection keywords
    CATEGORIES = {
        'builder': {
            'keywords': [
                'develop', 'development', 'developer', 'developments',
                'construction', 'constructor', 'builder', 'builders', 'building',
                'homes', 'custom homes', 'home builder',
                'properties', 'property', 'realty', 'condo', 'condominium',
                'residential', 'commercial development',
                'general contractor', 'contractor', 'renovation', 'remodeling',
                'land development', 'site development'
            ],
            'priority': 1
        },
        'investment': {
            'keywords': [
                'invest', 'investment', 'investor', 'investors', 'investing',
                'capital', 'capital partners', 'investment group',
                'investment corp', 'investment corporation',
                'holdings', 'holding', 'holding company',
                'asset management', 'asset manager',
                'wealth management', 'portfolio management',
                'financial', 'finance', 'financing',
                'equity', 'equity partners', 'equity group',
                'venture capital', 'vc', 'angel investor'
            ],
            'priority': 2
        },
        'reit': {
            'keywords': [
                'reit', 'real estate investment trust',
                'realty income', 'income trust',
                'property trust', 'real estate trust'
            ],
            'priority': 1  # High priority - specific category
        },
        'private_equity': {
            'keywords': [
                'private equity', 'pe ', 'p.e.',
                'buyout', 'leveraged buyout', 'lbo',
                'equity firm', 'equity partners', 'equity group',
                'partners', 'lp', 'llp',  # Limited Partnership
                'capital partners', 'investment partners',
                'principal', 'principals',
                'acquisition', 'acquisitions'
            ],
            'priority': 1
        },
        'asset_manager': {
            'keywords': [
                'asset management', 'asset manager',
                'fund management', 'fund manager',
                'investment management', 'investment manager',
                'portfolio management', 'portfolio manager',
                'wealth management', 'wealth manager',
                'property management', 'property manager'
            ],
            'priority': 3
        },
        'family_office': {
            'keywords': [
                'family office', 'family investment',
                'family holding', 'family partners',
                'legacy capital', 'generational wealth'
            ],
            'priority': 1
        },
        'pension_fund': {
            'keywords': [
                'pension', 'pension fund', 'pension plan',
                'retirement', 'retirement fund', 'retirement system',
                'teacher retirement', 'public employees',
                'cpp', 'canada pension', 'ontario teachers',
                'omers', 'hoopp', 'bc investment'
            ],
            'priority': 1
        },
        'insurance': {
            'keywords': [
                'insurance', 'insurer', 'life insurance',
                'property insurance', 'casualty insurance',
                'mutual insurance', 'assurance',
                'manulife', 'sun life', 'great-west', 'power financial'
            ],
            'priority': 2
        },
        'lender': {
            'keywords': [
                'bank', 'credit union', 'caisse',
                'mortgage', 'lending', 'lender',
                'loan', 'financing company',
                'trust company', 'savings',
                'bmo', 'td ', 'rbc', 'scotiabank', 'cibc', 'nbc', 'desjardins'
            ],
            'priority': 1
        }
    }
    
    def categorize(self, company_name: str) -> Dict[str, bool]:
        """
        Categorize a company by name
        Returns dict of category -> boolean
        """
        if not company_name:
            return {cat: False for cat in self.CATEGORIES.keys()}
        
        name_lower = company_name.lower()
        categories = {}
        
        for category, config in self.CATEGORIES.items():
            keywords = config['keywords']
            # Check if any keyword matches
            match = any(keyword in name_lower for keyword in keywords)
            categories[category] = match
        
        return categories
    
    def get_primary_category(self, company_name: str) -> str:
        """
        Get the primary category for a company
        Based on priority and specificity
        """
        categories = self.categorize(company_name)
        
        # Filter to matched categories
        matched = [(cat, self.CATEGORIES[cat]['priority']) 
                   for cat, matched in categories.items() if matched]
        
        if not matched:
            return 'general'
        
        # Sort by priority (lower number = higher priority)
        matched.sort(key=lambda x: x[1])
        
        return matched[0][0]
    
    def get_all_categories(self, company_name: str) -> List[str]:
        """Get all matching categories as a list"""
        categories = self.categorize(company_name)
        return [cat for cat, matched in categories.items() if matched]


def process_companies_with_categories():
    """Process companies CSV and add category columns"""
    print("="*70)
    print("🏢 ENHANCED COMPANY CATEGORIZATION")
    print("="*70)
    
    categorizer = CompanyCategorizer()
    
    input_file = "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/dbeaver_final_exports/companys_final.csv"
    output_file = "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/QUICK_LINKS_COMPANIES_CATEGORIZED.csv"
    
    categorized_companies = []
    category_counts = {
        'builder': 0,
        'investment': 0,
        'reit': 0,
        'private_equity': 0,
        'asset_manager': 0,
        'family_office': 0,
        'pension_fund': 0,
        'insurance': 0,
        'lender': 0,
        'general': 0
    }
    
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        headers = next(reader)
        
        # New headers with categories
        new_headers = headers + [
            'category_primary', 'category_all',
            'is_builder', 'is_investment', 'is_reit',
            'is_private_equity', 'is_asset_manager',
            'is_family_office', 'is_pension_fund',
            'is_insurance', 'is_lender'
        ]
        
        for i, row in enumerate(reader, 1):
            if len(row) < 2:
                continue
            
            company_name = row[1] if len(row) > 1 else ''
            
            if not company_name:
                continue
            
            # Categorize
            categories = categorizer.categorize(company_name)
            primary = categorizer.get_primary_category(company_name)
            all_cats = categorizer.get_all_categories(company_name)
            
            # Update counts
            if primary in category_counts:
                category_counts[primary] += 1
            else:
                category_counts['general'] += 1
            
            # Build row
            new_row = row + [
                primary,
                '|'.join(all_cats) if all_cats else 'general',
                '1' if categories['builder'] else '0',
                '1' if categories['investment'] else '0',
                '1' if categories['reit'] else '0',
                '1' if categories['private_equity'] else '0',
                '1' if categories['asset_manager'] else '0',
                '1' if categories['family_office'] else '0',
                '1' if categories['pension_fund'] else '0',
                '1' if categories['insurance'] else '0',
                '1' if categories['lender'] else '0',
            ]
            
            categorized_companies.append(new_row)
            
            if i % 1000 == 0:
                print(f"  Processed {i} companies...")
    
    # Save
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(new_headers)
        writer.writerows(categorized_companies)
    
    print(f"\n{'='*70}")
    print("📊 CATEGORIZATION RESULTS")
    print(f"{'='*70}")
    print(f"  Total Companies: {len(categorized_companies):,}")
    print()
    print("  By Category:")
    for cat, count in sorted(category_counts.items(), key=lambda x: -x[1]):
        emoji = {
            'builder': '🏗️',
            'investment': '💰',
            'reit': '🏢',
            'private_equity': '📈',
            'asset_manager': '💼',
            'family_office': '👨‍👩‍👧‍👦',
            'pension_fund': '🎓',
            'insurance': '🛡️',
            'lender': '🏦',
            'general': '🏢'
        }.get(cat, '🏢')
        print(f"    {emoji} {cat.replace('_', ' ').title():20}: {count:>6,}")
    
    return categorized_companies, category_counts


def create_category_summary(categorized_companies, category_counts):
    """Create summary report"""
    summary_file = "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/COMPANY_CATEGORIES_SUMMARY.txt"
    
    with open(summary_file, 'w') as f:
        f.write("="*70 + "\n")
        f.write("COMPANY CATEGORIZATION SUMMARY\n")
        f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write("="*70 + "\n\n")
        
        f.write(f"Total Companies Categorized: {len(categorized_companies):,}\n\n")
        
        f.write("Categories:\n")
        f.write("-"*70 + "\n")
        for cat, count in sorted(category_counts.items(), key=lambda x: -x[1]):
            f.write(f"  {cat.replace('_', ' ').title():25}: {count:>6,}\n")
        
        f.write("\n" + "="*70 + "\n")
        f.write("DETECTION KEYWORDS:\n")
        f.write("="*70 + "\n\n")
        
        for category, config in CompanyCategorizer.CATEGORIES.items():
            f.write(f"{category.replace('_', ' ').title()}:\n")
            f.write(f"  Keywords: {', '.join(config['keywords'][:10])}\n")
            f.write(f"  Priority: {config['priority']}\n\n")
    
    print(f"\n  📁 Summary saved to: {summary_file}")


if __name__ == "__main__":
    companies, counts = process_companies_with_categories()
    create_category_summary(companies, counts)
    
    print("\n" + "="*70)
    print("✅ COMPANY CATEGORIZATION COMPLETE!")
    print("="*70)
    print("\nOutput file: QUICK_LINKS_COMPANIES_CATEGORIZED.csv")
    print("\nCategories detected:")
    print("  🏗️ Builders/Developers")
    print("  💰 Investment/Investors")
    print("  🏢 REITs")
    print("  📈 Private Equity")
    print("  💼 Asset Managers")
    print("  👨‍👩‍👧‍👦 Family Offices")
    print("  🎓 Pension Funds")
    print("  🛡️ Insurance Companies")
    print("  🏦 Lenders/Banks")
