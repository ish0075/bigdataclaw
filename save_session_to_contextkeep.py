#!/usr/bin/env python3
"""
Save Complete Session to ContextKeep
Exports all work, logs, and configurations from this session

⚠️  READ ONLY - Does NOT write to BDAIV2
For BDAIV2 export, use the separate BDAIV2 Writer project.
"""

import json
import logging
from datetime import datetime
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('session_export')

class SessionExporter:
    """Exports session data to ContextKeep ONLY"""
    
    def __init__(self):
        self.session_date = datetime.now().strftime('%Y-%m-%d')
        self.session_time = datetime.now().strftime('%H:%M:%S')
        self.project_path = Path("/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw")
        self.contextkeep_file = self.project_path / "CONTEXTKEEP_CONVERSATIONS.json"
        
    def create_session_summary(self, title: str = None, summary: str = None) -> dict:
        """Create comprehensive session summary"""
        
        summary_data = {
            "title": title or f"BigDataClaw Session - {self.session_date}",
            "timestamp": datetime.now().isoformat(),
            "session_id": f"session_{self.session_date}_{self.session_time}",
            "mode": "read-only",
            
            "summary": summary or "Session activity recorded",
            
            "metadata": {
                "type": "session_summary",
                "version": "2.0-readonly",
                "project": "BigDataClaw NERVE",
                "session_id": f"session_{self.session_date}_{self.session_time}",
                "bdaiv2_access": "read-only",
                "writes": "disabled"
            }
        }
        
        return summary_data
    
    def save_to_contextkeep(self, title: str = None, summary: str = None):
        """Save session to ContextKeep ONLY"""
        logger.info("Saving session to ContextKeep...")
        
        summary = self.create_session_summary(title, summary)
        
        # Create ContextKeep entry
        memory_entry = {
            "title": summary["title"],
            "content": summary.get("summary", ""),
            "tags": [
                "development-session",
                f"session-{self.session_date}"
            ],
            "category": "development_logs",
            "created_at": datetime.now().isoformat(),
            "metadata": summary["metadata"]
        }
        
        # Load existing or create new
        if self.contextkeep_file.exists():
            with open(self.contextkeep_file, 'r') as f:
                data = json.load(f)
            # Ensure it's a list
            if not isinstance(data, list):
                data = []
        else:
            data = []
        
        # Add new entry
        data.append(memory_entry)
        
        # Save back
        with open(self.contextkeep_file, 'w') as f:
            json.dump(data, f, indent=2)
        
        logger.info(f"✅ Saved to ContextKeep: {self.contextkeep_file}")
        return memory_entry
    
    def export(self, title: str = None, summary: str = None):
        """Export to ContextKeep"""
        print("=" * 60)
        print("📤 EXPORTING SESSION TO CONTEXTKEEP")
        print("=" * 60)
        print("\n⚠️  READ ONLY MODE")
        print("   - Saved to ContextKeep (local project)")
        print("   - BDAIV2 vault NOT modified")
        print("   - Use separate BDAIV2 Writer for vault export\n")
        
        # Export to ContextKeep
        ck_entry = self.save_to_contextkeep(title, summary)
        print(f"✅ ContextKeep: {ck_entry['title']}")
        
        print("\n" + "=" * 60)
        print("EXPORT COMPLETE")
        print("=" * 60)
        print(f"\n📁 ContextKeep: {self.contextkeep_file}")
        print(f"📝 Session ID: {ck_entry['metadata']['session_id']}")
        print(f"🏷️  Tags: {', '.join(ck_entry['tags'])}")
        print(f"\n⚠️  BDAIV2 vault was NOT modified (read-only mode)")


def main():
    """Main entry point"""
    import sys
    
    title = sys.argv[1] if len(sys.argv) > 1 else None
    summary = sys.argv[2] if len(sys.argv) > 2 else None
    
    exporter = SessionExporter()
    exporter.export(title, summary)


if __name__ == '__main__':
    main()
