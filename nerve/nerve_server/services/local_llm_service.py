#!/usr/bin/env python3
"""
Local LLM Service for BigDataClaw NERVE
Uses Ollama with Qwen 2.5 for property research
"""

import httpx
import os
import re
from typing import List, Dict, Optional
from datetime import datetime

# Ollama configuration
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:14b")

# System prompt for property research
PROPERTY_SYSTEM_PROMPT = """You are a commercial real estate (CRE) research assistant. 
Your task is to extract property information from user messages and respond conversationally.

Extract the following fields when present:
- Address (street address)
- City 
- Region/Province
- Asset Class (Industrial, Retail, Office, Multi-Family, Agricultural, Land)
- Price (in dollars)
- Size (in square feet)

Respond in a friendly, professional tone. If property details are found, confirm what you extracted.
If information is missing, ask clarifying questions.

Always structure your response to include:
1. A conversational response
2. Extracted data in this format: [DATA: address="..." city="..." asset_class="..." price=... size_sf=...]"""


def extract_property_info(text: str) -> Dict:
    """Extract property info from LLM response using regex patterns"""
    info = {}
    
    # Try to extract from [DATA: ...] format first
    data_match = re.search(r'\[DATA:([^\]]+)\]', text)
    if data_match:
        data_str = data_match.group(1)
        # Extract key="value" or key=value pairs
        for match in re.finditer(r'(\w+)="([^"]*)"', data_str):
            info[match.group(1)] = match.group(2)
        for match in re.finditer(r'(\w+)=([\d,]+)', data_str):
            key, val = match.group(1), match.group(2).replace(',', '')
            try:
                info[key] = int(val)
            except:
                info[key] = val
    
    # Fallback patterns
    if not info.get('address'):
        addr_match = re.search(r'(?:📍\s*Address:|Address:)\s*([^\n]+)', text, re.IGNORECASE)
        if addr_match:
            info['address'] = addr_match.group(1).strip()
    
    if not info.get('city'):
        city_match = re.search(r'(?:🏙️\s*City:|City:)\s*([^\n]+)', text, re.IGNORECASE)
        if city_match:
            info['city'] = city_match.group(1).strip()
    
    if not info.get('price'):
        # Match patterns like $5M, $5,000,000, 5 million
        price_match = re.search(r'\$([\d,]+(?:\.\d+)?)\s*(M|million)?', text, re.IGNORECASE)
        if price_match:
            val = float(price_match.group(1).replace(',', ''))
            if price_match.group(2):
                val *= 1000000
            info['price'] = int(val)
    
    if not info.get('asset_class'):
        classes = ['Industrial', 'Retail', 'Office', 'Multi-Family', 'Agricultural', 'Land']
        for cls in classes:
            if cls.lower() in text.lower():
                info['asset_class'] = cls
                break
    
    if not info.get('size_sf'):
        size_match = re.search(r'(\d{1,3}(?:,\d{3})*)\s*(?:SF|sq\s*ft|square\s*feet)', text, re.IGNORECASE)
        if size_match:
            info['size_sf'] = int(size_match.group(1).replace(',', ''))
    
    return info


async def chat_with_local_llm(user_message: str, conversation_history: List[Dict] = None) -> Dict:
    """
    Chat with local Qwen model via Ollama
    """
    messages = [{"role": "system", "content": PROPERTY_SYSTEM_PROMPT}]
    
    if conversation_history:
        messages.extend(conversation_history[-6:])  # Last 6 messages for context
    
    messages.append({"role": "user", "content": user_message})
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{OLLAMA_HOST}/api/chat",
                json={
                    "model": OLLAMA_MODEL,
                    "messages": messages,
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                        "num_predict": 1024
                    }
                },
                timeout=60.0
            )
            
            if response.status_code != 200:
                raise Exception(f"Ollama error: {response.status_code} - {response.text}")
            
            data = response.json()
            ai_message = data.get("message", {}).get("content", "")
            
            # Extract property info from response
            extracted_info = extract_property_info(ai_message)
            
            return {
                "response": ai_message,
                "extracted_data": extracted_info,
                "extractedData": extracted_info,  # camelCase for API compatibility
                "model": OLLAMA_MODEL,
                "source": "local",
                "action": "none"
            }
            
    except httpx.ConnectError:
        # Ollama not running - fall back to mock
        print("⚠️ Ollama not running, using mock response")
        return chat_with_local_llm_mock(user_message, conversation_history)
    except Exception as e:
        print(f"⚠️ Local LLM error: {e}, using mock response")
        return chat_with_local_llm_mock(user_message, conversation_history)


async def process_document_with_local_llm(file_content: str, file_type: str = "text") -> Dict:
    """
    Process a property document with local LLM
    """
    prompt = f"""Analyze this property document and extract key information:

Document Content:
{file_content[:8000]}

Extract and summarize:
1. Property Address
2. City/Location
3. Asset Type (Industrial, Retail, Office, etc.)
4. Asking Price
5. Property Size (SF)
6. Key highlights or investment points

Format your response with clear sections."""

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{OLLAMA_HOST}/api/generate",
                json={
                    "model": OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.3,
                        "num_predict": 2048
                    }
                },
                timeout=120.0
            )
            
            if response.status_code != 200:
                raise Exception(f"Ollama error: {response.status_code}")
            
            data = response.json()
            ai_response = data.get("response", "")
            
            # Extract structured data
            extracted_info = extract_property_info(ai_response)
            
            return {
                "analysis": ai_response,
                "extracted_data": extracted_info,
                "model": OLLAMA_MODEL,
                "source": "local"
            }
            
    except Exception as e:
        print(f"⚠️ Document processing error: {e}")
        return {
            "analysis": "Error processing document with local LLM. Please try again or use manual entry.",
            "extracted_data": {},
            "error": str(e)
        }


def chat_with_local_llm_mock(user_message: str, conversation_history: List[Dict] = None) -> Dict:
    """
    Mock fallback when Ollama is not available
    Uses regex patterns to simulate AI extraction
    """
    text = user_message.lower()
    info = {}
    
    # Address extraction
    address_patterns = [
        r'(\d+\s+[\w\s]+(?:road|rd|street|st|avenue|ave|drive|dr|boulevard|blvd|court|ct|lane|ln|way|crescent|cr|circle))',
    ]
    for pattern in address_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            info['address'] = match.group(1).title()
            break
    
    # City extraction
    city_match = re.search(r'(?:in|at|near)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)', user_message)
    if city_match:
        info['city'] = city_match.group(1)
    
    # Price extraction
    price_match = re.search(r'\$([\d,]+(?:\.\d+)?)\s*(M|million|k|thousand)?', user_message, re.IGNORECASE)
    if price_match:
        val = float(price_match.group(1).replace(',', ''))
        multiplier = price_match.group(2)
        if multiplier:
            if multiplier.lower() in ['m', 'million']:
                val *= 1000000
            elif multiplier.lower() in ['k', 'thousand']:
                val *= 1000
        info['price'] = int(val)
    
    # Asset class
    classes = {
        'industrial': 'Industrial',
        'warehouse': 'Industrial',
        'retail': 'Retail',
        'shopping': 'Retail',
        'office': 'Office',
        'multifamily': 'Multi-Family',
        'multi-family': 'Multi-Family',
        'apartment': 'Multi-Family',
        'agricultural': 'Agricultural',
        'farm': 'Agricultural',
        'land': 'Land'
    }
    for keyword, asset_class in classes.items():
        if keyword in text:
            info['asset_class'] = asset_class
            break
    
    # Size
    size_match = re.search(r'(\d{1,3}(?:,\d{3})*)\s*(?:SF|sq\s*ft)', user_message, re.IGNORECASE)
    if size_match:
        info['size_sf'] = int(size_match.group(1).replace(',', ''))
    
    # Build response
    response_parts = ["I found the following information:"]
    if info.get('address'):
        response_parts.append(f"📍 **Address**: {info['address']}")
    if info.get('city'):
        response_parts.append(f"🏙️ **City**: {info['city']}")
    if info.get('asset_class'):
        response_parts.append(f"🏭 **Asset Class**: {info['asset_class']}")
    if info.get('price'):
        response_parts.append(f"💰 **Price**: ${info['price']:,}")
    if info.get('size_sf'):
        response_parts.append(f"📐 **Size**: {info['size_sf']:,} SF")
    
    if len(response_parts) > 1:
        response_parts.append("\nI've updated the form for you. Anything else you'd like to add?")
    else:
        response_parts = ["I couldn't extract specific property details from that. Could you provide the address, city, price, or asset type?"]
    
    return {
        "response": "\n".join(response_parts),
        "extracted_data": info,
        "extractedData": info,  # camelCase for API compatibility
        "model": "mock-local",
        "source": "mock",
        "action": "none"
    }


# Export the main function
chat_with_property_ai = chat_with_local_llm
process_property_document = process_document_with_local_llm
