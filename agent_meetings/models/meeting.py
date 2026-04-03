"""
AI Agent Meeting Models
Pydantic models for agent meetings and conversations
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime
from enum import Enum


class MeetingType(str, Enum):
    DAILY_STANDUP = "daily_standup"
    DEAL_REVIEW = "deal_review"
    RECRUITING_SYNC = "recruiting_sync"
    STRATEGY_SESSION = "strategy_session"
    HOT_MONEY_BRIEF = "hot_money_brief"
    
    # Property Analysis Meetings
    SELLER_DEEP_DIVE = "seller_deep_dive"
    LEGAL_REVIEW = "legal_review"
    DUE_DILIGENCE = "due_diligence"
    
    # Sales & Marketing Meetings
    SALES_SYNC = "sales_sync"
    CAMPAIGN_PLANNING = "campaign_planning"
    
    # Operations Meetings
    OPERATIONS_REVIEW = "operations_review"
    
    # Transaction Meetings
    BUYER_CONSULTATION = "buyer_consultation"
    LISTING_STRATEGY = "listing_strategy"
    CONTENT_PLANNING = "content_planning"
    
    # Specialized Bot Meetings
    BUYER_MATCHING = "buyer_matching"
    SELLER_OUTREACH = "seller_outreach"
    PROPERTY_VALUATION = "property_valuation"
    MARKETING_CAMPAIGN = "marketing_campaign"


class AgentRole(str, Enum):
    # Core Analysis Team
    RECRUITING_SPECIALIST = "recruiting_specialist"
    DEAL_ANALYST = "deal_analyst"
    MARKET_RESEARCHER = "market_researcher"
    COORDINATOR = "coordinator"
    
    # Property Analysis Team
    SELLER_PROFILE_BOT = "seller_profile_bot"
    LEGAL_BOT = "legal_bot"
    WATCHDOG_BOT = "watchdog_bot"
    PROPERTY_RESEARCH_BOT = "property_research_bot"
    PHOTO_INSPECTOR_BOT = "photo_inspector_bot"
    
    # Sales & Marketing Team
    SALES_DIRECTOR_BOT = "sales_director_bot"
    SOCIAL_MEDIA_BOT = "social_media_bot"
    INQUIRIES_BOT = "inquiries_bot"
    
    # Operations
    DEAL_SECRETARY_BOT = "deal_secretary_bot"
    
    # Transaction Team
    BUYER_BOT = "buyer_bot"
    LISTING_BOT = "listing_bot"
    CONTENT_BOT = "content_bot"
    
    # Specialized Bots
    BUYER_MATCHER_BOT = "buyer_matcher_bot"
    SELLER_OUTREACH_BOT = "seller_outreach_bot"
    PROPERTY_VALUATION_BOT = "property_valuation_bot"
    MARKETING_CAMPAIGN_BOT = "marketing_campaign_bot"


class AgentPersonality(BaseModel):
    agent_id: AgentRole
    name: str
    voice: str
    role: str
    system_prompt: str
    personality_traits: List[str] = Field(default_factory=list)
    
    class Config:
        use_enum_values = True


class AgentMeetingRequest(BaseModel):
    meeting_type: MeetingType
    participants: List[AgentRole]
    context_data: Optional[Dict[str, Any]] = Field(default_factory=dict)
    rounds: int = Field(default=3, ge=1, le=5)
    generate_audio: bool = True
    dispatch_telegram: bool = True


class ConversationEntry(BaseModel):
    agent: AgentRole
    agent_name: str
    round: int
    message: str
    timestamp: datetime
    audio_url: Optional[str] = None


class MeetingSummary(BaseModel):
    key_points: List[str]
    decisions: List[str]
    action_items: List[Dict[str, str]]  # agent -> action
    consensus_reached: bool
    confidence_score: float  # 0.0 to 1.0


class AgentMeetingResult(BaseModel):
    meeting_id: str
    meeting_type: MeetingType
    status: str  # scheduled, in_progress, completed, failed
    participants: List[AgentRole]
    conversation: List[ConversationEntry]
    summary: Optional[MeetingSummary] = None
    audio_segments: List[Dict[str, Any]] = Field(default_factory=list)
    created_at: datetime
    completed_at: Optional[datetime] = None
    telegram_dispatch_status: Optional[str] = None


class OutboundCallRequest(BaseModel):
    agent_id: AgentRole
    phone_number: str
    script_template: str
    lead_id: Optional[int] = None
    context: Optional[Dict[str, Any]] = Field(default_factory=dict)


class TTSRequest(BaseModel):
    text: str
    voice_id: str
    speed: float = Field(default=1.0, ge=0.5, le=2.0)
    output_format: str = "mp3"


class TTSResponse(BaseModel):
    audio_url: str
    duration_seconds: float
    voice_id: str
    text_hash: str
