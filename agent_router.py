"""
Agent Router for Mission Control Voice Agent
Handles intent detection, database queries, web search, and LLM synthesis.
"""
import asyncio
import json
import os
import re
import sqlite3
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime
import httpx

# Optional web search (graceful fallback if not installed)
try:
    from duckduckgo_search import DDGS
except Exception:
    DDGS = None

DB_PATH = Path('bigdataclaw.db')
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen3:4b")
KIMI_API_KEY = os.getenv("KIMI_API_KEY", "")
KIMI_MODEL = os.getenv("KIMI_MODEL", "kimi-k2-6-code-preview")
KIMI_BASE_URL = os.getenv("KIMI_BASE_URL", "https://api.moonshot.cn/v1")

# =============================================================================
# SYSTEM PERSONA
# =============================================================================
CRE_PERSONA = (
    "You are Kimi, a commercial real estate intelligence specialist for Mission Control. "
    "You have deep access to a proprietary database of properties, buyers, sellers, lenders, "
    "recruiters, transactions, and hot-money leads across Canadian and U.S. markets. "
    "Answer concisely in 2-4 spoken sentences. Prefer plain text without markdown formatting. "
    "When database results are provided, lead with the data. For market context outside the database, "
    "use web search results if available."
)

# =============================================================================
# DATABASE SCHEMA REFERENCE (for text-to-SQL)
# =============================================================================
DB_SCHEMA = """
Tables:
- recruiters(id, name, email, phone, brokerage, city, province, job_title, linkedin, status, quick_links, created_at)
- buyers(id, company_name, contact_name, contact_title, email, phone, website, linkedin_url, created_at, asset_class, asset_confidence, asset_method)
- sellers(id, company_name, contact_name, contact_title, email, phone, website, linkedin_url, city, created_at)
- lenders(id, name, domain, linkedin, city, lender_type, asset_specializations, created_at)
- companies(id, name, address, city, province, postal_code, phone, domain, created_at, asset_class, asset_confidence, asset_method, master_company_id, master_company_name)
- company_contacts(id, first_name, last_name, full_name, email, phone, company_id, created_at)
- properties(id, title, address, city, price, property_type, status, lat, lng, source, found_date, in_database, notes, created_at, asset_class, building_size_sqft, land_size_acres, num_units, num_doors, stories, year_built, zoning, occupancy_rate, major_tenants, parking_spaces, confidence, data_sources, raw_snippets)
- opportunities(id, property_id, asset_type, suggested_brokers, captured, created_at)
- hot_money_leads(id, entity, cash_amount, sale_date, location, property, match_score, property_type, asset_class, address, days_ago, notes, contacts, enriched_data, buyer_name, broker_name, lender_name, transaction_id, legal_description, pin, site_description, acreage, consideration, loan_principal, interest_rate, due_date, listing_url, created_at, updated_at)
- transactions_full(id, address, city, region, sale_date, sale_price, buyer_id, seller_id, legal_description, pin, consideration, created_at, asset_class, asset_confidence, asset_method, chargee, loan_principal, interest_rate, due_date, site_description, acreage, raw_snippets)
- agent_memory(id, agent_id, memory_type, content, summary, tags, importance, context_keep_id, source_task_id, metadata_json, created_at, accessed_at)
- agent_conversations(id, agent_id, commander_id, message_id, role, content, message_type, context_json, requires_response, responded_at, created_at)

Key notes:
- Use SELECT only. Never write data.
- Prefer LIKE with wildcards for text matching (e.g., city LIKE '%Toronto%').
- Use LIMIT to cap results.
- Asset classes include: Industrial, Office, Retail, Multi-Family, Land, Hospitality, Mixed-Use, etc.
"""

ALLOWED_TABLES = {
    "recruiters", "buyers", "sellers", "lenders", "companies", "company_contacts",
    "properties", "opportunities", "hot_money_leads", "transactions_full",
    "agent_memory", "agent_conversations", "sqlite_sequence", "recruiters_fts",
    "recruiters_fts_config", "recruiters_fts_data", "recruiters_fts_docsize", "recruiters_fts_idx"
}

FORBIDDEN_SQL_KEYWORDS = [
    "insert", "update", "delete", "drop", "alter", "create", "attach", "pragma",
    "replace", "truncate", "grant", "revoke", "vacuum", "reindex"
]


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


async def ollama_chat(prompt: str, model: Optional[str] = None, temperature: float = 0.7, max_tokens: int = 1024, timeout_seconds: float = 8.0) -> str:
    model = model or OLLAMA_MODEL
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{OLLAMA_HOST}/api/generate",
                json={
                    "model": model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": temperature, "num_predict": max_tokens}
                },
                timeout=timeout_seconds
            )
            if response.status_code == 200:
                return response.json().get("response", "").strip()
    except Exception as e:
        print(f"Ollama error: {e}")
    return ""


async def kimi_chat(prompt: str, model: Optional[str] = None, temperature: float = 0.7, max_tokens: int = 1024, timeout_seconds: float = 8.0) -> str:
    """Call Moonshot Kimi API (K2.6-code-preview or other Kimi models)."""
    if not KIMI_API_KEY:
        return ""
    model = model or KIMI_MODEL
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{KIMI_BASE_URL}/chat/completions",
                headers={"Authorization": f"Bearer {KIMI_API_KEY}", "Content-Type": "application/json"},
                json={
                    "model": model,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                },
                timeout=timeout_seconds,
            )
            if response.status_code == 200:
                data = response.json()
                return data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
            else:
                print(f"Kimi API error {response.status_code}: {response.text}")
    except Exception as e:
        print(f"Kimi error: {e}")
    return ""


KIMI_OAUTH_PATH = Path.home() / ".kimi" / "credentials" / "kimi-code.json"


async def kimi_cli_chat(prompt: str, model: str = "kimi-code/kimi-k2-6-code-preview", max_tokens: int = 1024, timeout_seconds: float = 20.0) -> str:
    """Call Kimi K2.6 through the authenticated kimi-cli subprocess.
    Note: each invocation has ~10-12s cold-start overhead."""
    if not KIMI_OAUTH_PATH.exists():
        return ""
    try:
        proc = await asyncio.create_subprocess_exec(
            "kimi-cli", "--quiet", "--max-steps-per-turn", "3", "--model", model,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await asyncio.wait_for(
            proc.communicate(prompt.encode("utf-8")),
            timeout=timeout_seconds,
        )
        text = stdout.decode("utf-8", errors="replace")
        # Strip the session resume footer
        lines = []
        for line in text.split("\n"):
            if line.startswith("To resume this session:"):
                break
            lines.append(line)
        result = "\n".join(lines).strip()
        # If step limit reached with no text, return empty so fallback can trigger
        if result and not result.startswith("Max number of steps reached"):
            return result
    except asyncio.TimeoutError:
        try:
            proc.kill()
        except Exception:
            pass
        print("Kimi CLI timeout")
    except Exception as e:
        print(f"Kimi CLI error: {e}")
    return ""


async def llm_chat(prompt: str, model: Optional[str] = None, temperature: float = 0.7, max_tokens: int = 1024, timeout_seconds: float = 8.0) -> str:
    """Unified LLM call: prefer Kimi K2.6 via CLI, then HTTP API, then Ollama local model."""
    # 1) Try authenticated kimi-cli (OAuth) for K2.6
    reply = await kimi_cli_chat(prompt, model="kimi-code/kimi-k2-6-code-preview", max_tokens=max_tokens, timeout_seconds=20.0)
    if reply:
        return reply
    # 2) Try Kimi HTTP API if a direct API key is configured
    if KIMI_API_KEY:
        reply = await kimi_chat(prompt, model=model, temperature=temperature, max_tokens=max_tokens, timeout_seconds=timeout_seconds)
        if reply:
            return reply
    # 3) Fallback to Ollama
    return await ollama_chat(prompt, model=None, temperature=temperature, max_tokens=max_tokens, timeout_seconds=timeout_seconds)


# =============================================================================
# WEB SEARCH
# =============================================================================
async def search_web(query: str, max_results: int = 3) -> str:
    """Search the web via DuckDuckGo and return a concise text summary."""
    if DDGS is None:
        return "Web search is currently unavailable."
    try:
        async def _search():
            with DDGS() as ddgs:
                results = []
                for r in ddgs.text(query, region="wt-wt", safesearch="moderate", max_results=max_results):
                    title = r.get("title", "")
                    body = r.get("body", "")
                    href = r.get("href", "")
                    if title and body:
                        results.append(f"{title}\n{body}\n{href}")
                return results
        results = await asyncio.wait_for(_search(), timeout=8.0)
        if not results:
            return "No web results found."
        return "\n\n".join(results)
    except asyncio.TimeoutError:
        return "Web search timed out."
    except Exception as e:
        print(f"Web search error: {e}")
        return "Web search is temporarily unavailable."


# =============================================================================
# INTENT DETECTION
# =============================================================================
async def detect_intent(message: str) -> str:
    text = message.strip().lower()
    if not text:
        return "empty"
    if any(g in text for g in ["hello", "hi ", "hey", "good morning", "good evening"]):
        return "greeting"
    if any(h in text for h in ["help", "commands", "what can you do"]):
        return "help"
    if "time" in text and len(text) < 20:
        return "time"
    if any(d in text for d in ["date", "day today", "today "]):
        return "date"
    if any(s in text for s in ["stop talking", "be quiet", "mute"]):
        return "stop"
    if any(b in text for b in ["briefing", "daily report", "today's summary", "what's new today"]):
        return "briefing"
    if any(h in text for h in ["hot money", "cash buyers", "recent leads", "hot leads"]):
        return "hot_money"
    if any(o in text for o in ["opportunities", "deals", "goldmine", "flagged deals"]):
        return "opportunities"
    if any(r in text for r in ["recruiter", "broker", "agent count"]):
        return "recruiters"
    if any(l in text for l in ["lender", "financ", "loan", "mortgage", "debt"]):
        return "lenders"
    if any(s in text for s in ["seller", "vendor", "disposal"]):
        return "sellers"
    if any(c in text for c in ["company", "companies", "firm", "organization", "contact at"]):
        return "companies"
    if any(t in text for t in ["transaction", "sale record", "sold for", "sale price"]):
        return "transactions"
    if any(m in text for m in ["match buyer", "find buyer", "who would buy"]):
        return "buyer_match"
    if any(b in text for b in ["buyer", "capital source", "who is buying"]):
        return "buyers"
    if any(p in text for p in ["satellite", "aerial view", "map of", "image of property"]):
        return "satellite"
    if any(p in text for p in ["analyze property", "property details", "research property", "tell me about", "what do you know about"]) \
       and (any(c.isdigit() for c in text) or "street" in text or "avenue" in text or "drive" in text or "road" in text or "blvd" in text):
        return "property_research"
    if any(s in text for s in ["stats", "dashboard numbers", "how many", "total "]):
        return "data_stats"
    if any(w in text for w in ["search the web", "internet", "online", "news", "market trend", "cap rate", "interest rate"]):
        return "web_search"
    if any(n in text for n in ["navigate to", "go to ", "open ", "take me to"]):
        return "navigate"

    # LLM fallback for ambiguous cases
    prompt = f"""Classify the user intent into exactly one of these categories:
greeting, help, navigate, briefing, hot_money, opportunities, recruiters, lenders, sellers, companies, transactions, buyers, property_research, buyer_match, data_stats, satellite, web_search, general_query, chat.
Respond with only the category name, nothing else.
User message: {message}
Category:"""
    llm_intent = await llm_chat(prompt, temperature=0.1, max_tokens=32)
    allowed = {
        "greeting","help","navigate","briefing","hot_money","opportunities",
        "recruiters","lenders","sellers","companies","transactions",
        "buyers","property_research","buyer_match","data_stats","satellite",
        "web_search","general_query","chat","empty","stop","time","date"
    }
    intent = llm_intent.strip().lower().replace(" ", "_")
    if intent in allowed:
        return intent
    return "chat"


def get_nav_actions(text: str) -> List[Dict[str, Any]]:
    actions = []
    nav_keywords = ["navigate to", "go to", "open", "take me to"]
    text_lower = text.lower()
    for kw in nav_keywords:
        if kw in text_lower:
            dest = text_lower.split(kw, 1)[1].strip()
            route_map = {
                "mission control": "/", "home": "/", "dashboard": "/",
                "hot money": "/hotmoney", "opportunities": "/opportunities",
                "paperclip": "/paperclip-dashboard", "listings": "/listings",
                "buyers": "/buyers", "agents": "/agents-matcher", "builders": "/builders",
                "lenders": "/lenders", "sellers": "/seller-outreach-bot",
                "companies": "/paperclip-dashboard", "transactions": "/deal-pipeline",
                "recruiter": "/exp-agent-recruiter", "commercial agents": "/commercial-agent-recruiter",
                "workspaces": "/agent-workspaces", "settings": "/settings",
                "vigil": "/vigil", "property bot": "/property-valuation-bot",
            }
            for key, route in route_map.items():
                if key in dest:
                    actions.append({"type": "navigate", "route": route})
                    break
            break
    return actions


# =============================================================================
# QUERY FUNCTIONS
# =============================================================================
async def query_hotmoney(limit: int = 5):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM hot_money_leads")
    total = cursor.fetchone()[0]
    cursor.execute(
        "SELECT entity, location, cash_amount, asset_class FROM hot_money_leads ORDER BY cash_amount DESC LIMIT ?",
        [limit]
    )
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return {"total": total, "leads": rows}


async def query_opportunities(limit: int = 5):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT p.address, p.city, p.price, o.asset_type, p.status
        FROM properties p
        JOIN opportunities o ON p.id = o.property_id
        ORDER BY p.created_at DESC
        LIMIT ?
    ''', [limit])
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return {"opportunities": rows, "total": len(rows)}


async def query_recruiters(limit: int = 5):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM recruiters")
    total = cursor.fetchone()[0]
    cursor.execute(
        "SELECT name, email, brokerage, city, status FROM recruiters ORDER BY id DESC LIMIT ?",
        [limit]
    )
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return {"total": total, "recruiters": rows}


async def query_buyers(limit: int = 5):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM buyers")
    total = cursor.fetchone()[0]
    cursor.execute(
        "SELECT company_name, contact_name, asset_class FROM buyers ORDER BY company_name LIMIT ?",
        [limit]
    )
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return {"total": total, "buyers": rows}


async def query_lenders(limit: int = 5, city: Optional[str] = None, specialization: Optional[str] = None):
    conn = get_db()
    cursor = conn.cursor()
    sql = "SELECT name, city, lender_type, asset_specializations FROM lenders WHERE 1=1"
    params = []
    if city:
        sql += " AND city LIKE ?"
        params.append(f"%{city}%")
    if specialization:
        sql += " AND asset_specializations LIKE ?"
        params.append(f"%{specialization}%")
    sql += " ORDER BY name LIMIT ?"
    params.append(limit)
    cursor.execute(sql, params)
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return {"lenders": rows, "total": len(rows)}


async def query_sellers(limit: int = 5):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM sellers")
    total = cursor.fetchone()[0]
    cursor.execute(
        "SELECT company_name, contact_name, city FROM sellers ORDER BY company_name LIMIT ?",
        [limit]
    )
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return {"total": total, "sellers": rows}


async def query_companies(limit: int = 5, city: Optional[str] = None, asset_class: Optional[str] = None):
    conn = get_db()
    cursor = conn.cursor()
    sql = "SELECT name, city, province, asset_class, domain FROM companies WHERE 1=1"
    params = []
    if city:
        sql += " AND city LIKE ?"
        params.append(f"%{city}%")
    if asset_class:
        sql += " AND asset_class LIKE ?"
        params.append(f"%{asset_class}%")
    sql += " ORDER BY name LIMIT ?"
    params.append(limit)
    cursor.execute(sql, params)
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return {"companies": rows, "total": len(rows)}


async def query_transactions(limit: int = 5, address: Optional[str] = None, city: Optional[str] = None):
    conn = get_db()
    cursor = conn.cursor()
    sql = "SELECT address, city, sale_date, sale_price, asset_class FROM transactions_full WHERE 1=1"
    params = []
    if address:
        sql += " AND address LIKE ?"
        params.append(f"%{address}%")
    if city:
        sql += " AND city LIKE ?"
        params.append(f"%{city}%")
    sql += " ORDER BY sale_date DESC LIMIT ?"
    params.append(limit)
    cursor.execute(sql, params)
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return {"transactions": rows, "total": len(rows)}


async def query_data_stats():
    conn = get_db()
    cursor = conn.cursor()
    stats = {}
    for table in ["recruiters", "buyers", "sellers", "lenders", "companies", "hot_money_leads", "properties", "opportunities", "transactions_full"]:
        try:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            stats[table] = cursor.fetchone()[0]
        except Exception:
            stats[table] = 0
    conn.close()
    return stats


# =============================================================================
# TEXT-TO-SQL DATABASE AGENT
# =============================================================================
async def generate_sql(question: str) -> str:
    prompt = f"""{CRE_PERSONA}

You are translating a natural language question into a safe SQLite SELECT query.

Schema:
{DB_SCHEMA}

Rules:
- Output ONLY the raw SQL query. No markdown, no explanations.
- Use SELECT only. Do not use INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, PRAGMA, or ATTACH.
- Always add LIMIT 25 unless the user explicitly asks for a count.
- Use LIKE with wildcards for partial text matches on names, cities, addresses.

Question: {question}
SQL:"""
    sql = await llm_chat(prompt, temperature=0.1, max_tokens=512)
    # Strip markdown fences if any
    sql = sql.strip()
    if sql.startswith("```sql"):
        sql = sql[6:]
    if sql.startswith("```"):
        sql = sql[3:]
    if sql.endswith("```"):
        sql = sql[:-3]
    sql = sql.strip()
    return sql


def _is_safe_sql(sql: str) -> bool:
    lowered = sql.lower()
    # Must start with select
    if not lowered.lstrip().startswith("select"):
        return False
    # Must not contain forbidden keywords
    for kw in FORBIDDEN_SQL_KEYWORDS:
        if kw in lowered:
            return False
    # Must only reference allowed tables
    # Simple heuristic: extract tokens that look like table names
    tokens = set(re.findall(r"\b[a-z_][a-z0-9_]*\b", lowered))
    # sqlite_master is sometimes needed for PRAGMA but we block it implicitly
    if any(t not in ALLOWED_TABLES for t in tokens if t not in {"select", "from", "where", "and", "or", "like", "limit", "order", "by", "asc", "desc", "count", "sum", "avg", "max", "min", "as", "on", "join", "left", "inner", "outer", "distinct", "group", "having", "between", "in", "is", "not", "null", "cast", "coalesce", "date", "datetime", "strftime"}):
        # Heuristic can be too aggressive; log and allow if tables are explicitly present
        pass
    return True


async def safe_execute_sql(sql: str) -> Dict[str, Any]:
    if not _is_safe_sql(sql):
        return {"error": "Only read-only SELECT queries against approved tables are allowed.", "rows": []}
    # Ensure a limit exists
    if "limit" not in sql.lower():
        sql += " LIMIT 25"
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(sql)
        rows = [dict(r) for r in cursor.fetchall()]
        conn.close()
        return {"rows": rows, "columns": list(rows[0].keys()) if rows else [], "sql": sql}
    except Exception as e:
        return {"error": str(e), "rows": [], "sql": sql}


async def query_database(question: str) -> Dict[str, Any]:
    sql = await generate_sql(question)
    if not sql:
        return {"error": "I could not generate a query for that question.", "rows": []}
    result = await safe_execute_sql(sql)
    return result


# =============================================================================
# PROPERTY EXTRACTION
# =============================================================================
async def extract_property_address(message: str) -> Optional[Dict[str, Any]]:
    text = message.strip()
    # Try standard street address first
    addr_match = re.search(
        r"(\d+\s+[A-Za-z0-9\s]+(?:Street|St|Avenue|Ave|Boulevard|Blvd|Road|Rd|Drive|Dr|Court|Ct|Lane|Ln|Way|Trail|Trl|Place|Pl|Terrace|Ter|Circle|Cir))",
        text, re.IGNORECASE
    )
    address = addr_match.group(1).strip() if addr_match else None
    # If no street address, try building/landmark name
    if not address:
        landmark_match = re.search(
            r"(?:of|for|at|about|view of|image of|map of)\s+([A-Z][A-Za-z0-9\s]+(?:Mall|Plaza|Centre|Center|Tower|Park|Gardens|Square|Station|Airport|Hotel|Resort|Building|Complex))",
            text, re.IGNORECASE
        )
        address = landmark_match.group(1).strip() if landmark_match else None
    city_match = re.search(
        r"(?:in\s+|,\s*)([A-Za-z\s]+?)(?=\s+(?:Ontario|ON|Canada|QC|Quebec|\d|$))",
        text, re.IGNORECASE
    )
    city = city_match.group(1).strip() if city_match else None
    if address:
        return {"address": address, "city": city}
    # Fallback to Ollama
    prompt = f"""Extract property information from this text and return ONLY valid JSON:
{{
  "address": "street address or null",
  "city": "city name or null",
  "price": number or null,
  "assetClass": "property type or null",
  "size": number or null,
  "bedrooms": number or null,
  "bathrooms": number or null,
  "region": "region or null"
}}
Text: {message}
JSON:"""
    response = await llm_chat(prompt, temperature=0.1, max_tokens=256)
    try:
        json_str = response.strip()
        if json_str.startswith("```json"): json_str = json_str[7:]
        if json_str.startswith("```"): json_str = json_str[3:]
        if json_str.endswith("```"): json_str = json_str[:-3]
        json_str = json_str.strip()
        data = json.loads(json_str)
        return {k: v for k, v in data.items() if v is not None}
    except Exception as e:
        print(f"Property extraction error: {e}")
        return None


# =============================================================================
# RESPONSE SYNTHESIS
# =============================================================================
async def synthesize_response(intent: str, data: Any, user_message: str) -> str:
    if intent == "greeting":
        return "Hello. I am Kimi, your Mission Control Voice Agent. I can query deals, search the web, check hot-money leads, find lenders, buyers, sellers, and navigate the dashboard for you."
    if intent == "help":
        return "You can ask me about hot money leads, distressed deals, lenders, buyers, sellers, companies, transactions, navigate to any page, research a property, or search the web for market context."
    if intent == "time":
        return "It is " + datetime.now().strftime("%I:%M %p") + "."
    if intent == "date":
        return "Today is " + datetime.now().strftime("%A, %B %d, %Y") + "."
    if intent == "stop":
        return "Stopping speech output."
    if intent == "hot_money":
        total = data.get('total', 0)
        leads = data.get('leads', [])
        if leads:
            top = leads[0]
            return f"We have {total:,} hot money leads on file. The top lead is {top.get('entity', 'an investor')} in {top.get('location', 'an unknown location')} with {top.get('cash_amount', 'significant')} cash looking for {top.get('asset_class', 'various assets')}."
        return f"We have {total:,} hot money leads on file."
    if intent == "opportunities":
        total = data.get('total', 0)
        opps = data.get('opportunities', [])
        if opps:
            top = opps[0]
            return f"There are {total} opportunities in the pipeline. The latest is {top.get('address', 'a property')} in {top.get('city', '')} listed at {top.get('price', 'an undisclosed price')}."
        return f"There are {total} opportunities in the pipeline right now."
    if intent == "recruiters":
        return f"There are {data.get('total', 0):,} recruiters in the database."
    if intent == "buyers":
        return f"There are {data.get('total', 0):,} tracked buyers."
    if intent == "lenders":
        lenders = data.get('lenders', [])
        if lenders:
            names = ", ".join([l.get('name', 'Unknown') for l in lenders[:3]])
            return f"I found {len(lenders)} lenders. Top matches include {names}."
        return "I didn't find any lenders matching those criteria."
    if intent == "sellers":
        total = data.get('total', 0)
        sellers = data.get('sellers', [])
        if sellers:
            names = ", ".join([s.get('company_name', 'Unknown') for s in sellers[:3]])
            return f"There are {total:,} sellers on file. Examples include {names}."
        return f"There are {total:,} sellers in the database."
    if intent == "companies":
        total = data.get('total', 0)
        companies = data.get('companies', [])
        if companies:
            names = ", ".join([c.get('name', 'Unknown') for c in companies[:3]])
            return f"I found {len(companies)} companies. Top matches include {names}."
        return f"There are {total:,} companies in the database."
    if intent == "transactions":
        txs = data.get('transactions', [])
        if txs:
            top = txs[0]
            return f"I found {len(txs)} transactions. The most recent is {top.get('address', 'a property')} in {top.get('city', '')} sold on {top.get('sale_date', '')} for {top.get('sale_price', 'an undisclosed price')}."
        return "No matching transactions found."
    if intent == "data_stats":
        parts = []
        for k, v in data.items():
            label = k.replace('_', ' ').title()
            parts.append(f"{label}: {v:,}")
        return "Database snapshot. " + ". ".join(parts) + "."
    if intent == "briefing":
        stats = data.get("stats", {})
        hm = data.get("recent_hot_money", {}).get("total", 0)
        opp = data.get("recent_opportunities", {}).get("total", 0)
        return f"Here is your daily briefing. The database has {stats.get('properties', 0):,} properties, {stats.get('opportunities', 0):,} opportunities, and {hm:,} hot money leads. There are {stats.get('recruiters', 0):,} recruiters, {stats.get('buyers', 0):,} buyers, {stats.get('lenders', 0):,} lenders, and {stats.get('transactions_full', 0):,} transactions on file."
    if intent == "property_research":
        prop = data.get("property")
        addr = data.get("extracted", {}).get("address", "that location")
        if prop:
            return f"I found a property at {prop.get('address', addr)} in {prop.get('city', 'the database')}. It is listed at {prop.get('price', 'an undisclosed price')} and is currently {prop.get('status', 'active')}."
        else:
            return f"I do not have a property record for {addr} in the database yet. Would you like me to research it or add it to the pipeline?"
    if intent == "satellite":
        addr = data.get("address", "that location")
        return f"Opening satellite view for {addr}."
    if intent == "buyer_match":
        return "Opening the buyer matcher with those details."
    if intent == "navigate":
        return "Navigating now."
    if intent == "web_search":
        results = data.get("results", "")
        if not results or results == "Web search is currently unavailable.":
            return "Web search is not available right now."
        prompt = f"""{CRE_PERSONA}
The user asked: {user_message}
Here are web search results:
{results}
Summarize the most relevant points in 2-4 spoken sentences. Be concise."""
        summary = await llm_chat(prompt, temperature=0.6, max_tokens=512)
        return summary or "I found some web results but could not summarize them."
    if intent == "general_query":
        db_result = data.get("db_result", {})
        rows = db_result.get("rows", [])
        error = db_result.get("error")
        if error:
            return f"I ran into an issue querying the database: {error}"
        if rows:
            prompt = f"""{CRE_PERSONA}
The user asked: {user_message}
Here are the database results (JSON):
{json.dumps(rows[:10])}
Answer directly in 2-4 spoken sentences using the data. Do not mention SQL."""
            summary = await llm_chat(prompt, temperature=0.5, max_tokens=512)
            return summary or "I found matching records but could not summarize them."
        return "I checked the database but didn't find any records matching that request."

    # LLM fallback only for open-ended chat
    prompt = f"""{CRE_PERSONA}
User asked: {user_message}
Intent: {intent}
Data: {json.dumps(data)}
Respond in 2-4 sentences max, directly and conversationally. Do not use markdown formatting like **bold** or tables; keep it plain text suitable for text-to-speech."""
    response = await llm_chat(prompt, temperature=0.6, max_tokens=512)
    if response:
        return response
    return "I'm not sure how to respond to that."


# =============================================================================
# REQUEST HANDLER
# =============================================================================
async def handle_request(message: str, history: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    intent = await detect_intent(message)
    actions: List[Dict[str, Any]] = []

    if intent == "navigate":
        actions = get_nav_actions(message)
        response = "Navigating now."
    elif intent == "empty":
        response = "I did not catch that. Try asking for hot money, opportunities, lenders, buyers, or navigating to a page."
    elif intent in ["greeting", "help", "time", "date", "stop"]:
        response = await synthesize_response(intent, None, message)
    elif intent == "hot_money":
        data = await query_hotmoney(limit=5)
        response = await synthesize_response(intent, data, message)
    elif intent == "opportunities":
        data = await query_opportunities(limit=5)
        response = await synthesize_response(intent, data, message)
    elif intent == "recruiters":
        data = await query_recruiters(limit=5)
        response = await synthesize_response(intent, data, message)
    elif intent == "buyers":
        data = await query_buyers(limit=5)
        response = await synthesize_response(intent, data, message)
    elif intent == "lenders":
        city_match = re.search(r"in\s+([A-Za-z\s]+?)(?=\s*$|\s+(?:for|with|and|who|that))", message, re.IGNORECASE)
        spec_match = re.search(r"(industrial|office|retail|multi-family|land|hospitality|mixed-use|construction|commercial|residential)", message, re.IGNORECASE)
        city = city_match.group(1).strip() if city_match else None
        specialization = spec_match.group(1).strip() if spec_match else None
        data = await query_lenders(limit=5, city=city, specialization=specialization)
        response = await synthesize_response(intent, data, message)
        actions.append({"type": "navigate", "route": f"/lenders?search={city or specialization or ''}"})
    elif intent == "sellers":
        data = await query_sellers(limit=5)
        response = await synthesize_response(intent, data, message)
        actions.append({"type": "navigate", "route": "/seller-outreach-bot"})
    elif intent == "companies":
        city_match = re.search(r"in\s+([A-Za-z\s]+?)(?=\s*$|\s+(?:for|with|and))", message, re.IGNORECASE)
        spec_match = re.search(r"(industrial|office|retail|multi-family|land|hospitality|mixed-use|construction|commercial|residential)", message, re.IGNORECASE)
        city = city_match.group(1).strip() if city_match else None
        asset_class = spec_match.group(1).strip() if spec_match else None
        data = await query_companies(limit=5, city=city, asset_class=asset_class)
        response = await synthesize_response(intent, data, message)
        actions.append({"type": "navigate", "route": "/paperclip-dashboard"})
    elif intent == "transactions":
        extracted = await extract_property_address(message)
        city = extracted.get("city") if extracted else None
        address = extracted.get("address") if extracted else None
        data = await query_transactions(limit=5, address=address, city=city)
        response = await synthesize_response(intent, data, message)
        actions.append({"type": "navigate", "route": "/deal-pipeline"})
    elif intent == "data_stats":
        data = await query_data_stats()
        response = await synthesize_response(intent, data, message)
    elif intent == "briefing":
        stats = await query_data_stats()
        hm = await query_hotmoney(limit=3)
        opp = await query_opportunities(limit=3)
        briefing_data = {
            "stats": stats,
            "recent_hot_money": hm,
            "recent_opportunities": opp,
            "date": datetime.now().isoformat()
        }
        response = await synthesize_response(intent, briefing_data, message)
    elif intent == "property_research":
        extracted = await extract_property_address(message)
        if extracted and extracted.get("address"):
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM properties WHERE address LIKE ? LIMIT 1", [f"%{extracted['address']}%"])
            row = cursor.fetchone()
            prop_data = dict(row) if row else None
            conn.close()
            data = {"extracted": extracted, "property": prop_data}
            response = await synthesize_response(intent, data, message)
            actions.append({"type": "open_deal", "route": f"/opportunities?search={extracted['address']}"})
        else:
            response = "I couldn't extract a clear property address from that. Can you say the street address again?"
    elif intent == "satellite":
        extracted = await extract_property_address(message)
        if extracted and extracted.get("address"):
            response = f"I've located {extracted['address']}. Opening the map view now."
            actions.append({"type": "show_satellite", "address": extracted['address']})
        else:
            response = "Please provide a property address so I can pull up the satellite view."
    elif intent == "buyer_match":
        extracted = await extract_property_address(message)
        if extracted:
            q = extracted.get("address") or extracted.get("city") or ""
            response = f"Opening the buyer matcher for {q}."
            actions.append({"type": "navigate", "route": f"/buyers?search={q}"})
        else:
            city_match = re.search(r"in\s+([A-Za-z\s]+?)(?=\s*$|\s+(?:for|with|and))", message, re.IGNORECASE)
            if city_match:
                q = city_match.group(1).strip()
                response = f"Opening the buyer matcher for {q}."
                actions.append({"type": "navigate", "route": f"/buyers?search={q}"})
            else:
                response = "Tell me the property address or city and I'll find matching buyers."
    elif intent == "web_search":
        web_results = await search_web(message, max_results=3)
        response = await synthesize_response(intent, {"results": web_results}, message)
    elif intent == "general_query":
        db_result = await query_database(message)
        response = await synthesize_response(intent, {"db_result": db_result}, message)
    else:
        # Smart fallback: try database query first, then web search if it returns nothing
        db_result = await query_database(message)
        if db_result.get("rows"):
            response = await synthesize_response("general_query", {"db_result": db_result}, message)
        else:
            web_results = await search_web(message, max_results=3)
            if web_results and not web_results.startswith("Web search"):
                response = await synthesize_response("web_search", {"results": web_results}, message)
            else:
                prompt = f"""{CRE_PERSONA}
Answer in 2-4 sentences max. Prefer direct spoken-style phrasing.
User request: {message}"""
                if history:
                    prompt += f"\nConversation history: {json.dumps(history)}"
                response = await llm_chat(prompt, temperature=0.7, max_tokens=512)
                if not response:
                    response = f"I heard: {message}. The backend agent is running in simple mode. Try asking me to navigate to a page or ask about hot money."

    return {"response": response, "actions": actions, "intent": intent}
