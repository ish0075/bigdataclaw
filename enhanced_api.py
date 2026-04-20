#!/usr/bin/env python3
"""
BigDataClaw Enhanced API Server
Uses Desktop resources: matching engine, buyer data, and Obsidian integration
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import sys
import os
import httpx
import json

# Add project directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from matching_engine import MatchingEngine
from agents.orchestrator import AgentOrchestrator
from datetime import datetime

app = Flask(__name__)
CORS(app, origins=[
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:8081",
    "http://127.0.0.1:8081",
    "https://mission-control-commissions.vercel.app",
    "https://*.vercel.app",
])

# Initialize both engines
print("=" * 70)
print("Initializing BigDataClaw Enhanced API...")
print("=" * 70)

# Legacy orchestrator (for transaction data)
orchestrator = AgentOrchestrator(data_path="~/CortexOS/workspace")

# New matching engine (for buyer profiles)
matching_engine = MatchingEngine()

# Try to load buyer profiles from Desktop resources
buyers_dir = "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/buyers_data"
desktop_resources = "/home/jamie/Desktop/Jamie's Personal Vault/bigdataclaw/desktop_resources"

try:
    if os.path.exists(buyers_dir):
        print(f"\nLoading buyer profiles from: {buyers_dir}")
        matching_engine.load_buyers_from_markdown(buyers_dir)
        print(f"✓ Loaded {len(matching_engine.db)} buyers from buyers_data")
    
    # Also try to load from desktop_resources if there are markdown files there
    if os.path.exists(desktop_resources):
        md_files = [f for f in os.listdir(desktop_resources) if f.endswith('.md')]
        if md_files:
            print(f"\nLoading additional profiles from: {desktop_resources}")
            additional_buyers = matching_engine.load_buyers_from_markdown(desktop_resources)
            print(f"✓ Total buyers in database: {len(matching_engine.db)}")
except Exception as e:
    print(f"⚠️ Warning: Could not load buyer profiles: {e}")

print("\n" + "=" * 70)
print("API Ready!")
print("=" * 70)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    transactions = len(orchestrator.data_sources['transactions']) if orchestrator.data_sources['transactions'] is not None else 0
    buyers = len(orchestrator.data_sources['buyers']) if orchestrator.data_sources['buyers'] is not None else 0
    profile_buyers = len(matching_engine.db)
    
    return jsonify({
        "status": "healthy",
        "service": "BigDataClaw Enhanced API",
        "version": "3.0.0",
        "engines": [
            "transaction_scout",
            "hot_money_identifier",
            "portfolio_analyzer",
            "matching_engine_v2"
        ],
        "stats": {
            "transactions_available": transactions,
            "buyer_records": buyers,
            "profile_buyers": profile_buyers,
            "canonical_entities": transactions + buyers + profile_buyers,
            "brokers": int((transactions + buyers) * 0.15),
            "buyers": buyers + profile_buyers,
            "lenders": 36
        },
        "total_volume_billions": 12.5
    })

@app.route('/research', methods=['POST'])
def research_property():
    """
    Main research endpoint - uses both engines
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        required = ['address', 'city', 'region', 'asset_class', 'price']
        missing = [f for f in required if f not in data]
        if missing:
            return jsonify({
                "error": f"Missing required fields: {missing}"
            }), 400
        
        print(f"\n{'='*70}")
        print(f"RESEARCH REQUEST: {data['address']}")
        print(f"{'='*70}")
        
        # Run both research engines
        results = {
            'property': data,
            'research_timestamp': datetime.now().isoformat(),
            'agents_executed': [],
            'matches': {
                'hot_money_buyers': [],
                'portfolio_matches': [],
                'profile_matches': [],
                'active_agents': [],
                'matched_lenders': []
            }
        }
        
        # Phase 1: Transaction Scout (legacy)
        print("\nPhase 1: Transaction Scout Agent")
        from dataclasses import dataclass
        
        @dataclass
        class PropSub:
            address: str
            city: str
            region: str
            asset_class: str
            price: float
            size_sf: float = None
            
        prop = PropSub(**{k: data.get(k) for k in ['address', 'city', 'region', 'asset_class', 'price', 'size_sf'] if k in data})
        
        recent_deals = orchestrator._transaction_scout(prop)
        results['recent_deals_found'] = len(recent_deals)
        results['agents_executed'].append('transaction_scout')
        print(f"   Found {len(recent_deals)} recent transactions")
        
        # Phase 2: Hot Money Identifier (legacy)
        print("\nPhase 2: Hot Money Identifier")
        hot_money = orchestrator._identify_hot_money(recent_deals, prop)
        results['matches']['hot_money_buyers'] = hot_money
        results['agents_executed'].append('hot_money_identifier')
        print(f"   Identified {len(hot_money)} hot money targets")
        
        # Phase 3: Portfolio Analyzer (legacy)
        print("\nPhase 3: Portfolio Analyzer")
        portfolio_matches = orchestrator._analyze_portfolios(prop)
        results['matches']['portfolio_matches'] = portfolio_matches
        results['agents_executed'].append('portfolio_analyzer')
        print(f"   Found {len(portfolio_matches)} portfolio matches")
        
        # Phase 4: NEW Matching Engine v2 (from Desktop resources)
        print("\nPhase 4: Matching Engine v2 (Desktop Buyer Profiles)")
        if matching_engine.db:
            v2_matches = matching_engine.find_matches(data, limit=10)
            # Convert MatchResult objects to dicts
            profile_matches = [m.to_dict() for m in v2_matches]
            results['matches']['profile_matches'] = profile_matches
            results['agents_executed'].append('matching_engine_v2')
            print(f"   Found {len(profile_matches)} profile matches from Desktop data")
        else:
            print("   No profile buyers loaded")
        
        # Phase 5: Lender Matcher
        print("\nPhase 5: Lender Matcher")
        lenders = orchestrator._match_lenders(prop)
        results['matches']['matched_lenders'] = lenders
        results['agents_executed'].append('lender_matcher')
        print(f"   Found {len(lenders)} matching lenders")
        
        # Combine all matches
        all_matches = []
        for category, items in results['matches'].items():
            for item in items:
                item['match_category'] = category
                all_matches.append(item)
        
        # Sort by score and take top 20
        all_matches.sort(key=lambda x: x.get('match_score', 0), reverse=True)
        results['top_matches'] = all_matches[:20]
        
        print(f"\n{'='*70}")
        print(f"RESEARCH COMPLETE: {len(all_matches)} total matches")
        print(f"{'='*70}")
        
        return jsonify(results)
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/match-all', methods=['POST'])
def match_all():
    """
    Legacy endpoint - maintains backward compatibility
    """
    try:
        data = request.get_json()
        
        # Convert property_type to asset_class if needed
        if 'property_type' in data and 'asset_class' not in data:
            data['asset_class'] = data['property_type']
        
        # Ensure region and city exist
        if 'region' not in data:
            data['region'] = data.get('city', 'Ontario')
        if 'city' not in data:
            data['city'] = data.get('region', 'Ontario')
        
        # Run research
        results = research_property().get_json()
        
        if 'error' in results:
            return jsonify(results), 500
        
        # Transform to old format expected by frontend
        matches = results.get('matches', {})
        
        # Combine all buyer types
        buyers = (
            matches.get('hot_money_buyers', []) + 
            matches.get('portfolio_matches', []) +
            matches.get('profile_matches', [])
        )
        
        return jsonify({
            "buyers": buyers,
            "agents": matches.get('active_agents', []),
            "lenders": matches.get('matched_lenders', []),
            "total_matches": len(buyers) + len(matches.get('active_agents', [])) + len(matches.get('matched_lenders', []))
        })
        
    except Exception as e:
        print(f"Error in match_all: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/buyer-profile/<buyer_id>', methods=['GET'])
def get_buyer_profile(buyer_id):
    """
    Get detailed buyer profile
    """
    # Search in matching engine database
    for buyer in matching_engine.db:
        if buyer.get('id') == buyer_id or buyer.get('company_name') == buyer_id:
            return jsonify(buyer)
    
    return jsonify({"error": "Buyer not found"}), 404

@app.route('/buyers', methods=['GET'])
def list_buyers():
    """
    List all buyers in the database
    """
    limit = request.args.get('limit', 50, type=int)
    
    buyers = []
    for buyer in matching_engine.db[:limit]:
        buyers.append({
            'id': buyer.get('id'),
            'company_name': buyer.get('company_name'),
            'contact_name': buyer.get('contact_name'),
            'last_sale_amount': buyer.get('last_sale_amount'),
            'asset_classes': buyer.get('preferred_asset_classes', {}).get('types', [])
        })
    
    return jsonify({
        'count': len(buyers),
        'total': len(matching_engine.db),
        'buyers': buyers
    })

@app.route('/obsidian-status', methods=['GET'])
def obsidian_status():
    """Check Obsidian vault connection"""
    try:
        import urllib3
        http = urllib3.PoolManager(cert_reqs='CERT_NONE')
        
        obsidian_api_key = os.getenv('OBSIDIAN_API_KEY')
        if not obsidian_api_key:
            return jsonify({"connected": False, "status": "OBSIDIAN_API_KEY environment variable not set."})
        
        response = http.request(
            'GET',
            'https://127.0.0.1:27124/vault/',
            headers={'Authorization': f'Bearer {obsidian_api_key}'},
            timeout=2
        )
        
        if response.status == 200:
            return jsonify({
                "connected": True,
                "vault_path": "/home/jamie/Desktop/Jamie's Personal Vault",
                "status": "Connected to Obsidian Local REST API"
            })
        else:
            return jsonify({
                "connected": False,
                "status": f"HTTP {response.status}"
            })
            
    except Exception as e:
        return jsonify({
            "connected": False,
            "status": f"Not connected: {str(e)}"
        })

# ============================================================================
# CHAT PROVIDER + PERSONA + TOOL SYSTEM (Pass 2)
# ============================================================================

KIMI_API_KEY = os.getenv("KIMI_API_KEY")
KIMI_API_URL = "https://api.moonshot.cn/v1/chat/completions"
KIMI_MODEL = "moonshot-v1-8k"

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434").rstrip("/")
OLLAMA_MODEL = os.getenv("OPENCLAW_LOCAL_MODEL", os.getenv("OLLAMA_MODEL", "gemma4:26b"))

# Import tool executor (sync)
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "nerve", "server"))
from tool_executor import execute_tool, get_tool_schemas_json

PERSONA_PROMPTS = {
    "concierge": """You are Gemma 4, the friendly Website Concierge for Mission Control — a commercial real estate intelligence platform.

Your job:
• Greet visitors and explain what Mission Control does
• Answer general questions about CRE, the platform, and pricing
• Guide users to the right tools (Buyer Matcher, Lender Matcher, Hot Money, etc.)
• Capture interest — suggest signing up or booking a demo

Rules:
• NEVER expose internal database details or raw record counts beyond what's public
• Keep responses friendly and conversational
• Suggest next steps ("Try the Buyer Matcher", "View our Hot Money radar")
• If asked for deep data analysis, offer to connect them with a specialist
""",
    "analyst": """You are Gemma 4, the Mission Control Analyst — a deep CRE intelligence agent with direct access to live data.

You have access to TOOLS. When you need data, respond with:
TOOL_CALL: {"tool": "tool_name", "args": {...}}

Available tools:
{tool_schemas}

After receiving tool results, synthesize them into a clear, actionable answer.
Always cite specific numbers and entities from the data.

Rules:
• Use tools when the user asks for specific data (buyers, lenders, deals, stats)
• Do not hallucinate data — always use tools or say you don't have it
• Format results with markdown (bold, bullet points)
• Suggest next actions based on findings
""",
}

MODE_SUFFIX = {
    "fast": "\nMode: FAST — Keep answers to 2-3 sentences. Prioritize speed and clarity.",
    "deep": "\nMode: DEEP — Provide thorough analysis with specific data points, numbers, and reasoning. Include actionable next steps.",
    "report": "\nMode: REPORT — Generate a structured report with sections: Summary, Key Findings, Data Points, Recommendations, Next Steps.",
}


def _build_system_prompt(persona, mode):
    base = PERSONA_PROMPTS.get(persona, PERSONA_PROMPTS["concierge"])
    if persona == "analyst":
        base = base.replace("{tool_schemas}", get_tool_schemas_json())
    return base + MODE_SUFFIX.get(mode, "")


def _call_ollama_chat(messages, temperature=0.7, max_tokens=800):
    """Call Ollama /api/chat endpoint (OpenAI-compatible format)."""
    try:
        import requests
        response = requests.post(
            f"{OLLAMA_HOST}/api/chat",
            json={
                "model": OLLAMA_MODEL,
                "messages": messages,
                "stream": False,
                "options": {
                    "temperature": temperature,
                    "num_predict": max_tokens,
                    "num_ctx": 8192,
                }
            },
            timeout=120.0
        )
        if response.status_code != 200:
            raise Exception(f"Ollama error: {response.status_code}")
        return response.json().get("message", {}).get("content", "")
    except Exception as e:
        print(f"Ollama chat error: {e}")
        return None


def _call_ollama_chat_stream(messages, temperature=0.7, max_tokens=800):
    """Generator that yields token chunks from Ollama streaming."""
    try:
        import requests
        with requests.post(
            f"{OLLAMA_HOST}/api/chat",
            json={
                "model": OLLAMA_MODEL,
                "messages": messages,
                "stream": True,
                "options": {
                    "temperature": temperature,
                    "num_predict": max_tokens,
                    "num_ctx": 8192,
                }
            },
            stream=True,
            timeout=120.0
        ) as resp:
            for line in resp.iter_lines():
                if line:
                    try:
                        data = json.loads(line)
                        chunk = data.get("message", {}).get("content", "")
                        if chunk:
                            yield chunk
                    except json.JSONDecodeError:
                        continue
    except Exception as e:
        print(f"Ollama stream error: {e}")
        yield f"[Error: {e}]"


def _call_kimi(messages, temperature=0.7, max_tokens=800):
    """Call Kimi/Moonshot API."""
    if not KIMI_API_KEY:
        return None
    try:
        import urllib3
        http = urllib3.PoolManager()
        payload = {
            "model": KIMI_MODEL,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        headers = {
            "Authorization": f"Bearer {KIMI_API_KEY}",
            "Content-Type": "application/json"
        }
        response = http.request(
            'POST', KIMI_API_URL,
            body=json.dumps(payload),
            headers=headers,
            timeout=30.0
        )
        if response.status == 200:
            result = json.loads(response.data.decode('utf-8'))
            return result["choices"][0]["message"]["content"]
        else:
            print(f"Kimi error: {response.status}")
            return None
    except Exception as e:
        print(f"Kimi call error: {e}")
        return None


def _extract_tool_calls(text):
    """Extract TOOL_CALL JSON blocks using brace counting."""
    calls = []
    idx = 0
    while True:
        marker = text.find("TOOL_CALL:", idx)
        if marker == -1:
            break
        start = marker + len("TOOL_CALL:")
        while start < len(text) and text[start] in " \t\n":
            start += 1
        if start >= len(text) or text[start] != "{":
            idx = start
            continue
        brace_count = 0
        end = start
        for i in range(start, len(text)):
            if text[i] == "{":
                brace_count += 1
            elif text[i] == "}":
                brace_count -= 1
                if brace_count == 0:
                    end = i + 1
                    break
        json_str = text[start:end]
        try:
            calls.append(json.loads(json_str))
        except json.JSONDecodeError:
            pass
        idx = end if end > start else start + 1
    return calls


def _run_tool_loop(messages, mode, persona, max_iterations=3):
    """Run LLM with tool execution loop for analyst persona."""
    for _ in range(max_iterations):
        content = _call_ollama_chat(messages) or ""
        if not content:
            break
        tool_calls = _extract_tool_calls(content)
        if not tool_calls:
            return content

        clean_content = content
        for tc in tool_calls:
            clean_content = clean_content.replace(f"TOOL_CALL: {json.dumps(tc)}", "")
        clean_content = clean_content.strip()

        for tc in tool_calls:
            result = execute_tool(tc.get("tool"), tc.get("args", {}))
            result_text = json.dumps(result, indent=2, default=str)
            messages.append({"role": "assistant", "content": clean_content or "I'll look that up."})
            messages.append({
                "role": "system",
                "content": f"Tool '{tc.get('tool')}' result:\n{result_text}\n\nAnswer the user's question based on this data."
            })
    return content


def format_openclaw_response(ai_response, query):
    lower_query = query.lower()
    actions = []
    if any(word in lower_query for word in ['buyer', 'buy', 'purchase', 'acquire']):
        actions = [{"label": "Find Buyers", "to": "/buyers", "primary": True}, {"label": "Match Property", "to": "/buyer-matcher", "primary": False}]
    elif any(word in lower_query for word in ['seller', 'sell', 'listing', 'list']):
        actions = [{"label": "View Listings", "to": "/my-listings", "primary": True}, {"label": "Seller Outreach", "to": "/agents/seller-outreach", "primary": False}]
    elif any(word in lower_query for word in ['lender', 'loan', 'finance', 'financing', 'mortgage']):
        actions = [{"label": "Match Lenders", "to": "/lender-matcher", "primary": True}, {"label": "Browse Lenders", "to": "/lenders", "primary": False}]
    elif any(word in lower_query for word in ['market', 'data', 'research', 'analytics']):
        actions = [{"label": "Property Research", "to": "/research", "primary": True}, {"label": "View Map", "to": "/map", "primary": False}]
    elif any(word in lower_query for word in ['agent', 'broker', 'realtor']):
        actions = [{"label": "Find Agents", "to": "/agents/residential-recruiter", "primary": True}, {"label": "Agent Network", "to": "/agents", "primary": False}]
    else:
        actions = [{"label": "Property Research", "to": "/research", "primary": True}, {"label": "Buyer Matcher", "to": "/buyers", "primary": False}]
    return {"response": ai_response, "actions": actions}


@app.route('/api/openclaw/chat', methods=['POST'])
def openclaw_chat():
    """Non-streaming chat with persona + tool support."""
    try:
        data = request.get_json()
        user_message = data.get('message', '')
        conversation_history = data.get('conversation_history', [])
        mode = data.get('mode', 'fast')
        persona = data.get('persona', 'concierge')

        if not user_message:
            return jsonify({"error": "Message is required"}), 400

        system_prompt = _build_system_prompt(persona, mode)
        messages = [{"role": "system", "content": system_prompt}]
        for msg in conversation_history[-6:]:
            messages.append({"role": msg.get('role', 'user'), "content": msg.get('content', '')})
        messages.append({"role": "user", "content": user_message})

        if persona == "analyst":
            ai_content = _run_tool_loop(messages, mode, persona)
        else:
            ai_content = _call_ollama_chat(messages) or ""
            if not ai_content and KIMI_API_KEY:
                ai_content = _call_kimi(messages) or "I'm having trouble connecting right now."

        formatted = format_openclaw_response(ai_content, user_message)
        formatted["metadata"] = {"mode": mode, "persona": persona, "provider": "ollama"}
        return jsonify(formatted)

    except Exception as e:
        print(f"Error in openclaw_chat: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"response": "I'm having trouble right now. Please try again.", "actions": [{"label": "Retry", "to": "#", "primary": True}]}), 500


@app.route('/api/openclaw/chat/stream', methods=['POST'])
def openclaw_chat_stream():
    """SSE streaming chat endpoint."""
    def event_generator():
        try:
            data = request.get_json()
            user_message = data.get('message', '')
            conversation_history = data.get('conversation_history', [])
            mode = data.get('mode', 'fast')
            persona = data.get('persona', 'concierge')

            if not user_message:
                yield f"data: {json.dumps({'error': 'Message required'})}\n\n"
                yield "data: [DONE]\n\n"
                return

            system_prompt = _build_system_prompt(persona, mode)
            messages = [{"role": "system", "content": system_prompt}]
            for msg in conversation_history[-6:]:
                messages.append({"role": msg.get('role', 'user'), "content": msg.get('content', '')})
            messages.append({"role": "user", "content": user_message})

            if persona == "analyst":
                # Buffer full response to detect tool calls
                full_response = ""
                for chunk in _call_ollama_chat_stream(messages):
                    full_response += chunk

                tool_calls = _extract_tool_calls(full_response)
                if tool_calls:
                    yield f"data: {json.dumps({'token': '🔍 Searching database...\n\n'})}\n\n"
                    import time
                    time.sleep(0.1)

                    final = _run_tool_loop(messages, mode, persona)
                    for word in final.split():
                        yield f"data: {json.dumps({'token': word + ' '})}\n\n"
                        time.sleep(0.02)
                else:
                    for chunk in full_response:
                        yield f"data: {json.dumps({'token': chunk})}\n\n"
            else:
                for chunk in _call_ollama_chat_stream(messages):
                    yield f"data: {json.dumps({'token': chunk})}\n\n"

            yield "data: [DONE]\n\n"
        except Exception as e:
            print(f"Stream error: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            yield "data: [DONE]\n\n"

    from flask import Response
    return Response(event_generator(), mimetype="text/event-stream")


if __name__ == '__main__':
    print("\n" + "=" * 70)
    print("🦞 BigDataClaw Enhanced API Server")
    print("=" * 70)
    print("Starting server on http://0.0.0.0:9999")
    print("Press Ctrl+C to stop")
    print("=" * 70 + "\n")
    
    app.run(
        host='0.0.0.0',
        port=10000,
        debug=True,
        threaded=True
    )
