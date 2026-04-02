#!/usr/bin/env python3
"""
Setup Agent Workspace Database Schema
Creates tables for agent workspaces, tasks, memory, and commander system
"""

import sqlite3
import os
import json
from datetime import datetime

DB_PATH = os.path.expanduser('~/Desktop/Jamie\'s Personal Vault/bigdataclaw/bigdataclaw.db')

def init_agent_workspace_tables():
    """Initialize all agent workspace tables"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("🏗️  Setting up Agent Workspace Database...")
    
    # Agent Workspaces - Core workspace for each bot
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS agent_workspaces (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            agent_id TEXT UNIQUE NOT NULL,
            agent_name TEXT NOT NULL,
            agent_type TEXT NOT NULL,
            division TEXT NOT NULL,
            commander_id TEXT,
            status TEXT DEFAULT 'active',
            soulmd_json TEXT,
            config_json TEXT DEFAULT '{}',
            mood TEXT DEFAULT 'focused',
            current_activity TEXT,
            last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    print("  ✓ agent_workspaces table")
    
    # Agent Tasks - Task management system
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS agent_tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            agent_id TEXT NOT NULL,
            task_id TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT DEFAULT 'pending',
            priority TEXT DEFAULT 'medium',
            deadline TIMESTAMP,
            created_by TEXT,
            assigned_to TEXT,
            parent_task_id TEXT,
            dependencies TEXT,
            estimated_hours REAL,
            actual_hours REAL,
            completion_notes TEXT,
            blocked_reason TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            started_at TIMESTAMP,
            completed_at TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (agent_id) REFERENCES agent_workspaces(agent_id)
        )
    ''')
    print("  ✓ agent_tasks table")
    
    # Agent Memory - Long-term memory storage
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS agent_memory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            agent_id TEXT NOT NULL,
            memory_type TEXT NOT NULL,
            content TEXT NOT NULL,
            summary TEXT,
            tags TEXT,
            importance INTEGER DEFAULT 5,
            context_keep_id TEXT,
            source_task_id TEXT,
            metadata_json TEXT DEFAULT '{}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            accessed_at TIMESTAMP,
            FOREIGN KEY (agent_id) REFERENCES agent_workspaces(agent_id)
        )
    ''')
    print("  ✓ agent_memory table")
    
    # Agent Tools - Available tools registry
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS agent_tools (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            agent_id TEXT NOT NULL,
            tool_name TEXT NOT NULL,
            tool_type TEXT NOT NULL,
            tool_config TEXT DEFAULT '{}',
            enabled BOOLEAN DEFAULT 1,
            requires_approval BOOLEAN DEFAULT 0,
            usage_count INTEGER DEFAULT 0,
            last_used TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (agent_id) REFERENCES agent_workspaces(agent_id),
            UNIQUE(agent_id, tool_name)
        )
    ''')
    print("  ✓ agent_tools table")
    
    # Agent Conversations - Chat with Commander
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS agent_conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            agent_id TEXT NOT NULL,
            commander_id TEXT,
            message_id TEXT UNIQUE NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            message_type TEXT DEFAULT 'text',
            context_json TEXT DEFAULT '{}',
            requires_response BOOLEAN DEFAULT 0,
            responded_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (agent_id) REFERENCES agent_workspaces(agent_id)
        )
    ''')
    print("  ✓ agent_conversations table")
    
    # Commanders - Division leaders
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS commanders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            commander_id TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            division TEXT NOT NULL,
            title TEXT,
            telegram_chat_id TEXT,
            telegram_bot_token TEXT,
            phone_number TEXT,
            email TEXT,
            notification_prefs TEXT DEFAULT '{"telegram": true, "sms": false, "email": true}',
            alert_threshold TEXT DEFAULT 'warning',
            report_schedule TEXT DEFAULT 'daily',
            status TEXT DEFAULT 'active',
            last_report_sent TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    print("  ✓ commanders table")
    
    # Division Reports - Automated reports
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS division_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            report_id TEXT UNIQUE NOT NULL,
            division TEXT NOT NULL,
            commander_id TEXT NOT NULL,
            report_type TEXT NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            summary TEXT,
            metrics_json TEXT DEFAULT '{}',
            sent_via TEXT,
            delivery_status TEXT DEFAULT 'pending',
            sent_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (commander_id) REFERENCES commanders(commander_id)
        )
    ''')
    print("  ✓ division_reports table")
    
    # Assistant Delegations - Sub-agent tasks
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS assistant_delegations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            parent_agent_id TEXT NOT NULL,
            assistant_agent_id TEXT NOT NULL,
            task_id TEXT NOT NULL,
            delegation_reason TEXT,
            instructions TEXT,
            status TEXT DEFAULT 'active',
            requires_approval BOOLEAN DEFAULT 0,
            approved_by TEXT,
            approved_at TIMESTAMP,
            result_summary TEXT,
            completed_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (parent_agent_id) REFERENCES agent_workspaces(agent_id)
        )
    ''')
    print("  ✓ assistant_delegations table")
    
    # Activity Logs - Audit trail
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS agent_activity_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            agent_id TEXT NOT NULL,
            activity_type TEXT NOT NULL,
            description TEXT,
            metadata_json TEXT DEFAULT '{}',
            ip_address TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (agent_id) REFERENCES agent_workspaces(agent_id)
        )
    ''')
    print("  ✓ agent_activity_logs table")
    
    # Indexes for performance
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_tasks_agent ON agent_tasks(agent_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_tasks_status ON agent_tasks(status)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_memory_agent ON agent_memory(agent_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_memory_type ON agent_memory(memory_type)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_conversations_agent ON agent_conversations(agent_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_logs_agent ON agent_activity_logs(agent_id)')
    print("  ✓ Indexes created")
    
    conn.commit()
    conn.close()
    print("\n✅ Agent Workspace Database initialized successfully!")

def seed_initial_data():
    """Seed initial agents, commanders, and workspaces"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("\n🌱 Seeding initial data...")
    
    # Define Commanders for each division
    commanders = [
        {
            'commander_id': 'cmdr_intel',
            'name': 'Intel Chief',
            'division': 'Intelligence',
            'title': 'Director of Market Intelligence',
            'notification_prefs': json.dumps({'telegram': True, 'sms': False, 'email': True}),
            'report_schedule': 'daily'
        },
        {
            'commander_id': 'cmdr_recruit',
            'name': 'Talent Chief',
            'division': 'Recruitment',
            'title': 'Director of Talent Acquisition',
            'notification_prefs': json.dumps({'telegram': True, 'sms': False, 'email': True}),
            'report_schedule': 'daily'
        },
        {
            'commander_id': 'cmdr_capital',
            'name': 'Capital Chief',
            'division': 'Capital',
            'title': 'Director of Capital Relations',
            'notification_prefs': json.dumps({'telegram': True, 'sms': True, 'email': True}),
            'report_schedule': 'daily'
        },
        {
            'commander_id': 'cmdr_ops',
            'name': 'Ops Chief',
            'division': 'Operations',
            'title': 'Director of Operations',
            'notification_prefs': json.dumps({'telegram': True, 'sms': False, 'email': True}),
            'report_schedule': 'daily'
        },
        {
            'commander_id': 'cmdr_vigil',
            'name': 'Vigil Chief',
            'division': 'Monitoring',
            'title': 'Director of System Security',
            'notification_prefs': json.dumps({'telegram': True, 'sms': True, 'email': True}),
            'report_schedule': 'hourly'
        },
        {
            'commander_id': 'cmdr_strategy',
            'name': 'Strategy Chief',
            'division': 'Strategy',
            'title': 'Director of Strategic Initiatives',
            'notification_prefs': json.dumps({'telegram': True, 'sms': False, 'email': True}),
            'report_schedule': 'weekly'
        }
    ]
    
    for cmdr in commanders:
        cursor.execute('''
            INSERT OR IGNORE INTO commanders 
            (commander_id, name, division, title, notification_prefs, report_schedule)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (cmdr['commander_id'], cmdr['name'], cmdr['division'], 
              cmdr['title'], cmdr['notification_prefs'], cmdr['report_schedule']))
    
    print(f"  ✓ Created {len(commanders)} commanders")
    
    # Define Agents with their SoulMD
    agents = [
        # Intelligence Division
        {
            'agent_id': 'buyer_intel_bot',
            'agent_name': 'Buyer Intelligence Bot',
            'agent_type': 'intelligence',
            'division': 'Intelligence',
            'commander_id': 'cmdr_intel',
            'soulmd': {
                'purpose': 'Analyze buyer portfolios, identify asset preferences, research purchase history, and provide intelligence on potential acquirers',
                'personality': 'Analytical, thorough, detail-oriented, professional',
                'skills': ['portfolio_analysis', 'asset_identification', 'social_research', 'buyer_profiling'],
                'boundaries': ['No contact with buyers directly', 'Only analyze public information', 'Flag sensitive data'],
                'goals': ['Identify 10 qualified buyers per week', '95% accuracy on asset class identification'],
                'voice': 'Precise and data-driven'
            }
        },
        {
            'agent_id': 'seller_intel_bot',
            'agent_name': 'Seller Intelligence Bot',
            'agent_type': 'intelligence',
            'division': 'Intelligence',
            'commander_id': 'cmdr_intel',
            'soulmd': {
                'purpose': 'Research property ownership, identify motivation signals, analyze entity structures, and build seller profiles',
                'personality': 'Investigative, persistent, discreet, strategic',
                'skills': ['ownership_research', 'motivation_scoring', 'entity_analysis', 'contact_strategy'],
                'boundaries': ['Respect privacy laws', 'No unauthorized contact', 'Ethical research only'],
                'goals': ['Identify 20 qualified sellers per week', '80% accuracy on motivation scoring'],
                'voice': 'Strategic and insightful'
            }
        },
        {
            'agent_id': 'property_val_bot',
            'agent_name': 'Property Valuation Bot',
            'agent_type': 'intelligence',
            'division': 'Intelligence',
            'commander_id': 'cmdr_intel',
            'soulmd': {
                'purpose': 'Research property ownership, analyze comparable sales, assess building condition, and estimate development potential',
                'personality': 'Methodical, accurate, comprehensive, neutral',
                'skills': ['ownership_research', 'comparable_analysis', 'financial_analysis', 'development_assessment'],
                'boundaries': ['Provide estimates not appraisals', 'Flag data limitations', 'Note uncertainty levels'],
                'goals': ['Complete 50 property analyses per week', 'Within 10% of market value'],
                'voice': 'Objective and thorough'
            }
        },
        # Recruitment Division
        {
            'agent_id': 'exp_recruiter_bot',
            'agent_name': 'EXP Agent Recruiter',
            'agent_type': 'recruitment',
            'division': 'Recruitment',
            'commander_id': 'cmdr_recruit',
            'soulmd': {
                'purpose': 'Identify, research, and engage top real estate agents for recruitment opportunities',
                'personality': 'Charismatic, persuasive, organized, relationship-focused',
                'skills': ['agent_research', 'brokerage_analysis', 'outreach_campaigns', 'exp_identification'],
                'boundaries': ['Compliant with recruiting laws', 'Respect do-not-contact requests', 'Professional communication only'],
                'goals': ['Identify 100 qualified agents per week', '5% response rate on outreach'],
                'voice': 'Professional and engaging'
            }
        },
        {
            'agent_id': 'commercial_scout_bot',
            'agent_name': 'Commercial Agent Scout',
            'agent_type': 'recruitment',
            'division': 'Recruitment',
            'commander_id': 'cmdr_recruit',
            'soulmd': {
                'purpose': 'Specialized recruitment for commercial real estate agents and teams',
                'personality': 'Industry-savvy, network-focused, deal-oriented',
                'skills': ['commercial_agent_identification', 'team_analysis', 'market_specialization_mapping'],
                'boundaries': ['Focus on commercial only', 'Respect agency agreements'],
                'goals': ['Identify 25 commercial agents per week'],
                'voice': 'Industry insider'
            }
        },
        # Capital Division
        {
            'agent_id': 'hot_money_bot',
            'agent_name': 'Hot Money Tracker',
            'agent_type': 'capital',
            'division': 'Capital',
            'commander_id': 'cmdr_capital',
            'soulmd': {
                'purpose': 'Monitor market for fresh capital, track cash buyers, identify new lenders and investors',
                'personality': 'Opportunistic, fast, alert, data-hungry',
                'skills': ['transaction_monitoring', 'cash_buyer_detection', 'lender_identification', 'velocity_tracking'],
                'boundaries': ['Use public records only', 'Verify information before reporting'],
                'goals': ['Identify 15 hot money alerts per week', '24-hour detection time'],
                'voice': 'Urgent and concise'
            }
        },
        {
            'agent_id': 'lender_matcher_bot',
            'agent_name': 'Lender Matcher',
            'agent_type': 'capital',
            'division': 'Capital',
            'commander_id': 'cmdr_capital',
            'soulmd': {
                'purpose': 'Match properties and deals with appropriate lenders based on criteria and specialties',
                'personality': 'Connector, matchmaker, resourceful, knowledgeable',
                'skills': ['lender_database', 'criteria_matching', 'deal_structuring', 'relationship_mapping'],
                'boundaries': ['No financial advice', 'Lender consent required for contact'],
                'goals': ['Match 30 deals per week', '70% match acceptance rate'],
                'voice': 'Helpful and connected'
            }
        },
        # Operations Division
        {
            'agent_id': 'deal_pipeline_bot',
            'agent_name': 'Deal Pipeline Manager',
            'agent_type': 'operations',
            'division': 'Operations',
            'commander_id': 'cmdr_ops',
            'soulmd': {
                'purpose': 'Track deals through pipeline stages, ensure follow-ups, manage documentation',
                'personality': 'Organized, detail-oriented, persistent, systematic',
                'skills': ['pipeline_tracking', 'task_management', 'document_coordination', 'follow_up_automation'],
                'boundaries': ['No deal terms advice', 'Maintain confidentiality'],
                'goals': ['Zero deals lost to inactivity', '100% follow-up compliance'],
                'voice': 'Systematic and reliable'
            }
        },
        {
            'agent_id': 'property_enrich_bot',
            'agent_name': 'Property Enrichment',
            'agent_type': 'operations',
            'division': 'Operations',
            'commander_id': 'cmdr_ops',
            'soulmd': {
                'purpose': 'Enrich property data with additional details, photos, zoning info, and market context',
                'personality': 'Thorough, research-focused, enhancement-oriented',
                'skills': ['data_enrichment', 'image_sourcing', 'zoning_research', 'market_context'],
                'boundaries': ['Verify sources', 'Note data gaps'],
                'goals': ['Enrich 100 properties per week', '95% data completeness'],
                'voice': 'Detail-focused'
            }
        },
        # Monitoring Division
        {
            'agent_id': 'vigil_sentinel',
            'agent_name': 'Vigil Sentinel',
            'agent_type': 'monitoring',
            'division': 'Monitoring',
            'commander_id': 'cmdr_vigil',
            'soulmd': {
                'purpose': '24/7 system monitoring, alert on failures, track service health, ensure uptime',
                'personality': 'Vigilant, alert, protective, reliable, always-on',
                'skills': ['service_monitoring', 'health_checks', 'alert_management', 'uptime_tracking'],
                'boundaries': ['Monitor only - no unauthorized changes', 'Escalate critical issues'],
                'goals': ['99.9% uptime monitoring', 'Alert within 30 seconds of failure'],
                'voice': 'Alert and concise'
            }
        },
        # Strategy Division
        {
            'agent_id': 'boardroom_orchestrator',
            'agent_name': 'Bot Boardroom Orchestrator',
            'agent_type': 'strategy',
            'division': 'Strategy',
            'commander_id': 'cmdr_strategy',
            'soulmd': {
                'purpose': 'Facilitate multi-agent consensus meetings, coordinate debates, synthesize conclusions',
                'personality': 'Diplomatic, facilitative, synthesizing, neutral',
                'skills': ['meeting_facilitation', 'consensus_building', 'debate_coordination', 'synthesis'],
                'boundaries': ['Remain neutral', 'Ensure all voices heard', 'No decision override'],
                'goals': ['Run 10 boardroom sessions per week', '80% consensus rate'],
                'voice': 'Facilitative and balanced'
            }
        }
    ]
    
    for agent in agents:
        cursor.execute('''
            INSERT OR IGNORE INTO agent_workspaces 
            (agent_id, agent_name, agent_type, division, commander_id, soulmd_json, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (agent['agent_id'], agent['agent_name'], agent['agent_type'], 
              agent['division'], agent['commander_id'], 
              json.dumps(agent['soulmd']), 'active'))
        
        # Create default tools for each agent
        default_tools = [
            ('search', 'core', '{}', 0),
            ('api_call', 'core', '{}', 0),
            ('context_keep_read', 'memory', '{}', 0),
            ('context_keep_write', 'memory', '{}', 0),
            ('chat_commander', 'communication', '{}', 0),
        ]
        
        for tool_name, tool_type, config, requires_approval in default_tools:
            cursor.execute('''
                INSERT OR IGNORE INTO agent_tools 
                (agent_id, tool_name, tool_type, tool_config, requires_approval)
                VALUES (?, ?, ?, ?, ?)
            ''', (agent['agent_id'], tool_name, tool_type, config, requires_approval))
    
    print(f"  ✓ Created {len(agents)} agent workspaces")
    
    # Create sample tasks
    sample_tasks = [
        {
            'agent_id': 'buyer_intel_bot',
            'task_id': 'task_001',
            'title': 'Analyze buyer portfolio for 1500 Michael Drive',
            'description': 'Research and identify potential buyers for the Welland industrial property',
            'status': 'in_progress',
            'priority': 'high'
        },
        {
            'agent_id': 'exp_recruiter_bot',
            'task_id': 'task_002',
            'title': 'Recruit agents from top 5 brokerages',
            'description': 'Identify and profile high-performing agents from RE/MAX, Century 21, etc.',
            'status': 'pending',
            'priority': 'medium'
        },
        {
            'agent_id': 'vigil_sentinel',
            'task_id': 'task_003',
            'title': 'Monitor BigDataClaw API health',
            'description': 'Continuous health checks on all API endpoints',
            'status': 'in_progress',
            'priority': 'critical'
        }
    ]
    
    for task in sample_tasks:
        cursor.execute('''
            INSERT OR IGNORE INTO agent_tasks 
            (agent_id, task_id, title, description, status, priority)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (task['agent_id'], task['task_id'], task['title'], 
              task['description'], task['status'], task['priority']))
    
    print(f"  ✓ Created {len(sample_tasks)} sample tasks")
    
    conn.commit()
    conn.close()
    print("\n✅ Initial data seeded successfully!")

if __name__ == '__main__':
    init_agent_workspace_tables()
    seed_initial_data()
    print("\n🚀 Agent Workspace System is ready!")
