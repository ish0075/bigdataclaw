#!/usr/bin/env python3
"""Seed demo Facebook leads into bigdataclaw.db for live demo."""
import sqlite3
import json
from datetime import datetime

DB_PATH = "bigdataclaw.db"

def ensure_tables(conn):
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS facebook_leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at TEXT,
            updated_at TEXT,
            source TEXT DEFAULT 'facebook',
            group_name TEXT,
            post_url TEXT,
            name TEXT,
            company TEXT,
            location TEXT,
            asset_type TEXT,
            intent TEXT,
            urgency TEXT,
            score_tier TEXT,
            signal_tags TEXT,
            post_text TEXT,
            facebook_profile TEXT,
            contact_available INTEGER DEFAULT 0,
            contact_method TEXT,
            estimated_value TEXT,
            notes TEXT,
            status TEXT DEFAULT 'new',
            routed_to TEXT,
            routed_at TEXT,
            dm_sent INTEGER DEFAULT 0,
            dm_sent_at TEXT,
            dm_replied INTEGER DEFAULT 0,
            dm_replied_at TEXT,
            connected INTEGER DEFAULT 0,
            connected_at TEXT,
            qualified INTEGER DEFAULT 0,
            qualified_at TEXT,
            archived INTEGER DEFAULT 0,
            archived_at TEXT,
            user_id TEXT
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS facebook_actions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at TEXT,
            lead_id INTEGER,
            action TEXT,
            channel TEXT,
            notes TEXT,
            user_id TEXT
        )
    """)
    conn.commit()

DEMO_LEADS = [
    {
        "name": "Sandip Chook",
        "company": "Sandip Chook Realty",
        "location": "Mississauga/Vaughan",
        "asset_type": "Industrial",
        "intent": "broker",
        "urgency": "high",
        "score_tier": "HOT",
        "source": "facebook",
        "group_name": "CRE Deal Flow - Toronto/GTA",
        "post_url": "https://www.facebook.com/groups/443935813255428/posts/example",
        "facebook_profile": "https://www.facebook.com/groups/443935813255428/user/515902443",
        "post_text": "Looking for 3,200–5,000 sqft industrial space for meat processing operation. Buyer is pre-approved and ready to close. Mississauga/Vaughan corridor preferred. Off-market preferred. DM if you have something.",
        "signal_tags": json.dumps(["pre-approved", "industrial buyer", "meat processing", "3200-5000 sqft", "ready to close"]),
        "contact_available": 1,
        "contact_method": "dm",
        "estimated_value": "M-M",
        "notes": "Role: Broker / Connector. Represents pre-approved industrial buyer. Priority: CALL/DM NOW. Requirement: 3,200–5,000 sqft industrial for meat processing. Location: Mississauga/Vaughan. Buyer ready to close.",
        "status": "new"
    },
    {
        "name": "Chris Hewitt",
        "company": "",
        "location": "GTA",
        "asset_type": "Industrial",
        "intent": "broker",
        "urgency": "medium",
        "score_tier": "WARM",
        "source": "facebook",
        "group_name": "CRE Deal Flow - Toronto/GTA",
        "post_url": "https://www.facebook.com/groups/443935813255428/posts/example",
        "facebook_profile": "https://www.facebook.com/chris.hewitt.737",
        "post_text": "Commented on industrial requirement post: \"Pls DM budget\". Likely broker/seller/intermediary. Coordinating inventory or connecting parties.",
        "signal_tags": json.dumps(["engaged", "commented", "budget request", "coordinator"]),
        "contact_available": 1,
        "contact_method": "dm",
        "estimated_value": "",
        "notes": "Role: Connector/Intermediary. Signal: Engaged (commented requesting budget). Priority: FOLLOW-UP AFTER PRIMARY. May have inventory connections in 3-5k sqft GTA industrial.",
        "status": "new"
    },
    {
        "name": "John Smith",
        "company": "",
        "location": "Mississauga",
        "asset_type": "multifamily",
        "intent": "seller",
        "urgency": "high",
        "score_tier": "HOT",
        "source": "facebook",
        "group_name": "Ontario Real Estate Investors",
        "post_url": "",
        "facebook_profile": "https://facebook.com/johnsmith",
        "post_text": "Motivated seller looking to offload a 20-unit multifamily in Mississauga. Must sell ASAP. Cash buyers only. Vacant on possession. DM me for details. Asking $4.2M.",
        "signal_tags": json.dumps(["motivated seller", "must sell", "vacant", "cash buyer"]),
        "contact_available": 1,
        "contact_method": "",
        "estimated_value": "$4.2M",
        "notes": "",
        "status": "routed",
        "routed_to": "deal_pipeline",
        "dm_sent": 1
    },
    {
        "name": "Mike Chen",
        "company": "",
        "location": "Toronto",
        "asset_type": "multifamily",
        "intent": "buyer",
        "urgency": "low",
        "score_tier": "HOT",
        "source": "facebook",
        "group_name": "Toronto Commercial Real Estate",
        "post_url": "",
        "facebook_profile": "",
        "post_text": "Cash buyer looking for multifamily deals in Toronto. Pre-approved, can close in 30 days. $5M-$15M range. DM me if you have something off-market.",
        "signal_tags": json.dumps(["cash buyer", "looking for", "pre-approved"]),
        "contact_available": 1,
        "contact_method": "",
        "estimated_value": "$5M",
        "notes": "",
        "status": "new"
    },
    {
        "name": "Sarah Johnson",
        "company": "",
        "location": "Hamilton",
        "asset_type": "multifamily",
        "intent": "seller",
        "urgency": "medium",
        "score_tier": "HOT",
        "source": "marketplace",
        "group_name": "",
        "post_url": "",
        "facebook_profile": "",
        "post_text": "Tired landlord selling 4plex in Hamilton. Vacant units. $1.8M. Must close by end of month. DM for details.",
        "signal_tags": json.dumps(["vacant", "tired landlord"]),
        "contact_available": 0,
        "contact_method": "",
        "estimated_value": "$1.8M",
        "notes": "",
        "status": "dm_replied",
        "dm_sent": 1,
        "dm_replied": 1,
        "dm_sent_at": datetime.now().isoformat(),
        "dm_replied_at": datetime.now().isoformat()
    },
    # NEW demo leads
    {
        "name": "David Park",
        "company": "Park Capital Group",
        "location": "Toronto",
        "asset_type": "retail",
        "intent": "buyer",
        "urgency": "high",
        "score_tier": "HOT",
        "source": "facebook",
        "group_name": "Ontario Commercial Real Estate Deals",
        "post_url": "",
        "facebook_profile": "https://facebook.com/david.park",
        "post_text": "Looking for strip mall or standalone retail in Toronto core. $3-8M range. 1031 exchange buyer, needs to close within 45 days. NNN preferred. DM if off-market.",
        "signal_tags": json.dumps(["1031 exchange", "retail buyer", "NNN preferred", "45 day close"]),
        "contact_available": 1,
        "contact_method": "dm",
        "estimated_value": "$3-8M",
        "notes": "1031 exchange buyer — time sensitive. Prioritize retail/NNN opportunities in Toronto core.",
        "status": "new"
    },
    {
        "name": "Priya Sharma",
        "company": "Sharma Developments",
        "location": "Brampton",
        "asset_type": "land",
        "intent": "seller",
        "urgency": "medium",
        "score_tier": "WARM",
        "source": "facebook",
        "group_name": "GTA Land & Development",
        "post_url": "",
        "facebook_profile": "https://facebook.com/priya.sharma",
        "post_text": "Selling 2-acre industrial-zoned parcel in Brampton. Serviced, shovel-ready. Asking $4.5M. Ideal for last-mile logistics or light industrial. Site plan approved.",
        "signal_tags": json.dumps(["shovel-ready", "serviced", "industrial zoning", "site plan approved"]),
        "contact_available": 1,
        "contact_method": "dm",
        "estimated_value": "$4.5M",
        "notes": "Shovel-ready industrial land. Site plan approved — fast track to construction.",
        "status": "new"
    },
    {
        "name": "Marcus Thompson",
        "company": "Thompson Realty Advisors",
        "location": "Oakville",
        "asset_type": "office",
        "intent": "broker",
        "urgency": "high",
        "score_tier": "HOT",
        "source": "facebook",
        "group_name": "CRE Deal Flow - Toronto/GTA",
        "post_url": "",
        "facebook_profile": "https://facebook.com/marcus.thompson",
        "post_text": "Representing institutional buyer seeking 50,000+ sqft Class A office in Oakville/Burlington corridor. 10-year leaseback ideal. $20M+ budget. Off-market only.",
        "signal_tags": json.dumps(["institutional buyer", "Class A office", "leaseback", "off-market only"]),
        "contact_available": 1,
        "contact_method": "dm",
        "estimated_value": "$20M+",
        "notes": "Institutional buyer with $20M+ budget. Seeking Class A office with leaseback structure. Off-market only.",
        "status": "new"
    },
    {
        "name": "Lisa Wong",
        "company": "Wong Commercial Lending",
        "location": "Markham",
        "asset_type": "multifamily",
        "intent": "broker",
        "urgency": "medium",
        "score_tier": "WARM",
        "source": "facebook",
        "group_name": "Ontario Real Estate Investors",
        "post_url": "",
        "facebook_profile": "https://facebook.com/lisa.wong",
        "post_text": "Commercial mortgage broker specializing in multifamily refis. Rates from 4.75% on 5-year terms. Can close in 3 weeks. DM for pre-approval.",
        "signal_tags": json.dumps(["lender", "multifamily refi", "4.75% rate", "3 week close"]),
        "contact_available": 1,
        "contact_method": "dm",
        "estimated_value": "",
        "notes": "Commercial mortgage broker. 4.75% multifamily refi rates. Fast close (3 weeks).",
        "status": "new"
    }
]

def seed():
    conn = sqlite3.connect(DB_PATH)
    ensure_tables(conn)
    cursor = conn.cursor()

    now = datetime.now().isoformat()

    for lead in DEMO_LEADS:
        # Check if lead already exists by name + post_text
        cursor.execute(
            "SELECT id FROM facebook_leads WHERE name = ? AND post_text = ?",
            (lead["name"], lead["post_text"])
        )
        if cursor.fetchone():
            print(f"  Skip (exists): {lead['name']}")
            continue

        cursor.execute("""
            INSERT INTO facebook_leads (
                created_at, updated_at, source, group_name, post_url, name, company,
                location, asset_type, intent, urgency, score_tier, signal_tags,
                post_text, facebook_profile, contact_available, contact_method,
                estimated_value, notes, status, routed_to, routed_at, dm_sent,
                dm_sent_at, dm_replied, dm_replied_at, connected, connected_at,
                qualified, qualified_at, archived, archived_at, user_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            now, now,
            lead.get("source", "facebook"),
            lead.get("group_name", ""),
            lead.get("post_url", ""),
            lead["name"],
            lead.get("company", ""),
            lead.get("location", ""),
            lead.get("asset_type", ""),
            lead.get("intent", ""),
            lead.get("urgency", "medium"),
            lead.get("score_tier", "WARM"),
            lead.get("signal_tags", "[]"),
            lead.get("post_text", ""),
            lead.get("facebook_profile", ""),
            lead.get("contact_available", 0),
            lead.get("contact_method", ""),
            lead.get("estimated_value", ""),
            lead.get("notes", ""),
            lead.get("status", "new"),
            lead.get("routed_to"),
            lead.get("routed_at"),
            lead.get("dm_sent", 0),
            lead.get("dm_sent_at"),
            lead.get("dm_replied", 0),
            lead.get("dm_replied_at"),
            lead.get("connected", 0),
            lead.get("connected_at"),
            lead.get("qualified", 0),
            lead.get("qualified_at"),
            lead.get("archived", 0),
            lead.get("archived_at"),
            lead.get("user_id")
        ))
        print(f"  Inserted: {lead['name']} ({lead['intent'].upper()} | {lead['score_tier']} | {lead['asset_type']})")

    conn.commit()

    # Summary
    cursor.execute("SELECT COUNT(*) FROM facebook_leads")
    total = cursor.fetchone()[0]
    cursor.execute("SELECT score_tier, COUNT(*) FROM facebook_leads GROUP BY score_tier")
    tiers = cursor.fetchall()
    cursor.execute("SELECT intent, COUNT(*) FROM facebook_leads GROUP BY intent")
    intents = cursor.fetchall()
    conn.close()

    print(f"\n✅ Done. Total leads: {total}")
    print(f"   By tier: {dict(tiers)}")
    print(f"   By intent: {dict(intents)}")

if __name__ == "__main__":
    seed()
