#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════════════════╗
║           DATA EMPIRE HEALTH MONITOR                                         ║
║                                                                              ║
║  Monitors all systems:                                                       ║
║  • Database health                                                           ║
║  • Quick Links validity                                                      ║
║  • File integrity                                                            ║
║  • Agent status                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

import os
import json
import csv
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List
import hashlib


class HealthMonitor:
    """Monitor health of Data Empire systems"""
    
    def __init__(self, base_path="/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw"):
        self.base_path = base_path
        self.checks = []
        self.issues = []
        self.metrics = {}
        
    def check_database_files(self) -> Dict:
        """Check all database CSV files"""
        print("\n📊 Checking Database Files...")
        
        db_files = {
            'builders': 'QUICK_LINKS_BUILDERS.csv',
            'companies': 'QUICK_LINKS_COMPANIES_CATEGORIZED.csv',
            'realtors': 'QUICK_LINKS_ALL_REALTORS_V2.csv',
            'lenders': 'QUICK_LINKS_LENDERS_V2.csv',
            'recruiters': 'QUICK_LINKS_RECRUITER_DATABASE.csv'
        }
        
        results = {}
        total_records = 0
        
        for name, filename in db_files.items():
            filepath = os.path.join(self.base_path, filename)
            
            if not os.path.exists(filepath):
                self.issues.append(f"❌ Missing: {filename}")
                results[name] = {'status': 'missing', 'count': 0}
                continue
            
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    reader = csv.reader(f)
                    header = next(reader, None)
                    count = sum(1 for _ in reader)
                
                file_size = os.path.getsize(filepath) / (1024 * 1024)  # MB
                
                results[name] = {
                    'status': 'ok',
                    'count': count,
                    'size_mb': round(file_size, 2),
                    'columns': len(header) if header else 0
                }
                
                total_records += count
                print(f"  ✅ {name}: {count:,} records ({file_size:.1f} MB)")
                
            except Exception as e:
                self.issues.append(f"❌ Error reading {filename}: {e}")
                results[name] = {'status': 'error', 'error': str(e)}
        
        self.metrics['total_records'] = total_records
        self.metrics['database_files'] = results
        
        return results
    
    def check_quick_links_coverage(self) -> Dict:
        """Check Quick Links coverage in databases"""
        print("\n🔗 Checking Quick Links Coverage...")
        
        coverage = {}
        
        # Sample builders file for Quick Links
        builders_file = os.path.join(self.base_path, 'QUICK_LINKS_BUILDERS.csv')
        if os.path.exists(builders_file):
            try:
                with open(builders_file, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    rows = list(reader)[:100]  # Sample first 100
                
                # Check which columns have Quick Links
                link_columns = [c for c in rows[0].keys() if c.startswith('ql_')]
                
                coverage['builders'] = {
                    'total_quick_link_columns': len(link_columns),
                    'sample_columns': link_columns[:10]
                }
                
                print(f"  ✅ Builders: {len(link_columns)} Quick Link columns")
                
            except Exception as e:
                self.issues.append(f"⚠️ Error checking Quick Links: {e}")
        
        return coverage
    
    def check_contextkeep_export(self) -> Dict:
        """Check ContextKeep export status"""
        print("\n💾 Checking ContextKeep Export...")
        
        export_file = os.path.join(self.base_path, 'CONTEXTKEEP_QUICKLINKS_EXPORT.json')
        
        if not os.path.exists(export_file):
            self.issues.append("❌ ContextKeep export not found")
            return {'status': 'missing'}
        
        try:
            with open(export_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            metadata = data.get('metadata', {})
            memories = data.get('memories', [])
            
            result = {
                'status': 'ok',
                'total_memories': len(memories),
                'version': metadata.get('version', 'unknown'),
                'exported_at': metadata.get('exported_at', 'unknown'),
                'size_mb': round(os.path.getsize(export_file) / (1024 * 1024), 2)
            }
            
            print(f"  ✅ ContextKeep: {len(memories):,} memories ({result['size_mb']} MB)")
            
            return result
            
        except Exception as e:
            self.issues.append(f"❌ Error reading ContextKeep export: {e}")
            return {'status': 'error', 'error': str(e)}
    
    def check_obsidian_vaults(self) -> Dict:
        """Check Obsidian vault status"""
        print("\n📝 Checking Obsidian Vaults...")
        
        vaults = {
            'BDAIV2': '/home/jamie/Documents/BDAIV2',
            'Personal': '/home/jamie/Desktop/Jamie\'s Personal Vault'
        }
        
        results = {}
        
        for name, path in vaults.items():
            if not os.path.exists(path):
                self.issues.append(f"❌ Vault not found: {name}")
                results[name] = {'status': 'missing'}
                continue
            
            try:
                # Count markdown files
                md_count = len(list(Path(path).rglob('*.md')))
                
                # Check for builders folder
                builders_path = os.path.join(path, 'companies/Builders' if name == 'BDAIV2' else 'Builders')
                builders_count = len(list(Path(builders_path).glob('*.md'))) if os.path.exists(builders_path) else 0
                
                results[name] = {
                    'status': 'ok',
                    'total_notes': md_count,
                    'builders_notes': builders_count
                }
                
                print(f"  ✅ {name}: {md_count:,} notes ({builders_count} builders)")
                
            except Exception as e:
                self.issues.append(f"⚠️ Error checking {name}: {e}")
                results[name] = {'status': 'error'}
        
        return results
    
    def check_enrichment_output(self) -> Dict:
        """Check property enrichment output"""
        print("\n🏢 Checking Enrichment Output...")
        
        enrichment_dir = os.path.join(self.base_path, 'enrichment_output')
        
        if not os.path.exists(enrichment_dir):
            print("  ℹ️ No enrichment output yet")
            return {'status': 'not_started'}
        
        try:
            files = os.listdir(enrichment_dir)
            csv_files = [f for f in files if f.endswith('.csv')]
            
            print(f"  ✅ Enrichment: {len(csv_files)} output files")
            
            return {
                'status': 'ok',
                'output_files': len(csv_files),
                'files': csv_files[:5]  # List first 5
            }
            
        except Exception as e:
            return {'status': 'error', 'error': str(e)}
    
    def generate_health_report(self) -> str:
        """Generate comprehensive health report"""
        print("\n" + "="*70)
        print("🔍 GENERATING HEALTH REPORT")
        print("="*70)
        
        # Run all checks
        self.check_database_files()
        self.check_quick_links_coverage()
        self.check_contextkeep_export()
        self.check_obsidian_vaults()
        self.check_enrichment_output()
        
        # Generate report
        report = f"""# 🏥 Data Empire Health Report

**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## 📊 Overall Status

| Metric | Value |
|--------|-------|
| Total Contacts | {self.metrics.get('total_records', 0):,} |
| Database Files | {len(self.metrics.get('database_files', {}))} |
| Issues Found | {len(self.issues)} |

## 📁 Database Health

"""
        
        # Add database details
        for name, info in self.metrics.get('database_files', {}).items():
            status = "✅" if info.get('status') == 'ok' else "❌"
            report += f"| {status} {name} | {info.get('count', 0):,} records | {info.get('size_mb', 0)} MB |\n"
        
        # Add issues section if any
        if self.issues:
            report += """
## ⚠️ Issues Found

"""
            for issue in self.issues:
                report += f"- {issue}\n"
        else:
            report += """
## ✅ All Systems Healthy

No critical issues found.
"""
        
        # Add recommendations
        report += """
## 🎯 Recommendations

1. **Database Optimization**
   - Run deduplication weekly
   - Archive old records monthly

2. **Quick Links Maintenance**
   - Verify links monthly
   - Update broken links

3. **Enrichment Pipeline**
   - Process new properties daily
   - Run full enrichment weekly

4. **Monitoring**
   - Check health daily
   - Review metrics weekly

---

*Next check: Recommended daily*
"""
        
        return report
    
    def save_report(self, report: str):
        """Save report to file"""
        report_file = os.path.join(
            self.base_path, 
            f"health_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
        )
        
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write(report)
        
        print(f"\n💾 Report saved: {report_file}")
        return report_file
    
    def run_all_checks(self):
        """Run complete health check"""
        print("="*70)
        print("🏥 DATA EMPIRE HEALTH CHECK")
        print("="*70)
        
        report = self.generate_health_report()
        
        # Save and display
        report_file = self.save_report(report)
        
        print("\n" + report)
        
        return report_file


def main():
    """Run health check"""
    monitor = HealthMonitor()
    report_file = monitor.run_all_checks()
    
    print(f"\n✅ Health check complete!")
    print(f"   Report: {report_file}")


if __name__ == "__main__":
    main()
