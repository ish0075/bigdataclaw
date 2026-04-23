"""
Agent Communication Bus for BigDataClaw NERVE
Pub/sub + direct messaging layer for inter-agent coordination.

Agents publish structured TASK packets (not just chat) so the system
can execute deal flow, outreach, approvals, and artifact handoffs.
"""

import asyncio
import json
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional, Set, Callable, Awaitable
from collections import defaultdict, deque

# ---------------------------------------------------------------------------
# Message schema — structured task packets
# ---------------------------------------------------------------------------

class AgentMessage:
    """
    Standard envelope for all inter-agent traffic.

    Designed for MISSION CONTROL — not just chat.
    Supports task routing, artifact references, approvals, and deal context.
    """

    def __init__(
        self,
        payload: dict,
        *,
        from_agent: str,
        to_agent: Optional[str] = None,
        topic: Optional[str] = None,
        message_type: str = "chat",          # chat | task | response | status | artifact | error | broadcast | system
        correlation_id: Optional[str] = None,
        conversation_id: Optional[str] = None,
        task_id: Optional[str] = None,
        priority: str = "normal",            # low | normal | high | urgent
        status: str = "pending",             # pending | active | completed | failed | blocked | awaiting_approval
        artifact_ref: Optional[str] = None,  # e.g. "feature_sheet:deal_123"
        requires_approval: bool = False,
        deal_id: Optional[str] = None,
    ):
        self.id = str(uuid.uuid4())
        self.from_agent = from_agent
        self.to_agent = to_agent            # None → broadcast / topic
        self.topic = topic                  # e.g. "mission.123", "hotmoney", "deals"
        self.message_type = message_type
        self.payload = payload
        self.correlation_id = correlation_id or self.id
        self.conversation_id = conversation_id or self.id
        self.task_id = task_id
        self.priority = priority
        self.status = status
        self.artifact_ref = artifact_ref
        self.requires_approval = requires_approval
        self.deal_id = deal_id
        self.timestamp = datetime.now(timezone.utc).isoformat()

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "from": self.from_agent,
            "to": self.to_agent,
            "topic": self.topic,
            "type": self.message_type,
            "payload": self.payload,
            "correlationId": self.correlation_id,
            "conversationId": self.conversation_id,
            "taskId": self.task_id,
            "priority": self.priority,
            "status": self.status,
            "artifactRef": self.artifact_ref,
            "requiresApproval": self.requires_approval,
            "dealId": self.deal_id,
            "timestamp": self.timestamp,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "AgentMessage":
        m = cls(
            payload=data.get("payload", {}),
            from_agent=data["from"],
            to_agent=data.get("to"),
            topic=data.get("topic"),
            message_type=data.get("type", "chat"),
            correlation_id=data.get("correlationId"),
            conversation_id=data.get("conversationId"),
            task_id=data.get("taskId"),
            priority=data.get("priority", "normal"),
            status=data.get("status", "pending"),
            artifact_ref=data.get("artifactRef"),
            requires_approval=data.get("requiresApproval", False),
            deal_id=data.get("dealId"),
        )
        m.id = data.get("id", m.id)
        m.timestamp = data.get("timestamp", m.timestamp)
        return m


# ---------------------------------------------------------------------------
# In-memory bus
# ---------------------------------------------------------------------------

class AgentCommunicationBus:
    """
    Lightweight in-memory message bus for the NERVE agent fleet.

    Features:
    • Per-agent inboxes (capped at 100 messages)
    • Topic pub/sub (any agent can subscribe to a topic)
    • Direct agent→agent messaging
    • Async handlers for backend agents (callables registered per agent)
    • WebSocket bridge callbacks for frontend push
    • Priority-based delivery tracking
    """

    INBOX_CAP = 100

    def __init__(self):
        # topic → set of agent ids
        self._topic_subscribers: Dict[str, Set[str]] = defaultdict(set)
        # agent_id → deque of messages
        self._inboxes: Dict[str, deque] = defaultdict(lambda: deque(maxlen=self.INBOX_CAP))
        # agent_id → async handler callable(message)
        self._handlers: Dict[str, Callable[[AgentMessage], Awaitable[None]]] = {}
        # WebSocket bridge → list of async callbacks(message)
        self._ws_bridges: List[Callable[[AgentMessage], Awaitable[None]]] = []
        # Statistics
        self._stats: Dict[str, int] = defaultdict(int)
        self._lock = asyncio.Lock()

    # ------------------------------------------------------------------
    # Registration
    # ------------------------------------------------------------------

    def register_handler(self, agent_id: str, handler: Callable[[AgentMessage], Awaitable[None]]):
        """Register a backend handler for an agent."""
        self._handlers[agent_id] = handler

    def unregister_handler(self, agent_id: str):
        self._handlers.pop(agent_id, None)

    def add_ws_bridge(self, callback: Callable[[AgentMessage], Awaitable[None]]):
        """Add a frontend/WebSocket bridge callback."""
        self._ws_bridges.append(callback)

    def remove_ws_bridge(self, callback: Callable[[AgentMessage], Awaitable[None]]):
        if callback in self._ws_bridges:
            self._ws_bridges.remove(callback)

    # ------------------------------------------------------------------
    # Pub/sub
    # ------------------------------------------------------------------

    async def subscribe(self, agent_id: str, topic: str):
        async with self._lock:
            self._topic_subscribers[topic].add(agent_id)

    async def unsubscribe(self, agent_id: str, topic: str):
        async with self._lock:
            self._topic_subscribers[topic].discard(agent_id)

    # ------------------------------------------------------------------
    # Publishing
    # ------------------------------------------------------------------

    async def publish(self, message: AgentMessage):
        """Publish a message to topic subscribers, direct inbox, and WebSocket bridges."""
        async with self._lock:
            self._stats["messages_total"] += 1
            self._stats[f"type_{message.message_type}"] += 1

            # 1. Direct delivery (to_agent)
            if message.to_agent:
                self._inboxes[message.to_agent].append(message.to_dict())
                self._stats["direct_messages"] += 1
                handler = self._handlers.get(message.to_agent)
                if handler:
                    asyncio.create_task(self._safe_handler(handler, message))

            # 2. Topic delivery
            if message.topic:
                subs = list(self._topic_subscribers.get(message.topic, set()))
                for sub_id in subs:
                    if sub_id == message.from_agent:
                        continue
                    self._inboxes[sub_id].append(message.to_dict())
                    handler = self._handlers.get(sub_id)
                    if handler:
                        asyncio.create_task(self._safe_handler(handler, message))
                self._stats["topic_messages"] += 1

            # 3. WebSocket bridges (frontend push)
            for bridge in list(self._ws_bridges):
                asyncio.create_task(self._safe_bridge(bridge, message))

    async def send_direct(
        self,
        from_agent: str,
        to_agent: str,
        payload: dict,
        *,
        message_type: str = "chat",
        priority: str = "normal",
        task_id: Optional[str] = None,
        deal_id: Optional[str] = None,
        artifact_ref: Optional[str] = None,
        requires_approval: bool = False,
        correlation_id: Optional[str] = None,
    ) -> AgentMessage:
        """Convenience: send a direct message."""
        msg = AgentMessage(
            payload,
            from_agent=from_agent,
            to_agent=to_agent,
            message_type=message_type,
            priority=priority,
            task_id=task_id,
            deal_id=deal_id,
            artifact_ref=artifact_ref,
            requires_approval=requires_approval,
            correlation_id=correlation_id,
        )
        await self.publish(msg)
        return msg

    async def broadcast(
        self,
        from_agent: str,
        payload: dict,
        *,
        topic: str = "broadcast",
        message_type: str = "broadcast",
        priority: str = "normal",
        correlation_id: Optional[str] = None,
    ) -> AgentMessage:
        """Convenience: broadcast to all subscribers on a topic."""
        msg = AgentMessage(
            payload,
            from_agent=from_agent,
            topic=topic,
            message_type=message_type,
            priority=priority,
            correlation_id=correlation_id,
        )
        await self.publish(msg)
        return msg

    # ------------------------------------------------------------------
    # Inbox API
    # ------------------------------------------------------------------

    def get_inbox(self, agent_id: str, filters: Optional[dict] = None) -> List[dict]:
        """Return inbox messages for an agent (newest first). Optional filters: status, type, unread_only."""
        inbox = list(self._inboxes.get(agent_id, deque()))
        if filters:
            if filters.get("unread_only"):
                inbox = [m for m in inbox if not m.get("read")]
            if filters.get("status"):
                inbox = [m for m in inbox if m.get("status") == filters["status"]]
            if filters.get("type"):
                inbox = [m for m in inbox if m.get("type") == filters["type"]]
        return list(reversed(inbox))

    def mark_read(self, agent_id: str, message_id: str):
        for m in self._inboxes.get(agent_id, deque()):
            if m.get("id") == message_id:
                m["read"] = True
                break

    def clear_inbox(self, agent_id: str):
        self._inboxes[agent_id].clear()

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    async def _safe_handler(self, handler, message: AgentMessage):
        try:
            await handler(message)
        except Exception as e:
            print(f"[AgentBus] Handler error for {message.to_agent}: {e}")

    async def _safe_bridge(self, bridge, message: AgentMessage):
        try:
            await bridge(message)
        except Exception as e:
            print(f"[AgentBus] Bridge error: {e}")

    def get_stats(self) -> dict:
        return dict(self._stats)


# ---------------------------------------------------------------------------
# Singleton accessor
# ---------------------------------------------------------------------------

_bus: Optional[AgentCommunicationBus] = None

def get_bus() -> AgentCommunicationBus:
    global _bus
    if _bus is None:
        _bus = AgentCommunicationBus()
    return _bus
