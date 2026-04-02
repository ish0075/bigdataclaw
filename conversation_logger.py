#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════════════════╗
║           CONVERSATION LOGGER FOR CONTEXTKEEP                                ║
║                                                                              ║
║  Automatically logs conversations to ContextKeep with:                      ║
║  - Summary                                                                   ║
║  - Action items                                                              ║
║  - Decisions made                                                            ║
║  - Files created/modified                                                    ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

import json
import os
import re
from datetime import datetime
from pathlib import Path
from typing import List, Dict


class ConversationLogger:
    """Log conversations to ContextKeep-compatible format"""
    
    def __init__(self, vault_path="/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw"):
        self.vault_path = vault_path
        self.logs_dir = os.path.join(vault_path, "conversation_logs")
        os.makedirs(self.logs_dir, exist_ok=True)
        
        # Track files created/modified
        self.tracked_extensions = ['.py', '.md', '.csv', '.json', '.js', '.jsx']
        self.start_files = self._get_current_files()
    
    def _get_current_files(self) -> Dict[str, float]:
        """Get current state of tracked files"""
        files = {}
        for ext in self.tracked_extensions:
            for filepath in Path(self.vault_path).rglob(f"*{ext}"):
                if 'node_modules' not in str(filepath):
                    files[str(filepath)] = filepath.stat().st_mtime
        return files
    
    def _detect_changes(self) -> List[Dict]:
        """Detect files created or modified during conversation"""
        current_files = self._get_current_files()
        changes = []
        
        # New files
        for filepath, mtime in current_files.items():
            if filepath not in self.start_files:
                changes.append({
                    'action': 'created',
                    'file': os.path.basename(filepath),
                    'path': filepath,
                    'timestamp': datetime.fromtimestamp(mtime).isoformat()
                })
        
        # Modified files
        for filepath, mtime in current_files.items():
            if filepath in self.start_files:
                if mtime > self.start_files[filepath]:
                    changes.append({
                        'action': 'modified',
                        'file': os.path.basename(filepath),
                        'path': filepath,
                        'timestamp': datetime.fromtimestamp(mtime).isoformat()
                    })
        
        return sorted(changes, key=lambda x: x['timestamp'])
    
    def create_log(self, 
                   summary: str,
                   topics: List[str],
                   decisions: List[str],
                   action_items: List[str],
                   participants: List[str] = ["Jamie", "Claude"]) -> str:
        """Create a conversation log"""
        
        # Detect file changes
        changes = self._detect_changes()
        
        # Generate timestamp
        timestamp = datetime.now()
        date_str = timestamp.strftime('%Y-%m-%d')
        time_str = timestamp.strftime('%H:%M:%S')
        
        # Create log content
        log_content = f"""---
type: conversation-log
date: {date_str}
time: {time_str}
participants: {json.dumps(participants)}
topics: {json.dumps(topics)}
decisions_made: {len(decisions)}
action_items: {len(action_items)}
files_changed: {len(changes)}
---

# 💬 Conversation Log - {date_str}

## 📝 Summary
{summary}

## 🏷️ Topics Discussed
{chr(10).join(f"- {topic}" for topic in topics)}

## ✅ Decisions Made
{chr(10).join(f"{i+1}. {decision}" for i, decision in enumerate(decisions))}

## 📋 Action Items
{chr(10).join(f"- [ ] {item}" for item in action_items)}

## 📁 Files Changed ({len(changes)})
"""
        
        # Add file changes
        if changes:
            for change in changes:
                emoji = "🆕" if change['action'] == 'created' else "📝"
                log_content += f"{emoji} **{change['action'].title()}:** `{change['file']}`\n"
        else:
            log_content += "_No files changed during this conversation_\n"
        
        log_content += f"""

## 🔗 Quick Links Generated
- Total Quick Links: Check QUICK_LINKS_SUMMARY.txt
- ContextKeep Export: CONTEXTKEEP_QUICKLINKS_EXPORT.json
- Latest Enrichment: See enrichment_output/

## 📊 Current Stats
- Total Contacts: 164,729
- Builders: 4,363
- Investment Companies: 4,493
- REITs: 249
- Private Equity: 333
- Recruiters: 28,505

---
*Logged at {time_str}*  
*Next conversation: Check daily_notes/*

#conversation #log #daily
"""
        
        # Save to file
        filename = f"conversation_{date_str}_{time_str.replace(':', '-')}.md"
        filepath = os.path.join(self.logs_dir, filename)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(log_content)
        
        # Also save to ContextKeep format
        self._save_to_contextkeep_format(
            summary, topics, decisions, action_items, 
            changes, participants, date_str, time_str
        )
        
        return filepath
    
    def _save_to_contextkeep_format(self, summary, topics, decisions, 
                                    action_items, changes, participants,
                                    date_str, time_str):
        """Save in ContextKeep-compatible JSON format"""
        
        memory = {
            "title": f"Conversation: {date_str} - {topics[0] if topics else 'General'}",
            "content": f"""# Conversation Summary - {date_str}

**Summary:** {summary}

**Topics:** {', '.join(topics)}

**Decisions:**
{chr(10).join(f"- {d}" for d in decisions)}

**Action Items:**
{chr(10).join(f"- [ ] {a}" for a in action_items)}

**Files Changed:** {len(changes)}
""",
            "tags": ["conversation", "log", "daily"] + [t.lower().replace(' ', '-') for t in topics[:3]],
            "category": "conversations",
            "created_at": datetime.now().isoformat(),
            "metadata": {
                "type": "conversation_log",
                "participants": participants,
                "date": date_str,
                "decisions_count": len(decisions),
                "action_items_count": len(action_items),
                "files_changed": len(changes)
            }
        }
        
        # Append to daily conversations file
        daily_file = os.path.join(self.vault_path, "CONTEXTKEEP_CONVERSATIONS.json")
        
        conversations = []
        if os.path.exists(daily_file):
            try:
                with open(daily_file, 'r') as f:
                    conversations = json.load(f)
            except:
                conversations = []
        
        conversations.append(memory)
        
        with open(daily_file, 'w') as f:
            json.dump(conversations, f, indent=2)
        
        print(f"  💾 Saved to ContextKeep format: {daily_file}")
    
    def get_daily_summary(self, date_str: str = None) -> str:
        """Get summary of all conversations for a date"""
        if not date_str:
            date_str = datetime.now().strftime('%Y-%m-%d')
        
        daily_file = os.path.join(self.vault_path, "CONTEXTKEEP_CONVERSATIONS.json")
        
        if not os.path.exists(daily_file):
            return "No conversations logged yet."
        
        with open(daily_file, 'r') as f:
            conversations = json.load(f)
        
        # Filter by date
        day_conversations = [
            c for c in conversations 
            if c['metadata']['date'] == date_str
        ]
        
        if not day_conversations:
            return f"No conversations found for {date_str}"
        
        summary = f"""# Daily Summary - {date_str}

**Total Conversations:** {len(day_conversations)}

## Key Topics
"""
        
        all_topics = set()
        all_decisions = []
        all_actions = []
        
        for conv in day_conversations:
            all_topics.update(conv['metadata'].get('topics', []))
            # Extract from content
            content = conv['content']
            # Parse decisions and actions from content
        
        summary += chr(10).join(f"- {t}" for t in all_topics)
        
        return summary


def main():
    """Example usage"""
    logger = ConversationLogger()
    
    # Example conversation log
    log_file = logger.create_log(
        summary="""Completed Quick Links v2.1 with WhatsApp, TikTok, and chat platforms. 
Exported 37,943 contacts to ContextKeep. Discussed Qdrant implementation for semantic search.""",
        topics=[
            "Quick Links v2.1 Enhancement",
            "WhatsApp/TikTok Integration", 
            "ContextKeep Export",
            "Qdrant Vector Database",
            "Data Empire Architecture"
        ],
        decisions=[
            "Add Qdrant for vector search (not ContextKeep)",
            "Keep ContextKeep for conversation memory",
            "Build 24/7 monitoring system",
            "Deploy agent ecosystem for automation"
        ],
        action_items=[
            "Install Qdrant vector database",
            "Create monitoring dashboard",
            "Deploy scraper agents",
            "Index 164K contacts to Qdrant",
            "Set up conversation logger"
        ]
    )
    
    print(f"\n✅ Conversation logged to: {log_file}")
    print(f"   Also saved to ContextKeep format")


if __name__ == "__main__":
    main()
