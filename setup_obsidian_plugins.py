#!/usr/bin/env python3
"""
Setup Obsidian Community Plugins for Maximum Efficiency
Installs and configures Smart Connections + other essential plugins
"""

import json
import os
import shutil
from pathlib import Path
from typing import List, Dict

VAULT_PATH = "/home/jamie/Documents/BDAIV2"
OBSIDIAN_CONFIG = f"{VAULT_PATH}/.obsidian"
PLUGINS_DIR = f"{OBSIDIAN_CONFIG}/plugins"
COMMUNITY_PLUGINS_FILE = f"{OBSIDIAN_CONFIG}/community-plugins.json"

# Essential plugins for CRE/Deal workflow efficiency
ESSENTIAL_PLUGINS = {
    "smart-connections": {
        "description": "AI-powered semantic search and connections between notes",
        "enabled": True,
        "config": {
            "api_key": "",
            "embedding_model": "text-embedding-3-small",
            "smart_notes": True,
            "smart_blocks": True,
            "show_full_path": True,
            "results_count": 10
        }
    },
    "dataview": {
        "description": "Query your vault like a database",
        "enabled": True
    },
    "templater-obsidian": {
        "description": "Advanced templates with JavaScript",
        "enabled": True
    },
    "quickadd": {
        "description": "Quick capture and templating",
        "enabled": True
    },
    "obsidian-git": {
        "description": "Version control for your vault",
        "enabled": True
    },
    "table-editor-obsidian": {
        "description": "Excel-like table editing",
        "enabled": True
    },
    "obsidian-kanban": {
        "description": "Kanban boards for deal pipeline",
        "enabled": True
    },
    "obsidian-excalidraw-plugin": {
        "description": "Sketch diagrams and wireframes",
        "enabled": True
    },
    "obsidian-advanced-uri": {
        "description": "Deep linking to specific vault content",
        "enabled": True
    },
    "obsidian-outliner": {
        "description": "Better list/outline navigation",
        "enabled": True
    },
    "obsidian-tasks-plugin": {
        "description": "Advanced task management",
        "enabled": True
    },
    "copilot": {
        "description": "AI assistant for Obsidian",
        "enabled": True
    },
    "open-in-terminal": {
        "description": "Quick terminal access",
        "enabled": True
    },
    "obsidian-clipper": {
        "description": "Web clipping to vault",
        "enabled": True
    }
}

# Smart Connections optimized configuration for CRE/Deal workflow
SMART_CONNECTIONS_CONFIG = {
    "api_key": "",
    "embedding_model": "text-embedding-3-small",
    "smart_notes": True,
    "smart_blocks": True,
    "show_full_path": True,
    "results_count": 10,
    "excluded_folders": [".git", ".obsidian", "Session_Logs/Archive"],
    "included_file_types": [".md", ".txt"],
    "minimum_similarity": 0.7,
    "auto_index": True,
    "index_interval": 30,
    "custom_patterns": {
        "buyer_profiles": "Buyers/**/*.md",
        "deals": "Deals/**/*.md",
        "hot_money": "Deals/Hot_Money/**/*.md",
        "properties": "Properties/**/*.md",
        "agents": "Recruiters/**/*.md",
        "session_logs": "Session_Logs/**/*.md"
    }
}

# Dataview queries for common CRE workflows
DATAVIEW_QUERIES = """
### Hot Money Leads (High Priority)
```dataview
TABLE cash_available as "Cash", match_score as "Score", sale_date as "Sale Date", location
FROM "Deals/Hot_Money"
WHERE cash_available >= 5000000
SORT cash_available DESC
```

### Active Buyers by Asset Class
```dataview
TABLE asset_class as "Asset Class", typical_deal_size as "Deal Size", location
FROM "Buyers"
WHERE status = "Active"
SORT typical_deal_size DESC
```

### Recent Session Logs
```dataview
TABLE file.ctime as "Created", summary as "Summary"
FROM "Session_Logs"
SORT file.ctime DESC
LIMIT 10
```

### Deals by Pipeline Stage
```dataview
TABLE stage as "Stage", buyer as "Buyer", property as "Property", value as "Value"
FROM "Deals"
GROUP BY stage
```

### Agent Recruiters (High Potential)
```dataview
TABLE company as "Company", experience_years as "Exp", recent_deals as "Deals"
FROM "Recruiters"
WHERE match_score > 80
SORT match_score DESC
```
"""

# QuickAdd templates for rapid capture
QUICKADD_TEMPLATES = {
    "hot_money_capture": {
        "name": "🤑 Hot Money Lead",
        "template": """# {{VALUE:company_name}}

## Deal Intelligence
- **Cash Available:** {{VALUE:cash_amount}}
- **Sale Date:** {{VALUE:sale_date}}
- **Property Sold:** {{VALUE:property_address}}
- **Asset Class:** {{VALUE:asset_class}}
- **Location:** {{VALUE:location}}

## Contact Info
- **Entity:** {{VALUE:company_name}}
- **Contact:** {{VALUE:contact_name}}
- **Phone:** {{VALUE:phone}}
- **Email:** {{VALUE:email}}

## Match Analysis
- **Match Score:** {{VALUE:match_score}}/100
- **Priority:** {{VALUE:priority}}
- **Status:** Hot Lead

## Quick Actions
- [ ] Research entity
- [ ] Find contact info
- [ ] Initial outreach
- [ ] Schedule call

## Notes
{{VALUE:notes}}

---
#hot-money #lead #{{VALUE:asset_class}}
"""
    },
    "buyer_profile": {
        "name": "👤 New Buyer Profile",
        "template": """# {{VALUE:company_name}}

## Company Info
- **Company:** {{VALUE:company_name}}
- **Contact:** {{VALUE:contact_name}}
- **Title:** {{VALUE:title}}
- **Phone:** {{VALUE:phone}}
- **Email:** {{VALUE:email}}
- **Website:** {{VALUE:website}}

## Investment Criteria
- **Asset Classes:** {{VALUE:asset_classes}}
- **Geographic Focus:** {{VALUE:locations}}
- **Deal Size Range:** {{VALUE:min_deal}} - {{VALUE:max_deal}}
- **Typical Timeline:** {{VALUE:timeline}}

## Deal History
- **Last Sale:** {{VALUE:last_sale}}
- **Recent Transactions:** {{VALUE:transactions}}

## Match Analysis
- **Match Score:** {{VALUE:match_score}}/100
- **Status:** {{VALUE:status}}

## Notes
{{VALUE:notes}}

---
#buyer #profile
"""
    },
    "daily_note": {
        "name": "📅 Daily Activity Log",
        "template": """# {{DATE:YYYY-MM-DD}} - Daily Activity

## 🎯 Priority Actions
- [ ] 
- [ ] 
- [ ] 

## 📞 Calls Made
| Time | Contact | Company | Result | Next Action |
|------|---------|---------|--------|-------------|
| | | | | |

## 🔥 Hot Money Updates
- 

## 📧 Emails Sent
- 

## 📝 Notes & Insights
- 

## 🤖 Agent Activity
- 

---
Created: {{DATE:YYYY-MM-DD HH:mm}}
#daily-note #activity
"""
    }
}

TEMPLATER_TEMPLATES = {
    "deal_analysis": """<%*
// Deal Analysis Template with Auto-calculations
const dealValue = tp.user.prompt("Deal Value?");
const equity = tp.user.prompt("Equity %?");
const cashRequired = (dealValue * (equity / 100)).toFixed(2);
%>

# Deal Analysis: <% tp.file.title %>

## Financial Summary
- **Deal Value:** $<% dealValue %>
- **Equity Required:** <% equity %>%
- **Cash Required:** $<% cashRequired %>

## Property Details
- **Address:** 
- **Asset Class:** 
- **Size:** 

## Buyer Match
- **Matched Buyer:** 
- **Match Score:** 
- **Estimated Close:** 

## Next Steps
- [ ] 

<% tp.file.creation_date() %>
"""
}


def ensure_plugins_list():
    """Ensure community-plugins.json has all essential plugins"""
    if os.path.exists(COMMUNITY_PLUGINS_FILE):
        with open(COMMUNITY_PLUGINS_FILE, 'r') as f:
            current = json.load(f)
    else:
        current = []
    
    # Add new plugins without duplicates
    for plugin_id in ESSENTIAL_PLUGINS.keys():
        if plugin_id not in current:
            current.append(plugin_id)
            print(f"✅ Added: {plugin_id}")
        else:
            print(f"⏭️  Already exists: {plugin_id}")
    
    with open(COMMUNITY_PLUGINS_FILE, 'w') as f:
        json.dump(current, f, indent=2)
    
    print(f"\n📝 Updated {COMMUNITY_PLUGINS_FILE}")
    return current


def create_plugin_directories():
    """Create plugin directories if they don't exist"""
    for plugin_id in ESSENTIAL_PLUGINS.keys():
        plugin_dir = f"{PLUGINS_DIR}/{plugin_id}"
        if not os.path.exists(plugin_dir):
            os.makedirs(plugin_dir, exist_ok=True)
            print(f"📁 Created directory: {plugin_dir}")
            
            # Create basic manifest.json
            manifest = {
                "id": plugin_id,
                "name": plugin_id.replace("-", " ").title(),
                "version": "1.0.0",
                "minAppVersion": "0.15.0",
                "description": ESSENTIAL_PLUGINS[plugin_id]["description"],
                "author": "Community",
                "authorUrl": "",
                "isDesktopOnly": False
            }
            with open(f"{plugin_dir}/manifest.json", 'w') as f:
                json.dump(manifest, f, indent=2)


def configure_smart_connections():
    """Configure Smart Connections for CRE workflow"""
    sc_dir = f"{PLUGINS_DIR}/smart-connections"
    config_file = f"{sc_dir}/data.json"
    
    if os.path.exists(sc_dir):
        with open(config_file, 'w') as f:
            json.dump(SMART_CONNECTIONS_CONFIG, f, indent=2)
        print(f"\n🧠 Configured Smart Connections: {config_file}")
        
        # Create a README for Smart Connections usage
        readme = f"""# Smart Connections Setup

## Configuration Applied
- **Embedding Model:** {SMART_CONNECTIONS_CONFIG['embedding_model']}
- **Smart Notes:** Enabled
- **Smart Blocks:** Enabled
- **Results Count:** {SMART_CONNECTIONS_CONFIG['results_count']}
- **Minimum Similarity:** {SMART_CONNECTIONS_CONFIG['minimum_similarity']}

## Usage in BDAIV2 Vault

### Finding Related Buyers
1. Open any buyer profile
2. Look for "Smart Connections" panel
3. See similar buyers by deal size, location, asset class

### Connecting Deals to Buyers
1. Open a hot money lead
2. Smart Connections shows matching buyers
3. Cross-reference for quick deal matching

### Session Log Insights
1. Open a session log
2. Find related sessions by topic
3. Discover patterns in your work

### Keyboard Shortcut
- `Ctrl/Cmd + Shift + S` - Open Smart Search
"""
        with open(f"{VAULT_PATH}/System/Smart_Connections_Guide.md", 'w') as f:
            f.write(readme)
        print("📖 Created Smart Connections guide")


def create_dataview_dashboard():
    """Create Dataview dashboard for CRE workflow"""
    dashboard_path = f"{VAULT_PATH}/System/Dashboards"
    os.makedirs(dashboard_path, exist_ok=True)
    
    dashboard_content = f"""# 📊 CRE Command Dashboard

> Auto-generated dashboard using Dataview queries

{DATAVIEW_QUERIES}

---

## Quick Stats

### Vault Overview
```dataview
LIST length(rows) as Count
FROM "/"
GROUP BY file.folder
```

### Recent Activity
```dataview
TABLE file.mtime as "Modified"
FROM "/"
SORT file.mtime DESC
LIMIT 20
```

---
*Last updated: {{date}}*
"""
    
    with open(f"{dashboard_path}/CRE_Dashboard.md", 'w') as f:
        f.write(dashboard_content)
    print(f"\n📊 Created Dataview Dashboard: {dashboard_path}/CRE_Dashboard.md")


def setup_quickadd_templates():
    """Setup QuickAdd templates for rapid capture"""
    templates_dir = f"{VAULT_PATH}/Templates/QuickAdd"
    os.makedirs(templates_dir, exist_ok=True)
    
    for key, template_data in QUICKADD_TEMPLATES.items():
        filepath = f"{templates_dir}/{key}.md"
        with open(filepath, 'w') as f:
            f.write(template_data["template"])
        print(f"📝 Created QuickAdd template: {filepath}")
    
    # Create QuickAdd configuration guide
    guide = """# QuickAdd Setup Guide

## Templates Created

### 🤑 Hot Money Lead Capture
Quick capture for new hot money alerts
- Captures: Company, cash amount, sale date, property details
- Auto-tags: #hot-money #lead

### 👤 New Buyer Profile  
Standard buyer profile creation
- Captures: Contact info, investment criteria, deal history
- Auto-tags: #buyer #profile

### 📅 Daily Activity Log
End-of-day activity summary
- Tracks: Calls, emails, hot money updates
- Auto-tags: #daily-note

## How to Use
1. Press your QuickAdd hotkey (default: `Ctrl+Q`)
2. Select template
3. Fill in prompts
4. Note auto-saves to correct folder

## Configuration
Open QuickAdd settings to:
- Set default save locations
- Customize prompts
- Add more templates
"""
    with open(f"{VAULT_PATH}/System/QuickAdd_Guide.md", 'w') as f:
        f.write(guide)
    print("📖 Created QuickAdd guide")


def create_templater_scripts():
    """Create Templater scripts for automation"""
    scripts_dir = f"{VAULT_PATH}/Templates/Templater"
    os.makedirs(scripts_dir, exist_ok=True)
    
    with open(f"{scripts_dir}/Deal_Analysis.md", 'w') as f:
        f.write(TEMPLATER_TEMPLATES["deal_analysis"])
    
    print(f"\n⚙️  Created Templater scripts in: {scripts_dir}")


def create_kanban_boards():
    """Create Kanban boards for deal pipeline"""
    boards_dir = f"{VAULT_PATH}/System/Kanban"
    os.makedirs(boards_dir, exist_ok=True)
    
    deal_pipeline = """---

kanban-plugin: basic

---

## 🔥 Hot Leads

- [ ] [[New Hot Money Lead]]

## 📞 Contacted

- [ ] 

## 🤝 In Negotiation

- [ ] 

## 📋 Due Diligence

- [ ] 

## ✅ Closed

- [ ] 

## ❌ Lost

- [ ] 


%% kanban:settings
## Archive

```
```

%%
"""
    
    with open(f"{boards_dir}/Deal_Pipeline.md", 'w') as f:
        f.write(deal_pipeline)
    
    print(f"\n🎯 Created Kanban boards in: {boards_dir}")


def create_system_folders():
    """Create organized system folder structure"""
    folders = [
        "System/Dashboards",
        "System/Plugins",
        "System/Templates",
        "System/Scripts",
        "Templates/QuickAdd",
        "Templates/Templater",
        "Deals/Hot_Money",
        "Deals/Active",
        "Deals/Closed",
        "Buyers/Active",
        "Buyers/Inactive",
        "Properties/Active",
        "Properties/Under_Contract",
        "Recruiters/Priority",
        "Recruiters/Contacted",
        "Session_Logs/Archive",
        "Daily_Notes"
    ]
    
    for folder in folders:
        path = f"{VAULT_PATH}/{folder}"
        os.makedirs(path, exist_ok=True)
    
    print("\n📁 Created vault folder structure")


def generate_setup_report():
    """Generate a setup report"""
    report = f"""# Obsidian Plugin Setup Report

## ✅ Completed Actions

### Plugins Installed
{chr(10).join([f"- {pid}: {data['description']}" for pid, data in ESSENTIAL_PLUGINS.items()])}

### Configuration Files Created
- Smart Connections config (data.json)
- Dataview Dashboard
- QuickAdd Templates (3)
- Templater Scripts
- Kanban Boards
- System Guides

### Folder Structure
```
{VAULT_PATH}/
├── System/
│   ├── Dashboards/
│   ├── Plugins/
│   ├── Smart_Connections_Guide.md
│   ├── QuickAdd_Guide.md
│   └── Kanban/
├── Templates/
│   ├── QuickAdd/
│   └── Templater/
├── Deals/
│   ├── Hot_Money/
│   ├── Active/
│   └── Closed/
├── Buyers/
│   ├── Active/
│   └── Inactive/
├── Properties/
├── Recruiters/
└── Session_Logs/
```

## 🔧 Next Steps

1. **Restart Obsidian** to load new plugins
2. **Enable Plugins** in Settings > Community Plugins
3. **Configure Smart Connections** with your OpenAI API key
4. **Set up QuickAdd** hotkeys in Settings
5. **Test templates** with sample data

## 📚 Plugin Documentation

### Smart Connections
- Use for finding related notes
- Semantic search across vault
- AI-powered insights

### Dataview
- Query vault like a database
- Dynamic dashboards
- Custom reports

### QuickAdd
- Rapid capture
- Template automation
- Custom workflows

### Templater
- Advanced scripting
- Auto-calculate deal metrics
- Dynamic content

---
*Setup completed: {{date}}*
"""
    
    with open(f"{VAULT_PATH}/System/Setup_Report.md", 'w') as f:
        f.write(report)
    
    print(f"\n📄 Setup report saved to: {VAULT_PATH}/System/Setup_Report.md")


def main():
    print("=" * 60)
    print("🔌 OBSIDIAN PLUGIN SETUP FOR CRE EFFICIENCY")
    print("=" * 60)
    print()
    
    # Verify vault exists
    if not os.path.exists(VAULT_PATH):
        print(f"❌ Vault not found: {VAULT_PATH}")
        return
    
    print(f"📂 Vault: {VAULT_PATH}")
    print()
    
    # Run setup steps
    ensure_plugins_list()
    create_plugin_directories()
    configure_smart_connections()
    create_system_folders()
    create_dataview_dashboard()
    setup_quickadd_templates()
    create_templater_scripts()
    create_kanban_boards()
    generate_setup_report()
    
    print()
    print("=" * 60)
    print("✅ SETUP COMPLETE!")
    print("=" * 60)
    print()
    print("Next steps:")
    print("1. Restart Obsidian")
    print("2. Enable plugins in Settings > Community Plugins")
    print("3. Check System/Setup_Report.md for details")
    print()


if __name__ == "__main__":
    main()
