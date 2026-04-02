#!/usr/bin/env python3
"""
Demo: BigDataClaw + Shared Contact Intelligence Integration

This demonstrates how to enrich buyer matches with contact data from
the BDAIV2 Contact Intelligence service without disrupting BDAIV2.
"""

from contact_intelligence_client import ContactIntelligenceClient
from agents.universal_buyer_matcher import get_universal_buyer_matcher
import json


def enrich_matches_with_contacts(matches: dict) -> dict:
    """Enrich buyer matches with contact intelligence data.
    
    This function takes the output from UniversalBuyerMatcher and enriches
    each matched buyer with real contact data from the shared service.
    """
    client = ContactIntelligenceClient()
    
    print("\n" + "="*70)
    print("🔍 ENRICHING MATCHES WITH CONTACT INTELLIGENCE")
    print("="*70)
    
    enriched = {
        'a_tier_call_now': [],
        'b_tier_email_blast': [],
        'c_tier_newsletter': []
    }
    
    # Process A-tier matches
    for buyer in matches.get('a_tier_call_now', []):
        company = buyer.get('company', '')
        print(f"\n📞 Enriching A-tier: {company}...")
        
        try:
            contact_data = client.lookup_company(
                company,
                include_contacts=True,
                include_executives=True
            )
            
            buyer['enriched_contacts'] = contact_data.get('contacts', [])
            buyer['enriched_emails'] = contact_data.get('emails', [])
            buyer['contact_count'] = len(contact_data.get('contacts', []))
            
            if buyer['enriched_contacts']:
                print(f"   ✅ Found {buyer['contact_count']} contacts")
                # Add best contact to buyer record
                best_contact = buyer['enriched_contacts'][0]
                buyer['best_contact_name'] = best_contact.get('name', '')
                buyer['best_contact_email'] = best_contact.get('email', '')
                buyer['best_contact_phone'] = best_contact.get('phone', '')
            else:
                print(f"   ⚠️ No contacts found")
                
        except Exception as e:
            print(f"   ❌ Error: {e}")
            buyer['enriched_contacts'] = []
            
        enriched['a_tier_call_now'].append(buyer)
    
    # Process B-tier matches  
    for buyer in matches.get('b_tier_email_blast', []):
        company = buyer.get('company', '')
        print(f"\n✉️ Enriching B-tier: {company}...")
        
        try:
            # For B-tier, we just need emails for the blast
            emails = client.find_emails(company_name=company, limit=5)
            buyer['enriched_emails'] = emails
            buyer['email_count'] = len(emails)
            
            if emails:
                print(f"   ✅ Found {len(emails)} emails")
            else:
                print(f"   ⚠️ No emails found")
                
        except Exception as e:
            print(f"   ❌ Error: {e}")
            buyer['enriched_emails'] = []
            
        enriched['b_tier_email_blast'].append(buyer)
    
    return enriched


def demo_property_research():
    """Demo: Property research with enriched buyer contacts."""
    
    print("\n" + "="*80)
    print("🏢 BIGDATACLAW + CONTACT INTELLIGENCE DEMO")
    print("="*80)
    
    # Initialize matcher
    matcher = get_universal_buyer_matcher()
    
    # Property to research
    property_info = {
        'address': '1500 Michael Drive',
        'city': 'Welland', 
        'province': 'ON',
        'asset_class': 'industrial',
        'asking_price': 5000000,
        'size_sf': 80000
    }
    
    print(f"\n📍 Property: {property_info['address']}, {property_info['city']}")
    print(f"💰 Price: ${property_info['asking_price']:,}")
    print(f"🏭 Type: {property_info['asset_class']}")
    
    # Step 1: Find matches
    print("\n" + "-"*70)
    print("STEP 1: Finding matching buyers...")
    print("-"*70)
    
    matches = matcher.find_instant_buyers(property_info)
    
    # Step 2: Enrich with contacts
    print("\n" + "-"*70)
    print("STEP 2: Enriching with contact intelligence...")
    print("-"*70)
    
    enriched = enrich_matches_with_contacts(matches)
    
    # Step 3: Display enriched results
    print("\n" + "="*70)
    print("📊 ENRICHED RESULTS - READY FOR OUTREACH")
    print("="*70)
    
    print(f"\n🔥 A-TIER BUYERS (Call Now) - {len(enriched['a_tier_call_now'])} total")
    print("-"*70)
    
    for buyer in enriched['a_tier_call_now'][:3]:  # Show top 3
        print(f"\n🏢 {buyer.get('company', 'Unknown')}")
        print(f"   Score: {buyer.get('match_score', 0)}/100")
        print(f"   Contacts: {buyer.get('contact_count', 0)} found")
        
        if buyer.get('best_contact_name'):
            print(f"   👤 Primary: {buyer['best_contact_name']}")
            print(f"   📧 Email: {buyer.get('best_contact_email', 'N/A')}")
            print(f"   📞 Phone: {buyer.get('best_contact_phone', 'N/A')}")
        
        # Show additional contacts if available
        if buyer.get('enriched_contacts') and len(buyer['enriched_contacts']) > 1:
            print(f"   📋 Additional contacts:")
            for contact in buyer['enriched_contacts'][1:3]:
                print(f"      - {contact.get('name', 'Unknown')}: {contact.get('email', 'N/A')}")
    
    print(f"\n✉️ B-TIER BUYERS (Email Blast) - {len(enriched['b_tier_email_blast'])} total")
    print("-"*70)
    
    for buyer in enriched['b_tier_email_blast'][:3]:  # Show top 3
        print(f"\n🏢 {buyer.get('company', 'Unknown')}")
        print(f"   Emails: {buyer.get('email_count', 0)} found")
        
        if buyer.get('enriched_emails'):
            for email_rec in buyer['enriched_emails'][:2]:
                email = email_rec.get('email', 'N/A')
                conf = email_rec.get('confidence', 0)
                print(f"   📧 {email} (confidence: {conf})")
    
    print("\n" + "="*70)
    print("✅ INTEGRATION COMPLETE")
    print("="*70)
    print("\nNext steps:")
    print("  1. Call A-tier buyers using enriched contact data")
    print("  2. Send email blast to B-tier with verified emails")
    print("  3. All contact data sourced from shared BDAIV2 mart")
    print("  4. BDAIV2 was not disrupted during this operation")
    
    return enriched


def demo_batch_company_lookup():
    """Demo: Batch lookup of multiple companies."""
    
    print("\n" + "="*80)
    print("📚 BATCH COMPANY LOOKUP DEMO")
    print("="*80)
    
    client = ContactIntelligenceClient()
    
    companies = [
        "Dream Industrial REIT",
        "RioCan Real Estate Investment Trust", 
        "Carttera Private Equities",
        "CBRE Limited",
        "JLL (Jones Lang LaSalle)"
    ]
    
    print(f"\n🔍 Looking up {len(companies)} companies...")
    
    results = client.lookup_companies(
        companies,
        include_contacts=True,
        include_executives=True
    )
    
    print("\n" + "-"*70)
    for result in results:
        company = result.get('company_name', 'Unknown')
        contacts = result.get('contacts', [])
        emails = result.get('emails', [])
        
        print(f"\n🏢 {company}")
        print(f"   Contacts: {len(contacts)}")
        print(f"   Emails: {len(emails)}")
        
        if contacts:
            top_contact = contacts[0]
            print(f"   👤 Top contact: {top_contact.get('name', 'N/A')}")
            print(f"      Email: {top_contact.get('email', 'N/A')}")
    
    print("\n" + "="*70)


def demo_contact_search_by_title():
    """Demo: Search for specific roles."""
    
    print("\n" + "="*80)
    print("🎯 CONTACT SEARCH BY TITLE DEMO")
    print("="*80)
    
    client = ContactIntelligenceClient()
    
    # Search for acquisition-related roles
    titles = ["acquisitions", "investments", "VP", "director"]
    
    print(f"\n🔍 Searching for roles: {', '.join(titles)}")
    
    contacts = client.search_contacts(
        company_name="Dream Industrial",
        title_filter=titles,
        limit=10
    )
    
    print(f"\n📊 Found {len(contacts)} matching contacts:")
    print("-"*70)
    
    for contact in contacts:
        print(f"\n👤 {contact.get('name', 'Unknown')}")
        print(f"   Title: {contact.get('title', 'N/A')}")
        print(f"   Email: {contact.get('email', 'N/A')}")
        print(f"   Confidence: {contact.get('confidence', 0)}")
    
    print("\n" + "="*70)


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--batch":
        demo_batch_company_lookup()
    elif len(sys.argv) > 1 and sys.argv[1] == "--titles":
        demo_contact_search_by_title()
    else:
        # Run full property research demo
        demo_property_research()
        
        print("\n\n" + "="*80)
        print("Run with --batch for batch lookup demo")
        print("Run with --titles for title search demo")
        print("="*80)
