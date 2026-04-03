#!/usr/bin/env python3
"""
Save Complete Session to ContextKeep & Obsidian
Exports all work, logs, and configurations from this session
"""

import json
import logging
from datetime import datetime
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('session_export')

class SessionExporter:
    """Exports session data to ContextKeep and Obsidian"""
    
    def __init__(self):
        self.session_date = datetime.now().strftime('%Y-%m-%d')
        self.session_time = datetime.now().strftime('%H:%M:%S')
        self.project_path = Path("/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw")
        self.obsidian_path = Path.home() / "Documents" / "BDAIV2" / "Session_Logs"
        self.contextkeep_file = self.project_path / "CONTEXTKEEP_CONVERSATIONS.json"
        
    def create_session_summary(self) -> dict:
        """Create comprehensive session summary"""
        
        summary = {
            "title": f"BigDataClaw Database Rebuild & Recruiter Fix - {self.session_date}",
            "timestamp": datetime.now().isoformat(),
            "session_id": f"session_{self.session_date}_{self.session_time}",
            
            "work_completed": {
                "recruiter_database_rebuild": {
                    "status": "✅ COMPLETED",
                    "description": "Rebuilt entire recruiter database from DBeaver exports with actual cities/regions",
                    "files_created": [
                        "rebuild_recruiters_from_dbeaver.py"
                    ],
                    "files_modified": [
                        "nerve/src/App.jsx",
                        "nerve/src/views/EXAgentRecruiterUpdated.jsx",
                        "api_server.py",
                        "vercel.json",
                        "recruiter_db_with_quicklinks.json",
                        "nerve/public/data/recruiters_full.json",
                        "nerve/public/data/recruiters_sample.json",
                        "nerve/public/data/recruiters_meta.json",
                        "bigdataclaw.db"
                    ],
                    "features": [
                        "Joined realtor_brokers + realtor_salespersons with realtor_brokerages",
                        "Real city data: 93 unique cities across Ontario",
                        "Proper quick links generated for all 96,265 agents",
                        "SQLite FTS5 search fixed for special characters (St. Catharines)",
                        "JSON bloat reduced from 395MB to 77MB",
                        "Frontend switched to EXAgentRecruiterUpdated component",
                        "Vercel deployment config fixed to build nerve/ directory"
                    ],
                    "stats": {
                        "total_agents": 96265,
                        "previous_agents": 28505,
                        "unique_cities": 93,
                        "unique_brokerages": 2978,
                        "top_city": "Toronto (37,624)",
                        "data_sources": [
                            "dbeaver_final_exports/realtor_brokers_final.csv",
                            "dbeaver_final_exports/realtor_salespersons_final.csv",
                            "dbeaver_final_exports/realtor_brokerages_final.csv"
                        ]
                    }
                },
                
                "frontend_routing_fix": {
                    "status": "✅ COMPLETED",
                    "description": "Fixed EXP Agent Recruiter not displaying and city filter returning 0 results",
                    "files_modified": [
                        "nerve/src/App.jsx",
                        "nerve/src/views/EXAgentRecruiterUpdated.jsx",
                        "vercel.json"
                    ],
                    "fixes": [
                        "App.jsx now routes to EXAgentRecruiterUpdated instead of old component",
                        "City dropdown searches across all agent fields instead of exact city match",
                        "JSON fallback when API server is offline",
                        "Added 500/page pagination option",
                        "Vercel builds from nerve/ directory with correct output path"
                    ]
                },
                
                "api_search_fix": {
                    "status": "✅ COMPLETED",
                    "description": "Fixed SQLite FTS5 search breaking on special characters in city names",
                    "files_modified": [
                        "api_server.py"
                    ],
                    "fix": "FTS5 queries now wrapped in double quotes to escape periods and special chars"
                }
            },
            
            "pattern_for_other_data_types": {
                "description": "Same DBeaver join → SQLite → JSON → Frontend pattern applies to all data types",
                "applies_to": [
                    "Builders (companys_final.csv + company_contacts_final.csv)",
                    "Buyers (sale_agents_final.csv)",
                    "Sellers (sale_agents_final.csv)",
                    "Commercial Realtors (realtor_brokers_final.csv filtered by job_title)",
                    "Brokers (realtor_brokers_final.csv)",
                    "Companies (companys_final.csv)",
                    "Lenders (lenders_final.csv + lender_contacts_final.csv)"
                ],
                "steps": [
                    "1. Identify the DBeaver CSV files for the entity type",
                    "2. Join parent/child tables on foreign keys (e.g., broker_id)",
                    "3. Generate quick links for each record",
                    "4. Create/update SQLite table with proper indexes and FTS5",
                    "5. Export lean JSON to nerve/public/data/ for frontend fallback",
                    "6. Update/create frontend view component",
                    "7. Add API endpoints in api_server.py",
                    "8. Wire up routing in nerve/src/App.jsx"
                ],
                "available_dbeaver_exports": {
                    "builders_companies": [
                        "dbeaver_final_exports/companys_final.csv",
                        "dbeaver_final_exports/company_contacts_final.csv"
                    ],
                    "lenders": [
                        "dbeaver_final_exports/lenders_final.csv",
                        "dbeaver_final_exports/lender_contacts_final.csv"
                    ],
                    "sales_agents": [
                        "dbeaver_final_exports/sale_agents_final.csv"
                    ],
                    "real_estate": [
                        "dbeaver_final_exports/realtor_brokers_final.csv",
                        "dbeaver_final_exports/realtor_salespersons_final.csv",
                        "dbeaver_final_exports/realtor_brokerages_final.csv"
                    ]
                }
            },
            
            "commands_reference": {
                "database_rebuild": {
                    "recruiters": "python3 rebuild_recruiters_from_dbeaver.py",
                    "api_server": "python3 api_server.py"
                },
                "frontend": {
                    "dev": "cd nerve && npm run dev",
                    "build": "cd nerve && npm run build",
                    "deploy": "vercel --prod"
                },
                "verification": {
                    "agent_count": "sqlite3 bigdataclaw.db 'SELECT COUNT(*) FROM recruiters;'",
                    "city_distribution": "sqlite3 bigdataclaw.db 'SELECT city, COUNT(*) FROM recruiters GROUP BY city ORDER BY COUNT(*) DESC LIMIT 20;'",
                    "api_health": "curl http://localhost:8000/api/health"
                }
            },
            
            "urls": {
                "nerve_dashboard": "http://localhost:5173",
                "exp_recruiter": "http://localhost:5173/exp-agent-recruiter",
                "api_base": "http://localhost:8000/api",
                "api_health": "http://localhost:8000/api/health",
                "vercel_deploy": "https://bigdataclaw-6ks8i50gg-ish0075s-projects.vercel.app"
            },
            
            "next_steps": [
                "Restart api_server.py to serve the new 96K recruiter database",
                "Redeploy frontend to Vercel with updated vercel.json",
                "Test city filters: Toronto (~37K), Mississauga (~10K), Markham (~9K)",
                "Apply same rebuild pattern to Builders directory",
                "Apply same rebuild pattern to Lenders matcher",
                "Apply same rebuild pattern to Buyer/Seller agents",
                "Add company data to Company search/matcher"
            ]
        }
        
        return summary
    
    def save_to_contextkeep(self):
        """Save session to ContextKeep"""
        logger.info("Saving session to ContextKeep...")
        
        summary = self.create_session_summary()
        
        # Create ContextKeep entry
        memory_entry = {
            "title": summary["title"],
            "content": self._format_contextkeep_content(summary),
            "tags": [
                "development-session",
                "database-rebuild",
                "recruiters",
                "dbeaver",
                "frontend-fix",
                "bigdataclaw",
                f"session-{self.session_date}"
            ],
            "category": "development_logs",
            "created_at": datetime.now().isoformat(),
            "metadata": {
                "type": "session_summary",
                "version": "1.0",
                "project": "BigDataClaw NERVE",
                "session_id": summary["session_id"]
            }
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
    
    def _format_contextkeep_content(self, summary: dict) -> str:
        """Format content for ContextKeep"""
        content = f"""# {summary['title']}

**Session ID:** {summary['session_id']}
**Timestamp:** {summary['timestamp']}

## Work Completed

### 1. Recruiter Database Rebuild ✅
{summary['work_completed']['recruiter_database_rebuild']['description']}

**Stats:**
- Total Agents: {summary['work_completed']['recruiter_database_rebuild']['stats']['total_agents']:,} (up from {summary['work_completed']['recruiter_database_rebuild']['stats']['previous_agents']:,})
- Unique Cities: {summary['work_completed']['recruiter_database_rebuild']['stats']['unique_cities']}
- Unique Brokerages: {summary['work_completed']['recruiter_database_rebuild']['stats']['unique_brokerages']}
- Top City: {summary['work_completed']['recruiter_database_rebuild']['stats']['top_city']}

**Features:**
"""
        for feature in summary['work_completed']['recruiter_database_rebuild']['features']:
            content += f"- {feature}\n"
        
        content += "\n### 2. Frontend Routing Fix ✅\n"
        content += f"{summary['work_completed']['frontend_routing_fix']['description']}\n\n"
        content += "**Fixes:**\n"
        for fix in summary['work_completed']['frontend_routing_fix']['fixes']:
            content += f"- {fix}\n"
        
        content += "\n### 3. API Search Fix ✅\n"
        content += f"{summary['work_completed']['api_search_fix']['description']}\n\n"
        content += f"Fix: {summary['work_completed']['api_search_fix']['fix']}\n"
        
        content += "\n## Pattern for Other Data Types\n\n"
        content += f"{summary['pattern_for_other_data_types']['description']}\n\n"
        content += "**Applies to:**\n"
        for item in summary['pattern_for_other_data_types']['applies_to']:
            content += f"- {item}\n"
        
        content += "\n**Steps:**\n"
        for step in summary['pattern_for_other_data_types']['steps']:
            content += f"- {step}\n"
        
        content += "\n## Quick Commands\n\n```bash\n"
        content += "# Rebuild recruiters\n"
        content += "python3 rebuild_recruiters_from_dbeaver.py\n\n"
        content += "# Start API server\n"
        content += "python3 api_server.py\n\n"
        content += "# Check agent count\n"
        content += "sqlite3 bigdataclaw.db 'SELECT COUNT(*) FROM recruiters;'\n\n"
        content += "# Check city distribution\n"
        content += "sqlite3 bigdataclaw.db 'SELECT city, COUNT(*) FROM recruiters GROUP BY city ORDER BY COUNT(*) DESC LIMIT 20;'\n\n"
        content += "# Build frontend\n"
        content += "cd nerve && npm run build\n"
        content += "```\n\n"
        
        content += "## URLs\n"
        for name, url in summary['urls'].items():
            content += f"- {name}: {url}\n"
        
        content += "\n## Next Steps\n"
        for step in summary['next_steps']:
            content += f"- [ ] {step}\n"
        
        return content
    
    def save_to_obsidian(self):
        """Save session to Obsidian vault"""
        logger.info("Saving session to Obsidian...")
        
        # Ensure directory exists
        self.obsidian_path.mkdir(parents=True, exist_ok=True)
        
        summary = self.create_session_summary()
        
        # Create Obsidian note filename
        filename = f"Session_{self.session_date}_{self.session_time.replace(':', '-')}.md"
        filepath = self.obsidian_path / filename
        
        # Generate Obsidian markdown
        markdown = self._format_obsidian_markdown(summary)
        
        # Save
        with open(filepath, 'w') as f:
            f.write(markdown)
        
        logger.info(f"✅ Saved to Obsidian: {filepath}")
        
        # Also create/update a master index
        self._update_obsidian_index()
        
        return filepath
    
    def _format_obsidian_markdown(self, summary: dict) -> str:
        """Format markdown for Obsidian"""
        
        rebuild = summary['work_completed']['recruiter_database_rebuild']
        frontend = summary['work_completed']['frontend_routing_fix']
        api_fix = summary['work_completed']['api_search_fix']
        pattern = summary['pattern_for_other_data_types']
        
        md = f"""---
title: "{summary['title']}"
date: {self.session_date}
time: {self.session_time}
type: development-session
session_id: {summary['session_id']}
tags: [development, database-rebuild, recruiters, dbeaver, frontend-fix, bigdataclaw]
---

# 🚀 {summary['title']}

**Session ID:** `{summary['session_id']}`  
**Timestamp:** {summary['timestamp']}

---

## ✅ 1. Recruiter Database Rebuild
*{rebuild['description']}*

**Stats:**
| Metric | Value |
|--------|-------|
| Total Agents | {rebuild['stats']['total_agents']:,} |
| Previous Agents | {rebuild['stats']['previous_agents']:,} |
| Unique Cities | {rebuild['stats']['unique_cities']} |
| Unique Brokerages | {rebuild['stats']['unique_brokerages']} |
| Top City | {rebuild['stats']['top_city']} |

**Features:**
"""
        for feature in rebuild['features']:
            md += f"- ✅ {feature}\n"
        
        md += "\n**Files Created:**\n"
        for file in rebuild['files_created']:
            md += f"- `[[{file}]]`\n"
        
        md += "\n**Files Modified:**\n"
        for file in rebuild['files_modified']:
            md += f"- `{file}`\n"
        
        md += "\n**Data Sources:**\n"
        for source in rebuild['stats']['data_sources']:
            md += f"- `{source}`\n"
        
        md += f"""
---

## ✅ 2. Frontend Routing Fix
*{frontend['description']}*

**Fixes:**
"""
        for fix in frontend['fixes']:
            md += f"- ✅ {fix}\n"
        
        md += f"""
---

## ✅ 3. API Search Fix
*{api_fix['description']}*

**Fix:** {api_fix['fix']}

---

## 🔁 Pattern for Other Data Types
*{pattern['description']}*

**Applies to:**
"""
        for item in pattern['applies_to']:
            md += f"- {item}\n"
        
        md += "\n**Steps:**\n"
        for i, step in enumerate(pattern['steps'], 1):
            md += f"{i}. {step}\n"
        
        md += "\n**Available DBeaver Exports:**\n"
        for category, files in pattern['available_dbeaver_exports'].items():
            md += f"\n*{category}:*\n"
            for file in files:
                md += f"- `{file}`\n"
        
        md += f"""
---

## 🛠️ Quick Commands

### Database
```bash
# Rebuild recruiters from DBeaver
python3 rebuild_recruiters_from_dbeaver.py

# Check agent count
sqlite3 bigdataclaw.db 'SELECT COUNT(*) FROM recruiters;'

# Check city distribution
sqlite3 bigdataclaw.db 'SELECT city, COUNT(*) FROM recruiters GROUP BY city ORDER BY COUNT(*) DESC LIMIT 20;'
```

### API & Frontend
```bash
# Start API server
python3 api_server.py

# Dev mode
cd nerve && npm run dev

# Production build
cd nerve && npm run build

# Deploy
vercel --prod
```

---

## 🔗 URLs

| Service | URL |
|---------|-----|
| NERVE Dashboard | [http://localhost:5173](http://localhost:5173) |
| EXP Recruiter | [http://localhost:5173/exp-agent-recruiter](http://localhost:5173/exp-agent-recruiter) |
| API Health | [http://localhost:8000/api/health](http://localhost:8000/api/health) |
| Vercel Deploy | [{summary['urls']['vercel_deploy']}]({summary['urls']['vercel_deploy']}) |

---

## 🎯 Next Steps

"""
        for i, step in enumerate(summary['next_steps'], 1):
            md += f"{i}. {step}\n"
        
        md += f"""
---

## 📊 Session Stats

- **Total Files Created:** {len(rebuild['files_created'])}
- **Total Files Modified:** {len(rebuild['files_modified'])}
- **Work Items Completed:** 3
- **Database Growth:** {rebuild['stats']['previous_agents']:,} → {rebuild['stats']['total_agents']:,} agents ({((rebuild['stats']['total_agents'] / rebuild['stats']['previous_agents']) - 1) * 100:.0f}% increase)

---

*Session logged at {summary['timestamp']}*
"""
        
        return md
    
    def _update_obsidian_index(self):
        """Update master index of sessions"""
        index_file = self.obsidian_path / "_Session_Index.md"
        
        # Get all session files
        sessions = sorted(self.obsidian_path.glob("Session_*.md"))
        
        md = """# 📚 Development Session Index

## Recent Sessions

"""
        for session in reversed(sessions[-20:]):  # Last 20 sessions
            # Extract date from filename
            date_str = session.stem.split('_')[1]
            time_str = session.stem.split('_')[2].replace('-', ':')
            md += f"- [[{session.stem}|Session {date_str} {time_str}]]\n"
        
        md += f"""
---

**Total Sessions:** {len(sessions)}

## Quick Links

- [[Session_{self.session_date}]] - Latest Session
- [[../NERVE Mission Control]]
- [[../Qdrant Dashboard]]
"""
        
        with open(index_file, 'w') as f:
            f.write(md)
        
        logger.info(f"✅ Updated index: {index_file}")
    
    def export_all(self):
        """Export to both systems"""
        print("=" * 60)
        print("📤 EXPORTING SESSION TO CONTEXTKEEP & OBSIDIAN")
        print("=" * 60)
        
        # Export to ContextKeep
        ck_entry = self.save_to_contextkeep()
        print(f"\n✅ ContextKeep: {ck_entry['title']}")
        
        # Export to Obsidian
        obsidian_file = self.save_to_obsidian()
        print(f"✅ Obsidian: {obsidian_file.name}")
        
        print("\n" + "=" * 60)
        print("EXPORT COMPLETE")
        print("=" * 60)
        print(f"\n📁 ContextKeep: {self.contextkeep_file}")
        print(f"📁 Obsidian: {self.obsidian_path}")
        print(f"\n📝 Session ID: {ck_entry['metadata']['session_id']}")
        print(f"🏷️  Tags: {', '.join(ck_entry['tags'])}")


def main():
    """Main entry point"""
    exporter = SessionExporter()
    exporter.export_all()


if __name__ == '__main__':
    main()
