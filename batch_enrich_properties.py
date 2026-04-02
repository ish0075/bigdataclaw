#!/usr/bin/env python3
"""
Batch Property Enrichment Pipeline
Process thousands of properties efficiently
"""

import csv
import json
import os
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from property_enrichment_engine import PropertyEnricher, PropertyData


class BatchEnricher:
    """Batch processing for property enrichment"""
    
    def __init__(self, output_dir="enrichment_output"):
        self.enricher = PropertyEnricher()
        self.output_dir = output_dir
        self.cache = {}
        self.cache_file = f"{output_dir}/enrichment_cache.json"
        self._load_cache()
        
        Path(output_dir).mkdir(exist_ok=True)
    
    def _load_cache(self):
        """Load enrichment cache"""
        if os.path.exists(self.cache_file):
            with open(self.cache_file, 'r') as f:
                self.cache = json.load(f)
            print(f"✅ Loaded cache: {len(self.cache)} properties")
    
    def _save_cache(self):
        """Save enrichment cache"""
        with open(self.cache_file, 'w') as f:
            json.dump(self.cache, f)
    
    def enrich_single(self, property_data: dict) -> dict:
        """Enrich a single property with caching"""
        address = property_data.get('address', '')
        
        # Check cache
        cache_key = address.lower().strip()
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        # Enrich
        try:
            result = self.enricher.enrich(
                address=address,
                description=property_data.get('description', ''),
                existing_data=property_data
            )
            
            enriched = self.enricher.to_dict(result)
            
            # Cache result
            self.cache[cache_key] = enriched
            
            return enriched
        
        except Exception as e:
            print(f"  ❌ Error enriching {address}: {e}")
            return {**property_data, 'enrichment_error': str(e)}
    
    def process_csv(self, input_file: str, output_file: str = None, 
                    max_workers: int = 4, limit: int = None):
        """Process entire CSV file"""
        
        if not output_file:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            output_file = f"{self.output_dir}/enriched_{timestamp}.csv"
        
        print("="*70)
        print(f"📊 BATCH ENRICHMENT")
        print(f"="*70)
        print(f"Input: {input_file}")
        print(f"Output: {output_file}")
        print(f"Workers: {max_workers}")
        print(f"Limit: {limit or 'None (all)'}")
        print("="*70)
        
        # Read input
        properties = []
        with open(input_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for i, row in enumerate(reader):
                if limit and i >= limit:
                    break
                properties.append(row)
        
        print(f"\n📝 Loaded {len(properties):,} properties to enrich")
        
        # Process
        enriched = []
        processed = 0
        cached = 0
        
        print("\n🚀 Starting enrichment...")
        
        for i, prop in enumerate(properties, 1):
            address = prop.get('address', prop.get('name', 'Unknown'))
            
            # Check cache first
            cache_key = address.lower().strip()
            if cache_key in self.cache:
                enriched.append(self.cache[cache_key])
                cached += 1
            else:
                # Enrich
                result = self.enrich_single(prop)
                enriched.append(result)
                processed += 1
            
            # Progress
            if i % 10 == 0:
                print(f"  Progress: {i}/{len(properties)} ({i/len(properties)*100:.1f}%) - Cached: {cached}, New: {processed}")
            
            # Save cache periodically
            if i % 50 == 0:
                self._save_cache()
        
        # Final save
        self._save_cache()
        
        # Write output
        print(f"\n💾 Writing to {output_file}...")
        
        # Combine original data with enrichment
        fieldnames = list(properties[0].keys()) if properties else []
        enrichment_fields = [
            'asset_class', 'building_size_sqft', 'land_size_acres',
            'stories', 'year_built', 'zoning', 'assessed_value',
            'occupancy_rate', 'major_tenants', 'enrichment_confidence',
            'enrichment_sources'
        ]
        
        # Add new fields
        for field in enrichment_fields:
            if field not in fieldnames:
                fieldnames.append(field)
        
        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            
            for orig, enrich in zip(properties, enriched):
                # Merge data
                row = {**orig}
                for field in enrichment_fields:
                    if field in enrich:
                        row[field] = enrich[field]
                writer.writerow(row)
        
        # Generate report
        self._generate_report(enriched, output_file)
        
        print(f"\n✅ Complete!")
        print(f"  Enriched: {len(enriched):,}")
        print(f"  Cached: {cached}")
        print(f"  New: {processed}")
        print(f"  Output: {output_file}")
    
    def _generate_report(self, enriched_data: list, output_file: str):
        """Generate enrichment report"""
        
        # Statistics
        stats = {
            'total': len(enriched_data),
            'with_asset_class': sum(1 for e in enriched_data if e.get('asset_class')),
            'with_size': sum(1 for e in enriched_data if e.get('building_size_sqft', 0) > 0),
            'with_zoning': sum(1 for e in enriched_data if e.get('zoning')),
            'high_confidence': sum(1 for e in enriched_data if e.get('confidence') == 'high'),
            'medium_confidence': sum(1 for e in enriched_data if e.get('confidence') == 'medium'),
            'low_confidence': sum(1 for e in enriched_data if e.get('confidence') == 'low'),
        }
        
        # Asset class breakdown
        asset_classes = {}
        for e in enriched_data:
            ac = e.get('asset_class', 'Unknown')
            asset_classes[ac] = asset_classes.get(ac, 0) + 1
        
        report_file = output_file.replace('.csv', '_REPORT.txt')
        
        with open(report_file, 'w') as f:
            f.write("="*70 + "\n")
            f.write("PROPERTY ENRICHMENT REPORT\n")
            f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write("="*70 + "\n\n")
            
            f.write("📊 ENRICHMENT STATISTICS\n")
            f.write("-"*70 + "\n")
            f.write(f"Total Properties: {stats['total']:,}\n\n")
            
            f.write(f"Asset Class Identified: {stats['with_asset_class']:,} ({stats['with_asset_class']/stats['total']*100:.1f}%)\n")
            f.write(f"Size Estimated: {stats['with_size']:,} ({stats['with_size']/stats['total']*100:.1f}%)\n")
            f.write(f"Zoning Found: {stats['with_zoning']:,} ({stats['with_zoning']/stats['total']*100:.1f}%)\n\n")
            
            f.write("Confidence Levels:\n")
            f.write(f"  High: {stats['high_confidence']:,}\n")
            f.write(f"  Medium: {stats['medium_confidence']:,}\n")
            f.write(f"  Low: {stats['low_confidence']:,}\n\n")
            
            f.write("📈 ASSET CLASS BREAKDOWN\n")
            f.write("-"*70 + "\n")
            for ac, count in sorted(asset_classes.items(), key=lambda x: -x[1]):
                f.write(f"  {ac}: {count:,}\n")
        
        print(f"\n📝 Report saved: {report_file}")


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Batch enrich property data')
    parser.add_argument('--input', '-i', required=True, help='Input CSV file')
    parser.add_argument('--output', '-o', help='Output CSV file')
    parser.add_argument('--workers', '-w', type=int, default=4, help='Number of workers')
    parser.add_argument('--limit', '-l', type=int, help='Limit number of properties')
    
    args = parser.parse_args()
    
    batch = BatchEnricher()
    batch.process_csv(
        input_file=args.input,
        output_file=args.output,
        max_workers=args.workers,
        limit=args.limit
    )


if __name__ == "__main__":
    main()
