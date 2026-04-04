#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════════════════╗
║           AGENT ORCHESTRATOR                                                 ║
║                                                                              ║
║  Manages all Data Empire agents:                                            ║
║  • Schedules tasks                                                           ║
║  • Monitors health                                                           ║
║  • Handles failures                                                          ║
║  • Optimizes performance                                                     ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

import asyncio
import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
from enum import Enum


class AgentStatus(Enum):
    IDLE = "idle"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    RETRYING = "retrying"


@dataclass
class AgentTask:
    """Represents a task for an agent"""
    id: str
    agent_type: str
    command: str
    schedule: str  # 'once', 'hourly', 'daily', 'weekly'
    status: AgentStatus
    last_run: Optional[datetime]
    next_run: Optional[datetime]
    retry_count: int
    max_retries: int
    output_file: Optional[str]


class AgentOrchestrator:
    """Central orchestrator for all Data Empire agents"""
    
    def __init__(self, config_file="agent_config.json"):
        self.config_file = config_file
        self.agents = {}
        self.tasks = []
        self.logs = []
        self.running = False
        
        self._load_config()
        self._initialize_default_agents()
    
    def _load_config(self):
        """Load agent configuration"""
        if os.path.exists(self.config_file):
            with open(self.config_file, 'r') as f:
                config = json.load(f)
                # Restore tasks
                for task_data in config.get('tasks', []):
                    task = AgentTask(**task_data)
                    if isinstance(task.status, str):
                        # Handle 'AgentStatus.IDLE' format
                        status_str = task.status.replace('AgentStatus.', '')
                        try:
                            task.status = AgentStatus[status_str]
                        except KeyError:
                            task.status = AgentStatus.IDLE
                    self.tasks.append(task)
    
    def _save_config(self):
        """Save agent configuration"""
        config = {
            'tasks': [asdict(t) for t in self.tasks],
            'last_saved': datetime.now().isoformat()
        }
        
        with open(self.config_file, 'w') as f:
            json.dump(config, f, indent=2, default=str)
    
    def _initialize_default_agents(self):
        """Set up default agents if none exist"""
        if not self.tasks:
            print("🤖 Initializing default agents...")
            
            default_tasks = [
                # Data Collection Agents
                {
                    'id': 'loopnet_scraper',
                    'agent_type': 'scraper',
                    'command': 'python scrapers/loopnet_scraper.py',
                    'schedule': 'daily',
                    'status': AgentStatus.IDLE,
                    'max_retries': 3
                },
                {
                    'id': 'news_monitor',
                    'agent_type': 'monitor',
                    'command': 'python monitors/news_monitor.py',
                    'schedule': 'hourly',
                    'status': AgentStatus.IDLE,
                    'max_retries': 3
                },
                
                # Enrichment Agents
                {
                    'id': 'property_enricher',
                    'agent_type': 'enrichment',
                    'command': 'python property_enrichment_engine.py --batch',
                    'schedule': 'daily',
                    'status': AgentStatus.IDLE,
                    'max_retries': 2
                },
                {
                    'id': 'quicklink_generator',
                    'agent_type': 'enrichment',
                    'command': 'python generate_quick_links.py --all',
                    'schedule': 'daily',
                    'status': AgentStatus.IDLE,
                    'max_retries': 2
                },
                
                # Quality Agents
                {
                    'id': 'dead_link_checker',
                    'agent_type': 'quality',
                    'command': 'python health_monitor.py --check-links',
                    'schedule': 'weekly',
                    'status': AgentStatus.IDLE,
                    'max_retries': 1
                },
                {
                    'id': 'health_monitor',
                    'agent_type': 'quality',
                    'command': 'python health_monitor.py',
                    'schedule': 'daily',
                    'status': AgentStatus.IDLE,
                    'max_retries': 1
                },
                
                # Distribution Agents
                {
                    'id': 'obsidian_sync',
                    'agent_type': 'distribution',
                    'command': 'python sync_to_obsidian.py',
                    'schedule': 'daily',
                    'status': AgentStatus.IDLE,
                    'max_retries': 2
                },
                {
                    'id': 'contextkeep_sync',
                    'agent_type': 'distribution',
                    'command': 'python save_quicklinks_to_contextkeep.py',
                    'schedule': 'weekly',
                    'status': AgentStatus.IDLE,
                    'max_retries': 2
                }
            ]
            
            for task_data in default_tasks:
                task = AgentTask(
                    id=task_data['id'],
                    agent_type=task_data['agent_type'],
                    command=task_data['command'],
                    schedule=task_data['schedule'],
                    status=task_data['status'],
                    last_run=None,
                    next_run=self._calculate_next_run(task_data['schedule']),
                    retry_count=0,
                    max_retries=task_data['max_retries'],
                    output_file=None
                )
                self.tasks.append(task)
            
            self._save_config()
            print(f"  ✅ Created {len(self.tasks)} default agents")
    
    def _calculate_next_run(self, schedule: str) -> datetime:
        """Calculate next run time based on schedule"""
        now = datetime.now()
        
        if schedule == 'once':
            return now
        elif schedule == 'hourly':
            return now + timedelta(hours=1)
        elif schedule == 'daily':
            return now + timedelta(days=1)
        elif schedule == 'weekly':
            return now + timedelta(weeks=1)
        else:
            return now + timedelta(hours=1)
    
    def list_agents(self):
        """List all agents and their status"""
        print("\n" + "="*70)
        print("🤖 AGENT STATUS")
        print("="*70)
        
        # Group by type
        by_type = {}
        for task in self.tasks:
            if task.agent_type not in by_type:
                by_type[task.agent_type] = []
            by_type[task.agent_type].append(task)
        
        for agent_type, tasks in by_type.items():
            print(f"\n{agent_type.upper()}:")
            print("-"*70)
            for task in tasks:
                status_icon = {
                    AgentStatus.IDLE: "⏳",
                    AgentStatus.RUNNING: "🔄",
                    AgentStatus.COMPLETED: "✅",
                    AgentStatus.FAILED: "❌",
                    AgentStatus.RETRYING: "🔄"
                }.get(task.status, "❓")
                
                if task.next_run:
                    if isinstance(task.next_run, str):
                        next_run = task.next_run[:16]  # Trim to YYYY-MM-DD HH:MM
                    else:
                        next_run = task.next_run.strftime('%Y-%m-%d %H:%M')
                else:
                    next_run = 'N/A'
                    
                if task.last_run:
                    if isinstance(task.last_run, str):
                        last_run = task.last_run[:16]
                    else:
                        last_run = task.last_run.strftime('%Y-%m-%d %H:%M')
                else:
                    last_run = 'Never'
                
                print(f"  {status_icon} {task.id}")
                print(f"     Schedule: {task.schedule}")
                print(f"     Last: {last_run} | Next: {next_run}")
                print(f"     Retries: {task.retry_count}/{task.max_retries}")
    
    def run_agent(self, agent_id: str):
        """Run a specific agent immediately"""
        task = next((t for t in self.tasks if t.id == agent_id), None)
        
        if not task:
            print(f"❌ Agent not found: {agent_id}")
            return
        
        print(f"\n🚀 Running agent: {agent_id}")
        
        import subprocess
        
        task.status = AgentStatus.RUNNING
        task.last_run = datetime.now()
        
        try:
            result = subprocess.run(
                task.command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=3600  # 1 hour timeout
            )
            
            if result.returncode == 0:
                task.status = AgentStatus.COMPLETED
                task.retry_count = 0
                print(f"  ✅ Completed successfully")
            else:
                raise Exception(f"Exit code {result.returncode}: {result.stderr}")
                
        except Exception as e:
            print(f"  ❌ Failed: {e}")
            task.retry_count += 1
            
            if task.retry_count >= task.max_retries:
                task.status = AgentStatus.FAILED
            else:
                task.status = AgentStatus.RETRYING
        
        # Update next run
        task.next_run = self._calculate_next_run(task.schedule)
        
        # Save config
        self._save_config()
    
    def run_all_pending(self):
        """Run all agents that are due"""
        now = datetime.now()
        
        pending = [
            t for t in self.tasks 
            if t.next_run and t.next_run <= now and t.status != AgentStatus.RUNNING
        ]
        
        if not pending:
            print("\n✅ No pending agents")
            return
        
        print(f"\n🔄 Running {len(pending)} pending agents...")
        
        for task in pending:
            self.run_agent(task.id)
    
    async def start_monitoring(self):
        """Start continuous monitoring loop"""
        print("\n" + "="*70)
        print("🤖 STARTING AGENT ORCHESTRATOR")
        print("="*70)
        print("\nMonitoring agents... Press Ctrl+C to stop\n")
        
        self.running = True
        
        try:
            while self.running:
                # Check for pending tasks
                self.run_all_pending()
                
                # Wait before next check
                await asyncio.sleep(60)  # Check every minute
                
        except KeyboardInterrupt:
            print("\n\n🛑 Stopping orchestrator...")
            self.running = False
    
    def generate_report(self):
        """Generate agent activity report"""
        report = f"""# 🤖 Agent Orchestrator Report

**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Summary

| Metric | Value |
|--------|-------|
| Total Agents | {len(self.tasks)} |
| Active | {sum(1 for t in self.tasks if t.status == AgentStatus.RUNNING)} |
| Completed (24h) | {sum(1 for t in self.tasks if t.last_run and t.last_run > datetime.now() - timedelta(hours=24))} |
| Failed | {sum(1 for t in self.tasks if t.status == AgentStatus.FAILED)} |

## Agent Details

"""
        
        for task in self.tasks:
            report += f"### {task.id}\n"
            report += f"- Type: {task.agent_type}\n"
            report += f"- Status: {task.status.value}\n"
            report += f"- Schedule: {task.schedule}\n"
            report += f"- Last Run: {task.last_run or 'Never'}\n"
            report += f"- Next Run: {task.next_run or 'N/A'}\n"
            report += f"- Retries: {task.retry_count}/{task.max_retries}\n\n"
        
        return report


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Data Empire Agent Orchestrator')
    parser.add_argument('--list', '-l', action='store_true', help='List all agents')
    parser.add_argument('--run', '-r', help='Run specific agent')
    parser.add_argument('--monitor', '-m', action='store_true', help='Start monitoring')
    parser.add_argument('--report', action='store_true', help='Generate report')
    
    args = parser.parse_args()
    
    orchestrator = AgentOrchestrator()
    
    if args.list:
        orchestrator.list_agents()
    elif args.run:
        orchestrator.run_agent(args.run)
    elif args.monitor:
        asyncio.run(orchestrator.start_monitoring())
    elif args.report:
        report = orchestrator.generate_report()
        print(report)
        
        # Save report
        report_file = f"agent_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
        with open(report_file, 'w') as f:
            f.write(report)
        print(f"\n💾 Report saved: {report_file}")
    else:
        print("Use --list to see agents, --run <agent_id> to run one, or --monitor to start continuous monitoring")


if __name__ == "__main__":
    main()
