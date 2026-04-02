#!/usr/bin/env python3
"""
Realtor Bot API
Smart agent search with database + Google + Realtor.ca fallback
Saves new agents to database with quick links
"""

import json
import sqlite3
import re
import asyncio
import aiohttp
from pathlib import Path
from typing import Optional, Dict, List
from datetime import datetime
from urllib.parse import quote_plus
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, BackgroundTasks

# Database path
DB_PATH = Path('/home/jamie/Desktop/Jamie\'s Personal Vault/bigdataclaw/bigdataclaw.db')

# Router
router = APIRouter(prefix="/api/realtor-bot", tags=["Realtor Bot"])

# Google Search API (Serper.dev or similar)
SERPER_API_KEY = "YOUR_SERPER_API_KEY"  # Set via environment variable

def get_db():
    """Get database connection"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

class SearchRequest(BaseModel):
    query: str
    context: Optional[str] = ""  # Which page the search is from
    
class AgentFoundResponse(BaseModel):
    source: str  # 'database', 'google', 'realtor.ca'
    agent_id: Optional[int] = None
    name: str
    brokerage: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    linkedin: Optional[str] = None
    photo_url: Optional[str] = None
    profile_url: Optional[str] = None
    quick_links: Optional[Dict] = None
    is_new: bool = False
    saved_to_db: bool = False

async def search_database(query: str) -> List[Dict]:
    """Search local database for agents"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Search in recruiters table
    search_terms = query.split()
    conditions = []
    params = []
    
    for term in search_terms:
        conditions.append("(name LIKE ? OR brokerage LIKE ? OR city LIKE ?)")
        params.extend([f"%{term}%", f"%{term}%", f"%{term}%"])
    
    where_clause = " AND ".join(conditions) if conditions else "1=1"
    
    cursor.execute(f"""
        SELECT id, name, email, brokerage, city, phone, linkedin, 
               quick_links, status, created_at
        FROM recruiters
        WHERE {where_clause}
        ORDER BY 
            CASE WHEN name LIKE ? THEN 1 ELSE 2 END,
            name
        LIMIT 10
    """, params + [f"%{query}%"])
    
    results = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return results

async def search_google(query: str) -> List[Dict]:
    """Search Google for agent information"""
    results = []
    
    try:
        # Construct search query
        search_query = f"{query} realtor.ca agent"
        
        # Using Serper.dev API (free tier available)
        async with aiohttp.ClientSession() as session:
            async with session.post(
                'https://google.serper.dev/search',
                headers={'X-API-KEY': SERPER_API_KEY},
                json={'q': search_query, 'num': 5}
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    for item in data.get('organic', []):
                        # Extract agent info from search results
                        title = item.get('title', '')
                        snippet = item.get('snippet', '')
                        link = item.get('link', '')
                        
                        # Try to extract name from title
                        name_match = re.search(r'^([A-Za-z\s]+?)(?:\s*-|\s*\||\s*\()', title)
                        name = name_match.group(1).strip() if name_match else query
                        
                        # Try to extract brokerage
                        brokerage_match = re.search(r'(?:at|with|of)\s+([A-Z][A-Za-z\s]+?)(?:\s*-|\s*\||$)', title)
                        brokerage = brokerage_match.group(1).strip() if brokerage_match else None
                        
                        results.append({
                            'source': 'google',
                            'name': name,
                            'brokerage': brokerage,
                            'snippet': snippet,
                            'link': link,
                            'title': title
                        })
                        
    except Exception as e:
        print(f"Google search error: {e}")
    
    return results

async def search_realtor_ca(agent_name: str) -> Optional[Dict]:
    """Search Realtor.ca for agent profile"""
    try:
        # Construct Realtor.ca search URL
        search_url = f"https://www.realtor.ca/agent/#name={quote_plus(agent_name)}"
        
        # Note: This would need a proper scraper or API
        # For now, return structured data that could be filled by a scraper
        return {
            'source': 'realtor.ca',
            'search_url': search_url,
            'name': agent_name,
            'profile_found': False,  # Would be True if scraper finds profile
            'brokerage': None,
            'phone': None,
            'photo_url': None,
            'profile_url': None
        }
        
    except Exception as e:
        print(f"Realtor.ca search error: {e}")
        return None

def generate_quick_links(name: str, brokerage: Optional[str] = None, city: Optional[str] = None) -> Dict:
    """Generate quick links for an agent"""
    name_query = quote_plus(name)
    
    links = {
        'google': f"https://www.google.com/search?q={name_query}+realtor",
        'linkedin': f"https://www.linkedin.com/search/results/people/?keywords={name_query}",
        'facebook': f"https://www.facebook.com/search/people/?q={name_query}",
        'realtor_ca': f"https://www.realtor.ca/agent/#name={name_query}",
    }
    
    if brokerage:
        links['brokerage_google'] = f"https://www.google.com/search?q={quote_plus(brokerage)}+realtor+canada"
    
    return links

def save_agent_to_db(agent_data: Dict) -> int:
    """Save new agent to database with quick links"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Generate quick links
    quick_links = generate_quick_links(
        agent_data.get('name', ''),
        agent_data.get('brokerage'),
        agent_data.get('city')
    )
    
    cursor.execute("""
        INSERT INTO recruiters 
        (name, email, brokerage, city, phone, linkedin, quick_links, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    """, (
        agent_data.get('name'),
        agent_data.get('email'),
        agent_data.get('brokerage'),
        agent_data.get('city'),
        agent_data.get('phone'),
        agent_data.get('linkedin'),
        json.dumps(quick_links),
        'new'
    ))
    
    agent_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return agent_id

def extract_contact_info(text: str) -> Dict:
    """Extract phone and email from text"""
    info = {}
    
    # Phone patterns
    phone_patterns = [
        r'(\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})',
        r'(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})',
    ]
    
    for pattern in phone_patterns:
        match = re.search(pattern, text)
        if match:
            info['phone'] = match.group(1)
            break
    
    # Email pattern
    email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    email_match = re.search(email_pattern, text)
    if email_match:
        info['email'] = email_match.group(0)
    
    return info

@router.post("/search")
async def search_agents(request: SearchRequest, background_tasks: BackgroundTasks):
    """
    Main search endpoint - searches database first, then Google + Realtor.ca
    Saves new agents to database with quick links
    """
    results = {
        'query': request.query,
        'from_database': [],
        'from_google': [],
        'from_realtor_ca': [],
        'saved_new': [],
        'total_found': 0
    }
    
    # 1. Search database first
    db_results = await search_database(request.query)
    for agent in db_results:
        agent['source'] = 'database'
        agent['is_new'] = False
        agent['saved_to_db'] = True
        agent['quick_links'] = json.loads(agent.get('quick_links', '{}')) if agent.get('quick_links') else {}
        results['from_database'].append(agent)
    
    results['total_found'] += len(db_results)
    
    # 2. If not enough results, search Google
    if len(db_results) < 3:
        google_results = await search_google(request.query)
        
        for item in google_results:
            # Check if this agent is already in database
            is_duplicate = any(
                db['name'].lower() == item['name'].lower() 
                for db in results['from_database']
            )
            
            if not is_duplicate:
                # Extract contact info from snippet
                contact_info = extract_contact_info(item.get('snippet', ''))
                
                agent_data = {
                    'name': item['name'],
                    'brokerage': item.get('brokerage'),
                    'source': 'google',
                    'is_new': True,
                    'saved_to_db': False,
                    'snippet': item.get('snippet'),
                    'link': item.get('link'),
                    **contact_info
                }
                
                results['from_google'].append(agent_data)
                
                # Save to database in background
                try:
                    agent_id = save_agent_to_db(agent_data)
                    agent_data['agent_id'] = agent_id
                    agent_data['saved_to_db'] = True
                    agent_data['quick_links'] = generate_quick_links(
                        agent_data['name'], 
                        agent_data.get('brokerage')
                    )
                    results['saved_new'].append(agent_data)
                except Exception as e:
                    print(f"Error saving agent: {e}")
        
        results['total_found'] += len(results['from_google'])
    
    # 3. Also search Realtor.ca
    realtor_result = await search_realtor_ca(request.query)
    if realtor_result:
        results['from_realtor_ca'].append(realtor_result)
    
    return results

@router.get("/agent/{agent_id}")
async def get_agent_details(agent_id: int):
    """Get detailed information about a specific agent"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT * FROM recruiters WHERE id = ?
    """, (agent_id,))
    
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    agent = dict(row)
    if agent.get('quick_links'):
        agent['quick_links'] = json.loads(agent['quick_links'])
    
    return agent

@router.post("/enrich/{agent_id}")
async def enrich_agent_data(agent_id: int):
    """Enrich agent data by searching for additional information"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT name, brokerage, city FROM recruiters WHERE id = ?", (agent_id,))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Agent not found")
    
    agent_data = dict(row)
    
    # Search for more info
    search_query = f"{agent_data['name']} realtor"
    if agent_data.get('brokerage'):
        search_query += f" {agent_data['brokerage']}"
    
    # This would do actual enrichment
    # For now, just update quick links
    quick_links = generate_quick_links(
        agent_data['name'],
        agent_data.get('brokerage'),
        agent_data.get('city')
    )
    
    cursor.execute("""
        UPDATE recruiters 
        SET quick_links = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (json.dumps(quick_links), agent_id))
    
    conn.commit()
    conn.close()
    
    return {
        'agent_id': agent_id,
        'enriched': True,
        'quick_links': quick_links
    }

@router.get("/stats")
async def get_bot_stats():
    """Get statistics about Realtor Bot usage"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) as total FROM recruiters")
    total_agents = cursor.fetchone()['total']
    
    cursor.execute("""
        SELECT COUNT(*) as new_this_week 
        FROM recruiters 
        WHERE created_at >= date('now', '-7 days')
    """)
    new_this_week = cursor.fetchone()['new_this_week']
    
    cursor.execute("""
        SELECT brokerage, COUNT(*) as count 
        FROM recruiters 
        WHERE brokerage IS NOT NULL
        GROUP BY brokerage 
        ORDER BY count DESC 
        LIMIT 5
    """)
    top_brokerages = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    
    return {
        'total_agents': total_agents,
        'new_this_week': new_this_week,
        'top_brokerages': top_brokerages
    }

# Chat responses for the bot
CHAT_RESPONSES = {
    'greeting': [
        "👋 Hi! I'm your Realtor Assistant. I can help you find and research agents across Canada.",
        "Looking for an agent? I can search our database of 96,000+ realtors, or find new ones online.",
        "Hello! Tell me which agent you're looking for and I'll find their information."
    ],
    'searching': [
        "🔍 Searching our database and external sources...",
        "Let me look that up for you...",
        "Searching for {query}..."
    ],
    'found_database': [
        "✅ Found {count} agents in our database!",
        "Great! I found {count} matching agents.",
    ],
    'found_new': [
        "🌐 I also found {count} new agents online. Saving them to our database...",
        "Found {count} additional agents from Google. Adding them now..."
    ],
    'not_found': [
        "I couldn't find '{query}' in our database. Let me search online...",
        "No matches in our database. Searching Google and Realtor.ca..."
    ],
    'saved': [
        "💾 Saved {count} new agents to the database with quick links!",
        "Added {count} new agents. They now have Google, LinkedIn, and social media links ready!"
    ],
    'skills': [
        "I can:\n• Search 96,000+ agents in our database\n• Find agents on Google\n• Check Realtor.ca\n• Generate quick research links\n• Save new agents automatically"
    ]
}

@router.post("/chat")
async def chat_with_bot(message: Dict):
    """Chat endpoint for the Realtor Bot"""
    user_message = message.get('message', '').lower()
    context = message.get('context', '')
    
    # Simple intent detection
    if any(word in user_message for word in ['hi', 'hello', 'hey']):
        return {
            'response': "👋 Hi! I'm your Realtor Assistant. I can help you find and research agents across Canada. Just tell me the agent's name!",
            'suggestions': ['Find John Smith', 'Search Toronto agents', 'Show me my stats']
        }
    
    elif any(word in user_message for word in ['skill', 'can you', 'what can']):
        return {
            'response': "🤖 Here's what I can do:\n\n🔍 **Search Database** - 96,000+ agents\n🌐 **Google Search** - Find agents online\n🏠 **Realtor.ca** - Check official profiles\n🔗 **Quick Links** - Auto-generate research links\n💾 **Auto-Save** - Add new agents to database\n\nJust tell me who you're looking for!",
            'suggestions': ['Find an agent', 'Search by city', 'How does it work?']
        }
    
    elif any(word in user_message for word in ['stat', 'how many', 'total']):
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as total FROM recruiters")
        total = cursor.fetchone()['total']
        conn.close()
        
        return {
            'response': f"📊 Currently tracking **{total:,} agents** in our database!\n\nI can search all of them instantly, and if I don't find who you're looking for, I'll search Google and Realtor.ca to find them.",
            'suggestions': ['Search for an agent', 'Show recent additions', 'Find top brokerages']
        }
    
    elif 'find' in user_message or 'search' in user_message:
        # Extract search query
        query = user_message.replace('find', '').replace('search', '').replace('for', '').strip()
        
        if query:
            return {
                'response': f"🔍 Searching for '{query}'...",
                'action': 'search',
                'query': query,
                'loading': True
            }
        else:
            return {
                'response': "What agent would you like me to find? Just tell me their name!",
                'suggestions': ['John Smith', 'Sarah Johnson Toronto', 'Agents at RE/MAX']
            }
    
    else:
        # Treat as search query
        return {
            'response': f"🔍 I'll search for '{user_message}'...",
            'action': 'search',
            'query': user_message,
            'loading': True
        }
