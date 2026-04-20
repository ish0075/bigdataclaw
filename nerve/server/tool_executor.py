"""
Tool executor for Mission Control Analyst agent.
Defines available tools and executes them against SQLite, OpenClaw, and vault.
"""

import json
import sqlite3
from typing import List, Dict, Any, Optional
from pathlib import Path

# Database path — supports Docker and local development
DB_PATH = Path(os.getenv("BIGDATACLAW_DB", "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/bigdataclaw.db"))

# ---------------------------------------------------------------------------
# Tool schemas (described to the LLM)
# ---------------------------------------------------------------------------

TOOL_SCHEMAS = [
    {
        "name": "search_hot_money",
        "description": "Search hot money leads (recent sellers with cash). Returns entities, cash amounts, locations.",
        "parameters": {
            "location": {"type": "string", "description": "City or region filter, e.g. 'Hamilton', 'Niagara'", "optional": True},
            "min_cash": {"type": "number", "description": "Minimum cash amount in dollars", "optional": True},
            "limit": {"type": "integer", "description": "Max results (default 10)", "optional": True},
        }
    },
    {
        "name": "search_buyers",
        "description": "Search the buyer database (companies, REITs, PE firms).",
        "parameters": {
            "query": {"type": "string", "description": "Search term for company name or focus area", "optional": True},
            "location": {"type": "string", "description": "City or region filter", "optional": True},
            "asset_class": {"type": "string", "description": "e.g. 'industrial', 'multifamily', 'retail'", "optional": True},
            "limit": {"type": "integer", "description": "Max results (default 10)", "optional": True},
        }
    },
    {
        "name": "search_lenders",
        "description": "Search the lender database for financing sources.",
        "parameters": {
            "type": {"type": "string", "description": "e.g. 'construction', 'bridge', 'permanent', 'land'", "optional": True},
            "location": {"type": "string", "description": "City or region", "optional": True},
            "limit": {"type": "integer", "description": "Max results (default 10)", "optional": True},
        }
    },
    {
        "name": "search_transactions",
        "description": "Search transaction records for comps and market data.",
        "parameters": {
            "location": {"type": "string", "description": "City or region", "optional": True},
            "asset_class": {"type": "string", "description": "Property type filter", "optional": True},
            "min_price": {"type": "number", "description": "Minimum sale price", "optional": True},
            "max_price": {"type": "number", "description": "Maximum sale price", "optional": True},
            "limit": {"type": "integer", "description": "Max results (default 10)", "optional": True},
        }
    },
    {
        "name": "get_platform_stats",
        "description": "Get high-level platform statistics: record counts, total volume, hot money count.",
        "parameters": {}
    },
    {
        "name": "analyze_deal",
        "description": "Run OpenClaw intelligence analysis on a deal description or record.",
        "parameters": {
            "deal_text": {"type": "string", "description": "Raw deal description to analyze"},
        }
    },
    {
        "name": "search_vault",
        "description": "Search the Obsidian knowledge vault for notes and research.",
        "parameters": {
            "query": {"type": "string", "description": "Search query"},
            "limit": {"type": "integer", "description": "Max results (default 5)", "optional": True},
        }
    },
]


def _get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def _row_to_dict(row: sqlite3.Row) -> Dict[str, Any]:
    return {key: row[key] for key in row.keys()}


# ---------------------------------------------------------------------------
# Tool implementations
# ---------------------------------------------------------------------------

def tool_search_hot_money(location: str = None, min_cash: float = None, limit: int = 10) -> Dict[str, Any]:
    conn = _get_db()
    cursor = conn.cursor()
    query = "SELECT entity, cash_amount, sale_date, location, property_type, days_ago FROM hot_money_leads WHERE 1=1"
    params = []
    if location:
        query += " AND (location LIKE ? OR location LIKE ?)"
        params.extend([f"%{location}%", f"%{location.title()}%"])
    if min_cash:
        query += " AND cash_amount >= ?"
        params.append(min_cash)
    query += " ORDER BY cash_amount DESC LIMIT ?"
    params.append(limit)
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return {"results": [_row_to_dict(r) for r in rows], "count": len(rows)}


def tool_search_buyers(query: str = None, location: str = None, asset_class: str = None, limit: int = 10) -> Dict[str, Any]:
    conn = _get_db()
    cursor = conn.cursor()
    sql = "SELECT name, city, province, asset_class, master_company_name FROM companies WHERE 1=1"
    params = []
    if query:
        sql += " AND (name LIKE ? OR master_company_name LIKE ?)"
        params.extend([f"%{query}%", f"%{query}%"])
    if location:
        sql += " AND (city LIKE ? OR province LIKE ?)"
        params.extend([f"%{location}%", f"%{location}%"])
    if asset_class:
        sql += " AND asset_class LIKE ?"
        params.append(f"%{asset_class}%")
    sql += " LIMIT ?"
    params.append(limit)
    cursor.execute(sql, params)
    rows = cursor.fetchall()
    conn.close()
    return {"results": [_row_to_dict(r) for r in rows], "count": len(rows)}


def tool_search_lenders(type: str = None, location: str = None, limit: int = 10) -> Dict[str, Any]:
    conn = _get_db()
    cursor = conn.cursor()
    sql = "SELECT name, lender_type, city, asset_specializations FROM lenders WHERE 1=1"
    params = []
    if type:
        sql += " AND (lender_type LIKE ? OR asset_specializations LIKE ?)"
        params.extend([f"%{type}%", f"%{type}%"])
    if location:
        sql += " AND city LIKE ?"
        params.append(f"%{location}%")
    sql += " LIMIT ?"
    params.append(limit)
    cursor.execute(sql, params)
    rows = cursor.fetchall()
    conn.close()
    return {"results": [_row_to_dict(r) for r in rows], "count": len(rows)}


def tool_search_transactions(location: str = None, asset_class: str = None, min_price: float = None, max_price: float = None, limit: int = 10) -> Dict[str, Any]:
    conn = _get_db()
    cursor = conn.cursor()
    # Check columns in transactions_full
    cursor.execute("PRAGMA table_info(transactions_full)")
    cols = [r[1] for r in cursor.fetchall()]
    
    select_cols = [c for c in ['buyer', 'seller', 'sale_price', 'address', 'city', 'property_type', 'sale_date'] if c in cols]
    if not select_cols:
        select_cols = ['*']
    
    sql = f"SELECT {', '.join(select_cols)} FROM transactions_full WHERE 1=1"
    params = []
    if location and 'city' in cols:
        sql += " AND city LIKE ?"
        params.append(f"%{location}%")
    if asset_class and 'property_type' in cols:
        sql += " AND property_type LIKE ?"
        params.append(f"%{asset_class}%")
    if min_price and 'sale_price' in cols:
        sql += " AND sale_price >= ?"
        params.append(min_price)
    if max_price and 'sale_price' in cols:
        sql += " AND sale_price <= ?"
        params.append(max_price)
    sql += " ORDER BY sale_price DESC LIMIT ?"
    params.append(limit)
    cursor.execute(sql, params)
    rows = cursor.fetchall()
    conn.close()
    return {"results": [_row_to_dict(r) for r in rows], "count": len(rows)}


def tool_get_platform_stats() -> Dict[str, Any]:
    conn = _get_db()
    cursor = conn.cursor()
    stats = {}
    
    for table in ["companies", "lenders", "hot_money_leads", "transactions_full"]:
        try:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            stats[table] = cursor.fetchone()[0]
        except Exception:
            stats[table] = 0
    
    try:
        cursor.execute("SELECT SUM(cash_amount) FROM hot_money_leads")
        stats["total_hot_money"] = cursor.fetchone()[0] or 0
    except Exception:
        stats["total_hot_money"] = 0
    
    try:
        cursor.execute("SELECT SUM(sale_price) FROM transactions_full")
        stats["total_volume"] = cursor.fetchone()[0] or 0
    except Exception:
        stats["total_volume"] = 0
    
    conn.close()
    return stats


def tool_analyze_deal(deal_text: str) -> Dict[str, Any]:
    """Run OpenClaw pipeline on deal text."""
    try:
        import sys
        openclaw_path = Path("/home/jamie/Desktop/openclaw")
        sys.path.insert(0, str(openclaw_path))
        from openclaw_v3 import get_v3
        
        v3 = get_v3()
        result = v3.analyze_deal(deal_text)
        return {
            "assessment": result.assessment,
            "confidence": result.confidence,
            "detected_signals": [s.dict() if hasattr(s, "dict") else str(s) for s in result.detected_signals],
        }
    except Exception as e:
        return {"error": str(e), "note": "OpenClaw pipeline not available"}


def tool_search_vault(query: str, limit: int = 5) -> Dict[str, Any]:
    try:
        from obsidian_connector import get_vault_connector
        connector = get_vault_connector()
        results = connector.search_vault(query)
        return {"results": results[:limit], "count": len(results[:limit])}
    except Exception as e:
        return {"error": str(e), "results": []}


# ---------------------------------------------------------------------------
# Registry
# ---------------------------------------------------------------------------

TOOL_MAP = {
    "search_hot_money": tool_search_hot_money,
    "search_buyers": tool_search_buyers,
    "search_lenders": tool_search_lenders,
    "search_transactions": tool_search_transactions,
    "get_platform_stats": tool_get_platform_stats,
    "analyze_deal": tool_analyze_deal,
    "search_vault": tool_search_vault,
}


def execute_tool(name: str, args: Dict[str, Any]) -> Dict[str, Any]:
    """Execute a tool by name with JSON args."""
    if name not in TOOL_MAP:
        return {"error": f"Unknown tool: {name}"}
    try:
        result = TOOL_MAP[name](**args)
        return {"tool": name, "result": result, "status": "ok"}
    except Exception as e:
        return {"tool": name, "error": str(e), "status": "error"}


def get_tool_schemas_json() -> str:
    """Return tool schemas as JSON for the LLM system prompt."""
    return json.dumps(TOOL_SCHEMAS, indent=2)
