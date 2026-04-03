\#\!/usr/bin/env python3  
"""  
Property Matcher \- Core Matching Engine  
Matches property listings with qualified buyers based on multiple criteria.  
"""

from typing import List, Tuple, Dict  
from datetime import datetime, timedelta  
from dataclasses import dataclass  
import json

@dataclass  
class MatchResult:  
    buyer\_id: str  
    company\_name: str  
    contact\_name: str  
    match\_score: int  
    match\_reasons: List\[str\]  
    last\_sale\_amount: float  
    last\_sale\_date: datetime  
    has\_1031\_deadline: bool  
    exchange\_deadline: datetime \= None

class MatchingEngine:  
    """Core matching algorithm for buyer-listing pairing."""  
      
    def \_\_init\_\_(self, db\_connection):  
        self.db \= db\_connection  
          
    def find\_matches(self, listing: dict, limit: int \= 5\) \-\> List\[MatchResult\]:  
        """  
        Find top N matching buyers for a listing.  
          
        Args:  
            listing: Dict with address, city, price, property\_type, etc.  
            limit: Number of matches to return  
              
        Returns:  
            List of MatchResult objects sorted by score  
        """  
        \# Get all active buyers  
        buyers \= self.\_get\_active\_buyers()  
          
        scored\_matches \= \[\]  
          
        for buyer in buyers:  
            score, reasons \= self.\_calculate\_match\_score(listing, buyer)  
              
            if score \>= 60:  \# Minimum threshold  
                match \= MatchResult(  
                    buyer\_id=buyer\['id'\],  
                    company\_name=buyer\['company\_name'\],  
                    contact\_name=buyer.get('contact\_name', ''),  
                    match\_score=score,  
                    match\_reasons=reasons,  
                    last\_sale\_amount=buyer.get('last\_sale\_amount', 0),  
                    last\_sale\_date=buyer.get('last\_sale\_date'),  
                    has\_1031\_deadline=buyer.get('has\_1031\_deadline', False),  
                    exchange\_deadline=buyer.get('exchange\_deadline')  
                )  
                scored\_matches.append(match)  
          
        \# Sort by score descending, take top N  
        scored\_matches.sort(key=lambda x: x.match\_score, reverse=True)  
        return scored\_matches\[:limit\]  
      
    def \_calculate\_match\_score(self, listing: dict, buyer: dict) \-\> Tuple\[int, List\[str\]\]:  
        """  
        Calculate match score (0-100) and generate reasons.  
          
        Scoring weights:  
        \- Price match: 30 points  
        \- Geographic match: 25 points  
        \- Asset class match: 20 points  
        \- Hot money status: 15 points  
        \- 1031 urgency: 10 points  
        """  
        score \= 0  
        reasons \= \[\]  
          
        \# 1\. Price Match (30 points)  
        min\_price \= buyer.get('typical\_deal\_size\_min', 0\)  
        max\_price \= buyer.get('typical\_deal\_size\_max', float('inf'))  
        listing\_price \= listing.get('asking\_price', 0\)  
          
        if min\_price \<= listing\_price \<= max\_price:  
            score \+= 30  
            reasons.append(f"Price fits buyer's typical range ({self.\_fmt\_money(min\_price)}-{self.\_fmt\_money(max\_price)})")  
        elif listing\_price \* 0.5 \<= max\_price:  
            score \+= 15  
            reasons.append("Price within stretch range")  
          
        \# 2\. Geographic Match (25 points)  
        listing\_city \= listing.get('city', '')  
        buyer\_cities \= buyer.get('geographic\_focus', {}).get('cities', \[\])  
          
        if listing\_city in buyer\_cities:  
            score \+= 25  
            reasons.append(f"Active in {listing\_city} market")  
          
        \# 3\. Asset Class Match (20 points)  
        listing\_type \= listing.get('property\_type', '')  
        buyer\_types \= buyer.get('preferred\_asset\_classes', {}).get('types', \[\])  
          
        if listing\_type in buyer\_types:  
            score \+= 20  
            reasons.append(f"Targets {listing\_type} properties")  
          
        \# 4\. Hot Money Status (15 points) \- CRITICAL  
        last\_sale \= buyer.get('last\_sale\_date')  
        if last\_sale:  
            days\_since \= (datetime.now().date() \- last\_sale).days  
            last\_amount \= buyer.get('last\_sale\_amount', 0\)  
              
            if days\_since \<= 30:  
                score \+= 15  
                reasons.append(f"🔥 HOT MONEY: Closed {self.\_fmt\_money(last\_amount)} {days\_since} days ago")  
            elif days\_since \<= 90:  
                score \+= 10  
                reasons.append(f"Recent sale: {self.\_fmt\_money(last\_amount)} ({days\_since} days ago)")  
          
        \# 5\. 1031 Urgency (10 points)  
        if buyer.get('has\_1031\_deadline') and buyer.get('exchange\_deadline'):  
            days\_to\_deadline \= (buyer\['exchange\_deadline'\] \- datetime.now().date()).days  
            if days\_to\_deadline \<= 60:  
                score \+= 10  
                reasons.append(f"⏰ URGENT: 1031 deadline in {days\_to\_deadline} days")  
          
        return min(score, 100), reasons  
      
    def \_get\_active\_buyers(self) \-\> List\[dict\]:  
        """Fetch all active buyers from database."""  
        \# This would query your actual database  
        \# Placeholder implementation  
        query \= "SELECT \* FROM buyers WHERE is\_active \= true"  
        \# return self.db.execute(query)  
        return \[\]  
      
    def \_fmt\_money(self, amount: float) \-\> str:  
        """Format money for display."""  
        if amount \>= 1000000:  
            return f"${amount/1000000:.0f}M"  
        return f"${amount/1000:.0f}K"

if \_\_name\_\_ \== '\_\_main\_\_':  
    \# Example usage  
    engine \= MatchingEngine(None)  
      
    listing \= {  
        'address': '2475 Main St W',  
        'city': 'Hamilton',  
        'asking\_price': 2850000,  
        'property\_type': 'multifamily',  
        'units': 12  
    }  
      
    matches \= engine.find\_matches(listing, limit=5)  
    for match in matches:  
        print(f"{match.company\_name}: {match.match\_score}%")  
        for reason in match.match\_reasons:  
            print(f"  \- {reason}")  
