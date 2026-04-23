"""
BigDataClaw NERVE Mission Control Server
WebSocket hub for real-time mission orchestration
"""

import asyncio
import json
import logging
import os
import uuid
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Dict, List, Optional, Set
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
    print("Loaded .env file")
except ImportError:
    print("python-dotenv not installed, using system environment variables")

# Import AI service (using local Qwen via Ollama)
try:
    from services.local_llm_service import chat_with_local_llm as chat_with_property_ai
    from services.local_llm_service import process_document_with_local_llm as process_property_document
    print("🤖 Using Local LLM (Qwen 2.5 via Ollama)")
except ImportError as e:
    print(f"⚠️ Local LLM service not available: {e}")
    # Fallback to mock
    from services.openai_service import chat_with_openai_mock as chat_with_property_ai
    from services.openai_service import chat_with_openai_mock as process_property_document
    print("🎭 Using Mock AI (fallback)")

# Import multi-agent communication layer
try:
    from services.agent_comm_bus import AgentCommunicationBus, AgentMessage, get_bus
    from services.agent_orchestrator import AgentOrchestrator, get_orchestrator
    print("🔗 Agent Communication Bus loaded")
except ImportError as e:
    print(f"⚠️ Agent communication bus not available: {e}")
    get_bus = None
    get_orchestrator = None

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("nerve-server")


class ConnectionManager:
    """Manages WebSocket connections for real-time updates"""
    
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.subscriptions: Dict[str, Set[WebSocket]] = {
            'missions': set(),
            'agents': set(),
            'hotmoney': set(),
            'deals': set(),
        }
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"Client connected. Total: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        for channel in self.subscriptions.values():
            channel.discard(websocket)
        logger.info(f"Client disconnected. Total: {len(self.active_connections)}")
    
    def subscribe(self, websocket: WebSocket, channels: List[str]):
        for channel in channels:
            if channel in self.subscriptions:
                self.subscriptions[channel].add(websocket)
                logger.info(f"Subscribed to {channel}")
    
    async def broadcast_to_channel(self, channel: str, message: dict):
        if channel not in self.subscriptions:
            return
        
        disconnected = set()
        for connection in self.subscriptions[channel]:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.add(connection)
        
        # Clean up disconnected clients
        for conn in disconnected:
            self.disconnect(conn)


class MissionController:
    """Manages mission lifecycle and agent coordination"""
    
    def __init__(self, manager: ConnectionManager):
        self.manager = manager
        self.active_missions: Dict[str, dict] = {}
        self.mission_queue: asyncio.Queue = asyncio.Queue()
        self.is_running = False
    
    async def start(self):
        """Start the mission processor"""
        self.is_running = True
        asyncio.create_task(self._process_missions())
        logger.info("Mission controller started")
    
    async def stop(self):
        self.is_running = False
    
    async def create_mission(self, mission_data: dict) -> str:
        """Create a new research mission"""
        mission_id = f"M-{datetime.now().strftime('%Y%m%d-%H%M%S')}-{len(self.active_missions)}"
        
        mission = {
            'id': mission_id,
            'status': 'queued',
            'property': mission_data.get('property', {}),
            'phases': [
                {'name': 'Transaction Scout', 'icon': '🎯', 'status': 'pending'},
                {'name': 'Hot Money ID', 'icon': '🔥', 'status': 'pending'},
                {'name': 'Portfolio Match', 'icon': '💼', 'status': 'pending'},
                {'name': 'Agent Finder', 'icon': '👤', 'status': 'pending'},
                {'name': 'Lender Match', 'icon': '🏦', 'status': 'pending'},
            ],
            'currentPhase': 0,
            'progress': 0,
            'logs': [],
            'createdAt': datetime.now().isoformat(),
        }
        
        self.active_missions[mission_id] = mission
        await self.mission_queue.put(mission_id)
        
        # Broadcast mission created
        await self.manager.broadcast_to_channel('missions', {
            'type': 'mission:created',
            'mission': mission
        })
        
        logger.info(f"Created mission {mission_id}")
        return mission_id
    
    async def _process_missions(self):
        """Process missions from the queue"""
        while self.is_running:
            try:
                mission_id = await asyncio.wait_for(
                    self.mission_queue.get(), 
                    timeout=1.0
                )
                await self._execute_mission(mission_id)
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                logger.error(f"Error processing mission: {e}")
    
    async def _execute_mission(self, mission_id: str):
        """Execute a mission through all phases"""
        mission = self.active_missions.get(mission_id)
        if not mission:
            return
        
        mission['status'] = 'active'
        
        # Simulate mission execution
        phases = mission['phases']
        for i, phase in enumerate(phases):
            mission['currentPhase'] = i
            phase['status'] = 'active'
            
            # Broadcast phase change
            await self.manager.broadcast_to_channel('missions', {
                'type': 'mission:phase:change',
                'missionId': mission_id,
                'phase': i,
                'phaseName': phase['name'],
                'progress': int((i / len(phases)) * 100)
            })
            
            # Simulate work
            await asyncio.sleep(2)
            
            # Add log
            log = {
                'message': f"Completed {phase['name']} - found {3 + i} results",
                'level': 'info'
            }
            mission['logs'].append(log)
            
            await self.manager.broadcast_to_channel('missions', {
                'type': 'mission:log',
                'missionId': mission_id,
                'log': log
            })
            
            phase['status'] = 'completed'
            mission['progress'] = int(((i + 1) / len(phases)) * 100)
        
        mission['status'] = 'completed'
        await self.manager.broadcast_to_channel('missions', {
            'type': 'mission:complete',
            'missionId': mission_id,
            'mission': mission
        })
        
        logger.info(f"Completed mission {mission_id}")


class HotMoneyTracker:
    """Tracks hot money leads in real-time"""
    
    def __init__(self, manager: ConnectionManager):
        self.manager = manager
        self.leads: List[dict] = []
        self.is_tracking = False
    
    async def start(self):
        """Start tracking hot money"""
        self.is_tracking = True
        asyncio.create_task(self._simulate_hot_money())
        logger.info("Hot money tracker started")
    
    async def stop(self):
        self.is_tracking = False
    
    async def _simulate_hot_money(self):
        """Simulate hot money detection (replace with real data source)"""
        sample_leads = [
            {
                'id': 'HM-001',
                'entity': '2650687 Ontario Ltd',
                'cash_amount': 15000000,
                'sale_date': 'May 2025',
                'location': 'West Lincoln',
                'property': 'Thirty Rd',
                'match_score': 92,
                'days_ago': 5,
                'property_type': 'Land',
                'asset_class': 'Development',
                'contacts': [],
                'detected_at': datetime.now().isoformat(),
            },
            {
                'id': 'HM-002',
                'entity': 'Turnberry Holdings Inc',
                'cash_amount': 9840000,
                'sale_date': 'Jan 2025',
                'location': 'Lincoln',
                'property': '4556-4568 Lincoln Ave',
                'match_score': 88,
                'days_ago': 65,
                'property_type': 'Commercial',
                'asset_class': 'Retail',
                'contacts': [],
                'detected_at': datetime.now().isoformat(),
            },
        ]
        
        for lead in sample_leads:
            self.leads.append(lead)
            await self.manager.broadcast_to_channel('hotmoney', {
                'type': 'hotmoney:new',
                'lead': lead
            })
        
        # Periodically add new leads
        while self.is_tracking:
            await asyncio.sleep(30)
            # In real implementation, check for new transactions


class AgentSupervisor:
    """Manages agent fleet status"""
    
    def __init__(self, manager: ConnectionManager):
        self.manager = manager
        self.agents: Dict[str, dict] = {
            'transaction-scout': {
                'id': 'transaction-scout',
                'name': 'Transaction Scout',
                'status': 'idle',
                'icon': '🎯',
                'activeMissions': 0,
                'completedMissions': 42,
            },
            'hot-money-tracker': {
                'id': 'hot-money-tracker',
                'name': 'Hot Money Tracker',
                'status': 'active',
                'icon': '🔥',
                'watchingCount': 156,
                'alertCount': 0,
            },
            'portfolio-analyzer': {
                'id': 'portfolio-analyzer',
                'name': 'Portfolio Analyzer',
                'status': 'idle',
                'icon': '💼',
                'pendingCount': 0,
            },
            'agent-finder': {
                'id': 'agent-finder',
                'name': 'Agent Finder',
                'status': 'idle',
                'icon': '👤',
            },
            'lender-matcher': {
                'id': 'lender-matcher',
                'name': 'Lender Matcher',
                'status': 'idle',
                'icon': '🏦',
            },
            'obsidian-sync': {
                'id': 'obsidian-sync',
                'name': 'Obsidian Sync',
                'status': 'idle',
                'icon': '📝',
                'fileCount': 1247,
            },
        }
    
    async def start_agent(self, agent_id: str):
        if agent_id in self.agents:
            self.agents[agent_id]['status'] = 'active'
            await self.manager.broadcast_to_channel('agents', {
                'type': 'agent:status',
                'agentId': agent_id,
                'status': 'active'
            })
    
    async def stop_agent(self, agent_id: str):
        if agent_id in self.agents:
            self.agents[agent_id]['status'] = 'idle'
            await self.manager.broadcast_to_channel('agents', {
                'type': 'agent:status',
                'agentId': agent_id,
                'status': 'idle'
            })
    
    async def pause_agent(self, agent_id: str):
        if agent_id in self.agents:
            self.agents[agent_id]['status'] = 'queued'
            await self.manager.broadcast_to_channel('agents', {
                'type': 'agent:status',
                'agentId': agent_id,
                'status': 'queued'
            })
    
    def get_agents(self) -> List[dict]:
        return list(self.agents.values())


# Global instances
manager = ConnectionManager()
mission_controller = MissionController(manager)
hot_money_tracker = HotMoneyTracker(manager)
agent_supervisor = AgentSupervisor(manager)

# Multi-agent bus & orchestrator
agent_bus = get_bus() if get_bus else None
agent_orchestrator = get_orchestrator(agent_bus) if get_orchestrator else None

# WebSocket bridge: push agent messages to frontend
async def _ws_bridge(message: AgentMessage):
    """Forward agent-bus messages to WebSocket clients on the 'agents' channel."""
    await manager.broadcast_to_channel('agents', {
        'type': 'agent:bus:message',
        'message': message.to_dict()
    })

if agent_bus:
    agent_bus.add_ws_bridge(_ws_bridge)
    # Register trivial handlers for each pixel agent so they don't error
    for _aid in ['kimi', 'concierge', 'scout', 'scribe', 'skeptic', 'spark', 'pablo']:
        async def _make_handler(aid):
            async def _handler(msg: AgentMessage):
                print(f"[{aid}] received task: {msg.payload.get('task', 'N/A')}")
                # Auto-acknowledge with a mock result so the orchestrator doesn't hang
                if msg.message_type == 'task' and agent_orchestrator:
                    run_id = msg.payload.get('run_id')
                    step = msg.payload.get('step')
                    await agent_orchestrator.submit_result(
                        run_id, step, aid,
                        {"status": "ack", "agent": aid, "note": "Mock result — implement real handler"}
                    )
                # Also echo back to bus as a chat message for visibility
                await agent_bus.send_direct(
                    from_agent=aid,
                    to_agent=msg.from_agent,
                    payload={"ack": True, "original_task": msg.payload.get("task")},
                    message_type="result",
                    correlation_id=msg.correlation_id,
                )
            return _handler
        agent_bus.register_handler(_aid, _make_handler(_aid))


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan"""
    # Startup
    await mission_controller.start()
    await hot_money_tracker.start()
    if agent_orchestrator:
        logger.info("Agent orchestrator ready")
    if agent_bus:
        logger.info(f"Agent bus ready — {len(agent_bus._handlers)} handlers registered")
    logger.info("NERVE server started")
    
    yield
    
    # Shutdown
    await mission_controller.stop()
    await hot_money_tracker.stop()
    if agent_bus:
        agent_bus.remove_ws_bridge(_ws_bridge)
    logger.info("NERVE server stopped")


app = FastAPI(
    title="BigDataClaw NERVE Server",
    description="Real-time mission control for CRE intelligence",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "BigDataClaw NERVE",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "connections": len(manager.active_connections),
        "active_missions": len(mission_controller.active_missions),
        "agents": len(agent_supervisor.agents),
    }


@app.get("/api/agents")
async def get_agents():
    return {"agents": agent_supervisor.get_agents()}


@app.get("/api/agents/inbox/{agent_id}")
async def get_agent_inbox(agent_id: str, unread_only: bool = False, status: Optional[str] = None, msg_type: Optional[str] = None):
    """Get inbox messages for a pixel agent with optional filters."""
    if not agent_bus:
        return {"error": "Agent bus not available"}
    filters = {}
    if unread_only:
        filters["unread_only"] = True
    if status:
        filters["status"] = status
    if msg_type:
        filters["type"] = msg_type
    return {"agent_id": agent_id, "messages": agent_bus.get_inbox(agent_id, filters if filters else None)}


@app.post("/api/agents/inbox/{agent_id}/read/{message_id}")
async def mark_message_read(agent_id: str, message_id: str):
    if not agent_bus:
        return {"error": "Agent bus not available"}
    agent_bus.mark_read(agent_id, message_id)
    return {"status": "ok"}


@app.post("/api/agents/send")
async def send_agent_message(payload: dict):
    """Send a structured direct message or broadcast between agents."""
    if not agent_bus:
        return {"error": "Agent bus not available"}
    msg = AgentMessage(
        payload=payload.get("payload", {}),
        from_agent=payload["from"],
        to_agent=payload.get("to"),
        topic=payload.get("topic"),
        message_type=payload.get("type", "chat"),
        correlation_id=payload.get("correlationId"),
        conversation_id=payload.get("conversationId"),
        task_id=payload.get("taskId"),
        priority=payload.get("priority", "normal"),
        status=payload.get("status", "pending"),
        artifact_ref=payload.get("artifactRef"),
        requires_approval=payload.get("requiresApproval", False),
        deal_id=payload.get("dealId"),
    )
    await agent_bus.publish(msg)
    return {"status": "sent", "messageId": msg.id}


@app.get("/api/agents/bus/stats")
async def get_bus_stats():
    if not agent_bus:
        return {"error": "Agent bus not available"}
    return agent_bus.get_stats()


# ---------------------------------------------------------------------------
# Orchestrator endpoints
# ---------------------------------------------------------------------------

class OrchestrateRequest(BaseModel):
    goal: str
    context: Optional[str] = None


@app.post("/api/orchestrate/plan")
async def orchestrate_plan(request: OrchestrateRequest):
    """Generate a multi-agent execution plan for a goal (no execution)."""
    if not agent_orchestrator:
        raise HTTPException(status_code=503, detail="Orchestrator not available")
    plan = await agent_orchestrator.plan(request.goal, request.context)
    return plan


@app.post("/api/orchestrate/run")
async def orchestrate_run(request: OrchestrateRequest):
    """Plan + execute a multi-agent workflow."""
    if not agent_orchestrator:
        raise HTTPException(status_code=503, detail="Orchestrator not available")
    plan = await agent_orchestrator.plan(request.goal, request.context)
    run_id = f"ORCH-{datetime.now().strftime('%Y%m%d-%H%M%S')}-{uuid.uuid4().hex[:6]}"
    # Run in background so we don't block; return run_id immediately
    asyncio.create_task(agent_orchestrator.execute(run_id, plan))
    return {"runId": run_id, "status": "started", "summary": plan.get("summary", "")}


@app.get("/api/orchestrate/run/{run_id}")
async def get_run_status(run_id: str):
    if not agent_orchestrator:
        raise HTTPException(status_code=503, detail="Orchestrator not available")
    status = agent_orchestrator.get_run_status(run_id)
    if not status:
        return {"error": "Run not found"}, 404
    return status


@app.post("/api/agents/{agent_id}/start")
async def start_agent(agent_id: str):
    await agent_supervisor.start_agent(agent_id)
    return {"status": "started", "agentId": agent_id}


@app.post("/api/agents/{agent_id}/stop")
async def stop_agent(agent_id: str):
    await agent_supervisor.stop_agent(agent_id)
    return {"status": "stopped", "agentId": agent_id}


@app.post("/api/agents/{agent_id}/pause")
async def pause_agent(agent_id: str):
    await agent_supervisor.pause_agent(agent_id)
    return {"status": "paused", "agentId": agent_id}


@app.post("/api/missions")
async def create_mission(mission_data: dict):
    mission_id = await mission_controller.create_mission(mission_data)
    return {"missionId": mission_id, "status": "queued"}


@app.get("/api/missions/{mission_id}")
async def get_mission(mission_id: str):
    mission = mission_controller.active_missions.get(mission_id)
    if not mission:
        return {"error": "Mission not found"}, 404
    return mission


@app.get("/api/hotmoney")
async def get_hot_money():
    return {"leads": hot_money_tracker.leads}


# Kimi AI Chat Models
class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[Dict]] = None


class ChatResponse(BaseModel):
    response: str
    extractedData: Dict
    action: str


@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Chat with Kimi AI for property research assistance
    
    Send a natural language message and get back:
    - AI response text
    - Extracted property data (address, price, etc.)
    - Action suggestion (submit, help, none)
    """
    try:
        result = await chat_with_property_ai(
            request.message, 
            request.conversation_history
        )
        return ChatResponse(
            response=result.get("response", ""),
            extractedData=result.get("extractedData", {}),
            action=result.get("action", "none")
        )
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/chat/document")
async def process_document_endpoint(file_content: str, file_type: str = "pdf"):
    """
    Process a property document with Kimi AI
    
    Extracts property information from PDF/text content
    """
    try:
        result = await process_property_document(file_content, file_type)
        return result
    except Exception as e:
        logger.error(f"Document processing error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    
    try:
        while True:
            # Receive messages from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            msg_type = message.get('type')
            
            if msg_type == 'subscribe':
                channels = message.get('channels', [])
                manager.subscribe(websocket, channels)
                await websocket.send_json({
                    'type': 'subscribed',
                    'channels': channels
                })
            
            elif msg_type == 'agent:start':
                agent_id = message.get('agentId')
                await agent_supervisor.start_agent(agent_id)
            
            elif msg_type == 'agent:stop':
                agent_id = message.get('agentId')
                await agent_supervisor.stop_agent(agent_id)
            
            elif msg_type == 'agent:pause':
                agent_id = message.get('agentId')
                await agent_supervisor.pause_agent(agent_id)
            
            elif msg_type == 'mission:create':
                mission_data = message.get('data', {})
                mission_id = await mission_controller.create_mission(mission_data)
                await websocket.send_json({
                    'type': 'mission:created',
                    'missionId': mission_id
                })
            
            elif msg_type == 'agent:send':
                # Frontend wants to send a structured message on the agent bus
                if agent_bus:
                    bus_msg = AgentMessage(
                        payload=message.get('payload', {}),
                        from_agent=message.get('from', 'user'),
                        to_agent=message.get('to'),
                        topic=message.get('topic'),
                        message_type=message.get('msgType', 'chat'),
                        correlation_id=message.get('correlationId'),
                        conversation_id=message.get('conversationId'),
                        task_id=message.get('taskId'),
                        priority=message.get('priority', 'normal'),
                        status=message.get('status', 'pending'),
                        artifact_ref=message.get('artifactRef'),
                        requires_approval=message.get('requiresApproval', False),
                        deal_id=message.get('dealId'),
                    )
                    await agent_bus.publish(bus_msg)
                    await websocket.send_json({'type': 'agent:send:ack', 'messageId': bus_msg.id})

            elif msg_type == 'agent:subscribe':
                if agent_bus:
                    agent_id = message.get('agentId', 'user')
                    topic = message.get('topic', 'broadcast')
                    await agent_bus.subscribe(agent_id, topic)
                    await websocket.send_json({'type': 'agent:subscribed', 'topic': topic})

            elif msg_type == 'agent:unsubscribe':
                if agent_bus:
                    agent_id = message.get('agentId', 'user')
                    topic = message.get('topic', 'broadcast')
                    await agent_bus.unsubscribe(agent_id, topic)
                    await websocket.send_json({'type': 'agent:unsubscribed', 'topic': topic})

            elif msg_type == 'orchestrate:plan':
                if agent_orchestrator:
                    plan = await agent_orchestrator.plan(message.get('goal', ''), message.get('context'))
                    await websocket.send_json({'type': 'orchestrate:plan', 'plan': plan})

            elif msg_type == 'orchestrate:run':
                if agent_orchestrator:
                    plan = await agent_orchestrator.plan(message.get('goal', ''), message.get('context'))
                    run_id = f"ORCH-WS-{datetime.now().strftime('%Y%m%d-%H%M%S')}-{uuid.uuid4().hex[:6]}"
                    asyncio.create_task(agent_orchestrator.execute(run_id, plan))
                    await websocket.send_json({'type': 'orchestrate:run:started', 'runId': run_id, 'summary': plan.get('summary', '')})

            elif msg_type == 'ping':
                await websocket.send_json({'type': 'pong'})
    
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3090)
