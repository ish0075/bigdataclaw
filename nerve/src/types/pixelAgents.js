/**
 * Pixel Agent shared schema and constants
 * Maps 6 pixel characters (char_0..char_5) to functional agent roles
 */

export const PIXEL_AGENT_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  BUSY: 'busy',
  ERROR: 'error',
}

export const PIXEL_AGENT_PERSONA = {
  CONCIERGE: 'concierge',
  ANALYST: 'analyst',
}

export const DEFAULT_PIXEL_AGENTS = [
  {
    id: 'kimi',
    name: 'Kimi',
    role: 'Analyst',
    description: 'Database-aware CRE research agent. Queries hot money, buyers, lenders, transactions, and the vault.',
    status: 'online',
    mode: 'analyst',
    capabilities: ['chat', 'db_lookup', 'deal_analysis', 'hot_money', 'buyer_search', 'lender_search', 'transaction_search', 'vault_search'],
    sprite: '/pablo-assets/characters/frames/char_0_avatar.png',
    color: '#8b5cf6',
  },
  {
    id: 'concierge',
    name: 'Concierge',
    role: 'Website Guide',
    description: 'Handles public questions, site navigation, and lead intake. Lightweight, no tools.',
    status: 'online',
    mode: 'concierge',
    capabilities: ['chat', 'faq', 'booking', 'navigation_help'],
    sprite: '/pablo-assets/characters/frames/char_1_avatar.png',
    color: '#10b981',
  },
  {
    id: 'scout',
    name: 'Scout',
    role: 'Researcher',
    description: 'Searches markets, filters opportunities, and maintains watchlists.',
    status: 'online',
    mode: 'analyst',
    capabilities: ['chat', 'market_search', 'filter', 'watchlist', 'alert'],
    sprite: '/pablo-assets/characters/frames/char_2_avatar.png',
    color: '#f59e0b',
  },
  {
    id: 'scribe',
    name: 'Scribe',
    role: 'Report Writer',
    description: 'Generates markdown exports, deal memos, and summaries.',
    status: 'online',
    mode: 'analyst',
    capabilities: ['chat', 'markdown_export', 'deal_memo', 'summary', 'pdf'],
    sprite: '/pablo-assets/characters/frames/char_3_avatar.png',
    color: '#06b6d4',
  },
  {
    id: 'skeptic',
    name: 'Skeptic',
    role: 'Fact Checker',
    description: 'Validates claims, verifies sources, and flags inconsistencies.',
    status: 'online',
    mode: 'analyst',
    capabilities: ['chat', 'validation', 'source_check', 'flagging'],
    sprite: '/pablo-assets/characters/frames/char_4_avatar.png',
    color: '#ef4444',
  },
  {
    id: 'spark',
    name: 'Spark',
    role: 'Ideator',
    description: 'Generates improvements, optimizations, and strategic ideas.',
    status: 'online',
    mode: 'concierge',
    capabilities: ['chat', 'brainstorm', 'optimization', 'strategy'],
    sprite: '/pablo-assets/characters/frames/char_5_avatar.png',
    color: '#ec4899',
  },
  {
    id: 'pablo',
    name: 'Pablo',
    role: 'Context Keeper',
    description: 'Saves every insight, feature sheet, and teaser email to ContextKeep. Your persistent memory archivist.',
    status: 'online',
    mode: 'analyst',
    capabilities: ['chat', 'context_keep_write', 'context_keep_read', 'memory_archivist', 'feature_sheet_archive', 'teaser_archive'],
    sprite: '/pablo-assets/characters/frames/char_0_avatar.png',
    color: '#f97316',
  },
]

export const AGENT_QUICK_PROMPTS = {
  kimi: [
    'Find hot money leads in Toronto',
    'Who are the top buyers for industrial?',
    'Show me recent transactions over $10M',
  ],
  concierge: [
    'What can I do on this site?',
    'How do I search for buyers?',
    'Show me the dashboard',
  ],
  scout: [
    'What markets are heating up?',
    'Find opportunities in Hamilton',
    'Set a watchlist for retail deals',
  ],
  scribe: [
    'Write a deal memo for this property',
    'Summarize the hot money report',
    'Export buyer matches to markdown',
  ],
  skeptic: [
    'Verify this listing description',
    'Check if this buyer is legitimate',
    'Flag any suspicious transactions',
  ],
  spark: [
    'How can I improve my outreach?',
    'Give me 5 new lead gen ideas',
    'Optimize my buyer matching strategy',
  ],
  pablo: [
    'Save this feature sheet to ContextKeep',
    'Show me my recent context keeps',
    'Archive this buyer intelligence report',
  ],
}

export function getStatusColor(status) {
  switch (status) {
    case PIXEL_AGENT_STATUS.ONLINE:
      return 'bg-green-500'
    case PIXEL_AGENT_STATUS.BUSY:
      return 'bg-yellow-500'
    case PIXEL_AGENT_STATUS.ERROR:
      return 'bg-red-500'
    case PIXEL_AGENT_STATUS.OFFLINE:
    default:
      return 'bg-gray-500'
  }
}

export function getStatusDotColor(status) {
  switch (status) {
    case PIXEL_AGENT_STATUS.ONLINE:
      return '#10b981'
    case PIXEL_AGENT_STATUS.BUSY:
      return '#f59e0b'
    case PIXEL_AGENT_STATUS.ERROR:
      return '#ef4444'
    case PIXEL_AGENT_STATUS.OFFLINE:
    default:
      return '#6b7280'
  }
}
