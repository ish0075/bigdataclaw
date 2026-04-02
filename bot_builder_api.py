#!/usr/bin/env python3
"""
Bot Builder API
Dynamic bot creation, skill assignment, and tool configuration
"""

import json
import sqlite3
import uuid
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException

# Database path
DB_PATH = Path('/home/jamie/Desktop/Jamie\'s Personal Vault/bigdataclaw/bigdataclaw.db')

# Router
router = APIRouter(prefix="/api/bot-builder", tags=["Bot Builder"])

# Database connection
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# ============================================================================
# Pydantic Models
# ============================================================================

class SoulMDConfig(BaseModel):
    purpose: str
    personality: str
    voice: str
    goals: List[str]
    boundaries: List[str]

class BotConfig(BaseModel):
    name: str
    agent_id: str
    division: str
    commander_id: str
    description: Optional[str] = ""
    soulmd: SoulMDConfig
    skills: List[str]
    tools: List[str]
    tasks: Optional[List[Dict]] = []

class SkillDefinition(BaseModel):
    skill_id: str
    name: str
    category: str
    description: str
    parameters: Optional[Dict] = {}
    requires_approval: bool = False

class ToolDefinition(BaseModel):
    tool_id: str
    name: str
    type: str  # external, internal, notification, document, storage
    description: str
    config: Optional[Dict] = {}
    enabled: bool = True

class BotTemplate(BaseModel):
    template_id: str
    name: str
    description: str
    category: str
    default_skills: List[str]
    default_tools: List[str]
    soulmd_template: SoulMDConfig

# ============================================================================
# Skill Registry Management
# ============================================================================

SKILL_REGISTRY = {
    # Core Skills
    "search": {"name": "Web Search", "category": "Core", "description": "Search the web for information"},
    "api_call": {"name": "API Integration", "category": "Core", "description": "Make API calls to external services"},
    "data_processing": {"name": "Data Processing", "category": "Core", "description": "Process and analyze data"},
    "file_operations": {"name": "File Operations", "category": "Core", "description": "Read, write, and manage files"},
    
    # Intelligence Skills
    "portfolio_analysis": {"name": "Portfolio Analysis", "category": "Intelligence", "description": "Analyze investment portfolios"},
    "asset_identification": {"name": "Asset Identification", "category": "Intelligence", "description": "Identify asset types and classes"},
    "social_research": {"name": "Social Research", "category": "Intelligence", "description": "Research social media and profiles"},
    "buyer_profiling": {"name": "Buyer Profiling", "category": "Intelligence", "description": "Create detailed buyer profiles"},
    "ownership_research": {"name": "Ownership Research", "category": "Intelligence", "description": "Research property ownership"},
    "motivation_scoring": {"name": "Motivation Scoring", "category": "Intelligence", "description": "Score seller motivation levels"},
    "entity_analysis": {"name": "Entity Analysis", "category": "Intelligence", "description": "Analyze corporate entities"},
    "comparable_analysis": {"name": "Comparable Analysis", "category": "Intelligence", "description": "Analyze comparable properties"},
    "financial_analysis": {"name": "Financial Analysis", "category": "Intelligence", "description": "Financial calculations and analysis"},
    "development_assessment": {"name": "Development Assessment", "category": "Intelligence", "description": "Assess development potential"},
    
    # Recruitment Skills
    "agent_research": {"name": "Agent Research", "category": "Recruitment", "description": "Research real estate agents"},
    "brokerage_analysis": {"name": "Brokerage Analysis", "category": "Recruitment", "description": "Analyze brokerage firms"},
    "outreach_campaigns": {"name": "Outreach Campaigns", "category": "Recruitment", "description": "Manage outreach campaigns"},
    "exp_identification": {"name": "EXP Identification", "category": "Recruitment", "description": "Identify EXP agents"},
    
    # Capital Skills
    "transaction_monitoring": {"name": "Transaction Monitoring", "category": "Capital", "description": "Monitor transactions"},
    "cash_buyer_detection": {"name": "Cash Buyer Detection", "category": "Capital", "description": "Detect cash buyers"},
    "lender_identification": {"name": "Lender Identification", "category": "Capital", "description": "Identify lenders"},
    "velocity_tracking": {"name": "Velocity Tracking", "category": "Capital", "description": "Track transaction velocity"},
    "lender_database": {"name": "Lender Database", "category": "Capital", "description": "Access lender database"},
    "criteria_matching": {"name": "Criteria Matching", "category": "Capital", "description": "Match criteria to lenders"},
    "deal_structuring": {"name": "Deal Structuring", "category": "Capital", "description": "Structure deals"},
    "relationship_mapping": {"name": "Relationship Mapping", "category": "Capital", "description": "Map relationships"},
    
    # Operations Skills
    "pipeline_tracking": {"name": "Pipeline Tracking", "category": "Operations", "description": "Track deal pipelines"},
    "task_management": {"name": "Task Management", "category": "Operations", "description": "Manage tasks"},
    "document_coordination": {"name": "Document Coordination", "category": "Operations", "description": "Coordinate documents"},
    "follow_up_automation": {"name": "Follow-up Automation", "category": "Operations", "description": "Automate follow-ups"},
    "data_enrichment": {"name": "Data Enrichment", "category": "Operations", "description": "Enrich data"},
    "image_sourcing": {"name": "Image Sourcing", "category": "Operations", "description": "Source images"},
    "zoning_research": {"name": "Zoning Research", "category": "Operations", "description": "Research zoning"},
    "market_context": {"name": "Market Context", "category": "Operations", "description": "Provide market context"},
    
    # Monitoring Skills
    "service_monitoring": {"name": "Service Monitoring", "category": "Monitoring", "description": "Monitor services"},
    "health_checks": {"name": "Health Checks", "category": "Monitoring", "description": "Perform health checks"},
    "alert_management": {"name": "Alert Management", "category": "Monitoring", "description": "Manage alerts"},
    "uptime_tracking": {"name": "Uptime Tracking", "category": "Monitoring", "description": "Track uptime"},
    
    # Memory Skills
    "context_keep_read": {"name": "ContextKeep Read", "category": "Memory", "description": "Read from ContextKeep"},
    "context_keep_write": {"name": "ContextKeep Write", "category": "Memory", "description": "Write to ContextKeep"},
    
    # Communication Skills
    "chat_commander": {"name": "Chat Commander", "category": "Communication", "description": "Chat with Commander"},
    "email_notification": {"name": "Email Notification", "category": "Communication", "description": "Send email notifications"},
    "telegram_notification": {"name": "Telegram Notification", "category": "Communication", "description": "Send Telegram messages"},
    
    # Delegation Skills
    "delegate_assistant": {"name": "Delegate Assistant", "category": "Delegation", "description": "Delegate to assistants"},
    "spawn_worker": {"name": "Spawn Worker", "category": "Delegation", "description": "Spawn worker agents"},
}

TOOL_REGISTRY = {
    "search_api": {"name": "Search API", "type": "external", "description": "Google/Brave search API access"},
    "linkedin_api": {"name": "LinkedIn API", "type": "external", "description": "LinkedIn profile access"},
    "realtor_api": {"name": "Realtor.ca API", "type": "external", "description": "Canadian real estate data"},
    "land_registry": {"name": "Land Registry", "type": "external", "description": "Property ownership records"},
    "qdrant_search": {"name": "Qdrant Vector Search", "type": "internal", "description": "Semantic search"},
    "sqlite_query": {"name": "SQLite Query", "type": "internal", "description": "Database queries"},
    "telegram_bot": {"name": "Telegram Bot", "type": "notification", "description": "Send Telegram messages"},
    "email_sender": {"name": "Email Sender", "type": "notification", "description": "Send emails"},
    "pdf_generator": {"name": "PDF Generator", "type": "document", "description": "Generate PDF reports"},
    "excel_export": {"name": "Excel Export", "type": "document", "description": "Export to Excel"},
    "obsidian_sync": {"name": "Obsidian Sync", "type": "storage", "description": "Sync to Obsidian vault"},
    "contextkeep_sync": {"name": "ContextKeep Sync", "type": "storage", "description": "Sync to ContextKeep"},
}

# ============================================================================
# API Endpoints
# ============================================================================

@router.get("/skills")
async def get_skill_registry():
    """Get all available skills organized by category"""
    skills_by_category = {}
    
    for skill_id, skill in SKILL_REGISTRY.items():
        category = skill["category"]
        if category not in skills_by_category:
            skills_by_category[category] = []
        skills_by_category[category].append({
            "id": skill_id,
            **skill
        })
    
    return {"skills": skills_by_category}

@router.get("/tools")
async def get_tool_registry():
    """Get all available tools organized by type"""
    tools_by_type = {}
    
    for tool_id, tool in TOOL_REGISTRY.items():
        tool_type = tool["type"]
        if tool_type not in tools_by_type:
            tools_by_type[tool_type] = []
        tools_by_type[tool_type].append({
            "id": tool_id,
            **tool
        })
    
    return {"tools": tools_by_type}

@router.get("/templates")
async def get_bot_templates():
    """Get all bot templates"""
    templates = [
        {
            "template_id": "buyer_intel",
            "name": "Buyer Intelligence Bot",
            "description": "Analyzes buyer portfolios, identifies asset preferences, researches purchase history",
            "category": "Intelligence",
            "default_skills": ["portfolio_analysis", "asset_identification", "social_research", "buyer_profiling"],
            "default_tools": ["search_api", "linkedin_api", "qdrant_search", "sqlite_query"],
            "soulmd_template": {
                "purpose": "Analyze buyer portfolios and identify potential acquirers",
                "personality": "Analytical, thorough, detail-oriented, professional",
                "voice": "Precise and data-driven",
                "goals": ["Identify 10 qualified buyers per week", "95% accuracy on asset class identification"],
                "boundaries": ["No contact with buyers directly", "Only analyze public information"]
            }
        },
        {
            "template_id": "seller_intel",
            "name": "Seller Intelligence Bot",
            "description": "Researches property ownership, identifies motivation signals, analyzes entity structures",
            "category": "Intelligence",
            "default_skills": ["ownership_research", "motivation_scoring", "entity_analysis"],
            "default_tools": ["land_registry", "search_api", "qdrant_search"],
            "soulmd_template": {
                "purpose": "Research property ownership and identify seller motivation",
                "personality": "Investigative, persistent, discreet, strategic",
                "voice": "Strategic and insightful",
                "goals": ["Identify 20 qualified sellers per week", "80% accuracy on motivation scoring"],
                "boundaries": ["Respect privacy laws", "No unauthorized contact"]
            }
        },
        {
            "template_id": "recruiter",
            "name": "Agent Recruiter Bot",
            "description": "Identifies, researches, and engages top real estate agents for recruitment",
            "category": "Recruitment",
            "default_skills": ["agent_research", "brokerage_analysis", "outreach_campaigns", "exp_identification"],
            "default_tools": ["search_api", "linkedin_api", "realtor_api", "email_sender"],
            "soulmd_template": {
                "purpose": "Identify and engage top real estate agents",
                "personality": "Charismatic, persuasive, organized, relationship-focused",
                "voice": "Professional and engaging",
                "goals": ["Identify 100 qualified agents per week", "5% response rate on outreach"],
                "boundaries": ["Compliant with recruiting laws", "Respect do-not-contact requests"]
            }
        },
        {
            "template_id": "hot_money",
            "name": "Hot Money Tracker",
            "description": "Monitors market for fresh capital, tracks cash buyers, identifies new lenders",
            "category": "Capital",
            "default_skills": ["transaction_monitoring", "cash_buyer_detection", "lender_identification", "velocity_tracking"],
            "default_tools": ["land_registry", "search_api", "telegram_bot"],
            "soulmd_template": {
                "purpose": "Monitor market for fresh capital and hot money",
                "personality": "Opportunistic, fast, alert, data-hungry",
                "voice": "Urgent and concise",
                "goals": ["Identify 15 hot money alerts per week", "24-hour detection time"],
                "boundaries": ["Use public records only", "Verify information before reporting"]
            }
        },
        {
            "template_id": "pipeline_manager",
            "name": "Deal Pipeline Manager",
            "description": "Tracks deals through pipeline stages, ensures follow-ups, manages documentation",
            "category": "Operations",
            "default_skills": ["pipeline_tracking", "task_management", "document_coordination", "follow_up_automation"],
            "default_tools": ["sqlite_query", "email_sender", "pdf_generator"],
            "soulmd_template": {
                "purpose": "Track and manage deal pipelines",
                "personality": "Organized, detail-oriented, persistent, systematic",
                "voice": "Systematic and reliable",
                "goals": ["Zero deals lost to inactivity", "100% follow-up compliance"],
                "boundaries": ["No deal terms advice", "Maintain confidentiality"]
            }
        },
    ]
    
    return {"templates": templates}

@router.post("/create")
async def create_bot(config: BotConfig):
    """Create a new bot with the specified configuration"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Check if agent_id already exists
        cursor.execute("SELECT agent_id FROM agent_workspaces WHERE agent_id = ?", (config.agent_id,))
        if cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=400, detail="Bot with this ID already exists")
        
        # Create agent workspace
        cursor.execute("""
            INSERT INTO agent_workspaces 
            (agent_id, agent_name, agent_type, division, commander_id, soulmd_json, status, current_activity)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            config.agent_id,
            config.name,
            config.division.lower(),
            config.division,
            config.commander_id,
            json.dumps(config.soulmd.dict()),
            'active',
            'Just created - ready for tasks'
        ))
        
        # Add skills as tools
        for skill_id in config.skills:
            skill_info = SKILL_REGISTRY.get(skill_id, {})
            cursor.execute("""
                INSERT INTO agent_tools (agent_id, tool_name, tool_type, tool_config, enabled)
                VALUES (?, ?, ?, ?, ?)
            """, (
                config.agent_id,
                skill_id,
                'skill',
                json.dumps({"name": skill_info.get("name", skill_id), "category": skill_info.get("category", "Unknown")}),
                True
            ))
        
        # Add tools
        for tool_id in config.tools:
            tool_info = TOOL_REGISTRY.get(tool_id, {})
            requires_approval = tool_id in ['telegram_bot', 'email_sender', 'linkedin_api']
            cursor.execute("""
                INSERT INTO agent_tools (agent_id, tool_name, tool_type, tool_config, enabled, requires_approval)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                config.agent_id,
                tool_id,
                tool_info.get("type", "external"),
                json.dumps({"name": tool_info.get("name", tool_id)}),
                True,
                requires_approval
            ))
        
        # Add default tools (communication, memory)
        default_tools = [
            ('chat_commander', 'communication', '{}', False),
            ('context_keep_read', 'memory', '{}', False),
            ('context_keep_write', 'memory', '{}', False),
            ('delegate_assistant', 'delegation', '{}', True),
        ]
        
        for tool_name, tool_type, tool_config, requires_approval in default_tools:
            cursor.execute("""
                INSERT OR IGNORE INTO agent_tools 
                (agent_id, tool_name, tool_type, tool_config, requires_approval)
                VALUES (?, ?, ?, ?, ?)
            """, (config.agent_id, tool_name, tool_type, tool_config, requires_approval))
        
        # Create initial welcome task
        cursor.execute("""
            INSERT INTO agent_tasks 
            (agent_id, task_id, title, description, status, priority, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            config.agent_id,
            f"task_{uuid.uuid4().hex[:8]}",
            "Initialize bot workspace",
            f"Welcome to your new workspace! I'm {config.name}, ready to help with {config.division} tasks.",
            'completed',
            'high',
            'bot_builder'
        ))
        
        # Log creation
        cursor.execute("""
            INSERT INTO agent_activity_logs (agent_id, activity_type, description, metadata_json)
            VALUES (?, ?, ?, ?)
        """, (
            config.agent_id,
            'bot_created',
            f'Bot created via Bot Builder with {len(config.skills)} skills and {len(config.tools)} tools',
            json.dumps({"skills": config.skills, "tools": config.tools, "template_used": False})
        ))
        
        conn.commit()
        
        return {
            "success": True,
            "agent_id": config.agent_id,
            "name": config.name,
            "message": f"Bot '{config.name}' created successfully with {len(config.skills)} skills and {len(config.tools)} tools",
            "workspace_url": f"/agent-workspace/{config.agent_id}"
        }
        
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.post("/clone/{agent_id}")
async def clone_bot(agent_id: str, new_name: Optional[str] = None):
    """Clone an existing bot with a new name/ID"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Get original bot
        cursor.execute("SELECT * FROM agent_workspaces WHERE agent_id = ?", (agent_id,))
        original = cursor.fetchone()
        
        if not original:
            conn.close()
            raise HTTPException(status_code=404, detail="Bot not found")
        
        # Generate new ID
        new_agent_id = f"{agent_id}_clone_{uuid.uuid4().hex[:6]}"
        final_name = new_name or f"{original['agent_name']} (Copy)"
        
        # Clone workspace
        cursor.execute("""
            INSERT INTO agent_workspaces 
            (agent_id, agent_name, agent_type, division, commander_id, soulmd_json, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            new_agent_id,
            final_name,
            original['agent_type'],
            original['division'],
            original['commander_id'],
            original['soulmd_json'],
            'active'
        ))
        
        # Clone tools
        cursor.execute("SELECT * FROM agent_tools WHERE agent_id = ?", (agent_id,))
        tools = cursor.fetchall()
        
        for tool in tools:
            cursor.execute("""
                INSERT INTO agent_tools 
                (agent_id, tool_name, tool_type, tool_config, enabled, requires_approval)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                new_agent_id,
                tool['tool_name'],
                tool['tool_type'],
                tool['tool_config'],
                tool['enabled'],
                tool['requires_approval']
            ))
        
        conn.commit()
        
        return {
            "success": True,
            "original_agent_id": agent_id,
            "new_agent_id": new_agent_id,
            "name": final_name,
            "message": f"Bot cloned successfully as '{final_name}'"
        }
        
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.delete("/delete/{agent_id}")
async def delete_bot(agent_id: str):
    """Delete a bot and all its associated data"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Delete all related data
        cursor.execute("DELETE FROM agent_tools WHERE agent_id = ?", (agent_id,))
        cursor.execute("DELETE FROM agent_tasks WHERE agent_id = ?", (agent_id,))
        cursor.execute("DELETE FROM agent_memory WHERE agent_id = ?", (agent_id,))
        cursor.execute("DELETE FROM agent_conversations WHERE agent_id = ?", (agent_id,))
        cursor.execute("DELETE FROM agent_activity_logs WHERE agent_id = ?", (agent_id,))
        cursor.execute("DELETE FROM assistant_delegations WHERE parent_agent_id = ? OR assistant_agent_id = ?", (agent_id, agent_id))
        cursor.execute("DELETE FROM agent_workspaces WHERE agent_id = ?", (agent_id,))
        
        conn.commit()
        
        return {
            "success": True,
            "agent_id": agent_id,
            "message": "Bot deleted successfully"
        }
        
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.post("/add-skill/{agent_id}")
async def add_skill_to_bot(agent_id: str, skill_id: str):
    """Add a skill to an existing bot"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Check if bot exists
        cursor.execute("SELECT agent_id FROM agent_workspaces WHERE agent_id = ?", (agent_id,))
        if not cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=404, detail="Bot not found")
        
        # Check if skill exists
        skill_info = SKILL_REGISTRY.get(skill_id)
        if not skill_info:
            conn.close()
            raise HTTPException(status_code=400, detail="Skill not found in registry")
        
        # Check if skill already assigned
        cursor.execute("SELECT id FROM agent_tools WHERE agent_id = ? AND tool_name = ?", (agent_id, skill_id))
        if cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=400, detail="Skill already assigned to bot")
        
        # Add skill
        cursor.execute("""
            INSERT INTO agent_tools (agent_id, tool_name, tool_type, tool_config, enabled)
            VALUES (?, ?, ?, ?, ?)
        """, (
            agent_id,
            skill_id,
            'skill',
            json.dumps({"name": skill_info["name"], "category": skill_info["category"]}),
            True
        ))
        
        # Log activity
        cursor.execute("""
            INSERT INTO agent_activity_logs (agent_id, activity_type, description, metadata_json)
            VALUES (?, ?, ?, ?)
        """, (
            agent_id,
            'skill_added',
            f'Skill added: {skill_info["name"]}',
            json.dumps({"skill_id": skill_id})
        ))
        
        conn.commit()
        
        return {
            "success": True,
            "agent_id": agent_id,
            "skill_id": skill_id,
            "message": f"Skill '{skill_info['name']}' added successfully"
        }
        
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.post("/add-tool/{agent_id}")
async def add_tool_to_bot(agent_id: str, tool_id: str):
    """Add a tool to an existing bot"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Check if bot exists
        cursor.execute("SELECT agent_id FROM agent_workspaces WHERE agent_id = ?", (agent_id,))
        if not cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=404, detail="Bot not found")
        
        # Check if tool exists
        tool_info = TOOL_REGISTRY.get(tool_id)
        if not tool_info:
            conn.close()
            raise HTTPException(status_code=400, detail="Tool not found in registry")
        
        # Check if tool already assigned
        cursor.execute("SELECT id FROM agent_tools WHERE agent_id = ? AND tool_name = ?", (agent_id, tool_id))
        if cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=400, detail="Tool already assigned to bot")
        
        # Add tool
        requires_approval = tool_id in ['telegram_bot', 'email_sender', 'linkedin_api']
        cursor.execute("""
            INSERT INTO agent_tools (agent_id, tool_name, tool_type, tool_config, enabled, requires_approval)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            agent_id,
            tool_id,
            tool_info["type"],
            json.dumps({"name": tool_info["name"]}),
            True,
            requires_approval
        ))
        
        # Log activity
        cursor.execute("""
            INSERT INTO agent_activity_logs (agent_id, activity_type, description, metadata_json)
            VALUES (?, ?, ?, ?)
        """, (
            agent_id,
            'tool_added',
            f'Tool added: {tool_info["name"]}',
            json.dumps({"tool_id": tool_id})
        ))
        
        conn.commit()
        
        return {
            "success": True,
            "agent_id": agent_id,
            "tool_id": tool_id,
            "message": f"Tool '{tool_info['name']}' added successfully"
        }
        
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.get("/stats")
async def get_builder_stats():
    """Get statistics about bots created"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT 
            COUNT(*) as total_bots,
            COUNT(DISTINCT division) as total_divisions,
            SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_bots
        FROM agent_workspaces
    """)
    bot_stats = dict(cursor.fetchone())
    
    cursor.execute("""
        SELECT 
            aw.division,
            COUNT(*) as bot_count,
            COUNT(DISTINCT at.id) as task_count,
            COUNT(DISTINCT alt.id) as tool_count
        FROM agent_workspaces aw
        LEFT JOIN agent_tasks at ON aw.agent_id = at.agent_id
        LEFT JOIN agent_tools alt ON aw.agent_id = alt.agent_id
        GROUP BY aw.division
    """)
    division_stats = [dict(row) for row in cursor.fetchall()]
    
    cursor.execute("""
        SELECT tool_name, COUNT(*) as usage_count
        FROM agent_tools
        GROUP BY tool_name
        ORDER BY usage_count DESC
        LIMIT 10
    """)
    popular_tools = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    
    return {
        "bot_stats": bot_stats,
        "division_stats": division_stats,
        "popular_tools": popular_tools
    }
