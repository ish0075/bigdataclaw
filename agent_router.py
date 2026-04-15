"""
Agent Router for Mission Control Voice Agent
Handles intent detection, database queries, and LLM synthesis.
"""
import json
import os
import sqlite3
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime
import httpx

DB_PATH = Path('bigdataclaw.db')
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:14b")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

async def ollama_chat(prompt: str, model: Optional[str] = None, temperature: float = 0.7, max_tokens: int = 1024) -> str:
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
                timeout=60.0
            )
            if response.status_code == 200:
                return response.json().get("response", "").strip()
    except Exception as e:
        print(f"Ollama error: {e}")
    return ""

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
    if any(n in text for n in ["navigate to", "go to ", "open ", "take me to", "show me"]):
        return "navigate"
    if any(b in text for b in ["briefing", "daily report", "today's summary", "what's new today"]):
        return "briefing"
    if any(h in text for h in ["hot money", "cash buyers", "recent leads", "hot leads"]):
        return "hot_money"
    if any(o in text for o in ["opportunities", "deals", "goldmine", "flagged deals"]):
        return "opportunities"
    if any(r in text for r in ["recruiter", "broker", "agent count"]):
        return "recruiters"
    if any(b in text for b in ["buyer", "capital source", "who is buying"]):
        return "buyers"
    if any(p in text for p in ["satellite", "aerial view", "map of", "image of property"]):
        return "satellite"
    if any(p in text for p in ["analyze property", "property details", "research property", "tell me about", "what do you know about"]) \
       and (any(c.isdigit() for c in text) or "street" in text or "avenue" in text or "drive" in text or "road" in text or "blvd" in text):
        return "property_research"
    if any(m in text for m in ["match buyer", "find buyer", "who would buy"]):
        return "buyer_match"
    if any(s in text for s in ["stats", "dashboard numbers", "how many", "total "]):
        return "data_stats"

    # LLM fallback for ambiguous cases
    prompt = f"""Classify the user intent into exactly one of these categories:
greeting, help, navigate, briefing, hot_money, opportunities, recruiters, buyers, property_research, buyer_match, data_stats, satellite, chat.
Respond with only the category name, nothing else.
User message: {message}
Category:"""
    llm_intent = await ollama_chat(prompt, temperature=0.1, max_tokens=32)
    allowed = {"greeting","help","navigate","briefing","hot_money","opportunities","recruiters","buyers","property_research","buyer_match","data_stats","satellite","chat","empty","stop","time","date"}
    intent = llm_intent.strip().lower().replace(" ", "_")
    if intent in allowed:
        return intent
    return "chat"

def get_nav_actions(text: str) -> List[Dict[str, Any]]:
    actions = []
    nav_keywords = ["navigate to", "go to", "open", "take me to", "show me"]
    text_lower = text.lower()
    for kw in nav_keywords:
        if kw in text_lower:
            dest = text_lower.split(kw, 1)[1].strip()
            route_map = {
                "mission control": "/", "home": "/", "dashboard": "/",
                "hot money": "/hotmoney", "opportunities": "/opportunities",
                "paperclip": "/paperclip-dashboard", "listings": "/listings",
                "buyers": "/buyers", "agents": "/agents-matcher", "builders": "/builders",
            }
            for key, route in route_map.items():
                if key in dest:
                    actions.append({"type": "navigate", "route": route})
                    break
            break
    return actions

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
        "SELECT name, city, province, buyer_type FROM buyers ORDER BY name LIMIT ?",
        [limit]
    )
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return {"total": total, "buyers": rows}

async def query_data_stats():
    conn = get_db()
    cursor = conn.cursor()
    stats = {}
    for table in ["recruiters", "buyers", "hot_money_leads", "properties", "opportunities"]:
        try:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            stats[table] = cursor.fetchone()[0]
        except Exception:
            stats[table] = 0
    conn.close()
    return stats

async def extract_property_address(message: str) -> Optional[Dict[str, Any]]:
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
    response = await ollama_chat(prompt, temperature=0.1, max_tokens=256)
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

async def synthesize_response(intent: str, data: Any, user_message: str) -> str:
    if intent == "greeting":
        return "Hello. I am Kimi, your Mission Control Voice Agent. I can help you query deals, check hot money leads, and navigate the dashboard."
    if intent == "help":
        return "You can ask me about hot money leads, distressed deals, navigate to any page, research a property, or search for a specific buyer or lender."
    if intent == "time":
        return "It is " + datetime.now().strftime("%I:%M %p") + "."
    if intent == "date":
        return "Today is " + datetime.now().strftime("%A, %B %d, %Y") + "."
    if intent == "stop":
        return "Stopping speech output."

    prompt = f"""You are Kimi, a concise voice assistant for a commercial real estate dashboard.
User asked: {user_message}
Intent: {intent}
Data: {json.dumps(data)}
Respond in 2-4 sentences max, directly and conversationally. Do not use markdown formatting like **bold** or tables; keep it plain text suitable for text-to-speech."""
    response = await ollama_chat(prompt, temperature=0.6, max_tokens=512)
    if response:
        return response

    # Hard fallbacks
    if intent == "hot_money":
        return f"We have {data.get('total', 0)} hot money leads on file."
    if intent == "opportunities":
        return f"There are {data.get('total', 0)} opportunities in the pipeline right now."
    if intent == "recruiters":
        return f"There are {data.get('total', 0)} recruiters in the database."
    if intent == "buyers":
        return f"There are {data.get('total', 0)} tracked buyers."
    if intent == "data_stats":
        return "Database snapshot: " + ", ".join([f"{k.replace('_', ' ')}: {v}" for k, v in data.items()])
    if intent == "briefing":
        return "Your daily briefing is ready. Stats look strong today."
    if intent == "property_research":
        return f"Property research complete. Here is what I found: {json.dumps(data)}."
    return "I'm not sure how to respond to that."

async def handle_request(message: str, history: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
    intent = await detect_intent(message)
    actions: List[Dict[str, Any]] = []

    if intent == "navigate":
        actions = get_nav_actions(message)
        response = "Navigating now."
    elif intent == "empty":
        response = "I did not catch that. Try asking for hot money, opportunities, or navigating to a page."
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
            response = "Opening the buyer matcher with those details."
            actions.append({"type": "navigate", "route": f"/buyers?search={q}"})
        else:
            response = "Tell me the property address or city and I'll find matching buyers."
    else:
        prompt = f"""You are Mission Control, a concise voice assistant for a real estate intelligence dashboard.
Answer in 2-4 sentences max. Prefer direct spoken-style phrasing.
User request: {message}"""
        if history:
            prompt += f"\nConversation history: {json.dumps(history)}"
        response = await ollama_chat(prompt, temperature=0.7, max_tokens=512)
        if not response:
            response = f"I heard: {message}. The backend agent is running in simple mode. Try asking me to navigate to a page or ask about hot money."

    return {"response": response, "actions": actions, "intent": intent}
