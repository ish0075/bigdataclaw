#!/usr/bin/env python3
"""
Save Session to ContextKeep AND Main Working Vault

Writes sessions to:
1. CONTEXTKEEP_CONVERSATIONS.json (local project)
2. Main Working Vault /Session_Logs/ (Obsidian)

NEVER writes to BDAIV2.
"""

import json
import logging
import requests
from datetime import datetime
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('session_export')

# Main Working Vault API
VAULT_API = "http://localhost:8000/api/obsidian"

class SessionExporter:
    """Exports sessions to ContextKeep and Main Working Vault"""
    
    def __init__(self):
        self.session_date = datetime.now().strftime('%Y-%m-%d')
        self.session_time = datetime.now().strftime('%H:%M:%S')
        self.project_path = Path("/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw")
        self.contextkeep_file = self.project_path / "CONTEXTKEEP_CONVERSATIONS.json"
        self.main_vault_path = "/home/jamie/Desktop/Jamie's Personal Vault"
    
    def save_to_contextkeep(self, title: str = None, summary: str = None):
        """Save to ContextKeep JSON"""
        logger.info("Saving to ContextKeep...")
        
        entry = {
            "title": title or f"Session - {self.session_date}",
            "content": summary or "Session recorded",
            "tags": ["development-session", f"session-{self.session_date}"],
            "category": "development_logs",
            "created_at": datetime.now().isoformat(),
            "metadata": {
                "type": "session_summary",
                "version": "2.0",
                "project": "BigDataClaw NERVE",
                "session_id": f"session_{self.session_date}_{self.session_time}",
                "vault_write": "Main Working Vault"
            }
        }
        
        # Load existing
        if self.contextkeep_file.exists():
            with open(self.contextkeep_file, 'r') as f:
                data = json.load(f)
            if not isinstance(data, list):
                data = []
        else:
            data = []
        
        data.append(entry)
        
        with open(self.contextkeep_file, 'w') as f:
            json.dump(data, f, indent=2)
        
        logger.info(f"✅ ContextKeep: {self.contextkeep_file}")
        return entry
    
    def save_to_main_vault(self, title: str = None, summary: str = None):
        """Save session log to Main Working Vault /Session_Logs/"""
        logger.info("Saving to Main Working Vault...")
        
        try:
            # Prepare session data
            session_data = {
                "title": title or f"Session - {self.session_date}",
                "summary": summary or "Session recorded",
                "session_id": f"session_{self.session_date}_{self.session_time}",
                "category": "general",
                "work_completed": [
                    {"title": "Session", "description": summary or "Work completed"}
                ]
            }
            
            # Send to API (writes to Main Working Vault)
            response = requests.post(
                f"{VAULT_API}/session-log",
                json=session_data,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"✅ Main Vault: {result.get('path', 'Session_Logs/')}")
                return result
            else:
                logger.error(f"Failed to write to vault: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"Error writing to vault: {e}")
            return None
    
    def export(self, title: str = None, summary: str = None):
        """Export to both locations"""
        print("=" * 60)
        print("📤 EXPORTING SESSION")
        print("=" * 60)
        print()
        print("Vault Configuration:")
        print(f"  ✅ ContextKeep: {self.contextkeep_file}")
        print(f"  ✅ Main Working Vault: {self.main_vault_path}/Session_Logs/")
        print(f"  ❌ BDAIV2: NEVER (read-only separation)")
        print()
        
        # Save to ContextKeep
        ck = self.save_to_contextkeep(title, summary)
        print(f"✅ ContextKeep: {ck['title'][:50]}...")
        
        # Save to Main Working Vault
        vault = self.save_to_main_vault(title, summary)
        if vault:
            print(f"✅ Main Vault: {vault.get('path', 'saved')}")
        else:
            print("⚠️  Main Vault: Failed (API may be offline)")
        
        print()
        print("=" * 60)
        print("EXPORT COMPLETE")
        print("=" * 60)


def main():
    import sys
    title = sys.argv[1] if len(sys.argv) > 1 else None
    summary = sys.argv[2] if len(sys.argv) > 2 else None
    
    exporter = SessionExporter()
    exporter.export(title, summary)


if __name__ == '__main__':
    main()
