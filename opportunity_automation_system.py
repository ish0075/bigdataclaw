#!/usr/bin/env python3
"""
Opportunity Automation System - 24/7 Lead Generation
Automatically finds, matches, and alerts on new opportunities
"""

import asyncio
import json
import logging
import re
import smtplib
import time
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from urllib.parse import quote_plus

import aiohttp
from bs4 import BeautifulSoup

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/opportunity_automation.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('opportunity_automation')

class OpportunityScraper:
    """Scrapes Google for expired LoopNet listings"""
    
    ASSET_TYPES = {
        'multifamily': 'MULTIFAMILY',
        'shopping_mall': 'SHOPPING CENTER',
        'retail_plaza': 'RETAIL',
        'land': 'LAND',
        'industrial': 'INDUSTRIAL',
        'office': 'OFFICE',
        'medical': 'MEDICAL'
    }
    
    def __init__(self):
        self.session = None
        self.results = []
        
    async def init_session(self):
        """Initialize aiohttp session"""
        if not self.session:
            self.session = aiohttp.ClientSession(
                headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            )
    
    async def search_google(self, asset_type: str, province: str = 'Ontario', 
                           max_results: int = 50) -> List[Dict]:
        """Search Google for expired listings"""
        await self.init_session()
        
        search_term = self.ASSET_TYPES.get(asset_type, asset_type.upper())
        query = f'"THIS {search_term} PROPERTY IS NO LONGER ADVERTISED ON LOOPNET.CA" {province}'
        
        logger.info(f"Searching: {asset_type} in {province}")
        
        opportunities = []
        
        try:
            # Note: In production, you'd use a proper search API or scraping service
            # This is a simulation structure
            url = f"https://www.google.com/search?q={quote_plus(query)}"
            
            # Simulate delay to be respectful
            await asyncio.sleep(2)
            
            # In real implementation, parse Google results here
            # For now, return structured opportunity format
            
        except Exception as e:
            logger.error(f"Search error: {e}")
        
        return opportunities
    
    async def scrape_loopnet_page(self, url: str) -> Optional[Dict]:
        """Scrape a LoopNet property page"""
        try:
            async with self.session.get(url) as response:
                if response.status != 200:
                    return None
                
                html = await response.text()
                soup = BeautifulSoup(html, 'html.parser')
                
                # Extract property details
                property_data = {
                    'url': url,
                    'scraped_at': datetime.now().isoformat(),
                    'address': self._extract_address(soup),
                    'price': self._extract_price(soup),
                    'property_type': self._extract_property_type(soup),
                    'size': self._extract_size(soup),
                    'broker': self._extract_broker(soup),
                    'broker_phone': self._extract_broker_phone(soup),
                    'broker_email': self._extract_broker_email(soup),
                    'images': self._extract_images(soup),
                    'description': self._extract_description(soup)
                }
                
                return property_data
                
        except Exception as e:
            logger.error(f"Scraping error: {e}")
            return None
    
    def _extract_address(self, soup) -> str:
        """Extract property address"""
        # Try multiple selectors
        selectors = [
            '[data-testid="property-address"]',
            '.property-address',
            'h1.property-title',
            '.address-line'
        ]
        for selector in selectors:
            elem = soup.select_one(selector)
            if elem:
                return elem.get_text(strip=True)
        return 'Unknown Address'
    
    def _extract_price(self, soup) -> str:
        """Extract listing price"""
        selectors = [
            '[data-testid="property-price"]',
            '.property-price',
            '.price'
        ]
        for selector in selectors:
            elem = soup.select_one(selector)
            if elem:
                return elem.get_text(strip=True)
        return 'Price not listed'
    
    def _extract_property_type(self, soup) -> str:
        """Extract property type"""
        elem = soup.select_one('[data-testid="property-type"]')
        if elem:
            return elem.get_text(strip=True)
        return 'Unknown Type'
    
    def _extract_size(self, soup) -> str:
        """Extract property size"""
        selectors = [
            '[data-testid="building-size"]',
            '.building-size',
            '.sqft'
        ]
        for selector in selectors:
            elem = soup.select_one(selector)
            if elem:
                return elem.get_text(strip=True)
        return 'Size not listed'
    
    def _extract_broker(self, soup) -> str:
        """Extract broker name"""
        selectors = [
            '[data-testid="broker-name"]',
            '.broker-name',
            '.contact-name'
        ]
        for selector in selectors:
            elem = soup.select_one(selector)
            if elem:
                return elem.get_text(strip=True)
        return None
    
    def _extract_broker_phone(self, soup) -> str:
        """Extract broker phone"""
        phone_elem = soup.select_one('[data-testid="broker-phone"], .phone')
        if phone_elem:
            return phone_elem.get_text(strip=True)
        return None
    
    def _extract_broker_email(self, soup) -> str:
        """Extract broker email"""
        email_elem = soup.select_one('a[href^="mailto:"]')
        if email_elem:
            href = email_elem.get('href', '')
            return href.replace('mailto:', '')
        return None
    
    def _extract_images(self, soup) -> List[str]:
        """Extract property images"""
        images = []
        for img in soup.select('img.property-image, .gallery img'):
            src = img.get('src') or img.get('data-src')
            if src:
                images.append(src)
        return images[:5]  # Limit to 5 images
    
    def _extract_description(self, soup) -> str:
        """Extract property description"""
        elem = soup.select_one('[data-testid="property-description"], .description')
        if elem:
            return elem.get_text(strip=True)[:500]  # Limit length
        return ''


class DatabaseMatcher:
    """Matches opportunities against database"""
    
    def __init__(self):
        self.recruiters = []
        self.properties = []
        self.load_data()
    
    def load_data(self):
        """Load database data"""
        try:
            # Load recruiters
            with open('recruiter_db_with_quicklinks.json', 'r') as f:
                data = json.load(f)
                self.recruiters = data.get('recruiters', [])
            
            # Load properties if available
            prop_file = Path('properties_db.json')
            if prop_file.exists():
                with open(prop_file, 'r') as f:
                    self.properties = json.load(f)
            
            logger.info(f"Loaded {len(self.recruiters)} recruiters for matching")
            
        except Exception as e:
            logger.error(f"Failed to load database: {e}")
    
    def match_property(self, opportunity: Dict) -> Dict:
        """Match opportunity against database"""
        result = {
            'in_database': False,
            'matches': [],
            'suggested_brokers': [],
            'similar_properties': []
        }
        
        address = opportunity.get('address', '')
        
        # Check if address exists in database
        for prop in self.properties:
            if self._address_similar(address, prop.get('address', '')):
                result['in_database'] = True
                result['matches'].append(prop)
        
        # Find brokers in same area
        city = self._extract_city(address)
        if city:
            result['suggested_brokers'] = [
                r for r in self.recruiters 
                if city.lower() in (r.get('city', '') or '').lower()
            ][:5]  # Top 5
        
        return result
    
    def _address_similar(self, addr1: str, addr2: str) -> bool:
        """Check if two addresses are similar"""
        if not addr1 or not addr2:
            return False
        
        # Normalize addresses
        def normalize(addr):
            addr = addr.lower()
            addr = re.sub(r'\s+', ' ', addr)
            addr = re.sub(r'(street|st|avenue|ave|road|rd|drive|dr)', '', addr)
            return addr.strip()
        
        norm1 = normalize(addr1)
        norm2 = normalize(addr2)
        
        # Check similarity
        return norm1 in norm2 or norm2 in norm1 or self._levenshtein(norm1, norm2) < 5
    
    def _extract_city(self, address: str) -> Optional[str]:
        """Extract city from address"""
        # Simple extraction - look for common Ontario cities
        cities = ['Toronto', 'Mississauga', 'Brampton', 'Hamilton', 'Ottawa', 
                  'London', 'Kitchener', 'Vaughan', 'Markham', 'Oakville',
                  'Burlington', 'St. Catharines', 'Niagara', 'Welland']
        
        for city in cities:
            if city.lower() in address.lower():
                return city
        return None
    
    def _levenshtein(self, s1: str, s2: str) -> int:
        """Calculate Levenshtein distance"""
        if len(s1) < len(s2):
            return self._levenshtein(s2, s1)
        if len(s2) == 0:
            return len(s1)
        
        previous_row = range(len(s2) + 1)
        for i, c1 in enumerate(s1):
            current_row = [i + 1]
            for j, c2 in enumerate(s2):
                insertions = previous_row[j + 1] + 1
                deletions = current_row[j] + 1
                substitutions = previous_row[j] + (c1 != c2)
                current_row.append(min(insertions, deletions, substitutions))
            previous_row = current_row
        
        return previous_row[-1]


class EmailAlertSystem:
    """Sends email alerts for new opportunities"""
    
    def __init__(self, smtp_server: str = None, smtp_port: int = 587,
                 username: str = None, password: str = None,
                 from_email: str = None, to_emails: List[str] = None):
        self.smtp_server = smtp_server or 'smtp.gmail.com'
        self.smtp_port = smtp_port
        self.username = username
        self.password = password
        self.from_email = from_email
        self.to_emails = to_emails or []
    
    def send_opportunity_alert(self, opportunity: Dict, matches: Dict) -> bool:
        """Send email alert for new opportunity"""
        if not self.username or not self.password:
            logger.warning("Email credentials not configured")
            return False
        
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = f"🎯 New Opportunity: {opportunity.get('address', 'Unknown')}"
            msg['From'] = self.from_email
            msg['To'] = ', '.join(self.to_emails)
            
            # HTML content
            html = self._generate_email_html(opportunity, matches)
            msg.attach(MIMEText(html, 'html'))
            
            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.username, self.password)
                server.sendmail(self.from_email, self.to_emails, msg.as_string())
            
            logger.info(f"Alert sent for {opportunity.get('address')}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return False
    
    def _generate_email_html(self, opportunity: Dict, matches: Dict) -> str:
        """Generate HTML email content"""
        in_db = matches['in_database']
        status_color = '#22c55e' if in_db else '#f59e0b'
        status_text = 'IN DATABASE ✓' if in_db else 'NOT IN DATABASE - OPPORTUNITY!'
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }}
                .status {{ background: {'#d1fae5' if in_db else '#fef3c7'}; 
                          color: {'#065f46' if in_db else '#92400e'};
                          padding: 15px; border-radius: 8px; margin: 20px 0; 
                          border-left: 4px solid {status_color}; }}
                .details {{ background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }}
                .detail-row {{ display: flex; justify-content: space-between; padding: 10px 0; 
                              border-bottom: 1px solid #e5e7eb; }}
                .detail-row:last-child {{ border-bottom: none; }}
                .button {{ background: #3b82f6; color: white; padding: 12px 24px; 
                          text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }}
                .brokers {{ margin-top: 20px; }}
                .broker {{ background: #f9fafb; padding: 10px; margin: 5px 0; 
                          border-radius: 6px; border-left: 3px solid #3b82f6; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🏢 New Opportunity Alert</h1>
                    <p>Found {opportunity.get('scraped_at', datetime.now().isoformat())}</p>
                </div>
                
                <div class="status">
                    <strong>{status_text}</strong>
                </div>
                
                <div class="details">
                    <h2>Property Details</h2>
                    <div class="detail-row">
                        <span>Address:</span>
                        <strong>{opportunity.get('address', 'Unknown')}</strong>
                    </div>
                    <div class="detail-row">
                        <span>Price:</span>
                        <strong>{opportunity.get('price', 'Not listed')}</strong>
                    </div>
                    <div class="detail-row">
                        <span>Type:</span>
                        <strong>{opportunity.get('property_type', 'Unknown')}</strong>
                    </div>
                    <div class="detail-row">
                        <span>Size:</span>
                        <strong>{opportunity.get('size', 'Not listed')}</strong>
                    </div>
                    <div class="detail-row">
                        <span>Source:</span>
                        <strong>LoopNet</strong>
                    </div>
                </div>
                
                <a href="{opportunity.get('url', '#')}" class="button">View on LoopNet</a>
                <a href="obsidian://" class="button" style="background: #7c3aed;">Save to Obsidian</a>
                
                {'<div class="brokers"><h3>Suggested Brokers in Area:</h3>' if matches['suggested_brokers'] else ''}
        """
        
        for broker in matches.get('suggested_brokers', [])[:3]:
            html += f"""
                <div class="broker">
                    <strong>{broker.get('name')}</strong><br>
                    {broker.get('brokerage', 'N/A')}<br>
                    {broker.get('email', 'No email')}
                </div>
            """
        
        html += """
                </div>
            </div>
        </body>
        </html>
        """
        
        return html


class OpportunityAutomationSystem:
    """Main automation system that orchestrates everything"""
    
    def __init__(self):
        self.scraper = OpportunityScraper()
        self.matcher = DatabaseMatcher()
        self.alerter = EmailAlertSystem()
        self.opportunities_file = Path('logs/opportunities.json')
        self.running = False
        
        # Load existing opportunities
        self.opportunities = self.load_opportunities()
    
    def load_opportunities(self) -> List[Dict]:
        """Load existing opportunities"""
        if self.opportunities_file.exists():
            with open(self.opportunities_file, 'r') as f:
                return json.load(f)
        return []
    
    def save_opportunities(self):
        """Save opportunities to file"""
        self.opportunities_file.parent.mkdir(parents=True, exist_ok=True)
        with open(self.opportunities_file, 'w') as f:
            json.dump(self.opportunities, f, indent=2)
    
    async def run_scrape_cycle(self):
        """Run one complete scrape cycle"""
        logger.info("Starting scrape cycle...")
        
        new_opportunities = []
        
        # Scrape each asset type
        for asset_type in self.scraper.ASSET_TYPES.keys():
            logger.info(f"Scraping {asset_type}...")
            
            results = await self.scraper.search_google(asset_type)
            
            for result in results:
                # Check if already in our list
                if not any(o.get('url') == result.get('url') for o in self.opportunities):
                    # Match against database
                    matches = self.matcher.match_property(result)
                    result['matches'] = matches
                    result['found_at'] = datetime.now().isoformat()
                    
                    # Add to list
                    self.opportunities.append(result)
                    new_opportunities.append(result)
                    
                    # Send alert
                    if matches['in_database'] or len(matches['suggested_brokers']) > 0:
                        self.alerter.send_opportunity_alert(result, matches)
                    
                    logger.info(f"New opportunity: {result.get('address')}")
            
            # Be nice to servers
            await asyncio.sleep(5)
        
        # Save updated list
        self.save_opportunities()
        
        logger.info(f"Cycle complete. Found {len(new_opportunities)} new opportunities.")
        return new_opportunities
    
    async def run(self, interval_hours: int = 24):
        """Run automation loop"""
        logger.info("🚀 Starting Opportunity Automation System...")
        self.running = True
        
        while self.running:
            try:
                await self.run_scrape_cycle()
                
                # Sleep until next cycle
                sleep_seconds = interval_hours * 3600
                logger.info(f"Sleeping for {interval_hours} hours...")
                await asyncio.sleep(sleep_seconds)
                
            except Exception as e:
                logger.error(f"Automation error: {e}")
                await asyncio.sleep(300)  # 5 min retry
        
        logger.info("Automation system stopped")
    
    def stop(self):
        """Stop the system"""
        self.running = False
    
    def generate_report(self) -> Dict:
        """Generate daily report"""
        today = datetime.now().date()
        
        todays_opps = [
            o for o in self.opportunities 
            if datetime.fromisoformat(o['found_at']).date() == today
        ]
        
        in_database = sum(1 for o in todays_opps if o.get('matches', {}).get('in_database'))
        not_in_database = len(todays_opps) - in_database
        
        return {
            'date': today.isoformat(),
            'total_opportunities': len(self.opportunities),
            'new_today': len(todays_opps),
            'in_database': in_database,
            'not_in_database': not_in_database,
            'by_asset_type': {}
        }


def main():
    """Main entry point"""
    import argparse
    parser = argparse.ArgumentParser(description='Opportunity Automation System')
    parser.add_argument('--daemon', action='store_true', help='Run as daemon')
    parser.add_argument('--once', action='store_true', help='Run once')
    parser.add_argument('--report', action='store_true', help='Generate report')
    
    args = parser.parse_args()
    
    system = OpportunityAutomationSystem()
    
    if args.report:
        report = system.generate_report()
        print(json.dumps(report, indent=2))
        return
    
    if args.once:
        asyncio.run(system.run_scrape_cycle())
    elif args.daemon:
        asyncio.run(system.run())
    else:
        print("Usage:")
        print("  python3 opportunity_automation_system.py --once")
        print("  python3 opportunity_automation_system.py --daemon")
        print("  python3 opportunity_automation_system.py --report")


if __name__ == '__main__':
    main()
