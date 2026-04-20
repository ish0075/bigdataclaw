# Property Research AI Assistant - Optimization Guide

## Current State Analysis

### What's Connected:
- **Frontend:** PropertyChat.jsx component (React)
- **Backend:** Currently calling `/api/chat` endpoint (NOT IMPLEMENTED)
- **Actual AI:** Perplexity API (not Kimi directly)
- **Database:** SQLite (bigdataclaw.db) with 5,666 buyers, 520+ transactions
- **Obsidian Vault:** File system integration

### Current Gaps:
- ❌ No `/api/chat` endpoint exists in backend
- ❌ AI has no database query capabilities
- ❌ No buyer matching functionality in chat
- ❌ No CMA/appraisal tools
- ❌ Basic property extraction only

---

## 🎯 Optimized AI Assistant Architecture

```
┌─────────────────────────────────────────────────────────────┐
│           Property Research Chat (Frontend)                  │
│  - Natural language interface                                │
│  - Voice input                                               │
│  - Document upload (PDF, images)                             │
│  - Real-time responses                                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│           AI Assistant API (Backend)                         │
│                                                              │
│  System Prompt + Tools:                                      │
│  ├── Database Query Tool (SQLite)                           │
│  ├── Buyer Matching Tool                                    │
│  ├── CMA/Appraisal Tool                                     │
│  ├── Property Valuation Tool                                │
│  ├── Offer Analysis Tool                                    │
│  ├── Report Generation Tool                                 │
│  └── Obsidian Export Tool                                   │
│                                                              │
│  LLM: Perplexity/Mistral (via API)                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 SYSTEM PROMPT (Copy & Paste)

```
You are an elite Commercial Real Estate (CRE) Research Assistant with 25+ years of experience in:
- Database management and SQL querying
- Commercial property appraisals and valuations
- Comparative Market Analysis (CMA)
- Investment property underwriting
- Buyer matching and profiling
- Offer analysis and negotiation
- Market research and due diligence
- Financial modeling for CRE

CORE PRINCIPLES:
1. FACTS ONLY - Never speculate or hallucinate. If you don't have data, say "I don't have that information in my database."
2. HONEST & TRANSPARENT - Always cite your sources (database tables, specific records)
3. NUMERIC PRECISION - Always show exact numbers, calculations, and formulas
4. PROFESSIONAL STANDARD - Responses should meet institutional investment standards

DATABASE ACCESS:
You have read access to the following tables:
- buyers (5,666+ qualified buyers with investment criteria)
- transactions (520+ closed deals with pricing)
- hot_money_leads (27+ fresh capital sources)
- properties (active listings)
- lenders (financing sources)
- builders (construction companies)

TOOLS AVAILABLE:
When the user asks a question, determine which tool(s) to use:

1. **DATABASE_QUERY** - For any data retrieval:
   - "Find buyers in Toronto looking for industrial"
   - "What did 123 Main St sell for?"
   - "Show me recent multifamily sales"

2. **BUYER_MATCH** - For matching properties to buyers:
   - "Who would buy this property?"
   - "Match this warehouse to buyers"
   
3. **CMA_ANALYSIS** - For Comparative Market Analysis:
   - "Run a CMA on this property"
   - "What's the market value?"
   - "Show me comparable sales"

4. **APPRAISAL** - For detailed valuation:
   - "Appraise this building"
   - "What's the cap rate?"
   - "Calculate NOI and value"

5. **OFFER_ANALYSIS** - For offer evaluation:
   - "Is $5M a good offer?"
   - "Analyze this purchase price"
   - "What's the ROI at this price?"

6. **GENERATE_REPORT** - For creating reports:
   - "Create an investment memo"
   - "Generate a buyer package"
   - "Export this analysis to Obsidian"

RESPONSE FORMAT:
Always structure your response:

1. **Direct Answer** - Clear, concise response
2. **Data Evidence** - Specific numbers from database
3. **Analysis** - Your expert interpretation
4. **Recommendations** - Actionable next steps
5. **Export Option** - Offer to save to Obsidian

EXAMPLE INTERACTION:

User: "I have a 50,000 SF warehouse in Mississauga. Who are the top 3 buyers?"

Assistant:
"I'll analyze this property and find matching buyers from our database of 5,666 investors.

**DATABASE QUERY RESULTS:**
Found 12 buyers actively seeking industrial in Mississauga/GTA.

**TOP 3 MATCHES:**

1. **Industrial Equities Guelph Corp** (Match Score: 94%)
   - Recent Activity: Purchased $27M property (March 2026)
   - Criteria: 25,000-100,000 SF, I-3/I-4 zoning
   - Contact: [In database]
   - Last Purchase: $27M ($270/SF)
   - **Recommended Offer Range:** $13.5M - $15M ($270-300/SF)

2. **Almak Holdings Inc** (Match Score: 91%)
   - Cash Available: $27M
   - Focus: Industrial, logistics, distribution
   - Recent: Active buyer, 2 transactions last quarter
   - **Recommended Offer Range:** $13M - $14.5M

3. **Peel Mutual Insurance** (Match Score: 88%)
   - Capital: $27M allocated for CRE
   - Preference: Income-producing industrial
   - Timeline: 90-day close capability
   - **Recommended Offer Range:** $12.5M - $14M

**CMA ANALYSIS:**
Based on 8 comparable sales in Mississauga:
- Average Price/SF: $285
- Your Property Estimated Value: $14.25M (range: $13.5M - $15M)
- Cap Rate (est.): 5.8% - 6.2%

**RECOMMENDATION:**
Price at $14.5M ($290/SF) to attract Industrial Equities. They're most active and paying top dollar.

Would you like me to:
1. Generate a full buyer package for these 3?
2. Export this analysis to Obsidian?
3. Research these buyers further?"

---

CRITICAL RULES:
- ALWAYS query database before making recommendations
- ALWAYS show exact numbers and sources
- NEVER guess or estimate without data
- ALWAYS offer to export to Obsidian
- ALWAYS verify calculations
```

---

## 🛠️ Implementation - Backend API

### Step 1: Create `/api/chat` endpoint

```python
# server/main.py - Add this endpoint

from typing import List, Dict, Optional
import json
import re

class ChatRequest(BaseModel):
    message: str
    conversation_history: List[Dict] = []
    property_context: Optional[Dict] = None  # Current form data

class ChatResponse(BaseModel):
    response: str
    extractedData: Optional[Dict] = None
    action: Optional[str] = None  # 'submit', 'none'
    tool_calls: List[Dict] = []  # Track which tools were used
    sources: List[str] = []  # Data sources used

SYSTEM_PROMPT = """[PASTE THE SYSTEM PROMPT FROM ABOVE]"""

@app.post("/api/chat")
async def chat_with_ai(request: ChatRequest):
    """
    Main chat endpoint for Property Research AI Assistant
    """
    try:
        message = request.message
        
        # Step 1: Determine which tools to use
        tool_plan = analyze_intent(message)
        
        # Step 2: Execute database queries if needed
        query_results = {}
        if tool_plan["needs_database"]:
            query_results["database"] = execute_database_query(message)
        
        if tool_plan["needs_buyer_match"]:
            query_results["buyers"] = match_buyers(
                property_type=tool_plan.get("property_type"),
                location=tool_plan.get("location"),
                price_range=tool_plan.get("price_range")
            )
        
        if tool_plan["needs_cma"]:
            query_results["cma"] = generate_cma(
                address=tool_plan.get("address"),
                property_type=tool_plan.get("property_type")
            )
        
        # Step 3: Build enhanced prompt with data
        enhanced_prompt = build_enhanced_prompt(
            system_prompt=SYSTEM_PROMPT,
            user_message=message,
            conversation_history=request.conversation_history,
            query_results=query_results,
            property_context=request.property_context
        )
        
        # Step 4: Call LLM API
        llm_response = await call_llm_api(enhanced_prompt)
        
        # Step 5: Extract any form data updates
        extracted_data = extract_property_data(llm_response, message)
        
        # Step 6: Check for action triggers
        action = detect_action(message, llm_response)
        
        return ChatResponse(
            response=llm_response,
            extractedData=extracted_data if extracted_data else None,
            action=action,
            tool_calls=tool_plan["tools_used"],
            sources=list(query_results.keys())
        )
        
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


def analyze_intent(message: str) -> Dict:
    """
    Analyze user message to determine which tools to use
    """
    message_lower = message.lower()
    tools_used = []
    
    # Database query patterns
    database_keywords = [
        "find", "show", "list", "search", "query", "who", "what", "when",
        "buyer", "transaction", "sale", "sold", "price", "purchased"
    ]
    needs_database = any(kw in message_lower for kw in database_keywords)
    if needs_database:
        tools_used.append("DATABASE_QUERY")
    
    # Buyer match patterns
    buyer_match_keywords = [
        "match", "buyer", "who would buy", "interested", "looking for",
        "potential buyer", "prospect"
    ]
    needs_buyer_match = any(kw in message_lower for kw in buyer_match_keywords)
    if needs_buyer_match:
        tools_used.append("BUYER_MATCH")
    
    # CMA patterns
    cma_keywords = [
        "cma", "comparative", "market analysis", "market value", "worth",
        "valuation", "appraise", "comparable", "comps"
    ]
    needs_cma = any(kw in message_lower for kw in cma_keywords)
    if needs_cma:
        tools_used.append("CMA_ANALYSIS")
    
    # Appraisal patterns
    appraisal_keywords = [
        "appraisal", "appraise", "cap rate", "noi", "net operating income",
        "value", "valuation", "assessment"
    ]
    needs_appraisal = any(kw in message_lower for kw in appraisal_keywords)
    if needs_appraisal:
        tools_used.append("APPRAISAL")
    
    # Offer analysis
    offer_keywords = [
        "offer", "bid", "purchase price", "asking price", "good deal",
        "should i pay", "worth it", "roi", "return"
    ]
    needs_offer = any(kw in message_lower for kw in offer_keywords)
    if needs_offer:
        tools_used.append("OFFER_ANALYSIS")
    
    # Extract property details from message
    property_type = extract_property_type(message)
    location = extract_location(message)
    price_range = extract_price_range(message)
    address = extract_address(message)
    
    return {
        "needs_database": needs_database,
        "needs_buyer_match": needs_buyer_match,
        "needs_cma": needs_cma,
        "needs_appraisal": needs_appraisal,
        "needs_offer": needs_offer,
        "tools_used": tools_used,
        "property_type": property_type,
        "location": location,
        "price_range": price_range,
        "address": address
    }


def match_buyers(property_type: str = None, location: str = None, 
                 price_range: tuple = None, size_range: tuple = None) -> Dict:
    """
    Query database to find matching buyers
    """
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Build dynamic query based on criteria
    query = """
        SELECT b.*, COUNT(t.id) as transaction_count
        FROM buyers b
        LEFT JOIN transactions t ON (b.name = t.buyer_name)
        WHERE 1=1
    """
    params = []
    
    if property_type:
        query += " AND (b.preferred_property_type LIKE ? OR b.criteria LIKE ?)"
        params.extend([f"%{property_type}%", f"%{property_type}%"])
    
    if location:
        query += " AND (b.preferred_location LIKE ? OR b.regions LIKE ?)"
        params.extend([f"%{location}%", f"%{location}%"])
    
    if price_range:
        min_price, max_price = price_range
        query += " AND b.min_price <= ? AND b.max_price >= ?"
        params.extend([max_price, min_price])
    
    query += """
        GROUP BY b.id
        ORDER BY transaction_count DESC, b.last_active DESC
        LIMIT 20
    """
    
    cursor.execute(query, params)
    buyers = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    # Calculate match scores
    for buyer in buyers:
        buyer["match_score"] = calculate_match_score(buyer, property_type, location, price_range)
    
    # Sort by match score
    buyers.sort(key=lambda x: x["match_score"], reverse=True)
    
    return {
        "count": len(buyers),
        "top_buyers": buyers[:10],
        "search_criteria": {
            "property_type": property_type,
            "location": location,
            "price_range": price_range
        }
    }


def generate_cma(address: str, property_type: str, 
                 size_sqft: int = None, city: str = None) -> Dict:
    """
    Generate Comparative Market Analysis
    """
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Find comparable sales
    query = """
        SELECT * FROM transactions
        WHERE property_type LIKE ?
        AND sale_date >= date('now', '-12 months')
    """
    params = [f"%{property_type}%"]
    
    if city:
        query += " AND (city LIKE ? OR region LIKE ?)"
        params.extend([f"%{city}%", f"%{city}%"])
    
    query += " ORDER BY sale_date DESC LIMIT 20"
    
    cursor.execute(query, params)
    comparables = [dict(row) for row in cursor.fetchall()]
    
    # Calculate statistics
    if comparables:
        prices = [c["sale_price"] for c in comparables if c["sale_price"]]
        sizes = [c["property_size"] for c in comparables if c["property_size"]]
        
        avg_price = sum(prices) / len(prices) if prices else 0
        avg_price_per_sf = sum(p/s for p, s in zip(prices, sizes) if s) / len([s for s in sizes if s]) if sizes else 0
        
        # Price range
        min_price = min(prices) if prices else 0
        max_price = max(prices) if prices else 0
        
        cma = {
            "subject_property": address,
            "property_type": property_type,
            "comparable_count": len(comparables),
            "avg_sale_price": avg_price,
            "avg_price_per_sf": avg_price_per_sf,
            "price_range": {"min": min_price, "max": max_price},
            "comparables": comparables[:8],
            "estimated_value": avg_price,
            "confidence": "Medium" if len(comparables) >= 5 else "Low",
            "analysis_date": datetime.now().isoformat()
        }
    else:
        cma = {
            "subject_property": address,
            "property_type": property_type,
            "comparable_count": 0,
            "estimated_value": None,
            "confidence": "Insufficient Data",
            "message": "No comparable sales found in database. Recommend manual research."
        }
    
    conn.close()
    return cma


def calculate_match_score(buyer: Dict, property_type: str, location: str, 
                         price_range: tuple) -> int:
    """
    Calculate a match score (0-100) for a buyer
    """
    score = 0
    
    # Recent activity bonus
    if buyer.get("last_active"):
        last_active = datetime.fromisoformat(buyer["last_active"])
        days_since_active = (datetime.now() - last_active).days
        if days_since_active < 30:
            score += 20
        elif days_since_active < 90:
            score += 10
    
    # Transaction history
    transaction_count = buyer.get("transaction_count", 0)
    score += min(transaction_count * 5, 25)
    
    # Property type match
    if property_type and buyer.get("preferred_property_type"):
        if property_type.lower() in buyer["preferred_property_type"].lower():
            score += 25
    
    # Location match
    if location and buyer.get("preferred_location"):
        if location.lower() in buyer["preferred_location"].lower():
            score += 20
    
    # Price range match
    if price_range and buyer.get("min_price") and buyer.get("max_price"):
        min_price, max_price = price_range
        if buyer["min_price"] <= max_price and buyer["max_price"] >= min_price:
            score += 10
    
    return min(score, 100)


async def call_llm_api(prompt: str) -> str:
    """
    Call Perplexity API (or other LLM)
    """
    headers = {
        "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "sonar",  # or "mistral-7b-instruct"
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 2000,
        "temperature": 0.2  # Lower for more factual responses
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            PERPLEXITY_API_URL,
            headers=headers,
            json=payload,
            timeout=60.0
        )
        
        if response.status_code == 200:
            result = response.json()
            return result["choices"][0]["message"]["content"]
        else:
            raise Exception(f"LLM API error: {response.status_code}")
```

---

## 🔧 Tools Implementation

### Tool 1: Database Query
```python
def execute_database_query(message: str) -> Dict:
    """Parse natural language query and execute SQL"""
    # Use simple keyword matching for now
    # In production, use GPT to generate SQL
    
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Extract entities from message
    # This is simplified - use NLP in production
    
    results = {
        "transactions": [],
        "buyers": [],
        "hot_money": []
    }
    
    # Example: "find buyers in Toronto"
    if "buyer" in message.lower() and "toronto" in message.lower():
        cursor.execute("""
            SELECT * FROM buyers 
            WHERE preferred_location LIKE '%Toronto%'
            ORDER BY last_active DESC
            LIMIT 10
        """)
        results["buyers"] = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    return results
```

### Tool 2: Buyer Matching
```python
def find_matching_buyers(property_details: Dict) -> List[Dict]:
    """
    Advanced buyer matching algorithm
    """
    matches = []
    
    # Query database
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    
    # Multi-factor scoring
    cursor.execute("""
        SELECT b.*, 
               (CASE WHEN b.preferred_property_type LIKE ? THEN 30 ELSE 0 END +
                CASE WHEN b.preferred_location LIKE ? THEN 25 ELSE 0 END +
                CASE WHEN b.min_price <= ? AND b.max_price >= ? THEN 20 ELSE 0 END +
                CASE WHEN b.last_active >= date('now', '-30 days') THEN 15 ELSE 0 END +
                (SELECT COUNT(*) FROM transactions WHERE buyer_name = b.name) * 5) as match_score
        FROM buyers b
        WHERE b.active = 1
        ORDER BY match_score DESC
        LIMIT 10
    """, (
        f"%{property_details.get('property_type', '')}%",
        f"%{property_details.get('location', '')}%",
        property_details.get('price', 999999999),
        property_details.get('price', 0)
    ))
    
    matches = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return matches
```

### Tool 3: CMA Analysis
```python
def generate_cma_report(property_address: str, comparables: List[Dict]) -> str:
    """
    Generate a professional CMA report
    """
    report = f"""
# Comparative Market Analysis
**Property:** {property_address}
**Date:** {datetime.now().strftime('%Y-%m-%d')}

## Executive Summary
Based on {len(comparables)} comparable sales in the past 12 months.

## Comparable Sales
"""
    
    for i, comp in enumerate(comparables[:5], 1):
        report += f"""
### {i}. {comp['property_address']}
- **Sale Price:** ${comp['sale_price']:,}
- **Date:** {comp['sale_date']}
- **Price/SF:** ${comp['sale_price']/comp['property_size']:,.2f}
- **Buyer:** {comp['buyer_name']}
"""
    
    return report
```

---

## 🎨 Frontend Enhancement

### Enhanced PropertyChat.jsx Features:

1. **Tool Call Visualization**
```jsx
// Show which tools are being used
{message.tool_calls && (
  <div className="flex gap-2 mt-2">
    {message.tool_calls.map(tool => (
      <span key={tool} className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
        🔧 {tool}
      </span>
    ))}
  </div>
)}
```

2. **Data Source Citations**
```jsx
// Show data sources
{message.sources && (
  <div className="text-xs text-slate-500 mt-2">
    Sources: {message.sources.join(', ')}
  </div>
)}
```

3. **Quick Action Buttons**
```jsx
// After AI response, show action buttons
<div className="flex gap-2 mt-3">
  <button onClick={() => exportToObsidian()}>
    📄 Export to Obsidian
  </button>
  <button onClick={() => generateReport()}>
    📊 Generate Report
  </button>
  <button onClick={() => contactBuyers()}>
    📧 Contact Top 3 Buyers
  </button>
</div>
```

---

## 📊 Performance Metrics

Track these metrics to optimize:
- Query response time (target: <2s)
- LLM response time (target: <5s)
- Buyer match accuracy (target: >85%)
- CMA accuracy vs actual sales (target: ±10%)
- User satisfaction (thumbs up/down)

---

## ✅ Implementation Checklist

### Phase 1: Backend API
- [ ] Create `/api/chat` endpoint
- [ ] Implement intent analysis
- [ ] Add database query tool
- [ ] Add buyer matching tool
- [ ] Add CMA generation tool
- [ ] Add system prompt
- [ ] Test with sample queries

### Phase 2: Frontend
- [ ] Update PropertyChat to show tool usage
- [ ] Add data source citations
- [ ] Add quick action buttons
- [ ] Add export to Obsidian
- [ ] Test voice input with new features

### Phase 3: Optimization
- [ ] Fine-tune system prompt
- [ ] Optimize SQL queries
- [ ] Add caching for frequent queries
- [ ] Monitor performance metrics

---

## 🚀 Next Steps

1. **Implement the backend API** (`/api/chat` endpoint)
2. **Test with real queries** from your database
3. **Fine-tune the system prompt** based on responses
4. **Add more tools** as needed (appraisal, offer analysis)
5. **Train users** on how to ask effective questions

---

**This system will transform your Property Chat from a simple form filler into a comprehensive CRE research assistant with 25+ years of expertise!**
