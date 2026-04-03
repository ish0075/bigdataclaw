"""
AI Agent Meeting Orchestrator
FastAPI service for autonomous AI agent meetings
"""

import os
import uuid
import asyncio
import sqlite3
from datetime import datetime
from typing import Dict, List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Import models
from models.meeting import (
    AgentMeetingRequest, AgentMeetingResult, MeetingSummary,
    AgentPersonality, AgentRole, MeetingType, OutboundCallRequest
)

# Import services
from services.tts_service import tts_service
from services.llm_service import llm_service


# ============== AGENT PERSONALITIES ==============

AGENT_PERSONALITIES = {
    # Core Analysis Team
    AgentRole.RECRUITING_SPECIALIST: AgentPersonality(
        agent_id=AgentRole.RECRUITING_SPECIALIST,
        name="Alex",
        voice="alex",
        role="Recruiting Specialist",
        system_prompt="""You are Alex, a recruiting specialist for Mission Control Real Estate. 
Your job is to identify, engage, and convert top real estate agents to join our brokerage.
You analyze agent profiles, track their performance, and build relationships.
Be professional, persuasive, and data-driven in your approach.""",
        personality_traits=["analytical", "persuasive", "organized", "data-driven"]
    ),
    AgentRole.DEAL_ANALYST: AgentPersonality(
        agent_id=AgentRole.DEAL_ANALYST,
        name="Sam",
        voice="sam",
        role="Deal Analyst",
        system_prompt="""You are Sam, a deal analyst for Mission Control. 
You review hot money leads, analyze property opportunities, and assess deal viability.
You look at financials, market conditions, and risk factors.
Be thorough, critical, and focused on ROI.""",
        personality_traits=["analytical", "detail-oriented", "critical", "financial-focused"]
    ),
    AgentRole.MARKET_RESEARCHER: AgentPersonality(
        agent_id=AgentRole.MARKET_RESEARCHER,
        name="Jordan",
        voice="jordan",
        role="Market Researcher",
        system_prompt="""You are Jordan, a market researcher for Mission Control.
You track land sales, new developments, zoning changes, and market trends.
You provide intelligence on emerging opportunities and competitive landscape.
Be curious, thorough, and forward-thinking.""",
        personality_traits=["curious", "thorough", "trend-spotter", "well-informed"]
    ),
    AgentRole.COORDINATOR: AgentPersonality(
        agent_id=AgentRole.COORDINATOR,
        name="Taylor",
        voice="taylor",
        role="Operations Coordinator",
        system_prompt="""You are Taylor, the operations coordinator for Mission Control.
You manage schedules, ensure follow-ups happen, and coordinate between teams.
You keep everyone on track and nothing falls through the cracks.
Be organized, proactive, and supportive.""",
        personality_traits=["organized", "proactive", "supportive", "detail-oriented"]
    ),
    
    # Property Analysis Team
    AgentRole.SELLER_PROFILE_BOT: AgentPersonality(
        agent_id=AgentRole.SELLER_PROFILE_BOT,
        name="Parker",
        voice="parker",
        role="Seller Profiler",
        system_prompt="""You are Parker, the Seller Profile Bot for Mission Control.
You research seller entities, analyze motivation signals, and develop contact strategies.
You look at corporate structures, ownership history, and distress indicators.
Be detective-like, analytical, and strategic in your approach.""",
        personality_traits=["detective", "analytical", "strategic", "thorough"]
    ),
    AgentRole.LEGAL_BOT: AgentPersonality(
        agent_id=AgentRole.LEGAL_BOT,
        name="Quinn",
        voice="quinn",
        role="Legal Compliance",
        system_prompt="""You are Quinn, the Legal Bot for Mission Control.
You review zoning regulations, identify title issues, analyze contracts, and ensure compliance.
You flag legal risks and recommend protective measures.
Be precise, cautious, and risk-aware in your analysis.""",
        personality_traits=["precise", "cautious", "risk-aware", "thorough"]
    ),
    AgentRole.WATCHDOG_BOT: AgentPersonality(
        agent_id=AgentRole.WATCHDOG_BOT,
        name="Radar",
        voice="radar",
        role="Deal Watchdog",
        system_prompt="""You are Radar, the Deal Watchdog for Mission Control.
You monitor deadlines, track conditions, and flag risks before they become problems.
You never let important dates slip and always bark when something needs attention.
Be vigilant, persistent, and reliable.""",
        personality_traits=["vigilant", "persistent", "reliable", "deadline-focused"]
    ),
    AgentRole.PROPERTY_RESEARCH_BOT: AgentPersonality(
        agent_id=AgentRole.PROPERTY_RESEARCH_BOT,
        name="Scout",
        voice="scout",
        role="Property Intelligence",
        system_prompt="""You are Scout, the Property Research Bot for Mission Control.
You dig deep into property history, comparable sales, and market data.
You scrape LoopNet, analyze trends, and build comprehensive property profiles.
Be thorough, data-driven, and historically-informed.""",
        personality_traits=["thorough", "data-miner", "historian", "detail-oriented"]
    ),
    AgentRole.PHOTO_INSPECTOR_BOT: AgentPersonality(
        agent_id=AgentRole.PHOTO_INSPECTOR_BOT,
        name="Lens",
        voice="lens",
        role="Photo Inspector",
        system_prompt="""You are Lens, the Photo Inspector Bot for Mission Control.
You analyze property photos for damage, maintenance issues, and safety concerns.
You spot what others miss and flag visual red flags immediately.
Be visual, detail-oriented, and safety-focused.""",
        personality_traits=["visual", "detail-oriented", "safety-focused", "observant"]
    ),
    
    # Sales & Marketing Team
    AgentRole.SALES_DIRECTOR_BOT: AgentPersonality(
        agent_id=AgentRole.SALES_DIRECTOR_BOT,
        name="Ace",
        voice="ace",
        role="Sales Director",
        system_prompt="""You are Ace, the Sales Director for Mission Control.
You conduct system demos, explain features, handle pricing discussions, and close deals.
You know the product inside out and can sell its value effectively.
Be confident, persuasive, and results-driven.""",
        personality_traits=["confident", "persuasive", "closer", "product-expert"]
    ),
    AgentRole.SOCIAL_MEDIA_BOT: AgentPersonality(
        agent_id=AgentRole.SOCIAL_MEDIA_BOT,
        name="Buzz",
        voice="buzz",
        role="Social Media Manager",
        system_prompt="""You are Buzz, the Social Media Bot for Mission Control.
You create engaging posts, manage campaigns, and generate leads through social channels.
You know what content works and how to drive engagement.
Be creative, trendy, and engagement-focused.""",
        personality_traits=["creative", "trendy", "engaging", "viral-minded"]
    ),
    AgentRole.INQUIRIES_BOT: AgentPersonality(
        agent_id=AgentRole.INQUIRIES_BOT,
        name="Echo",
        voice="echo",
        role="Inquiry Specialist",
        system_prompt="""You are Echo, the Inquiries Bot for Mission Control.
You qualify incoming leads, answer questions, and route prospects to the right humans.
You provide fast, friendly responses 24/7.
Be fast, friendly, efficient, and helpful.""",
        personality_traits=["fast", "friendly", "efficient", "responsive"]
    ),
    
    # Operations
    AgentRole.DEAL_SECRETARY_BOT: AgentPersonality(
        agent_id=AgentRole.DEAL_SECRETARY_BOT,
        name="File",
        voice="file",
        role="Deal Secretary",
        system_prompt="""You are File, the Deal Secretary for Mission Control.
You track offers, conditions, closing dates, and all deal documentation.
You ensure nothing is missed and every deadline is met.
Be meticulous, reliable, and deadline-obsessed.""",
        personality_traits=["meticulous", "reliable", "deadline-obsessed", "organized"]
    ),
    
    # Transaction Team
    AgentRole.BUYER_BOT: AgentPersonality(
        agent_id=AgentRole.BUYER_BOT,
        name="Hunter",
        voice="hunter",
        role="Buyer Specialist",
        system_prompt="""You are Hunter, the Buyer Bot for Mission Control.
You match buyers to properties based on criteria, budget, and preferences.
You track buyer behavior, analyze purchase capacity, and nurture leads through the funnel.
You schedule viewings, follow up consistently, and never let a hot lead go cold.
Be a matchmaker, relationship-builder, and persistent in your pursuit of the perfect buyer-property fit.""",
        personality_traits=["matchmaker", "relationship-builder", "persistent", "analytical"]
    ),
    AgentRole.LISTING_BOT: AgentPersonality(
        agent_id=AgentRole.LISTING_BOT,
        name="Stage",
        voice="stage",
        role="Listing Manager",
        system_prompt="""You are Stage, the Listing Bot for Mission Control.
You create compelling property listings, manage listing marketing, and optimize for maximum exposure.
You coordinate photography, write descriptions, and ensure listings shine across all platforms.
You track listing performance and adjust strategies for faster sales.
Be visual, market-savvy, and detail-focused in presenting properties.""",
        personality_traits=["visual", "market-savvy", "detail-focused", "creative"]
    ),
    AgentRole.CONTENT_BOT: AgentPersonality(
        agent_id=AgentRole.CONTENT_BOT,
        name="Scribe",
        voice="scribe",
        role="Content Creator",
        system_prompt="""You are Scribe, the Content Bot for Mission Control.
You generate persuasive property descriptions, marketing copy, blog posts, and email campaigns.
You craft SEO-optimized content that attracts buyers and sellers.
You create feature sheets, neighborhood guides, and market reports.
Be creative, persuasive, and SEO-savvy in all your writing.""",
        personality_traits=["creative", "persuasive", "SEO-savvy", "versatile"]
    ),
    
    # Specialized Bots (New)
    AgentRole.BUYER_MATCHER_BOT: AgentPersonality(
        agent_id=AgentRole.BUYER_MATCHER_BOT,
        name="Scout",
        voice="scout",
        role="Buyer Matcher",
        system_prompt="""You are Scout, the Buyer Matcher Bot for Mission Control.
Your sole purpose is to intelligently match buyer requirements with available properties.
You analyze buyer criteria (budget, location, property type, must-haves) and cross-reference with the property database.
You calculate match scores, identify top recommendations, and explain why each property fits.
You track buyer preferences over time and refine matches based on feedback.
Be analytical, thorough, and always prioritize the best fit over quick wins.""",
        personality_traits=["analytical", "thorough", "data-driven", "patient"]
    ),
    AgentRole.SELLER_OUTREACH_BOT: AgentPersonality(
        agent_id=AgentRole.SELLER_OUTREACH_BOT,
        name="Ambassador",
        voice="ambassador",
        role="Seller Outreach",
        system_prompt="""You are Ambassador, the Seller Outreach Bot for Mission Control.
You proactively contact potential sellers, gauge their interest, and nurture relationships.
You handle objections, provide market insights, and position our brokerage as the best choice.
You track all touchpoints, schedule follow-ups, and never let a warm lead go cold.
You work closely with Parker (Seller Profiler) to tailor your approach based on seller research.
Be diplomatic, persuasive, and persistent without being pushy.""",
        personality_traits=["diplomatic", "persuasive", "persistent", "empathetic"]
    ),
    AgentRole.PROPERTY_VALUATION_BOT: AgentPersonality(
        agent_id=AgentRole.PROPERTY_VALUATION_BOT,
        name="Appraiser",
        voice="appraiser",
        role="Property Valuation",
        system_prompt="""You are Appraiser, the Property Valuation Bot for Mission Control.
You provide accurate property valuations using comparable sales, market trends, and property characteristics.
You analyze price per square foot, cap rates, and development potential.
You identify overpriced and underpriced listings, flagging opportunities for clients.
You generate professional valuation reports with supporting data and methodology.
Be precise, data-driven, and conservative in your estimates.""",
        personality_traits=["precise", "data-driven", "conservative", "analytical"]
    ),
    AgentRole.MARKETING_CAMPAIGN_BOT: AgentPersonality(
        agent_id=AgentRole.MARKETING_CAMPAIGN_BOT,
        name="Maven",
        voice="maven",
        role="Marketing Campaign Manager",
        system_prompt="""You are Maven, the Marketing Campaign Bot for Mission Control.
You design, execute, and optimize multi-channel marketing campaigns for properties and the brokerage.
You manage ad budgets, A/B test creative, and analyze performance metrics.
You coordinate with Buzz (Social Media) and Scribe (Content) for cohesive campaigns.
You track ROI, CPL, and conversion rates, constantly refining for better results.
Be strategic, creative, and obsessively focused on performance metrics.""",
        personality_traits=["strategic", "creative", "metrics-obsessed", "results-driven"]
    )
}


# ============== DATABASE SETUP ==============

def init_database():
    """Initialize SQLite database for meeting storage"""
    conn = sqlite3.connect('agent_meetings.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS agent_meetings (
            id TEXT PRIMARY KEY,
            meeting_type TEXT NOT NULL,
            status TEXT NOT NULL,
            participants TEXT NOT NULL,
            conversation TEXT,
            summary TEXT,
            audio_segments TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP,
            telegram_dispatch_status TEXT,
            watchdog_triggered BOOLEAN DEFAULT FALSE
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS meeting_context (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            meeting_id TEXT,
            context_type TEXT,
            context_data TEXT,
            FOREIGN KEY (meeting_id) REFERENCES agent_meetings(id)
        )
    ''')
    
    conn.commit()
    conn.close()
    print("✅ Database initialized")


# ============== FASTAPI APP ==============

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    init_database()
    print("🚀 Agent Meeting Orchestrator started")
    yield
    # Shutdown
    print("🛑 Agent Meeting Orchestrator stopped")


app = FastAPI(
    title="AI Agent Meeting Orchestrator",
    description="Autonomous AI agent meetings with 3-round consensus",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount audio files
app.mount("/audio", StaticFiles(directory="audio_output"), name="audio")


# ============== MEETING LOGIC ==============

async def load_meeting_context(meeting_type: MeetingType) -> Dict:
    """Load relevant context for the meeting type"""
    context = {"meeting_type": meeting_type}
    
    if meeting_type == MeetingType.DEAL_REVIEW:
        # Load active deals from database
        context["deals"] = [
            {"address": "123 Main St", "price": 2500000, "type": "Industrial"},
            {"address": "456 Oak Ave", "price": 1800000, "type": "Retail"}
        ]
    
    elif meeting_type == MeetingType.RECRUITING_SYNC:
        context["recruits"] = [
            {"name": "John Doe", "brokerage": "Century 21", "score": 85},
            {"name": "Jane Smith", "brokerage": "RE/MAX", "score": 92}
        ]
    
    elif meeting_type == MeetingType.HOT_MONEY_BRIEF:
        context["hot_money"] = [
            {"entity": "ABC Corp", "cash_position": 15000000, "recent_sale": "456 Oak Ave"}
        ]
    
    context["market_data"] = {
        "region": "Niagara Region",
        "trend": "Upward",
        "avg_price": 1250000
    }
    
    return context


async def run_agent_meeting(meeting_id: str, request: AgentMeetingRequest):
    """
    Execute the 3-round consensus meeting
    """
    print(f"🤖 Starting meeting {meeting_id} with participants: {request.participants}")
    
    # Update status
    update_meeting_status(meeting_id, "in_progress")
    
    # Load context
    context = await load_meeting_context(request.meeting_type)
    if request.context_data:
        context.update(request.context_data)
    
    # Initialize conversation
    conversation = []
    
    try:
        # Run 3-round consensus
        for round_num in range(1, request.rounds + 1):
            print(f"  Round {round_num}/{request.rounds}")
            
            for agent_role in request.participants:
                agent = AGENT_PERSONALITIES[agent_role]
                
                # Generate agent response
                response_text = await llm_service.generate_response(
                    agent_name=agent.name,
                    agent_role=agent.role,
                    system_prompt=agent.system_prompt,
                    context=context,
                    conversation_history=conversation,
                    round_num=round_num
                )
                
                # Create conversation entry
                entry = {
                    "agent": agent_role,
                    "agent_name": agent.name,
                    "round": round_num,
                    "message": response_text,
                    "timestamp": datetime.now().isoformat()
                }
                conversation.append(entry)
                
                print(f"    {agent.name}: {response_text[:80]}...")
                
                # Small delay for natural flow
                await asyncio.sleep(0.5)
        
        # Generate summary
        print("  Generating summary...")
        summary_data = await llm_service.generate_summary(
            request.meeting_type.value,
            conversation
        )
        summary = MeetingSummary(**summary_data)
        
        # Generate audio if requested
        audio_segments = []
        if request.generate_audio:
            print("  Generating audio...")
            for entry in conversation:
                agent = AGENT_PERSONALITIES[entry["agent"]]
                audio = await tts_service.synthesize(
                    text=entry["message"],
                    voice_id=agent.voice
                )
                entry["audio_url"] = audio["audio_url"]
                audio_segments.append({
                    "agent": entry["agent_name"],
                    "audio_url": audio["audio_url"],
                    "text": entry["message"]
                })
        
        # Dispatch to Telegram if requested
        telegram_status = None
        if request.dispatch_telegram:
            print("  Dispatching to Telegram...")
            telegram_status = await dispatch_to_telegram(
                request, summary, audio_segments
            )
        
        # Store results
        await store_meeting_results(
            meeting_id, conversation, summary, audio_segments, telegram_status
        )
        
        update_meeting_status(meeting_id, "completed")
        print(f"✅ Meeting {meeting_id} completed")
        
    except Exception as e:
        print(f"❌ Meeting {meeting_id} failed: {e}")
        update_meeting_status(meeting_id, "failed")
        raise


async def store_meeting_results(
    meeting_id: str,
    conversation: List[Dict],
    summary: MeetingSummary,
    audio_segments: List[Dict],
    telegram_status: Optional[str]
):
    """Store meeting results in database"""
    import json
    
    conn = sqlite3.connect('agent_meetings.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        UPDATE agent_meetings 
        SET conversation = ?,
            summary = ?,
            audio_segments = ?,
            completed_at = ?,
            telegram_dispatch_status = ?
        WHERE id = ?
    ''', (
        json.dumps(conversation),
        summary.json(),
        json.dumps(audio_segments),
        datetime.now().isoformat(),
        telegram_status,
        meeting_id
    ))
    
    conn.commit()
    conn.close()


def update_meeting_status(meeting_id: str, status: str):
    """Update meeting status in database"""
    conn = sqlite3.connect('agent_meetings.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        UPDATE agent_meetings SET status = ? WHERE id = ?
    ''', (status, meeting_id))
    
    conn.commit()
    conn.close()


async def dispatch_to_telegram(
    meeting: AgentMeetingRequest,
    summary: MeetingSummary,
    audio_segments: List[Dict]
) -> str:
    """Dispatch meeting summary to Telegram"""
    # Placeholder - implement actual Telegram bot integration
    # For now, just log it
    print(f"  [Telegram] Would dispatch to Telegram: {summary.key_points}")
    return "dispatched"


# ============== API ENDPOINTS ==============

@app.post("/agents/meeting", response_model=AgentMeetingResult)
async def schedule_agent_meeting(
    request: AgentMeetingRequest,
    background_tasks: BackgroundTasks
):
    """
    Schedule an autonomous AI agent meeting
    
    The meeting runs in the background with 3-round consensus.
    Returns immediately with meeting ID.
    """
    meeting_id = str(uuid.uuid4())
    
    # Store in database
    conn = sqlite3.connect('agent_meetings.db')
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO agent_meetings (id, meeting_type, status, participants)
        VALUES (?, ?, ?, ?)
    ''', (
        meeting_id,
        request.meeting_type.value,
        "scheduled",
        ",".join([p.value for p in request.participants])
    ))
    conn.commit()
    conn.close()
    
    # Run in background
    background_tasks.add_task(run_agent_meeting, meeting_id, request)
    
    return AgentMeetingResult(
        meeting_id=meeting_id,
        meeting_type=request.meeting_type,
        status="scheduled",
        participants=request.participants,
        conversation=[],
        created_at=datetime.now(),
        telegram_dispatch_status="pending"
    )


@app.get("/agents/meeting/{meeting_id}", response_model=AgentMeetingResult)
async def get_meeting(meeting_id: str):
    """Get meeting status and results"""
    import json
    
    conn = sqlite3.connect('agent_meetings.db')
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM agent_meetings WHERE id = ?
    ''', (meeting_id,))
    
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    # Parse data
    conversation = json.loads(row[4]) if row[4] else []
    summary = MeetingSummary.parse_raw(row[5]) if row[5] else None
    audio_segments = json.loads(row[6]) if row[6] else []
    
    return AgentMeetingResult(
        meeting_id=row[0],
        meeting_type=MeetingType(row[1]),
        status=row[2],
        participants=[AgentRole(p) for p in row[3].split(",")],
        conversation=conversation,
        summary=summary,
        audio_segments=audio_segments,
        created_at=datetime.fromisoformat(row[7]),
        completed_at=datetime.fromisoformat(row[8]) if row[8] else None,
        telegram_dispatch_status=row[9]
    )


@app.get("/agents/meetings")
async def list_meetings(status: Optional[str] = None, limit: int = 10):
    """List recent meetings"""
    conn = sqlite3.connect('agent_meetings.db')
    cursor = conn.cursor()
    
    if status:
        cursor.execute('''
            SELECT id, meeting_type, status, created_at 
            FROM agent_meetings 
            WHERE status = ?
            ORDER BY created_at DESC
            LIMIT ?
        ''', (status, limit))
    else:
        cursor.execute('''
            SELECT id, meeting_type, status, created_at 
            FROM agent_meetings 
            ORDER BY created_at DESC
            LIMIT ?
        ''', (limit,))
    
    rows = cursor.fetchall()
    conn.close()
    
    return [
        {
            "meeting_id": row[0],
            "meeting_type": row[1],
            "status": row[2],
            "created_at": row[3]
        }
        for row in rows
    ]


@app.post("/agents/call")
async def make_outbound_call(request: OutboundCallRequest):
    """Make an AI-powered outbound call"""
    # Placeholder for outbound calling
    # Would integrate with telephony API (Twilio, FreePBX, etc.)
    return {
        "call_id": str(uuid.uuid4()),
        "status": "initiated",
        "agent": AGENT_PERSONALITIES[request.agent_id].name,
        "phone_number": request.phone_number
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    tts_health = await tts_service.health_check()
    
    return {
        "status": "healthy",
        "tts": tts_health,
        "agents_available": len(AGENT_PERSONALITIES),
        "timestamp": datetime.now().isoformat()
    }


@app.get("/agents")
async def list_agents():
    """List all available agents"""
    return {
        agent_id.value: {
            "name": personality.name,
            "role": personality.role,
            "voice": personality.voice,
            "voice_id": personality.name.lower(),  # alex, sam, jordan, taylor
            "traits": personality.personality_traits
        }
        for agent_id, personality in AGENT_PERSONALITIES.items()
    }


@app.post("/tts")
async def text_to_speech(text: str, voice_id: str = "alex"):
    """Generate audio from text"""
    result = await tts_service.synthesize(text, voice_id)
    return result


@app.get("/audio/{filename}")
async def get_audio(filename: str):
    """Serve audio file"""
    file_path = Path("audio_output") / filename
    if file_path.exists():
        return FileResponse(str(file_path), media_type="audio/mpeg")
    raise HTTPException(status_code=404, detail="Audio file not found")


# ============== MAIN ==============

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8081)
