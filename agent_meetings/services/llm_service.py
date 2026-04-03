"""
LLM Service for Agent Responses
Uses local LLM or API for generating agent responses
"""

import os
import json
import aiohttp
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime


class LLMService:
    """
    LLM service for generating agent responses in meetings
    Supports multiple backends: local vLLM, OpenAI-compatible API
    """
    
    def __init__(self):
        self.api_url = os.getenv("LLM_API_URL", "http://localhost:8000/v1/chat/completions")
        self.api_key = os.getenv("LLM_API_KEY", "")
        self.model = os.getenv("LLM_MODEL", "TinyLlama/TinyLlama-1.1B-Chat-v1.0")
        self.max_tokens = int(os.getenv("LLM_MAX_TOKENS", "256"))
        self.temperature = float(os.getenv("LLM_TEMPERATURE", "0.7"))
    
    async def generate_response(
        self,
        agent_name: str,
        agent_role: str,
        system_prompt: str,
        context: Dict[str, Any],
        conversation_history: List[Dict[str, Any]],
        round_num: int
    ) -> str:
        """
        Generate a response from an AI agent
        
        Args:
            agent_name: Name of the agent (Alex, Sam, etc.)
            agent_role: Role description
            system_prompt: Agent's system prompt
            context: Meeting context (deals, recruits, etc.)
            conversation_history: Previous messages in the meeting
            round_num: Current round number
        
        Returns:
            Generated response text
        """
        # Build the conversation prompt
        messages = self._build_messages(
            agent_name, agent_role, system_prompt,
            context, conversation_history, round_num
        )
        
        # Call LLM API
        response = await self._call_llm(messages)
        
        return response
    
    def _build_messages(
        self,
        agent_name: str,
        agent_role: str,
        system_prompt: str,
        context: Dict[str, Any],
        conversation_history: List[Dict[str, Any]],
        round_num: int
    ) -> List[Dict[str, str]]:
        """Build the message list for the LLM"""
        
        # System message with agent personality
        enhanced_system = f"""{system_prompt}

You are participating in a team meeting with other AI agents. Each agent has a specific role.
Be concise but informative. Share your perspective based on your expertise.
Your responses should be 2-4 sentences, professional yet conversational.
Meeting Round: {round_num}
"""
        
        messages = [{"role": "system", "content": enhanced_system}]
        
        # Add context
        context_str = self._format_context(context)
        if context_str:
            messages.append({
                "role": "user", 
                "content": f"Meeting Context:\n{context_str}\n\n---\n\nMeeting is starting. Introduce yourself briefly and share your initial thoughts."
            })
        
        # Add conversation history
        for entry in conversation_history:
            speaker = entry.get("agent_name", "Agent")
            message = entry.get("message", "")
            messages.append({
                "role": "assistant" if speaker == agent_name else "user",
                "content": f"{speaker}: {message}"
            })
        
        # Add prompt for current response
        if round_num > 1:
            messages.append({
                "role": "user",
                "content": f"It's your turn to speak, {agent_name}. Respond to the discussion based on your role as {agent_role}. Be specific and actionable."
            })
        
        return messages
    
    def _format_context(self, context: Dict[str, Any]) -> str:
        """Format meeting context for the LLM"""
        parts = []
        
        if "deals" in context:
            parts.append(f"Active Deals: {len(context['deals'])}")
            for deal in context["deals"][:3]:  # Limit to 3 deals
                parts.append(f"  - {deal.get('address', 'Unknown')}: ${deal.get('price', 'N/A')}")
        
        if "hot_money" in context:
            parts.append(f"Hot Money Alerts: {len(context['hot_money'])}")
        
        if "recruits" in context:
            parts.append(f"New Recruits: {len(context['recruits'])}")
        
        if "market_data" in context:
            md = context["market_data"]
            parts.append(f"Market: {md.get('region', 'Unknown')} - {md.get('trend', 'Stable')}")
        
        if "meeting_type" in context:
            parts.append(f"Meeting Type: {context['meeting_type']}")
        
        return "\n".join(parts) if parts else "General team sync."
    
    async def _call_llm(self, messages: List[Dict[str, str]]) -> str:
        """Call the LLM API"""
        
        payload = {
            "model": self.model,
            "messages": messages,
            "max_tokens": self.max_tokens,
            "temperature": self.temperature
        }
        
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.api_url,
                    json=payload,
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        if "choices" in data and len(data["choices"]) > 0:
                            return data["choices"][0]["message"]["content"].strip()
                        return "I don't have anything to add at this moment."
                    else:
                        error_text = await response.text()
                        print(f"LLM API error: {response.status} - {error_text}")
                        return self._fallback_response()
        except asyncio.TimeoutError:
            print("LLM API timeout")
            return self._fallback_response()
        except Exception as e:
            print(f"LLM API error: {e}")
            return self._fallback_response()
    
    def _fallback_response(self) -> str:
        """Fallback response when LLM fails"""
        fallbacks = [
            "I agree with the team's assessment. Let's proceed with the plan.",
            "From my perspective, this looks solid. I'm ready to support the next steps.",
            "I don't have any concerns. The data supports moving forward.",
            "This aligns with our goals. Let's execute and monitor results."
        ]
        import random
        return random.choice(fallbacks)
    
    async def generate_summary(
        self,
        meeting_type: str,
        conversation: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Generate meeting summary and action items"""
        
        conversation_text = "\n".join([
            f"{entry['agent_name']} (Round {entry['round']}): {entry['message']}"
            for entry in conversation
        ])
        
        prompt = f"""Based on this meeting transcript, extract:
1. Key points discussed (bullet list)
2. Decisions made (bullet list)
3. Action items with assigned agents (bullet list)
4. Was consensus reached? (yes/no)
5. Confidence score (0.0 to 1.0)

Meeting Type: {meeting_type}

Transcript:
{conversation_text}

Respond in JSON format:
{{
    "key_points": ["point 1", "point 2"],
    "decisions": ["decision 1"],
    "action_items": [{{"agent": "AgentName", "action": "do something"}}],
    "consensus_reached": true,
    "confidence_score": 0.85
}}"""

        messages = [
            {"role": "system", "content": "You are a meeting summarizer. Extract key information accurately."},
            {"role": "user", "content": prompt}
        ]
        
        response = await self._call_llm(messages)
        
        # Try to parse JSON, fallback to default if fails
        try:
            # Extract JSON from response
            json_str = response
            if "```json" in response:
                json_str = response.split("```json")[1].split("```")[0]
            elif "```" in response:
                json_str = response.split("```")[1].split("```")[0]
            
            summary = json.loads(json_str.strip())
            return summary
        except:
            # Fallback summary
            return {
                "key_points": ["Meeting completed"],
                "decisions": ["Continue with current strategy"],
                "action_items": [],
                "consensus_reached": True,
                "confidence_score": 0.7
            }


# Singleton instance
llm_service = LLMService()
