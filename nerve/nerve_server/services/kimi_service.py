"""
Kimi (Moonshot AI) Integration Service for BigDataClaw NERVE
"""

import os
import json
import httpx
from typing import Dict, List, Optional
from fastapi import HTTPException

# Try to load from .env file if KIMI_API_KEY not in environment
def load_env_file():
    env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    if key not in os.environ:
                        os.environ[key] = value

load_env_file()

KIMI_API_KEY = os.getenv("KIMI_API_KEY")
print(f"KIMI_API_KEY loaded: {'Yes' if KIMI_API_KEY else 'No'}")
KIMI_API_URL = "https://api.moonshot.cn/v1/chat/completions"
KIMI_MODEL = "moonshot-v1-8k"  # Options: moonshot-v1-8k, moonshot-v1-32k, moonshot-v1-128k


SYSTEM_PROMPT = """You are a Commercial Real Estate (CRE) research assistant for BigDataClaw NERVE.
Your job is to help users fill out property research forms by extracting information from their messages.

When a user tells you about a property, extract these fields:
- address (street address)
- city 
- assetClass (Industrial, Retail, Office, Multi-Family, Agricultural, Land, Mixed-Use)
- price (numeric value)
- size (square footage, numeric)
- region (Niagara, Toronto, Hamilton, GTA, Southwestern Ontario)

ALWAYS respond in this JSON format:
{
  "response": "Your friendly response message to the user",
  "extractedData": {
    "address": "extracted address or null",
    "city": "extracted city or null", 
    "assetClass": "extracted type or null",
    "price": numeric_value_or_null,
    "size": numeric_value_or_null,
    "region": "extracted region or null"
  },
  "action": "none" | "submit" | "help"
}

Rules:
1. If user mentions "submit", "launch", or "start mission", set action to "submit"
2. If user asks for "help", set action to "help"
3. Convert price strings like "$5M" or "5 million" to numeric 5000000
4. Convert size strings like "80k sf" to numeric 80000
5. Be friendly and professional - you're assisting with CRE research
6. If you can't extract certain fields, set them to null
7. Always confirm what you extracted in the response field

Example user message: "I have a $5M industrial at 1500 Michael Drive in Welland"
Example response:
{
  "response": "Great! I found an industrial property in Welland for $5,000,000. I've filled out the form for you. Ready to launch the research mission?",
  "extractedData": {
    "address": "1500 Michael Drive",
    "city": "Welland",
    "assetClass": "Industrial",
    "price": 5000000,
    "size": null,
    "region": "Niagara"
  },
  "action": "none"
}
"""


async def chat_with_kimi(user_message: str, conversation_history: List[Dict] = None) -> Dict:
    """
    Send a message to Kimi AI and get structured property data back
    
    Args:
        user_message: The user's input message
        conversation_history: Optional list of previous messages for context
        
    Returns:
        Dict with response text, extracted data, and action
    """
    if not KIMI_API_KEY:
        raise HTTPException(status_code=500, detail="KIMI_API_KEY not configured")
    
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    
    if conversation_history:
        messages.extend(conversation_history)
    
    messages.append({"role": "user", "content": user_message})
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                KIMI_API_URL,
                headers={
                    "Authorization": f"Bearer {KIMI_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": KIMI_MODEL,
                    "messages": messages,
                    "temperature": 0.3,  # Lower for more consistent extractions
                    "max_tokens": 1000
                },
                timeout=30.0
            )
            
            response.raise_for_status()
            data = response.json()
            
            # Parse the AI response
            ai_content = data["choices"][0]["message"]["content"]
            
            # Try to parse as JSON
            try:
                result = json.loads(ai_content)
                return {
                    "response": result.get("response", ai_content),
                    "extractedData": result.get("extractedData", {}),
                    "action": result.get("action", "none"),
                    "raw": ai_content
                }
            except json.JSONDecodeError:
                # If not valid JSON, wrap the text response
                return {
                    "response": ai_content,
                    "extractedData": {},
                    "action": "none",
                    "raw": ai_content
                }
                
        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=f"Kimi API error: {str(e)}")


async def process_property_document(file_content: str, file_type: str) -> Dict:
    """
    Process a property document (PDF text, etc.) with Kimi
    
    Args:
        file_content: Extracted text content from the document
        file_type: Type of file (pdf, docx, etc.)
        
    Returns:
        Dict with extracted property information
    """
    prompt = f"""Extract property information from this {file_type} document:

DOCUMENT CONTENT:
{file_content[:8000]}  # Limit content length

Extract and return ONLY a JSON object with these fields:
{{
  "address": "full street address",
  "city": "city name",
  "assetClass": "property type",
  "price": numeric_price_or_null,
  "size": numeric_size_or_null,
  "region": "region/area"
}}

If a field cannot be found, use null."""

    async with httpx.AsyncClient() as client:
        response = await client.post(
            KIMI_API_URL,
            headers={
                "Authorization": f"Bearer {KIMI_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": KIMI_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.2,
                "max_tokens": 500
            },
            timeout=60.0
        )
        
        response.raise_for_status()
        data = response.json()
        
        try:
            # Try to parse JSON from response
            content = data["choices"][0]["message"]["content"]
            # Extract JSON if wrapped in markdown
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
            return json.loads(content)
        except (json.JSONDecodeError, IndexError):
            return {"error": "Could not parse document", "raw": content}


# Mock responses for testing without API key
MOCK_RESPONSES = {
    "default": {
        "response": "I can help you research commercial properties! Tell me about the property - include the address, price, and type (Industrial, Retail, Office, etc.)",
        "extractedData": {},
        "action": "none"
    },
    "help": {
        "response": "I can help you fill out the property research form! Just tell me about your property naturally. For example:\n\n• 'I have a $5M industrial property at 1500 Michael Drive in Welland'\n• 'Retail space in Toronto for $2.5 million, 15,000 SF'\n• 'Office building at 100 King Street, asking $10M'\n\nI'll extract the details and fill out the form automatically!",
        "extractedData": {},
        "action": "help"
    },
    "example": {
        "response": "Perfect! I found an industrial property at 1500 Michael Drive in Welland listed for $5,000,000. I've filled out the form with these details. Ready to launch the research mission?",
        "extractedData": {
            "address": "1500 Michael Drive",
            "city": "Welland",
            "assetClass": "Industrial",
            "price": 5000000,
            "size": None,
            "region": "Niagara"
        },
        "action": "none"
    }
}


async def chat_with_kimi_mock(user_message: str, conversation_history: List[Dict] = None) -> Dict:
    """Mock version for testing without API key"""
    import asyncio
    await asyncio.sleep(1)  # Simulate network delay
    
    lower = user_message.lower()
    
    # Simple pattern matching for mock
    if "help" in lower:
        return MOCK_RESPONSES["help"]
    
    if any(word in lower for word in ["submit", "launch", "start"]):
        return {
            "response": "🚀 Launching your research mission now!",
            "extractedData": {},
            "action": "submit"
        }
    
    # Try to extract info from message
    info = {}
    if "$" in user_message or "million" in lower or "m " in lower:
        # Extract price
        import re
        price_match = re.search(r'\$?([\d,.]+)\s*(?:million|m|k)?', user_message, re.IGNORECASE)
        if price_match:
            price = float(price_match[1].replace(',', ''))
            if "million" in lower or "m " in lower:
                price *= 1000000
            info["price"] = int(price)
    
    if any(word in lower for word in ["industrial", "warehouse", "factory"]):
        info["assetClass"] = "Industrial"
    elif any(word in lower for word in ["retail", "store", "shop"]):
        info["assetClass"] = "Retail"
    elif any(word in lower for word in ["office", "building"]):
        info["assetClass"] = "Office"
    
    if "welland" in lower:
        info["city"] = "Welland"
        info["region"] = "Niagara"
    elif "toronto" in lower:
        info["city"] = "Toronto"
        info["region"] = "Toronto"
    
    # Extract address pattern
    import re
    address_match = re.search(r'(\d+\s+[^,]+(?:Street|St|Drive|Dr|Avenue|Ave|Road|Rd))', user_message, re.IGNORECASE)
    if address_match:
        info["address"] = address_match[1]
    
    if info:
        confirmations = []
        if info.get("address"): confirmations.append(f"📍 Address: {info['address']}")
        if info.get("city"): confirmations.append(f"🏙️ City: {info['city']}")
        if info.get("price"): confirmations.append(f"💰 Price: ${info['price']:,}")
        if info.get("assetClass"): confirmations.append(f"🏢 Type: {info['assetClass']}")
        
        return {
            "response": f"I found the following information:\n\n{chr(10).join(confirmations)}\n\nI've updated the form for you. Anything else you'd like to add?",
            "extractedData": info,
            "action": "none"
        }
    
    return MOCK_RESPONSES["default"]


# Use mock if no API key, otherwise use real API
chat_with_property_ai = chat_with_kimi if KIMI_API_KEY else chat_with_kimi_mock
