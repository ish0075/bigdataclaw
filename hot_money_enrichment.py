#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════════════════╗
║           HOT MONEY PROPERTY ENRICHMENT ENGINE                               ║
║                                                                              ║
║  Automatically enriches new hot money transactions using:                    ║
║  • Local LLM (Ollama) for property analysis                                  ║
║  • Structured zoning, asset class, and buyer/seller intel extraction         ║
║  • Obsidian vault integration for deal research notes                        ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

import json
import os
import sqlite3
import httpx
from datetime import datetime
from typing import Dict, Optional, Any
from pathlib import Path

# Ollama config
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1:8b")
DB_PATH = Path('bigdataclaw.db')

# Obsidian config (fallback to local files if API unavailable)
OBSIDIAN_VAULT_PATH = "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/deals"


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


async def call_ollama(prompt: str, system_prompt: Optional[str] = None, temperature: float = 0.3, max_tokens: int = 2048) -> str:
    """Call Ollama generate endpoint"""
    model = OLLAMA_MODEL
    system = system_prompt or "You are a commercial real estate research assistant."
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{OLLAMA_HOST}/api/generate",
                json={
                    "model": model,
                    "prompt": f"{system}\n\nUser: {prompt}\nAssistant:",
                    "stream": False,
                    "options": {
                        "temperature": temperature,
                        "num_predict": max_tokens
                    }
                },
                timeout=120.0
            )
            if response.status_code == 200:
                return response.json().get("response", "")
    except Exception as e:
        print(f"Ollama error: {e}")
    
    return ""


def build_enrichment_prompt(lead: Dict[str, Any]) -> str:
    """Build the LLM prompt for property enrichment"""
    address = lead.get('address') or lead.get('property') or 'Unknown'
    location = lead.get('location') or 'Ontario'
    entity = lead.get('entity') or 'Unknown'
    cash_amount = lead.get('cash_amount', 0)
    property_type = lead.get('property_type') or 'Commercial'
    asset_class = lead.get('asset_class') or ''
    notes = lead.get('notes') or ''
    
    prompt = f"""Analyze this commercial real estate transaction and return a structured JSON report.

PROPERTY DETAILS:
- Address: {address}, {location}
- Seller/Entity: {entity}
- Sale Price: ${cash_amount:,}
- Property Type: {property_type}
- Asset Class: {asset_class}
- Notes: {notes}

TASK:
Research and infer the following. If exact data is unknown, provide your best inference with confidence level.

Return ONLY a JSON object with this exact structure:
{{
  "property_summary": "2-3 sentence summary of what this property likely is",
  "inferred_asset_class": "Retail | Industrial | Office | Multifamily | Hotel | Land | Mixed-Use",
  "zoning": {{
    "code": "inferred zoning code (e.g., C4, M2, R3)",
    "description": "what this zoning permits",
    "confidence": "high | medium | low"
  }},
  "property_intel": {{
    "building_size_sqft": "inferred or unknown",
    "land_size_acres": "inferred or unknown",
    "year_built": "inferred or unknown",
    "stories": "inferred or unknown",
    "major_tenants": ["tenant names if inferrable"],
    "parking_spaces": "inferred or unknown"
  }},
  "buyer_seller_intel": {{
    "seller_motivation": "why the seller likely sold (relocation, consolidation, estate, etc.)",
    "buyer_profile": "what type of buyer would purchase this (developer, investor, user, etc.)",
    "deal_rationale": "strategic rationale for this transaction"
  }},
  "listing_research": {{
    "loopnet_search": "https://www.loopnet.com/search/commercial-real-estate/{location.replace(' ', '-')}-canada/keywords-{address.replace(' ', '-')}",
    "realtor_ca_search": "https://www.realtor.ca/map#ZoomLevel=15&Center={address.replace(' ', '+')}",
    "google_search": "https://www.google.com/search?q={address.replace(' ', '+')}+real+estate+{location}",
    "mpac_search": "https://www.mpac.ca/en/property/assessment-search",
    "city_zoning_search": "https://www.google.com/search?q={location.replace(' ', '+')}+zoning+bylaw+{address.replace(' ', '+')}",
    "previous_listings_found": false,
    "listing_notes": "notes about where old listings might be found"
  }},
  "key_findings": [
    "finding 1",
    "finding 2"
  ],
  "confidence": "high | medium | low",
  "data_quality": "complete | partial | minimal"
}}

IMPORTANT: Return ONLY valid JSON. No markdown, no explanations outside the JSON."""
    
    return prompt


def parse_llm_json(response_text: str) -> Dict:
    """Extract JSON from LLM response"""
    text = response_text.strip()
    
    if text.startswith("```json"):
        text = text[7:]
    if text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    
    text = text.strip()
    
    start = text.find('{')
    end = text.rfind('}')
    if start != -1 and end != -1 and end > start:
        text = text[start:end+1]
    
    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        print(f"JSON parse error: {e}")
        return {
            "property_summary": text[:500],
            "parse_error": True,
            "raw_response": text
        }


def generate_obsidian_markdown(lead: Dict, enrichment: Dict) -> str:
    """Generate rich Obsidian markdown for enriched hot money deal"""
    address = lead.get('address') or lead.get('property') or 'Unknown Property'
    location = lead.get('location') or 'Ontario'
    entity = lead.get('entity') or 'Unknown'
    cash_amount = lead.get('cash_amount', 0)
    sale_date = lead.get('sale_date', '')
    
    zoning = enrichment.get('zoning', {})
    prop_intel = enrichment.get('property_intel', {})
    bs_intel = enrichment.get('buyer_seller_intel', {})
    listings = enrichment.get('listing_research', {})
    findings = enrichment.get('key_findings', [])
    
    md = f"""---
type: hot-money-deal
entity: "{entity}"
address: "{address}"
location: "{location}"
cash_amount: {cash_amount}
sale_date: "{sale_date}"
asset_class: "{enrichment.get('inferred_asset_class', '')}"
zoning_code: "{zoning.get('code', '')}"
confidence: "{enrichment.get('confidence', 'low')}"
data_quality: "{enrichment.get('data_quality', 'minimal')}"
enriched_at: {datetime.now().strftime('%Y-%m-%d %H:%M')}
---

# {address}

> **Hot Money Deal** | Enriched: {datetime.now().strftime('%Y-%m-%d %H:%M')}
> **Seller:** {entity} | **Amount:** ${cash_amount:,}

## Property Summary

{enrichment.get('property_summary', 'No summary available.')}

## Transaction Details

| Field | Value |
|-------|-------|
| **Property** | {address} |
| **Location** | {location} |
| **Seller/Entity** | {entity} |
| **Cash Amount** | ${cash_amount:,} |
| **Sale Date** | {sale_date} |
| **Inferred Asset Class** | {enrichment.get('inferred_asset_class', 'Unknown')} |

## Zoning & Permitted Use

- **Zoning Code:** {zoning.get('code', 'Unknown')} *(confidence: {zoning.get('confidence', 'low')})*
- **Description:** {zoning.get('description', 'No zoning data available.')}

## Property Intel

| Attribute | Value |
|-----------|-------|
| **Building Size** | {prop_intel.get('building_size_sqft', 'Unknown')} |
| **Land Size** | {prop_intel.get('land_size_acres', 'Unknown')} |
| **Year Built** | {prop_intel.get('year_built', 'Unknown')} |
| **Stories** | {prop_intel.get('stories', 'Unknown')} |
| **Parking Spaces** | {prop_intel.get('parking_spaces', 'Unknown')} |
| **Major Tenants** | {', '.join(prop_intel.get('major_tenants', [])) or 'Unknown'} |

## Buyer / Seller Intel

- **Seller Motivation:** {bs_intel.get('seller_motivation', 'Unknown')}
- **Buyer Profile:** {bs_intel.get('buyer_profile', 'Unknown')}
- **Deal Rationale:** {bs_intel.get('deal_rationale', 'Unknown')}

## Research Links

- [🔍 Google Search]({listings.get('google_search', '')})
- [🏢 LoopNet Search]({listings.get('loopnet_search', '')})
- [🏠 Realtor.ca Search]({listings.get('realtor_ca_search', '')})
- [📋 MPAC Assessment]({listings.get('mpac_search', 'https://www.mpac.ca/en/property/assessment-search')})
- [⚖️ City Zoning Search]({listings.get('city_zoning_search', '')})

## Key Findings

"""
    
    if findings:
        for finding in findings:
            md += f"- {finding}\n"
    else:
        md += "- No key findings available.\n"
    
    md += f"""
## Notes

```
{lead.get('notes', '')}
```

---
#deal #{enrichment.get('inferred_asset_class', 'commercial').lower().replace(' ', '-').replace('/', '-')} #{location.lower().replace(' ', '-')} #hot-money #enriched
"""
    
    return md


def save_to_obsidian_local(lead: Dict, markdown: str) -> str:
    """Save markdown to local Obsidian vault folder"""
    vault_path = Path(OBSIDIAN_VAULT_PATH)
    vault_path.mkdir(parents=True, exist_ok=True)
    
    address = lead.get('address') or lead.get('property') or 'unknown'
    safe_name = "".join(c if c.isalnum() or c in (' ', '-', '_') else '_' for c in address).replace(' ', '_')[:60]
    filename = f"{safe_name}.md"
    filepath = vault_path / filename
    
    filepath.write_text(markdown, encoding='utf-8')
    return str(filepath)


def save_to_obsidian_api(lead: Dict, markdown: str) -> Optional[str]:
    """Try to save via Obsidian REST API, fallback to local"""
    try:
        from obsidian_api import ObsidianVaultClient
        
        client = ObsidianVaultClient(
            base_url=os.getenv('MAIN_VAULT_URL', 'https://127.0.0.1:27124'),
            api_key=os.getenv('OBSIDIAN_API_KEY', 'REDACTED_OBSIDIAN_API_KEY'),
            vault_path="/home/jamie/Desktop/Jamie's Personal Vault",
            read_only=False
        )
        
        address = lead.get('address') or lead.get('property') or 'unknown'
        safe_name = "".join(c if c.isalnum() or c in (' ', '-', '_') else '_' for c in address).replace(' ', '_')[:60]
        obsidian_path = f"/BigDataClaw/Hot-Money-Deals/{safe_name}.md"
        
        if client.create_file(obsidian_path, markdown):
            return obsidian_path
    except Exception as e:
        print(f"Obsidian API save failed: {e}")
    
    return None


async def enrich_hot_money_lead(lead_id: int) -> Dict:
    """
    Main enrichment function for a hot money lead.
    1. Fetch lead from DB
    2. Call Ollama for enrichment
    3. Parse JSON response
    4. Save to Obsidian
    5. Update DB with enrichment data
    """
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM hot_money_leads WHERE id = ?", (lead_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return {"success": False, "error": "Lead not found"}
    
    lead = dict(row)
    
    cursor.execute("""
        UPDATE hot_money_leads 
        SET enrichment_status = 'running', enrichment_timestamp = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (lead_id,))
    conn.commit()
    
    try:
        prompt = build_enrichment_prompt(lead)
        response_text = await call_ollama(prompt, temperature=0.3, max_tokens=2048)
        
        if not response_text:
            raise Exception("LLM returned empty response")
        
        enrichment = parse_llm_json(response_text)
        markdown = generate_obsidian_markdown(lead, enrichment)
        
        obsidian_path = save_to_obsidian_api(lead, markdown)
        if not obsidian_path:
            obsidian_path = save_to_obsidian_local(lead, markdown)
        
        cursor.execute("""
            UPDATE hot_money_leads SET
                enriched_data = ?,
                enrichment_status = 'complete',
                enrichment_timestamp = CURRENT_TIMESTAMP,
                obsidian_path = ?
            WHERE id = ?
        """, (json.dumps(enrichment), obsidian_path, lead_id))
        conn.commit()
        conn.close()
        
        return {
            "success": True,
            "lead_id": lead_id,
            "enrichment": enrichment,
            "obsidian_path": obsidian_path
        }
        
    except Exception as e:
        print(f"Enrichment error for lead {lead_id}: {e}")
        
        cursor.execute("""
            UPDATE hot_money_leads 
            SET enrichment_status = 'failed', enrichment_timestamp = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (lead_id,))
        conn.commit()
        conn.close()
        
        return {"success": False, "lead_id": lead_id, "error": str(e)}


async def enrich_all_pending_leads() -> Dict:
    """Enrich all leads that don't have enrichment yet"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id FROM hot_money_leads 
        WHERE enrichment_status IS NULL OR enrichment_status = ''
    """)
    
    lead_ids = [row[0] for row in cursor.fetchall()]
    conn.close()
    
    results = []
    for lead_id in lead_ids:
        result = await enrich_hot_money_lead(lead_id)
        results.append(result)
    
    successful = sum(1 for r in results if r.get('success'))
    
    return {
        "total": len(lead_ids),
        "successful": successful,
        "failed": len(lead_ids) - successful,
        "results": results
    }


if __name__ == '__main__':
    import asyncio
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM hot_money_leads LIMIT 1")
    row = cursor.fetchone()
    conn.close()
    
    if row:
        result = asyncio.run(enrich_hot_money_lead(row[0]))
        print(json.dumps(result, indent=2))
    else:
        print("No hot money leads found in database")
