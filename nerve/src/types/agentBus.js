/**
 * Agent Bus Message Schema — Mission Control v2
 *
 * Every message on the bus is a structured TASK packet, not plain chat.
 * This enables deal flow, outreach, approvals, and artifact handoffs.
 */

/**
 * @typedef {string} AgentID
 * Values: 'coordinator' | 'researcher' | 'writer' | 'closer' |
 *         'kimi' | 'concierge' | 'scout' | 'scribe' | 'skeptic' | 'spark' | 'pablo'
 */

/**
 * @typedef {string} MessageType
 * 'chat'      — informal agent→agent or user→agent message
 * 'task'      — structured work assignment
 * 'response'  — result of a task
 * 'status'    — agent state update
 * 'artifact'  — deliverable reference (feature sheet, teaser, memo)
 * 'error'     — failure report
 * 'broadcast' — fan-out to all subscribers
 * 'system'    — internal bus event
 */

/**
 * @typedef {string} Priority
 * 'low' | 'normal' | 'high' | 'urgent'
 */

/**
 * @typedef {string} TaskStatus
 * 'pending'  — waiting to start
 * 'active'   — in progress
 * 'completed'— done
 * 'failed'   — error
 * 'blocked'  — waiting on dependency
 * 'awaiting_approval' — needs human sign-off
 */

/**
 * @typedef {Object} AgentMessage
 * @property {string} id               — UUID of the message
 * @property {AgentID} from            — sender agent id
 * @property {AgentID} [to]            — recipient (omit for broadcast/topic)
 * @property {string} [topic]          — pub/sub topic e.g. 'mission.123', 'deals'
 * @property {MessageType} type        — message category
 * @property {Object} payload          — task-specific data
 * @property {string} correlationId    — groups related messages
 * @property {string} conversationId   — groups a full conversation/run
 * @property {string} [taskId]         — specific task identifier
 * @property {Priority} priority       — delivery priority
 * @property {TaskStatus} status       — execution status
 * @property {string} [artifactRef]    — reference to a deliverable
 * @property {boolean} requiresApproval— true if human must approve before send
 * @property {string} [dealId]         — associated deal context
 * @property {string} timestamp        — ISO 8601
 */

/**
 * @typedef {Object} TaskPayload
 * @property {string} task             — human-readable instruction
 * @property {string} [task_type]      — 'research' | 'write' | 'validate' | 'action'
 * @property {number} [step]           — step number in a plan
 * @property {string} [run_id]         — orchestrator run id
 * @property {string} [expected_output]— what the agent should return
 * @property {Object} [inputs]         — outputs from dependency steps
 * @property {Object} [deal_context]   — { assetType, city, size, price_range }
 */

/**
 * @typedef {Object} AgentDefinition
 * @property {AgentID} id
 * @property {string} name
 * @property {string} role
 * @property {string[]} capabilities
 * @property {string} description
 */

/** Core 4-agent registry for Mission Control v2 */
export const CORE_AGENTS = {
  coordinator: {
    id: 'coordinator',
    name: 'Coordinator',
    role: 'Orchestrator',
    capabilities: ['intent_parsing', 'task_routing', 'flow_control', 'synthesis'],
    description: 'Receives user intent, routes tasks, decides next step.',
    color: '#6366f1',
  },
  researcher: {
    id: 'researcher',
    name: 'Researcher',
    role: 'Information Gatherer',
    capabilities: ['buyer_search', 'lender_search', 'hot_money', 'market_scan', 'enrichment'],
    description: 'Finds buyers, lenders, signals. Enriches data.',
    color: '#10b981',
  },
  writer: {
    id: 'writer',
    name: 'Writer',
    role: 'Content Creator',
    capabilities: ['teaser_draft', 'follow_up', 'deal_memo', 'markdown_export', 'summary'],
    description: 'Generates teaser, DMs, follow-ups, deal memos.',
    color: '#f59e0b',
  },
  closer: {
    id: 'closer',
    name: 'Closer',
    role: 'Deal Advancer',
    capabilities: ['next_action', 'stage_monitor', 'timing', 'approval_request'],
    description: 'Suggests next action. Monitors deal stage and follow-up timing.',
    color: '#ef4444',
  },
}

/** Map core roles to existing pixel agents for UI rendering */
export const ROLE_TO_PIXEL = {
  coordinator: 'kimi',
  researcher: 'kimi',
  writer: 'scribe',
  closer: 'spark',
}

/** Quick-start flow definition */
export const FIRST_WORKING_FLOW = {
  name: 'Buyer Research → Outreach Draft',
  trigger: 'Find buyers for this industrial requirement',
  steps: [
    { from: 'user', to: 'coordinator', type: 'task', payload: { task: 'Find buyers for this industrial requirement' } },
    { from: 'coordinator', to: 'researcher', type: 'task', payload: { task: 'buyer_research', deal_context: { assetType: 'industrial' } } },
    { from: 'researcher', to: 'coordinator', type: 'response', payload: { results: [] } },
    { from: 'coordinator', to: 'writer', type: 'task', payload: { task: 'Draft outreach from research results' } },
    { from: 'writer', to: 'coordinator', type: 'artifact', payload: { artifact: 'teaser_draft_v1' } },
    { from: 'coordinator', to: 'user', type: 'status', payload: { status: 'awaiting_approval', artifactRef: 'teaser_draft_v1' } },
  ],
}

/**
 * Build a structured agent message object.
 * @param {Object} params
 * @returns {AgentMessage}
 */
export function buildAgentMessage({
  from,
  to,
  topic,
  type = 'chat',
  payload = {},
  correlationId,
  conversationId,
  taskId,
  priority = 'normal',
  status = 'pending',
  artifactRef,
  requiresApproval = false,
  dealId,
}) {
  return {
    id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    from,
    to,
    topic,
    type,
    payload,
    correlationId: correlationId || undefined,
    conversationId: conversationId || undefined,
    taskId: taskId || undefined,
    priority,
    status,
    artifactRef: artifactRef || undefined,
    requiresApproval,
    dealId: dealId || undefined,
    timestamp: new Date().toISOString(),
  }
}
