#!/usr/bin/env python3
"""
BigDataClaw NERVE - 24/7 Monitoring Dashboard
Tracks all services, agents, and system health
"""

import asyncio
import json
import logging
import subprocess
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
import aiohttp
import psutil

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/monitoring.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('monitoring')

class ServiceMonitor:
    """Monitor system services"""
    
    SERVICES = {
        'nerve_frontend': {'url': 'http://localhost:3001', 'type': 'http'},
        'nerve_backend': {'url': 'http://localhost:3090', 'type': 'http'},
        'qdrant': {'url': 'http://localhost:6333/healthz', 'type': 'http'},
        'open_webui': {'url': 'http://localhost:8080', 'type': 'http'},
    }
    
    def __init__(self):
        self.status = {}
        self.history = []
        self.max_history = 1000
        
    async def check_service(self, name: str, config: dict) -> dict:
        """Check if a service is healthy"""
        start_time = time.time()
        try:
            if config['type'] == 'http':
                async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=5)) as session:
                    async with session.get(config['url']) as resp:
                        response_time = (time.time() - start_time) * 1000
                        return {
                            'name': name,
                            'status': 'healthy' if resp.status < 500 else 'error',
                            'status_code': resp.status,
                            'response_time_ms': round(response_time, 2),
                            'last_check': datetime.now().isoformat()
                        }
        except Exception as e:
            return {
                'name': name,
                'status': 'down',
                'error': str(e),
                'last_check': datetime.now().isoformat()
            }
    
    async def check_all(self) -> dict:
        """Check all services"""
        tasks = [self.check_service(name, config) for name, config in self.SERVICES.items()]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        self.status = {}
        for result in results:
            if isinstance(result, Exception):
                logger.error(f"Check failed: {result}")
                continue
            self.status[result['name']] = result
            
        # Add to history
        self.history.append({
            'timestamp': datetime.now().isoformat(),
            'services': self.status.copy()
        })
        if len(self.history) > self.max_history:
            self.history.pop(0)
            
        return self.status

class AgentMonitor:
    """Monitor scraper agents"""
    
    AGENTS = [
        'Transaction Scout',
        'Hot Money Tracker', 
        'Portfolio Analyzer',
        'Agent Finder',
        'Lender Matcher',
        'Obsidian Sync'
    ]
    
    def __init__(self):
        self.agent_status = {}
        
    def check_agents(self) -> dict:
        """Check agent processes"""
        # Look for Python processes that might be agents
        agent_processes = []
        for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
            try:
                if 'python' in proc.info['name'].lower():
                    cmdline = ' '.join(proc.info['cmdline'] or [])
                    if any(agent.lower().replace(' ', '') in cmdline.lower() for agent in self.AGENTS):
                        agent_processes.append({
                            'pid': proc.info['pid'],
                            'name': proc.info['name'],
                            'cmdline': cmdline[:100]
                        })
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
                
        return {
            'running_agents': len(agent_processes),
            'agents': agent_processes,
            'expected_agents': len(self.AGENTS)
        }

class SystemMonitor:
    """Monitor system resources"""
    
    def check_system(self) -> dict:
        """Check CPU, memory, disk"""
        return {
            'cpu_percent': psutil.cpu_percent(interval=1),
            'memory': {
                'total_gb': round(psutil.virtual_memory().total / (1024**3), 2),
                'used_gb': round(psutil.virtual_memory().used / (1024**3), 2),
                'percent': psutil.virtual_memory().percent
            },
            'disk': {
                'total_gb': round(psutil.disk_usage('/').total / (1024**3), 2),
                'used_gb': round(psutil.disk_usage('/').used / (1024**3), 2),
                'percent': psutil.disk_usage('/').percent
            },
            'timestamp': datetime.now().isoformat()
        }

class QdrantMonitor:
    """Monitor Qdrant vector database"""
    
    async def get_collections(self) -> dict:
        """Get Qdrant collections info"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get('http://localhost:6333/collections') as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return {
                            'status': 'connected',
                            'collections': data.get('result', {}).get('collections', []),
                            'collection_count': len(data.get('result', {}).get('collections', []))
                        }
                    return {'status': 'error', 'error': f'HTTP {resp.status}'}
        except Exception as e:
            return {'status': 'error', 'error': str(e)}
    
    async def get_cluster_info(self) -> dict:
        """Get Qdrant cluster info"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get('http://localhost:6333/cluster') as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return {'status': 'connected', 'info': data.get('result', {})}
                    return {'status': 'error', 'error': f'HTTP {resp.status}'}
        except Exception as e:
            return {'status': 'error', 'error': str(e)}

class MonitoringDashboard:
    """Main monitoring dashboard"""
    
    def __init__(self):
        self.service_monitor = ServiceMonitor()
        self.agent_monitor = AgentMonitor()
        self.system_monitor = SystemMonitor()
        self.qdrant_monitor = QdrantMonitor()
        self.running = False
        
    async def generate_report(self) -> dict:
        """Generate full monitoring report"""
        services = await self.service_monitor.check_all()
        agents = self.agent_monitor.check_agents()
        system = self.system_monitor.check_system()
        qdrant_collections = await self.qdrant_monitor.get_collections()
        
        report = {
            'timestamp': datetime.now().isoformat(),
            'services': services,
            'agents': agents,
            'system': system,
            'qdrant': qdrant_collections,
            'summary': {
                'healthy_services': sum(1 for s in services.values() if s.get('status') == 'healthy'),
                'total_services': len(services),
                'running_agents': agents['running_agents'],
                'system_health': 'good' if system['memory']['percent'] < 80 and system['disk']['percent'] < 80 else 'warning'
            }
        }
        
        return report
    
    def save_report(self, report: dict):
        """Save report to file"""
        reports_dir = Path('logs/monitoring_reports')
        reports_dir.mkdir(parents=True, exist_ok=True)
        
        # Save latest
        latest_file = reports_dir / 'latest.json'
        with open(latest_file, 'w') as f:
            json.dump(report, f, indent=2)
        
        # Save dated
        date_str = datetime.now().strftime('%Y%m%d_%H%M%S')
        dated_file = reports_dir / f'report_{date_str}.json'
        with open(dated_file, 'w') as f:
            json.dump(report, f, indent=2)
    
    def print_report(self, report: dict):
        """Print report to console"""
        print("\n" + "="*60)
        print(f"🖥️  NERVE MONITORING DASHBOARD - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*60)
        
        # Services
        print("\n📡 SERVICES:")
        for name, status in report['services'].items():
            icon = "✅" if status.get('status') == 'healthy' else "❌"
            print(f"  {icon} {name}: {status.get('status', 'unknown')}")
            if 'response_time_ms' in status:
                print(f"     └─ Response time: {status['response_time_ms']}ms")
        
        # Agents
        print("\n🤖 AGENTS:")
        agents = report['agents']
        print(f"  Running: {agents['running_agents']}/{agents['expected_agents']}")
        for agent in agents['agents']:
            print(f"  • PID {agent['pid']}: {agent['cmdline'][:50]}...")
        
        # System
        print("\n💻 SYSTEM:")
        sys = report['system']
        mem_icon = "🟢" if sys['memory']['percent'] < 70 else "🟡" if sys['memory']['percent'] < 85 else "🔴"
        disk_icon = "🟢" if sys['disk']['percent'] < 70 else "🟡" if sys['disk']['percent'] < 85 else "🔴"
        print(f"  CPU: {sys['cpu_percent']}%")
        print(f"  {mem_icon} Memory: {sys['memory']['used_gb']}/{sys['memory']['total_gb']} GB ({sys['memory']['percent']}%)")
        print(f"  {disk_icon} Disk: {sys['disk']['used_gb']}/{sys['disk']['total_gb']} GB ({sys['disk']['percent']}%)")
        
        # Qdrant
        print("\n🧠 QDRANT:")
        qdrant = report['qdrant']
        print(f"  Status: {qdrant.get('status', 'unknown')}")
        print(f"  Collections: {qdrant.get('collection_count', 0)}")
        
        # Summary
        print("\n📊 SUMMARY:")
        summary = report['summary']
        print(f"  Services: {summary['healthy_services']}/{summary['total_services']} healthy")
        print(f"  System Health: {summary['system_health'].upper()}")
        
        print("\n" + "="*60 + "\n")
    
    async def run(self, interval: int = 60):
        """Run monitoring loop"""
        self.running = True
        logger.info("Starting monitoring dashboard...")
        
        while self.running:
            try:
                report = await self.generate_report()
                self.save_report(report)
                self.print_report(report)
                
                # Check for alerts
                if report['summary']['system_health'] == 'warning':
                    logger.warning("System health warning!")
                
                await asyncio.sleep(interval)
            except Exception as e:
                logger.error(f"Monitoring error: {e}")
                await asyncio.sleep(10)
    
    def stop(self):
        """Stop monitoring"""
        self.running = False
        logger.info("Monitoring dashboard stopped")

# HTML Dashboard Generator
def generate_html_dashboard(report: dict) -> str:
    """Generate HTML dashboard"""
    html = f"""<!DOCTYPE html>
<html>
<head>
    <title>NERVE Monitoring Dashboard</title>
    <meta http-equiv="refresh" content="30">
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f0f0f; color: #fff; margin: 0; padding: 20px; }}
        .header {{ text-align: center; margin-bottom: 30px; }}
        .header h1 {{ margin: 0; color: #3b82f6; }}
        .grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }}
        .card {{ background: #1a1a1a; border-radius: 12px; padding: 20px; border: 1px solid #333; }}
        .card h2 {{ margin-top: 0; color: #60a5fa; font-size: 18px; }}
        .status {{ display: flex; align-items: center; gap: 10px; margin: 10px 0; }}
        .status-dot {{ width: 10px; height: 10px; border-radius: 50%; }}
        .status-healthy {{ background: #22c55e; }}
        .status-error {{ background: #ef4444; }}
        .status-warning {{ background: #f59e0b; }}
        .metric {{ display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #333; }}
        .metric:last-child {{ border-bottom: none; }}
        .timestamp {{ text-align: center; color: #666; margin-top: 20px; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>🦞 NERVE Monitoring Dashboard</h1>
        <p>Real-time system health monitoring</p>
    </div>
    <div class="grid">
        <div class="card">
            <h2>📡 Services</h2>
"""
    for name, status in report['services'].items():
        status_class = 'status-healthy' if status.get('status') == 'healthy' else 'status-error'
        html += f'<div class="status"><div class="status-dot {status_class}"></div>{name}</div>'
    
    html += """
        </div>
        <div class="card">
            <h2>💻 System Resources</h2>
"""
    sys = report['system']
    html += f'<div class="metric"><span>CPU</span><span>{sys["cpu_percent"]}%</span></div>'
    html += f'<div class="metric"><span>Memory</span><span>{sys["memory"]["percent"]}%</span></div>'
    html += f'<div class="metric"><span>Disk</span><span>{sys["disk"]["percent"]}%</span></div>'
    
    html += f"""
        </div>
        <div class="card">
            <h2>🧠 Qdrant</h2>
            <div class="metric"><span>Status</span><span>{report['qdrant'].get('status', 'unknown')}</span></div>
            <div class="metric"><span>Collections</span><span>{report['qdrant'].get('collection_count', 0)}</span></div>
        </div>
        <div class="card">
            <h2>🤖 Agents</h2>
            <div class="metric"><span>Running</span><span>{report['agents']['running_agents']}</span></div>
            <div class="metric"><span>Expected</span><span>{report['agents']['expected_agents']}</span></div>
        </div>
    </div>
    <div class="timestamp">Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</div>
</body>
</html>"""
    return html

async def main():
    """Main entry point"""
    dashboard = MonitoringDashboard()
    
    # Generate initial report
    report = await dashboard.generate_report()
    dashboard.save_report(report)
    dashboard.print_report(report)
    
    # Save HTML dashboard
    html = generate_html_dashboard(report)
    with open('monitoring_dashboard.html', 'w') as f:
        f.write(html)
    print("📄 HTML dashboard saved to monitoring_dashboard.html")
    
    # Run continuous monitoring
    await dashboard.run(interval=60)

if __name__ == '__main__':
    asyncio.run(main())
