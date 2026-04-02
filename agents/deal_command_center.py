#!/usr/bin/env python3
"""
Deal Command Center v1.0
Jamie's 40-Listing Dashboard & Organization System
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import json


class ListingStatus(Enum):
    ACTIVE = "active"
    CONDITIONAL = "conditional"
    PENDING = "pending"
    SOLD = "sold"
    EXPIRED = "expired"


class UrgencyLevel(Enum):
    CRITICAL = "🔥"      # Today
    HIGH = "⚡"          # This week
    MEDIUM = "📋"        # This month
    LOW = "💤"           # On track


@dataclass
class Listing:
    """Jamie's listing record"""
    # Core Info
    id: str
    address: str
    city: str
    province: str = "ON"
    asset_class: str = ""  # industrial, multifamily, retail, etc.
    
    # Financial
    asking_price: float = 0
    size_sf: Optional[float] = None
    lot_acres: Optional[float] = None
    cap_rate: Optional[float] = None
    noi: Optional[float] = None
    
    # Seller
    seller_name: str = ""
    seller_company: str = ""
    seller_phone: str = ""
    seller_email: str = ""
    
    # Listing Details
    list_date: datetime = field(default_factory=datetime.now)
    expiry_date: Optional[datetime] = None
    mls_number: str = ""
    commission: str = ""
    
    # Status
    status: ListingStatus = ListingStatus.ACTIVE
    days_on_market: int = 0
    
    # Activity
    showings_count: int = 0
    offers_received: int = 0
    inquiries_count: int = 0
    
    # Documents
    documents: Dict[str, bool] = field(default_factory=dict)
    # {listing_agreement: True, photos: True, spis: False, etc.}
    
    # Deadlines
    deadlines: List[Dict] = field(default_factory=list)
    # [{task: "SPIS due", date: "2026-03-30", status: "pending"}]
    
    # Buyers
    interested_buyers: List[str] = field(default_factory=list)
    # ["KingSett Capital", "RioCan REIT"]
    
    # Notes
    notes: str = ""
    last_updated: datetime = field(default_factory=datetime.now)
    
    def to_dict(self) -> Dict:
        return {
            'id': self.id,
            'address': self.address,
            'city': self.city,
            'asset_class': self.asset_class,
            'asking_price': self.asking_price,
            'status': self.status.value,
            'days_on_market': self.days_on_market,
            'seller_name': self.seller_name,
            'offers_received': self.offers_received
        }


class DealCommandCenter:
    """
    Jamie's central command for all 40+ listings
    Dashboard, tracking, reminders, compliance
    """
    
    def __init__(self):
        print("╔════════════════════════════════════════════════════════════════╗")
        print("║  🎛️  DEAL COMMAND CENTER v1.0                                  ║")
        print("║     Jamie's 40-Listing Dashboard & Organization System         ║")
        print("╚════════════════════════════════════════════════════════════════╝")
        
        self.listings: Dict[str, Listing] = {}
        self.total_value: float = 0
        self.active_count: int = 0
        
        # Load sample listings (you'll replace with your 40)
        self._load_sample_listings()
        
        print(f"\n📊 Loaded {len(self.listings)} listings")
        print(f"💰 Total pipeline value: ${self.total_value/1e6:.1f}M")
    
    def _load_sample_listings(self):
        """Sample listings to demonstrate system"""
        samples = [
            Listing(
                id="OTT-001",
                address="100 Bayshore Drive",
                city="Ottawa",
                asset_class="retail",
                asking_price=300000000,
                size_sf=880000,
                noi=15400000,
                seller_name="Ivanhoe Cambridge",
                seller_phone="514-000-0000",
                list_date=datetime(2026, 2, 1),
                expiry_date=datetime(2026, 8, 1),
                status=ListingStatus.ACTIVE,
                days_on_market=52,
                offers_received=3,
                interested_buyers=["KingSett Capital", "RioCan REIT", "CPP Investments"],
                documents={
                    "listing_agreement": True,
                    "photos": True,
                    "spis": True,
                    "survey": True,
                    "environmental": True,
                    "rent_roll": True,
                    "signage": True
                },
                notes="HBC dark anchor - value-add opportunity"
            ),
            Listing(
                id="WEL-001",
                address="1500 Michael Drive",
                city="Welland",
                asset_class="industrial",
                asking_price=5000000,
                size_sf=80000,
                seller_name="Private Owner",
                seller_phone="905-000-0000",
                list_date=datetime(2026, 3, 1),
                expiry_date=datetime(2026, 9, 1),
                status=ListingStatus.ACTIVE,
                days_on_market=23,
                offers_received=0,
                interested_buyers=["Crestpoint Real Estate"],
                documents={
                    "listing_agreement": True,
                    "photos": True,
                    "spis": False,  # PENDING
                    "survey": True,
                    "environmental": True,
                    "signage": True
                },
                deadlines=[
                    {"task": "SPIS from seller", "date": "2026-03-30", "status": "pending"}
                ]
            ),
            Listing(
                id="THO-001",
                address="75 Ormond St S",
                city="Thorold",
                asset_class="land",
                asking_price=4820000,
                lot_acres=1.7,
                seller_name="Estate of John Smith",
                seller_phone="905-000-0000",
                list_date=datetime(2026, 3, 10),
                expiry_date=datetime(2026, 9, 10),
                status=ListingStatus.ACTIVE,
                days_on_market=14,
                offers_received=1,
                interested_buyers=["City Park Homes", "Tridel"],
                documents={
                    "listing_agreement": True,
                    "photos": True,
                    "spis": True,
                    "spa_approval": True,
                    "signage": True
                },
                notes="SPA approved - 85 townhouses, City Park Homes HOT"
            ),
        ]
        
        for listing in samples:
            self.add_listing(listing)
    
    def add_listing(self, listing: Listing):
        """Add a new listing to the system"""
        self.listings[listing.id] = listing
        if listing.status == ListingStatus.ACTIVE:
            self.total_value += listing.asking_price
            self.active_count += 1
        print(f"✅ Added listing: {listing.address} (${listing.asking_price/1e6:.1f}M)")
    
    def get_dashboard(self) -> Dict:
        """Generate complete dashboard view"""
        now = datetime.now()
        
        # Categorize listings
        urgent = []
        this_week = []
        compliant = []
        
        for listing in self.listings.values():
            if listing.status != ListingStatus.ACTIVE:
                continue
            
            # Check for urgent items
            is_urgent = False
            
            # Offer deadline today
            if listing.offers_received > 0:
                urgent.append(listing)
                is_urgent = True
            
            # Expiring within 7 days
            elif listing.expiry_date and (listing.expiry_date - now).days <= 7:
                urgent.append(listing)
                is_urgent = True
            
            # Missing critical documents
            elif not all(listing.documents.get(k, False) for k in ['spis', 'photos', 'listing_agreement']):
                this_week.append(listing)
            
            # Compliant
            else:
                compliant.append(listing)
        
        return {
            'summary': {
                'total_listings': len(self.listings),
                'active_listings': self.active_count,
                'total_value': self.total_value,
                'avg_price': self.total_value / self.active_count if self.active_count > 0 else 0,
                'avg_days_on_market': sum(l.days_on_market for l in self.listings.values()) / len(self.listings) if self.listings else 0
            },
            'urgent': [l.to_dict() for l in urgent],
            'this_week': [l.to_dict() for l in this_week],
            'compliant': [l.to_dict() for l in compliant]
        }
    
    def print_dashboard(self):
        """Print beautiful dashboard to console"""
        dash = self.get_dashboard()
        
        print("\n" + "="*70)
        print("📊 JAMIE'S DEAL COMMAND CENTER - DASHBOARD")
        print("="*70)
        
        # Summary
        s = dash['summary']
        print(f"\n💼 OVERVIEW")
        print(f"  Total Listings:     {s['total_listings']}")
        print(f"  Active Listings:    {s['active_listings']}")
        print(f"  Pipeline Value:     ${s['total_value']/1e6:.1f}M")
        print(f"  Avg Price:          ${s['avg_price']/1e6:.1f}M")
        print(f"  Avg Days on Market: {s['avg_days_on_market']:.0f}")
        
        # Urgent
        print(f"\n🔥 URGENT ACTION REQUIRED ({len(dash['urgent'])} listings)")
        print("-"*70)
        for l in dash['urgent']:
            print(f"  • {l['address']}, {l['city']}")
            print(f"    Asset: {l['asset_class']} | Price: ${l['asking_price']/1e6:.1f}M")
            print(f"    DOM: {l['days_on_market']} days | Offers: {l['offers_received']}")
            print(f"    Seller: {l['seller_name']}")
            print()
        
        # This week
        print(f"\n⚡ THIS WEEK ({len(dash['this_week'])} listings)")
        print("-"*70)
        for l in dash['this_week']:
            print(f"  • {l['address']}, {l['city']} - {l['asset_class']}")
            print(f"    Price: ${l['asking_price']/1e6:.1f}M | DOM: {l['days_on_market']} days")
            print()
        
        # Compliant
        print(f"\n✅ ON TRACK ({len(dash['compliant'])} listings)")
        print("-"*70)
        for l in dash['compliant']:
            print(f"  • {l['address']}, {l['city']} - ${l['asking_price']/1e6:.1f}M")
        
        print("\n" + "="*70)
        print("⚡ NEXT STEPS:")
        print("="*70)
        print("  1. Call sellers of 🔥 URGENT listings today")
        print("  2. Complete missing docs for ⚡ THIS WEEK listings")
        print("  3. Review offers on Bayshore (3 pending)")
        print("  4. Follow up with City Park Homes on Thorold land")
        print("="*70)
    
    def get_listing(self, listing_id: str) -> Optional[Listing]:
        """Get specific listing details"""
        return self.listings.get(listing_id)
    
    def update_listing(self, listing_id: str, updates: Dict):
        """Update a listing"""
        if listing_id in self.listings:
            listing = self.listings[listing_id]
            for key, value in updates.items():
                if hasattr(listing, key):
                    setattr(listing, key, value)
            listing.last_updated = datetime.now()
            print(f"✅ Updated listing: {listing_id}")
    
    def get_tasks_for_today(self) -> List[Dict]:
        """Generate today's task list"""
        tasks = []
        now = datetime.now()
        
        for listing in self.listings.values():
            if listing.status != ListingStatus.ACTIVE:
                continue
            
            # Offers pending
            if listing.offers_received > 0:
                tasks.append({
                    'priority': 'CRITICAL',
                    'time': '9:00 AM',
                    'task': f"Review {listing.offers_received} offers - {listing.address}",
                    'listing_id': listing.id
                })
            
            # Missing SPIS
            if not listing.documents.get('spis', False):
                tasks.append({
                    'priority': 'HIGH',
                    'time': '10:00 AM',
                    'task': f"Get SPIS from seller - {listing.address}",
                    'listing_id': listing.id
                })
            
            # Expiring soon
            if listing.expiry_date and (listing.expiry_date - now).days <= 7:
                tasks.append({
                    'priority': 'HIGH',
                    'time': '2:00 PM',
                    'task': f"Discuss renewal with seller - {listing.address}",
                    'listing_id': listing.id
                })
        
        return sorted(tasks, key=lambda x: x['priority'])
    
    def get_compliance_report(self) -> Dict:
        """Check compliance across all listings"""
        required_docs = ['listing_agreement', 'photos', 'spis', 'survey', 'signage']
        
        report = {}
        for doc in required_docs:
            total = len([l for l in self.listings.values() if l.status == ListingStatus.ACTIVE])
            complete = len([l for l in self.listings.values() 
                          if l.status == ListingStatus.ACTIVE and l.documents.get(doc, False)])
            report[doc] = {
                'complete': complete,
                'total': total,
                'percent': (complete / total * 100) if total > 0 else 0
            }
        
        return report


# Singleton
center = None

def get_deal_command_center() -> DealCommandCenter:
    """Get or create singleton"""
    global center
    if center is None:
        center = DealCommandCenter()
    return center


if __name__ == "__main__":
    # Demo
    center = get_deal_command_center()
    center.print_dashboard()
    
    print("\n\n📋 TODAY'S TASKS:")
    print("="*70)
    for task in center.get_tasks_for_today():
        print(f"{task['priority']:8} | {task['time']} | {task['task']}")
