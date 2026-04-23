"""
Agent Orchestrator for BigDataClaw NERVE
Uses Kimi (Moonshot AI) to coordinate multi-agent workflows.

MISSION CONTROL v2 — Task-based orchestration
Start with 4 core agents:
  1. Coordinator  — receives user intent, routes tasks, decides next step
  2. Researcher   — finds buyers / lenders / signals, enriches data
  3. Writer       — generates teaser / DM / follow-up
  4. Closer       — suggests next action, monitors deal stage / follow-up timing

Instead of free-form chat, the orchestrator passes structured TASK packets
with payload, priority, artifactRef, and requiresApproval flags.
"""

import json
import asyncio
from typing import Dict, List, Optional
from datetime import datetime, timezone

from agent_comm_bus import AgentCommunicationBus, AgentMessage, get_bus

try:
    from kimi_service import chat_with_kimi
    KIMI_AVAILABLE = True
except Exception:
    KIMI_AVAILABLE = False

try:
    from local_llm_service import chat_with_local_llm
    LOCAL_AVAILABLE = True
except Exception:
    LOCAL_AVAILABLE = False


# ---------------------------------------------------------------------------
# Core agent registry (Mission Control v2)
# ---------------------------------------------------------------------------

CORE_AGENTS = {
    "coordinator": {
        "name": "Coordinator",
        "role": "Orchestrator",
        "capabilities": ["intent_parsing", "task_routing", "flow_control", "synthesis"],
        "description": "Receives user intent, routes tasks, decides next step.",
    },
    "researcher": {
        "name": "Researcher",
        "role": "Information Gatherer",
        "capabilities": ["buyer_search", "lender_search", "hot_money", "market_scan", "enrichment"],
        "description": "Finds buyers, lenders, signals. Enriches data.",
    },
    "writer": {
        "name": "Writer",
        "role": "Content Creator",
        "capabilities": ["teaser_draft", "follow_up", "deal_memo", "markdown_export", "summary"],
        "description": "Generates teaser, DMs, follow-ups, deal memos.",
    },
    "closer": {
        "name": "Closer",
        "role": "Deal Advancer",
        "capabilities": ["next_action", "stage_monitor", "timing", "approval_request"],
        "description": "Suggests next action. Monitors deal stage and follow-up timing.",
    },
}

# Mapping from core roles to existing pixel agents (for UI alignment)
ROLE_TO_PIXEL = {
    "coordinator": "kimi",
    "researcher": "kimi",   # kimi has db_lookup + search
    "writer": "scribe",
    "closer": "spark",      # spark does strategy + optimization
}


ORCHESTRATOR_SYSTEM_PROMPT = """You are the Coordinator for BigDataClaw NERVE Mission Control.
Your job is to break a user goal into sub-tasks and assign each sub-task to the best core agent.

Available core agents:
- coordinator: Orchestrator — intent_parsing, task_routing, flow_control, synthesis
- researcher: Information Gatherer — buyer_search, lender_search, hot_money, market_scan, enrichment
- writer: Content Creator — teaser_draft, follow_up, deal_memo, markdown_export, summary
- closer: Deal Advancer — next_action, stage_monitor, timing, approval_request

Rules:
1. Return ONLY a JSON object. No markdown fences, no commentary.
2. The JSON must have this shape:
{
  "plan": [
    {
      "step": 1,
      "agent": "agent_id",
      "task": "clear instruction for the agent",
      "task_type": "research|write|validate|action",
      "depends_on": [],
      "expected_output": "what the agent should return",
      "priority": "normal|high|urgent",
      "requires_approval": false,
      "artifact_ref": "optional_reference"
    }
  ],
  "summary": "one-sentence summary of the overall plan",
  "deal_context": {
    "assetType": "...",
    "city": "...",
    "size": "...",
    "price_range": "..."
  }
}
3. Use "depends_on" when a step needs output from a previous step (list of step numbers).
4. Keep plans to 1-5 steps. Be concise.
5. If the goal is simple, assign it to a single agent.
6. For research tasks, start with researcher, then writer, then closer.
7. Tag any step that produces client-facing output with requires_approval: true.
"""


SYNTHESIS_SYSTEM_PROMPT = """You are the Coordinator synthesis engine for Mission Control.
You have received results from multiple specialist agents. Synthesize them into a single,
clear, actionable response for the user.

Rules:
1. Be concise but thorough.
2. Cite specific data points from agent results.
3. Flag any conflicts or uncertainties.
4. Suggest next steps.
5. If any step required approval, mark the output as "awaiting_approval".
6. Return plain text (not JSON) unless the user asked for structured output.
"""


# ---------------------------------------------------------------------------
# Orchestrator
# ---------------------------------------------------------------------------

class AgentOrchestrator:
    """
    Coordinates multi-agent workflows using an LLM planner.
    Passes structured TASK packets, not chat strings.
    """

    def __init__(self, bus: Optional[AgentCommunicationBus] = None):
        self.bus = bus or get_bus()
        self._active_runs: Dict[str, dict] = {}
        self._results: Dict[str, dict] = {}

    # ------------------------------------------------------------------
    # Planning
    # ------------------------------------------------------------------

    async def plan(self, goal: str, context: Optional[str] = None, deal_context: Optional[dict] = None) -> dict:
        """Ask Kimi (or local LLM) to create an execution plan."""
        prompt = f"User goal: {goal}\n"
        if context:
            prompt += f"Additional context: {context}\n"
        if deal_context:
            prompt += f"Deal context: {json.dumps(deal_context)}\n"
        prompt += "\nCreate the execution plan JSON now."

        plan_json = None
        error = None

        if KIMI_AVAILABLE:
            try:
                result = await chat_with_kimi(prompt, conversation_history=[{"role": "system", "content": ORCHESTRATOR_SYSTEM_PROMPT}])
                plan_json = self._extract_json(result.get("response", ""))
            except Exception as e:
                error = str(e)
                print(f"[Orchestrator] Kimi planning failed: {e}")

        if plan_json is None and LOCAL_AVAILABLE:
            try:
                result = await chat_with_local_llm(prompt, conversation_history=[{"role": "system", "content": ORCHESTRATOR_SYSTEM_PROMPT}])
                plan_json = self._extract_json(result.get("response", ""))
            except Exception as e:
                error = str(e)
                print(f"[Orchestrator] Local LLM planning failed: {e}")

        if plan_json is None:
            plan_json = self._fallback_plan(goal, deal_context)

        return {
            "goal": goal,
            "plan": plan_json.get("plan", []),
            "summary": plan_json.get("summary", "Fallback plan."),
            "deal_context": plan_json.get("deal_context", deal_context or {}),
            "error": error,
        }

    # ------------------------------------------------------------------
    # Execution
    # ------------------------------------------------------------------

    async def execute(self, run_id: str, plan: dict) -> dict:
        """
        Execute a plan by dispatching structured TASK messages to agents via the bus.
        Waits for all agents to report back, then synthesizes.
        """
        self._active_runs[run_id] = {
            "status": "running",
            "started_at": datetime.now(timezone.utc).isoformat(),
            "completed_steps": 0,
            "total_steps": len(plan.get("plan", [])),
            "results": {},
            "artifacts": [],
            "awaiting_approval": [],
        }

        steps = plan.get("plan", [])
        execution_order = self._topo_sort(steps)
        conversation_id = run_id

        for step_num in execution_order:
            step = next((s for s in steps if s["step"] == step_num), None)
            if not step:
                continue

            agent_id = step["agent"]
            task = step["task"]
            task_type = step.get("task_type", "task")
            priority = step.get("priority", "normal")
            requires_approval = step.get("requires_approval", False)
            artifact_ref = step.get("artifact_ref")
            correlation = f"{run_id}:{step_num}"

            # Build structured payload with dependency outputs
            payload = {
                "task": task,
                "task_type": task_type,
                "step": step_num,
                "run_id": run_id,
                "expected_output": step.get("expected_output", ""),
            }
            deps = step.get("depends_on", [])
            if deps:
                payload["inputs"] = {
                    f"step_{d}": self._results.get(run_id, {}).get(f"step_{d}")
                    for d in deps
                }

            # Dispatch structured TASK packet
            await self.bus.send_direct(
                from_agent="coordinator",
                to_agent=agent_id,
                payload=payload,
                message_type="task",
                priority=priority,
                task_id=correlation,
                conversation_id=conversation_id,
                artifact_ref=artifact_ref,
                requires_approval=requires_approval,
                correlation_id=correlation,
            )

            # Wait for result (with timeout)
            result = await self._await_result(run_id, step_num, timeout=90.0)

            if run_id not in self._results:
                self._results[run_id] = {}
            self._results[run_id][f"step_{step_num}"] = result

            if artifact_ref and result.get("result", {}).get("artifact"):
                self._active_runs[run_id]["artifacts"].append({
                    "ref": artifact_ref,
                    "step": step_num,
                    "agent": agent_id,
                    "content": result["result"]["artifact"],
                })

            if requires_approval:
                self._active_runs[run_id]["awaiting_approval"].append({
                    "step": step_num,
                    "agent": agent_id,
                    "artifact_ref": artifact_ref,
                })

            self._active_runs[run_id]["completed_steps"] += 1

        # Synthesize
        final = await self._synthesize(run_id, plan.get("goal", ""), self._results.get(run_id, {}))
        self._active_runs[run_id]["status"] = "completed"
        self._active_runs[run_id]["final_answer"] = final

        # Broadcast completion
        await self.bus.broadcast(
            from_agent="coordinator",
            payload={
                "run_id": run_id,
                "status": "completed",
                "summary": plan.get("summary", ""),
                "artifacts": self._active_runs[run_id]["artifacts"],
                "awaiting_approval": len(self._active_runs[run_id]["awaiting_approval"]) > 0,
            },
            topic="orchestrator.completed",
            message_type="status",
        )

        return self._active_runs[run_id]

    async def submit_result(self, run_id: str, step: int, agent_id: str, result_payload: dict):
        """Called by agents (or their handlers) to report task completion."""
        key = f"{run_id}:{step}"
        if run_id not in self._results:
            self._results[run_id] = {}
        self._results[run_id][f"step_{step}"] = {
            "agent": agent_id,
            "result": result_payload,
            "submitted_at": datetime.now(timezone.utc).isoformat(),
        }

    def get_run_status(self, run_id: str) -> Optional[dict]:
        return self._active_runs.get(run_id)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _extract_json(self, text: str) -> dict:
        """Extract JSON from an LLM response, stripping markdown fences."""
        text = text.strip()
        if text.startswith("```"):
            lines = text.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            text = "\n".join(lines)
        try:
            return json.loads(text.strip())
        except json.JSONDecodeError:
            start = text.find("{")
            end = text.rfind("}")
            if start != -1 and end != -1:
                return json.loads(text[start:end+1])
            raise

    def _fallback_plan(self, goal: str, deal_context: Optional[dict] = None) -> dict:
        """Simple rule-based planner when LLM is unavailable."""
        lower = goal.lower()
        steps = []
        ctx = deal_context or {}

        if any(w in lower for w in ["buyer", "lender", "research", "find", "search", "who"]):
            steps.append({
                "step": 1, "agent": "researcher",
                "task": f"Research: {goal}",
                "task_type": "research",
                "depends_on": [],
                "expected_output": "Structured research results with citations",
                "priority": "high", "requires_approval": False,
            })
            steps.append({
                "step": 2, "agent": "writer",
                "task": f"Draft outreach/teaser from research for: {goal}",
                "task_type": "write",
                "depends_on": [1],
                "expected_output": "Draft teaser or outreach message",
                "priority": "normal", "requires_approval": True,
            })
            steps.append({
                "step": 3, "agent": "closer",
                "task": "Recommend next actions and timing for outreach",
                "task_type": "action",
                "depends_on": [2],
                "expected_output": "Next-step recommendations",
                "priority": "normal", "requires_approval": False,
            })
        elif any(w in lower for w in ["write", "draft", "teaser", "memo", "summary"]):
            steps.append({
                "step": 1, "agent": "writer",
                "task": goal,
                "task_type": "write",
                "depends_on": [],
                "expected_output": "Written draft",
                "priority": "normal", "requires_approval": True,
            })
        elif any(w in lower for w in ["next step", "follow up", "closer", "advance"]):
            steps.append({
                "step": 1, "agent": "closer",
                "task": goal,
                "task_type": "action",
                "depends_on": [],
                "expected_output": "Action recommendations",
                "priority": "high", "requires_approval": False,
            })
        else:
            steps.append({
                "step": 1, "agent": "researcher",
                "task": goal,
                "task_type": "research",
                "depends_on": [],
                "expected_output": "Research results",
                "priority": "normal", "requires_approval": False,
            })

        return {
            "plan": steps,
            "summary": "Fallback rule-based plan.",
            "deal_context": ctx,
        }

    def _topo_sort(self, steps: List[dict]) -> List[int]:
        """Topological sort of steps by depends_on."""
        graph = {s["step"]: s.get("depends_on", []) for s in steps}
        visited = set()
        order = []

        def visit(n):
            if n in visited:
                return
            visited.add(n)
            for dep in graph.get(n, []):
                visit(dep)
            order.append(n)

        for s in steps:
            visit(s["step"])
        return order

    async def _await_result(self, run_id: str, step: int, timeout: float = 90.0) -> dict:
        """Poll for agent result with timeout."""
        deadline = asyncio.get_event_loop().time() + timeout
        key = f"step_{step}"
        while asyncio.get_event_loop().time() < deadline:
            if run_id in self._results and key in self._results[run_id]:
                return self._results[run_id][key]
            await asyncio.sleep(0.5)
        return {"error": "timeout", "agent": "unknown", "result": None}

    async def _synthesize(self, run_id: str, goal: str, results: dict) -> str:
        """Use LLM to synthesize agent outputs into a final answer."""
        context = f"Goal: {goal}\n\nAgent results:\n"
        for step_key, res in results.items():
            agent = res.get("agent", "unknown")
            result_data = res.get("result", {})
            context += f"- {step_key} (agent={agent}): {json.dumps(result_data, ensure_ascii=False)}\n"

        if KIMI_AVAILABLE:
            try:
                resp = await chat_with_kimi(
                    context,
                    conversation_history=[{"role": "system", "content": SYNTHESIS_SYSTEM_PROMPT}]
                )
                return resp.get("response", "Synthesis completed.")
            except Exception as e:
                print(f"[Orchestrator] Synthesis failed: {e}")

        # Fallback synthesis
        parts = [f"## Result for: {goal}\n"]
        for step_key, res in results.items():
            parts.append(f"**{step_key}** ({res.get('agent', 'unknown')}): {json.dumps(res.get('result', {}))}")
        return "\n\n".join(parts)


# ---------------------------------------------------------------------------
# Singleton accessor
# ---------------------------------------------------------------------------

_orchestrator: Optional[AgentOrchestrator] = None

def get_orchestrator() -> AgentOrchestrator:
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = AgentOrchestrator()
    return _orchestrator
