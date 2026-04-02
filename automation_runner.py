#!/usr/bin/env python3
"""
Automation Runner - Daily Opportunity Scanner
Runs every day at 6 AM to find new opportunities
"""

import asyncio
import json
import logging
import schedule
import time
from datetime import datetime
from pathlib import Path

from opportunity_automation_system import OpportunityAutomationSystem

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/automation_runner.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('automation_runner')

class DailyAutomationRunner:
    """Runs automation tasks on schedule"""
    
    def __init__(self):
        self.system = OpportunityAutomationSystem()
        self.running = False
        self.config_file = Path('automation_config.json')
        self.load_config()
    
    def load_config(self):
        """Load automation configuration"""
        if self.config_file.exists():
            with open(self.config_file, 'r') as f:
                self.config = json.load(f)
        else:
            self.config = {
                'enabled': True,
                'run_time': '06:00',
                'email_alerts': True,
                'search_provinces': ['ON', 'BC', 'AB'],
                'asset_types': ['multifamily', 'industrial', 'office', 'retail_plaza'],
                'last_run': None,
                'total_opportunities_found': 0
            }
            self.save_config()
    
    def save_config(self):
        """Save automation configuration"""
        with open(self.config_file, 'w') as f:
            json.dump(self.config, f, indent=2)
    
    async def run_daily_scan(self):
        """Run the daily opportunity scan"""
        if not self.config['enabled']:
            logger.info("Automation is disabled. Skipping scan.")
            return
        
        logger.info("=" * 60)
        logger.info("🚀 STARTING DAILY OPPORTUNITY SCAN")
        logger.info("=" * 60)
        logger.info(f"Time: {datetime.now().isoformat()}")
        logger.info(f"Provinces: {', '.join(self.config['search_provinces'])}")
        logger.info(f"Asset Types: {', '.join(self.config['asset_types'])}")
        
        try:
            # Run the scan
            new_opportunities = await self.system.run_scrape_cycle()
            
            # Update stats
            self.config['last_run'] = datetime.now().isoformat()
            self.config['total_opportunities_found'] += len(new_opportunities)
            self.save_config()
            
            logger.info("=" * 60)
            logger.info(f"✅ SCAN COMPLETE: {len(new_opportunities)} new opportunities")
            logger.info("=" * 60)
            
            # Generate and save report
            report = self.system.generate_report()
            self.save_report(report)
            
        except Exception as e:
            logger.error(f"❌ SCAN FAILED: {e}")
    
    def save_report(self, report: dict):
        """Save daily report"""
        reports_dir = Path('logs/daily_reports')
        reports_dir.mkdir(parents=True, exist_ok=True)
        
        date_str = datetime.now().strftime('%Y-%m-%d')
        report_file = reports_dir / f'report_{date_str}.json'
        
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)
        
        logger.info(f"Report saved: {report_file}")
    
    def schedule_jobs(self):
        """Schedule daily jobs"""
        run_time = self.config.get('run_time', '06:00')
        
        # Schedule daily run
        schedule.every().day.at(run_time).do(
            lambda: asyncio.run(self.run_daily_scan())
        )
        
        logger.info(f"Scheduled daily scan at {run_time}")
        
        # Also schedule an evening check at 6 PM
        schedule.every().day.at("18:00").do(
            lambda: asyncio.run(self.run_daily_scan())
        )
        
        logger.info("Scheduled evening check at 18:00")
    
    def run(self):
        """Run the scheduler loop"""
        logger.info("🤖 Automation Runner Started")
        logger.info("Press Ctrl+C to stop")
        
        self.running = True
        self.schedule_jobs()
        
        # Run initial scan on startup
        logger.info("Running initial scan...")
        asyncio.run(self.run_daily_scan())
        
        while self.running:
            try:
                schedule.run_pending()
                time.sleep(60)  # Check every minute
            except KeyboardInterrupt:
                logger.info("\n🛑 Stopping automation runner...")
                self.running = False
            except Exception as e:
                logger.error(f"Error in scheduler: {e}")
                time.sleep(300)  # Wait 5 minutes on error


def create_systemd_service():
    """Create systemd service file"""
    service_content = """[Unit]
Description=BigDataClaw Opportunity Automation
After=network.target

[Service]
Type=simple
User=jamie
WorkingDirectory=/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw
ExecStart=/usr/bin/python3 automation_runner.py
Restart=always
RestartSec=10
Environment=PYTHONPATH=/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw

[Install]
WantedBy=multi-user.target
"""
    with open('opportunity-automation.service', 'w') as f:
        f.write(service_content)
    
    print("Created: opportunity-automation.service")
    print("Install with: sudo cp opportunity-automation.service /etc/systemd/system/")
    print("Enable: sudo systemctl enable opportunity-automation && sudo systemctl start opportunity-automation")


def setup_email_config():
    """Interactive email configuration"""
    print("\n📧 Email Alert Configuration")
    print("=" * 50)
    
    config = {}
    config['smtp_server'] = input("SMTP Server (default: smtp.gmail.com): ").strip() or "smtp.gmail.com"
    config['smtp_port'] = int(input("SMTP Port (default: 587): ").strip() or "587")
    config['username'] = input("Email username: ").strip()
    config['password'] = input("Email password/App password: ").strip()
    config['from_email'] = input("From email: ").strip()
    
    to_emails = input("Alert recipients (comma-separated): ").strip()
    config['to_emails'] = [e.strip() for e in to_emails.split(',') if e.strip()]
    
    # Save config
    with open('email_config.json', 'w') as f:
        json.dump(config, f, indent=2)
    
    print("\n✅ Email configuration saved to email_config.json")
    print("Test with: python3 automation_runner.py --test-email")


def main():
    """Main entry point"""
    import argparse
    parser = argparse.ArgumentParser(description='Automation Runner')
    parser.add_argument('--daemon', action='store_true', help='Run as daemon')
    parser.add_argument('--run-now', action='store_true', help='Run scan now')
    parser.add_argument('--setup-email', action='store_true', help='Setup email alerts')
    parser.add_argument('--create-service', action='store_true', help='Create systemd service')
    parser.add_argument('--status', action='store_true', help='Show status')
    
    args = parser.parse_args()
    
    if args.setup_email:
        setup_email_config()
        return
    
    if args.create_service:
        create_systemd_service()
        return
    
    if args.status:
        config_file = Path('automation_config.json')
        if config_file.exists():
            with open(config_file, 'r') as f:
                config = json.load(f)
            
            print("\n📊 Automation Status")
            print("=" * 50)
            print(f"Enabled: {config['enabled']}")
            print(f"Run Time: {config['run_time']}")
            print(f"Last Run: {config['last_run'] or 'Never'}")
            print(f"Total Opportunities Found: {config['total_opportunities_found']}")
            print(f"Search Provinces: {', '.join(config['search_provinces'])}")
            print(f"Asset Types: {', '.join(config['asset_types'])}")
        else:
            print("No configuration found. Run with --daemon to initialize.")
        return
    
    if args.run_now:
        runner = DailyAutomationRunner()
        asyncio.run(runner.run_daily_scan())
    elif args.daemon:
        runner = DailyAutomationRunner()
        runner.run()
    else:
        print("\nUsage:")
        print("  python3 automation_runner.py --daemon          # Run as daemon")
        print("  python3 automation_runner.py --run-now         # Run scan now")
        print("  python3 automation_runner.py --setup-email     # Configure email")
        print("  python3 automation_runner.py --create-service  # Create systemd service")
        print("  python3 automation_runner.py --status          # Show status")


if __name__ == '__main__':
    main()
