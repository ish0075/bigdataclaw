#!/usr/bin/env python3
"""
Obsidian Vault Connector for Nerve
Read/write access to Obsidian vault for buyer profiles and research notes
"""

import os
import re
import json
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional

# Default Obsidian vault path
DEFAULT_VAULT_PATH = Path.home() / "Documents" / "BDAIV2"


class ObsidianVaultConnector:
    """Connects to Obsidian vault for buyer profile management"""
    
    def __init__(self, vault_path: str = None):
        self.vault_path = Path(vault_path) if vault_path else DEFAULT_VAULT_PATH
        self.buyers_dir = self.vault_path / "buyers"
        self.properties_dir = self.vault_path / "properties"
        self.hot_money_dir = self.vault_path / "hot-money"
        
        # Ensure directories exist
        self._ensure_directories()
    
    def _ensure_directories(self):
        """Create necessary directories if they don't exist"""
        for dir_path in [self.buyers_dir, self.properties_dir, self.hot_money_dir]:
            dir_path.mkdir(parents=True, exist_ok=True)
    
    def _sanitize_filename(self, name: str) -> str:
        """Convert name to safe filename"""
        # Remove or replace unsafe characters
        safe = re.sub(r'[^\w\s-]', '', name)
        safe = re.sub(r'[-\s]+', '-', safe)
        return safe.lower().strip('-')
    
    def _format_frontmatter(self, data: dict) -> str:
        """Format YAML frontmatter"""
        lines = ["---"]
        for key, value in data.items():
            if isinstance(value, list):
                lines.append(f"{key}:")
                for item in value:
                    lines.append(f"  - {item}")
            elif isinstance(value, dict):
                lines.append(f"{key}:")
                for k, v in value.items():
                    lines.append(f"  {k}: {v}")
            else:
                lines.append(f"{key}: {value}")
        lines.append("---")
        return "\n".join(lines)
    
    def export_buyer_profile(self, buyer_data: dict) -> str:
        """Export buyer profile to Obsidian vault"""
        entity_name = buyer_data.get('entity', 'Unknown')
        filename = self._sanitize_filename(entity_name) + ".md"
        filepath = self.buyers_dir / filename
        
        # Build frontmatter
        frontmatter = {
            'title': entity_name,
            'type': 'buyer-profile',
            'created': datetime.now().isoformat(),
            'cash_position': buyer_data.get('cash_amount', 0),
            'match_score': buyer_data.get('match_score', 0),
            'tags': ['buyer', buyer_data.get('property_type', 'commercial').lower()],
        }
        
        # Build content
        content = f"""{self._format_frontmatter(frontmatter)}

# {entity_name}

## Overview
- **Entity**: {entity_name}
- **Cash Position**: ${buyer_data.get('cash_amount', 0):,}
- **Match Score**: {buyer_data.get('match_score', 0)}/100
- **Last Sale**: {buyer_data.get('sale_date', 'Unknown')}

## Recent Transaction
- **Property**: {buyer_data.get('property', 'N/A')}
- **Location**: {buyer_data.get('location', 'N/A')}
- **Type**: {buyer_data.get('property_type', 'N/A')}

## Contact Information
- **Email**: {buyer_data.get('contact_email', 'N/A')}
- **Phone**: {buyer_data.get('contact_phone', 'N/A')}
- **LinkedIn**: {buyer_data.get('linkedin', 'N/A')}

## Quick Actions
- [ ] Call
- [ ] Send Email
- [ ] Schedule Meeting
- [ ] Add to Deal Pipeline

## Notes
_Add your notes here..._

---
*Exported from BigDataClaw Nerve on {datetime.now().strftime('%Y-%m-%d %H:%M')}*
"""
        
        filepath.write_text(content, encoding='utf-8')
        return str(filepath.relative_to(self.vault_path))
    
    def export_property_research(self, property_data: dict, results: dict) -> str:
        """Export property research results to Obsidian"""
        address = property_data.get('address', 'Unknown Property')
        filename = self._sanitize_filename(address) + ".md"
        filepath = self.properties_dir / filename
        
        frontmatter = {
            'title': address,
            'type': 'property-research',
            'created': datetime.now().isoformat(),
            'asset_class': property_data.get('asset_class'),
            'price': property_data.get('price'),
            'city': property_data.get('city'),
            'tags': ['property', 'research', property_data.get('asset_class', 'commercial').lower()],
        }
        
        # Build matches section
        matches_section = ""
        for match in results.get('matches', [])[:10]:
            matches_section += f"""
### {match.get('entity', 'Unknown')}
- **Match Score**: {match.get('match_score', 0)}%
- **Contact**: {match.get('contact_name', 'N/A')}
- **Deal Size**: {match.get('typical_deal_size', 'N/A')}
- **Focus**: {', '.join(match.get('asset_focus', []))}
- [ ] Contact

"""
        
        # Build hot money section
        hot_money_section = ""
        for lead in results.get('hot_money', [])[:5]:
            hot_money_section += f"""
### {lead.get('entity', 'Unknown')}
- **Cash**: ${lead.get('cash_amount', 0):,}
- **Sale Date**: {lead.get('sale_date', 'N/A')}
- **Property**: {lead.get('property', 'N/A')}
- [ ] Contact (Hot Money!)

"""
        
        content = f"""{self._format_frontmatter(frontmatter)}

# Property Research: {address}

## Property Details
- **Address**: {address}
- **City**: {property_data.get('city', 'N/A')}
- **Region**: {property_data.get('region', 'N/A')}
- **Asset Class**: {property_data.get('asset_class', 'N/A')}
- **Price**: ${property_data.get('price', 0):,}
- **Size**: {property_data.get('size_sf', 'N/A')} SF

## Top Buyer Matches
{matches_section if matches_section else "_No matches found_"}

## Hot Money Leads
{hot_money_section if hot_money_section else "_No hot money leads found_"}

## Next Steps
- [ ] Review buyer matches
- [ ] Contact hot money leads
- [ ] Schedule property tours
- [ ] Prepare offering memorandum

---
*Research completed on {datetime.now().strftime('%Y-%m-%d %H:%M')}*
"""
        
        filepath.write_text(content, encoding='utf-8')
        return str(filepath.relative_to(self.vault_path))
    
    def list_buyer_profiles(self) -> List[Dict]:
        """List all buyer profiles in vault"""
        profiles = []
        
        if not self.buyers_dir.exists():
            return profiles
        
        for filepath in self.buyers_dir.glob("*.md"):
            try:
                content = filepath.read_text(encoding='utf-8')
                
                # Extract title from first heading
                title_match = re.search(r'^# (.+)$', content, re.MULTILINE)
                title = title_match.group(1) if title_match else filepath.stem
                
                # Extract frontmatter
                fm_match = re.search(r'^---\n(.+?)\n---', content, re.DOTALL)
                frontmatter = {}
                if fm_match:
                    # Simple YAML parsing
                    for line in fm_match.group(1).split('\n'):
                        if ':' in line:
                            key, value = line.split(':', 1)
                            frontmatter[key.strip()] = value.strip()
                
                profiles.append({
                    'filename': filepath.name,
                    'path': str(filepath.relative_to(self.vault_path)),
                    'title': title,
                    'cash_position': frontmatter.get('cash_position', 0),
                    'match_score': frontmatter.get('match_score', 0),
                    'modified': datetime.fromtimestamp(filepath.stat().st_mtime).isoformat(),
                })
            except Exception as e:
                print(f"Error reading {filepath}: {e}")
        
        return sorted(profiles, key=lambda x: x['modified'], reverse=True)
    
    def get_profile_content(self, filepath: str) -> Optional[str]:
        """Get content of a specific profile"""
        full_path = self.vault_path / filepath
        if full_path.exists() and full_path.suffix == '.md':
            return full_path.read_text(encoding='utf-8')
        return None
    
    def search_vault(self, query: str) -> List[Dict]:
        """Search vault for matching files"""
        results = []
        query_lower = query.lower()
        
        for dir_path in [self.buyers_dir, self.properties_dir, self.hot_money_dir]:
            if not dir_path.exists():
                continue
            
            for filepath in dir_path.glob("*.md"):
                try:
                    content = filepath.read_text(encoding='utf-8').lower()
                    if query_lower in content:
                        results.append({
                            'filename': filepath.name,
                            'path': str(filepath.relative_to(self.vault_path)),
                            'type': dir_path.name,
                        })
                except:
                    pass
        
        return results
    
    def get_stats(self) -> Dict:
        """Get vault statistics"""
        stats = {
            'buyer_profiles': len(list(self.buyers_dir.glob("*.md"))) if self.buyers_dir.exists() else 0,
            'property_research': len(list(self.properties_dir.glob("*.md"))) if self.properties_dir.exists() else 0,
            'hot_money_notes': len(list(self.hot_money_dir.glob("*.md"))) if self.hot_money_dir.exists() else 0,
            'vault_path': str(self.vault_path),
        }
        stats['total_files'] = sum([stats['buyer_profiles'], stats['property_research'], stats['hot_money_notes']])
        return stats


# Global instance
_vault_connector: Optional[ObsidianVaultConnector] = None

def get_vault_connector() -> ObsidianVaultConnector:
    """Get or create global vault connector"""
    global _vault_connector
    if _vault_connector is None:
        _vault_connector = ObsidianVaultConnector()
    return _vault_connector
